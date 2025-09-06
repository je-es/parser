// Program.ts — Program structure containing modules.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Node } from './base';
    import { Module } from './Module';
    import type { Span, NodeVisitor, ProgramAnalysisResult, Diagnostic } from './base';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    interface ProgramOptions {
        entryModule?    : string;
        metadata?       : Record<string, unknown>;
        modules?        : ReadonlyMap<string, Module>;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Program extends Node {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            constructor(
                public readonly span        : Span,
                public readonly options     : ProgramOptions = { modules: new Map() }
            ) { super(); }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── DATA ──────────────────────────────┐

            public readonly kind = 'Program';
            get modules         (): ReadonlyMap<string, Module>     { return this.options.modules!; }
            get entryModule     (): string | undefined              { return this.options.entryModule; }
            get metadata        (): Record<string, unknown>         { return this.options.metadata ?? {}; }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── VISIT ──────────────────────────────┐

            accept<T>(visitor: NodeVisitor<T>): T {
                if (visitor.visitProgram) {
                    return visitor.visitProgram(this);
                }
                return undefined as T;
            }

            getChildrenNodes(): readonly Node[] {
                return Array.from(this.modules.values());
            }

            clone(newSpan?: Span): Program {
                return new Program(newSpan ?? this.span, this.options);
            }

            validateProgram(): ProgramAnalysisResult<void> {
                const diagnostics    : Diagnostic[] = [];

                // Check for empty program
                if (this.isEmpty()) {
                    diagnostics.push({
                        kind    : 'warning',
                        span    : this.span,
                        msg     : 'Program is empty',
                        code    : 'W_EMPTY_PROGRAM'
                    });
                }

                // Validate entry module exists
                if (this.entryModule && !this.hasModule(this.entryModule)) {
                    diagnostics.push({
                        kind    : 'error',
                        span    : this.span,
                        msg     : `Entry module '${this.entryModule}' not found`,
                        code    : 'E_ENTRY_MODULE_NOT_FOUND'
                    });
                    // Early return since we can't proceed without the entry module
                    return {
                        success     : false,
                        diagnostics : diagnostics,
                    };
                }

                // Validate module names are unique (already guaranteed by Map structure)
                // Validate each module
                for (const [name, module] of this.modules) {
                    try {
                        // Basic module validation could go here
                        if (module.statements.length === 0) {
                            diagnostics.push({
                                kind    : 'warning',
                                span    : module.span,
                                msg     : `Module '${name}' is empty`,
                                code    : 'W_EMPTY_MODULE'
                            });
                        }
                    } catch (error) {
                        diagnostics.push({
                            kind        : 'error',
                            span        : module.span,
                            msg         : `Module '${name}' validation failed: ${error}`,
                            code        : 'E_MODULE_VALIDATION_FAILED'
                        });
                    }
                }

                // Validate entry point module contains public main function
                if (this.entryModule) {
                    const entryModule = this.getModule(this.entryModule);
                    if (!entryModule) {
                        diagnostics.push({
                            kind: 'error',
                            span: this.span,
                            msg: `Entry module '${this.entryModule}' not found`,
                            code: 'E_ENTRY_MODULE_NOT_FOUND'
                        });
                    } else {
                        // Look for public main function
                        const publicMainFunction = entryModule.findFunction('main', true);
                        if (!publicMainFunction) {
                            // Check if there's a private main function
                            const privateMainFunction = entryModule.findFunction('main', false);
                            if(privateMainFunction && !privateMainFunction.isPublicFunction()) {
                                diagnostics.push({
                                    kind: 'error',
                                    span: entryModule.span,
                                    msg: `Entry module '${this.entryModule}' contains private 'main' function`,
                                    code: 'E_ENTRY_MODULE_PRIVATE_MAIN'
                                });
                            } else {
                                diagnostics.push({
                                    kind: 'error',
                                    span: entryModule.span,
                                    msg: `Entry module '${this.entryModule}' does not contain public 'main' function`,
                                    code: 'E_ENTRY_MODULE_NO_MAIN'
                                });
                            }
                        }
                    }
                }

                return {
                    success: diagnostics.length === 0,
                    diagnostics: diagnostics,
                };
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            isEmpty(): boolean {
                return this.modules.size === 0 ||
                    Array.from(this.modules.values()).every(m => m.statements.length === 0);
            }

            getModule(name: string): Module | undefined {
                return this.modules.get(name);
            }

            getModuleNames(): string[] {
                return Array.from(this.modules.keys());
            }

            getEntryModuleInstance(): Module | undefined {
                return this.entryModule ? this.getModule(this.entryModule) : undefined;
            }

            getTotalModules(): number {
                return this.modules.size;
            }

            getTotalStatements(): number {
                return Array.from(this.modules.values())
                    .reduce((total, module) => total + module.statements.length, 0);
            }

            getTotalNodes(): number {
                let count = this.modules.size; // Count modules themselves
                for (const module of this.modules.values()) {
                    count += this.countNodesInSubtree(module);
                }
                return count;
            }

            countNodesInSubtree(node: Node): number {
                let count = 0;
                node.traverse(() => void (count++));
                return count - 1; // Subtract 1 to not count the root node twice
            }

            hasModule(name: string): boolean {
                return this.modules.has(name);
            }

            findModules(predicate: (module: Module, name: string) => boolean): [string, Module][] {
                const results: [string, Module][] = [];
                for (const [name, module] of this.modules) {
                    if (predicate(module, name)) {
                        results.push([name, module]);
                    }
                }
                return results;
            }

            findModule(predicate: (module: Module, name: string) => boolean): [string, Module] | undefined {
                for (const [name, module] of this.modules) {
                    if (predicate(module, name)) {
                        return [name, module];
                    }
                }
                return undefined;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── Factory ────────────────────────────┐

            static create(span: Span, entryModule?: string): Program {
                const options: ProgramOptions = { modules: new Map() };
                if (entryModule) {options.entryModule = entryModule;}

                return new Program(span, options);
            }

            static fromModules(
                span: Span,
                modules: readonly [string, Module][],
                entryModule?: string
            ): Program {
                const moduleMap = new Map(modules);
                const options: ProgramOptions = { modules: moduleMap };

                if (entryModule) {
                    if (!moduleMap.has(entryModule)) {
                        throw new Error(`Entry module '${entryModule}' not found in provided modules`);
                    }
                    options.entryModule = entryModule;
                }

                return new Program(span, options);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── Query ─────────────────────────────┐

            withModule(name: string, module: Module): Program {
                if (!name.trim()) { throw new Error('Module name cannot be empty'); }
                const newModules = new Map(this.modules);
                newModules.set(name, module);
                return new Program(this.span, { modules: newModules });
            }

            withModules(moduleEntries: readonly [string, Module][]): Program {
                const newModules = new Map(this.modules);
                for (const [name, module] of moduleEntries) {
                    if (!name.trim()) { throw new Error('Module name cannot be empty'); }
                    newModules.set(name, module);
                }
                return new Program(this.span, { modules: newModules });
            }

            removeModule(name: string): Program {
                if (!this.modules.has(name)) {return this;}

                const newModules = new Map(this.modules);
                newModules.delete(name);
                return new Program(this.span, { modules: newModules });
            }

            withEntryModule(entryModule: string): Program {
                if (!this.modules.has(entryModule)) {
                    throw new Error(`Entry module '${entryModule}' not found in program`);
                }

                const newData = { ...this.options, entryModule };
                return new Program(this.span, { modules: this.modules, ...newData });
            }

            withMetadata(metadata: Record<string, unknown>): Program {
                const newData = { ...this.options, metadata: { ...this.options.metadata, ...metadata } };
                return new Program(this.span, { modules: this.modules, ...newData });
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝