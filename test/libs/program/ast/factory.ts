// factory.ts — Improved AST Factory with better error handling
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Span, DEFAULT_SPAN } from './base';
    import { BinarySource, Expression, ExpressionKind, ExpressionSource, LiteralSource, ParenSource, PostfixSource, PrefixSource, PrimarySource, PrimaryTypes } from './Expression';
    import { Statement, StatementKind, VariableSource, BlockSource, FunctionSource, ReturnSource, StatementSource, IfSource } from './Statement';
    import { Identifier } from './Identifier';
    import { Parameter } from './Parameter';
    import { ArraySource, OptionalSource, PointerSource, TupleSource, Type, TypeKind, TypeSource } from './Type';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class ASTFactory {

        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static createStatement(data: Statement): Statement {
                const span = data.span as Span;
                const options = data.options;

                if (!options || !options.kind) {
                    throw new Error('Invalid statement data: missing kind');
                }

                // Create the statement with proper source objects
                const statement = new Statement(span, {
                    kind: options.kind,
                    source: this.createStatementSource(options.source!, options.kind)
                });

                return statement;
            }

            private static createStatementSource(source: StatementSource, kind: StatementKind): StatementSource | undefined {
                if (!source) {return undefined;}

                switch (kind) {
                    case 'Variable':
                        return this.createVariableSource(source as VariableSource);
                    case 'Function':
                        return this.createFunctionSource(source as FunctionSource);
                    case 'Block':
                        return this.createBlockSource(source as BlockSource);
                    case 'Return':
                        return this.createReturnSource(source as ReturnSource);
                    case 'Expression':
                        return this.createExpression(source as Expression);
                    case 'If':
                        return this.createIfSource(source as IfSource);
                    default:
                        return source;
                }
            }

            private static createBlock(data: Statement): Statement {
                const span = data.span as Span;
                const options = data.options;

                // Create proper statement with processed source
                return new Statement(span, options);
            }

            private static createBlockSource(data: BlockSource): BlockSource {
                return {
                    statements: (data.statements || []).map((s: Statement) => this.createStatement(s)),
                    span: data.span || DEFAULT_SPAN
                };
            }

            private static createReturnSource(data: ReturnSource): ReturnSource {
                return {
                    expression: data.expression ? this.createExpression(data.expression) : undefined
                };
            }

            private static createVariableSource(data: VariableSource): VariableSource {
                return {
                    name        : this.createIdentifier(data.name),
                    type        : data.type
                        ? (data.type instanceof Type ? data.type : this.createType(data.type))
                        : undefined,
                    initializer : data.initializer ? this.createExpression(data.initializer) : undefined,
                    block       : data.block ? this.createBlock(data.block) : undefined,
                    mutable     : data.mutable || false,
                    public      : data.public  || false
                };
            }

            private static createFunctionSource(data: FunctionSource): FunctionSource {
                return {
                    name        : this.createIdentifier(data.name),
                    parameters  : (data.parameters || []).map((p: Parameter) => this.createParameter(p)),
                    errType     : data.errType ? this.createType(data.errType) : undefined,
                    returnType  : this.createType(data.returnType!),
                    block       : this.createStatement(data.block),
                    inline      : data.inline || false,
                    public      : data.public || false
                };
            }

            static createExpression(data: Expression): Expression {
                const span = data.span as Span;
                const options = data.options;

                if (!options || !options.kind) {
                    throw new Error('Invalid expression data: missing kind');
                }

                // Create proper expression with processed source
                const expression = new Expression(span, {
                    kind: options.kind,
                    source: this.createExpressionSource(options.source as ExpressionSource, options.kind)
                });

                return expression;
            }

            private static createExpressionSource(source: ExpressionSource, kind: ExpressionKind): ExpressionSource {
                switch (kind) {
                    case 'Primary':
                        return this.createPrimarySource(source as PrimarySource);
                    case 'Postfix':
                        return this.createPostfixSource(source as PostfixSource);
                    case 'Prefix':
                        return this.createPrefixSource(source as PrefixSource);
                    case 'Binary':
                        return this.createBinarySource(source as BinarySource);
                    default:
                        return source;
                }
            }

            private static createPrimarySource(data: PrimarySource): PrimarySource {
                const kind : PrimaryTypes = data.kind;
                if (kind === 'Identifier') {
                    // Keep the ident source as-is for now, but could be enhanced
                    return data;
                }

                else if (kind === 'Paren' && (data.source as ParenSource)?.source) {
                    // Ensure nested expressions are properly created with error handling
                    try {
                        return {
                            ...data,
                            source: {
                                ...data.source,
                                source: this.createExpression((data.source as ParenSource).source)
                            } as ParenSource
                        };
                    } catch (error) {
                        console.warn('Failed to create parenthesized expression:', error);
                        return {
                            ...data,
                            source: {
                                ...data.source,
                            }
                        };
                    }
                }

                else if (kind === 'Literal' && (data.source?.kind as TypeKind) === 'Array' && Array.isArray((data.source as LiteralSource).value)) {
                    return {
                        ...data,
                        source: {
                            ...data.source,
                            value: ((data.source as LiteralSource).value as Expression[]).map((item: Expression) => {
                                try {
                                    return item && typeof item === 'object' && item.span ? this.createExpression(item) : item;
                                } catch (error) {
                                    console.warn('Failed to create array element expression:', error);
                                    return null; // Will be filtered out or handled gracefully
                                }
                            }).filter(Boolean) // Remove null elements
                        } as LiteralSource
                    };
                }
                return data;
            }

            private static createPostfixSource(data: PostfixSource): PostfixSource {
                try {
                    return {
                        ...data,
                        source: data.source ? this.createExpression(data.source) : undefined,
                        property: data.property ? this.createExpression(data.property) : undefined,
                        args: data.args ? data.args.map((arg: Expression) => {
                            try {
                                return this.createExpression(arg);
                            } catch (error) {
                                console.warn('Failed to create argument expression:', error);
                                return null;
                            }
                        }).filter(Boolean) : undefined
                    } as PostfixSource;
                } catch (error) {
                    console.warn('Failed to create postfix source:', error);
                    return {
                        ...data,
                    };
                }
            }

            private static createPrefixSource(data: PrefixSource): PrefixSource {
                try {
                    return {
                        ...data,
                        source: data.source ? this.createExpression(data.source) : undefined
                    } as PrefixSource;
                } catch (error) {
                    console.warn('Failed to create prefix source:', error);
                    return {
                        ...data,
                    };
                }
            }

            private static createBinarySource(data: BinarySource): BinarySource {
                try {
                    return {
                        ...data,
                        left: data.left ? this.createExpression(data.left) : undefined,
                        right: data.right ? this.createExpression(data.right) : undefined,
                        condition: data.condition ? this.createExpression(data.condition) : undefined
                    } as BinarySource;
                } catch (error) {
                    console.warn('Failed to create binary source:', error);
                    return {
                        ...data,
                    };
                }
            }

            static createIdentifier(data: Identifier): Identifier {
                const span = data.span as Span;
                const options = data.options;

                if (!options || !options.name) {
                    throw new Error('Invalid identifier data: missing name');
                }

                return new Identifier(span, { name: options.name });
            }

            static createType(data: Type): Type {
                if(!data) {
                    // auto type
                    return Type.createPrimitiveAuto();
                }

                const span = data.span as Span;
                const options = data.options;

                if (!options || !options.kind) {
                    throw new Error('Invalid type data: missing kind');
                }

                // Create type with proper source processing
                const type = new Type(span, {
                    kind: options.kind,
                    source: this.createTypeSource(options.source!, options.kind)
                });

                return type;
            }

            private static createTypeSource(source: TypeSource, kind: TypeKind): TypeSource {

                switch (kind) {
                    case 'Array':
                        try {
                            const src = source as unknown as ArraySource;
                            const srcTarget = src.target as unknown as Type;

                            return {
                                target: src.target ?
                                    (src.target instanceof Type ?
                                        src.target :
                                        new Type(srcTarget.span, {
                                            kind: srcTarget.options.kind,
                                            source: this.createTypeSource(srcTarget.options.source!, srcTarget.options.kind)
                                        })) : undefined,
                                size: src.size ? this.createExpression(src.size) : undefined
                            } as ArraySource;
                        } catch (error) {
                            console.warn('Failed to create array type source:', error);
                            return {
                                target: Type.createPrimitiveAny(DEFAULT_SPAN),
                                size: undefined
                            };
                        }

                    case 'Pointer':
                        try {
                            const src = source as unknown as PointerSource;
                            return {
                                target: src.target instanceof Type ? src.target : this.createType(src.target),
                                mutable: src.mutable || false
                            };
                        } catch (error) {
                            console.warn('Failed to create pointer type source:', error);
                            return {
                                target: Type.createPrimitiveAny(DEFAULT_SPAN),
                                mutable: false
                            };
                        }

                    case 'Optional':
                        try {
                            const src = source as unknown as OptionalSource;
                            return {
                                target: src.target instanceof Type ? src.target : this.createType(src.target)
                            };
                        } catch (error) {
                            console.warn('Failed to create optional type source:', error);
                            return {
                                target: Type.createPrimitiveAny(DEFAULT_SPAN)
                            };
                        }

                    case 'Tuple':
                        try {
                            const src = source as unknown as TupleSource;
                            return {
                                fields: (src.fields || []).map((field: Type) => 
                                    field instanceof Type ? field : this.createType(field))
                            };
                        } catch (error) {
                            console.warn('Failed to create tuple type source:', error);
                            return {
                                fields: []
                            };
                        }

                    case 'Primitive':
                        // Return primitive source as-is
                        return source;

                    case 'Identifier':
                        return source;

                    default:
                        return source;
                }
            }

            static createParameter(data: Parameter): Parameter {
                const span = data.span as Span;
                const options = data.options || {};

                return new Parameter(span, {
                    name: this.createIdentifier(options.name),
                    type: options.type ? this.createType(options.type) : undefined,
                    initializer: options.initializer ? this.createExpression(options.initializer) : undefined
                });
            }

            private static createIfSource(data: IfSource): IfSource {
                return {
                    condition: this.createExpression(data.condition),
                    thenStatement: this.createStatement(data.thenStatement),
                    elseStatement: data.elseStatement ? this.createStatement(data.elseStatement) : undefined
                };
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            static processASTNodes(nodes: Statement[]): Statement[] {
                return nodes.map(node => {
                    try {
                        return this.createStatement(node as Statement);
                    } catch (error) {
                        console.error('Failed to create statement from node:', node);
                        throw new Error(`AST node creation failed: ${error}`);
                    }
                });
            }

            // Enhanced validation methods
            static validateExpressionStructure(expr: Expression): boolean {
                if (!expr || typeof expr !== 'object') {return false;}
                if (!expr.span || !expr.options) {return false;}
                if (!expr.options.kind) {return false;}
                return true;
            }

            static validateTypeStructure(type: Type): boolean {
                if (!type || typeof type !== 'object') {return false;}
                if (!type.span || !type.options) {return false;}
                if (!type.options.kind) {return false;}
                return true;
            }

            // Safe expression creation with fallback
            static createExpressionSafe(data: Expression): Expression {
                try {
                    if (!this.validateExpressionStructure(data)) {
                        throw new Error('Invalid expression structure');
                    }
                    return this.createExpression(data);
                } catch (error) {
                    console.warn('Creating fallback expression due to error:', error);
                    // Return a safe fallback expression
                    return Expression.createPrimaryLiteralUndefined(data.span || DEFAULT_SPAN);
                }
            }

            // Safe type creation with fallback
            static createTypeSafe(data: Type): Type {
                try {
                    if (!data) {return Type.createPrimitiveAuto();}
                    if (!this.validateTypeStructure(data)) {
                        throw new Error('Invalid type structure');
                    }
                    return this.createType(data);
                } catch (error) {
                    console.warn('Creating fallback type due to error:', error);
                    return Type.createPrimitiveAny(data.span || DEFAULT_SPAN);
                }
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

    // Export a convenience function for easy use
    export function createProperASTNodes(parserOutput: Statement[]): Statement[] {
        return ASTFactory.processASTNodes(parserOutput);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝