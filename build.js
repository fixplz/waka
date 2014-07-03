var fs = require('fs')

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
var res = require('util').inspect(out, { depth: null })

write('result.txt', res)

console.log(res)
