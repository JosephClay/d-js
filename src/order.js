var _NODE_TYPE = require('./nodeType'),
    _DOC_POS   = require('./docPos')
;

// Compare Position - MIT Licensed, John Resig
var _comparePosition = function(a, b) {
    if (a.compareDocumentPosition) {
        return a.compareDocumentPosition(b);
    }

    if (a.contains) {
        var num = 0;

        if (a != b && a.contains(b)) {
            num += _DOC_POS.CONTAINED_BY;
        }

        if (a != b && b.contains(a)) {
            num += _DOC_POS.CONTAINS;
        }

        if (a.sourceIndex >= 0 && b.sourceIndex >= 0) {
            num += (a.sourceIndex < b.sourceIndex && _DOC_POS.FOLLOWING);
            num += (a.sourceIndex > b.sourceIndex && _DOC_POS.PRECEDING);
        } else {
            num += 1;
        }

        return num;
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
