// result.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as Types from './types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type ResultStatus        = 'unset' | 'failed' | 'passed';
    export type ResultMode          = 'unset' | 'token' | 'optional' | 'choice' | 'repeat' | 'seq';

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

    export type ResultSource = TokenSource | OptionalSource | ChoiceSource | RepeatSource | SequenceSource | null;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Result {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            // Core data
            public status       : ResultStatus          = 'unset';
            public source       : ResultSource          = null;
            public mode         : ResultMode            = 'unset';
            public errors       : Types.ParseError[]    = [];


            // Initialization
            constructor(status?: ResultStatus, source?: ResultSource, mode?: ResultMode) {
                this.status             = status ?? 'unset';
                this.source             = source ?? null;
                this.mode       = mode ?? 'unset';
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

            static create(status?: ResultStatus, source?: ResultSource, mode?: ResultMode) : Result {
                return new Result(status, source, mode);
            }

            static createAsToken(status?: ResultStatus, source?: Types.Token) : Result {
                const newSource : TokenSource = {
                    source_kind : 'token-source',
                    kind        : source?.kind  ?? 'unknown-token',
                    value       : source?.value ?? undefined,
                    span        : source?.span  ?? undefined,
                };
                return Result.create(status, newSource, 'token');
            }

            static createAsOptional(status?: ResultStatus, source?: Result) : Result {
                const newSource : OptionalSource = {
                    source_kind : 'optional-source',
                    result      : source ?? null
                };

                return Result.create(status, newSource, 'optional');
            }

            static createAsChoice(status?: ResultStatus, source?: Result, index?: number) : Result {
                const newSource : ChoiceSource = {
                    source_kind : 'choice-source',
                    atIndex     : index  ?? -1,
                    result      : source ?? null
                };

                return Result.create(status, newSource, 'choice');
            }

            static createAsRepeat(status?: ResultStatus, source?: Result[]) : Result {
                const newSource : RepeatSource = {
                    source_kind : 'repeat-source',
                    result      : source ?? []
                };

                return Result.create(status, newSource, 'repeat');
            }

            static createAsSequence(status?: ResultStatus, source?: Result[]) : Result {
                const newSource : SequenceSource = {
                    source_kind : 'sequence-source',
                    result      : source ?? []
                };

                return Result.create(status, newSource, 'seq');
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

            isOptionalMatched() : boolean {
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
                if(this.isOptionalMatched()) {
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

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            hasErrors() : boolean {
                return this.errors.length > 0;
            }

        // └────────────────────────────────────────────────────────────────────┘
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
