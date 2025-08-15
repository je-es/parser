// Postfix_test.ts
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

        // ═════ PostIncrement/PostDecrement ════

        'post-increment ::basic::(a++)': {
            input: 'a++',
            ast: [
                {
                    kind: 'Expression',
                    span: { start: 0, end: 3 },
                    body: {
                        kind: 'PostfixExpression',
                        span: { start: 0, end: 3 },
                        body: {
                            kind: 'PostIncrement',
                            span: { start: 0, end: 3 },
                            body: {
                                base: {
                                    kind: 'PrimaryExpression',
                                    span: { start: 0, end: 1 },
                                    body: {
                                        kind: 'Identifier',
                                        span: { start: 0, end: 1 },
                                        value: { type: 'ident', value: 'a' },
                                    },
                                }
                            },
                        },
                    },
                },
            ],
        },

        'post-increment ::multi::(a++++)': {
            input: 'a++++',
            ast: [
                {
                    kind: 'Expression',
                    span: { start: 0, end: 5 },
                    body: {
                        kind: 'PostfixExpression',
                        span: { start: 0, end: 5 },
                        body: {
                            kind: 'PostIncrement',
                            span: { start: 0, end: 5 },
                            body: {
                                "base": {
                                    "kind": "PostIncrement",
                                    "span": { "end": 3, "start": 0, },
                                    "body": {
                                        "base": {
                                            "body": {
                                            "kind": "Identifier",
                                            "span": { "end": 1, "start": 0, },
                                            "value": { "type": "ident", "value": "a", },
                                            },
                                            "kind": "PrimaryExpression",
                                            "span": { "end": 1, "start": 0, },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },

        'post-increment ::basic::(a--)': {
            input: 'a--',
            ast: [
                {
                    kind: 'Expression',
                    span: { start: 0, end: 3 },
                    body: {
                        kind: 'PostfixExpression',
                        span: { start: 0, end: 3 },
                        body: {
                            kind: 'PostDecrement',
                            span: { start: 0, end: 3 },
                            body: {
                                base: {
                                    kind: 'PrimaryExpression',
                                    span: { start: 0, end: 1 },
                                    body: {
                                        kind: 'Identifier',
                                        span: { start: 0, end: 1 },
                                        value: { type: 'ident', value: 'a' },
                                    },
                                }
                            },
                        },
                    },
                },
            ],
        },

        'post-increment ::mix::(a++--++)': {
            input: 'a++--++',
            ast: [
                {
                    kind: 'Expression',
                    span: { start: 0, end: 7 },
                    body: {
                        kind: 'PostfixExpression',
                        span: { start: 0, end: 7 },
                        body: {
                            kind: 'PostIncrement',
                            span: { start: 0, end: 7 },
                            body: {
                                "base": {
                                    "kind": "PostDecrement",
                                    "span": { "end": 5, "start": 0, },
                                    "body": {
                                         "base": {
                                            "kind": "PostIncrement",
                                            "span": { "end": 3, "start": 0, },
                                            "body": {
                                                "base": {
                                                    "body": {
                                                    "kind": "Identifier",
                                                    "span": { "end": 1, "start": 0, },
                                                    "value": { "type": "ident", "value": "a", },
                                                    },
                                                    "kind": "PrimaryExpression",
                                                    "span": { "end": 1, "start": 0, },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },

        // ═════ More ════

        'pointer-access': {
            input: 'a->b',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 4 },
                    body    : {
                        kind    : 'PostfixExpression',
                        span    : { start: 0, end: 4 },
                        body: {
                            kind    : 'PointerAccess',
                            span    : { start: 0, end: 4 },
                            body    : {
                                base: {
                                    kind    : 'PrimaryExpression',
                                    span    : { start: 0, end: 1 },
                                    body    : {
                                        kind    : 'Identifier',
                                        span    : { start: 0, end: 1 },
                                        value   : { type: 'ident', value: 'a' },
                                    },
                                },
                                access: {
                                    kind    : 'Identifier',
                                    span    : { start: 3, end: 4 },
                                    value   : { type: 'ident', value: 'b' },
                                },
                            },
                        },
                    },
                },
            ]
        },

        'complex': {
            input: 'a->b->c--',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 9, "start": 0, },
                    "body": {
                        "body": {
                            "body": {
                            "base": {
                                "body": {
                                "access": {
                                    "kind": "Identifier",
                                    "span": { "end": 7, "start": 6, },
                                    "value": { "type": "ident", "value": "c", },
                                },
                                "base": {
                                    "kind": "PointerAccess",
                                    "span": { "end": 4, "start": 0, },
                                    "body": {
                                        "access": {
                                            "kind": "Identifier",
                                            "span": { "end": 4, "start": 3, },
                                            "value": { "type": "ident", "value": "b", },
                                        },
                                        "base": {
                                            "kind": "PrimaryExpression",
                                            "span": { "end": 1, "start": 0, },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "end": 1, "start": 0, },
                                                "value": { "type": "ident", "value": "a", },
                                            },
                                        },
                                    },
                                },
                                },
                                "kind": "PointerAccess",
                                "span": { "end": 7, "start": 0, },
                            },
                            },
                            "kind": "PostDecrement",
                            "span": { "end": 9, "start": 0, },
                        },
                        "kind": "PostfixExpression",
                        "span": { "end": 9, "start": 0, },
                    },
                },
            ]
        },

        'member-access': {
            input: 'a.b',
            ast: [
                {
                    kind: "Expression",
                    span: { start: 0, end: 3 },
                    body: {
                        kind: "PostfixExpression",
                        span: { start: 0, end: 3 },
                        body: {
                            kind: "MemberAccess",
                            span: { start: 0, end: 3 },
                            body: {
                                base: {
                                    kind: "PrimaryExpression",
                                    span: { start: 0, end: 1 },
                                    body: {
                                        kind: "Identifier",
                                        span: { start: 0, end: 1 },
                                        value: { type: "ident", value: "a" },
                                    },
                                },
                                index: {
                                    kind: "Identifier",
                                    span: { start: 2, end: 3 },
                                    value: { type: "ident", value: "b" },
                                },
                            },
                        }
                    },
                },
            ]
        },

        'complex-member-access': {
            input: 'a.b.c',
            ast: [
                {
                    kind: "Expression",
                    span: { start: 0, end: 5 },
                    body: {
                        kind: "PostfixExpression",
                        span: { start: 0, end: 5 },
                        body: {
                            kind: "MemberAccess",
                            span: { start: 0, end: 5 },
                            body: {
                                base: {
                                    kind: "MemberAccess",
                                    span: { start: 0, end: 3 },
                                    body: {
                                        base: {
                                            kind: "PrimaryExpression",
                                            span: { start: 0, end: 1 },
                                            body: {
                                                kind: "Identifier",
                                                span: { start: 0, end: 1 },
                                                value: { type: "ident", value: "a" },
                                            },
                                        },
                                        index: {
                                            kind: "Identifier",
                                            span: { start: 2, end: 3 },
                                            value: { type: "ident", value: "b" },
                                        },
                                    },
                                },
                                index: {
                                    kind: "Identifier",
                                    span: { start: 4, end: 5 },
                                    value: { type: "ident", value: "c" },
                                },
                            },
                        }
                    },
                },
            ]
        },

        'call-empty': {
            input: 'a()',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PostfixExpression',
                        span    : { start: 0, end: 3 },
                        body: {
                            kind: "Call",
                            span: { start: 0, end: 3 },
                            body: {
                                args: [],
                                base: {
                                    kind: "PrimaryExpression",
                                    span: { start: 0, end: 1 },
                                    body: {
                                        kind: "Identifier",
                                        span: { start: 0, end: 1 },
                                        value: { type: "ident", value: "a" },
                                    },
                                },
                            },
                        },
                    },
                },
            ]
        },

        'call-with-args': {
            input: 'a(b, c)',
            ast: [
                {
                    kind: 'Expression',
                    span: { start: 0, end: 7 },
                    body: {
                        kind: 'PostfixExpression',
                        span: { start: 0, end: 7 },
                        body: {
                            kind: "Call",
                            span: { end: 7, start: 0 },
                            body: {
                                args: [
                                    {
                                        body: {
                                            body: {
                                                kind: "Identifier",
                                                span: { end: 3, start: 2 },
                                                value: { type: "ident", value: "b" },
                                            },
                                            kind: "PrimaryExpression",
                                            span: { end: 3, start: 2 },
                                        },
                                        kind: "Expression",
                                        span: { end: 3, start: 2 },
                                    },
                                    {
                                        body: {
                                            body: {
                                                kind: "Identifier",
                                                span: { end: 6, start: 5 },
                                                value: { type: "ident", value: "c" },
                                            },
                                            kind: "PrimaryExpression",
                                            span: { end: 6, start: 5 },
                                        },
                                        kind: "Expression",
                                        span: { end: 6, start: 5 },
                                    },
                                ],
                                base: {
                                    body: {
                                        kind: "Identifier",
                                        span: { end: 1, start: 0 },
                                        value: { type: "ident", value: "a" },
                                    },
                                    kind: "PrimaryExpression",
                                    span: { end: 1, start: 0 },
                                },
                            },
                        },
                    },
                },
            ]
        },

        'array-access': {
            input: 'a[1]',
            ast: [
                {
                    kind: "Expression",
                    span: { start: 0, end: 4 },
                    body: {
                        kind: "PostfixExpression",
                        span: { start: 0, end: 4 },
                        body: {
                            kind: "ArrayAccess",
                            span: { start: 0, end: 4 },
                            body: {
                                base: {
                                    kind: "PrimaryExpression",
                                    span: { start: 0, end: 1 },
                                    body: {
                                        kind: "Identifier",
                                        span: { start: 0, end: 1 },
                                        value: { type: "ident", value: "a" },
                                    },
                                },
                                index: {
                                    kind: "Expression",
                                    span: { start: 2, end: 3 },
                                    body: {
                                        kind: "PrimaryExpression",
                                        span: { start: 2, end: 3 },
                                        body: {
                                            kind: "Literal",
                                            span: { start: 2, end: 3 },
                                            value: { type: "dec", value: 1 },
                                        },
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝