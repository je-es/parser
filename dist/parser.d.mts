interface Span {
    start: number;
    end: number;
}
interface Token {
    type: string;
    value: string | null;
    span: Span;
}
interface Pattern {
    type: 'token' | 'rule' | 'repeat' | 'choice' | 'seq';
    [key: string]: any;
    silent: boolean;
}
interface ErrorHandler {
    cond: number | ((parser: Parser, failedAt: number, force?: boolean) => boolean);
    msg: string;
    code?: number;
}
interface RecoveryStrategy {
    type: 'panic' | 'skipUntil';
    tokens?: string[];
    token?: string;
}
interface Rule {
    name: string;
    pattern: Pattern;
    options?: {
        build?: (matches: any[]) => any;
        errors?: ErrorHandler[];
        recovery?: RecoveryStrategy;
        ignored?: string[];
        silent?: boolean;
    };
}
type Rules = Rule[];
interface ParseStatistics {
    tokensProcessed: number;
    rulesApplied: number;
    errorsRecovered: number;
    parseTimeMs: number;
}
type BaseAstNode = {
    rule: string;
    span: Span;
    value?: string | number | boolean | null;
};
type AstNode = BaseAstNode | any;
interface ParseError {
    msg: string;
    code: number;
    span: Span;
}
interface ParseResult {
    ast: AstNode[];
    errors: ParseError[];
    statistics?: ParseStatistics;
}
type DebugLevel = 'off' | 'errors' | 'rules' | 'patterns' | 'tokens' | 'verbose';
interface ParserSettings {
    startRule: string;
    errorRecovery?: {
        mode?: 'strict' | 'resilient';
        maxErrors?: number;
        syncTokens?: string[];
    };
    ignored?: string[];
    debug?: DebugLevel;
    maxDepth?: number;
    maxCacheSize?: number;
}
/**
 * Parser class for advanced syntax analysis.
 * Parses tokens into AST with customizable grammar rules and intelligent error detection.
 * @class
*/
declare class Parser {
    rules: Map<string, Rule>;
    settings: ParserSettings;
    tokens: Token[];
    ast: AstNode[];
    errors: ParseError[];
    index: number;
    depth: number;
    private debugLevel;
    private indentLevel;
    stats: ParseStatistics;
    startTime: number;
    errorSeq: number;
    memoCache: Map<string, any>;
    ignoredSet: Set<string>;
    memoHits: number;
    memoMisses: number;
    private silentContextStack;
    constructor(rules: Rule[], settings?: ParserSettings);
    /**
     * Parses the given tokens using the defined rules and returns the AST and errors.
     *
     * @param {Token[]} tokens - The tokens to parse.
     *
     * @return {ParseResult} The AST and errors generated during parsing.
    */
    parse(tokens: Token[]): ParseResult;
    private parseWithRecovery;
    protected parsePattern(pattern: Pattern, parentRule?: Rule): any;
    private parseToken;
    protected parseRule(ruleName: string, parentRule?: Rule, shouldBeSilent?: boolean): any;
    private parseRepeat;
    private parseChoice;
    private parseSequence;
    private safeBuild;
    private shouldBeSilent;
    private isInSilentMode;
    private normalizeSettings;
    private validateGrammar;
    private extractRuleReferences;
    private skipIgnored;
    private skipUntilTokens;
    private deepClone;
    private resetState;
    private getCurrentToken;
    private getCurrentSpan;
    isNextToken(type: string, ignoredTokens?: string[]): boolean;
    isPrevToken(type: string, ignoredTokens?: string[]): boolean;
    private createError;
    private addError;
    private handleParseError;
    private handleFatalError;
    private getCustomErrorOr;
    private normalizeError;
    private applyRecovery;
    private applyRecoveryStrategy;
    private defaultErrorRecovery;
    private log;
    private getDebugPrefix;
    dispose(): void;
    private cleanMemoCache;
    private createMemoKey;
    private getRuleContext;
    private hashPatterns;
    private getMemoized;
    private isCachedResultValid;
    private memoize;
    private shouldUseMemoization;
    private isRecursiveContext;
}
/**
 * Parses an array of tokens using the provided rules and settings.
 * @param tokens    - The array of tokens to parse.
 * @param rules     - The set of rules to use for parsing.
 * @param settings  - Additional settings to customize parsing behavior.
 *
 * @returns The result of the parsing operation, including the parsed AST and any errors encountered.
*/
declare function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult;
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
declare function createRule(name: string, pattern: Pattern, options?: Rule['options']): Rule;
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
declare function token(name: string, silent?: boolean): Pattern;
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
declare function rule(name: string, silent?: boolean): Pattern;
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
declare function repeat(pattern: Pattern, min?: number, max?: number, separator?: Pattern, silent?: boolean): Pattern;
/**
 * Creates a new pattern that matches one or more occurrences of the given pattern.
 *
 * @param {Pattern} pattern         - The pattern to match one or more times.
 * @param {Pattern} [separator]     - A pattern to match between occurrences.
 * @param {boolean} [silent=false]  - A flag that indicates whether the matched text should be hidden in the output.
 *
 * @return {Pattern} A new pattern that matches one or more occurrences of the given pattern.
*/
declare function oneOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
/**
 * Creates a new pattern that matches zero or more occurrences of the given pattern.
 *
 * @param {Pattern} pattern         - The pattern to match zero or more times.
 * @param {Pattern} [separator]     - A pattern to match between occurrences.
 * @param {boolean} [silent=false]  - A flag that indicates whether the matched text should be hidden in the output.
 *
 * @return {Pattern} A new pattern that matches zero or more occurrences of the given pattern.
*/
declare function zeroOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
/**
 * Creates a new pattern that matches zero or one occurrence of the given pattern.
 *
 * @param {Pattern} pattern         - The pattern to match zero or one time.
 * @param {Pattern} [separator]     - A pattern to match between occurrences.
 * @param {boolean} [silent=true]   - A flag that indicates whether the matched text should be hidden in the output.
 *
 * @return {Pattern} A new pattern that matches zero or one occurrence of the given pattern.
*/
declare function zeroOrOne(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
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
declare function errorOrArrayOfOne(pattern: Pattern, silent?: boolean): Pattern;
/**
 * Creates a new pattern that matches zero or one occurrence of the given pattern.
 *
 * @param {Pattern} pattern     - The pattern to match zero or one time.
 *
 * @return {Pattern} A new pattern that matches zero or one occurrence of the given pattern.
*/
declare function optional(pattern: Pattern): Pattern;
/**
 * Creates a new pattern that matches one of multiple patterns. Throws an error if the choice has no patterns.
 *
 * @param {...Pattern} patterns     - The patterns to match, at least one is required.
 *
 * @return {Pattern} A new pattern that matches one of the given patterns.
 *
 * @throws {Error} Throws an error if the choice has no patterns.
 */
declare function choice(...patterns: Pattern[]): Pattern;
/**
 * Creates a new pattern that matches multiple patterns in sequence. Throws an error if the sequence has no patterns.
 *
 * @param {...Pattern} patterns     - The patterns to match in sequence.
 *
 * @return {Pattern} A new pattern that matches the given patterns in sequence.
 *
 * @throws {Error} Throws an error if the sequence has no patterns.
*/
declare function seq(...patterns: Pattern[]): Pattern;
/**
 * Creates a new pattern that matches the given pattern but is not outputted
 * in the AST.
 *
 * @param {Pattern} pattern     - The pattern to match but not output.
 *
 * @return {Pattern} A new pattern that matches the given pattern but is not
 * outputted in the AST.
 */
declare function silent<T extends Pattern>(pattern: T): T;
/**
 * Creates a new pattern that matches the given pattern and is outputted in
 * the AST.
 *
 * @param {Pattern} pattern     - The pattern to match and output.
 *
 * @return {Pattern} A new pattern that matches the given pattern and is
 * outputted in the AST.
 */
declare function loud<T extends Pattern>(pattern: T): T;
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
declare function error(cond: ErrorHandler['cond'], msg: string, code?: number): ErrorHandler;
/**
 * A collection of error recovery strategies.
 *
 * @type {Object}
 * @property {RecoveryStrategy} panicMode - Creates a recovery strategy that stops parsing and throws an error with code 0xAAA.
 * @property {RecoveryStrategy} skipUntil - Creates a recovery strategy that skips input tokens until it finds any of the given tokens.
*/
declare const errorRecoveryStrategies: {
    /**
     * Creates a recovery strategy that stops parsing and throws an error with code 0xAAA.
     *
     * @return {RecoveryStrategy} A recovery strategy that stops parsing.
     */
    panicMode(): RecoveryStrategy;
    /**
     * Creates a recovery strategy that skips input tokens until it finds any of the given tokens.
     *
     * @param {string | string[]} tokens - The tokens to skip until.
     * @return {RecoveryStrategy} A recovery strategy that skips input tokens until it finds any of the given tokens.
     */
    skipUntil(tokens: string | string[]): RecoveryStrategy;
};
/**
 * Returns the smallest span that encompasses all the given matches, or the span of the first match
 * if there are no matches.
 *
 * @param {any[]} matches - An array of matches each containing a span property.
 *
 * @return {Span | undefined} The smallest span that encompasses all the given matches, or the span
 * of the first match if there are no matches.
 */
declare function getMatchesSpan(matches: any[]): Span;
/**
 * Returns a new object that is a shallow copy of the given 'res' object, but without the 'span' property.
 *
 * @param {any} res - An object to be copied, with any 'span' property removed.
 *
 * @return {any} A new object that is a shallow copy of the given 'res' object, but without the 'span' property.
 */
declare function resWithoutSpan(res: any): any;

export { type AstNode, type BaseAstNode, type DebugLevel, type ErrorHandler, type ParseError, type ParseResult, type ParseStatistics, Parser, type ParserSettings, type Pattern, type RecoveryStrategy, type Rule, type Rules, type Span, type Token, choice, createRule, error, errorOrArrayOfOne, errorRecoveryStrategies, getMatchesSpan, loud, oneOrMore, optional, parse, repeat, resWithoutSpan, rule, seq, silent, token, zeroOrMore, zeroOrOne };
