var _      = require('_'),
    D      = require('D'),
    exists = require('is/exists'),
    slice  = require('util/slice'),
    each   = require('./each');

var map = function(arr, iterator) {
    var results = [];
    if (!arr.length || !iterator) { return results; }

    var idx = 0, length = arr.length,
        item;
    for (; idx < length; idx++) {
        item = arr[idx];
        results.push(iterator.call(item, item, idx));
    }

    return _.concatFlat(results);
};

exports.fn = {
    at: function(index) {
        return this[+index];
    },

    get: function(index) {
        // No index, return all
        if (!exists(index)) { return this.toArray(); }

        index = +index;

        // Looking to get an index from the end of the set
        if (index < 0) { index = (this.length + index); }

        return this[index];
    },

    eq: function(index) {
        return D(this.get(index));
    },

    slice: function(start, end) {
        return D(slice(this.toArray(), start, end));
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
        each(this, iterator);
        return this;
    },

    forEach: function(iterator) {
        each(this, iterator);
        return this;
    }
};
