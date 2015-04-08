var fs          = require('fs'),
    path        = require('path'),
    prettyBytes = require('pretty-bytes'),
    gzipSize    = require('gzip-size');

var replaceFootprint = function(needle, relative, done) {
    var file       = path.resolve(relative),
        data       = fs.readFileSync(file),
        size       = gzipSize.sync(data),
        sizeHuman  = prettyBytes(size).replace(/\s+/g, ''),
        readmeFile = path.resolve('./README.md'),
        readme     = fs.readFileSync(readmeFile, { encoding: 'utf8' }),
        output     = readme.replace(needle, '$1' + sizeHuman + '$3');

    fs.writeFile(readmeFile, output, { encoding: 'utf8'}, done);
};

module.exports = function(done) {
    var dNeedle = /(with a footprint of )(\S*)( minified and gzipped)/mig;
    var jqueryNeedle = /(vs the )(\S*)( in jQuery)/mig;

    replaceFootprint(dNeedle, './dist/d.min.js', function() {
        replaceFootprint(jqueryNeedle, './node_modules/jquery/dist/jquery.min.js', done);
    });
};