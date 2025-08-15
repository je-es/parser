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
        notOk   : 'notOk'
    };

    export const parserRules: parser.Rules = [
        parser.createRule('root',
            parser.rule('ok'),
            {
                build: (matches) => ({
                    rule    : 'root',
                    span    : matches[0].span,
                    inner   : matches[0]
                }),

                silent: true
            }
        ),
        parser.createRule('ok',
            parser.token('ok'),
            {
                build: (matches) => ({
                    rule    : 'ok',
                    span    : matches[0].span,
                    value   : matches[0].value
                }),

                silent: true
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'root',

        // Error recovery mode
        errorRecovery       : {
            mode            : 'resilient',      // 'strict' | 'resilient'
            maxErrors       : 0,                // Stop after N errors (0 = unlimited)
            syncTokens      : []                // Tokens to sync on during recovery
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
                    rule: 'root',
                    span: { start: 0, end: 2 },
                    inner: {
                        rule: 'ok',
                        span: { start: 0, end: 2 },
                        value: 'ok'
                    }
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
            ast: [],
            errors: []
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝