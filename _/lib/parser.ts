/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
// parser.ts — Advanced syntax analyzer that converts tokens
//             into AST with customizable grammar rules and intelligent error detection.
//
// repo   : https://github.com/je-es/parser
// author : https://github.com/maysara-elshewehy
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    export interface Token {
        kind            : string;
        value           : string | null;
        span            : Span;
    }

    export interface Span {
        start           : number;
        end             : number;
    }

    export interface Pattern {
        type            : 'token' | 'rule' | 'repeat' | 'choice' | 'seq' | 'optional';
        [key: string]   : any;
        silent          : boolean;
    }

    export interface ErrorHandler {
        cond            : number | ((parser: Parser, opt: { failedAt: number, tokenIndex: number, force?: boolean, prevRule?: string, prevInnerRule?: string }) => boolean);
        msg             : string;
        code?           : string;
    }

    export interface RecoveryStrategy {
        type            : 'skipUntil';
        tokens?         : string[];
        token?          : string;
    }

    export interface PatternResultType {
        // for example
        // token pattern should return signle if success or none if failed
        // optional pattern always maulti even if failed, inside it we will have an internal array if optional elements passed.
        // and so on..

        // i use, this approch, to update the build function, it must be known as (PatternResultType) and not any/unknown
        // also, i want to add the ability to throw custome error in build proccess/function, if though collect the error and add it to this.errors and re-mark the PatternResultType as none.
        // this will allow me make more smart errors even if all elements passed.
        status          : 'single' | 'multi' | 'none',
        source          ?: AstNode[] | AstNode
    }

    export interface Rule {
        name            : string;
        pattern         : Pattern;
        options?        : {
            build?      : (matches: any[]) => any;
            errors?     : ErrorHandler[];
            recovery?   : RecoveryStrategy;
            ignored?    : string[];
            silent?     : boolean;
        };
    }

    export type Rules = Rule[];

    export interface ParseStatistics {
        tokensProcessed : number;
        rulesApplied    : number;
        errorsRecovered : number;
        parseTimeMs     : number;
    }

    export interface AstNode {
        rule            : string;
        span            : Span;
        data           ?: unknown;
    }

    export interface ParseError {
        msg             : string;
        code            : string;
        span            : Span;
        failedAt        : number;
        tokenIndex      : number;
        prevRule        : string;
        prevInnerRule?  : string;
    }

    export interface ParseResult {
        ast             : PatternResultType[];
        errors          : ParseError[];
        statistics?     : ParseStatistics;
    }

    export type DebugLevel = 'off' | 'errors' | 'rules' | 'patterns' | 'tokens' | 'verbose';

    export interface ParserSettings {
        startRule       : string;
        errorRecovery?  : {
            mode?       : 'strict' | 'resilient';
            maxErrors?  : number;
        };
        ignored?        : string[];
        debug?          : DebugLevel;
        maxDepth?       : number;
        maxCacheSize?   : number;
    }

    export const ERRORS = {
        // Core parsing errors
        LEXICAL_ERROR           : 'LEXICAL_ERROR',
        TOKEN_EXPECTED_EOF      : 'TOKEN_EXPECTED_EOF',
        TOKEN_MISMATCH          : 'TOKEN_MISMATCH',
        RULE_FAILED             : 'RULE_FAILED',
        BUILD_FUNCTION_FAILED   : 'BUILD_FUNCTION_FAILED',
        REPEAT_MIN_NOT_MET      : 'REPEAT_MIN_NOT_MET',
        SEQUENCE_FAILED         : 'SEQUENCE_FAILED',
        CUSTOM_ERROR            : 'CUSTOM_ERROR',

        // Choice and alternatives
        CHOICE_ALL_FAILED       : 'CHOICE_ALL_FAILED',

        // System errors
        FATAL_ERROR             : 'FATAL_ERROR',
        UNKNOWN_ERROR           : 'UNKNOWN_ERROR',

        // Recovery and validation
        RECOVERY_CUSTOM         : 'RECOVERY_CUSTOM',
    } as const;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Parser {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // Core data
            public rules            : Map<string, Rule>;
            public settings         : ParserSettings;

            // State
            public tokens           : Token[] = [];
            public ast              : PatternResultType[] = [];
            public errors           : ParseError[] = [];
            public index             = 0;
            public depth             = 0;

            // Debug & stats
            private debugLevel      : DebugLevel;
            private indentLevel      = 0;
            public stats            : ParseStatistics;
            public startTime         = 0;
            public errorSeq          = 0;

            // Performance
            public memoCache         = new Map<string, any>();
            public ignoredSet        = new Set<string>();
            public memoHits          = 0;
            public memoMisses        = 0;

            // Context tracking
            private silentContextStack  : boolean[] = [];
            public lastVisitedIndex      = 0;
            public lastHandledRule       = 'unknown';
            public ruleStack            : string[] = [];
            public patternStack         : string[] = [];
            public lastInnerRule         = 'unknown';
            public lastCompletedRule     = 'unknown';
            public successfulRules      : string[] = [];
            private globalSuccessRules  : string[] = [];
            private lastLeafRule         = 'unknown';

            constructor(rules: Rule[], settings?: ParserSettings) {
                this.rules          = new Map(rules.map(rule => [rule.name, rule]));
                this.settings       = this.normalizeSettings(settings);
                this.debugLevel     = this.settings.debug!;
                this.ignoredSet     = new Set(this.settings.ignored!);

                this.stats = { tokensProcessed: 0, rulesApplied: 0, errorsRecovered: 0, parseTimeMs: 0 };

                const grammarIssues = this.validateGrammar();
                if (grammarIssues.length > 0) {
                    throw new Error(`Grammar validation failed: ${grammarIssues.join(', ')}`);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

            parse(tokens: Token[]): ParseResult {
                this.resetState(tokens);
                this.startTime = Date.now();
                this.log('rules', `🚀 Parse started: ${tokens.length} tokens`);

                // Early validation
                if (!tokens?.length) {return { ast: [], errors: [] };}

                const errorToken = tokens.find(token => token.kind === 'error');
                if (errorToken) {
                    return {
                        ast: [],
                        errors: [this.createError(ERRORS.LEXICAL_ERROR, `Unexpected token '${errorToken.value}'`, errorToken.span, 0, 0, this.lastHandledRule)]
                    };
                }

                try {
                    const startRule = this.rules.get(this.settings.startRule);
                    if (!startRule) {
                        throw new Error(`Start rule '${this.settings.startRule}' not found`);
                    }

                    this.skipIgnored();
                    this.parseWithRecovery(startRule);
                    this.skipIgnored();
                } catch (err: any) {
                    this.handleFatalError(err);
                }

                this.stats.parseTimeMs = Date.now() - this.startTime;
                this.log('rules', `✅ Parse completed: ${this.ast.length} nodes, ${this.errors.length} errors (${this.stats.parseTimeMs}ms)`);
                this.log('verbose', `📊 Memo stats: ${this.memoHits} hits, ${this.memoMisses} misses, ${this.memoCache.size} cached entries`);

                return {
                    ast: this.ast,
                    errors: this.errors,
                    statistics: this.stats
                };
            }

            private parseWithRecovery(startRule: Rule): void {
                const maxErrors = this.settings.errorRecovery!.maxErrors!;
                let consecutiveErrors = 0;

                while (this.index < this.tokens.length && (maxErrors === 0 || this.errors.length < maxErrors)) {
                    const beforeIndex = this.index;

                    try {
                        const result = this.parsePattern(startRule.pattern, startRule);

                        if (result !== null) {
                            const processed = startRule.options?.build
                                ? this.safeBuild(startRule.options.build, result)
                                : result;

                            if (processed !== null) {
                                this.ast.push(processed);
                            }
                        }

                        consecutiveErrors = 0;

                        if (this.index >= this.tokens.length || this.index === beforeIndex) {
                            break;
                        }
                    } catch (error: any) {
                        consecutiveErrors++;

                        const parseError = this.normalizeError(error, this.getCurrentSpan());
                        this.addError(parseError);

                        // FIXED: Better error recovery application
                        if (this.settings.errorRecovery!.mode === 'resilient') {
                            this.applyRecovery(startRule, beforeIndex);

                            // Force progress if we're stuck
                            if (this.index === beforeIndex && this.index < this.tokens.length) {
                                this.index++;
                            }
                        } else {
                            // In strict mode, stop after first error
                            break;
                        }

                        if (consecutiveErrors > 10) {
                            break;
                        }
                    }

                    this.skipIgnored();
                }
            }

            protected parsePattern(pattern: Pattern, parentRule?: Rule): PatternResultType {
                this.lastHandledRule = pattern.type;

                if (this.depth > this.settings.maxDepth!) {
                    throw new Error('Maximum parsing depth exceeded');
                }

                // CRITICAL FIX: Better silent context management
                const shouldBeSilent = this.shouldBeSilent(pattern, parentRule);

                // For optional patterns, we need special handling
                const isOptionalContext = parentRule?.name === 'optional' ||
                                        this.patternStack[this.patternStack.length - 1] === 'optional';

                this.silentContextStack.push(shouldBeSilent || isOptionalContext);

                const startIndex = this.index;
                const memoKey = this.shouldUseMemoization(pattern, parentRule)
                    ? this.createMemoKey(pattern.type, pattern, startIndex, parentRule?.name)
                    : null;

                // Check memoization
                if (memoKey) {
                    const memoResult = this.getMemoized(memoKey);
                    if (memoResult.hit) {
                        this.index = memoResult.newIndex!;
                        this.silentContextStack.pop();
                        this.log('verbose', `🔋 Memo HIT: ${memoKey} → ${memoResult.newIndex}`);
                        return memoResult.result;
                    }
                }

                this.indentLevel++;
                this.log('patterns', `${'  '.repeat(this.indentLevel)}⚡ ${pattern.type}${parentRule ? ` (${parentRule.name})` : ''}${shouldBeSilent ? ' [SILENT]' : ''} @${this.index}`);
                this.depth++;

                let result: any = null;

                try {
                    this.skipIgnored(parentRule?.options?.ignored);

                    result = this.executePattern(pattern, parentRule, shouldBeSilent);

                    const status = result !== null ? '✓' : '✗';
                    this.log('patterns', `${'  '.repeat(this.indentLevel)}${status} ${pattern.type} → ${this.index}`);

                    // CRITICAL FIX: Only memoize if we're not in an error state
                    if (memoKey && !isOptionalContext) {
                        this.memoize(memoKey, result, startIndex, this.index);
                    }

                    return result;
                } catch (error) {
                    // In optional context, don't let errors propagate up
                    if (isOptionalContext) {
                        this.index = startIndex;
                        this.log('patterns', `${'  '.repeat(this.indentLevel)}✗ ${pattern.type} (optional context, suppressed) → ${startIndex}`);
                        return { status: 'multi', source: [] };
                    }
                    throw error;
                } finally {
                    this.depth--;
                    this.indentLevel--;
                    this.silentContextStack.pop();
                }
            }

            private executePattern(pattern: Pattern, parentRule?: Rule, shouldBeSilent?: boolean): any {
                switch (pattern.type) {
                    case 'token':
                        return this.parseToken(pattern.name, parentRule, shouldBeSilent);
                    // case 'rule':
                    //     return this.parseRule(pattern.name, parentRule, shouldBeSilent);
                    // case 'repeat':
                    //     return this.parseRepeat(pattern.pattern, pattern.min || 0, pattern.max || Infinity, pattern.separator, parentRule, shouldBeSilent);
                    // case 'seq':
                    //     return this.parseSequence(pattern.patterns, parentRule, shouldBeSilent);
                    // case 'choice':
                    //     return this.parseChoice(pattern.patterns, parentRule, shouldBeSilent);
                    // case 'optional':
                        // return this.parseOptional(pattern.pattern, parentRule);
                    default:
                        throw new Error(`Unknown pattern type: ${(pattern as any).type}`);
                }
            }

            private parseToken(tokenName: string, parentRule?: Rule, shouldBeSilent?: boolean): Token | null {
                this.lastHandledRule = parentRule?.name || tokenName;
                this.log('tokens', `→ ${tokenName} @${this.index}`);
                this.lastVisitedIndex = this.index;

                if (this.index >= this.tokens.length) {
                    this.log('tokens', `✗ Expected '${tokenName}', got 'EOF' @${this.index}`);

                    if (shouldBeSilent) {return null;}

                    const error = this.createError(
                        ERRORS.TOKEN_EXPECTED_EOF,
                        `Expected '${tokenName}', got 'EOF'`,
                        this.getCurrentSpan(),
                        0,
                        this.index,
                        this.lastHandledRule!,
                        this.getInnerMostRule()
                    );
                    this.handleParseError(error, parentRule);
                }

                const token = this.getCurrentToken();

                if (token.kind === tokenName) {
                    const consumedToken = { ...token };
                    this.index++;
                    this.stats.tokensProcessed++;
                    this.log('tokens', `✓ ${tokenName} = "${token.value}" @${this.index - 1}`);
                    return consumedToken;
                }

                this.log('tokens', `✗ Expected '${tokenName}', got '${token.kind}' @${this.lastVisitedIndex}`);

                if (shouldBeSilent) {return null;}

                const error = this.createError(
                    ERRORS.TOKEN_MISMATCH,
                    `Expected '${tokenName}', got '${token.kind}'`,
                    this.getCurrentSpan(),
                    0,
                    this.lastVisitedIndex,
                    this.lastHandledRule!,
                    this.getInnerMostRule(true)
                );
                this.handleParseError(error, parentRule);
            }

            private safeBuild(buildFn: Function, matches: any): any {
                try {
                    const input = Array.isArray(matches) ? matches : [matches];
                    return buildFn(input);
                } catch (error) {
                    if (!this.isInSilentMode()) {
                        console.error(`Build function failed: ${JSON.stringify(matches, null, 2)}, lastVisitedIndex: ${this.lastVisitedIndex}, lastHandledRule: ${this.lastHandledRule}`);
                        const buildError = this.createError(
                            ERRORS.BUILD_FUNCTION_FAILED,
                            `Build function failed: ${(error as Error).message}`,
                            this.getCurrentSpan(),
                            0,
                            this.lastVisitedIndex,
                            this.lastHandledRule!
                        );
                        this.addError(buildError);
                        this.log('errors', `Build error: ${(error as Error).message}`);
                    }
                    return matches;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MODE ──────────────────────────────┐

            private shouldBeSilent(pattern: Pattern, rule?: Rule): boolean {
                return rule?.options?.silent === true ||
                    pattern.silent === true ||
                    (this.silentContextStack.length > 0 && this.silentContextStack[this.silentContextStack.length - 1]);
            }

            private isInSilentMode(): boolean {
                return this.silentContextStack.length > 0 &&
                    this.silentContextStack[this.silentContextStack.length - 1];
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private normalizeSettings(settings?: ParserSettings): ParserSettings {
                const defaultSettings: ParserSettings = {
                    startRule       : 'root',
                    errorRecovery   : {
                        mode        : 'strict',
                        maxErrors   : 1,
                    },
                    ignored         : ['ws'],
                    debug           : 'off',
                    maxDepth        : 1000,
                    maxCacheSize    : 1, // 1 MB
                };

                if (!settings) {return defaultSettings;}

                const mergedSettings = { ...defaultSettings, ...settings };
                if (settings?.errorRecovery) {
                    mergedSettings.errorRecovery = { ...defaultSettings.errorRecovery, ...settings.errorRecovery };
                }

                return mergedSettings;
            }

            private validateGrammar(): string[] {
                const issues: string[] = [];
                const ruleNames = new Set(Array.from(this.rules.keys()));

                for (const [ruleName, rule] of this.rules) {
                    const referencedRules = this.extractRuleReferences(rule.pattern);
                    for (const ref of referencedRules) {
                        if (!ruleNames.has(ref)) {
                            issues.push(`Rule '${ruleName}' references undefined rule '${ref}'`);
                        }
                    }
                }

                if (!this.rules.has(this.settings.startRule)) {
                    issues.push(`Start rule '${this.settings.startRule}' is not defined`);
                }

                return issues;
            }

            private extractRuleReferences(pattern: Pattern): string[] {
                const refs: string[] = [];

                switch (pattern.type) {
                    case 'rule':
                        refs.push(pattern.name);
                        break;
                    case 'repeat':
                        refs.push(...this.extractRuleReferences(pattern.pattern));
                        if (pattern.separator) {
                            refs.push(...this.extractRuleReferences(pattern.separator));
                        }
                        break;
                    case 'optional':
                        refs.push(...this.extractRuleReferences(pattern.pattern));
                        break;
                    case 'seq':
                    case 'choice':
                        if (pattern.patterns) {
                            for (const p of pattern.patterns) {
                                refs.push(...this.extractRuleReferences(p));
                            }
                        }
                        break;
                }

                return refs;
            }

            private skipIgnored(ruleIgnored?: string[]): void {
                if (this.ignoredSet.size === 0 && (!ruleIgnored?.length)) {return;}

                const combinedIgnored = ruleIgnored
                    ? new Set([...this.ignoredSet, ...ruleIgnored])
                    : this.ignoredSet;

                while (this.index < this.tokens.length) {
                    const token = this.tokens[this.index];
                    if (!combinedIgnored.has(token.kind)) {break;}
                    this.index++;
                    this.stats.tokensProcessed++;
                }
            }

            private skipUntilTokens(tokens: string[]): void {
                if (tokens.length === 0) {return;}

                const tokenSet = new Set(tokens);
                const maxIterations = Math.min(10000, this.tokens.length - this.index);
                let skipped = 0;

                while (this.index < this.tokens.length && skipped < maxIterations) {
                    const currentToken = this.tokens[this.index];

                    if (tokenSet.has(currentToken.kind)) {
                        this.log('errors', `Found sync token '${currentToken.kind}' @${this.index}`);
                        return;
                    }
                    this.index++;
                    skipped++;
                }
            }

            private deepClone(obj: any): any {
                if (obj === null || typeof obj !== 'object') {return obj;}
                if (Array.isArray(obj)) {return obj.map(item => this.deepClone(item));}

                if (obj.type || obj.span || obj.value) {
                    const cloned: any = {};
                    for (const [key, value] of Object.entries(obj)) {
                        cloned[key] = this.deepClone(value);
                    }
                    return cloned;
                }

                return obj;
            }

            private resetState(tokens: Token[]): void {
                this.tokens = tokens;
                this.index = 0;
                this.errors = [];
                this.ast = [];
                this.depth = 0;
                this.errorSeq = 0;
                this.indentLevel = 0;
                this.silentContextStack = [];

                // Reset enhanced rule tracking
                this.ruleStack = [];
                this.patternStack = [];
                this.lastInnerRule = 'unknown';
                this.lastCompletedRule = 'unknown';
                this.successfulRules = [];
                this.globalSuccessRules = [];
                this.lastLeafRule = 'unknown';

                // Reset memoization
                this.memoCache.clear();
                this.memoHits = 0;
                this.memoMisses = 0;

                this.stats = {
                    tokensProcessed: 0,
                    rulesApplied: 0,
                    errorsRecovered: 0,
                    parseTimeMs: 0
                };
            }

            private getCurrentToken(): Token {
                return this.tokens[this.index];
            }

            private getCurrentSpan(): Span {
                if (this.index === 0) {
                    if (this.tokens.length > 0) {
                        return {
                            start: this.tokens[0].span.start,
                            end: this.tokens[0].span.start
                        };
                    }
                    return { start: 0, end: 0 };
                }

                if (this.index >= this.tokens.length) {
                    const lastToken = this.tokens[this.tokens.length - 1];
                    return {
                        start: lastToken.span.end,
                        end: lastToken.span.end
                    };
                }

                return this.tokens[this.index].span;
            }

            private patternToString(pattern: Pattern): string {
                switch (pattern.type) {
                    case 'token': return `'${pattern.name}'`;
                    case 'rule': return pattern.name;
                    case 'repeat': return `${this.patternToString(pattern.pattern)}...`;
                    case 'optional': return `${this.patternToString(pattern.pattern)}?`;
                    case 'choice': return `choice(${pattern.patterns.map((p: any) => this.patternToString(p)).join('|')})`;
                    case 'seq': return `seq(${pattern.patterns.map((p: any) => this.patternToString(p)).join(' ')})`;
                    default: return pattern.type;
                }
            }

            private updateLeafRule(ruleName: string): void {
                if (ruleName !== 'unknown' &&
                    !ruleName.includes('<') &&
                    !ruleName.includes('→') && (ruleName.length < 30) &&
                    !['Statement', 'VariableDeclaration', 'let <mut> name;'].includes(ruleName)) {
                    this.lastLeafRule = ruleName;
                    this.log('verbose', `🍃 Updated lastLeafRule to: "${ruleName}"`);
                }
            }

            private trimSuccessfulRules(): void {
                if (this.successfulRules.length > 10) {
                    this.successfulRules = this.successfulRules.slice(-5);
                }
                if (this.globalSuccessRules.length > 20) {
                    this.globalSuccessRules = this.globalSuccessRules.slice(-10);
                }
            }

            isNextToken(type: string, ignoredTokens?: string[]): boolean {
                const ignored = [...(ignoredTokens ?? []), ...this.settings.ignored!];
                let currentIndex = this.index;

                while (currentIndex < this.tokens.length) {
                    const currentToken = this.tokens[currentIndex];
                    if (currentToken.kind === type) {return true;}
                    if (ignored.includes(currentToken.kind)) {
                        currentIndex++;
                    } else {
                        break;
                    }
                }
                return false;
            }

            isPrevToken(type: string, startIndex = -1, ignoredTokens?: string[]): boolean {
                if (startIndex === -1) {startIndex = this.index > 0 ? this.index : 0;}
                const ignored = [...(ignoredTokens ?? []), ...this.settings.ignored!];
                let currentIndex = startIndex - 1;

                while (currentIndex >= 0) {
                    const currentToken = this.tokens[currentIndex];
                    if (currentToken.kind === type) {return true;}
                    if (ignored.includes(currentToken.kind)) {
                        currentIndex--;
                    } else {
                        break;
                    }
                }
                return false;
            }

            isPrevRule(name: string): boolean {
                console.warn(`isPrevRule: ${JSON.stringify(this.lastHandledRule, null, 2)}`);
                return this.lastHandledRule === name;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── ERROR ──────────────────────────────┐

            private createError(code: string, msg: string, span: Span | undefined, failedAt: number, tokenIndex: number, prevRule: string, prevInnerRule?: string): ParseError {
                return {
                    code,
                    msg,
                    span: span || this.getCurrentSpan(),
                    failedAt,
                    tokenIndex,
                    prevRule,
                    prevInnerRule: prevInnerRule || this.getInnerMostRule()
                };
            }

            private getCustomErrorOr(rule: Rule | null | undefined, defaultError: ParseError): ParseError {
                if (!rule?.options?.errors) {return defaultError;}

                for (const errorHandler of rule.options.errors) {
                    let matches = false;

                    if (typeof errorHandler.cond === 'number') {
                        matches = (defaultError.failedAt === errorHandler.cond);
                    } else if (typeof errorHandler.cond === 'function') {
                        try {
                            const contextualInnerRule = this.getInnerMostRule(true);

                            const opt = {
                                failedAt: defaultError.failedAt,
                                tokenIndex: defaultError.tokenIndex,
                                prevRule: defaultError.prevRule,
                                prevInnerRule: contextualInnerRule
                            };

                            matches = errorHandler.cond(this, opt);
                        } catch (err) {
                            console.error('Error in condition function:', err);
                            matches = false;
                        }
                    }

                    if (matches) {
                        return this.createError(
                            errorHandler.code || ERRORS.CUSTOM_ERROR,
                            errorHandler.msg,
                            defaultError.span,
                            defaultError.failedAt,
                            defaultError.tokenIndex,
                            defaultError.prevRule,
                            defaultError.prevInnerRule || this.getInnerMostRule(true)
                        );
                    }
                }

                return defaultError;
            }

            private getInnerMostRule(forErrorCondition = false): string {
                this.log('verbose', `📍 Rule context: stack=[${this.ruleStack.join(',')} as ${this.patternStack.join(',')}], recent=[${this.successfulRules.slice(-3).join(',')}], leaf=${this.lastLeafRule}, current=${this.lastHandledRule}`);

                if (forErrorCondition && this.lastLeafRule !== 'unknown') {
                    this.log('verbose', `🎯 getInnerMostRule(forErrorCondition=true) using lastLeafRule: "${this.lastLeafRule}"`);
                    return this.lastLeafRule;
                }

                if (this.ruleStack.length > 0) {
                    return this.ruleStack[this.ruleStack.length - 1];
                }

                if (this.lastLeafRule !== 'unknown') {
                    return this.lastLeafRule;
                }

                // Look at most recently completed meaningful rule
                const meaningfulRules = [...this.successfulRules, ...this.globalSuccessRules];
                for (let i = meaningfulRules.length - 1; i >= 0; i--) {
                    const rule = meaningfulRules[i];
                    if (this.isMeaningfulRule(rule)) {
                        return rule;
                    }
                }

                if (this.lastCompletedRule !== 'unknown' && this.lastCompletedRule.length < 30) {
                    return this.lastCompletedRule;
                }

                return this.lastInnerRule;
            }

            private isMeaningfulRule(rule: string): boolean {
                return rule !== 'unknown' &&
                    !rule.includes('<') &&
                    !rule.includes('→') &&
                    rule.length < 30 &&
                    !['Statement', 'VariableDeclaration'].includes(rule);
            }

            private addError(error: ParseError): void {
                if (this.isInSilentMode()) {return;}

                const maxErrors = this.settings.errorRecovery!.maxErrors!;
                if (maxErrors !== 0 && this.errors.length >= maxErrors) {return;}

                if (this.settings.errorRecovery!.mode === 'strict' && this.errors.length > 0) {return;}

                this.errors.push(error);
                this.log('errors', `⚠️  ${error.msg} @${error.span.start}:${error.span.end}`);
            }

            private handleParseError(error: ParseError, rule?: Rule): never {
                const finalError = this.getCustomErrorOr(rule, error);
                throw finalError;
            }

            private handleFatalError(error: any): void {
                const parseError = this.normalizeError(error, this.getCurrentSpan());
                parseError.prevInnerRule = this.getInnerMostRule();
                this.addError(parseError);
                this.log('errors', `💥 Fatal error: ${parseError.msg} @${this.index}`);
            }

            private normalizeError(error: any, defaultSpan: Span): ParseError {
                if (error && typeof error === 'object' && 'msg' in error && 'code' in error && 'span' in error) {
                    const parseError = error as ParseError;
                    if (!parseError.prevInnerRule) {
                        parseError.prevInnerRule = this.getInnerMostRule();
                    }
                    return parseError;
                }

                if (error instanceof Error) {
                    return this.createError(
                        ERRORS.FATAL_ERROR,
                        error.message,
                        defaultSpan,
                        0,
                        this.lastVisitedIndex,
                        this.lastHandledRule!,
                        this.getInnerMostRule()
                    );
                }

                return this.createError(
                    ERRORS.UNKNOWN_ERROR,
                    `Unknown error: ${error}`,
                    defaultSpan,
                    0,
                    this.lastVisitedIndex,
                    this.lastHandledRule!,
                    this.getInnerMostRule()
                );
            }

            private applyRecovery(rule?: Rule, startIndex?: number): void {
                const recovery = rule?.options?.recovery;

                if (recovery) {
                    this.applyRecoveryStrategy(recovery);
                } else {
                    // FIXED: Only apply default recovery if no custom recovery is defined
                    this.skipIgnored();
                    if (this.index < this.tokens.length) {
                        this.index++;
                    }
                }

                this.stats.errorsRecovered++;

                // Ensure we make progress
                if (startIndex !== undefined && this.index === startIndex && this.index < this.tokens.length) {
                    this.index++;
                }
            }

            private getCustomErrorForCondition(rule: Rule, failedAt: number, tokenIndex: number, _startIndex: number): ParseError | null {
                if (!rule?.options?.errors) {return null;}

                for (const errorHandler of rule.options.errors) {
                    let matches = false;

                    if (typeof errorHandler.cond === 'number') {
                        matches = (failedAt === errorHandler.cond);
                    } else if (typeof errorHandler.cond === 'function') {
                        try {
                            const opt = {
                                failedAt,
                                tokenIndex,
                                prevRule: rule.name,
                                prevInnerRule: this.getInnerMostRule(true)
                            };
                            matches = errorHandler.cond(this, opt);
                        } catch (err) {
                            console.error('Error in condition function:', err);
                            matches = false;
                        }
                    }

                    if (matches) {
                        return this.createError(
                            errorHandler.code || ERRORS.CUSTOM_ERROR,
                            errorHandler.msg,
                            this.getCurrentSpan(),
                            failedAt,
                            tokenIndex,
                            rule.name,
                            this.getInnerMostRule(true)
                        );
                    }
                }

                return null;
            }

            private applyRecoveryStrategy(strategy: RecoveryStrategy): void {
                const beforePos = this.index;
                this.log('errors', `🔧 Recovery: ${strategy.type} @${beforePos}`);

                switch (strategy.type) {
                    case 'skipUntil':
                        { const tokens = strategy.tokens || (strategy.token ? [strategy.token] : []);
                        this.skipUntilTokens(tokens);
                        break; }
                    default:
                }

                this.log('errors', `Recovery: ${beforePos} → ${this.index}`);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── DEBUG ──────────────────────────────┐

            private log(level: DebugLevel, message: string): void {
                if (this.debugLevel === 'off') {return;}

                const levels: DebugLevel[] = ['off', 'errors', 'rules', 'patterns', 'tokens', 'verbose'];
                const currentIndex = levels.indexOf(this.debugLevel);
                const messageIndex = levels.indexOf(level);

                if (messageIndex <= currentIndex) {
                    const prefix = this.getDebugPrefix(level);
                    console.log(`${prefix} ${message}`);
                }
            }

            private getDebugPrefix(level: DebugLevel): string {
                const prefixes: Record<string, string> = {
                    errors      : '🔥',
                    rules       : '📋',
                    patterns    : '🔍',
                    tokens      : '🎯',
                    verbose     : '📝'
                };

                return `[${prefixes[level] || (level === 'off' ? '⚡' : '')}]`;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── CACHE ──────────────────────────────┐

            public dispose(): void {
                this.memoCache.clear();
                this.rules.clear();
                this.ignoredSet.clear();
                this.tokens = [];
                this.ast = [];
                this.errors = [];
                this.silentContextStack = [];
                this.ruleStack = [];
                this.successfulRules = [];
                this.globalSuccessRules = [];
            }

            private cleanMemoCache(): void {
                const entries = Array.from(this.memoCache.entries());
                const now = Date.now();

                const validEntries = entries.filter(([, value]) => {
                    if (now - (value.cachedAt || 0) > 1000) {return false;}
                    if (value.errorCount !== this.errors.length) {return false;}
                    return true;
                });

                const keepCount = Math.floor(validEntries.length / 2);
                this.memoCache.clear();

                for (let i = validEntries.length - keepCount; i < validEntries.length; i++) {
                    this.memoCache.set(validEntries[i][0], validEntries[i][1]);
                }

                this.log('verbose', `🧹 Memo cache cleaned: kept ${keepCount} of ${entries.length} entries`);
            }

            private createMemoKey(patternType: string, patternData: any, position: number, ruleName?: string): string {
                const silentContext = this.isInSilentMode() ? 'S' : 'L';
                const errorContext = this.errors.length > 0 ? `E${this.errors.length}` : 'E0';
                const baseKey = `${patternType}:${position}:${silentContext}:${errorContext}`;

                if (ruleName) {
                    const rule = this.rules.get(ruleName);
                    const ruleContext = this.getRuleContext(rule);
                    return `rule:${ruleName}:${ruleContext}:${baseKey}`;
                }

                switch (patternType) {
                    case 'token':
                        return `${baseKey}:${patternData.name}`;
                    case 'optional':
                        return `${baseKey}:optional`;
                    case 'repeat':
                        return `${baseKey}:${patternData.min || 0}:${patternData.max || 'inf'}:${patternData.separator ? 'sep' : 'nosep'}`;
                    case 'seq':
                    case 'choice':
                        { const patternHash = this.hashPatterns(patternData.patterns || []);
                        return `${baseKey}:${patternData.patterns?.length || 0}:${patternHash}`; }
                    default:
                        return baseKey;
                }
            }

            private getRuleContext(rule?: Rule): string {
                if (!rule) {return 'none';}

                const hasBuilder = rule.options?.build ? 'B' : '';
                const hasErrors = rule.options?.errors?.length ? 'E' : '';
                const hasRecovery = rule.options?.recovery ? 'R' : '';
                const isSilent = rule.options?.silent ? 'S' : '';

                return `${hasBuilder}${hasErrors}${hasRecovery}${isSilent}`;
            }

            private hashPatterns(patterns: Pattern[]): string {
                return patterns.map(p => `${p.type}${p.silent ? 'S' : ''}`).join('');
            }

            private getMemoized(key: string): { hit: boolean; result?: any; newIndex?: number } {
                if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {
                    return { hit: false };
                }

                const cached = this.memoCache.get(key);
                if (cached !== undefined) {
                    if (this.isCachedResultValid(cached)) {
                        this.memoHits++;
                        this.log('verbose', `📋 Memo HIT: ${key} → ${cached.newIndex}`);
                        return { hit: true, result: cached.result, newIndex: cached.newIndex };
                    } else {
                        this.memoCache.delete(key);
                        this.log('verbose', `🗑️ Memo INVALID: ${key}`);
                    }
                }

                this.memoMisses++;
                return { hit: false };
            }

            private isCachedResultValid(cached: any): boolean {
                if (typeof cached.newIndex !== 'number' || cached.newIndex < 0) {return false;}
                if (cached.newIndex > this.tokens.length) {return false;}
                return true;
            }

            private memoize(key: string, result: any, startIndex: number, endIndex: number): void {
                if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {return;}

                if (result === null && startIndex === endIndex) {
                    this.log('verbose', `⚠️ Skip memo (no progress): ${key}`);
                    return;
                }

                if (this.errors.length > 0 && this.stats.errorsRecovered > 0) {
                    this.log('verbose', `⚠️ Skip memo (error state): ${key}`);
                    return;
                }

                if (this.memoCache.size >= (this.settings.maxCacheSize * 0.9)) {
                    this.cleanMemoCache();
                }

                const memoEntry = {
                    result: this.deepClone(result),
                    newIndex: endIndex,
                    cachedAt: Date.now(),
                    silentContext: this.isInSilentMode(),
                    errorCount: this.errors.length
                };

                this.memoCache.set(key, memoEntry);
                this.log('verbose', `💾 Memo SET: ${key} → ${endIndex}`);
            }

            private shouldUseMemoization(pattern: Pattern, _parentRule?: Rule): boolean {
                if (this.stats.errorsRecovered > 0 && this.errors.length > 0) {return false;}
                if (pattern.type === 'token') {return false;}
                if (pattern.type === 'rule' && this.isRecursiveContext()) {return false;}

                return pattern.type === 'rule' ||
                    pattern.type === 'choice' ||
                    pattern.type === 'seq' ||
                    pattern.type === 'optional' ||
                    (pattern.type === 'repeat' && (pattern.min > 1 || pattern.max > 1));
            }

            private isRecursiveContext(): boolean {
                return this.depth > 10;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ MAIN ════════════════════════════════════════╗

    export function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult {
        const parser = new Parser(rules, settings);
        try {
            return parser.parse(tokens);
        } finally {
            parser.dispose();
        }
    }

    export const createRule = ( name: string, pattern: Pattern, options: Rule['options'] = {} ): Rule => {
        const finalOptions = { name, silent: false, ...options, };
        return { name, pattern: pattern, options: finalOptions, };
    };

    // ●●●● Pattern Combinators ●●●●

    export function token(name: string, silent = false): Pattern {
        if (!name || typeof name !== 'string') {
            throw new Error('Token name must be a non-empty string');
        }
        return { type: 'token', name, silent };
    }

    export function rule(name: string, silent = false): Pattern {
        if (!name || typeof name !== 'string') {
            throw new Error('Rule name must be a non-empty string');
        }
        return { type: 'rule', name, silent };
    }

    export function repeat(pattern: Pattern, min = 0, max = Infinity, separator?: Pattern, silent = false): Pattern {
        if (min < 0) {
            throw new Error('Minimum repetition count cannot be negative');
        }
        if (max < min) {
            throw new Error('Maximum repetition count cannot be less than minimum');
        }
        return { type: 'repeat', pattern, min, max, separator, silent };
    }

    export function oneOrMore(pattern: Pattern, separator?: Pattern, silent = false): Pattern {
        return repeat(pattern, 1, Infinity, separator, silent);
    }

    export function zeroOrMore(pattern: Pattern, separator?: Pattern, silent = false): Pattern {
        return repeat(pattern, 0, Infinity, separator, silent);
    }

    export function zeroOrOne(pattern: Pattern, separator?: Pattern, silent = true): Pattern {
        return repeat(pattern, 0, 1, separator, silent);
    }

    export function optional(pattern: Pattern, silent = false): Pattern {
        if (!pattern || typeof pattern !== 'object') {
            throw new Error('Optional pattern must be a valid pattern');
        }
        return { type: 'optional', pattern, silent };
    }

    export function choice(...patterns: Pattern[]): Pattern {
        if (patterns.length === 0) {
            throw new Error('Choice must have at least one pattern');
        }
        return { type: 'choice', patterns, silent: false };
    }

    export function seq(...patterns: Pattern[]): Pattern {
        if (patterns.length === 0) {
            throw new Error('Sequence must have at least one pattern');
        }
        return { type: 'seq', patterns, silent: false };
    }

    // ●●●● Silent Mode Helpers ●●●●

    export function silent<T extends Pattern>(pattern: T): T {
        return { ...pattern, silent: true };
    }

    export function loud<T extends Pattern>(pattern: T): T {
        return { ...pattern, silent: false };
    }

    // ●●●● Error Handling ●●●●

    export function error(cond: ErrorHandler['cond'], msg: string, code?: string): ErrorHandler {
        return { cond, msg, code: code ?? ERRORS.RECOVERY_CUSTOM };
    }

    export const errorRecoveryStrategies = {
        skipUntil(tokens: string | string[]): RecoveryStrategy {
            return { type: 'skipUntil', tokens: Array.isArray(tokens) ? tokens : [tokens] };
        },
    };

    // ●●●● Helpers ●●●●

    export function getMatchesSpan(matches: any[]): Span {
        const default_span = { start: 0, end: 0 };
        if (!matches || matches.length === 0) {return default_span;}

        let firstSpan: Span | null = null;
        let lastSpan: Span | null = null;

        for (const match of matches) {
            if (match && match.span) {
                if (!firstSpan) {
                    firstSpan = match.span;
                }
                lastSpan = match.span;
            }
        }

        if (firstSpan && lastSpan) {
            return {
                start: firstSpan.start,
                end: lastSpan.end
            };
        }

        if (firstSpan) {
            return firstSpan;
        }

        return default_span;
    }

    export function resWithoutSpan(res: any): any {
        const result = { ...res };
        delete result.span;
        return result;
    }

    export function isOptionalPassed(res: any[]) : boolean {
        return res.length > 0;
    }

    export function getOptional(res: any[], ret: any = undefined, index = 0, isSeq = false) : any {
        if(!isOptionalPassed(res)) {return ret;}
        if(isSeq && Array.isArray(res)) {res = res[0];}
        return res[index];
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝