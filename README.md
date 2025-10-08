<!----------------------------------- BEG ----------------------------------->
<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="parser" height="80" />
    </p>
</div>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<p align="center" style="font-style:italic; color:gray;">
    <br>
    A mechanism for creating grammatical rules..!
    <br>
</p>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>
<br>

<!--------------------------------------------------------------------------->



<!----------------------------------- HMM ----------------------------------->

## [2] [`@je-es/parser`](https://github.com/je-es/parser) 🚀

> _To understand the full context, please refer to [these documents](https://github.com/kemet-lang/.github/blob/main/profile/README.md)._

- ### Install

    ```bash
    npm install @je-es/parser
    ```

    ```ts
    import * as Parser from "@je-es/parser";
    ```

- ### Usage

    > real example from `@kemet-lang/rules`

    ```ts
    // [1] create parser rules
    const parser_rules : Parser.Rules = [

        Parser.createRule('Root',
            Parser.oneOrMore(Parser.rule('Stmt')),
            {
                build: (data: Parser.Result) => {
                    const arr   = data.getRepeatResult()!;
                    const stmts = arr.map((x) => x.getCustomData()! as AST.StmtNode);
                    return Parser.Result.createAsCustom('passed', 'root', stmts, data.span);
                }
            }
        ),

        Parser.createRule('Ident',
            Parser.token('ident'),
            {
                build: (data: Parser.Result) => {
                    const identResult = data.getTokenData()!;

                    return Parser.Result.createAsCustom('passed', 'ident',
                        AST.IdentNode.create( identResult.span, identResult.value!, false),
                        data.span
                    );
                },

                errors: [ Parser.error(0, "Expected identifier") ]
            }
        ),

        // Include required rules
        ...Type,
        ...Expr,
        ...Stmt,
    ];
    ```

    ```ts
    // [2] create parser settings
    const parser_settings : Parser.ParserSettings = {
        startRule       : 'Root',
        errorRecovery   : { mode: 'resilient', maxErrors: 99 },
        ignored         : ['ws', 'comment'],
        debug           : 'off',
        maxDepth        : 9999,
        maxCacheSize    : 1024, // 1GB
    };
    ```

    ```ts
    // [3] parse tokens using your rules
    const parser_result = Parser.parse([<tokens>], parser_rules, parser_settings);

    // Hint: to get tokens use `@je-es/lexer`
    ```

---


> #### 1. [@je-es/lexer](https://github.com/je-es/lexer)

> #### 2. [`@je-es/parser`](https://github.com/je-es/parser)

> #### 3. [@je-es/syntax](https://github.com/je-es/syntax)

> #### 4. [@je-es/ast](https://github.com/je-es/ast)

> #### 5. [@je-es/ast-analyzer](https://github.com/je-es/ast-analyzer)

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<p align="center">
    <b>
        <br>
        <i style="color: gray;">"
        Currently I'm working on a larger project, so I'll skip writing documentation for now due to time constraints.
        "</i>
        <br>
    </b>
</p>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
</div>

<!--------------------------------------------------------------------------->



<!----------------------------------- END ----------------------------------->

<br>
<div align="center">
    <a href="https://github.com/maysara-elshewehy">
        <img src="https://img.shields.io/badge/Made with ❤️ by-Maysara-blue"/>
    </a>
</div>

<!-------------------------------------------------------------------------->