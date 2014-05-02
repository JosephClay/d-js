var _array = require('./array'),
    _selectors = require('./selectors');

var _getSiblings = function(context) {
        var idx = 0,
            length = context.length,
            result = [];
        for (; idx < length; idx++) {
            var sibs = _getNodeSiblings(context[idx]);
            if (sibs.length) { result.push(sibs); }
        }
        return _.flatten(result);
    },

    _getNodeSiblings = function(node) {
        var siblings = _array.slice(node.parentNode.children),
            idx = siblings.length;

        while (idx--) {
            if (siblings[idx] === node) {
                siblings.splice(i, 1);
            }
        }

        return siblings;
    },

    // Parents ------
    _getParents = function(context) {
        var idx = 0,
            length = context.length,
            result = [];
        for (; idx < length; idx++) {
            var parents = _crawlUpNode(context[idx]);
            result.push(parents);
        }
        return _.flatten(result);
    },

    _crawlUpNode = function(node) {
        var result = [],
            parent = node;
        while ((parent = _getNodeParent(parent))) {
            result.push(parent);
        }

        return result;
    },

    // Parent ------
    _getParent = function(context) {
        var idx = 0,
            length = context.length,
            result = [];
        for (; idx < length; idx++) {
            var parent = _getNodeParent(context[idx]);
            if (parent) { result.push(parent); }
        }
        return result;
    },

    // Safely get parent node
    _getNodeParent = function(node) {
        return node && node.parentNode;
    };

module.exports = {
    fn: {
        // TODO: Filter by selector
        closest: function(selector) {

        },

        siblings: function(selector) {
            return D(
                _selectors.filter(_getSiblings(this), selector)
            );
        },

        parents: function(selector) {
            return D(
                _selectors.filter(_getParents(this), selector)
            );
        },

        parent: function(selector) {
            return D(
                _selectors.filter(_getParent(this), selector)
            );
        },

        children: function(selector) {
            return D(
                _selectors.filter(_getChildren(this), selector)
            );
        }
    }
};
