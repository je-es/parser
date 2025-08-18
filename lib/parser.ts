// parser.ts — Advanced syntax analyzer that converts tokens
//             into AST with customizable grammar rules and intelligent error detection.
//
// repo   : https://github.com/je-es/parser
// author : https://github.com/maysara-elshewehy
//
// Developed with ❤️ by Maysara.



// ╔═══════════════════════════════════════════ TYPE ════════════════════════════════════════════╗

    // Represents a span in the source text
    export interface Span {
        start           : number;
        end             : number;
    }

    // Represents a token with type, value and position information
    export interface Token {
        type            : string;
        value           : string | null;
        span            : Span;
    }

    // Represents a pattern in the grammar
    export interface Pattern {
        type            : 'token' | 'rule' | 'repeat' | 'choice' | 'seq';
        [key: string]   : any;
        silent          : boolean; // Fixed typo: scilent -> silent
    }

    // Represents an error handler
    export interface ErrorHandler {
        cond            : number | ((parser: Parser, failedAt: number, force?: boolean) => boolean);
        msg             : string;
        code           ?: number;
    }

    // Represents a recovery strategy
    export interface RecoveryStrategy {
        type            : 'panic' | 'skipUntil';
        tokens         ?: string[];
        token          ?: string;
    }

    // Represents a rule in the grammar
    export interface Rule {
        name            : string;
        pattern         : Pattern;

        options        ?: {
            build      ?: (matches: any[]) => any;
            errors     ?: ErrorHandler[];
            recovery   ?: RecoveryStrategy;
            ignored    ?: string[];
            silent     ?: boolean; // Rule-level silent mode
        };
    }

    // Represents a list of rules
    export type Rules = Rule[];

    // Represents a parse statistics
    export interface ParseStatistics {
        tokensProcessed : number;
        rulesApplied    : number;
        errorsRecovered : number;
        parseTimeMs     : number;
    }

    // Represents an AST node
    export type BaseAstNode = {
        rule            : string;
        span            : Span;
        value          ?: string | number | boolean | null;
    }

    // With this we can customize the AST for the next stages
    // depending on your needs
    export type AstNode = BaseAstNode | any;

    export interface ParseError {
        msg             : string;
        code            : number;
        span            : Span;
    }

    // Represents a parse result
    export interface ParseResult {
        ast             : AstNode[];
        errors          : ParseError[];
        statistics     ?: ParseStatistics;
    }

    // Represents a debug level
    export type DebugLevel = 'off' | 'errors' | 'rules' | 'patterns' | 'tokens' | 'verbose';

    // Represents a parser settings
    export interface ParserSettings {
        startRule       : string;
        errorRecovery  ?: {
            mode       ?: 'strict' | 'resilient';
            maxErrors  ?: number;
            syncTokens ?: string[];
        };
        ignored        ?: string[];
        debug          ?: DebugLevel;
        maxDepth       ?: number;
        maxCacheSize   ?: number; // in megabytes
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════════════╝



// ╔═══════════════════════════════════════════ CORE ════════════════════════════════════════════╗

    /**
     * Parser class for advanced syntax analysis.
     * Parses tokens into AST with customizable grammar rules and intelligent error detection.
     * @class
    */
    export class Parser {

        // ┌─────────────────────────────── DATA ───────────────────────────────┐

            // ..
            public rules            : Map<string, Rule>;
            public settings         : ParserSettings;

            // ..
            public tokens           : Token[]               = [];
            public ast              : AstNode[]             = [];
            public errors           : ParseError[]          = [];

            // ..
            public index            : number                = 0;
            public depth            : number                = 0;

            // Debug system
            private debugLevel      : DebugLevel;
            private indentLevel     : number                = 0;

            // Statistics
            public stats            : ParseStatistics;
            public startTime        : number                = 0;
            public errorSeq         : number                = 0;

            // Performance optimizations
            public memoCache        : Map<string, any>      = new Map<string, any>();
            public ignoredSet       : Set<string>           = new Set<string>();

            // Memoization statistics
            public memoHits         : number                = 0;
            public memoMisses       : number                = 0;

            // Silent mode context stack - tracks when we're in silent parsing
            private silentContextStack : boolean[]          = [];

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── INIT ───────────────────────────────┐

            constructor(rules: Rule[], settings?: ParserSettings) {
                // set => rules
                this.rules = new Map();
                rules.forEach(rule => this.rules.set(rule.name, rule));

                // set => settings
                this.settings = this.normalizeSettings(settings);

                // set => debug
                this.debugLevel = this.settings.debug!;

                // set => ignored
                this.ignoredSet = new Set([...this.settings.ignored!]);

                // set => stats
                this.stats = {
                    tokensProcessed     : 0,
                    rulesApplied        : 0,
                    errorsRecovered     : 0,
                    parseTimeMs         : 0
                };

                // Validate grammar
                const grammarIssues = this.validateGrammar();
                if (grammarIssues.length > 0) {
                    throw new Error(`Grammar validation failed: ${grammarIssues.join(', ')}`);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── MAIN ───────────────────────────────┐

            /**
             * Parses the given tokens using the defined rules and returns the AST and errors.
             *
             * @param {Token[]} tokens - The tokens to parse.
             *
             * @return {ParseResult} The AST and errors generated during parsing.
            */
            parse(tokens: Token[]): ParseResult {
                // Before
                {
                    this.resetState(tokens);
                    this.startTime = Date.now();
                    this.log('rules', `🚀 Parse started: ${tokens.length} tokens`);
                }

                // Early Break
                {
                    // check tokens length
                    if (!tokens?.length) { return { ast: [], errors: [] }; }

                    // check if tokens contains error tokens
                    if(tokens.some(token => token.type === 'error')) {
                        const errorToken = tokens.find(token => token.type === 'error');
                        return {
                            ast     : [],
                            errors  : [this.createError(0x000, `Unexpected token '${errorToken?.value}'`, errorToken?.span)]
                        };
                    }
                }

                // Parse
                {
                    try {
                        // Get start rule
                        const startRule = this.rules.get(this.settings.startRule);
                        if (!startRule) {
                            throw new Error(`Start rule '${this.settings.startRule}' not found`);
                        }

                        // Skip ignored tokens
                        this.skipIgnored();

                        // Parse with error recovery
                        this.parseWithRecovery(startRule);

                        // Skip ignored tokens
                        this.skipIgnored();
                    }

                    catch (err: any) {
                        this.handleFatalError(err);
                    }
                }

                // After
                {
                    this.stats.parseTimeMs = Date.now() - this.startTime;
                    this.log('rules', `✅ Parse completed: ${this.ast.length} nodes, ${this.errors.length} errors (${this.stats.parseTimeMs}ms)`);
                    this.log('verbose', `📊 Memo stats: ${this.memoHits} hits, ${this.memoMisses} misses, ${this.memoCache.size} cached entries`);

                    return {
                        ast: this.ast,
                        errors: this.errors,
                        statistics: this.stats
                    };
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── CORE ───────────────────────────────┐

            private parseWithRecovery(startRule: Rule): void {
                const maxErrors = this.settings.errorRecovery!.maxErrors!;
                let consecutiveErrors = 0;

                while (this.index < this.tokens.length && (maxErrors === 0 || this.errors.length < maxErrors)) {
                    const beforeIndex = this.index;

                    try {
                        // Parse start rule
                        const result = this.parsePattern(startRule.pattern, startRule);

                        // Build AST node
                        if (result !== null) {
                            const processed = startRule.options?.build
                                ? this.safeBuild(startRule.options.build, result)
                                : result;

                            if (processed !== null) {
                                this.ast.push(processed);
                            }
                        }

                        // Reset consecutive error counter on success
                        consecutiveErrors = 0;

                        // Break if we've consumed all tokens or no progress
                        if (this.index >= this.tokens.length || this.index === beforeIndex) {
                            break;
                        }
                    }
                    catch (error: any) {
                        consecutiveErrors++;

                        // Convert to ParseError and add to errors
                        const parseError = this.normalizeError(error, this.getCurrentSpan());
                        this.addError(parseError);

                        // Apply recovery strategy
                        this.applyRecovery(startRule, beforeIndex);

                        // Prevent infinite loops
                        if (consecutiveErrors > 10 || this.index === beforeIndex) {
                            if (this.index < this.tokens.length) {
                                this.index++;
                            } else {
                                break;
                            }
                        }

                        // In strict mode, stop after first error
                        if (this.settings.errorRecovery!.mode === 'strict') {
                            break;
                        }
                    }

                    // Skip ignored tokens
                    this.skipIgnored();
                }
            }

            protected parsePattern(pattern: Pattern, parentRule?: Rule): any {
                // Check depth
                if (this.depth > this.settings.maxDepth!) {
                    throw new Error('Maximum parsing depth exceeded');
                }

                // Determine if this pattern should be silent
                const shouldBeSilent = this.shouldBeSilent(pattern, parentRule);

                // Push silent context
                this.silentContextStack.push(shouldBeSilent);

                // Save current data
                const startIndex = this.index;

                // Create memoization key
                const memoKey = this.createMemoKey(pattern.type, pattern, startIndex, parentRule?.name);

                // Check memo cache - but be more selective about when to use it
                let memoResult: { hit: boolean; result?: any; newIndex?: number } = { hit: false };

                // Only use memoization for certain pattern types and when not in error recovery
                const shouldUseMemo = this.shouldUseMemoization(pattern, parentRule);

                if (shouldUseMemo) {
                    memoResult = this.getMemoized(memoKey);
                    if (memoResult.hit) {
                        this.index = memoResult.newIndex!;
                        this.silentContextStack.pop();
                        return memoResult.result;
                    }
                }

                // Update depth
                this.indentLevel++;
                this.log('patterns', `${'  '.repeat(this.indentLevel)}➤ ${pattern.type}${parentRule ? ` (${parentRule.name})` : ''}${shouldBeSilent ? ' [SILENT]' : ''} @${this.index}`);
                this.depth++;

                // Parse pattern
                let result: any = null;

                try {
                    // Skip ignored tokens
                    this.skipIgnored(parentRule?.options?.ignored);

                    // Pass to pattern handler
                    switch (pattern.type) {
                        case 'token':
                            result = this.parseToken(pattern.name, parentRule, shouldBeSilent);
                            break;
                        case 'rule':
                            result = this.parseRule(pattern.name, parentRule, shouldBeSilent);
                            break;
                        case 'repeat':
                            result = this.parseRepeat(pattern.pattern, pattern.min || 0, pattern.max || Infinity, pattern.separator, parentRule, shouldBeSilent);
                            break;
                        case 'seq':
                            result = this.parseSequence(pattern.patterns, parentRule, shouldBeSilent);
                            break;
                        case 'choice':
                            result = this.parseChoice(pattern.patterns, parentRule, shouldBeSilent);
                            break;
                        default:
                            throw new Error(`Unknown pattern type: ${(pattern as any).type}`);
                    }

                    // Log
                    const status = result !== null ? '✓' : '✗';
                    this.log('patterns', `${'  '.repeat(this.indentLevel)}${status} ${pattern.type} → ${this.index}`);

                    // Memoize result (with conditions)
                    if (shouldUseMemo) {
                        this.memoize(memoKey, result, startIndex, this.index);
                    }

                    // Return result
                    return result;
                }
                finally {
                    this.depth--;
                    this.indentLevel--;
                    this.silentContextStack.pop();
                }
            }

            private parseToken(tokenName: string, parentRule?: Rule, shouldBeSilent?: boolean): Token | null {
                this.log('tokens', `→ ${tokenName} @${this.index}`);

                // EOF check
                if (this.index >= this.tokens.length) {
                    this.log('tokens', `✗ Expected '${tokenName}', got 'EOF' @${this.index}`);

                    if (shouldBeSilent || this.isInSilentMode()) {
                        return null;
                    }

                    const error = this.createError(0x001, `Expected '${tokenName}', got 'EOF'`, this.getCurrentSpan());
                    this.handleParseError(error, parentRule, 0);
                }

                // Get current token
                const token = this.getCurrentToken();

                // Token matches - consume it
                if (token.type === tokenName) {
                    const consumedToken = { ...token };
                    this.index++;
                    this.stats.tokensProcessed++;

                    this.log('tokens', `✓ ${tokenName} = "${token.value}" @${this.index - 1}`);
                    return consumedToken;
                }

                // Token doesn't match
                this.log('tokens', `✗ Expected '${tokenName}', got '${token.type}' @${this.index}`);

                if (shouldBeSilent || this.isInSilentMode()) {
                    return null;
                }

                const error = this.createError(0x002, `Expected '${tokenName}', got '${token.type}'`, this.getCurrentSpan());
                this.handleParseError(error, parentRule, 0);
            }

            protected parseRule(ruleName: string, parentRule?: Rule, shouldBeSilent?: boolean): any {
                this.log('rules', `→ ${ruleName} @${this.index}`);

                // Get the target rule by name
                const targetRule = this.rules.get(ruleName);
                if (!targetRule) {
                    const error = new Error(`Rule '${ruleName}' not found`);
                    this.handleFatalError(error);
                    return null;
                }

                // Save current position for potential rollback
                const startIndex = this.index;
                const savedErrors = [...this.errors];

                try {
                    // Stats
                    this.stats.rulesApplied++;

                    // Parse the target rule's pattern
                    const result = this.parsePattern(targetRule.pattern, targetRule);

                    // Handle null result
                    if (result === null) {
                        if (shouldBeSilent || this.isInSilentMode()) {
                            this.log('rules', `✗ ${ruleName} (silent) @${this.index}`);
                            return null;
                        }

                        // Create error for failed rule
                        const error = this.createError(0x003, `Rule '${ruleName}' failed to match`, this.getCurrentSpan());
                        this.handleParseError(error, parentRule, 0);
                    }

                    // Apply build function if available
                    let finalResult = result;
                    if (result !== null && targetRule.options?.build) {
                        finalResult = this.safeBuild(targetRule.options.build, result);
                    }

                    this.log('rules', `✓ ${ruleName} @${this.index}`);
                    return finalResult;

                } catch (e) {
                    // Rollback on error in silent mode
                    if (shouldBeSilent || this.isInSilentMode()) {
                        this.index = startIndex;
                        this.errors = savedErrors;
                        return null;
                    }

                    // Re-throw for error handling
                    if(e instanceof Error) {
                        this.handleFatalError(e);
                    } else {
                        const error = this.createError((e as ParseError).code, (e as ParseError).msg, (e as ParseError).span);
                        this.handleParseError(error, parentRule, 0);
                    }
                }
            }

            private parseRepeat(pattern: Pattern, min = 0, max = Infinity, separator?: Pattern, parentRule?: Rule, shouldBeSilent?: boolean): any {
                this.log('verbose', `REPEAT(${min}-${max}) @${this.index}`);

                const results: any[] = [];
                const startIndex = this.index;

                // Parse pattern iterations
                while (results.length < max && this.index < this.tokens.length) {
                    const iterationStart = this.index;
                    const savedErrors = [...this.errors];

                    try {
                        // Parse the main pattern
                        const result = this.parsePattern(pattern, parentRule);

                        // Pattern failed
                        if (result === null) {
                            // Restore errors state
                            this.errors = savedErrors;

                            // Break if we can't recover or we're in silent/strict mode
                            if (shouldBeSilent || this.isInSilentMode() || pattern.silent ||
                                this.settings.errorRecovery!.mode === 'strict') {
                                break;
                            }

                            // Attempt recovery
                            this.applyRecovery(parentRule, iterationStart);
                            if (this.index === iterationStart) {
                                break; // Recovery failed, avoid infinite loop
                            }
                            continue;
                        }

                        // Pattern succeeded
                        results.push(result);

                        // Prevent infinite loop
                        if (this.index === iterationStart) {
                            this.log('verbose', `⚠ No progress in repeat, breaking @${this.index}`);
                            break;
                        }

                        // Handle separator (only between elements, not after the last one)
                        if (separator && results.length < max && this.index < this.tokens.length) {
                            const sepStart = this.index;
                            const sepSavedErrors = [...this.errors];

                            // Parse separator in silent mode first to check availability
                            const sepResult = this.parsePattern(separator, undefined);

                            if (sepResult === null) {
                                // Separator not found - this is the end of the repetition
                                this.index = sepStart;
                                this.errors = sepSavedErrors;
                                break;
                            }
                            // Separator found - continue with next iteration
                        } else if (separator && results.length >= max) {
                            // We've reached max items, no more separators needed
                            break;
                        }

                    } catch (e) {
                        // Restore state
                        this.index = iterationStart;
                        this.errors = savedErrors;

                        // Handle error based on mode
                        if (shouldBeSilent || this.isInSilentMode()) {
                            break;
                        }

                        // In strict mode or if we haven't met minimum, this is a fatal error
                        if (this.settings.errorRecovery!.mode === 'strict' || results.length < min) {
                            if(e instanceof Error) {
                                this.handleFatalError(e);
                            } else {
                                const error = this.createError((e as ParseError).code, (e as ParseError).msg, (e as ParseError).span);
                                this.handleParseError(error, parentRule, 0);
                            }
                        }

                        // Try recovery
                        this.applyRecovery(parentRule, iterationStart);
                        if (this.index === iterationStart) {
                            this.index++; // Force progress
                        }
                    }
                }

                // Check minimum requirement
                if (results.length < min) {
                    const error = this.createError(
                        0x005,
                        `Expected at least ${min} occurrences, got ${results.length}`,
                        this.getCurrentSpan()
                    );

                    if (shouldBeSilent || this.isInSilentMode()) {
                        return null;
                    }

                    this.handleParseError(error, parentRule, 0);
                }

                this.log('verbose', `REPEAT → [${results.length}] @${this.index}`);
                return results.length > 0 ? results : null;
            }

            private parseChoice(patterns: Pattern[], parentRule?: Rule, shouldBeSilent?: boolean): any {
                this.log('verbose', `CHOICE[${patterns.length}] @${this.index}`);

                const startPosition = this.index;
                const savedErrors = [...this.errors];
                let farthestIndex = this.index;
                let farthestError: ParseError | null = null;

                // Try each alternative
                for (let i = 0; i < patterns.length; i++) {
                    // Reset position for each attempt
                    this.index = startPosition;
                    this.errors = savedErrors;

                    try {
                        // Parse alternative with silent context for choice alternatives
                        const result = this.parsePattern(patterns[i], parentRule);

                        // Success - return immediately
                        if (result !== null) {
                            this.log('verbose', `CHOICE → alt ${i + 1}/${patterns.length} succeeded @${this.index}`);
                            return result;
                        }

                        // Track the farthest we progressed and collect errors
                        if (this.index > farthestIndex) {
                            farthestIndex = this.index;
                            const newErrors = this.errors.slice(savedErrors.length);
                            if (newErrors.length > 0) {
                                farthestError = newErrors[newErrors.length - 1];
                            }
                        }

                    } catch (error) {
                        // Track farthest progress even on exceptions
                        if (this.index > farthestIndex) {
                            farthestIndex = this.index;
                            farthestError = this.normalizeError(error, this.getCurrentSpan());
                        }
                    }
                }

                // All alternatives failed
                this.index = startPosition;
                this.errors = savedErrors;

                // In silent mode, just return null
                if (shouldBeSilent || this.isInSilentMode()) {
                    return null;
                }

                // Create meaningful error message
                const errorMsg = farthestError
                    ? `No matching alternative found: ${farthestError.msg}`
                    // : `No matching pattern found in choice (tried ${patterns.length} alternatives)`;
                    : `No matching pattern found in choice`;

                const error = this.createError(
                    farthestError?.code || 0x009,
                    errorMsg,
                    this.getCurrentSpan()
                );

                this.handleParseError(error, parentRule, 0);
            }

            private parseSequence(patterns: Pattern[], parentRule?: Rule, shouldBeSilent?: boolean): any {
                this.log('verbose', `SEQUENCE[${patterns.length}] @${this.index}`);

                // Empty sequence
                if (patterns.length === 0) {
                    return [];
                }

                const startPosition = this.index;
                const savedErrors = [...this.errors];
                const results: any[] = [];
                let lastPatternIndex = 0;

                try {
                    // Parse each pattern in sequence
                    for (lastPatternIndex = 0; lastPatternIndex < patterns.length; lastPatternIndex++) {
                        const pattern = patterns[lastPatternIndex];
                        const beforePatternIndex = this.index;

                        // Parse current pattern
                        const result = this.parsePattern(pattern, parentRule);

                        // Pattern failed
                        if (result === null) {
                            // In silent mode, rollback and return null
                            if (shouldBeSilent || this.isInSilentMode()) {
                                this.index = startPosition;
                                this.errors = savedErrors;
                                return null;
                            }

                            // Create descriptive error
                            const error = this.createError(
                                0x006,
                                `Sequence failed at element ${lastPatternIndex + 1}/${patterns.length}`,
                                this.getCurrentSpan()
                            );

                            this.handleParseError(error, parentRule, lastPatternIndex);
                        }

                        // Add result to sequence (maintain structure even for null results)
                        results.push(result);

                        // Progress check (less strict for sequence since some patterns might not consume tokens)
                        if (this.index === beforePatternIndex && !pattern.silent) {
                            this.log('verbose', `⚠ No progress at sequence element ${lastPatternIndex} @${this.index}`);
                        }

                        // Skip ignored tokens between sequence elements
                        this.skipIgnored(parentRule?.options?.ignored);
                    }

                    // All patterns succeeded
                    this.log('verbose', `SEQUENCE → [${results.length}] @${this.index}`);
                    return results;

                } catch (e) {
                    // Rollback on any error
                    this.index = startPosition;
                    this.errors = savedErrors;

                    // Re-throw if not in silent mode
                    if (!shouldBeSilent && !this.isInSilentMode()) {
                        if(e instanceof Error) {
                            this.handleFatalError(e);
                        } else {
                            const error = this.createError((e as ParseError).code, (e as ParseError).msg, (e as ParseError).span);
                            this.handleParseError(error, parentRule, lastPatternIndex);
                        }
                    }

                    return null;
                }
            }

            private safeBuild(buildFn: Function, matches: any): any {
                try {
                    const input = Array.isArray(matches) ? matches : [matches];
                    const result = buildFn(input);
                    return result;
                } catch (error) {
                    // Only add build errors when not in silent mode
                    if (!this.isInSilentMode()) {
                        const buildError = this.createError(
                            0x004,
                            `Build function failed: ${(error as Error).message}`,
                            this.getCurrentSpan()
                        );
                        this.addError(buildError);
                        this.log('errors', `Build error: ${(error as Error).message}`);
                    }

                    // Return original matches as fallback
                    return matches;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── SILENT MODE ───────────────────────────────┐

            private shouldBeSilent(pattern: Pattern, rule?: Rule): boolean {
                // Rule-level silent mode takes precedence
                if (rule?.options?.silent === true) {
                    return true;
                }

                // Pattern-level silent mode
                if (pattern.silent === true) {
                    return true;
                }

                // Inherit from parent context
                if (this.silentContextStack.length > 0) {
                    return this.silentContextStack[this.silentContextStack.length - 1];
                }

                return false;
            }

            private isInSilentMode(): boolean {
                return this.silentContextStack.length > 0 &&
                       this.silentContextStack[this.silentContextStack.length - 1];
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── HELP ───────────────────────────────┐

            private normalizeSettings(settings ?: ParserSettings): ParserSettings {
                const defaultSettings: ParserSettings = {
                    startRule           : 'root',
                    errorRecovery       : {
                        mode            : 'strict',
                        maxErrors       : 1,
                        syncTokens      : []
                    },
                    ignored             : ['ws'],
                    debug               : 'off',
                    maxDepth            : 1000,
                    maxCacheSize        : 1,
                };

                if(!settings) {
                    return defaultSettings;
                }

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
                }

                return refs;
            }

            private skipIgnored(ruleIgnored?: string[]): void {
                if (this.ignoredSet.size === 0 && (!ruleIgnored?.length)) {
                    return;
                }

                const combinedIgnored = ruleIgnored
                    ? new Set([...this.ignoredSet, ...ruleIgnored])
                    : this.ignoredSet;

                while (this.index < this.tokens.length) {
                    const token = this.tokens[this.index];
                    if (!combinedIgnored.has(token.type)) break;
                    this.index++;
                    this.stats.tokensProcessed++;
                }
            }

            private skipUntilTokens(tokens: string[]): void {
                const tokenSet = new Set(tokens);
                const maxIterations = 10000;
                let skipped = 0;

                while (this.index < this.tokens.length && skipped < maxIterations) {
                    const currentToken = this.tokens[this.index];

                    if (tokenSet.has(currentToken.type)) {
                        this.log('errors', `Found sync token '${currentToken.type}' @${this.index}`);
                        return;
                    }
                    this.index++;
                    skipped++;
                }
            }

            private deepClone(obj: any): any {
                if (obj === null || typeof obj !== 'object') {
                    return obj;
                }

                if (Array.isArray(obj)) {
                    return obj.map(item => this.deepClone(item));
                }

                // Handle common AST node structure
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
                this.tokens             = tokens;
                this.index              = 0;
                this.errors             = [];
                this.ast                = [];
                this.depth              = 0;
                this.errorSeq           = 0;
                this.indentLevel        = 0;
                this.silentContextStack = []; // Reset silent context

                // Reset memoization
                this.memoCache.clear();
                this.memoHits           = 0;
                this.memoMisses         = 0;

                this.stats              = {
                    tokensProcessed     : 0,
                    rulesApplied        : 0,
                    errorsRecovered     : 0,
                    parseTimeMs         : 0
                };
            }

            private getCurrentToken() : Token {
                return this.tokens[this.index];
            }

            private getCurrentSpan(): Span {
                // Before any parsing
                if (this.index === 0) {
                    if (this.tokens.length > 0) {
                        return {
                            start: this.tokens[0].span.start,
                            end: this.tokens[0].span.start
                        };
                    }
                    return { start: 0, end: 0 };
                }

                // After parsing - get the span of current position
                if (this.index >= this.tokens.length) {
                    // End of tokens - use last token's end
                    const lastToken = this.tokens[this.tokens.length - 1];
                    return {
                        start: lastToken.span.end,
                        end: lastToken.span.end
                    };
                }

                // Current token span
                const currentToken = this.tokens[this.index];
                return currentToken.span;
            }

            isNextToken(type: string, ignoredTokens?: string[]): boolean {
                ignoredTokens = [...(ignoredTokens ?? []), ...this.settings.ignored!];
                let currentIndex = this.index;

                while (currentIndex < this.tokens.length) {
                    const currentToken = this.tokens[currentIndex];
                    if (currentToken.type == type) {
                        return true;
                    }
                    if (ignoredTokens.includes(currentToken.type)) {
                        currentIndex++;
                    } else {
                        break;
                    }
                }
                return false;
            }

            isPrevToken(type: string, ignoredTokens?: string[]): boolean {
                ignoredTokens = [...(ignoredTokens ?? []), ...this.settings.ignored!];
                let currentIndex = this.index - 1;

                while (currentIndex >= 0) {
                    const currentToken = this.tokens[currentIndex];
                    if (currentToken.type == type) {
                        return true;
                    }
                    if (ignoredTokens.includes(currentToken.type)) {
                        currentIndex--;
                    } else {
                        break;
                    }
                }
                return false;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── ERROR ──────────────────────────────┐

            private createError(code: number, msg: string, span?: Span): ParseError {
                return {
                    code,
                    msg,
                    span: span || this.getCurrentSpan()
                };
            }

            private addError(error: ParseError): void {
                // Don't add errors in silent mode
                if (this.isInSilentMode()) {
                    return;
                }

                // Check maximum error limit
                const maxErrors = this.settings.errorRecovery!.maxErrors!;
                if (maxErrors !== 0 && this.errors.length >= maxErrors) {
                    return;
                }

                // In strict mode, only allow one error
                if (this.settings.errorRecovery!.mode === 'strict' && this.errors.length > 0) {
                    return;
                }

                this.errors.push(error);
                this.log('errors', `⚠ ${error.msg} @${error.span.start}:${error.span.end}`);
            }

            private handleParseError(error: ParseError, rule?: Rule, failedAt: number = 0): never {
                // Try to get custom error from rule
                const finalError = this.getCustomErrorOr(rule, error, failedAt);
                throw finalError;
            }

            private handleFatalError(error: any): void {
                const parseError = this.normalizeError(error, this.getCurrentSpan());
                this.addError(parseError);
                this.log('errors', `💥 Fatal error: ${parseError.msg} @${this.index}`);
            }

            private getCustomErrorOr(rule: Rule | null | undefined, defaultError: ParseError, failedAt: number = 0): ParseError {
                if (!rule?.options?.errors) {
                    return defaultError;
                }

                // Try to find matching error handler
                for (const errorHandler of rule.options.errors) {
                    let matches = false;

                    if (typeof errorHandler.cond === 'number') {
                        matches = (failedAt === errorHandler.cond);
                    } else if (typeof errorHandler.cond === 'function') {
                        try {
                            matches = errorHandler.cond(this, failedAt, false);
                        } catch {
                            matches = false;
                        }
                    }

                    if (matches) {
                        return this.createError(
                            errorHandler.code || 0x007,
                            errorHandler.msg,
                            defaultError.span
                        );
                    }
                }

                return defaultError;
            }

            private normalizeError(error: any, defaultSpan: Span): ParseError {
                // Already a ParseError
                if (error && typeof error === 'object' && 'msg' in error && 'code' in error && 'span' in error) {
                    return error as ParseError;
                }

                // Regular Error
                if (error instanceof Error) {
                    return this.createError(0x404, error.message, defaultSpan);
                }

                // Unknown error type
                return this.createError(0x500, `Unknown error: ${error}`, defaultSpan);
            }

            private applyRecovery(rule?: Rule, startIndex?: number): void {
                const recovery = rule?.options?.recovery;

                if (recovery) {
                    this.applyRecoveryStrategy(recovery);
                } else {
                    this.defaultErrorRecovery();
                }

                this.stats.errorsRecovered++;

                // Prevent infinite loops
                if (startIndex !== undefined && this.index === startIndex && this.index < this.tokens.length) {
                    this.index++;
                }
            }

            private applyRecoveryStrategy(strategy: RecoveryStrategy): void {
                const beforePos = this.index;
                this.log('errors', `🔧 Recovery: ${strategy.type} @${beforePos}`);

                switch (strategy.type) {
                    case 'panic':
                        this.defaultErrorRecovery();
                        break;
                    case 'skipUntil':
                        const tokens = strategy.tokens || (strategy.token ? [strategy.token] : []);
                        this.skipUntilTokens(tokens);
                        break;
                    default:
                        this.defaultErrorRecovery();
                }

                this.log('errors', `Recovery: ${beforePos} → ${this.index}`);
            }

            private defaultErrorRecovery(): void {
                const syncTokens = this.settings.errorRecovery!.syncTokens!;

                if (syncTokens.length > 0) {
                    this.skipUntilTokens(syncTokens);
                } else if (this.index < this.tokens.length) {
                    this.index++;
                }
            }

        // └─────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── DEBUG ──────────────────────────────┐

            private log(level: DebugLevel, message: string): void {
                if (this.debugLevel === 'off') return;

                const levels: DebugLevel[] = ['off', 'errors', 'rules', 'patterns', 'tokens', 'verbose'];
                const currentIndex = levels.indexOf(this.debugLevel);
                const messageIndex = levels.indexOf(level);

                if (messageIndex <= currentIndex) {
                    const prefix = this.getDebugPrefix(level);
                    console.log(`${prefix} ${message}`);
                }
            }

            private getDebugPrefix(level: DebugLevel): string {
                const prefixes: { [key: string]: string } = {
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
                this.tokens     = [];
                this.ast        = [];
                this.errors     = [];
                this.silentContextStack = [];
            }

            private cleanMemoCache(): void {
                const entries = Array.from(this.memoCache.entries());
                const now = Date.now();

                // Remove old entries and invalid ones
                const validEntries = entries.filter(([key, value]) => {
                    // Remove entries older than 1 second (adjust as needed)
                    if (now - (value.cachedAt || 0) > 1000) {
                        return false;
                    }

                    // Remove entries that don't match current parsing context
                    if (value.errorCount !== this.errors.length) {
                        return false;
                    }

                    return true;
                });

                // Keep only half of the valid entries (LRU-like)
                const keepCount = Math.floor(validEntries.length / 2);

                this.memoCache.clear();

                // Keep the more recent entries
                for (let i = validEntries.length - keepCount; i < validEntries.length; i++) {
                    this.memoCache.set(validEntries[i][0], validEntries[i][1]);
                }

                this.log('verbose', `🧹 Memo cache cleaned: kept ${keepCount} of ${entries.length} entries`);
            }

            private createMemoKey(patternType: string, patternData: any, position: number, ruleName?: string): string {
                // Include silent context in key
                const silentContext = this.isInSilentMode() ? 'S' : 'L'; // S=Silent, L=Loud

                // Include error recovery state (simplified)
                const errorContext = this.errors.length > 0 ? `E${this.errors.length}` : 'E0';

                // Create base key with context
                const baseKey = `${patternType}:${position}:${silentContext}:${errorContext}`;

                if (ruleName) {
                    // For rules, include rule-specific context
                    const rule = this.rules.get(ruleName);
                    const ruleContext = this.getRuleContext(rule);
                    return `rule:${ruleName}:${ruleContext}:${baseKey}`;
                }

                // For patterns, include pattern-specific data
                switch (patternType) {
                    case 'token':
                        return `${baseKey}:${patternData.name}`;
                    case 'repeat':
                        return `${baseKey}:${patternData.min || 0}:${patternData.max || 'inf'}:${patternData.separator ? 'sep' : 'nosep'}`;
                    case 'seq':
                    case 'choice':
                        // Include pattern count and a simple hash of pattern types
                        const patternHash = this.hashPatterns(patternData.patterns || []);
                        return `${baseKey}:${patternData.patterns?.length || 0}:${patternHash}`;
                    default:
                        return baseKey;
                }
            }

            private getRuleContext(rule?: Rule): string {
                if (!rule) return 'none';

                // Create a simple hash of rule characteristics that affect parsing
                const hasBuilder = rule.options?.build ? 'B' : '';
                const hasErrors = rule.options?.errors?.length ? 'E' : '';
                const hasRecovery = rule.options?.recovery ? 'R' : '';
                const isSilent = rule.options?.silent ? 'S' : '';

                return `${hasBuilder}${hasErrors}${hasRecovery}${isSilent}`;
            }

            private hashPatterns(patterns: Pattern[]): string {
                // Simple hash based on pattern types and structure
                return patterns.map(p => `${p.type}${p.silent ? 'S' : ''}`).join('');
            }

            private getMemoized(key: string): { hit: boolean; result?: any; newIndex?: number } {
                if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {
                    return { hit: false };
                }

                const cached = this.memoCache.get(key);
                if (cached !== undefined) {
                    // Additional validation: ensure the cached result is still valid
                    if (this.isCachedResultValid(cached, key)) {
                        this.memoHits++;
                        this.log('verbose', `🔋 Memo HIT: ${key} → ${cached.newIndex}`);
                        return { hit: true, result: cached.result, newIndex: cached.newIndex };
                    } else {
                        // Invalid cached result, remove it
                        this.memoCache.delete(key);
                        this.log('verbose', `🗑️ Memo INVALID: ${key}`);
                    }
                }

                this.memoMisses++;
                return { hit: false };
            }

            private isCachedResultValid(cached: any, key: string): boolean {
                // Basic sanity checks
                if (typeof cached.newIndex !== 'number' || cached.newIndex < 0) {
                    return false;
                }

                // Don't use cached results that would go beyond current token length
                if (cached.newIndex > this.tokens.length) {
                    return false;
                }

                // Additional checks can be added here based on your specific needs
                return true;
            }

            private memoize(key: string, result: any, startIndex: number, endIndex: number): void {
                if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {
                    return;
                }

                // Don't memoize results that made no progress and failed
                // This prevents caching failed attempts that might succeed later
                if (result === null && startIndex === endIndex) {
                    this.log('verbose', `⚠️ Skip memo (no progress): ${key}`);
                    return;
                }

                // Don't memoize if we're in an error recovery state
                // Error recovery can change parsing behavior
                if (this.errors.length > 0 && this.stats.errorsRecovered > 0) {
                    this.log('verbose', `⚠️ Skip memo (error state): ${key}`);
                    return;
                }

                // Clean cache if it gets too large
                if (this.memoCache.size >= this.settings.maxCacheSize * 0.9) {
                    this.cleanMemoCache();
                }

                const memoEntry = {
                    result: this.deepClone(result), // Clone to avoid reference issues
                    newIndex: endIndex,
                    // Store additional metadata for validation
                    cachedAt: Date.now(),
                    silentContext: this.isInSilentMode(),
                    errorCount: this.errors.length
                };

                this.memoCache.set(key, memoEntry);
                this.log('verbose', `📝 Memo SET: ${key} → ${endIndex}`);
            }

            private shouldUseMemoization(pattern: Pattern, parentRule?: Rule): boolean {
                // Don't memoize during error recovery
                if (this.stats.errorsRecovered > 0 && this.errors.length > 0) {
                    return false;
                }

                // Don't memoize for simple tokens (overhead not worth it)
                if (pattern.type === 'token') {
                    return false;
                }

                // Don't memoize recursive rules to avoid infinite loops
                if (pattern.type === 'rule' && this.isRecursiveContext(pattern.name)) {
                    return false;
                }

                // For complex patterns and rules, memoization is beneficial
                return pattern.type === 'rule' ||
                    pattern.type === 'choice' ||
                    pattern.type === 'seq' ||
                    (pattern.type === 'repeat' && (pattern.min > 1 || pattern.max > 1));
            }

            private isRecursiveContext(ruleName: string): boolean {
                // Simple check: if we're already parsing this rule in our call stack
                // This is a basic implementation - you might need more sophisticated detection

                // Count how many times this rule appears in current parsing context
                // by checking if we're deeply nested in the same rule
                return this.depth > 10; // Simple heuristic - adjust based on your grammar
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════════════╝



// ╔═══════════════════════════════════════════ MAIN ════════════════════════════════════════════╗

    /**
     * Parses an array of tokens using the provided rules and settings.
     * @param tokens    - The array of tokens to parse.
     * @param rules     - The set of rules to use for parsing.
     * @param settings  - Additional settings to customize parsing behavior.
     *
     * @returns The result of the parsing operation, including the parsed AST and any errors encountered.
    */
    export function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult {
        // create new parser
        const parser = new Parser(rules, settings);

        // parse
        try     { return parser.parse(tokens); }
        finally { parser.dispose(); }
    }

    /**
     * Creates a rule definition object.
     * @param name      - The name of the rule.
     * @param pattern   - The pattern to match against.
     * @param options   - Additional options for the rule.
     *
     * @returns A rule definition object.
     *
     * @throws  Throws an error if `name` is falsy or not a string.
     * @throws  Throws an error if `pattern` is falsy or not an object.
     */
    export function createRule(name: string, pattern: Pattern, options?: Rule['options']): Rule {
        if (!name || typeof name !== 'string') {
            throw new Error('Rule name must be a non-empty string');
        }
        if (!pattern || typeof pattern !== 'object') {
            throw new Error('Rule pattern must be an object');
        }
        return { name, pattern, options };
    }


    // ════ Pattern Combinators ════


    /**
     * Creates a pattern that matches a specific token.
     *
     * @param {string} name             - The name of the token to match.
     * @param {boolean} [silent=false]  - A flag that indicates whether the matched token should be ignored during parsing (silent mode).
     *
     * @returns {Pattern} The pattern object representing the token.
     *
     * @throws {Error} Throws an error if `name` is falsy or not a string.
    */
    export function token(name: string, silent: boolean = false): Pattern {
        if (!name || typeof name !== 'string') {
            throw new Error('Token name must be a non-empty string');
        }
        return { type: 'token', name, silent };
    }

    /**
     * Creates a new pattern that matches a rule definition.
     *
     * @param {string} name             - The name of the rule to match.
     * @param {boolean} [silent=false]  - A flag that indicates whether the matched rule should be ignored during parsing (silent mode).
     *
     * @returns {Pattern} A pattern object that matches the specified rule.
     *
     * @throws {Error} Throws an error if `name` is falsy or not a string.
    */
    export function rule(name: string, silent: boolean = false): Pattern {
        if (!name || typeof name !== 'string') {
            throw new Error('Rule name must be a non-empty string');
        }
        return { type: 'rule', name, silent };
    }

    /**
     * Creates a new pattern that matches a specified number of occurrences of the given pattern.
     *
     * @param {Pattern} pattern         - The pattern to match.
     * @param {number} [min=0]          - The minimum number of times the pattern must be matched.
     * @param {number} [max=Infinity]   - The maximum number of times the pattern can be matched.
     * @param {Pattern} [separator]     - A pattern to match between occurrences.
     * @param {boolean} [silent=false]  - A flag that indicates whether the matched text should be hidden in the output.
     *
     * @returns {Pattern} A new pattern that matches between `min` and `max` occurrences of the given pattern.
     *
     * @throws {Error} Throws an error if `min` is negative or `max` is less than `min`.
    */
    export function repeat(pattern: Pattern, min = 0, max = Infinity, separator?: Pattern, silent: boolean = false): Pattern {
        if (min < 0) {
            throw new Error('Minimum repetition count cannot be negative');
        }
        if (max < min) {
            throw new Error('Maximum repetition count cannot be less than minimum');
        }
        return { type: 'repeat', pattern, min, max, separator, silent };
    }

    /**
     * Creates a new pattern that matches one or more occurrences of the given pattern.
     *
     * @param {Pattern} pattern         - The pattern to match one or more times.
     * @param {Pattern} [separator]     - A pattern to match between occurrences.
     * @param {boolean} [silent=false]  - A flag that indicates whether the matched text should be hidden in the output.
     *
     * @return {Pattern} A new pattern that matches one or more occurrences of the given pattern.
    */
    export function oneOrMore(pattern: Pattern, separator?: Pattern, silent: boolean = false): Pattern {
        return repeat(pattern, 1, Infinity, separator, silent);
    }

    /**
     * Creates a new pattern that matches zero or more occurrences of the given pattern.
     *
     * @param {Pattern} pattern         - The pattern to match zero or more times.
     * @param {Pattern} [separator]     - A pattern to match between occurrences.
     * @param {boolean} [silent=false]  - A flag that indicates whether the matched text should be hidden in the output.
     *
     * @return {Pattern} A new pattern that matches zero or more occurrences of the given pattern.
    */
    export function zeroOrMore(pattern: Pattern, separator?: Pattern, silent: boolean = false): Pattern {
        return repeat(pattern, 0, Infinity, separator, silent);
    }

    /**
     * Creates a new pattern that matches zero or one occurrence of the given pattern.
     *
     * @param {Pattern} pattern         - The pattern to match zero or one time.
     * @param {Pattern} [separator]     - A pattern to match between occurrences.
     * @param {boolean} [silent=true]   - A flag that indicates whether the matched text should be hidden in the output.
     *
     * @return {Pattern} A new pattern that matches zero or one occurrence of the given pattern.
    */
    export function zeroOrOne(pattern: Pattern, separator?: Pattern, silent: boolean = true): Pattern {
        return repeat(pattern, 0, 1, separator, silent);
    }

    /**
     * Matches a single occurrence of the given pattern. If the pattern fails to match, it will return an array with
     * a single error. This is useful when you want to ensure that a pattern is matched once and only once, and if it
     * fails to match, you want to return a specific error.
     *
     * @param {Pattern} pattern         - The pattern to match.
     * @param {boolean} [silent=false]  - Whether the pattern should be silent (not fail on error).
     *
     * @return {Pattern} A pattern that matches the given pattern exactly once.
     *
     * @example
     * // Example usage of errorOrArrayOfOne:
     * parser.createRule('Expression',
     *     parser.errorOrArrayOfOne(parser.silent(parser.rule('PrimaryExpression'))),
     *     {
     *         build: (matches) => {
     *             return {
     *                 kind    : 'Expression',
     *                 span    : matches[0] && matches[0].span ? matches[0].span : { start: 0, end: 0 },
     *                 body    : matches[0]
     *             };
     *         },
     *
     *         silent: false,
     *
     *         errors: [parser.error(0, "Expected Expression")],
     *     }
     * ),
     *
     * // If the pattern fails to match, it will return just one error: "Expected Expression".
    */
    export function errorOrArrayOfOne(pattern: Pattern, silent: boolean = false): Pattern {
        return repeat(pattern, 1, 1, undefined, silent);
    }

    /**
     * Creates a new pattern that matches zero or one occurrence of the given pattern.
     *
     * @param {Pattern} pattern     - The pattern to match zero or one time.
     *
     * @return {Pattern} A new pattern that matches zero or one occurrence of the given pattern.
    */
    export function optional(pattern: Pattern): Pattern {
        return repeat(pattern, 0, 1, undefined, true);
    }

    /**
     * Creates a new pattern that matches one of multiple patterns. Throws an error if the choice has no patterns.
     *
     * @param {...Pattern} patterns     - The patterns to match, at least one is required.
     *
     * @return {Pattern} A new pattern that matches one of the given patterns.
     *
     * @throws {Error} Throws an error if the choice has no patterns.
     */
    export function choice(...patterns: Pattern[]): Pattern {
        if (patterns.length === 0) {
            throw new Error('Choice must have at least one pattern');
        }
        return { type: 'choice', patterns, silent: false };
    }

    /**
     * Creates a new pattern that matches multiple patterns in sequence. Throws an error if the sequence has no patterns.
     *
     * @param {...Pattern} patterns     - The patterns to match in sequence.
     *
     * @return {Pattern} A new pattern that matches the given patterns in sequence.
     *
     * @throws {Error} Throws an error if the sequence has no patterns.
    */
    export function seq(...patterns: Pattern[]): Pattern {
        if (patterns.length === 0) {
            throw new Error('Sequence must have at least one pattern');
        }
        return { type: 'seq', patterns, silent: false };
    }


    // ════ Silent Mode Helpers ════


    /**
     * Creates a new pattern that matches the given pattern but is not outputted
     * in the AST.
     *
     * @param {Pattern} pattern     - The pattern to match but not output.
     *
     * @return {Pattern} A new pattern that matches the given pattern but is not
     * outputted in the AST.
     */
    export function silent<T extends Pattern>(pattern: T): T {
        return { ...pattern, silent: true };
    }

    /**
     * Creates a new pattern that matches the given pattern and is outputted in
     * the AST.
     *
     * @param {Pattern} pattern     - The pattern to match and output.
     *
     * @return {Pattern} A new pattern that matches the given pattern and is
     * outputted in the AST.
     */
    export function loud<T extends Pattern>(pattern: T): T {
        return { ...pattern, silent: false };
    }


    // ════ Error Handling ════


    /**
     * Creates a new ErrorHandler pattern that matches when the given condition is true
     * and throws an error with the given message and code.
     *
     * @param {ErrorHandler['cond']} cond   - The condition function that determines if the error should be thrown.
     * @param {string} msg                  - The error message to throw.
     * @param {number} [code=0x999]         - The error code to throw.
     *
     * @return {ErrorHandler} A new ErrorHandler pattern that matches the given condition and throws an error.
     */
    export function error( cond: ErrorHandler['cond'], msg: string, code?: number, ): ErrorHandler {
        return { cond, msg, code: code ?? 0x999 };
    }

    /**
     * A collection of error recovery strategies.
     *
     * @type {Object}
     * @property {RecoveryStrategy} panicMode - Creates a recovery strategy that stops parsing and throws an error with code 0xAAA.
     * @property {RecoveryStrategy} skipUntil - Creates a recovery strategy that skips input tokens until it finds any of the given tokens.
    */
    export const errorRecoveryStrategies = {
        /**
         * Creates a recovery strategy that stops parsing and throws an error with code 0xAAA.
         *
         * @return {RecoveryStrategy} A recovery strategy that stops parsing.
         */
        panicMode(): RecoveryStrategy {
            return { type: 'panic' };
        },

        /**
         * Creates a recovery strategy that skips input tokens until it finds any of the given tokens.
         *
         * @param {string | string[]} tokens - The tokens to skip until.
         * @return {RecoveryStrategy} A recovery strategy that skips input tokens until it finds any of the given tokens.
         */
        skipUntil(tokens: string | string[]): RecoveryStrategy {
            return { type: 'skipUntil', tokens: Array.isArray(tokens) ? tokens : [tokens] };
        },
    };


    // ════ Helpers ════


    /**
     * Returns the smallest span that encompasses all the given matches, or the span of the first match
     * if there are no matches.
     *
     * @param {any[]} matches - An array of matches each containing a span property.
     *
     * @return {Span | undefined} The smallest span that encompasses all the given matches, or the span
     * of the first match if there are no matches.
     */
    export function getMatchesSpan(matches: any[]): Span {
        const default_span = { start: 0, end: 0};
        if (!matches || matches.length === 0) {
            return default_span;
        }

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

    /**
     * Returns a new object that is a shallow copy of the given 'res' object, but without the 'span' property.
     *
     * @param {any} res - An object to be copied, with any 'span' property removed.
     *
     * @return {any} A new object that is a shallow copy of the given 'res' object, but without the 'span' property.
     */
    export function resWithoutSpan(res: any): any {
        const result = { ...res };
        delete result.span;
        return result;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════════════╝