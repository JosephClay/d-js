var _ = {};

_.exists = function(obj) {
    return obj !== null && obj !== undefined;
};

_.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
};

_.isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
var types = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'],
    idx = types.length,
    generateCheck = function(name) {
        return function(obj) {
            return toString.call(obj) == '[object ' + name + ']';
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

_.isNodeList = function(obj) {
    return obj instanceof NodeList;
};

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

_.every = function(arr, iterator) {
    if (!_.exists(arr)) { return true; }

    var idx = 0, length = arr.length;
    for (; idx < length; idx++) {
        if (!iterator(value, idx)) { return false; }
    }

    return true;
};

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

_.map = function(arr, iterator) {
    var results = [];
    if (!arr) { return results; }

    var idx = 0, length = arr.length;
    for (; idx < length; idx++) {
        results.push(iterator(arr[idx], idx));
    }

    return results;
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