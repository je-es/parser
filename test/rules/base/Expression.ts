// Expression.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as parser from '../../../lib/parser';
import { Result } from '../../../lib/result';
    import * as Program from '../../libs/program/program';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const ExpressionRules: parser.Types.Rules = [

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                    EXPRESSIONS                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('Expression',
                parser.silent(parser.rule('PrimaryExpression')),
                {
                    build: (data) => data,

                    errors: [parser.error(() => true, "Expected expression")]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                 PRIMARY EXPRESSION                                ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('PrimaryExpression',
                parser.choice(
                    // parser.rule('ObjectExpression'),
                    parser.rule('Literal'),
                    // parser.rule('IdentifierExpression'),
                    // parser.rule('ParenthesizedExpression'),
                ),
                {
                    build: (data) => data.getChoiceResult()!,
                }
            ),

            parser.createRule('Literal',
                parser.choice(
                    // Integer
                    parser.token('dec'),
                    parser.token('bin'),
                    parser.token('oct'),
                    parser.token('hex'),

                    // Float
                    parser.token('flt'),

                    // Boolean
                    parser.token('true'),
                    parser.token('false'),

                    // Null
                    parser.token('null'),

                    // Undefined
                    parser.token('undefined'),

                    // String
                    parser.token('str'),

                    // Character
                    parser.token('char'),

                    // Array
                    parser.seq(
                        parser.token('['),
                        parser.zeroOrMore(
                            parser.rule('Expression'),
                            parser.token(',')
                        ),
                        parser.token(']'),
                    ),
                ),
                {
                    build: (data) => {
                        const selected = data.getChoiceResult()!;
                        let expr : Program.Expression | null = null;

                        if(selected.isToken()) {
                            const token = selected.getTokenData()!;
                            switch (token.kind) {

                                // Integer
                                case 'dec':
                                case 'bin':
                                case 'oct':
                                case 'hex':
                                    expr = Program.Expression.createPrimaryLiteralInteger(token.span, Number(token.value));
                                    break;

                                // Float
                                case 'flt':
                                    expr = Program.Expression.createPrimaryLiteralFloat(token.span, Number(token.value));
                                    break;

                                // Boolean
                                case 'true':
                                case 'false':
                                    expr = Program.Expression.createPrimaryLiteralBool(token.span, token.kind === 'true');
                                    break;

                                // Null
                                case 'null':
                                    expr = Program.Expression.createPrimaryLiteralNull(token.span);
                                    break;

                                // Undefined
                                case 'undefined':
                                    expr = Program.Expression.createPrimaryLiteralUndefined(token.span);
                                    break;

                                // String
                                case 'str':
                                    expr = Program.Expression.createPrimaryLiteralString(token.span, token.value!);
                                    break;

                                // Character
                                case 'char':
                                    expr = Program.Expression.createPrimaryLiteralCharacter(token.span, token.value!);
                                    break;

                                // --
                                default:
                                    throw new Error(`Unknown literal kind: ${token.kind}`);
                            }
                        }

                        else if(selected.isSequence()) {
                            const repeat_items : Result[] = selected.getSequenceResult()![1].getRepeatResult()!;
                            const expressions : Program.Expression[] = [];

                            if(repeat_items.length > 0) {
                                for(const r_item of repeat_items) {
                                    const res = r_item.getCustomData();
                                    if(!res) continue;
                                    expressions.push(res as Program.Expression);
                                }
                            }

                            expr = Program.Expression.createPrimaryLiteralArray(
                                data.span,
                                expressions
                            );
                        }

                        return Result.createAsCustom('passed', 'literal-expression', expr, data.span);
                    },
                    errors: [
                        parser.error(0, "Expected literal expression")
                    ]
                }
            ),

            // parser.createRule('IdentifierExpression',
            //     parser.choice(
            //         parser.token('Identifier'),
            //         parser.seq(
            //             parser.token('@'),
            //             parser.token('Identifier'),
            //         )
            //     ),
            //     {
            //         build: (matches) => {
            //             console.warn(JSON.stringify(matches, null, 2));
            //             if (matches.length === 1) {
            //                 return Program.Expression.createPrimaryIdentifier(
            //                     matches[0].span,
            //                     matches[0].value,
            //                     false
            //                  );
            //             } else {
            //                 return Program.Expression.createPrimaryIdentifier(
            //                     parser.getMatchesSpan(matches),
            //                     '@'+matches[1].value,
            //                     true
            //                  );
            //             }
            //         }
            //     }
            // ),

            // parser.createRule('ParenthesizedExpression',
            //     parser.seq(
            //         parser.token('('),
            //         parser.rule('Expression'),
            //         parser.token(')')
            //     ),
            //     {
            //         build: (matches) => Program.Expression.createPrimaryParen( parser.getMatchesSpan(matches), matches[1] ),
            //         errors: [
            //             parser.error(0, "Expected '('"),
            //             parser.error(1, "Expected expression"),
            //             parser.error(2, "Expected ')'")
            //         ]
            //     }
            // ),

            // parser.createRule('ObjectExpression',
            //     parser.seq(
            //         parser.token('{'),
            //         parser.zeroOrMore(
            //             parser.rule('Field'),
            //             parser.token(',')
            //         ),
            //         parser.token('}'),
            //     ),
            //     {
            //         build: (matches) => Program.Expression.createPrimaryObject(
            //             parser.getMatchesSpan(matches),
            //             matches[1]
            //         ),
            //         errors: [
            //             parser.error(0, "Expected '{'"),
            //             parser.error(2, "Expected '}'"),
            //         ]
            //     }
            // ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                POSTFIX EXPRESSION                                 ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('PostfixExpression',
        //         parser.seq(
        //             parser.rule('PrimaryExpression'),
        //             parser.zeroOrMore(
        //                 parser.choice(
        //                     parser.rule('ArrayAccess'),
        //                     parser.rule('CallSuffix'),
        //                     parser.rule('MemberAccessSuffix'),
        //                     parser.token('.*'),
        //                     parser.token('++'),
        //                     parser.token('--'),
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isPostfix = matches[1].length > 0;

        //                 if(!isPostfix){
        //                     return matches[0];
        //                 }

        //                 let base = matches[0];
        //                 const operations = matches[1];

        //                 // Same logic as before, just more efficient parsing
        //                 for (const op of operations) {
        //                     // Post Increment
        //                     if (op.kind === '++') {
        //                         base = Program.Expression.createPostfixIncrement({ start: base.span.start, end: op.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Post Decrement
        //                     else if (op.kind === '--') {
        //                         base = Program.Expression.createPostfixDecrement({ start: base.span.start, end: op.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Dereference
        //                     else if (op.kind === '.*') {
        //                         base = Program.Expression.createPostfixDereference({ start: base.span.start, end: op.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Member Access
        //                     else if (op.kind === 'MemberAccessSuffix') {
        //                         base = Program.Expression.createPostfixMemberAccess({ start: base.span.start, end: op.span.end },
        //                             base,
        //                             op.value
        //                         );
        //                     }

        //                     // CallSuffix
        //                     else if (op.kind === 'CallSuffix') {
        //                         base = Program.Expression.createPostfixCall({ start: base.span.start, end: op.span.end },
        //                             base,
        //                             op.value
        //                         );
        //                     }

        //                     // Array Access
        //                     else if (op.kind === 'ArrayAccess') {
        //                         base = Program.Expression.createPostfixArrayAccess({ start: base.span.start, end: op.span.end },
        //                             base,
        //                             op.value
        //                         );
        //                     }
        //                 }
        //                 return base;
        //             }
        //         }
        //     ),

        //     parser.createRule('MemberAccessSuffix',
        //         parser.seq(
        //             parser.token('.'),
        //             parser.rule('IdentifierExpression'),
        //         ),
        //         {
        //             build: (matches) => ({
        //                 kind    : 'MemberAccessSuffix',
        //                 span    : parser.getMatchesSpan(matches),
        //                 value   : matches[1]
        //             }),
        //             errors: [
        //                 parser.error(0, "Expected '.' for member access"),
        //                 parser.error(1, "Expected identifier after '.'"),
        //             ]
        //         }
        //     ),

        //     parser.createRule('CallSuffix',
        //         parser.choice(
        //             parser.seq(
        //                 parser.token('('),
        //                 parser.token(')')
        //             ),
        //             parser.seq(
        //                 parser.token('('),
        //                 parser.rule('ArgumentList'),
        //                 parser.token(')')
        //             ),
        //         ),
        //         {
        //             build: (matches) => ({
        //                 kind    : 'CallSuffix',
        //                 span    : parser.getMatchesSpan(matches),
        //                 value   : matches.length === 3 ? matches[1].value : []
        //             }),
        //             errors: [
        //                 parser.error(0, "Expected '(' for function call"),
        //                 parser.error(1, "Expected ')' for function call"),
        //                 parser.error(2, "Expected ')' for function call"),
        //             ]
        //         }
        //     ),

        //     parser.createRule('ArgumentList',
        //         parser.zeroOrMore(
        //             parser.rule('Expression'),
        //             parser.token(',')
        //         ),
        //         {
        //             build: (matches) => ({
        //                 kind    : 'ArgumentList',
        //                 span    : parser.getMatchesSpan(matches),
        //                 value   : matches
        //             }),

        //             errors: [
        //                 parser.error(0, "Expected ArgumentList"),
        //             ]
        //         }
        //     ),

        //     parser.createRule('ArrayAccess',
        //         parser.seq(
        //             parser.token('['),
        //             parser.rule('Expression'),
        //             parser.token(']')
        //         ),
        //         {
        //             build: (matches) => {
        //                 return {
        //                     kind    : 'ArrayAccess',
        //                     span    : parser.getMatchesSpan(matches),
        //                     value   : matches[1]
        //                 };
        //             },
        //             errors: [
        //                 parser.error(0, "Expected '[' for array access"),
        //                 parser.error(1, "Expected Expression for array access"),
        //                 parser.error(2, "Expected ']' for array access"),
        //             ]
        //         }
        //     ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                PREFIX EXPRESSION                                  ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('PrefixExpression',
        //         parser.seq(
        //             parser.zeroOrMore(
        //                 parser.choice(
        //                     parser.token('++'),
        //                     parser.token('--'),
        //                     parser.token('&'),
        //                     parser.token('+'),
        //                     parser.token('-'),
        //                     parser.token('!'),
        //                     parser.token('~')
        //                 )
        //             ),
        //             parser.rule('PostfixExpression')
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isPrefix = matches[0].length > 0;

        //                 if(!isPrefix) {
        //                     return matches[1];
        //                 }

        //                 const prefixes = matches[0];
        //                 let base = matches[1];

        //                 // Same logic as before
        //                 for (const op of prefixes) {

        //                     // Prefix Increment
        //                     if (op.kind === '++') {
        //                         base = Program.Expression.createPrefixIncrement({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Prefix Decrement
        //                     else if (op.kind === '--') {
        //                         base = Program.Expression.createPrefixDecrement({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Reference
        //                     else if (op.kind === '&') {
        //                         base = Program.Expression.createPrefixReference({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Unary Plus
        //                     else if (op.kind === '+') {
        //                         base = Program.Expression.createPrefixUnaryPlus({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Unary Minus
        //                     else if (op.kind === '-') {
        //                         base = Program.Expression.createPrefixUnaryMinus({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Logical Not
        //                     else if (op.kind === '!') {
        //                         base = Program.Expression.createPrefixLogicalNot({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }

        //                     // Bitwise Not
        //                     else if (op.kind === '~') {
        //                         base = Program.Expression.createPrefixBitwiseNot({ start: op.span.start, end: base.span.end },
        //                             base
        //                         );
        //                     }
        //                 }

        //                 // Return
        //                 return base;
        //             },
        //         }
        //     ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                 BINARY EXPRESSION                                 ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('PowerExpression',
        //         parser.seq(
        //             parser.rule('PrefixExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.token('**'),
        //                     parser.rule('PrefixExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isPower = matches[1].length > 0;

        //                 if (!isPower) {
        //                     return matches[0];
        //                 }

        //                 // First choice: matches = [PrefixExpression, [operations]]
        //                 const base = matches[0]; // First PrefixExpression
        //                 const operations = matches[1]; // Array of [**, PrefixExpression] pairs

        //                 // Power is right-associative: x**y**z = x**(y**z)
        //                 // Build from right to left
        //                 const allOperands = [base];

        //                 // Collect all operands
        //                 for (const op of operations) {
        //                     allOperands.push(op[1]); // The PrefixExpression after **
        //                 }

        //                 // Build right-associative chain from the end
        //                 let result = allOperands[allOperands.length - 1];
        //                 for (let i = allOperands.length - 2; i >= 0; i--) {
        //                     const left = allOperands[i];
        //                     result = Program.Expression.createBinaryPower({ start: left.span.start, end: result.span.end },
        //                         left,
        //                         result
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('MultiplicativeExpression',
        //         parser.seq(
        //             parser.rule('PowerExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.choice(
        //                         parser.token('*'),
        //                         parser.token('/'),
        //                         parser.token('%')
        //                     ),
        //                     parser.rule('PowerExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isMultiplicative = matches[1].length > 0;

        //                 if (!isMultiplicative) {
        //                     return matches[0];
        //                 }

        //                 let result = matches[0];
        //                 const operations = matches[1];

        //                 for (const op of operations) {
        //                     const operator = op[0].value;
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryMultiplicative(
        //                         { start: result.span.start, end: right.span.end },
        //                         result, operator, right
        //                     );
        //                 }
        //                 return result;
        //             }
        //         }
        //     ),

        //     parser.createRule('ShiftExpression',
        //         parser.seq(
        //             parser.rule('MultiplicativeExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.choice(
        //                         parser.token('<<'),
        //                         parser.token('>>')
        //                     ),
        //                     parser.rule('MultiplicativeExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isShift = matches[1].length > 0;

        //                 if (!isShift) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 // Left-associative: a<<b<<c = (a<<b)<<c
        //                 let result = base;
        //                 for (const op of operations) {
        //                     const operator = op[0].value; // << or >>
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryShift({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         operator,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('AdditiveExpression',
        //         parser.seq(
        //             parser.rule('ShiftExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.choice(
        //                         parser.token('+'),
        //                         parser.token('-')
        //                     ),
        //                     parser.rule('ShiftExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isAdditive = matches[1].length > 0;

        //                 if (!isAdditive) {
        //                     return matches[0];
        //                 }

        //                 let result = matches[0];
        //                 const operations = matches[1];

        //                 for (const op of operations) {
        //                     const operator = op[0].value;
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryAdditive(
        //                         { start: result.span.start, end: right.span.end },
        //                         result, operator, right
        //                     );
        //                 }
        //                 return result;
        //             }
        //         }
        //     ),

        //     parser.createRule('BitwiseAndExpression',
        //         parser.seq(
        //             parser.rule('AdditiveExpression'),  // Changed from RelationalExpression
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.token('&'),
        //                     parser.rule('AdditiveExpression')  // Changed from RelationalExpression
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isBitwiseAnd = matches[1].length > 0;

        //                 if (!isBitwiseAnd) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 let result = base;
        //                 for (const op of operations) {
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryBitwiseAnd({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('BitwiseXorExpression',
        //         parser.seq(
        //             parser.rule('BitwiseAndExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.token('^'),
        //                     parser.rule('BitwiseAndExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isBitwiseXor = matches[1].length > 0;

        //                 if (!isBitwiseXor) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 let result = base;
        //                 for (const op of operations) {
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryBitwiseXor({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('BitwiseOrExpression',
        //         parser.seq(
        //             parser.rule('BitwiseXorExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.token('|'),
        //                     parser.rule('BitwiseXorExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isBitwiseOr = matches[1].length > 0;

        //                 if (!isBitwiseOr) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 let result = base;
        //                 for (const op of operations) {
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryBitwiseOr({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('RelationalExpression',
        //         parser.seq(
        //             parser.rule('BitwiseOrExpression'),  // Changed from AdditiveExpression
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.choice(
        //                         parser.token('<='),
        //                         parser.token('>='),
        //                         parser.token('<'),
        //                         parser.token('>'),
        //                     ),
        //                     parser.rule('BitwiseOrExpression')  // Changed from AdditiveExpression
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isRelational = matches[1].length > 0;

        //                 if (!isRelational) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 let result = base;
        //                 for (const op of operations) {
        //                     const operator = op[0].value;
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryRelational({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         operator,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('EqualityExpression',
        //         parser.seq(
        //             parser.rule('RelationalExpression'),  // Changed from BitwiseOrExpression
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.choice(
        //                         parser.token('=='),
        //                         parser.token('!=')
        //                     ),
        //                     parser.rule('RelationalExpression')  // Changed from BitwiseOrExpression
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isEquality = matches[1].length > 0;

        //                 if (!isEquality) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 let result = base;
        //                 for (const op of operations) {
        //                     const operator = op[0].value;
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryEquality({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         operator,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('LogicalAndExpression',
        //         parser.seq(
        //             parser.rule('EqualityExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.token('and'),
        //                     parser.rule('EqualityExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isLogicalAnd = matches[1].length > 0;

        //                 if (!isLogicalAnd) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 // Left-associative: a&&b&&c = (a&&b)&&c
        //                 let result = base;
        //                 for (const op of operations) {
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryLogicalAnd({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('LogicalOrExpression',
        //         parser.seq(
        //             parser.rule('LogicalAndExpression'),
        //             parser.zeroOrMore(
        //                 parser.seq(
        //                     parser.token('or'),
        //                     parser.rule('LogicalAndExpression')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches) => {
        //                 const isLogicalOr = matches[1].length > 0;

        //                 if (!isLogicalOr) {
        //                     return matches[0];
        //                 }

        //                 const base = matches[0];
        //                 const operations = matches[1];

        //                 // Left-associative: a||b||c = (a||b)||c
        //                 let result = base;
        //                 for (const op of operations) {
        //                     const right = op[1];

        //                     result = Program.Expression.createBinaryLogicalOr({ start: result.span.start, end: right.span.end },
        //                         result,
        //                         right
        //                     );
        //                 }

        //                 return result;
        //             },
        //         }
        //     ),

        //     parser.createRule('TernaryExpression',
        //         parser.choice(
        //             parser.seq(
        //                 parser.rule('LogicalOrExpression'),
        //                 parser.token('?'),
        //                 parser.rule('Expression'),
        //                 parser.token(':'),
        //                 parser.rule('TernaryExpression')
        //             ),
        //             parser.rule('LogicalOrExpression')
        //         ),
        //         {
        //             build: (matches) => {
        //                 if (matches.length === 1) {
        //                     return matches[0];
        //                 }

        //                 // matches = [condition, '?', trueExpr, ':', falseExpr]
        //                 const condition = matches[0];
        //                 const trueExpr = matches[2];
        //                 const falseExpr = matches[4];

        //                 return Program.Expression.createBinaryTernary({ start: condition.span.start, end: falseExpr.span.end },
        //                     condition,
        //                     trueExpr,
        //                     falseExpr
        //                 );
        //             }
        //         }
        //     ),

        //     parser.createRule('AssignmentExpression',
        //         parser.choice(
        //             parser.seq(
        //                 parser.rule('TernaryExpression'),
        //                 parser.choice(
        //                     parser.token('='),
        //                     parser.token('+='),
        //                     parser.token('-='),
        //                     parser.token('*='),
        //                     parser.token('/='),
        //                     parser.token('%=')
        //                 ),
        //                 parser.rule('AssignmentExpression')  // Right-associative
        //             ),
        //             parser.rule('TernaryExpression')
        //         ),
        //         {
        //             build: (matches) => {
        //                 if (matches.length === 1) {
        //                     return matches[0];
        //                 }

        //                 // matches = [left, operator, right]
        //                 const left = matches[0];
        //                 const operator = matches[1].value;
        //                 const right = matches[2];

        //                 return Program.Expression.createBinaryAssignment({ start: left.span.start, end: right.span.end },
        //                     left,
        //                     operator,
        //                     right
        //                 );
        //             },
        //         }
        //     ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                       ####                                        ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝
    ];

// ╚══════════════════════════════════════════════════════════════════════════════════════╝