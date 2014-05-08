var _cache = require('../../cache'),

    _attributeCache = _cache(),
    _pseudoCache    = _cache(),

    _ATTRIBUTE_SELECTOR = /\[\s*[\w-]+\s*[!$^*]?=\s*(['"]?)(.*?[^\\]|[^\\]*)\1\s*\]/g,
    // TODO: Test this regex
    _PSEUDO_SELECT = /(:[^\s]+)/g,

    _proxySelectors = require('./list/proxySelectors');

var _getAttributePositions = function(str) {
    return _attributeCache.getOrSet(str, function() {
        var pairs = [];
        // Not using return value. Simply using it to iterate
        // through all of the matches to populate match positions
        str.replace(_ATTRIBUTE_SELECTOR, function(match, cap1, cap2, position) {
            pairs.push([ position, position + match.length ]);
        });
        return pairs;
    });
};

var _pseudoReplace = function(str, positions) {
    return _pseudoCache.getOrSet(str, function() {
        return str.replace(_PSEUDO_SELECT, function(match, cap, position) {
            var isOutsideOfAttribute = true,
                idx = 0, length = positions.length;
            for (; idx < length; idx++) {
                var pos = positions[idx];
                if (position > pos[0] && position < pos[1]) {
                    isOutsideOfAttribute = false;
                    break;
                }
            }

            if (!isOutsideOfAttribute) { return match; }

            return _proxySelectors[match] ? _proxySelectors[match] : match;
        });
    });
};

module.exports = function(str) {
    var attributePositions = _getAttributePositions(str);
    return _pseudoReplace(str, attributePositions);
};
