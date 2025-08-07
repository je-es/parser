/** Represents a token with type, value and position information */
interface Token {
    type: string;
    value: string | null;
    pos: Position;
}
/** Represents a position in the source text */
interface Position {
    line: number;
    col: number;
    offset: number;
}
interface ParseError {
    message: string;
    position: Position;
    suggestions?: string[];
    context?: string;
    severity?: 'error' | 'warning' | 'info';
    code?: string;
    range?: {
        start: Position;
        end: Position;
    };
}
interface AstNode {
    type: string;
    pos?: Position;
    child?: AstNode[];
    value?: string | number | boolean | null;
    meta?: Record<string, unknown>;
}
interface ParseResult {
    ast: AstNode[];
    errors: ParseError[];
    statistics?: ParseStatistics;
}
interface ParseStatistics {
    tokensProcessed: number;
    rulesApplied: number;
    errorsRecovered: number;
    parseTimeMs: number;
    memoryUsedKB?: number;
    cacheHitRate?: number;
}
interface ParserSettings {
    startRule: string;
    errorRecovery: {
        mode: 'strict' | 'resilient';
        maxErrors: number;
        syncTokens: string[];
    };
    ignored: string[];
    debug: boolean;
    maxDepth: number;
    enableMemoization: boolean;
    maxCacheSize: number;
    enableProfiling: boolean;
}
interface Pattern {
    type: 'token' | 'rule' | 'seq' | 'choice' | 'repeat' | 'optional';
    [key: string]: any;
}
interface Rule {
    name: string;
    pattern: Pattern;
    options?: {
        build?: (matches: any[]) => any;
        errors?: ErrorHandler[];
        recovery?: RecoveryStrategy;
        ignored?: string[];
        memoizable?: boolean;
    };
}
type Rules = Rule[];
interface ErrorHandler {
    condition: (parser: Parser, failedAt: number) => boolean;
    message: string;
    suggestions: string[];
    code?: string;
    severity?: 'error' | 'warning' | 'info';
}
interface RecoveryStrategy {
    type: 'panic' | 'skipUntil' | 'insertToken' | 'deleteToken';
    tokens?: string[];
    token?: string;
    insertValue?: string;
}
declare class Parser {
    private tokens;
    private ast;
    private position;
    private rules;
    private settings;
    private depth;
    errors: ParseError[];
    private memoCache;
    private nodePool;
    private ignoredSet;
    private ruleSet;
    private stats;
    private startTime;
    private cacheHits;
    private cacheMisses;
    private maxIterations;
    private disposed;
    constructor(rules: Rule[], settings: ParserSettings);
    /**
     * Parses an array of tokens into an AST using the configured grammar rules.
     * @param tokens Array of tokens to parse
     * @returns ParseResult containing the AST and any parsing errors
     */
    parse(tokens: Token[]): ParseResult;
    private parsePattern;
    private parseToken;
    private parseSequence;
    private parseChoice;
    private parseRepeat;
    private parseOptional;
    private parseRule;
    private detectInfiniteLoop;
    private safeBuild;
    private getMemoKey;
    private cacheMemoResult;
    private handleError;
    private handleRuleError;
    private applyRecoveryStrategy;
    private skipUntilTokens;
    private defaultErrorRecovery;
    private getCurrentPosition;
    private getCurrentToken;
    private getContext;
    private skipIgnored;
    private addError;
    private debug;
    private validateInput;
    private normalizeSettings;
    private validateGrammar;
    private extractRuleReferences;
    private hasDirectLeftRecursion;
    private checkLeftRecursion;
    private resetState;
    private createResult;
    /**
     * Clears internal caches and resets parser state.
     * Call this periodically for long-running applications.
     */
    clearCaches(): void;
    /**
     * Returns current cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
    /**
     * Disposes of the parser and frees resources.
     * Parser cannot be reused after calling this method.
     */
    dispose(): void;
}
/**
 * Main parsing function - creates a parser instance and parses tokens
 * @param tokens Array of tokens to parse
 * @param rules Grammar rules
 * @param settings Parser configuration
 * @returns Parse result with AST and errors
 */
declare function parse(tokens: Token[], rules: Rules, settings?: Partial<ParserSettings>): ParseResult;
/**
 * Creates a reusable parser instance
 * @param rules Grammar rules
 * @param settings Parser configuration
 * @returns Parser instance
 */
declare function createParser(rules: Rules, settings?: Partial<ParserSettings>): Parser;
/**
 * Validates a grammar without creating a parser
 * @param rules Grammar rules to validate
 * @param startRule Start rule name
 * @returns Array of validation issues (empty if valid)
 */
declare function validateGrammar(rules: Rules, startRule?: string): string[];
/**
 * Creates a rule with the given name, pattern, and options
 * @param name Rule name
 * @param pattern Rule pattern
 * @param options Rule options
 * @returns Rule object
 */
declare function createRule(name: string, pattern: Pattern, options?: Rule['options']): Rule;
/**
 * Creates a token pattern that matches a specific token type
 */
declare function token(name: string): Pattern;
/**
 * Creates a rule reference pattern
 */
declare function rule(name: string): Pattern;
/**
 * Creates a sequence pattern that matches all patterns in order
 */
declare function seq(...patterns: Pattern[]): Pattern;
/**
 * Creates a choice pattern that matches any one of the given patterns
 */
declare function choice(...patterns: Pattern[]): Pattern;
/**
 * Creates a repeat pattern with optional min/max bounds and separator
 */
declare function repeat(pattern: Pattern, min?: number, max?: number, separator?: Pattern): Pattern;
/**
 * Creates an optional pattern (equivalent to repeat(pattern, 0, 1))
 */
declare function optional(pattern: Pattern): Pattern;
/**
 * Creates a one-or-more repeat pattern
 */
declare function oneOrMore(pattern: Pattern, separator?: Pattern): Pattern;
/**
 * Creates a zero-or-more repeat pattern
 */
declare function zeroOrMore(pattern: Pattern, separator?: Pattern): Pattern;
/**
 * Creates an error handler for rules
 */
declare function error(condition: ErrorHandler['condition'], message: string, suggestions?: string[], code?: string, severity?: 'error' | 'warning' | 'info'): ErrorHandler;
declare const errorRecoveryStrategies: {
    /**
     * Panic mode recovery - skip to synchronization tokens
     */
    panicMode(): RecoveryStrategy;
    /**
     * Skip until specific tokens are found
     */
    skipUntil(tokens: string | string[]): RecoveryStrategy;
    /**
     * Virtual token insertion (doesn't modify token stream)
     */
    insertToken(token: string, value?: string): RecoveryStrategy;
    /**
     * Skip the current token
     */
    deleteToken(): RecoveryStrategy;
};
declare const contextConditions: {
    /**
     * Condition for when a specific token is missing
     */
    missingToken(tokenName: string): (parser: Parser, failedAt: number) => boolean;
    /**
     * Condition for when an unexpected token is encountered
     */
    unexpectedToken(tokenName?: string): (parser: Parser, failedAt: number) => boolean;
    /**
     * Condition for premature end of input
     */
    prematureEnd(): (parser: Parser, failedAt: number) => boolean;
    /**
     * Custom condition based on parser state
     */
    custom(predicate: (parser: Parser, failedAt: number) => boolean): (parser: Parser, failedAt: number) => boolean;
};

export { type AstNode, type ErrorHandler, type ParseError, type ParseResult, type ParseStatistics, Parser, type ParserSettings, type Pattern, type Position, type RecoveryStrategy, type Rule, type Rules, type Token, choice, contextConditions, createParser, createRule, error, errorRecoveryStrategies, oneOrMore, optional, parse, repeat, rule, seq, token, validateGrammar, zeroOrMore };
