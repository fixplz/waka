exports.buildParser = buildParser

var fs = require('fs')

function buildParser(ast, opts) {

if(opts == null) opts = {}

var ruleState
var out = ''

putDebug()
putInit()

ast.rules.forEach(function(rule) {
  putRule(rule.name, rule.def)
})

out += fs.readFileSync(__dirname + '/parser-state.js', 'utf8')

out +=
  'var _P = new ParserState\n'
+ 'return {\n'
+ '  state: _P,\n'
+ '  rules: _rules,\n'
+ '}\n'


return out

function putInit() {
  out += "'use strict';\n"
  out += 'var _rules={};\n'

  if(ast.init)
    out += ast.init + ';\n'
}

function putRule(name, def) {
  ruleState = {
    name: name,
    vars: 0,
  }

  out += '_rules.' + name + ' = function() {\n'

  putProcIntro()

  putNode(def, '_R')

  putProcOutro()

  out += 'return _R;\n'
  out += '}\n'
}

function putNode(el, bind) {
  bind = bind || el.bind

  if(tryRewrites()) return

  return (
    el.str ?            putStr() :
    el.range ?          putRange() :
    el.ref ?            putRef() :
    el.seq ?            putSeq() :
    el.alt ?            putAlt() :
    el.any || el.many ? putMany() :
    el.opt ?            putOpt() :
    el.format ?         putFormat() :
    el.lookahead ?      putLookahead() :
    el.special ?        putSpecial()
    : abortCompile(el)
  )

function tryRewrites() {
  if(el.any && bind && isSimple(el.any)) {
    putNode({ seq: [{ any: el.any }], bind: bind })
    return true
  }
  if(el.many && bind && isSimple(el.many)) {
    putNode({ seq: [{ many: el.many }], bind: bind })
    return true
  }
  return false
}

function isSimple(el) {
  if(el.str || el.range || el.seq) return true
  if(el.alt) return el.alt.some(isSimple)
  if(el.any) return isSimple(el.any)
  if(el.many) return isSimple(el.many)
  if(el.opt) return isSimple(el.opt)
  return false
}

function putStr() {
  putExpr(bind, '_P.match(' + stringify(el.str) + ')' )
}

function putRange() {
  var curChar = getName()
  putExpr(curChar, '_P.cur()')
  out += 'if(' + curChar + '==null){'
  out += '_P.adv=false;\n'
  putExpr(bind, 'null')
  out += '}else{\n'

  putBindStart(bind)

  out += '_P.step('
  if(el.not)
    out += '!('

  for(var iter_r = 0; iter_r < el.range.length; iter_r++) {
    var r = el.range[iter_r]

    if(r.from)
      out += stringify(r.from) + '<=' + curChar + '&&' + curChar + '<=' + stringify(r.to)
    else
      out += stringify(r.oneof) + '.indexOf(' + curChar + ')!=-1'

    if(iter_r < el.range.length - 1) out += '||'
  }
  if(el.not)
    out += ')'
  out += ');\n'

  out += '}\n'
}

function putRef() {
  putExpr(bind, '_rules.' + el.ref + '()' )
}

function putSeq() {
  var block = getName()

  out += block + ':{'

  var startPos = getName()
  var startLine = getName()
  putExpr(startPos, '_P.pos')
  putExpr(startLine, '_P.line')
  var anchor = null

  for(var iter_seq = 0; iter_seq < el.seq.length; iter_seq++) {
    if(el.seq[iter_seq].anchor) {
      anchor = putExpr(getName(), 'true')
      continue
    }

    putNode(el.seq[iter_seq])
    if(iter_seq < el.seq.length - 1)
      out += 'if(!_P.adv) break ' + block + ';\n'
  }
    
  if(bind) {
    putExpr(bind, '_P.doc.substring(' + startPos + ',_P.pos)')
  }

  out += '}\n'

  if(anchor)
    out += 'if(!_P.adv && ' + anchor + ') _P.unexpected(' + JSON.stringify(ruleState.name) + ');\n'

  out += 'if(!_P.adv) { _P.pos=' + startPos + '; _P.line=' + startLine + '; }\n'
}

function putAlt() {
  for(var iter_alt = 0; iter_alt < el.alt.length; iter_alt++) {
    if(iter_alt > 0)
      out += 'if(!_P.adv){ _P.adv=true;\n'

    putNode(el.alt[iter_alt], bind)

    if(iter_alt > 0)
      out += '}\n'
  }
}

function putMany() {
  var many = el.many || el.any

  if(many.delim) {
    if(many.sep) {
      var septoken = many.sep
      many = many.delim
    }
  }

  if(bind) {
    var arr = putInitArr(bind)
    var arrItem = putVar(getName())
  }

  var once = putExpr(getName(), 'false')

  out += 'for(;;) {\n'

  var startPos = getName()
  var startLine = getName()
  putExpr(startPos, '_P.pos')
  putExpr(startLine, '_P.line')

  if(septoken) {
    out += 'if(' + once + ') {'
    putNode(septoken)
    out += '}'
    out += 'if(!_P.adv) break;\n'
  }

  putNode(many, arrItem)
  out += 'if(!_P.adv) break;\n'
  
  if(bind) out += arr + '.push(' + arrItem + ');\n'

  out += once + '=true;\n'

  out += '}\n'
  out += 'if(!_P.adv) { _P.pos=' + startPos + '; _P.line=' + startLine + '; }\n'

  if(el.many)
    out += 'if(' + once + ') _P.adv=true;\n'
  else
    out += '_P.adv=true;\n'
}

function putOpt() {
  putExpr(bind, 'null')
  putNode(el.opt, bind)
  out += '_P.adv=true;\n'
}

function putFormat() {
  if(el.of)
    putNode(el.of)
  out += 'if(_P.adv)'
  putExpr(bind, '(' + el.format + ')')
}

function putLookahead() {
  var startPos = putExpr(getName(), '_P.pos')

  if(el.embed)
    out += '_P.adv=(' + el.embed + ');\n'
  else
    putNode(el.lookahead, bind);

  out += '_P.pos=' + startPos + ';\n'
  if(el.not)
    out += '_P.adv=!_P.adv;'  
}

function putSpecial() {
  if(el.special == 'nl') {
    out += '_P.match("\\r"); _P.match("\\n");\n'
    out += 'if(_P.adv) _P.line++;\n'
  }
  else if(el.special == 'any') {
    putBindStart(bind)
    out +='_P.step(true);\n'
  }
  else if(el.special.embed) {
    putBindStart(bind)
    out += '(' + el.special.embed + ');\n'
  }
  else if(el.special.match) {
    putBindStart(bind)
    out += '_P.match(' + el.special.match + ');\n'
  }
  else
    abortCompile(el)
}

}

function putDebug() {
  if(opts.debug) {
    out += 'var _traceIndent = "";\n'
    out += 'function traceIn(rule) { _P.log((_traceIndent + ">" + rule + "                              ").slice(0,30), _P.tracePos(_P.pos)); _traceIndent += " " }\n';
    out += 'function traceOut(rule) { _P.log(((_traceIndent = _traceIndent.slice(1)) + "<" + rule + "                              ").slice(0,30), _P.adv ? _P.tracePos(_P.pos) : "X") }\n';
  }
}

function putProcIntro() {
  if(opts.debug && ruleState.name[0] == ruleState.name[0].toUpperCase())
    out += 'traceIn(' + JSON.stringify(ruleState.name) + ');\n'
}

function putProcOutro(name) {
  if(opts.debug && ruleState.name[0] == ruleState.name[0].toUpperCase())
    out += 'traceOut(' + JSON.stringify(ruleState.name) + ');\n'
}

function putBindStart(bind) {
  if(bind) out += 'var ' + bind + '='
}

function putExpr(bind, expr) {
  if(bind) out += 'var ' + bind + '='
  out += expr + ';\n'
  return bind
}

function putVar(name) {
  out += 'var ' + name + ';\n'
  return name
}

function putInitArr(name) {
  out += 'var ' + name + ' = [];\n'
  return name
}

function getName() {
  return '$' + (ruleState.vars++).toString(36)
}

function stringify(str) {
  return '"' + str.replace(/(")/g, '\\$1') + '"'
}

function abortCompile(at) {
  console.error('Invalid parser AST:', at)
  throw new Error('Invalid parser AST')
}

// end buildParser
}
