define([ 'utils' ], function(utils) {

    var _slice = (function(_slice) {
        return function(arr, index) {
            // Exit early for empty array
            if (!arr || !arr.length) { return []; }

            // Make sure index is defined
            return _slice.call(arr[index], index || 0);
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

    return {
        slice: _slice,
        elementSort: _elementSort,

        fn: {
            at: function(index) {
                return this[+index];
            },
            eq: function(index) {
                return D(this[+index]);
            },
            slice: function(index) {
                return D(utils.slice(this, index));
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
            }
        }
    };
});
