// base.ts — Base AST node implementation with visitor pattern and traversal.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Type }         from './Type';
    import { Program }      from './Program';
    import { Module }       from './Module';
    import { Statement }    from './Statement';
    import { Identifier }   from './Identifier';
    import { Parameter }    from './Parameter';
    import { Field }        from './Field';
    import { Expression }   from './Expression';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export interface Diagnostic {
        msg                         : string;
        kind                        : 'error' | 'warning' | 'info';
        span                        ?: Span;
        code                        ?: string;
    }

    export interface Span {
        readonly start          : number;
        readonly end            : number;
        readonly source        ?: string;
    }

    export abstract class Node {
        abstract readonly kind: string;
        abstract readonly span: Span;

        // Visitor pattern implementation
        abstract accept<T>(visitor: NodeVisitor<T>): T;

        // Find descendants matching predicate with proper type guard support
        findAll<U extends Node>(predicate: (node: Node) => node is U): U[];
        findAll(predicate: (node: Node) => boolean): Node[];
        findAll(predicate: (node: Node) => boolean): Node[] {
            const results: Node[] = [];
            this.traverse(node => {
                if (predicate(node)) {results.push(node);}
            });
            return results;
        }

        // Find first descendant matching predicate with proper type guard support
        find<U extends Node>(predicate: (node: Node) => node is U): U | null;
        find(predicate: (node: Node) => boolean): Node | null;
        find(predicate: (node: Node) => boolean): Node | null {
            let result: Node | null = null;
            this.traverse(node => {
                if (!result && predicate(node)) {
                    result = node;
                    return 'stop';
                }
            });
            return result;
        }

        // Depth-first traversal with early termination support and enhanced error handling
        traverse(visitor: (node: Node) => void | 'stop'): void {
            try {
                const result = visitor(this);
                if (result === 'stop') {return;}

                // Get children with proper error handling
                let children: readonly Node[];
                try {
                    children = this.getChildrenNodes();
                } catch (error) {
                    throw new Error(`Failed to get children from ${this.kind} node: ${error}`);
                }

                // Validate children array
                if (!Array.isArray(children)) {
                    throw new Error(`getChildrenNodes() returned non-array from ${this.kind} node: ${typeof children}`);
                }

                // Traverse each child with individual error handling
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];

                    // Validate child
                    if (!child) {
                        console.warn(`Child ${i} is null/undefined in ${this.kind} node`);
                        continue;
                    }

                    if (typeof child !== 'object') {
                        console.warn(`Child ${i} is not an object in ${this.kind} node: ${typeof child}`);
                        continue;
                    }

                    // Check if child is a proper Node
                    if (!('traverse' in child) || typeof child.traverse !== 'function') {
                        console.error(`Child ${i} (${child.constructor?.name || 'unknown'}) of ${this.kind} node is missing traverse method`);
                        console.error('Child object keys:', Object.keys(child));
                        console.error('Child prototype:', Object.getPrototypeOf(child));
                        throw new Error(`Child node ${child.constructor?.name || 'unknown'} missing traverse method`);
                    }

                    // Check if child is actually a Node instance
                    if (!(child instanceof Node)) {
                        console.error(`Child ${i} of ${this.kind} node is not a Node instance:`, child.constructor?.name);
                        throw new Error(`Child ${child.constructor?.name || 'unknown'} is not a Node instance`);
                    }

                    try {
                        child.traverse(visitor);
                    } catch (error) {
                        throw new Error(`Traversal failed at child ${i} (${child.constructor?.name || 'unknown'}) of ${this.kind} node: ${error}`);
                    }
                }
            } catch (error) {
                // Re-throw with context for better debugging
                if (error instanceof Error && error.message.includes('Traversal failed')) {
                    throw error; // Already has context
                }
                throw new Error(`Traversal failed at ${this.kind} node: ${error}`);
            }
        }

        // Pre-order traversal (visit parent before children)
        traversePreOrder(visitor: (node: Node) => void | 'stop'): void {
            this.traverse(visitor);
        }

        // Post-order traversal (visit children before parent)
        traversePostOrder(visitor: (node: Node) => void | 'stop'): void {
            const visitPostOrder = (node: Node): void | 'stop' => {
                // First traverse children
                for (const child of node.getChildrenNodes()) {
                    const result = visitPostOrder(child);
                    if (result === 'stop') {return 'stop';}
                }

                // Then visit current node
                return visitor(node);
            };

            visitPostOrder(this);
        }

        // Get direct children (must be implemented by subclasses)
        // Made public to fix the access issue
        abstract getChildrenNodes(): readonly Node[];

        // Check if this node has any children
        hasChildren(): boolean {
            try {
                return this.getChildrenNodes().length > 0;
            } catch {
                return false;
            }
        }

        // Check if this node is a leaf (no children)
        isLeaf(): boolean {
            return !this.hasChildren();
        }

        // Get the depth of this node (maximum distance to any leaf)
        getDepth(): number {
            if (this.isLeaf()) {return 0;}

            let maxDepth = 0;
            try {
                for (const child of this.getChildrenNodes()) {
                    maxDepth = Math.max(maxDepth, child.getDepth());
                }
            } catch (error) {
                console.warn(`Error getting depth for ${this.kind} node:`, error);
                return 0;
            }

            return maxDepth + 1;
        }

        // Count total number of descendant nodes (including self)
        getNodeCount(): number {
            let count = 1; // Count self
            try {
                this.traverse(node => {
                    if (node !== this) {count++;}
                });
            } catch (error) {
                console.warn(`Error counting nodes for ${this.kind} node:`, error);
            }
            return count;
        }

        // Get all ancestor types in the tree
        getNodeTypes(): Set<string> {
            const types = new Set<string>();
            try {
                this.traverse(node => {
                    types.add(node.kind);
                });
            } catch (error) {
                console.warn(`Error getting node types for ${this.kind} node:`, error);
                types.add(this.kind); // At least add this node's type
            }
            return types;
        }

        // Utility for creating spans that encompass multiple nodes
        protected static spanFromNodes(nodes: readonly Node[]): Span {
            if (nodes.length === 0) {
                return { start: 0, end: 0 };
            }

            const start = Math.min(...nodes.map(n => n.span.start));
            const end = Math.max(...nodes.map(n => n.span.end));

            return { start, end };
        }

        // Utility for merging two spans
        protected static spanMerge(span1: Span, span2: Span): Span {
            return {
                start: Math.min(span1.start, span2.start),
                end: Math.max(span1.end, span2.end),
                source: span1.source || span2.source
            };
        }

        // Clone node (shallow copy with new span)
        abstract clone(newSpan?: Span): Node;

        // Create a deep clone of the entire subtree
        deepClone(newSpan?: Span): Node {
            // This is a default implementation that subclasses can override for optimization
            const cloned = this.clone(newSpan);

            // Note: Subclasses should override this method to handle their specific child cloning
            // This is a fallback that just returns a shallow clone
            return cloned;
        }

        // Validation method that subclasses can override
        validate(): boolean {
            try {
                // Basic validation: ensure all children are valid
                const children = this.getChildrenNodes();
                for (const child of children) {
                    if (!child || !child.validate()) {
                        return false;
                    }
                }
                return true;
            } catch (error) {
                console.warn(`Validation error for ${this.kind} node:`, error);
                return false;
            }
        }

        // String representation for debugging
        toString(): string {
            return `${this.kind}@${this.span.start}:${this.span.end}`;
        }

        // Pretty print the AST structure with better error handling
        printTree(indent = 0): string {
            const spaces = '  '.repeat(indent);
            const nodeInfo = `${spaces}${this.kind} (${this.span.start}-${this.span.end})`;

            try {
                if (this.isLeaf()) {
                    return nodeInfo;
                }

                const children = this.getChildrenNodes()
                    .map(child => {
                        try {
                            return child.printTree(indent + 1);
                        } catch (error) {
                            return `${spaces}  ERROR: ${child?.constructor?.name || 'unknown'} - ${error}`;
                        }
                    })
                    .join('\n');

                return `${nodeInfo}\n${children}`;
            } catch (error) {
                return `${nodeInfo} [ERROR: ${error}]`;
            }
        }

        // Check structural equality with another node (ignoring spans)
        structurallyEquals(other: Node): boolean {
            if (this.kind !== other.kind) {return false;}

            try {
                const thisChildren = this.getChildrenNodes();
                const otherChildren = other.getChildrenNodes();

                if (thisChildren.length !== otherChildren.length) {return false;}

                return thisChildren.every((child, index) =>
                    child.structurallyEquals(otherChildren[index])
                );
            } catch {
                return false;
            }
        }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface NodeVisitor<T = void> {
        visitType       ?(node: Type): T;
        visitProgram    ?(node: Program): T;
        visitModule     ?(node: Module): T;
        visitStatement  ?(node: Statement): T;
        visitIdentifier ?(node: Identifier): T;
        visitParameter  ?(node: Parameter): T;
        visitField      ?(node: Field): T;
        visitExpression ?(node: Expression): T;
        visit           ?(node: Node): T;
    }

    export interface ProgramAnalysisResult<T = void> {
        readonly success        : boolean;
        readonly value         ?: T;
        readonly diagnostics    : readonly Diagnostic[];
    }

    // Default span for synthetic nodes
    export const DEFAULT_SPAN : Span = { start: 0, end: 0 };

// ╚══════════════════════════════════════════════════════════════════════════════════════╝