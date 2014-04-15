var gulp = require('gulp');
var vinylSource = require('vinyl-source-stream');
var watchify = require('watchify');
var ecstatic = require('ecstatic');

gulp.task( 'browserify', function(){
	// use watchify instead of gulp-browserify and gulp.watch
	var bundler = watchify('./src/universe-experiment.js');
	bundler.transform('hbsfy');
	bundler.transform({ global: true }, 'uglifyify');
	var rebundle = function(){
		var bundle = bundler.bundle({ standalone: 'Modular' })
			.pipe( vinylSource('universe-experiment.js') )
			.pipe( gulp.dest('./') );
		return bundle;
	};
	bundler.on( 'update', rebundle );
	return rebundle();
});

gulp.task( 'server', function(){
	var http = require('http');
	var ecstatic = require('ecstatic');
	var ecstatic_server = ecstatic({
		root: __dirname
	});
	http.createServer( ecstatic_server ).listen( 8080 );
});

gulp.task( 'dev', ['server','browserify'] )

gulp.task( 'default', ['dev'] );