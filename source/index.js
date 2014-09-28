var buildParser = require('./build-parser.js').buildParser

var reader = Function(buildParser(require('./reader-ast.json')))()

module.exports = Waka

function Waka(peg, opts) {
  var p = Function(Waka.getSource(peg, opts))()

  return {
    state: function() {
      return p._P
    },

    exec: function(input) {
      return p.parse(input.toString())
    },

    rule: function(ruleName) {
      return {
        exec: function(input) {
          return p.parse(input, ruleName)
        }
      }
    },
  }
}

Waka.getAST = function(peg) {
  var out = reader.parse(peg)
  return out.result || out
}

Waka.getSource = function(peg, opts) {
  return buildParser(Waka.getAST(peg), opts)
}
