'use strict';

var gulp         = require('gulp');
var gutil        = require('gulp-util');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var sass         = require('gulp-sass');
var sourceMaps   = require('gulp-sourcemaps');
var imagemin     = require('gulp-imagemin');
var minifyCSS    = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var browserSync  = require('browser-sync');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

gulp.task('browserSync', function() {
  browserSync({
    server: {
      port: 3000
    },
    options: {
        reloadDelay: 250
    },
    notify: false
  });
});

//compressing images & handle SVG files
gulp.task('images', function(tmp) {
  gulp.src(['img/*.jpg', 'img/*.png'])
    .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
    .pipe(gulp.dest('img'));
});

//compiling our Javascripts
gulp.task('scripts', function() {
  return browserify('src/js/app.js')
    .bundle()
    .on('error', gutil.log)
    .pipe(source('index.js'))
    .pipe(buffer())
    //.pipe(sourceMaps.init({loadMaps: true})) // loads map from browserify file
    //.pipe(sourceMaps.write('./'))
    .pipe(uglify().on('error', gutil.log))
    .pipe(gulp.dest('./'))
    //notify browserSync to refresh
    .pipe(browserSync.reload({stream: true}));
});

//compiling our SCSS files
gulp.task('styles', function() {
  //the initializer / master SCSS file, which will just be a file that imports everything
  return gulp.src('src/scss/index.scss')
    //get sourceMaps ready
    .pipe(sourceMaps.init())
    //include SCSS and list every "include" folder
    .pipe(sass({
          errLogToConsole: true,
          includePaths: [
              'src/scss'
          ]
    }))
    .pipe(autoprefixer({
       browsers: autoPrefixBrowserList,
       cascade:  true
    }))
    .on('error', gutil.log)
    .pipe(concat('index.css'))
    .pipe(minifyCSS())
    //get our sources via sourceMaps
    .pipe(sourceMaps.write())
    .pipe(gulp.dest('./'))
    //notify browserSync to refresh
    .pipe(browserSync.reload({stream: true}));
});

//basically just keeping an eye on all HTML files
gulp.task('html', function() {
  //watch any and all HTML files and refresh when something changes
  return gulp.src('./*.html')
    .pipe(browserSync.reload({stream: true}))
  .on('error', gutil.log);
});

gulp.task('default', ['browserSync', 'scripts', 'styles'], function() {
  gulp.watch('src/js/**', ['scripts']).on('change', browserSync.reload);
  gulp.watch('src/scss/**', ['styles']).on('change', browserSync.reload);
  gulp.watch('img/**', ['images']).on('change', browserSync.reload);
  gulp.watch('./*.html', ['html']).on('change', browserSync.reload);
});