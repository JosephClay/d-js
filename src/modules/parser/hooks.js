var _supports = require('../../supports');

var hooks = {
    dflt: function(parentTagName, htmlStr) {
        var parent = document.createElement(parentTagName);
        parent.innerHTML = htmlStr;
        return parent;
    }
};

// IE8
if (!_supports.writableTbody) {
    hooks.tbody = function(parentTagName, htmlStr) {
        var parent = document.createElement('div');
        parent.innerHTML = '<table>' + htmlStr + '</table>';
        return parent.firstChild.firstChild;
    };
}

// IE8
if (!_supports.writableSelect) {
    hooks.select = function(parentTagName, htmlStr) {
        var parent = document.createElement('div');
        parent.innerHTML = '<select>' + htmlStr + '</select>';
        return parent.firstChild;
    };
}

module.exports = hooks;
