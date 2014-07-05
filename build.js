var fs = require('fs')
var util = require('util')

var fp = {
  stableBuilder: './source/build-parser.js',
  stableAST: './source/reader-ast.json',
  stablePEG: './source/reader.peg',

  stableDump: './assemble/stable-builder.dump.js',
  newAST: './assemble/reader-ast.json',
  newDump: './assemble/new-builder.dump.js',
}

console.log('Building stable parser')

var buildParser = require(fp.stableBuilder).buildParser

var ast_orig = JSON.parse(read(fp.stableAST))

var reader_orig_src = buildParser(ast_orig)
write(fp.stableDump, reader_orig_src)

var reader = Function(reader_orig_src)()

console.log('Parsing new AST')

var result_ast_new = reader.parse(read(fp.stablePEG))

console.log(util.inspect(result_ast_new, { depth: 1 }))

if(! result_ast_new.success && ! result_ast_new.done)
  process.exit(1)

var ast_new = result_ast_new.result

write(fp.newAST, JSON.stringify(ast_new, null, "  "))

console.log('Building new parser')

var reader_new_src = buildParser(ast_new)

write(fp.newDump, reader_new_src)

process.exit(0)

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}
