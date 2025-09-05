// example.rules.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as lexer from '@je-es/lexer';
    import * as parser from '../../lib/parser';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const lexerRules: lexer.Rules = {
        ws      : /\s/,
        num     : /\d/,
        plus    : '+',
        minus   : '-',
        open    : '(',
        close   : ')',
        comma   : ','
    };

    export const parserRules: parser.Rules = [
        // Root rule - entry point
        parser.createRule('root',
            // `(..), (..), ..`
            parser.oneOrMore(
                parser.rule('group'),
                parser.token('comma')  // Separated by commas
            ),
            {
                build: (matches) => ({
                    rule: 'root',
                    groups: matches.map(m => m.meta)
                }),

                // errors: [
                //     parser.error(0, "Expected expression", 666)
                // ],

                recovery: parser.errorRecoveryStrategies.skipUntil(['open']),
                silent: false
            }
        ),

        // Group rule - parenthesized expression
        parser.createRule('group',
            // (N +/- N)
            parser.seq(
                parser.token('open'),       // (
                parser.token('num'),        // N    => left (FIXED: was 'number', now 'num')

                parser.choice(              // +/-  => operator
                    parser.token('plus'), parser.token('minus')
                ),

                parser.token('num'),        // N    => right (FIXED: was 'number', now 'num')
                parser.token('close')       // )
            ),
            {
                build: (matches) => ({
                    rule: 'group',
                    meta: {
                        left        : matches[1].value,
                        operator    : matches[2].value,
                        right       : matches[3].value
                    }
                }),

                errors: [
                    parser.error(0, "Expected opening parenthesis '('", "GROUP_ERROR_MISSING_OPEN"),
                    parser.error(1, "Expected left operand", "GROUP_ERROR_MISSING_LEFT"),
                    parser.error(2, "Expected operator", "GROUP_ERROR_MISSING_OPERATOR"),
                    parser.error(3, "Expected right operand", "GROUP_ERROR_MISSING_RIGHT"),
                    parser.error(4, "Expected closing parenthesis ')'", "GROUP_ERROR_MISSING_CLOSE"),
                ],

                silent: false,
                recovery: parser.errorRecoveryStrategies.skipUntil('open')

                // Example: `(+2... (3+4)`
                // An error occurs after the first `(` due to a missing left operand.
                // If error recovery mode is not set to `resilient`,
                // the parser will skip over "+2... " and resume parsing from the second `(`.
                // All errors encountered will be recorded in `parser.errors`.
                //
                // Note: In `resilient` mode, the parser halts at the first `(`,
                // capturing a single error before returning.
            }
        ),
    ];

    export const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule           : 'root',

        // Error recovery mode
        errorRecovery       : {
            mode            : 'resilient',      // 'strict' | 'resilient'
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
        "Parse valid input" : {
            input: '(1+2)',
            ast: [
                {
                    rule: 'root',
                    groups: [
                        { left: '1', operator: '+', right: '2' }
                    ]
                }
            ]
        },

        "Parse multiple groups" : {
            input: '(1+2), (3-4), (5+6)',
            ast: [
                {
                    rule: 'root',
                    groups: [
                        { left: '1', operator: '+', right: '2' },
                        { left: '3', operator: '-', right: '4' },
                        { left: '5', operator: '+', right: '6' }
                    ]
                }
            ]
        },

        "Handle errors gracefully" : {
            input: '(1+2',
            errors: [
                {
                    code    : "GROUP_ERROR_MISSING_CLOSE",
                    msg     : "Expected closing parenthesis ')'",
                    span    : { start: 4, end: 4 }
                }
            ]
        },

        "Error recovery" : {
            input: '(+2, (3+4)',
            ast: [
                // This is the expected behavior because we set the maximum number of errors to 1,
                // and we already have an error, so the Parser stops before reaching here.

                // {
                //     rule: 'root',
                //     groups: [
                //         { left: '3', operator: '+', right: '4' },
                //     ]
                // }
            ],
            errors: [
                {
                    code    : "GROUP_ERROR_MISSING_LEFT",
                    msg     : "Expected left operand",
                    span    : { start: 1, end: 2 }
                }
            ]
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝