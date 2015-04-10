var gulp      = require('gulp'),
    uglify    = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    size      = require('gulp-size'),
    
    undefToVoid = require('./build/undefToVoid'),
    stripStrict = require('./build/stripStrict'),

    clean     = require('./build/clean'),
    scripts   = require('./build/scripts'),
    footprint = require('./build/footprint'),
    bump      = require('./build/bump'),
    header    = require('./build/header'),

    UGLIFY_OPTS = require('./build/uglify-opts.json');

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

gulp.task('build', function() {
    return scripts.build({
            debug:      true,
            src:        './src/index.js',
            paths:      ['./src'],
            standalone: 'D',
            file:       'd.js',
            dest:       './dist'
        }).stream
        .pipe(header(extended))
        .pipe(gulp.dest('./dist'));
});

gulp.task('minify', function() {
    return scripts.build({
            debug:      false,
            src:        './src/index.js',
            paths:      ['./src'],
            standalone: 'D',
            file:       'd.min.js'
        }).stream
        .pipe(streamify(undefToVoid()))
        .pipe(streamify(stripStrict()))
        .pipe(streamify(uglify(UGLIFY_OPTS)))
        .pipe(header(succint))
        .pipe(streamify(size()))
        .pipe(gulp.dest('./dist'));
});

gulp.task('dev', function() {
    scripts.watch({
        debug:      true,
        src:        './src/index.js',
        paths:      ['./src'],
        standalone: 'D',
        file:       'd.js',
        dest:       './dist'
    });
});

gulp.task('clean', clean('./dist'));
gulp.task('footprint', footprint);
gulp.task('bump', bump);
gulp.task('default', ['clean', 'build']);
gulp.task('release', ['clean', 'build', 'minify']);
