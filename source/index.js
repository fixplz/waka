var buildParser = require('./build-parser.js').buildParser

var reader = Function(buildParser(require('./reader-ast.json')))()


exports.getRaw = function(source, opts) {
  return buildParser(reader.parse(source).result, opts)
}

exports.getParser = function(source, opts) {
  return Function(buildParser(reader.parse(source).result, opts))()
}
