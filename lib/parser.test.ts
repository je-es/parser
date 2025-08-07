// parser.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as lexer from '@je-es/lexer';
    import * as parser from './parser';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    const lexerRules: lexer.Rules = {
        ws      : /\s/,
        num     : /\d/,
        plus    : '+',
        minus   : '-',
        open    : '(',
        close   : ')',
        comma   : ','
    };

    const parserRules: parser.Rules = [
        // Root rule - entry point
        parser.createRule('root',
            // `(..), (..), ..`
            parser.repeat(
                parser.rule('group'),
                1,                     // At least one group
                Infinity,              // No upper limit
                parser.token('comma')  // Separated by commas
            ),
            {
                build: (matches) => ({
                    type: 'root',
                    groups: matches.map(m => m.meta)
                })
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
                    type: 'group',
                    meta: {
                        left        : matches[1].value,
                        operator    : matches[2].value,
                        right       : matches[3].value
                    }
                }),

                errors: [
                    parser.error(
                        // condition
                        (parser, failedAt) => failedAt == 0,
                        // message
                        "Missing opening parenthesis '('",
                        // suggestions
                        ["Add '(' to close the group", "Check for balanced parentheses"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 1,
                        "Missing left operand",
                        ["Add a number to the left of the operator"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 2,
                        "Missing operator",
                        ["Add '+' or '-' operator to the expression"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 3,
                        "Missing right operand",
                        ["Add a number to the right of the operator"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 4,
                        "Missing closing parenthesis ')'",
                        ["Add ')' to close the group", "Check for balanced parentheses"]
                    ),
                ],

                // Example: `(+2... (3+4)`
                // An error occurs after the first `(` due to a missing left operand.
                // If error recovery mode is not set to `resilient`,
                // the parser will skip over "+2... " and resume parsing from the second `(`.
                // All errors encountered will be recorded in `parser.errors`.
                //
                // Note: In `resilient` mode, the parser halts at the first `(`,
                // capturing a single error before returning.
                recovery: parser.errorRecoveryStrategies.skipUntil('open')
            }
        ),
    ];

    const parserSettings : parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule: 'root',

        // Error recovery mode
        errorRecovery: {
            mode: 'resilient',          // 'strict' | 'resilient'
            maxErrors: 0,               // Stop after N errors (0 = unlimited)
            syncTokens: ['open']        // Tokens to sync on during recovery
        },

        ignored: ['ws'],                // Ignore whitespace tokens
        debug: false,                    // Enable debug mode (prints debug info)
        maxDepth: 1000,                 // Maximum recursion depth (0 = unlimited)
        enableMemoization: false,        // Enable memoization (default: true)
        maxCacheSize: 1000,             // Maximum cache size (0 = unlimited)
        enableProfiling: false           // Enable profiling
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe("Basic Rules", () => {
        it("Parse valid input", () => {
            const tokens1 = lexer.tokenize('(1+2)', lexerRules);
            const result1 = parser.parse(tokens1, parserRules, parserSettings);
            expect(result1.ast).toEqual([{
                type: 'root',
                groups: [
                    {
                        left: '1',
                        operator: '+',
                        right: '2'
                    }
                ]
            }]);
            expect(result1.errors).toEqual([]);
        });

        it("Parse multiple groups", () => {
            const tokens2 = lexer.tokenize('(1+2), (3-4), (5+6)', lexerRules);
            const result2 = parser.parse(tokens2, parserRules, parserSettings);
            expect(result2.ast[0] as { groups?: any }).toHaveProperty('groups', [
                {
                    left: '1',
                    operator: '+',
                    right: '2'
                },
                {
                    left: '3',
                    operator: '-',
                    right: '4'
                },
                {
                    left: '5',
                    operator: '+',
                    right: '6'
                }
            ]);
            expect(result2.errors).toEqual([]);
        });

        it("Handle errors gracefully", () => {
            const tokens3 = lexer.tokenize('(1+2', lexerRules);
            const result3 = parser.parse(tokens3, parserRules, parserSettings);
            expect(result3.ast).toEqual([{
                type: 'root',
                groups: []
            }]);
            expect(result3.errors).toEqual([
                {
                    code: "E006",
                    context: " open:(  num:1  plus:+  num:2",
                    message: "Missing closing parenthesis ')'",
                    position: {
                        col: 5,
                        line: 1,
                        offset: 4,
                    },
                    severity: "error",
                    suggestions: [
                        "Add ')' to close the group",
                        "Check for balanced parentheses",
                    ],
                },
                {
                    code: "E003",
                    context: " open:(  num:1  plus:+  num:2",
                    message: "Expected at least 1 occurrences, got 0",
                    position: {
                        col: 5,
                        line: 1,
                        offset: 4,
                    },
                    severity: "error",
                },
            ]);
        });

        it("Error recovery", () => {
            const tokens4 = lexer.tokenize('(+2, (3+4)', lexerRules); // 1 error, 1 group
            const result4 = parser.parse(tokens4, parserRules, {
                ...parserSettings,
                errorRecovery: {
                    mode: 'resilient',  // Use resilient mode to continue after errors
                    maxErrors: 10,      // Allow 10 errors
                    syncTokens: ['open'] // Sync on open parenthesis
                }
            });
            expect(result4.ast).toEqual([{
                type: 'root',
                groups: [
                    {
                        left: '3',
                        operator: '+',
                        right: '4'
                    }
                ]
            }]);
            expect(result4.errors).toEqual([
                {
                    code: "E006",
                    context: " open:( →plus:+  num:2  comma:,  ws:   open:(",
                    message: "Missing left operand",
                    position: {
                        col: 2,
                        line: 1,
                        offset: 1,
                    },
                    severity: "error",
                    suggestions: [
                        "Add a number to the left of the operator",
                    ],
                },
            ]);
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝