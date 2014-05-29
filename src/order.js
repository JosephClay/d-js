var _NODE_TYPE = require('./nodeType'),
    _DOC_POS   = require('./docPos'),
    _supports  = require('./supports'),
    _utils     = require('./utils');

// Compare Position - MIT Licensed, John Resig
// TODO: Optimize this function
var _comparePosition = function(node1, node2) {
    // Modern browsers (IE9+)
    if (node1.compareDocumentPosition) {
        return node1.compareDocumentPosition(node2);
    }

    var rel = 0;

    if (node1 === node2) {
        return rel;
    }

    // IE8
    if (node1.contains) {
        if (node1.contains(node2)) {
            rel += _DOC_POS.CONTAINED_BY;
        }
        if (node2.contains(node1)) {
            rel += _DOC_POS.CONTAINS;
        }

        if (node1.sourceIndex >= 0 && node2.sourceIndex >= 0) {
            rel += (node1.sourceIndex < node2.sourceIndex ? _DOC_POS.FOLLOWING : 0);
            rel += (node1.sourceIndex > node2.sourceIndex ? _DOC_POS.PRECEDING : 0);

            if (!_utils.isAttached(node1) || !_utils.isAttached(node2)) {
                rel += _DOC_POS.DISCONNECTED;
            }
        } else {
            rel += _DOC_POS.DISCONNECTED;
        }
    }

    return rel;
};

var _is = function(rel, flag) {
    return (rel & flag) === flag;
};

var _isNode = function(b, flag, a) {
    var rel = _comparePosition(a, b);
    return _is(rel, flag);
};

module.exports = {

    /**
     * Sorts an array of DOM elements in-place (i.e., mutates the original array)
     * in document order and returns whether any duplicates were found.
     * @function
     * @param {Element[]} array          Array of DOM elements.
     * @param {Boolean}  [reverse=false] If a truthy value is passed, the given array will be reversed.
     * @returns {Boolean} true if any duplicates were found, otherwise false.
     * @see jQuery src/selector-native.js:37
     */
    sort: (function() {
        var _hasDuplicate = false;

        var _sort = function(node1, node2) {
            // Flag for duplicate removal
            if (node1 === node2) {
                _hasDuplicate = true;
                return 0;
            }

            // Sort on method existence if only one input has compareDocumentPosition
            var rel = !node1.compareDocumentPosition - !node2.compareDocumentPosition;
            if (rel) {
                return rel;
            }

            // Nodes share the same document
            if ((node1.ownerDocument || node1) === (node2.ownerDocument || node2)) {
                rel = _comparePosition(node1, node2);
            }
            // Otherwise we know they are disconnected
            else {
                rel = _DOC_POS.DISCONNECTED;
            }

            // Not directly comparable
            if (!rel) {
                return 0;
            }

            // Disconnected nodes
            if (_is(rel, _DOC_POS.DISCONNECTED)) {
                var isNode1Disconnected = !_utils.isAttached(node1);
                var isNode2Disconnected = !_utils.isAttached(node2);

                if (isNode1Disconnected && isNode2Disconnected) {
                    return 0;
                }

                return isNode2Disconnected ? -1 : 1;
            }

            return _is(rel, _DOC_POS.FOLLOWING) ? -1 : 1;
        };

        return function(array, reverse) {
            _hasDuplicate = false;
            array.sort(_sort);
            if (reverse) {
                array.reverse();
            }
            return _hasDuplicate;
        };
    }()),

    /**
     * Determines whether node `a` contains node `b`.
     * @param {Element} a DOM element node
     * @param {Element} b DOM element node
     * @returns {Boolean} true if node `a` contains node `b`; otherwise false.
     */
    contains: function(a, b) {
        var aDown = a.nodeType === _NODE_TYPE.DOCUMENT ? a.documentElement : a,
            bUp   = _utils.isAttached(b) ? b.parentNode : null;

        if (a === bUp) {
            return true;
        }

        if (bUp && bUp.nodeType === _NODE_TYPE.ELEMENT) {
            // Modern browsers (IE9+)
            if (a.compareDocumentPosition) {
                return _isNode(bUp, _DOC_POS.CONTAINED_BY, a);
            }
            // IE8
            if (aDown.contains) {
                return aDown.contains(bUp);
            }
        }

        return false;
    }

};
