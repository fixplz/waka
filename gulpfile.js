var gulp = require('gulp')

var browserify = require('gulp-browserify')
var uglify = require('gulp-uglify')

gulp.task('bundle', function() {
  gulp.src('source/index.js')
    .pipe(browserify({
      standalone: 'Waka',
    }))
    .pipe(uglify())
    .pipe(gulp.dest('bundle/'))
})

gulp.task('default', ['bundle'])
