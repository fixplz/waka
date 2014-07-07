
# Waka

Parser generator for Node and browsers. Compile a DSL to Javascript for execution.

### Installation

    npm install waka

Use with:

    var Waka = require('waka')

    var parser = Waka.getParser(parserSource, options)
    var result = parser.parse(input).result

Or include `bundle/index.js` in your page to use in the browser.

Read the [intro](/Intro.md) to learn the syntax.

### Reference

#### Waka.getParser(source, options) -> parser

Turn PEG source into JS code end eval it via `Function`.

#### Waka.getRaw(source, options) -> string

Turn PEG source into JS code and return it as a string. It should be wrapped in `(function() { })` before executing.

#### options

* `debug` - if true, generated code will emit `console.log()` traces while parsing.

#### parser

Object representing an evaluated parser.

#### parser.parse(input) -> { success : bool, result : ? }

Execute the parser.
