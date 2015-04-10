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

module.exports = function(htmlStr) {
    var singleTag = parseSingleTag(htmlStr);
    if (singleTag) { return singleTag; }

    var parentTagName = REGEX.getParentTagName(htmlStr),
        parent        = parseString(parentTagName, htmlStr);

    var child,
        idx = parent.children.length,
        arr = new Array(idx);

    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};
