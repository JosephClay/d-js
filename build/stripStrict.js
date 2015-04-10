var gutil   = require('gulp-util'),
    through = require('through2'),
    NAME    = 'gulp-stripStrict';

var replace = function(file) {
    return file.replace(/\"use strict\"\;/gi, '')
        .replace(/\'use strict\'\;/gi, '');
};

module.exports = function() {
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError(NAME, 'Streaming not supported'));
            return;
        }

        try {
            file.contents = new Buffer(replace(file.contents.toString()));
            this.push(file);
        } catch (err) {
            this.emit('error', new gutil.PluginError(NAME, err));
        }

        cb();
    });
};