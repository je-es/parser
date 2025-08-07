// parser.ts — Advanced syntax analyzer that converts tokens
//             into AST with customizable grammar rules and intelligent error detection.
//
// repo   : https://github.com/je-es/parser
// author : https://github.com/maysara-elshewehy
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    /** Represents a token with type, value and position information */
    export interface Token {
        type            : string;
        value           : string | null;
        pos             : Position;
    }

    /** Represents a position in the source text */
    export interface Position {
        line            : number;
        col             : number;
        offset          : number;
    }

    export interface ParseError {
        message         : string;
        position        : Position;
        suggestions    ?: string[];
        context        ?: string;
        severity       ?: 'error' | 'warning' | 'info';
        code           ?: string;
        range          ?: { start: Position; end: Position };
    }

    export interface AstNode {
        type            : string;
        pos            ?: Position;
        child          ?: AstNode[];
        value          ?: string | number | boolean | null;
        meta           ?: Record<string, unknown>;
    }

    export interface ParseResult {
        ast             : AstNode[];
        errors          : ParseError[];
        statistics     ?: ParseStatistics;
    }

    export interface ParseStatistics {
        tokensProcessed : number;
        rulesApplied    : number;
        errorsRecovered : number;
        parseTimeMs     : number;
        memoryUsedKB   ?: number;
        cacheHitRate   ?: number;
    }

    export interface ParserSettings {
        startRule       : string;
        errorRecovery   : {
            mode        : 'strict' | 'resilient';
            maxErrors   : number;
            syncTokens  : string[];
        };
        ignored         : string[];
        debug           : boolean;
        maxDepth        : number;
        enableMemoization: boolean;
        maxCacheSize    : number;
        enableProfiling : boolean;
    }

    export interface Pattern {
        type            : 'token' | 'rule' | 'seq' | 'choice' | 'repeat' | 'optional';
        [key: string]   : any;
    }

    export interface Rule {
        name            : string;
        pattern         : Pattern;
        options        ?: {
            build      ?: (matches: any[]) => any;
            errors     ?: ErrorHandler[];
            recovery   ?: RecoveryStrategy;
            ignored    ?: string[];
            memoizable ?: boolean;
        };
    }

    export type Rules = Rule[];

    export interface ErrorHandler {
        condition       : (parser: Parser, failedAt: number) => boolean;
        message         : string;
        suggestions     : string[];
        code           ?: string;
        severity       ?: 'error' | 'warning' | 'info';
    }

    export interface RecoveryStrategy {
        type            : 'panic' | 'skipUntil' | 'insertToken' | 'deleteToken';
        tokens         ?: string[];
        token          ?: string;
        insertValue    ?: string;
    }

    interface MemoEntry {
        result          : any;
        endPosition     : number;
        errors          : ParseError[];
        timestamp       : number;
    }

    interface LoopDetectionState {
        visitedPositions: Set<number>;
        iterationCount  : number;
        lastProgress    : number;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Parser {
        private tokens      : Token[]                       = [];
        private ast         : AstNode[]                     = [];
        private position    : number                        = 0;
        private rules       : Map<string, Rule>;
        private settings    : ParserSettings;
        private depth       : number                        = 0;
        public errors       : ParseError[]                  = [];

        // Performance optimizations
        private memoCache   : Map<string, MemoEntry>        = new Map();
        private nodePool    : AstNode[]                     = [];
        private ignoredSet  : Set<string>                   = new Set();
        private ruleSet     : Set<string>                   = new Set();

        // Statistics and profiling
        private stats       : ParseStatistics;
        private startTime   : number                        = 0;
        private cacheHits   : number                        = 0;
        private cacheMisses : number                        = 0;

        // Safety and robustness
        private maxIterations: number                       = 10000;
        private disposed    : boolean                       = false;

        constructor(rules: Rule[], settings: ParserSettings) {
            this.validateInput(rules, settings);

            this.rules = new Map();
            for (const rule of rules) {
                this.rules.set(rule.name, rule);
                this.ruleSet.add(rule.name);
            }

            this.settings = this.normalizeSettings(settings);
            this.ignoredSet = new Set([...this.settings.ignored]);
            this.errors = [];

            this.stats = {
                tokensProcessed: 0,
                rulesApplied: 0,
                errorsRecovered: 0,
                parseTimeMs: 0
            };

            // Validate grammar
            const grammarIssues = this.validateGrammar();
            if (grammarIssues.length > 0) {
                throw new Error(`Grammar validation failed: ${grammarIssues.join(', ')}`);
            }
        }

        // ════ Main ════

        /**
         * Parses an array of tokens into an AST using the configured grammar rules.
         * @param tokens Array of tokens to parse
         * @returns ParseResult containing the AST and any parsing errors
         */
        parse(tokens: Token[]): ParseResult {
            if (this.disposed) {
                throw new Error('Parser has been disposed and cannot be reused');
            }

            this.startTime = Date.now();
            this.debug(`Starting parse with ${tokens.length} tokens`);

            this.resetState(tokens);

            if (tokens.length === 0) {
                return this.createResult();
            }

            try {
                const startRule = this.rules.get(this.settings.startRule);
                if (!startRule) {
                    throw new Error(`Start rule '${this.settings.startRule}' not found`);
                }

                this.skipIgnored();
                const result = this.parsePattern(startRule.pattern, startRule);

                if (result !== null) {
                    // Apply build function if available
                    if (startRule.options?.build) {
                        const processed = this.safeBuild(startRule.options.build, result);
                        if (processed !== null) {
                            this.ast.push(processed);
                        }
                    } else {
                        this.ast.push(result);
                    }
                }

                // Check if there are unparsed tokens (unless in resilient mode with errors)
                this.skipIgnored();
                if (this.position < this.tokens.length && this.settings.errorRecovery.mode === 'strict') {
                    this.addError({
                        message: `Unexpected token '${this.tokens[this.position].type}'`,
                        position: this.getCurrentPosition(),
                        suggestions: ['Check for missing operators or delimiters'],
                        context: this.getContext(),
                        code: 'E001'
                    });
                }

            } catch (error: any) {
                this.addError({
                    message: error.message,
                    position: this.getCurrentPosition(),
                    context: this.getContext(),
                    code: 'E000'
                });
            }

            return this.createResult();
        }

        // ════ Help ════

        private parsePattern(pattern: Pattern, rule?: Rule): any {
            if (this.depth > this.settings.maxDepth) {
                throw new Error('Maximum parsing depth exceeded');
            }

            this.debug(`[parsePattern] Attempting to parse pattern type: ${pattern.type} at position ${this.position}, depth: ${this.depth}`);
            this.depth++;

            try {
                this.skipIgnored(rule?.options?.ignored);

                switch (pattern.type) {
                    case 'token':
                        return this.parseToken(pattern.name);

                    case 'rule':
                        return this.parseRule(pattern.name);

                    case 'seq':
                        return this.parseSequence(pattern.patterns, rule);

                    case 'choice':
                        return this.parseChoice(pattern.patterns, rule);

                    case 'repeat':
                        return this.parseRepeat(pattern.pattern, pattern.min || 0, pattern.max || Infinity, pattern.separator, rule);

                    case 'optional':
                        return this.parseOptional(pattern.pattern, rule);

                    default:
                        throw new Error(`Unknown pattern type: ${(pattern as any).type}`);
                }
            } finally {
                this.depth--;
            }
        }

        private parseToken(tokenName: string): Token | null {
            if (this.position >= this.tokens.length) {
                this.debug(`[parseToken] End of tokens reached while looking for: ${tokenName}`);
                return null;
            }

            const token = this.tokens[this.position];
            this.debug(`[parseToken] Looking for '${tokenName}', found '${token.type}' at position ${this.position}`);

            if (token.type === tokenName) {
                this.position++;
                this.stats.tokensProcessed++;
                this.skipIgnored();
                this.debug(`[parseToken] Successfully matched token '${tokenName}'`);
                return token;
            }

            return null;
        }

        private parseSequence(patterns: Pattern[], rule?: Rule): any {
            this.debug(`[parseSequence] Starting sequence parse with ${patterns.length} patterns at position ${this.position}`);
            const results: any[] = [];
            const savedPosition = this.position;
            const savedErrorCount = this.errors.length;

            for (let i = 0; i < patterns.length; i++) {
                this.debug(`[parseSequence] Parsing pattern ${i + 1}/${patterns.length} of type ${patterns[i].type}`);

                const result = this.parsePattern(patterns[i]);
                if (result === null) {
                    this.debug(`[parseSequence] Pattern ${i + 1} failed at position ${this.position}`);

                    // Handle sequence failure
                    if (rule?.options?.errors) {
                        this.handleRuleError(rule, i);
                    }

                    if (this.settings.errorRecovery.mode === 'strict') {
                        this.position = savedPosition;
                        return null;
                    } else {
                        // In resilient mode, apply recovery and return failure
                        if (rule?.options?.recovery) {
                            this.debug(`[parseSequence] Applying recovery strategy`);
                            this.applyRecoveryStrategy(rule.options.recovery);
                            this.stats.errorsRecovered++;
                        } else {
                            this.defaultErrorRecovery();
                        }
                        return null;
                    }
                }
                results.push(result);
            }

            this.debug(`[parseSequence] Successfully parsed all ${patterns.length} patterns`);
            return results;
        }

        private parseChoice(patterns: Pattern[], rule?: Rule): any {
            const savedPosition = this.position;
            const savedErrorCount = this.errors.length;

            for (let i = 0; i < patterns.length; i++) {
                this.position = savedPosition;

                try {
                    const result = this.parsePattern(patterns[i]);
                    if (result !== null) {
                        return result;
                    }
                } catch (error) {
                    // Continue to next choice, but preserve position
                    this.position = savedPosition;
                    // Remove any errors added during this attempt in resilient mode
                    if (this.settings.errorRecovery.mode === 'resilient') {
                        this.errors.length = savedErrorCount;
                    }
                }
            }

            this.position = savedPosition;
            return null;
        }

        private parseRepeat(pattern: Pattern, min: number = 0, max: number = Infinity, separator?: Pattern, rule?: Rule): any[] {
            const results: any[] = [];
            let separatorConsumed = false;
            const loopState: LoopDetectionState = {
                visitedPositions: new Set(),
                iterationCount: 0,
                lastProgress: this.position
            };

            while (results.length < max && this.position < this.tokens.length && loopState.iterationCount < this.maxIterations) {
                const iterationStartPosition = this.position;
                loopState.iterationCount++;

                // Enhanced infinite loop detection
                if (this.detectInfiniteLoop(loopState)) {
                    this.debug(`[parseRepeat] Infinite loop detected at position ${this.position}`);
                    this.addError({
                        message: 'Infinite loop detected in repeat pattern',
                        position: this.getCurrentPosition(),
                        code: 'E002'
                    });
                    break;
                }

                // Handle separator
                if (separator && results.length > 0) {
                    const savedPosition = this.position;
                    const sepResult = this.parsePattern(separator);
                    if (sepResult === null) {
                        this.position = savedPosition;
                        break;
                    }
                    separatorConsumed = true;
                }

                const beforePatternPosition = this.position;
                const result = this.parsePattern(pattern);

                if (result === null) {
                    this.debug(`[parseRepeat] Pattern failed at position ${this.position}, iteration ${results.length}`);

                    if (separatorConsumed && this.settings.errorRecovery.mode === 'strict') {
                        throw new Error(`Expected pattern after separator`);
                    }

                    if (this.settings.errorRecovery.mode === 'resilient' && this.position > beforePatternPosition) {
                        separatorConsumed = false;
                        continue;
                    }

                    break;
                }

                this.debug(`[parseRepeat] Successfully parsed iteration ${results.length + 1}`);
                results.push(result);
                separatorConsumed = false;
                loopState.lastProgress = this.position;

                // Additional safety check
                if (this.position === iterationStartPosition && result !== null) {
                    this.debug(`[parseRepeat] No progress made despite successful match, breaking`);
                    break;
                }
            }

            this.debug(`[parseRepeat] Completed with ${results.length} results (min: ${min})`);

            // Check minimum requirement
            if (results.length < min) {
                if (this.settings.errorRecovery.mode === 'resilient') {
                    this.addError({
                        message: `Expected at least ${min} occurrences, got ${results.length}`,
                        position: this.getCurrentPosition(),
                        context: this.getContext(),
                        code: 'E003'
                    });
                    return results;
                } else {
                    throw new Error(`Expected at least ${min} occurrences, got ${results.length}`);
                }
            }

            return results;
        }

        private parseOptional(pattern: Pattern, rule?: Rule): any {
            const savedPosition = this.position;
            const savedErrorCount = this.errors.length;

            try {
                const result = this.parsePattern(pattern);
                return result;
            } catch (error) {
                this.position = savedPosition;
                // Remove errors added during optional parsing
                this.errors.length = savedErrorCount;
                return null;
            }
        }

        private parseRule(ruleName: string): any {
            this.debug(`[parseRule] Parsing rule: ${ruleName} at position ${this.position}`);

            const rule = this.rules.get(ruleName);
            if (!rule) {
                throw new Error(`Rule '${ruleName}' not found`);
            }

            // Check memoization
            if (this.settings.enableMemoization && rule.options?.memoizable !== false) {
                const memoKey = this.getMemoKey(ruleName, this.position);
                const memoEntry = this.memoCache.get(memoKey);

                if (memoEntry && (Date.now() - memoEntry.timestamp) < 5000) { // 5 second TTL
                    this.debug(`[parseRule] Cache hit for rule '${ruleName}' at position ${this.position}`);
                    this.position = memoEntry.endPosition;
                    this.cacheHits++;
                    return memoEntry.result;
                }
                this.cacheMisses++;
            }

            const savedPosition = this.position;
            const startErrorCount = this.errors.length;

            try {
                this.stats.rulesApplied++;
                const result = this.parsePattern(rule.pattern, rule);

                let finalResult = result;
                if (result !== null && rule.options?.build) {
                    this.debug(`[parseRule] Applying build function for rule '${ruleName}'`);
                    finalResult = this.safeBuild(rule.options.build, result);
                }

                // Cache successful result
                if (this.settings.enableMemoization && rule.options?.memoizable !== false && finalResult !== null) {
                    this.cacheMemoResult(ruleName, savedPosition, finalResult, this.position, this.errors.slice(startErrorCount));
                }

                return finalResult;
            } catch (error) {
                if (this.settings.errorRecovery.mode === 'strict') {
                    throw error;
                }

                // In resilient mode, apply error recovery
                this.debug(`[parseRule] Error in rule '${ruleName}': ${(error as Error).message}`);
                this.handleError(error as Error, rule, savedPosition);
                return null;
            }
        }

        // ════ More ════

        private detectInfiniteLoop(state: LoopDetectionState): boolean {
            const currentPosition = this.position;

            // If we've been at this position too many times, it's likely an infinite loop
            if (state.visitedPositions.has(currentPosition)) {
                if (state.visitedPositions.size > 10) {
                    return true;
                }
            }

            state.visitedPositions.add(currentPosition);

            // If we haven't made progress in a while
            if (state.iterationCount > 100 && currentPosition === state.lastProgress) {
                return true;
            }

            // Clear old positions occasionally
            if (state.visitedPositions.size > 20) {
                const positions = Array.from(state.visitedPositions);
                state.visitedPositions.clear();
                // Keep only recent positions
                positions.slice(-10).forEach(pos => state.visitedPositions.add(pos));
            }

            return false;
        }

        private safeBuild(buildFn: Function, matches: any): any {
            try {
                const result = buildFn(Array.isArray(matches) ? matches : [matches]);
                return result;
            } catch (error) {
                this.debug(`[safeBuild] Build function error: ${(error as Error).message}`);
                this.addError({
                    message: `Build function error: ${(error as Error).message}`,
                    position: this.getCurrentPosition(),
                    code: 'E004'
                });
                return matches; // Return original matches on build error
            }
        }

        private getMemoKey(ruleName: string, position: number): string {
            return `${ruleName}:${position}`;
        }

        private cacheMemoResult(ruleName: string, position: number, result: any, endPosition: number, errors: ParseError[]): void {
            if (this.memoCache.size >= this.settings.maxCacheSize) {
                // Simple LRU eviction - remove oldest entries
                const oldestEntries = Array.from(this.memoCache.entries())
                    .sort((a, b) => a[1].timestamp - b[1].timestamp)
                    .slice(0, Math.floor(this.settings.maxCacheSize * 0.2)); // Remove 20%

                oldestEntries.forEach(([key]) => this.memoCache.delete(key));
            }

            const memoKey = this.getMemoKey(ruleName, position);
            this.memoCache.set(memoKey, {
                result,
                endPosition,
                errors: [...errors],
                timestamp: Date.now()
            });
        }

        private handleError(error: Error, rule?: Rule, savedPosition?: number): void {
            const pos = this.getCurrentPosition();
            const context = this.getContext();
            this.debug(`[handleError] Parse error: ${error.message}`);

            this.addError({
                message     : error.message,
                position    : pos,
                context     : context,
                code        : 'E005'
            });

            // Apply recovery strategy to continue parsing
            if (rule?.options?.recovery) {
                this.debug(`[handleError] Applying recovery for rule '${rule.name}'`);
                this.applyRecoveryStrategy(rule.options.recovery);
                this.stats.errorsRecovered++;
            } else {
                this.debug(`[handleError] No recovery strategy, using default`);
                this.defaultErrorRecovery();
            }
        }

        private handleRuleError(rule: Rule, failedAt: number): void {
            if (rule.options?.errors) {
                for (const errorHandler of rule.options.errors) {
                    if (errorHandler.condition(this, failedAt)) {
                        this.addError({
                            message: errorHandler.message,
                            position: this.getCurrentPosition(),
                            suggestions: errorHandler.suggestions,
                            context: this.getContext(),
                            code: errorHandler.code || 'E006',
                            severity: errorHandler.severity || 'error'
                        });
                        break;
                    }
                }
            }
        }

        private applyRecoveryStrategy(strategy: RecoveryStrategy): void {
            const beforePos = this.position;
            this.debug(`[recovery] Starting recovery at position ${beforePos}`);

            switch (strategy.type) {
                case 'panic':
                    this.debug(`[recovery] Using panic mode recovery`);
                    this.defaultErrorRecovery();
                    break;

                case 'skipUntil':
                    const tokens = strategy.tokens || (strategy.token ? [strategy.token] : []);
                    this.debug(`[recovery] Skipping until tokens: ${tokens.join(', ')}`);
                    this.skipUntilTokens(tokens);
                    break;

                case 'insertToken':
                    this.debug(`[recovery] Attempting token insertion recovery`);
                    // Virtual token insertion - don't actually modify token stream
                    break;

                case 'deleteToken':
                    this.debug(`[recovery] Attempting token deletion recovery`);
                    if (this.position < this.tokens.length) {
                        this.position++;
                    }
                    break;

                default:
                    this.defaultErrorRecovery();
            }

            this.debug(`[recovery] Recovery moved position from ${beforePos} to ${this.position}`);
        }

        private skipUntilTokens(tokens: string[]): void {
            this.debug(`[skipUntilTokens] Looking for tokens: ${tokens.join(', ')} from position ${this.position}`);

            const tokenSet = new Set(tokens);
            let skipped = 0;

            while (this.position < this.tokens.length && skipped < this.maxIterations) {
                const currentToken = this.tokens[this.position];
                this.debug(`[skipUntilTokens] Checking token '${currentToken.type}' at position ${this.position}`);

                if (tokenSet.has(currentToken.type)) {
                    this.debug(`[skipUntilTokens] Found sync token '${currentToken.type}' at position ${this.position}`);
                    return;
                }
                this.position++;
                skipped++;
            }

            this.debug(`[skipUntilTokens] Reached end of tokens or skip limit without finding sync token`);
        }

        private defaultErrorRecovery(): void {
            this.debug(`[defaultErrorRecovery] Starting at position ${this.position}`);
            const syncTokens = this.settings.errorRecovery.syncTokens;

            if (syncTokens.length > 0) {
                this.skipUntilTokens(syncTokens);
            } else {
                // If no sync tokens defined, skip one token
                if (this.position < this.tokens.length) {
                    this.debug(`[defaultErrorRecovery] No sync tokens, skipping one token`);
                    this.position++;
                }
            }
        }

        private getCurrentPosition(): Position {
            if (this.position < this.tokens.length) {
                return this.tokens[this.position].pos;
            }

            if (this.tokens.length > 0) {
                const lastToken = this.tokens[this.tokens.length - 1];
                const valueLength = lastToken.value?.length || 0;
                return {
                    line: lastToken.pos.line,
                    col: lastToken.pos.col + valueLength,
                    offset: lastToken.pos.offset + valueLength
                };
            }

            return { line: 1, col: 1, offset: 0 };
        }

        private getCurrentToken(): Token | null {
            return this.position < this.tokens.length ? this.tokens[this.position] : null;
        }

        private getContext(): string {
            const contextSize = 5;
            const start = Math.max(0, this.position - contextSize);
            const end = Math.min(this.tokens.length, this.position + contextSize);

            return this.tokens.slice(start, end)
                .map((token, idx) => {
                    const actualIdx = start + idx;
                    const marker = actualIdx === this.position ? '→' : ' ';
                    return `${marker}${token.type}${token.value ? `:${token.value}` : ''}`;
                })
                .join(' ');
        }

        private skipIgnored(ruleIgnored?: string[]): void {
            if (this.ignoredSet.size === 0 && (!ruleIgnored || ruleIgnored.length === 0)) {
                return; // Early exit optimization
            }

            const combinedIgnored = ruleIgnored
                ? new Set([...this.ignoredSet, ...ruleIgnored])
                : this.ignoredSet;

            while (this.position < this.tokens.length) {
                const token = this.tokens[this.position];
                if (!combinedIgnored.has(token.type)) break;
                this.position++;
                this.stats.tokensProcessed++;
            }
        }

        private addError(error: ParseError): void {
            if (this.settings.errorRecovery.maxErrors > 0 &&
                this.errors.length >= this.settings.errorRecovery.maxErrors) {
                return;
            }

            // Deduplicate similar errors
            const isDuplicate = this.errors.some(existing =>
                existing.message === error.message &&
                existing.position.line === error.position.line &&
                existing.position.col === error.position.col
            );

            if (!isDuplicate) {
                this.errors.push({
                    ...error,
                    severity: error.severity || 'error'
                });

                if (this.settings.debug) {
                    this.debug(`Parse Error: ${error.message} at ${error.position.line}:${error.position.col}`);
                }
            }
        }

        private debug(...args: any[]): void {
            if (this.settings.debug) {
                console.log(`[Parser]`, ...args);
            }
        }

        // ════ Initialization and Validation ════

        private validateInput(rules: Rule[], settings: ParserSettings): void {
            if (!rules || !Array.isArray(rules) || rules.length === 0) {
                throw new Error('Rules must be a non-empty array');
            }

            if (!settings || typeof settings !== 'object') {
                throw new Error('Settings must be an object');
            }

            if (!settings.startRule || typeof settings.startRule !== 'string') {
                throw new Error('Settings must specify a valid startRule');
            }
        }

        private normalizeSettings(settings: ParserSettings): ParserSettings {
            return {
                startRule: settings.startRule,
                errorRecovery: {
                    mode: settings.errorRecovery?.mode || 'strict',
                    maxErrors: settings.errorRecovery?.maxErrors || 10,
                    syncTokens: settings.errorRecovery?.syncTokens || []
                },
                ignored: settings.ignored || ['ws'],
                debug: settings.debug || false,
                maxDepth: Math.max(1, settings.maxDepth || 1000),
                enableMemoization: settings.enableMemoization !== false,
                maxCacheSize: settings.maxCacheSize || 1000,
                enableProfiling: settings.enableProfiling || false
            };
        }

        private validateGrammar(): string[] {
            const issues: string[] = [];
            const ruleNames = new Set(Array.from(this.rules.keys()));

            // Check for duplicate rule names (handled in constructor)
            // Check for undefined rule references
            for (const [ruleName, rule] of this.rules) {
                const referencedRules = this.extractRuleReferences(rule.pattern);
                for (const ref of referencedRules) {
                    if (!ruleNames.has(ref)) {
                        issues.push(`Rule '${ruleName}' references undefined rule '${ref}'`);
                    }
                }

                // Check for direct left recursion
                if (this.hasDirectLeftRecursion(rule)) {
                    issues.push(`Rule '${ruleName}' has direct left recursion`);
                }
            }

            // Check that start rule exists
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
                case 'seq':
                case 'choice':
                    for (const p of pattern.patterns) {
                        refs.push(...this.extractRuleReferences(p));
                    }
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
            }

            return refs;
        }

        private hasDirectLeftRecursion(rule: Rule): boolean {
            return this.checkLeftRecursion(rule.pattern, rule.name, new Set());
        }

        private checkLeftRecursion(pattern: Pattern, ruleName: string, visited: Set<string>): boolean {
            if (visited.has(ruleName)) {
                return false; // Already checking this path
            }
             visited.add(ruleName);

            switch (pattern.type) {
                case 'rule':
                    return pattern.name === ruleName;
                case 'seq':
                    // Only first pattern matters for left recursion
                    return pattern.patterns.length > 0 &&
                           this.checkLeftRecursion(pattern.patterns[0], ruleName, visited);
                case 'choice':
                    return pattern.patterns.some((p: Pattern) => this.checkLeftRecursion(p, ruleName, visited));
                case 'optional':
                    // Optional patterns can contribute to left recursion
                    return this.checkLeftRecursion(pattern.pattern, ruleName, visited);
                default:
                    return false;
            }
        }

        // ════ Resource Management ════

        private resetState(tokens: Token[]): void {
            this.tokens = tokens;
            this.position = 0;
            this.errors = [];
            this.ast = [];
            this.depth = 0;
            this.stats = {
                tokensProcessed: 0,
                rulesApplied: 0,
                errorsRecovered: 0,
                parseTimeMs: 0
            };
            this.cacheHits = 0;
            this.cacheMisses = 0;
        }

        private createResult(): ParseResult {
            this.stats.parseTimeMs = Date.now() - this.startTime;

            if (this.settings.enableProfiling) {
                this.stats.cacheHitRate = this.cacheHits + this.cacheMisses > 0
                    ? this.cacheHits / (this.cacheHits + this.cacheMisses)
                    : 0;

                // Rough memory estimation
                this.stats.memoryUsedKB = Math.round(
                    (this.memoCache.size * 100 + this.nodePool.length * 50) / 1024
                );
            }

            return {
                ast: this.ast,
                errors: this.errors,
                statistics: this.settings.enableProfiling ? this.stats : undefined
            };
        }

        /**
         * Clears internal caches and resets parser state.
         * Call this periodically for long-running applications.
         */
        public clearCaches(): void {
            this.memoCache.clear();
            this.nodePool = [];
            this.debug('Caches cleared');
        }

        /**
         * Returns current cache statistics
         */
        public getCacheStats(): { size: number; hitRate: number } {
            const total = this.cacheHits + this.cacheMisses;
            return {
                size: this.memoCache.size,
                hitRate: total > 0 ? this.cacheHits / total : 0
            };
        }

        /**
         * Disposes of the parser and frees resources.
         * Parser cannot be reused after calling this method.
         */
        public dispose(): void {
            this.clearCaches();
            this.rules.clear();
            this.ignoredSet.clear();
            this.ruleSet.clear();

            this.tokens         = [];
            this.ast            = [];
            this.errors         = [];
            this.disposed       = true;

            this.debug('Parser disposed');
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ MAIN ════════════════════════════════════════╗

    /**
     * Main parsing function - creates a parser instance and parses tokens
     * @param tokens Array of tokens to parse
     * @param rules Grammar rules
     * @param settings Parser configuration
     * @returns Parse result with AST and errors
     */
    export function parse(tokens: Token[], rules: Rules, settings?: Partial<ParserSettings>): ParseResult {
        if (!tokens || tokens.length === 0) {
            return { ast: [], errors: [] };
        }

        const defaultSettings: ParserSettings = {
            startRule       : 'root',
            errorRecovery   : {
                mode        : 'strict',
                maxErrors   : 10,
                syncTokens  : []
            },
            ignored         : ['ws'], // commonly ignored whitespace
            debug           : false,
            maxDepth        : 1000,
            enableMemoization: true,
            maxCacheSize    : 1000,
            enableProfiling : false
        };

        const mergedSettings = { ...defaultSettings, ...settings };

        // Deep merge errorRecovery object
        if (settings?.errorRecovery) {
            mergedSettings.errorRecovery = {
                ...defaultSettings.errorRecovery,
                ...settings.errorRecovery
            };
        }

        const parser = new Parser(rules, mergedSettings);
        try {
            return parser.parse(tokens);
        } finally {
            // Auto-cleanup for one-time use
            if (!settings?.enableMemoization) {
                parser.dispose();
            }
        }
    }

    /**
     * Creates a reusable parser instance
     * @param rules Grammar rules
     * @param settings Parser configuration
     * @returns Parser instance
     */
    export function createParser(rules: Rules, settings?: Partial<ParserSettings>): Parser {
        const defaultSettings: ParserSettings = {
            startRule       : 'root',
            errorRecovery   : {
                mode        : 'strict',
                maxErrors   : 10,
                syncTokens  : []
            },
            ignored         : ['ws'],
            debug           : false,
            maxDepth        : 1000,
            enableMemoization: true,
            maxCacheSize    : 1000,
            enableProfiling : false
        };

        const mergedSettings = { ...defaultSettings, ...settings };

        if (settings?.errorRecovery) {
            mergedSettings.errorRecovery = {
                ...defaultSettings.errorRecovery,
                ...settings.errorRecovery
            };
        }

        return new Parser(rules, mergedSettings);
    }

    /**
     * Validates a grammar without creating a parser
     * @param rules Grammar rules to validate
     * @param startRule Start rule name
     * @returns Array of validation issues (empty if valid)
     */
    export function validateGrammar(rules: Rules, startRule?: string): string[] {
        try {
            const tempSettings: ParserSettings = {
                startRule: startRule || 'root',
                errorRecovery: { mode: 'strict', maxErrors: 1, syncTokens: [] },
                ignored: [],
                debug: false,
                maxDepth: 1000,
                enableMemoization: false,
                maxCacheSize: 0,
                enableProfiling: false
            };

            const parser = new Parser(rules, tempSettings);
            parser.dispose();
            return [];
        } catch (error: any) {
            return [error.message];
        }
    }

    /**
     * Creates a rule with the given name, pattern, and options
     * @param name Rule name
     * @param pattern Rule pattern
     * @param options Rule options
     * @returns Rule object
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
     * Creates a token pattern that matches a specific token type
     */
    export function token(name: string): Pattern {
        if (!name || typeof name !== 'string') {
            throw new Error('Token name must be a non-empty string');
        }
        return { type: 'token', name };
    }

    /**
     * Creates a rule reference pattern
     */
    export function rule(name: string): Pattern {
        if (!name || typeof name !== 'string') {
            throw new Error('Rule name must be a non-empty string');
        }
        return { type: 'rule', name };
    }

    /**
     * Creates a sequence pattern that matches all patterns in order
     */
    export function seq(...patterns: Pattern[]): Pattern {
        if (patterns.length === 0) {
            throw new Error('Sequence must have at least one pattern');
        }
        return { type: 'seq', patterns };
    }

    /**
     * Creates a choice pattern that matches any one of the given patterns
     */
    export function choice(...patterns: Pattern[]): Pattern {
        if (patterns.length === 0) {
            throw new Error('Choice must have at least one pattern');
        }
        return { type: 'choice', patterns };
    }

    /**
     * Creates a repeat pattern with optional min/max bounds and separator
     */
    export function repeat(
        pattern: Pattern,
        min: number = 0,
        max: number = Infinity,
        separator?: Pattern
    ): Pattern {
        if (min < 0) {
            throw new Error('Minimum repetition count cannot be negative');
        }
        if (max < min) {
            throw new Error('Maximum repetition count cannot be less than minimum');
        }
        return { type: 'repeat', pattern, min, max, separator };
    }

    /**
     * Creates an optional pattern (equivalent to repeat(pattern, 0, 1))
     */
    export function optional(pattern: Pattern): Pattern {
        return { type: 'optional', pattern };
    }

    /**
     * Creates a one-or-more repeat pattern
     */
    export function oneOrMore(pattern: Pattern, separator?: Pattern): Pattern {
        return repeat(pattern, 1, Infinity, separator);
    }

    /**
     * Creates a zero-or-more repeat pattern
     */
    export function zeroOrMore(pattern: Pattern, separator?: Pattern): Pattern {
        return repeat(pattern, 0, Infinity, separator);
    }

    // ════ Error Handling ════

    /**
     * Creates an error handler for rules
     */
    export function error(
        condition: ErrorHandler['condition'],
        message: string,
        suggestions: string[] = [],
        code?: string,
        severity: 'error' | 'warning' | 'info' = 'error'
    ): ErrorHandler {
        return { condition, message, suggestions, code, severity };
    }

    // ════ Error Recovery Strategies ════
    export const errorRecoveryStrategies = {
        /**
         * Panic mode recovery - skip to synchronization tokens
         */
        panicMode(): RecoveryStrategy {
            return { type: 'panic' };
        },

        /**
         * Skip until specific tokens are found
         */
        skipUntil(tokens: string | string[]): RecoveryStrategy {
            return {
                type: 'skipUntil',
                tokens: Array.isArray(tokens) ? tokens : [tokens]
            };
        },

        /**
         * Virtual token insertion (doesn't modify token stream)
         */
        insertToken(token: string, value?: string): RecoveryStrategy {
            return {
                type: 'insertToken',
                token,
                insertValue: value
            };
        },

        /**
         * Skip the current token
         */
        deleteToken(): RecoveryStrategy {
            return { type: 'deleteToken' };
        }
    };

    // ════ Context Conditions ════
    export const contextConditions = {
        /**
         * Condition for when a specific token is missing
         */
        missingToken(tokenName: string) {
            return (parser: Parser, failedAt: number) => {
                return failedAt >= 0; // Simple condition - can be enhanced based on context
            };
        },

        /**
         * Condition for when an unexpected token is encountered
         */
        unexpectedToken(tokenName?: string) {
            return (parser: Parser, failedAt: number) => {
                return failedAt >= 0;
            };
        },

        /**
         * Condition for premature end of input
         */
        prematureEnd() {
            return (parser: Parser, failedAt: number) => {
                return failedAt >= 0;
            };
        },

        /**
         * Custom condition based on parser state
         */
        custom(predicate: (parser: Parser, failedAt: number) => boolean) {
            return predicate;
        }
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝