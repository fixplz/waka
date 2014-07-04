var fs = require('fs')
var util = require('util')

function read(f) {
  return fs.readFileSync(f, 'utf8')
}

function write(f, contents) {
  fs.writeFileSync(f, contents, 'utf8')
}



var parser = require('./minipeg-old.js')


var reader = parser(read('reader.peg'))
write('reader.js', reader)

var reader_func = eval(reader)

console.log()
console.log("== Running")
console.log()

var out = reader_func(read('reader2.peg')) 
var ins = util.inspect(out, { depth: null })
write('result.txt', ins)

console.log("== Running new parser")
console.log()

var vm = require('vm')

vm.runInThisContext(read('Minipeg2.js'), 'Minipeg2.js')

var reader_gen2 = buildParser(out, { debug: true })
write('reader_gen2.js', reader_gen2.toString())

var reader_func2 = reader_gen2()

reader_func2.setDoc(read('test.peg'))
var out2 = reader_func2.parse()
console.log('Success:', out2.success, 'Done:', out2.done)
var ins2 = util.inspect(out2.result, { depth: null })
write('result2.txt', ins2)


console.log()
console.log('== Done!')
