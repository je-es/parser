// Prefix_test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as rules from './rules';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const lexerRules = rules.lexerRules;
    export const parserRules = rules.parserRules;
    const _parserSettings = rules.parserSettings;
    export const parserSettings = { ..._parserSettings, startRule: 'Expression' };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    export const cases = {

        // ═════ PrefixExpression ════

        // new
        "++a" : {
            input: "++a",
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 3, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 3, "start": 0, },
                    "body": {
                        "kind": "PreIncrement",
                        "span": { "end": 3, "start": 0, },
                        "body": {
                            "base": {
                                "kind": "PrimaryExpression",
                                "span": { "end": 3, "start": 2, },
                                "body": {
                                    "kind": "Identifier",
                                    "span": { "end": 3, "start": 2, },
                                    "value": { "type": "ident", "value": "a", },
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        "--a" : {
            input: "--a",
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 3, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 3, "start": 0, },
                    "body": {
                        "kind": "PreDecrement",
                        "span": { "end": 3, "start": 0, },
                        "body": {
                            "base": {
                                "kind": "PrimaryExpression",
                                "span": { "end": 3, "start": 2, },
                                "body": {
                                    "kind": "Identifier",
                                    "span": { "end": 3, "start": 2, },
                                    "value": { "type": "ident", "value": "a", },
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        '+a' : {
            input: '+a',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 2, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 2, "start": 0, },
                    "body": {
                        "kind": "UnaryOperator",
                        "span": { "end": 2, "start": 0, },
                        "body": {
                            "operator": "+",
                            "base": {
                                "kind": "PrimaryExpression",
                                "span": { "end": 2, "start": 1, },
                                "body": {
                                    "kind": "Identifier",
                                    "span": { "end": 2, "start": 1, },
                                    "value": { "type": "ident", "value": "a", },
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        '-a' : {
            input: '-a',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 2, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 2, "start": 0, },
                    "body": {
                        "kind": "UnaryOperator",
                        "span": { "end": 2, "start": 0, },
                        "body": {
                            "operator": "-",
                            "base": {
                                "kind": "PrimaryExpression",
                                "span": { "end": 2, "start": 1, },
                                "body": {
                                    "kind": "Identifier",
                                    "span": { "end": 2, "start": 1, },
                                    "value": { "type": "ident", "value": "a", },
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        '!a' : {
            input: '!a',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 2, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 2, "start": 0, },
                    "body": {
                        "kind": "UnaryOperator",
                        "span": { "end": 2, "start": 0, },
                        "body": {
                            "operator": "!",
                            "base": {
                                "kind": "PrimaryExpression",
                                "span": { "end": 2, "start": 1, },
                                "body": {
                                    "kind": "Identifier",
                                    "span": { "end": 2, "start": 1, },
                                    "value": { "type": "ident", "value": "a", },
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        '~a' : {
            input: '~a',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 2, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 2, "start": 0, },
                    "body": {
                        "kind": "UnaryOperator",
                        "span": { "end": 2, "start": 0, },
                        "body": {
                            "operator": "~",
                            "base": {
                                "kind": "PrimaryExpression",
                                "span": { "end": 2, "start": 1, },
                                "body": {
                                    "kind": "Identifier",
                                    "span": { "end": 2, "start": 1, },
                                    "value": { "type": "ident", "value": "a", },
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        '++--a' : {
            input: '++--a',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 5, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 5, "start": 0, },
                    "body": {
                        "kind": "PreIncrement",
                        "span": { "end": 5, "start": 0, },
                        "body": {
                            "base": {
                                "body": {
                                    "base": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                                "end": 5,
                                                "start": 4,
                                            },
                                            "value": {
                                                "type": "ident",
                                                "value": "a",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 5,
                                            "start": 4,
                                        },
                                    },
                                },
                                "kind": "PreDecrement",
                                "span": {
                                    "end": 5,
                                    "start": 2,
                                },
                            },
                        },
                    },
                },
            },
        ]
        },

        '!!a' : {
            input: '!!a',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 3, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 3, "start": 0, },
                    "body": {
                        "kind": "UnaryOperator",
                        "span": { "end": 3, "start": 0, },
                        "body": {
                            "base": {
                                "body": {
                                    "base": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 3,
                                        "start": 2,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                    },
                                    "operator": "!",
                                },
                                "kind": "UnaryOperator",
                                "span": {
                                    "end": 3,
                                    "start": 1,
                                },
                                },
                                "operator": "!",
                        },
                    },
                },
            },
        ]
        },

        '++a--' : {
            input: '++a--',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 5, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 5, "start": 0, },
                    "body": {
                    "body": {
                        "base": {
                        "body": {
                            "body": {
                            "base": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 3,
                                    "start": 2,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "a",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 3,
                                "start": 2,
                                },
                            },
                            },
                            "kind": "PostDecrement",
                            "span": {
                            "end": 5,
                            "start": 2,
                            },
                        },
                        "kind": "PostfixExpression",
                        "span": {
                            "end": 5,
                            "start": 2,
                        },
                        },
                    },
                    "kind": "PreIncrement",
                    "span": {
                        "end": 5,
                        "start": 0,
                    },
                    },
                },
            },
        ]
        },

        '--++!-+a++--' : {
            input: '--++!-+a++--',
            ast: [
            {
                "kind": "Expression",
                "span": { "end": 12, "start": 0, },
                "body": {
                    "kind": "PrefixExpression",
                    "span": { "end": 12, "start": 0, },
                    "body": {
                        "kind": "PreDecrement",
                        "span": { "end": 12, "start": 0, },
                        "body": {
                            "base": {
                            "body": {
                                "base": {
                                "body": {
                                    "base": {
                                    "body": {
                                        "base": {
                                        "body": {
                                            "base": {
                                            "body": {
                                                "body": {
                                                "base": {
                                                    "body": {
                                                    "base": {
                                                        "body": {
                                                        "kind": "Identifier",
                                                        "span": {
                                                            "end": 8,
                                                            "start": 7,
                                                        },
                                                        "value": {
                                                            "type": "ident",
                                                            "value": "a",
                                                        },
                                                        },
                                                        "kind": "PrimaryExpression",
                                                        "span": {
                                                        "end": 8,
                                                        "start": 7,
                                                        },
                                                    },
                                                    },
                                                    "kind": "PostIncrement",
                                                    "span": {
                                                    "end": 10,
                                                    "start": 7,
                                                    },
                                                },
                                                },
                                                "kind": "PostDecrement",
                                                "span": {
                                                "end": 12,
                                                "start": 7,
                                                },
                                            },
                                            "kind": "PostfixExpression",
                                            "span": {
                                                "end": 12,
                                                "start": 7,
                                            },
                                            },
                                            "operator": "+",
                                        },
                                        "kind": "UnaryOperator",
                                        "span": {
                                            "end": 12,
                                            "start": 6,
                                        },
                                        },
                                        "operator": "-",
                                    },
                                    "kind": "UnaryOperator",
                                    "span": {
                                        "end": 12,
                                        "start": 5,
                                    },
                                    },
                                    "operator": "!",
                                },
                                            "kind": "UnaryOperator",
                                "span": {
                                    "end": 12,
                                    "start": 4,
                                },
                                },
                            },
                            "kind": "PreIncrement",
                            "span": {
                                "end": 12,
                                "start": 2,
                            },
                            },
                        },
                    }
                }
            }
        ]
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝