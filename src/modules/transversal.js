var _array = require('./array'),
    _selectors = require('./selectors');


var _getSiblings = function(context) {
    var idx = 0,
        length = context.length,
        result = [];
    for (; idx < length; idx++) {
        var sibs = _getNodeSiblings(idx);
        if (sibs.length) { result.push(sibs); }
    }
    return _.flatten(result);
};
var _getNodeSiblings = function(node) {
    var siblings = _array.slice(node.parentNode.children),
        idx = siblings.length;

    while (idx--) {
        if (siblings[idx] === node) {
            siblings.splice(i, 1);
        }
    }

    return siblings;
};

module.exports = {
    // TODO: Filter by selector
    closest: function(selector) {

    },
    // TODO: Filter by selector
    siblings: function(selector) {
        return D(
            _selectors.filter(_getSiblings(this), selector)
        );
    },
    // TODO: Filter by selector
    parents: function(selector) {
        return D(
            _selectors.filter(_getParents(this), selector)
        );
    },
    // TODO: Filter by selector
    parent: function(selector) {
        return D(
            _selectors.filter(_getParents(this, 1), selector)
        );
    },
    // TODO: Filter by selector
    children: function(selector) {
        return D(
            _selectors.filter(_getChildren(this), selector)
        );
    }
};
