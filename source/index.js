var compiler = require('./compiler')

var pegParser = Function(compiler.buildParser(require('./parser.peg.json')))()

module.exports = Waka

function Waka(peg, opts) {
  var parser = Function(Waka.getSource(peg, opts))()
  return _waka(parser, (opts && opts.startRule) || 'Start')
}

Waka.compiler = compiler

Waka.getAST = function(peg) {
  var result = _waka(pegParser, 'Start').exec(peg)

  if(result.error) {
    console.error('Error in PEG: ', result.error.message)
    console.error(pegParser.state.traceLine())
    throw result.error
  }

  return result.value
}

Waka.getSource = function(peg, opts) {
  return compiler.buildParser(Waka.getAST(peg), opts)
}

Waka.getSourceStandalone = function(peg, opts) {
  function iif(str) {
    return '(function(){' + str + '})()'
  }
  return iif(
    _waka.toString() + ';\n' +
      'return _waka(' +
        iif(compiler.buildParser(Waka.getAST(peg), opts))
        + ',' + JSON.stringify(opts && 'startRule' in opts ? opts.startRule : 'Start') + ')'
  )
}

function _waka(parser, startRule) {
  if(startRule && ! parser.rules[startRule])
    throw new Error('start rule missing: ' + JSON.stringify(startRule))

  return {
    getState: function() {
      return parser.state
    },

    getTrace: function(message) {
      return (message ? message + '\n' : '') + parser.state.traceLine()
    },

    exec: function(input) {
      if(! startRule)
        throw new Error('no start rule given')

      parser.state.setInput(input)

      try {
        var value = parser.rules[startRule]()
      }
      catch(err) {
        var error = err
      }

      if(error == null) {
        if(! parser.state.isEOF())
          var error = new Error(
            parser.state.adv ? 'Input not fully parsed' : 'Unexpected syntax in top')
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
