var tap = require('tap')
var fs = require('fs')
var path = require('path')

var Waka = require('../')

tap.test('calc', function(t) {
  
  var calc = Waka(
    fs.readFileSync(path.resolve(__dirname, '../examples/calc.peg'), 'utf8'))

  t.deepEqual(
    calc.exec('2+2').value,
    { calc:
      { op: '+', left: 2, right: 2 } }
  )

  t.deepEqual(
    calc.exec('2-2-2').value,
    { calc:
      { op: '-', left: { op: '-', left: 2, right: 2 }, right: 2 } }
  )

  t.deepEqual(
    calc.exec('2-2*2+2/2').value,
    { calc:
      { op: '+',
        left: { op: '-', left: 2, right: { op: '*', left: 2, right: 2 } },
        right: { op: '/', left: 2, right: 2 } } }
  )

  t.deepEqual(
    calc.exec('(2+2)*2').value,
    { calc:
      { op: '*',
        left: { op: '+', left: 2, right: 2 },
        right: 2 } }
  )

  var json = Waka(
    fs.readFileSync(path.resolve(__dirname, '../examples/json.peg'), 'utf8'))

  var blob = fs.readFileSync(path.resolve(__dirname, 'blob.json'), 'utf8')

  t.deepEqual(
    json.exec(blob).value,
    JSON.parse(blob)
  )

  t.end()

})
