var REGEX = require('REGEX'),
    MAX_SINGLE_TAG_LENGTH = 30,
    create = require('DIV/create');

var parseString = function(parentTagName, htmlStr) {
    var parent = create(parentTagName);
    parent.innerHTML = htmlStr;
    return parent;
};

var parseSingleTag = function(htmlStr) {
    if (htmlStr.length > MAX_SINGLE_TAG_LENGTH) { return null; }

    var singleTagMatch = REGEX.singleTagMatch(htmlStr);
    return singleTagMatch ? [create(singleTagMatch[1])] : null;
};

module.exports = function(htmlStr) {
    var singleTag = parseSingleTag(htmlStr);
    if (singleTag) { return singleTag; }

    var parentTagName = REGEX.getParentTagName(htmlStr),
        parent        = parseString(parentTagName, htmlStr);

    var child,
        idx = parent.children.length,
        arr = Array(idx);
    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};
