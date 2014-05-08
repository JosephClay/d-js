var _id = 0,
    _toString = Object.prototype.toString;

var _ = {
    uniqueId: function() {
        return _id++;
    },

    exists: function(obj) {
        return obj !== null && obj !== undefined;
    },

    parseInt: function(num) {
        return parseInt(num, 10);
    },

    coerceToNum: function(val) {
        return _.isNumber(val) ? val : // Its a number!
                _.isString(val) ? (_.parseInt(val) || 0) : // Avoid NaN
                0; // Default to zero
    },

    toPx: function(num) {
        return num + 'px';
    },

    isElement: function(obj) {
        return !!(obj && obj.nodeType === 1);
    },

    isArray: Array.isArray || function(obj) {
        return _toString.call(obj) === '[object Array]';
    },

    // NodeList check. For our purposes, a node list
    // and an HTMLCollection are the same
    isNodeList: function(obj) {
        return obj instanceof NodeList || obj instanceof HTMLCollection;
    },

    // Window check
    isWindow: function(obj) {
        return obj && obj === obj.window;
    },

    // Flatten that also checks if value is a NodeList
    flatten: function(arr) {
        var result = [];

        var idx = 0, length = arr.length,
            value;
        for (; idx < length; idx++) {
            value = arr[idx];

            if (_.isArray(value) || _.isNodeList(value)) {
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

    // No-context every; strip each()
    every: function(arr, iterator) {
        if (!_.exists(arr)) { return true; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (!iterator(value, idx)) { return false; }
        }

        return true;
    },

    // Faster extend; strip each()
    extend: function() {
        var args = arguments,
            obj = args[0],
            idx = 1, length = args.length;

        if (!obj) { return obj; }

        for (; idx < length; idx++) {
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

    // Array-perserving map
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

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (iterator(arr[idx], idx)) {
                results.push(value);
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
    }
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
var types = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'],
    idx = types.length,
    generateCheck = function(name) {
        return function(obj) {
            return _toString.call(obj) === '[object ' + name + ']';
        };
    },
    name;
while (idx--) {
    name = types[idx];
    _['is' + name] = generateCheck(name);
}

// Optimize `isFunction` if appropriate.
if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
        return typeof obj === 'function';
    };
}

// Optimize `isString` if appropriate.
if (typeof ('') === 'string') {
    _.isString = function(obj) {
        return typeof obj === 'string';
    };
}

module.exports = _;
