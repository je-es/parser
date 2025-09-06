// parser.ts — Advanced syntax analyzer that converts tokens
//             into AST with customizable grammar rules and intelligent error detection.
//
// repo   : https://github.com/je-es/parser
// author : https://github.com/maysara-elshewehy
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as Types from './types';
    export * as Types from './types';

    import * as core from './core';
    export * as core from './core';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ MAIN ════════════════════════════════════════╗

    // ┌──────────────────────────────── BASE ──────────────────────────────┐

        export function parse(tokens: Types.Token[], rules: Types.Rules, settings?: Types.ParserSettings): Types.ParseResult {
            const parser = new core.Parser(rules, settings);
            try {
                return parser.parse(tokens);
            } finally {
                parser.dispose();
            }
        }

        export const createRule = ( name: string, pattern: Types.Pattern, options: Types.Rule['options'] = {} ): Types.Rule => {
            const finalOptions = { name, silent: false, ...options, };
            return { name, pattern: pattern, options: finalOptions, };
        };

    // └────────────────────────────────────────────────────────────────────┘


    // ┌──────────────────────────────── CTRL ──────────────────────────────┐

        export function token(name: string, silent = false): Types.Pattern {
            if (!name || typeof name !== 'string') {
                throw new Error('Token name must be a non-empty string');
            }
            return { type: 'token', name, silent };
        }

        export function optional(pattern: Types.Pattern, silent = false): Types.Pattern {
            if (!pattern || typeof pattern !== 'object') {
                throw new Error('Optional pattern must be a valid pattern');
            }
            return { type: 'optional', pattern, silent };
        }

        export function choice(...patterns: Types.Pattern[]): Types.Pattern {
            if (patterns.length === 0) {
                throw new Error('Choice must have at least one pattern');
            }
            return { type: 'choice', patterns, silent: false };
        }

        export function repeat(pattern: Types.Pattern, min = 0, max = Infinity, separator?: Types.Pattern, silent = false): Types.Pattern {
            if (min < 0) {
                throw new Error('Minimum repetition count cannot be negative');
            }
            if (max < min) {
                throw new Error('Maximum repetition count cannot be less than minimum');
            }
            return { type: 'repeat', pattern, min, max, separator, silent };
        }

        export function oneOrMore(pattern: Types.Pattern, separator?: Types.Pattern, silent = false): Types.Pattern {
            return repeat(pattern, 1, Infinity, separator, silent);
        }

        export function zeroOrMore(pattern: Types.Pattern, separator?: Types.Pattern, silent = false): Types.Pattern {
            return repeat(pattern, 0, Infinity, separator, silent);
        }

        export function zeroOrOne(pattern: Types.Pattern, separator?: Types.Pattern, silent = true): Types.Pattern {
            return repeat(pattern, 0, 1, separator, silent);
        }

        export function seq(...patterns: Types.Pattern[]): Types.Pattern {
            if (patterns.length === 0) {
                throw new Error('Sequence must have at least one pattern');
            }
            return { type: 'seq', patterns, silent: false };
        }

        export function silent<T extends Types.Pattern>(pattern: T): T {
            return { ...pattern, silent: true };
        }

        export function loud<T extends Types.Pattern>(pattern: T): T {
            return { ...pattern, silent: false };
        }

    // └────────────────────────────────────────────────────────────────────┘


    // ┌─────────────────────────────── ERRORS ─────────────────────────────┐

        export function error(cond: Types.ErrorHandler['cond'], msg: string, code?: string): Types.ErrorHandler {
            return { cond, msg, code: code ?? Types.ERRORS.RECOVERY_CUSTOM };
        }

        export const errorRecoveryStrategies = {
            skipUntil(tokens: string | string[]): Types.RecoveryStrategy {
                return { type: 'skipUntil', tokens: Array.isArray(tokens) ? tokens : [tokens] };
            },
        };

    // └────────────────────────────────────────────────────────────────────┘


    // ┌──────────────────────────────── HELP ──────────────────────────────┐


    // └────────────────────────────────────────────────────────────────────┘

// ╚══════════════════════════════════════════════════════════════════════════════════════╝