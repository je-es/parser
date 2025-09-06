// types.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Parser } from './core';
    import { Result } from './result';
    export { Parser } from './core';
    export { Result } from './result';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface Token {
        kind            : string;
        value           : string | null;
        span            : Span;
    }

    export interface MiniToken {
        kind            : string;
        value           : string | null;
    }

    export interface Span {
        start           : number;
        end             : number;
    }

    export interface Pattern {
        type            : 'token' | 'rule' | 'repeat' | 'choice' | 'seq' | 'optional';
        silent          : boolean;
        name           ?: string;       // for rule and token
        min            ?: number;       // for repeat
        max            ?: number;       // for repeat
        patterns       ?: Pattern[];    // for seq, choice, optional, repeat
        separator      ?: Pattern;      // for repeat
        pattern        ?: Pattern;      // for optional
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

    export type BuildFunction = (matches: Result) => Result;

    export interface Rule {
        name            : string;
        pattern         : Pattern;
        options?        : {
            build?      : BuildFunction;
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
        ast             : Result[];
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

    export interface MemoEntry {
        result         ?: Result | null;
        newIndex       ?: number;
        cachedAt       ?: number;
        silentContext  ?: boolean;
        errorCount     ?: number;
        hit            ?: boolean;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝