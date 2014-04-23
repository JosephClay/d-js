define(function() {
    var _parseHtml = function(htmlStr) {
        var tmp = document.implementation.createHTMLDocument();
            tmp.body.innerHTML = htmlStr;
        return tmp.body.children;
    };

    return {
        parseHtml: _parseHtml,

        fn: {
            parseHtml: function(str) {
                return DOM(_parseHtml(str));
            }
        }
    };
});
