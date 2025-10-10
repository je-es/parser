// result.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as Types from './types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type ResultStatus        = 'unset' | 'failed' | 'passed';
    export type ResultMode          = 'unset' | 'token' | 'optional' | 'choice' | 'repeat' | 'seq' | 'custom';

    export interface TokenSource {
        source_kind     : 'token-source';

        kind            : string;
        value          ?: string;
        span           ?: Types.Span;
    }

    export interface OptionalSource {
        source_kind     : 'optional-source';

        result          : Result | null;
    }

    export interface ChoiceSource {
        source_kind     : 'choice-source';

        atIndex         : number;
        result          : Result | null;
    }

    export interface RepeatSource {
        source_kind     : 'repeat-source',

        endsWithSep     : boolean;
        result          : Result[];
    }

    export interface SequenceSource {
        source_kind     : 'sequence-source',

        result          : Result[];
    }

    export interface CustomSource {
        source_kind     : 'custom-source',

        name            : string;
        data            : unknown;
    }

    export type ResultSource = TokenSource | OptionalSource | ChoiceSource | RepeatSource | SequenceSource | CustomSource | null;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Result {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // Core data
            public span         : Types.Span            = { start: -99, end: -99 };
            public status       : ResultStatus          = 'unset';
            public source       : ResultSource          = null;
            public mode         : ResultMode            = 'unset';
            public errors       : Types.ParseError[]    = [];


            // Initialization
            constructor(status: ResultStatus, source: ResultSource | null, mode: ResultMode, span: Types.Span) {
                this.status     = status;
                this.source     = source;
                this.mode       = mode;
                this.span       = span;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── FACTORY ────────────────────────────┐

            static create(status: ResultStatus, source: ResultSource | null, mode: ResultMode, span: Types.Span) : Result {
                return new Result(status, source, mode, span);
            }

            static createAsToken(status: ResultStatus, source: Types.Token | null, span: Types.Span) : Result {
                const newSource : TokenSource = {
                    source_kind : 'token-source',
                    kind        : source?.kind ?? 'unset',
                    value       : source?.value ?? undefined,
                    span        : span,
                };
                return Result.create(status, newSource, 'token', span);
            }

            static createAsOptional(status: ResultStatus, source: Result | null, span: Types.Span) : Result {
                const newSource : OptionalSource = {
                    source_kind : 'optional-source',
                    result      : source
                };

                return Result.create(status, newSource, 'optional', span);
            }

            static createAsChoice(status: ResultStatus, source: Result | null, index: number, span: Types.Span) : Result {
                const newSource : ChoiceSource = {
                    source_kind : 'choice-source',
                    atIndex     : index,
                    result      : source
                };

                return Result.create(status, newSource, 'choice', span);
            }

            static createAsRepeat(status: ResultStatus, source: Result[] | null, span: Types.Span, endsWithSep: boolean = false) : Result {
                const newSource : RepeatSource = {
                    source_kind : 'repeat-source',
                    endsWithSep : endsWithSep,
                    result      : source ?? []
                };

                return Result.create(status, newSource, 'repeat', span);
            }

            static createAsSequence(status: ResultStatus, source: Result[] | null, span: Types.Span) : Result {
                const newSource : SequenceSource = {
                    source_kind : 'sequence-source',
                    result      : source ?? []
                };

                return Result.create(status, newSource, 'seq', span);
            }

            static createAsCustom(status: ResultStatus, name: string, data: unknown, span: Types.Span) : Result {
                const newSource : CustomSource = {
                    source_kind : 'custom-source',
                    name         : name,
                    data        : data,
                };

                return Result.create(status, newSource, 'custom', span);
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── IS_X ──────────────────────────────┐

            isPassed() : boolean {
                return this.status === 'passed';
            }

            isFullyPassed() : boolean {
                if(!this.isPassed()) return false;
                if(this.isOptional() && !this.isOptionalPassed()) return false;
                return true;
            }

            isFailed() : boolean {
                return this.status === 'failed';
            }

            isUnset() : boolean {
                return this.status === 'unset';
            }

            isToken() : boolean {
                return this.mode === 'token';
            }

            isOptional() : boolean {
                return this.mode === 'optional';
            }

            isOptionalPassed() : boolean {
                return this.isOptional() && (this.source as OptionalSource).result !== null;
            }

            isChoice() : boolean {
                return this.mode === 'choice';
            }

            isRepeat() : boolean {
                return this.mode === 'repeat';
            }

            isSequence() : boolean {
                return this.mode === 'seq';
            }

            isCustom(tag?: string) : boolean {
                if(this.mode === 'custom') {
                    if(tag) {
                        return (this.source as CustomSource).name == tag;
                    } else return true;
                }

                return false;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌────────────────────────────── GETTERS ─────────────────────────────┐

            getTokenKind() : string | undefined {
                if(this.isToken()) {
                    return (this.source as TokenSource).kind;
                }

                return undefined;
            }

            getTokenValue() : string | null | undefined {
                if(this.isToken()) {
                    if((this.source as TokenSource).value === undefined) {
                        return null;
                    }

                    return (this.source as TokenSource).value;
                }

                return undefined;
            }

            getTokenSpan() : Types.Span | undefined {
                if(this.isToken()) {
                    return (this.source as TokenSource).span;
                }

                return undefined;
            }

            getTokenData() : Types.Token | undefined {
                if(this.isToken()) {
                    return {
                        kind  : (this.source as TokenSource).kind,
                        value : (this.source as TokenSource).value!,
                        span  : (this.source as TokenSource).span!,
                    };
                }

                return undefined;
            }

            getOptionalResult() : Result | null | undefined {
                if(this.isOptionalPassed()) {
                    return (this.source as OptionalSource).result;
                }

                return undefined;
            }

            getChoiceIndex() : number | undefined {
                if(this.isChoice()) {
                    return (this.source as ChoiceSource).atIndex;
                }

                return undefined;
            }

            getChoiceResult() : Result | null | undefined {
                if(this.isChoice()) {
                    return (this.source as ChoiceSource).result;
                }

                return undefined;
            }

            getRepeatCount() : number | undefined {
                if(this.isRepeat()) {
                    return (this.source as RepeatSource).result.length;
                }

                return undefined;
            }

            getRepeatResult() : Result[] | undefined {
                if(this.isRepeat()) {
                    return (this.source as RepeatSource).result;
                }

                return undefined;
            }

            isRepeatEndsWithSep() : boolean | undefined {
                if(this.isRepeat()) {
                    return (this.source as RepeatSource).endsWithSep;
                }

                return undefined;
            }

            getSequenceCount() : number | undefined {
                if(this.isSequence()) {
                    return (this.source as SequenceSource).result.length;
                }

                return undefined;
            }

            getSequenceResult() : Result[] | undefined {
                if(this.isSequence()) {
                    return (this.source as SequenceSource).result;
                }

                return undefined;
            }

            getCustomData() : unknown | undefined {
                if(this.isCustom()) {
                    return (this.source as CustomSource).data;
                }

                return undefined;
            }

            getCustomName() : string | undefined {
                if(this.isCustom()) {
                    return (this.source as CustomSource).name;
                }

                return undefined;
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            clone() : Result {
                const res = new Result(this.status, this.source, this.mode, this.span);
                res.errors = [...this.errors];
                return res;
            }

            hasErrors() : boolean {
                return this.errors.length > 0;
            }

            withError(err: Types.ParseError) : Result {
                this.errors.push(err);
                return this;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
