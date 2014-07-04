/*var p = buildParser({
  main: 'start',
  rules: [
    {
      name: 'start',
      def: {
        format: {
          obj: [
            {name: 'a', val: 'a'},
            {name: 'b', val: 'b'},
          ],
          of: {
            seq: [
              // { many: { rule: 'thing' }, set: 'a' },
              { many: { range: [{ oneof: "abx" }] } },
              { opt: { str: 'bbb' }, set: 'b' },
            ]
          },
        }
      }
    },
    {
      name: 'thing',
      def: {
        alt: [{ str: 'a' }, { str: 'x' }]
      } 
    }
  ]
})
p.setDoc("aaxbbbz")
console.log(p.parse())
*/



function buildParser(parser, debug) {

// var ast = MinipegP(parser)
var ast = parser

var slot = 0
var out = "'use strict';"
out += "var _P={"
out += "doc:'',pos:0,adv:true,"
out += "str:function(s){if(_P.adv=_P.doc.substr(_P.pos,s.length)==s)_P.pos+=s.length},"
out += "step:function(x){if(x)_P.pos++;_P.adv=x},"
out += "reset:function(i){_P.pos=i},"
out += "};\n"
out += "function push(ar,v){if(ar==null)ar=[];ar.push(v);return ar}"

out += 'var _rules={};'
ast.rules.forEach(function(rule) {
  putRule(rule.name, rule.def)
})

out += 'return{'
out += 'p:_P,'
out += 'setDoc:function(input){_P.doc=input;_P.pos=0},'
out += 'parse:function(r){'
out += '_P.pos=0;var res=_rules[r||"' + ast.main + '"]();'
out += 'return{done:_P.pos==_P.doc.length, success:_P.adv, result:res}'
out += '}}'

require('fs').writeFileSync('dump.txt', out)
// return Function(out)()
return out

function putRule(name, def) {
  out += '_rules.' + name + '=function(){'
  if(debug)
    out += 'console.log("' + name + '", _P.pos);'
  out += 'var val;'
  put(def, 'val', false)
  out += 'return val'
  out += '}\n'
}

function put(el, set, push) {
  set = set || el.set
  push = push || el.push
  if(el.str) {
    var s = putVar(JSON.stringify(el.str))
    out += '_P.str(' + s + ');'
    out += 'if(_P.adv)'
    putSet(set, push, s)
  }
  else if(el.range) {
    var c = putVar('_P.doc[_P.pos]')
    var cc = putVar(c + '.charCodeAt(0)')
    out += '_P.step('
    for(var i = 0; i < el.range.length; i++) {
      var x = el.range[i]
      if(i > 0) out += '&&'
      if(x.from) {
        out += x.from + '<' + cc + '&&' + cc + '<' + x.to
      }
      else if(x.oneof || x.notof) {
        out += JSON.stringify(x.oneof || x.notof) + '.indexOf(' + c + ')'
        out += x.oneof ? '!=-1' : '==1'
      }
    }
    out += ');'
  }
  else if(el.seq) {
    var start = putVar('_P.pos')
    var scope = fresh()
    out +=  scope + ':{'
    for(var i = 0; i < el.seq.length - 1; i++) {
      put(el.seq[i])
      out += 'if(!_P.adv)break ' + scope + ';'
    }
    put(el.seq[i])
    out += '}'
    out += 'if(!_P.adv)_P.pos=' + start +';'
    if(set) {
      out += 'else '
      putSet(set, push, '_P.doc.substr(' + start + ',_P.pos)')
    }
  }
  else if(el.alt) {
    put(el.alt[0], set, push)
    for(var i = 1; i < el.alt.length; i++) {
      out += 'if(!_P.adv){'
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
  else if(el.rule) {
    var ret = putVar('_rules.' + el.rule +'()')
    out += 'if(_P.adv)'
    putSet(set, push, ret)
  }
  else if(el.action) {
    out += '{' + el.action + '}'
  }
  else if(el.format) {
    var f = el.format
    put(f.of, null, false)
    if(set) {
      var format
      if(f.val) format = f.val
      else if(f.obj) {
        format = '{'
        for(var i = 0; i < f.obj.length; i++) {
          if(i > 0) format += ','
          format += f.obj[i].name + ':' + f.obj[i].val
        }
        format += '}'
      }
      putSet(set, push, format)
    }
    else throw el
  }
  else throw el
}

function fresh() {
  return '$' + (slot++).toString(36)
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

}
