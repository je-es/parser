// Expr.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as rules from '../rules';
    import { ParseResult } from '../../../lib/types';
    import * as Program from '../../libs/program/program';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const Expr = rules.Syntax.from('Expression', 'off');

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    const cases = {

        PrimaryLiteral : [
            // integer
            {
                input       : '55',
                output      : Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 2 }, 55),
            },

            // float (n.n)
            {
                input       : '3.14',
                output      : Program.Expression.createPrimaryLiteralFloat({ start: 0, end: 4 }, 3.14),
            },

            // float (using scientific notation)
            {
                input       : '3.14e2',
                output      : Program.Expression.createPrimaryLiteralFloat({ start: 0, end: 6 }, 3.14e2),
            },

            // bool
            {
                input       : 'true',
                output      : Program.Expression.createPrimaryLiteralBool({ start: 0, end: 4 }, true),
            },
            {
                input       : 'false',
                output      : Program.Expression.createPrimaryLiteralBool({ start: 0, end: 5 }, false),
            },

            // null
            {
                input       : 'null',
                output      : Program.Expression.createPrimaryLiteralNull({ start: 0, end: 4 }),
            },

            // undefined
            {
                input       : 'undefined',
                output      : Program.Expression.createPrimaryLiteralUndefined({ start: 0, end: 9 }),
            },

            // string
            {
                input       : `"hello"`,
                output      : Program.Expression.createPrimaryLiteralString({ start: 0, end: 7 }, 'hello'),
            },

            // character
            {
                input       : `'c'`,
                output      : Program.Expression.createPrimaryLiteralCharacter({ start: 0, end: 3 }, 'c'),
            },

            // array
            {
                input       : `[]`,
                output      : Program.Expression.createPrimaryLiteralArray({ start: 0, end: 2 }, []),
            },
            {
                input       : `[1, 2, 3]`,
                output      : Program.Expression.createPrimaryLiteralArray({ start: 0, end: 9 }, [
                    Program.Expression.createPrimaryLiteralInteger({ start: 1, end: 2 }, 1),
                    Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2),
                    Program.Expression.createPrimaryLiteralInteger({ start: 7, end: 8 }, 3),
                ]),
            },
        ],

        // PrimaryIdentifier : [
        //     // {
        //     //     input       : 'foo',
        //     //     output      : Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false),
        //     // },
        //     // {
        //     //     input       : '@bar',
        //     //     output      : Program.Expression.createPrimaryIdentifier({ start: 0, end: 4 }, '@bar', true),
        //     // },
        // ],

        // PrimaryParen : [
        //     {
        //         input       : '(foo)',
        //         output      : Program.Expression.createPrimaryParen({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 4 }, 'foo', false)),
        //     },
        //     {
        //         input       : '(@bar)',
        //         output      : Program.Expression.createPrimaryParen({ start: 0, end: 6 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 5 }, '@bar', true)),
        //     },
        // ],

        // PrimaryObject : [
        //     // empty object
        //     {
        //         input       : '{}',
        //         output      : Program.Expression.createPrimaryObject({ start: 0, end: 2 }, []),
        //     },

        //     // filled object (using = expr)
        //     {
        //         input       : '{ foo = 42, bar = "hello" }',
        //         output      : Program.Expression.createPrimaryObject({ start: 0, end: 27 }, [
        //             Program.Field.create({ start: 2, end: 10 }, Program.Identifier.create({ start: 2, end: 5 }, 'foo'), Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 10 }, 42), undefined),
        //             Program.Field.create({ start: 12, end: 25 }, Program.Identifier.create({ start: 12, end: 15 }, 'bar'), Program.Expression.createPrimaryLiteralString({ start: 18, end: 25 }, 'hello'), undefined),
        //         ]),
        //     },

        //     // filled object (using => block) (one elem)
        //     {
        //         input       : '{ foo => { 42; } }',
        //         output      : Program.Expression.createPrimaryObject({ start: 0, end: 18 }, [
        //             Program.Field.create({ start: 2, end: 16 }, Program.Identifier.create({ start: 2, end: 5 }, 'foo'), undefined, Program.Statement.createBlock({ start: 9, end: 16 }, [Program.Statement.createExpression({ start: 11, end: 14 }, Program.Expression.createPrimaryLiteralInteger({ start: 11, end: 13 }, 42))])),
        //         ]),
        //     },
        //     // filled object (using => block) (two elem)
        //     {
        //         input       : '{ foo => { 42; }, bar => { "hello"; } }',
        //         output      : Program.Expression.createPrimaryObject({ start: 0, end: 39 }, [
        //             Program.Field.create({ start: 2, end: 16 }, Program.Identifier.create({ start: 2, end: 5 }, 'foo'), undefined, Program.Statement.createBlock({ start: 9, end: 16 }, [Program.Statement.createExpression({ start: 11, end: 14 }, Program.Expression.createPrimaryLiteralInteger({ start: 11, end: 13 }, 42))])),
        //             Program.Field.create({ start: 18, end: 37 }, Program.Identifier.create({ start: 18, end: 21 }, 'bar'), undefined, Program.Statement.createBlock({ start: 25, end: 37 }, [Program.Statement.createExpression({ start: 27, end: 35 }, Program.Expression.createPrimaryLiteralString({ start: 27, end: 34 }, 'hello'))])),
        //         ]),
        //     },
        // ],

        // Postfix: [
        //     {
        //         input       : 'foo++',
        //         output      : Program.Expression.createPostfixIncrement({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false)),
        //     },
        //     {
        //         input       : 'bar--',
        //         output      : Program.Expression.createPostfixDecrement({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'bar', false)),
        //     },
        //     {
        //         input       : 'foo.*',
        //         output      : Program.Expression.createPostfixDereference({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false)),
        //     },
        //     {
        //         input       : 'foo.bar',
        //         output      : Program.Expression.createPostfixMemberAccess({ start: 0, end: 7 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false), Program.Expression.createPrimaryIdentifier({ start: 4, end: 7 }, 'bar', false)),
        //     },
        //     {
        //         input       : 'foo()',
        //         output      : Program.Expression.createPostfixCall({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false), []),
        //     },
        //     {
        //         input       : 'foo[42]',
        //         output      : Program.Expression.createPostfixArrayAccess({ start: 0, end: 7 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false), Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 6 }, 42)),
        //     },
        // ],

        // MultiPostfix: [
        //     {
        //         input       : 'foo.bar.baz',
        //         output      : Program.Expression.createPostfixMemberAccess({ start: 0, end: 11 }, Program.Expression.createPostfixMemberAccess({ start: 0, end: 7 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false), Program.Expression.createPrimaryIdentifier({ start: 4, end: 7 }, 'bar', false)), Program.Expression.createPrimaryIdentifier({ start: 8, end: 11 }, 'baz', false)),
        //     },
        //     {
        //         input       : 'foo()()',
        //         output      : Program.Expression.createPostfixCall({ start: 0, end: 7 }, Program.Expression.createPostfixCall({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false), []), []),
        //     },
        //     {
        //         input       : 'foo[42][43]',
        //         output      : Program.Expression.createPostfixArrayAccess({ start: 0, end: 11 }, Program.Expression.createPostfixArrayAccess({ start: 0, end: 7 }, Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false), Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 6 }, 42)), Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 10 }, 43)),
        //     },
        // ],

        // Prefix: [
        //     {
        //         input       : '++foo',
        //         output      : Program.Expression.createPrefixIncrement({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 2, end: 5 }, 'foo', false)),
        //     },
        //     {
        //         input       : '--bar',
        //         output      : Program.Expression.createPrefixDecrement({ start: 0, end: 5 }, Program.Expression.createPrimaryIdentifier({ start: 2, end: 5 }, 'bar', false)),
        //     },
        //     {
        //         input       : '&foo',
        //         output      : Program.Expression.createPrefixReference({ start: 0, end: 4 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 4 }, 'foo', false)),
        //     },
        //     {
        //         input       : '-bar',
        //         output      : Program.Expression.createPrefixUnaryMinus({ start: 0, end: 4 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 4 }, 'bar', false)),
        //     },
        //     {
        //         input       : '+foo',
        //         output      : Program.Expression.createPrefixUnaryPlus({ start: 0, end: 4 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 4 }, 'foo', false)),
        //     },
        //     {
        //         input       : '!bar',
        //         output      : Program.Expression.createPrefixLogicalNot({ start: 0, end: 4 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 4 }, 'bar', false)),
        //     },
        //     {
        //         input       : '~foo',
        //         output      : Program.Expression.createPrefixBitwiseNot({ start: 0, end: 4 }, Program.Expression.createPrimaryIdentifier({ start: 1, end: 4 }, 'foo', false)),
        //     },
        // ],

        // MultiPrefix: [
        //     {
        //         input       : '++++foo',
        //         output      : Program.Expression.createPrefixIncrement({ start: 2, end: 7 }, Program.Expression.createPrefixIncrement({ start: 0, end: 7 }, Program.Expression.createPrimaryIdentifier({ start: 4, end: 7 }, 'foo', false))),
        //     }
        // ],

        // BinaryPower: [
        //     // single
        //     {
        //         input       : '2 ** 3',
        //         output      : Program.Expression.createBinaryPower({ start: 0, end: 6 }, Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2), Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)),
        //     },

        //     // Multiple
        //     {
        //         input       : '2 ** 3 ** 4',
        //         output      : Program.Expression.createBinaryPower({ start: 0, end: 11 }, Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2), Program.Expression.createBinaryPower({ start: 5, end: 11 }, Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3), Program.Expression.createPrimaryLiteralInteger({ start: 10, end: 11 }, 4))),
        //     }

        // ],

        // BinaryArithmetic: [
        //     // single *
        //     {
        //         input       : '2 * 3',
        //         output      : Program.Expression.createBinaryMultiplicative(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger(
        //                 { start: 0, end: 1 }, 2),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger(
        //                     { start: 4, end: 5 },
        //                     3
        //                 )
        //             ),
        //     },

        //     // Multiple
        //     {
        //         input       : '2 * 3 * 4',
        //         output      : Program.Expression.createBinaryMultiplicative(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createBinaryMultiplicative(
        //                     { start: 0, end: 5 },
        //                     Program.Expression.createPrimaryLiteralInteger(
        //                         { start: 0, end: 1 },
        //                         2
        //                     ),
        //                     '*',
        //                     Program.Expression.createPrimaryLiteralInteger(
        //                         { start: 4, end: 5 },
        //                         3
        //                     )
        //                 ),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger(
        //                     { start: 8, end: 9 },
        //                     4
        //                 )
        //             ),
        //     },

        //     // Mixed operators - multiplication has higher precedence
        //     {
        //         input: '2 + 3 * 4',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 9 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //             '+',
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 4, end: 9 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4)
        //             )
        //         )
        //     },

        //     // Mixed operators - reverse order
        //     {
        //         input: '2 * 3 + 4',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             '+',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4)
        //         )
        //     },

        //     // Multiple additive operations (left-to-right)
        //     {
        //         input: '1 + 2 + 3',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '+',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //             ),
        //             '+',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //         )
        //     },

        //     // Division and multiplication (same precedence, left-to-right)
        //     {
        //         input: '8 / 2 * 3',
        //         output: Program.Expression.createBinaryMultiplicative(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 8),
        //                 '/',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //             ),
        //             '*',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //         )
        //     },

        //     // Complex mixed expression with proper grouping
        //     {
        //         input: '2 + 3 * 4 + 5',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 13 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '+',
        //                 Program.Expression.createBinaryMultiplicative(
        //                     { start: 4, end: 9 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3),
        //                     '*',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4)
        //                 )
        //             ),
        //             '+',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 5)
        //         )
        //     },

        //     // Edge case: Subtraction and division
        //     {
        //         input: '10 - 6 / 2',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 10 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 2 }, 10),
        //             '-',
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 5, end: 10 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 6),
        //                 '/',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 2)
        //             )
        //         )
        //     },

        //     // Edge case: Modulo with addition
        //     {
        //         input: '7 % 3 + 1',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 7),
        //                 '%',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             '+',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 1)
        //         )
        //     },

        //     // Edge case: All operators mixed
        //     {
        //         input: '1 + 2 * 3 - 4 / 2',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 17 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '+',
        //                 Program.Expression.createBinaryMultiplicative(
        //                     { start: 4, end: 9 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2),
        //                     '*',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //                 )
        //             ),
        //             '-',
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 12, end: 17 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 4),
        //                 '/',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 16, end: 17 }, 2)
        //             )
        //         )
        //     },

        //     // Edge case: Long chain of same precedence
        //     {
        //         input: '1 * 2 / 3 % 4',
        //         output: Program.Expression.createBinaryMultiplicative(
        //             { start: 0, end: 13 },
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createBinaryMultiplicative(
        //                     { start: 0, end: 5 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                     '*',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //                 ),
        //                 '/',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //             ),
        //             '%',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 4)
        //         )
        //     },
        // ],

        // BinaryShift: [
        //     // Basic left shift
        //     {
        //         input: '4 << 2',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 4),
        //             '<<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //         )
        //         // Expected result: 4 << 2 = 16
        //     },

        //     // Basic right shift
        //     {
        //         input: '16 >> 2',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 7 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 2 }, 16),
        //             '>>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 6, end: 7 }, 2)
        //         )
        //         // Expected result: 16 >> 2 = 4
        //     },

        //     // Chained left shifts (left-to-right associativity)
        //     {
        //         input: '1 << 2 << 3',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 11 },
        //             Program.Expression.createBinaryShift(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '<<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //             ),
        //             '<<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 10, end: 11 }, 3)
        //         )
        //         // Expected result: (1 << 2) << 3 = 4 << 3 = 32
        //     },

        //     // Chained right shifts (left-to-right associativity)
        //     {
        //         input: '64 >> 2 >> 1',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 12 },
        //             Program.Expression.createBinaryShift(
        //                 { start: 0, end: 7 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 2 }, 64),
        //                 '>>',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 6, end: 7 }, 2)
        //             ),
        //             '>>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 11, end: 12 }, 1)
        //         )
        //         // Expected result: (64 >> 2) >> 1 = 16 >> 1 = 8
        //     },

        //     // Mixed shift operators
        //     {
        //         input: '8 << 1 >> 2',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 11 },
        //             Program.Expression.createBinaryShift(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 8),
        //                 '<<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 1)
        //             ),
        //             '>>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 10, end: 11 }, 2)
        //         )
        //         // Expected result: (8 << 1) >> 2 = 16 >> 2 = 4
        //     },

        //     // Edge case: Shift by zero
        //     {
        //         input: '5 << 0',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             '<<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 0)
        //         )
        //         // Expected result: 5 << 0 = 5
        //     },

        //     // Edge case: Shift with larger numbers
        //     {
        //         input: '128 >> 4',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 8 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 3 }, 128),
        //             '>>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 7, end: 8 }, 4)
        //         )
        //         // Expected result: 128 >> 4 = 8
        //     },

        //     // Shift should have lower precedence than multiplicative
        //     {
        //         input: '2 * 4 << 1',
        //         output: Program.Expression.createBinaryShift(
        //             { start: 0, end: 10 },
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 4)
        //             ),
        //             '<<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 1)
        //         )
        //         // Expected result: (2 * 4) << 1 = 8 << 1 = 16
        //     },

        //     // Shift should have higher precedence than additive
        //     {
        //         input: '1 + 4 << 2',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 10 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //             '+',
        //             Program.Expression.createBinaryShift(
        //                 { start: 4, end: 10 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 4),
        //                 '<<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 2)
        //             )
        //         )
        //         // Expected result: 1 + (4 << 2) = 1 + 16 = 17
        //     },

        //     // Complex precedence test
        //     {
        //         input: '2 + 3 * 4 << 1 - 1',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 18 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 14 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '+',
        //                 Program.Expression.createBinaryShift(
        //                     { start: 4, end: 14 },
        //                     Program.Expression.createBinaryMultiplicative(
        //                         { start: 4, end: 9 },
        //                         Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3),
        //                         '*',
        //                         Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4)
        //                     ),
        //                     '<<',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 1)
        //                 )
        //             ),
        //             '-',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 17, end: 18 }, 1)
        //         )
        //         // Expected result: 2 + ((3 * 4) << 1) - 1 = 2 + (12 << 1) - 1 = 2 + 24 - 1 = 25
        //     },
        // ],

        // BinaryRelational: [
        //     // Basic less than
        //     {
        //         input: '2 < 3',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //             '<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //         )
        //     },

        //     // Basic greater than
        //     {
        //         input: '5 > 3',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             '>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //         )
        //     },

        //     // Less than or equal
        //     {
        //         input: '2 <= 3',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //             '<=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)
        //         )
        //     },

        //     // Greater than or equal
        //     {
        //         input: '5 >= 3',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             '>=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)
        //         )
        //     },

        //     // Chained relational (left-to-right associativity)
        //     {
        //         input: '1 < 2 < 3',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryRelational(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //             ),
        //             '<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //         )
        //     },

        //     // Mixed relational operators
        //     {
        //         input: '1 <= 2 > 3',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 10 },
        //             Program.Expression.createBinaryRelational(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '<=',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //             ),
        //             '>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 3)
        //         )
        //     },

        //     // Relational with higher precedence operations
        //     {
        //         input: '2 + 3 < 4 * 5',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 13 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '+',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             '<',
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 8, end: 13 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 5)
        //             )
        //         )
        //     },

        //     // Relational with shift operations (relational has lower precedence)
        //     {
        //         input: '8 << 1 > 4',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 10 },
        //             Program.Expression.createBinaryShift(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 8),
        //                 '<<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 1)
        //             ),
        //             '>',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 4)
        //         )
        //     },

        //     // Complex precedence test
        //     {
        //         input: '1 + 2 * 3 << 1 >= 4',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 19 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 14 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '+',
        //                 Program.Expression.createBinaryShift(
        //                     { start: 4, end: 14 },
        //                     Program.Expression.createBinaryMultiplicative(
        //                         { start: 4, end: 9 },
        //                         Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2),
        //                         '*',
        //                         Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //                     ),
        //                     '<<',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 1)
        //                 )
        //             ),
        //             '>=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 18, end: 19 }, 4)
        //         )
        //     },

        //     // Edge case: Equal values comparison
        //     {
        //         input: '5 >= 5',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             '>=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 5)
        //         )
        //     },

        //     // With identifiers
        //     {
        //         input: 'foo < bar',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 9 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false),
        //             '<',
        //             Program.Expression.createPrimaryIdentifier({ start: 6, end: 9 }, 'bar', false)
        //         )
        //     },

        //     // With parentheses affecting precedence
        //     {
        //         input: '(2 + 3) < (4 * 5)',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 17 },
        //             Program.Expression.createPrimaryParen(
        //                 { start: 0, end: 7 },
        //                 Program.Expression.createBinaryAdditive(
        //                     { start: 1, end: 6 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 1, end: 2 }, 2),
        //                     '+',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)
        //                 )
        //             ),
        //             '<',
        //             Program.Expression.createPrimaryParen(
        //                 { start: 10, end: 17 },
        //                 Program.Expression.createBinaryMultiplicative(
        //                     { start: 11, end: 16 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 11, end: 12 }, 4),
        //                     '*',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 15, end: 16 }, 5)
        //                 )
        //             )
        //         )
        //     },
        // ],

        // BinaryEquality: [
        //     // Basic equality
        //     {
        //         input: '2 == 3',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //             '==',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)
        //         )
        //     },

        //     // Basic inequality
        //     {
        //         input: '5 != 3',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             '!=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)
        //         )
        //     },

        //     // Chained equality (left-to-right associativity)
        //     {
        //         input: '1 == 2 == 3',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 11 },
        //             Program.Expression.createBinaryEquality(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '==',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //             ),
        //             '==',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 10, end: 11 }, 3)
        //         )
        //     },

        //     // Mixed equality operators
        //     {
        //         input: '1 == 2 != 3',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 11 },
        //             Program.Expression.createBinaryEquality(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '==',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //             ),
        //             '!=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 10, end: 11 }, 3)
        //         )
        //     },

        //     // Equality with relational (relational has higher precedence)
        //     {
        //         input: '1 < 2 == 3 > 4',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 14 },
        //             Program.Expression.createBinaryRelational(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 '<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //             ),
        //             '==',
        //             Program.Expression.createBinaryRelational(
        //                 { start: 9, end: 14 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 3),
        //                 '>',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 4)
        //             )
        //         )
        //     },

        //     // Equality with arithmetic operations
        //     {
        //         input: '2 + 3 == 4 * 5',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 14 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '+',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             '==',
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 9, end: 14 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 4),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 5)
        //             )
        //         )
        //     },

        //     // With boolean literals
        //     {
        //         input: 'true == false',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 13 },
        //             Program.Expression.createPrimaryLiteralBool({ start: 0, end: 4 }, true),
        //             '==',
        //             Program.Expression.createPrimaryLiteralBool({ start: 8, end: 13 }, false)
        //         )
        //     },

        //     // With identifiers
        //     {
        //         input: 'foo != bar',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 10 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false),
        //             '!=',
        //             Program.Expression.createPrimaryIdentifier({ start: 7, end: 10 }, 'bar', false)
        //         )
        //     },

        //     // Complex expression with all precedence levels
        //     {
        //         input: '1 + 2 * 3 << 1 > 5 == 6',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 23 },
        //             Program.Expression.createBinaryRelational(
        //                 { start: 0, end: 18 },
        //                 Program.Expression.createBinaryAdditive(
        //                     { start: 0, end: 14 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                     '+',
        //                     Program.Expression.createBinaryShift(
        //                         { start: 4, end: 14 },
        //                         Program.Expression.createBinaryMultiplicative(
        //                             { start: 4, end: 9 },
        //                             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2),
        //                             '*',
        //                             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //                         ),
        //                         '<<',
        //                         Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 1)
        //                     )
        //                 ),
        //                 '>',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 17, end: 18 }, 5)
        //             ),
        //             '==',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 22, end: 23 }, 6)
        //         )
        //     },

        //     // Edge case: Comparing null and undefined
        //     {
        //         input: 'null == undefined',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 17 },
        //             Program.Expression.createPrimaryLiteralNull({ start: 0, end: 4 }),
        //             '==',
        //             Program.Expression.createPrimaryLiteralUndefined({ start: 8, end: 17 })
        //         )
        //     },

        //     // With parentheses
        //     {
        //         input: '(1 + 2) == (3 * 4)',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 18 },
        //             Program.Expression.createPrimaryParen(
        //                 { start: 0, end: 7 },
        //                 Program.Expression.createBinaryAdditive(
        //                     { start: 1, end: 6 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 1, end: 2 }, 1),
        //                     '+',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //                 )
        //             ),
        //             '==',
        //             Program.Expression.createPrimaryParen(
        //                 { start: 11, end: 18 },
        //                 Program.Expression.createBinaryMultiplicative(
        //                     { start: 12, end: 17 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 3),
        //                     '*',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 16, end: 17 }, 4)
        //                 )
        //             )
        //         )
        //     },
        // ],

        // BinaryBitwise: [
        //     // Basic bitwise AND
        //     {
        //         input: '5 & 3',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //         )
        //         // Expected result: 5 & 3 = 1 (binary: 101 & 011 = 001)
        //     },

        //     // Basic bitwise OR
        //     {
        //         input: '5 | 3',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //         )
        //         // Expected result: 5 | 3 = 7 (binary: 101 | 011 = 111)
        //     },

        //     // Basic bitwise XOR
        //     {
        //         input: '5 ^ 3',
        //         output: Program.Expression.createBinaryBitwiseXor(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //         )
        //         // Expected result: 5 ^ 3 = 6 (binary: 101 ^ 011 = 110)
        //     },

        //     // Chained AND operations (left-to-right associativity)
        //     {
        //         input: '7 & 5 & 3',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryBitwiseAnd(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 7),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 5)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //         )
        //         // Expected result: (7 & 5) & 3 = 5 & 3 = 1 (binary: 111 & 101 & 011 = 001)
        //     },

        //     // Chained OR operations (left-to-right associativity)
        //     {
        //         input: '1 | 2 | 4',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryBitwiseOr(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4)
        //         )
        //         // Expected result: (1 | 2) | 4 = 3 | 4 = 7 (binary: 001 | 010 | 100 = 111)
        //     },

        //     // Chained XOR operations (left-to-right associativity)
        //     {
        //         input: '7 ^ 3 ^ 1',
        //         output: Program.Expression.createBinaryBitwiseXor(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryBitwiseXor(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 7),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 1)
        //         )
        //         // Expected result: (7 ^ 3) ^ 1 = 4 ^ 1 = 5 (binary: 111 ^ 011 ^ 001 = 101)
        //     },

        //     // Mixed bitwise operators with standard precedence: & > ^ > |
        //     {
        //         input: '1 | 2 ^ 4 & 8',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 13 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //             Program.Expression.createBinaryBitwiseXor(
        //                 { start: 4, end: 13 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2),
        //                 Program.Expression.createBinaryBitwiseAnd(
        //                     { start: 8, end: 13 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4),
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 8)
        //                 )
        //             )
        //         )
        //         // Expected result: 1 | (2 ^ (4 & 8)) = 1 | (2 ^ 0) = 1 | 2 = 3
        //     },

        //     // Bitwise with higher precedence operations (equality has lower precedence)
        //     {
        //         input: '1 & 2 == 3 | 4',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 14 },
        //             Program.Expression.createBinaryBitwiseAnd(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //             ),
        //             '==',
        //             Program.Expression.createBinaryBitwiseOr(
        //                 { start: 9, end: 14 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 3),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 4)
        //             )
        //         )
        //         // Expected result: (1 & 2) == (3 | 4) = 0 == 7 = false
        //     },

        //     // Bitwise with arithmetic operations (arithmetic has higher precedence)
        //     {
        //         input: '2 + 3 & 4 * 5',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 13 },
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 2),
        //                 '+',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 8, end: 13 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 4),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 5)
        //             )
        //         )
        //         // Expected result: (2 + 3) & (4 * 5) = 5 & 20 = 4
        //     },

        //     // Bitwise with shift operations (shift has higher precedence than bitwise)
        //     {
        //         input: '8 << 1 & 4',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 10 },
        //             Program.Expression.createBinaryShift(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 8),
        //                 '<<',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 1)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 4)
        //         )
        //         // Expected result: (8 << 1) & 4 = 16 & 4 = 0
        //     },

        //     // Complex expression testing all precedence levels
        //     {
        //         input: '1 + 2 * 3 << 1 & 4 ^ 2 | 1 == 5',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 31 },
        //             Program.Expression.createBinaryBitwiseOr(
        //                 { start: 0, end: 26 },
        //                 Program.Expression.createBinaryBitwiseXor(
        //                     { start: 0, end: 22 },
        //                     Program.Expression.createBinaryBitwiseAnd(
        //                         { start: 0, end: 18 },
        //                         Program.Expression.createBinaryAdditive(
        //                             { start: 0, end: 14 },
        //                             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                             '+',
        //                             Program.Expression.createBinaryShift(
        //                                 { start: 4, end: 14 },
        //                                 Program.Expression.createBinaryMultiplicative(
        //                                     { start: 4, end: 9 },
        //                                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2),
        //                                     '*',
        //                                     Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //                                 ),
        //                                 '<<',
        //                                 Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 1)
        //                             )
        //                         ),
        //                         Program.Expression.createPrimaryLiteralInteger({ start: 17, end: 18 }, 4)
        //                     ),
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 21, end: 22 }, 2)
        //                 ),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 25, end: 26 }, 1)
        //             ),
        //             '==',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 30, end: 31 }, 5)
        //         )
        //         // Expected result: ((((1 + (2 * 3 << 1)) & 4) ^ 2) | 1) == 5
        //         // = ((((1 + (6 << 1)) & 4) ^ 2) | 1) == 5
        //         // = ((((1 + 12) & 4) ^ 2) | 1) == 5
        //         // = (((13 & 4) ^ 2) | 1) == 5
        //         // = ((1 ^ 2) | 1) == 5
        //         // = (3 | 1) == 5
        //         // = 3 == 5 = false
        //     },

        //     // Edge case: Zero values
        //     {
        //         input: '0 & 7',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 0),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 7)
        //         )
        //         // Expected result: 0 & 7 = 0
        //     },

        //     // Edge case: XOR with same values (should be 0)
        //     {
        //         input: '5 ^ 5',
        //         output: Program.Expression.createBinaryBitwiseXor(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 5)
        //         )
        //         // Expected result: 5 ^ 5 = 0
        //     },

        //     // Edge case: OR with all bits set
        //     {
        //         input: '15 | 240',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 8 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 2 }, 15),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 8 }, 240)
        //         )
        //         // Expected result: 15 | 240 = 255 (binary: 00001111 | 11110000 = 11111111)
        //     },

        //     // With identifiers
        //     {
        //         input: 'foo & bar ^ baz',
        //         output: Program.Expression.createBinaryBitwiseXor(
        //             { start: 0, end: 15 },
        //             Program.Expression.createBinaryBitwiseAnd(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'foo', false),
        //                 Program.Expression.createPrimaryIdentifier({ start: 6, end: 9 }, 'bar', false)
        //             ),
        //             Program.Expression.createPrimaryIdentifier({ start: 12, end: 15 }, 'baz', false)
        //         )
        //     },

        //     // With parentheses to override precedence
        //     {
        //         input: '(1 | 2) & 3',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 11 },
        //             Program.Expression.createPrimaryParen(
        //                 { start: 0, end: 7 },
        //                 Program.Expression.createBinaryBitwiseOr(
        //                     { start: 1, end: 6 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 1, end: 2 }, 1),
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //                 )
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 10, end: 11 }, 3)
        //         )
        //         // Expected result: (1 | 2) & 3 = 3 & 3 = 3
        //     },

        //     // Testing precedence with prefix unary operators
        //     {
        //         input: '~5 & 3',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrefixBitwiseNot(
        //                 { start: 0, end: 2 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 1, end: 2 }, 5)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 3)
        //         )
        //         // Expected result: (~5) & 3 (prefix has higher precedence)
        //     },

        //     // Testing precedence with postfix operations
        //     {
        //         input: 'arr[0] & 15',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 11 },
        //             Program.Expression.createPostfixArrayAccess(
        //                 { start: 0, end: 6 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 0, end: 3 }, 'arr', false),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 0)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 11 }, 15)
        //         )
        //     },

        //     // Complex chain with all three bitwise operators
        //     {
        //         input: '8 & 12 ^ 4 | 2',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 14 },
        //             Program.Expression.createBinaryBitwiseXor(
        //                 { start: 0, end: 10 },
        //                 Program.Expression.createBinaryBitwiseAnd(
        //                     { start: 0, end: 6 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 8),
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 6 }, 12)
        //                 ),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 4)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 2)
        //         )
        //         // Expected result: ((8 & 12) ^ 4) | 2 = (8 ^ 4) | 2 = 12 | 2 = 14
        //         // Binary: ((1000 & 1100) ^ 0100) | 0010 = (1000 ^ 0100) | 0010 = 1100 | 0010 = 1110
        //     },

        //     // Edge case: Bitwise operations with zero
        //     {
        //         input: '0 & 5 | 3',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryBitwiseAnd(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 0),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 5)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //         )
        //         // Expected result: (0 & 5) | 3 = 0 | 3 = 3
        //     },

        //     // Edge case: All operators with same operands
        //     {
        //         input: '5 & 5 ^ 5 | 5',
        //         output: Program.Expression.createBinaryBitwiseOr(
        //             { start: 0, end: 13 },
        //             Program.Expression.createBinaryBitwiseXor(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createBinaryBitwiseAnd(
        //                     { start: 0, end: 5 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 5)
        //                 ),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 5)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 12, end: 13 }, 5)
        //         )
        //         // Expected result: ((5 & 5) ^ 5) | 5 = (5 ^ 5) | 5 = 0 | 5 = 5
        //     },

        //     // Edge case: Maximum 32-bit values
        //     {
        //         input: '4294967295 & 1',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 14 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 10 }, 4294967295),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 13, end: 14 }, 1)
        //         )
        //         // Expected result: 4294967295 & 1 = 1 (all bits set & 1 = 1)
        //     },

        //     // Testing with hex literals (if supported)
        //     {
        //         input: '0xFF & 0x0F',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 11 },
        //             Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 4 }, 255), // 0xFF = 255
        //             Program.Expression.createPrimaryLiteralInteger({ start: 7, end: 11 }, 15)  // 0x0F = 15
        //         )
        //         // Expected result: 255 & 15 = 15 (11111111 & 00001111 = 00001111)
        //     },

        //     // Test bitwise with negative numbers
        //     {
        //         input: '-1 & 7',
        //         output: Program.Expression.createBinaryBitwiseAnd(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrefixUnaryMinus(
        //                 { start: 0, end: 2 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 1, end: 2 }, 1)
        //             ),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 7)
        //         )
        //     },

        //     // Should parse as: (5 & 3) == 1
        //     {
        //         input: '5 & 3 == 1',
        //         output: Program.Expression.createBinaryEquality(
        //             { start: 0, end: 10 },
        //             Program.Expression.createBinaryBitwiseAnd(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             '==',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 1)
        //         )
        //     },

        //     // Combining with relational operators (bitwise has higher precedence)
        //     {
        //         input: '5 & 3 < 2',
        //         output: Program.Expression.createBinaryRelational(
        //             { start: 0, end: 9 },
        //             Program.Expression.createBinaryBitwiseAnd(
        //                 { start: 0, end: 5 },
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 5),
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 3)
        //             ),
        //             '<',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 2)
        //         )
        //         // Expected result: (5 & 3) < 2 = 1 < 2 = true
        //     }
        // ],

        // Logical: [
        //     // Simple logical AND
        //     {
        //         input: 'true and false',
        //         output: Program.Expression.createBinaryLogicalAnd(
        //             { start: 0, end: 14 },
        //             Program.Expression.createPrimaryLiteralBool({ start: 0, end: 4 }, true),
        //             Program.Expression.createPrimaryLiteralBool({ start: 9, end: 14 }, false)
        //         )
        //     },
        //     // Simple logical OR
        //     {
        //         input: 'false or true',
        //         output: Program.Expression.createBinaryLogicalOr(
        //             { start: 0, end: 13 },
        //             Program.Expression.createPrimaryLiteralBool({ start: 0, end: 5 }, false),
        //             Program.Expression.createPrimaryLiteralBool({ start: 9, end: 13 }, true)
        //         )
        //     },
        //     // Chained logical AND (left-associative)
        //     {
        //         input: 'true and false and true',
        //         output: Program.Expression.createBinaryLogicalAnd(
        //             { start: 0, end: 23 },
        //             Program.Expression.createBinaryLogicalAnd(
        //                 { start: 0, end: 14 },
        //                 Program.Expression.createPrimaryLiteralBool({ start: 0, end: 4 }, true),
        //                 Program.Expression.createPrimaryLiteralBool({ start: 9, end: 14 }, false)
        //             ),
        //             Program.Expression.createPrimaryLiteralBool({ start: 19, end: 23 }, true)
        //         )
        //     },
        //     // Chained logical OR (left-associative)
        //     {
        //         input: 'false or false or true',
        //         output: Program.Expression.createBinaryLogicalOr(
        //             { start: 0, end: 22 },
        //             Program.Expression.createBinaryLogicalOr(
        //                 { start: 0, end: 14 },
        //                 Program.Expression.createPrimaryLiteralBool({ start: 0, end: 5 }, false),
        //                 Program.Expression.createPrimaryLiteralBool({ start: 9, end: 14 }, false)
        //             ),
        //             Program.Expression.createPrimaryLiteralBool({ start: 18, end: 22 }, true)
        //         )
        //     },
        //     // Mixed AND/OR, AND has higher precedence
        //     {
        //         input: 'true or false and false',
        //         output: Program.Expression.createBinaryLogicalOr(
        //             { start: 0, end: 23 },
        //             Program.Expression.createPrimaryLiteralBool({ start: 0, end: 4 }, true),
        //             Program.Expression.createBinaryLogicalAnd(
        //                 { start: 8, end: 23 },
        //                 Program.Expression.createPrimaryLiteralBool({ start: 8, end: 13 }, false),
        //                 Program.Expression.createPrimaryLiteralBool({ start: 18, end: 23 }, false)
        //             )
        //         )
        //     },
        //     // Parentheses override precedence
        //     {
        //         input: '(true or false) and false',
        //         output: Program.Expression.createBinaryLogicalAnd(
        //             { start: 0, end: 25 },
        //             Program.Expression.createPrimaryParen(
        //                 { start: 0, end: 15 },
        //                 Program.Expression.createBinaryLogicalOr(
        //                     { start: 1, end: 14 },
        //                     Program.Expression.createPrimaryLiteralBool({ start: 1, end: 5 }, true),
        //                     Program.Expression.createPrimaryLiteralBool({ start: 9, end: 14 }, false)
        //                 )
        //             ),
        //             Program.Expression.createPrimaryLiteralBool({ start: 20, end: 25 }, false)
        //         )
        //     },
        //     // Logical with equality and bitwise (logical is lowest precedence)
        //     {
        //         input: '1 & 2 == 3 or false',
        //         output: Program.Expression.createBinaryLogicalOr(
        //             { start: 0, end: 19 },
        //             Program.Expression.createBinaryEquality(
        //                 { start: 0, end: 10 },
        //                 Program.Expression.createBinaryBitwiseAnd(
        //                     { start: 0, end: 5 },
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 0, end: 1 }, 1),
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 2)
        //                 ),
        //                 '==',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 9, end: 10 }, 3)
        //             ),
        //             Program.Expression.createPrimaryLiteralBool({ start: 14, end: 19 }, false)
        //         )
        //     },
        // ],

        // Ternary: [
        //     // Simple ternary
        //     {
        //         input: 'true ? 1 : 2',
        //         output: Program.Expression.createBinaryTernary(
        //             { start: 0, end: 12 },
        //             Program.Expression.createPrimaryLiteralBool({ start: 0, end: 4 }, true),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 7, end: 8 }, 1),
        //             Program.Expression.createPrimaryLiteralInteger({ start: 11, end: 12 }, 2)
        //         )
        //     },
        //     // Nested ternary (right-associative)
        //     {
        //         input: 'a ? b ? c : d : e',
        //         output: Program.Expression.createBinaryTernary(
        //             { start: 0, end: 17 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'a', false),
        //             Program.Expression.createBinaryTernary(
        //                 { start: 4, end: 13 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 4, end: 5 }, 'b', false),
        //                 Program.Expression.createPrimaryIdentifier({ start: 8, end: 9 }, 'c', false),
        //                 Program.Expression.createPrimaryIdentifier({ start: 12, end: 13 }, 'd', false)
        //             ),
        //             Program.Expression.createPrimaryIdentifier({ start: 16, end: 17 }, 'e', false)
        //         )
        //     },
        //     // Ternary with logical and arithmetic
        //     {
        //         input: 'x + 1 > 0 ? y * 2 : z / 3',
        //         output: Program.Expression.createBinaryTernary(
        //             { start: 0, end: 25 },
        //             Program.Expression.createBinaryRelational(
        //                 { start: 0, end: 9 },
        //                 Program.Expression.createBinaryAdditive(
        //                     { start: 0, end: 5 },
        //                     Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'x', false),
        //                     '+',
        //                     Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 1)
        //                 ),
        //                 '>',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 0)
        //             ),
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 12, end: 17 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 12, end: 13 }, 'y', false),
        //                 '*',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 16, end: 17 }, 2)
        //             ),
        //             Program.Expression.createBinaryMultiplicative(
        //                 { start: 20, end: 25 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 20, end: 21 }, 'z', false),
        //                 '/',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 24, end: 25 }, 3)
        //             )
        //         )
        //     },
        //     // Parentheses override ternary
        //     {
        //         input: '(a ? b : c) + d',
        //         output: Program.Expression.createBinaryAdditive(
        //             { start: 0, end: 15 },
        //             Program.Expression.createPrimaryParen(
        //                 { start: 0, end: 11 },
        //                 Program.Expression.createBinaryTernary(
        //                     { start: 1, end: 10 },
        //                     Program.Expression.createPrimaryIdentifier({ start: 1, end: 2 }, 'a', false),
        //                     Program.Expression.createPrimaryIdentifier({ start: 5, end: 6 }, 'b', false),
        //                     Program.Expression.createPrimaryIdentifier({ start: 9, end: 10 }, 'c', false)
        //                 )
        //             ),
        //             '+',
        //             Program.Expression.createPrimaryIdentifier({ start: 14, end: 15 }, 'd', false)
        //         )
        //     },
        // ],

        // Assignment: [
        //     // Simple assignment
        //     {
        //         input: 'x = 5',
        //         output: Program.Expression.createBinaryAssignment(
        //             { start: 0, end: 5 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'x', false),
        //             '=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 4, end: 5 }, 5)
        //         )
        //     },
        //     // Compound assignment
        //     {
        //         input: 'y += 2',
        //         output: Program.Expression.createBinaryAssignment(
        //             { start: 0, end: 6 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'y', false),
        //             '+=',
        //             Program.Expression.createPrimaryLiteralInteger({ start: 5, end: 6 }, 2)
        //         )
        //     },
        //     // Chained assignment (right-associative)
        //     {
        //         input: 'a = b = 3',
        //         output: Program.Expression.createBinaryAssignment(
        //             { start: 0, end: 9 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'a', false),
        //             '=',
        //             Program.Expression.createBinaryAssignment(
        //                 { start: 4, end: 9 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 4, end: 5 }, 'b', false),
        //                 '=',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 3)
        //             )
        //         )
        //     },
        //     // Assignment with arithmetic
        //     {
        //         input: 'x = y + 1',
        //         output: Program.Expression.createBinaryAssignment(
        //             { start: 0, end: 9 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'x', false),
        //             '=',
        //             Program.Expression.createBinaryAdditive(
        //                 { start: 4, end: 9 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 4, end: 5 }, 'y', false),
        //                 '+',
        //                 Program.Expression.createPrimaryLiteralInteger({ start: 8, end: 9 }, 1)
        //             )
        //         )
        //     },
        //     // Assignment with ternary
        //     {
        //         input: 'z = a ? b : c',
        //         output: Program.Expression.createBinaryAssignment(
        //             { start: 0, end: 13 },
        //             Program.Expression.createPrimaryIdentifier({ start: 0, end: 1 }, 'z', false),
        //             '=',
        //             Program.Expression.createBinaryTernary(
        //                 { start: 4, end: 13 },
        //                 Program.Expression.createPrimaryIdentifier({ start: 4, end: 5 }, 'a', false),
        //                 Program.Expression.createPrimaryIdentifier({ start: 8, end: 9 }, 'b', false),
        //                 Program.Expression.createPrimaryIdentifier({ start: 12, end: 13 }, 'c', false)
        //             )
        //         )
        //     },
        // ],
    };

    for (const [group, tests] of Object.entries(cases)) {
        describe(group, () => {
            for (const { input, output } of tests) {
                const success = !Array.isArray(output);
                it(input, () => {
                    const result : ParseResult = Expr.parse(input);
                    // console.log(JSON.stringify(result, null, 2));

                    if (success) {
                        expect(result.ast[0].getCustomData()!).toEqual(output);
                    } else {
                        expect(result.errors.length).toEqual((output as unknown[]).length);
                        for (let i = 0; i < (output as unknown[]).length; i++) {
                            expect(result.errors[i].msg).toEqual((output as unknown[])[i]);
                        }
                    }
                });
            }
        });
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝