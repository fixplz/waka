exports.buildParser = buildParser

function buildParser(ast, opts) {

if(opts == null) opts = {}

var ruleState

var out = "'use strict';\n"
out += "var _P={\n"
out += "doc:'', pos:0, adv:true,\n"
out += 'cur: function(){ return _P.doc[_P.pos] },'
out += "match: function(str) { if(_P.adv = _P.doc.substr(_P.pos, str.length) == str) { _P.pos += str.length; return str } },\n"
out += "step: function(flag) { if(_P.adv = flag) { _P.pos++; return _P.doc[_P.pos-1] } },\n"
out += "reset: function(pos) { _P.pos = pos },\n"
out += "error: function(rule) { console.error('Unexpected syntax in ' + rule); console.error(_P.getline(_P.pos)); throw new Error('Cancel parser') },\n"
out += "getline: function(pos) { var l = _P.doc.lastIndexOf('\\n', pos), r = _P.doc.indexOf('\\n', pos); if(l == -1) l = 0; else l++; if(r == -1) r = pos.length; return _P.doc.substring(l, r) + '\\n' + '                                                                                                                        '.substr(0, pos - l) + '^^^' },\n"
out += "};\n"

out += ast.init + ';\n'

out += 'var _rules={};\n'
ast.rules.forEach(function(rule) {
  putRule(rule.name, rule.def)
})

out += '\n'
out += 'return {\n'
out += 'p:_P,\n'
out += 'parse: function(doc, rule){\n'
out += '_P.doc = doc;\n'
out += '_P.pos = 0;\n'
out += 'var res = _rules[rule || "Start"]();\n'
out += 'return {done: _P.pos == _P.doc.length, success:_P.adv, result:res}\n'
out += '}\n'
out += '}\n'

return out

function putRule(name, def) {
  ruleState = {
    name: name,
    vars: 0,
  }

  out += '_rules.' + name + ' = function() {\n'

  putExpr('_A', 'false');

  putProcIntro()

  putNode(def, '_R')

  if(name == 'Start')
    out += 'if(_P.pos < _P.doc.length) _P.error("top");\n'

  putProcOutro()

  out += 'return _R;\n'
  out += '}\n'
}

function putNode(el, bind) {
  bind = bind || el.bind

  var match = (
     tryRewrites()
  || tryStr()
  || tryRange()
  || tryRef()
  || tryRange()
  || trySeq()
  || tryAlt()
  || tryAny()
  || tryMany()
  || tryOpt()
  || tryFormat()
  || tryLookahead()
  || tryAnchor()
  )

  if(!match) failBuild(el)

  return

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

function tryStr() {
  if(!el.str) return false

  putExpr(bind, '_P.match(' + stringify(el.str) + ')' )
  
  return true
}

function tryRange() {
  if(!el.range) return false

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

  return true
}

function tryRef() {
  if(!el.ref) return false

  putExpr(bind, '_rules.' + el.ref + '()' )

  return true
}

function trySeq() {
  if(!el.seq) return false

  var block = getName()

  out += block + ':{'

  var startPos = getName()
  putExpr(startPos, '_P.pos')
  var anchor = null

  for(var iter_seq = 0; iter_seq < el.seq.length; iter_seq++) {
    if(el.seq[iter_seq].anchor)
      anchor = putExpr(getName(), 'true')

    putNode(el.seq[iter_seq])
    if(iter_seq < el.seq.length - 1)
      out += 'if(!_P.adv) break ' + block + ';\n'
  }
    
  if(bind) {
    putExpr(bind, '_P.doc.substring(' + startPos + ',_P.pos)')
  }

  out += '}\n'

  if(anchor == null)
    out += 'if(!_P.adv) _P.pos=' + startPos + ';\n'
  else
    out += 'if(!_P.adv && ' + anchor + ') _P.error(' + JSON.stringify(ruleState.name) + ');\n'

  return true
}

function tryAlt() {
  if(!el.alt) return false
  
  for(var iter_alt = 0; iter_alt < el.alt.length; iter_alt++) {
    if(iter_alt > 0)
      out += 'if(!_P.adv){ _P.adv=true;\n'

    putNode(el.alt[iter_alt], bind)

    if(iter_alt > 0)
      out += '}\n'
  }
  
  return true
}

function tryAny() {
  if(!el.any) return false

  if(bind) {
    var arr = putInitArr(bind)
    var arrItem = putVar(getName())
  }

  out += 'for(;;) {\n'

  putNode(el.any, arrItem)
  out += 'if(!_P.adv) break;\n'
  
  if(bind) out += arr + '.push(' + arrItem + ');\n'

  out += '}; _P.adv=true;\n'

  return true
}

function tryMany() {
  if(!el.many) return false

  if(bind) {
    var arr = putInitArr(bind || getName())
    var arrItem = putVar(getName())
  }
  var once = putExpr(getName(), 'false')

  out += 'for(;;) {\n'

  putNode(el.many, arrItem)
  out += 'if(!_P.adv) break;\n'

  if(bind) out += arr + '.push(' + arrItem + ');\n'
  out += once + '=true;\n'

  out += '}; if(' + once + ') _P.adv=true;\n'

  return true
}

function tryOpt() {
  if(!el.opt) return false

  putExpr(bind, 'null')
  putNode(el.opt, bind)
  out += '_P.adv=true;\n'
  
  return true
}

function tryFormat() {
  if(!el.format) return false

  if(el.of)
    putNode(el.of)
  out += 'if(_P.adv)'
  putExpr(bind, '(' + el.format + ')')

  return true
}

function tryLookahead() {
  if(!el.lookahead) return false

  var startPos = putExpr(getName(), '_P.pos')

  putNode(el.lookahead, bind)

  out += '_P.pos=' + startPos + ';\n'
  if(el.not)
    out += '_P.adv=!_P.adv;'  

  return true
}

function tryAnchor() {
  if(!el.anchor) return false

  out += '_A=true;\n'

  return true
}

}


function putProcIntro() {
  if(opts.debug)
    out += 'console.log(">' + ruleState.name + '", _P.pos);\n'
}

function putProcOutro(name) {
  if(opts.debug)
    out += 'console.log("<' + ruleState.name + '", _P.adv ? _P.pos : "X");\n'
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

function failBuild(at) {
  console.error('Invalid parser AST:', at)
  throw new Error('Canceled parser build')
}

// end buildParser
}
