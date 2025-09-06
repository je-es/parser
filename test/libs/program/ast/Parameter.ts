// Parameter.ts — Parameter structure containing data.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Span, NodeVisitor, Node, DEFAULT_SPAN } from './base';
    import { Type } from './Type';
    import { Identifier } from './Identifier';
    import { Expression } from './Expression';
    import { Statement } from './Statement';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    // ═══════ Parameter ═══════
    export interface ParameterOptions {
        name            : Identifier;
        type           ?: Type;
        initializer    ?: Expression;
        block          ?: Statement;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Parameter extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : ParameterOptions = { name: Identifier.create(DEFAULT_SPAN, 'Unset') }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            public readonly kind = 'Parameter';
            get name    (): string      { return this.options.name!.name; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            public getChildrenNodes(): readonly Node[] {
                const children: Node[] = [];

                if (this.options.name) {children.push(this.options.name);}
                if (this.options.type) {children.push(this.options.type);}
                if (this.options.initializer) {children.push(this.options.initializer);}
                if(this.options.block) {children.push(this.options.block);}

                return children;
            }

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitParameter) {
                    return visitor.visitParameter(this);
                }
                return undefined as T;
            }

            clone(newSpan?: Span): Parameter {
                const cloned = new Parameter(newSpan ?? this.span, this.options);
                return cloned;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, name: Identifier, type ?: Type, initializer ?: Expression, block ?: Statement): Parameter {
                return new Parameter(span, { name, type, initializer, block });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── IS_X ──────────────────────────────┐

            isInitialized(): boolean {
                return this.options.initializer !== undefined;
            }

            isTyped(): boolean {
                return this.options.type !== undefined;
            }

            isBlocked(): boolean {
                return this.options.block !== undefined;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝