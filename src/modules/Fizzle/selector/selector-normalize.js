var SUPPORTS            = require('SUPPORTS'),

    ATTRIBUTE_SELECTOR = /\[\s*[\w-]+\s*[!$^*]?(?:=\s*(['"]?)(.*?[^\\]|[^\\]*))?\1\s*\]/g,
    PSEUDO_SELECT      = /(:[^\s\(\[)]+)/g,
    CAPTURE_SELECT     = /(:[^\s^(]+)\(([^\)]+)\)/g,
    pseudoCache        = require('cache')(),
    proxySelectors     = require('./proxy'),
    captureSelectors   = require('./capture');

var getAttributePositions = function(str) {
    var pairs = [];
    // Not using return value. Simply using it to iterate
    // through all of the matches to populate match positions
    str.replace(ATTRIBUTE_SELECTOR, function(match, cap1, cap2, position) {
        pairs.push([ position, position + match.length ]);
    });
    return pairs;
};

var isOutsideOfAttribute = function(position, positions) {
    var idx = 0, length = positions.length;
    for (; idx < length; idx++) {
        var pos = positions[idx];
        if (position > pos[0] && position < pos[1]) {
            return false;
        }
    }
    return true;
};

var pseudoReplace = function(str, positions) {
    return str.replace(PSEUDO_SELECT, function(match, cap, position) {
        if (!isOutsideOfAttribute(position, positions)) { return match; }

        return proxySelectors[match] ? proxySelectors[match] : match;
    });
};

var captureReplace = function(str, positions) {
    var captureSelector;
    return str.replace(CAPTURE_SELECT, function(match, cap, value, position) {
        if (!isOutsideOfAttribute(position, positions)) { return match; }

        return (captureSelector = captureSelectors[cap]) ? captureSelector.replace('x', value) : match;
    });
};

var booleanSelectorReplace = SUPPORTS.selectedSelector ?
    // IE10+, modern browsers
    function(str) { return str; } :
    // IE8-9
    function(str) {
        var positions = getAttributePositions(str),
            idx = positions.length,
            pos,
            selector;

        while (idx--) {
            pos = positions[idx];
            selector = str.substring(pos[0], pos[1]);
            if (selector === '[selected]') {
                str = str.substring(0, pos[0]) + '[selected="selected"]' + str.substring(pos[1]);
            }
        }

        return str;
    };

module.exports = function(str) {
    return pseudoCache.has(str) ? pseudoCache.get(str) : pseudoCache.put(str, function() {
        var attrPositions = getAttributePositions(str);
        str = pseudoReplace(str, attrPositions);
        str = booleanSelectorReplace(str);
        return captureReplace(str, attrPositions);
    });
};
