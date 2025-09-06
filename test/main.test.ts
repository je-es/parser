// main.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as lexer from '@je-es/lexer';
    import * as parser from '../lib/parser';
    import * as Types from '../lib/types';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗


// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe("Basics", () => {

        const tokensRules : lexer.Rules = {
            'val'       : /\d+/,
            'other'     : ['other'],
            'end'       : ';',
            'comma'     : ',',
            'ws'        : /\s+/,
        };

        const parserSettings : Types.ParserSettings = {
            startRule       : 'myToken',
            ignored         : ['ws'],
            debug           : 'off',
            errorRecovery   : {
                mode        : 'strict',
                maxErrors   : 1,
            }
        };

        describe("createRule & Token Pattern & Strict Mode & Resilient Mode & Silent Mode", () => {

            const parserRules : Types.Rules = [
                parser.createRule('myToken', parser.token('val') ),
            ];

            test("should parse tokens correctly", () => {
                const input = '0';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null, 2));

                // Testing by Result Class
                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isPassed()).toEqual(true);
                expect(res.ast[0].isToken()).toEqual(true);
                expect(res.ast[0].getTokenKind()).toEqual('val');
                expect(res.ast[0].getTokenValue()).toEqual('0');
                expect(res.ast[0].getTokenSpan()).toEqual({ start: 0, end: 1 });
            });

            test("Errors : Strict Mode", () => {
                const input = 'x';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                expect(res.ast.length).toEqual(0);
                expect(res.errors).toEqual([{
                    code: "LEXICAL_ERROR",
                    msg : "Unexpected token 'x'",
                    span: { start: 0, end: 1 },
                    failedAt: 0,
                    tokenIndex: 0,
                    prevRule: "unknown",
                    prevInnerRule: "unknown",
                }]);
            });

            test("Errors : Strict Mode & Silent Mode", () => {
                const _parserRules : Types.Rules = [
                    parser.createRule('myToken', parser.token('val'), { silent: true } ),
                ];

                const input = 'x';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, _parserRules, parserSettings);
                expect(res.ast.length).toEqual(0);
                expect(res.errors).toEqual([
                    {
                        code: "LEXICAL_ERROR",
                        msg : "Unexpected token 'x'",
                        span: { start: 0, end: 1 },
                        failedAt: 0,
                        tokenIndex: 0,
                        prevRule: "unknown",
                        prevInnerRule: "unknown",
                    },
                ]);
            });

            test("Errors : Resilient Mode", () => {
                const input = 'other; 5';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, {...parserSettings, errorRecovery: { mode: 'resilient', maxErrors: 10 }});
                // console.log(JSON.stringify(res, null, 2));
                // Testing by Result Class
                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                // errors in this stage saved in the parser result
                // not in the ast-elements itself for easy access.
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isPassed()).toEqual(true);
                expect(res.ast[0].isToken()).toEqual(true);
                expect(res.ast[0].getTokenKind()).toEqual('val');
                expect(res.ast[0].getTokenValue()).toEqual('5');
                expect(res.ast[0].getTokenSpan()).toEqual({ start: 7, end: 8 });

                expect(res.errors).toEqual([
                    {
                        code: "TOKEN_MISMATCH",
                        msg : "Expected 'val', got 'other'",
                        span: { start: 0, end: 5 },
                        failedAt: 0,
                        tokenIndex: 0,
                        prevRule: "myToken",
                        prevInnerRule: "unknown",
                    },
                    // ws ignored
                    {
                        code: "TOKEN_MISMATCH",
                        msg : "Expected 'val', got 'end'",
                        span: { start: 5, end: 6 },
                        failedAt: 0,
                        tokenIndex: 1,
                        prevRule: "myToken",
                        prevInnerRule: "unknown",
                    }
                ]);
            });

            test("Errors : Resilient Mode & Silent Mode", () => {
                const _parserRules : Types.Rules = [
                    parser.createRule('myToken', parser.token('val'), {
                        silent: true,
                        recovery: parser.errorRecoveryStrategies.skipUntil('end')
                    } ),
                ];

                const input = 'other; 5';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, _parserRules, {...parserSettings, errorRecovery: { mode: 'resilient', maxErrors: 10 }});

                expect(res.ast.length).toEqual(0);
                expect(res.errors.length).toEqual(0);
            });
        });

        describe("Optional Pattern & Building Custom Result & Building Errors", () => {

            const parserRules : Types.Rules = [
                parser.createRule('myToken',
                    parser.optional(parser.token('val')),
                ),
            ];

            test("should parse optional correctly", () => {
                const input = '0';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null, 2));

                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isOptional()).toEqual(true);
                expect(res.ast[0].isOptionalMatched()).toEqual(true);

                const optionalResult = res.ast[0].getOptionalResult()!;
                expect(optionalResult.isToken()).toEqual(true);
                expect(optionalResult.getTokenKind()).toEqual('val');
                expect(optionalResult.getTokenValue()).toEqual('0');
                expect(optionalResult.getTokenSpan()).toEqual({start: 0, end: 1});

                expect(res.errors.length).toEqual(0);
            });

            test("should parse optional correctly when not-provided", () => {
                const input = 'other';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null, 2));

                expect(res.ast.length).toEqual(1);

                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isOptional()).toEqual(true);
                expect(res.ast[0].isOptionalMatched()).toEqual(false);

                expect(res.errors.length).toEqual(0);
            });

            const parserRules_for_customBuildTest : Types.Rules = [
                parser.createRule('myToken',

                    // here, we have an optional patterns that tries to parsing the token `val`.
                    // by default, it should return a `Result` object using the `OptionalSource` as data.
                    // see [x]

                    parser.optional(parser.token('val')),
                    {
                        build: (data) => {

                            // check the build process errors if handled correctly.
                            if(!data.isOptionalMatched()){
                                throw new Error("Cannot building without providing a value");
                            }

                            // [x]
                            // here, we try to return the value itself directly
                            // without the `OptionalSource` as its parent/wrapper.

                            const srcData = data.getOptionalResult()!.getTokenData();
                            return Types.Result.createAsToken('passed', srcData);
                        }
                    }
                ),
            ];

            test("should build custom result", () => {
                const input = '7';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules_for_customBuildTest, parserSettings);
                // console.log(JSON.stringify(res, null ,2));

                expect(res.ast.length).toEqual(1);

                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isPassed()).toEqual(true);

                expect(res.ast[0].isToken()).toEqual(true);
                expect(res.ast[0].getTokenKind()).toEqual('val');
                expect(res.ast[0].getTokenValue()).toEqual('7');
                expect(res.ast[0].getTokenSpan()).toEqual({ start: 0, end: 1 });

                expect(res.errors.length).toEqual(0);
            });

            test("building process should failed with custom error", () => {

                const input = 'other';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules_for_customBuildTest, parserSettings);
                // console.log(JSON.stringify(res, null ,2));

                expect(res.ast.length).toEqual(1);

                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false); // errors handled by ParserResult[errors]
                expect(res.ast[0].isFailed()).toEqual(false);
                expect(res.ast[0].isPassed()).toEqual(true); // optional always passed.
                expect(res.ast[0].isOptionalMatched()).toEqual(false); // but we can handle it like this.

                expect(res.errors).toEqual([
                    {
                        code                : "BUILD_FUNCTION_FAILED",
                        msg                 : "Cannot building without providing a value",
                        span                : { start: 0, end: 5 },
                        failedAt            : 0,
                        tokenIndex          : 0,
                        prevRule            : "myToken",
                        prevInnerRule       : "unknown",
                    }
                ]);
            });

        });

        describe("Choice Pattern & Custom Errors", () => {

            const parserRules : Types.Rules = [
                parser.createRule('myToken',
                    parser.choice(parser.token('val'), parser.token('other')),
                    {
                        errors: [
                            parser.error(0, "test msg", "TEST_CODE")
                        ]
                    }
                ),
            ];

            test("should parse choice correctly (val)", () => {
                const input = '0';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));
                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isChoice()).toEqual(true);
                expect(res.ast[0].getChoiceIndex()).toEqual(0);

                const src = res.ast[0].getChoiceResult()!;
                expect(src.isToken()).toEqual(true);
                expect(src.getTokenKind()).toEqual('val');
                expect(src.getTokenValue()).toEqual('0');
                expect(src.getTokenSpan()).toEqual({start: 0, end: 1});
            });

            test("should parse choice correctly (other)", () => {
                const input = 'other';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));
                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isChoice()).toEqual(true);
                expect(res.ast[0].getChoiceIndex()).toEqual(1);

                const src = res.ast[0].getChoiceResult()!;
                expect(src.isToken()).toEqual(true);
                expect(src.getTokenKind()).toEqual('other');
                expect(src.getTokenValue()).toEqual('other');
                expect(src.getTokenSpan()).toEqual({start: 0, end: 5});
            });

            test("should throw an error when no alternative provided (With Custom Errors)", () => {
                const input = ';';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));
                expect(res.ast.length).toEqual(0);

                expect(res.errors).toEqual([{
                    code                : "TEST_CODE", // default : TOKEN_MISMATCH
                    msg                 : "test msg",  // default : Expected 'other', got 'end'
                    span                : { start: 0, end: 1 },
                    failedAt            : 0,
                    tokenIndex          : 0,
                    prevRule            : "myToken",
                    prevInnerRule       : "unknown",
                }]);

            });

        });

        describe("Repeat Pattern & Custom Errors", () => {

            const parserRules : Types.Rules = [
                parser.createRule('myToken',
                    parser.repeat(
                        parser.choice(parser.token('val'), parser.token('other')),
                        2, 2,
                        parser.token('comma')
                    ),
                    {
                        errors: [
                            parser.error(0, "test msg repeat", "TEST_CODE_REPEAT")
                        ]
                    }
                ),
            ];

            test("should parse repeat correctly", () => {
                const input = '7, 8';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));

                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isRepeat()).toEqual(true);
                expect(res.ast[0].getRepeatCount()).toEqual(2);

                const srcArr = res.ast[0].getRepeatResult()!;

                expect(srcArr[0].isChoice()).toEqual(true);
                const _first = srcArr[0].getChoiceResult()!;
                expect(_first.isToken()).toEqual(true);
                expect(_first.getTokenKind()).toEqual('val');
                expect(_first.getTokenValue()).toEqual('7');
                expect(_first.getTokenSpan()).toEqual({start: 0, end: 1});

                expect(srcArr[1].isChoice()).toEqual(true);
                const _second = srcArr[1].getChoiceResult()!;
                expect(_second.isToken()).toEqual(true);
                expect(_second.getTokenKind()).toEqual('val');
                expect(_second.getTokenValue()).toEqual('8');
                expect(_second.getTokenSpan()).toEqual({start: 3, end: 4});

                expect(res.errors.length).toEqual(0);
            });

            test("repeat should failed", () => {
                const input = 'other';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));

                expect(res.ast.length).toEqual(0);

                expect(res.errors).toEqual([{
                    code                : "TEST_CODE_REPEAT", // default : REPEAT_MIN_NOT_MET
                    msg                 : "test msg repeat",  // default : Expected at least 2 occurrences, got 0
                    span                : { start: 0, end: 5 },
                    failedAt            : 0,
                    tokenIndex          : 1,
                    prevRule            : "myToken",
                    prevInnerRule       : "unknown",
                }]);
            });

            // [TODO] add more tests for repeat (min/max) ..
        });

        describe("Sequence Pattern & Custom Errors", () => {

            const parserRules : Types.Rules = [
                parser.createRule('myToken',
                    parser.seq(
                        parser.token('val'), parser.token('comma'), parser.token('other'), parser.token('end'),
                    ),
                    {
                        errors: [
                            parser.error(0, "test msg seq", "TEST_CODE_SEQUENCE")
                        ]
                    }
                ),
            ];

            test("should parse sequence correctly", () => {
                const input = '55, other ;';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));

                expect(res.ast.length).toEqual(1);
                expect(res.ast[0]).toBeInstanceOf(Types.Result);
                expect(res.ast[0].hasErrors()).toEqual(false);
                expect(res.ast[0].isSequence()).toEqual(true);
                expect(res.ast[0].getSequenceCount()).toEqual(4);

                const srcArr = res.ast[0].getSequenceResult()!;

                const _first = srcArr[0]!;
                expect(_first.isToken()).toEqual(true);
                expect(_first.getTokenKind()).toEqual('val');
                expect(_first.getTokenValue()).toEqual('55');
                expect(_first.getTokenSpan()).toEqual({start: 0, end: 2});

                const _second = srcArr[1];
                expect(_second.isToken()).toEqual(true);
                expect(_second.getTokenKind()).toEqual('comma');
                expect(_second.getTokenValue()).toEqual(',');
                expect(_second.getTokenSpan()).toEqual({start: 2, end: 3});

                const _third = srcArr[2];
                expect(_third.isToken()).toEqual(true);
                expect(_third.getTokenKind()).toEqual('other');
                expect(_third.getTokenValue()).toEqual('other');
                expect(_third.getTokenSpan()).toEqual({start: 4, end: 9});

                const _fourth = srcArr[3];
                expect(_fourth.isToken()).toEqual(true);
                expect(_fourth.getTokenKind()).toEqual('end');
                expect(_fourth.getTokenValue()).toEqual(';');
                expect(_fourth.getTokenSpan()).toEqual({start: 10, end: 11});

                expect(res.errors.length).toEqual(0);
            });

            test("sequence should failed", () => {
                const input = 'other';
                const tokens = lexer.tokenize(input, tokensRules);
                const res = parser.parse(tokens, parserRules, parserSettings);
                // console.log(JSON.stringify(res, null ,2));

                expect(res.ast.length).toEqual(0);

                expect(res.errors).toEqual([{
                    code                : "TEST_CODE_SEQUENCE", // default : SEQUENCE_MIN_NOT_MET
                    msg                 : "test msg seq",  // default : Expected at least 3 occurrences, got 0
                    span                : { start: 0, end: 5 },
                    failedAt            : 0,
                    tokenIndex          : 0,
                    prevRule            : "myToken",
                    prevInnerRule       : "unknown",
                }]);
            });
        });

    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝