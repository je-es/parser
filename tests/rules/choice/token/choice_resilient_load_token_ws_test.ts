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
        ws              : /\s+/,
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

                recovery: parser.errorRecoveryStrategies.skipUntil(['ok', 'fk']),

                silent: false
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'rootChoice',

        // Error recovery mode
        errorRecovery       : {
            mode            : 'resilient',      // 'strict' | 'resilient'
            maxErrors       : 0,                // Stop after N errors (0 = unlimited)
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
        "ok fk" : {
            input: 'ok fk',
            ast: [
                {
                    rule: 'rootChoice',
                    span: { start: 0, end: 2 },
                    value: {
                        kind: 'ok',
                        span: { start: 0, end: 2 },
                        value: 'ok'
                    }
                },
                {
                    rule: 'rootChoice',
                    span: { start: 3, end: 5 },
                    value: {
                        kind: 'fk',
                        span: { start: 3, end: 5 },
                        value: 'fk'
                    }
                }
            ],
            errors: [
            ]
        },

        "ok k" : {
            input: 'ok k',
            ast: [],
            errors: [
                {
                    code: "LEXICAL_ERROR",
                    msg: "Unexpected token 'k'",
                    span: { start: 3, end: 3 }
                }
            ]
        },

        "notOk" : {
            input: 'notOk',
            ast: [],
            errors: [{
                    code: "TOKEN_MISMATCH",
                    msg: "Expected 'fk', got 'notOk'",
                    span: { start: 0, end: 0 }
                }]
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝