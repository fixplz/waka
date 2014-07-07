#! node

var fs = require('fs')
var util = require('util')

var args =
  require('yargs')
    .usage("Usage: $0 [source] [input]")
    .demand(2)
    .argv

function read(f) {
  return fs.readFileSync(f, 'utf8')
}


var Waka = require('./')

var parser = Waka.getParser(read(args._[0]))

console.log(
  util.inspect(parser.parse(args._[1]).result, { depth: null }) )
