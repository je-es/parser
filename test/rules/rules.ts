// kemet.rules.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import * as parser                                  from '../../lib/parser';
    import * as lexer                                   from '@je-es/lexer';
    import * as syntax                                  from '../libs/syntax/syntax';
    // import { StatementRules }                           from './base/Statement';
    // import { TypeRules }                                from './base/Type';
    import { ExpressionRules }                          from './base/Expression';
    import { HelpersRules } from './base/Helpers';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    // ════════ LEXER ════════
    export const lexerRules     : lexer.Rules = {
        // ═══ Whitespace ═══
        ws              : /\s+/,

        // ═══ Comments ═══
        document        : { match: /\/\/\/[!/]?.*/, value: (text: string) => text.slice(3).trim() },
        comment         : { match: /\/\/[!/]?.*/,   value: (text: string) => text.slice(2).trim() },

        // ═══ Literals ═══
        flt             : /(?:[0-9]*\.[0-9]+|[0-9]+\.[0-9]*)(?:[eE][+-]?[0-9]+)?/,
        bin             : /0b[01]+/,
        oct             : /0o[0-7]+/,
        hex             : /0x[0-9a-fA-F]+/,
        dec             : /[0-9]+/,
        str             : { match: /"(?:[^"\\]|\\.)*"/, value: (text: string) => text.slice(1, -1) },
        char            : { match: /'(?:[^'\\]|\\.)*'/, value: (text: string) => text.slice(1, -1) },
        true            : ['true'],
        false           : ['false'],
        null            : ['null'],
        undefined       : ['undefined'],

        // ═══ Keywords ═══
        use             : ['use'],
        pub             : ['pub'],
        def             : ['def'],
        let             : ['let'],
        fn              : ['fn'],

        mut             : ['mut'],
        inline          : ['inline'],
        struct          : ['struct'],
        enum            : ['enum'],

        if              : ['if'],
        else            : ['else'],

        while           : ['while'],
        for             : ['for'],
        return          : ['return'],
        break           : ['break'],
        continue        : ['continue'],

        switch          : ['switch'],
        case            : ['case'],
        default         : ['default'],

        comptime        : ['comptime'],


        // ═══ Types ═══
        i_type          : { match: /i[0-9]+/ },
        u_type          : { match: /u[0-9]+/ },
        f_type          : ['f16', 'f32', 'f64', 'f80', 'f128'],
        comptime_int    : ['comptime_int'],
        comptime_float  : ['comptime_float'],
        isize           : ['isize'],
        usize           : ['usize'],
        bool            : ['bool'],
        void            : ['void'],
        type            : ['type'],
        any             : ['any'],
        auto            : ['auto'],

        // ═══ Operators ═══
        'and'           : 'and',
        'or'            : 'or',
        '=>'            : '=>', // Variable Assign Block Prefix
        '->'            : '->', // Function Return Prefix
        '.*'            : '.*', // Dereference Suffix
        '@'             : '@',  // Builtin Prefix
        '=='            : '==',
        '!='            : '!=',
        '<='            : '<=',
        '>='            : '>=',
        '+='            : '+=',
        '-='            : '-=',
        '*='            : '*=',
        '/='            : '/=',
        '%='            : '%=',
        '**'            : '**',
        '++'            : '++',
        '--'            : '--',
        '<<'            : '<<',
        '>>'            : '>>',
        '<'             : '<',
        '>'             : '>',
        '|'             : '|',
        '^'             : '^',
        '&'             : '&',
        '='             : '=',
        '+'             : '+',
        '-'             : '-',
        '*'             : '*',
        '/'             : '/',
        '%'             : '%',
        '?'             : '?',
        '!'             : '!',
        '~'             : '~',
        ':'             : ':',
        ';'             : ';',
        ','             : ',',
        '.'             : '.',
        '('             : '(',
        ')'             : ')',
        '{'             : '{',
        '}'             : '}',
        '['             : '[',
        ']'             : ']',

        // ═══ Identifiers ═══
        ident           : /[a-zA-Z_][a-zA-Z0-9_]*/,
    };

    // ════════ PARSER ════════
    export const parserRules    : parser.Types.Rules = [...[

        // parser.createRule('Root',
        //     parser.oneOrMore(parser.rule('Statement')),
        // ),

    ], ...HelpersRules as parser.Types.Rules, ...ExpressionRules as parser.Types.Rules];

    // ════════ SETTINGS ════════
    export const parserSettings : parser.Types.ParserSettings = {
        startRule           : 'Expression',

        errorRecovery       : {
            mode            : 'resilient',
            maxErrors       : 0,
        },

        ignored             : ['ws', 'comment'],
        debug               : 'off',
        maxDepth            : 100,
        maxCacheSize        : 1024, // 1GB
    };

    // ════════ SYNTAX ════════
    export const Syntax = syntax.create({
        name     : 'Kemet',
        version  : '0.0.1',
        lexer    : lexerRules,
        parser   : parserRules,
        settings : parserSettings
    });

// ╚══════════════════════════════════════════════════════════════════════════════════════╝