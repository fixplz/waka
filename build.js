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
  newAST2: './assemble/reader-ast-2.json',
}


var buildParser = require(fp.sourceBuilder).buildParser

var orig_ast = JSON.parse(read(!args.new ? fp.sourceAST : fp.newAST))
var source_peg = read(fp.sourcePEG)

var reader = getReader(orig_ast, "first-pass" , fp.dump)
var new_ast = getAST(reader, source_peg, "PEG source", fp.newAST)
// var new_reader = getReader(new_ast, "second-pass", fp.newDump)
// new_ast = getAST(new_reader, source_peg, "PEG source 2", fp.newAST2)


function getReader(ast, name, dump) {
  var src = buildParser(ast, { debug: args.debug })
  write(dump, src)
  return require('vm').runInThisContext(
    '(function() {' + src + '}())',
    name
  )
}

function getAST(reader, peg, name, dump) {
  console.log("Running reader on", name)
  
  var status = reader.parse(peg)
  
  console.log(require('util').inspect(status, { depth: 0 }))

  if(status.success && status.done)
    write(dump, JSON.stringify(status.result, null, "  "))

  return status.result
}

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}
