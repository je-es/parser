// tests/rules/token_test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as lexer from '@je-es/lexer';
    import * as parser from '../../../lib/parser';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const lexerRules: lexer.Rules = {
        ws      : /\s+/,
        ok      : 'ok',
        fk      : 'fk',
        sep     : '|',
        notOk   : 'notOk'
    };

    export const parserRules: parser.Rules = [
        parser.createRule('rootSequence',
            parser.seq(parser.token('ok'), parser.token('fk')),
            {
                build: (matches) => ({
                    rule    : 'rootSequence',
                    span    : { start: matches[0].span.start, end: matches[matches.length-1].span.end },
                    value   : matches
                }),
                ignored: ['ws'],

                silent: false
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'rootSequence',

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
            ast: [],
            errors: [
                {
                    code: 1,
                    msg: "Expected 'fk', got 'EOF'",
                    span: {
                        start: 2,
                        end: 2,
                    }
                }
            ]
        },

        "ok fk" : {
            input: 'ok fk',
            ast: [
                {
                    rule: 'rootSequence',
                    span: { start: 0, end: 5 },
                    value: [
                        {
                            kind: 'ok',
                            span: { start: 0, end: 2 },
                            value: 'ok'
                        },
                        {
                            kind: 'fk',
                            span: { start: 3, end: 5 },
                            value: 'fk'
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
                    code: 0x000,
                    msg: "Unexpected token 'k'",
                    span: { start: 3, end: 3 }
                }
            ]
        },

        "notOk" : {
            input: 'notOk',
            ast: [],
            errors: [
                {
                    code: 2,
                    msg: "Expected 'ok', got 'notOk'",
                    span: { start: 0, end: 0 }
                }
            ]
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝