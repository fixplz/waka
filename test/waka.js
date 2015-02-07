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

  t.end()
})

tap.test('json', function(t) {
  var json = Waka(
    fs.readFileSync(path.resolve(__dirname, '../examples/json.peg'), 'utf8'))

  var blob = fs.readFileSync(path.resolve(__dirname, 'blob.json'), 'utf8')

  t.deepEqual(
    json.exec(blob).value,
    JSON.parse(blob)
  )

  t.end()
})

tap.test('errors', function(t) {

  var abc = Waka('Start = a* b* c; a = "a"; b = "b"; c = "c";')
  var result

  t.deepEqual(
    result = abc.exec('abc'),
    { success: true, value: 'abc', error: undefined},
    "match should have a result")

  t.deepEqual(
    result = abc.exec('xyz'),
    { success: false, value: undefined, error: new Error()},
    "mismatch should have an error")

  t.equal(result.error.message, 'Unexpected syntax in top',
    "error message should be 'Unexpected syntax in top'")
  t.equal(abc.getState().pos, 0,
    "position should be 0")

  var ab = Waka('Start = ab; ab = a:a+ b:b+ {a:a,b:b}; a = "a"; b = "b";')

  t.deepEqual(
    result = ab.exec('aaaaab'),
    { success: true, value: {a: ['a','a','a','a','a'], b: ['b']}, error: undefined },
    "complex PEG should have a result")

  t.deepEqual(
    result = ab.exec('aaaaabx'),
    { success: false, value: undefined, error: new Error() },
    "complex PEG should have an error")

  t.equal(result.error.message, 'Unexpected syntax in top',
    "error message should be 'Unexpected syntax in top'")

  t.equal(ab.getState().pos, 6,
    "position should be at mismatch")

  t.equal(ab.getTrace(result.error.message),
    "Unexpected syntax in top\nLine 1:\naaaaabx\n      ^^^",
    "location trace should be correct")

  var ab2 = Waka('Start = ab+; ab = %anc a:a+ b:b+ ; a = "a"; b = "b";')

  t.deepEqual(
    result = ab2.exec('aaaaa'),
    { success: false, value: undefined, error: new Error() },
    "complex anchor PEG should have an error")

  t.equal(result.error.message, 'Unexpected syntax in ab',
    "complex PEG anchor name should appear in error")

  var lines = Waka('Start = (word "\\n")+; word = [a-z]+;')

  t.deepEqual(
    result = lines.exec('abc\ndef\n!!!\njkl\n'),
    { success: false, value: undefined, error: new Error() },
    "multiline PEG should have an error")

  t.equal(lines.getTrace(result.error.message),
    "Unexpected syntax in top\nLine 3:\n!!!\n^^^",
    "multiline trace should have correct line")

  t.end()
})

tap.test('stability', function(t) {
  var compiler = require('../source/compiler.js')

  function compile(ast) {
    return compiler.buildParser(ast)
  }

  var parserOutput = compile(JSON.parse(fs.readFileSync(path.resolve(__dirname, '../source/parser.peg.json'), 'utf8')))

  var parserSource = fs.readFileSync(path.resolve(__dirname, '../source/parser.peg'), 'utf8')

  var iter = 0
  var parserOriginal = parserOutput

  while(iter < 5) {
    var parser = Function(parserOutput)()
    parser.state.doc = parserSource
    parser.state.pos = 0
    var parserOutput = compile(parser.rules.Start())
    t.ok(parserOutput == parserOriginal, "output should stay the same")
    iter += 1
  }

  t.end()
})
