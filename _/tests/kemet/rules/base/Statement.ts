/* eslint-disable @typescript-eslint/no-explicit-any */
// Expression.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as parser from '../../../../lib/parser';
    import * as Program from '../../libs/program/program';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const StatementRules: parser.Rules = [

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                   STATEMENTS                                      ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('Statement',
                parser.choice(
                    parser.rule('ExprStmt'),
                    // parser.rule('VarDeclStmt'),
                    // parser.rule('BlockStmt'),
                    // parser.rule('FuncDeclStmt'),
                    // parser.rule('DefDeclStmt'),
                    // parser.rule('UseDeclStmt'),
                    // parser.rule('ReturnStatement'),
                    // parser.rule('ifStmt'),
                ),
                {
                    build: (matches: any) => matches[0]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                    EXPRESSIONS                                    ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('ExprStmt',
                parser.seq(
                    parser.rule('Expression'),
                    parser.token(';'),
                ),
                {
                    build: (matches) => ({
                        span: parser.getMatchesSpan(matches),
                        rule: 'expr-stmt',
                        value: Program.Statement.createExpression(
                            parser.getMatchesSpan(matches),
                            matches[0].value as Program.Expression
                        )
                    }),
                    errors: [
                        parser.error(0, 'Expected expression'),
                        parser.error(1, 'Expected `;` after expression')
                    ]
                }
            ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                      VARIABLE                                     ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('VarDeclStmt',
        //         parser.seq(
        //             // pub
        //             parser.optional(parser.token('pub')),

        //             // let
        //             parser.token('let'),

        //             // mut
        //             parser.optional(parser.token('mut')),

        //             // parameter
        //             parser.choice(parser.rule('Parameter')),

        //             // ;
        //             parser.token(';'),
        //         ),
        //         {
        //             build: (matches: any) => {
        //                 const Pub       = parser.isOptionalPassed(matches[0]);
        //                 const Mut       = parser.isOptionalPassed(matches[2]);
        //                 const Param     = matches[3] as Program.Parameter;
        //                 const Name      = Param.options.name;
        //                 const Type      = Param.options.type;
        //                 const Expr      = Param.options.initializer;
        //                 const Block     = Param.options.block;

        //                 const Span      = {
        //                     start : Pub ? matches[0][0].span.start : matches[1].span.start,
        //                     end: matches[matches.length-1].span.end
        //                 };


        //                 return Program.Statement.createVariable( Span, Name, Type, !Param.options.block ? Expr : undefined, Mut, Pub, Param.options.block ? Block : undefined );
        //             },

        //             errors: [
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('pub', opt.tokenIndex),
        //                     'Expected `let` after `pub` keyword'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('let', opt.tokenIndex),
        //                     'Expected `name` after `let` keyword'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('mut', opt.tokenIndex),
        //                     'Expected `name` after `mut` keyword'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(':', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `type` after `:`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(':', opt.tokenIndex),
        //                     'Expected `type` after `:`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `expression` after `=`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', opt.tokenIndex),
        //                     'Expected `expression` after `=`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `block` after `=>`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', opt.tokenIndex),
        //                     'Expected `block` after `=>`'),

        //                 // *X: this will work in cases like let x =        ; (cuz `=` followed by multi `ws`)
        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Identifier',
        //                     'Expected `<:type> <=expr|=>block> ;` after variable name'),

        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Type',
        //                     'Expected `<=expr|=>block> ;` after variable type'),
        //             ]
        //         }
        //     ),


        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                       BLOCK                                       ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('BlockStmt',
        //         parser.choice(
        //             parser.seq(
        //                 parser.token('{'),
        //                 parser.token('}')
        //             ),
        //             parser.seq(
        //                 parser.token('{'),
        //                 parser.oneOrMore(parser.rule('Statement')),
        //                 parser.token('}')
        //             ),
        //         ),
        //         {
        //             build: (matches: any) => {
        //                 const isFilled = matches.length === 3;

        //                 return Program.Statement.createBlock(
        //                     parser.getMatchesSpan(matches),
        //                     isFilled ? matches[1] : []
        //                 );
        //             },
        //             errors: [
        //                 parser.error(0, "Expected '{' to start block"),
        //                 parser.error(1, "Expected statements inside block"),
        //                 parser.error(2, "Expected '}' to end block")
        //             ]
        //         }
        //     ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                      FUNCTION                                     ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('FuncDeclStmt',
        //         parser.seq(
        //             // pub
        //             parser.optional(parser.token('pub')),

        //             // inline
        //             parser.silent(parser.optional(parser.token('inline'))),

        //             // fn
        //             parser.token('fn'),

        //             // name
        //             parser.rule('Identifier'),

        //             // ( params )
        //             parser.silent(parser.rule('ParenParameterList_ForceType')),

        //             // return type
        //             parser.optional(parser.rule('FuncDeclReturnSuffix')),

        //             // body
        //             parser.rule('BlockStmt')
        //         ),
        //         {
        //             build: (matches: any) => {
        //                 const pub                   = parser.isOptionalPassed(matches[0]);
        //                 const inline                = parser.isOptionalPassed(matches[1]);
        //                 const name                  = matches[3];
        //                 const params                = matches[4];
        //                 const { errType, retType } = parser.getOptional(matches[5]) || { errType: undefined, retType: undefined };
        //                 const body                  = matches[6];
        //                 const span                  = parser.getMatchesSpan(matches);
        //                 // console.warn(JSON.stringify(matches, null, 2));

        //                 if(pub) {span.start = matches[0][0].span.start;}
        //                 else if(inline) {span.start = matches[1][0].span.start;}

        //                 return Program.Statement.createFunction( span, name, params, body, errType, retType, inline, pub );
        //             },
        //             errors: [

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('pub', opt.tokenIndex),
        //                     'Expected `fn` after `pub` keyword'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('inline', opt.tokenIndex),
        //                     'Expected `fn` after `inline` keyword'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('fn', opt.tokenIndex),
        //                     'Expected `name` after `fn` keyword'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('->', opt.tokenIndex) || parser.tokens[opt.tokenIndex]?.kind === '->',
        //                     'Expected `return type` after `->`'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(')', opt.tokenIndex),
        //                     'Expected `->` after function parameters'),

        //                 parser.error(4, 'Expected valid function parameters'),
        //                 parser.error(7, 'Expected valid function return type'),
        //                 parser.error(8, 'Expected valid function body'),
        //             ]
        //         }
        //     ),

        //     parser.createRule('FuncDeclReturnSuffix',
        //         parser.seq(
        //             parser.token('->'),
        //             parser.optional(parser.rule('FuncDeclReturnErrorSuffix')),
        //             parser.rule('Type'),
        //         ),
        //         {
        //             build: (matches: any) => ({
        //                 errType: parser.getOptional(matches[1]),
        //                 retType: matches[2]
        //             })
        //         }
        //     ),

        //     parser.createRule('FuncDeclReturnErrorSuffix',
        //         parser.seq(
        //             parser.optional(parser.rule('Type')),
        //             parser.token('!')
        //         ),
        //         { build: (matches: any) => parser.getOptional(matches[0], Program.Type.createPrimitiveAuto()) }
        //     ),

        //     parser.createRule('ReturnStatement',
        //         parser.seq(
        //             parser.token('return'),
        //             parser.optional(parser.rule('Expression')),
        //             parser.token(';')
        //         ),
        //         {
        //             build: (matches: any) => Program.Statement.createReturn(
        //                 parser.getMatchesSpan(matches),
        //                 parser.getOptional(matches[1])
        //             )
        //         }
        //     ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                     IF STATEMENT                                  ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('ifStmt',
        //         parser.seq(
        //             // if
        //             parser.token('if'),

        //             // condition (can be parenthesized or not)
        //             parser.rule('Expression'),

        //             // then statement/block
        //             parser.rule('Statement'),

        //             // optional else clause
        //             parser.optional(
        //                 parser.seq(
        //                     parser.token('else'),
        //                     parser.rule('Statement')
        //                 )
        //             )
        //         ),
        //         {
        //             build: (matches: any) => {
        //                 const span = parser.getMatchesSpan(matches);
        //                 const condition = matches[1];

        //                 const thenStatement = matches[2];
        //                 const elseStatement = parser.getOptional(matches[3], undefined, 1, true);
        //                 if(elseStatement) {
        //                     span.end = elseStatement.span.end;
        //                 }

        //                 return Program.Statement.createIf(
        //                     span,
        //                     condition,
        //                     thenStatement,
        //                     elseStatement
        //                 );
        //             },
        //             errors: [
        //                 // parser.error(1,
        //                 //     'Expected condition after `if`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('if', opt.tokenIndex),
        //                     'Expected condition after `if` keyword'),

        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('(', opt.tokenIndex),
        //                     'Expected condition after `if`'),

        //                 parser.error((parser: parser.Parser, opt: any) =>
        //                     parser.isPrevToken(')', opt.tokenIndex) ||
        //                     (opt.prevInnerRule === 'Expression' && !parser.tokens[opt.tokenIndex]?.kind.startsWith('else')),
        //                     'Expected statement after condition'),

        //                 parser.error((_parser: parser.Parser, _opt: any) => true,
        //                     'Expected statement'),
        //             ]
        //         }
        //     ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                     DEFINITION                                    ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     // parser.createRule('DefDeclStmt',
        //     //     parser.choice(
        //     //         parser.rule('def name = <type> | struct>;'),
        //     //     ),
        //     //     {
        //     //         build: (matches: any) => matches[0],
        //     //         errors: [
        //     //             parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('def', opt.tokenIndex),
        //     //                 'Expected `name` after `def` keyword to be a definition name'),

        //     //             parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', opt.tokenIndex),
        //     //                 'Expected `type | struct` after `=` to be a definition value'),

        //     //             parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Identifier',
        //     //                 'Expected `= <type> | struct> ;` after definition name'),

        //     //             // parser.error(3,
        //     //             //     'Expected `;` after definition value'),
        //     //         ]
        //     //     }
        //     // ),

        //     // parser.createRule('def name = <type> | struct>;',
        //     //     parser.seq(
        //     //         parser.token('def'),
        //     //         parser.rule('Identifier'),
        //     //         parser.token('='),
        //     //         parser.choice(
        //     //             parser.rule('StructDecl'),
        //     //             parser.rule('Type'),
        //     //         ),
        //     //         parser.token(';')
        //     //     ),
        //     //     {
        //     //         build: (matches: any) => Program.Statement.definition(
        //     //             parser.getMatchesSpan(matches),
        //     //             matches[1], matches[3]
        //     //         )
        //     //     }
        //     // ),

        //     // parser.createRule('StructDecl',
        //     //     parser.seq(
        //     //         parser.token('struct'),
        //     //         parser.token('{'),
        //     //         parser.optional(parser.rule('StructDeclBody')),
        //     //         parser.token('}')
        //     //     ),
        //     //     {
        //     //         build: (matches: any) => parser.getOptional(matches[2], Program.Struct.create(
        //     //             parser.getMatchesSpan(matches),
        //     //             [],
        //     //             []
        //     //         )),
        //     //         errors: [
        //     //             parser.error(0, "Expected `struct` keyword"),
        //     //             parser.error(1, "Expected `{` to start struct body"),
        //     //             parser.error(2, "Expected struct body"),
        //     //             parser.error(3, "Expected `}` to end struct body")
        //     //         ]
        //     //     }
        //     // ),

        //     // parser.createRule('StructDeclBody',
        //     //     parser.oneOrMore(
        //     //         parser.choice(
        //     //             parser.rule('ParameterWithSemicolon'),
        //     //             parser.rule('FuncDeclStmt'),
        //     //         )
        //     //     ),
        //     //     {
        //     //         build: (matches: any) => {
        //     //             let fields  : Program.Parameter[] = [];
        //     //             let methods : Program.Statement[] = [];

        //     //             // Separate parameters and functions
        //     //             for (const match of matches) {
        //     //                 if(match instanceof Program.Statement) {
        //     //                     methods.push(match);
        //     //                 } else {
        //     //                     fields.push(match);
        //     //                 }
        //     //             }

        //     //             return Program.Struct.create(
        //     //                 parser.getMatchesSpan(matches),
        //     //                 fields, methods
        //     //             )
        //     //         }
        //     //     }
        //     // ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                        USE                                        ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     // parser.createRule('UseDeclStmt',
        //     //     parser.seq(
        //     //         parser.token('use'),
        //     //         parser.rule('Identifier'),
        //     //         parser.token('='),
        //     //         parser.rule('Expression'),
        //     //         parser.token(';')
        //     //     ),
        //     //     {
        //     //         build: (matches: any) => Program.Statement.use(
        //     //             parser.getMatchesSpan(matches),
        //     //             matches[1], matches[3]
        //     //         ),
        //     //         errors: [
        //     //             parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('use', opt.tokenIndex),
        //     //                 'Expected `name` after `use` keyword to be a use name'),

        //     //             parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', opt.tokenIndex),
        //     //                 'Expected `expression` after `=` to be a use value'),

        //     //             parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Identifier',
        //     //                 'Expected `= expression ;` after use name'),
        //     //         ]
        //     //     }
        //     // ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                     PARAMETER                                     ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('Parameter',
        //         parser.seq(
        //             // name
        //             parser.rule('Identifier'),

        //             // : type
        //             parser.silent(
        //                 parser.optional(
        //                     parser.seq(
        //                         parser.token(':'),
        //                         parser.rule('Type')
        //                     )
        //                 )
        //             ),

        //             // = expr | => block
        //             parser.optional(
        //                 parser.choice(
        //                     // = expr
        //                     parser.seq(
        //                         parser.token('='),
        //                         parser.rule('Expression')
        //                     ),
        //                     // => block
        //                     parser.seq(
        //                         parser.token('=>'),
        //                         parser.rule('BlockStmt')
        //                     )
        //                 )
        //             ),
        //         ),

        //         {
        //             build: (matches: any) => {


        //                 const Name      = matches[0];
        //                 const Type      = parser.getOptional(matches[1], undefined, 1, true);
        //                 const Expr      = parser.getOptional(matches[2], undefined, 1, true);
        //                 const Span      = {
        //                     start : matches[0].span.start,
        //                     end : Expr ? Expr.span.end : Type ? Type.span.end : matches[0].span.end,
        //                 };

        //                 const assignMark = parser.getOptional(matches[2], false, 0, true);
        //                 const isBlockAssign = assignMark ? assignMark.kind === '=>' : false;

        //                 return Program.Parameter.create( Span, Name, Type, !isBlockAssign ? Expr : undefined, isBlockAssign ? Expr : undefined );
        //             },

        //             errors: [
        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(':', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `type` after `:`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(':', opt.tokenIndex),
        //                     'Expected `type` after `:`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `expression` after `=`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', opt.tokenIndex),
        //                     'Expected `expression` after `=`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `block` after `=>`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', opt.tokenIndex),
        //                     'Expected `block` after `=>`'),

        //                 // *X: this will work in cases like `x =        ` (cuz `=` followed by multi `ws`)
        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Identifier',
        //                     'Expected `<:type> <=expr|=>block>`'),

        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Type',
        //                     'Expected `<=expr|=>block>`'),
        //             ]
        //         }
        //     ),

        //     parser.createRule('Parameter_ForceType',
        //         parser.seq(
        //             // name
        //             parser.rule('Identifier'),

        //             // : type
        //             parser.token(':'),
        //             parser.rule('Type'),

        //             // = expr | => block
        //             parser.optional(
        //                 parser.choice(
        //                     // = expr
        //                     parser.seq(
        //                         parser.token('='),
        //                         parser.rule('Expression')
        //                     ),
        //                     // => block
        //                     parser.seq(
        //                         parser.token('=>'),
        //                         parser.rule('BlockStmt')
        //                     )
        //                 )
        //             ),
        //         ),

        //         {
        //             build: (matches: any) => {


        //                 const Name      = matches[0];
        //                 const Type      = matches[2];
        //                 const Expr      = parser.getOptional(matches[3], undefined, 1, true);
        //                 const Span      = {
        //                     start : matches[0].span.start,
        //                     end : Expr ? Expr.span.end : Type ? Type.span.end : matches[0].span.end,
        //                 };

        //                 const assignMark = parser.getOptional(matches[3], false, 0, true);
        //                 const isBlockAssign = assignMark ? assignMark.kind === '=>' : false;

        //                 return Program.Parameter.create( Span, Name, Type, !isBlockAssign ? Expr : undefined, isBlockAssign ? Expr : undefined );
        //             },

        //             errors: [
        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(':', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `type` after `:`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken(':', opt.tokenIndex),
        //                     'Expected `type` after `:`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `expression` after `=`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', opt.tokenIndex),
        //                     'Expected `expression` after `=`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `block` after `=>`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', opt.tokenIndex),
        //                     'Expected `block` after `=>`'),

        //                 // *X: this will work in cases like `x =        ` (cuz `=` followed by multi `ws`)
        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Identifier',
        //                     'Expected `<:type> <=expr|=>block>`'),

        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Type',
        //                     'Expected `<=expr|=>block>`'),
        //             ]
        //         }
        //     ),

        //     parser.createRule('ParameterWithSemicolon',
        //         parser.seq(
        //             parser.rule('Parameter'),
        //             parser.token(';')
        //         ),
        //         {
        //             build: (matches: any) => {
        //                 const param = matches[0];
        //                 param.span.end = matches[1].span.end;
        //                 return param;
        //             },
        //             errors: [parser.error(1, "Expected `;`")]
        //         }
        //     ),

        //     parser.createRule('ParameterList',
        //         parser.zeroOrMore(
        //             parser.rule('Parameter'),
        //             parser.token(',')
        //         ),
        //         {
        //             build: (matches: any) => matches || [],
        //             errors: [parser.error(0, "Expected parameter list")]
        //         }
        //     ),

        //     parser.createRule('ParameterList_ForceType',
        //         parser.zeroOrMore(
        //             parser.rule('Parameter_ForceType'),
        //             parser.token(',')
        //         ),
        //         {
        //             build: (matches: any) => matches || [],
        //             errors: [parser.error(0, "Expected parameter list")]
        //         }
        //     ),

        //     parser.createRule('ParenParameterList',
        //         parser.seq(
        //             parser.token('('),
        //             parser.rule('ParameterList'),
        //             parser.token(')')
        //         ),
        //         {
        //             build: (matches: any) => matches[1] || [],
        //             errors: [
        //                 parser.error(0, "Expected `(` before parameter list"),
        //                 parser.error(1, "Expected parameter list"),
        //                 parser.error(2, "Expected `)` after parameter list")
        //             ]
        //         }
        //     ),

        //     parser.createRule('ParenParameterList_ForceType',
        //         parser.seq(
        //             parser.token('('),
        //             parser.rule('ParameterList_ForceType'),
        //             parser.token(')')
        //         ),
        //         {
        //             build: (matches: any) => matches[1] || [],
        //             errors: [
        //                 parser.error(0, "Expected `(` before parameter list"),
        //                 parser.error(1, "Expected parameter list"),
        //                 parser.error(2, "Expected `)` after parameter list")
        //             ]
        //         }
        //     ),

        // // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // // ║                                       FIELD                                       ║
        // // ╚═══════════════════════════════════════════════════════════════════════════════════╝

        //     parser.createRule('Field',
        //         parser.seq(
        //             // name
        //             parser.rule('Identifier'),

        //             // = expr | => block
        //             parser.choice(
        //                 // = expr
        //                 parser.seq(
        //                     parser.token('='),
        //                     parser.rule('Expression')
        //                 ),
        //                 // => block
        //                 parser.seq(
        //                     parser.token('=>'),
        //                     parser.rule('BlockStmt')
        //                 )
        //             )
        //         ),

        //         {
        //             build: (matches: any) => {
        //                 const Name      = matches[0];
        //                 const Expr      = matches[1][1];
        //                 const Span      = {
        //                     start   : matches[0].span.start,
        //                     end     : Expr.span.end,
        //                 };

        //                 const assignMark = matches[1][0];
        //                 const isBlockAssign = assignMark ? assignMark.kind === '=>' : false;

        //                 return Program.Field.create( Span, Name, !isBlockAssign ? Expr : undefined, isBlockAssign ? Expr : undefined);
        //             },

        //             errors: [
        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `expression` after `=`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=', opt.tokenIndex),
        //                     'Expected `expression` after `=`'),

        //                 // if this doesn't work, (see *X)
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', parser.tokens.length >= opt.tokenIndex+1 ? opt.tokenIndex+1 : opt.tokenIndex),
        //                     'Expected `block` after `=>`'),
        //                 parser.error((parser: parser.Parser, opt: any) => parser.isPrevToken('=>', opt.tokenIndex),
        //                     'Expected `block` after `=>`'),

        //                 // *X: this will work in cases like `x =        ` (cuz `=` followed by multi `ws`)
        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Identifier',
        //                     'Expected `<=expr|=>block>`'),

        //                 parser.error((parser: parser.Parser, opt: any) => opt.prevInnerRule === 'Type',
        //                     'Expected `<=expr|=>block>`'),
        //             ]
        //         }
        //     ),

        //     parser.createRule('FieldList',
        //         parser.zeroOrMore(
        //             parser.rule('Field'),
        //             parser.token(',')
        //         ),
        //         {
        //             build: (matches: any) => matches || [],
        //             errors: [parser.error(0, "Expected parameter list")]
        //         }
        //     ),

        //     parser.createRule('ParenFieldList',
        //         parser.seq(
        //             parser.token('('),
        //             parser.rule('FieldList'),
        //             parser.token(')')
        //         ),
        //         {
        //             build: (matches: any) => matches[1] || [],
        //             errors: [
        //                 parser.error(0, "Expected `(` before parameter list"),
        //                 parser.error(1, "Expected parameter list"),
        //                 parser.error(2, "Expected `)` after parameter list")
        //             ]
        //         }
        //     ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                        HELP                                       ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('Identifier',
                parser.token('Identifier'),
                {
                    build: (matches) => ({
                        span: parser.getMatchesSpan(matches),
                        rule: 'identifier',
                        value: Program.Identifier.create( matches[0].span, matches[0].value as string )
                    }),
                    errors: [ parser.error(0, "Expected identifier") ]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                       ####                                        ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

    ];

// ╚══════════════════════════════════════════════════════════════════════════════════════╝