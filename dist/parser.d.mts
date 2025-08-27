interface Token {
    kind: string;
    value: string | null;
    span: Span;
}
interface Span {
    start: number;
    end: number;
}
interface Pattern {
    type: 'token' | 'rule' | 'repeat' | 'choice' | 'seq' | 'optional';
    [key: string]: any;
    silent: boolean;
}
interface ErrorHandler {
    cond: number | ((parser: Parser, opt: {
        failedAt: number;
        tokenIndex: number;
        force?: boolean;
        prevRule?: string;
        prevInnerRule?: string;
    }) => boolean);
    msg: string;
    code?: number;
}
interface RecoveryStrategy {
    type: 'skipUntil';
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
    failedAt: number;
    tokenIndex: number;
    prevRule: string;
    prevInnerRule?: string;
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
    };
    ignored?: string[];
    debug?: DebugLevel;
    maxDepth?: number;
    maxCacheSize?: number;
}
declare const ERRORS: {
    readonly LEXICAL_ERROR: 0;
    readonly TOKEN_EXPECTED_EOF: 1;
    readonly TOKEN_MISMATCH: 2;
    readonly RULE_FAILED: 3;
    readonly BUILD_FUNCTION_FAILED: 4;
    readonly REPEAT_MIN_NOT_MET: 5;
    readonly SEQUENCE_FAILED: 6;
    readonly CUSTOM_ERROR: 7;
    readonly CHOICE_ALL_FAILED: 9;
    readonly FATAL_ERROR: 1028;
    readonly UNKNOWN_ERROR: 1280;
    readonly RECOVERY_CUSTOM: 2457;
};
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
    lastVisitedIndex: number;
    lastHandledRule: string;
    ruleStack: string[];
    patternStack: string[];
    lastInnerRule: string;
    lastCompletedRule: string;
    successfulRules: string[];
    private globalSuccessRules;
    private lastLeafRule;
    constructor(rules: Rule[], settings?: ParserSettings);
    parse(tokens: Token[]): ParseResult;
    private parseWithRecovery;
    protected parsePattern(pattern: Pattern, parentRule?: Rule): any;
    private executePattern;
    private parseToken;
    protected parseRule(ruleName: string, parentRule?: Rule, shouldBeSilent?: boolean): any;
    private parseOptional;
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
    private patternToString;
    private updateLeafRule;
    private trimSuccessfulRules;
    isNextToken(type: string, ignoredTokens?: string[]): boolean;
    isPrevToken(type: string, startIndex?: number, ignoredTokens?: string[]): boolean;
    isPrevRule(name: string): boolean;
    private createError;
    private getCustomErrorOr;
    private getInnerMostRule;
    private isMeaningfulRule;
    private addError;
    private handleParseError;
    private handleFatalError;
    private normalizeError;
    private applyRecovery;
    private getCustomErrorForCondition;
    private applyRecoveryStrategy;
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
declare const createRule: (name: string, pattern: Pattern, options?: Rule["options"]) => Rule;
declare function token(name: string, silent?: boolean): Pattern;
declare function rule(name: string, silent?: boolean): Pattern;
declare function repeat(pattern: Pattern, min?: number, max?: number, separator?: Pattern, silent?: boolean): Pattern;
declare function oneOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function zeroOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function zeroOrOne(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function optional(pattern: Pattern, silent?: boolean): Pattern;
declare function choice(...patterns: Pattern[]): Pattern;
declare function seq(...patterns: Pattern[]): Pattern;
declare function silent<T extends Pattern>(pattern: T): T;
declare function loud<T extends Pattern>(pattern: T): T;
declare function error(cond: ErrorHandler['cond'], msg: string, code?: number): ErrorHandler;
declare const errorRecoveryStrategies: {
    skipUntil(tokens: string | string[]): RecoveryStrategy;
};
declare function getMatchesSpan(matches: any[]): Span;
declare function resWithoutSpan(res: any): any;
declare function isOptionalPassed(res: any[]): boolean;
declare function getOptional(res: any[], ret?: any, index?: number, isSeq?: boolean): any;

export { type AstNode, type BaseAstNode, type DebugLevel, ERRORS, type ErrorHandler, type ParseError, type ParseResult, type ParseStatistics, Parser, type ParserSettings, type Pattern, type RecoveryStrategy, type Rule, type Rules, type Span, type Token, choice, createRule, error, errorRecoveryStrategies, getMatchesSpan, getOptional, isOptionalPassed, loud, oneOrMore, optional, parse, repeat, resWithoutSpan, rule, seq, silent, token, zeroOrMore, zeroOrOne };
