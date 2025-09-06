/* eslint-disable @typescript-eslint/no-explicit-any */
// Expression.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as parser from '../../../../lib/parser';
    import * as Program from '../../libs/program/program';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const ExpressionRules: parser.Rules = [

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                    EXPRESSIONS                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('Expression',
                parser.silent(parser.rule('PrimaryExpression')),
                {
                    build: (matches: any) => matches[0],
                    errors: [parser.error(() => true, "Expected expression")]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                 PRIMARY EXPRESSION                                ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('PrimaryExpression',
                parser.choice(
                    // parser.rule('ObjectExpression'),
                    parser.rule('LiteralExpression'),
                    parser.rule('IdentifierExpression'),
                    // parser.rule('ParenthesizedExpression'),
                ),
                { build: (matches: any) => matches[0] }
            ),

            parser.createRule('LiteralExpression',
                parser.choice(
                    // single token literal
                    parser.token('dec'),
                    parser.token('hex'),
                    parser.token('oct'),
                    parser.token('bin'),
                    parser.token('flt'),
                    parser.token('true'),
                    parser.token('false'),
                    parser.token('str'),
                    parser.token('char'),
                    parser.token('null'),
                    parser.token('undefined'),

                    // array literal
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
                    build: (matches: any) => {
                        // array literal
                        if(matches.length > 1) {
                            return Program.Expression.createPrimaryLiteralArray(parser.getMatchesSpan(matches), matches[1]);
                        }

                        // single token literal
                        const token = matches[0];
                        switch (token.kind) {
                            case 'dec':
                            case 'hex':
                            case 'oct':
                            case 'bin':
                                return Program.Expression.createPrimaryLiteralInteger(token.span, Number(token.value));
                            case 'flt':
                                return Program.Expression.createPrimaryLiteralFloat(token.span, Number(token.value));
                            case 'true':
                            case 'false':
                                return Program.Expression.createPrimaryLiteralBool(token.span, token.value.toLowerCase() === 'true');
                            case 'str':
                                return Program.Expression.createPrimaryLiteralString(token.span, token.value);
                            case 'char':
                                return Program.Expression.createPrimaryLiteralCharacter(token.span, token.value);
                            case 'null':
                                return Program.Expression.createPrimaryLiteralNull(token.span);
                            case 'undefined':
                                return Program.Expression.createPrimaryLiteralUndefined(token.span);
                            default:
                                throw new Error(`Unknown literal kind: ${token.kind}`);
                        }
                    },
                    errors: [
                        parser.error(0, "Expected literal expression")
                    ]
                }
            ),

            parser.createRule('IdentifierExpression',
                parser.choice(
                    parser.token('Identifier'),
                    parser.seq(
                        parser.token('@'),
                        parser.token('Identifier'),
                    )
                ),
                {
                    build: (matches: any) => {
                        console.warn(JSON.stringify(matches, null, 2));
                        if (matches.length === 1) {
                            return Program.Expression.createPrimaryIdentifier(
                                matches[0].span,
                                matches[0].value,
                                false
                             );
                        } else {
                            return Program.Expression.createPrimaryIdentifier(
                                parser.getMatchesSpan(matches),
                                '@'+matches[1].value,
                                true
                             );
                        }
                    }
                }
            ),

            // parser.createRule('ParenthesizedExpression',
            //     parser.seq(
            //         parser.token('('),
            //         parser.rule('Expression'),
            //         parser.token(')')
            //     ),
            //     {
            //         build: (matches: any) => Program.Expression.createPrimaryParen( parser.getMatchesSpan(matches), matches[1] ),
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
            //         build: (matches: any) => Program.Expression.createPrimaryObject(
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => ({
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
        //             build: (matches: any) => ({
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
        //             build: (matches: any) => ({
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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
        //             build: (matches: any) => {
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