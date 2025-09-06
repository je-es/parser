// Helpers.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as parser from '../../../lib/parser';
    import { Result } from '../../../lib/result';
    import * as Program from '../../libs/program/program';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    export const HelpersRules: parser.Types.Rules = [

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                       HELP                                        ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝

            parser.createRule('Identifier',
                parser.seq(
                    parser.optional(parser.token('@')),
                    parser.token('ident'),
                ),
                {
                    build: (data) => {
                        const seq_array = data.getSequenceResult()!;
                        const is_builtin = seq_array[0].isOptionalPassed();
                        const identResult = seq_array[1];
                        return Result.createAsCustom('passed',
                            'identifier',
                            Program.Identifier.create( identResult.span, identResult.getTokenValue()!, is_builtin),
                            data.span
                        );
                    },

                    errors: [ parser.error(0, "Expected identifier") ]
                }
            ),

        // ╔═══════════════════════════════════════════════════════════════════════════════════╗
        // ║                                       ####                                        ║
        // ╚═══════════════════════════════════════════════════════════════════════════════════╝
    ];

// ╚══════════════════════════════════════════════════════════════════════════════════════╝