#!/usr/bin/env node

var fs = require('fs')
var util = require('util')
var args = require('yargs').argv

var fp = {
  sourceBuilder: './source/compiler.js',
  sourceAST: './source/parser.peg.json',
  sourcePEG: './source/parser.peg',

  dump: './assemble/stable-builder.dump.js',
  newDump: './assemble/new-builder.dump.js',
  newAST: './assemble/parser.peg.json',
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
  
  reader.state.doc = peg
  reader.state.pos = 0
  var result = reader.rules.Start()

  console.log(require('util').inspect(
    {
      state: {
        pos: reader.state.pos,
        adv: reader.state.adv,
        eof: reader.state.isEOF(),
      },
      result: result,
    },
    { depth: 1 }))

  if(result)
    write(dump, JSON.stringify(result, null, "  "))

  return result
}

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}
