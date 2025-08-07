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
            parser.repeat(
                parser.rule('group'),
                1,                     // At least one group
                Infinity,              // No upper limit
                parser.token('comma')  // Separated by commas
            ),
            {
                build: (matches) => ({
                    type: 'root',
                    groups: matches.map(m => m.meta)
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
                    type: 'group',
                    meta: {
                        left        : matches[1].value,
                        operator    : matches[2].value,
                        right       : matches[3].value
                    }
                }),

                errors: [
                    parser.error(
                        // condition
                        (parser, failedAt) => failedAt == 0,
                        // message
                        "Missing opening parenthesis '('",
                        // suggestions
                        ["Add '(' to close the group", "Check for balanced parentheses"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 1,
                        "Missing left operand",
                        ["Add a number to the left of the operator"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 2,
                        "Missing operator",
                        ["Add '+' or '-' operator to the expression"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 3,
                        "Missing right operand",
                        ["Add a number to the right of the operator"]
                    ),

                    parser.error(
                        (parser, failedAt) => failedAt == 4,
                        "Missing closing parenthesis ')'",
                        ["Add ')' to close the group", "Check for balanced parentheses"]
                    ),
                ],

                // Example: `(+2... (3+4)`
                // An error occurs after the first `(` due to a missing left operand.
                // If error recovery mode is not set to `resilient`,
                // the parser will skip over "+2... " and resume parsing from the second `(`.
                // All errors encountered will be recorded in `parser.errors`.
                //
                // Note: In `resilient` mode, the parser halts at the first `(`,
                // capturing a single error before returning.
                recovery: parser.errorRecoveryStrategies.skipUntil('open')
            }
        ),
    ];
    ```

2. ### Configure Parser Settings

    ```typescript
    const parserSettings: parser.ParserSettings = {
        // Entry rule - where parsing begins
        startRule: 'root',

        // Error recovery mode
        errorRecovery: {
            mode: 'resilient',          // 'strict' | 'resilient'
            maxErrors: 0,               // Stop after N errors (0 = unlimited)
            syncTokens: ['open']        // Tokens to sync on during recovery
        },

        ignored: ['ws'],                // Ignore whitespace tokens
        debug: false,                   // Enable debug mode (prints debug info)
        maxDepth: 1000,                 // Maximum recursion depth (0 = unlimited)
        enableMemoization: true,        // Enable memoization for better performance
        maxCacheSize: 1000,             // Maximum cache size (0 = unlimited)
        enableProfiling: false          // Enable profiling and statistics
    };
    ```

3. ### Parse Input

    - #### Parse Valid Input

        ```typescript
        const result1 = parser.parse(tokens_of_'(1+2)', rules, parserSettings);
        console.log(result1);
        ```

        ```jsonc
        // Output
        {
            "ast": [
                {
                    "type": "root",
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
        const result2 = parser.parse(tokens_of_'(1+2), (3-4), (5+6)', rules, parserSettings);
        console.log(result2.ast[0].groups);
        ```

        ```jsonc
        // Output
        [
            { "left": "1", "operator": "+", "right": "2" },
            { "left": "3", "operator": "-", "right": "4" },
            { "left": "5", "operator": "+", "right": "6" }
        ]
        ```

    - #### Handle Errors Gracefully

        ```typescript
        const result3 = parser.parse(tokens_of_'(1+2', rules, parserSettings);
        console.log(result3.errors);
        ```

        ```jsonc
        // Output
        [
            {
                "code": "E006",
                "context": " open:(  num:1  plus:+  num:2",
                "message": "Missing closing parenthesis ')'",
                "position": {
                    "col": 5,
                    "line": 1,
                    "offset": 4,
                },
                "severity": "error",
                "suggestions": [
                    "Add ')' to close the group",
                    "Check for balanced parentheses",
                ],
            }
        ]
        ```

    - #### Error Recovery Example

        ```typescript
        const result4 = parser.parse(tokens_of_'(+2, (3+4)', rules, {
            ...parserSettings,
            errorRecovery: {
                mode: 'resilient',      // Use resilient mode to continue after errors
                maxErrors: 10,          // Allow up to 10 errors
                syncTokens: ['open']    // Sync on open parenthesis
            }
        });
        console.log(result4.ast[0].groups);
        ```

        ```jsonc
        // Output - Successfully parsed the second group despite error in first
        [
            { "left": "3", "operator": "+", "right": "4" }
        ]
        ```

4. ### Advanced Usage

    - #### Create Reusable Parser Instance

        ```typescript
        const myParser = parser.createParser(rules, parserSettings);

        // Parse multiple inputs with the same parser
        const result1 = myParser.parse(tokens1);
        const result2 = myParser.parse(tokens2);

        // Get cache statistics
        const cacheStats = myParser.getCacheStats();
        console.log(`Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`);

        // Clear caches periodically for long-running applications
        myParser.clearCaches();

        // Dispose when done
        myParser.dispose();
        ```

        #### Validate Grammar
        ```typescript
        const issues = parser.validateGrammar(rules, 'root');
        if (issues.length > 0) {
            console.error('Grammar validation failed:', issues);
        }
        ```

5. ### Next Steps

    > For the next steps, please see the [`@je-es/syntax`](https://github.com/je-es/syntax) package.

<br>
<!--------------------------------------------------------------------------->

## 📖 API Reference

- ### Pattern Combinators

    - #### `parser.createRule(name, pattern, options)`

        > Create a custom parser rule with optional build function, error handlers, and recovery strategies.

        ```typescript
        parser.createRule('expression',
            parser.seq(
                parser.token('('),
                parser.choice(
                    parser.token('true'),
                    parser.token('false'),
                    parser.rule('variable')
                ),
                parser.token(')')
            ),
            {
                build: (matches) => ({
                    type: 'expression',
                    value: matches[1].value
                }),
                errors: [
                    parser.error(
                        (parser, failedAt) => failedAt === 0,
                        "Expected opening parenthesis",
                        ["Add '(' before the expression"]
                    )
                ],
                recovery: parser.errorRecoveryStrategies.skipUntil(')')
            }
        );
        ```

    - #### `parser.token(name)`

        > Match a specific token by name.

        ```typescript
        parser.token('identifier')  // matches identifier tokens
        parser.token('(')           // matches literal '(' tokens
        ```

    - #### `parser.rule(name)`

        > Reference another parser rule.

        ```typescript
        parser.rule('expression')   // references the 'expression' rule
        ```

    - #### `parser.seq(...patterns)`

        > Match a sequence of patterns in order.

        ```typescript
        parser.seq(
            parser.token('if'),
            parser.rule('condition'),
            parser.token('then'),
            parser.rule('statement')
        )
        ```

    - #### `parser.choice(...patterns)`

        > Match one of multiple alternative patterns.

        ```typescript
        parser.choice(
            parser.token('true'),
            parser.token('false'),
            parser.rule('variable')
        )
        ```

    - #### `parser.repeat(pattern, min?, max?, separator?)`

        > Repeat a pattern with optional constraints and separator.

        ```typescript
        // Zero or more
        parser.repeat(parser.rule('statement'))

        // One or more
        parser.repeat(parser.rule('parameter'), 1)

        // Exactly 3
        parser.repeat(parser.token('digit'), 3, 3)

        // Comma-separated list
        parser.repeat(
            parser.rule('argument'),
            0,
            Infinity,
            parser.token(',')
        )
        ```

    - #### `parser.optional(pattern)`

        > Make a pattern optional (equivalent to `repeat(pattern, 0, 1)`).

        ```typescript
        parser.optional(parser.token('?'))  // optional question mark
        ```

    - #### `parser.oneOrMore(pattern, separator?)`

        > Match one or more occurrences of a pattern.

        ```typescript
        parser.oneOrMore(parser.rule('digit'))                    // 1+
        parser.oneOrMore(parser.rule('param'), parser.token(',')) // comma-separated, 1+
        ```

    - #### `parser.zeroOrMore(pattern, separator?)`

        > Match zero or more occurrences of a pattern.

        ```typescript
        parser.zeroOrMore(parser.rule('statement'))               // 0+
        parser.zeroOrMore(parser.rule('item'), parser.token(';')) // semicolon-separated, 0+
        ```

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

- ### Error Handling

    - #### `parser.error(condition, message, suggestions?, code?, severity?)`

        > Create an error handler for rules.

        ```typescript
        parser.error(
            (parser, failedAt) => failedAt === 2,
            "Missing operator",
            ["Add '+' or '-' operator", "Check expression syntax"],
            "E001",
            "error"
        )
        ```

    - #### Error Recovery Strategies

        - ##### `parser.errorRecoveryStrategies.panicMode()`

            > Skip tokens until reaching a synchronization point.

            ```typescript
            recovery: parser.errorRecoveryStrategies.panicMode()
            ```

        - ##### `parser.errorRecoveryStrategies.skipUntil(tokens)`

            > Skip tokens until finding one of the specified tokens.

            ```typescript
            recovery: parser.errorRecoveryStrategies.skipUntil([';', '}', 'end'])
            recovery: parser.errorRecoveryStrategies.skipUntil('open') // single token
            ```

        - ##### `parser.errorRecoveryStrategies.insertToken(token, value?)`

            > Virtual token insertion (doesn't modify token stream).

            ```typescript
            recovery: parser.errorRecoveryStrategies.insertToken(';', ';')
            ```

        - ##### `parser.errorRecoveryStrategies.deleteToken()`

            > Skip the current token.

            ```typescript
            recovery: parser.errorRecoveryStrategies.deleteToken()
            ```

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

- ### Context Conditions

    - #### `parser.contextConditions.missingToken(tokenName)`

        > Detect when a specific token is missing.

    - #### `parser.contextConditions.unexpectedToken(tokenName?)`

        > Detect when an unexpected token appears.

    - #### `parser.contextConditions.prematureEnd()`

        > Detect when input ends unexpectedly.

    - #### `parser.contextConditions.custom(predicate)`

        > Create custom condition based on parser state.

        ```typescript
        parser.contextConditions.custom((parser, failedAt) => {
            // Custom logic here
            return failedAt > 0 && someCondition();
        })
        ```

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

- ### Main Functions

    - #### `parser.parse(tokens, rules, settings?)`

        > Parse tokens using the provided rules and settings.

        ```typescript
        const result = parser.parse(tokens, rules, {
            startRule: 'expression',
            errorRecovery: { mode: 'resilient', maxErrors: 5, syncTokens: [] },
            ignored: ['ws', 'comment'],
            debug: false,
            maxDepth: 1000,
            enableMemoization: true,
            maxCacheSize: 1000,
            enableProfiling: false
        });
        ```

    - #### `parser.createParser(rules, settings?)`

        > Create a reusable parser instance.

        ```typescript
        const myParser = parser.createParser(rules, settings);
        const result = myParser.parse(tokens);
        ```

    - #### `parser.validateGrammar(rules, startRule?)`

        > Validate grammar rules without creating a parser.

        ```typescript
        const issues = parser.validateGrammar(rules, 'root');
        if (issues.length === 0) {
            console.log('Grammar is valid!');
        }
        ```

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

- ### Parser Instance Methods

    - #### `parser.parse(tokens)`

        > Parse tokens using the parser instance.

    - #### `parser.clearCaches()`

        > Clear internal caches and reset parser state.

    - #### `parser.getCacheStats()`

        > Get current cache statistics.

        ```typescript
        const stats = myParser.getCacheStats();
        // { size: 150, hitRate: 0.85 }
        ```

    - #### `parser.dispose()`

        > Dispose of the parser and free resources.

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

- ### Configuration

    - #### ParserSettings Interface

        ```typescript
        interface ParserSettings {
            startRule: string;                          // Entry rule name
            errorRecovery: {
                mode: 'strict' | 'resilient';          // Error recovery mode
                maxErrors: number;                      // Max errors before stopping (0 = unlimited)
                syncTokens: string[];                   // Synchronization tokens
            };
            ignored: string[];                          // Tokens to ignore (e.g., whitespace)
            debug: boolean;                             // Enable debug output
            maxDepth: number;                           // Max recursion depth (0 = unlimited)
            enableMemoization: boolean;                 // Enable result caching
            maxCacheSize: number;                       // Max cache entries (0 = unlimited)
            enableProfiling: boolean;                   // Enable performance profiling
        }
        ```

    - #### Error Recovery Modes

        - **`strict`**: Stop parsing on first error, return immediately
        - **`resilient`**: Continue parsing after errors, collect all errors, attempt recovery

    - #### Parse Result

        ```typescript
        interface ParseResult {
            ast: AstNode[];                             // Generated Abstract Syntax Tree
            errors: ParseError[];                       // Parsing errors encountered
            statistics?: ParseStatistics;               // Performance statistics (if profiling enabled)
        }
        ```

    - #### Parse Statistics

        ```typescript
        interface ParseStatistics {
            tokensProcessed: number;                    // Number of tokens processed
            rulesApplied: number;                       // Number of rules applied
            errorsRecovered: number;                    // Number of errors recovered from
            parseTimeMs: number;                        // Total parsing time in milliseconds
            memoryUsedKB?: number;                      // Estimated memory usage in KB
            cacheHitRate?: number;                      // Cache hit rate (0.0 to 1.0)
        }
        ```

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