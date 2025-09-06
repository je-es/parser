// Type.ts — Type structure containing types (FIXED VERSION)
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Node, Span, NodeVisitor, DEFAULT_SPAN } from './base';
    import { Expression } from './Expression';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ META ════════════════════════════════════════╗

    export type TypeKind =
        | 'Unset'       | 'Primitive'   | 'Identifier'  | 'Pointer'
        | 'Array'       | 'Tuple'       | 'Function'    | 'Optional'
        | 'Struct'      | 'Enum'        | 'Union'       ;

    export type PrimitiveTypeKind =
        | 'Type'        | 'Void'        | 'Any'         | 'Auto'
        | 'Bool'        | 'Signed'      | 'Unsigned'    | 'Float'
        | 'Undefined'   | 'Null'        | 'Comptime_int'| 'Comptime_float';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface PrimitiveSource {
        kind             : PrimitiveTypeKind;
        text?            : string;
        width?           : number;
    }

    export interface IdentifierSource {
        value           : string;
    }

    export interface OptionalSource {
        target           : Type;
    }

    export interface PointerSource {
        target           : Type;
        mutable          : boolean;
    }

    export interface ArraySource {
        target           : Type;
        size            ?: Expression;
    }

    export interface TupleSource {
        fields           : Type[];
    }

    export interface TypeOptions {
        kind             : TypeKind;
        source?          : TypeSource;
    }

    export type TypeSource = PrimitiveSource | IdentifierSource | OptionalSource | PointerSource | ArraySource | TupleSource;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Type extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : TypeOptions = { kind: 'Unset' }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            get kind                (): TypeKind    { return this.options.kind; }
            get source              (): TypeSource  { return this.options.source!; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitType) { return visitor.visitType(this); }
                return undefined as T;
            }

            getChildrenNodes(): readonly Node[] {
                const children: Node[] = [];
                if (!this.options.source) {return children;}

                switch (this.kind) {
                    case 'Pointer': {
                        const src = this.source as PointerSource;
                        if (src.target) {children.push(src.target);}
                        break;
                    }
                    case 'Optional': {
                        const src = this.source as OptionalSource;
                        if (src.target) {children.push(src.target);}
                        break;
                    }
                    case 'Array': {
                        const src = this.source as ArraySource;
                        if (src.target) {children.push(src.target);}
                        if (src.size) {children.push(src.size);}
                        break;
                    }
                    case 'Tuple': {
                        const src = this.source as TupleSource;
                        if (src.fields) {children.push(...src.fields);}
                        break;
                    }
                    // For future: add Union, Function, Struct, Enum, etc.
                }
                return children;
            }

            clone(newSpan?: Span): Type {
                return new Type(newSpan ?? this.span, this.options);
            }

            toString(): string {
                return `Type(${this.kind}, ${JSON.stringify(this.source)})`;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            static calcPrimitiveWidth(prefix: string, text: string): number {
                // Check if text starts with the prefix
                if (!text.startsWith(prefix)) {return 0;}

                // Extract the numeric part after the prefix
                const numericPart = text.slice(prefix.length);

                // Convert to number
                const width = parseInt(numericPart, 10);

                // Check if the conversion was successful
                if (isNaN(width)) {return 0;}

                return width;
            }

            getPrimitiveKind(): PrimitiveTypeKind | undefined {
                if (this.isPrimitive()) {return (this.source as PrimitiveSource).kind;}
                return undefined;
            }
            getPrimitiveText(): string | undefined {
                if (this.isPrimitive()) {return (this.source as PrimitiveSource).text;}
                return undefined;
            }
            getPrimitiveWidth(): number | undefined {
                if (this.isPrimitive()) {return (this.source as PrimitiveSource).width;}
                return undefined;
            }
            getIdentifierName(): string | undefined {
                if (this.isIdentifier()) {return (this.source as IdentifierSource).value;}
                return undefined;
            }
            getPointerTarget(): Type | undefined {
                if (this.isPointer()) {return (this.source as PointerSource).target;}
                return undefined;
            }
            getPointerMutable(): boolean | undefined {
                if (this.isPointer()) {return (this.source as PointerSource).mutable;}
                return undefined;
            }
            getOptionalTarget(): Type | undefined {
                if (this.isOptional()) {return (this.source as OptionalSource).target;}
                return undefined;
            }
            getArrayElementType(): Type | undefined {
                if (this.isArray()) {return (this.source as ArraySource).target;}
                return undefined;
            }
            getArraySize(): import('./Expression').Expression | undefined {
                if (this.isArray()) {return (this.source as ArraySource).size;}
                return undefined;
            }
            getTupleFields(): Type[] | undefined {
                if (this.isTuple()) {return (this.source as TupleSource).fields;}
                return undefined;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, options: TypeOptions): Type {
                return new Type(span, options);
            }

            static createPrimitive(span: Span, kind: PrimitiveTypeKind, text?: string, width?: number): Type {
                return new Type(span, { kind: 'Primitive', source: { kind, text, width } });
            }

            static createPrimitiveVoid(span: Span): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Void' } });
            }

            static createPrimitiveAuto(span: Span = DEFAULT_SPAN): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Auto' } });
            }

            static createPrimitiveSigned(span: Span, text: string, width ?: number): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Signed', text, width: width ? width : this.calcPrimitiveWidth('i', text) } });
            }

            static createPrimitiveUnsigned(span: Span, text: string, width ?: number): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Unsigned', text, width: width ? width : this.calcPrimitiveWidth('u', text) } });
            }

            static createPrimitiveFloat(span: Span, text: string, width ?: number): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Float', text, width: width ? width : this.calcPrimitiveWidth('f', text) } });
            }

            static createPrimitiveNull(span: Span): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Null' } });
            }

            static createPrimitiveUndefined(span: Span): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Undefined' } });
            }

            static createPrimitiveBool(span: Span): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Bool' } });
            }

            static createPrimitiveType(span: Span): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Type'} });
            }

            static createPrimitiveAny(span: Span): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Any' } });
            }

            static createPrimitiveComptimeInt(span: Span, text: string): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Comptime_int', text, width: 0 } });
            }

            static createPrimitiveComptimeFloat(span: Span, text: string): Type {
                return new Type(span, { kind: 'Primitive', source: { kind: 'Comptime_float', text, width: 0 } });
            }

            static createIdentifier(span: Span, name: string): Type {
                return new Type(span, { kind: 'Identifier', source: { value: name } });
            }

            static createPointer(span: Span, target: Type, mutable: boolean): Type {
                return new Type(span, { kind: 'Pointer', source: { target, mutable } });
            }

            static createOptional(span: Span, target: Type): Type {
                return new Type(span, { kind: 'Optional', source: { target } });
            }

            static createArray(span: Span, target: Type, size?: Expression): Type {
                return new Type(span, { kind: 'Array', source: { target, size } });
            }

            static createTuple(span: Span, fields: Type[]): Type {
                return new Type(span, { kind: 'Tuple', source: { fields } });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── IS_X ──────────────────────────────┐

            isUnset(): boolean{
                return this.kind === 'Unset';
            }

            isPrimitive(): boolean {
                return this.kind === 'Primitive';
            }

            isPrimitiveVoid(): boolean {
                return this.isPrimitive() && ['Void'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveAuto(): boolean {
                return this.isPrimitive() && ['Auto'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveAny(): boolean {
                return this.isPrimitive() && ['Any'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveType(): boolean {
                return this.isPrimitive() && ['Type'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveNull(): boolean {
                return this.isPrimitive() && ['Null'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveUndefined(): boolean {
                return this.isPrimitive() && ['Undefined'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveSigned(): boolean {
                return this.isPrimitive() && ['Signed'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveUnsigned(): boolean {
                return this.isPrimitive() && ['Unsigned'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveComptimeInt(): boolean {
                return this.isPrimitive() && ['Comptime_int'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveComptimeFloat(): boolean {
                return this.isPrimitive() && ['Comptime_float'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveFloat(): boolean {
                return this.isPrimitive() && ['Float'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveInteger(): boolean {
                return this.isPrimitive() && ['Signed', 'Unsigned', 'Comptime_int'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveNumeric(): boolean {
                return this.isPrimitive() && ['Signed', 'Unsigned', 'Float', 'Comptime_int', 'Comptime_float'].includes((this.source as PrimitiveSource).kind);
            }

            isPrimitiveBool(): boolean {
                return this.isPrimitive() && ['Bool'].includes((this.source as PrimitiveSource).kind);
            }

            isIdentifier(): boolean {
                return this.kind === 'Identifier';
            }

            isPointer(): boolean {
                return this.kind === 'Pointer';
            }

            isOptional(): boolean {
                return this.kind === 'Optional';
            }

            isArray(): boolean {
                return this.kind === 'Array';
            }

            isTuple(): boolean {
                return this.kind === 'Tuple';
            }

            isSameAs(other: Type): boolean {
                if (this.kind !== other.kind) {return false;}

                switch (this.kind) {
                    case 'Primitive':
                        { const thisPrim = this.source as PrimitiveSource;
                        const otherPrim = other.source as PrimitiveSource;
                        return thisPrim.kind === otherPrim.kind &&
                               thisPrim.width === otherPrim.width; }
                    case 'Identifier':
                        return (this.source as IdentifierSource).value === (other.source as IdentifierSource).value;
                    case 'Array':
                        { const thisArray = this.source as ArraySource;
                        const otherArray = other.source as ArraySource;
                        return thisArray.target.isSameAs(otherArray.target); }
                    case 'Pointer':
                        { const thisPointer = this.source as PointerSource;
                        const otherPointer = other.source as PointerSource;
                        return thisPointer.target.isSameAs(otherPointer.target) &&
                            thisPointer.mutable === otherPointer.mutable; }
                    case 'Optional':
                        { const thisOptional = this.source as OptionalSource;
                        const otherOptional = other.source as OptionalSource;
                        return thisOptional.target.isSameAs(otherOptional.target); }
                    case 'Tuple':
                        { const thisTuple = this.source as TupleSource;
                        const otherTuple = other.source as TupleSource;
                        if (thisTuple.fields.length !== otherTuple.fields.length) {return false;}
                        return thisTuple.fields.every((field, index) =>
                            field.isSameAs(otherTuple.fields[index])); }
                    default:
                        return false;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝