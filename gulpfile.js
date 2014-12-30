var gulp = require('gulp');
var stylus = require('gulp-stylus');
var concat = require('gulp-concat');
var nodemon = require('gulp-nodemon');

var src = {
  stylus: './public/styl/main.styl'
};
var dist = './public/css/';

var buildStylus = function () {
  gulp.src(src.stylus)
    .pipe(stylus({compress: true}))
    .pipe(concat('bundle.css'))
    .pipe(gulp.dest(dist));
};

gulp.task('default', function () {
  nodemon({ script: './index.js', ext: 'js jade styl', ignore: ['./public/css/bundle.css']})
    .on('start', buildStylus)
    .on('change', buildStylus);
});
