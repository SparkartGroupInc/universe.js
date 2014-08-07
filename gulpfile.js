var gulp = require('gulp');
var vinylSource = require('vinyl-source-stream');
var watchify = require('watchify');
var ecstatic = require('ecstatic');
var gulpRename = require('gulp-rename');
var gulpUglify = require('gulp-uglify');

var minifyScript = function(){
  console.log('minifying script...');
  gulp.src('universe.js')
    .pipe( gulpUglify() )
    .pipe( gulpRename('universe.min.js') )
    .pipe( gulp.dest('./') )
    .on( 'end', function(){
      console.log('minification complete.');
    });
};

gulp.task( 'browserify', function(){
  // use watchify instead of gulp-browserify and gulp.watch
  var bundler = watchify('./index.js');
  bundler.transform('hbsfy');
  var rebundle = function(){
    var bundle = bundler.bundle({
      standalone: 'Universe',
      debug: true
    })
      .pipe( vinylSource('universe.js') )
      .pipe( gulp.dest('./') )
      .on( 'end', minifyScript );
    return bundle;
  };
  bundler.on( 'update', rebundle );
  return rebundle();
});

gulp.task( 'minify', minifyScript );

gulp.task( 'server', function(){
  var http = require('http');
  var ecstatic = require('ecstatic');
  var ecstatic_server = ecstatic({
    root: __dirname
  });
  http.createServer( ecstatic_server ).listen( 8080 );
});

gulp.task( 'dev', ['server','browserify'] );

gulp.task( 'default', ['dev'] );