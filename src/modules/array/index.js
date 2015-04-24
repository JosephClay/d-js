var _       = require('_'),
    D       = require('D'),
    slice   = require('util/slice'),
    exists  = require('is/exists'),
    map     = require('./map');

exports.fn = {
    at: function(index) {
        return this[+index];
    },

    get: function(index) {
        // No index, return all
        if (!exists(index)) { return slice(this); }

        var idx = +index;
        return this[
            // Looking to get an index from the end of the set
            // if negative, or the start of the set if positive
            idx < 0 ? this.length + idx : idx
        ];
    },

    eq: function(index) {
        return D(this.get(index));
    },

    slice: function(start, end) {
        return D(slice(this, start, end));
    },

    first: function() {
        return D(this[0]);
    },

    last: function() {
        return D(this[this.length - 1]);
    },

    toArray: function() {
        return slice(this);
    },

    map: function(iterator) {
        return D(map(this, iterator));
    },

    each: function(iterator) {
        return _.jqEach(this, iterator);
    },
    forEach: function(iterator) {
        return _.dEach(this, iterator);
    }
};
