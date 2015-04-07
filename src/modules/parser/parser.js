var _regex = require('../../regex'),

    MAX_SINGLE_TAG_LENGTH = 30;

var parseString = function(parentTagName, htmlStr) {
    var parent = document.createElement(parentTagName);
    parent.innerHTML = htmlStr;
    return parent;
};

var _parseSingleTag = function(htmlStr) {
    if (htmlStr.length > MAX_SINGLE_TAG_LENGTH) { return null; }

    var singleTagMatch = _regex.singleTagMatch(htmlStr);
    if (!singleTagMatch) { return null; }

    var elem = document.createElement(singleTagMatch[1]);

    return [ elem ];
};

var _parse = function(htmlStr) {
    var singleTag = _parseSingleTag(htmlStr);
    if (singleTag) { return singleTag; }

    var parentTagName = _regex.getParentTagName(htmlStr),
        parent        = parseString(parentTagName, htmlStr);

    var child,
        idx = parent.children.length,
        arr = [];

    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);

        // http://jsperf.com/js-push-vs-index11/2
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};

var _parseHtml = function(str) {
    if (!str) { return null; }
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
