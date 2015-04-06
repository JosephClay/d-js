var gulp       = require('gulp'),
    watchify   = require('watchify'),
    browserify = require('browserify'),
    babelify   = require('babelify'),
    source     = require('vinyl-source-stream'),
    log        = require('./log');

var build = function(opts) {
    var stream = browserify({
            debug:        true,
            cache:        {},
            packageCache: {},
            paths:        opts.paths || [],
            standalone:   opts.standalone || ''
        })
        .add(opts.src)
        .transform(babelify);

    return {
        stream: stream,

        bundle: function() {
            return stream.bundle()
                .on('error', log.event('error')(opts.file))
                .on('end', log.event('end')(opts.file))
                .on('time', log.time(1000))
                .pipe(source(opts.file))
                .pipe(gulp.dest(opts.dest));
        }
    };
};

module.exports = {
    build: function(opts) {
        return build(opts).bundle();
    },

    watch: function(opts) {
        var b = build(opts);
        watchify(b.stream).on('update', b.bundle);
        b.bundle();
    }
};
