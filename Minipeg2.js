
function buildParser(parser, opts) {

// var ast = MinipegP(parser)
var ast = parser

var slot = 0
var out = "'use strict';\n"
out += "var _P={\n"
out += "doc:'',pos:0,adv:true,\n"
out += "str:function(s){if(_P.adv=_P.doc.substr(_P.pos,s.length)==s)_P.pos+=s.length},\n"
out += "step:function(x){if(x)_P.pos++;_P.adv=x},\n"
out += "reset:function(i){_P.pos=i},\n"
out += "};\n"
out += "function push(ar,v){if(ar==null)ar=[];ar.push(v);return ar}\n\n"

out += ast.init + ';\n'

out += 'var _rules={};\n'
ast.rules.forEach(function(rule) {
  putRule(rule.name, rule.def)
})

out += '\n'
out += 'return{\n'
out += 'p:_P,\n'
out += 'setDoc:function(input){_P.doc=input;_P.pos=0},\n'
out += 'parse:function(r){\n'
out += '_P.pos=0;var res=_rules[r||"Start"]();\n'
out += 'return{done:_P.pos==_P.doc.length, success:_P.adv, result:res}\n'
out += '}}\n'

// require('fs').writeFileSync('dump.txt', out)
return Function(out)
// return out

function putRule(name, def) {
  out += '_rules.' + name + '=function(){'
  if(opts.debug)
    out += 'console.log(">' + name + '", _P.pos);'
  out += 'var _RETURN;'
  put(def, '_RETURN', false)
  if(opts.debug)
    out += 'console.log("<' + name + '", _P.adv ? _P.pos : "x");'
  out += 'return _RETURN'
  out += '}\n'
}

function put(el, set, push) {
  set = set || el.set
  push = push || el.push
  if(el.str) {
    var s = putVar(stringify(el.str))
    out += '_P.str(' + s + ');'
    if(set) {
      out += 'if(_P.adv)'
      putSet(set, push, s)
    }
  }
  else if(el.range) {
    var c = putVar('_P.doc[_P.pos]')
    out += 'if(' + c + '==null)_P.adv=false; else{'
    var cc = putVar(c + '.charCodeAt(0)')
    out += '_P.step('
    if(el.not) out += '!('
    for(var i = 0; i < el.range.length; i++) {
      var x = el.range[i]
      if(i > 0) out += '||'
      if(x.from) {
        out += x.from.charCodeAt(0) + '<=' + cc + '&&' + cc + '<=' + x.to.charCodeAt(0)
      }
      else if(x.oneof) {
        out += stringify(x.oneof) + '.indexOf(' + c + ')!=-1'
      }
    }
    if(el.not) out += ')'
    out += ');'
    if(set) {
      putSet(set, push, c)
    }
    out += '}'
  }
  else if(el.seq) {
    var start = putVar('_P.pos')
    var scope = fresh()
    out +=  scope + ':{'
    for(var i = 0; i < el.seq.length - 1; i++) {
      put(el.seq[i])
      out += 'if(!_P.adv)break ' + scope + ';'
    }
    put(el.seq[i], set)
    out += '}'
    out += 'if(!_P.adv)_P.pos=' + start +';'
    /*if(set) {
      out += 'else '
      putSet(set, push, '_P.doc.substr(' + start + ',_P.pos)')
    }*/
  }
  else if(el.alt) {
    put(el.alt[0], set, push)
    for(var i = 1; i < el.alt.length; i++) {
      out += 'if(!_P.adv){'
      out += '_P.adv=true;'
      put(el.alt[i], set, push)
      out += '}'
    }
  }
  else if(el.any) {
    if(set && !push) putArr(set)
    out += 'do{'
    put(el.any, set, true)
    out += '}while(_P.adv)_P.adv=true;'
  }
  else if(el.many) {
    var once = putVar('false')
    if(set && !push) putArr(set)
    out += 'do{'
    put(el.many, set, true)
    out += once + '=true;'
    out += '}while(_P.adv)'
    out += 'if(' + once + ')_P.adv=true;'
  }
  else if(el.opt) {
    put(el.opt, set, push)
    if(set) {
      out += 'if(!_P.adv)'
      putSet(set, push, 'null')
    }
    out += '_P.adv=true;'
  }
  else if(el.ref) {
    var ret = putVar('_rules.' + el.ref +'()')
    if(set) {
      out += 'if(_P.adv)'
      putSet(set, push, ret)
    }
  }
  else if(el.action) {
    out += '{' + el.action + '}'
  }
  else if(el.format) {
    var f = el.format
    if(f.of) put(f.of, null, false)
    if(set) {
      var format
      if(f.val) format = f.val
      else if(f.obj) {
        format = f.obj
        /*format = '{'
        for(var i = 0; i < f.obj.length; i++) {
          if(i > 0) format += ','
          format += f.obj[i].name + ':' + f.obj[i].val
        }
        format += '}'*/
      }
      putSet(set, push, format)
    }
    else failBuild(el)
  }
  else failBuild(el)
}

function fresh() {
  return '$' + (slot++).toString(36)
}

function stringify(str) {
  return '"' + str.replace(/(")/g, '\\$1') + '"'
}

function putVar(val) {
  var n = fresh()
  out += 'var ' + n + (val != null ? '=' + val : '') + ';'
  return n
}

function putSet(set, push, val) {
  out += 'var ' + set + '=' + (!push ? val : 'push(' + set +',' + val + ')') + ';'
}

function putArr(set) {
  out += 'var ' + set + '=[];'
}

function failBuild(at) {
  console.error('Invalid parser AST:', at)
  throw new Error('Canceled parser build')
}

}
