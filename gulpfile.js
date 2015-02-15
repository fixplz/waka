var gulp = require('gulp')

gulp.task('bundle', function() {
  var browserify = require('gulp-browserify')
  var uglify = require('gulp-uglify')
  gulp.src('source/index.js')
    .pipe(browserify({
      standalone: 'Waka',
    }))
    .pipe(uglify())
    .pipe(gulp.dest('bundle/'))
})

var fs = require('fs')
var path = require('path')
var args = require('yargs').argv

gulp.task('build', function(done) {
  var parserSource =
    ! args.usenew
      ? './source/parser.peg.json'
      : './build/parser.peg.json'

  runParser(
    compile(JSON.parse(readSource(parserSource))),
    readSource('./source/parser.peg'))

  done()
})

gulp.task('replace', ['build'], function(done) {
  fs.renameSync('./build/parser.peg.json', './source/parser.peg.json')
  done()
})

function compile(ast) {
  var compiler = require('./source/compiler.js')
  var src = compiler.buildParser(ast, { debug: args.debug })
  saveBuild('compiled.js', src)
  return require('vm').runInThisContext('(function() {' + src + '}())', 'generated')
}

function runParser(reader, peg) {
  console.log("Running parser")

  var parser = require('./').wrapper(reader, 'Start')

  var result = parser.exec(peg)

  console.log('done')
  console.log(reader.state.tracePos())
  console.log('error =', result.error)
  console.log('result =', result.value)

  if(result.value)
    saveBuild('parser.peg.json', JSON.stringify(result.value, null, "  "))

  return result
}

function readSource(file) {
  return fs.readFileSync(file, 'utf8')
}

function saveBuild(name, content) {
  try { fs.mkdirSync(path.resolve('./build')) } catch(_) {}
  fs.writeFileSync(path.resolve('./build', name), content, 'utf8')
}
