Parser generator for Node and browsers. Compile a DSL to Javascript for execution.

    npm install waka

Use with:

    var Waka = require('./source')

    var parser = Waka.getParser(parserSource)
    var result = parser.parse(input).result

Read the [intro](/Intro.md) to learn the syntax.
