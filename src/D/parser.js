// TODO: Optimize this function
var _parse = function(htmlStr) {
    var div  = document.createElement('div');
    div.innerHTML = htmlStr;

    var child,
        idx,
        len = div.children.length,
        arr = [];

    for (idx = 0; idx < len; idx++) {
        child = div.children[idx];
        div.removeChild(child);
        arr.push(child);
    }

    return arr;
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
