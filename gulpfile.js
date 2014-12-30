var gulp = require('gulp');
var stylus = require('gulp-stylus');
var concat = require('gulp-concat');
var watch = require('gulp-watch');
var cssmin = require('gulp-minify-css');
var nodemon = require('gulp-nodemon');

var src = {
  stylus: './public/styl/main.styl'
};
var dist = './dist/build';

var buildStylus = function () {
  gulp.src(src.stylus)
    .pipe(stylus({compress: true}))
    .pipe(concat('bundle.css'))
    .pipe(gulp.dest(dist));
};

gulp.task('default', function () {
  nodemon({ script: './index.js', ext: 'js jade styl', ignore: ['./dist/**']})
    .on('change', buildStylus);
});
