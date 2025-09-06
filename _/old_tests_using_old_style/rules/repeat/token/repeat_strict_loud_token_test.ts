// tests/rules/token_test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as lexer from '@je-es/lexer';
    import * as parser from '../../../../lib/parser';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const lexerRules: lexer.Rules = {
        ok      : 'ok',
        sep     : '|',
        notOk   : 'notOk'
    };

    export const parserRules: parser.Rules = [
        parser.createRule('rootRepeat',
            parser.repeat(parser.token('ok'), 1, Infinity, parser.token('sep')),
            {
                build: (matches) => ({
                    rule    : 'rootRepeat',
                    span    : matches.length ? { start: matches[0].span.start, end: matches[matches.length-1].span.end } : { start: 0, end: 0 },
                    value   : matches
                }),

                silent: false
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'rootRepeat',

        // Error recovery mode
        errorRecovery       : {
            mode            : 'strict',      // 'strict' | 'resilient'
            maxErrors       : 1,                // Stop after N errors (0 = unlimited)
        },

        ignored             : ['ws'],           // Ignore whitespace tokens
        debug               : 'off',            // Disable debug mode
        maxDepth            : 1000,             // Maximum recursion depth (0 = unlimited)
        maxCacheSize        : 1000,             // Maximum cache size (0 = unlimited)
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    export const cases = {
        "ok" : {
            input: 'ok',
            ast: [
                {
                    rule: 'rootRepeat',
                    span: { start: 0, end: 2 },
                    value: [
                        {
                            kind: 'ok',
                            span: { start: 0, end: 2 },
                            value: 'ok'
                        }
                    ]
                }
            ]
        },
        "ok|ok" : {
            input: 'ok|ok',
            ast: [
                {
                    rule: 'rootRepeat',
                    span: { start: 0, end: 5 },
                    value: [
                        {
                            kind: 'ok',
                            span: { start: 0, end: 2 },
                            value: 'ok'
                        },
                        {
                            kind: 'ok',
                            span: { start: 3, end: 5 },
                            value: 'ok'
                        }
                    ]
                }
            ]
        },

        "ok k" : {
            input: 'ok k',
            ast: [],
            errors: [
                {
                    code: "LEXICAL_ERROR",
                    msg: "Unexpected token ' '",
                    span: { start: 2, end: 2 }
                }
            ]
        },

        "notOk" : {
            input: 'notOk',
            ast: [],
            errors: [
                {
                    code: "TOKEN_MISMATCH",
                    msg: `Expected 'ok', got 'notOk'`,
                    span: {start: 0, end: 0 },
                }
            ]
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝