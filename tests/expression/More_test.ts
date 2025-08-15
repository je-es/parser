// More_test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as rules from './rules';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const lexerRules = rules.lexerRules;
    export const parserRules = rules.parserRules;
    const _parserSettings = rules.parserSettings;
    export const parserSettings = { ..._parserSettings, startRule: 'Expression', debug: 'off' };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    export const cases = {

        // ═════ PowerExpression ════

        "a**b": {
            input: "a**b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 4 },
                    "body": {
                        "kind": "PowerExpression",
                        "span": { "start": 0, "end": 4 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 4 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 0, "end": 1 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 0, "end": 1 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "**",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 3, "end": 4 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 3, "end": 4 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        "a**b**c": {
            input: "a**b**c",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 7 },
                    "body": {
                        "kind": "PowerExpression",
                        "span": { "start": 0, "end": 7 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 7 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 0, "end": 1 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 0, "end": 1 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "**",
                                "right": {
                                    "kind": "BinaryOperator",
                                    "span": { "start": 3, "end": 7 },
                                    "body": {
                                        "left": {
                                            "kind": "PrimaryExpression",
                                            "span": { "start": 3, "end": 4 },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "start": 3, "end": 4 },
                                                "value": { "type": "ident", "value": "b" }
                                            }
                                        },
                                        "operator": "**",
                                        "right": {
                                            "kind": "PrimaryExpression",
                                            "span": { "start": 6, "end": 7 },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "start": 6, "end": 7 },
                                                "value": { "type": "ident", "value": "c" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        // ═════ MultiplicativeExpression ════

        "a*b": {
            input: "a*b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 3 },
                    "body": {
                        "kind": "MultiplicativeExpression",
                        "span": { "start": 0, "end": 3 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 3 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 0, "end": 1 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 0, "end": 1 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "*",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 2, "end": 3 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 2, "end": 3 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        "a*b*c": {
            input: "a*b*c",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 5 },
                    "body": {
                        "kind": "MultiplicativeExpression",
                        "span": { "start": 0, "end": 5 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 5 },
                            "body": {
                                "left": {
                                    "kind": "BinaryOperator",
                                    "span": { "start": 0, "end": 3 },
                                    "body": {
                                        "left": {
                                            "kind": "PrimaryExpression",
                                            "span": { "start": 0, "end": 1 },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "start": 0, "end": 1 },
                                                "value": { "type": "ident", "value": "a" }
                                            }
                                        },
                                        "operator": "*",
                                        "right": {
                                            "kind": "PrimaryExpression",
                                            "span": { "start": 2, "end": 3 },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "start": 2, "end": 3 },
                                                "value": { "type": "ident", "value": "b" }
                                            }
                                        }
                                    }
                                },
                                "operator": "*",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 4, "end": 5 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 4, "end": 5 },
                                        "value": { "type": "ident", "value": "c" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        // ═════ AdditiveExpression ════

        "a+b": {
            input: "a+b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 3 },
                    "body": {
                        "kind": "AdditiveExpression",
                        "span": { "start": 0, "end": 3 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 3 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 0, "end": 1 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 0, "end": 1 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "+",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 2, "end": 3 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 2, "end": 3 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        "a+b+c": {
            input: "a+b+c",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 5 },
                    "body": {
                        "kind": "AdditiveExpression",
                        "span": { "start": 0, "end": 5 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 5 },
                            "body": {
                                "left": {
                                    "kind": "BinaryOperator",
                                    "span": { "start": 0, "end": 3 },
                                    "body": {
                                        "left": {
                                            "kind": "PrimaryExpression",
                                            "span": { "start": 0, "end": 1 },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "start": 0, "end": 1 },
                                                "value": { "type": "ident", "value": "a" }
                                            }
                                        },
                                        "operator": "+",
                                        "right": {
                                            "kind": "PrimaryExpression",
                                            "span": { "start": 2, "end": 3 },
                                            "body": {
                                                "kind": "Identifier",
                                                "span": { "start": 2, "end": 3 },
                                                "value": { "type": "ident", "value": "b" }
                                            }
                                        }
                                    }
                                },
                                "operator": "+",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 4, "end": 5 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 4, "end": 5 },
                                        "value": { "type": "ident", "value": "c" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        "a-b+c-d": {
            input: "a-b+c-d",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 7 },
                    "body": {
                        "kind": "AdditiveExpression",
                        "span": { "start": 0, "end": 7 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 7 },
                        "body": {
                        "left": {
                            "body": {
                            "left": {
                                "body": {
                                "left": {
                                    "body": {
                                    "kind": "Identifier",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                    "value": {
                                        "type": "ident",
                                        "value": "a",
                                    },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                    "end": 1,
                                    "start": 0,
                                    },
                                },
                                "operator": "-",
                                "right": {
                                    "body": {
                                    "kind": "Identifier",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                    "value": {
                                        "type": "ident",
                                        "value": "b",
                                    },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                    "end": 3,
                                    "start": 2,
                                    },
                                },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                "end": 3,
                                "start": 0,
                                },
                            },
                            "operator": "+",
                            "right": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 5,
                                    "start": 4,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "c",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 5,
                                "start": 4,
                                },
                            },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                            "end": 5,
                            "start": 0,
                            },
                        },
                        "operator": "-",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 7,
                                "start": 6,
                            },
                            "value": {
                                "type": "ident",
                                "value": "d",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 7,
                            "start": 6,
                            },
                        },
                        },
                        }
                    }
                }
            ]
        },

        // ═════ ShiftExpression ════

        "a<<b": {
            input: "a<<b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 4 },
                    "body": {
                        "kind": "ShiftExpression",
                        "span": { "start": 0, "end": 4 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 4 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 0, "end": 1 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 0, "end": 1 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "<<",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 3, "end": 4 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 3, "end": 4 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        "a>>b": {
            input: "a>>b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 4 },
                    "body": {
                        "kind": "ShiftExpression",
                        "span": { "start": 0, "end": 4 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 4 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 0, "end": 1 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 0, "end": 1 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": ">>",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "start": 3, "end": 4 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "start": 3, "end": 4 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        },

        "a<<b>>c<<d": {
            input: "a<<b>>c<<d",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 10 },
                    "body": {
                        "kind": "ShiftExpression",
                        "span": { "start": 0, "end": 10 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 10 },
                            "body": {
                            "left": {
                                "body": {
                                "left": {
                                    "body": {
                                    "left": {
                                        "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 1,
                                            "start": 0,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "a",
                                        },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                    },
                                    "operator": "<<",
                                    "right": {
                                        "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 4,
                                            "start": 3,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "b",
                                        },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                        "end": 4,
                                        "start": 3,
                                        },
                                    },
                                    },
                                    "kind": "BinaryOperator",
                                    "span": {
                                    "end": 4,
                                    "start": 0,
                                    },
                                },
                                "operator": ">>",
                                "right": {
                                    "body": {
                                    "kind": "Identifier",
                                    "span": {
                                        "end": 7,
                                        "start": 6,
                                    },
                                    "value": {
                                        "type": "ident",
                                        "value": "c",
                                    },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                    "end": 7,
                                    "start": 6,
                                    },
                                },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                "end": 7,
                                "start": 0,
                                },
                            },
                            "operator": "<<",
                            "right": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 10,
                                    "start": 9,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "d",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 10,
                                "start": 9,
                                },
                            },
                            },
                        }
                    }
                }
            ]
        },

        // ═════ RelationalExpression ════

        "a<b": {
            input: "a<b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 3 },
                    "body": {
                        "kind": "RelationalExpression",
                        "span": { "start": 0, "end": 3 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 3 },
                            "body": {
                                "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 1,
                                            "start": 0,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                },
                                "operator": "<",
                                "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 3,
                                            "start": 2,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                },
                            },
                        },
                    }
                }
            ]
        },

        "a>b": {
            input: "a>b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 3 },
                    "body": {
                        "kind": "RelationalExpression",
                        "span": { "start": 0, "end": 3 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 3 },
                            "body": {
                                "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 1,
                                            "start": 0,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                },
                                "operator": ">",
                                "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 3,
                                            "start": 2,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                },
                            },
                        },
                    }
                }
            ]
        },

        "a<=b": {
            input: "a<=b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 4 },
                    "body": {
                        "kind": "RelationalExpression",
                        "span": { "start": 0, "end": 4 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 4 },
                            "body": {
                                "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 1,
                                            "start": 0,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                },
                                "operator": "<=",
                                "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 4,
                                            "start": 3,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 4,
                                        "start": 3,
                                    },
                                },
                            },
                        },
                    }
                }
            ]
        },

        "a>=b": {
            input: "a>=b",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 4 },
                    "body": {
                        "kind": "RelationalExpression",
                        "span": { "start": 0, "end": 4 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "start": 0, "end": 4 },
                            "body": {
                                "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 1,
                                            "start": 0,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                },
                                "operator": ">=",
                                "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 4,
                                            "start": 3,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 4,
                                        "start": 3,
                                    },
                                },
                            },
                        },
                    }
                }
            ]
        },

        "a<b>c<=d>=e": {
            input: "a<b>c<=d>=e",
            ast: [
                {
                    "kind": "Expression",
                    "span": { "start": 0, "end": 11 },
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "left": {
                                "body": {
                                "left": {
                                    "body": {
                                    "left": {
                                        "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 1,
                                            "start": 0,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "a",
                                        },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                    },
                                    "operator": "<",
                                    "right": {
                                        "body": {
                                        "kind": "Identifier",
                                        "span": {
                                            "end": 3,
                                            "start": 2,
                                        },
                                        "value": {
                                            "type": "ident",
                                            "value": "b",
                                        },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                        "end": 3,
                                        "start": 2,
                                        },
                                    },
                                    },
                                    "kind": "BinaryOperator",
                                    "span": {
                                    "end": 3,
                                    "start": 0,
                                    },
                                },
                                "operator": ">",
                                "right": {
                                    "body": {
                                    "kind": "Identifier",
                                    "span": {
                                        "end": 5,
                                        "start": 4,
                                    },
                                    "value": {
                                        "type": "ident",
                                        "value": "c",
                                    },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                    "end": 5,
                                    "start": 4,
                                    },
                                },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                "end": 5,
                                "start": 0,
                                },
                            },
                            "operator": "<=",
                            "right": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 8,
                                    "start": 7,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "d",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 8,
                                "start": 7,
                                },
                            },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                            "end": 8,
                            "start": 0,
                            },
                        },
                        "operator": ">=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 11,
                                "start": 10,
                            },
                            "value": {
                                "type": "ident",
                                "value": "e",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 11,
                            "start": 10,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 11,
                        "start": 0,
                        },
                    },
                    "kind": "RelationalExpression",
                    "span": {
                        "end": 11,
                        "start": 0,
                    },
                    },
                }
            ]
        },

        // ═════ EqualityExpression ════

        "a==b": {
            input: "a==b",
            ast: [
            {
            "body": {
            "body": {
            "body": {
                "left": {
                "body": {
                    "kind": "Identifier",
                    "span": {
                    "end": 1,
                    "start": 0,
                    },
                    "value": {
                    "type": "ident",
                    "value": "a",
                    },
                },
                "kind": "PrimaryExpression",
                "span": {
                    "end": 1,
                    "start": 0,
                },
                },
                "operator": "==",
                "right": {
                "body": {
                    "kind": "Identifier",
                    "span": {
                    "end": 4,
                    "start": 3,
                    },
                    "value": {
                    "type": "ident",
                    "value": "b",
                    },
                },
                "kind": "PrimaryExpression",
                "span": {
                    "end": 4,
                    "start": 3,
                },
                },
            },
            "kind": "BinaryOperator",
            "span": {
                "end": 4,
                "start": 0,
            },
            },
            "kind": "EqualityExpression",
            "span": {
            "end": 4,
            "start": 0,
            },
            },
            "kind": "Expression",
            "span": {
            "end": 4,
            "start": 0,
            },
            },
            ]
        },

        "a!=b": {
            input: "a!=b",
            ast: [
            {
            "body": {
            "body": {
            "body": {
                "left": {
                "body": {
                    "kind": "Identifier",
                    "span": {
                    "end": 1,
                    "start": 0,
                    },
                    "value": {
                    "type": "ident",
                    "value": "a",
                    },
                },
                "kind": "PrimaryExpression",
                "span": {
                    "end": 1,
                    "start": 0,
                },
                },
                "operator": "!=",
                "right": {
                "body": {
                    "kind": "Identifier",
                    "span": {
                    "end": 4,
                    "start": 3,
                    },
                    "value": {
                    "type": "ident",
                    "value": "b",
                    },
                },
                "kind": "PrimaryExpression",
                "span": {
                    "end": 4,
                    "start": 3,
                },
                },
            },
            "kind": "BinaryOperator",
            "span": {
                "end": 4,
                "start": 0,
            },
            },
            "kind": "EqualityExpression",
            "span": {
            "end": 4,
            "start": 0,
            },
            },
            "kind": "Expression",
            "span": {
            "end": 4,
            "start": 0,
            },
            },
            ]
        },

        "a==b!=c==d": {
            input: 'a==b!=c==d',
            ast:[
                {
                  "body": {
                    "body": {
                    "body": {
                        "left": {
                        "body": {
                            "left": {
                            "body": {
                                "left": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 1,
                                    "start": 0,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "a",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 1,
                                    "start": 0,
                                },
                                },
                                "operator": "==",
                                "right": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 4,
                                    "start": 3,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "b",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 4,
                                    "start": 3,
                                },
                                },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                                "end": 4,
                                "start": 0,
                            },
                            },
                            "operator": "!=",
                            "right": {
                            "body": {
                                "kind": "Identifier",
                                "span": {
                                "end": 7,
                                "start": 6,
                                },
                                "value": {
                                "type": "ident",
                                "value": "c",
                                },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                                "end": 7,
                                "start": 6,
                            },
                            },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                            "end": 7,
                            "start": 0,
                        },
                        },
                        "operator": "==",
                        "right": {
                        "body": {
                            "kind": "Identifier",
                            "span": {
                            "end": 10,
                            "start": 9,
                            },
                            "value": {
                            "type": "ident",
                            "value": "d",
                            },
                        },
                        "kind": "PrimaryExpression",
                        "span": {
                            "end": 10,
                            "start": 9,
                        },
                        },
                    },
                    "kind": "BinaryOperator",
                    "span": {
                        "end": 10,
                        "start": 0,
                    },
                    },
                    "kind": "EqualityExpression",
                    "span": {
                    "end": 10,
                    "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                        "end": 10,
                        "start": 0,
                    },
                }
            ]
        },

        // ═════ BitwiseAndExpression ════

        "a&b": {
            input: 'a&b',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 3, "start": 0 },
                    "body": {
                        "kind": "BitwiseAndExpression",
                        "span": { "end": 3, "start": 0 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "end": 3, "start": 0 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 1, "start": 0 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 1, "start": 0 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "&",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 3, "start": 2 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 3, "start": 2 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },

        "a&b&c": {
            input: 'a&b&c',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 5, "start": 0 },
                    "body": {
                        "kind": "BitwiseAndExpression",
                        "span": { "end": 5, "start": 0 },
                        "body": {
                            "body": {
                                "left": {
                                "body": {
                                    "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                    },
                                    "operator": "&",
                                    "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 3,
                                        "start": 2,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                    },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                    "end": 3,
                                    "start": 0,
                                },
                                },
                                "operator": "&",
                                "right": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 5,
                                    "start": 4,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "c",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 5,
                                    "start": 4,
                                },
                                },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                                "end": 5,
                                "start": 0,
                            },
                        },
                    },
                },
            ]
        },

        // ═════ BitwiseXorExpression ════

        "a^b": {
            input: 'a^b',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 3, "start": 0 },
                    "body": {
                        "kind": "BitwiseXorExpression",
                        "span": { "end": 3, "start": 0 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "end": 3, "start": 0 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 1, "start": 0 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 1, "start": 0 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "^",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 3, "start": 2 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 3, "start": 2 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },

        "a^b^c": {
            input: 'a^b^c',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 5, "start": 0 },
                    "body": {
                        "kind": "BitwiseXorExpression",
                        "span": { "end": 5, "start": 0 },
                        "body": {
                            "body": {
                                "left": {
                                "body": {
                                    "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                    },
                                    "operator": "^",
                                    "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 3,
                                        "start": 2,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                    },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                    "end": 3,
                                    "start": 0,
                                },
                                },
                                "operator": "^",
                                "right": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 5,
                                    "start": 4,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "c",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 5,
                                    "start": 4,
                                },
                                },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                                "end": 5,
                                "start": 0,
                            },
                        },
                    },
                },
            ]
        },

        // ═════ BitwiseOrExpression ════

        "a|b": {
            input: 'a|b',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 3, "start": 0 },
                    "body": {
                        "kind": "BitwiseOrExpression",
                        "span": { "end": 3, "start": 0 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "end": 3, "start": 0 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 1, "start": 0 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 1, "start": 0 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "|",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 3, "start": 2 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 3, "start": 2 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },

        "a|b|c": {
            input: 'a|b|c',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 5, "start": 0 },
                    "body": {
                        "kind": "BitwiseOrExpression",
                        "span": { "end": 5, "start": 0 },
                        "body": {
                            "body": {
                                "left": {
                                "body": {
                                    "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                    },
                                    "operator": "|",
                                    "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 3,
                                        "start": 2,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 3,
                                        "start": 2,
                                    },
                                    },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                    "end": 3,
                                    "start": 0,
                                },
                                },
                                "operator": "|",
                                "right": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 5,
                                    "start": 4,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "c",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 5,
                                    "start": 4,
                                },
                                },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                                "end": 5,
                                "start": 0,
                            },
                        },
                    },
                },
            ]
        },

        // ═════ LogicalAndExpression ════

        "a&&b": {
            input: 'a&&b',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 4, "start": 0 },
                    "body": {
                        "kind": "LogicalAndExpression",
                        "span": { "end": 4, "start": 0 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "end": 4, "start": 0 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 1, "start": 0 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 1, "start": 0 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "&&",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 4, "start": 3 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 4, "start": 3 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },

        "a&&b&&c": {
            input: 'a&&b&&c',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 7, "start": 0 },
                    "body": {
                        "kind": "LogicalAndExpression",
                        "span": { "end": 7, "start": 0 },
                        "body": {
                            "body": {
                                "left": {
                                "body": {
                                    "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                    },
                                    "operator": "&&",
                                    "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 4,
                                        "start": 3,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 4,
                                        "start": 3,
                                    },
                                    },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                    "end": 4,
                                    "start": 0,
                                },
                                },
                                "operator": "&&",
                                "right": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 7,
                                    "start": 6,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "c",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 7,
                                    "start": 6,
                                },
                                },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                                "end": 7,
                                "start": 0,
                            },
                        },
                    },
                },
            ]
        },

        // ═════ LogicalOrExpression ════

        "a||b": {
            input: 'a||b',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 4, "start": 0 },
                    "body": {
                        "kind": "LogicalOrExpression",
                        "span": { "end": 4, "start": 0 },
                        "body": {
                            "kind": "BinaryOperator",
                            "span": { "end": 4, "start": 0 },
                            "body": {
                                "left": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 1, "start": 0 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 1, "start": 0 },
                                        "value": { "type": "ident", "value": "a" }
                                    }
                                },
                                "operator": "||",
                                "right": {
                                    "kind": "PrimaryExpression",
                                    "span": { "end": 4, "start": 3 },
                                    "body": {
                                        "kind": "Identifier",
                                        "span": { "end": 4, "start": 3 },
                                        "value": { "type": "ident", "value": "b" }
                                    }
                                }
                            }
                        }
                    }
                },
            ]
        },

        "a||b||c": {
            input: 'a||b||c',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 7, "start": 0 },
                    "body": {
                        "kind": "LogicalOrExpression",
                        "span": { "end": 7, "start": 0 },
                        "body": {
                            "body": {
                                "left": {
                                "body": {
                                    "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 1,
                                        "start": 0,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "a",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 1,
                                        "start": 0,
                                    },
                                    },
                                    "operator": "||",
                                    "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 4,
                                        "start": 3,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "b",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 4,
                                        "start": 3,
                                    },
                                    },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                    "end": 4,
                                    "start": 0,
                                },
                                },
                                "operator": "||",
                                "right": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 7,
                                    "start": 6,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "c",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 7,
                                    "start": 6,
                                },
                                },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                                "end": 7,
                                "start": 0,
                            },
                        },
                    },
                },
            ]
        },

        // ═════ TernaryExpression ════

        "a?b:c": {
            input: 'a?b:c',
            ast: [
                {
                    "kind": "Expression",
                    "span": { "end": 5, "start": 0 },
                    "body": {
                        "body": {
                        "body": {
                            "condition": {
                            "body": {
                                "kind": "Identifier",
                                "span": {
                                "end": 1,
                                "start": 0,
                                },
                                "value": {
                                "type": "ident",
                                "value": "a",
                                },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            },
                            "falseExpr": {
                            "body": {
                                "kind": "Identifier",
                                "span": {
                                "end": 5,
                                "start": 4,
                                },
                                "value": {
                                "type": "ident",
                                "value": "c",
                                },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                                "end": 5,
                                "start": 4,
                            },
                            },
                            "trueExpr": {
                            "body": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 3,
                                    "start": 2,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "b",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 3,
                                "start": 2,
                                },
                            },
                            "kind": "Expression",
                            "span": {
                                "end": 3,
                                "start": 2,
                            },
                            },
                        },
                        "kind": "TernaryOperator",
                        "span": {
                            "end": 5,
                            "start": 0,
                        },
                        },
                        "kind": "TernaryExpression",
                        "span": {
                        "end": 5,
                        "start": 0,
                        },
                    },
                },
            ]
        },

        "a?b:c?d:e": {
            input: 'a?b:c?d:e',
            ast: [
                {
                "body": {
                    "body": {
                    "body": {
                        "condition": {
                        "body": {
                            "kind": "Identifier",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                            "value": {
                            "type": "ident",
                            "value": "a",
                            },
                        },
                        "kind": "PrimaryExpression",
                        "span": {
                            "end": 1,
                            "start": 0,
                        },
                        },
                        "falseExpr": {
                        "body": {
                            "body": {
                            "condition": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 5,
                                    "start": 4,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "c",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 5,
                                "start": 4,
                                },
                            },
                            "falseExpr": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 9,
                                    "start": 8,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "e",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 9,
                                "start": 8,
                                },
                            },
                            "trueExpr": {
                                "body": {
                                "body": {
                                    "kind": "Identifier",
                                    "span": {
                                    "end": 7,
                                    "start": 6,
                                    },
                                    "value": {
                                    "type": "ident",
                                    "value": "d",
                                    },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                    "end": 7,
                                    "start": 6,
                                },
                                },
                                "kind": "Expression",
                                "span": {
                                "end": 7,
                                "start": 6,
                                },
                            },
                            },
                            "kind": "TernaryOperator",
                            "span": {
                            "end": 9,
                            "start": 4,
                            },
                        },
                        "kind": "TernaryExpression",
                        "span": {
                            "end": 9,
                            "start": 4,
                        },
                        },
                        "trueExpr": {
                        "body": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 3,
                                "start": 2,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 3,
                            "start": 2,
                            },
                        },
                        "kind": "Expression",
                        "span": {
                            "end": 3,
                            "start": 2,
                        },
                        },
                    },
                    "kind": "TernaryOperator",
                    "span": {
                        "end": 9,
                        "start": 0,
                    },
                    },
                    "kind": "TernaryExpression",
                    "span": {
                    "end": 9,
                    "start": 0,
                    },
                },
                "kind": "Expression",
                "span": {
                    "end": 9,
                    "start": 0,
                },
                },
            ]
        },

        "a ? b & c : d ? e ^ f : g || h ? i : j & k": {
            input: 'a ? b & c : d ? e ^ f : g || h ? i : j & k',
            ast: [
            {
                "body": {
                "body": {
                    "body": {
                    "condition": {
                        "body": {
                        "kind": "Identifier",
                        "span": {
                            "end": 1,
                            "start": 0,
                        },
                        "value": {
                            "type": "ident",
                            "value": "a",
                        },
                        },
                        "kind": "PrimaryExpression",
                        "span": {
                        "end": 1,
                        "start": 0,
                        },
                    },
                    "falseExpr": {
                        "body": {
                        "body": {
                            "condition": {
                            "body": {
                                "kind": "Identifier",
                                "span": {
                                "end": 13,
                                "start": 12,
                                },
                                "value": {
                                "type": "ident",
                                "value": "d",
                                },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                                "end": 13,
                                "start": 12,
                            },
                            },
                            "falseExpr": {
                            "body": {
                                "body": {
                                "condition": {
                                    "body": {
                                    "body": {
                                        "left": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                            "end": 25,
                                            "start": 24,
                                            },
                                            "value": {
                                            "type": "ident",
                                            "value": "g",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 25,
                                            "start": 24,
                                        },
                                        },
                                        "operator": "||",
                                        "right": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                            "end": 30,
                                            "start": 29,
                                            },
                                            "value": {
                                            "type": "ident",
                                            "value": "h",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 30,
                                            "start": 29,
                                        },
                                        },
                                    },
                                    "kind": "BinaryOperator",
                                    "span": {
                                        "end": 30,
                                        "start": 24,
                                    },
                                    },
                                    "kind": "LogicalOrExpression",
                                    "span": {
                                    "end": 30,
                                    "start": 24,
                                    },
                                },
                                "falseExpr": {
                                    "body": {
                                    "body": {
                                        "left": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                            "end": 38,
                                            "start": 37,
                                            },
                                            "value": {
                                            "type": "ident",
                                            "value": "j",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 38,
                                            "start": 37,
                                        },
                                        },
                                        "operator": "&",
                                        "right": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                            "end": 42,
                                            "start": 41,
                                            },
                                            "value": {
                                            "type": "ident",
                                            "value": "k",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 42,
                                            "start": 41,
                                        },
                                        },
                                    },
                                    "kind": "BinaryOperator",
                                    "span": {
                                        "end": 42,
                                        "start": 37,
                                    },
                                    },
                                    "kind": "BitwiseAndExpression",
                                    "span": {
                                    "end": 42,
                                    "start": 37,
                                    },
                                },
                                "trueExpr": {
                                    "body": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 34,
                                        "start": 33,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "i",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 34,
                                        "start": 33,
                                    },
                                    },
                                    "kind": "Expression",
                                    "span": {
                                    "end": 34,
                                    "start": 33,
                                    },
                                },
                                },
                                "kind": "TernaryOperator",
                                "span": {
                                "end": 42,
                                "start": 24,
                                },
                            },
                            "kind": "TernaryExpression",
                            "span": {
                                "end": 42,
                                "start": 24,
                            },
                            },
                            "trueExpr": {
                            "body": {
                                "body": {
                                "body": {
                                    "left": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 17,
                                        "start": 16,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "e",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 17,
                                        "start": 16,
                                    },
                                    },
                                    "operator": "^",
                                    "right": {
                                    "body": {
                                        "kind": "Identifier",
                                        "span": {
                                        "end": 21,
                                        "start": 20,
                                        },
                                        "value": {
                                        "type": "ident",
                                        "value": "f",
                                        },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                        "end": 21,
                                        "start": 20,
                                    },
                                    },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                    "end": 21,
                                    "start": 16,
                                },
                                },
                                "kind": "BitwiseXorExpression",
                                "span": {
                                "end": 21,
                                "start": 16,
                                },
                            },
                            "kind": "Expression",
                            "span": {
                                "end": 21,
                                "start": 16,
                            },
                            },
                        },
                        "kind": "TernaryOperator",
                        "span": {
                            "end": 42,
                            "start": 12,
                        },
                        },
                        "kind": "TernaryExpression",
                        "span": {
                        "end": 42,
                        "start": 12,
                        },
                    },
                    "trueExpr": {
                        "body": {
                        "body": {
                            "body": {
                            "left": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 5,
                                    "start": 4,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "b",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 5,
                                "start": 4,
                                },
                            },
                            "operator": "&",
                            "right": {
                                "body": {
                                "kind": "Identifier",
                                "span": {
                                    "end": 9,
                                    "start": 8,
                                },
                                "value": {
                                    "type": "ident",
                                    "value": "c",
                                },
                                },
                                "kind": "PrimaryExpression",
                                "span": {
                                "end": 9,
                                "start": 8,
                                },
                            },
                            },
                            "kind": "BinaryOperator",
                            "span": {
                            "end": 9,
                            "start": 4,
                            },
                        },
                        "kind": "BitwiseAndExpression",
                        "span": {
                            "end": 9,
                            "start": 4,
                        },
                        },
                        "kind": "Expression",
                        "span": {
                        "end": 9,
                        "start": 4,
                        },
                    },
                    },
                    "kind": "TernaryOperator",
                    "span": {
                    "end": 42,
                    "start": 0,
                    },
                },
                "kind": "TernaryExpression",
                "span": {
                    "end": 42,
                    "start": 0,
                },
                },
                "kind": "Expression",
                "span": {
                "end": 42,
                "start": 0,
                },
            },
            ]
        },

        // ═════ AssignmentExpression ════

        "a=b": {
            input: 'a=b',
            ast: [
                {
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            "value": {
                                "type": "ident",
                                "value": "a",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                        },
                        "operator": "=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 3,
                                "start": 2,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 3,
                            "start": 2,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 3,
                        "start": 0,
                        },
                    },
                    "kind": "AssignmentExpression",
                    "span": {
                        "end": 3,
                        "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                    "end": 3,
                    "start": 0,
                    },
                },
            ],
        },

        "a+=b": {
            input: 'a+=b',
            ast: [
                {
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            "value": {
                                "type": "ident",
                                "value": "a",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                        },
                        "operator": "+=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 4,
                                "start": 3,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 4,
                            "start": 3,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 4,
                        "start": 0,
                        },
                    },
                    "kind": "AssignmentExpression",
                    "span": {
                        "end": 4,
                        "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                    "end": 4,
                    "start": 0,
                    },
                },
            ],
        },

        "a-=b": {
            input: 'a-=b',
            ast: [
                {
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            "value": {
                                "type": "ident",
                                "value": "a",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                        },
                        "operator": "-=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 4,
                                "start": 3,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 4,
                            "start": 3,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 4,
                        "start": 0,
                        },
                    },
                    "kind": "AssignmentExpression",
                    "span": {
                        "end": 4,
                        "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                    "end": 4,
                    "start": 0,
                    },
                },
            ],
        },

        "a*=b": {
            input: 'a*=b',
            ast: [
                {
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            "value": {
                                "type": "ident",
                                "value": "a",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                        },
                        "operator": "*=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 4,
                                "start": 3,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 4,
                            "start": 3,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 4,
                        "start": 0,
                        },
                    },
                    "kind": "AssignmentExpression",
                    "span": {
                        "end": 4,
                        "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                    "end": 4,
                    "start": 0,
                    },
                },
            ],
        },

        "a/=b": {
            input: 'a/=b',
            ast: [
                {
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            "value": {
                                "type": "ident",
                                "value": "a",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                        },
                        "operator": "/=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 4,
                                "start": 3,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 4,
                            "start": 3,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 4,
                        "start": 0,
                        },
                    },
                    "kind": "AssignmentExpression",
                    "span": {
                        "end": 4,
                        "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                    "end": 4,
                    "start": 0,
                    },
                },
            ],
        },

        "a%=b": {
            input: 'a%=b',
            ast: [
                {
                    "body": {
                    "body": {
                        "body": {
                        "left": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 1,
                                "start": 0,
                            },
                            "value": {
                                "type": "ident",
                                "value": "a",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 1,
                            "start": 0,
                            },
                        },
                        "operator": "%=",
                        "right": {
                            "body": {
                            "kind": "Identifier",
                            "span": {
                                "end": 4,
                                "start": 3,
                            },
                            "value": {
                                "type": "ident",
                                "value": "b",
                            },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                            "end": 4,
                            "start": 3,
                            },
                        },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                        "end": 4,
                        "start": 0,
                        },
                    },
                    "kind": "AssignmentExpression",
                    "span": {
                        "end": 4,
                        "start": 0,
                    },
                    },
                    "kind": "Expression",
                    "span": {
                    "end": 4,
                    "start": 0,
                    },
                },
            ],
        },

        "a+=b-=c/=d%=e": {
            input: 'a+=b-=c/=d%=e',
            ast: [
            {
                "body": {
                "body": {
                    "body": {
                    "left": {
                        "body": {
                        "kind": "Identifier",
                        "span": {
                            "end": 1,
                            "start": 0,
                        },
                        "value": {
                            "type": "ident",
                            "value": "a",
                        },
                        },
                        "kind": "PrimaryExpression",
                        "span": {
                        "end": 1,
                        "start": 0,
                        },
                    },
                    "operator": "+=",
                    "right": {
                        "body": {
                        "body": {
                            "left": {
                            "body": {
                                "kind": "Identifier",
                                "span": {
                                "end": 4,
                                "start": 3,
                                },
                                "value": {
                                "type": "ident",
                                "value": "b",
                                },
                            },
                            "kind": "PrimaryExpression",
                            "span": {
                                "end": 4,
                                "start": 3,
                            },
                            },
                            "operator": "-=",
                            "right": {
                            "body": {
                                "body": {
                                "left": {
                                    "body": {
                                    "kind": "Identifier",
                                    "span": {
                                        "end": 7,
                                        "start": 6,
                                    },
                                    "value": {
                                        "type": "ident",
                                        "value": "c",
                                    },
                                    },
                                    "kind": "PrimaryExpression",
                                    "span": {
                                    "end": 7,
                                    "start": 6,
                                    },
                                },
                                "operator": "/=",
                                "right": {
                                    "body": {
                                    "body": {
                                        "left": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                            "end": 10,
                                            "start": 9,
                                            },
                                            "value": {
                                            "type": "ident",
                                            "value": "d",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 10,
                                            "start": 9,
                                        },
                                        },
                                        "operator": "%=",
                                        "right": {
                                        "body": {
                                            "kind": "Identifier",
                                            "span": {
                                            "end": 13,
                                            "start": 12,
                                            },
                                            "value": {
                                            "type": "ident",
                                            "value": "e",
                                            },
                                        },
                                        "kind": "PrimaryExpression",
                                        "span": {
                                            "end": 13,
                                            "start": 12,
                                        },
                                        },
                                    },
                                    "kind": "BinaryOperator",
                                    "span": {
                                        "end": 13,
                                        "start": 9,
                                    },
                                    },
                                    "kind": "AssignmentExpression",
                                    "span": {
                                    "end": 13,
                                    "start": 9,
                                    },
                                },
                                },
                                "kind": "BinaryOperator",
                                "span": {
                                "end": 13,
                                "start": 6,
                                },
                            },
                            "kind": "AssignmentExpression",
                            "span": {
                                "end": 13,
                                "start": 6,
                            },
                            },
                        },
                        "kind": "BinaryOperator",
                        "span": {
                            "end": 13,
                            "start": 3,
                        },
                        },
                        "kind": "AssignmentExpression",
                        "span": {
                        "end": 13,
                        "start": 3,
                        },
                    },
                    },
                    "kind": "BinaryOperator",
                    "span": {
                    "end": 13,
                    "start": 0,
                    },
                },
                "kind": "AssignmentExpression",
                "span": {
                    "end": 13,
                    "start": 0,
                },
                },
                "kind": "Expression",
                "span": {
                "end": 13,
                "start": 0,
                },
            },
            ],
        },
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝