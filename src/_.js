var _ = {},
    _toString = Object.prototype.toString;

_.exists = function(obj) {
    return obj !== null && obj !== undefined;
};

_.parseInt = function(num) {
    return parseInt(num, 10);
};

_.coerceToNum = function(val) {
    return _.isNumber(val) ? val : // Its a number!
            _.isString(val) ? (_.parseInt(val) || 0) : // Avoid NaN
            0; // Default to zero
};

_.toPx = function(num) {
    return num + 'px';
};

_.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
};

_.isArray = Array.isArray || function(obj) {
    return _toString.call(obj) == '[object Array]';
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
    var name = types[idx];
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

// NodeList check. For our purposes, a node list
// and an HTMLCollection are the same
_.isNodeList = function(obj) {
    return obj instanceof NodeList || obj instanceof HTMLCollection;
};

// Flatten that also checks if value is a NodeList
_.flatten = function(arr) {
    var result = [];

    var idx = 0, length = arr.length,
        value;
    for (; idx < length; idx++) {
        value = arr[idx];

        if (_.isArray(value) || _isNodeList(value)) {
            _flatten(value, shallow, result);
        } else {
            result.push(value);
        }
    }

    return result;
};

// Concat flat for a single array of arrays
_.concatFlat = (function(concat) {

    return function(nestedArrays) {
        return concat.apply([], nestedArrays);
    };

}([].concat));

// No-context every; strip each()
_.every = function(arr, iterator) {
    if (!_.exists(arr)) { return true; }

    var idx = 0, length = arr.length;
    for (; idx < length; idx++) {
        if (!iterator(value, idx)) { return false; }
    }

    return true;
};

// Faster extend; strip each()
_.extend = function() {
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
};

// Standard map
_.map = function(arr, iterator) {
    var results = [];
    if (!arr) { return results; }

    var idx = 0, length = arr.length;
    for (; idx < length; idx++) {
        results.push(iterator(arr[idx], idx));
    }

    return results;
};

// Array-perserving map
// http://jsperf.com/push-map-vs-index-replacement-map
_.fastmap = function(arr, iterator) {
    if (!arr) { return []; }

    var idx = 0, length = arr.length;
    for (; idx < length; idx++) {
        arr[idx] = iterator(arr[idx], idx);
    }

    return arr;
};

_.filter = function(arr, iterator) {
    var results = [];
    if (!arr) { return results; }

    var idx = 0, length = arr.length;
    for (; idx < length; idx++) {
        if (iterator(arr[idx], idx)) {
            results.push(value);
        }
    }

    return results;
};

module.exports = _;