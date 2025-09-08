// core.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as Types from './types';
    import { Result } from './result';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Parser {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // Core data
            public rules                    : Map<string, Types.Rule>;
            public settings                 : Types.ParserSettings;

            // State
            public tokens                   : Types.Token[] = [];
            public ast                      : Result[] = [];
            public errors                   : Types.ParseError[] = [];
            public index                    : number = 0;
            public depth                    : number = 0;

            // Debug & stats
            private debugLevel              : Types.DebugLevel;
            private indentLevel             : number = 0;
            public stats                    : Types.ParseStatistics;
            public startTime                : number = 0;
            public errorSeq                 : number = 0;

            // Performance
            public memoCache                : Map<string, Types.MemoEntry> = new Map<string, Types.MemoEntry>();
            public ignoredSet               : Set<string> = new Set<string>();
            public memoHits                 : number = 0;
            public memoMisses               : number = 0;

            // Context tracking (TODO: review it.)
            private silentContextStack      : boolean[]     = [];
            public lastVisitedIndex         : number        = 0;
            public lastHandledRule          : string        = 'unknown';
            public ruleStack                : string[]      = [];
            public patternStack             : string[]      = [];
            public lastInnerRule            : string        = 'unknown';
            public lastCompletedRule        : string        = 'unknown';
            public successfulRules          : string[]      = [];
            private globalSuccessRules      : string[]      = [];
            private lastLeafRule            : string        = 'unknown';

            // Initialization
            constructor(rules: Types.Rule[], settings?: Types.ParserSettings) {
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

            parse(tokens: Types.Token[]): Types.ParseResult {

                this.resetState(tokens);
                this.startTime = Date.now();
                this.log('rules', `🚀 Parse started: ${tokens.length} tokens`);

                // Early validation
                if (!tokens?.length) {return { ast: [], errors: [] };}

                const errorToken = tokens.find(token => token.kind === 'error');
                if (errorToken) {
                    return {
                        ast: [],
                        errors: [this.createError(Types.ERRORS.LEXICAL_ERROR, `Unexpected token '${errorToken.value}'`, Parser.hanldeErrorSpan(errorToken.span), 0, 0, this.lastHandledRule)]
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
                } catch (err: unknown) {
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

            private parseWithRecovery(startRule: Types.Rule): void {
                const maxErrors = this.settings.errorRecovery!.maxErrors!;
                let consecutiveErrors = 0;

                while (this.index < this.tokens.length && (maxErrors === 0 || this.errors.length < maxErrors)) {
                    const beforeIndex = this.index;

                    try {
                        const result = this.parsePattern(startRule.pattern, startRule);

                        if (result.status === 'passed') {
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
                    } catch (error: unknown) {
                        consecutiveErrors++;

                        const parseError = this.normalizeError(error, this.getCurrentSpan());
                        this.addError(parseError);

                        // Better error recovery
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

            protected parsePattern(pattern: Types.Pattern, parentRule?: Types.Rule): Result {
                this.lastHandledRule = pattern.type;

                if (this.depth > this.settings.maxDepth!) {
                    throw new Error('Maximum parsing depth exceeded');
                }

                // Better silent context management
                const shouldBeSilent = this.shouldBeSilent(pattern, parentRule);

                // For optional patterns, we need special handling
                const isOptionalContext = parentRule?.name === 'optional' ||
                                        this.patternStack[this.patternStack.length - 1] === 'optional';

                this.silentContextStack.push(shouldBeSilent || isOptionalContext);

                const startIndex = this.index;
                const memoKey = this.shouldUseMemoization(pattern, parentRule)
                    ? this.createMemoKey(pattern, startIndex, parentRule?.name)
                    : null;

                // Check memoization
                if (memoKey) {
                    const memoResult = this.getMemoized(memoKey);
                    if (memoResult.hit) {
                        this.index = memoResult.newIndex!;
                        this.silentContextStack.pop();
                        this.log('verbose', `🔋 Memo HIT: ${memoKey} → ${memoResult.newIndex}`);
                        return memoResult.result!;
                    }
                }

                this.indentLevel++;
                this.log('patterns', `${'  '.repeat(this.indentLevel)}⚡ ${pattern.type}${parentRule ? ` (${parentRule.name})` : ''}${shouldBeSilent ? ' [SILENT]' : ''} @${this.index}`);
                this.depth++;

                let result = Result.create();

                try {
                    this.skipIgnored(parentRule?.options?.ignored);

                    result = this.executePattern(pattern, parentRule, shouldBeSilent);

                    const status = result !== null ? '✓' : '✗';
                    this.log('patterns', `${'  '.repeat(this.indentLevel)}${status} ${pattern.type} → ${this.index}`);

                    // Only memoize if we're not in an error state
                    if (memoKey && !isOptionalContext) {
                        this.memoize(memoKey, result, startIndex, this.index);
                    }

                    return result;
                } catch (error) {
                    // In optional context, don't let errors propagate up
                    if (isOptionalContext) {
                        this.index = startIndex;

                        this.log('patterns', `${'  '.repeat(this.indentLevel)}✗ ${pattern.type} (optional context, suppressed) → ${startIndex}`);

                        return Result.createAsOptional('failed', undefined, this.getCurrentSpan());
                    }
                    throw error;
                } finally {
                    this.depth--;
                    this.indentLevel--;
                    this.silentContextStack.pop();
                }
            }

            private executePattern(pattern: Types.Pattern, parentRule?: Types.Rule, shouldBeSilent?: boolean): Result {
                switch (pattern.type) {
                    case 'token':
                        return this.parseToken(pattern.name!, pattern.value!, parentRule, shouldBeSilent);
                    case 'rule':
                        return this.parseRule(pattern.name!, parentRule, shouldBeSilent);
                    case 'repeat':
                        return this.parseRepeat(pattern.pattern!, pattern.min || 0, pattern.max || Infinity, pattern.separator, parentRule, shouldBeSilent);
                    case 'seq':
                        return this.parseSequence(pattern.patterns!, parentRule, shouldBeSilent);
                    case 'choice':
                        return this.parseChoice(pattern.patterns!, parentRule, shouldBeSilent);
                    case 'optional':
                        return this.parseOptional(pattern.pattern!, parentRule);
                    default:
                        throw new Error(`Unknown pattern type: ${pattern.type}`);
                }
            }

            private parseToken(tokenName: string, tokenValue?: string, parentRule?: Types.Rule, shouldBeSilent?: boolean): Result {
                this.lastHandledRule = parentRule?.name || tokenName;
                this.log('tokens', `→ ${tokenName} @${this.index}`);
                this.lastVisitedIndex = this.index;

                if (this.index >= this.tokens.length) {
                    this.log('tokens', `✗ Expected '${tokenName}', got 'EOF' @${this.index}`);

                    if (shouldBeSilent) { return Result.create('failed', undefined, undefined, this.getCurrentSpan()); }

                    const error = this.createError(
                        Types.ERRORS.TOKEN_EXPECTED_EOF,
                        `Expected '${tokenName}', got 'EOF'`,
                        this.getCurrentSpan(),
                        0,
                        this.index,
                        this.lastHandledRule!,
                        this.getInnerMostRule()
                    );
                    const finalError = this.getCustomErrorOr(parentRule, error);
                    return Result.createAsToken('failed').withError(finalError);
                }

                const token = this.getCurrentToken();

                if (token.kind === tokenName) {
                    if(tokenValue && token.value !== tokenValue) {
                        const error = this.createError(
                            Types.ERRORS.TOKEN_MISMATCH,
                            `Expected '${tokenName}' with value '${tokenValue}', got '${token.value}'`,
                            this.getCurrentSpan(),
                            0,
                            this.index,
                            this.lastHandledRule!,
                            this.getInnerMostRule()
                        );
                        this.handleParseError(error, parentRule);
                    }
                    else {
                        const consumedToken = { ...token };
                        this.index++;
                        this.stats.tokensProcessed++;
                        this.log('tokens', `✓ ${tokenName} = "${token.value}" @${this.index - 1}`);
                        return Result.createAsToken('passed', consumedToken, consumedToken.span);
                    }
                }

                this.log('tokens', `✗ Expected '${tokenName}', got '${token.kind}' @${this.lastVisitedIndex}`);

                if (shouldBeSilent) { return Result.create('failed', undefined, undefined, token.span); }

                const error = this.createError(
                    Types.ERRORS.TOKEN_MISMATCH,
                    `Expected '${tokenName}', got '${token.kind}'`,
                    Parser.hanldeErrorSpan(this.getCurrentSpan()),
                    0,
                    this.lastVisitedIndex,
                    this.lastHandledRule!,
                    this.getInnerMostRule(true)
                );
                this.handleParseError(error, parentRule);
            }

            private parseRule(ruleName: string, parentRule?: Types.Rule, shouldBeSilent?: boolean): Result {
                this.lastHandledRule = ruleName;
                this.ruleStack.push(ruleName);
                this.patternStack.push('rule');
                this.lastInnerRule = ruleName;

                this.log('rules', `→ ${ruleName} @${this.index} [Stack: ${this.ruleStack.join(' → ')}]`);
                this.lastVisitedIndex = this.index;

                const targetRule = this.rules.get(ruleName);
                if (!targetRule) {
                    this.ruleStack.pop();
                    this.patternStack.pop();
                    const error = new Error(`Rule '${ruleName}' not found`);
                    this.handleFatalError(error);
                    return Result.create('failed', undefined, undefined, this.getCurrentSpan()).withError(this.fetalErrorToParseError(error));
                }

                const startIndex = this.index;
                const savedErrors = [...this.errors];
                const savedSuccessfulRules = [...this.successfulRules];

                try {
                    this.stats.rulesApplied++;

                    const result = this.parsePattern(targetRule.pattern, targetRule);

                    if (!result.isFullyPassed()) {
                        this.successfulRules = savedSuccessfulRules;

                        if (shouldBeSilent) {
                            this.log('rules', `✗ ${ruleName} (silent) @${this.lastVisitedIndex}`);
                            this.ruleStack.pop();
                            this.patternStack.pop();
                            return Result.create('failed', undefined, undefined, result.span);
                        }

                        const error = this.createError(
                            Types.ERRORS.RULE_FAILED,
                            `Rule '${ruleName}' failed to match`,
                            this.getCurrentSpan(),
                            0,
                            this.lastVisitedIndex,
                            this.lastHandledRule!,
                            this.getInnerMostRule(true)
                        );

                        this.ruleStack.pop();
                        this.patternStack.pop();
                        const finalError = this.getCustomErrorOr(parentRule, error);
                        return Result.create('failed', undefined, undefined, result.span).withError(finalError);
                    }

                    let finalResult = result;
                    if (result !== null && targetRule.options?.build) {
                        const build_result = this.safeBuild(targetRule.options.build, finalResult);
                        if(build_result) { finalResult = build_result; }
                    }

                    this.log('rules', `✓ RULE → ${ruleName} @${this.lastVisitedIndex}`);

                    // Track successful completion
                    this.lastCompletedRule = ruleName;
                    this.successfulRules.push(ruleName);
                    this.globalSuccessRules.push(ruleName);

                    this.updateLeafRule(ruleName);
                    this.trimSuccessfulRules();

                    this.ruleStack.pop();
                    this.patternStack.pop();
                    return finalResult;

                } catch (e) {
                    this.successfulRules = savedSuccessfulRules;
                    this.ruleStack.pop();
                    this.patternStack.pop();

                    if (shouldBeSilent) {
                        this.index = startIndex;
                        this.errors = savedErrors;
                        return Result.create('failed', undefined, undefined, this.getCurrentSpan());
                    }

                    if (e instanceof Error) {
                        this.handleFatalError(e);
                    } else {
                        this.handleParseError((e as Types.ParseError), parentRule);
                    }
                }

                return Result.create('failed', undefined, undefined, this.getCurrentSpan());
            }

            private parseOptional(pattern: Types.Pattern, parentRule?: Types.Rule): Result {
                this.log('verbose', `OPTIONAL @${this.index}`);

                this.lastHandledRule  = 'optional';
                this.lastVisitedIndex = this.index;

                const startIndex  = this.index;
                const savedErrors = [...this.errors];

                try {
                    // Parse the pattern - but we need to be more careful about silent mode
                    const result : Result = this.parsePattern(pattern, parentRule);

                    if (result.isFullyPassed()) {
                        // Success case - return array with the result
                        this.log('verbose', `✓ OPTIONAL → [1 element] @${this.index}`);

                        return Result.createAsOptional('passed', result, result.span);
                    } else {
                        // Failure case - this is a normal failure for optional
                        // Reset to start position since we didn't consume anything useful
                        this.index  = startIndex;
                        this.errors = savedErrors;

                        this.log('verbose', `✓ OPTIONAL → [] (pattern returned null) @${this.index}`);

                        return Result.createAsOptional('passed', undefined, result.span ?? this.getCurrentSpan());
                    }
                } catch (e) {
                    this.index  = startIndex;
                    this.errors = savedErrors;

                    this.log('verbose', `✓ OPTIONAL → [] (exception caught: ${(e as Types.ParseError).msg || e}) @${this.index}`);

                    return Result.createAsOptional('passed', undefined, this.getCurrentSpan());
                }
            }

            private parseChoice(patterns: Types.Pattern[], parentRule?: Types.Rule, shouldBeSilent?: boolean): Result {
                this.log('verbose', `CHOICE[${patterns.length}] @${this.index}`);
                this.lastVisitedIndex = this.index;

                const startIndex = this.index;
                const savedErrors = [...this.errors];

                let bestResult: {
                    index               : number;
                    errors              : Types.ParseError[];
                    span                : Types.Span;
                    progress            : number;
                    patternIndex        : number;
                    failedAt            : number;
                } | null = null;

                for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
                    this.index  = startIndex;
                    this.errors = [...savedErrors];

                    try {
                        const result = this.parsePattern(patterns[patternIndex], parentRule);
                        if (result.isFullyPassed()) {
                            this.log('verbose', `✓ CHOICE → alt ${patternIndex + 1}/${patterns.length} succeeded @${this.lastVisitedIndex}`);
                            return Result.createAsChoice('passed', result, patternIndex);
                        }

                        const progress = this.lastVisitedIndex - startIndex;
                        const currentErrors = this.errors.slice(savedErrors.length);

                        this.log('verbose', `✗ CHOICE → alt ${patternIndex + 1} failed, errors=${currentErrors.length}, progress=${progress}`);

                        if (!bestResult || progress > bestResult.progress || (progress === bestResult.progress && currentErrors.length > 0)) {
                            bestResult = {
                                index       : this.index,
                                errors      : currentErrors,
                                span        : this.getCurrentSpan(),
                                progress,
                                patternIndex,
                                failedAt    : -1
                            };
                        }
                    } catch (error: unknown) {
                        const progress = this.lastVisitedIndex - startIndex;
                        const normalizedError = this.normalizeError(error, this.getCurrentSpan());

                        this.log('verbose', `✗ CHOICE → alt ${patternIndex + 1} threw error: ${normalizedError.msg}, progress=${progress}`);

                        if (!bestResult || (progress >= bestResult.progress && (error as Types.ParseError).failedAt > bestResult.failedAt)) {
                            bestResult = {
                                index       : this.lastVisitedIndex,
                                errors      : [normalizedError],
                                span        : normalizedError.span,
                                progress,
                                patternIndex,
                                failedAt    : normalizedError.failedAt || -1
                            };
                        }
                    }
                }

                // All alternatives failed
                this.index = startIndex;
                this.errors = savedErrors;

                if (shouldBeSilent) { return Result.create('failed', undefined, undefined, this.getCurrentSpan()); }

                if (bestResult) {
                    const bestError = bestResult.errors.length > 0
                        ? bestResult.errors[bestResult.errors.length - 1]
                        : this.createError(
                            Types.ERRORS.CHOICE_ALL_FAILED,
                            `Choice failed at alternative ${this.lastVisitedIndex + 1}`,
                            bestResult.span,
                            bestResult.failedAt,
                            this.lastVisitedIndex,
                            this.lastHandledRule!
                        );

                    this.log('verbose', `✗ All alternatives failed. Best: pattern ${this.lastVisitedIndex}, progress ${bestResult.progress}, failedAt ${bestResult.failedAt}, error: ${bestError.msg}`);
                    throw bestError;
                }

                const error = this.createError(
                    Types.ERRORS.CHOICE_ALL_FAILED,
                    `Expected one of: ${patterns.map(p => this.patternToString(p)).join(', ')}`,
                    this.getCurrentSpan(),
                    0,
                    this.lastVisitedIndex,
                    this.lastHandledRule!
                );
                throw error;
            }

            private parseRepeat(pattern: Types.Pattern, min = 0, max = Infinity, separator?: Types.Pattern, parentRule?: Types.Rule, shouldBeSilent?: boolean): Result {
                this.lastHandledRule = pattern.type;
                this.log('verbose', `REPEAT(${min}-${max}) @${this.index}`);
                this.lastVisitedIndex = this.index;

                const results : Result[] = [];
                let consecutiveFailures = 0;
                const startIndex = this.index;

                while (results.length < max && this.index < this.tokens.length) {
                    const iterationStart = this.index;
                    const savedErrors = [...this.errors];

                    try {
                        const result = this.parsePattern(pattern, parentRule);

                        if (!result.isFullyPassed()) {
                            this.errors = savedErrors;

                            // Better minimum requirement handling
                            if (results.length >= min) {
                                // We have enough results, break cleanly
                                break;
                            } else if (shouldBeSilent || pattern.silent) {
                                // Silent mode - break without error
                                break;
                            } else {
                                // Not enough results and not silent - this is an error
                                consecutiveFailures++;
                                if (consecutiveFailures > 3) {break;}

                                // Try recovery if we have a recovery strategy
                                if (parentRule?.options?.recovery) {
                                    this.applyRecovery(parentRule, iterationStart);
                                    if (this.index === iterationStart) {
                                        this.index++; // Force progress
                                    }
                                    continue;
                                } else {
                                    // No recovery - break and let minimum check handle the error
                                    break;
                                }
                            }
                        }

                        consecutiveFailures = 0;

                        results.push(result);

                        if (this.index === iterationStart) {
                            this.log('verbose', `⚠️ No progress in repeat iteration, breaking @${this.index}`);
                            break;
                        }

                        // Handle separator if needed
                        if (separator && results.length < max && this.index < this.tokens.length) {
                            const sepStart = this.index;
                            const sepSavedErrors = [...this.errors];

                            try {
                                const sepResult = this.parsePattern(separator, undefined);
                                if (!sepResult.isFullyPassed()) {
                                    this.index  = sepStart;
                                    this.errors = sepSavedErrors;
                                    break;
                                }
                            } catch {
                                this.index  = sepStart;
                                this.errors = sepSavedErrors;
                                break;
                            }
                        }

                    } catch (e) {
                        consecutiveFailures++;

                        this.index  = iterationStart;
                        this.errors = savedErrors;

                        if (shouldBeSilent || results.length >= min) {
                            break;
                        }

                        // Let the pattern error propagate up instead of handling it here
                        // This allows the proper error handling in the calling context
                        throw e;
                    }
                }

                // Check minimum requirement and create appropriate error
                if (results.length < min) {
                    if (shouldBeSilent) { return Result.create('failed', undefined, undefined, this.getCurrentSpan()); }

                    // Check if we should use a custom error from the parent rule
                    if (parentRule?.options?.errors) {
                        const customError = this.getCustomErrorForCondition(parentRule, 0, this.index, startIndex);
                        if (customError) {
                            throw customError;
                        }
                    }

                    const error = this.createError(
                        Types.ERRORS.REPEAT_MIN_NOT_MET,
                        `Expected at least ${min} occurrences, got ${results.length}`,
                        this.getCurrentSpan(),
                        0,
                        this.index,
                        this.lastHandledRule!
                    );

                    throw error;
                }

                this.log('verbose', `REPEAT → [${results.length}] @${this.index}`);

                return Result.createAsRepeat('passed', results, results.length ? {
                        start: results[0].span.start,
                        end: results[results.length-1].span.end
                } : this.getCurrentSpan());
            }

            private parseSequence(patterns: Types.Pattern[], parentRule?: Types.Rule, shouldBeSilent?: boolean): Result {
                this.log('verbose', `SEQUENCE[${patterns.length}] @${this.index}`);
                this.lastVisitedIndex = this.index;

                if (patterns.length === 0) { return Result.create('failed', undefined, undefined, this.getCurrentSpan()); }

                const startIndex  = this.index;
                const savedErrors = [...this.errors];
                const results: Result[] = [];
                let lastPatternIndex = 0;

                try {
                    for (lastPatternIndex = 0; lastPatternIndex < patterns.length; lastPatternIndex++) {
                        const pattern = patterns[lastPatternIndex];
                        const beforePatternIndex = this.index;

                        const result = this.parsePattern(pattern, parentRule);

                        // Not isFullyPassed, optional must ignored here.
                        if (!result.isPassed()) {
                            if (shouldBeSilent) {
                                this.index  = startIndex;
                                this.errors = savedErrors;
                                return Result.create('failed', undefined, undefined, result.span);
                            }

                            const error = this.createError(
                                Types.ERRORS.SEQUENCE_FAILED,
                                `Sequence failed at element ${lastPatternIndex + 1}/${patterns.length}`,
                                this.getCurrentSpan(),
                                lastPatternIndex,
                                this.lastVisitedIndex,
                                this.lastHandledRule!
                            );

                            this.handleParseError(error, parentRule);
                        }

                        results.push(result);

                        if (this.index === beforePatternIndex && !pattern.silent) {
                            this.log('verbose', `⚠️  No progress at sequence element ${lastPatternIndex} @${this.lastVisitedIndex}`);
                        }

                        this.skipIgnored(parentRule?.options?.ignored);
                    }

                    this.log('verbose', `SEQUENCE → [${results.length}] @${this.lastVisitedIndex}`);
                    return Result.createAsSequence('passed', results, results.length ? {
                        start: results[0].span.start,
                        end: results[results.length-1].span.end
                    } : this.getCurrentSpan());

                } catch (e) {
                    this.index  = startIndex;
                    this.errors = savedErrors;

                    if (!shouldBeSilent && !this.isInSilentMode()) {
                        if (e instanceof Error) {
                            this.handleFatalError(e);
                        } else {
                            const error = this.createError((e as Types.ParseError).code, (e as Types.ParseError).msg, (e as Types.ParseError).span, lastPatternIndex, this.lastVisitedIndex, this.lastHandledRule!);
                            this.handleParseError(error, parentRule);
                        }
                    }

                    return Result.create('failed', undefined, undefined, this.getCurrentSpan());
                }
            }

            private safeBuild(buildFn: Types.BuildFunction, matches: Result): Result {
                try {
                    return buildFn(matches);
                } catch (error) {
                    if (!this.isInSilentMode()) {
                        const buildError = this.createError(
                            Types.ERRORS.BUILD_FUNCTION_FAILED,
                            `${(error as Error).message}`,
                            Parser.hanldeErrorSpan(this.getCurrentSpan()),
                            0,
                            this.lastVisitedIndex,
                            this.lastHandledRule!
                        );
                        this.addError(buildError);
                        this.log('errors', `Build error: ${(error as Error).message}`);
                    }

                    // default to returning first match if build fails
                    return matches;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MODE ──────────────────────────────┐

            private shouldBeSilent(pattern: Types.Pattern, rule?: Types.Rule): boolean {
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

            private normalizeSettings(settings?: Types.ParserSettings): Types.ParserSettings {
                const defaultSettings: Types.ParserSettings = {
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

            private extractRuleReferences(pattern: Types.Pattern): string[] {
                const refs: string[] = [];

                switch (pattern.type) {
                    case 'rule':
                        refs.push(pattern.name!);
                        break;
                    case 'repeat':
                        refs.push(...this.extractRuleReferences(pattern.pattern!));
                        if (pattern.separator) {
                            refs.push(...this.extractRuleReferences(pattern.separator));
                        }
                        break;
                    case 'optional':
                        refs.push(...this.extractRuleReferences(pattern.pattern!));
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

            private resetState(tokens: Types.Token[]): void {
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

            private getCurrentToken(): Types.Token {
                return this.tokens[this.index];
            }

            private getCurrentSpan(): Types.Span {
                if (this.index === 0) {
                    if (this.tokens.length > 0) {
                        return {
                            start: this.tokens[0].span.start,
                            end: this.tokens[0].span.end
                        };
                    }
                    return { start: 0, end: 0 };
                }

                if (this.index >= this.tokens.length) {
                    const lastToken = this.tokens[this.tokens.length - 1];
                    return {
                        start: lastToken.span.start,
                        end: lastToken.span.end
                    };
                }

                return this.tokens[this.index].span;
            }

            private patternToString(pattern: Types.Pattern): string {
                switch (pattern.type) {
                    case 'token'        : return `token(${pattern.name!})`;
                    case 'rule'         : return `rule(${pattern.name!})`;
                    case 'repeat'       : return `repeat(${this.patternToString(pattern.pattern!)})`;
                    case 'optional'     : return `optional(${this.patternToString(pattern.pattern!)})`;
                    case 'choice'       : return `choice(${pattern.patterns!.map((p: Types.Pattern) => this.patternToString(p)).join('|')})`;
                    case 'seq'          : return `seq(${pattern.patterns!.map((p: Types.Pattern) => this.patternToString(p)).join(' ')})`;
                    default             : return pattern.type;
                }
            }

            private updateLeafRule(ruleName: string): void {
                if (ruleName !== 'unknown' &&
                    !ruleName.includes('<') &&
                    !ruleName.includes('→') && (ruleName.length < 30)) {
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

            static hanldeErrorSpan(span: Types.Span) : Types.Span {
                if(span.start === span.end) { span.end +=1; }
                return span;
            }

            private createError(code: string, msg: string, span: Types.Span | undefined, failedAt: number, tokenIndex: number, prevRule: string, prevInnerRule?: string): Types.ParseError {
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

            private getCustomErrorOr(rule: Types.Rule | null | undefined, defaultError: Types.ParseError): Types.ParseError {
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
                            errorHandler.code || Types.ERRORS.CUSTOM_ERROR,
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
                this.log('verbose', `📍 Types.Rule context: stack=[${this.ruleStack.join(',')} as ${this.patternStack.join(',')}], recent=[${this.successfulRules.slice(-3).join(',')}], leaf=${this.lastLeafRule}, current=${this.lastHandledRule}`);

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
                    rule.length < 30;
            }

            private addError(error: Types.ParseError): void {
                if (this.isInSilentMode()) {return;}

                const maxErrors = this.settings.errorRecovery!.maxErrors!;
                if (maxErrors !== 0 && this.errors.length >= maxErrors) {return;}

                if (this.settings.errorRecovery!.mode === 'strict' && this.errors.length > 0) {return;}

                this.errors.push(error);
                this.log('errors', `⚠️  ${error.msg} @${error.span.start}:${error.span.end}`);
            }

            private handleParseError(error: Types.ParseError, rule?: Types.Rule): never {
                const finalError = this.getCustomErrorOr(rule, error);
                throw finalError;
            }

            private handleFatalError(error: unknown): void {
                const parseError = this.normalizeError(error, this.getCurrentSpan());
                parseError.prevInnerRule = this.getInnerMostRule();
                this.addError(parseError);
                this.log('errors', `💥 Fatal error: ${parseError.msg} @${this.index}`);
            }

            private fetalErrorToParseError(error: Error): Types.ParseError {
                return this.createError(
                    Types.ERRORS.FATAL_ERROR,
                    error.message,
                    this.getCurrentSpan(),
                    0,
                    this.lastVisitedIndex,
                    this.lastHandledRule!,
                    this.getInnerMostRule()
                );
            }

            private normalizeError(error: unknown, defaultSpan: Types.Span): Types.ParseError {
                if (error && typeof error === 'object' && 'msg' in error && 'code' in error && 'span' in error) {
                    const parseError = error as Types.ParseError;
                    if (!parseError.prevInnerRule) {
                        parseError.prevInnerRule = this.getInnerMostRule();
                    }
                    return parseError;
                }

                if (error instanceof Error) {
                    return this.createError(
                        Types.ERRORS.FATAL_ERROR,
                        error.message,
                        defaultSpan,
                        0,
                        this.lastVisitedIndex,
                        this.lastHandledRule!,
                        this.getInnerMostRule()
                    );
                }

                return this.createError(
                    Types.ERRORS.UNKNOWN_ERROR,
                    `Unknown error: ${error}`,
                    defaultSpan,
                    0,
                    this.lastVisitedIndex,
                    this.lastHandledRule!,
                    this.getInnerMostRule()
                );
            }

            private applyRecovery(rule?: Types.Rule, startIndex?: number): void {
                const recovery = rule?.options?.recovery;

                if (recovery) {
                    this.applyRecoveryStrategy(recovery);
                } else {
                    // Only apply default recovery if no custom recovery is defined
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

            private getCustomErrorForCondition(rule: Types.Rule, failedAt: number, tokenIndex: number, _startIndex: number): Types.ParseError | null {
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
                            errorHandler.code || Types.ERRORS.CUSTOM_ERROR,
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

            private applyRecoveryStrategy(strategy: Types.RecoveryStrategy): void {
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

            private log(level: Types.DebugLevel, message: string): void {
                if (this.debugLevel === 'off') {return;}

                const levels: Types.DebugLevel[] = ['off', 'errors', 'rules', 'patterns', 'tokens', 'verbose'];
                const currentIndex = levels.indexOf(this.debugLevel);
                const messageIndex = levels.indexOf(level);

                if (messageIndex <= currentIndex) {
                    const prefix = this.getDebugPrefix(level);
                    console.log(`${prefix} ${message}`);
                }
            }

            private getDebugPrefix(level: Types.DebugLevel): string {
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

            private createMemoKey(pattern: Types.Pattern, position: number, ruleName?: string): string {
                const silentContext = this.isInSilentMode() ? 'S' : 'L';
                const errorContext = this.errors.length > 0 ? `E${this.errors.length}` : 'E0';

                const baseKey = `${pattern.type}:${position}:${silentContext}:${errorContext}`;

                if (ruleName) {
                    const rule = this.rules.get(ruleName);
                    const ruleContext = this.getRuleContext(rule);
                    return `rule:${ruleName}:${ruleContext}:${baseKey}`;
                }

                switch (pattern.type) {
                    case 'token':
                        return `${baseKey}:${pattern.name}:${pattern.value || ''}`;
                    case 'optional':
                        return `${baseKey}:optional`;
                    case 'repeat':
                        return `${baseKey}:${pattern.min || 0}:${pattern.max || 'inf'}:${pattern.separator ? 'sep' : 'nosep'}`;
                    case 'seq':
                    case 'choice':
                        { const patternHash = this.hashPatterns(pattern.patterns || []);
                        return `${baseKey}:${pattern.patterns?.length || 0}:${patternHash}`; }
                    default:
                        return baseKey;
                }
            }

            private getRuleContext(rule?: Types.Rule): string {
                if (!rule) {return 'none';}

                const hasBuilder = rule.options?.build ? 'B' : '';
                const hasErrors = rule.options?.errors?.length ? 'E' : '';
                const hasRecovery = rule.options?.recovery ? 'R' : '';
                const isSilent = rule.options?.silent ? 'S' : '';

                return `${hasBuilder}${hasErrors}${hasRecovery}${isSilent}`;
            }

            private hashPatterns(patterns: Types.Pattern[]): string {
                return patterns.map(p => `${p.type}${p.silent ? 'S' : ''}`).join('');
            }

            private getMemoized(key: string): Types.MemoEntry {
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

            private isCachedResultValid(cached: Types.MemoEntry): boolean {
                if (typeof cached.newIndex !== 'number' || cached.newIndex < 0) {return false;}
                if (cached.newIndex > this.tokens.length) {return false;}
                return true;
            }

            private memoize(key: string, result: Result, startIndex: number, endIndex: number): void {
                if (!this.settings.maxCacheSize || this.memoCache.size >= this.settings.maxCacheSize) {return;}

                if (!result.isFullyPassed() && startIndex === endIndex) {
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

                const memoEntry : Types.MemoEntry = {
                    result          : result.clone(),
                    newIndex        : endIndex,
                    cachedAt        : Date.now(),
                    silentContext   : this.isInSilentMode(),
                    errorCount      : this.errors.length
                };

                this.memoCache.set(key, memoEntry);
                this.log('verbose', `💾 Memo SET: ${key} → ${endIndex}`);
            }

            private shouldUseMemoization(pattern: Types.Pattern, _parentRule?: Types.Rule): boolean {
                if (this.stats.errorsRecovered > 0 && this.errors.length > 0) {return false;}
                if (pattern.type === 'token') {return false;}
                if (pattern.type === 'rule' && this.isRecursiveContext()) {return false;}

                return pattern.type === 'rule' ||
                    pattern.type === 'choice' ||
                    pattern.type === 'seq' ||
                    pattern.type === 'optional' ||
                    (pattern.type === 'repeat' && (pattern.min! > 1 || pattern.max! > 1));
            }

            private isRecursiveContext(): boolean {
                return this.depth > 10;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝