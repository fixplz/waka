var _P = {

  doc: '',
  pos: 0,
  adv: true,

  cur: function() {
    return _P.doc[_P.pos]
  },

  match: function(str) {
    if(_P.adv = _P.doc.substr(_P.pos, str.length) == str) {
      _P.pos += str.length
      return str
    }
  },

  step: function(flag) {
    if(_P.adv = flag) {
      _P.pos++
      return _P.doc[_P.pos-1]
    }
  },

  reset: function(pos) {
    _P.pos = pos
  },

  error: function(rule) {
    console.error('Unexpected syntax in ' + rule)
    _P.traceline(_P.pos)
    throw new Error('Cancel parser')
  },

  traceline: function(pos) {
    var l = _P.doc.lastIndexOf('\n', pos), r = _P.doc.indexOf('\n', pos)
    
    if(l == -1)
      l = 0
    else
      l++
    
    if(r == -1)
      r = pos.length

    var lineNo = _P.doc.substring(0, l).split('\n').length
    var line = _P.doc.substring(l, r)
    var pointer = Array(200).join(' ').substr(0, pos - l) + '^^^'

    console.error('Line ' + lineNo + ':')
    console.error(line)
    console.error(pointer)
  },
};

return {
  p: _P,
  parse: function(doc, rule) {
    _P.doc = doc
    _P.pos = 0
    var res = _rules[rule || "Start"]()
    return { success:_P.adv, result:res }
  }
}
