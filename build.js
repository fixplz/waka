var fs = require('fs')
var util = require('util')
var vm = require('vm')

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}



var parser = require('./minipeg-old.js')

var reader = parser(read('reader.peg'))
write('./temp/reader.js', reader)
var reader_func = eval(reader)

console.log("\n== Running\n")

var reader2_ast = reader_func(read('reader2.peg')) 
write('./temp/reader2-gen1-ast.txt', util.inspect(reader2_ast, { depth: null }))

console.log("== Running new parser\n")

vm.runInThisContext(read('Minipeg2.js'), 'Minipeg2.js')

var reader2_gen2 = buildParser(reader2_ast, { debug: true })
write('./temp/reader2-gen2.js', reader2_gen2.toString())
var reader2_func = reader2_gen2()

reader2_func.setDoc(read('test.peg'))
var reader2_out = reader2_func.parse()

console.log('Success:', reader2_out.success, 'Done:', reader2_out.done)
write('./temp/reader2-gen2-ast.txt', util.inspect(reader2_out.result, { depth: null }))

console.log('\n== Done!\n')
