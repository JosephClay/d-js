var _supports = require('../../supports');

var _hooks = {
    dflt: function(parentTagName, htmlStr) {
        var parent = document.createElement(parentTagName);
        parent.innerHTML = htmlStr;
        return parent;
    }
};

// IE8
if (!_supports.writableTbody) {
    _hooks.tbody = function(parentTagName, htmlStr) {
        var parent = document.createElement('div');
        parent.innerHTML = '<table>' + htmlStr + '</table>';
        return parent.firstChild.firstChild;
    };
}

// IE8
if (!_supports.writableSelect) {
    _hooks.select = function(parentTagName, htmlStr) {
        var parent = document.createElement('div');
        parent.innerHTML = '<select>' + htmlStr + '</select>';
        return parent.firstChild;
    };
}

module.exports = _hooks;
