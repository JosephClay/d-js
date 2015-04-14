var isAttached   = require('is/attached'),
    ELEMENT      = require('NODE_TYPE/ELEMENT'),
    // http://ejohn.org/blog/comparing-document-position/
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
    CONTAINED_BY = 16,
    FOLLOWING    = 4,
    DISCONNECTED = 1;

    // Compare Position - MIT Licensed, John Resig
var comparePosition = (node1, node2) =>
        node1.compareDocumentPosition ?
        node1.compareDocumentPosition(node2) :
        0,
    
    is = (rel, flag) => (rel & flag) === flag,

    isNode = (b, flag, a) => is(comparePosition(a, b), flag),

    hasDuplicate = false;

var sort = function(node1, node2) {
    // Flag for duplicate removal
    if (node1 === node2) {
        hasDuplicate = true;
        return 0;
    }

    // Sort on method existence if only one input has compareDocumentPosition
    var rel = !node1.compareDocumentPosition - !node2.compareDocumentPosition;
    if (rel) {
        return rel;
    }

    // Nodes share the same document
    if ((node1.ownerDocument || node1) === (node2.ownerDocument || node2)) {
        rel = comparePosition(node1, node2);
    }
    // Otherwise we know they are disconnected
    else {
        rel = DISCONNECTED;
    }

    // Not directly comparable
    if (!rel) {
        return 0;
    }

    // Disconnected nodes
    if (is(rel, DISCONNECTED)) {
        var isNode1Disconnected = !isAttached(node1);
        var isNode2Disconnected = !isAttached(node2);

        if (isNode1Disconnected && isNode2Disconnected) {
            return 0;
        }

        return isNode2Disconnected ? -1 : 1;
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

    if (bUp && bUp.nodeType === ELEMENT) {
        // Modern browsers (IE9+)
        if (a.compareDocumentPosition) {
            return isNode(bUp, CONTAINED_BY, a);
        }
    }

    return false;
};
