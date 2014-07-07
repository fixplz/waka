var fs = require('fs')
var util = require('util')
var args = require('yargs').argv

var fp = {
  sourceBuilder: './source/build-parser.js',
  sourceAST: './source/reader-ast.json',
  sourcePEG: './source/reader.peg',

  dump: './assemble/stable-builder.dump.js',
  newDump: './assemble/new-builder.dump.js',
  newAST: './assemble/reader-ast.json',
}


var buildParser = require(fp.sourceBuilder).buildParser

var orig_ast = JSON.parse(read(!args.usenew ? fp.sourceAST : fp.newAST))
var source_peg = read(fp.sourcePEG)

var reader = getReader(orig_ast, !args.usenew ? fp.dump : fp.newDump)
var new_ast = getAST(reader, source_peg, "PEG source", fp.newAST)


function getReader(ast, dump) {
  var src = buildParser(ast, { debug: args.debug })
  write(dump, src)
  return require('vm').runInThisContext('(function() {' + src + '}())', 'generated')
}

function getAST(reader, peg, name, dump) {
  console.log("Running reader on", name)
  
  var status = reader.parse(peg)
  
  console.log(require('util').inspect(status, { depth: 0 }))

  if(status.success)
    write(dump, JSON.stringify(status.result, null, "  "))

  return status.result
}

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}
