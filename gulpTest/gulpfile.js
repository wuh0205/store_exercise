var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    minifycss = require('gulp-minify-css'),
    // rimraf = require('gulp-rimraf'),
    // htmlReplace = require('gulp-html-replace');
    linker = require('gulp-linker'),
    del = require('del'),
    webserver = require('gulp-webserver');

gulp.task('minifyjs',function () {
  return gulp.src('./src/js/**/*.js')
         .pipe(concat('all.js'))
         .pipe(uglify())
         .pipe(gulp.dest('./dist/js/'));
});

gulp.task('minifycss',function () {
  return gulp.src('./src/css/*.css')
         .pipe(concat('all.css'))
         .pipe(minifycss())
         .pipe(gulp.dest('./dist/css/'));
});

gulp.task('writeLinks',['minifyjs', 'minifycss'],function () {
  return gulp.src('./index.html')
        .pipe(linker({
          scripts: [ "./dist/js/**/*.js" ],
          startTag: '<!--SCRIPTS-->',
          endTag: '<!--SCRIPTS END-->',
          fileTmpl: '<script src="%s"></script>'
        }))
        .pipe(linker({
          scripts: [ "./dist/css/*.css" ],
          startTag: '<!--CSS-->',
          endTag: '<!--CSS END  -->',
          fileTmpl: '<link rel="stylesheet" href="%s">',
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('build',function (cb) {
  //remove old files
  del(['./dist']);

  gulp.start('writeLinks');
});

gulp.task('server', function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      open: true,
      fallback: 'index.html'
    }));
});

/**
  还需了解：
   1.watch 以及剩余gulp api
   2.压缩html，图片
*/
