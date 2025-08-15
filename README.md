<!----------------------------------- BEG ----------------------------------->
<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="parser" height="80" />
    </p>
</div>

<p align="center">
    <img src="https://img.shields.io/badge/Lite-black"/>
    <img src="https://img.shields.io/badge/Fast-black"/>
    <img src="https://img.shields.io/badge/Flexible-black"/>
    <img src="https://img.shields.io/badge/Zero%20Dependencies-black"/>
</p>

<p align="center" style="font-style:italic; color:gray">
    An advanced syntax analysis engine that converts token sequences<br>
    into an Abstract Syntax Tree (AST) with support for customizable grammar rules.<br>
    It provides intelligent error detection, robust error recovery, and flexible transforms for processing nodes.
</p>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>
<br>

<!--------------------------------------------------------------------------->



<!----------------------------------- HOW ----------------------------------->

## 🚀 Installation

```bash
npm install @je-es/parser
```

```typescript
import * as parser from '@je-es/parser';
```

## 🌟 How to Use

> This section is a continuation of the **How to Use** section of the [`@je-es/lexer`](https://github.com/je-es/lexer) repository.
>
> So, please read that first and let's continue converting our tokens into an **Abstract Syntax Tree (AST)**.

1. ### Create Parser Rules

    ```typescript
    const rules: parser.Rules = [
        // Root rule - entry point
        parser.createRule('root',
            // `(..), (..), ..`
            parser.oneOrMore(           // Shortcut for parser.repeat(..)
                parser.rule('group'),
                parser.token('comma')   // Separated by commas
            ),
            {
                build: (matches) => ({
                    rule: 'root',
                    groups: matches.map(m => m.data)
                })
            }
        ),

        // Group rule - parenthesized expression
        parser.createRule('group',
            // (N +/- N)
            parser.seq(
                parser.token('open'),       // (
                parser.token('num'),        // N    => left

                parser.choice(              // +/-  => operator
                    parser.token('plus'), parser.token('minus')
                ),

                parser.token('num'),        // N    => right
                parser.token('close')       // )
            ),
            {
                build: (matches) => ({
                    rule: 'group',
                    data: {
                        left        : matches[1].value,
                        operator    : matches[2].value,
                        right       : matches[3].value
                    }
                }),

                errors: [
                    parser.error(0, "Expected opening parenthesis '('" ),
                    parser.error(1, "Expected left operand", ),
                    parser.error(2, "Expected operator", ),
                    parser.error(3, "Expected right operand", ),
                    parser.error(4, "Expected closing parenthesis ')'", ),
                ],

                // Example: `(+2... (3+4)`
                // An error occurs after the first `(` due to a missing left operand.
                // If error recovery mode is not set to `resilient`,
                // the parser will skip over "+2... " and resume parsing from the second `(`.
                // All errors encountered will be recorded in `parser.errors`.
                //
                // Note: In `resilient` mode, the parser halts at the first `(`,
                // capturing a single error before returning.
                recovery: parser.errorRecoveryStrategies.skipUntil('open'),

                ...
            }
        ),
    ];
    ```

2. ### Configure Parser Settings

    ```typescript
    const parserSettings: parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule               : 'root',

        // Error recovery mode
        errorRecovery           : {
            mode                : 'resilient',      // 'strict' | 'resilient'
            maxErrors           : 0,                // Stop after N errors (0 = unlimited)
            syncTokens          : ['open']          // Tokens to sync on during recovery
        },

        ignored                 : ['ws'],           // Ignore whitespace tokens
        debug                   : 'off',            // Disable debug mode
        maxDepth                : 1000,             // Maximum recursion depth (0 = unlimited)
        maxCacheSize            : 1000,             // Maximum cache size (0 = unlimited)
    };
    ```

3. ### Parse Input

    - #### Parse Valid Input

        ```typescript
        const res = parser.parse(tokens_of_'(1+2)', rules, parserSettings);
        console.log(res);
        ```

        ```jsonc
        // Output
        {
            "ast": [
                {
                    "rule": "root",
                    "groups": [
                        { "left": "1", "operator": "+", "right": "2" }
                    ]
                }
            ],
            "errors": []
        }
        ```

    - #### Parse Multiple Groups

        ```typescript
        const res = parser.parse(tokens_of_'(1+2), (3-4), (5+6)', rules, parserSettings);
        console.log(res.ast[0].groups);
        ```

        ```jsonc
        // Output
        {
            "ast": [
                {
                    "rule": "root",
                    "groups": [
                        { "left": "1", "operator": "+", "right": "2" },
                        { "left": "3", "operator": "-", "right": "4" },
                        { "left": "5", "operator": "+", "right": "6" }
                    ]
                }
            ],
            "errors": []
        }
        ```

    - #### Handle Errors Gracefully

        ```typescript
        const res = parser.parse(tokens_of_'(1+2', rules, parserSettings);
        console.log(res.errors);
        ```

        ```jsonc
        // Output
        {
            "ast": [],
            "errors":[
                {
                    "code"    : 0x007,
                    "msg"     : "Expected closing parenthesis ')'",
                    "range"   : { "start": { "line": 1, "col": 4, "offset": 3 }, "end": { "line": 1, "col": 5, "offset": 4 } }
                },
                {
                    "code"    : 0x005,
                    "msg"     : "Expected at least 1 occurrences, got 0",
                    "range"   : { "start": { "line": 1, "col": 4, "offset": 3 }, "end": { "line": 1, "col": 5, "offset": 4 } }
                },
            ]
        }
        ```

    - #### Error Recovery Example

        ```typescript
        const res = parser.parse(tokens_of_'(+2), (3+4)', rules, parserSettings);
        console.log(res.ast[0].groups);
        ```

        ```jsonc
        // Output - Successfully parsed the second group despite error in first
        {
            "ast": [
            {
                    "rule": "root",
                    "groups": [
                        { "left": "3", "operator": "+", "right": "4" }
                    ]
                }
            ],
            "errors": [
                {
                    "code"          : 0x007,
                    "message"       : "Expected left operand",
                    "range"         : { "start": { "line": 1, "col": 1, "offset": 0 }, "end": { "line": 1, "col": 2, "offset": 1 } }

                }
            ]
        }
        ```

4. ### Next Steps

    > For the next steps, please see the [`@je-es/syntax`](https://github.com/je-es/syntax) package.

<br>
<!--------------------------------------------------------------------------->

## 📖 API Reference

> TODO

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<!--------------------------------------------------------------------------->

- #### 🔗 Related

  - ##### [@je-es/lexer](https://github.com/je-es/lexer)
      > Fundamental lexical analyzer that transforms source text into structured tokens with type and position information.

  - ##### @je-es/parser
      > Advanced syntax analyzer that converts tokens into AST with customizable grammar rules and intelligent error detection.

  - ##### [@je-es/syntax](https://github.com/je-es/syntax)
      > Unified wrapper that streamlines syntax creation with integrated lexer-parser coordination, LSP support, and enhanced linting capabilities.

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<!--------------------------------------------------------------------------->

<br>
<div align="center">
    <a href="https://github.com/maysara-elshewehy">
        <img src="https://img.shields.io/badge/Made with ❤️ by-Maysara-orange"/>
    </a>
</div>

<!-------------------------------------------------------------------------->