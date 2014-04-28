var _utils = require('../utils');

var _slice = (function(_slice) {
    return function(arr, index) {
        // Exit early for empty array
        if (!arr || !arr.length) { return []; }

        // Make sure index is defined
        return _slice.call(arr, index || 0);
    };
}([].slice));

// See jQuery
// src\selector-native.js: 37
var _elementSort = (function() {

    var _hasDuplicate = false;
    var _sort = function(a, b) {
        // Flag for duplicate removal
        if (a === b) {
            _hasDuplicate = true;
            return 0;
        }

        var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);

        // Not directly comparable, sort on existence of method
        if (!compare) { return a.compareDocumentPosition ? -1 : 1; }

        // Disconnected nodes
        if (compare & 1) {

            // Choose the first element that is related to our document
            if (a === document || b === document) { return 1; }

            // Maintain original order
            return 0;
        }

        return compare & 4 ? -1 : 1;
    };

    return function(array) {
        _hasDuplicate = false;
        array.sort(_sort);
        return _hasDuplicate;
    };

}());

var _unique = function(results) {
    var hasDuplicates = _elementSort(results);
    if (!hasDuplicates) { return results; }

    var elem,
        idx = 0,
        // create the array here
        // so that a new array isn't
        // created/destroyed every unique call
        duplicates = [];

    // Go through the array and identify
    // the duplicates to be removed
    while ((elem = results[idx++])) {
        if (elem === results[idx]) {
            duplicates.push(idx);
        }
    }

    // Remove the duplicates from the results
    idx = duplicates.length;
    while (idx--) {
       results.splice(duplicates[idx], 1);
    }

    return results;
};

module.exports = {
    slice: _slice,
    elementSort: _elementSort,
    unique: _unique,

    fn: {
        at: function(index) {
            return this[+index];
        },
        get: function(index) {
            if (!_utils.exists(index)) { return this; }

            index = +index;

            // Looking to get an index from the end of the set
            if (index < 0) { index = (this.length + index); }

            return this[index];
        },
        eq: function(index) {
            return D(this.get(index));
        },
        slice: function(index) {
            return D(_slice(this, index));
        },
        next: function() {
            // TODO
        },
        prev: function() {
            // TODO
        },
        first: function() {
            return D(this[0]);
        },
        last: function() {
            return D(this[this.length - 1]);
        },
        toArray: function() {
            return _slice(this);
        }
    }
};
