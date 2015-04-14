var exists      = require('is/exists'),
    isArray     = require('is/array'),
    isArrayLike = require('is/arrayLike'),
    isNodeList  = require('is/nodeList'),
    slice       = require('util/slice');

var loop = function(iterator) {
    return function(obj, iteratee) {
        if (!obj || !iteratee) { return; }

        var idx = 0, length = obj.length;
        if (length === +length) {
            for (idx = 0; idx < length; idx++) {
                iterator(iteratee, obj[idx], idx, obj);
            }
        } else {
            var keys = Object.keys(obj);
            for (length = keys.length; idx < length; idx++) {
                iterator(iteratee, obj[keys[idx]], keys[idx], obj);
            }
        }
        return obj;
    };
};

var _ = module.exports = {
    // Flatten that also checks if value is a NodeList
    flatten: function(arr) {
        var idx = 0,
            len = arr.length,
            result = [],
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

    toPx: (value) => value + 'px',
    
    parseInt: (num) => parseInt(num, 10),

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

        if (arr && arr.length) {
            var idx = 0, length = arr.length;
            for (; idx < length; idx++) {
                if (iterator(arr[idx], idx)) {
                    results.push(arr[idx]);
                }
            }
        }

        return results;
    },

    any: function(arr, iterator) {
        if (arr && arr.length) {
            var idx = 0, length = arr.length;
            for (; idx < length; idx++) {
                if (iterator(arr[idx], idx)) { return true; }
            }
        }

        return false;
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

    // TODO:
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

    makeArray: (arg) =>
        !exists(arg) ? [] :
        isArrayLike(arg) ? slice(arg) : [ arg ],

    contains: (arr, item) => arr.indexOf(item) !== -1,

    jqEach: loop(function(fn, value, keyIndex, collection) {
        fn.call(value, keyIndex, value, collection);
    }),

    dEach: loop(function(fn, value, keyIndex, collection) {
        fn.call(value, value, keyIndex, collection);
    }),

    each: loop(function(fn, value, keyIndex) {
        fn(value, keyIndex);
    }),

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
    },

    // pluck
    // TODO: Check for places this can be applied
    pluck: function(arr, key) {
        return _.map(arr, (obj) => obj ? obj[key] : undefined);
    }
};