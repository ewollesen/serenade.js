(function() {
  var Jison, grammar, o, parser, unwrap;
  unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;
  o = function(patternString, action, options) {
    var match;
    patternString = patternString.replace(/\s{2,}/g, ' ');
    if (!action) {
      return [patternString, '$$ = $1;', options];
    }
    action = (match = unwrap.exec(action)) ? match[1] : "(" + action + "())";
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');
    return [patternString, "$$ = " + action + ";", options];
  };
  grammar = {
    Root: [
      o('', function() {
        return null;
      }), ['Element', 'return $$']
    ],
    Element: [
      o('IDENTIFIER AttributeArgument', function() {
        return new Monkey.Element($1, $2);
      }), o('IDENTIFIER AttributeArgument INDENT ChildList OUTDENT', function() {
        return new Monkey.Element($1, $2, $4);
      }), o('IDENTIFIER AttributeArgument WHITESPACE InlineChildList', function() {
        return new Monkey.Element($1, $2, $4);
      })
    ],
    InlineChildList: [
      o('InlineChild', function() {
        return [$1];
      }), o('InlineChildList WHITESPACE InlineChild', function() {
        return $1.concat($3);
      })
    ],
    InlineChild: [
      o('IDENTIFIER', function() {
        return new Monkey.TextNode($1, true);
      }), o('STRING_LITERAL', function() {
        return new Monkey.TextNode($1, false);
      })
    ],
    ChildList: [
      o('', function() {
        return [];
      }), o('Child', function() {
        return [$1];
      }), o('ChildList TERMINATOR Child', function() {
        return $1.concat($3);
      })
    ],
    Child: [
      o('Element', function() {
        return $1;
      }), o('STRING_LITERAL', function() {
        return new Monkey.TextNode($1, false);
      })
    ],
    AttributeArgument: [
      o('', function() {
        return [];
      }), o('LPAREN RPAREN', function() {
        return [];
      }), o('LPAREN AttributeList RPAREN', function() {
        return $2;
      })
    ],
    AttributeList: [
      o('Attribute', function() {
        return [$1];
      }), o('AttributeList WHITESPACE Attribute', function() {
        return $1.concat($3);
      })
    ],
    Attribute: [
      o('IDENTIFIER ASSIGN IDENTIFIER', function() {
        return new Monkey.Attribute($1, $3, true);
      }), o('IDENTIFIER ASSIGN STRING_LITERAL', function() {
        return new Monkey.Attribute($1, $3, false);
      })
    ]
  };
  Jison = require("jison").Parser;
  parser = new Jison({
    tokens: [],
    bnf: grammar,
    startSymbol: 'Root'
  });
  exports.Parser = parser;
}).call(this);