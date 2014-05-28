var _NODE_TYPE = require('./nodeType'),
    _DOC_POS   = require('./docPos')
;

var _compareDocPos = function(a, b) {
    return b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);
};

var _is = function(rel, flag) {
    return (rel & flag) === flag;
};

var _isNode = function(b, flag, a) {
    var rel = _compareDocPos(a, b);
    return _is(rel, flag);
};

module.exports = {

    /**
     * Sorts an array of DOM elements in-place (i.e., mutates the original array)
     * in document order and returns whether any duplicates were found.
     * @function
     * @param {Element[]} array Array of DOM elements.
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

                var rel = _compareDocPos(a, b);

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

        return function(array) {
            _hasDuplicate = false;
            array.sort(_sort);
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
