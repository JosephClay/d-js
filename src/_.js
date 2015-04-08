var exists      = require('is/exists'),
    isArray     = require('is/array'),
    isArrayLike = require('is/arrayLike'),
    isNodeList  = require('is/nodeList'),
    slice       = require('util/slice');

var _ = module.exports = {
    // Flatten that also checks if value is a NodeList
    flatten: function(arr) {
        var result = [];

        var idx = 0,
            len = arr.length,
            value;
        for (; idx < len; idx++) {
            value = arr[idx];

            if (isArray(value) || isNodeList(value)) {
                result = result.concat(_.flatten(value));
            } else {
                result.push(value);
            }
        }

        return result;
    },

    // Concat flat for a single array of arrays
    concatFlat: (function(concat) {

        return function(nestedArrays) {
            return concat.apply([], nestedArrays);
        };

    }([].concat)),

    every: function(arr, iterator) {
        if (!exists(arr)) { return true; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (!iterator(arr[idx], idx)) { return false; }
        }

        return true;
    },

    extend: function() {
        var args = arguments,
            obj  = args[0],
            len  = args.length;

        if (!obj || len < 2) { return obj; }

        for (var idx = 1; idx < len; idx++) {
            var source = args[idx];
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        }

        return obj;
    },

    // Standard map
    map: function(arr, iterator) {
        var results = [];
        if (!arr) { return results; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            results.push(iterator(arr[idx], idx));
        }

        return results;
    },

    // Array-preserving map
    // http://jsperf.com/push-map-vs-index-replacement-map
    fastmap: function(arr, iterator) {
        if (!arr) { return []; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            arr[idx] = iterator(arr[idx], idx);
        }

        return arr;
    },

    filter: function(arr, iterator) {
        var results = [];
        if (!arr || !arr.length) { return results; }
        iterator = iterator || (arg) => !!arg;

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (iterator(arr[idx], idx)) {
                results.push(arr[idx]);
            }
        }

        return results;
    },

    any: function(arr, iterator) {
        var result = false;
        if (!arr || !arr.length) { return result; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (result || (result = iterator(arr[idx], idx))) { break; }
        }

        return !!result;
    },

    // pulled from AMD
    typecast: function(val) {
        var r;
        if (val === null || val === 'null') {
            r = null;
        } else if (val === 'true') {
            r = true;
        } else if (val === 'false') {
            r = false;
        } else if (val === undefined || val === 'undefined') {
            r = undefined;
        } else if (val === '' || isNaN(val)) {
            // isNaN('') returns false
            r = val;
        } else {
            // parseFloat(null || '') returns NaN
            r = parseFloat(val);
        }
        return r;
    },

    toArray: function(obj) {
        if (!obj) {
            return [];
        }

        if (isArray(obj)) {
            return slice(obj);
        }

        var arr,
            len = +obj.length,
            idx = 0;

        if (obj.length === +obj.length) {
            arr = new Array(obj.length);
            for (; idx < len; idx++) {
                arr[idx] = obj[idx];
            }
            return arr;
        }

        arr = [];
        for (var key in obj) {
            arr.push(obj[key]);
        }
        return arr;
    },

    makeArray: function(arg) {
        if (!exists(arg)) {
            return [];
        }
        if (arg.slice === slice) {
            return arg.slice();
        }
        if (isArrayLike(arg)) {
            return slice(arg);
        }
        return [ arg ];
    },

    contains: function(arr, item) {
        return arr.indexOf(item) !== -1;
    },

    each: function(obj, iterator) {
        if (!obj || !iterator) { return; }

        // Array-like
        if (obj.length !== undefined) {
            var idx = 0, length = obj.length;
            for (; idx < length; idx++) {
                if (iterator(obj[idx], idx) === false) {
                    break;
                }
            }
        }
        // Plain object
        else {
            for (var prop in obj) {
                if (iterator(obj[prop], prop) === false) {
                    break;
                }
            }
        }

        return obj;
    },

    hasSize: function(obj) {
        var name;
        for (name in obj) { return false; }
        return true;
    },

    merge: function(first, second) {
        var length = second.length,
            idx = 0,
            i = first.length;

        // Go through each element in the
        // second array and add it to the
        // first
        for (; idx < length; idx++) {
            first[i++] = second[idx];
        }

        first.length = i;

        return first;
    }
};