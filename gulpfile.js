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

function compile(ast) {
  var compiler = require('./source/compiler.js')
  var src = compiler.buildParser(ast, { debug: args.debug })
  saveBuild('compiled.js', src)
  return require('vm').runInThisContext('(function() {' + src + '}())', 'generated')
}

function runParser(reader, peg) {
  console.log("Running parser")

  reader.state.doc = peg
  reader.state.pos = 0
  var result = reader.rules.Start()

  console.log('state =', {
    pos: reader.state.pos,
    adv: reader.state.adv,
    eof: reader.state.isEOF(),
  })

  console.log('result =', result)

  if(result)
    saveBuild('parser.peg.json', JSON.stringify(result, null, "  "))

  return result
}

function readSource(file) {
  return fs.readFileSync(file, 'utf8')
}

function saveBuild(name, content) {
  try { fs.mkdirSync(path.resolve('./build')) } catch(_) {}
  fs.writeFileSync(path.resolve('./build', name), content, 'utf8')
}
