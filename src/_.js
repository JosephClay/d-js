var _NODE_TYPE = require('./nodeType'),
    _id        = 0,
    _toString  = Object.prototype.toString,
    _indexOf   = Array.prototype.indexOf,
    _slice     = Array.prototype.slice,
    _isTruthy  = function(arg) { return !!arg; };

var _ = {

    noop: function() {},

    now: Date.now || function() { return new Date().getTime(); },

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
        return _.isNumber(val) ? (val || 0) : // Its a number! || 0 to avoid NaN (as NaN's a number)
               _.isString(val) ? (_.parseInt(val) || 0) : // Avoid NaN again
               0; // Default to zero
    },

    toPx: function(num) {
        return num + 'px';
    },

    isElement: function(obj) {
        return !!(obj && obj.nodeType === _NODE_TYPE.ELEMENT);
    },

    // NOTE: In older browsers, this will be overwritten below
    isArray: Array.isArray,

    isArrayLike: function(obj) {
        if (!_.exists(obj)) {
            return false;
        }
        if (_.isArray(obj)) {
            return true;
        }
        if (_.isString(obj)) {
            return false;
        }
        if (_.isNumber(obj.length) && ('0' in obj)) {
            return true;
        }
        return false;
    },

    // NodeList check. For our purposes, a node list
    // and an HTMLCollection are the same
    isNodeList: function(obj) {
        return !!(obj && (obj instanceof NodeList || obj instanceof HTMLCollection));
    },

    // Window check
    isWindow: function(obj) {
        return !!(obj && obj === obj.window);
    },

    // Supports IE8 via obj.callee (see http://stackoverflow.com/a/10645766/467582)
    isArguments: function(obj) {
        return !!(obj && (_toString.call(obj) === '[object Arguments]' || obj.callee));
    },

    // Flatten that also checks if value is a NodeList
    flatten: function(arr) {
        var result = [];

        var idx = 0,
            len = arr.length,
            value;
        for (; idx < len; idx++) {
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
            obj  = args[0],
            idx  = 1,
            len  = args.length;

        if (!obj) { return obj; }

        for (; idx < len; idx++) {
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
        iterator = iterator || _isTruthy;

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
        if (_.isArray(obj)) {
            return _slice.call(obj);
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

        for (var key in obj) {
            arr.push(obj[key]);
        }
        return arr;
    },

    makeArray: function(arg) {
        if (arg === null || arg === undefined) {
            return [];
        }
        if (arg.slice === _slice) {
            return arg.slice();
        }
        if (_.isArrayLike(arg)) {
            return _slice.call(arg);
        }
        return [ arg ];
    },

    // Doesn't a very simple case of array to object.
    // Takes the value and sets it as the key and the value.
    object: function(arr) {
        var obj = {},
            len = arr.length,
            idx = 0;
        for (; idx < len; idx++) {
            obj[arr[idx]] = arr[idx];
        }
        return obj;
    },

    indexOf: function(arr, item) {
        if (arr.indexOf === _indexOf) {
            return arr.indexOf(item);
        }
        return _indexOf.call(arr, item);
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

    isObject: function(obj) {
        return obj === Object(obj);
    },

    // Breaks even on arrays with 3 items. 3 or more
    // items starts saving space
    splt: function(str, delimiter) {
        return str.split(delimiter || '|');
    }

};

// Add some isType methods (only if they do NOT already exist): isArray, isFunction, isString, isNumber, isDate, isRegExp.
var types = _.splt('Array|Function|String|Number|Date|RegExp'),
    idx = types.length,
    generateCheck = function(name) {
        return function(obj) {
            return !!obj && _toString.call(obj) === '[object ' + name + ']';
        };
    },
    name;
while (idx--) {
    name = types[idx];
    _['is' + name] = _['is' + name] || generateCheck(name);
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
