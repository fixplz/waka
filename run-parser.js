#!/usr/bin/env node

var fs = require('fs')
var util = require('util')

var args =
  require('yargs')
    .usage("Usage: $0 [source] [input]")
    .demand(2)
    .argv

var Waka = require('./')

var parserSource = fs.readFileSync(args._[0], 'utf8')

var inputSource = args._[1]


if(inputSource == '-') {
  var input = ''
  process.stdin.on('data',
    function(d) { input += d.toString() })
  process.stdin.on('end',
    function() { runParser() })
}
else {
  var input = inputSource
  runParser()
}


function runParser() {
  var result = Waka(parserSource).exec(input)
  console.log(util.inspect(result.result, { depth: null }))
}
