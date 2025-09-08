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

        result          : Result[];
    }

    export interface SequenceSource {
        source_kind     : 'sequence-source',

        result          : Result[];
    }

    export interface CustomSource {
        source_kind     : 'custom-source',

        tag             : string;
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
            constructor(status?: ResultStatus, source?: ResultSource, mode?: ResultMode, span?: Types.Span) {
                this.status     = status ?? 'unset';
                this.source     = source ?? null;
                this.mode       = mode ?? 'unset';
                this.span       = span ?? { start: -88, end: -88 };
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐



        // └────────────────────────────────────────────────────────────────────┘


        // ┌─────────────────────────────── FACTORY ────────────────────────────┐

            clone() : Result {
                const res = new Result(this.status, this.source, this.mode);
                res.errors = [...this.errors];
                return res;
            }

            static create(status?: ResultStatus, source?: ResultSource, mode?: ResultMode, span?: Types.Span) : Result {
                return new Result(status, source, mode, span);
            }

            static createAsToken(status?: ResultStatus, source?: Types.Token, span?: Types.Span) : Result {
                const newSource : TokenSource = {
                    source_kind : 'token-source',
                    kind        : source?.kind  ?? 'unknown-token',
                    value       : source?.value ?? undefined,
                    span        : source?.span  ?? undefined,
                };
                return Result.create(status, newSource, 'token', span ?? newSource.span);
            }

            static createAsOptional(status?: ResultStatus, source?: Result, span?: Types.Span) : Result {
                const newSource : OptionalSource = {
                    source_kind : 'optional-source',
                    result      : source ?? null
                };

                return Result.create(status, newSource, 'optional', span ?? source?.span);
            }

            static createAsChoice(status?: ResultStatus, source?: Result, index?: number, span?: Types.Span) : Result {
                const newSource : ChoiceSource = {
                    source_kind : 'choice-source',
                    atIndex     : index  ?? -1,
                    result      : source ?? null
                };

                return Result.create(status, newSource, 'choice', span ?? source?.span);
            }

            static createAsRepeat(status?: ResultStatus, source?: Result[], span?: Types.Span) : Result {
                const newSource : RepeatSource = {
                    source_kind : 'repeat-source',
                    result      : source ?? []
                };

                const full_span : Types.Span = { start: -9, end: -9 };
                full_span.start = source && source.length ? source[0].span.start : -8;
                full_span.end = source && source.length ? source[source.length-1].span.end : -7;

                return Result.create(status, newSource, 'repeat', span ?? full_span);
            }

            static createAsSequence(status?: ResultStatus, source?: Result[], span?: Types.Span) : Result {
                const newSource : SequenceSource = {
                    source_kind : 'sequence-source',
                    result      : source ?? []
                };

                const full_span : Types.Span = { start: -6, end: -6 };
                full_span.start = source && source.length ? source[0].span.start : -5;
                full_span.end = source && source.length ? source[source.length-1].span.end : -4;
                return Result.create(status, newSource, 'seq', span ?? full_span);
            }

            static createAsCustom(status?: ResultStatus, name?: string, data?: unknown, span?: Types.Span) : Result {
                const newSource : CustomSource = {
                    source_kind : 'custom-source',
                    tag        : name ?? '',
                    data        : data ?? null
                };

                return Result.create(status, newSource, 'custom', span);
            }

            withError(err: Types.ParseError) : Result {
                this.errors.push(err);
                return this;
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
                        return (this.source as CustomSource).tag == tag;
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

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            hasErrors() : boolean {
                return this.errors.length > 0;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
