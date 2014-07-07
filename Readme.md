Parser generator for Node and browsers. Compile a DSL to Javascript for execution.

    npm install waka

Use with:

    var Waka = require('waka')

    var parser = Waka.getParser(parserSource)
    var result = parser.parse(input).result

Include `bundle/index.js` to use in the browser.

Read the [intro](/Intro.md) to learn the syntax.
