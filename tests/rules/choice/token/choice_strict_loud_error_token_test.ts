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
        fk      : 'fk',
        sep     : '|',
        notOk   : 'notOk'
    };

    export const parserRules: parser.Rules = [
        parser.createRule('rootChoice',
            parser.choice(parser.token('ok'), parser.token('fk')),
            {
                build: (matches) => ({
                    rule    : 'rootChoice',
                    span    : { start: matches[0].span.start, end: matches[matches.length-1].span.end },
                    value   : matches[0]
                }),

                errors: [
                    parser.error(0, 'Expected "ok" or "fk"', "ERROR_CODE_00000"),
                ],

                silent: false
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'rootChoice',

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
                    rule: 'rootChoice',
                    span: { start: 0, end: 2 },
                    value: {
                        kind: 'ok',
                        span: { start: 0, end: 2 },
                        value: 'ok'
                    }
                }
            ]
        },
        "fk" : {
            input: 'fk',
            ast: [
                {
                    rule: 'rootChoice',
                    span: { start: 0, end: 2 },
                    value: {
                        kind: 'fk',
                        span: { start: 0, end: 2 },
                        value: 'fk'
                    }
                }
            ]
        },
        "ok|fk" : {
            input: 'ok|fk',
            ast: [
                {
                    rule: 'rootChoice',
                    span: { start: 0, end: 2 },
                    value: {
                        kind: 'ok',
                        span: { start: 0, end: 2 },
                        value: 'ok'
                    }
                }
            ],
            errors: [
                {
                    code: "ERROR_CODE_00000",
                    msg: 'Expected "ok" or "fk"',
                    span: { start: 2, end: 3 }
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
                    code: "ERROR_CODE_00000",
                    msg: 'Expected "ok" or "fk"',
                    span: { start: 0, end: 0 }
                }
            ]
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝