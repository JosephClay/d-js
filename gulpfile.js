var gulp      = require('gulp'),
    rename    = require('gulp-rename'),
    header    = require('gulp-header'),
    uglify    = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    size      = require('gulp-size'),

    clean     = require('./build/clean'),
    scripts   = require('./build/scripts'),
    footprint = require('./build/footprint'),
    bump      = require('./build/bump'),
    header    = require('./build/header');

var extended = [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''
].join('\n');

var succint = '// <%= pkg.name %>@v<%= pkg.version %>, <%= pkg.license %> licensed. <%= pkg.homepage %>\n';

var config = {
    src:        './src/index.js',
    paths:      ['./src'],
    standalone: 'D',
    file:       'D.js',
    dest:       './dist'
};

gulp.task('build', function() {
    return scripts.build(config).save();
});

gulp.task('release', function(done) {
    return scripts.build(config)
        .stream
        .pipe(header(extended))
        .pipe(gulp.dest('./dist'))
        .pipe(streamify(rename('d.min.js')))
        .pipe(streamify(uglify()))
        .pipe(header(succint))
        .pipe(streamify(size()))
        .pipe(gulp.dest('./dist'))
        .on('end', footprint.bind(null, done));
});

gulp.task('dev', function() {
    scripts.watch(config);
});

gulp.task('clean', clean('./dist'));
gulp.task('footprint', footprint);
gulp.task('build', ['clean', 'build']);
gulp.task('bump', bump);
gulp.task('default', ['build']);
