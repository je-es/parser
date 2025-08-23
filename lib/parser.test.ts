// parser.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as fs from 'fs';
    import * as path from 'path';
    import * as lexer from '@je-es/lexer';
    import * as parser from './parser';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    // Helper to recursively find all *_test.ts or *_test.js files in a directory
    function findTestFiles(dir: string, pattern = /_test\.(ts|js)$/): string[] {
        let results: string[] = [];
        for (const entry of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                results = results.concat(findTestFiles(fullPath, pattern));
            } else if (pattern.test(entry)) {
                results.push(fullPath);
            }
        }
        return results;
    }

    // Find all test files under ./tests/cases/
    const casesRoot = path.join(__dirname, '../tests/');
    const testFiles = findTestFiles(casesRoot);

    // Load all test modules and collect their exports
    type TestModule = {
        rules: any,
        cases: Record<string, any>
    };

    const allCases: { filename: string, module: TestModule }[] = testFiles.map(file => {
        const mod = require(file);
        const rules : any = { lexerRules: mod.lexerRules, parserRules: mod.parserRules, settings: mod.parserSettings };
        const cases : any = mod.cases;

        return {
            filename: path.relative(casesRoot, file),

            module: {
                rules,
                cases
            }
        };
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

    describe("Parser", () => {
        // Describe each file and test each case inside it
        allCases.forEach(({ filename, module }) => {
            // const blocked = [
            //     'BlahBlah.ts',
            //     ];
            // const real_filename = path.parse(filename).base;
            // if(!blocked.includes(real_filename)) return;
            describe(`Test cases from ${filename}`, () => {
                for (const [name, { input, ast = [], errors = [] }] of Object.entries(module.cases)) {
                    it(name, () => {
                        const tokens = lexer.tokenize(input, module.rules.lexerRules);
                        const result = parser.parse(tokens, module.rules.parserRules, module.rules.settings);
                        // remove field (failedAt) from errors
                        result.errors = result.errors.map((error: any) => {
                            delete error.failedAt;
                            delete error.tokenIndex;
                            delete error.prevRule;
                            delete error.prevInnerRule;
                            return error;
                        });
                        // console.log(JSON.stringify(tokens, null, 2));
                        // console.log(JSON.stringify(result, null, 2));

                        // Recursively normalize positions in expected and result ASTs
                        expect(result.errors).toEqual(errors);
                        expect(result.ast).toEqual(ast);
                    });
                }
            });
        });
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝