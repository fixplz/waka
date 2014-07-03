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


