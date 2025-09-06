type ResultStatus = 'unset' | 'failed' | 'passed';
type ResultMode = 'unset' | 'token' | 'optional' | 'choice' | 'repeat' | 'seq';
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
type ResultSource = TokenSource | OptionalSource | ChoiceSource | RepeatSource | SequenceSource | null;
declare class Result {
    status: ResultStatus;
    source: ResultSource;
    mode: ResultMode;
    errors: ParseError[];
    constructor(status?: ResultStatus, source?: ResultSource, mode?: ResultMode);
    clone(): Result;
    static create(status?: ResultStatus, source?: ResultSource, mode?: ResultMode): Result;
    static createAsToken(status?: ResultStatus, source?: Token): Result;
    static createAsOptional(status?: ResultStatus, source?: Result): Result;
    static createAsChoice(status?: ResultStatus, source?: Result, index?: number): Result;
    static createAsRepeat(status?: ResultStatus, source?: Result[]): Result;
    static createAsSequence(status?: ResultStatus, source?: Result[]): Result;
    withError(err: ParseError): Result;
    isPassed(): boolean;
    isFailed(): boolean;
    isUnset(): boolean;
    isToken(): boolean;
    isOptional(): boolean;
    isOptionalMatched(): boolean;
    isChoice(): boolean;
    isRepeat(): boolean;
    isSequence(): boolean;
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
    static hanldeErrorSpan(span: Span): Span;
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
    private createError;
    private getCustomErrorOr;
    private getInnerMostRule;
    private isMeaningfulRule;
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

type core_Parser = Parser;
declare const core_Parser: typeof Parser;
declare namespace core {
  export { core_Parser as Parser };
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
interface AstNode {
    rule: string;
    span: Span;
    data?: unknown;
}
interface ParseError {
    msg: string;
    code: string;
    span: Span;
    failedAt: number;
    tokenIndex: number;
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

type Types_AstNode = AstNode;
type Types_BuildFunction = BuildFunction;
type Types_DebugLevel = DebugLevel;
declare const Types_ERRORS: typeof ERRORS;
type Types_ErrorHandler = ErrorHandler;
type Types_MemoEntry = MemoEntry;
type Types_MiniToken = MiniToken;
type Types_ParseError = ParseError;
type Types_ParseResult = ParseResult;
type Types_ParseStatistics = ParseStatistics;
type Types_Parser = Parser;
declare const Types_Parser: typeof Parser;
type Types_ParserSettings = ParserSettings;
type Types_Pattern = Pattern;
type Types_RecoveryStrategy = RecoveryStrategy;
type Types_Result = Result;
declare const Types_Result: typeof Result;
type Types_Rule = Rule;
type Types_Rules = Rules;
type Types_Span = Span;
type Types_Token = Token;
declare namespace Types {
  export { type Types_AstNode as AstNode, type Types_BuildFunction as BuildFunction, type Types_DebugLevel as DebugLevel, Types_ERRORS as ERRORS, type Types_ErrorHandler as ErrorHandler, type Types_MemoEntry as MemoEntry, type Types_MiniToken as MiniToken, type Types_ParseError as ParseError, type Types_ParseResult as ParseResult, type Types_ParseStatistics as ParseStatistics, Types_Parser as Parser, type Types_ParserSettings as ParserSettings, type Types_Pattern as Pattern, type Types_RecoveryStrategy as RecoveryStrategy, Types_Result as Result, type Types_Rule as Rule, type Types_Rules as Rules, type Types_Span as Span, type Types_Token as Token };
}

declare function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult;
declare const createRule: (name: string, pattern: Pattern, options?: Rule["options"]) => Rule;
declare function token(name: string, silent?: boolean): Pattern;
declare function optional(pattern: Pattern, silent?: boolean): Pattern;
declare function choice(...patterns: Pattern[]): Pattern;
declare function repeat(pattern: Pattern, min?: number, max?: number, separator?: Pattern, silent?: boolean): Pattern;
declare function oneOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function zeroOrMore(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function zeroOrOne(pattern: Pattern, separator?: Pattern, silent?: boolean): Pattern;
declare function seq(...patterns: Pattern[]): Pattern;
declare function silent<T extends Pattern>(pattern: T): T;
declare function loud<T extends Pattern>(pattern: T): T;
declare function error(cond: ErrorHandler['cond'], msg: string, code?: string): ErrorHandler;
declare const errorRecoveryStrategies: {
    skipUntil(tokens: string | string[]): RecoveryStrategy;
};

export { Types, choice, core, createRule, error, errorRecoveryStrategies, loud, oneOrMore, optional, parse, repeat, seq, silent, token, zeroOrMore, zeroOrOne };
