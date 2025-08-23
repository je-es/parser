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
        parser.createRule('rootOptional',
            parser.optional(parser.token('ok')),
            {
                build: (matches) => ({
                    rule    : 'rootOptional',
                    span    : matches.length ? { start: matches[0].span.start, end: matches[matches.length-1].span.end } : { start: 0, end: 0 },
                    value   : matches.length ? matches : []
                }),

                errors: [
                    parser.error(0, 'Something!', 78788) // Will Never Happend (Optional/Repeat[0/1])
                ],

                silent: false
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'rootOptional',

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
                    rule: 'rootOptional',
                    span: { start: 0, end: 2 },
                    value: [{
                        kind: 'ok',
                        span: { start: 0, end: 2 },
                        value: 'ok'
                    }]
                }
            ]
        },
        "ok|ok" : {
            input: 'ok|ok',
            ast: [
                {
                    rule: 'rootOptional',
                    span: { start: 0, end: 2 },
                    value: [{
                        kind: 'ok',
                        span: { start: 0, end: 2 },
                        value: 'ok'
                    }],
                },
                {
                    rule: 'rootOptional',
                    span: { start: 0, end: 0 },
                    value: []
                }
            ]
        },

        "ok k" : {
            input: 'ok k',
            ast: [],
            errors: [
                {
                    code: 0x000,
                    msg: "Unexpected token ' '",
                    span: { start: 2, end: 2 }
                }
            ]
        },

        "notOk" : {
            input: 'notOk',
            ast: [
                {
                    rule: 'rootOptional',
                    span: { start: 0, end: 0 },
                    value: []
                }
            ],
            errors: []
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝