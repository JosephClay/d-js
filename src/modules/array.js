var _ = require('_'),
    _utils = require('../utils');

var _slice = (function(_slice) {
        return function(arr, start, end) {
            // Exit early for empty array
            if (!arr || !arr.length) { return []; }

            // End, naturally, has to be higher than 0 to matter,
            // so a simple existance check will do
            if (end) { return _slice.call(arr, start, end); }

            return _slice.call(arr, start || 0);
        };
    }([].slice)),

    // See jQuery
    // src\selector-native.js: 37
    _elementSort = (function() {

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

    }()),

    _unique = function(results) {
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
    },

    _map = function(arr, iterator) {
        var results = [];
        if (!arr.length || !iterator) { return results; }

        var idx = 0, length = arr.length,
            item;
        for (; idx < length; idx++) {
            item = arr[idx];
            results.push(iterator.call(item, item, idx));
        }

        return _.concatFlat(results);
    },

    _each = function(obj, iterator) {
        if (!obj || !iterator) { return; }

        // Array support
        if (obj.length === +obj.length) {
            var idx = 0, length = obj.length,
                item;
            for (; idx < length; idx++) {
                item = obj[idx];
                if (iterator.call(item, item, idx) === false) { return; }
            }

            return;
        }

        // Object support
        var key, value;
        for (key in obj) {
            value = obj[key];
            if (iterator.call(value, value, key) === false) { return; }
        }
    };

module.exports = {
    slice: _slice,
    elementSort: _elementSort,
    unique: _unique,
    each: _each,

    fn: {
        // Determine the position of an element within
        // the matched set of elements
        index: function(elem) {

            // No argument, return index in parent
            if (!elem) {
                var first = this[0],
                    parent;
                // Note: _utils.isAttached check to pass test "Node without parent returns -1"
                return (first && (parent = first.parentNode) && _utils.isAttached(parent)) ? _slice(parent.children).indexOf(first) : -1;
            }

            // index in selector
            /*if (_.isString(elem)) {
                return this.indexOf(this[0], jQuery( elem ) );
            }*/

            // Locate the position of the desired element
            return this.indexOf(elem instanceof D ? elem[0] : elem);
        },

        at: function(index) {
            return this[+index];
        },

        get: function(index) {
            // No index, return all
            if (!_.exists(index)) { return this.toArray(); }

            index = +index;

            // Looking to get an index from the end of the set
            if (index < 0) { index = (this.length + index); }

            return this[index];
        },

        eq: function(index) {
            return D(this.get(index));
        },

        slice: function(start, end) {
            return D(_slice(this.toArray(), start, end));
        },

        first: function() {
            return D(this[0]);
        },

        last: function() {
            return D(this[this.length - 1]);
        },

        toArray: function() {
            return _slice(this);
        },

        map: function(iterator) {
            return D(_map(this, iterator));
        },

        each: function(iterator) {
            _each(this, iterator);
            return this;
        },

        forEach: function(iterator) {
            _each(this, iterator);
            return this;
        }
    }
};