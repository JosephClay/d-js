var fs          = require('fs'),
    path        = require('path'),
    prettyBytes = require('pretty-bytes'),
    gzipSize    = require('gzip-size');

var replaceFootprint = function(needle, relative, done) {
    var file = path.resolve(relative);
    var data = fs.readFileSync(file);
    var size = gzipSize.sync(data);
    var sizeHuman = prettyBytes(size).replace(/\s+/g, '');
    var readmeFile = path.resolve('./README.md');
    var readme = fs.readFileSync(readmeFile, { encoding: 'utf8' });
    var output = readme.replace(needle, '$1' + sizeHuman + '$3');

    fs.writeFile(readmeFile, output, { encoding: 'utf8'}, done);
};

module.exports = function(done) {
    var dominusNeedle = /(with a footprint of \*\*)(\S*)(\*\* minified and gzipped)/mig;
    var jqueryNeedle = /(vs the \*\*)(\S*)(\*\* in jQuery)/mig;

    replaceFootprint(dominusNeedle, './dist/dominus.min.js', function() {
        replaceFootprint(jqueryNeedle, './node_modules/jquery/dist/jquery.min.js', function() {
            done();
        });
    });
};