// Primary_test.ts
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

        // ════ Number Literal ════

        'dec' : {
            input: '1',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 1 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 1 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 1 },
                            value   : { type: 'dec', value: 1, },
                        }
                    }
                }
            ]
        },
        'hex' : {
            input: '0x1',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 3 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 3 },
                            value   : { type: 'hex', value: 1, },
                        }
                    }
                }
            ]
        },
        'oct': {
            input: '0o1',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 3 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 3 },
                            value   : { type: 'oct', value: 1, },
                        }
                    }
                }
            ]
        },
        'bin': {
            input: '0b1',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 3 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 3 },
                            value   : { type: 'bin', value: 1, },
                        }
                    }
                }
            ]
        },
        'flt': {
            input: '1.1',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 3 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 3 },
                            value   : { type: 'flt', value: 1.1, },
                        }
                    }
                }
            ]
        },

        // ════ Boolean Literal ════

        'true': {
            input: 'true',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 4 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 4 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 4 },
                            value   : { type: 'bool', value: true, },
                        }
                    }
                }
            ]
        },
        'false': {
            input: 'false',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 5 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 5 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 5 },
                            value   : { type: 'bool', value: false, },
                        }
                    }
                }
            ]
        },

        // ════ String Literal ════

        'str': {
            input: '"test"',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 6 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 6 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 6 },
                            value   : { type: 'str', value: 'test', },
                        }
                    }
                }
            ]
        },
        'char': {
            input: "'a'",
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 3 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 3 },
                            value   : { type: 'char', value: 'a', },
                        }
                    }
                }
            ]
        },

        // ════ Special Literal ════

        'null': {
            input: 'null',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 4 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 4 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 4 },
                            value   : { type: 'null', value: null, },
                        }
                    }
                }
            ]
        },
        'undef': {
            input: 'undef',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 5 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 5 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 5 },
                            value   : { type: 'undef', value: undefined, },
                        }
                    }
                }
            ]
        },

        // ════ Identifier Literal ════

        'ident': {
            input: 'Maysara',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 7 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 7 },
                        body    : {
                            kind    : 'Identifier',
                            span    : { start: 0, end: 7 },
                            value   : { type: 'ident', value: 'Maysara', },
                        }
                    }
                }
            ]
        },

        // ════ Array Literal ════

        'empty-array': {
            input: '[]',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 2 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 2 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 2 },
                            value   : { type: 'array', value: [], },
                        }
                    }
                }
            ]
        },

        'filled-array': {
            input: '[1, 2, 3]',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 9 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 9 },
                        body    : {
                            kind    : 'Literal',
                            span    : { start: 0, end: 9 },
                            value   : {
                                type    : 'array',
                                value   : [
                                    {
                                        kind    : 'Expression',
                                        span    : { start: 1, end: 2 },
                                        body    : {
                                            kind    : 'PrimaryExpression',
                                            span    : { start: 1, end: 2 },
                                            body    : {
                                                kind    : 'Literal',
                                                span    : { start: 1, end: 2 },
                                                value   : { type: 'dec', value: 1 },
                                            }
                                        }
                                    },
                                    {
                                        kind    : 'Expression',
                                        span    : { start: 4, end: 5 },
                                        body    : {
                                            kind    : 'PrimaryExpression',
                                            span    : { start: 4, end: 5 },
                                            body    : {
                                                kind    : 'Literal',
                                                span    : { start: 4, end: 5 },
                                                value   : { type: 'dec', value: 2 },
                                            }
                                        }
                                    },
                                    {
                                        kind    : 'Expression',
                                        span    : { start: 7, end: 8 },
                                        body    : {
                                            kind    : 'PrimaryExpression',
                                            span    : { start: 7, end: 8 },
                                            body    : {
                                                kind    : 'Literal',
                                                span    : { start: 7, end: 8 },
                                                value   : { type: 'dec', value: 3 },
                                            }
                                        }
                                    },
                                ]
                            }
                        }
                    }
                }
            ]
        },

        // ═════ Parenthesized Expression ════

        'parens': {
            input: '(1)',
            ast: [
                {
                    kind    : 'Expression',
                    span    : { start: 0, end: 3 },
                    body    : {
                        kind    : 'PrimaryExpression',
                        span    : { start: 0, end: 3 },
                        body    : {
                            kind    : 'Parenthesized',
                            span    : { start: 0, end: 3 },
                            body    : {
                                kind    : 'Expression',
                                span    : { start: 1, end: 2 },
                                body    : {
                                    kind    : 'PrimaryExpression',
                                    span    : { start: 1, end: 2 },
                                    body    : {
                                        kind    : 'Literal',
                                        span    : { start: 1, end: 2 },
                                        value   : { type: 'dec', value: 1 },
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },

        // ═════ More ═════
        'empty-input': {
            input: '',
            ast: [],
            errors: []
        },

        'syntax-error': {
            input: '>>$${SYNTAX|_|ERROR}$$<<',
            ast: [],
            errors: [
                {
                    "code": 2457,
                    "msg": "Expected Expression",
                    "span": {
                        "end": 0,
                        "start": 0,
                    },
                },
            ],
        },
    };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝