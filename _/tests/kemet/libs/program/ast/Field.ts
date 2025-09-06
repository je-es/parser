// Field.ts — Parameter structure containing data.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Span, NodeVisitor, Node, DEFAULT_SPAN } from './base';
    import { Identifier } from './Identifier';
    import { Expression } from './Expression';
    import { Statement } from './Statement';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    // ═══════ Parameter ═══════
    export interface FieldOptions {
        name            : Identifier;
        initializer    ?: Expression;
        block          ?: Statement;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Field extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : FieldOptions = { name: Identifier.create(DEFAULT_SPAN, 'Unset') }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            public readonly kind = 'Field';
            get name    (): string      { return this.options.name!.name; }
            get initializer (): Expression | undefined { return this.options.initializer; }
            get block (): Statement | undefined { return this.options.block; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            public getChildrenNodes(): readonly Node[] {
                const children: Node[] = [];

                if (this.options.name) {children.push(this.options.name);}
                if (this.options.initializer) {children.push(this.options.initializer);}
                if(this.options.block) {children.push(this.options.block);}

                return children;
            }

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitField) {
                    return visitor.visitField(this);
                }
                return undefined as T;
            }

            clone(newSpan?: Span): Field {
                const cloned = new Field(newSpan ?? this.span, this.options);
                return cloned;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, name: Identifier, initializer ?: Expression, block ?: Statement): Field {
                return new Field(span, { name, initializer, block });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── IS_X ──────────────────────────────┐

            isInitialized(): boolean {
                return this.options.initializer !== undefined;
            }

            isBlocked(): boolean {
                return this.options.block !== undefined;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝