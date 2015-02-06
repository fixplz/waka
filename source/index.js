var buildParser = require('./build-parser.js').buildParser

var reader = Function(buildParser(require('./reader-ast.json')))()

module.exports = Waka

function Waka(peg, opts) {
  var parser = Function(Waka.getSource(peg, opts))()
  return _waka(parser, 'Start')

  function _waka(parser, startRule) {
    return {
      getState: function() {
        return parser.state
      },

      exec: function(input) {
        if(! parser.rules[startRule])
          throw new Error('start rule missing: ' + JSON.stringify(startRule))

        parser.state.setInput(input)

        try {
          var value = parser.rules[startRule]()
        }
        catch(err) {
          var error = err
        }

        if(error == null) {
          if(! parser.state.isEOF())
            var error = new Error('input not fully parsed')
        }

        return {
          success: error == null,
          value: value,
          error: error
        }
      },

      startWith: function(rule) {
        return _waka(parser, rule)
      },
    }
  }
}

Waka.getAST = function(peg) {
  reader.state.setInput(peg)
  return reader.rules.Start()
}

Waka.getSource = function(peg, opts) {
  return buildParser(Waka.getAST(peg), opts)
}
