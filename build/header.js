var header    = require('gulp-header'),
    streamify = require('gulp-streamify');

module.exports = function(text) {
    var pkg = require('../package.json');
    return streamify(
        header(text, { pkg: pkg })
    );
};
