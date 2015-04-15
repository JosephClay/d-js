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
        callback(this.getAttribute('href'));
    });
};

var setBrowser = function() {
    $('#browser-display').text(benchmark.platform.toString());
};

module.exports = function(data) {
    var sets = new Sets(data),
        runHashTests = function(href) {
            var hash = url.unhash(href);
            if (!hash.title) { return; }
            sets.runSet(hash.title);
        };

    bindRun(sets);
    bindRefreshLinks(runHashTests);
    setBrowser();

    _.defer(runHashTests);
};

