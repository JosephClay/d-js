var _      = require('_'),
    _order = require('../order');

var _slice = (function(slice) {
        return function(arr, start, end) {
            // Exit early for empty array
            if (!arr || !arr.length) { return []; }

            // End, naturally, has to be higher than 0 to matter,
            // so a simple existence check will do
            if (end) { return slice.call(arr, start, end); }

            return slice.call(arr, start || 0);
        };
    }([].slice)),

    _unique = function(results) {
        var hasDuplicates = _order.sort(results);
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
    elementSort: _order.sort,
    unique: _unique,
    each: _each,

    fn: {
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
