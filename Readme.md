Create custom document parsers in Javascript.

    npm install waka

Use with:

    var Waka = require('waka')

    var parser = Waka.getParser(parserSource)
    var result = parser.parse(input).result

Include `bundle/index.js` to use in the browser.

Read the [intro](/Intro.md) to learn the syntax.

## Example

This parser converts an arithmetic expression into an AST:
  
    Start =
      e:SumExpr
      { calc: e }
    ;

    SumExpr =
      left:ProductExpr op:('+' / '-') right:SumExpr
      { op: op, left: left, right: right }
    /
      ProductExpr
    ;

    ProductExpr =
      left:Number op:('*' / '/') right:ProductExpr
      { op: op, left: left, right: right }
    /
      Number
    /
      '(' e:SumExpr ')'
      { e }
    ;

    Number =
      num:( [0-9]+ ( '.' [0-9]+ )? )
      { Number(num) }
    ;

Example input and output:

    1/2+3*(4-5)
    ===>
    { calc:
       { op: '+',
         left: { op: '/', left: 1, right: 2 },
         right: { op: '*', left: 3, right: { op: '-', left: 4, right: 5 } } } }

