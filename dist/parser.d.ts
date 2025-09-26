type ResultStatus = 'unset' | 'failed' | 'passed';
type ResultMode = 'unset' | 'token' | 'optional' | 'choice' | 'repeat' | 'seq' | 'custom';
interface TokenSource {
    source_kind: 'token-source';
    kind: string;
    value?: string;
    span?: Span;
}
interface OptionalSource {
    source_kind: 'optional-source';
    result: Result | null;
}
interface ChoiceSource {
    source_kind: 'choice-source';
    atIndex: number;
    result: Result | null;
}
interface RepeatSource {
    source_kind: 'repeat-source';
    result: Result[];
}
interface SequenceSource {
    source_kind: 'sequence-source';
    result: Result[];
}
interface CustomSource {
    source_kind: 'custom-source';
    tag: string;
    data: unknown;
}
type ResultSource = TokenSource | OptionalSource | ChoiceSource | RepeatSource | SequenceSource | CustomSource | null;
declare class Result {
    span: Span;
    status: ResultStatus;
    source: ResultSource;
    mode: ResultMode;
    errors: ParseError[];
    constructor(status: ResultStatus, source: ResultSource | null, mode: ResultMode, span: Span);
    clone(): Result;
    static create(status: ResultStatus, source: ResultSource | null, mode: ResultMode, span: Span): Result;
    static createAsToken(status: ResultStatus, source: Token | null, span: Span): Result;
    static createAsOptional(status: ResultStatus, source: Result | null, span: Span): Result;
    static createAsChoice(status: ResultStatus, source: Result | null, index: number, span: Span): Result;
    static createAsRepeat(status: ResultStatus, source: Result[] | null, span: Span): Result;
    static createAsSequence(status: ResultStatus, source: Result[] | null, span: Span): Result;
    static createAsCustom(status: ResultStatus, name: string, data: unknown, span: Span): Result;
    withError(err: ParseError): Result;
    isPassed(): boolean;
    isFullyPassed(): boolean;
    isFailed(): boolean;
    isUnset(): boolean;
    isToken(): boolean;
    isOptional(): boolean;
    isOptionalPassed(): boolean;
    isChoice(): boolean;
    isRepeat(): boolean;
    isSequence(): boolean;
    isCustom(tag?: string): boolean;
    getTokenKind(): string | undefined;
    getTokenValue(): string | null | undefined;
    getTokenSpan(): Span | undefined;
    getTokenData(): Token | undefined;
    getOptionalResult(): Result | null | undefined;
    getChoiceIndex(): number | undefined;
    getChoiceResult(): Result | null | undefined;
    getRepeatCount(): number | undefined;
    getRepeatResult(): Result[] | undefined;
    getSequenceCount(): number | undefined;
    getSequenceResult(): Result[] | undefined;
    getCustomData(): unknown | undefined;
    hasErrors(): boolean;
}

declare class Parser {
    rules: Map<string, Rule>;
    settings: ParserSettings;
    tokens: Token[];
    ast: Result[];
    errors: ParseError[];
    index: number;
    depth: number;
    private rootStartIndex;
    private debugLevel;
    private indentLevel;
    stats: ParseStatistics;
    startTime: number;
    errorSeq: number;
    memoCache: Map<string, MemoEntry>;
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
    protected parsePattern(pattern: Pattern, parentRule?: Rule): Result;
    private executePattern;
    private parseToken;
    private parseRule;
    private parseOptional;
    private parseChoice;
    private parseRepeat;
    private parseSequence;
    private safeBuild;
    private shouldBeSilent;
    private isInSilentMode;
    private normalizeSettings;
    private validateGrammar;
    private extractRuleReferences;
    private skipIgnored;
    private skipUntilTokens;
    private resetState;
    private getCurrentToken;
    private getCurrentSpan;
    private patternToString;
    private updateLeafRule;
    private trimSuccessfulRules;
    isNextToken(type: string, ignoredTokens?: string[]): boolean;
    isPrevToken(type: string, startIndex?: number, ignoredTokens?: string[]): boolean;
    isPrevRule(name: string): boolean;
    static hanldeErrorSpan(span: Span): Span;
    private createError;
    private getCustomErrorOr;
    private getInnerMostRule;
    private isMeaningfulRule;
    private isSpanCovered;
    private addError;
    private handleParseError;
    private handleFatalError;
    private fetalErrorToParseError;
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

interface Token {
    kind: string;
    value: string | null;
    span: Span;
}
interface MiniToken {
    kind: string;
    value: string | null;
}
interface Span {
    start: number;
    end: number;
}
interface Pattern {
    type: 'token' | 'rule' | 'repeat' | 'choice' | 'seq' | 'optional';
    silent: boolean;
    value?: string;
    name?: string;
    min?: number;
    max?: number;
    patterns?: Pattern[];
    separator?: Pattern;
    pattern?: Pattern;
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
    code?: string;
}
interface RecoveryStrategy {
    type: 'skipUntil';
    tokens?: string[];
    token?: string;
}
type BuildFunction = (matches: Result) => Result;
interface Rule {
    name: string;
    pattern: Pattern;
    options?: {
        build?: BuildFunction;
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
interface ParseError {
    msg: string;
    code: string;
    span: Span;
    failedAt: number;
    tokenIndex: number;
    startIndex: number;
    prevRule: string;
    prevInnerRule?: string;
}
interface ParseResult {
    ast: Result[];
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
    readonly LEXICAL_ERROR: "LEXICAL_ERROR";
    readonly TOKEN_EXPECTED_EOF: "TOKEN_EXPECTED_EOF";
    readonly TOKEN_MISMATCH: "TOKEN_MISMATCH";
    readonly RULE_FAILED: "RULE_FAILED";
    readonly BUILD_FUNCTION_FAILED: "BUILD_FUNCTION_FAILED";
    readonly REPEAT_MIN_NOT_MET: "REPEAT_MIN_NOT_MET";
    readonly SEQUENCE_FAILED: "SEQUENCE_FAILED";
    readonly CUSTOM_ERROR: "CUSTOM_ERROR";
    readonly CHOICE_ALL_FAILED: "CHOICE_ALL_FAILED";
    readonly FATAL_ERROR: "FATAL_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly RECOVERY_CUSTOM: "RECOVERY_CUSTOM";
};
interface MemoEntry {
    result?: Result | null;
    newIndex?: number;
    cachedAt?: number;
    silentContext?: boolean;
    errorCount?: number;
    hit?: boolean;
}

declare function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult;
declare const createRule: (name: string, pattern: Pattern, options?: Rule["options"]) => Rule;
declare function token(name: string, value?: string): Pattern;
declare function optional(pattern: Pattern): Pattern;
declare function choice(...patterns: Pattern[]): Pattern;
declare function repeat(pattern: Pattern, min?: number, max?: number, separator?: Pattern): Pattern;
declare function oneOrMore(pattern: Pattern, separator?: Pattern): Pattern;
declare function zeroOrMore(pattern: Pattern, separator?: Pattern): Pattern;
declare function zeroOrOne(pattern: Pattern, separator?: Pattern): Pattern;
declare function seq(...patterns: Pattern[]): Pattern;
declare function rule(name: string): Pattern;
declare function silent<T extends Pattern>(pattern: T): T;
declare function loud<T extends Pattern>(pattern: T): T;
declare function error(cond: ErrorHandler['cond'], msg: string, code?: string): ErrorHandler;
declare const errorRecoveryStrategies: {
    skipUntil(tokens: string | string[]): RecoveryStrategy;
};

export { type BuildFunction, type DebugLevel, ERRORS, type ErrorHandler, type MiniToken, type ParseError, type ParseResult, Parser, type ParserSettings, type Pattern, type RecoveryStrategy, Result, type Rule, type Rules, type Span, type Token, choice, createRule, error, errorRecoveryStrategies, loud, oneOrMore, optional, parse, repeat, rule, seq, silent, token, zeroOrMore, zeroOrOne };
