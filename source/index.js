var buildParser = require('./compiler').buildParser

var reader = Function(buildParser(require('./parser.peg.json')))()

module.exports = Waka

function Waka(peg, opts) {
  var parser = Function(Waka.getSource(peg, opts))()
  return _waka(parser, (opts && opts.startRule) || 'Start')

  function _waka(parser, startRule) {
    if(! startRule)
      throw new Error('no start rule given')

    if(! parser.rules[startRule])
      throw new Error('start rule missing: ' + JSON.stringify(startRule))

    return {
      getState: function() {
        return parser.state
      },

      exec: function(input) {
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
