var _SUPPORTS  = require('../../../supports'),
    _NODE_TYPE = require('../../../nodeType'),

    _matchesSelector = _SUPPORTS.matchesSelector;

var matches;

// IE9+, modern browsers
if (_matchesSelector) {
    matches = function(elem, selector) {
        if (elem.nodeType !== _NODE_TYPE.ELEMENT) { return false; }

        return _matchesSelector.call(elem, selector);
    };
}
// IE8
else {
    matches = function(elem, selector) {
        if (elem.nodeType !== _NODE_TYPE.ELEMENT) { return false; }

        var frag;

        if (!elem.parentNode) {
            frag = document.createDocumentFragment();
            frag.appendChild(elem);
        }

        var nodes = (frag || elem.parentNode).querySelectorAll(selector),
            idx = nodes.length;

        while (idx--) {
            if (nodes[idx] === elem) {
                return true;
            }
        }

        if (frag) {
            frag.removeChild(elem);
            frag = null; // prevent memory leaks in IE8
        }

        return false;
    };
}

module.exports = matches;
