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
interface AstNode {
    rule: string;
    span: Span;
    value?: string | number | boolean | null;
}
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
    parse(tokens: Token[]): ParseResult;
    private parseWithRecovery;
    protected parsePattern(pattern: Pattern, parentRule?: Rule): any;
    private parseToken;
    protected parseRule(ruleName: string, parentRule?: Rule, shouldBeSilent?: boolean): any;
    private parseRepeat;
    private parseChoice;
    private parseSequence;
    private safeBuild;
    /**
     * Determines if a pattern should be parsed in silent mode
     */
    private shouldBeSilent;
    /**
     * Checks if we're currently in silent parsing mode
     */
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
declare function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult;
declare function createRule(name: string, pattern: Pattern, options?: Rule['options']): Rule;
declare function token(name: string, silent?: boolean): Pattern;
declare function rule(name: string, silent?: boolean): Pattern;
declare function repeat(pattern: Pattern, min?: number, max?: number, separator?: Pattern, silent?: boolean): Pattern;
declare function oneOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function zeroOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function zeroOrOne(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function optional(pattern: Pattern): Pattern;
declare function choice(...patterns: Pattern[]): Pattern;
declare function seq(...patterns: Pattern[]): Pattern;
declare function errorOrArrayOfOne(pattern: Pattern, silent?: boolean): Pattern;
declare function silent<T extends Pattern>(pattern: T): T;
declare function loud<T extends Pattern>(pattern: T): T;
declare function error(cond: ErrorHandler['cond'], msg: string, code?: number): ErrorHandler;
declare const errorRecoveryStrategies: {
    panicMode(): RecoveryStrategy;
    skipUntil(tokens: string | string[]): RecoveryStrategy;
};
declare function getMatchesSpan(matches: any[]): Span | undefined;
declare function resWithoutSpan(res: any): any;

export { type AstNode, type DebugLevel, type ErrorHandler, type ParseError, type ParseResult, type ParseStatistics, Parser, type ParserSettings, type Pattern, type RecoveryStrategy, type Rule, type Rules, type Span, type Token, choice, createRule, error, errorOrArrayOfOne, errorRecoveryStrategies, getMatchesSpan, loud, oneOrMore, optional, parse, repeat, resWithoutSpan, rule, seq, silent, token, zeroOrMore, zeroOrOne };
