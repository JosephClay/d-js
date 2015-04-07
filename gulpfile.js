var gulp    = require('gulp'),
    scripts = require('./build/scripts');

var normal = {
    src: './src/index.js',
    dest: './dist',
    file: 'D.js',
    standalone: 'D',
    paths: [ './src' ]
};
var internal = {
    src: './src/internal.js',
    dest: './dist',
    file: 'd.internal.js',
    standalone: 'D',
    paths: [ './src' ]
};

gulp.task('d', function() {
    return scripts.build(normal);
});

gulp.task('internal', function() {
    return scripts.build(internal);
});

gulp.task('dev', function() {
    scripts.watch(normal);
    scripts.watch(internal);
});

gulp.task('default', ['d', 'internal']);