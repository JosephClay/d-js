var _parse = function(htmlStr) {
    var tmp = document.implementation.createHTMLDocument();
        tmp.body.innerHTML = htmlStr;
    return tmp.body.children;
};

var _parseHtml = function(str) {
    var result = _parse(str);
    if (!result || !result.length) { return null; }
    return D(result);
};

module.exports = {
    parseHtml: _parse,

    fn: {
        parseHtml: _parseHtml,
        // Because no one know what the case should be
        parseHTML: _parseHtml
    }
};
