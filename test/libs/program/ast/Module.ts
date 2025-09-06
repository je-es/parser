// Module.ts — Module structure containing statements.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Node, Span, NodeVisitor } from './base';
    import { Statement, StatementKind } from './Statement';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export interface ModuleOptions {
        name            : string;
        statements      : readonly Statement[];
        exports?        : readonly string[];
        imports?        : readonly string[];
        metadata?       : Record<string, unknown>;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Module extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : ModuleOptions = { name: '', statements: [] }
            ) { super();}

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            public readonly kind = 'Module';
            get name            (): string                      { return this.options.name; }
            get statements      (): readonly Statement[]        { return this.options.statements; }
            get exports         (): readonly string[]           { return this.options.exports ?? []; }
            get imports         (): readonly string[]           { return this.options.imports ?? []; }
            get metadata        (): Record<string, unknown>     { return this.options.metadata ?? {}; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitModule) {
                    return visitor.visitModule(this);
                }
                return undefined as T;
            }

            getChildrenNodes(): readonly Node[] {
                return this.statements;
            }

            clone(newSpan?: Span): Module {
                return new Module(newSpan ?? this.span, this.options);
            }

            deepClone(newSpan?: Span): Module {
                const clonedStatements = this.statements.map(stmt =>
                    stmt.deepClone ? stmt.deepClone() : stmt.clone()
                ).filter(stmt => stmt instanceof Statement);

                return new Module(newSpan ?? this.span, {
                    ...this.options,
                    statements: clonedStatements
                });
            }

            toString(): string {
                return `Module(${this.name})[${this.statements.length} statements]@${this.span.start}:${this.span.end}`;
            }

            printTree(indent = 0): string {
                const spaces = '  '.repeat(indent);
                const moduleInfo = `${spaces}${this.kind}(${this.name}) (${this.span.start}-${this.span.end})`;

                if (this.statements.length === 0) {
                    return `${moduleInfo} [empty]`;
                }

                const statements = this.statements
                    .map(stmt => stmt.printTree(indent + 1))
                    .join('\n');

                return `${moduleInfo}\n${statements}`;
            }

            validate(): boolean {
                try {
                    // Validate module name
                    if (!this.name.trim()) {return false;}

                    // Validate all statements
                    return this.statements.every(stmt => stmt.validate());
                } catch {
                    return false;
                }
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            getStatementCount(): number {
                return this.statements.length;
            }

            isEmpty(): boolean {
                return this.statements.length === 0;
            }

            getTotalNodes(): number {
                let count = 1; // Count self
                for (const statement of this.statements) {
                    const countt = 0;
                    statement.traverse(() => void (count++));
                    count += countt;
                }
                return count;
            }

            findStatements(predicate: (stmt: Statement) => boolean): Statement[] {
                return this.statements.filter(predicate);
            }

            findStatement(predicate: (stmt: Statement) => boolean): Statement | undefined {
                return this.statements.find(predicate);
            }

            findStatementsByKind(kind: StatementKind): Statement[] {
                return this.statements.filter(stmt => stmt.kind === kind);
            }

            getStatementAt(index: number): Statement | undefined {
                if (index < 0 || index >= this.statements.length) {
                    return undefined;
                }
                return this.statements[index];
            }

            getStatementIndex(statement: Statement): number {
                return this.statements.indexOf(statement);
            }

            hasStatement(statement: Statement): boolean {
                return this.statements.includes(statement);
            }

            findFunction(name: string, publicOnly = false): Statement | undefined {
                // console.warn(`we are here, searching for ${name} {${publicOnly}}`)
                // console.warn(this.statements)
                return this.statements.find(stmt => {
                    const funcName = stmt.getFunctionName();
                    // console.log(`Found stmts '${funcName}', isPublic: ${stmt.isPublicFunction()}`);

                    if (funcName === name) {
                        if (publicOnly && !stmt.isPublicFunction()) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, name: string): Module {
                return new Module(span, { name, statements: [] });
            }

            static fromStatements(
                span: Span,
                name: string,
                statements: readonly Statement[]
            ): Module {
                return new Module(span, { name, statements });
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── Query ─────────────────────────────┐

            withStatement(statement: Statement): Module {
                return new Module(
                    this.span,
                    {
                        ...this.options,
                        statements: [...this.statements, statement]
                    }
                );
            }

            withStatements(...statements: Statement[]): Module {
                return new Module(
                    this.span,
                    {
                        ...this.options,
                        statements: [...this.statements, ...statements]
                    }
                );
            }

            replaceStatement(index: number, statement: Statement): Module {
                if (index < 0 || index >= this.statements.length) {
                    throw new Error(`Statement index ${index} out of bounds (0-${this.statements.length - 1})`);
                }

                const newStatements = [...this.statements];
                newStatements[index] = statement;
                return new Module(this.span, { ...this.options, statements: newStatements });
            }

            removeStatement(index: number): Module {
                if (index < 0 || index >= this.statements.length) {
                    throw new Error(`Statement index ${index} out of bounds (0-${this.statements.length - 1})`);
                }

                const newStatements = [...this.statements];
                newStatements.splice(index, 1);
                return new Module(this.span, { ...this.options, statements: newStatements });
            }

            insertStatement(index: number, statement: Statement): Module {
                if (index < 0 || index > this.statements.length) {
                    throw new Error(`Statement index ${index} out of bounds (0-${this.statements.length})`);
                }

                const newStatements = [...this.statements];
                newStatements.splice(index, 0, statement);
                return new Module(this.span, { ...this.options, statements: newStatements });
            }

            withExports(exports: readonly string[]): Module {
                const newData = { ...this.options, exports: [...exports] };
                return new Module(this.span, { ...this.options, ...newData });
            }

            withImports(imports: readonly string[]): Module {
                const newData = { ...this.options, imports: [...imports] };
                return new Module(this.span, { ...this.options, ...newData });
            }

            withMetadata(metadata: Record<string, unknown>): Module {
                const newData = {
                    ...this.options,
                    metadata: { ...this.options.metadata, ...metadata }
                };
                return new Module(this.span, { ...this.options, ...newData });
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝