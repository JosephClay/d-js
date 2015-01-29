var gulp       = require('gulp'),
    less       = require('gulp-less'),
    watch      = require('gulp-watch'),
    buffer     = require('vinyl-buffer'),
    sourcemaps = require('gulp-sourcemaps'),
    source     = require('vinyl-source-stream'),
    browserify = require('browserify');

var styles = function() {
    gulp.src('./css/styles.less')
        .pipe(less())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./css/'));
};

var scripts = function() {
    browserify('./src/index.js', {
            standalone: 'profiler',
            debug: true
        })
        .bundle()
        .pipe(source('profiler.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./js/'));
};

gulp.task('styles', function() {
    styles();
});

gulp.task('scripts', function() {
    scripts();
});

gulp.task('watch-styles', function() {
    watch('./css/**/*.less', function() {
        styles();
    });
});

gulp.task('watch-scripts', function() {
    watch('./src/**/*.js', function() {
        gulp.start(['scripts']);
    });
});

gulp.task('watch', ['styles', 'scripts', 'watch-styles', 'watch-scripts']);