// Identifier.ts — Identifier structure containing name.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Span, NodeVisitor, Node } from './base';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface IdentifierOptions {
        name : string;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Identifier extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : IdentifierOptions = { name: 'Unset' }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            public readonly kind = 'Identifier';
            get name    (): string      { return this.options.name; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            public getChildrenNodes(): readonly Node[] {
                const children: Node[] = [];
                return children;
            }

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitIdentifier) {
                    return visitor.visitIdentifier(this);
                }
                return undefined as T;
            }

            clone(newSpan?: Span): Identifier {
                const cloned = new Identifier(newSpan ?? this.span, this.options);
                return cloned;
            }

            deepClone(): Identifier {
                return this.clone();
            }

            printTree(indent = 0): string {
                const spaces = '  '.repeat(indent);
                return `${spaces}Identifier(${this.name}) (${this.span.start}-${this.span.end})`;
            }

            toString(): string {
                return `Identifier(${this.name})@${this.span.start}:${this.span.end}`;
            }

            validate(): boolean {
                return this.options.name.trim().length > 0;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, name: string): Identifier {
                return new Identifier(span, { name });
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝