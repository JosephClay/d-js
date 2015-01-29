var _         = require('underscore'),
    $         = require('jquery'),
    url       = require('./url'),
    benchmark = require('benchmark'),
    Sets      = require('./set/sets');

var bindRun = function(sets) {
    $('#run').on('click', function() {
        sets.runAll();
    });
};

var bindRefreshLinks = function(callback) {
    $('main').on('click', '[data-refresh]', function(e) {
        callback();
    });
};

var setBrowser = function() {
    $('#browser-display').text(benchmark.platform.toString());
};

module.exports = function(data) {
    var sets = new Sets(data),
        runHashTests = function() {
            var hash = url.unhash();
            if (!hash.title) { return; }
            sets.runSet(hash.title);
        };

    bindRun(sets);
    bindRefreshLinks(runHashTests);
    setBrowser();

    _.defer(runHashTests);
};

