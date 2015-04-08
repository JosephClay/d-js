var REGEX = require('REGEX'),
    MAX_SINGLE_TAG_LENGTH = 30;

var parseString = function(parentTagName, htmlStr) {
    var parent = document.createElement(parentTagName);
    parent.innerHTML = htmlStr;
    return parent;
};

var parseSingleTag = function(htmlStr) {
    if (htmlStr.length > MAX_SINGLE_TAG_LENGTH) { return null; }

    var singleTagMatch = REGEX.singleTagMatch(htmlStr);
    if (!singleTagMatch) { return null; }

    var elem = document.createElement(singleTagMatch[1]);

    return [ elem ];
};

var parse = function(htmlStr) {
    var singleTag = parseSingleTag(htmlStr);
    if (singleTag) { return singleTag; }

    var parentTagName = REGEX.getParentTagName(htmlStr),
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

var parseHtml = function(str) {
    if (!str) { return null; }
    var result = parse(str);
    if (!result || !result.length) { return null; }
    return D(result);
};

module.exports = {
    parseHtml: parse,

    // Top-level functions attached directly to D.
    // Invoked via `D.parseHTML('...')`, as opposed to `D('div').parseHTML('...')`.
    D: {
        parseHtml: parseHtml,
        // Because no one know what the case should be
        parseHTML: parseHtml
    }
};
