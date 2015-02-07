
![](/waka.png)

# Waka

Parser generator for Node and browsers. Compiles PEG programs to Javascript for execution.

## Installation

    npm install waka

Use with:

    var Waka = require('waka')

    var parser = Waka(peg)

    var result = parser.exec(input)
    if(result.success)
      var value = result.value

Read the [intro](/Intro.md) to learn the supported PEG syntax.

## API reference

### Waka(peg : String) -> parser

Compile your PEG into a runnable parser.

### parser.exec(input : String) -> result

Run your parser on an input. Returns an object with these fields:
- `success : Bool`
- `error : Error`
- `value : *` the value returned by your PEG rule

### parser.startWith(rule : String) -> parser

Get a new parser that will begin execution with the given rule, instead of "Start".

### Waka.getSource(peg : String) -> String

Get PEG program compiled as a JS code string. Use this if you want to make your own API.
