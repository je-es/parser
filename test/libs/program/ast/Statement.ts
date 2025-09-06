// Statement.ts — Statement structure containing alomost everything.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Span, Node, NodeVisitor, }         from './base';
    import { Type }                   from './Type';
    import { Expression}                        from './Expression';
    import { Identifier }                       from './Identifier';
    import { Parameter }                        from './Parameter';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ META ════════════════════════════════════════╗

    export type DefinitionStatementKind =
        | 'Unset'       | 'Struct'      | 'Type';

    export type StatementKind =
        | 'Unset'       | 'Expression'  | 'Variable'    | 'Function'
        | 'Definition'  | 'Use'         | 'Block'       | 'Return'
        | 'If';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface VariableSource {
        name            : Identifier;
        type?           : Type;
        initializer?    : Expression;
        mutable?        : boolean;
        public?         : boolean;
        block?          : Statement;
    }

    export interface FunctionSource {
        name            : Identifier;
        parameters      : Parameter[];
        errType?        : Type;
        returnType?     : Type;
        block           : Statement;
        inline?         : boolean;
        public?         : boolean;
    }

    export interface BlockSource {
        span            : Span;
        statements      : Statement[];
    }

    export interface ReturnSource {
        expression? : Expression;
    }

    export interface IfSource {
        condition       : Expression;
        thenStatement   : Statement;
        elseStatement?  : Statement;
    }

    export interface StatementOptions {
        kind             : StatementKind;
        source?          : StatementSource;
    }

    export type StatementSource = Expression | VariableSource | FunctionSource | BlockSource | ReturnSource | IfSource;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Statement extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : StatementOptions = { kind: 'Unset' }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            get kind            (): StatementKind   { return this.options.kind; }
            get source          (): StatementSource { return this.options.source!; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitStatement) {
                    return visitor.visitStatement(this);
                }
                return undefined as T;
            }

            public getChildrenNodes(): readonly Node[] {
                const children: Node[] = [];

                return children;
            }

            clone(newSpan?: Span): Statement {
                return new Statement(newSpan ?? this.span, this.options);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            getFunctionName(): string | undefined {
                if (this.isFunction()) {
                    return ((this.source as FunctionSource).name as Identifier).name;
                }

                return undefined;
            }

            getFunctionNameSpan(): { start: number; end: number } | undefined {
                if (this.isFunction()) {
                    return (this.source as FunctionSource).name.span;
                }
            }

            getFunctionParameters(): Parameter[]{
                if (this.isFunction()) {
                    return (this.source as FunctionSource).parameters;
                }
                return [];
            }

            getFunctionSource(): FunctionSource | undefined {
                if (this.isFunction()) {
                    return this.source as FunctionSource;
                }
                return undefined;
            }

            getReturnSource(): ReturnSource | undefined {
                if (this.isReturn()) {
                    return this.source as ReturnSource;
                }
                return undefined;
            }

            getVariableSource(): VariableSource | undefined {
                if (this.isVariable()) {
                    return this.source as VariableSource;
                }
                return undefined;
            }

            getVariableName(): string | undefined {
                if (this.isVariable()) {
                    return (this.source as VariableSource).name.name;
                }
                return undefined;
            }

            getVariableNameSpan(): { start: number; end: number } | undefined {
                if (this.isVariable()) {
                    return (this.source as VariableSource).name.span;
                }
            }

            getVariableInitializer(): Expression | undefined {
                if (this.isVariable()) {
                    return (this.source as VariableSource).initializer;
                }
                return undefined;
            }

            getExpressionSource(): Expression | undefined {
                if (this.isExpression()) {
                    return this.source as Expression;
                }
                return undefined;
            }

            getBlockSource(): BlockSource | undefined {
                if (this.isBlock()) {
                    return this.options.source as BlockSource;
                }
                return undefined;
            }

            getIfSource(): IfSource | undefined {
                if (this.isIf()) {
                    return this.source as IfSource;
                }
                return undefined;
            }

            getIfCondition(): Expression | undefined {
                if (this.isIf()) {
                    return (this.source as IfSource).condition;
                }
                return undefined;
            }

            getIfThenStatement(): Statement | undefined {
                if (this.isIf()) {
                    return (this.source as IfSource).thenStatement;
                }
                return undefined;
            }

            getIfElseStatement(): Statement | undefined {
                if (this.isIf()) {
                    return (this.source as IfSource).elseStatement;
                }
                return undefined;
            }


        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, options: StatementOptions): Statement {
                return new Statement(span, options);
            }

            static createExpression(span: Span, source: Expression): Statement {
                return new Statement(span, { kind: 'Expression', source });
            }

            static createVariable(
                span        : Span,
                name        : Identifier,
                type        ?: Type,
                initializer ?: Expression,
                mutable     ?: boolean,
                _public     ?: boolean,
                block       ?: Statement
            ): Statement {
                return new Statement(span, { kind: 'Variable', source: { name, type, initializer, mutable: mutable ?? false, public: _public ?? false, block } });
            }

            static createFunction(
                span        : Span,
                name        : Identifier,
                parameters  : Parameter[],
                block       : Statement,
                errType     ?: Type,
                returnType  ?: Type,
                inline      ?: boolean,
                _public     ?: boolean
            ): Statement {
                return new Statement(span, { kind: 'Function', source: { name, parameters, errType, returnType, block, inline, public: _public ?? false } });
            }

            static createBlock(span: Span, statements: Statement[] = []): Statement {
                return new Statement(span, { kind: 'Block', source: { span, statements } as BlockSource });
            }

            static createReturn(span: Span, expression?: Expression): Statement {
                return new Statement(span, { kind: 'Return', source: { expression } });
            }

            static createIf(
                span            : Span,
                condition       : Expression,
                thenStatement?  : Statement,
                elseStatement?  : Statement
            ): Statement {
                return new Statement(span, { 
                    kind: 'If', 
                    source: { condition, thenStatement, elseStatement } as IfSource 
                });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── IS_X ──────────────────────────────┐

            isUnset(): boolean {
                return this.kind === 'Unset';
            }

            isExpression(): boolean {
                return this.kind === 'Expression';
            }

            isVariable(): boolean {
                return this.kind === 'Variable';
            }

            isPublicVariable(): boolean {
                return (this.isVariable() && (this.source as VariableSource).public!);
            }

            isFunction(): boolean {
                return this.kind === 'Function';
            }

            isReturn(): boolean {
                return this.kind === 'Return';
            }

            isPublicFunction(): boolean {
                return (this.isFunction() && (this.source as FunctionSource).public!);
            }

            isInlineFunction(): boolean {
                return (this.isFunction() && (this.source as FunctionSource).inline!);
            }

            isFunctionCanThrow(): boolean {
                return (this.isFunction() && (this.source as FunctionSource).errType !== undefined);
            }

            isBlock(): this is Statement & { kind: 'Block' } {
                return this.kind === 'Block';
            }

            isIf(): boolean {
                return this.kind === 'If';
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝