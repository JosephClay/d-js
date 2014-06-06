// http://jsperf.com/js-push-vs-index11/2
var _parse = function(htmlStr) {
    var div = document.createElement('div');
    div.innerHTML = htmlStr;

    var child,
        idx = div.children.length,
        arr = [];

    while (idx--) {
        child = div.children[idx];
        div.removeChild(child);
        arr[idx] = child;
    }

    div = null;

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
