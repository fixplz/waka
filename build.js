var fs = require('fs')
var util = require('util')
var vm = require('vm')

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}

function writeInspect(f, ast) {
  write(f, util.inspect(ast, { depth: null }))
}



var reader1 = generateNewReaderOldSyntax()

console.log("\n== Running old reader\n")

var reader2_ast = runOldReader(reader1)

console.log("== Running new generator\n")

var reader2 = generateNewReaderNewGenerator(reader2_ast)

runNewReader(reader2)

console.log('\n== Done!\n')


function generateNewReaderOldSyntax() {
  var p = require('./minipeg-old.js')

  var readerSrc = p(read('reader.peg'))
  write('./temp/reader.js', readerSrc)

  return eval(readerSrc)
}

function runOldReader(reader) {
  var ast = reader(read('reader2.peg'))
  writeInspect('./temp/reader2-gen1-ast.txt', ast)
  return ast
}

function generateNewReaderNewGenerator(ast) {
  vm.runInThisContext(read('Minipeg2.js'), 'Minipeg2.js')

  var reader2Fn = buildParser(ast, { debug: true })
  write('./temp/reader2-gen2.js', reader2Fn.toString())

  return reader2Fn()
}

function runNewReader(reader) {
  reader.setDoc(read('test.peg'))
  var result = reader.parse()

  console.log('Success:', result.success, 'Done:', result.done)
  write('./temp/reader2-gen2-ast.txt', util.inspect(result.result, { depth: null }))

  return result
}
