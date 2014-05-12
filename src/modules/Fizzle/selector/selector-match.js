var _supports = require('../../../supports'),
    _nodeType = require('../../../nodeType'),

    _matchesSelector = _supports.matchesSelector;

var matches;
if (_matchesSelector) {
    matches = function(elem, selector) {
        if (elem.nodeType !== _nodeType.ELEMENT) { return false; }
        
        return _matchesSelector.call(elem, selector);
    };
} else {
    matches = function(elem, selector) {
        if (elem.nodeType !== _nodeType.ELEMENT) { return false; }

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