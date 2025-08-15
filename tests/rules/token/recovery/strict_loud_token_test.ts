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
        open    : '(',
        close   : ')',
        sep     : '|',
        notOk   : 'notOk'
    };

    export const parserRules: parser.Rules = [
        parser.createRule('root',
            parser.token('ok'),
            {
                build: (matches) => ({
                    rule    : 'root',
                    span    : matches[0].span,
                    value   : matches[0].value
                }),

                recovery: parser.errorRecoveryStrategies.skipUntil('ok'),

                silent: false
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'root',

        // Error recovery mode
        errorRecovery       : {
            mode            : 'strict',      // 'strict' | 'resilient'
            maxErrors       : 1,                // Stop after N errors (0 = unlimited)
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
                    value: 'ok'
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

        "notOk|ok" : {
            input: 'notOk|ok',
            errors: [
                {
                    code: 0x002,
                    msg: `Expected 'ok', got 'notOk'`,
                    span: { start: 0, end: 0 }
                }
            ],
            ast: []
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝