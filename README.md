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
                    groups: matches.map(m => m.meta)
                }),

                // Optional custom error recovery
                recovery: parser.errorRecoveryStrategies.skipUntil(['open']),
                silent: false
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
                    meta: {
                        left        : matches[1].value,
                        operator    : matches[2].value,
                        right       : matches[3].value
                    }
                }),

                errors: [
                    parser.error(0, "Expected opening parenthesis '('", "GROUP_ERROR_MISSING_OPEN"),
                    parser.error(1, "Expected left operand", "GROUP_ERROR_MISSING_LEFT"),
                    parser.error(2, "Expected operator", "GROUP_ERROR_MISSING_OPERATOR"),
                    parser.error(3, "Expected right operand", "GROUP_ERROR_MISSING_RIGHT"),
                    parser.error(4, "Expected closing parenthesis ')'", "GROUP_ERROR_MISSING_CLOSE"),
                ],

                silent: false,

                // Example: `(+2... (3+4)`
                // An error occurs after the first `(` due to a missing left operand.
                // If error recovery mode is set to `resilient`,
                // the parser will skip over "+2... " and resume parsing from the second `(`.
                // All errors encountered will be recorded in `parser.errors`.
                //
                // Note: In `strict` mode, the parser halts at the first error,
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
        },

        ignored                 : ['ws'],           // Ignore whitespace tokens
        debug                   : 'off',            // Debug level: 'off' | 'errors' | 'rules' | 'patterns' | 'tokens' | 'verbose'
        maxDepth                : 1000,             // Maximum recursion depth
        maxCacheSize            : 1000,             // Maximum cache size (in megabytes)
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
                    "code"    : "GROUP_ERROR_MISSING_CLOSE",
                    "msg"     : "Expected closing parenthesis ')'",
                    "span"    : { "start": 4, "end": 4 }
                },
                {
                    "code"    : "GROUP_ERROR_MISSING_OPEN",
                    "msg"     : "Expected opening parenthesis '('",
                    "span"    : { "start": 1, "end": 2 }
                }
            ]
        }
        ```

    - #### Error Recovery Example

        ```typescript
        const res = parser.parse(tokens_of_'(+2, (3+4)', rules, parserSettings);
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
                    "code"          : "GROUP_ERROR_MISSING_LEFT",
                    "msg"           : "Expected left operand",
                    "span"          : { "start": 1, "end": 2 }
                },
                {
                    "code"          : "GROUP_ERROR_MISSING_OPEN",
                    "msg"           : "Expected opening parenthesis '('",
                    "span"          : { "start": 1, "end": 2 }
                }
            ]
        }
        ```

4. ### Advanced Features

    - #### Silent Parsing
        ```typescript
        // Parse patterns silently (no errors added to error list in silent mode)
        parser.silent(parser.token('optional_token'))
        parser.loud(parser.token('required_token'))  // Explicit non-silent
        ```

    - #### Pattern Combinators
        ```typescript
        // Various pattern types available
        parser.token('identifier')                    // Match single token
        parser.rule('expression')                     // Reference another rule
        parser.seq(pattern1, pattern2, pattern3)     // Sequence of patterns
        parser.choice(pattern1, pattern2)            // Alternative patterns
        parser.repeat(pattern, 2, 5, separator)      // Repeat with min/max/separator
        parser.oneOrMore(pattern, separator)         // One or more occurrences
        parser.zeroOrMore(pattern, separator)        // Zero or more occurrences
        parser.optional(pattern)                     // Optional pattern (0 or 1)
        ```

    - #### Enhanced Error Handling
        ```typescript
        // Custom error handlers with conditions
        errors: [
            parser.error(0, "Expected opening parenthesis"),
            parser.error((parser, failedAt) => failedAt === 2, "Custom condition error"),
        ]

        // Recovery strategies
        recovery: parser.errorRecoveryStrategies.skipUntil(['semicolon', 'newline'])
        ```

    - #### Performance Features
        ```typescript
        // Memoization and caching for better performance
        const settings = {
            maxCacheSize: 1000,         // Cache size in megabytes
            maxDepth: 1000,             // Maximum parsing depth
            // ... other settings
        };
        ```

5. ### Next Steps

    > For the next steps, please see the [`@je-es/syntax`](https://github.com/je-es/syntax) and [`@je-es/program`](https://github.com/je-es/program) packages.

<br>
<!--------------------------------------------------------------------------->

## 📖 API Reference

- #### Functions

  - #### Main

    ```ts
    // Parses an array of tokens using the provided rules and settings.
    function parse(tokens: Token[], rules: Rules, settings?: ParserSettings): ParseResult

    // Creates a rule definition object.
    function createRule(name: string, pattern: Pattern, options?: Rule['options']): Rule
    ```

  - #### Pattern Combinators

    ```ts
    // Creates a pattern that matches a specific token.
    function token(name: string, silent: boolean = false): Pattern;

    // Creates a new pattern that matches a rule definition.
    function rule(name: string, silent: boolean = false): Pattern;

    // Creates a new pattern that matches a specified number of occurrences of the given pattern.
    function repeat(pattern: Pattern, min = 0, max = Infinity, separator?: Pattern, silent: boolean = false): Pattern;

    // Creates a new pattern that matches one or more occurrences of the given pattern.
    function oneOrMore(pattern: Pattern, separator?: Pattern, silent: boolean = false): Pattern;

    // Creates a new pattern that matches zero or more occurrences of the given pattern.
    function zeroOrMore(pattern: Pattern, separator?: Pattern, silent: boolean = false): Pattern;

    // Creates a new pattern that matches zero or one occurrence of the given pattern.
    function zeroOrOne(pattern: Pattern, separator?: Pattern, silent: boolean = true): Pattern;


    // Creates a new pattern that matches zero or one occurrence
    // of the given pattern (automatically silent).
    // always return array
    // u can use helpers like: parser.isOptionalPassed() and getOptional()
    function optional(pattern: Pattern): Pattern;

    // Creates a new pattern that matches one of multiple patterns
    // (first successful match wins).
    function choice(...patterns: Pattern[]): Pattern;

    // Creates a new pattern that matches multiple patterns in sequence.
    function seq(...patterns: Pattern[]): Pattern;
    ```

  - #### Silent Mode Helpers

    ```ts
    // Creates a new pattern that matches the given pattern but is not outputted in the AST.
    function silent<T extends Pattern>(pattern: T): T;

    // Creates a new pattern that matches the given pattern and is outputted in the AST.
    function loud<T extends Pattern>(pattern: T): T;
    ```

  - #### Error Handling

    ```ts
    // Creates a new ErrorHandler pattern that matches when the given condition is true
    //and throws an error with the given message and code.
    function error( cond: ErrorHandler['cond'], msg: string, code?: number, ): ErrorHandler;
    ```

    ```ts
    // A collection of error recovery strategies.
    const errorRecoveryStrategies = {
        // Creates a recovery strategy that skips input tokens until it finds any of the given tokens.
        skipUntil(tokens: string | string[]): RecoveryStrategy,
    };
    ```

  - #### Helpers

    ```ts
    // Returns the smallest span that encompasses all the given matches
    // or the span of the first match if there are no matches.
    function getMatchesSpan(matches: any[]): Span | undefined;

    // Returns a new object that is a shallow copy of the given 'res' object,
    // but without the 'span' property.
    function resWithoutSpan(res: any): any;
    ```


- #### Types

    ```ts
    // Represents a span in the source text
    interface Span {
        start           : number;
        end             : number;
    }

    // Represents a token with type, value and position information
    interface Token {
        type            : string;
        value           : string | null;
        span            : Span;
    }

    // Represents a pattern in the grammar
    interface Pattern {
        type            : 'token' | 'rule' | 'repeat' | 'choice' | 'seq' | 'optional';
        [key: string]   : any;
        silent          : boolean; // Fixed typo: scilent -> silent
    }

    // Represents an error handler
    interface ErrorHandler {
        cond            : number | ((parser: Parser, failedAt: number, force?: boolean) => boolean);
        msg             : string;
        code           ?: string;
    }

    // Represents a recovery strategy
    interface RecoveryStrategy {
        type            : 'skipUntil';
        tokens         ?: string[];
        token          ?: string;
    }

    // Represents a rule in the grammar
    interface Rule {
        name            : string;
        pattern         : Pattern;

        options        ?: {
            build      ?: (matches: any[]) => any;
            errors     ?: ErrorHandler[];
            recovery   ?: RecoveryStrategy;
            ignored    ?: string[];
            silent     ?: boolean; // Rule-level silent mode
        };
    }

    // Represents a list of rules
    type Rules = Rule[];

    // Represents a parse statistics
    interface ParseStatistics {
        tokensProcessed : number;
        rulesApplied    : number;
        errorsRecovered : number;
        parseTimeMs     : number;
    }

    // Represents an AST node
    type BaseAstNode = {
        rule            : string;
        span            : Span;
        value          ?: string | number | boolean | null;
    }

    // With this we can customize the AST for the next stages
    // depending on your needs
    type AstNode = BaseAstNode | any;

    interface ParseError {
        msg             : string;
        code            : string;
        span            : Span;
    }

    // Represents a parse result
    interface ParseResult {
        ast             : AstNode[];
        errors          : ParseError[];
        statistics     ?: ParseStatistics;
    }

    // Represents a debug level
    type DebugLevel = 'off' | 'errors' | 'rules' | 'patterns' | 'tokens' | 'verbose';

    // Represents a parser settings
    interface ParserSettings {
        startRule       : string;
        errorRecovery  ?: {
            mode       ?: 'strict' | 'resilient';
            maxErrors  ?: number;
        };
        ignored        ?: string[];
        debug          ?: DebugLevel;
        maxDepth       ?: number;
        maxCacheSize   ?: number; // in megabytes
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

  - ##### [@je-es/program](https://github.com/je-es/program)
      > A high-performance, type-safe program representation library with advanced semantic analysis for programming languages.

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