var _supports = require('../../../supports'),
    _NODE_TYPE = require('../../../nodeType'),

    _matchesSelector = _supports.matchesSelector;

var matches;
if (_matchesSelector) {
    matches = function(elem, selector) {
        if (elem.nodeType !== _NODE_TYPE.ELEMENT) { return false; }

        return _matchesSelector.call(elem, selector);
    };
} else {
    matches = function(elem, selector) {
        if (elem.nodeType !== _NODE_TYPE.ELEMENT) { return false; }

        var nodes = elem.parentNode.querySelectorAll(selector),
            idx = nodes.length;
        while (idx--) {
            if (nodes[idx] === elem) {
                return true;
            }
        }
        return false;
    };
}

module.exports = matches;
