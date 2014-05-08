var _supports = require('../../supports');

module.exports = (function(matchSelector) {
    if (matchSelector) {
        return function(elem, selector) {
            return matchSelector.call(elem, selector);
        };
    }

    return function(elem, selector) {
        var nodes = elem.parentNode.querySelectorAll(selector),
            idx = nodes.length;
        while (idx--) {
            if (nodes[idx] === elem) {
                return true;
            }
        }
        return false;
    };
}(_supports.matchesSelector));