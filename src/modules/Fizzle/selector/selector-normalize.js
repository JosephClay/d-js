var _ATTRIBUTE_SELECTOR = /\[\s*[\w-]+\s*[!$^*]?=\s*(['"]?)(.*?[^\\]|[^\\]*)\1\s*\]/g,
    _PSEUDO_SELECT      = /(:[^\s\(\[)]+)/g,
    _CAPTURE_SELECT     = /(:[^\s^(]+)\(([^\)]+)\)/g,

    _cache              = require('../../../cache'),
    _pseudoCache        = _cache(),

    _proxySelectors     = require('../list/selectors-proxy'),
    _captureSelectors   = require('../list/selectors-capture');

var _getAttributePositions = function(str) {
    var pairs = [];
    // Not using return value. Simply using it to iterate
    // through all of the matches to populate match positions
    str.replace(_ATTRIBUTE_SELECTOR, function(match, cap1, cap2, position) {
        pairs.push([ position, position + match.length ]);
    });
    return pairs;
};

var _isOutsideOfAttribute = function(position, positions) {
    var idx = 0, length = positions.length;
    for (; idx < length; idx++) {
        var pos = positions[idx];
        if (position > pos[0] && position < pos[1]) {
            return false;
        }
    }
    return true;
};

var _pseudoReplace = function(str, positions) {
    return str.replace(_PSEUDO_SELECT, function(match, cap, position) {
        if (!_isOutsideOfAttribute(position, positions)) { return match; }

        return _proxySelectors[match] ? _proxySelectors[match] : match;
    });
};

var _captureReplace = function(str, positions) {
    var captureSelector;
    return str.replace(_CAPTURE_SELECT, function(match, cap, value, position) {
        if (!_isOutsideOfAttribute(position, positions)) { return match; }

        return (captureSelector = _captureSelectors[cap]) ? captureSelector.replace('x', value) : match;
    });
};

module.exports = function(str) {
    return _pseudoCache.getOrSet(str, function() {
        var attrPositions = _getAttributePositions(str);
        str = _pseudoReplace(str, attrPositions);
        return _captureReplace(str, attrPositions);
    });
};
