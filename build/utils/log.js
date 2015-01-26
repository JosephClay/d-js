var through  = require('through2'),
    gutil    = require('gulp-util'),

    log = function(message) {
        return through.obj(function(file, enc, callback) {
            this.push(file);

            gutil.log(message);
            callback();
        });
    },

    color = function(color) {
        return function(message) {
            return gutil.colors[color](message);
        };
    };

module.exports = log;

log.message = function(message) {
    return gutil.log(message);
};

// all available text colors
log.black   = color('black');
log.red     = color('red');
log.green   = color('green');
log.yellow  = color('yellow');
log.blue    = color('blue');
log.magenta = color('magenta');
log.cyan    = color('cyan');
log.white   = color('white');
log.gray    = color('gray');

log.beep = function() {
    gutil.beep();
};