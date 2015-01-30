var gulp       = require('gulp'),
	log        = require('./build/utils/log'),
	buffer     = require('vinyl-buffer'),
    source     = require('vinyl-source-stream'),
    browserify = require('browserify');

gulp.task('d', function() {
    browserify('./src/index.js', {
            standalone: 'D',
            debug: true
        })
        .bundle()
        .pipe(source('d.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./dist'))
        .pipe(log('Success'));
});

gulp.task('internal', function() {
    browserify('./src/internal-index.js', {
            standalone: 'D',
            debug: true
        })
        .bundle()
        .pipe(source('d.internal.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./dist'))
        .pipe(log('Success'));
});

gulp.task('dev', function() {
    gulp.watch('./src/**/*.js', function() {
        gulp.start(['d', 'internal']);
    });
});

gulp.task('default', ['d', 'internal']);