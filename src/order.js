var _NODE_TYPE = require('./nodeType'),
    _DOC_POS   = require('./docPos')
;

// Compare Position - MIT Licensed, John Resig
var _comparePosition = function(node1, node2) {
    // Modern browsers (IE9+)
    if (node1.compareDocumentPosition) {
        return node1.compareDocumentPosition(node2);
    }

    // IE8
    if (node1.contains) {
        var rel = 0;

        if (node1 != node2 && node1.contains(node2)) {
            rel += _DOC_POS.CONTAINED_BY;
        }

        if (node1 != node2 && node2.contains(node1)) {
            rel += _DOC_POS.CONTAINS;
        }

        if (node1.sourceIndex >= 0 && node2.sourceIndex >= 0) {
            rel += (node1.sourceIndex < node2.sourceIndex && _DOC_POS.FOLLOWING);
            rel += (node1.sourceIndex > node2.sourceIndex && _DOC_POS.PRECEDING);
        } else {
            rel += 1;
        }

        return rel;
    }

    return 0;
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
        var _hasDuplicate = false,
            _sort = function(a, b) {
                // Flag for duplicate removal
                if (a === b) {
                    _hasDuplicate = true;
                    return 0;
                }

                var rel = _comparePosition(a, b);

                // Not directly comparable, sort on existence of method
                if (!rel) { return a.compareDocumentPosition ? -1 : 1; }

                // Disconnected nodes
                if (_is(rel, _DOC_POS.DISCONNECTED)) {
                    // Choose the first element that is related to our document
                    if (a === document || b === document) { return 1; }

                    // Maintain original order
                    return 0;
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
            bUp   = b && b.parentNode;

        if (a === bUp) {
            return true;
        }

        if (bUp && bUp.nodeType === _NODE_TYPE.ELEMENT) {
            if (aDown.contains) {
                return aDown.contains(bUp);
            }
            if (a.compareDocumentPosition) {
                return _isNode(bUp, _DOC_POS.CONTAINED_BY, a);
            }
        }

        return false;
    }

};
