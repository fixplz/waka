exports.buildParser = buildParser

function buildParser(ast, opts) {

if(opts == null) opts = null

var ruleState

var out = "'use strict';\n"
out += "var _P={\n"
out += "doc:'', pos:0, adv:true,\n"
out += 'cur: function(){ return _P.doc[_P.pos] },'
out += "match: function(str) { if(_P.adv = _P.doc.substr(_P.pos, str.length) == str) { _P.pos += str.length; return str } },\n"
out += "step: function(flag) { if(_P.adv = flag) { _P.pos++; return _P.doc[_P.pos-1] } },\n"
out += "reset: function(pos) { _P.pos = pos },\n"
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
    vars: 0,
  }

  out += '_rules.' + name + ' = function() {\n'

  putProcIntro(name)

  putNode(def, '_R')

  putProcOutro(name)

  out += 'return _R;\n'
  out += '}\n'
}

function putNode(el, bind) {
  bind = bind || el.set

  if(el.any && (el.any.str || el.any.range) && bind) {
      putNode({ seq: [{ any: el.any }], set: bind })
  }
  
  else if(el.many && (el.many.str || el.many.range) && bind) {
      putNode({ seq: [{ many: el.many }], set: bind })
  }

  else if(el.ref) {    
    putExpr(bind, '_rules.' + el.ref + '()' )
  }

  else if(el.str) {
    putExpr(bind, '_P.match(' + stringify(el.str) + ')' )
  }

  else if(el.range) {
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

  else if(el.seq) {
    var block = getName()

    out += block + ':{'

    var startPos = getName()
    putExpr(startPos, '_P.pos')

    for(var iter_seq = 0; iter_seq < el.seq.length; iter_seq++) {
      putNode(el.seq[iter_seq])
      if(iter_seq < el.seq.length - 1)
        out += 'if(!_P.adv)break ' + block + ';\n'
    }
      
    if(bind) {
      putExpr(bind, '_P.doc.substring(' + startPos + ',_P.pos)')
    }

    out += '}\n'

    out += 'if(!_P.adv) _P.pos=' + startPos + ';\n'
  }

  else if(el.alt) {
    for(var iter_alt = 0; iter_alt < el.alt.length; iter_alt++) {
      if(iter_alt > 0)
        out += 'if(!_P.adv){ _P.adv=true;\n'

      putNode(el.alt[iter_alt], bind)

      if(iter_alt > 0)
        out += '}\n'
    }
  }

  else if(el.any) {
    if(bind) {
      var arr = putInitArr(bind)
      var arrItem = putVar(getName())
    }

    out += 'for(;;) {\n'

    putNode(el.any, arrItem)
    out += 'if(!_P.adv) break;'
    
    if(bind) out += arr + '.push(' + arrItem + ');\n'

    out += '}; _P.adv=true;\n'
  }

  else if(el.many) {
    if(bind) {
      var arr = putInitArr(bind || getName())
      var arrItem = putVar(getName())
    }
    var once = putVar(getName())

    out += 'for(;;) {\n'

    putNode(el.many, arrItem)
    out += 'if(!_P.adv) break;'

    if(bind) out += arr + '.push(' + arrItem + ');\n'
    out += once + '=true;\n'

    out += '}; if(' + once + ') _P.adv=true;\n'
  }

  else if(el.opt) {
    putExpr(bind, 'null')
    putNode(el.opt, bind)
    out += '_P.adv=true;\n'
  }

  else if(el.format) {
    if(el.format.of)
      putNode(el.format.of)
    out += 'if(_P.adv)'
    putExpr(bind, '(' + (el.format.val || el.format.obj) + ')')
  }

  else failBuild(el)

}



function putProcIntro(name) {
  if(opts.debug)
    out += 'console.log(">' + name + '", _P.pos);\n'
}

function putProcOutro(name) {
  if(opts.debug)
    out += 'console.log("<' + name + '", _P.adv ? _P.pos : "X");\n'
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
