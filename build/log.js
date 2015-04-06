var _        = require('lodash'),
    beep     = require('beepbeep'),
    through  = require('through2'),
    gulpUtil = require('gulp-util'),

    log = function(message) {
        return through.obj(function(file, enc, callback) {
            this.push(file);

            gulpUtil.log(message);
            callback();
        });
    },

    color = function(color) {
        return function(message) {
            return gulpUtil.colors[color](message);
        };
    };

module.exports = _.extend(log, {
    message: function(message) {
        return gulpUtil.log(message);
    },

    fn: function(message) {
        return function() {
            gulpUtil.log(message);
        };
    },

    event: function(type) {
        return function() {
            var args = _.slice(arguments).join(': '),
                prefix = type === 'error' ? log.red('Error: ') :
                         type === 'end' ? log.green('Success: ') : '',
                message = prefix + args;

            return function(err) {
                gulpUtil.log(message);

                if (type === 'error') {
                    beep();
                    console.error(err.message);
                }
            };
        };
    },

    time: function(expect) {
        return function(time) {
            var style = time < expect ? color('green') : color('red');
            gulpUtil.log('built in: '+ style(time + 'ms'));
        };
    },

    // all available text colors
    black:   color('black'),
    red:     color('red'),
    green:   color('green'),
    yellow:  color('yellow'),
    blue:    color('blue'),
    magenta: color('magenta'),
    cyan:    color('cyan'),
    white:   color('white'),
    gray:    color('gray'),

    beep: function() {
        gulpUtil.beep();
    }
});
