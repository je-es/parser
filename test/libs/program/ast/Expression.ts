// Expression.ts — Expression structure containing expressions.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Span, NodeVisitor, Node } from './base';
    import { Field } from './Field';
    import { Statement } from './Statement';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ META ════════════════════════════════════════╗

    export type LiteralTypes =
        | 'Unset'       | 'Array'       | 'String'      | 'Char'
        | 'Integer'     | 'Float'       | 'Bool'        | 'Null'
        | 'Undefined';

    export type PrimaryTypes =
        | 'Literal'     | 'Identifier'  | 'Paren';

    export type PostfixTypes =
        | 'Increment'   | 'Decrement'   | 'Dereference' | 'MemberAccess'
        | 'Call'        | 'ArrayAccess';

    export type PrefixTypes  =
        | 'Increment'   | 'Decrement'   | 'Reference'   | 'UnaryMinus'
        | 'UnaryPlus'   | 'LogicalNot'  | 'BitwiseNot';

    export type BaseExpressionCtrl =
        | 'Unset'       | 'Primary'    | 'Postfix'      | 'Prefix'
        | 'Binary'      | 'Object'     | 'Compute';

    export type BinaryExpressionKind =
        | 'Power'       | 'Additive'    | 'Shift'       | 'Multiplicative'
        | 'Relational'  | 'Equality'    | 'Bitwise'     | 'Logical'
        | 'BitwiseAnd'  | 'BitwiseOr'   | 'BitwiseXor'  | 'LogicalAnd'
        | 'LogicalOr'   | 'Ternary'     | 'Assignment';

    export type ExpressionKind = BaseExpressionCtrl | BinaryExpressionKind;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    // ═══════ Paren ═══════
    export interface ParenSource {
        kind            : 'Paren';
        source          : Expression;
    }

    // ═══════ Ident ═══════
    export interface IdentSource {
        kind            : 'Identifier';
        value           : string;
        builtin         : boolean;
    }

    // ═══════ Object ═══════
    export interface ObjectSource {
        kind            : 'Object';
        fields          : Field[];
    }

    // ═══════ Compute ═══════
    export interface ComputeSource {
        kind            : 'Compute';
        statements      : Statement[];
    }

    // ═══════ Literal ═══════
    export type LiteralValueTypes = number | string | boolean | null | undefined | Expression[];
    export interface LiteralSource {
        kind            : LiteralTypes;
        value           : LiteralValueTypes;
    }

    // ═══════ Primary ═══════
    export interface PrimarySource {
        kind             : PrimaryTypes;
        source           : LiteralSource | IdentSource | ParenSource;
    }

    // ═══════ Postfix ═══════
    export interface PostfixSource {
        kind             : PostfixTypes;
        source           : Expression;
        property        ?: Expression;
        args            ?: Expression[];
    }

    // ═══════ Prefix ═══════
    export interface PrefixSource {
        kind             : PrefixTypes;
        source           : Expression;
    }

    // ═══════ Binary ═══════
    export interface BinarySource {
        kind            : BinaryExpressionKind;
        left            : Expression;
        right           : Expression;
        condition      ?: Expression;
        operator       ?: string;
    }

    // ═══════ Expression ═══════
    export interface ExpressionOptions {
        kind             : ExpressionKind;
        source          ?: ExpressionSource;
    }

    export type ExpressionSource = PrimarySource | PostfixSource | PrefixSource | BinarySource | ObjectSource | ComputeSource;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Expression extends Node {
            isBinaryBitwiseAnd(): boolean {
                return this.getBinaryKind() === 'BitwiseAnd';
            }

            isBinaryBitwiseOr(): boolean {
                return this.getBinaryKind() === 'BitwiseOr';
            }

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : ExpressionOptions = { kind: 'Unset' }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            get kind            (): ExpressionKind      { return this.options.kind; }
            get source          (): ExpressionSource    { return this.options.source!; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitExpression) {
                    return visitor.visitExpression(this);
                }
                return undefined as T;
            }

            public getChildrenNodes(): readonly Node[] {
                const children: Node[] = [];

                if (!this.options.source) {return children;}

                if (this.isPrimary()) {
                    const primSource = this.source as PrimarySource;

                    if (primSource.kind === 'Paren') {
                        children.push((primSource.source as ParenSource).source);
                    }
                    else if (primSource.kind === 'Literal') {
                        const literalSource = primSource.source as LiteralSource;
                        if (literalSource.kind === 'Array' && Array.isArray(literalSource.value)) {
                            children.push(...(literalSource.value as Expression[]));
                        }
                    }
                }

                else if (this.isPostfix()) {
                    const postSource = this.source as PostfixSource;
                    children.push(postSource.source);
                    if (postSource.property) {children.push(postSource.property);}
                    if (postSource.args) {children.push(...postSource.args);}
                }

                else if (this.isPrefix()) {
                    const prefSource = this.source as PrefixSource;
                    children.push(prefSource.source);
                }

                else if (this.isBinary()) {
                    const binSource = this.source as BinarySource;
                    children.push(binSource.left);
                    children.push(binSource.right);
                    if (binSource.condition) {children.push(binSource.condition);}
                }

                else if (this.isObject()) {
                    const objSource = this.source as ObjectSource;
                    children.push(...objSource.fields);
                }

                else if (this.isCompute()) {
                    const cmpSource = this.source as ComputeSource;
                    children.push(...cmpSource.statements);
                }

                return children;
            }

            clone(newSpan?: Span): Expression {
                const cloned = new Expression(newSpan ?? this.span, this.options);
                return cloned;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            getPrimaryKind(): PrimaryTypes | undefined {
                if (this.isPrimary()) {
                    return (this.source as PrimarySource).kind;
                }
                return undefined;
            }

            getPrimarySource(): PrimarySource | undefined {
                if (this.isPrimary()) {
                    return this.source as PrimarySource;
                }
                return undefined;
            }

            getPrimaryLiteralValue(): LiteralValueTypes | undefined {
                if (this.isPrimaryLiteral()) {
                    return ((this.source as PrimarySource).source as LiteralSource).value;
                }
                return undefined;
            }

            getPrimaryLiteralDeepValue(): LiteralValueTypes | undefined {
                if (this.isPrimaryLiteral()) {
                    return this.getPrimaryLiteralValue();
                }

                if(this.isPrimaryParen()) {
                    let src = this.getPrimaryParenExpression();
                    while(src && src.isPrimaryParen()) {
                        src = src.getPrimaryParenExpression();
                    }

                   if (src && src.isPrimaryLiteral()) {
                       return src.getPrimaryLiteralValue();
                   }
                }

                return undefined;
            }

            getPrimaryLiteralKind(): LiteralTypes | undefined {
                if (this.isPrimaryLiteral()) {
                    return ((this.source as PrimarySource).source as LiteralSource).kind;
                }
                return undefined;
            }

            getPrimaryParenExpression(): Expression | undefined {
                if (this.isPrimaryParen()) {
                    return ((this.source as PrimarySource).source as ParenSource).source;
                }
                return undefined;
            }

            getPrimaryLiteralArraySize(): number | undefined {
                if (this.isPrimaryLiteralArray()) {
                    return (((this.source as PrimarySource).source as LiteralSource).value as Expression[]).length;
                }
                return undefined;
            }

            getPrimaryLiteralArrayElements(): Expression[] | undefined {
                if (this.isPrimaryLiteralArray()) {
                    return (((this.source as PrimarySource).source as LiteralSource).value as Expression[]);
                }
                return undefined;
            }

            getPrimaryIdentifierSource(): IdentSource | undefined {
                if (this.isPrimaryIdentifier()) {
                    return ((this.source as PrimarySource).source as IdentSource);
                }
                return undefined;
            }

            getPrimaryIdentifierName(): string | undefined {
                if (this.isPrimaryIdentifier()) {
                    return ((this.source as PrimarySource).source as IdentSource).value;
                }
                return undefined;
            }

            getPrimaryIdentifierIsBuiltin(): boolean | undefined {
                if (this.isPrimaryIdentifier()) {
                    return ((this.source as PrimarySource).source as IdentSource).builtin;
                }
                return undefined;
            }

            getPostfixKind(): PostfixTypes | undefined {
                if (this.isPostfix()) {
                    return (this.source as PostfixSource).kind;
                }
                return undefined;
            }

            getPostfixIncrementExpression(): Expression | undefined {
                if (this.isPostfixIncrement()) {
                    return (this.source as PostfixSource).source;
                }
                return undefined;
            }

            getPostfixDecrementExpression(): Expression | undefined {
                if (this.isPostfixDecrement()) {
                    return (this.source as PostfixSource).source;
                }
                return undefined;
            }

            getPostfixDereferenceExpression(): Expression | undefined {
                if (this.isPostfixDereference()) {
                    return (this.source as PostfixSource).source;
                }
                return undefined;
            }

            getPostfixMemberAccessObject(): Expression | undefined {
                if (this.isPostfixMemberAccess()) {
                    return (this.source as PostfixSource).source;
                }
                return undefined;
            }

            getPostfixMemberAccessProperty(): Expression | undefined {
                if (this.isPostfixMemberAccess()) {
                    return (this.source as PostfixSource).property;
                }
                return undefined;
            }

            getPostfixCallCallee(): Expression | undefined {
                if (this.isPostfixCall()) {
                    return (this.source as PostfixSource).source;
                }
                return undefined;
            }

            getPostfixCallArgs(): Expression[] | undefined {
                if (this.isPostfixCall()) {
                    return (this.source as PostfixSource).args;
                }
                return undefined;
            }

            getPostfixArrayAccessArray(): Expression | undefined {
                if (this.isPostfixArrayAccess()) {
                    return (this.source as PostfixSource).source;
                }
                return undefined;
            }

            getPostfixArrayAccessIndex(): Expression | undefined {
                if (this.isPostfixArrayAccess()) {
                    return (this.source as PostfixSource).property;
                }
                return undefined;
            }

            getPostfixSource(): PostfixSource | undefined {
                if (this.isPostfix()) {
                    return this.source as PostfixSource;
                }
                return undefined;
            }

            getPrefixKind(): PrefixTypes | undefined {
                if (this.isPrefix()) {
                    return (this.source as PrefixSource).kind;
                }
                return undefined;
            }

            getPrefixSource(): PrefixSource | undefined {
                if (this.isPrefix()) {
                    return this.source as PrefixSource;
                }
                return undefined;
            }

            getPrefixExpression(): Expression | undefined {
                if (this.isPrefix()) {
                    return (this.source as PrefixSource).source;
                }
                return undefined;
            }

            getBinaryKind(): BinaryExpressionKind | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).kind;
                }
                return undefined;
            }

            getBinarySource(): BinarySource | undefined {
                if (this.isBinary()) {
                    return this.source as BinarySource;
                }
                return undefined;
            }

            getBinaryLeft(): Expression | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).left;
                }
                return undefined;
            }

            getBinaryRight(): Expression | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).right;
                }
                return undefined;
            }

            getBinaryOperator(): string | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).operator;
                }
                return undefined;
            }

            getBinaryTernaryCondition(): Expression | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).condition;
                }
                return undefined;
            }

            getBinaryTernaryTrueExpression(): Expression | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).left;
                }
                return undefined;
            }

            getBinaryTernaryFalseExpression(): Expression | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).right;
                }
                return undefined;
            }

            getBinaryAssignmentTarget(): Expression | undefined {
                if (this.isBinary()) {
                    return (this.source as BinarySource).left;
                }
                return undefined;
            }

            getBinaryAssignmentValue(): Expression | undefined {
                if (this.isBinaryAssignment()) {
                    return (this.source as BinarySource).right;
                }
                return undefined;
            }

            getBinaryAssignmentOperator(): string | undefined {
                if (this.isBinaryAssignment()) {
                    return (this.source as BinarySource).operator;
                }
                return undefined;
            }

            getObjectFields(): Field[] | undefined {
                if (this.isObject()) {
                    return (this.source as ObjectSource).fields;
                }
                return undefined;
            }

            getComputeStatments(): Statement[] | undefined {
                if (this.isCompute()) {
                    return (this.source as ComputeSource).statements;
                }
                return undefined;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌───────────────────────────── Is_Primary ───────────────────────────┐

            isUnset(): boolean {
                return this.kind === 'Unset';
            }

            isPrimary(): boolean {
                return this.kind === 'Primary';
            }

            isPrimaryLiteral(): boolean {
                return this.isPrimary() && this.source.kind === 'Literal';
            }

            isPrimaryLiteralArray(): boolean {
                return this.getPrimaryLiteralKind() === 'Array';
            }

            isPrimaryLiteralInteger(): boolean {
                return this.getPrimaryLiteralKind() === 'Integer';
            }

            isPrimaryLiteralFloat(): boolean {
                return this.getPrimaryLiteralKind() === 'Float';
            }

            isPrimaryLiteralBoolean(): boolean {
                return this.getPrimaryLiteralKind() === 'Bool';
            }

            isPrimaryLiteralCharacter(): boolean {
                return this.getPrimaryLiteralKind() === 'Char';
            }

            isPrimaryLiteralString(): boolean {
                return this.getPrimaryLiteralKind() === 'String';
            }

            isPrimaryLiteralNull(): boolean {
                return this.getPrimaryLiteralKind() === 'Null';
            }

            isPrimaryLiteralUndefined(): boolean {
                return this.getPrimaryLiteralKind() === 'Undefined';
            }

            isPrimaryIdentifier(): boolean {
                return this.isPrimary() && this.source.kind === 'Identifier';
            }

            isPrimaryParen(): boolean {
                return this.isPrimary() && this.source.kind === 'Paren';
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌───────────────────────────── Is_Postfix ───────────────────────────┐

            isPostfix(): boolean {
                return this.kind === 'Postfix';
            }

            isPostfixIncrement(): boolean {
                return this.getPostfixKind() === 'Increment';
            }

            isPostfixDecrement(): boolean {
                return this.getPostfixKind() === 'Decrement';
            }

            isPostfixDereference(): boolean {
                return this.getPostfixKind() === 'Dereference';
            }

            isPostfixMemberAccess(): boolean {
                return this.getPostfixKind() === 'MemberAccess';
            }

            isPostfixCall(): boolean {
                return this.getPostfixKind() === 'Call';
            }

            isPostfixArrayAccess(): boolean {
                return this.getPostfixKind() === 'ArrayAccess';
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌───────────────────────────── Is_Prefix ────────────────────────────┐

            isPrefix(): boolean {
                return this.kind === 'Prefix';
            }

            isPrefixIncrement(): boolean {
                return this.getPrefixKind() === 'Increment';
            }

            isPrefixDecrement(): boolean {
                return this.getPrefixKind() === 'Decrement';
            }

            isPrefixReference(): boolean {
                return this.getPrefixKind() === 'Reference';
            }

            isPrefixUnaryMinus(): boolean {
                return this.getPrefixKind() === 'UnaryMinus';
            }

            isPrefixUnaryPlus(): boolean {
                return this.getPrefixKind() === 'UnaryPlus';
            }

            isPrefixLogicalNot(): boolean {
                return this.getPrefixKind() === 'LogicalNot';
            }

            isPrefixBitwiseNot(): boolean {
                return this.getPrefixKind() === 'BitwiseNot';
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌───────────────────────────── Is_Binary ────────────────────────────┐

            isBinary(): boolean {
                return this.kind === 'Binary';
            }

            isBinaryPower(): boolean {
                return this.getBinaryKind() === 'Power';
            }

            isBinaryMultiplicative(): boolean {
                return this.getBinaryKind() === 'Multiplicative';
            }

            isBinaryAdditive(): boolean {
                return this.getBinaryKind() === 'Additive';
            }

            isBinaryShift(): boolean {
                return this.getBinaryKind() === 'Shift';
            }

            isBinaryBitwiseXor(): boolean {
                return this.getBinaryKind() === 'BitwiseXor';
            }

            isBinaryLogicalNot(): boolean {
                // special case
                return (this.getBinaryKind() as PrefixTypes) === 'LogicalNot';
            }

            isBinaryLogicalAnd(): boolean {
                return this.getBinaryKind() === 'LogicalAnd';
            }

            isBinaryLogicalOr(): boolean {
                return this.getBinaryKind() === 'LogicalOr';
            }

            isBinaryRelational(): boolean {
                return this.getBinaryKind() === 'Relational';
            }

            isBinaryEquality(): boolean {
                return this.getBinaryKind() === 'Equality';
            }

            isBinaryTernary(): boolean {
                return this.getBinaryKind() === 'Ternary';
            }

            isBinaryAssignment(): boolean {
                return this.getBinaryKind() === 'Assignment';
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────── Is_Container ──────────────────────────┐

            isObject(): boolean {
                return this.kind === 'Object';
            }

            isCompute(): boolean {
                return this.kind === 'Compute';
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌────────────────────────── Factory : Primary ───────────────────────┐

            static createPrimary(span: Span, source: PrimarySource): Expression {
                return new Expression(span, { kind: 'Primary', source });
            }

            static createPrimaryLiteral(span: Span, type: LiteralTypes, value: LiteralValueTypes): Expression {
                return this.createPrimary(span, { kind: 'Literal', source: { kind: type, value } });
            }

            static createPrimaryLiteralInteger(span: Span, value: number): Expression {
                return this.createPrimaryLiteral(span, 'Integer', value);
            }

            static createPrimaryLiteralFloat(span: Span, value: number): Expression {
                return this.createPrimaryLiteral(span, 'Float', value);
            }

            static createPrimaryLiteralBool(span: Span, value: boolean): Expression {
                return this.createPrimaryLiteral(span, 'Bool', value);
            }

            static createPrimaryLiteralNull(span: Span): Expression {
                return this.createPrimaryLiteral(span, 'Null', null);
            }

            static createPrimaryLiteralUndefined(span: Span): Expression {
                return this.createPrimaryLiteral(span, 'Undefined', undefined);
            }

            static createPrimaryLiteralString(span: Span, value: string): Expression {
                return this.createPrimaryLiteral(span, 'String', value);
            }

            static createPrimaryLiteralCharacter(span: Span, value: string): Expression {
                return this.createPrimaryLiteral(span, 'Char', value);
            }

            static createPrimaryLiteralArray(span: Span, elements: Expression[]): Expression {
                return this.createPrimaryLiteral(span, 'Array', [...elements]);
            }

            static createPrimaryIdentifier(span: Span, value: string, builtin = false): Expression {
                return this.createPrimary(span, { kind: 'Identifier', source: { kind: 'Identifier', value, builtin } });
            }

            static createPrimaryParen(span: Span, expression: Expression): Expression {
                return this.createPrimary(span, { kind: 'Paren', source: { kind: 'Paren', source: expression } });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌────────────────────────── Factory : Postfix ───────────────────────┐

            static createPostfix(span: Span, source: PostfixSource): Expression {
                return new Expression(span, { kind: 'Postfix', source });
            }

            static createPostfixIncrement(span: Span, expression: Expression): Expression {
                return this.createPostfix(span, { kind: 'Increment', source: expression });
            }

            static createPostfixDecrement(span: Span, expression: Expression): Expression {
                return this.createPostfix(span, { kind: 'Decrement', source: expression });
            }

            static createPostfixDereference(span: Span, expression: Expression): Expression {
                return this.createPostfix(span, { kind: 'Dereference', source: expression });
            }

            static createPostfixMemberAccess(span: Span, expression: Expression, property: Expression): Expression {
                return this.createPostfix(span, { kind: 'MemberAccess', source: expression, property });
            }

            static createPostfixCall(span: Span, expression: Expression, args: Expression[]): Expression {
                return this.createPostfix(span, { kind: 'Call', source: expression, args });
            }

            static createPostfixArrayAccess(span: Span, expression: Expression, index: Expression): Expression {
                return this.createPostfix(span, { kind: 'ArrayAccess', source: expression, property: index });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌────────────────────────── Factory : Prefix ────────────────────────┐

            static createPrefix(span: Span, source: PrefixSource): Expression {
                return new Expression(span, { kind: 'Prefix', source });
            }

            static createPrefixIncrement(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'Increment', source: expression });
            }

            static createPrefixDecrement(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'Decrement', source: expression });
            }

            static createPrefixReference(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'Reference', source: expression });
            }

            static createPrefixUnaryMinus(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'UnaryMinus', source: expression });
            }

            static createPrefixUnaryPlus(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'UnaryPlus', source: expression });
            }

            static createPrefixLogicalNot(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'LogicalNot', source: expression });
            }

            static createPrefixBitwiseNot(span: Span, expression: Expression): Expression {
                return this.createPrefix(span, { kind: 'BitwiseNot', source: expression });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌────────────────────────── Factory : Binary ────────────────────────┐

            static createBinary(span: Span, source: BinarySource): Expression {
                return new Expression(span, { kind: 'Binary', source });
            }

            static createBinaryPower(span: Span, left: Expression, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Power', left, right });
            }

            static createBinaryMultiplicative(span: Span, left: Expression, operator: string, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Multiplicative', left, right, operator });
            }

            static createBinaryAdditive(span: Span, left: Expression, operator: string, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Additive', left, right, operator });
            }

            static createBinaryShift(span: Span, left: Expression, operator: string, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Shift', left, right, operator });
            }

            static createBinaryRelational(span: Span, left: Expression, operator: string, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Relational', left, right, operator });
            }

            static createBinaryEquality(span: Span, left: Expression, operator: string, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Equality', left, right, operator });
            }

            static createBinaryBitwiseAnd(span: Span, left: Expression, right: Expression): Expression {
                return this.createBinary(span, { kind: 'BitwiseAnd', left, right });
            }

            static createBinaryBitwiseXor(span: Span, left: Expression, right: Expression): Expression {
                return this.createBinary(span, { kind: 'BitwiseXor', left, right });
            }

            static createBinaryBitwiseOr(span: Span, left: Expression, right: Expression): Expression {
                return this.createBinary(span, { kind: 'BitwiseOr', left, right });
            }

            static createBinaryLogicalAnd(span: Span, left: Expression, right: Expression): Expression {
                return this.createBinary(span, { kind: 'LogicalAnd', left, right });
            }

            static createBinaryLogicalOr(span: Span, left: Expression, right: Expression): Expression {
                return this.createBinary(span, { kind: 'LogicalOr', left, right });
            }

            static createBinaryTernary(span: Span, condition: Expression, trueExpr: Expression, falseExpr: Expression) {
                return new Expression(span, { kind: 'Binary', source: { kind: 'Ternary', condition, left: trueExpr, right: falseExpr }});
            }

            static createBinaryAssignment(span: Span, left: Expression, operator: string, right: Expression): Expression {
                return this.createBinary(span, { kind: 'Assignment', left, right, operator });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌───────────────────────── Factory : Containers ─────────────────────┐

            static createObject(span: Span, fields: Field[]): Expression {
                return new Expression(span, { kind: 'Object', source: { kind: 'Object', fields } });
            }

            static createCompute(span: Span, statements: Statement[]): Expression {
                return new Expression(span, { kind: 'Compute', source: { kind: 'Compute', statements } });
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝