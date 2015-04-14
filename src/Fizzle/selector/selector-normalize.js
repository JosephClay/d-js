var SUPPORTS           = require('SUPPORTS'),
    PSEUDO_SELECT      = /(:[^\s\(\[)]+)/g,
    SELECTED_SELECT    = /\[selected\]/gi,
    cache              = require('cache')(),
    proxies            = require('./proxy.json');

module.exports = function(str) {
    return cache.has(str) ? cache.get(str) : cache.put(str, function() {
        // pseudo replace if the captured selector is in the proxies
        var s = str.replace(PSEUDO_SELECT, (match) => proxies[match] ? proxies[match] : match);

        // boolean selector replacement?
        // supports IE8-9
        return SUPPORTS.selectedSelector ? s : s.replace(SELECTED_SELECT, '[selected="selected"]');
    });
};