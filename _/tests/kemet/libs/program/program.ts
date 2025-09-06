/* eslint-disable @typescript-eslint/no-explicit-any */
// program.ts — A type-safe, performant program representation library
//              with comprehensive semantic analysis for programming languages.
//
// repo   : https://github.com/je-es/program
// author : https://github.com/maysara-elshewehy
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Program } from './ast/Program';
    import { Module } from './ast/Module';
    import type { Span } from './ast/base';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export { Node }                 from './ast/base';
    export { Program }              from './ast/Program';
    export { Module }               from './ast/Module';
    export { Statement }            from './ast/Statement';
    export { Expression }           from './ast/Expression';
    export { Identifier }           from './ast/Identifier';
    export { Type }                 from './ast/Type';
    export { Parameter }            from './ast/Parameter';
    export { Field }                from './ast/Field';

    // Configuration options for program builder
    export interface ProgramConfig {
        entryModule     ?: string;
        metadata        ?: Record<string, any>;
        options         ?: Record<string, boolean>;
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class ProgramBuilder {
        private modules = new Map<string, Module>();
        private config: ProgramConfig;

        constructor(config: ProgramConfig = {}) {
            this.config = config;
        }

        addModule(name: string, module: Module): this {
            this.modules.set(name, module);
            return this;
        }

        build(): Program {
            const span: Span = { start: 0, end: 0 };
            const program = new Program(span, { modules: this.modules });

            if (this.config.entryModule) {
                return program.withEntryModule(this.config.entryModule);
            }

            return program;
        }
    }

    export function createProgram(config?: ProgramConfig): ProgramBuilder {
        return new ProgramBuilder(config);
    }

    export function span(start: number, end: number, source?: string): Span {
        return { start, end, source };
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝