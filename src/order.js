var isAttached   = require('is/attached'),
    isElement    = require('nodeType').elem,
    // http://ejohn.org/blog/comparing-document-position/
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
    CONTAINED_BY = 16,
    FOLLOWING    = 4,
    DISCONNECTED = 1;

var is = (rel, flag) => (rel & flag) === flag,

    isNode = (b, flag, a) => is(a.compareDocumentPosition(b), flag),

    hasDuplicate = false;

var sort = function(node1, node2) {
    // Flag for duplicate removal
    if (node1 === node2) {
        hasDuplicate = true;
        return 0;
    }

    // Nodes share the same document
    var rel = (node1.ownerDocument || node1) === (node2.ownerDocument || node2) ?
        // then compare position
        node1.compareDocumentPosition(node2) :
        // Otherwise we know they are disconnected
        DISCONNECTED;

    // Not directly comparable
    if (!rel) { return 0; }

    // Disconnected nodes
    if (is(rel, DISCONNECTED)) {
        var isNode1Disconnected = !isAttached(node1),
            isNode2Disconnected = !isAttached(node2);

        // sort order
        return isNode1Disconnected && isNode2Disconnected ? 0 :
            isNode2Disconnected ? -1 : 1;
    }

    return is(rel, FOLLOWING) ? -1 : 1;
};

/**
 * Sorts an array of D elements in-place (i.e., mutates the original array)
 * in document order and returns whether any duplicates were found.
 * @function
 * @param {Element[]} array          Array of D elements.
 * @param {Boolean}  [reverse=false] If a truthy value is passed, the given array will be reversed.
 * @returns {Boolean} true if any duplicates were found, otherwise false.
 * @see jQuery src/selector-native.js:37
 */
exports.sort = function(array, reverse) {
    hasDuplicate = false;
    array.sort(sort);
    if (reverse) {
        array.reverse();
    }
    return hasDuplicate;
};

/**
 * Determines whether node `a` contains node `b`.
 * @param {Element} a D element node
 * @param {Element} b D element node
 * @returns {Boolean} true if node `a` contains node `b`; otherwise false.
 */
exports.contains = function(a, b) {
    var bUp = isAttached(b) ? b.parentNode : null;

    if (a === bUp) {
        return true;
    }

    if (isElement(bUp)) {
        // Modern browsers (IE9+)
        if (a.compareDocumentPosition) {
            return isNode(bUp, CONTAINED_BY, a);
        }
    }

    return false;
};
