/* eslint-disable @typescript-eslint/no-explicit-any */
// Type.ts - Enhanced with Program Integration
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as parser from '../../../../lib/parser';
    import * as Program from '../../libs/program/program';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    const KEMET_USIZE_WIDTH = 64;

    export const TypeRules: parser.Rules = [

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                       TYPES                                       ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('Type',
                parser.rule('BaseType'),
                {
                    build: (matches: any) => matches[0],
                    errors: [parser.error(0, "Expected type")]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                     UNION TYPE                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            // parser.createRule('UnionType',
            //     parser.choice(
            //         parser.repeat(
            //             parser.rule('BaseType'),
            //             2,
            //             Infinity,
            //             parser.token('|'),
            //         ),
            //         parser.rule('BaseType')
            //     ),
            //     {
            //         build: (matches: any) => {
            //             if (matches.length === 1) { return matches[0]; }

            //             return Program.Type.union(
            //                 { start: matches[0].span.start, end: matches[matches.length - 1].span.end },
            //                 matches
            //             );
            //         },
            //     }
            // ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                     BASE TYPE                                     ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('BaseType',
                parser.choice(
                    parser.rule('PrimitiveType'),
                    parser.rule('OptionalType'),
                    parser.rule('PointerType'),
                    parser.rule('ArrayType'),
                    // parser.rule('FunctionType'),
                    // parser.rule('StructType'),
                    // parser.rule('EnumType'),
                    parser.rule('TupleType'),
                    parser.rule('IdentifierType'),
                ),
                { build: (matches: any) => matches[0] }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                   PRIMITIVE TYPE                                  ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('PrimitiveType',
                parser.choice(
                    parser.token('comptime_int'),
                    parser.token('comptime_float'),
                    parser.token('i_type'),
                    parser.token('u_type'),
                    parser.token('f_type'),
                    parser.token('isize'),
                    parser.token('usize'),
                    parser.token('bool'),
                    parser.token('type'),
                    parser.token('void'),
                    parser.token('any'),
                    parser.token('auto'),
                    parser.token('null'),
                    parser.token('undefined'),
                ),
                {
                    build: (matches: any) => {
                        const span = matches[0].span;
                        const value = matches[0].value;

                        // Create appropriate type based on token
                        switch (matches[0].kind) {

                            case 'void':
                                return Program.Type.createPrimitiveVoid(span);
                            case 'any':
                                return Program.Type.createPrimitiveAny(span);
                            case 'type':
                                return Program.Type.createPrimitiveType(span);
                            case 'auto':
                                return Program.Type.createPrimitiveAuto();
                            case 'bool':
                                return Program.Type.createPrimitiveBool(span);
                            case 'null':
                                return Program.Type.createPrimitiveNull(span);
                            case 'undefined':
                                return Program.Type.createPrimitiveUndefined(span);
                            case 'comptime_int':
                                return Program.Type.createPrimitiveComptimeInt(span, value);
                            case 'comptime_float':
                                return Program.Type.createPrimitiveComptimeFloat(span, value);
                            case 'isize':
                                return Program.Type.createPrimitiveSigned(span, value, KEMET_USIZE_WIDTH);
                            case 'usize':
                                return Program.Type.createPrimitiveUnsigned(span, value, KEMET_USIZE_WIDTH);
                            case 'i_type':
                                return Program.Type.createPrimitiveSigned(span, value);
                            case 'u_type':
                                return Program.Type.createPrimitiveUnsigned(span, value);
                            case 'f_type':
                                return Program.Type.createPrimitiveFloat(span, value);
                            default:
                                throw new Error(`Unexpected token: ${matches[0].kind}`);
                        }
                    },
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                   IDENTIFIER TYPE                                 ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('IdentifierType',
                parser.token('Identifier'),
                {
                    build: (matches: any) => Program.Type.createIdentifier(matches[0].span, matches[0].value),
                    errors: [parser.error(0, "Expected identifier type")]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                   POINTER TYPE                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('PointerType',
                parser.seq(
                    parser.token('*'),
                    parser.optional(parser.token('mut')),
                    parser.rule('Type')
                ),
                {
                    build: (matches: any) => Program.Type.createPointer(
                        parser.getMatchesSpan(matches),
                        matches[2],
                        parser.isOptionalPassed(matches[1])
                    ),
                    errors: [ parser.error(0, "Expected pointer type" ) ]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                  OPTIONAL TYPE                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('OptionalType',
                parser.seq(
                    parser.token('?'),
                    parser.rule('Type')
                ),
                {
                    build: (matches: any) => Program.Type.createOptional(
                        parser.getMatchesSpan(matches),
                        matches[1],
                    ),
                    errors: [ parser.error(0, "Expected optional type" ) ]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                   ARRAY TYPE                                      ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('ArrayType',
                parser.seq(
                    parser.token('['),
                    parser.optional(parser.rule('Expression')),
                    parser.token(']'),
                    parser.rule('Type')
                ),
                {
                    build: (matches: any) => Program.Type.createArray(
                        parser.getMatchesSpan(matches),
                        matches[3],
                        parser.getOptional(matches[1])
                    ),
                    errors: [ parser.error(0, "Expected array type" ) ]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                    TUPLE TYPE                                     ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('TupleType',
                parser.seq(
                    parser.token('('),
                    parser.oneOrMore( parser.rule('Type'), parser.token(',') ),
                    parser.token(')'),
                ),
                {
                    build: (matches: any) => Program.Type.createTuple(
                        parser.getMatchesSpan(matches),
                        matches[1]
                    ),
                    errors: [
                        parser.error(0, "Expected '(' before tuple." ),
                        parser.error(1, "Expected types in tuple." ),
                        parser.error(2, "Expected ')' after tuple." )
                     ]
                }
            ),

            // parser.createRule('FreeTupleType',
            //     parser.seq(
            //         parser.token('('),
            //         parser.optional(
            //             parser.oneOrMore( parser.rule('Type'), parser.token(',') )
            //         ),
            //         parser.token(')'),
            //     ),
            //     {
            //         build: (matches: any) => Program.Type.tuple(
            //             parser.getMatchesSpan(matches),
            //             parser.getOptional(matches[1], [])
            //         ),
            //         errors: [
            //             parser.error(0, "Expected '(' before tuple." ),
            //             parser.error(2, "Expected ')' after tuple." )
            //          ]
            //     }
            // ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                   FUNCTION TYPE                                   ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            // parser.createRule('FunctionType',
            //     parser.seq(
            //         parser.rule('FreeTupleType'),
            //         parser.token('->'),
            //         parser.optional(parser.rule('FuncDeclErrorType')),
            //         parser.rule('Type'),
            //     ),
            //     {
            //         build: (matches: any) => Program.Type.function(
            //             parser.getMatchesSpan(matches),
            //             // args
            //             matches[0].source.fields.length ? matches[0].source.fields : [],
            //             // error
            //             parser.getOptional(matches[2]),
            //             // return
            //             matches[3]
            //         ),
            //         errors: [ parser.error(0, "Expected function type" ) ]
            //     }
            // ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                    STRUCT TYPE                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            // parser.createRule('StructType',
            //     parser.seq(
            //         parser.token('struct'),
            //         parser.rule('StructTypeBody'),
            //     ),
            //     {
            //         build: (matches: any) => {
            //             let newResult = matches[1];
            //             newResult.span.start = matches[0].span.start;
            //             return newResult;
            //         },
            //         errors: [
            //             parser.error(0, "Expected 'struct' keyword"),
            //             parser.error(1, "Expected structure body"),
            //         ]
            //     }
            // ),

            // parser.createRule('StructTypeBody',
            //     parser.seq(
            //         parser.token('{'),
            //         parser.optional(
            //             parser.oneOrMore( parser.rule('Parameter'), parser.token(','))
            //         ),
            //         parser.token('}'),
            //     ),
            //     {
            //         build: (matches: any) => Program.Type.struct(
            //             parser.getMatchesSpan(matches),
            //             parser.getOptional(matches[1], [])
            //         ),
            //         errors: [
            //             parser.error(0, "Expected '{' before structure body"),
            //             parser.error(1, "Expected structure fields"),
            //             parser.error(2, "Expected '}' after structure body"),
            //         ]
            //     }
            // ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                     ENUM TYPE                                     ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            // parser.createRule('EnumType',
            //     parser.seq(
            //         parser.token('enum'),
            //         parser.rule('EnumBody'),
            //     ),
            //     {
            //         build: (matches: any) => {
            //             let newResult = matches[1];
            //             newResult.span.start = matches[0].span.start;
            //             return newResult;
            //         },
            //         errors: [
            //             parser.error(0, "Expected 'enum' keyword"),
            //             parser.error(1, "Expected enum body"),
            //         ]
            //     }
            // ),

            // parser.createRule('EnumBody',
            //     parser.seq(
            //         parser.token('{'),
            //         parser.optional(
            //             parser.oneOrMore( parser.rule('EnumVariant'), parser.token(','))
            //         ),
            //         parser.token('}'),
            //     ),
            //     {
            //         build: (matches: any) => Program.Type.enum(
            //             parser.getMatchesSpan(matches),
            //             parser.getOptional(matches[1], [])
            //         ),
            //         errors: [
            //             parser.error(0, "Expected '{' before enum variants" ),
            //             parser.error(1, "Expected enum variants" ),
            //             parser.error(2, "Expected '}' after enum variants" ),
            //         ]
            //     }
            // ),

            // parser.createRule('EnumVariant',
            //     parser.seq(
            //         parser.rule('Identifier'),
            //         parser.optional(
            //             parser.choice(
            //                 parser.rule('TupleType'),
            //                 parser.rule('StructTypeBody'),
            //             )
            //         )
            //     ),
            //     {
            //         build: (matches: any) => {
            //             return Program.Variant.create(
            //                 parser.getMatchesSpan(matches),
            //                 matches[0],
            //                 parser.getOptional(matches[1])
            //             );
            //         },
            //         errors: [
            //             parser.error(0, "Expected enum variant name"),
            //             parser.error(1, "Expected enum variant type")
            //         ]
            //     }
            // ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                       ####                                        ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝
    ];

// ╚══════════════════════════════════════════════════════════════════════════════════════╝