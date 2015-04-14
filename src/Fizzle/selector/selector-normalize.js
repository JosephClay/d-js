var SUPPORTS           = require('SUPPORTS'),
    PSEUDO_SELECT      = /(:[^\s\(\[)]+)/g,
    SELECTED_SELECT    = /\[selected\]/gi,
    cache              = require('cache')(),
    proxies            = require('./proxy.json');

var pseudoReplace = function(str) {
    return str.replace(PSEUDO_SELECT, (match) => proxies[match] ? proxies[match] : match);
};

// IE8-9
var booleanSelectorReplace = (str) => str.replace(SELECTED_SELECT, '[selected="selected"]');

module.exports = function(str) {
    return cache.has(str) ? cache.get(str) : cache.put(str, function() {
        var s = pseudoReplace(str);
        return SUPPORTS.selectedSelector ? s : booleanSelectorReplace(s);
    });
};