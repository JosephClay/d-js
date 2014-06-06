var _      = require('_'),

    _cache = require('../cache'),

    _singleTagCache = _cache(),
    _specificParentCache = _cache(),

    _rSingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

    _parentMap = {
        'table':    /^<(?:tbody|tfoot|thead|colgroup|caption)\b/,
        'tbody':    /^<(?:tr)\b/,
        'tr':       /^<(?:td|th)\b/,
        'colgroup': /^<(?:col)\b/
    };

var _parseSingleTag = function(htmlStr) {
    if (htmlStr.length > 30) { return null; }

    var singleTagMatch = _singleTagCache.getOrSet(htmlStr, function() {
        return _rSingleTag.exec(htmlStr);
    });

    if (!singleTagMatch) { return null; }

    return [ document.createElement(singleTagMatch[1]) ];
};

var _getParentTagName = function(htmlStr) {
    htmlStr = htmlStr.substr(0, 30);
    return _specificParentCache.getOrSet(htmlStr, function() {
        var parentTagName;
        for (parentTagName in _parentMap) {
            if (_parentMap[parentTagName].test(htmlStr)) {
                return parentTagName;
            }
        }
        return 'div';
    });
};

// http://jsperf.com/js-push-vs-index11/2
var _parse = function(htmlStr) {
    var singleTag = _parseSingleTag(htmlStr);
    if (singleTag) { return singleTag; }

    var parentTagName = _getParentTagName(htmlStr);

    var parent = document.createElement(parentTagName);
    parent.innerHTML = htmlStr;

    var child,
        idx = parent.children.length,
        arr = [];

    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};

var _parseHtml = function(str) {
    var result = _parse(str);
    if (!result || !result.length) { return null; }
    return D(result);
};

module.exports = {
    parseHtml: _parse,

    // Top-level functions attached directly to D.
    // Invoked via `D.parseHTML('...')`, as opposed to `D('div').parseHTML('...')`.
    D: {
        parseHtml: _parseHtml,
        // Because no one know what the case should be
        parseHTML: _parseHtml
    }
};
