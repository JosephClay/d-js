!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.D=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// polyfills
require('./polyfills/indexOf');

// Configure O with string custom types
require('./o.custom');

var _ = require('underscore'),

    parser      = require('./modules/parser/parser'),
    utils       = require('./utils'),
    array       = require('./modules/array'),
    onready     = require('./modules/onready'),
    selectors   = require('./modules/selectors'),
    transversal = require('./modules/transversal'),
    dimensions  = require('./modules/dimensions'),
    manip       = require('./modules/manip'),
    css         = require('./modules/css'),
    attr        = require('./modules/attr'),
    prop        = require('./modules/prop'),
    val         = require('./modules/val'),
    position    = require('./modules/position'),
    classes     = require('./modules/classes'),
    data        = require('./modules/data'),
    events      = require('./modules/event/api'),
    eventObj    = require('./modules/event/event'),
    deferred    = require('./modules/Deferred/Deferred'),
    when        = require('./modules/Deferred/when'),

    xaja        = require('xaja-js');

// Store previous reference
var _prevD = window.D;

var D = function(arg, attrs) {
    // Wasn't created with "new"
    if (!(this instanceof D)) { return new D(arg, attrs); }

    // Nothin
    if (!arg) { return; }

    // Element
    if (arg.nodeType || arg === window || arg === document) {
        this.push(arg);
        return;
    }

    // String
    if (_.isString(arg)) {

        // HTML string
        if (utils.isHtml(arg)) {
            utils.merge(this, parser.parseHtml(arg));
            if (attrs) { this.attr(attrs); }
            return;
        }

        // Selector: perform a find without creating a new D
        utils.merge(this, selectors.find(arg, true));
        return;
    }

    // Array of Elements, NodeList, or D object
    if (_.isArray(arg) || _.isNodeList(arg) || arg instanceof D) {
        utils.merge(this, arg);
        return;
    }

    // Document a ready
    if (_.isFunction(arg)) {
        onready(arg);
    }
};

var _hasMoreConflict = false,
    _prevjQuery,
    _prev$;

_.extend(D,
    parser.D,
    data.D,
    deferred.D,
    when.D,
    eventObj.D,
    xaja, // proxy ajax to xaja
{
    each:    array.each,
    forEach: array.each,

    map:     _.map,
    extend:  _.extend,

    noConflict: function() {
        if (_hasMoreConflict) {
            window.jQuery = _prevjQuery;
            window.$ = _prev$;

            _hasMoreConflict = false;
        }

        window.D = _prevD;
        return D;
    },

    moreConflict: function() {
        _hasMoreConflict = true;
        _prevjQuery = window.jQuery;
        _prev$ = window.$;
        window.jQuery = window.Zepto = window.$ = D;
    }
});

var arrayProto = (function(proto, obj) {

    _.each(
        _.splt('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight'),
        function(key) {
            obj[key] = proto[key];
        }
    );

    return obj;

}(Array.prototype, {}));

_.extend(
    D.prototype,
    { constructor: D },
    arrayProto,
    array.fn,
    selectors.fn,
    transversal.fn,
    manip.fn,
    dimensions.fn,
    css.fn,
    attr.fn,
    prop.fn,
    val.fn,
    classes.fn,
    position.fn,
    data.fn,
    events.fn
);

// Expose the prototype so that
// it can be hooked into for plugins
D.fn = D.prototype;

module.exports =  D;

},{"./modules/Deferred/Deferred":16,"./modules/Deferred/when":17,"./modules/array":27,"./modules/attr":28,"./modules/classes":29,"./modules/css":32,"./modules/data":33,"./modules/dimensions":34,"./modules/event/api":36,"./modules/event/event":37,"./modules/manip":40,"./modules/onready":41,"./modules/parser/parser":43,"./modules/position":44,"./modules/prop":45,"./modules/selectors":46,"./modules/transversal":47,"./modules/val":48,"./o.custom":49,"./polyfills/indexOf":51,"./utils":55,"underscore":5,"xaja-js":6}],2:[function(require,module,exports){
/**
 * From Sizzle.js `createCache()`:
 * Use (key + ' ') to avoid collision with native prototype properties.
 * NOTE: The space has been removed to allow .data() to return objects with "normal" keys.
 * @param {String} key
 * @returns {String}
 * @private
 */
// TODO: No longer need _safe
var _safe = function(key) { return key; };

var _getterSetter = function() {
        var ref = {};

        return {
            get: function(key) {
                key = _safe(key);
                return ref[key];
            },
            set: function(key, value) {
                key = _safe(key);
                ref[key] = value;
                return value;
            },
            getOrSet: function(key, fn) {
                key = _safe(key);
                var cachedVal = ref[key];
                if (cachedVal !== undefined) { return cachedVal; }
                return (ref[key] = fn());
            },
            remove: function(key) {
                delete ref[_safe(key)];
            }
        };
    },

    _biLevelGetterSetter = function() {
        var ref = {};

        return {
            has: function(key1) {
                return ref[_safe(key1)] !== undefined;
            },
            get: function(key1, key2) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1];
                return arguments.length === 1 ? ref1 : (ref1 !== undefined ? ref1[key2] : ref1);
            },
            set: function(key1, key2, value) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1] || (ref[key1] = {});
                ref1[key2] = value;
                return value;
            },
            getOrSet: function(key1, key2, fn) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1] || (ref[key1] = {}),
                    cachedVal = ref1[key2];
                if (cachedVal !== undefined) { return cachedVal; }
                return (ref1[key2] = fn());
            },
            remove: function(key1, key2) {
                key1 = _safe(key1);
                key2 = _safe(key2);

                // Easy removal
                if (arguments.length === 1) {
                    delete ref[key1];
                    return;
                }

                // Deep removal
                var ref1 = ref[key1] || (ref[key1] = {});
                delete ref1[key2];
            }
        };
    };

module.exports = function(lvl) {
    return lvl === 2 ? _biLevelGetterSetter() : _getterSetter();
};
},{}],3:[function(require,module,exports){
module.exports = {
    ELEMENT:                 1,
    ATTRIBUTE:               2,
    TEXT:                    3,
    CDATA:                   4,
    ENTITY_REFERENCE:        5,
    ENTITY:                  6,
    PROCESSING_INSTRUCTION:  7,
    COMMENT:                 8,
    DOCUMENT:                9,
    DOCUMENT_TYPE:          10,
    DOCUMENT_FRAGMENT:      11,
    NOTATION:               12
};

},{}],4:[function(require,module,exports){
(function(TRUE, FALSE, NULL, undefined) {

    var root = typeof window !== 'undefined' ? window : this;

    // Variablizing the strings for consistency
    // and to avoid harmful dot-notation look-ups with
    // javascript keywords
    var sNull      = 'Null',
        sUndefined = 'Undefined',
        sInfinity  = 'Infinity',
        sDate      = 'Date',
        sNaN       = 'NaN',
        sNumber    = 'Number',
        sString    = 'String',
        sObject    = 'Object',
        sArray     = 'Array',
        sRegExp    = 'RegExp',
        sBoolean   = 'Boolean',
        sFunction  = 'Function',
        sElement   = 'Element';

    // Utilizing the non-standard (but available in modern browsers) Global Object names
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name
    // Provide a polyfill for items without names
    (function() {
        var globalObjects = [
                sDate,
                sNumber,
                sString,
                sObject,
                sArray,
                sRegExp,
                sBoolean,
                sFunction,
                sElement
            ],
            idx = globalObjects.length,
            globalObject;
        while (idx--) {
            globalObject = globalObjects[idx];
            if (root[globalObject] !== undefined) {
                if (!root[globalObject].name) {
                    root[globalObject].name = globalObject;
                }
            }
        }
    }());

    /**
     * Possible values
     * @type {Object}
     */
    var _types = {};
    _types[sNull]      = 0;
    _types[sUndefined] = 1;
    _types[sInfinity]  = 2;
    _types[sDate]      = 3;
    _types[sNaN]       = 4;
    _types[sNumber]    = 5;
    _types[sString]    = 6;
    _types[sObject]    = 7;
    _types[sArray]     = 8;
    _types[sRegExp]    = 9;
    _types[sBoolean]   = 10;
    _types[sFunction]  = 11;
    _types[sElement]   = 12;

    /**
     * Cached reference to Object.prototype.toString
     * for type checking
     * @type {Function}
     */
    var _toString = (function(toString) {
            return function(obj) {
                return toString.call(obj);
            };
        }(({}).toString)),

        _noopArr = [],

        /**
         * Type checks
         */
        _checkMap = (function(map) {

            var types = [
                    // Only mapping items that need to be mapped.
                    // Items not in this list are doing faster
                    // (non-string) checks
                    //
                    // 0 = key, 1 = value
                    [ sDate,     _types[sDate]     ],
                    [ sNumber,   _types[sNumber]   ],
                    [ sString,   _types[sString]   ],
                    [ sObject,   _types[sObject]   ],
                    [ sArray,    _types[sArray]    ],
                    [ sRegExp,   _types[sRegExp]   ],
                    [ sFunction, _types[sFunction] ]
                ],
                idx = types.length;
            while (idx--) {
                map['[object ' + types[idx][0] + ']'] = types[idx][1];
            }

            return map;

        }({})),

        /**
         * Changes arguments to an array
         * @param  {Arguments} arraylike
         * @return {Array}
         */
        _protoSlice = [].slice,
        _slice = function(arraylike) {
            return _protoSlice.call(arraylike);
        },

        /**
         * Mini extend
         * @param  {Function} base
         * @param  {Object}   obj
         * @return {Function} base
         */
        extend = function(base, obj) {
            var key;
            for (key in obj) {
                base[key] = obj[key];
            }
            return base;
        };

    var _getConfigurationType = function(val) {
        if (val === null) { return _types[sNull]; }
        if (val === undefined) { return _types[sUndefined]; }

        // we have something, but don't know what
        if (!val.name) {
            if (val === root[sElement]) { return _types[sElement]; } // Firefox doesn't allow setting the name of Element
            if (val !== +val) { return _types[sNaN]; } // NaN check
            return _types[sInfinity]; // Infinity check
        }

        return _types[val.name];
    };

    var _getParameterType = function(val) {
        if (val === null) { return _types[sNull]; }
        if (val === undefined) { return _types[sUndefined]; }
        if (val === TRUE || val === FALSE) { return _types[sBoolean]; }
        if (val && val.nodeType === 1) { return _types[sElement]; } // Element check from Underscore

        var typeString = _toString(val);
        if (_checkMap[typeString] === _types[sNumber]) {
            if (val !== +val) { return _types[sNaN]; } // NaN check
            if (!isFinite(val)) { return _types[sInfinity]; } // Finite check
            return _types[sNumber]; // definitely a number
        }

        return _checkMap[typeString];
    };

    var _convertConfigurationTypes = function(args) {
        var parameters = [],
            idx = 0, length = args.length,
            configItem;
        for (; idx < length; idx++) {
            configItem = args[idx];
            parameters.push(
                (configItem instanceof Custom) ? configItem : _getConfigurationType(configItem)
            );
        }
        return parameters;
    };

    var _convertConfigurationMap = function(map) {
        var parameters = {},
            key, configItem;
        for (key in map) {
            configItem = map[key];
            parameters[key] = (configItem instanceof Custom) ? configItem : _getConfigurationType(configItem);
        }
        return parameters;
    };

    var _convertParametersTypes = function(args) {
        var parameters = [],
            idx = 0, length = args.length;
        for (; idx < length; idx++) {
            parameters.push(_getParameterType(args[idx]));
        }
        return parameters;
    };

    var _doesMapMatchArgsTypes = function(map, argTypes, args) {
        var mapLength = map.length,
            argLength = argTypes.length;

        if (mapLength === 0 && argLength === 0) { return TRUE; }
        if (mapLength !== argLength) { return FALSE; }

        var idx = 0,
            mapItem;
        for (; idx < argLength; idx++) {
            mapItem = map[idx];

            if (mapItem instanceof Custom) {
                if (mapItem.check(args[idx])) {
                    continue;
                }
                return FALSE;
            }

            if (argTypes[idx] !== mapItem) {
                return FALSE;
            }
        }

        return TRUE;
    };

    var _getArgumentMatch = function(mappings, args) {
        if (!mappings) { return; }

        var argTypes = _convertParametersTypes(args),
            idx = 0, length = mappings.length;
        for (; idx < length; idx++) {
            if (_doesMapMatchArgsTypes(mappings[idx].params, argTypes, args)) {
                return mappings[idx];
            }
        }
    };

    var _getLengthMatch = function(mappings, args) {
        if (!mappings) { return; }

        var argLength = args.length,
            idx = 0, length = mappings.length;
        for (; idx < length; idx++) {
            if (mappings[idx].length === argLength) {
                return mappings[idx];
            }
        }
    };

    var _matchAny = function(args, val) {
        var type = _getParameterType(val),
            idx = args.length,
            mapItem;

        while (idx--) {
            mapItem = args[idx];

            if (mapItem instanceof Custom) {
                if (mapItem.check(val)) {
                    return TRUE;
                }
                continue;
            }

            if (args[idx] === type) {
                return TRUE;
            }
        }

        return FALSE;
    };

    var _matchMap = function(config, map) {
        var key, configItem, mapItem;
        for (key in config) {
            configItem = config[key];
            mapItem = map[key];

            if (configItem instanceof Custom) {
                if (!configItem.check(mapItem)) {
                    return FALSE;
                }
                continue;
            }

            if (configItem !== _getParameterType(mapItem)) {
                return FALSE;
            }
        }

        return TRUE;
    };

    /**
     * Custom type that validates a value
     * @constructor
     * @param {Function} check
     */
    var Custom = function(check) {
        this.check = check;
    };

    var o = {
        wild: new Custom(function() {
            return TRUE;
        }),
        truthy: new Custom(function(val) {
            return !!val === TRUE;
        }),
        falsy: new Custom(function(val) {
            return !!val === FALSE;
        }),
        any: function() {
            var args = _convertConfigurationTypes(arguments);
            return new Custom(function(val) {
                return _matchAny(args, val);
            });
        },
        except: function() {
            var args = _convertConfigurationTypes(arguments);
            return new Custom(function(val) {
                return !_matchAny(args, val);
            });
        },
        map: function(map) {
            var mapConfig = _convertConfigurationMap(map);
            return new Custom(function(map) {
                return _matchMap(mapConfig, map);
            }); 
        }
    };

    var fn = {
        /**
         * Methods mapped to argument types
         * Lazily instanciated
         * @type {Array} argument mapping
         */
        // this._m;

        /**
         * Methods mapped to argument lengths
         * Lazily instanciated
         * @type {Array} length mapping
         */
        // this._l;

        /**
         * A fallback function if none
         * of the criteria match on a call
         * @type {Function}
         */
        // this._f;

        map: function(map) {
            var self = this;

            return {
                use: function(method) {
                    var argMappings = self._m || (self._m = []);
                    argMappings.push({
                        params: [o.map(map)],
                        method: method
                    });
                    return self;
                }
            };
        },

        args: function() {
            var self = this,
                args = arguments;

            return {
                use: function(method) {
                    var argMappings = self._m || (self._m = []);
                    argMappings.push({
                        params: _convertConfigurationTypes(args),
                        method: method
                    });
                    return self;
                }
            };
        },

        len: function(num) {
            var self = this;
            return {
                use: function(method) {
                    var lengthMappings = self._l || (self._l = []);
                    lengthMappings.push({
                        length: (num === undefined) ? method.length : num,
                        method: method
                    });
                    return self;
                }
            };
        },

        error: function(method) {
            this._err = method;
            return this;
        },

        fallback: function(method) {
            this._f = method;
            return this;
        },

        call: function() {
            var args = _slice(arguments);
            return this._call(args.shift(), args);
        },

        apply: function(context, args) {
            args = (args && args.callee) ? _slice(args) : args;
            return this._call(context, args);
        },

        bind: function(context) {
            var self = this;
            return function() {
                return self._call(context, arguments);
            };
        },

        expose: function() {
            var self = this;
            return function() {
                return self._call(this, arguments);
            };
        },

        _call: function(context, args) {
            args = args || _noopArr;

            // Any argument match, of course, already matches
            // the length match, so this should be done first
            var argMatch = _getArgumentMatch(this._m, args);
            if (argMatch) {
                return argMatch.method.apply(context, args);
            }

            // Check for a length match
            var lengthMatch = _getLengthMatch(this._l, args);
            if (lengthMatch) {
                return lengthMatch.method.apply(context, args);
            }

            // Check for a fallback
            if (this._f) {
                return this._f.apply(context, args);
            }

            // Error
            return this._err ? this._err(args) : api.err;
        }
    };

    fn.fail = fn.err = fn.error;
    fn.count = fn.size = fn.len;

    var api = function() {
        var overload = function overload() {
            return overload._call(overload, arguments);
        };
        return extend(overload, fn);
    };
    api.o = o;
    api.fn = fn;
    api.err = function() {
        throw 'overload - exception: No methods matched';
    };
    api.define = api.defineType = function(name, check) {
        var custom = new Custom(check);
        return (o[name] = custom);
    };
    api.defineTypes = function(obj) {
        var key;
        for (key in obj) {
            api.define(key, obj[key]);
        }
        return api;
    };

    if (typeof define === 'function') { // RequireJS
        define(function() { return api; });
    }  else if (typeof module !== 'undefined' && module.exports) { // CommonJS
        module.exports = api;
    } else {
        root.overload = api;
        root.o = o;
    }

}(true, false, null));

},{}],5:[function(require,module,exports){
var _NODE_TYPE = require('node-type'),
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
        if (_.isNodeList(obj)) {
            return true;
        }
        if (_.isArguments(obj)) {
            return true;
        }
        if (_.isNumber(obj.length) && ('0' in obj)) {
            return true;
        }
        return false;
    },

    // NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
    isNodeList: function(obj) {
        return !!(obj && (
            obj instanceof NodeList ||
            obj instanceof HTMLCollection ||
            obj.item === '[object StaticNodeList]' // IE8 DispStaticNodeList object returned by querySelectorAll()
        ));
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
            if (!iterator(arr[idx], idx)) { return false; }
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

/**
 * Determines if the given value really, really, REALLY is a function.
 *
 * Workaround for Chakra JIT compiler bug in IE11 running in IE8 compat mode
 * in which a JIT'ed _.isFunction() returns true for host objects (e.g., DOM nodes),
 * which is obviously wrong.
 *
 * This function should be removed when IE8 support is dropped.
 *
 * @param {*} val Any value
 * @return {Boolean} true if the given value REALLY is a function, otherwise false.
 *
 * @see https://github.com/jashkenas/underscore/issues/1621
 * @see http://jsbin.com/lalovahu/1
 */
_.isReallyFunction = function(val) {
    return typeof val === 'function' || false;
};

module.exports = _;

},{"node-type":3}],6:[function(require,module,exports){
var _ = require('./utils'),

    getXHR = function() {
        return window['XMLHttpRequest'] ?
            new window['XMLHttpRequest']() :
            new ActiveXObject('Microsoft.XMLHTTP');
    },

    getXDR = function() {
        // CORS with IE8/9
        return new XDomainRequest();
    },

    // Guess XHR version
    isVersion2 = (getXHR().responseType === ''),

    promise         = require('./promise'),
    prepareHeaders  = require('./prepare-headers'),
    prepareUrl      = require('./prepare-url'),
    prepareData     = require('./prepare-data'),
    responseHandler = require('./response-handler'),
    progressHandler = require('./progress-handler');

// determine if we're dealing with a cross origin request
var determineIfCrossOrigin = function(url) {
    var host = url.match(/\/\/(.+?)\//);
    return host && host[1] ? host[1] !== location.host : false;
};

var getMethod = function(method, isCrossOrigin) {
    method = (method || '').toUpperCase();
    return (isCrossOrigin && method !== 'GET' && method !== 'POST') ? 'POST' : method || 'GET';
};

var determineType = function(data) {
    var def = xaja.default,
        arrBuff = window.ArrayBuffer;
    if (!arrBuff) { return def; }

    if (data instanceof arrBuff            || 
        data instanceof window.Uint16Array || 
        data instanceof window.Uint32Array || 
        data instanceof window.Uint8Array  || 
        data instanceof window.Uint8ClampedArray) { return 'arraybuffer'; }

    if (data instanceof window.Blob)        { return 'blob';     }
    if (data instanceof window.Document)    { return 'document'; }
    if (data instanceof window.FormData)    { return 'formdata'; }
    return def;
};

var parseOptions = function(urlParam, config) {
    if (_.isString(urlParam)) {
        var options = options || {};
        options.url = urlParam;
        return options;
    }
    return urlParam || {};
};

function xaja(urlParam, config) {
    var options         = parseOptions(urlParam, config),
        initialUrl      = options.url || '',
        isCrossOrigin   = options.crossDomain || determineIfCrossOrigin(initialUrl),

        timerTimeout,
        getTimer        = function() { return timerTimeout; },
        timeoutDur      = options.timeout ? +options.timeout : xaja.timeout,

        currentTries    = 0,
        retries         = options.retries ? +options.retries : 0,

        async           = options.async !== undefined ? !!options.async : true,
        createXHR       = options.xhr ? options.xhr : isCrossOrigin && window.XDomainRequest ? getXDR : getXHR,
        overrideMime    = options.mimeType,
        beforeSend      = options.before || options.beforeSend,
        withCredentials = options.withCredentials,
        method          = getMethod(options.type || options.method, isCrossOrigin),
        initialData     = options.data || null,
        cache           = options.cache === undefined ? true : !!options.cache,
        type            = options.dataType ? options.dataType.toLowerCase() : determineType(initialData),
        user            = options.user || options.username || '',
        password        = options.password || '',
        statusCode      = options.statusCode,
        xhrFields       = options.xhrFields,
        headers         = _.extend({ 'X-Requested-With': 'XMLHttpRequest' }, options.headers),

        xhr;

    // prepare the promise
    var promises = promise(), func;
    if ((func = options.success))  { promises.done(func);     }
    if ((func = options.complete)) { promises.complete(func); }
    if ((func = options.error))    { promises.error(func);    }
    if ((func = options.progress)) { promises.progress(func); }

    var data = prepareData(initialData, method, type),
        url  = prepareUrl(initialUrl, data, method, cache);

    var send = function() {
        var isTypeSupported,
            xhr = createXHR();

        xhr.onprogress = progressHandler(promises);

        // Open connection
        if (isCrossOrigin) {
            xhr.open(method, url);
        } else {
            xhr.open(method, url, async, user, password);
        }

        if (isVersion2 && async) {
            xhr.withCredentials = withCredentials;
        }

        // Identify supported XHR version
        if (type && isVersion2) {
            _.attempt(function() {
                xhr.responseType = type;
                // Don't verify for 'document' since we're using an internal routine
                isTypeSupported = (xhr.responseType === type && type !== 'document');
            });
        }

        var handleResponse = xhr._handleResponse = responseHandler(xhr, type, isTypeSupported, promises, url, statusCode, getTimer);
        handleResponse.bind(isCrossOrigin, isVersion2);
        
        if (!isCrossOrigin) {
            prepareHeaders(xhr, headers, method, type);
        }

        if (overrideMime) {
            xhr.overrideMimeType(overrideMime);
        }

        if (beforeSend) { beforeSend.call(xhr); }

        if (xhrFields) {
            var xhrKey;
            for (xhrKey in xhrFields) {
                xhr[xhrKey] = xhrFields[xhrKey];
            }
        }

        if (isCrossOrigin) {
            // https://developer.mozilla.org/en-US/docs/Web/API/XDomainRequest
            setTimeout(function() { xhr.send(); }, 0);
        } else {
            xhr.send(method !== 'GET' ? data : null);
        }

        return xhr;
    };

    xhr = send();

    // Timeout/retries
    var timeout = function() {
        timerTimeout = setTimeout(function() {
            xhr.abort();
            xhr.response = 'Timeout ('+ url +')';
            
            if (currentTries >= retries) {
                if (async) { xhr._handleResponse(); }
                return;
            }

            currentTries++;
            xhr = send();
            timeout();
            
        }, timeoutDur);
    };

    timeout();

    // return the promises
    return promises.promise();
}

// a shortcut composer for xaja methods, e.g. .get(), .post()
var shortcut = function(method) {
    return function(url, data, success, dataType) {
        // url isnt a string, assume
        // an object was passed to a
        // shortcut method
        if (!_.isString(url)) {
            return xaja(url);
        }

        // compose a xaja object with 
        // the parameters passed
        if (method === 'GET' && _.isFunction(data)) {
            success = data;
            data = null;
        }

        return xaja({
            url:      url,
            data:     data,
            method:   method,
            success:  success,
            dataType: dataType
        });
    };
};

module.exports = _.extend(xaja, {
    timeout:  3000,
    default:  'post',
    xhr2:     isVersion2,
    getXHR:   getXHR,
    ajax:     xaja,
    get:      shortcut('GET'),
    post:     shortcut('POST'),
    put:      shortcut('PUT'),
    del:      shortcut('DELETE')
});
},{"./prepare-data":7,"./prepare-headers":8,"./prepare-url":9,"./progress-handler":10,"./promise":11,"./response-handler":12,"./utils":13}],7:[function(require,module,exports){
var _ = require('./utils');

// serializeData to query string
var serializeData = function(data) {
    var values = [],
        key;
    for (key in data) {
        if (data[key] !== undefined) {
            values.push(encodeURIComponent(key) + (data[key].pop ? '[]' : '') + '=' + encodeURIComponent(data[key]));
        }
    }
    return values.join('&');
};

module.exports = function(data, method, type) {
    if (!_.exists(data)) {
        return null;
    }

    if (
        type === 'arraybuffer' ||
        type === 'formdata'    ||
        type === 'document'    ||
        type === 'file'        ||
        type === 'blob'        
    ) {
        return method === 'GET' ? null : data; 
    }
    
    if (type === 'text' && _.isString(data)) {
        return data;
    }

    if (type === 'json' && !_.isString(data)) {
        data = JSON.stringify(data);
    }

    if (type === 'post') {
        return serializeData(data);
    }

    return data;
};
},{"./utils":13}],8:[function(require,module,exports){
var ACCEPT_MAP = {
        text: '*/*',
        xml:  'application/xml, text/xml',
        html: 'text/html',
        json: 'application/json, text/javascript',
        js:   'application/javascript, text/javascript'
    },

    CONTENT_MAP = {
        text: 'text/plain',
        json: 'application/json'
    },

    rKeyFormatter = /(^|-)([^-])/g,
    toUpper = function(match, str1, str2) {
        return (str1 + str2).toUpperCase();
    };

module.exports = function(xhr, headers, method, type) {
    var headerKey, formattedHeaderKey;
    for (headerKey in headers) {
        formattedHeaderKey = headerKey.replace(rKeyFormatter, toUpper);
        xhr.setRequestHeader(formattedHeaderKey, headers[headerKey]);
    }

    // ensure a content type
    if (!headers['Content-Type'] && method !== 'GET') {
        xhr.setRequestHeader('Content-Type', CONTENT_MAP[type] || 'application/x-www-form-urlencoded');
    }

    if (!headers['Content-Type']) {
        xhr.setRequestHeader('Accept', ACCEPT_MAP[type]);
    }
};
},{}],9:[function(require,module,exports){
var _ = require('./utils'),
    rHasQuery = /\?/;

module.exports = function(url, data, method, cache) {
    var vars = '';

    // Prepare URL
    if (method === 'GET') {
        vars += !_.exists(data) ? '' : data;
    }

    if (cache === false && method === 'GET') {
        if (vars) { vars += '&'; }
        vars += '_=' + _.now();
    }

    if (vars) {
        url += (rHasQuery.test(url) ? '&' : '?') + vars;
    }

    return url;
};

},{"./utils":13}],10:[function(require,module,exports){
module.exports = function(promises) {
    return function(evt) {
        if (!evt.lengthComputable) { return; }

        // evt.loaded the bytes browser receive
        // evt.total the total bytes seted by the header
        var percentComplete = (evt.loaded / evt.total) * 100;
        promises.tick(percentComplete);
    };
};
},{}],11:[function(require,module,exports){
var makeCalls = function(arr, context, arg) {
    if (!arr) { return; }

    var idx = 0,
        fn;
    while ((fn = arr[idx])) {
        idx++;
        fn.call(context, arg);
    }

    arr.length = 0;
};

module.exports = function() {

    var successStack,
        errorStack,
        progressStack,
        completeStack,

        api = {
            tick: function(perc) {
                makeCalls(progressStack, perc, perc);
                return api;
            },
            resolve: function(xhr, response) {
                setTimeout(function() {
                    makeCalls(successStack, xhr, response);
                    makeCalls(completeStack, xhr);
                }, 0);
                return api;
            },
            reject: function(xhr, response) {
                setTimeout(function() {
                    makeCalls(errorStack, xhr, response);
                    makeCalls(completeStack, xhr);
                }, 0);
                return api;
            },

            promise: function() {
                var p = {
                    then: function(fn, err) {
                        successStack = successStack || [];
                        successStack.push(fn);

                        if (err) { p.catch(err); }
                        
                        return p;
                    },
                    catch: function(fn) {
                        errorStack = errorStack || [];
                        errorStack.push(fn);
                        return p;
                    },
                    finally: function(fn) {
                        completeStack = completeStack || [];
                        completeStack.push(fn);
                        return p;
                    },
                    progress: function(fn) {
                        progressStack = progressStack || [];
                        progressStack.push(fn);
                        return p;
                    }
                };

                // jquery methods: done, fail, always
                p.done   = p.then;
                p.fail   = p.catch;
                p.always = p.finally;

                return p;
            }
        };

    return api;
};
},{}],12:[function(require,module,exports){
// https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
var rVerifyStatus = /^2|1223/;

var attemptOrThrow = function(fn) {
    try {
        return fn();
    } catch (e) {
        throw e.message;
    }
};

var attemptXML = function(fn) {
    var response;
    try {
        response = fn();
    } catch (e) {}
    if (!response || !response.documentElement || response.getElementsByTagName('parsererror').length) {
        throw 'Invalid XML';
    }
    return response;
};

var parseDocument = function(response) {
    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    frame.contentDocument.open();
    frame.contentDocument.write(response);
    frame.contentDocument.close();
    response = frame.contentDocument;
    document.body.removeChild(frame);
    return response;
};

module.exports = function(xhr, type, isTypeSupported, promises, url, statusCode, timer) {

    var handler = function() {
        clearTimeout(timer());
        
        var response;

        // verify status code
        if (!rVerifyStatus.test(xhr.status)) {
            response = 'Request to "'+ url +'" aborted: '+ xhr.status + ' ('+ xhr.statusText +')';
            promises.reject(xhr, response);
            if (statusCode && statusCode[xhr.status]) {
                statusCode[xhr.status].call(xhr, response);
            }
            return;
        }

        if (isTypeSupported && xhr.response !== undefined) {

            response = xhr.response;

        } else {

            if (type === 'json') {
                response = attemptOrThrow(function() {
                    return JSON.parse(xhr['responseText']);
                });
            } else if (type === 'xml') {
                response = attemptXML(function() {
                    return (new DOMParser()).parseFromString(xhr['responseText'], 'text/xml');
                });
            } else if (type === 'document') {
                response = attemptOrThrow(function() {
                    return parseDocument(xhr.response);
                });
            } else {
                response = xhr['responseText'];
            }

        }

        promises.resolve(xhr, response);
        if (statusCode && statusCode[xhr.status]) {
            statusCode[xhr.status].call(xhr, response);
        }

        return response;
    };

    // Plug response handler
    handler.bind = function(isCrossOrigin, isVersion2) {
        if (isCrossOrigin || isVersion2) {
            xhr.onload = handler;
            return;
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) { return; }
            handler();
        };
    };

    return handler;
};
},{}],13:[function(require,module,exports){
module.exports = {
    attempt: function(fn) {
        try {
            return fn();
        } catch (e) {}
    },
    isString: function(obj) {
        return typeof obj === 'string';
    },
    isFunction: function(obj) {
        return typeof obj === 'function';
    },

    exists: function(obj) {
        return obj !== null && obj !== undefined;
    },

    // Extend a given object with all the properties in passed-in object(s).
    extend: function(base) {
        var args = arguments,
            idx = 1, len = args.length;
        for (; idx < len; idx++) {
            var source = args[idx];
            if (source) {
                for (var prop in source) {
                    base[prop] = source[prop];
                }
            }
        }
        return base;
    },

    now: Date.now || function() {
        return +new Date();
    }
};
},{}],14:[function(require,module,exports){
var div = document.createElement('div');

div.cssText   = 'opacity:.55';
div.innerHTML = '<a href="/a">a</a><button>button</button>';

module.exports = div;

},{}],15:[function(require,module,exports){
// http://ejohn.org/blog/comparing-document-position/
// https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
module.exports = {
    IDENTICAL               :  0,
    DISCONNECTED            :  1,
    PRECEDING               :  2,
    FOLLOWING               :  4,
    CONTAINS                :  8,
    CONTAINED_BY            : 16,
    IMPLEMENTATION_SPECIFIC : 32
};

},{}],16:[function(require,module,exports){
// DOC: Does not support "resolveWith", "rejectWith" etc...
// DOC: Does not support deprecated methods "isRejected", "isResolved" etc...
    /**
     * Status values, determines
     * what the promise's status is
     * @readonly
     * @enum {Number}
     */
var _ = require('underscore');

var _DEFERRED_STATUS = {
        idle:       0,
        progressed: 1,
        failed:     2,
        done:       3
    },
    /**
     * Call values, used to determine
     * what kind of functions to call
     * @readonly
     * @enum {Number}
     * @alias Deferred.CALL
     */
    _DEFERRED_CALL = {
        done:     0,
        fail:     1,
        always:   2,
        progress: 3,
        pipe:     4
    },

    // Invert _DEFERRED_CALL
    _DEFERRED_CALL_NAME = (function(obj) {
        var result = {},
            key;
        for (key in obj) {
            result[obj[key]] = key;
        }

        return result;
    }(_DEFERRED_CALL)),

    _PROMISE_KEYS = _.splt('done|fail|always|progress|pipe|then');

/**
 * A lightweight implementation of promises.
 * API based on {@link https://api.jquery.com/promise/ jQuery.promises}
 * @class Deferred
 */
var Deferred = function(beforeStart) {
    if (!(this instanceof Deferred)) { return new Deferred(beforeStart); }

    /**
     * Registered functions organized by _DEFERRED_CALL
     * @type {Object}
     * @private
     */
    this._calls = {};

    /**
     * Current status
     * @type {Number}
     * @private
     */
    this._status = _DEFERRED_STATUS.idle;

    if (beforeStart) { beforeStart.call(this, this); }
};

Deferred.prototype = /** @lends Deferred# */ {
    constructor: Deferred,

    /**
     * Register a done call that is fired after a Deferred is resolved
     * @param  {Function} func
     * @return {Deferred}
     */
    done: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.done, func); },

    /**
     * Register a fail call that is fired after a Deferred is rejected
     * @param  {Function} func
     * @return {Deferred}
     */
    fail: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.fail, func); },
    /**
     * Register a call that fires after done or fail
     * @param  {Function} func
     * @return {Deferred}
     */
    always: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.always, func); },
    /**
     * Register a progress call that is fired after a Deferred is notified
     * @param  {Function} func
     * @return {Deferred}
     */
    progress: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.progress, func); },
    /**
     * Register a pipe call that is fired before done or fail and whose return value
     * is passed to the next pipe/done/fail call
     * @param  {Function} func
     * @return {Deferred}
     */
    pipe: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.pipe, func); },

    /**
     * Proxy to done, fail, progress
     * @param  {Function} done
     * @param  {Function} fail
     * @param  {Function} progress
     * @return {Deferred}
     */
    then: function(done, fail, progress) {
        if (done) { this.done(done); }
        if (fail) { this.fail(fail); }
        if (progress) { this.progress(progress); }
        return this;
    },

    /**
     * Returns a protected promise object that
     * cannot be resolved/rejected, only subscribed to
     * @param  {Object} [obj]
     * @return {Object} promise
     */
    // DOC: No "type" passed as we are not supporting "fx"
    promise: function(obj) {
        var self = this,
            result = obj || {};

        var idx,
            len = _PROMISE_KEYS.length,
            key;
        for (idx = 0; idx < len; idx++) {
            key = _PROMISE_KEYS[idx];
            result[key] = self[key].bind(self);
        }

        return result;
    },

    // See: http://api.jquery.com/deferred.state/
    state: function() {
        if (this._status === _DEFERRED_STATUS.idle || this._status === _DEFERRED_STATUS.progressed) {
            return 'pending';
        }

        if (this._status === _DEFERRED_STATUS.failed) {
            return 'rejected';
        }

        if (this._status === _DEFERRED_STATUS.done) {
            return 'resolved';
        }
    },

    /**
     * Pushes a function into a call array by type
     * @param  {Deferred.CALL} callType
     * @param  {Function} func
     * @private
     */
    _pushCall: function(callType, func) {
        this._getCalls(callType).push(func);
        return this;
    },

    /**
     * Notify the promise - calls any functions in
     * Deferred.progress
     * @return {Deferred}
     */
    notify: function() {
        this._status = _DEFERRED_STATUS.progressed;

        var args = this._runPipe(arguments);
        this._fire(_DEFERRED_CALL.progress, args)._fire(_DEFERRED_CALL.always, args);

        return this;
    },

    /**
     * Reject the promise - calls any functions in
     * Deferred.fail, then calls any functions in
     * Deferred.always
     * @return {Deferred}
     */
    reject: function() {
        // If we've already called failed or done, go no further
        if (this._status === _DEFERRED_STATUS.failed || this._status === _DEFERRED_STATUS.done) { return this; }

        this._status = _DEFERRED_STATUS.failed;

        // Never run the pipe on fail. Simply fail.
        // Running the pipe after an unexpected failure may lead to
        // more failures
        this._fire(_DEFERRED_CALL.fail, arguments)
            ._fire(_DEFERRED_CALL.always, arguments);

        this._cleanup();

        return this;
    },

    /**
     * Resolve the promise - calls any functions in
     * Deferred.done, then calls any functions in
     * Deferred.always
     * @return {Deferred}
     */
    resolve: function() {
        // If we've already called failed or done, go no further
        if (this._status === _DEFERRED_STATUS.failed || this._status === _DEFERRED_STATUS.done) { return this; }

        this._status = _DEFERRED_STATUS.done;

        var args = this._runPipe(arguments);
        this._fire(_DEFERRED_CALL.done, args)
            ._fire(_DEFERRED_CALL.always, args);

        this._cleanup();

        return this;
    },

    /**
     * Fires a _DEFERRED_CALL type with the provided arguments
     * @param  {Deferred.CALL} callType
     * @param  {Array} args
     * @param  {*} context
     * @return {Deferred}
     * @private
     */
    _fire: function(callType, args, context) {
        var calls = this._getCalls(callType),
            idx = 0, length = calls.length;
        for (; idx < length; idx++) {
            calls[idx].apply(null, args);
        }
        return this;
    },

    /**
     * Runs the pipe, catching the return value
     * to pass to the next pipe. Returns the
     * arguments to used by the calling method
     * to proceed to call other methods (e.g. done/fail/always)
     * @param  {Array} args
     * @return {Array} args
     * @private
     */
    _runPipe: function(args) {
        var pipes = this._getCalls(_DEFERRED_CALL.pipe),
            idx = 0, length = pipes.length, val;
        for (; idx < length; idx++) {
            val = pipes[idx].apply(null, args);
            if (val !== undefined) { args = [val]; }
        }

        return args;
    },

    /**
     * Lazy generate arrays based on type to
     * avoid creating disposable arrays for
     * methods that aren't going to be used/called
     * @param  {Deferred.CALL} type
     * @return {Array}
     * @private
     */
    _getCalls: function(type) {
        return this._calls[_DEFERRED_CALL_NAME[type]] || (this._calls[_DEFERRED_CALL_NAME[type]] = []);
    },

    /**
     * Cleanup references to functions stored in
     * arrays that are no longer able to be called
     * @private
     */
    _cleanup: function() {
        this._getCalls(_DEFERRED_CALL.done).length = 0;
        this._getCalls(_DEFERRED_CALL.fail).length = 0;
        this._getCalls(_DEFERRED_CALL.always).length = 0;
    }
};

module.exports = {
    Deferred: Deferred,
    STATUS: _DEFERRED_STATUS,
    CALL: _DEFERRED_CALL,

    D: {
        Deferred: Deferred
    }
};
},{"underscore":5}],17:[function(require,module,exports){
var _         = require('underscore'),

    _deferObj = require('./Deferred'),
    _Deferred  = _deferObj.Deferred,
    _CALL     = _deferObj.CALL,
    _STATUS   = _deferObj.STATUS;

/**
 * The when object. It's not exposed to the user,
 * they only see a promise (with a .then() method),
 * but all the magic happens here
 */
var When = function() {
    /**
     * Store our promise
     * @type {Deferred}
     */
    this._d = null;

    /**
     * Store the deferred being listened to
     * @type {Array.<Deferred>}
     */
    this._events = [];
};

When.prototype = {
    constructor: When,

    /**
     * Called by the public when function to initialize
     * the when object
     * @return {Deferred}
     */
    init: function() {
        this._events = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
        this._subscribe();

        var deferred = new _Deferred();
        this._d = deferred;
        return deferred; // Return the deferred so that it can be subscribed to
    },

    /**
     * Subscribe to the deferred passed and react
     * when they fire events
     * @private
     */
    _subscribe: function() {
        var check = _.bind(this._checkStatus, this),
            fireProgress = _.bind(this._fireProgress, this),
            events = this._events,
            idx = events.length;
        while (idx--) {
            events[idx].done(check).fail(check).progress(fireProgress);
        }
    },

    /**
     * Check the status of all deferred when
     * any one promise fires an event
     * @private
     */
    _checkStatus: function() {
        var events = this._events, evt,
            total = events.length,
            done = 0, failed = 0,
            idx = total;
        while (idx--) {
            evt = events[idx];
            // We're waiting for everything to complete
            // so if there's an item with no status, stop
            if (evt.status() === _STATUS.idle)   { return; }
            if (evt.status() === _STATUS.done)   { done += 1; continue; }
            if (evt.status() === _STATUS.failed) { failed += 1; continue; }
        }
        this._fire(total, done, failed, arguments);
    },

    /**
     * Based on the statuses of our deferred, fire the
     * appropriate events
     * @param  {Number}    total  total number of deferred
     * @param  {Number}    done   deferred in a done state
     * @param  {Number}    failed deferred in a failed state
     * @param  {Arguments} args   arguments to pass
     * @private
     */
    _fire: function(total, done, failed, args) {
        var deferred = this._d; // Our deferred

        // If everything completed, call done (this will call always)
        if (done === total) { return deferred.resolve.apply(deferred, args); }

        // If everything failed, call fail (this will call always)
        if (failed === total) { return deferred.reject.apply(deferred, args); }

        // If everything fired, but they're not all one thing, then just call always.
        // The only way to do that without exposing a public function in Deferred is
        // to use the private _fire event
        if ((done + failed) === total) { return deferred._fire(_CALL.always, args); }
    },

    /**
     * Handled separately from fire because we want to trigger
     * anytime any of the deferred progress regardless of sate
     * @private
     */
    _fireProgress: function() {
        var deferred = this._d;
        deferred.notify.apply(deferred, arguments);
    }
};

module.exports = {
    D: {
        when: function() {
            var w = new When();
            return w.init.apply(w, arguments);
        }
    }
};
},{"./Deferred":16,"underscore":5}],18:[function(require,module,exports){
var _ = require('underscore'),

    _cache = require('cache'),

    _queryCache = _cache(),
    _isCache    = _cache(),

    Selector = require('./constructs/Selector'),
    Query = require('./constructs/Query'),
    Is = require('./constructs/Is'),

    _parse = require('./selector/selector-parse'),
    _normalize = require('./selector/selector-normalize');

var _toSelectors = function(str) {
    // Selectors will return null if the query was invalid.
    // Not returning early or doing extra checks as this will
    // noop on the Query and Is level and is the exception
    // instead of the rule
    var selectors = _parse.subqueries(str) || [];

    // Normalize each of the selectors...
    selectors = _.map(selectors, _normalize);

    // ...and map them to Selector objects
    return _.fastmap(selectors, function(selector) {
        return new Selector(selector);
    });
};

module.exports = {
    query: function(str) {
        return _queryCache.getOrSet(str, function() {
            return new Query(_toSelectors(str));
        });
    },
    is: function(str) {
        return _isCache.getOrSet(str, function() {
            return new Is(_toSelectors(str));
        });
    }
};


},{"./constructs/Is":19,"./constructs/Query":20,"./constructs/Selector":21,"./selector/selector-normalize":25,"./selector/selector-parse":26,"cache":2,"underscore":5}],19:[function(require,module,exports){
var _ = require('underscore');

var Is = module.exports = function(selectors) {
    this._selectors = selectors;
};
Is.prototype = {
    match: function(context) {
        var selectors = this._selectors,
            idx = selectors.length;

        while (idx--) {
            if (selectors[idx].match(context)) { return true; }
        }

        return false;
    },

    any: function(arr) {
        var self = this;
        return _.any(arr, function(elem) {
            if (self.match(elem)) { return true; }
        });
    },

    not: function(arr) {
        var self = this;
        return _.filter(arr, function(elem) {
            if (!self.match(elem)) { return true; }
        });
    }
};


},{"underscore":5}],20:[function(require,module,exports){
var Query = module.exports = function(selectors) {
    this._selectors = selectors;
};

Query.prototype = {
    exec: function(arr, isNew) {
        var result = [],
            idx = 0, length = isNew ? 1 : arr.length;
        for (; idx < length; idx++) {
            result.push.apply(result, this._find(arr[idx]));
        }
        return result;
    },
    _find: function(context) {
        var result = [],
            selectors = this._selectors,
            idx = 0, length = selectors.length;
        for (; idx < length; idx++) {
            result.push.apply(result, selectors[idx].exec(context));
        }
        return result;
    }
};

},{}],21:[function(require,module,exports){
var _ = require('underscore'),
    string = require('../../../string'),
    overload = require('overload-js'),
    o = overload.o,

    _ID_PREFIX = 'D-uniqueId-',

    _GET_ELEMENT_BY_ID          = 'getElementById',
    _GET_ELEMENTS_BY_TAG_NAME   = 'getElementsByTagName',
    _GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    _QUERY_SELECTOR_ALL         = 'querySelectorAll',

    _SUPPORTS  = require('../../../supports'),
    NODE_TYPE = require('node-type'),

    _cache = require('cache'),
    _regex = require('../../../regex'),

    _querySelectorCache = _cache(),

    _isMatch = require('../selector/selector-match');

var _determineMethod = function(selector) {
        var method = _querySelectorCache.get(selector);
        if (method) { return method; }

        if (_regex.selector.isStrictId(selector)) {
            method = _GET_ELEMENT_BY_ID;
        } else if (_regex.selector.isClass(selector)) {
            method = _GET_ELEMENTS_BY_CLASS_NAME;
        } else if (_regex.selector.isTag(selector)) {
            method = _GET_ELEMENTS_BY_TAG_NAME;
        } else {
            method = _QUERY_SELECTOR_ALL;
        }

        _querySelectorCache.set(selector, method);
        return method;
    },

    _uniqueId = function() {
        return _ID_PREFIX + _.uniqueId();
    },

    _fromDomArrayToArray = function(arrayLike) {
        var idx = arrayLike.length,
            arr = new Array(idx);
        while (idx--) {
            arr[idx] = arrayLike[idx];
        }
        return arr;
    },

    _processQuerySelection = function(selection) {
        // No selection
        if (!selection) {
            return [];
        }
        // Nodelist without a length
        if (_.isNodeList(selection) && !selection.length) {
            return [];
        }
        // IE8 DispStaticNodeList
        if (selection.item && selection.length === 0) {
            return [];
        }

        // If it's an id, return it as an array
        return _.isElement(selection) || !selection.length ? [selection] : _fromDomArrayToArray(selection);
    },

    _childOrSiblingQuery = function(context, self) {
        // Child select - needs special help so that "> div" doesn't break
        var method    = self.method,
            idApplied = false,
            selector  = self.selector,
            newId,
            id;

        id = context.id;
        if (id === '' || !_.exists(id)) {
            newId = _uniqueId();
            context.id = newId;
            idApplied = true;
        }

        selector = self._tailorChildSelector(idApplied ? newId : id, selector);

        var selection = document[method](selector);

        if (idApplied) {
            context.id = id;
        }

        return _processQuerySelection(selection);
    },

    _classQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector;

        if (_SUPPORTS.getElementsByClassName) {
            // Class search, don't start with '.'
            selector = selector.substr(1);
        } else {
            method = _QUERY_SELECTOR_ALL;
        }

        var selection = context[method](selector);

        return _processQuerySelection(selection);
    },

    _idQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector.substr(1),
            selection = document[method](selector);

        return _processQuerySelection(selection);
    },

    _defaultQuery = function(context, self) {
        var selection = context[self.method](self.selector);
        return _processQuerySelection(selection);
    },

    _determineQuery = function(self) {
        if (self.isChildOrSiblingSelect) {
            return _childOrSiblingQuery;
        }

        if (self.isClassSearch) {
            return _classQuery;
        }

        if (self.isIdSearch) {
            return _idQuery;
        }

        return _defaultQuery;
    };

var Selector = function(str) {
    var selector                = string.trim(str),
        isChildOrSiblingSelect  = (selector[0] === '>' || selector[0] === '+'),
        method                  = isChildOrSiblingSelect ? _QUERY_SELECTOR_ALL : _determineMethod(selector);

    this.str                    = str;
    this.selector               = selector;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.isIdSearch             = method === _GET_ELEMENT_BY_ID;
    this.isClassSearch          = !this.isIdSearch && method === _GET_ELEMENTS_BY_CLASS_NAME;
    this.method                 = method;
};

Selector.prototype = {

    _tailorChildSelector: function(id, selector) {
        return '#' + id + ' ' + selector;
    },

    match: function(context) {
        // No neeed to check, a match will fail if it's
        // child or sibling
        if (this.isChildOrSiblingSelect) { return false; }

        return _isMatch(context, this.selector);
    },

    exec: function(context) {
        var query = _determineQuery(this);

        if (!context || context === document) {
            return query(document, this);
        }

        // these are the types we're expecting to fall through
        // _.isElement(context) || _.isNodeList(context) || _.isCollection(context)
        return query(context, this);
    }
};

module.exports = Selector;

},{"../../../regex":52,"../../../string":53,"../../../supports":54,"../selector/selector-match":24,"cache":2,"node-type":3,"overload-js":4,"underscore":5}],22:[function(require,module,exports){
module.exports = {
    // DOC: Document these selectors
    ':child-at':  ':nth-child(x)',
    ':child-gt':  ':nth-child(n+x)',
    ':child-lt':  ':nth-child(~n+x)'
};

},{}],23:[function(require,module,exports){
var _SUPPORTS = require('../../../supports');

var proxy = {
    // DOC: Document these selectors
    ':child-even' : ':nth-child(even)',
    ':child-odd'  : ':nth-child(odd)',

    ':text'       : '[type="text"]',
    ':password'   : '[type="password"]',
    ':radio'      : '[type="radio"]',
    ':checkbox'   : '[type="checkbox"]',
    ':submit'     : '[type="submit"]',
    ':reset'      : '[type="reset"]',
    ':button'     : '[type="button"]',
    ':image'      : '[type="image"]',
    ':input'      : '[type="input"]',
    ':file'       : '[type="file"]',

    // See https://developer.mozilla.org/en-US/docs/Web/CSS/:checked
    ':selected'   : '[selected="selected"]'
};

// IE8
if (!_SUPPORTS.disabledSelector) {
    proxy[':disabled'] = '[disabled]';

    // DOC: No good way to polyfill this.
    // proxy[':enabled']  = ':not([disabled])';
}

// IE8
if (!_SUPPORTS.checkedSelector) {
    proxy[':checked']  = '[checked]';
}

module.exports = proxy;

},{"../../../supports":54}],24:[function(require,module,exports){
var _SUPPORTS  = require('../../../supports'),
    NODE_TYPE = require('node-type'),

    _matchesSelector = _SUPPORTS.matchesSelector;

var matches;

// IE9+, modern browsers
if (_matchesSelector) {
    matches = function(elem, selector) {
        if (elem.nodeType !== NODE_TYPE.ELEMENT) { return false; }

        return _matchesSelector.call(elem, selector);
    };
}
// IE8
else {
    matches = function(elem, selector) {
        if (elem.nodeType !== NODE_TYPE.ELEMENT) { return false; }

        var frag;

        if (!elem.parentNode) {
            frag = document.createDocumentFragment();
            frag.appendChild(elem);
        }

        var nodes = (frag || elem.parentNode).querySelectorAll(selector),
            idx = nodes.length;

        while (idx--) {
            if (nodes[idx] === elem) {
                return true;
            }
        }

        if (frag) {
            frag.removeChild(elem);
            frag = null; // prevent memory leaks in IE8
        }

        return false;
    };
}

module.exports = matches;

},{"../../../supports":54,"node-type":3}],25:[function(require,module,exports){
var _SUPPORTS           = require('../../../supports'),

    _ATTRIBUTE_SELECTOR = /\[\s*[\w-]+\s*[!$^*]?(?:=\s*(['"]?)(.*?[^\\]|[^\\]*))?\1\s*\]/g,
    _PSEUDO_SELECT      = /(:[^\s\(\[)]+)/g,
    _CAPTURE_SELECT     = /(:[^\s^(]+)\(([^\)]+)\)/g,

    _cache              = require('cache'),
    _pseudoCache        = _cache(),

    _proxySelectors     = require('../list/selectors-proxy'),
    _captureSelectors   = require('../list/selectors-capture');

var _getAttributePositions = function(str) {
    var pairs = [];
    // Not using return value. Simply using it to iterate
    // through all of the matches to populate match positions
    str.replace(_ATTRIBUTE_SELECTOR, function(match, cap1, cap2, position) {
        pairs.push([ position, position + match.length ]);
    });
    return pairs;
};

var _isOutsideOfAttribute = function(position, positions) {
    var idx = 0, length = positions.length;
    for (; idx < length; idx++) {
        var pos = positions[idx];
        if (position > pos[0] && position < pos[1]) {
            return false;
        }
    }
    return true;
};

var _pseudoReplace = function(str, positions) {
    return str.replace(_PSEUDO_SELECT, function(match, cap, position) {
        if (!_isOutsideOfAttribute(position, positions)) { return match; }

        return _proxySelectors[match] ? _proxySelectors[match] : match;
    });
};

var _captureReplace = function(str, positions) {
    var captureSelector;
    return str.replace(_CAPTURE_SELECT, function(match, cap, value, position) {
        if (!_isOutsideOfAttribute(position, positions)) { return match; }

        return (captureSelector = _captureSelectors[cap]) ? captureSelector.replace('x', value) : match;
    });
};

var _booleanSelectorReplace = _SUPPORTS.selectedSelector
    // IE10+, modern browsers
    ? function(str) { return str; }
    // IE8-9
    : function(str) {
        var positions = _getAttributePositions(str),
            idx = positions.length,
            pos,
            selector;

        while (idx--) {
            pos = positions[idx];
            selector = str.substring(pos[0], pos[1]);
            if (selector === '[selected]') {
                str = str.substring(0, pos[0]) + '[selected="selected"]' + str.substring(pos[1]);
            }
        }

        return str;
    };

module.exports = function(str) {
    return _pseudoCache.getOrSet(str, function() {
        var attrPositions = _getAttributePositions(str);
        str = _pseudoReplace(str, attrPositions);
        str = _booleanSelectorReplace(str);
        return _captureReplace(str, attrPositions);
    });
};

},{"../../../supports":54,"../list/selectors-capture":22,"../list/selectors-proxy":23,"cache":2}],26:[function(require,module,exports){
/*
 * Fizzle.js
 * Adapted from Sizzle.js
 */
var _ = require('underscore'),

    _cache         = require('cache'),
    _tokenCache    = _cache(),
    _subqueryCache = _cache(),
    _boolAttrCache = _cache(),

    _error = (!console || !console.error) ? _.noop :
        function(selector) {
            console.error('Invalid query selector (caught): ' + selector);
        };

var _booleans = 'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped',

    _fromCharCode = String.fromCharCode,

    // http://www.w3.org/TR/css3-selectors/#whitespace
    _whitespace = '[\\x20\\t\\r\\n\\f]',

    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    _identifier = '(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+',

    // NOTE: Leaving double quotes to reduce escaping
    // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
    _attributes = "\\[" + _whitespace + "*(" + _identifier + ")(?:" + _whitespace +
        // Operator (capture 2)
        "*([*^$|!~]?=)" + _whitespace +
        // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + _identifier + "))|)" + _whitespace +
        "*\\]",

    _pseudos = ":(" + _identifier + ")(?:\\((" +
        // To reduce the number of selectors needing _tokenize in the preFilter, prefer arguments:
        // 1. quoted (capture 3; capture 4 or capture 5)
        "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
        // 2. simple (capture 6)
        "((?:\\\\.|[^\\\\()[\\]]|" + _attributes + ")*)|" +
        // 3. anything else (capture 2)
        ".*" +
        ")\\)|)",

    _rcomma = new RegExp('^' + _whitespace + '*,' + _whitespace + '*'),
    _rcombinators = new RegExp('^' + _whitespace + '*([>+~]|' + _whitespace + ')' + _whitespace + '*'),

    _rpseudo = new RegExp(_pseudos),

    _matchExpr = {
        ID:     new RegExp('^#('   + _identifier + ')'),
        CLASS:  new RegExp('^\\.(' + _identifier + ')'),
        TAG:    new RegExp('^('    + _identifier + '|[*])'),
        ATTR:   new RegExp('^'     + _attributes),
        PSEUDO: new RegExp('^'     + _pseudos),
        CHILD:  new RegExp('^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(' + _whitespace +
            '*(even|odd|(([+-]|)(\\d*)n|)' + _whitespace + '*(?:([+-]|)' + _whitespace +
            '*(\\d+)|))' + _whitespace + '*\\)|)', 'i'),

        bool:   new RegExp("^(?:" + _booleans + ")$", "i"),

        // For use in libraries implementing .is()
        // We use this for POS matching in `select`
        needsContext: new RegExp('^' + _whitespace + '*[>+~]|:(even|odd|nth|eq|gt|lt|first|last)(?:\\(' +
            _whitespace + '*((?:-\\d)?\\d*)' + _whitespace + '*\\)|)(?=[^-]|$)', 'i')
    },

    // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
    _runescape = new RegExp('\\\\([\\da-f]{1,6}' + _whitespace + '?|(' + _whitespace + ')|.)', 'ig'),
    _funescape = function(_, escaped, escapedWhitespace) {
        var high = '0x' + (escaped - 0x10000);
        // NaN means non-codepoint
        // Support: Firefox<24
        // Workaround erroneous numeric interpretation of +'0x'
        return high !== high || escapedWhitespace ?
            escaped :
            high < 0 ?
                // BMP codepoint
                _fromCharCode(high + 0x10000) :
                // Supplemental Plane codepoint (surrogate pair)
                _fromCharCode((high >> 10) | 0xD800, (high & 0x3FF) | 0xDC00);
    },

    _preFilter = {
        ATTR: function(match) {
            match[1] = match[1].replace(_runescape, _funescape);

            // Move the given value to match[3] whether quoted or unquoted
            match[3] = ( match[3] || match[4] || match[5] || '' ).replace(_runescape, _funescape);

            if (match[2] === '~=') {
                match[3] = ' ' + match[3] + ' ';
            }

            return match.slice(0, 4);
        },

        CHILD: function(match) {
            /* matches from _matchExpr['CHILD']
                1 type (only|nth|...)
                2 what (child|of-type)
                3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
                4 xn-component of xn+y argument ([+-]?\d*n|)
                5 sign of xn-component
                6 x of xn-component
                7 sign of y-component
                8 y of y-component
             */
            match[1] = match[1].toLowerCase();

            if (match[1].slice(0, 3) === 'nth') {
                // nth-* requires argument
                if (!match[3]) {
                    throw new Error(match[0]);
                }

                // numeric x and y parameters for Expr.filter.CHILD
                // remember that false/true cast respectively to 0/1
                match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === 'even' || match[3] === 'odd'));
                match[5] = +(( match[7] + match[8]) || match[3] === 'odd');

            // other types prohibit arguments
            } else if (match[3]) {
                throw new Error(match[0]);
            }

            return match;
        },

        PSEUDO: function(match) {
            var excess,
                unquoted = !match[6] && match[2];

            if (_matchExpr.CHILD.test(match[0])) {
                return null;
            }

            // Accept quoted arguments as-is
            if (match[3]) {
                match[2] = match[4] || match[5] || '';

            // Strip excess characters from unquoted arguments
            } else if (unquoted && _rpseudo.test(unquoted) &&
                // Get excess from _tokenize (recursively)
                (excess = _tokenize(unquoted, true)) &&
                // advance to the next closing parenthesis
                (excess = unquoted.indexOf(')', unquoted.length - excess) - unquoted.length)) {

                // excess is a negative index
                match[0] = match[0].slice(0, excess);
                match[2] = unquoted.slice(0, excess);
            }

            // Return only captures needed by the pseudo filter method (type and argument)
            return match.slice(0, 3);
        }
    };

/**
 * Splits the given comma-separated CSS selector into separate sub-queries.
 * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
 * @param  {Boolean} [parseOnly=false]
 * @return {String[]|Number|null} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]') or null if there was an error parsing.
 * @private
 */
var _tokenize = function(selector, parseOnly) {
    var cached = _tokenCache.get(selector);

    if (cached) {
        return parseOnly ? 0 : cached.slice(0);
    }

    var /** @type {String} */
        type,

        /** @type {RegExp} */
        regex,

        /** @type {Array} */
        match,

        /** @type {String} */
        matched,

        /** @type {String[]} */
        subqueries = [],

        /** @type {String} */
        subquery = '',

        /** @type {String} */
        soFar = selector;

    while (soFar) {
        // Comma and first run
        if (!matched || (match = _rcomma.exec(soFar))) {
            if (match) {
                // Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar;
            }
            if (subquery) { subqueries.push(subquery); }
            subquery = '';
        }

        matched = null;

        // Combinators
        if ((match = _rcombinators.exec(soFar))) {
            matched = match.shift();
            subquery += matched;
            soFar = soFar.slice(matched.length);
        }

        // Filters
        for (type in _matchExpr) {
            regex = _matchExpr[type];
            match = regex.exec(soFar);

            if (match && (!_preFilter[type] || (match = _preFilter[type](match)))) {
                matched = match.shift();
                subquery += matched;
                soFar = soFar.slice(matched.length);

                break;
            }
        }

        if (!matched) {
            break;
        }
    }

    if (subquery) { subqueries.push(subquery); }

    // Return the length of the invalid excess
    // if we're just parsing.
    if (parseOnly) { return soFar.length; }

    if (soFar) { _error(selector); return null; }

    return _tokenCache.set(selector, subqueries).slice();
};

module.exports = {
    /**
     * Splits the given comma-separated CSS selector into separate sub-queries.
     * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
     * @return {String[]|null} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]') or null if there was an error parsing the selector.
     */
    subqueries: function(selector) {
        return _subqueryCache.getOrSet(selector, function() {
            return _tokenize(selector);
        });
    },

    isBooleanAttribute: function(name) {
        return _boolAttrCache.getOrSet(name, function() {
            return _matchExpr.bool.test(name);
        });
    }
};

},{"cache":2,"underscore":5}],27:[function(require,module,exports){
var _      = require('underscore'),
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

},{"../order":50,"underscore":5}],28:[function(require,module,exports){
var _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,

    _SUPPORTS  = require('../supports'),
    NODE_TYPE = require('node-type'),

    _utils     = require('../utils'),
    _cache     = require('cache'),

    _selector  = require('./Fizzle/selector/selector-parse'),

    _isDataKeyCache       = _cache(),
    _sanitizeDataKeyCache = _cache(),
    _trimDataKeyCache     = _cache(),
    _attrNameLowerCache   = _cache();

var _isDataKey = function(key) {
        return _isDataKeyCache.getOrSet(key, function() {
            return (key || '').substr(0, 5) === 'data-';
        });
    },

    _sanitizeDataKey = function(key) {
        return _sanitizeDataKeyCache.getOrSet(key, function() {
            return _isDataKey(key) ? key : 'data-' + key.toLowerCase();
        });
    },

    _trimDataKey = function(key) {
        return _trimDataKeyCache.getOrSet(key, function() {
            return key.substr(0, 5);
        });
    },

    _getDataAttrKeys = function(elem) {
        var attrs = elem.attributes,
            idx   = attr.length, keys = [];
        while (idx--) {
            key = attrs[idx];
            if (_isDataKey(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

var _hasAttr = _SUPPORTS.inputValueAttr
    // IE9+, modern browsers
    ? function(elem, attr) { return elem.hasAttribute(attr); }
    // IE8
    : function(elem, attr) {
        var nodeName = _utils.normalNodeName(elem);
        // In IE8, input.hasAttribute('value') returns false
        // and input.getAttributeNode('value') returns null
        // if the value is empty ("").
        if (nodeName === 'input' && attr === 'value') {
            return true;
        }
        // In IE8, option.hasAttribute('selected') always returns false.
        // Seriously.
        if (nodeName === 'option' && attr === 'selected') {
            return elem.getAttributeNode(attr) !== null;
        }
        return elem.hasAttribute(attr);
    };

var _boolHook = {
    is: function(attrName) {
        return _selector.isBooleanAttribute(attrName);
    },
    get: function(elem, attrName) {
        if (_hasAttr(elem, attrName)) {
            return _attrNameLowerCache.getOrSet(attrName, function() {
                return attrName.toLowerCase();
            });
        }
        return undefined;
    },
    set: function(elem, value, attrName) {
        if (value === false) {
            // Remove boolean attributes when set to false
            return elem.removeAttribute(attrName);
        }

        elem.setAttribute(attrName, attrName);
    }
};

var _hooks = {
        tabindex: {
            get: function(elem) {
                var tabindex = elem.getAttribute('tabindex');
                if (!_.exists(tabindex) || tabindex === '') { return; }
                return tabindex;
            }
        },

        type: {
            set: function(elem, value) {
                if (!_SUPPORTS.radioValue && value === 'radio' && _utils.isNodeName(elem, 'input')) {
                    // Setting the type on a radio button after the value resets the value in IE6-9
                    // Reset value to default in case type is set after value during creation
                    var oldValue = elem.value;
                    elem.setAttribute('type', value);
                    elem.value = oldValue;
                }
                else {
                    elem.setAttribute('type', value);
                }
            }
        },

        value: {
            get: function(elem) {
                var val = elem.value;
                if (val === null || val === undefined) {
                    val = elem.getAttribute('value');
                }
                // IE8
                if (val === null || val === undefined) {
                    val = elem.defaultValue;
                }
                // IE8
                if (!_SUPPORTS.buttonValue && val === '' && _utils.isNodeName(elem, 'button')) {
                    val = elem.getAttribute('value');
                }
                return _utils.normalizeNewlines(val);
            },
            set: function(elem, value) {
                elem.setAttribute('value', value);
            }
        }
    },

    _isElementNode = function(elem) {
        return elem && elem.nodeType === NODE_TYPE.ELEMENT;
    },

    _getAttribute = function(elem, attr) {
        if (!_isElementNode(elem) || !_hasAttr(elem, attr)) { return; }

        if (_boolHook.is(attr)) {
            return _boolHook.get(elem, attr);
        }

        if (_hooks[attr] && _hooks[attr].get) {
            return _hooks[attr].get(elem);
        }

        var ret = elem.getAttribute(attr);
        return _.exists(ret) ? ret : undefined;
    },

    _setter = {
        forAttr: function(attr, value) {
            if (_boolHook.is(attr) && (value === true || value === false)) {
                return _setter.bool;
            } else if (_hooks[attr] && _hooks[attr].set) {
                return _setter.hook;
            }
            return _setter.elem;
        },
        bool: function(elem, attr, value) {
            _boolHook.set(elem, value, attr);
        },
        hook: function(elem, attr, value) {
            _hooks[attr].set(elem, value);
        },
        elem: function(elem, attr, value) {
            elem.setAttribute(attr, value);
        },
    },
    _setAttributes = function(arr, attr, value) {
        var isFn   = _.isFunction(value),
            idx    = 0,
            len    = arr.length,
            elem,
            val,
            setter = _setter.forAttr(attr, value);

        for (; idx < len; idx++) {
            elem = arr[idx];

            if (!_isElementNode(elem)) { continue; }

            val = isFn ? value.call(elem, idx, _getAttribute(elem, attr)) : value;
            setter(elem, attr, val);
        }
    },
    _setAttribute = function(elem, attr, value) {
        if (!_isElementNode(elem)) { return; }
        var setter = _setter.forAttr(attr, value);
        setter(elem, attr, value);
    },

    _removeAttributes = function(arr, attr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _removeAttribute(arr[idx], attr);
        }
    },
    _removeAttribute = function(elem, attr) {
        if (!_isElementNode(elem)) { return; }

        if (_hooks[attr] && _hooks[attr].remove) {
            return _hooks[attr].remove(elem);
        }

        elem.removeAttribute(attr);
    };

module.exports = {
    fn: {
        attr: overload()
            .args(String)
            .use(function(attr) {
                return _getAttribute(this[0], attr);
            })

            .args(String, o.any(String, Number, Boolean))
            .use(function(attr, value) {
                _setAttributes(this, attr, value);
                return this;
            })

            .args(String, null)
            .use(function(attr) {
                _removeAttributes(this, attr);
                return this;
            })

            .args(Object)
            .use(function(attrs) {
                var attr;
                for (attr in attrs) {
                    _setAttributes(this, attr, attrs[attr]);
                }

                return this;
            })

            .args(String, Function)
            .use(function(attr, fn) {
                return _.each(this, function(elem, idx) {
                    var oldAttr = _getAttribute(elem, attr),
                        result  = fn.call(elem, idx, oldAttr);
                    if (!_.exists(result)) { return; }
                    _setAttribute(elem, attr, result);
                });
            })

            .fallback(_utils.returnThis)

            .expose(),

        removeAttr: overload()
            .args(String)
            .use(function(attr) {
                _removeAttributes(this, attr);
                return this;
            })

            .expose(),

        attrData: overload()
            .args(Object)
            .use(function(obj) {
                var idx = this.length,
                    key;
                while (idx--) {
                    for (key in obj) {
                        this[idx].setAttribute(_sanitizeDataKey(key), '' + obj[key]);
                    }
                }
                return this;
            })

            .args(String, o.wild)
            .use(function(key, value) {
                var idx = this.length;
                while (idx--) {
                    this[idx].setAttribute(_sanitizeDataKey(key), '' + value);
                }
                return this;
            })

            .args()
            .use(function() {
                var first = this[0];
                if (!first) { return; }

                var map  = {},
                    keys = _getDataAttrKeys(first),
                    idx  = keys.length, key;
                while (idx--) {
                    key = keys[idx];
                    map[_trimDataKey(key)] = _.typecast(first.getAttribute(key));
                }

                return map;
            })

            .expose()
    }
};

},{"../supports":54,"../utils":55,"./Fizzle/selector/selector-parse":26,"cache":2,"node-type":3,"overload-js":4,"underscore":5}],29:[function(require,module,exports){
var NODE_TYPE = require('node-type'),
    _SUPPORTS  = require('../supports'),

    _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,

    string     = require('../string'),
    _split     = string.split,
    _isEmpty   = string.isEmpty;

var _impl = _SUPPORTS.classList ? require('./classes/classes-modern')
                                : require('./classes/classes-legacy');

var _doAnyElemsHaveClass = function(elems, name) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            if (_impl.hasClass(elems[elemIdx], name)) { return true; }
        }
        return false;
    },

    _addClasses = function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.addClasses(elems[elemIdx], names);
        }
    },

    _removeClasses = function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.removeClasses(elems[elemIdx], names);
        }
    },

    _removeAllClasses = function(elems) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            elems[elemIdx].className = '';
        }
    },

    _toggleClasses = function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.toggleClasses(elems[elemIdx], names);
        }
    };

module.exports = {
    fn: {
        hasClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }
                return _doAnyElemsHaveClass(this, name);
            })
            .expose(),

        addClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _addClasses(this, names);

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                _addClasses(this, names);

                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .expose(),

        removeClass: overload()
            .args()
            .use(function() {
                if (!this.length) { return this; }

                _removeAllClasses(this);

                return this;
            })

            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _removeClasses(this, names);

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _removeClasses(this, names);

                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .expose(),

        toggleClass: overload()
            .args(o.any(String, Array))
            .use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                names = _split(names);
                if (!names.length) { return this; }

                _toggleClasses(this, names);

                return this;
            })

            .args(o.any(String, Array), o.wild)
            .use(function(names, shouldAdd) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                names = _split(names);
                if (!names.length) { return this; }

                if (shouldAdd) {
                    _addClasses(this, names);
                } else {
                    _removeClasses(this, names);
                }

                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .expose()
    }
};

},{"../string":53,"../supports":54,"./classes/classes-legacy":30,"./classes/classes-modern":31,"node-type":3,"overload-js":4,"underscore":5}],30:[function(require,module,exports){
var _      = require('underscore'),
    _cache = require('cache'),
    _split = require('../../string').split,

    _getCache    = _cache(),
    _hasCache    = _cache(2),
    _addCache    = _cache(2),
    _removeCache = _cache(2),
    _toggleCache = _cache(2);

var _hasClass = function(elem, name) {
        var elemClassNames = _split(elem.className),
            idx = elemClassNames.length;
        while (idx--) {
            if (elemClassNames[idx] === name) { return true; }
        }
        return false;
    },

    _addClasses = function(elem, namesToAdd) {
        var curNames   = _split(elem.className),
            newNames   = [],
            newNameSet = _.object(curNames),
            len = namesToAdd.length,
            idx = 0,
            newName,
            hasName;

        // Loop through the names being added and only add new ones.
        for (; idx < len; idx++) {
            newName = namesToAdd[idx];
            hasName = newNameSet[newName] !== undefined;

            // Element already has this class name
            if (hasName) { continue; }

            newNames.push(newName);
            newNameSet[newName] = newName;
        }

        return curNames.concat(newNames);
    },

    _removeClasses = function(elem, namesToRemove) {
        var curNames         = _split(elem.className),
            resultNames      = [],
            resultNameSet    = {},
            namesToRemoveSet = _.object(namesToRemove),
            len = curNames.length,
            idx = 0,
            curName,
            hasName,
            shouldRemove;

        // Loop through the element's existing class names
        // and only keep ones that aren't being removed.
        for (; idx < len; idx++) {
            curName = curNames[idx];
            hasName = resultNameSet[curName] !== undefined;
            shouldRemove = namesToRemoveSet[curName] !== undefined;

            // Current class name is being removed
            if (shouldRemove) { continue; }

            // Element already has this class name
            if (hasName) { continue; }

            resultNames.push(curName);
            resultNameSet[curName] = curName;
        }

        return resultNames;
    },

    _toggleClasses = function(elem, namesToToggle) {
        var curNames   = _split(elem.className),
            newNames   = curNames.slice(),
            newNameSet = _.object(curNames),
            len = namesToToggle.length,
            idx = 0,
            nameToToggle,
            hasName;

        // Loop through the element's existing class names
        // and only keep ones that aren't being removed.
        for (; idx < len; idx++) {
            nameToToggle = namesToToggle[idx];
            hasName = newNameSet[nameToToggle] !== undefined;

            // Element already has this class name - remove it
            if (hasName) {
                var newNameIdx = newNames.length;
                while (newNameIdx--) {
                    if (newNames[newNameIdx] === nameToToggle) {
                        newNames[newNameIdx] = null;
                    }
                }
                delete newNameSet[nameToToggle];
            }
            // Element does not have this class name - add it
            else {
                newNames.push(nameToToggle);
                newNameSet[nameToToggle] = nameToToggle;
            }
        }

        var newNamesClean = [];
        idx = newNames.length;
        while (idx--) {
            if (newNames[idx] !== null) {
                newNamesClean.push(newNames[idx]);
            }
        }

        return newNamesClean;
    };

module.exports = {
    hasClass: function(elem, name) {
        return _hasCache.getOrSet(elem.className, name, function() {
            return _hasClass(elem, name);
        });
    },

    addClasses: function(elem, names) {
        this._setClassName(elem, _addCache.getOrSet(elem.className, names.join(' '), function() {
            return _addClasses(elem, names);
        }));
    },

    removeClasses: function(elem, names) {
        this._setClassName(elem, _removeCache.getOrSet(elem.className, names.join(' '), function() {
            return _removeClasses(elem, names);
        }));
    },

    toggleClasses: function(elem, names) {
        this._setClassName(elem, _toggleCache.getOrSet(elem.className, names.join(' '), function() {
            return _toggleClasses(elem, names);
        }));
    },

    _setClassName: function(elem, names) {
        // Add all the class names in a single step
        if (names.length) {
            elem.className = names.join(' ');
        } else {
            elem.removeAttribute('class');
        }
    }
};

},{"../../string":53,"cache":2,"underscore":5}],31:[function(require,module,exports){
var _ = require('underscore');

module.exports = {
    hasClass: function(elem, name) {
        return !!elem.classList && elem.classList.contains(name);
    },

    addClasses: function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.add.call(elem.classList, names[idx]);
        }
    },

    removeClasses: function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.remove.call(elem.classList, names[idx]);
        }
    },

    toggleClasses: function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.toggle.call(elem.classList, names[idx]);
        }
    }
};

},{"underscore":5}],32:[function(require,module,exports){
var _            = require('underscore'),
    overload     = require('overload-js'),
    o            = overload.o,
    string       = require('../string'),

    _SUPPORTS    = require('../supports'),
    NODE_TYPE   = require('node-type'),

    _utils       = require('../utils'),
    _cache       = require('cache'),
    _regex       = require('../regex'),

    _cssKeyCache = _cache();

var _swapSettings = {
    measureDisplay: {
        display: 'block',
        position: 'absolute',
        visibility: 'hidden'
    }
};

var _getDocumentDimension = function(elem, name) {
    // Either scroll[Width/Height] or offset[Width/Height] or
    // client[Width/Height], whichever is greatest
    var doc = elem.documentElement;
    return Math.max(
        elem.body['scroll' + name],
        elem.body['offset' + name],

        doc['scroll' + name],
        doc['offset' + name],

        doc['client' + name]
    );
};

var _hide = function(elem) {
        elem.style.display = 'none';
    },
    _show = function(elem) {
        elem.style.display = '';
    },

    _cssSwap = function(elem, options, callback) {
        var old = {};

        // Remember the old values, and insert the new ones
        var name;
        for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
        }

        var ret = callback(elem);

        // Revert the old values
        for (name in options) {
            elem.style[name] = old[name];
        }

        return ret;
    },

    _getComputedStyle = (function() {
        return _SUPPORTS.getComputedStyle ?
            // Avoids an 'Illegal Invocation' error (Chrome)
            // Avoids a 'TypeError: Argument 1 of Window.getComputedStyle does not implement interface Element' error (Firefox)
            function(elem) { return _.isElement(elem) ? window.getComputedStyle(elem) : null; } :
            function(elem) { return elem.currentStyle; };
    }()),

    _width = {
         get: function(elem) {
            if (_.isWindow(elem)) {
                return elem.document.documentElement.clientWidth;
            }

            if (elem.nodeType === NODE_TYPE.DOCUMENT) {
                return _getDocumentDimension(elem, 'Width');
            }

            var width = elem.offsetWidth;
            if (width === 0) {
                var computedStyle = _getComputedStyle(elem);
                if (!computedStyle) {
                    return 0;
                }
                if (_regex.display.isNoneOrTable(computedStyle.display)) {
                    return _cssSwap(elem, _swapSettings.measureDisplay, function() { return _getWidthOrHeight(elem, 'width'); });
                }
            }

            return _getWidthOrHeight(elem, 'width');
        },
        set: function(elem, val) {
            elem.style.width = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
        }
    },

    _height = {
        get: function(elem) {
            if (_.isWindow(elem)) {
                return elem.document.documentElement.clientHeight;
            }

            if (elem.nodeType === NODE_TYPE.DOCUMENT) {
                return _getDocumentDimension(elem, 'Height');
            }

            var height = elem.offsetHeight;
            if (height === 0) {
                var computedStyle = _getComputedStyle(elem);
                if (!computedStyle) {
                    return 0;
                }
                if (_regex.display.isNoneOrTable(computedStyle.display)) {
                    return _cssSwap(elem, _swapSettings.measureDisplay, function() { return _getWidthOrHeight(elem, 'height'); });
                }
            }

            return _getWidthOrHeight(elem, 'height');
        },

        set: function(elem, val) {
            elem.style.height = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
        }
    };

var _getWidthOrHeight = function(elem, name) {

    // Start with offset property, which is equivalent to the border-box value
    var valueIsBorderBox = true,
        val = (name === 'width') ? elem.offsetWidth : elem.offsetHeight,
        styles = _getComputedStyle(elem),
        isBorderBox = styles.boxSizing === 'border-box';

    // some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if (val <= 0 || !_.exists(val)) {
        // Fall back to computed then uncomputed css if necessary
        val = _curCss(elem, name, styles);
        if (val < 0 || !val) { val = elem.style[name]; }

        // Computed unit is not pixels. Stop here and return.
        if (_regex.numNotPx(val)) { return val; }

        // we need the check for style in case a browser which returns unreliable values
        // for getComputedStyle silently falls back to the reliable elem.style
        valueIsBorderBox = isBorderBox && val === styles[name];

        // Normalize '', auto, and prepare for extra
        val = parseFloat(val) || 0;
    }

    // use the active box-sizing model to add/subtract irrelevant styles
    return _.toPx(
        val + _augmentBorderBoxWidthOrHeight(
            elem,
            name,
            isBorderBox ? 'border' : 'content',
            valueIsBorderBox,
            styles
        )
    );
};

var _CSS_EXPAND = _.splt('Top|Right|Bottom|Left');
var _augmentBorderBoxWidthOrHeight = function(elem, name, extra, isBorderBox, styles) {
    var val = 0,
        // If we already have the right measurement, avoid augmentation
        idx = (extra === (isBorderBox ? 'border' : 'content')) ?
            4 :
            // Otherwise initialize for horizontal or vertical properties
            (name === 'width') ?
            1 :
            0,
        type,
        // Pulled out of the loop to reduce string comparisons
        extraIsMargin  = (extra === 'margin'),
        extraIsContent = (!extraIsMargin && extra === 'content'),
        extraIsPadding = (!extraIsMargin && !extraIsContent && extra === 'padding');

    for (; idx < 4; idx += 2) {
        type = _CSS_EXPAND[idx];

        // both box models exclude margin, so add it if we want it
        if (extraIsMargin) {
            val += _.parseInt(styles[extra + type]) || 0;
        }

        if (isBorderBox) {

            // border-box includes padding, so remove it if we want content
            if (extraIsContent) {
                val -= _.parseInt(styles['padding' + type]) || 0;
            }

            // at this point, extra isn't border nor margin, so remove border
            if (!extraIsMargin) {
                val -= _.parseInt(styles['border' + type + 'Width']) || 0;
            }

        } else {

            // at this point, extra isn't content, so add padding
            val += _.parseInt(styles['padding' + type]) || 0;

            // at this point, extra isn't content nor padding, so add border
            if (extraIsPadding) {
                val += _.parseInt(styles['border' + type]) || 0;
            }
        }
    }

    return val;
};

var _getPropertyValue = (function() {
    return _SUPPORTS.getPropertyValue ? function(styles, name) { return styles.getPropertyValue(name); } :
           _SUPPORTS.getAttribute     ? function(styles, name) { return styles.getAttribute(name); } :
                                        function(styles, name) { return styles[name]; };
}());

var _curCss = function(elem, name, computed) {
    var style = elem.style,
        styles = computed || _getComputedStyle(elem),
        ret = styles ? _getPropertyValue(styles, name) || styles[name] : undefined;

    // Avoid setting ret to empty string here
    // so we don't default to auto
    if (!_.exists(ret) && style && style[name]) { ret = style[name]; }

    // From the hack by Dean Edwards
    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    if (styles) {
        if (ret === '' && !_utils.isAttached(elem)) {
            ret = elem.style[name];
        }

        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        // but not position css attributes, as those are proportional to the parent element instead
        // and we can't measure the parent instead because it might trigger a 'stacking dolls' problem
        if (_regex.numNotPx(ret) && !_regex.position(name)) {

            // Remember the original values
            var left = style.left,
                rs = elem.runtimeStyle,
                rsLeft = rs && rs.left;

            // Put in the new values to get a computed value out
            if (rsLeft) { rs.left = elem.currentStyle.left; }

            style.left = (name === 'fontSize') ? '1em' : ret;
            ret = _.toPx(style.pixelLeft);

            // Revert the changed values
            style.left = left;
            if (rsLeft) { rs.left = rsLeft; }
        }
    }

    return ret === undefined ? ret : ret + '' || 'auto';
};

var _hooks = {
    opacity: _SUPPORTS.opacity ? {} : {
        get: function(elem) {
            // IE uses filters for opacity
            var style = _SUPPORTS.currentStyle ? elem.currentStyle.filter : elem.style.filter;
            return _regex.opacity.test(style || '') ?
                        (0.01 * parseFloat(RegExp.$1)) + '' :
                            '1';
        },

        set: function(elem, value) {
            var style = elem.style,
                currentStyle = elem.currentStyle,
                filter = currentStyle && currentStyle.filter || style.filter || '';

            // if setting opacity to 1, and no other filters exist - remove the filter attribute
            if (value >= 1 || value === '' && string.trim(filter.replace(_regex.alpha, '')) === '') {

                // Setting style.filter to null, '' & ' ' still leave 'filter:' in the cssText
                // if 'filter:' is present at all, clearType is disabled, we want to avoid this
                // style.removeAttribute is IE Only, but so apparently is this code path...
                style.removeAttribute('filter');

                // if there is no filter style applied in a css rule or unset inline opacity, we are done
                if (value === '' || _SUPPORTS.currentStyle && !currentStyle.filter) { return; }
            }

            // IE has trouble with opacity if it does not have layout
            // Force it by setting the zoom level.. but only if we're
            // applying a value (below)
            style.zoom = 1;

            // Only calculate the opacity if we're setting a value (below)
            var opacity = (_.isNumber(value) ? 'alpha(opacity=' + (value * 100) + ')' : '');

            style.filter = _regex.alpha.test(filter) ?
                // replace 'alpha(opacity)' in the filter definition
                filter.replace(_regex.alpha, opacity) :
                // append 'alpha(opacity)' to the current filter definition
                filter + ' ' + opacity;
        }
    }
};

var _normalizeCssKey = function(name) {
    return _cssKeyCache.get(name) || _cssKeyCache.set(name, _regex.camelCase(name));
};

var _setStyle = function(elem, name, value) {
    name = _normalizeCssKey(name);

    if (_hooks[name] && _hooks[name].set) {
        return _hooks[name].set(elem, value);
    }

    elem.style[name] = (value === +value) ? _.toPx(value) : value;
};

var _getStyle = function(elem, name) {
    name = _normalizeCssKey(name);

    if (_hooks[name] && _hooks[name].get) {
        return _hooks[name].get(elem);
    }

    return _getComputedStyle(elem)[name];
};

var _isHidden = function(elem) {
            // Standard:
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetParent
    return elem.offsetParent === null ||
            // Support: Opera <= 12.12
            // Opera reports offsetWidths and offsetHeights less than zero on some elements
            elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
            // Fallback
            ((elem.style && elem.style.display) ? elem.style.display === 'none' : false);
};

module.exports = {
    swap             : _cssSwap,
    swapSetting      : _swapSettings,
    getComputedStyle : _getComputedStyle,
    curCss           : _curCss,

    width            : _width,
    height           : _height,

    fn: {
        css: overload()
            .args(String, o.any(String, Number))
            .use(function(name, value) {
                var idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    _setStyle(this[idx], name, value);
                }
                return this;
            })

            .args(Object)
            .use(function(obj) {
                var idx = 0, length = this.length,
                    key;
                for (; idx < length; idx++) {
                    for (key in obj) {
                        _setStyle(this[idx], key, obj[key]);
                    }
                }
                return this;
            })

            .args(Array)
            .use(function(arr) {
                var first = this[0];
                if (!first) { return; }

                var ret = {},
                    idx = arr.length,
                    value;
                if (!idx) { return ret; } // return early

                while (idx--) {
                    value = arr[idx];
                    if (!_.isString(value)) { return; }
                    ret[value] = _getStyle(first);
                }

                return ret;
            })
            .expose(),

        hide: function() {
            return _.each(this, function(elem) {
                _hide(elem);
            });
        },
        show: function() {
            return _.each(this, function(elem) {
                _show(elem);
            });
        },

        toggle: function(state) {
            if (_.isBoolean(state)) {
                return state ? this.show() : this.hide();
            }

            return _.each(this, function(elem) {
                if (_isHidden(this)) {
                    return _show(this);
                }

                _hide(this);
            });
        }
    }
};

},{"../regex":52,"../string":53,"../supports":54,"../utils":55,"cache":2,"node-type":3,"overload-js":4,"underscore":5}],33:[function(require,module,exports){
var _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,
    cache      = require('cache')(2),

    _ACCESSOR  = '__D_id__ ',

    _id = _.now(),
    _uniqueId = function() {
        return _id++;
    },

    _getId = function(elem) {
        return elem ? elem[_ACCESSOR] : null;
    },

    _getOrSetId = function(elem) {
        var id;
        if (!elem || (id = elem[_ACCESSOR])) { return id; }
        elem[_ACCESSOR] = (id = _uniqueId());
        return id;
    },

    _getAllData = function(elem) {
        var id;
        if (!(id = _getId(elem))) { return; }
        return cache.get(id);
    },

    _getData = function(elem, key) {
        var id;
        if (!(id = _getId(elem))) { return; }
        return cache.get(id, key);
    },

    _hasData = function(elem) {
        var id;
        if (!(id = _getId(elem))) { return false; }
        return cache.has(id);
    },

    _setData = function(elem, key, value) {
        var id = _getOrSetId(elem);
        return cache.set(id, key, value);
    },

    _removeAllData = function(elem) {
        var id;
        if (!(id = _getId(elem))) { return; }
        cache.remove(id);
    },

    _removeData = function(elem, key) {
        var id;
        if (!(id = _getId(elem))) { return; }
        cache.remove(id, key);
    };

module.exports = {
    has: _hasData,
    set: _setData,
    get: function(elem, str) {
        if (str === undefined) {
            return _getAllData(elem);
        }
        return _getData(elem, str);
    },
    remove: function(elem, str) {
        if (str === undefined) {
            return _removeAllData(elem);
        }
        return _removeData(elem, str);
    },

    D: {
        data: overload()
            // NOTE: NodeList || HtmlCollection support?
            .args(o.element, String, o.wild)
            .use(_setData)

            .args(o.element, String)
            .use(_getData)

            .args(o.element, Object)
            .use(function(elem, map) {
                var id;
                if (!(id = _getId(elem))) { return; }
                var key;
                for (key in map) {
                    cache.set(id, key, map[key]);
                }
                return map;
            })

            .args(o.element)
            .use(_getAllData)

            .expose(),

        hasData: overload()
            .args(o.element)
            .use(_hasData)
            .expose(),

        removeData: overload()
            // NOTE: NodeList || HtmlCollection support?
            // Remove single key
            .args(o.element, String)
            .use(_removeData)

            // Remove multiple keys
            .args(o.element, Array)
            .use(function(elem, array) {
                var id;
                if (!(id = _getId(elem))) { return; }
                var idx = array.length;
                while (idx--) {
                    cache.remove(id, array[idx]);
                }
            })

            // Remove all data
            .args(o.element)
            .use(_removeAllData)

            .expose()
    },

    fn: {
        data: overload()
            // Set key's value
            .args(String, o.wild)
            .use(function(key, value) {
                var idx = this.length,
                    id,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!_.isElement(elem)) { continue; }

                    id = _getOrSetId(this[idx]);
                    cache.set(id, key, value);
                }
                return this;
            })

            // Set values from hash map
            .args(Object)
            .use(function(map) {
                var idx = this.length,
                    id,
                    key,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!_.isElement(elem)) { continue; }

                    id = _getOrSetId(this[idx]);
                    for (key in map) {
                        cache.set(id, key, map[key]);
                    }
                }
                return map;
            })

            // Get key
            .args(String)
            .use(function(key) {
                var first = this[0],
                    id;
                if (!first || !(id = _getId(first))) { return; }
                return cache.get(id, key);
            })

            // Get all data
            .args()
            .use(function() {
                var first = this[0],
                    id;
                if (!first || !(id = _getId(first))) { return; }
                return cache.get(id);
            })

            .expose(),

        removeData: overload()
            // NOTE: NodeList || HtmlCollection support?
            // Remove single key
            .args(String)
            .use(function(key) {
                var idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = _getId(elem))) { continue; }
                    cache.remove(id, key);
                }
                return this;
            })

            // Remove multiple keys
            .args(Array)
            .use(function(array) {
                var elemIdx = this.length,
                    elem,
                    id;
                while (elemIdx--) {
                    elem = this[elemIdx];
                    if (!(id = _getId(elem))) { continue; }
                    var arrIdx = array.length;
                    while (arrIdx--) {
                        cache.remove(id, array[arrIdx]);
                    }
                }
                return this;
            })

            // Remove all data
            .args()
            .use(function() {
                var idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = _getId(elem))) { continue; }
                    cache.remove(id);
                }
                return this;
            })

            .expose()
    }
};

},{"cache":2,"overload-js":4,"underscore":5}],34:[function(require,module,exports){
var _        = require('underscore'),
    overload = require('overload-js'),
    o        = overload.o,

    _css     = require('./css');

var _getInnerWidth = function(elem) {
        var width = parseFloat(_css.width.get(elem)) || 0;

        return width +
            (_.parseInt(_css.curCss(elem, 'paddingLeft')) || 0) +
                (_.parseInt(_css.curCss(elem, 'paddingRight')) || 0);
    },
    _getInnerHeight = function(elem) {
        var height = parseFloat(_css.height.get(elem)) || 0;

        return height +
            (_.parseInt(_css.curCss(elem, 'paddingTop')) || 0) +
                (_.parseInt(_css.curCss(elem, 'paddingBottom')) || 0);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem);

        if (withMargin) {
            width += (_.parseInt(_css.curCss(elem, 'marginLeft')) || 0) +
                (_.parseInt(_css.curCss(elem, 'marginRight')) || 0);
        }

        return width +
            (_.parseInt(_css.curCss(elem, 'borderLeftWidth')) || 0) +
                (_.parseInt(_css.curCss(elem, 'borderRightWidth')) || 0);
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem);

        if (withMargin) {
            height += (_.parseInt(_css.curCss(elem, 'marginTop')) || 0) +
                (_.parseInt(_css.curCss(elem, 'marginBottom')) || 0);
        }

        return height +
            (_.parseInt(_css.curCss(elem, 'borderTopWidth')) || 0) +
                (_.parseInt(_css.curCss(elem, 'borderBottomWidth')) || 0);
    };

module.exports = {
    fn: {
        width: overload()
            .args(Number)
            .use(function(val) {
                var first = this[0];
                if (!first) { return this; }

                _css.width.set(first, val);
                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .fallback(function() {
                var first = this[0];
                if (!first) { return null; }

                return parseFloat(_css.width.get(first) || 0);
            })
            .expose(),

        height: overload()
            .args(Number)
            .use(function(val) {
                var first = this[0];
                if (!first) { return this; }

                _css.height.set(first, val);
                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .fallback(function() {
                var first = this[0];
                if (!first) { return null; }

                return parseFloat(_css.height.get(first) || 0);
            })
            .expose(),

        innerWidth: overload()
            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .fallback(function() {
                var first = this[0];
                if (!first) { return this; }

                return _getInnerWidth(first);
            })
            .expose(),

        innerHeight: overload()
            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .fallback(function() {
                var first = this[0];
                if (!first) { return this; }

                return _getInnerHeight(first);
            })
            .expose(),

        outerWidth: overload()
            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .fallback(function(withMargin) {
                var first = this[0];
                if (!first) { return this; }

                return _getOuterWidth(first, withMargin);
            })
            .expose(),

        outerHeight: overload()
            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .fallback(function(withMargin) {
                var first = this[0];
                if (!first) { return this; }

                return _getOuterHeight(first, withMargin);
            })
            .expose()
    }
};

},{"./css":32,"overload-js":4,"underscore":5}],35:[function(require,module,exports){
var _           = require('underscore'),

    _utils      = require('../../utils'),
    _eventUtils = require('./eventUtils');

var Event = module.exports = function(src, props) {
    if (!(this instanceof Event)) { return new Event(src, props); }

    // Event object
    if (src && src.type) {
        this.originalEvent = src;
        this.type = src.type;

        // Events bubbling up the document may have been marked as prevented
        // by a handler lower down the tree; reflect the correct value.
        this.isDefaultPrevented = src.defaultPrevented ||
            // Support: IE < 9
            (src.defaultPrevented === undefined && src.returnValue === false) ?
                _utils.returnTrue :
                    _utils.returnFalse;

    // Event type
    } else {
        this.type = src;
    }

    // Put explicitly provided properties onto the event object
    _.extend(this, props);

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = src && src.timeStamp || _.now();

    // Mark it as fixed
    this[_eventUtils.id] = true;
};

// Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
Event.prototype = {
    isDefaultPrevented:            _utils.returnFalse,
    isPropagationStopped:          _utils.returnFalse,
    isImmediatePropagationStopped: _utils.returnFalse,

    preventDefault: function() {
        var e = this.originalEvent;

        this.isDefaultPrevented = _utils.returnTrue;
        if (!e) { return; }

        // If preventDefault exists, run it on the original event
        if (e.preventDefault) {

            e.preventDefault();

        } else {
            // Support: IE
            // Otherwise set the returnValue property of the original event to false
            e.returnValue = false;
        }
    },
    stopPropagation: function() {
        var e = this.originalEvent;

        this.isPropagationStopped = _utils.returnTrue;
        if (!e) { return; }

        // If stopPropagation exists, run it on the original event
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Support: IE
        // Set the cancelBubble property of the original event to true
        e.cancelBubble = true;
    },
    stopImmediatePropagation: function() {
        this.isImmediatePropagationStopped = _utils.returnTrue;
        this.stopPropagation();
    }
};
},{"../../utils":55,"./eventUtils":39,"underscore":5}],36:[function(require,module,exports){
var _         = require('underscore'),
    overload  = require('overload-js'),
    o         = overload.o,

    _utils    = require('../../utils'),
    _event    = require('./event'),
    _specials = require('./eventSpecials');

module.exports = {
    fn: {

        on: function(types, selector, data, fn, /*INTERNAL*/ one) {
            // Types can be a map of types/handlers
            if (_.isObject(types)) {

                // ( types-Object, selector, data )
                if (!_.isString(selector)) {
                    // ( types-Object, data )
                    data = data || selector;
                    selector = undefined;
                }

                var type;
                for (type in types) {
                    this.on(type, selector, data, types[type], one);
                }

                return this;
            }

            if (!_.exists(data) && !_.exists(fn)) {

                // ( types, fn )
                fn = selector;
                data = selector = undefined;

            } else if (!_.exists(fn)) {

                if (_.isString(selector)) {

                    // ( types, selector, fn )
                    fn = data;
                    data = undefined;

                } else {

                    // ( types, data, fn )
                    fn = data;
                    data = selector;
                    selector = undefined;

                }
            }

            if (fn === false) {

                fn = _utils.returnFalse;

            } else if (!fn) {

                return this;

            }

            // TODO: Make this self removing by adding a unique namespace and then unbinding that namespace
            var origFn;
            if (one === 1) {
                origFn = fn;
                fn = function(event) {
                    // Can use an empty set, since event contains the info
                    // TODO: Address this
                    jQuery().off(event);
                    return origFn.apply( this, arguments );
                };
            }

            return _.each(this, function(elem) {
                _event.add(elem, types, fn, data, selector);
            });
        },


        once: overload()
            .args(Object)
            .use(function(events) {
                var self = this;
                _.each(events, function(fn, evt) {
                    self.once(evt, fn);
                });
                return this;
            })

            .args(Object, String)
            .use(function(events, selector) {
                var self = this;
                _.each(events, function(fn, evt) {
                    self.once(evt, selector, fn);
                });
                return this;
            })

            .args(String, Function)
            .use(function(evt, fn) {

                return this.on(types, selector, data, fn, 1);

            })

            .args(String, String, Function)
            .use(function(evt, selector, fn) {

                return this.on(types, selector, data, fn, 1);

            })

            .expose(),

        //  TODO: Don't use the stupid 1 on the end
        one: function(types, selector, data, fn) {
            return this.once.apply(this, arguments);
        },

        off: overload()

            // In leu of { string: function }, since we
            // dont allow functions in the off, allow an array
            // of strings instead...
            .args(Array)
            .use(function(arr) {
                return _.each(this, function(elem) {
                    _.each(arr, function(evt) {
                        _event.remove(elem, evt);
                    });
                });
            })

            // ...and, of course, allow a selector
            .args(Array, String)
            .use(function(arr, selector) {
                return _.each(this, function(elem) {
                    _.each(arr, function(evt) {
                        _event.remove(elem, evt, selector);
                    });
                });
            })

            .args(String)
            .use(function(evt) {
                return _.each(this, function(elem) {
                    _event.remove(elem, evt);
                });
            })

            .args(String, String)
            .use(function(evt, selector) {
                return _.each(this, function(elem) {
                    _event.remove(elem, evt, selector);
                });
            })

            .fallback(_utils.returnThis)

            .expose(),

        trigger: function(type, data) {
            return _.each(this, function(elem) {
                _event.trigger(type, data, elem);
            });
        },

        triggerHandler: function(type, data) {
            var first = this[0];
            if (!first) { return; }

            return _event.trigger(type, data, first, true);
        }
    }
};

},{"../../utils":55,"./event":37,"./eventSpecials":38,"overload-js":4,"underscore":5}],37:[function(require,module,exports){
var _           = require('underscore'),

    Event       = require('./E'),
    _nodeType   = require('node-type'),
    _regex      = require('../../regex'),
    _utils      = require('../../utils'),
    _array      = require('../array'),
    _data       = require('../data'),
    _eventUtils = require('./eventUtils'),

    _global     = {},

    _EVENT_KEY  = '__D_events__',
    _NOOP_OBJ   = {},
    _CLICK = {
        none  : 0,
        left  : 1,
        middle: 2,
        right : 3
    };

var _add = function(elem, eventStr, handler, data, selector) {
    // Don't attach events to text/comment nodes
    var nodeType = elem.nodeType;
    if (nodeType === _nodeType.TEXT ||
        nodeType === _nodeType.COMMENT) { return; }

    var eventData = _data.get(elem, _EVENT_KEY);
    if (!eventData) {
        eventData = {};
        _data.set(elem, _EVENT_KEY, eventData);
    }

    var eventHandle;
    if (!(eventHandle = eventData.handle)) {
        eventHandle = eventData.handle = function(e) {
            // Discard the second event of a D.event.trigger() and
            // when an event is called after a page has unloaded
            return typeof D !== 'undefined' && (!e || D.event.triggered !== e.type) ?
                _dispatch.apply(eventHandle.elem, arguments) :
                undefined;
        };

        // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
        eventHandle.elem = elem;
    }

    // Handle multiple eventStr separated by a space
    var eventStrInstances = _regex.matchNotWhite(eventStr),
        idx = eventStrInstances.length;
    while (idx--) {

        var tmp = _regex.typeNamespace(eventStrInstances[idx]) || [],
            type = tmp[1],
            origType = type;
        // There *must* be a type, no attaching namespace-only handlers
        if (!type) { continue; }

        var namespaces = (tmp[2] || '').split('.').sort(),
            // If event changes its type, use the special event handlers for the changed type
            special = _special[type] || _NOOP_OBJ;

        // If selector defined, determine special event api type, otherwise given type
        type = (selector ? special.delegateType : special.bindType) || type;

        // Update special based on newly reset type
        special = _special[type] || _NOOP_OBJ;

        // handleObj is passed to all event handlers
        var handleObj = {
            type        : type,
            origType    : origType,
            handler     : handler,
            selector    : selector,
            // TODO: If the event system changes to not needing this, remember to remove it here and in _regex
            needsContext: selector && _regex.needsContext(selector),
            namespace   : namespaces.join('.')
        };

        var handlers;
        // Init the event handler queue if we're the first
        if (!(handlers = eventData[type])) {
            handlers = eventData[type] = [];
            handlers.delegateCount = 0;

            // Only use add the event if the special events handler returns false
            // TODO: in special.setup.call, the null used to be data. check if any specials are using the data
            if (!special.setup || special.setup.call(elem, null, namespaces, eventHandle) === false) {
                // Bind the global event handler to the element
                _eventUtils.addEvent(elem, type, eventHandle);
            }
        }

        if (special.add) {
            special.add.call(elem, handleObj);
        }

        // Add to the element's handler list, delegates in front
        if (selector) {
            handlers.splice(handlers.delegateCount++, 0, handleObj);
        } else {
            handlers.push(handleObj);
        }

        // Keep track of which events have ever been used, for event optimization
        _global[type] = true;
    }

    // Nullify elem to prevent memory leaks in IE
    elem = null;
};

// Detach an event or set of events from an element
var _remove = function(elem, types, selector, mappedTypes) {
    var elemData = _data.has(elem) && _data.get(elem),
        events;
    if (!elemData || !(events = elemData[_EVENT_KEY])) { return; }

    // Once for each type.namespace in types; type may be omitted
    types = _regex.matchNotWhite(types) || [''];

    var idx = types.length;
    while (idx--) {
        var tmp = _regex.typeNamespace(types[idx]) || [],
            type = tmp[1],
            origType = type,
            namespaces = (tmp[2] || '').split('.').sort();

        // Unbind all events (on this namespace, if provided) for the element
        if (!type) {
            for (type in events) {
                _remove(elem, type + types[idx], selector, true);
            }
            continue;
        }

        var special = _special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;

        var handlers = events[type] || [];
        tmp = tmp[2] && new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)');

        // Remove matching events
        var origCount, i, handleObj;
        origCount = i = handlers.length;
        while (i--) {
            handleObj = handlers[i];

            if (
                (mappedTypes || origType === handleObj.origType) &&
                (!tmp        || tmp.test(handleObj.namespace))  &&
                (!selector   || selector === handleObj.selector  || selector === '**' && handleObj.selector)
            ) {
                handlers.splice(i, 1);

                if (handleObj.selector) {
                    handlers.delegateCount--;
                }
                if (special.remove) {
                    special.remove.call(elem, handleObj);
                }
            }
        }

        // Remove generic event handler if we removed something and no more handlers exist
        // (avoids potential for endless recursion during removal of special event handlers)
        if (origCount && !handlers.length) {
            if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                jQuery.removeEvent(elem, type, elemData.handle);
            }

            delete events[type];
        }
    }

    // Remove the events if it's no longer used
    if (!_.hasSize(events)) {
        delete elemData.handle;

        // removeData also checks for emptiness and clears the events if empty
        // so use it instead of delete
        _data.remove(elem, _EVENT_KEY);
    }
};

var _trigger = function(event, data, elem, onlyHandlers) {
    var eventPath = [elem || document],
        type = event.type || event,
        namespaces = event.namespace ? event.namespace.split('.') : [];

    var cur, tmp;
    cur = tmp = elem = elem || document;

    // Don't do events on text and comment nodes
    if (elem.nodeType === _nodeType.TEXT || elem.nodeType === _nodeType.COMMENT) {
        return;
    }

    // focus/blur morphs to focusin/out; ensure we're not firing them right now
    if (_regex.focusMorph(type + D.event.triggered)) {
        return;
    }

    if (type.indexOf('.') >= 0) {
        // Namespaced trigger; create a regexp to match event type in handle()
        namespaces = type.split('.');
        type = namespaces.shift();
        namespaces.sort();
    }
    var ontype = type.indexOf(':') < 0 && 'on' + type;

    // Caller can pass in a Event object, Object, or just an event type string
    event = event[_eventUtils.id] ?
        event :
        new Event(type, event && _.isObject(event));

    // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
    event.isTrigger = onlyHandlers ? 2 : 3;
    event.namespace = namespaces.join('.');
    event.namespaceRegex = event.namespace ?
        new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)') :
        null;

    // Clean up the event in case it is being reused
    event.result = undefined;
    event.target = event.target || elem;

    // Clone any incoming data and prepend the event, creating the handler arg list
    data = !_.exists(data) ? [event] : [event, data];

    // Allow special events to draw outside the lines
    var special = _special[type] || {};
    if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
        return;
    }

    // Determine event propagation path in advance, per W3C events spec (#9951)
    // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
    var bubbleType;
    if (!onlyHandlers && !special.noBubble && !_.isWindow(elem)) {

        bubbleType = special.delegateType || type;
        if (!_regex.focusMorph(bubbleType + type)) {
            cur = cur.parentNode;
        }
        for (; cur; cur = cur.parentNode) {
            eventPath.push(cur);
            tmp = cur;
        }

        // Only add window if we got to document (e.g., not detached DOM)
        if (tmp === (elem.ownerDocument || document)) {
            eventPath.push(tmp.defaultView || tmp.parentWindow || window);
        }
    }

    // Fire handlers on the event path
    var idx = 0, handle;
    while ((cur = eventPath[idx++]) && !event.isPropagationStopped()) {

        event.type = idx > 1 ?
            bubbleType :
            special.bindType || type;

        // jQuery handler
        var eventData = _data.get(cur, _EVENT_KEY) || {};
        handle = eventData[event.type] && eventData.handle;

        if (handle) {
            handle.apply(cur, data);
        }

        // Native handler
        handle = ontype && cur[ontype];
        // NOTE: Pulled out jQuery.acceptData(cur) as we don't allow non-element types
        if (handle && handle.apply) {
            event.result = handle.apply(cur, data);
            if (event.result === false) {
                event.preventDefault();
            }
        }
    }
    event.type = type;

    // If nobody prevented the default action, do it now
    if (!onlyHandlers && !event.isDefaultPrevented()) {

        // NOTE: Pulled out jQuery.acceptData(elem) as we don't allow non-element types
        if (!special._default || special._default.apply(eventPath.pop(), data) === false) {

            // Call a native DOM method on the target with the same name name as the event.
            // Can't use an .isFunction() check here because IE6/7 fails that test.
            // Don't do default actions on window, that's where global variables be (#6170)
            if (ontype && elem[type] && !_.isWindow(elem)) {

                // Don't re-trigger an onFOO event when we call its FOO() method
                tmp = elem[ontype];

                if (tmp) {
                    elem[ontype] = null;
                }

                // Prevent re-triggering of the same event, since we already bubbled it above
                D.event.triggered = type;

                try {
                    elem[type]();
                } catch (e) {
                    // IE < 9 dies on focus/blur to hidden element (#1486, #12518)
                    // only reproducible on winXP IE8 native, not IE9 in IE8 mode
                }

                D.event.triggered = undefined;

                if (tmp) {
                    elem[ontype] = tmp;
                }
            }
        }
    }

    return event.result;
};

var _dispatch = function(event) {

    // Make a writable Event from the native event object
    event = _fix(event);

    var args = _array.slice(arguments),
        handlers = (_data.get(this, _EVENT_KEY) || {})[event.type] || [],
        special = _special[event.type] || {};

    // Use the fix-ed Event rather than the (read-only) native event
    args[0] = event;
    event.delegateTarget = this;

    // Call the preDispatch hook for the mapped type, and let it bail if desired
    if (special.preDispatch && special.preDispatch.call(this, event) === false) {
        return;
    }

    // Determine handlers
    var handlerQueue = _handlers.call(this, event, handlers),
        // Run delegates first; they may want to stop propagation beneath us
        idx = 0,
        matched;
    while ((matched = handlerQueue[idx++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;

        var i = 0,
            handleObj;
        while ((handleObj = matched.handlers[i++]) && !event.isImmediatePropagationStopped()) {

            // Triggered event must either 1) have no namespace, or
            // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
            if (!event.namespaceRegex || event.namespaceRegex.test(handleObj.namespace)) {

                event.handleObj = handleObj;

                var ret = ((_special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);

                if (ret !== undefined) {
                    if ((event.result = ret) === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        }
    }

    // Call the postDispatch hook for the mapped type
    if (special.postDispatch) {
        special.postDispatch.call(this, event);
    }

    return event.result;
};

var _handlers = function(event, handlers) {
    var handlerQueue = [],
        delegateCount = handlers.delegateCount,
        cur = event.target;

    // Find delegate handlers
    // Black-hole SVG <use> instance trees (#13180)
    // Avoid non-left-click bubbling in Firefox (#3861)
    if (delegateCount && cur.nodeType && (!event.button || event.type !== 'click')) {

        // TODO: Better as a while loop?
        for (; cur != this; cur = cur.parentNode || this) {

            // Don't check non-elements (#13208)
            // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
            if (cur.nodeType === _nodeType.ELEMENT && (cur.disabled !== true || event.type !== 'click') ) {
                var matches = [];

                var idx = 0;
                for (; idx < delegateCount; idx++) {
                    var handleObj = handlers[idx],
                        // Don't conflict with Object.prototype properties (#13203)
                        sel = handleObj.selector + ' ';

                    if (matches[sel] === undefined) {
                        matches[sel] = handleObj.needsContext ?
                            this.find(sel).index(cur) >= 0 :
                            // TODO: What is happening here?
                            jQuery.find(sel, this, null, [cur]).length;
                    }

                    if (matches[sel]) {
                        matches.push(handleObj);
                    }
                }

                if (matches.length) {
                    handlerQueue.push({
                        elem: cur,
                        handlers: matches
                    });
                }
            }
        }
    }

    // Add the remaining (directly-bound) handlers
    if (delegateCount < handlers.length) {
        handlerQueue.push({
            elem: this,
            handlers: handlers.slice(delegateCount)
        });
    }

    return handlerQueue;
};

var _fix = function(event) {
    if (event[_eventUtils.id]) {
        return event;
    }

    // Create a writable copy of the event object and normalize some properties
    var type = event.type,
        originalEvent = event,
        fixHook = _fixHooks[type];

    if (!fixHook) {
        _fixHooks[type] = fixHook =
            _regex.mouseEvent(type) ? _mouseHooks :
            _regex.keyEvent(type) ? _keyHooks :
            {};
    }

    var copy = fixHook.props ? _props.concat(fixHook.props) : _props;

    event = new Event(originalEvent);

    var idx = copy.length,
        prop;
    while (idx--) {
        prop = copy[idx];
        event[prop] = originalEvent[prop];
    }

    // Support: IE < 9
    // Fix target property (#1925)
    if (!event.target) {
        event.target = originalEvent.srcElement || document;
    }

    // Support: Chrome 23+, Safari?
    // Target should not be a text node (#504, #13143)
    if (event.target.nodeType === _nodeType.TEXT) {
        event.target = event.target.parentNode;
    }

    // Support: IE < 9
    // For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
    event.metaKey = !!event.metaKey;

    return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
};

// Includes some event props shared by KeyEvent and MouseEvent
var _props = _.splt('altKey|bubbles|cancelable|ctrlKey|currentTarget|eventPhase|metaKey|relatedTarget|shiftKey|target|timeStamp|view|which');

var _fixHooks = {};

var _keyHooks = {
    props: _.splt('char|charCode|key|keyCode'),
    filter: function(event, original) {

        // Add which for key events
        if (!_.exists(event.which)) {
            event.which = _.exists(original.charCode) ? original.charCode : original.keyCode;
        }

        return event;
    }
};

var _mouseHooks = {
    props: _.splt('button|buttons|clientX|clientY|fromElement|offsetX|offsetY|pageX|pageY|screenX|screenY|toElement'),
    filter: function(event, original) {
        var body, eventDoc, doc,
            button = original.button,
            fromElement = original.fromElement;

        // Calculate pageX/Y if missing and clientX/Y available
        if (!_.exists(event.pageX) && !_.exists(original.clientX)) {
            eventDoc = event.target.ownerDocument || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = original.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - (doc && doc.clientTop  || body && body.clientTop  || 0);
        }

        // Add relatedTarget, if necessary
        if (!event.relatedTarget && fromElement) {
            event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
        }

        // Add which for click: 1 === left; 2 === middle; 3 === right
        // Note: button is not normalized, so don't use it
        if (!event.which && button !== undefined) {
            event.which = (button & 1 ? _CLICK.left : (button & 2 ? _CLICK.right : (button & 4 ? _CLICK.middle : _CLICK.none)));
        }

        return event;
    }
};

var _special = {
    load: {
        // Prevent triggered image.load events from bubbling to window.load
        noBubble: true
    },
    focus: {
        delegateType: 'focusin',
        // Fire native event if possible so blur/focus sequence is correct
        trigger: function() {
            if (this !== _eventUtils.activeElement() && this.focus) {
                try {
                    this.focus();
                    return false;
                } catch (e) {
                    // Support: IE < 9
                    // If we error on focus to hidden element (#1486, #12518),
                    // let .trigger() run the handlers
                }
            }
        }
    },
    blur: {
        delegateType: 'focusout',
        trigger: function() {
            if (this === _eventUtils.activeElement() && this.blur) {
                this.blur();
                return false;
            }
        }
    },
    click: {
        // For checkbox, fire native event so checked state will be right
        trigger: function() {
            if (_utils.isNodeName(this, 'input') && this.type === 'checkbox' && this.click) {
                this.click();
                return false;
            }
        },

        // For cross-browser consistency, don't fire native .click() on links
        _default: function(event) {
            return _utils.isNodeName(event.target, 'a');
        }
    },

    beforeunload: {
        postDispatch: function(event) {

            // Even when returnValue equals to undefined Firefox will still show alert
            if (event.result !== undefined) {
                event.originalEvent.returnValue = event.result;
            }
        }
    }
};

var _simulate = function(type, elem, event, bubble) {
    // Piggyback on a donor event to simulate a different one.
    // Fake originalEvent to avoid donor's stopPropagation, but if the
    // simulated event prevents default then we do the same on the donor.
    var e = _.extend(
        new Event(),
        event,
        {
            type: type,
            isSimulated: true,
            originalEvent: {}
        }
    );

    if (bubble) {
        _trigger(e, null, elem);
    } else {
        _dispatch.call(elem, e);
    }

    if (e.isDefaultPrevented()) {
        event.preventDefault();
    }
};


module.exports = {
    add       : _add,
    remove    : _remove,
    trigger   : _trigger,
    simulate  : _simulate,
    fix       : _fix,

    D: {
        event: {
            // triggered, a state holder for events
            global    : _global,
            add       : _add,
            remove    : _remove,
            trigger   : _trigger,
            dispatch  : _dispatch,
            handlers  : _handlers,
            fix       : _fix,
            props     : _props,
            fixHooks  : _fixHooks,
            keyHooks  : _keyHooks,
            mouseHooks: _mouseHooks,
            special   : _special,
            simulate  : _simulate
        }
    }
};
},{"../../regex":52,"../../utils":55,"../array":27,"../data":33,"./E":35,"./eventUtils":39,"node-type":3,"underscore":5}],38:[function(require,module,exports){
var _              = require('underscore'),
    _supports      = require('../../supports'),
    _data          = require('../data'),
    _event         = require('./event');

// TODO: Remove.  This is needed to prevent IE8 from failing catastrophically.
// return;

if (!_supports.submitBubbles) {
    // IE change delegation and checkbox/radio fix
    _event.special.change = {

        setup: function() {

            if (rformElems.test(this.nodeName)) {
                // IE doesn't fire change on a check/radio until blur; trigger it on click
                // after a propertychange. Eat the blur-change in special.change.handle.
                // This still fires onchange a second time for check/radio after blur.
                if (this.type === 'checkbox' || this.type === 'radio') {

                    _event.add(this, 'propertychange._change', function(event) {
                        if (event.originalEvent.propertyName === 'checked') {
                            this._just_changed = true;
                        }
                    });

                    _event.add(this, 'click._change', function(event) {
                        if (this._just_changed && !event.isTrigger) {
                            this._just_changed = false;
                        }

                        // Allow triggered, simulated change events (#11500)
                        _event.simulate('change', this, event, true);
                    });
                }

                return false;
            }

            // Delegated event; lazy-add a change handler on descendant inputs
            _event.add(this, 'beforeactivate._change', function(e) {
                var elem = e.target;

                if (rformElems.test(elem.nodeName) && !_data.get(elem, 'changeBubbles')) {
                    _event.add(elem, 'change._change', function(event) {
                        if (this.parentNode && !event.isSimulated && !event.isTrigger) {
                            _event.simulate('change', this.parentNode, event, true);
                        }
                    });
                    _data.set(elem, 'changeBubbles', true);
                }
            });
        },

        handle: function(event) {
            var elem = event.target;

            // Swallow native change events from checkbox/radio, we already triggered them above
            if (this !== elem || event.isSimulated || event.isTrigger || (elem.type !== 'radio' && elem.type !== 'checkbox')) {
                return event.handleObj.handler.apply( this, arguments );
            }
        },

        teardown: function() {
            _event.remove(this, '._change');

            return !rformElems.test(this.nodeName);
        }
    };
}

if (!_supports.changeBubbles) {
    // Create 'bubbling' focus and blur events
    _.each({
        focus: 'focusin',
        blur: 'focusout'
    }, function(fix, orig) {

        // Attach a single capturing handler on the document while someone wants focusin/focusout
        var handler = function(event) {
            _event.simulate(fix, event.target, _event.fix(event), true);
        };

        _event.special[fix] = {
            setup: function() {
                var doc = this.ownerDocument || this,
                    attaches = _data.get(doc, fix);

                if (!attaches) {
                    doc.addEventListener(orig, handler, true);
                }
                _data.set(doc, fix, (attaches || 0) + 1);
            },

            teardown: function() {
                var doc = this.ownerDocument || this,
                    attaches = _data.get(doc, fix) - 1;

                if (!attaches) {
                    doc.removeEventListener(orig, handler, true);
                    _data.remove(doc, fix);
                } else {
                    _data.set(doc, fix, attaches);
                }
            }
        };
    });
}

},{"../../supports":54,"../data":33,"./event":37,"underscore":5}],39:[function(require,module,exports){
var _    = require('underscore'),
    _div = require('../../div');

module.exports = {
    id: 'd' + (new Date().getTime()),

    activeElement: function() {
        try {
            return document.activeElement;
        } catch (err) {}
    },

    addEvent: _div.addEventListener ?
        function(elem, type, callback) {
            elem.addEventListener(type, callback, false);
        } :
        _div.attachEvent ?
        function(elem, type, callback) {
            elem.attachEvent('on' + type, callback);
        } :
        _.noop,

    removeEvent: document.removeEventListener ?
        function(elem, type, handle) {
            if (!elem.removeEventListener) { return; }
            elem.removeEventListener(type, handle, false);
        } :
        function(elem, type, handle) {
            var name = 'on' + type;

            if (!elem.detachEvent) { return; }

            // #8545, #7054, preventing memory leaks for custom events in IE6-8
            // detachEvent needed property on element, by name of that event, to properly expose it to GC
            if (elem[name] === undefined) {
                elem[name] = null;
            }

            elem.detachEvent(name, handle);
        }
};
},{"../../div":14,"underscore":5}],40:[function(require,module,exports){
var _         = require('underscore'),
    overload  = require('overload-js'),
    o         = overload.o,

    _selector = require('./selectors'),
    _array    = require('./array'),
    _utils    = require('../utils'),
    _order    = require('../order'),

    _data     = require('./data'),

    parser    = require('./parser/parser'),
    utils     = require('../utils');

var _empty = function(arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {

            var elem = arr[idx],
                descendants = elem.querySelectorAll('*'),
                i = descendants.length,
                desc;
            while (i--) {
                desc = descendants[i];
                _data.remove(desc);
            }

            elem.innerHTML = '';
        }
    },

    _remove = function(arr) {
        var idx = 0, length = arr.length,
            elem, parent;
        for (; idx < length; idx++) {
            elem = arr[idx];
            if (elem && (parent = elem.parentNode)) {
                _data.remove(elem);
                parent.removeChild(elem);
            }
        }
    },

    _detach = function(arr) {
        var idx = 0, length = arr.length,
            elem, parent;
        for (; idx < length; idx++) {
            elem = arr[idx];
            if (elem && (parent = elem.parentNode)) {
                parent.removeChild(elem);
            }
        }
    },

    // TODO: IE6-8 copies events bound via attachEvent when using cloneNode.
    //       See jquery.js:5401
    _clone = function(elem) {
        return elem.cloneNode(true);
    },

    _stringToFrag = function(str) {
        var frag = document.createDocumentFragment();
        frag.textContent = str;
        return frag;
    },

    _appendPrependFunc = function(d, fn, pender) {
        _.each(d, function(elem, idx) {
            var result = fn.call(elem, idx, elem.innerHTML);

            if (!_.exists(result)) {

                // do nothing

            } else if (_.isString(result)) {

                if (utils.isHTML(value)) {
                    _appendPrependArrayToElem(elem, parser.parseHtml(value), pender);
                    return this;
                }

                pender(elem, _stringToFrag(result));

            } else if (_.isElement(result)) {

                pender(elem, result);

            } else if (_.isNodeList(result) || result instanceof D) {

                _appendPrependArrayToElem(elem, result, pender);

            } else {
                // do nothing
            }
        });
    },
    _appendPrependMergeArray = function(arrOne, arrTwo, pender) {
        var idx = 0, length = arrOne.length;
        for (; idx < length; idx++) {
            var i = 0, len = arrTwo.length;
            for (; i < len; i++) {
                pender(arrOne[idx], arrTwo[i]);
            }
        }
    },
    _appendPrependElemToArray = function(arr, elem, pender) {
        _.each(arr, function(arrElem) {
            pender(arrElem, elem);
        });
    },
    _appendPrependArrayToElem = function(elem, arr, pender) {
        _.each(arr, function(arrElem) {
            pender(elem, arrElem);
        });
    },

    _append = function(base, elem) {
        if (!base || !elem || !_.isElement(elem)) { return; }
        base.appendChild(elem);
    },
    _prepend = function(base, elem) {
        if (!base || !elem || !_.isElement(elem)) { return; }
        base.insertBefore(elem, base.firstChild);
    };

module.exports = {
    append  : _append,
    prepend : _prepend,

    fn: {
        clone: function() {
            return _.fastmap(this.slice(), function(elem) {
                return _clone(elem);
            });
        },

        append: overload()
            .args(String)
            .use(function(value) {
                if (utils.isHtml(value)) {
                    _appendPrependMergeArray(this, parser.parseHtml(value), _append);
                    return this;
                }

                _appendPrependElemToArray(this, _stringToFrag(value), _append);

                return this;
            })

            .args(Number)
            .use(function(value) {
                _appendPrependElemToArray(this, _stringToFrag('' + value), _append);
                return this;
            })

            .args(Function)
            .use(function(fn) {
                _appendPrependFunc(this, fn, _append);
                return this;
            })

            .args(Element)
            .use(function(elem) {
                _appendPrependElemToArray(this, elem, _append);
                return this;
            })

            .args(o.collection)
            .use(function(arr) {
                _appendPrependMergeArray(this, arr, _append);
                return this;
            })

            .expose(),

        // TODO: These methods
        before: function() { return this; },
        after: function() { return this; },
        insertBefore: function() { return this; },
        insertAfter: function() { return this; },

        appendTo: overload()
            .args(o.D)
            .use(function(d) {
                d.append(this);
                return this;
            })

            .fallback(function(obj) {
                D(obj).append(this);
                return this;
            })

            .expose(),

        prepend: overload()
            .args(String)
            .use(function(value) {
                if (utils.isHtml(value)) {
                    _appendPrependMergeArray(this, parser.parseHtml(value), _prepend);
                    return this;
                }

                _appendPrependElemToArray(this, _stringToFrag(value), _prepend);

                return this;
            })

            .args(Number)
            .use(function(value) {
                _appendPrependElemToArray(this, _stringToFrag('' + value), _prepend);
                return this;
            })

            .args(Function)
            .use(function(fn) {
                _appendPrependFunc(this, fn, _prepend);
                return this;
            })

            .args(Element)
            .use(function(elem) {
                _appendPrependElemToArray(this, elem, _prepend);
                return this;
            })

            .args(o.collection)
            .use(function(arr) {
                _appendPrependMergeArray(this, arr, _prepend);
                return this;
            })

            .expose(),

        prependTo: overload()
            .args(o.D)
            .use(function(d) {
                d.prepend(this);
                return this;
            })

            .fallback(function(obj) {
                D(obj).prepend(this);
                return this;
            })

            .expose(),

        empty: function() {
            _empty(this);
            return this;
        },

        add: overload()
            // String selector
            .args(String)
            .use(function(selector) {
                var elems = _array.unique(
                    [].concat(this.get(), D(selector).get())
                );
                _order.sort(elems);
                return D(elems);
            })

            // Array of elements
            .args(o.collection)
            .use(function(arr) {
                var elems = _array.unique(
                    [].concat(this.get(), _.toArray(arr))
                );
                _order.sort(elems);
                return D(elems);
            })

            // Single element
            .args(o.any(o.window, o.document, Element))
            .use(function(elem) {
                var elems = _array.unique(
                    [].concat(this.get(), [ elem ])
                );
                _order.sort(elems);
                return D(elems);
            })

            // Everything else
            .fallback(function() {
                return D(this);
            })

            .expose(),

        remove: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return; }
                var arr = _selector.filter(this, selector);
                _remove(arr);
                return this;
            })

            .fallback(function() {
                _remove(this);
                return this;
            })

            .expose(),

        detach: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return; }
                var arr = _selector.filter(this, selector);
                _detach(arr);
                return this;
            })

            .fallback(function() {
                _detach(this);
                return this;
            })

            .expose()
    }
};

},{"../order":50,"../utils":55,"./array":27,"./data":33,"./parser/parser":43,"./selectors":46,"overload-js":4,"underscore":5}],41:[function(require,module,exports){
var _isReady = false,
    _registration = [];

var _bind = function(fn) {
    // Already loaded
    if (document.readyState === 'complete') {
        return fn();
    }

    // Standards-based browsers support DOMContentLoaded
    if (document.addEventListener) {
        return document.addEventListener('DOMContentLoaded', fn);
    }

    // If IE event model is used

    // Ensure firing before onload, maybe late but safe also for iframes
    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'interactive') { fn(); }
    });

    // A fallback to window.onload, that will always work
    window.attachEvent('onload', fn);
};

var _makeCalls = function() {
    var idx = 0,
        length = _registration.length;
    for (; idx < length; idx++) {
        _registration[idx]();
    }
    _registration.length = 0;
};

_bind(function() {
    if (_isReady) { return; }

    _isReady = true;
    _makeCalls();
});

module.exports = function(callback) {
    if (_isReady) {
        callback();
        return this;
    }

    _registration.push(callback);
    return this;
};

},{}],42:[function(require,module,exports){
var _supports = require('../../supports');

var hooks = {
    dflt: function(parentTagName, htmlStr) {
        var parent = document.createElement(parentTagName);
        parent.innerHTML = htmlStr;
        return parent;
    }
};

// IE8
if (!_supports.writableTbody) {
    hooks.tbody = function(parentTagName, htmlStr) {
        var parent = document.createElement('div');
        parent.innerHTML = '<table>' + htmlStr + '</table>';
        return parent.firstChild.firstChild;
    };
}

// IE8
if (!_supports.writableSelect) {
    hooks.select = function(parentTagName, htmlStr) {
        var parent = document.createElement('div');
        parent.innerHTML = '<select>' + htmlStr + '</select>';
        return parent.firstChild;
    };
}

module.exports = hooks;

},{"../../supports":54}],43:[function(require,module,exports){
var _regex = require('../../regex'),
    _utils = require('../../utils'),
    _hooks = require('./hooks'),

    _MAX_SINGLE_TAG_LENGTH = 30;

var _parseSingleTag = function(htmlStr) {
    if (htmlStr.length > _MAX_SINGLE_TAG_LENGTH) { return null; }

    var singleTagMatch = _regex.singleTagMatch(htmlStr);
    if (!singleTagMatch) { return null; }

    var elem = document.createElement(singleTagMatch[1]);

    // IE8
    _utils.flagParsedNode(elem);

    return [ elem ];
};

var _parse = function(htmlStr) {
    var singleTag = _parseSingleTag(htmlStr);
    if (singleTag) { return singleTag; }

    var parentTagName = _regex.getParentTagName(htmlStr),
        hook          = _hooks[parentTagName] || _hooks.dflt,
        parent        = hook(parentTagName, htmlStr);

    var child,
        idx = parent.children.length,
        arr = [];

    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);

        // IE8
        _utils.flagParsedNode(child);

        // http://jsperf.com/js-push-vs-index11/2
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};

var _parseHtml = function(str) {
    if (!str) { return null; }
    var result = _parse(str);
    if (!result || !result.length) { return null; }
    return D(result);
};

module.exports = {
    parseHtml: _parse,

    // Top-level functions attached directly to D.
    // Invoked via `D.parseHTML('...')`, as opposed to `D('div').parseHTML('...')`.
    D: {
        parseHtml: _parseHtml,
        // Because no one know what the case should be
        parseHTML: _parseHtml
    }
};

},{"../../regex":52,"../../utils":55,"./hooks":42}],44:[function(require,module,exports){
var _        = require('underscore'),
    overload = require('overload-js'),
    o        = overload.o,

    _utils   = require('../utils'),

    _docElem = document.documentElement;

var _getPosition = function(elem) {
    return {
        top: elem.offsetTop || 0,
        left: elem.offsetLeft || 0
    };
};

var _getOffset = function(elem) {
    var rect = _utils.isAttached(elem) ? elem.getBoundingClientRect() : {};

    return {
        top:  (rect.top  + document.body.scrollTop)  || 0,
        left: (rect.left + document.body.scrollLeft) || 0
    };
};

var _setOffset = function(elem, idx, pos) {
    var position = elem.style.position || 'static',
        props    = {};

    // set position first, in-case top/left are set even on static elem
    if (position === 'static') { elem.style.position = 'relative'; }

    var curOffset         = _getOffset(elem),
        curCSSTop         = elem.style.top,
        curCSSLeft        = elem.style.left,
        calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop === 'auto' || curCSSLeft === 'auto');

    if (_.isFunction(pos)) {
        pos = pos.call(elem, idx, curOffset);
    }

    var curTop, curLeft;
    // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
    if (calculatePosition) {
        var curPosition = _getPosition(elem);
        curTop  = curPosition.top;
        curLeft = curPosition.left;
    } else {
        curTop  = parseFloat(curCSSTop)  || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
    }

    if (_.exists(pos.top))  { props.top  = (pos.top  - curOffset.top)  + curTop;  }
    if (_.exists(pos.left)) { props.left = (pos.left - curOffset.left) + curLeft; }

    elem.style.top  = _.toPx(props.top);
    elem.style.left = _.toPx(props.left);
};

module.exports = {
    fn: {
        position: function() {
            var first = this[0];
            if (!first) { return; }

            return _getPosition(first);
        },

        offset: overload()
            .args(o.any(Object, Function))
            .use(function(posOrIterator) {
                return _.each(this, function(elem, idx) {
                    _setOffset(elem, idx, posOrIterator);
                });
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .args()
            .use(function() {
                var first = this[0];
                if (!first) { return; }
                return _getOffset(first);
            })
            .expose(),

        offsetParent: function() {
            return D(
                _.map(this, function(elem) {
                    var offsetParent = elem.offsetParent || _docElem;

                    while (offsetParent && (!_utils.isNodeName(offsetParent, 'html') && (offsetParent.style.position || 'static') === 'static')) {
                        offsetParent = offsetParent.offsetParent;
                    }

                    return offsetParent || _docElem;
                })
            );
        }
    }
};

},{"../utils":55,"overload-js":4,"underscore":5}],45:[function(require,module,exports){
var _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,

    _SUPPORTS  = require('../supports'),
    NODE_TYPE = require('node-type'),

    _regex     = require('../regex');

var _propFix = {
    'tabindex'        : 'tabIndex',
    'readonly'        : 'readOnly',
    'for'             : 'htmlFor',
    'class'           : 'className',
    'maxlength'       : 'maxLength',
    'cellspacing'     : 'cellSpacing',
    'cellpadding'     : 'cellPadding',
    'rowspan'         : 'rowSpan',
    'colspan'         : 'colSpan',
    'usemap'          : 'useMap',
    'frameborder'     : 'frameBorder',
    'contenteditable' : 'contentEditable'
};

var _propHooks = {
    src: (_SUPPORTS.hrefNormalized) ? {} : {
        get: function(elem) {
            return elem.getAttribute('src', 4);
        }
    },

    href: (_SUPPORTS.hrefNormalized) ? {} : {
        get: function(elem) {
            return elem.getAttribute('href', 4);
        }
    },

    // Support: Safari, IE9+
    // mis-reports the default selected property of an option
    // Accessing the parent's selectedIndex property fixes it
    selected: (_SUPPORTS.optSelected) ? {} : {
        get: function( elem ) {
            var parent = elem.parentNode,
                fix;

            if (parent) {
                fix = parent.selectedIndex;

                // Make sure that it also works with optgroups, see #5701
                if (parent.parentNode) {
                    fix = parent.parentNode.selectedIndex;
                }
            }
            return null;
        }
    },

    tabIndex: {
        get: function( elem ) {
            // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
            // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
            // Use proper attribute retrieval(#12072)
            var tabindex = elem.getAttribute('tabindex');

            if (tabindex) { return _.parseInt(tabindex); }

            var nodeName = elem.nodeName;
            return (_regex.type.isFocusable(nodeName) || (_regex.type.isClickable(nodeName) && elem.href)) ? 0 : -1;
        }
    }
};

var _getOrSetProp = function(elem, name, value) {
    var nodeType = elem.nodeType;

    // don't get/set properties on text, comment and attribute nodes
    if (!elem || nodeType === NODE_TYPE.TEXT || nodeType === NODE_TYPE.COMMENT || nodeType === NODE_TYPE.ATTRIBUTE) {
        return;
    }

    // Fix name and attach hooks
    name = _propFix[name] || name;
    var hooks = _propHooks[name];

    var result;
    if (value !== undefined) {
        return hooks && ('set' in hooks) && (result = hooks.set(elem, value, name)) !== undefined ?
            result :
            (elem[name] = value);

    }

    return hooks && ('get' in hooks) && (result = hooks.get(elem, name)) !== null ?
        result :
        elem[name];
};

module.exports = {
    fn: {
        prop: overload()
            .args(String)
            .use(function(prop) {
                var first = this[0];
                if (!first) { return; }

                return _getOrSetProp(first, prop);
            })

            .args(String, o.any(String, Number, Boolean))
            .use(function(prop, value) {
                return _.each(this, function(elem) {
                    _getOrSetProp(elem, prop, value);
                });
            })

            .args(String, Function)
            .use(function(prop, fn) {
                return _.each(this, function(elem) {
                    var result = fn.call(elem, idx, _getOrSetProp(elem, prop));
                    _getOrSetProp(elem, prop, result);
                });
            })

            .expose(),

        removeProp: overload()
            .args(String)
            .use(function(prop) {
                var name = _propFix[prop] || prop;
                return _.each(this, function(elem) {
                    delete elem[name];
                });
            })
            .expose()
    }
};

},{"../regex":52,"../supports":54,"node-type":3,"overload-js":4,"underscore":5}],46:[function(require,module,exports){
var _        = require('underscore'),
    overload = require('overload-js'),
    o        = overload.o,

    _utils   = require('../utils'),
    _array   = require('./array'),
    _order   = require('../order'),

    Fizzle   = require('./Fizzle/Fizzle');

var _find = function(selector, isNew) {
    var query = Fizzle.query(selector);
    return query.exec(this, isNew);
};

/**
 * @param {String|Function|Element|NodeList|Array|D} selector
 * @param {D} context
 * @returns {Element[]}
 * @private
 */
var _findWithin = function(selector, context) {
    // Fail fast
    if (!context.length) { return []; }

    var query, descendants, results;

    if (_.isElement(selector) || _.isNodeList(selector) || _.isArray(selector) || selector instanceof D) {
        // Convert selector to an array of elements
        selector = _.isElement(selector) ? [ selector ] : selector;

        descendants = _.flatten(_.map(context, function(elem) { return elem.querySelectorAll('*'); }));
        results = _.filter(descendants, function(descendant) { return selector.indexOf(descendant) > -1; });
    } else {
        query = Fizzle.query(selector);
        results = query.exec(context);
    }

    return results;
};

var _filter = function(arr, qualifier) {
    // Early return, no qualifier. Everything matches
    if (!qualifier) { return arr; }

    // Function
    // When IE8 support is removed, this can be reverted back to _.isFunction()
    if (_.isReallyFunction(qualifier)) {
        return _.filter(arr, qualifier);
    }

    // Element
    if (qualifier.nodeType) {
        return _.filter(arr, function(elem) {
            return (elem === qualifier);
        });
    }

    // Selector
    if (_.isString(qualifier)) {

        var is = Fizzle.is(qualifier);
        return _.filter(arr, function(elem) {
            return is.match(elem);
        });
    }

    // Array qualifier
    return _.filter(arr, function(elem) {
        return qualifier.indexOf(elem) > -1;
    });
};

module.exports = {
    find: _find,
    filter: _filter,

    fn: {
        // TODO: Optimize this method
        has: overload()
            .args(o.selector)
            .use(function(target) {
                var targets = this.find(target),
                    idx,
                    len = targets.length;

                return D(
                    _.filter(this, function(elem) {
                        for (idx = 0; idx < len; idx++) {
                            if (_order.contains(elem, targets[idx])) {
                                return true;
                            }
                        }
                        return false;
                    })
                );
            })

            .expose(),

        is: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return false; }

                var is = Fizzle.is(selector);
                return is.any(this);
            })

            .args(o.collection)
            .use(function(arr) {

                return _.any(this, function(elem) {
                    if (_.indexOf(arr, elem) !== -1) { return true; }
                });

            })

            .args(Function)
            .use(function(iterator) {

                return _.any(this, function(elem, idx) {
                    if (iterator.call(elem, idx)) {
                        return true;
                    }
                });

            })

            .args(Element)
            .use(function(context) {

                return _.any(this, function(elem) {
                    return (elem === context);
                });

            })

            .args(o.any(null, undefined, Number, Object))
            .use(function() {
                return false;
            })
            .expose(),

        not: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return this; }

                var is = Fizzle.is(selector);
                return D(
                    is.not(this)
                );
            })

            .args(o.collection)
            .use(function(arr) {
                arr = _.toArray(arr);

                return D(
                    _.filter(this, function(elem) {
                        if (_.indexOf(arr, elem) === -1) { return true; }
                    })
                );

            })

            .args(Function)
            .use(function(iterator) {

                return D(
                    _.filter(this, function(elem, idx) {
                        return !iterator.call(elem, idx);
                    })
                );

            })

            .args(Element)
            .use(function(context) {

                return D(
                    _.filter(this, function(elem) {
                        return (elem !== context);
                    })
                );

            })

            .args(o.any(null, undefined, Number, Object))
            .use(function() {
                return this;
            })
            .expose(),

        find: overload()
            .args(o.selector)
            .use(function(selector) {

                var result = _findWithin(selector, this);
                if (this.length > 1) {
                    _array.elementSort(result);
                }
                return _utils.merge(D(), result);

            })
            .expose(),

        filter: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return D(); }

                var is = Fizzle.is(selector);
                return D(
                    _.filter(this, function(elem) {
                        return is.match(elem);
                    })
                );

            })

            .args(o.collection)
            .use(function(arr) {

                return D(
                    _.filter(this, function(elem) {
                        if (_.indexOf(arr, elem) !== -1) { return true; }
                    })
                );

            })

            .args(Element)
            .use(function(context) {

                return D(
                    _.filter(this, function(elem) {
                        return (elem === context);
                    })
                );

            })

            // TODO: Filter with object? see _.find/_.findWhere
            .args(Function)
            .use(function(checker) {

                return D(
                    _.filter(this, function(elem, idx) {
                        return checker.call(elem, elem, idx);
                    })
                );

            })

            .args(o.any(null, undefined, Number))
            .use(function() {
                return D();
            })
            .expose()
    }
};

},{"../order":50,"../utils":55,"./Fizzle/Fizzle":18,"./array":27,"overload-js":4,"underscore":5}],47:[function(require,module,exports){
var _           = require('underscore'),
    overload    = require('overload-js'),
    o           = overload.o,

    NODE_TYPE  = require('node-type'),

    _utils      = require('../utils'),
    _array      = require('./array'),
    _selectors  = require('./selectors'),

    Fizzle      = require('./Fizzle/Fizzle');

var _getSiblings = function(context) {
        var idx    = 0,
            len    = context.length,
            result = [];
        for (; idx < len; idx++) {
            var sibs = _getNodeSiblings(context[idx]);
            if (sibs.length) { result.push(sibs); }
        }
        return _.flatten(result);
    },

    _getNodeSiblings = function(node) {
        var parent = node.parentNode;

        if (!parent) {
            return [];
        }

        var sibs = _.toArray(parent.children),
            idx  = sibs.length;

        while (idx--) {
            // Exclude the node itself from the list of its parent's children,
            // and exclude comment nodes for IE8
            if (sibs[idx] === node || sibs[idx].nodeType === NODE_TYPE.COMMENT) {
                sibs.splice(idx, 1);
            }
        }

        return sibs;
    },

    // Children ------
    _getChildren = function(arr) {
        return _.flatten(_.map(arr, _chldrn));
    },
    _chldrn = function(elem) {
        var arr  = [],
            kids = elem.children,
            idx  = 0,
            len  = kids.length,
            child;
        for (; idx < len; idx++) {
            child = kids[idx];
            // Skip comment nodes on IE8
            if (child.nodeType !== NODE_TYPE.COMMENT) {
                arr.push(child);
            }
        }
        return arr;
    },

    // Parents ------
    _getClosest = function(elems, selector, context) {
        var idx = 0,
            len = elems.length,
            parents,
            closest,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(elems[idx], context);
            parents.unshift(elems[idx]);
            closest = _selectors.filter(parents, selector);
            if (closest.length) {
                result.push(closest[0]);
            }
        }
        return _.flatten(result);
    },

    _getParents = function(context) {
        var idx = 0,
            len = context.length,
            parents,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(context[idx]);
            result.push(parents);
        }
        return _.flatten(result);
    },

    _getParentsUntil = function(d, stopSelector) {
        var idx = 0,
            len = d.length,
            parents,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(d[idx], null, stopSelector);
            result.push(parents);
        }
        return _.flatten(result);
    },

    _crawlUpNode = function(node, context, stopSelector) {
        var result = [],
            parent = node,
            nodeType;

        while ((parent   = _getNodeParent(parent)) &&
               (nodeType = parent.nodeType) !== NODE_TYPE.DOCUMENT &&
               (!context      || parent !== context) &&
               (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
            if (nodeType === NODE_TYPE.ELEMENT) {
                result.push(parent);
            }
        }

        return result;
    },

    // Parent ------
    _getParent = function(context) {
        var idx    = 0,
            len    = context.length,
            result = [];
        for (; idx < len; idx++) {
            var parent = _getNodeParent(context[idx]);
            if (parent) { result.push(parent); }
        }
        return result;
    },

    // Safely get parent node
    _getNodeParent = function(node) {
        return node && node.parentNode;
    },

    _getPrev = function(node) {
        var prev = node;
        while ((prev = prev.previousSibling) && prev.nodeType !== NODE_TYPE.ELEMENT) {}
        return prev;
    },

    _getNext = function(node) {
        var next = node;
        while ((next = next.nextSibling) && next.nodeType !== NODE_TYPE.ELEMENT) {}
        return next;
    },

    _getPrevAll = function(node) {
        var result = [],
            prev   = node;
        while ((prev = prev.previousSibling)) {
            if (prev.nodeType === NODE_TYPE.ELEMENT) {
                result.push(prev);
            }
        }
        return result;
    },

    _getNextAll = function(node) {
        var result = [],
            next   = node;
        while ((next = next.nextSibling)) {
            if (next.nodeType === NODE_TYPE.ELEMENT) {
                result.push(next);
            }
        }
        return result;
    },

    _getPositional = function(getter, d, selector) {
        var result = [],
            idx,
            len = d.length,
            sibling;

        for (idx = 0; idx < len; idx++) {
            sibling = getter(d[idx]);
            if (sibling && (!selector || Fizzle.is(selector).match(sibling))) {
                result.push(sibling);
            }
        }

        return result;
    },

    _getPositionalAll = function(getter, d, selector) {
        var result = [],
            idx,
            len = d.length,
            siblings,
            filter;

        if (selector) {
            filter = function(sibling) { return Fizzle.is(selector).match(sibling); };
        }

        for (idx = 0; idx < len; idx++) {
            siblings = getter(d[idx]);
            if (selector) {
                siblings = _.filter(siblings, filter);
            }
            result.push.apply(result, siblings);
        }

        return result;
    },

    _getPositionalUntil = function(getter, d, selector) {
        var result = [],
            idx,
            len = d.length,
            siblings,
            iterator;

        if (selector) {
            var is = Fizzle.is(selector);
            iterator = function(sibling) {
                var isMatch = is.match(sibling);
                if (isMatch) {
                    result.push(sibling);
                }
                return isMatch;
            };
        }

        for (idx = 0; idx < len; idx++) {
            siblings = getter(d[idx]);

            if (selector) {
                _.each(siblings, iterator);
            } else {
                result.push.apply(result, siblings);
            }
        }

        return result;
    },

    _uniqueSort = function(elems, reverse) {
        var result = _array.unique(elems);
        _array.elementSort(result);
        if (reverse) {
            result.reverse();
        }
        return D(result);
    },

    _filterAndSort = function(elems, selector, reverse) {
        return _uniqueSort(_selectors.filter(elems, selector), reverse);
    };

module.exports = {
    fn: {
        contents: function() {
            return D(
                _.flatten(
                    _.map(this, function(elem) {
                        return elem.childNodes;
                    })
                )
            );
        },

        index: overload()

            .args(String)
            .use(function(selector) {
                var first = this[0];
                return D(selector).indexOf(first);
            })

            .args(o.any(Element, o.window, o.document))
            .use(function(elem) {
                return this.indexOf(elem);
            })

            .args(o.D)
            .use(function(d) {
                return this.indexOf(d[0]);
            })

            .fallback(function() {
                if (!this.length) {
                    return -1;
                }

                var first  = this[0],
                    parent = first.parentNode;

                if (!parent) {
                    return -1;
                }

                // _utils.isAttached check to pass test "Node without parent returns -1"
                // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
                var isAttached       = _utils.isAttached(first),
                    isParentFragment = parent.nodeType === NODE_TYPE.DOCUMENT_FRAGMENT;

                if (!isAttached && (!isParentFragment || _utils.isParsedNode(first))) {
                    return -1;
                }

                var childElems = parent.children || _.filter(parent.childNodes, function(node) {
                    return node.nodeType === NODE_TYPE.ELEMENT;
                });

                return [].indexOf.apply(childElems, [ first ]);
            })

            .expose(),

        closest: function(selector, context) {
            return _uniqueSort(_getClosest(this, selector, context));
        },

        parent: function(selector) {
            return _filterAndSort(_getParent(this), selector);
        },

        parents: function(selector) {
            return _filterAndSort(_getParents(this), selector, true);
        },

        parentsUntil: function(stopSelector) {
            return _uniqueSort(_getParentsUntil(this, stopSelector), true);
        },

        siblings: function(selector) {
            return _filterAndSort(_getSiblings(this), selector);
        },

        children: function(selector) {
            return _filterAndSort(_getChildren(this), selector);
        },

        prev: function(selector) {
            return _uniqueSort(_getPositional(_getPrev, this, selector));
        },

        next: function(selector) {
            return _uniqueSort(_getPositional(_getNext, this, selector));
        },

        prevAll: function(selector) {
            return _uniqueSort(_getPositionalAll(_getPrevAll, this, selector), true);
        },

        nextAll: function(selector) {
            return _uniqueSort(_getPositionalAll(_getNextAll, this, selector));
        },

        prevUntil: function(selector) {
            return _uniqueSort(_getPositionalUntil(_getPrevAll, this, selector), true);
        },

        nextUntil: function(selector) {
            return _uniqueSort(_getPositionalUntil(_getNextAll, this, selector));
        }
    }
};

},{"../utils":55,"./Fizzle/Fizzle":18,"./array":27,"./selectors":46,"node-type":3,"overload-js":4,"underscore":5}],48:[function(require,module,exports){
var _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,
    string     = require('../string'),

    _SUPPORTS  = require('../supports'),
    NODE_TYPE = require('node-type'),

    _utils     = require('../utils'),
    _div       = require('../div');

var _outerHtml = function() {
    return this.length ? this[0].outerHTML : null;
};

var _text = {
    get: (_div.textContent !== undefined) ?
        function(elem) { return elem.textContent; } :
            function(elem) { return elem.innerText; } ,
    set: (_div.textContent !== undefined) ?
        function(elem, str) { elem.textContent = str; } :
            function(elem, str) { elem.innerText = str; }
};

var _valHooks = {
    option: {
        get: function(elem) {
            var val = elem.getAttribute('value');
            return string.trim(_.exists(val) ? val : _text.get(elem));
        }
    },

    select: {
        get: function(elem) {
            var value, option,
                options = elem.options,
                index   = elem.selectedIndex,
                one     = elem.type === 'select-one' || index < 0,
                values  = one ? null : [],
                max     = one ? index + 1 : options.length,
                idx     = index < 0 ? max : (one ? index : 0);

            // Loop through all the selected options
            for (; idx < max; idx++) {
                option = options[idx];

                // oldIE doesn't update selected after form reset (#2551)
                if ((option.selected || idx === index) &&
                        // Don't return options that are disabled or in a disabled optgroup
                        (_SUPPORTS.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) &&
                        (!option.parentNode.disabled || !_utils.isNodeName(option.parentNode, 'optgroup'))) {

                    // Get the specific value for the option
                    value = _valHooks.option.get(option);

                    // We don't need an array for one selects
                    if (one) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push(value);
                }
            }

            return values;
        },

        set: function(elem, value) {
            var optionSet, option,
                options = elem.options,
                values  = _.makeArray(value),
                idx     = options.length;

            while (idx--) {
                option = options[idx];

                if (_.indexOf(values, _valHooks.option.get(option)) >= 0) {
                    option.selected = optionSet = true;
                } else {
                    option.selected = false;
                }
            }

            // Force browsers to behave consistently when non-matching value is set
            if (!optionSet) {
                elem.selectedIndex = -1;
            }
        }
    }

};

// Radio and checkbox getter for Webkit
if (!_SUPPORTS.checkOn) {
    _.each(['radio', 'checkbox'], function(type) {
        _valHooks[type] = {
            get: function(elem) {
                // Support: Webkit - '' is returned instead of 'on' if a value isn't specified
                return elem.getAttribute('value') === null ? 'on' : elem.value;
            }
        }
    });
}

var _getVal = function(elem) {
    if (!elem || (elem.nodeType !== NODE_TYPE.ELEMENT)) { return; }

    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
    if (hook && hook.get) {
        return hook.get(elem);
    }

    var val = elem.value;
    if (val === undefined) {
        val = elem.getAttribute('value');
    }

    return _.isString(val) ? _utils.normalizeNewlines(val) : val;
};

var _stringify = function(value) {
    if (!_.exists(value)) {
        return '';
    }
    return '' + value;
};

var _setVal = function(elem, value) {
    if (elem.nodeType !== NODE_TYPE.ELEMENT) { return; }

    // Stringify values
    if (_.isArray(value)) {
        value = _.map(value, _stringify);
    } else {
        value = _stringify(value);
    }

    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
    if (hook && hook.set) {
        hook.set(elem, value);
    } else {
        elem.setAttribute('value', value);
    }
};

module.exports = {
    fn: {
        // TODO: Overload and determine api
        // TODO: unit tests
        outerHtml: _outerHtml,
        outerHTML: _outerHtml,

        html: overload()
            .args(String)
            .use(function(html) {
                return _.each(this, function(elem) {
                    elem.innerHTML = html;
                });
            })

            .args(Function)
            .use(function(iterator) {
                return _.each(this, function(elem, idx) {
                    elem.innerHTML = iterator.call(elem, idx, elem.innerHTML);
                });
            })

            .fallback(function() {
                var first = this[0];
                return (!first) ? undefined : first.innerHTML;
            })
            .expose(),

        // TODO: Add handling of (and unit tests for) \r\n in IE
        val: overload()
            // Getter
            .args()
            .use(function() {
                // TODO: Select first element node instead of index 0?
                return _getVal(this[0]);
            })

            // Setters
            .args(o.any(String, Number, Array))
            .use(function(value) {
                return _.each(this, function(elem) {
                    _setVal(elem, value);
                });
            })

            .args(o.any(null, undefined))
            .use(function() {
                return _.each(this, function(elem) {
                    _setVal(elem, '');
                });
            })

            .args(Function)
            .use(function(iterator) {
                return _.each(this, function(elem, idx) {
                    if (elem.nodeType !== NODE_TYPE.ELEMENT) { return; }

                    var value = iterator.call(elem, idx, _getVal(elem));

                    _setVal(elem, value);
                });
            })

            .fallback(function(value) {
                return _.each(this, function(elem) {
                    _setVal(elem, value);
                });
            })

            .expose(),

        text: overload()
            .args(String)
            .use(function(str) {
                return _.each(this, function(elem) {
                    _text.set(elem, str);
                });
            })

            .args(Function)
            .use(function(iterator) {
                return _.each(this, function(elem, idx) {
                    _text.set(elem, iterator.call(elem, idx, _text.get(elem)));
                });
            })

            .fallback(function() {
                var str = '';
                _.each(this, function(elem) {
                    str += _text.get(elem);
                });

                return str;
            })
            .expose()
    }
};

},{"../div":14,"../string":53,"../supports":54,"../utils":55,"node-type":3,"overload-js":4,"underscore":5}],49:[function(require,module,exports){
var _        = require('underscore'),
    overload = require('overload-js');

// Configure overload to throw type errors
overload.err = function() {
    throw new TypeError();
};

var isD = function(val) {
    return val instanceof D;
};

var isCollection = function(val) {
    return isD(val) || _.isArray(val) || _.isNodeList(val);
};

overload.defineTypes({
    D: function(val) {
        return val && isD(val);
    },
    nodeList: function(val) {
        return _.isNodeList(val);
    },
    window: function(val) {
        return _.isWindow(val);
    },
    document: function(val) {
        return val && val === document;
    },
    selector: function(val) {
        return val && (_.isString(val) || _.isFunction(val) || _.isElement(val) || isCollection(val));
    },
    collection: function(val) {
        return val && isCollection(val);
    },
    element: function(val) {
        return val === document || _.isWindow(val) || _.isElement(val);
    }
});

},{"overload-js":4,"underscore":5}],50:[function(require,module,exports){
var NODE_TYPE = require('node-type'),
    _DOC_POS   = require('./docPos'),

    _utils     = require('./utils');

// Compare Position - MIT Licensed, John Resig
// TODO: Optimize this function
var _comparePosition = function(node1, node2) {
    // Modern browsers (IE9+)
    if (node1.compareDocumentPosition) {
        return node1.compareDocumentPosition(node2);
    }

    var rel = 0;

    if (node1 === node2) {
        return rel;
    }

    // IE8
    if (node1.contains) {
        if (node1.contains(node2)) {
            rel += _DOC_POS.CONTAINED_BY;
        }
        if (node2.contains(node1)) {
            rel += _DOC_POS.CONTAINS;
        }

        if (node1.sourceIndex >= 0 && node2.sourceIndex >= 0) {
            rel += (node1.sourceIndex < node2.sourceIndex ? _DOC_POS.FOLLOWING : 0);
            rel += (node1.sourceIndex > node2.sourceIndex ? _DOC_POS.PRECEDING : 0);

            if (!_utils.isAttached(node1) || !_utils.isAttached(node2)) {
                rel += _DOC_POS.DISCONNECTED;
            }
        } else {
            rel += _DOC_POS.DISCONNECTED;
        }
    }

    return rel;
};

var _is = function(rel, flag) {
    return (rel & flag) === flag;
};

var _isNode = function(b, flag, a) {
    var rel = _comparePosition(a, b);
    return _is(rel, flag);
};

module.exports = {

    /**
     * Sorts an array of D elements in-place (i.e., mutates the original array)
     * in document order and returns whether any duplicates were found.
     * @function
     * @param {Element[]} array          Array of D elements.
     * @param {Boolean}  [reverse=false] If a truthy value is passed, the given array will be reversed.
     * @returns {Boolean} true if any duplicates were found, otherwise false.
     * @see jQuery src/selector-native.js:37
     */
    sort: (function() {
        var _hasDuplicate = false;

        var _sort = function(node1, node2) {
            // Flag for duplicate removal
            if (node1 === node2) {
                _hasDuplicate = true;
                return 0;
            }

            // Sort on method existence if only one input has compareDocumentPosition
            var rel = !node1.compareDocumentPosition - !node2.compareDocumentPosition;
            if (rel) {
                return rel;
            }

            // Nodes share the same document
            if ((node1.ownerDocument || node1) === (node2.ownerDocument || node2)) {
                rel = _comparePosition(node1, node2);
            }
            // Otherwise we know they are disconnected
            else {
                rel = _DOC_POS.DISCONNECTED;
            }

            // Not directly comparable
            if (!rel) {
                return 0;
            }

            // Disconnected nodes
            if (_is(rel, _DOC_POS.DISCONNECTED)) {
                var isNode1Disconnected = !_utils.isAttached(node1);
                var isNode2Disconnected = !_utils.isAttached(node2);

                if (isNode1Disconnected && isNode2Disconnected) {
                    return 0;
                }

                return isNode2Disconnected ? -1 : 1;
            }

            return _is(rel, _DOC_POS.FOLLOWING) ? -1 : 1;
        };

        return function(array, reverse) {
            _hasDuplicate = false;
            array.sort(_sort);
            if (reverse) {
                array.reverse();
            }
            return _hasDuplicate;
        };
    }()),

    /**
     * Determines whether node `a` contains node `b`.
     * @param {Element} a D element node
     * @param {Element} b D element node
     * @returns {Boolean} true if node `a` contains node `b`; otherwise false.
     */
    contains: function(a, b) {
        var aDown = a.nodeType === NODE_TYPE.DOCUMENT ? a.documentElement : a,
            bUp   = _utils.isAttached(b) ? b.parentNode : null;

        if (a === bUp) {
            return true;
        }

        if (bUp && bUp.nodeType === NODE_TYPE.ELEMENT) {
            // Modern browsers (IE9+)
            if (a.compareDocumentPosition) {
                return _isNode(bUp, _DOC_POS.CONTAINED_BY, a);
            }
            // IE8
            if (aDown.contains) {
                return aDown.contains(bUp);
            }
        }

        return false;
    }

};

},{"./docPos":15,"./utils":55,"node-type":3}],51:[function(require,module,exports){
// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) !== -1)) {

    var _toInteger = function(n) {
            n = +n;
            if (n !== n) { // isNaN
                n = 0;
            } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
            return n;
        },
        _boxedString = Object('a'),
        _splitString = _boxedString[0] !== 'a' || !(0 in _boxedString),
        _toString = (function(toString) {

            return function(obj) {
                return toString.call(obj);
            };

        }(Object.prototype.toString)),

        _toObject = function(o) {
            if (o == null) { // this matches both null and undefined
                throw new TypeError("can't convert "+o+" to object");
            }
            return Object(o);
        };

    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = _splitString && _toString(this) === '[object String]' ?
                this.split('') :
                _toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }


        var i = 0;
        if (arguments.length > 1) {
            i = _toInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
},{}],52:[function(require,module,exports){
var _                 = require('underscore'),

    _cache            = require('cache'),

    _camelCache         = _cache(),
    _displayCache       = _cache(),
    _focusableCache     = _cache(),
    _clickableCache     = _cache(),
    _idCache            = _cache(),
    _tagCache           = _cache(),
    _numNotPxCache      = _cache(),
    _positionCache      = _cache(),
    _classCache         = _cache(),
    _needContextCache   = _cache(),
    _focusMorphCache    = _cache(),
    _mouseEventCache    = _cache(),
    _keyEventCache      = _cache(),
    _singleTagCache     = _cache(),
    _parentCache        = _cache(),
    _typeNamespaceCache = _cache(),
    _notWhiteCache      = _cache();

    // Matches "-ms-" so that it can be changed to "ms-"
var _TRUNCATE_MS_PREFIX  = /^-ms-/,

    _ALPHA               = /alpha\([^)]*\)/i,
    _OPACITY             = /opacity\s*=\s*([^)]*)/,

    // Matches dashed string for camelizing
    _DASH_CATCH          = /-([\da-z])/gi,

    // Matches "none" or a table type e.g. "table",
    // "table-cell" etc...
    _NONE_OR_TABLE       = /^(none|table(?!-c[ea]).+)/,

    _TYPE_TEST_FOCUSABLE = /^(?:input|select|textarea|button|object)$/i,
    _TYPE_TEST_CLICKABLE = /^(?:a|area)$/i,
    _TYPE_NAMESPACE      = /^([^.]*)(?:\.(.+)|)$/,

    _SELECTOR_ID         = /^#([\w-]+)$/,
    _SELECTOR_TAG        = /^[\w-]+$/,
    _SELECTOR_CLASS      = /^\.([\w-]+)$/,

    _POSITION            = /^(top|right|bottom|left)$/,

    _NUM_NON_PX          = new RegExp('^(' + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ')(?!px)[a-z%]+$', 'i'),

    _WHITESPACE          = '[\\x20\\t\\r\\n\\f]',
    _NEEDS_CONTEXT       = new RegExp('^' + _WHITESPACE + '*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(' + _WHITESPACE + '*((?:-\\d)?\\d*)' + _WHITESPACE + '*\\)|)(?=[^-]|$)', 'i'),

    _FOCUS_MORPH         = /^(?:focusinfocus|focusoutblur)$/,
    _MOUSE_EVENT         = /^(?:mouse|contextmenu)|click/,
    _KEY_EVENT           = /^key/,

    _SINGLE_TAG          = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

    /**
     * Map of parent tag names to the child tags that require them.
     * @type {Object}
     */
    _PARENT_MAP = {
        table:    /^<(?:tbody|tfoot|thead|colgroup|caption)\b/,
        tbody:    /^<(?:tr)\b/,
        tr:       /^<(?:td|th)\b/,
        colgroup: /^<(?:col)\b/,
        select:   /^<(?:option)\b/
    },

    _NOT_WHITE = /\S+/g;

var _camelCase = function(match, letter) {
    return letter.toUpperCase();
};

module.exports = {
    alpha: _ALPHA,
    opacity: _OPACITY,

    camelCase: function(str) {
        return _camelCache.getOrSet(str, function() {
            return str.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, _camelCase);
        });
    },

    numNotPx: function(val) {
        return _numNotPxCache.getOrSet(val, function() {
            return _NUM_NON_PX.test(val);
        });
    },

    position: function(val) {
        return _positionCache.getOrSet(val, function() {
            return _POSITION.test(val);
        });
    },

    needsContext: function(val) {
        return _needContextCache.getOrSet(val, function() {
            return _NEEDS_CONTEXT.test(val);
        });
    },

    focusMorph: function(val) {
        return _focusMorphCache.getOrSet(val, function() {
            return _FOCUS_MORPH.test(val);
        });
    },

    mouseEvent: function(val) {
        return _mouseEventCache.getOrSet(val, function() {
            return _MOUSE_EVENT.test(val);
        });
    },

    keyEvent: function(val) {
        return _keyEventCache.getOrSet(val, function() {
            return _KEY_EVENT.test(val);
        });
    },

    singleTagMatch: function(val) {
        return _singleTagCache.getOrSet(val, function() {
            return _SINGLE_TAG.exec(val);
        });
    },

    getParentTagName: function(val) {
        val = val.substr(0, 30);
        return _parentCache.getOrSet(val, function() {
            var parentTagName;
            for (parentTagName in _PARENT_MAP) {
                if (_PARENT_MAP[parentTagName].test(val)) {
                    return parentTagName;
                }
            }
            return 'div';
        });
    },

    typeNamespace: function(val) {
        return _typeNamespaceCache.getOrSet(val, function() {
            return _TYPE_NAMESPACE.exec(val);
        });
    },

    matchNotWhite: function(val) {
        val = val || '';
        return _notWhiteCache.getOrSet(val, function() {
            return val.match(_NOT_WHITE);
        });
    },

    display: {
        isNoneOrTable: function(str) {
            return _displayCache.getOrSet(str, function() {
                return _NONE_OR_TABLE.test(str);
            });
        }
    },

    type: {
        isFocusable: function(str) {
            return _focusableCache.getOrSet(str, function() {
                return _TYPE_TEST_FOCUSABLE.test(str);
            });
        },
        isClickable: function(str) {
            return _clickableCache.getOrSet(str, function() {
                return _TYPE_TEST_CLICKABLE.test(str);
            });
        }
    },

    selector: {
        isStrictId: function(str) {
            return _idCache.getOrSet(str, function() {
                return _SELECTOR_ID.test(str);
            });
        },
        isTag: function(str) {
            return _tagCache.getOrSet(str, function() {
                return _SELECTOR_TAG.test(str);
            });
        },
        isClass: function(str) {
            return _classCache.getOrSet(str, function() {
                return _SELECTOR_CLASS.test(str);
            });
        }
    }
};

},{"cache":2,"underscore":5}],53:[function(require,module,exports){
var _     = require('underscore'),
    cache = require('cache')(2),
    
    R_TRIM       = /^\s+|\s+$/g,
    R_SPACE      = /\s+/g,

    isEmpty = function(str) {
        return str === null || str === undefined || str === '';
    },

    _splitImpl = function(name, delim) {
        var split   = name.split(delim),
            len     = split.length,
            idx     = split.length,
            names   = [],
            nameSet = {},
            curName;

        while (idx--) {
            curName = split[len - (idx + 1)];
            
            if (
                nameSet[curName] || // unique
                isEmpty(curName)    // non-empty
            ) { continue; }

            names.push(curName);
            nameSet[curName] = true;
        }

        return names;
    },

    _split = function(name, delim) {
        if (isEmpty(name)) { return []; }
        if (_.isArray(name)) { return name; }
        delim = delim === undefined ? R_SPACE : delim;
        return cache.getOrSet(delim, name, function() { return _splitImpl(name, delim); });
    };

var string = module.exports = {
    isEmpty: isEmpty,

    split: _split,

    trim: String.prototype.trim ?
        function(str) { return string.isEmpty(str) ? str : (str + '').trim(); } :
        function(str) { return string.isEmpty(str) ? str : (str + '').replace(R_TRIM, ''); }
};
},{"cache":2,"underscore":5}],54:[function(require,module,exports){
var _      = require('underscore'),
    div    = require('./div'),
    a      = div.getElementsByTagName('a')[0],
    button = div.getElementsByTagName('button')[0],
    select = document.createElement('select'),
    option = select.appendChild(document.createElement('option'));

var _test = function(tagName, testFn) {
    // Avoid variable references to elements to prevent memory leaks in IE.
    return testFn(document.createElement(tagName));
};

var support = {};

// Support: IE < 9 (lack submit/change bubble), Firefox 23+ (lack focusin event)
_.each([ 'submit', 'change', 'focusin' ], function(type) {
    var eventName   = 'on' + type,
        supportName = type + 'Bubbles';

    if (!(support[supportName] = eventName in window)) {
        // Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
        div.setAttribute(eventName, 't');

        // Checking '_' as it should be null or undefined if the
        // event is supported, false if it's not
        support[supportName] = div.attributes[eventName]._ === false;
    }
});

module.exports = _.extend(support, {
    classList:     !!div.classList,
    currentStyle:  !!div.currentStyle,

    // Support: IE9+, modern browsers
    matchesSelector: div.matches               ||
                     div.matchesSelector       ||
                     div.msMatchesSelector     ||
                     div.mozMatchesSelector    ||
                     div.webkitMatchesSelector ||
                     div.oMatchesSelector,

    // Make sure that element opacity exists
    // (IE uses filter instead)
    // Use a regex to work around a WebKit issue. See jQuery #5145
    opacity: (/^0.55$/).test(div.style.opacity),

    // Make sure that URLs aren't manipulated
    // (IE normalizes it by default)
    hrefNormalized: a.getAttribute('href') === '/a',

    // Check the default checkbox/radio value ('' in older WebKit; 'on' elsewhere)
    checkOn: _test('input', function(input) {
        input.setAttribute('type', 'radio');
        return !!input.value;
    }),

    // Check if an input maintains its value after becoming a radio
    // Support: Modern browsers only (NOT IE <= 11)
    radioValue: _test('input', function(input) {
        input.value = 't';
        input.setAttribute('type', 'radio');
        return input.value === 't';
    }),

    // Make sure that the options inside disabled selects aren't marked as disabled
    // (WebKit marks them as disabled)
    optDisabled: (function() {
        select.disabled = true;
        return !option.disabled;
    }()),

    // Modern browsers normalize \r\n to \n in textarea values,
    // but IE <= 11 (and possibly newer) do not.
    valueNormalized: _test('textarea', function(textarea) {
        textarea.value = '\r\n';
        return textarea.value === '\n';
    }),

    // Support: IE9+, modern browsers
    getPropertyValue:       !!a.style.getPropertyValue,

    // Support: IE8
    getAttribute:           !!a.style.getAttribute,

    // Support: IE9+, modern browsers
    getElementsByClassName: !!a.getElementsByClassName,

    // Support: IE9+, modern browsers
    getComputedStyle:       !!window.getComputedStyle,

    // Support: IE9+, modern browsers
    // innerHTML on tbody elements is readOnly in IE8
    // See: http://stackoverflow.com/a/4729743/467582
    writableTbody: _test('tbody', function(tbody) {
        tbody.innerHTML = '<tr><td></td></tr>';
        return !!tbody.innerHTML;
    }),

    // Support: IE9+, modern browsers
    // The only workaround seems to be use outerHTML and include your <select> in the string
    writableSelect: (function() {
        select.innerHTML = '<option></option>';
        return !!(select.children && select.children.length);
    }()),

    // Support: IE9+, modern browsers
    // Use defaultValue property instead of getAttribute("value")
    inputValueAttr: _test('input', function(input) {
        input.setAttribute('value', '');
        return input.getAttribute('value') === '';
    }),

    // Support: IE9+, modern browsers
    buttonValue: (function() {
        button.setAttribute('value', 'foobar');
        return button.value === 'foobar';
    }()),

    // Support: IE9+, modern browsers
    disabledSelector: _test('div', function(div) {
        div.innerHTML = '<input disabled />';
        try {
            return div.querySelectorAll('input:disabled').length > 0;
        } catch (e) {
            // IE8
        }
        return false;
    }),

    // Support: IE9+, modern browsers
    checkedSelector: _test('div', function(div) {
        div.innerHTML = '<input type="checkbox" checked />';
        try {
            return !!div.querySelector('input:checked');
        } catch (e) {
            // IE8
        }
        return false;
    }),

    // Support: IE10+, modern browsers
    selectedSelector: _test('select', function(select) {
        select.innerHTML = '<option value="1">1</option><option value="2" selected>2</option>';
        return !!select.querySelector('option[selected]');
    }),

    // Support: IE9+, modern browsers
    detachedCreateElement: _test('div', function(div) {
        return !div.parentNode;
    })
});

// Prevent memory leaks in IE
div = a = button = select = option = null;

},{"./div":14,"underscore":5}],55:[function(require,module,exports){
var _             = require('underscore'),
    string        = require('./string'),
    SUPPORTS      = require('./supports'),
    NODE_TYPE     = require('node-type'),
    cache         = require('cache')(),

    _flagParsedNode,
    _isParsedNode,

    _returnTrue    = function() { return true;  },
    _returnFalse   = function() { return false; },
    _returnThis    = function() { return this;  };

// IE9+, modern browsers
if (SUPPORTS.detachedCreateElement) {
    _flagParsedNode = _.noop;
    _isParsedNode   = _returnFalse;
}
// IE8
else {
    _flagParsedNode = function(elem) {
        if (!elem || !elem.parentNode) { return; }

        // IE8 creates a unique Document Fragment for every detached DOM node.
        // Mark it as bogus so we know to ignore it elsewhere when checking parentNode.
        elem.parentNode.isParsedNode = true;
    };
    _isParsedNode   = function(elem) {
        return !!(elem && elem.parentNode && elem.parentNode.isParsedNode);
    };
}

module.exports = {
    isAttached: function(elem) {
        return !!(
            elem                                                      &&
            elem.ownerDocument                                        &&
            elem !== document                                         &&
            elem.parentNode                                           &&
            elem.parentNode.nodeType !== NODE_TYPE.DOCUMENT_FRAGMENT  &&
            elem.parentNode.isParseHtmlFragment !== true
        );
    },

    isHtml: function(text) {
        if (!_.isString(text)) { return false; }

        text = string.trim(text);

        return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
    },

    normalNodeName: function(elem) {
        var nodeName = elem.nodeName;
        return cache.getOrSet(nodeName, function() {
            return nodeName.toLowerCase();
        });
    },

    isNodeName: function(elem, name) {
        var nodeName = cache.getOrSet(elem.nodeName, function() {
                return elem.nodeName.toLowerCase();
            }),
            compareName = cache.getOrSet(name, function() {
                return name.toLowerCase();
            });

        return nodeName === compareName;
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
    },

    normalizeNewlines: function(str) {
        return str && SUPPORTS.valueNormalized ? str.replace(/\r\n/g, '\n') : str;
    },

    returnTrue:  _returnTrue,
    returnFalse: _returnFalse,
    returnThis:  _returnThis,
    identity:    _returnThis,

    flagParsedNode: _flagParsedNode,
    isParsedNode:   _isParsedNode
};

},{"./string":53,"./supports":54,"cache":2,"node-type":3,"underscore":5}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwic3JjXFxpbmRleC5qcyIsIm5vZGVfbW9kdWxlc1xcY2FjaGVcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxub2RlLXR5cGVcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFxvdmVybG9hZC1qc1xcb3ZlcmxvYWQuanMiLCJub2RlX21vZHVsZXNcXHVuZGVyc2NvcmVcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFx4YWphLWpzXFxzcmNcXGluZGV4LmpzIiwibm9kZV9tb2R1bGVzXFx4YWphLWpzXFxzcmNcXHByZXBhcmUtZGF0YS5qcyIsIm5vZGVfbW9kdWxlc1xceGFqYS1qc1xcc3JjXFxwcmVwYXJlLWhlYWRlcnMuanMiLCJub2RlX21vZHVsZXNcXHhhamEtanNcXHNyY1xccHJlcGFyZS11cmwuanMiLCJub2RlX21vZHVsZXNcXHhhamEtanNcXHNyY1xccHJvZ3Jlc3MtaGFuZGxlci5qcyIsIm5vZGVfbW9kdWxlc1xceGFqYS1qc1xcc3JjXFxwcm9taXNlLmpzIiwibm9kZV9tb2R1bGVzXFx4YWphLWpzXFxzcmNcXHJlc3BvbnNlLWhhbmRsZXIuanMiLCJub2RlX21vZHVsZXNcXHhhamEtanNcXHNyY1xcdXRpbHMuanMiLCJzcmNcXGRpdi5qcyIsInNyY1xcZG9jUG9zLmpzIiwic3JjXFxtb2R1bGVzXFxEZWZlcnJlZFxcRGVmZXJyZWQuanMiLCJzcmNcXG1vZHVsZXNcXERlZmVycmVkXFx3aGVuLmpzIiwic3JjXFxtb2R1bGVzXFxGaXp6bGVcXEZpenpsZS5qcyIsInNyY1xcbW9kdWxlc1xcRml6emxlXFxjb25zdHJ1Y3RzXFxJcy5qcyIsInNyY1xcbW9kdWxlc1xcRml6emxlXFxjb25zdHJ1Y3RzXFxRdWVyeS5qcyIsInNyY1xcbW9kdWxlc1xcRml6emxlXFxjb25zdHJ1Y3RzXFxTZWxlY3Rvci5qcyIsInNyY1xcbW9kdWxlc1xcRml6emxlXFxsaXN0XFxzZWxlY3RvcnMtY2FwdHVyZS5qcyIsInNyY1xcbW9kdWxlc1xcRml6emxlXFxsaXN0XFxzZWxlY3RvcnMtcHJveHkuanMiLCJzcmNcXG1vZHVsZXNcXEZpenpsZVxcc2VsZWN0b3JcXHNlbGVjdG9yLW1hdGNoLmpzIiwic3JjXFxtb2R1bGVzXFxGaXp6bGVcXHNlbGVjdG9yXFxzZWxlY3Rvci1ub3JtYWxpemUuanMiLCJzcmNcXG1vZHVsZXNcXEZpenpsZVxcc2VsZWN0b3JcXHNlbGVjdG9yLXBhcnNlLmpzIiwic3JjXFxtb2R1bGVzXFxhcnJheS5qcyIsInNyY1xcbW9kdWxlc1xcYXR0ci5qcyIsInNyY1xcbW9kdWxlc1xcY2xhc3Nlcy5qcyIsInNyY1xcbW9kdWxlc1xcY2xhc3Nlc1xcY2xhc3Nlcy1sZWdhY3kuanMiLCJzcmNcXG1vZHVsZXNcXGNsYXNzZXNcXGNsYXNzZXMtbW9kZXJuLmpzIiwic3JjXFxtb2R1bGVzXFxjc3MuanMiLCJzcmNcXG1vZHVsZXNcXGRhdGEuanMiLCJzcmNcXG1vZHVsZXNcXGRpbWVuc2lvbnMuanMiLCJzcmNcXG1vZHVsZXNcXGV2ZW50XFxFLmpzIiwic3JjXFxtb2R1bGVzXFxldmVudFxcYXBpLmpzIiwic3JjXFxtb2R1bGVzXFxldmVudFxcZXZlbnQuanMiLCJzcmNcXG1vZHVsZXNcXGV2ZW50XFxldmVudFNwZWNpYWxzLmpzIiwic3JjXFxtb2R1bGVzXFxldmVudFxcZXZlbnRVdGlscy5qcyIsInNyY1xcbW9kdWxlc1xcbWFuaXAuanMiLCJzcmNcXG1vZHVsZXNcXG9ucmVhZHkuanMiLCJzcmNcXG1vZHVsZXNcXHBhcnNlclxcaG9va3MuanMiLCJzcmNcXG1vZHVsZXNcXHBhcnNlclxccGFyc2VyLmpzIiwic3JjXFxtb2R1bGVzXFxwb3NpdGlvbi5qcyIsInNyY1xcbW9kdWxlc1xccHJvcC5qcyIsInNyY1xcbW9kdWxlc1xcc2VsZWN0b3JzLmpzIiwic3JjXFxtb2R1bGVzXFx0cmFuc3ZlcnNhbC5qcyIsInNyY1xcbW9kdWxlc1xcdmFsLmpzIiwic3JjXFxvLmN1c3RvbS5qcyIsInNyY1xcb3JkZXIuanMiLCJzcmNcXHBvbHlmaWxsc1xcaW5kZXhPZi5qcyIsInNyY1xccmVnZXguanMiLCJzcmNcXHN0cmluZy5qcyIsInNyY1xcc3VwcG9ydHMuanMiLCJzcmNcXHV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIHBvbHlmaWxsc1xyXG5yZXF1aXJlKCcuL3BvbHlmaWxscy9pbmRleE9mJyk7XHJcblxyXG4vLyBDb25maWd1cmUgTyB3aXRoIHN0cmluZyBjdXN0b20gdHlwZXNcclxucmVxdWlyZSgnLi9vLmN1c3RvbScpO1xyXG5cclxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcblxyXG4gICAgcGFyc2VyICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvcGFyc2VyL3BhcnNlcicpLFxyXG4gICAgdXRpbHMgICAgICAgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgICBhcnJheSAgICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9hcnJheScpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvb25yZWFkeScpLFxyXG4gICAgc2VsZWN0b3JzICAgPSByZXF1aXJlKCcuL21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJy4vbW9kdWxlcy90cmFuc3ZlcnNhbCcpLFxyXG4gICAgZGltZW5zaW9ucyAgPSByZXF1aXJlKCcuL21vZHVsZXMvZGltZW5zaW9ucycpLFxyXG4gICAgbWFuaXAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NzcycpLFxyXG4gICAgYXR0ciAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvYXR0cicpLFxyXG4gICAgcHJvcCAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvdmFsJyksXHJcbiAgICBwb3NpdGlvbiAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9wb3NpdGlvbicpLFxyXG4gICAgY2xhc3NlcyAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvZGF0YScpLFxyXG4gICAgZXZlbnRzICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnQvYXBpJyksXHJcbiAgICBldmVudE9iaiAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9ldmVudC9ldmVudCcpLFxyXG4gICAgZGVmZXJyZWQgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvRGVmZXJyZWQvRGVmZXJyZWQnKSxcclxuICAgIHdoZW4gICAgICAgID0gcmVxdWlyZSgnLi9tb2R1bGVzL0RlZmVycmVkL3doZW4nKSxcclxuXHJcbiAgICB4YWphICAgICAgICA9IHJlcXVpcmUoJ3hhamEtanMnKTtcclxuXHJcbi8vIFN0b3JlIHByZXZpb3VzIHJlZmVyZW5jZVxyXG52YXIgX3ByZXZEID0gd2luZG93LkQ7XHJcblxyXG52YXIgRCA9IGZ1bmN0aW9uKGFyZywgYXR0cnMpIHtcclxuICAgIC8vIFdhc24ndCBjcmVhdGVkIHdpdGggXCJuZXdcIlxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEQpKSB7IHJldHVybiBuZXcgRChhcmcsIGF0dHJzKTsgfVxyXG5cclxuICAgIC8vIE5vdGhpblxyXG4gICAgaWYgKCFhcmcpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKGFyZy5ub2RlVHlwZSB8fCBhcmcgPT09IHdpbmRvdyB8fCBhcmcgPT09IGRvY3VtZW50KSB7XHJcbiAgICAgICAgdGhpcy5wdXNoKGFyZyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0cmluZ1xyXG4gICAgaWYgKF8uaXNTdHJpbmcoYXJnKSkge1xyXG5cclxuICAgICAgICAvLyBIVE1MIHN0cmluZ1xyXG4gICAgICAgIGlmICh1dGlscy5pc0h0bWwoYXJnKSkge1xyXG4gICAgICAgICAgICB1dGlscy5tZXJnZSh0aGlzLCBwYXJzZXIucGFyc2VIdG1sKGFyZykpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgdXRpbHMubWVyZ2UodGhpcywgc2VsZWN0b3JzLmZpbmQoYXJnLCB0cnVlKSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IG9mIEVsZW1lbnRzLCBOb2RlTGlzdCwgb3IgRCBvYmplY3RcclxuICAgIGlmIChfLmlzQXJyYXkoYXJnKSB8fCBfLmlzTm9kZUxpc3QoYXJnKSB8fCBhcmcgaW5zdGFuY2VvZiBEKSB7XHJcbiAgICAgICAgdXRpbHMubWVyZ2UodGhpcywgYXJnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG9jdW1lbnQgYSByZWFkeVxyXG4gICAgaWYgKF8uaXNGdW5jdGlvbihhcmcpKSB7XHJcbiAgICAgICAgb25yZWFkeShhcmcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIF9oYXNNb3JlQ29uZmxpY3QgPSBmYWxzZSxcclxuICAgIF9wcmV2alF1ZXJ5LFxyXG4gICAgX3ByZXYkO1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIHBhcnNlci5ELFxyXG4gICAgZGF0YS5ELFxyXG4gICAgZGVmZXJyZWQuRCxcclxuICAgIHdoZW4uRCxcclxuICAgIGV2ZW50T2JqLkQsXHJcbiAgICB4YWphLCAvLyBwcm94eSBhamF4IHRvIHhhamFcclxue1xyXG4gICAgZWFjaDogICAgYXJyYXkuZWFjaCxcclxuICAgIGZvckVhY2g6IGFycmF5LmVhY2gsXHJcblxyXG4gICAgbWFwOiAgICAgXy5tYXAsXHJcbiAgICBleHRlbmQ6ICBfLmV4dGVuZCxcclxuXHJcbiAgICBub0NvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoX2hhc01vcmVDb25mbGljdCkge1xyXG4gICAgICAgICAgICB3aW5kb3cualF1ZXJ5ID0gX3ByZXZqUXVlcnk7XHJcbiAgICAgICAgICAgIHdpbmRvdy4kID0gX3ByZXYkO1xyXG5cclxuICAgICAgICAgICAgX2hhc01vcmVDb25mbGljdCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2luZG93LkQgPSBfcHJldkQ7XHJcbiAgICAgICAgcmV0dXJuIEQ7XHJcbiAgICB9LFxyXG5cclxuICAgIG1vcmVDb25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX2hhc01vcmVDb25mbGljdCA9IHRydWU7XHJcbiAgICAgICAgX3ByZXZqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xyXG4gICAgICAgIF9wcmV2JCA9IHdpbmRvdy4kO1xyXG4gICAgICAgIHdpbmRvdy5qUXVlcnkgPSB3aW5kb3cuWmVwdG8gPSB3aW5kb3cuJCA9IEQ7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudmFyIGFycmF5UHJvdG8gPSAoZnVuY3Rpb24ocHJvdG8sIG9iaikge1xyXG5cclxuICAgIF8uZWFjaChcclxuICAgICAgICBfLnNwbHQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodCcpLFxyXG4gICAgICAgIGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICBvYmpba2V5XSA9IHByb3RvW2tleV07XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gb2JqO1xyXG5cclxufShBcnJheS5wcm90b3R5cGUsIHt9KSk7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQucHJvdG90eXBlLFxyXG4gICAgeyBjb25zdHJ1Y3RvcjogRCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgcHJvdG90eXBlIHNvIHRoYXRcclxuLy8gaXQgY2FuIGJlIGhvb2tlZCBpbnRvIGZvciBwbHVnaW5zXHJcbkQuZm4gPSBELnByb3RvdHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gIEQ7XHJcbiIsIi8qKlxyXG4gKiBGcm9tIFNpenpsZS5qcyBgY3JlYXRlQ2FjaGUoKWA6XHJcbiAqIFVzZSAoa2V5ICsgJyAnKSB0byBhdm9pZCBjb2xsaXNpb24gd2l0aCBuYXRpdmUgcHJvdG90eXBlIHByb3BlcnRpZXMuXHJcbiAqIE5PVEU6IFRoZSBzcGFjZSBoYXMgYmVlbiByZW1vdmVkIHRvIGFsbG93IC5kYXRhKCkgdG8gcmV0dXJuIG9iamVjdHMgd2l0aCBcIm5vcm1hbFwiIGtleXMuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcclxuICogQHJldHVybnMge1N0cmluZ31cclxuICogQHByaXZhdGVcclxuICovXHJcbi8vIFRPRE86IE5vIGxvbmdlciBuZWVkIF9zYWZlXHJcbnZhciBfc2FmZSA9IGZ1bmN0aW9uKGtleSkgeyByZXR1cm4ga2V5OyB9O1xyXG5cclxudmFyIF9nZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcmVmID0ge307XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBfc2FmZShrZXkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZltrZXldO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGtleSA9IF9zYWZlKGtleSk7XHJcbiAgICAgICAgICAgICAgICByZWZba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBnZXRPclNldDogZnVuY3Rpb24oa2V5LCBmbikge1xyXG4gICAgICAgICAgICAgICAga2V5ID0gX3NhZmUoa2V5KTtcclxuICAgICAgICAgICAgICAgIHZhciBjYWNoZWRWYWwgPSByZWZba2V5XTtcclxuICAgICAgICAgICAgICAgIGlmIChjYWNoZWRWYWwgIT09IHVuZGVmaW5lZCkgeyByZXR1cm4gY2FjaGVkVmFsOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHJlZltrZXldID0gZm4oKSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgcmVmW19zYWZlKGtleSldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgX2JpTGV2ZWxHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcmVmID0ge307XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGhhczogZnVuY3Rpb24oa2V5MSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZltfc2FmZShrZXkxKV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkxID0gX3NhZmUoa2V5MSk7XHJcbiAgICAgICAgICAgICAgICBrZXkyID0gX3NhZmUoa2V5Mik7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVmMSA9IHJlZltrZXkxXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gcmVmMSA6IChyZWYxICE9PSB1bmRlZmluZWQgPyByZWYxW2tleTJdIDogcmVmMSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oa2V5MSwga2V5MiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGtleTEgPSBfc2FmZShrZXkxKTtcclxuICAgICAgICAgICAgICAgIGtleTIgPSBfc2FmZShrZXkyKTtcclxuICAgICAgICAgICAgICAgIHZhciByZWYxID0gcmVmW2tleTFdIHx8IChyZWZba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdldE9yU2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCBmbikge1xyXG4gICAgICAgICAgICAgICAga2V5MSA9IF9zYWZlKGtleTEpO1xyXG4gICAgICAgICAgICAgICAga2V5MiA9IF9zYWZlKGtleTIpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlZjEgPSByZWZba2V5MV0gfHwgKHJlZltrZXkxXSA9IHt9KSxcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZWRWYWwgPSByZWYxW2tleTJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNhY2hlZFZhbCAhPT0gdW5kZWZpbmVkKSB7IHJldHVybiBjYWNoZWRWYWw7IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAocmVmMVtrZXkyXSA9IGZuKCkpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgICAgIGtleTEgPSBfc2FmZShrZXkxKTtcclxuICAgICAgICAgICAgICAgIGtleTIgPSBfc2FmZShrZXkyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFYXN5IHJlbW92YWxcclxuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlZltrZXkxXTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRGVlcCByZW1vdmFsXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVmMSA9IHJlZltrZXkxXSB8fCAocmVmW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHJlZjFba2V5Ml07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obHZsKSB7XHJcbiAgICByZXR1cm4gbHZsID09PSAyID8gX2JpTGV2ZWxHZXR0ZXJTZXR0ZXIoKSA6IF9nZXR0ZXJTZXR0ZXIoKTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIEVMRU1FTlQ6ICAgICAgICAgICAgICAgICAxLFxyXG4gICAgQVRUUklCVVRFOiAgICAgICAgICAgICAgIDIsXHJcbiAgICBURVhUOiAgICAgICAgICAgICAgICAgICAgMyxcclxuICAgIENEQVRBOiAgICAgICAgICAgICAgICAgICA0LFxyXG4gICAgRU5USVRZX1JFRkVSRU5DRTogICAgICAgIDUsXHJcbiAgICBFTlRJVFk6ICAgICAgICAgICAgICAgICAgNixcclxuICAgIFBST0NFU1NJTkdfSU5TVFJVQ1RJT046ICA3LFxyXG4gICAgQ09NTUVOVDogICAgICAgICAgICAgICAgIDgsXHJcbiAgICBET0NVTUVOVDogICAgICAgICAgICAgICAgOSxcclxuICAgIERPQ1VNRU5UX1RZUEU6ICAgICAgICAgIDEwLFxyXG4gICAgRE9DVU1FTlRfRlJBR01FTlQ6ICAgICAgMTEsXHJcbiAgICBOT1RBVElPTjogICAgICAgICAgICAgICAxMlxyXG59O1xyXG4iLCIoZnVuY3Rpb24oVFJVRSwgRkFMU0UsIE5VTEwsIHVuZGVmaW5lZCkge1xuXG5cdHZhciByb290ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0aGlzO1xuXG5cdC8vIFZhcmlhYmxpemluZyB0aGUgc3RyaW5ncyBmb3IgY29uc2lzdGVuY3lcblx0Ly8gYW5kIHRvIGF2b2lkIGhhcm1mdWwgZG90LW5vdGF0aW9uIGxvb2stdXBzIHdpdGhcblx0Ly8gamF2YXNjcmlwdCBrZXl3b3Jkc1xuXHR2YXIgc051bGwgICAgICA9ICdOdWxsJyxcblx0XHRzVW5kZWZpbmVkID0gJ1VuZGVmaW5lZCcsXG5cdFx0c0luZmluaXR5ICA9ICdJbmZpbml0eScsXG5cdFx0c0RhdGUgICAgICA9ICdEYXRlJyxcblx0XHRzTmFOICAgICAgID0gJ05hTicsXG5cdFx0c051bWJlciAgICA9ICdOdW1iZXInLFxuXHRcdHNTdHJpbmcgICAgPSAnU3RyaW5nJyxcblx0XHRzT2JqZWN0ICAgID0gJ09iamVjdCcsXG5cdFx0c0FycmF5ICAgICA9ICdBcnJheScsXG5cdFx0c1JlZ0V4cCAgICA9ICdSZWdFeHAnLFxuXHRcdHNCb29sZWFuICAgPSAnQm9vbGVhbicsXG5cdFx0c0Z1bmN0aW9uICA9ICdGdW5jdGlvbicsXG5cdFx0c0VsZW1lbnQgICA9ICdFbGVtZW50JztcblxuXHQvLyBVdGlsaXppbmcgdGhlIG5vbi1zdGFuZGFyZCAoYnV0IGF2YWlsYWJsZSBpbiBtb2Rlcm4gYnJvd3NlcnMpIEdsb2JhbCBPYmplY3QgbmFtZXNcblx0Ly8gc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Z1bmN0aW9uL25hbWVcblx0Ly8gUHJvdmlkZSBhIHBvbHlmaWxsIGZvciBpdGVtcyB3aXRob3V0IG5hbWVzXG5cdChmdW5jdGlvbigpIHtcblx0XHR2YXIgZ2xvYmFsT2JqZWN0cyA9IFtcblx0XHRcdFx0c0RhdGUsXG5cdFx0XHRcdHNOdW1iZXIsXG5cdFx0XHRcdHNTdHJpbmcsXG5cdFx0XHRcdHNPYmplY3QsXG5cdFx0XHRcdHNBcnJheSxcblx0XHRcdFx0c1JlZ0V4cCxcblx0XHRcdFx0c0Jvb2xlYW4sXG5cdFx0XHRcdHNGdW5jdGlvbixcblx0XHRcdFx0c0VsZW1lbnRcblx0XHRcdF0sXG5cdFx0XHRpZHggPSBnbG9iYWxPYmplY3RzLmxlbmd0aCxcblx0XHRcdGdsb2JhbE9iamVjdDtcblx0XHR3aGlsZSAoaWR4LS0pIHtcblx0XHRcdGdsb2JhbE9iamVjdCA9IGdsb2JhbE9iamVjdHNbaWR4XTtcblx0XHRcdGlmIChyb290W2dsb2JhbE9iamVjdF0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRpZiAoIXJvb3RbZ2xvYmFsT2JqZWN0XS5uYW1lKSB7XG5cdFx0XHRcdFx0cm9vdFtnbG9iYWxPYmplY3RdLm5hbWUgPSBnbG9iYWxPYmplY3Q7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0oKSk7XG5cblx0LyoqXG5cdCAqIFBvc3NpYmxlIHZhbHVlc1xuXHQgKiBAdHlwZSB7T2JqZWN0fVxuXHQgKi9cblx0dmFyIF90eXBlcyA9IHt9O1xuXHRfdHlwZXNbc051bGxdICAgICAgPSAwO1xuXHRfdHlwZXNbc1VuZGVmaW5lZF0gPSAxO1xuXHRfdHlwZXNbc0luZmluaXR5XSAgPSAyO1xuXHRfdHlwZXNbc0RhdGVdICAgICAgPSAzO1xuXHRfdHlwZXNbc05hTl0gICAgICAgPSA0O1xuXHRfdHlwZXNbc051bWJlcl0gICAgPSA1O1xuXHRfdHlwZXNbc1N0cmluZ10gICAgPSA2O1xuXHRfdHlwZXNbc09iamVjdF0gICAgPSA3O1xuXHRfdHlwZXNbc0FycmF5XSAgICAgPSA4O1xuXHRfdHlwZXNbc1JlZ0V4cF0gICAgPSA5O1xuXHRfdHlwZXNbc0Jvb2xlYW5dICAgPSAxMDtcblx0X3R5cGVzW3NGdW5jdGlvbl0gID0gMTE7XG5cdF90eXBlc1tzRWxlbWVudF0gICA9IDEyO1xuXG5cdC8qKlxuXHQgKiBDYWNoZWQgcmVmZXJlbmNlIHRvIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcblx0ICogZm9yIHR5cGUgY2hlY2tpbmdcblx0ICogQHR5cGUge0Z1bmN0aW9ufVxuXHQgKi9cblx0dmFyIF90b1N0cmluZyA9IChmdW5jdGlvbih0b1N0cmluZykge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuXHRcdFx0XHRyZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopO1xuXHRcdFx0fTtcblx0XHR9KCh7fSkudG9TdHJpbmcpKSxcblxuXHRcdF9ub29wQXJyID0gW10sXG5cblx0XHQvKipcblx0XHQgKiBUeXBlIGNoZWNrc1xuXHRcdCAqL1xuXHRcdF9jaGVja01hcCA9IChmdW5jdGlvbihtYXApIHtcblxuXHRcdFx0dmFyIHR5cGVzID0gW1xuXHRcdFx0XHRcdC8vIE9ubHkgbWFwcGluZyBpdGVtcyB0aGF0IG5lZWQgdG8gYmUgbWFwcGVkLlxuXHRcdFx0XHRcdC8vIEl0ZW1zIG5vdCBpbiB0aGlzIGxpc3QgYXJlIGRvaW5nIGZhc3RlclxuXHRcdFx0XHRcdC8vIChub24tc3RyaW5nKSBjaGVja3Ncblx0XHRcdFx0XHQvL1xuXHRcdFx0XHRcdC8vIDAgPSBrZXksIDEgPSB2YWx1ZVxuXHRcdFx0XHRcdFsgc0RhdGUsICAgICBfdHlwZXNbc0RhdGVdICAgICBdLFxuXHRcdFx0XHRcdFsgc051bWJlciwgICBfdHlwZXNbc051bWJlcl0gICBdLFxuXHRcdFx0XHRcdFsgc1N0cmluZywgICBfdHlwZXNbc1N0cmluZ10gICBdLFxuXHRcdFx0XHRcdFsgc09iamVjdCwgICBfdHlwZXNbc09iamVjdF0gICBdLFxuXHRcdFx0XHRcdFsgc0FycmF5LCAgICBfdHlwZXNbc0FycmF5XSAgICBdLFxuXHRcdFx0XHRcdFsgc1JlZ0V4cCwgICBfdHlwZXNbc1JlZ0V4cF0gICBdLFxuXHRcdFx0XHRcdFsgc0Z1bmN0aW9uLCBfdHlwZXNbc0Z1bmN0aW9uXSBdXG5cdFx0XHRcdF0sXG5cdFx0XHRcdGlkeCA9IHR5cGVzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpZHgtLSkge1xuXHRcdFx0XHRtYXBbJ1tvYmplY3QgJyArIHR5cGVzW2lkeF1bMF0gKyAnXSddID0gdHlwZXNbaWR4XVsxXTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG1hcDtcblxuXHRcdH0oe30pKSxcblxuXHRcdC8qKlxuXHRcdCAqIENoYW5nZXMgYXJndW1lbnRzIHRvIGFuIGFycmF5XG5cdFx0ICogQHBhcmFtICB7QXJndW1lbnRzfSBhcnJheWxpa2Vcblx0XHQgKiBAcmV0dXJuIHtBcnJheX1cblx0XHQgKi9cblx0XHRfcHJvdG9TbGljZSA9IFtdLnNsaWNlLFxuXHRcdF9zbGljZSA9IGZ1bmN0aW9uKGFycmF5bGlrZSkge1xuXHRcdFx0cmV0dXJuIF9wcm90b1NsaWNlLmNhbGwoYXJyYXlsaWtlKTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogTWluaSBleHRlbmRcblx0XHQgKiBAcGFyYW0gIHtGdW5jdGlvbn0gYmFzZVxuXHRcdCAqIEBwYXJhbSAge09iamVjdH0gICBvYmpcblx0XHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYmFzZVxuXHRcdCAqL1xuXHRcdGV4dGVuZCA9IGZ1bmN0aW9uKGJhc2UsIG9iaikge1xuXHRcdFx0dmFyIGtleTtcblx0XHRcdGZvciAoa2V5IGluIG9iaikge1xuXHRcdFx0XHRiYXNlW2tleV0gPSBvYmpba2V5XTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBiYXNlO1xuXHRcdH07XG5cblx0dmFyIF9nZXRDb25maWd1cmF0aW9uVHlwZSA9IGZ1bmN0aW9uKHZhbCkge1xuXHRcdGlmICh2YWwgPT09IG51bGwpIHsgcmV0dXJuIF90eXBlc1tzTnVsbF07IH1cblx0XHRpZiAodmFsID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIF90eXBlc1tzVW5kZWZpbmVkXTsgfVxuXG5cdFx0Ly8gd2UgaGF2ZSBzb21ldGhpbmcsIGJ1dCBkb24ndCBrbm93IHdoYXRcblx0XHRpZiAoIXZhbC5uYW1lKSB7XG5cdFx0XHRpZiAodmFsID09PSByb290W3NFbGVtZW50XSkgeyByZXR1cm4gX3R5cGVzW3NFbGVtZW50XTsgfSAvLyBGaXJlZm94IGRvZXNuJ3QgYWxsb3cgc2V0dGluZyB0aGUgbmFtZSBvZiBFbGVtZW50XG5cdFx0XHRpZiAodmFsICE9PSArdmFsKSB7IHJldHVybiBfdHlwZXNbc05hTl07IH0gLy8gTmFOIGNoZWNrXG5cdFx0XHRyZXR1cm4gX3R5cGVzW3NJbmZpbml0eV07IC8vIEluZmluaXR5IGNoZWNrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIF90eXBlc1t2YWwubmFtZV07XG5cdH07XG5cblx0dmFyIF9nZXRQYXJhbWV0ZXJUeXBlID0gZnVuY3Rpb24odmFsKSB7XG5cdFx0aWYgKHZhbCA9PT0gbnVsbCkgeyByZXR1cm4gX3R5cGVzW3NOdWxsXTsgfVxuXHRcdGlmICh2YWwgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gX3R5cGVzW3NVbmRlZmluZWRdOyB9XG5cdFx0aWYgKHZhbCA9PT0gVFJVRSB8fCB2YWwgPT09IEZBTFNFKSB7IHJldHVybiBfdHlwZXNbc0Jvb2xlYW5dOyB9XG5cdFx0aWYgKHZhbCAmJiB2YWwubm9kZVR5cGUgPT09IDEpIHsgcmV0dXJuIF90eXBlc1tzRWxlbWVudF07IH0gLy8gRWxlbWVudCBjaGVjayBmcm9tIFVuZGVyc2NvcmVcblxuXHRcdHZhciB0eXBlU3RyaW5nID0gX3RvU3RyaW5nKHZhbCk7XG5cdFx0aWYgKF9jaGVja01hcFt0eXBlU3RyaW5nXSA9PT0gX3R5cGVzW3NOdW1iZXJdKSB7XG5cdFx0XHRpZiAodmFsICE9PSArdmFsKSB7IHJldHVybiBfdHlwZXNbc05hTl07IH0gLy8gTmFOIGNoZWNrXG5cdFx0XHRpZiAoIWlzRmluaXRlKHZhbCkpIHsgcmV0dXJuIF90eXBlc1tzSW5maW5pdHldOyB9IC8vIEZpbml0ZSBjaGVja1xuXHRcdFx0cmV0dXJuIF90eXBlc1tzTnVtYmVyXTsgLy8gZGVmaW5pdGVseSBhIG51bWJlclxuXHRcdH1cblxuXHRcdHJldHVybiBfY2hlY2tNYXBbdHlwZVN0cmluZ107XG5cdH07XG5cblx0dmFyIF9jb252ZXJ0Q29uZmlndXJhdGlvblR5cGVzID0gZnVuY3Rpb24oYXJncykge1xuXHRcdHZhciBwYXJhbWV0ZXJzID0gW10sXG5cdFx0XHRpZHggPSAwLCBsZW5ndGggPSBhcmdzLmxlbmd0aCxcblx0XHRcdGNvbmZpZ0l0ZW07XG5cdFx0Zm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcblx0XHRcdGNvbmZpZ0l0ZW0gPSBhcmdzW2lkeF07XG5cdFx0XHRwYXJhbWV0ZXJzLnB1c2goXG5cdFx0XHRcdChjb25maWdJdGVtIGluc3RhbmNlb2YgQ3VzdG9tKSA/IGNvbmZpZ0l0ZW0gOiBfZ2V0Q29uZmlndXJhdGlvblR5cGUoY29uZmlnSXRlbSlcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJhbWV0ZXJzO1xuXHR9O1xuXG5cdHZhciBfY29udmVydENvbmZpZ3VyYXRpb25NYXAgPSBmdW5jdGlvbihtYXApIHtcblx0XHR2YXIgcGFyYW1ldGVycyA9IHt9LFxuXHRcdFx0a2V5LCBjb25maWdJdGVtO1xuXHRcdGZvciAoa2V5IGluIG1hcCkge1xuXHRcdFx0Y29uZmlnSXRlbSA9IG1hcFtrZXldO1xuXHRcdFx0cGFyYW1ldGVyc1trZXldID0gKGNvbmZpZ0l0ZW0gaW5zdGFuY2VvZiBDdXN0b20pID8gY29uZmlnSXRlbSA6IF9nZXRDb25maWd1cmF0aW9uVHlwZShjb25maWdJdGVtKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcmFtZXRlcnM7XG5cdH07XG5cblx0dmFyIF9jb252ZXJ0UGFyYW1ldGVyc1R5cGVzID0gZnVuY3Rpb24oYXJncykge1xuXHRcdHZhciBwYXJhbWV0ZXJzID0gW10sXG5cdFx0XHRpZHggPSAwLCBsZW5ndGggPSBhcmdzLmxlbmd0aDtcblx0XHRmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xuXHRcdFx0cGFyYW1ldGVycy5wdXNoKF9nZXRQYXJhbWV0ZXJUeXBlKGFyZ3NbaWR4XSkpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyYW1ldGVycztcblx0fTtcblxuXHR2YXIgX2RvZXNNYXBNYXRjaEFyZ3NUeXBlcyA9IGZ1bmN0aW9uKG1hcCwgYXJnVHlwZXMsIGFyZ3MpIHtcblx0XHR2YXIgbWFwTGVuZ3RoID0gbWFwLmxlbmd0aCxcblx0XHRcdGFyZ0xlbmd0aCA9IGFyZ1R5cGVzLmxlbmd0aDtcblxuXHRcdGlmIChtYXBMZW5ndGggPT09IDAgJiYgYXJnTGVuZ3RoID09PSAwKSB7IHJldHVybiBUUlVFOyB9XG5cdFx0aWYgKG1hcExlbmd0aCAhPT0gYXJnTGVuZ3RoKSB7IHJldHVybiBGQUxTRTsgfVxuXG5cdFx0dmFyIGlkeCA9IDAsXG5cdFx0XHRtYXBJdGVtO1xuXHRcdGZvciAoOyBpZHggPCBhcmdMZW5ndGg7IGlkeCsrKSB7XG5cdFx0XHRtYXBJdGVtID0gbWFwW2lkeF07XG5cblx0XHRcdGlmIChtYXBJdGVtIGluc3RhbmNlb2YgQ3VzdG9tKSB7XG5cdFx0XHRcdGlmIChtYXBJdGVtLmNoZWNrKGFyZ3NbaWR4XSkpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gRkFMU0U7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhcmdUeXBlc1tpZHhdICE9PSBtYXBJdGVtKSB7XG5cdFx0XHRcdHJldHVybiBGQUxTRTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gVFJVRTtcblx0fTtcblxuXHR2YXIgX2dldEFyZ3VtZW50TWF0Y2ggPSBmdW5jdGlvbihtYXBwaW5ncywgYXJncykge1xuXHRcdGlmICghbWFwcGluZ3MpIHsgcmV0dXJuOyB9XG5cblx0XHR2YXIgYXJnVHlwZXMgPSBfY29udmVydFBhcmFtZXRlcnNUeXBlcyhhcmdzKSxcblx0XHRcdGlkeCA9IDAsIGxlbmd0aCA9IG1hcHBpbmdzLmxlbmd0aDtcblx0XHRmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xuXHRcdFx0aWYgKF9kb2VzTWFwTWF0Y2hBcmdzVHlwZXMobWFwcGluZ3NbaWR4XS5wYXJhbXMsIGFyZ1R5cGVzLCBhcmdzKSkge1xuXHRcdFx0XHRyZXR1cm4gbWFwcGluZ3NbaWR4XTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0dmFyIF9nZXRMZW5ndGhNYXRjaCA9IGZ1bmN0aW9uKG1hcHBpbmdzLCBhcmdzKSB7XG5cdFx0aWYgKCFtYXBwaW5ncykgeyByZXR1cm47IH1cblxuXHRcdHZhciBhcmdMZW5ndGggPSBhcmdzLmxlbmd0aCxcblx0XHRcdGlkeCA9IDAsIGxlbmd0aCA9IG1hcHBpbmdzLmxlbmd0aDtcblx0XHRmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xuXHRcdFx0aWYgKG1hcHBpbmdzW2lkeF0ubGVuZ3RoID09PSBhcmdMZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIG1hcHBpbmdzW2lkeF07XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBfbWF0Y2hBbnkgPSBmdW5jdGlvbihhcmdzLCB2YWwpIHtcblx0XHR2YXIgdHlwZSA9IF9nZXRQYXJhbWV0ZXJUeXBlKHZhbCksXG5cdFx0XHRpZHggPSBhcmdzLmxlbmd0aCxcblx0XHRcdG1hcEl0ZW07XG5cblx0XHR3aGlsZSAoaWR4LS0pIHtcblx0XHRcdG1hcEl0ZW0gPSBhcmdzW2lkeF07XG5cblx0XHRcdGlmIChtYXBJdGVtIGluc3RhbmNlb2YgQ3VzdG9tKSB7XG5cdFx0XHRcdGlmIChtYXBJdGVtLmNoZWNrKHZhbCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gVFJVRTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGFyZ3NbaWR4XSA9PT0gdHlwZSkge1xuXHRcdFx0XHRyZXR1cm4gVFJVRTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gRkFMU0U7XG5cdH07XG5cblx0dmFyIF9tYXRjaE1hcCA9IGZ1bmN0aW9uKGNvbmZpZywgbWFwKSB7XG5cdFx0dmFyIGtleSwgY29uZmlnSXRlbSwgbWFwSXRlbTtcblx0XHRmb3IgKGtleSBpbiBjb25maWcpIHtcblx0XHRcdGNvbmZpZ0l0ZW0gPSBjb25maWdba2V5XTtcblx0XHRcdG1hcEl0ZW0gPSBtYXBba2V5XTtcblxuXHRcdFx0aWYgKGNvbmZpZ0l0ZW0gaW5zdGFuY2VvZiBDdXN0b20pIHtcblx0XHRcdFx0aWYgKCFjb25maWdJdGVtLmNoZWNrKG1hcEl0ZW0pKSB7XG5cdFx0XHRcdFx0cmV0dXJuIEZBTFNFO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY29uZmlnSXRlbSAhPT0gX2dldFBhcmFtZXRlclR5cGUobWFwSXRlbSkpIHtcblx0XHRcdFx0cmV0dXJuIEZBTFNFO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBUUlVFO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBDdXN0b20gdHlwZSB0aGF0IHZhbGlkYXRlcyBhIHZhbHVlXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjaGVja1xuXHQgKi9cblx0dmFyIEN1c3RvbSA9IGZ1bmN0aW9uKGNoZWNrKSB7XG5cdFx0dGhpcy5jaGVjayA9IGNoZWNrO1xuXHR9O1xuXG5cdHZhciBvID0ge1xuXHRcdHdpbGQ6IG5ldyBDdXN0b20oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gVFJVRTtcblx0XHR9KSxcblx0XHR0cnV0aHk6IG5ldyBDdXN0b20oZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRyZXR1cm4gISF2YWwgPT09IFRSVUU7XG5cdFx0fSksXG5cdFx0ZmFsc3k6IG5ldyBDdXN0b20oZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRyZXR1cm4gISF2YWwgPT09IEZBTFNFO1xuXHRcdH0pLFxuXHRcdGFueTogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYXJncyA9IF9jb252ZXJ0Q29uZmlndXJhdGlvblR5cGVzKGFyZ3VtZW50cyk7XG5cdFx0XHRyZXR1cm4gbmV3IEN1c3RvbShmdW5jdGlvbih2YWwpIHtcblx0XHRcdFx0cmV0dXJuIF9tYXRjaEFueShhcmdzLCB2YWwpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRleGNlcHQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGFyZ3MgPSBfY29udmVydENvbmZpZ3VyYXRpb25UeXBlcyhhcmd1bWVudHMpO1xuXHRcdFx0cmV0dXJuIG5ldyBDdXN0b20oZnVuY3Rpb24odmFsKSB7XG5cdFx0XHRcdHJldHVybiAhX21hdGNoQW55KGFyZ3MsIHZhbCk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdG1hcDogZnVuY3Rpb24obWFwKSB7XG5cdFx0XHR2YXIgbWFwQ29uZmlnID0gX2NvbnZlcnRDb25maWd1cmF0aW9uTWFwKG1hcCk7XG5cdFx0XHRyZXR1cm4gbmV3IEN1c3RvbShmdW5jdGlvbihtYXApIHtcblx0XHRcdFx0cmV0dXJuIF9tYXRjaE1hcChtYXBDb25maWcsIG1hcCk7XG5cdFx0XHR9KTtcdFxuXHRcdH1cblx0fTtcblxuXHR2YXIgZm4gPSB7XG5cdFx0LyoqXG5cdFx0ICogTWV0aG9kcyBtYXBwZWQgdG8gYXJndW1lbnQgdHlwZXNcblx0XHQgKiBMYXppbHkgaW5zdGFuY2lhdGVkXG5cdFx0ICogQHR5cGUge0FycmF5fSBhcmd1bWVudCBtYXBwaW5nXG5cdFx0ICovXG5cdFx0Ly8gdGhpcy5fbTtcblxuXHRcdC8qKlxuXHRcdCAqIE1ldGhvZHMgbWFwcGVkIHRvIGFyZ3VtZW50IGxlbmd0aHNcblx0XHQgKiBMYXppbHkgaW5zdGFuY2lhdGVkXG5cdFx0ICogQHR5cGUge0FycmF5fSBsZW5ndGggbWFwcGluZ1xuXHRcdCAqL1xuXHRcdC8vIHRoaXMuX2w7XG5cblx0XHQvKipcblx0XHQgKiBBIGZhbGxiYWNrIGZ1bmN0aW9uIGlmIG5vbmVcblx0XHQgKiBvZiB0aGUgY3JpdGVyaWEgbWF0Y2ggb24gYSBjYWxsXG5cdFx0ICogQHR5cGUge0Z1bmN0aW9ufVxuXHRcdCAqL1xuXHRcdC8vIHRoaXMuX2Y7XG5cblx0XHRtYXA6IGZ1bmN0aW9uKG1hcCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1c2U6IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0XHRcdHZhciBhcmdNYXBwaW5ncyA9IHNlbGYuX20gfHwgKHNlbGYuX20gPSBbXSk7XG5cdFx0XHRcdFx0YXJnTWFwcGluZ3MucHVzaCh7XG5cdFx0XHRcdFx0XHRwYXJhbXM6IFtvLm1hcChtYXApXSxcblx0XHRcdFx0XHRcdG1ldGhvZDogbWV0aG9kXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmV0dXJuIHNlbGY7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdGFyZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzLFxuXHRcdFx0XHRhcmdzID0gYXJndW1lbnRzO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1c2U6IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0XHRcdHZhciBhcmdNYXBwaW5ncyA9IHNlbGYuX20gfHwgKHNlbGYuX20gPSBbXSk7XG5cdFx0XHRcdFx0YXJnTWFwcGluZ3MucHVzaCh7XG5cdFx0XHRcdFx0XHRwYXJhbXM6IF9jb252ZXJ0Q29uZmlndXJhdGlvblR5cGVzKGFyZ3MpLFxuXHRcdFx0XHRcdFx0bWV0aG9kOiBtZXRob2Rcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gc2VsZjtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0bGVuOiBmdW5jdGlvbihudW0pIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHVzZTogZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHRcdFx0dmFyIGxlbmd0aE1hcHBpbmdzID0gc2VsZi5fbCB8fCAoc2VsZi5fbCA9IFtdKTtcblx0XHRcdFx0XHRsZW5ndGhNYXBwaW5ncy5wdXNoKHtcblx0XHRcdFx0XHRcdGxlbmd0aDogKG51bSA9PT0gdW5kZWZpbmVkKSA/IG1ldGhvZC5sZW5ndGggOiBudW0sXG5cdFx0XHRcdFx0XHRtZXRob2Q6IG1ldGhvZFxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJldHVybiBzZWxmO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRlcnJvcjogZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR0aGlzLl9lcnIgPSBtZXRob2Q7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXG5cdFx0ZmFsbGJhY2s6IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dGhpcy5fZiA9IG1ldGhvZDtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRjYWxsOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhcmdzID0gX3NsaWNlKGFyZ3VtZW50cyk7XG5cdFx0XHRyZXR1cm4gdGhpcy5fY2FsbChhcmdzLnNoaWZ0KCksIGFyZ3MpO1xuXHRcdH0sXG5cblx0XHRhcHBseTogZnVuY3Rpb24oY29udGV4dCwgYXJncykge1xuXHRcdFx0YXJncyA9IChhcmdzICYmIGFyZ3MuY2FsbGVlKSA/IF9zbGljZShhcmdzKSA6IGFyZ3M7XG5cdFx0XHRyZXR1cm4gdGhpcy5fY2FsbChjb250ZXh0LCBhcmdzKTtcblx0XHR9LFxuXG5cdFx0YmluZDogZnVuY3Rpb24oY29udGV4dCkge1xuXHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gc2VsZi5fY2FsbChjb250ZXh0LCBhcmd1bWVudHMpO1xuXHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0ZXhwb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHNlbGYuX2NhbGwodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdF9jYWxsOiBmdW5jdGlvbihjb250ZXh0LCBhcmdzKSB7XG5cdFx0XHRhcmdzID0gYXJncyB8fCBfbm9vcEFycjtcblxuXHRcdFx0Ly8gQW55IGFyZ3VtZW50IG1hdGNoLCBvZiBjb3Vyc2UsIGFscmVhZHkgbWF0Y2hlc1xuXHRcdFx0Ly8gdGhlIGxlbmd0aCBtYXRjaCwgc28gdGhpcyBzaG91bGQgYmUgZG9uZSBmaXJzdFxuXHRcdFx0dmFyIGFyZ01hdGNoID0gX2dldEFyZ3VtZW50TWF0Y2godGhpcy5fbSwgYXJncyk7XG5cdFx0XHRpZiAoYXJnTWF0Y2gpIHtcblx0XHRcdFx0cmV0dXJuIGFyZ01hdGNoLm1ldGhvZC5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGEgbGVuZ3RoIG1hdGNoXG5cdFx0XHR2YXIgbGVuZ3RoTWF0Y2ggPSBfZ2V0TGVuZ3RoTWF0Y2godGhpcy5fbCwgYXJncyk7XG5cdFx0XHRpZiAobGVuZ3RoTWF0Y2gpIHtcblx0XHRcdFx0cmV0dXJuIGxlbmd0aE1hdGNoLm1ldGhvZC5hcHBseShjb250ZXh0LCBhcmdzKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGEgZmFsbGJhY2tcblx0XHRcdGlmICh0aGlzLl9mKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLl9mLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBFcnJvclxuXHRcdFx0cmV0dXJuIHRoaXMuX2VyciA/IHRoaXMuX2VycihhcmdzKSA6IGFwaS5lcnI7XG5cdFx0fVxuXHR9O1xuXG5cdGZuLmZhaWwgPSBmbi5lcnIgPSBmbi5lcnJvcjtcblx0Zm4uY291bnQgPSBmbi5zaXplID0gZm4ubGVuO1xuXG5cdHZhciBhcGkgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgb3ZlcmxvYWQgPSBmdW5jdGlvbiBvdmVybG9hZCgpIHtcblx0XHRcdHJldHVybiBvdmVybG9hZC5fY2FsbChvdmVybG9hZCwgYXJndW1lbnRzKTtcblx0XHR9O1xuXHRcdHJldHVybiBleHRlbmQob3ZlcmxvYWQsIGZuKTtcblx0fTtcblx0YXBpLm8gPSBvO1xuXHRhcGkuZm4gPSBmbjtcblx0YXBpLmVyciA9IGZ1bmN0aW9uKCkge1xuXHRcdHRocm93ICdvdmVybG9hZCAtIGV4Y2VwdGlvbjogTm8gbWV0aG9kcyBtYXRjaGVkJztcblx0fTtcblx0YXBpLmRlZmluZSA9IGFwaS5kZWZpbmVUeXBlID0gZnVuY3Rpb24obmFtZSwgY2hlY2spIHtcblx0XHR2YXIgY3VzdG9tID0gbmV3IEN1c3RvbShjaGVjayk7XG5cdFx0cmV0dXJuIChvW25hbWVdID0gY3VzdG9tKTtcblx0fTtcblx0YXBpLmRlZmluZVR5cGVzID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0dmFyIGtleTtcblx0XHRmb3IgKGtleSBpbiBvYmopIHtcblx0XHRcdGFwaS5kZWZpbmUoa2V5LCBvYmpba2V5XSk7XG5cdFx0fVxuXHRcdHJldHVybiBhcGk7XG5cdH07XG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicpIHsgLy8gUmVxdWlyZUpTXG4gICAgICAgIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIGFwaTsgfSk7XG4gICAgfSAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHsgLy8gQ29tbW9uSlNcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBhcGk7XG4gICAgfSBlbHNlIHtcblx0XHRyb290Lm92ZXJsb2FkID0gYXBpO1xuXHRcdHJvb3QubyA9IG87XG4gICAgfVxuXG59KHRydWUsIGZhbHNlLCBudWxsKSk7XG4iLCJ2YXIgX05PREVfVFlQRSA9IHJlcXVpcmUoJ25vZGUtdHlwZScpLFxyXG4gICAgX2lkICAgICAgICA9IDAsXHJcbiAgICBfdG9TdHJpbmcgID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcclxuICAgIF9pbmRleE9mICAgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZixcclxuICAgIF9zbGljZSAgICAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UsXHJcbiAgICBfaXNUcnV0aHkgID0gZnVuY3Rpb24oYXJnKSB7IHJldHVybiAhIWFyZzsgfTtcclxuXHJcbnZhciBfID0ge1xyXG5cclxuICAgIG5vb3A6IGZ1bmN0aW9uKCkge30sXHJcblxyXG4gICAgbm93OiBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9LFxyXG5cclxuICAgIHVuaXF1ZUlkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gX2lkKys7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4aXN0czogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG9iaiAhPT0gbnVsbCAmJiBvYmogIT09IHVuZGVmaW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyc2VJbnQ6IGZ1bmN0aW9uKG51bSkge1xyXG4gICAgICAgIHJldHVybiBwYXJzZUludChudW0sIDEwKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29lcmNlVG9OdW06IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBfLmlzTnVtYmVyKHZhbCkgPyAodmFsIHx8IDApIDogLy8gSXRzIGEgbnVtYmVyISB8fCAwIHRvIGF2b2lkIE5hTiAoYXMgTmFOJ3MgYSBudW1iZXIpXHJcbiAgICAgICAgICAgICAgIF8uaXNTdHJpbmcodmFsKSA/IChfLnBhcnNlSW50KHZhbCkgfHwgMCkgOiAvLyBBdm9pZCBOYU4gYWdhaW5cclxuICAgICAgICAgICAgICAgMDsgLy8gRGVmYXVsdCB0byB6ZXJvXHJcbiAgICB9LFxyXG5cclxuICAgIHRvUHg6IGZ1bmN0aW9uKG51bSkge1xyXG4gICAgICAgIHJldHVybiBudW0gKyAncHgnO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0VsZW1lbnQ6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSBfTk9ERV9UWVBFLkVMRU1FTlQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBOT1RFOiBJbiBvbGRlciBicm93c2VycywgdGhpcyB3aWxsIGJlIG92ZXJ3cml0dGVuIGJlbG93XHJcbiAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5LFxyXG5cclxuICAgIGlzQXJyYXlMaWtlOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZiAoIV8uZXhpc3RzKG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc05vZGVMaXN0KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzQXJndW1lbnRzKG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKG9iai5sZW5ndGgpICYmICgnMCcgaW4gb2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG4gICAgaXNOb2RlTGlzdDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuICEhKG9iaiAmJiAoXHJcbiAgICAgICAgICAgIG9iaiBpbnN0YW5jZW9mIE5vZGVMaXN0IHx8XHJcbiAgICAgICAgICAgIG9iaiBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uIHx8XHJcbiAgICAgICAgICAgIG9iai5pdGVtID09PSAnW29iamVjdCBTdGF0aWNOb2RlTGlzdF0nIC8vIElFOCBEaXNwU3RhdGljTm9kZUxpc3Qgb2JqZWN0IHJldHVybmVkIGJ5IHF1ZXJ5U2VsZWN0b3JBbGwoKVxyXG4gICAgICAgICkpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBXaW5kb3cgY2hlY2tcclxuICAgIGlzV2luZG93OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICByZXR1cm4gISEob2JqICYmIG9iaiA9PT0gb2JqLndpbmRvdyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN1cHBvcnRzIElFOCB2aWEgb2JqLmNhbGxlZSAoc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwNjQ1NzY2LzQ2NzU4MilcclxuICAgIGlzQXJndW1lbnRzOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICByZXR1cm4gISEob2JqICYmIChfdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcmd1bWVudHNdJyB8fCBvYmouY2FsbGVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEZsYXR0ZW4gdGhhdCBhbHNvIGNoZWNrcyBpZiB2YWx1ZSBpcyBhIE5vZGVMaXN0XHJcbiAgICBmbGF0dGVuOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc05vZGVMaXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChfLmZsYXR0ZW4odmFsdWUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ29uY2F0IGZsYXQgZm9yIGEgc2luZ2xlIGFycmF5IG9mIGFycmF5c1xyXG4gICAgY29uY2F0RmxhdDogKGZ1bmN0aW9uKGNvbmNhdCkge1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmVzdGVkQXJyYXlzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25jYXQuYXBwbHkoW10sIG5lc3RlZEFycmF5cyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KFtdLmNvbmNhdCkpLFxyXG5cclxuICAgIC8vIE5vLWNvbnRleHQgZXZlcnk7IHN0cmlwIGVhY2goKVxyXG4gICAgZXZlcnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIV8uZXhpc3RzKGFycikpIHsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKCFpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBGYXN0ZXIgZXh0ZW5kOyBzdHJpcCBlYWNoKClcclxuICAgIGV4dGVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIG9iaiAgPSBhcmdzWzBdLFxyXG4gICAgICAgICAgICBpZHggID0gMSxcclxuICAgICAgICAgICAgbGVuICA9IGFyZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIW9iaikgeyByZXR1cm4gb2JqOyB9XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmdzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdGFuZGFyZCBtYXBcclxuICAgIG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBcnJheS1wcmVzZXJ2aW5nIG1hcFxyXG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vcHVzaC1tYXAtdnMtaW5kZXgtcmVwbGFjZW1lbnQtbWFwXHJcbiAgICBmYXN0bWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHRzOyB9XHJcbiAgICAgICAgaXRlcmF0b3IgPSBpdGVyYXRvciB8fCBfaXNUcnV0aHk7XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFycltpZHhdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gcmVzdWx0OyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSkgeyBicmVhazsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICEhcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB0eXBlY2FzdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFyIHI7XHJcbiAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09ICdudWxsJykge1xyXG4gICAgICAgICAgICByID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3RydWUnKSB7XHJcbiAgICAgICAgICAgIHIgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIHIgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJycgfHwgaXNOYU4odmFsKSkge1xyXG4gICAgICAgICAgICAvLyBpc05hTignJykgcmV0dXJucyBmYWxzZVxyXG4gICAgICAgICAgICByID0gdmFsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHBhcnNlRmxvYXQobnVsbCB8fCAnJykgcmV0dXJucyBOYU5cclxuICAgICAgICAgICAgciA9IHBhcnNlRmxvYXQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfc2xpY2UuY2FsbChvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycixcclxuICAgICAgICAgICAgbGVuID0gK29iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkob2JqLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJbaWR4XSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKG9ialtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUFycmF5OiBmdW5jdGlvbihhcmcpIHtcclxuICAgICAgICBpZiAoYXJnID09PSBudWxsIHx8IGFyZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGFyZy5zbGljZSA9PT0gX3NsaWNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcmcuc2xpY2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNBcnJheUxpa2UoYXJnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gX3NsaWNlLmNhbGwoYXJnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFsgYXJnIF07XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIERvZXNuJ3QgYSB2ZXJ5IHNpbXBsZSBjYXNlIG9mIGFycmF5IHRvIG9iamVjdC5cclxuICAgIC8vIFRha2VzIHRoZSB2YWx1ZSBhbmQgc2V0cyBpdCBhcyB0aGUga2V5IGFuZCB0aGUgdmFsdWUuXHJcbiAgICBvYmplY3Q6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBvYmogPSB7fSxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBvYmpbYXJyW2lkeF1dID0gYXJyW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4T2Y6IGZ1bmN0aW9uKGFyciwgaXRlbSkge1xyXG4gICAgICAgIGlmIChhcnIuaW5kZXhPZiA9PT0gX2luZGV4T2YpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFyci5pbmRleE9mKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gX2luZGV4T2YuY2FsbChhcnIsIGl0ZW0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdG9yKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAvLyBBcnJheS1saWtlXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbaWR4XSwgaWR4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQbGFpbiBvYmplY3RcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbcHJvcF0sIHByb3ApID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNTaXplOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEJyZWFrcyBldmVuIG9uIGFycmF5cyB3aXRoIDMgaXRlbXMuIDMgb3IgbW9yZVxyXG4gICAgLy8gaXRlbXMgc3RhcnRzIHNhdmluZyBzcGFjZVxyXG4gICAgc3BsdDogZnVuY3Rpb24oc3RyLCBkZWxpbWl0ZXIpIHtcclxuICAgICAgICByZXR1cm4gc3RyLnNwbGl0KGRlbGltaXRlciB8fCAnfCcpO1xyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzIChvbmx5IGlmIHRoZXkgZG8gTk9UIGFscmVhZHkgZXhpc3QpOiBpc0FycmF5LCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXHJcbnZhciB0eXBlcyA9IF8uc3BsdCgnQXJyYXl8RnVuY3Rpb258U3RyaW5nfE51bWJlcnxEYXRlfFJlZ0V4cCcpLFxyXG4gICAgaWR4ID0gdHlwZXMubGVuZ3RoLFxyXG4gICAgZ2VuZXJhdGVDaGVjayA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIW9iaiAmJiBfdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCAnICsgbmFtZSArICddJztcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIG5hbWU7XHJcbndoaWxlIChpZHgtLSkge1xyXG4gICAgbmFtZSA9IHR5cGVzW2lkeF07XHJcbiAgICBfWydpcycgKyBuYW1lXSA9IF9bJ2lzJyArIG5hbWVdIHx8IGdlbmVyYXRlQ2hlY2sobmFtZSk7XHJcbn1cclxuXHJcbi8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cclxuaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyBPcHRpbWl6ZSBgaXNTdHJpbmdgIGlmIGFwcHJvcHJpYXRlLlxyXG5pZiAodHlwZW9mICgnJykgPT09ICdzdHJpbmcnKSB7XHJcbiAgICBfLmlzU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdzdHJpbmcnO1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHZhbHVlIHJlYWxseSwgcmVhbGx5LCBSRUFMTFkgaXMgYSBmdW5jdGlvbi5cclxuICpcclxuICogV29ya2Fyb3VuZCBmb3IgQ2hha3JhIEpJVCBjb21waWxlciBidWcgaW4gSUUxMSBydW5uaW5nIGluIElFOCBjb21wYXQgbW9kZVxyXG4gKiBpbiB3aGljaCBhIEpJVCdlZCBfLmlzRnVuY3Rpb24oKSByZXR1cm5zIHRydWUgZm9yIGhvc3Qgb2JqZWN0cyAoZS5nLiwgRE9NIG5vZGVzKSxcclxuICogd2hpY2ggaXMgb2J2aW91c2x5IHdyb25nLlxyXG4gKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gSUU4IHN1cHBvcnQgaXMgZHJvcHBlZC5cclxuICpcclxuICogQHBhcmFtIHsqfSB2YWwgQW55IHZhbHVlXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIHZhbHVlIFJFQUxMWSBpcyBhIGZ1bmN0aW9uLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2phc2hrZW5hcy91bmRlcnNjb3JlL2lzc3Vlcy8xNjIxXHJcbiAqIEBzZWUgaHR0cDovL2pzYmluLmNvbS9sYWxvdmFodS8xXHJcbiAqL1xyXG5fLmlzUmVhbGx5RnVuY3Rpb24gPSBmdW5jdGlvbih2YWwpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nIHx8IGZhbHNlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBfO1xyXG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcblxuXHRnZXRYSFIgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gd2luZG93WydYTUxIdHRwUmVxdWVzdCddID9cblx0XHRcdG5ldyB3aW5kb3dbJ1hNTEh0dHBSZXF1ZXN0J10oKSA6XG5cdFx0XHRuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcblx0fSxcblxuXHRnZXRYRFIgPSBmdW5jdGlvbigpIHtcblx0XHQvLyBDT1JTIHdpdGggSUU4Lzlcblx0XHRyZXR1cm4gbmV3IFhEb21haW5SZXF1ZXN0KCk7XG5cdH0sXG5cblx0Ly8gR3Vlc3MgWEhSIHZlcnNpb25cblx0aXNWZXJzaW9uMiA9IChnZXRYSFIoKS5yZXNwb25zZVR5cGUgPT09ICcnKSxcblxuXHRwcm9taXNlICAgICAgICAgPSByZXF1aXJlKCcuL3Byb21pc2UnKSxcblx0cHJlcGFyZUhlYWRlcnMgID0gcmVxdWlyZSgnLi9wcmVwYXJlLWhlYWRlcnMnKSxcblx0cHJlcGFyZVVybCAgICAgID0gcmVxdWlyZSgnLi9wcmVwYXJlLXVybCcpLFxuXHRwcmVwYXJlRGF0YSAgICAgPSByZXF1aXJlKCcuL3ByZXBhcmUtZGF0YScpLFxuXHRyZXNwb25zZUhhbmRsZXIgPSByZXF1aXJlKCcuL3Jlc3BvbnNlLWhhbmRsZXInKSxcblx0cHJvZ3Jlc3NIYW5kbGVyID0gcmVxdWlyZSgnLi9wcm9ncmVzcy1oYW5kbGVyJyk7XG5cbi8vIGRldGVybWluZSBpZiB3ZSdyZSBkZWFsaW5nIHdpdGggYSBjcm9zcyBvcmlnaW4gcmVxdWVzdFxudmFyIGRldGVybWluZUlmQ3Jvc3NPcmlnaW4gPSBmdW5jdGlvbih1cmwpIHtcblx0dmFyIGhvc3QgPSB1cmwubWF0Y2goL1xcL1xcLyguKz8pXFwvLyk7XG5cdHJldHVybiBob3N0ICYmIGhvc3RbMV0gPyBob3N0WzFdICE9PSBsb2NhdGlvbi5ob3N0IDogZmFsc2U7XG59O1xuXG52YXIgZ2V0TWV0aG9kID0gZnVuY3Rpb24obWV0aG9kLCBpc0Nyb3NzT3JpZ2luKSB7XG5cdG1ldGhvZCA9IChtZXRob2QgfHwgJycpLnRvVXBwZXJDYXNlKCk7XG5cdHJldHVybiAoaXNDcm9zc09yaWdpbiAmJiBtZXRob2QgIT09ICdHRVQnICYmIG1ldGhvZCAhPT0gJ1BPU1QnKSA/ICdQT1NUJyA6IG1ldGhvZCB8fCAnR0VUJztcbn07XG5cbnZhciBkZXRlcm1pbmVUeXBlID0gZnVuY3Rpb24oZGF0YSkge1xuXHR2YXIgZGVmID0geGFqYS5kZWZhdWx0LFxuXHRcdGFyckJ1ZmYgPSB3aW5kb3cuQXJyYXlCdWZmZXI7XG5cdGlmICghYXJyQnVmZikgeyByZXR1cm4gZGVmOyB9XG5cblx0aWYgKGRhdGEgaW5zdGFuY2VvZiBhcnJCdWZmICAgICAgICAgICAgfHwgXG5cdFx0ZGF0YSBpbnN0YW5jZW9mIHdpbmRvdy5VaW50MTZBcnJheSB8fCBcblx0XHRkYXRhIGluc3RhbmNlb2Ygd2luZG93LlVpbnQzMkFycmF5IHx8IFxuXHRcdGRhdGEgaW5zdGFuY2VvZiB3aW5kb3cuVWludDhBcnJheSAgfHwgXG5cdFx0ZGF0YSBpbnN0YW5jZW9mIHdpbmRvdy5VaW50OENsYW1wZWRBcnJheSkgeyByZXR1cm4gJ2FycmF5YnVmZmVyJzsgfVxuXG5cdGlmIChkYXRhIGluc3RhbmNlb2Ygd2luZG93LkJsb2IpICAgICAgICB7IHJldHVybiAnYmxvYic7ICAgICB9XG5cdGlmIChkYXRhIGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50KSAgICB7IHJldHVybiAnZG9jdW1lbnQnOyB9XG5cdGlmIChkYXRhIGluc3RhbmNlb2Ygd2luZG93LkZvcm1EYXRhKSAgICB7IHJldHVybiAnZm9ybWRhdGEnOyB9XG5cdHJldHVybiBkZWY7XG59O1xuXG52YXIgcGFyc2VPcHRpb25zID0gZnVuY3Rpb24odXJsUGFyYW0sIGNvbmZpZykge1xuXHRpZiAoXy5pc1N0cmluZyh1cmxQYXJhbSkpIHtcblx0XHR2YXIgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0b3B0aW9ucy51cmwgPSB1cmxQYXJhbTtcblx0XHRyZXR1cm4gb3B0aW9ucztcblx0fVxuXHRyZXR1cm4gdXJsUGFyYW0gfHwge307XG59O1xuXG5mdW5jdGlvbiB4YWphKHVybFBhcmFtLCBjb25maWcpIHtcblx0dmFyIG9wdGlvbnMgICAgICAgICA9IHBhcnNlT3B0aW9ucyh1cmxQYXJhbSwgY29uZmlnKSxcblx0XHRpbml0aWFsVXJsICAgICAgPSBvcHRpb25zLnVybCB8fCAnJyxcblx0XHRpc0Nyb3NzT3JpZ2luICAgPSBvcHRpb25zLmNyb3NzRG9tYWluIHx8IGRldGVybWluZUlmQ3Jvc3NPcmlnaW4oaW5pdGlhbFVybCksXG5cblx0XHR0aW1lclRpbWVvdXQsXG5cdFx0Z2V0VGltZXIgICAgICAgID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aW1lclRpbWVvdXQ7IH0sXG5cdFx0dGltZW91dER1ciAgICAgID0gb3B0aW9ucy50aW1lb3V0ID8gK29wdGlvbnMudGltZW91dCA6IHhhamEudGltZW91dCxcblxuXHRcdGN1cnJlbnRUcmllcyAgICA9IDAsXG5cdFx0cmV0cmllcyAgICAgICAgID0gb3B0aW9ucy5yZXRyaWVzID8gK29wdGlvbnMucmV0cmllcyA6IDAsXG5cblx0XHRhc3luYyAgICAgICAgICAgPSBvcHRpb25zLmFzeW5jICE9PSB1bmRlZmluZWQgPyAhIW9wdGlvbnMuYXN5bmMgOiB0cnVlLFxuXHRcdGNyZWF0ZVhIUiAgICAgICA9IG9wdGlvbnMueGhyID8gb3B0aW9ucy54aHIgOiBpc0Nyb3NzT3JpZ2luICYmIHdpbmRvdy5YRG9tYWluUmVxdWVzdCA/IGdldFhEUiA6IGdldFhIUixcblx0XHRvdmVycmlkZU1pbWUgICAgPSBvcHRpb25zLm1pbWVUeXBlLFxuXHRcdGJlZm9yZVNlbmQgICAgICA9IG9wdGlvbnMuYmVmb3JlIHx8IG9wdGlvbnMuYmVmb3JlU2VuZCxcblx0XHR3aXRoQ3JlZGVudGlhbHMgPSBvcHRpb25zLndpdGhDcmVkZW50aWFscyxcblx0XHRtZXRob2QgICAgICAgICAgPSBnZXRNZXRob2Qob3B0aW9ucy50eXBlIHx8IG9wdGlvbnMubWV0aG9kLCBpc0Nyb3NzT3JpZ2luKSxcblx0XHRpbml0aWFsRGF0YSAgICAgPSBvcHRpb25zLmRhdGEgfHwgbnVsbCxcblx0XHRjYWNoZSAgICAgICAgICAgPSBvcHRpb25zLmNhY2hlID09PSB1bmRlZmluZWQgPyB0cnVlIDogISFvcHRpb25zLmNhY2hlLFxuXHRcdHR5cGUgICAgICAgICAgICA9IG9wdGlvbnMuZGF0YVR5cGUgPyBvcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgOiBkZXRlcm1pbmVUeXBlKGluaXRpYWxEYXRhKSxcblx0XHR1c2VyICAgICAgICAgICAgPSBvcHRpb25zLnVzZXIgfHwgb3B0aW9ucy51c2VybmFtZSB8fCAnJyxcblx0XHRwYXNzd29yZCAgICAgICAgPSBvcHRpb25zLnBhc3N3b3JkIHx8ICcnLFxuXHRcdHN0YXR1c0NvZGUgICAgICA9IG9wdGlvbnMuc3RhdHVzQ29kZSxcblx0XHR4aHJGaWVsZHMgICAgICAgPSBvcHRpb25zLnhockZpZWxkcyxcblx0XHRoZWFkZXJzICAgICAgICAgPSBfLmV4dGVuZCh7ICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyB9LCBvcHRpb25zLmhlYWRlcnMpLFxuXG5cdFx0eGhyO1xuXG5cdC8vIHByZXBhcmUgdGhlIHByb21pc2Vcblx0dmFyIHByb21pc2VzID0gcHJvbWlzZSgpLCBmdW5jO1xuXHRpZiAoKGZ1bmMgPSBvcHRpb25zLnN1Y2Nlc3MpKSAgeyBwcm9taXNlcy5kb25lKGZ1bmMpOyAgICAgfVxuXHRpZiAoKGZ1bmMgPSBvcHRpb25zLmNvbXBsZXRlKSkgeyBwcm9taXNlcy5jb21wbGV0ZShmdW5jKTsgfVxuXHRpZiAoKGZ1bmMgPSBvcHRpb25zLmVycm9yKSkgICAgeyBwcm9taXNlcy5lcnJvcihmdW5jKTsgICAgfVxuXHRpZiAoKGZ1bmMgPSBvcHRpb25zLnByb2dyZXNzKSkgeyBwcm9taXNlcy5wcm9ncmVzcyhmdW5jKTsgfVxuXG5cdHZhciBkYXRhID0gcHJlcGFyZURhdGEoaW5pdGlhbERhdGEsIG1ldGhvZCwgdHlwZSksXG5cdFx0dXJsICA9IHByZXBhcmVVcmwoaW5pdGlhbFVybCwgZGF0YSwgbWV0aG9kLCBjYWNoZSk7XG5cblx0dmFyIHNlbmQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgaXNUeXBlU3VwcG9ydGVkLFxuXHRcdFx0eGhyID0gY3JlYXRlWEhSKCk7XG5cblx0XHR4aHIub25wcm9ncmVzcyA9IHByb2dyZXNzSGFuZGxlcihwcm9taXNlcyk7XG5cblx0XHQvLyBPcGVuIGNvbm5lY3Rpb25cblx0XHRpZiAoaXNDcm9zc09yaWdpbikge1xuXHQgICAgICAgIHhoci5vcGVuKG1ldGhvZCwgdXJsKTtcblx0ICAgIH0gZWxzZSB7XG5cdFx0XHR4aHIub3BlbihtZXRob2QsIHVybCwgYXN5bmMsIHVzZXIsIHBhc3N3b3JkKTtcblx0ICAgIH1cblxuXHRcdGlmIChpc1ZlcnNpb24yICYmIGFzeW5jKSB7XG5cdCAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHdpdGhDcmVkZW50aWFscztcblx0ICAgIH1cblxuXHRcdC8vIElkZW50aWZ5IHN1cHBvcnRlZCBYSFIgdmVyc2lvblxuXHRcdGlmICh0eXBlICYmIGlzVmVyc2lvbjIpIHtcblx0XHRcdF8uYXR0ZW1wdChmdW5jdGlvbigpIHtcblx0XHRcdFx0eGhyLnJlc3BvbnNlVHlwZSA9IHR5cGU7XG5cdFx0XHRcdC8vIERvbid0IHZlcmlmeSBmb3IgJ2RvY3VtZW50JyBzaW5jZSB3ZSdyZSB1c2luZyBhbiBpbnRlcm5hbCByb3V0aW5lXG5cdFx0XHRcdGlzVHlwZVN1cHBvcnRlZCA9ICh4aHIucmVzcG9uc2VUeXBlID09PSB0eXBlICYmIHR5cGUgIT09ICdkb2N1bWVudCcpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dmFyIGhhbmRsZVJlc3BvbnNlID0geGhyLl9oYW5kbGVSZXNwb25zZSA9IHJlc3BvbnNlSGFuZGxlcih4aHIsIHR5cGUsIGlzVHlwZVN1cHBvcnRlZCwgcHJvbWlzZXMsIHVybCwgc3RhdHVzQ29kZSwgZ2V0VGltZXIpO1xuXHRcdGhhbmRsZVJlc3BvbnNlLmJpbmQoaXNDcm9zc09yaWdpbiwgaXNWZXJzaW9uMik7XG5cdFx0XG5cdFx0aWYgKCFpc0Nyb3NzT3JpZ2luKSB7XG5cdFx0XHRwcmVwYXJlSGVhZGVycyh4aHIsIGhlYWRlcnMsIG1ldGhvZCwgdHlwZSk7XG5cdFx0fVxuXG5cdFx0aWYgKG92ZXJyaWRlTWltZSkge1xuXHRcdFx0eGhyLm92ZXJyaWRlTWltZVR5cGUob3ZlcnJpZGVNaW1lKTtcblx0XHR9XG5cblx0XHRpZiAoYmVmb3JlU2VuZCkgeyBiZWZvcmVTZW5kLmNhbGwoeGhyKTsgfVxuXG5cdFx0aWYgKHhockZpZWxkcykge1xuXHRcdFx0dmFyIHhocktleTtcblx0XHRcdGZvciAoeGhyS2V5IGluIHhockZpZWxkcykge1xuXHRcdFx0XHR4aHJbeGhyS2V5XSA9IHhockZpZWxkc1t4aHJLZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChpc0Nyb3NzT3JpZ2luKSB7XG5cdCAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1hEb21haW5SZXF1ZXN0XG5cdCAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgeGhyLnNlbmQoKTsgfSwgMCk7XG5cdCAgICB9IGVsc2Uge1xuXHRcdFx0eGhyLnNlbmQobWV0aG9kICE9PSAnR0VUJyA/IGRhdGEgOiBudWxsKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHhocjtcblx0fTtcblxuXHR4aHIgPSBzZW5kKCk7XG5cblx0Ly8gVGltZW91dC9yZXRyaWVzXG4gICAgdmFyIHRpbWVvdXQgPSBmdW5jdGlvbigpIHtcblx0ICAgIHRpbWVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgeGhyLmFib3J0KCk7XG5cdCAgICAgICAgeGhyLnJlc3BvbnNlID0gJ1RpbWVvdXQgKCcrIHVybCArJyknO1xuXHQgICAgICAgIFxuXHQgICAgICAgIGlmIChjdXJyZW50VHJpZXMgPj0gcmV0cmllcykge1xuXHQgICAgICAgIFx0aWYgKGFzeW5jKSB7IHhoci5faGFuZGxlUmVzcG9uc2UoKTsgfVxuXHQgICAgICAgIFx0cmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGN1cnJlbnRUcmllcysrO1xuXHQgICAgXHR4aHIgPSBzZW5kKCk7XG5cdCAgICBcdHRpbWVvdXQoKTtcblx0XHRcdFxuXHQgICAgfSwgdGltZW91dER1cik7XG5cdH07XG5cblx0dGltZW91dCgpO1xuXG5cdC8vIHJldHVybiB0aGUgcHJvbWlzZXNcblx0cmV0dXJuIHByb21pc2VzLnByb21pc2UoKTtcbn1cblxuLy8gYSBzaG9ydGN1dCBjb21wb3NlciBmb3IgeGFqYSBtZXRob2RzLCBlLmcuIC5nZXQoKSwgLnBvc3QoKVxudmFyIHNob3J0Y3V0ID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdHJldHVybiBmdW5jdGlvbih1cmwsIGRhdGEsIHN1Y2Nlc3MsIGRhdGFUeXBlKSB7XG5cdFx0Ly8gdXJsIGlzbnQgYSBzdHJpbmcsIGFzc3VtZVxuXHRcdC8vIGFuIG9iamVjdCB3YXMgcGFzc2VkIHRvIGFcblx0XHQvLyBzaG9ydGN1dCBtZXRob2Rcblx0XHRpZiAoIV8uaXNTdHJpbmcodXJsKSkge1xuXHRcdFx0cmV0dXJuIHhhamEodXJsKTtcblx0XHR9XG5cblx0XHQvLyBjb21wb3NlIGEgeGFqYSBvYmplY3Qgd2l0aCBcblx0XHQvLyB0aGUgcGFyYW1ldGVycyBwYXNzZWRcblx0XHRpZiAobWV0aG9kID09PSAnR0VUJyAmJiBfLmlzRnVuY3Rpb24oZGF0YSkpIHtcblx0XHRcdHN1Y2Nlc3MgPSBkYXRhO1xuXHRcdFx0ZGF0YSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHhhamEoe1xuXHRcdFx0dXJsOiAgICAgIHVybCxcblx0XHRcdGRhdGE6ICAgICBkYXRhLFxuXHRcdFx0bWV0aG9kOiAgIG1ldGhvZCxcblx0XHRcdHN1Y2Nlc3M6ICBzdWNjZXNzLFxuXHRcdFx0ZGF0YVR5cGU6IGRhdGFUeXBlXG5cdFx0fSk7XG5cdH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IF8uZXh0ZW5kKHhhamEsIHtcblx0dGltZW91dDogIDMwMDAsXG5cdGRlZmF1bHQ6ICAncG9zdCcsXG5cdHhocjI6ICAgICBpc1ZlcnNpb24yLFxuXHRnZXRYSFI6ICAgZ2V0WEhSLFxuXHRhamF4OiAgICAgeGFqYSxcblx0Z2V0OiAgICAgIHNob3J0Y3V0KCdHRVQnKSxcblx0cG9zdDogICAgIHNob3J0Y3V0KCdQT1NUJyksXG5cdHB1dDogICAgICBzaG9ydGN1dCgnUFVUJyksXG5cdGRlbDogICAgICBzaG9ydGN1dCgnREVMRVRFJylcbn0pOyIsInZhciBfID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuLy8gc2VyaWFsaXplRGF0YSB0byBxdWVyeSBzdHJpbmdcclxudmFyIHNlcmlhbGl6ZURhdGEgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0dmFyIHZhbHVlcyA9IFtdLFxyXG5cdFx0a2V5O1xyXG5cdGZvciAoa2V5IGluIGRhdGEpIHtcclxuXHRcdGlmIChkYXRhW2tleV0gIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR2YWx1ZXMucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIChkYXRhW2tleV0ucG9wID8gJ1tdJyA6ICcnKSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChkYXRhW2tleV0pKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIHZhbHVlcy5qb2luKCcmJyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEsIG1ldGhvZCwgdHlwZSkge1xyXG5cdGlmICghXy5leGlzdHMoZGF0YSkpIHtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHJcblx0aWYgKFxyXG5cdFx0dHlwZSA9PT0gJ2FycmF5YnVmZmVyJyB8fFxyXG5cdFx0dHlwZSA9PT0gJ2Zvcm1kYXRhJyAgICB8fFxyXG5cdFx0dHlwZSA9PT0gJ2RvY3VtZW50JyAgICB8fFxyXG5cdFx0dHlwZSA9PT0gJ2ZpbGUnICAgICAgICB8fFxyXG5cdFx0dHlwZSA9PT0gJ2Jsb2InICAgICAgICBcclxuXHQpIHtcclxuXHRcdHJldHVybiBtZXRob2QgPT09ICdHRVQnID8gbnVsbCA6IGRhdGE7IFxyXG5cdH1cclxuXHRcclxuXHRpZiAodHlwZSA9PT0gJ3RleHQnICYmIF8uaXNTdHJpbmcoZGF0YSkpIHtcclxuXHRcdHJldHVybiBkYXRhO1xyXG5cdH1cclxuXHJcblx0aWYgKHR5cGUgPT09ICdqc29uJyAmJiAhXy5pc1N0cmluZyhkYXRhKSkge1xyXG5cdFx0ZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xyXG5cdH1cclxuXHJcblx0aWYgKHR5cGUgPT09ICdwb3N0Jykge1xyXG5cdFx0cmV0dXJuIHNlcmlhbGl6ZURhdGEoZGF0YSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGF0YTtcclxufTsiLCJ2YXIgQUNDRVBUX01BUCA9IHtcclxuXHRcdHRleHQ6ICcqLyonLFxyXG5cdFx0eG1sOiAgJ2FwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwnLFxyXG5cdFx0aHRtbDogJ3RleHQvaHRtbCcsXHJcblx0XHRqc29uOiAnYXBwbGljYXRpb24vanNvbiwgdGV4dC9qYXZhc2NyaXB0JyxcclxuXHRcdGpzOiAgICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0LCB0ZXh0L2phdmFzY3JpcHQnXHJcblx0fSxcclxuXHJcblx0Q09OVEVOVF9NQVAgPSB7XHJcblx0XHR0ZXh0OiAndGV4dC9wbGFpbicsXHJcblx0XHRqc29uOiAnYXBwbGljYXRpb24vanNvbidcclxuXHR9LFxyXG5cclxuXHRyS2V5Rm9ybWF0dGVyID0gLyhefC0pKFteLV0pL2csXHJcblx0dG9VcHBlciA9IGZ1bmN0aW9uKG1hdGNoLCBzdHIxLCBzdHIyKSB7XHJcblx0XHRyZXR1cm4gKHN0cjEgKyBzdHIyKS50b1VwcGVyQ2FzZSgpO1xyXG5cdH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHhociwgaGVhZGVycywgbWV0aG9kLCB0eXBlKSB7XHJcblx0dmFyIGhlYWRlcktleSwgZm9ybWF0dGVkSGVhZGVyS2V5O1xyXG5cdGZvciAoaGVhZGVyS2V5IGluIGhlYWRlcnMpIHtcclxuXHRcdGZvcm1hdHRlZEhlYWRlcktleSA9IGhlYWRlcktleS5yZXBsYWNlKHJLZXlGb3JtYXR0ZXIsIHRvVXBwZXIpO1xyXG5cdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoZm9ybWF0dGVkSGVhZGVyS2V5LCBoZWFkZXJzW2hlYWRlcktleV0pO1xyXG5cdH1cclxuXHJcblx0Ly8gZW5zdXJlIGEgY29udGVudCB0eXBlXHJcblx0aWYgKCFoZWFkZXJzWydDb250ZW50LVR5cGUnXSAmJiBtZXRob2QgIT09ICdHRVQnKSB7XHJcblx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgQ09OVEVOVF9NQVBbdHlwZV0gfHwgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xyXG5cdH1cclxuXHJcblx0aWYgKCFoZWFkZXJzWydDb250ZW50LVR5cGUnXSkge1xyXG5cdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ0FjY2VwdCcsIEFDQ0VQVF9NQVBbdHlwZV0pO1xyXG5cdH1cclxufTsiLCJ2YXIgXyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuXHRySGFzUXVlcnkgPSAvXFw/LztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXJsLCBkYXRhLCBtZXRob2QsIGNhY2hlKSB7XHJcblx0dmFyIHZhcnMgPSAnJztcclxuXHJcblx0Ly8gUHJlcGFyZSBVUkxcclxuXHRpZiAobWV0aG9kID09PSAnR0VUJykge1xyXG5cdFx0dmFycyArPSAhXy5leGlzdHMoZGF0YSkgPyAnJyA6IGRhdGE7XHJcblx0fVxyXG5cclxuXHRpZiAoY2FjaGUgPT09IGZhbHNlICYmIG1ldGhvZCA9PT0gJ0dFVCcpIHtcclxuXHRcdGlmICh2YXJzKSB7IHZhcnMgKz0gJyYnOyB9XHJcblx0XHR2YXJzICs9ICdfPScgKyBfLm5vdygpO1xyXG5cdH1cclxuXHJcblx0aWYgKHZhcnMpIHtcclxuXHRcdHVybCArPSAockhhc1F1ZXJ5LnRlc3QodXJsKSA/ICcmJyA6ICc/JykgKyB2YXJzO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHVybDtcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9taXNlcykge1xyXG5cdHJldHVybiBmdW5jdGlvbihldnQpIHtcclxuXHRcdGlmICghZXZ0Lmxlbmd0aENvbXB1dGFibGUpIHsgcmV0dXJuOyB9XHJcblxyXG5cdFx0Ly8gZXZ0LmxvYWRlZCB0aGUgYnl0ZXMgYnJvd3NlciByZWNlaXZlXHJcblx0XHQvLyBldnQudG90YWwgdGhlIHRvdGFsIGJ5dGVzIHNldGVkIGJ5IHRoZSBoZWFkZXJcclxuXHRcdHZhciBwZXJjZW50Q29tcGxldGUgPSAoZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCkgKiAxMDA7XHJcblx0XHRwcm9taXNlcy50aWNrKHBlcmNlbnRDb21wbGV0ZSk7XHJcblx0fTtcclxufTsiLCJ2YXIgbWFrZUNhbGxzID0gZnVuY3Rpb24oYXJyLCBjb250ZXh0LCBhcmcpIHtcclxuXHRpZiAoIWFycikgeyByZXR1cm47IH1cclxuXHJcblx0dmFyIGlkeCA9IDAsXHJcblx0XHRmbjtcclxuXHR3aGlsZSAoKGZuID0gYXJyW2lkeF0pKSB7XHJcblx0XHRpZHgrKztcclxuXHRcdGZuLmNhbGwoY29udGV4dCwgYXJnKTtcclxuXHR9XHJcblxyXG5cdGFyci5sZW5ndGggPSAwO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0dmFyIHN1Y2Nlc3NTdGFjayxcclxuXHRcdGVycm9yU3RhY2ssXHJcblx0XHRwcm9ncmVzc1N0YWNrLFxyXG5cdFx0Y29tcGxldGVTdGFjayxcclxuXHJcblx0XHRhcGkgPSB7XHJcblx0XHRcdHRpY2s6IGZ1bmN0aW9uKHBlcmMpIHtcclxuXHRcdFx0XHRtYWtlQ2FsbHMocHJvZ3Jlc3NTdGFjaywgcGVyYywgcGVyYyk7XHJcblx0XHRcdFx0cmV0dXJuIGFwaTtcclxuXHRcdFx0fSxcclxuXHRcdFx0cmVzb2x2ZTogZnVuY3Rpb24oeGhyLCByZXNwb25zZSkge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRtYWtlQ2FsbHMoc3VjY2Vzc1N0YWNrLCB4aHIsIHJlc3BvbnNlKTtcclxuXHRcdFx0XHRcdG1ha2VDYWxscyhjb21wbGV0ZVN0YWNrLCB4aHIpO1xyXG5cdFx0XHRcdH0sIDApO1xyXG5cdFx0XHRcdHJldHVybiBhcGk7XHJcblx0XHRcdH0sXHJcblx0XHRcdHJlamVjdDogZnVuY3Rpb24oeGhyLCByZXNwb25zZSkge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRtYWtlQ2FsbHMoZXJyb3JTdGFjaywgeGhyLCByZXNwb25zZSk7XHJcblx0XHRcdFx0XHRtYWtlQ2FsbHMoY29tcGxldGVTdGFjaywgeGhyKTtcclxuXHRcdFx0XHR9LCAwKTtcclxuXHRcdFx0XHRyZXR1cm4gYXBpO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cHJvbWlzZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHAgPSB7XHJcblx0XHRcdFx0XHR0aGVuOiBmdW5jdGlvbihmbiwgZXJyKSB7XHJcblx0XHRcdFx0XHRcdHN1Y2Nlc3NTdGFjayA9IHN1Y2Nlc3NTdGFjayB8fCBbXTtcclxuXHRcdFx0XHRcdFx0c3VjY2Vzc1N0YWNrLnB1c2goZm4pO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGVycikgeyBwLmNhdGNoKGVycik7IH1cclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdHJldHVybiBwO1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGNhdGNoOiBmdW5jdGlvbihmbikge1xyXG5cdFx0XHRcdFx0XHRlcnJvclN0YWNrID0gZXJyb3JTdGFjayB8fCBbXTtcclxuXHRcdFx0XHRcdFx0ZXJyb3JTdGFjay5wdXNoKGZuKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHA7XHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0ZmluYWxseTogZnVuY3Rpb24oZm4pIHtcclxuXHRcdFx0XHRcdFx0Y29tcGxldGVTdGFjayA9IGNvbXBsZXRlU3RhY2sgfHwgW107XHJcblx0XHRcdFx0XHRcdGNvbXBsZXRlU3RhY2sucHVzaChmbik7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwO1xyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdHByb2dyZXNzOiBmdW5jdGlvbihmbikge1xyXG5cdFx0XHRcdFx0XHRwcm9ncmVzc1N0YWNrID0gcHJvZ3Jlc3NTdGFjayB8fCBbXTtcclxuXHRcdFx0XHRcdFx0cHJvZ3Jlc3NTdGFjay5wdXNoKGZuKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHA7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHJcblx0XHRcdFx0Ly8ganF1ZXJ5IG1ldGhvZHM6IGRvbmUsIGZhaWwsIGFsd2F5c1xyXG5cdFx0XHRcdHAuZG9uZSAgID0gcC50aGVuO1xyXG5cdFx0XHRcdHAuZmFpbCAgID0gcC5jYXRjaDtcclxuXHRcdFx0XHRwLmFsd2F5cyA9IHAuZmluYWxseTtcclxuXHJcblx0XHRcdFx0cmV0dXJuIHA7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdHJldHVybiBhcGk7XHJcbn07IiwiLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwNDY5NzIvbXNpZS1yZXR1cm5zLXN0YXR1cy1jb2RlLW9mLTEyMjMtZm9yLWFqYXgtcmVxdWVzdFxyXG52YXIgclZlcmlmeVN0YXR1cyA9IC9eMnwxMjIzLztcclxuXHJcbnZhciBhdHRlbXB0T3JUaHJvdyA9IGZ1bmN0aW9uKGZuKSB7XHJcblx0dHJ5IHtcclxuXHRcdHJldHVybiBmbigpO1xyXG5cdH0gY2F0Y2ggKGUpIHtcclxuXHRcdHRocm93IGUubWVzc2FnZTtcclxuXHR9XHJcbn07XHJcblxyXG52YXIgYXR0ZW1wdFhNTCA9IGZ1bmN0aW9uKGZuKSB7XHJcblx0dmFyIHJlc3BvbnNlO1xyXG5cdHRyeSB7XHJcblx0XHRyZXNwb25zZSA9IGZuKCk7XHJcblx0fSBjYXRjaCAoZSkge31cclxuXHRpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5kb2N1bWVudEVsZW1lbnQgfHwgcmVzcG9uc2UuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3BhcnNlcmVycm9yJykubGVuZ3RoKSB7XHJcblx0XHR0aHJvdyAnSW52YWxpZCBYTUwnO1xyXG5cdH1cclxuXHRyZXR1cm4gcmVzcG9uc2U7XHJcbn07XHJcblxyXG52YXIgcGFyc2VEb2N1bWVudCA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblx0dmFyIGZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XHJcbiAgICBmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmcmFtZSk7XHJcbiAgICBmcmFtZS5jb250ZW50RG9jdW1lbnQub3BlbigpO1xyXG4gICAgZnJhbWUuY29udGVudERvY3VtZW50LndyaXRlKHJlc3BvbnNlKTtcclxuICAgIGZyYW1lLmNvbnRlbnREb2N1bWVudC5jbG9zZSgpO1xyXG4gICAgcmVzcG9uc2UgPSBmcmFtZS5jb250ZW50RG9jdW1lbnQ7XHJcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGZyYW1lKTtcclxuICAgIHJldHVybiByZXNwb25zZTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oeGhyLCB0eXBlLCBpc1R5cGVTdXBwb3J0ZWQsIHByb21pc2VzLCB1cmwsIHN0YXR1c0NvZGUsIHRpbWVyKSB7XHJcblxyXG5cdHZhciBoYW5kbGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjbGVhclRpbWVvdXQodGltZXIoKSk7XHJcblx0XHRcclxuXHRcdHZhciByZXNwb25zZTtcclxuXHJcblx0XHQvLyB2ZXJpZnkgc3RhdHVzIGNvZGVcclxuXHRcdGlmICghclZlcmlmeVN0YXR1cy50ZXN0KHhoci5zdGF0dXMpKSB7XHJcblx0XHRcdHJlc3BvbnNlID0gJ1JlcXVlc3QgdG8gXCInKyB1cmwgKydcIiBhYm9ydGVkOiAnKyB4aHIuc3RhdHVzICsgJyAoJysgeGhyLnN0YXR1c1RleHQgKycpJztcclxuXHRcdFx0cHJvbWlzZXMucmVqZWN0KHhociwgcmVzcG9uc2UpO1xyXG5cdFx0XHRpZiAoc3RhdHVzQ29kZSAmJiBzdGF0dXNDb2RlW3hoci5zdGF0dXNdKSB7XHJcblx0XHRcdFx0c3RhdHVzQ29kZVt4aHIuc3RhdHVzXS5jYWxsKHhociwgcmVzcG9uc2UpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNUeXBlU3VwcG9ydGVkICYmIHhoci5yZXNwb25zZSAhPT0gdW5kZWZpbmVkKSB7XHJcblxyXG5cdFx0XHRyZXNwb25zZSA9IHhoci5yZXNwb25zZTtcclxuXHJcblx0XHR9IGVsc2Uge1xyXG5cclxuXHRcdFx0aWYgKHR5cGUgPT09ICdqc29uJykge1xyXG5cdFx0XHRcdHJlc3BvbnNlID0gYXR0ZW1wdE9yVGhyb3coZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gSlNPTi5wYXJzZSh4aHJbJ3Jlc3BvbnNlVGV4dCddKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIGlmICh0eXBlID09PSAneG1sJykge1xyXG5cdFx0XHRcdHJlc3BvbnNlID0gYXR0ZW1wdFhNTChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoeGhyWydyZXNwb25zZVRleHQnXSwgJ3RleHQveG1sJyk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZSA9PT0gJ2RvY3VtZW50Jykge1xyXG5cdFx0XHRcdHJlc3BvbnNlID0gYXR0ZW1wdE9yVGhyb3coZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gcGFyc2VEb2N1bWVudCh4aHIucmVzcG9uc2UpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJlc3BvbnNlID0geGhyWydyZXNwb25zZVRleHQnXTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1cclxuXHJcblx0XHRwcm9taXNlcy5yZXNvbHZlKHhociwgcmVzcG9uc2UpO1xyXG5cdFx0aWYgKHN0YXR1c0NvZGUgJiYgc3RhdHVzQ29kZVt4aHIuc3RhdHVzXSkge1xyXG5cdFx0XHRzdGF0dXNDb2RlW3hoci5zdGF0dXNdLmNhbGwoeGhyLCByZXNwb25zZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xyXG5cdH07XHJcblxyXG5cdC8vIFBsdWcgcmVzcG9uc2UgaGFuZGxlclxyXG5cdGhhbmRsZXIuYmluZCA9IGZ1bmN0aW9uKGlzQ3Jvc3NPcmlnaW4sIGlzVmVyc2lvbjIpIHtcclxuXHRcdGlmIChpc0Nyb3NzT3JpZ2luIHx8IGlzVmVyc2lvbjIpIHtcclxuXHRcdFx0eGhyLm9ubG9hZCA9IGhhbmRsZXI7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSAhPT0gNCkgeyByZXR1cm47IH1cclxuXHRcdFx0aGFuZGxlcigpO1xyXG5cdFx0fTtcclxuXHR9O1xyXG5cclxuXHRyZXR1cm4gaGFuZGxlcjtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGF0dGVtcHQ6IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuKCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgIH0sXHJcbiAgICBpc1N0cmluZzogZnVuY3Rpb24ob2JqKSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZyc7XHJcblx0fSxcclxuXHRpc0Z1bmN0aW9uOiBmdW5jdGlvbihvYmopIHtcclxuXHRcdHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xyXG5cdH0sXHJcblxyXG5cdGV4aXN0czogZnVuY3Rpb24ob2JqKSB7XHJcblx0XHRyZXR1cm4gb2JqICE9PSBudWxsICYmIG9iaiAhPT0gdW5kZWZpbmVkO1xyXG5cdH0sXHJcblxyXG4gICAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXHJcbiAgICBleHRlbmQ6IGZ1bmN0aW9uKGJhc2UpIHtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICAgICAgaWR4ID0gMSwgbGVuID0gYXJncy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3NbaWR4XTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBiYXNlW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBiYXNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3c6IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuICtuZXcgRGF0ZSgpO1xyXG5cdH1cclxufTsiLCJ2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG5kaXYuY3NzVGV4dCAgID0gJ29wYWNpdHk6LjU1JztcclxuZGl2LmlubmVySFRNTCA9ICc8YSBocmVmPVwiL2FcIj5hPC9hPjxidXR0b24+YnV0dG9uPC9idXR0b24+JztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZGl2O1xyXG4iLCIvLyBodHRwOi8vZWpvaG4ub3JnL2Jsb2cvY29tcGFyaW5nLWRvY3VtZW50LXBvc2l0aW9uL1xyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIElERU5USUNBTCAgICAgICAgICAgICAgIDogIDAsXHJcbiAgICBESVNDT05ORUNURUQgICAgICAgICAgICA6ICAxLFxyXG4gICAgUFJFQ0VESU5HICAgICAgICAgICAgICAgOiAgMixcclxuICAgIEZPTExPV0lORyAgICAgICAgICAgICAgIDogIDQsXHJcbiAgICBDT05UQUlOUyAgICAgICAgICAgICAgICA6ICA4LFxyXG4gICAgQ09OVEFJTkVEX0JZICAgICAgICAgICAgOiAxNixcclxuICAgIElNUExFTUVOVEFUSU9OX1NQRUNJRklDIDogMzJcclxufTtcclxuIiwiLy8gRE9DOiBEb2VzIG5vdCBzdXBwb3J0IFwicmVzb2x2ZVdpdGhcIiwgXCJyZWplY3RXaXRoXCIgZXRjLi4uXHJcbi8vIERPQzogRG9lcyBub3Qgc3VwcG9ydCBkZXByZWNhdGVkIG1ldGhvZHMgXCJpc1JlamVjdGVkXCIsIFwiaXNSZXNvbHZlZFwiIGV0Yy4uLlxyXG4gICAgLyoqXHJcbiAgICAgKiBTdGF0dXMgdmFsdWVzLCBkZXRlcm1pbmVzXHJcbiAgICAgKiB3aGF0IHRoZSBwcm9taXNlJ3Mgc3RhdHVzIGlzXHJcbiAgICAgKiBAcmVhZG9ubHlcclxuICAgICAqIEBlbnVtIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XHJcblxyXG52YXIgX0RFRkVSUkVEX1NUQVRVUyA9IHtcclxuICAgICAgICBpZGxlOiAgICAgICAwLFxyXG4gICAgICAgIHByb2dyZXNzZWQ6IDEsXHJcbiAgICAgICAgZmFpbGVkOiAgICAgMixcclxuICAgICAgICBkb25lOiAgICAgICAzXHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsIHZhbHVlcywgdXNlZCB0byBkZXRlcm1pbmVcclxuICAgICAqIHdoYXQga2luZCBvZiBmdW5jdGlvbnMgdG8gY2FsbFxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKiBAZW51bSB7TnVtYmVyfVxyXG4gICAgICogQGFsaWFzIERlZmVycmVkLkNBTExcclxuICAgICAqL1xyXG4gICAgX0RFRkVSUkVEX0NBTEwgPSB7XHJcbiAgICAgICAgZG9uZTogICAgIDAsXHJcbiAgICAgICAgZmFpbDogICAgIDEsXHJcbiAgICAgICAgYWx3YXlzOiAgIDIsXHJcbiAgICAgICAgcHJvZ3Jlc3M6IDMsXHJcbiAgICAgICAgcGlwZTogICAgIDRcclxuICAgIH0sXHJcblxyXG4gICAgLy8gSW52ZXJ0IF9ERUZFUlJFRF9DQUxMXHJcbiAgICBfREVGRVJSRURfQ0FMTF9OQU1FID0gKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB7fSxcclxuICAgICAgICAgICAga2V5O1xyXG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICByZXN1bHRbb2JqW2tleV1dID0ga2V5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0oX0RFRkVSUkVEX0NBTEwpKSxcclxuXHJcbiAgICBfUFJPTUlTRV9LRVlTID0gXy5zcGx0KCdkb25lfGZhaWx8YWx3YXlzfHByb2dyZXNzfHBpcGV8dGhlbicpO1xyXG5cclxuLyoqXHJcbiAqIEEgbGlnaHR3ZWlnaHQgaW1wbGVtZW50YXRpb24gb2YgcHJvbWlzZXMuXHJcbiAqIEFQSSBiYXNlZCBvbiB7QGxpbmsgaHR0cHM6Ly9hcGkuanF1ZXJ5LmNvbS9wcm9taXNlLyBqUXVlcnkucHJvbWlzZXN9XHJcbiAqIEBjbGFzcyBEZWZlcnJlZFxyXG4gKi9cclxudmFyIERlZmVycmVkID0gZnVuY3Rpb24oYmVmb3JlU3RhcnQpIHtcclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBEZWZlcnJlZCkpIHsgcmV0dXJuIG5ldyBEZWZlcnJlZChiZWZvcmVTdGFydCk7IH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlZ2lzdGVyZWQgZnVuY3Rpb25zIG9yZ2FuaXplZCBieSBfREVGRVJSRURfQ0FMTFxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX2NhbGxzID0ge307XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXJyZW50IHN0YXR1c1xyXG4gICAgICogQHR5cGUge051bWJlcn1cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuX3N0YXR1cyA9IF9ERUZFUlJFRF9TVEFUVVMuaWRsZTtcclxuXHJcbiAgICBpZiAoYmVmb3JlU3RhcnQpIHsgYmVmb3JlU3RhcnQuY2FsbCh0aGlzLCB0aGlzKTsgfVxyXG59O1xyXG5cclxuRGVmZXJyZWQucHJvdG90eXBlID0gLyoqIEBsZW5kcyBEZWZlcnJlZCMgKi8ge1xyXG4gICAgY29uc3RydWN0b3I6IERlZmVycmVkLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXIgYSBkb25lIGNhbGwgdGhhdCBpcyBmaXJlZCBhZnRlciBhIERlZmVycmVkIGlzIHJlc29sdmVkXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZnVuY1xyXG4gICAgICogQHJldHVybiB7RGVmZXJyZWR9XHJcbiAgICAgKi9cclxuICAgIGRvbmU6IGZ1bmN0aW9uKGZ1bmMpIHsgcmV0dXJuIHRoaXMuX3B1c2hDYWxsLmNhbGwodGhpcywgX0RFRkVSUkVEX0NBTEwuZG9uZSwgZnVuYyk7IH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlciBhIGZhaWwgY2FsbCB0aGF0IGlzIGZpcmVkIGFmdGVyIGEgRGVmZXJyZWQgaXMgcmVqZWN0ZWRcclxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmdW5jXHJcbiAgICAgKiBAcmV0dXJuIHtEZWZlcnJlZH1cclxuICAgICAqL1xyXG4gICAgZmFpbDogZnVuY3Rpb24oZnVuYykgeyByZXR1cm4gdGhpcy5fcHVzaENhbGwuY2FsbCh0aGlzLCBfREVGRVJSRURfQ0FMTC5mYWlsLCBmdW5jKTsgfSxcclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXIgYSBjYWxsIHRoYXQgZmlyZXMgYWZ0ZXIgZG9uZSBvciBmYWlsXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZnVuY1xyXG4gICAgICogQHJldHVybiB7RGVmZXJyZWR9XHJcbiAgICAgKi9cclxuICAgIGFsd2F5czogZnVuY3Rpb24oZnVuYykgeyByZXR1cm4gdGhpcy5fcHVzaENhbGwuY2FsbCh0aGlzLCBfREVGRVJSRURfQ0FMTC5hbHdheXMsIGZ1bmMpOyB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlciBhIHByb2dyZXNzIGNhbGwgdGhhdCBpcyBmaXJlZCBhZnRlciBhIERlZmVycmVkIGlzIG5vdGlmaWVkXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZnVuY1xyXG4gICAgICogQHJldHVybiB7RGVmZXJyZWR9XHJcbiAgICAgKi9cclxuICAgIHByb2dyZXNzOiBmdW5jdGlvbihmdW5jKSB7IHJldHVybiB0aGlzLl9wdXNoQ2FsbC5jYWxsKHRoaXMsIF9ERUZFUlJFRF9DQUxMLnByb2dyZXNzLCBmdW5jKTsgfSxcclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXIgYSBwaXBlIGNhbGwgdGhhdCBpcyBmaXJlZCBiZWZvcmUgZG9uZSBvciBmYWlsIGFuZCB3aG9zZSByZXR1cm4gdmFsdWVcclxuICAgICAqIGlzIHBhc3NlZCB0byB0aGUgbmV4dCBwaXBlL2RvbmUvZmFpbCBjYWxsXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZnVuY1xyXG4gICAgICogQHJldHVybiB7RGVmZXJyZWR9XHJcbiAgICAgKi9cclxuICAgIHBpcGU6IGZ1bmN0aW9uKGZ1bmMpIHsgcmV0dXJuIHRoaXMuX3B1c2hDYWxsLmNhbGwodGhpcywgX0RFRkVSUkVEX0NBTEwucGlwZSwgZnVuYyk7IH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcm94eSB0byBkb25lLCBmYWlsLCBwcm9ncmVzc1xyXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGRvbmVcclxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmYWlsXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gcHJvZ3Jlc3NcclxuICAgICAqIEByZXR1cm4ge0RlZmVycmVkfVxyXG4gICAgICovXHJcbiAgICB0aGVuOiBmdW5jdGlvbihkb25lLCBmYWlsLCBwcm9ncmVzcykge1xyXG4gICAgICAgIGlmIChkb25lKSB7IHRoaXMuZG9uZShkb25lKTsgfVxyXG4gICAgICAgIGlmIChmYWlsKSB7IHRoaXMuZmFpbChmYWlsKTsgfVxyXG4gICAgICAgIGlmIChwcm9ncmVzcykgeyB0aGlzLnByb2dyZXNzKHByb2dyZXNzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBwcm90ZWN0ZWQgcHJvbWlzZSBvYmplY3QgdGhhdFxyXG4gICAgICogY2Fubm90IGJlIHJlc29sdmVkL3JlamVjdGVkLCBvbmx5IHN1YnNjcmliZWQgdG9cclxuICAgICAqIEBwYXJhbSAge09iamVjdH0gW29ial1cclxuICAgICAqIEByZXR1cm4ge09iamVjdH0gcHJvbWlzZVxyXG4gICAgICovXHJcbiAgICAvLyBET0M6IE5vIFwidHlwZVwiIHBhc3NlZCBhcyB3ZSBhcmUgbm90IHN1cHBvcnRpbmcgXCJmeFwiXHJcbiAgICBwcm9taXNlOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IG9iaiB8fCB7fTtcclxuXHJcbiAgICAgICAgdmFyIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gX1BST01JU0VfS0VZUy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAga2V5ID0gX1BST01JU0VfS0VZU1tpZHhdO1xyXG4gICAgICAgICAgICByZXN1bHRba2V5XSA9IHNlbGZba2V5XS5iaW5kKHNlbGYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2VlOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vZGVmZXJyZWQuc3RhdGUvXHJcbiAgICBzdGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gX0RFRkVSUkVEX1NUQVRVUy5pZGxlIHx8IHRoaXMuX3N0YXR1cyA9PT0gX0RFRkVSUkVEX1NUQVRVUy5wcm9ncmVzc2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncGVuZGluZyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSBfREVGRVJSRURfU1RBVFVTLmZhaWxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JlamVjdGVkJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IF9ERUZFUlJFRF9TVEFUVVMuZG9uZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3Jlc29sdmVkJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHVzaGVzIGEgZnVuY3Rpb24gaW50byBhIGNhbGwgYXJyYXkgYnkgdHlwZVxyXG4gICAgICogQHBhcmFtICB7RGVmZXJyZWQuQ0FMTH0gY2FsbFR5cGVcclxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmdW5jXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfcHVzaENhbGw6IGZ1bmN0aW9uKGNhbGxUeXBlLCBmdW5jKSB7XHJcbiAgICAgICAgdGhpcy5fZ2V0Q2FsbHMoY2FsbFR5cGUpLnB1c2goZnVuYyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTm90aWZ5IHRoZSBwcm9taXNlIC0gY2FsbHMgYW55IGZ1bmN0aW9ucyBpblxyXG4gICAgICogRGVmZXJyZWQucHJvZ3Jlc3NcclxuICAgICAqIEByZXR1cm4ge0RlZmVycmVkfVxyXG4gICAgICovXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IF9ERUZFUlJFRF9TVEFUVVMucHJvZ3Jlc3NlZDtcclxuXHJcbiAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLl9ydW5QaXBlKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgdGhpcy5fZmlyZShfREVGRVJSRURfQ0FMTC5wcm9ncmVzcywgYXJncykuX2ZpcmUoX0RFRkVSUkVEX0NBTEwuYWx3YXlzLCBhcmdzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVqZWN0IHRoZSBwcm9taXNlIC0gY2FsbHMgYW55IGZ1bmN0aW9ucyBpblxyXG4gICAgICogRGVmZXJyZWQuZmFpbCwgdGhlbiBjYWxscyBhbnkgZnVuY3Rpb25zIGluXHJcbiAgICAgKiBEZWZlcnJlZC5hbHdheXNcclxuICAgICAqIEByZXR1cm4ge0RlZmVycmVkfVxyXG4gICAgICovXHJcbiAgICByZWplY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgY2FsbGVkIGZhaWxlZCBvciBkb25lLCBnbyBubyBmdXJ0aGVyXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gX0RFRkVSUkVEX1NUQVRVUy5mYWlsZWQgfHwgdGhpcy5fc3RhdHVzID09PSBfREVGRVJSRURfU1RBVFVTLmRvbmUpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gX0RFRkVSUkVEX1NUQVRVUy5mYWlsZWQ7XHJcblxyXG4gICAgICAgIC8vIE5ldmVyIHJ1biB0aGUgcGlwZSBvbiBmYWlsLiBTaW1wbHkgZmFpbC5cclxuICAgICAgICAvLyBSdW5uaW5nIHRoZSBwaXBlIGFmdGVyIGFuIHVuZXhwZWN0ZWQgZmFpbHVyZSBtYXkgbGVhZCB0b1xyXG4gICAgICAgIC8vIG1vcmUgZmFpbHVyZXNcclxuICAgICAgICB0aGlzLl9maXJlKF9ERUZFUlJFRF9DQUxMLmZhaWwsIGFyZ3VtZW50cylcclxuICAgICAgICAgICAgLl9maXJlKF9ERUZFUlJFRF9DQUxMLmFsd2F5cywgYXJndW1lbnRzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2xlYW51cCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNvbHZlIHRoZSBwcm9taXNlIC0gY2FsbHMgYW55IGZ1bmN0aW9ucyBpblxyXG4gICAgICogRGVmZXJyZWQuZG9uZSwgdGhlbiBjYWxscyBhbnkgZnVuY3Rpb25zIGluXHJcbiAgICAgKiBEZWZlcnJlZC5hbHdheXNcclxuICAgICAqIEByZXR1cm4ge0RlZmVycmVkfVxyXG4gICAgICovXHJcbiAgICByZXNvbHZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGNhbGxlZCBmYWlsZWQgb3IgZG9uZSwgZ28gbm8gZnVydGhlclxyXG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IF9ERUZFUlJFRF9TVEFUVVMuZmFpbGVkIHx8IHRoaXMuX3N0YXR1cyA9PT0gX0RFRkVSUkVEX1NUQVRVUy5kb25lKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IF9ERUZFUlJFRF9TVEFUVVMuZG9uZTtcclxuXHJcbiAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLl9ydW5QaXBlKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgdGhpcy5fZmlyZShfREVGRVJSRURfQ0FMTC5kb25lLCBhcmdzKVxyXG4gICAgICAgICAgICAuX2ZpcmUoX0RFRkVSUkVEX0NBTEwuYWx3YXlzLCBhcmdzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2xlYW51cCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhIF9ERUZFUlJFRF9DQUxMIHR5cGUgd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnRzXHJcbiAgICAgKiBAcGFyYW0gIHtEZWZlcnJlZC5DQUxMfSBjYWxsVHlwZVxyXG4gICAgICogQHBhcmFtICB7QXJyYXl9IGFyZ3NcclxuICAgICAqIEBwYXJhbSAgeyp9IGNvbnRleHRcclxuICAgICAqIEByZXR1cm4ge0RlZmVycmVkfVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2ZpcmU6IGZ1bmN0aW9uKGNhbGxUeXBlLCBhcmdzLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGNhbGxzID0gdGhpcy5fZ2V0Q2FsbHMoY2FsbFR5cGUpLFxyXG4gICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBjYWxscy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgY2FsbHNbaWR4XS5hcHBseShudWxsLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUnVucyB0aGUgcGlwZSwgY2F0Y2hpbmcgdGhlIHJldHVybiB2YWx1ZVxyXG4gICAgICogdG8gcGFzcyB0byB0aGUgbmV4dCBwaXBlLiBSZXR1cm5zIHRoZVxyXG4gICAgICogYXJndW1lbnRzIHRvIHVzZWQgYnkgdGhlIGNhbGxpbmcgbWV0aG9kXHJcbiAgICAgKiB0byBwcm9jZWVkIHRvIGNhbGwgb3RoZXIgbWV0aG9kcyAoZS5nLiBkb25lL2ZhaWwvYWx3YXlzKVxyXG4gICAgICogQHBhcmFtICB7QXJyYXl9IGFyZ3NcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhcmdzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfcnVuUGlwZTogZnVuY3Rpb24oYXJncykge1xyXG4gICAgICAgIHZhciBwaXBlcyA9IHRoaXMuX2dldENhbGxzKF9ERUZFUlJFRF9DQUxMLnBpcGUpLFxyXG4gICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBwaXBlcy5sZW5ndGgsIHZhbDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YWwgPSBwaXBlc1tpZHhdLmFwcGx5KG51bGwsIGFyZ3MpO1xyXG4gICAgICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHsgYXJncyA9IFt2YWxdOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJncztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYXp5IGdlbmVyYXRlIGFycmF5cyBiYXNlZCBvbiB0eXBlIHRvXHJcbiAgICAgKiBhdm9pZCBjcmVhdGluZyBkaXNwb3NhYmxlIGFycmF5cyBmb3JcclxuICAgICAqIG1ldGhvZHMgdGhhdCBhcmVuJ3QgZ29pbmcgdG8gYmUgdXNlZC9jYWxsZWRcclxuICAgICAqIEBwYXJhbSAge0RlZmVycmVkLkNBTEx9IHR5cGVcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2dldENhbGxzOiBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhbGxzW19ERUZFUlJFRF9DQUxMX05BTUVbdHlwZV1dIHx8ICh0aGlzLl9jYWxsc1tfREVGRVJSRURfQ0FMTF9OQU1FW3R5cGVdXSA9IFtdKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGVhbnVwIHJlZmVyZW5jZXMgdG8gZnVuY3Rpb25zIHN0b3JlZCBpblxyXG4gICAgICogYXJyYXlzIHRoYXQgYXJlIG5vIGxvbmdlciBhYmxlIHRvIGJlIGNhbGxlZFxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2NsZWFudXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX2dldENhbGxzKF9ERUZFUlJFRF9DQUxMLmRvbmUpLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5fZ2V0Q2FsbHMoX0RFRkVSUkVEX0NBTEwuZmFpbCkubGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLl9nZXRDYWxscyhfREVGRVJSRURfQ0FMTC5hbHdheXMpLmxlbmd0aCA9IDA7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIERlZmVycmVkOiBEZWZlcnJlZCxcclxuICAgIFNUQVRVUzogX0RFRkVSUkVEX1NUQVRVUyxcclxuICAgIENBTEw6IF9ERUZFUlJFRF9DQUxMLFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICBEZWZlcnJlZDogRGVmZXJyZWRcclxuICAgIH1cclxufTsiLCJ2YXIgXyAgICAgICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG5cclxuICAgIF9kZWZlck9iaiA9IHJlcXVpcmUoJy4vRGVmZXJyZWQnKSxcclxuICAgIF9EZWZlcnJlZCAgPSBfZGVmZXJPYmouRGVmZXJyZWQsXHJcbiAgICBfQ0FMTCAgICAgPSBfZGVmZXJPYmouQ0FMTCxcclxuICAgIF9TVEFUVVMgICA9IF9kZWZlck9iai5TVEFUVVM7XHJcblxyXG4vKipcclxuICogVGhlIHdoZW4gb2JqZWN0LiBJdCdzIG5vdCBleHBvc2VkIHRvIHRoZSB1c2VyLFxyXG4gKiB0aGV5IG9ubHkgc2VlIGEgcHJvbWlzZSAod2l0aCBhIC50aGVuKCkgbWV0aG9kKSxcclxuICogYnV0IGFsbCB0aGUgbWFnaWMgaGFwcGVucyBoZXJlXHJcbiAqL1xyXG52YXIgV2hlbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTdG9yZSBvdXIgcHJvbWlzZVxyXG4gICAgICogQHR5cGUge0RlZmVycmVkfVxyXG4gICAgICovXHJcbiAgICB0aGlzLl9kID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFN0b3JlIHRoZSBkZWZlcnJlZCBiZWluZyBsaXN0ZW5lZCB0b1xyXG4gICAgICogQHR5cGUge0FycmF5LjxEZWZlcnJlZD59XHJcbiAgICAgKi9cclxuICAgIHRoaXMuX2V2ZW50cyA9IFtdO1xyXG59O1xyXG5cclxuV2hlbi5wcm90b3R5cGUgPSB7XHJcbiAgICBjb25zdHJ1Y3RvcjogV2hlbixcclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCBieSB0aGUgcHVibGljIHdoZW4gZnVuY3Rpb24gdG8gaW5pdGlhbGl6ZVxyXG4gICAgICogdGhlIHdoZW4gb2JqZWN0XHJcbiAgICAgKiBAcmV0dXJuIHtEZWZlcnJlZH1cclxuICAgICAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gXy5pc0FycmF5KGFyZ3VtZW50c1swXSkgPyBhcmd1bWVudHNbMF0gOiBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgICB0aGlzLl9zdWJzY3JpYmUoKTtcclxuXHJcbiAgICAgICAgdmFyIGRlZmVycmVkID0gbmV3IF9EZWZlcnJlZCgpO1xyXG4gICAgICAgIHRoaXMuX2QgPSBkZWZlcnJlZDtcclxuICAgICAgICByZXR1cm4gZGVmZXJyZWQ7IC8vIFJldHVybiB0aGUgZGVmZXJyZWQgc28gdGhhdCBpdCBjYW4gYmUgc3Vic2NyaWJlZCB0b1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFN1YnNjcmliZSB0byB0aGUgZGVmZXJyZWQgcGFzc2VkIGFuZCByZWFjdFxyXG4gICAgICogd2hlbiB0aGV5IGZpcmUgZXZlbnRzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfc3Vic2NyaWJlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgY2hlY2sgPSBfLmJpbmQodGhpcy5fY2hlY2tTdGF0dXMsIHRoaXMpLFxyXG4gICAgICAgICAgICBmaXJlUHJvZ3Jlc3MgPSBfLmJpbmQodGhpcy5fZmlyZVByb2dyZXNzLCB0aGlzKSxcclxuICAgICAgICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzLFxyXG4gICAgICAgICAgICBpZHggPSBldmVudHMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBldmVudHNbaWR4XS5kb25lKGNoZWNrKS5mYWlsKGNoZWNrKS5wcm9ncmVzcyhmaXJlUHJvZ3Jlc3MpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayB0aGUgc3RhdHVzIG9mIGFsbCBkZWZlcnJlZCB3aGVuXHJcbiAgICAgKiBhbnkgb25lIHByb21pc2UgZmlyZXMgYW4gZXZlbnRcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9jaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cywgZXZ0LFxyXG4gICAgICAgICAgICB0b3RhbCA9IGV2ZW50cy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGRvbmUgPSAwLCBmYWlsZWQgPSAwLFxyXG4gICAgICAgICAgICBpZHggPSB0b3RhbDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZXZ0ID0gZXZlbnRzW2lkeF07XHJcbiAgICAgICAgICAgIC8vIFdlJ3JlIHdhaXRpbmcgZm9yIGV2ZXJ5dGhpbmcgdG8gY29tcGxldGVcclxuICAgICAgICAgICAgLy8gc28gaWYgdGhlcmUncyBhbiBpdGVtIHdpdGggbm8gc3RhdHVzLCBzdG9wXHJcbiAgICAgICAgICAgIGlmIChldnQuc3RhdHVzKCkgPT09IF9TVEFUVVMuaWRsZSkgICB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICBpZiAoZXZ0LnN0YXR1cygpID09PSBfU1RBVFVTLmRvbmUpICAgeyBkb25lICs9IDE7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGlmIChldnQuc3RhdHVzKCkgPT09IF9TVEFUVVMuZmFpbGVkKSB7IGZhaWxlZCArPSAxOyBjb250aW51ZTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9maXJlKHRvdGFsLCBkb25lLCBmYWlsZWQsIGFyZ3VtZW50cyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmFzZWQgb24gdGhlIHN0YXR1c2VzIG9mIG91ciBkZWZlcnJlZCwgZmlyZSB0aGVcclxuICAgICAqIGFwcHJvcHJpYXRlIGV2ZW50c1xyXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSAgICB0b3RhbCAgdG90YWwgbnVtYmVyIG9mIGRlZmVycmVkXHJcbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgIGRvbmUgICBkZWZlcnJlZCBpbiBhIGRvbmUgc3RhdGVcclxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICAgZmFpbGVkIGRlZmVycmVkIGluIGEgZmFpbGVkIHN0YXRlXHJcbiAgICAgKiBAcGFyYW0gIHtBcmd1bWVudHN9IGFyZ3MgICBhcmd1bWVudHMgdG8gcGFzc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2ZpcmU6IGZ1bmN0aW9uKHRvdGFsLCBkb25lLCBmYWlsZWQsIGFyZ3MpIHtcclxuICAgICAgICB2YXIgZGVmZXJyZWQgPSB0aGlzLl9kOyAvLyBPdXIgZGVmZXJyZWRcclxuXHJcbiAgICAgICAgLy8gSWYgZXZlcnl0aGluZyBjb21wbGV0ZWQsIGNhbGwgZG9uZSAodGhpcyB3aWxsIGNhbGwgYWx3YXlzKVxyXG4gICAgICAgIGlmIChkb25lID09PSB0b3RhbCkgeyByZXR1cm4gZGVmZXJyZWQucmVzb2x2ZS5hcHBseShkZWZlcnJlZCwgYXJncyk7IH1cclxuXHJcbiAgICAgICAgLy8gSWYgZXZlcnl0aGluZyBmYWlsZWQsIGNhbGwgZmFpbCAodGhpcyB3aWxsIGNhbGwgYWx3YXlzKVxyXG4gICAgICAgIGlmIChmYWlsZWQgPT09IHRvdGFsKSB7IHJldHVybiBkZWZlcnJlZC5yZWplY3QuYXBwbHkoZGVmZXJyZWQsIGFyZ3MpOyB9XHJcblxyXG4gICAgICAgIC8vIElmIGV2ZXJ5dGhpbmcgZmlyZWQsIGJ1dCB0aGV5J3JlIG5vdCBhbGwgb25lIHRoaW5nLCB0aGVuIGp1c3QgY2FsbCBhbHdheXMuXHJcbiAgICAgICAgLy8gVGhlIG9ubHkgd2F5IHRvIGRvIHRoYXQgd2l0aG91dCBleHBvc2luZyBhIHB1YmxpYyBmdW5jdGlvbiBpbiBEZWZlcnJlZCBpc1xyXG4gICAgICAgIC8vIHRvIHVzZSB0aGUgcHJpdmF0ZSBfZmlyZSBldmVudFxyXG4gICAgICAgIGlmICgoZG9uZSArIGZhaWxlZCkgPT09IHRvdGFsKSB7IHJldHVybiBkZWZlcnJlZC5fZmlyZShfQ0FMTC5hbHdheXMsIGFyZ3MpOyB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGFuZGxlZCBzZXBhcmF0ZWx5IGZyb20gZmlyZSBiZWNhdXNlIHdlIHdhbnQgdG8gdHJpZ2dlclxyXG4gICAgICogYW55dGltZSBhbnkgb2YgdGhlIGRlZmVycmVkIHByb2dyZXNzIHJlZ2FyZGxlc3Mgb2Ygc2F0ZVxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2ZpcmVQcm9ncmVzczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRlZmVycmVkID0gdGhpcy5fZDtcclxuICAgICAgICBkZWZlcnJlZC5ub3RpZnkuYXBwbHkoZGVmZXJyZWQsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIEQ6IHtcclxuICAgICAgICB3aGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHcgPSBuZXcgV2hlbigpO1xyXG4gICAgICAgICAgICByZXR1cm4gdy5pbml0LmFwcGx5KHcsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsInZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG5cclxuICAgIF9jYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJyksXHJcblxyXG4gICAgX3F1ZXJ5Q2FjaGUgPSBfY2FjaGUoKSxcclxuICAgIF9pc0NhY2hlICAgID0gX2NhY2hlKCksXHJcblxyXG4gICAgU2VsZWN0b3IgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvU2VsZWN0b3InKSxcclxuICAgIFF1ZXJ5ID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL1F1ZXJ5JyksXHJcbiAgICBJcyA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9JcycpLFxyXG5cclxuICAgIF9wYXJzZSA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UnKSxcclxuICAgIF9ub3JtYWxpemUgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZScpO1xyXG5cclxudmFyIF90b1NlbGVjdG9ycyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgLy8gU2VsZWN0b3JzIHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgLy8gTm90IHJldHVybmluZyBlYXJseSBvciBkb2luZyBleHRyYSBjaGVja3MgYXMgdGhpcyB3aWxsXHJcbiAgICAvLyBub29wIG9uIHRoZSBRdWVyeSBhbmQgSXMgbGV2ZWwgYW5kIGlzIHRoZSBleGNlcHRpb25cclxuICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgIHZhciBzZWxlY3RvcnMgPSBfcGFyc2Uuc3VicXVlcmllcyhzdHIpIHx8IFtdO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBlYWNoIG9mIHRoZSBzZWxlY3RvcnMuLi5cclxuICAgIHNlbGVjdG9ycyA9IF8ubWFwKHNlbGVjdG9ycywgX25vcm1hbGl6ZSk7XHJcblxyXG4gICAgLy8gLi4uYW5kIG1hcCB0aGVtIHRvIFNlbGVjdG9yIG9iamVjdHNcclxuICAgIHJldHVybiBfLmZhc3RtYXAoc2VsZWN0b3JzLCBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2VsZWN0b3Ioc2VsZWN0b3IpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHF1ZXJ5OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gX3F1ZXJ5Q2FjaGUuZ2V0T3JTZXQoc3RyLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBRdWVyeShfdG9TZWxlY3RvcnMoc3RyKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBfaXNDYWNoZS5nZXRPclNldChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IElzKF90b1NlbGVjdG9ycyhzdHIpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsInZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xyXG5cclxudmFyIElzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvcnMpIHtcclxuICAgIHRoaXMuX3NlbGVjdG9ycyA9IHNlbGVjdG9ycztcclxufTtcclxuSXMucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gdGhpcy5fc2VsZWN0b3JzLFxyXG4gICAgICAgICAgICBpZHggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yc1tpZHhdLm1hdGNoKGNvbnRleHQpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBfLmFueShhcnIsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKHNlbGYubWF0Y2goZWxlbSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoIXNlbGYubWF0Y2goZWxlbSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsInZhciBRdWVyeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcblxyXG5RdWVyeS5wcm90b3R5cGUgPSB7XHJcbiAgICBleGVjOiBmdW5jdGlvbihhcnIsIGlzTmV3KSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBpc05ldyA/IDEgOiBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgdGhpcy5fZmluZChhcnJbaWR4XSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuICAgIF9maW5kOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBzZWxlY3RvcnMgPSB0aGlzLl9zZWxlY3RvcnMsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBzdHJpbmcgPSByZXF1aXJlKCcuLi8uLi8uLi9zdHJpbmcnKSxcclxuICAgIG92ZXJsb2FkID0gcmVxdWlyZSgnb3ZlcmxvYWQtanMnKSxcclxuICAgIG8gPSBvdmVybG9hZC5vLFxyXG5cclxuICAgIF9JRF9QUkVGSVggPSAnRC11bmlxdWVJZC0nLFxyXG5cclxuICAgIF9HRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBfR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FICAgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnLFxyXG4gICAgX0dFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FID0gJ2dldEVsZW1lbnRzQnlDbGFzc05hbWUnLFxyXG4gICAgX1FVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnLFxyXG5cclxuICAgIF9TVVBQT1JUUyAgPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0cycpLFxyXG4gICAgTk9ERV9UWVBFID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcblxyXG4gICAgX2NhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSxcclxuICAgIF9yZWdleCA9IHJlcXVpcmUoJy4uLy4uLy4uL3JlZ2V4JyksXHJcblxyXG4gICAgX3F1ZXJ5U2VsZWN0b3JDYWNoZSA9IF9jYWNoZSgpLFxyXG5cclxuICAgIF9pc01hdGNoID0gcmVxdWlyZSgnLi4vc2VsZWN0b3Ivc2VsZWN0b3ItbWF0Y2gnKTtcclxuXHJcbnZhciBfZGV0ZXJtaW5lTWV0aG9kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gX3F1ZXJ5U2VsZWN0b3JDYWNoZS5nZXQoc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmIChtZXRob2QpIHsgcmV0dXJuIG1ldGhvZDsgfVxyXG5cclxuICAgICAgICBpZiAoX3JlZ2V4LnNlbGVjdG9yLmlzU3RyaWN0SWQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZCA9IF9HRVRfRUxFTUVOVF9CWV9JRDtcclxuICAgICAgICB9IGVsc2UgaWYgKF9yZWdleC5zZWxlY3Rvci5pc0NsYXNzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBtZXRob2QgPSBfR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChfcmVnZXguc2VsZWN0b3IuaXNUYWcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZCA9IF9HRVRfRUxFTUVOVFNfQllfVEFHX05BTUU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWV0aG9kID0gX1FVRVJZX1NFTEVDVE9SX0FMTDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF9xdWVyeVNlbGVjdG9yQ2FjaGUuc2V0KHNlbGVjdG9yLCBtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9LFxyXG5cclxuICAgIF91bmlxdWVJZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBfSURfUFJFRklYICsgXy51bmlxdWVJZCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZnJvbURvbUFycmF5VG9BcnJheSA9IGZ1bmN0aW9uKGFycmF5TGlrZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBhcnJheUxpa2UubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBhcnJheUxpa2VbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgX3Byb2Nlc3NRdWVyeVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlbGVjdGlvbikge1xyXG4gICAgICAgIC8vIE5vIHNlbGVjdGlvblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTm9kZWxpc3Qgd2l0aG91dCBhIGxlbmd0aFxyXG4gICAgICAgIGlmIChfLmlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIElFOCBEaXNwU3RhdGljTm9kZUxpc3RcclxuICAgICAgICBpZiAoc2VsZWN0aW9uLml0ZW0gJiYgc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkLCByZXR1cm4gaXQgYXMgYW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gXy5pc0VsZW1lbnQoc2VsZWN0aW9uKSB8fCAhc2VsZWN0aW9uLmxlbmd0aCA/IFtzZWxlY3Rpb25dIDogX2Zyb21Eb21BcnJheVRvQXJyYXkoc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NoaWxkT3JTaWJsaW5nUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgLy8gQ2hpbGQgc2VsZWN0IC0gbmVlZHMgc3BlY2lhbCBoZWxwIHNvIHRoYXQgXCI+IGRpdlwiIGRvZXNuJ3QgYnJlYWtcclxuICAgICAgICB2YXIgbWV0aG9kICAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIGlkQXBwbGllZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICBzZWxlY3RvciAgPSBzZWxmLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICBuZXdJZCxcclxuICAgICAgICAgICAgaWQ7XHJcblxyXG4gICAgICAgIGlkID0gY29udGV4dC5pZDtcclxuICAgICAgICBpZiAoaWQgPT09ICcnIHx8ICFfLmV4aXN0cyhpZCkpIHtcclxuICAgICAgICAgICAgbmV3SWQgPSBfdW5pcXVlSWQoKTtcclxuICAgICAgICAgICAgY29udGV4dC5pZCA9IG5ld0lkO1xyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZWN0b3IgPSBzZWxmLl90YWlsb3JDaGlsZFNlbGVjdG9yKGlkQXBwbGllZCA/IG5ld0lkIDogaWQsIHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGRvY3VtZW50W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBpZiAoaWRBcHBsaWVkKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jbGFzc1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIGlmIChfU1VQUE9SVFMuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSkge1xyXG4gICAgICAgICAgICAvLyBDbGFzcyBzZWFyY2gsIGRvbid0IHN0YXJ0IHdpdGggJy4nXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1ldGhvZCA9IF9RVUVSWV9TRUxFQ1RPUl9BTEw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIF9wcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2lkUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3Rvci5zdWJzdHIoMSksXHJcbiAgICAgICAgICAgIHNlbGVjdGlvbiA9IGRvY3VtZW50W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICByZXR1cm4gX3Byb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZGVmYXVsdFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W3NlbGYubWV0aG9kXShzZWxmLnNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gX3Byb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZGV0ZXJtaW5lUXVlcnkgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgICAgICAgaWYgKHNlbGYuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gX2NoaWxkT3JTaWJsaW5nUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0NsYXNzU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfY2xhc3NRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmlzSWRTZWFyY2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9pZFF1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF9kZWZhdWx0UXVlcnk7XHJcbiAgICB9O1xyXG5cclxudmFyIFNlbGVjdG9yID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgc2VsZWN0b3IgICAgICAgICAgICAgICAgPSBzdHJpbmcudHJpbShzdHIpLFxyXG4gICAgICAgIGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgID0gKHNlbGVjdG9yWzBdID09PSAnPicgfHwgc2VsZWN0b3JbMF0gPT09ICcrJyksXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gX1FVRVJZX1NFTEVDVE9SX0FMTCA6IF9kZXRlcm1pbmVNZXRob2Qoc2VsZWN0b3IpO1xyXG5cclxuICAgIHRoaXMuc3RyICAgICAgICAgICAgICAgICAgICA9IHN0cjtcclxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgICAgICAgICA9IHNlbGVjdG9yO1xyXG4gICAgdGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdDtcclxuICAgIHRoaXMuaXNJZFNlYXJjaCAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gX0dFVF9FTEVNRU5UX0JZX0lEO1xyXG4gICAgdGhpcy5pc0NsYXNzU2VhcmNoICAgICAgICAgID0gIXRoaXMuaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IF9HRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRTtcclxuICAgIHRoaXMubWV0aG9kICAgICAgICAgICAgICAgICA9IG1ldGhvZDtcclxufTtcclxuXHJcblNlbGVjdG9yLnByb3RvdHlwZSA9IHtcclxuXHJcbiAgICBfdGFpbG9yQ2hpbGRTZWxlY3RvcjogZnVuY3Rpb24oaWQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuICcjJyArIGlkICsgJyAnICsgc2VsZWN0b3I7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgLy8gTm8gbmVlZWQgdG8gY2hlY2ssIGEgbWF0Y2ggd2lsbCBmYWlsIGlmIGl0J3NcclxuICAgICAgICAvLyBjaGlsZCBvciBzaWJsaW5nXHJcbiAgICAgICAgaWYgKHRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF9pc01hdGNoKGNvbnRleHQsIHRoaXMuc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gX2RldGVybWluZVF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAoIWNvbnRleHQgfHwgY29udGV4dCA9PT0gZG9jdW1lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5KGRvY3VtZW50LCB0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgIC8vIF8uaXNFbGVtZW50KGNvbnRleHQpIHx8IF8uaXNOb2RlTGlzdChjb250ZXh0KSB8fCBfLmlzQ29sbGVjdGlvbihjb250ZXh0KVxyXG4gICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0LCB0aGlzKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VsZWN0b3I7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gRE9DOiBEb2N1bWVudCB0aGVzZSBzZWxlY3RvcnNcclxuXHQnOmNoaWxkLWF0JzogICc6bnRoLWNoaWxkKHgpJyxcclxuXHQnOmNoaWxkLWd0JzogICc6bnRoLWNoaWxkKG4reCknLFxyXG5cdCc6Y2hpbGQtbHQnOiAgJzpudGgtY2hpbGQofm4reCknXHJcbn07XHJcbiIsInZhciBfU1VQUE9SVFMgPSByZXF1aXJlKCcuLi8uLi8uLi9zdXBwb3J0cycpO1xyXG5cclxudmFyIHByb3h5ID0ge1xyXG4gICAgLy8gRE9DOiBEb2N1bWVudCB0aGVzZSBzZWxlY3RvcnNcclxuICAgICc6Y2hpbGQtZXZlbicgOiAnOm50aC1jaGlsZChldmVuKScsXHJcbiAgICAnOmNoaWxkLW9kZCcgIDogJzpudGgtY2hpbGQob2RkKScsXHJcblxyXG4gICAgJzp0ZXh0JyAgICAgICA6ICdbdHlwZT1cInRleHRcIl0nLFxyXG4gICAgJzpwYXNzd29yZCcgICA6ICdbdHlwZT1cInBhc3N3b3JkXCJdJyxcclxuICAgICc6cmFkaW8nICAgICAgOiAnW3R5cGU9XCJyYWRpb1wiXScsXHJcbiAgICAnOmNoZWNrYm94JyAgIDogJ1t0eXBlPVwiY2hlY2tib3hcIl0nLFxyXG4gICAgJzpzdWJtaXQnICAgICA6ICdbdHlwZT1cInN1Ym1pdFwiXScsXHJcbiAgICAnOnJlc2V0JyAgICAgIDogJ1t0eXBlPVwicmVzZXRcIl0nLFxyXG4gICAgJzpidXR0b24nICAgICA6ICdbdHlwZT1cImJ1dHRvblwiXScsXHJcbiAgICAnOmltYWdlJyAgICAgIDogJ1t0eXBlPVwiaW1hZ2VcIl0nLFxyXG4gICAgJzppbnB1dCcgICAgICA6ICdbdHlwZT1cImlucHV0XCJdJyxcclxuICAgICc6ZmlsZScgICAgICAgOiAnW3R5cGU9XCJmaWxlXCJdJyxcclxuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTLzpjaGVja2VkXHJcbiAgICAnOnNlbGVjdGVkJyAgIDogJ1tzZWxlY3RlZD1cInNlbGVjdGVkXCJdJ1xyXG59O1xyXG5cclxuLy8gSUU4XHJcbmlmICghX1NVUFBPUlRTLmRpc2FibGVkU2VsZWN0b3IpIHtcclxuICAgIHByb3h5Wyc6ZGlzYWJsZWQnXSA9ICdbZGlzYWJsZWRdJztcclxuXHJcbiAgICAvLyBET0M6IE5vIGdvb2Qgd2F5IHRvIHBvbHlmaWxsIHRoaXMuXHJcbiAgICAvLyBwcm94eVsnOmVuYWJsZWQnXSAgPSAnOm5vdChbZGlzYWJsZWRdKSc7XHJcbn1cclxuXHJcbi8vIElFOFxyXG5pZiAoIV9TVVBQT1JUUy5jaGVja2VkU2VsZWN0b3IpIHtcclxuICAgIHByb3h5Wyc6Y2hlY2tlZCddICA9ICdbY2hlY2tlZF0nO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByb3h5O1xyXG4iLCJ2YXIgX1NVUFBPUlRTICA9IHJlcXVpcmUoJy4uLy4uLy4uL3N1cHBvcnRzJyksXHJcbiAgICBOT0RFX1RZUEUgPSByZXF1aXJlKCdub2RlLXR5cGUnKSxcclxuXHJcbiAgICBfbWF0Y2hlc1NlbGVjdG9yID0gX1NVUFBPUlRTLm1hdGNoZXNTZWxlY3RvcjtcclxuXHJcbnZhciBtYXRjaGVzO1xyXG5cclxuLy8gSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbmlmIChfbWF0Y2hlc1NlbGVjdG9yKSB7XHJcbiAgICBtYXRjaGVzID0gZnVuY3Rpb24oZWxlbSwgc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkVMRU1FTlQpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBfbWF0Y2hlc1NlbGVjdG9yLmNhbGwoZWxlbSwgc2VsZWN0b3IpO1xyXG4gICAgfTtcclxufVxyXG4vLyBJRThcclxuZWxzZSB7XHJcbiAgICBtYXRjaGVzID0gZnVuY3Rpb24oZWxlbSwgc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkVMRU1FTlQpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHZhciBmcmFnO1xyXG5cclxuICAgICAgICBpZiAoIWVsZW0ucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG5vZGVzID0gKGZyYWcgfHwgZWxlbS5wYXJlbnROb2RlKS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSxcclxuICAgICAgICAgICAgaWR4ID0gbm9kZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVzW2lkeF0gPT09IGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZnJhZykge1xyXG4gICAgICAgICAgICBmcmFnLnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgICBmcmFnID0gbnVsbDsgLy8gcHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUU4XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoZXM7XHJcbiIsInZhciBfU1VQUE9SVFMgICAgICAgICAgID0gcmVxdWlyZSgnLi4vLi4vLi4vc3VwcG9ydHMnKSxcclxuXHJcbiAgICBfQVRUUklCVVRFX1NFTEVDVE9SID0gL1xcW1xccypbXFx3LV0rXFxzKlshJF4qXT8oPzo9XFxzKihbJ1wiXT8pKC4qP1teXFxcXF18W15cXFxcXSopKT9cXDFcXHMqXFxdL2csXHJcbiAgICBfUFNFVURPX1NFTEVDVCAgICAgID0gLyg6W15cXHNcXChcXFspXSspL2csXHJcbiAgICBfQ0FQVFVSRV9TRUxFQ1QgICAgID0gLyg6W15cXHNeKF0rKVxcKChbXlxcKV0rKVxcKS9nLFxyXG5cclxuICAgIF9jYWNoZSAgICAgICAgICAgICAgPSByZXF1aXJlKCdjYWNoZScpLFxyXG4gICAgX3BzZXVkb0NhY2hlICAgICAgICA9IF9jYWNoZSgpLFxyXG5cclxuICAgIF9wcm94eVNlbGVjdG9ycyAgICAgPSByZXF1aXJlKCcuLi9saXN0L3NlbGVjdG9ycy1wcm94eScpLFxyXG4gICAgX2NhcHR1cmVTZWxlY3RvcnMgICA9IHJlcXVpcmUoJy4uL2xpc3Qvc2VsZWN0b3JzLWNhcHR1cmUnKTtcclxuXHJcbnZhciBfZ2V0QXR0cmlidXRlUG9zaXRpb25zID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgcGFpcnMgPSBbXTtcclxuICAgIC8vIE5vdCB1c2luZyByZXR1cm4gdmFsdWUuIFNpbXBseSB1c2luZyBpdCB0byBpdGVyYXRlXHJcbiAgICAvLyB0aHJvdWdoIGFsbCBvZiB0aGUgbWF0Y2hlcyB0byBwb3B1bGF0ZSBtYXRjaCBwb3NpdGlvbnNcclxuICAgIHN0ci5yZXBsYWNlKF9BVFRSSUJVVEVfU0VMRUNUT1IsIGZ1bmN0aW9uKG1hdGNoLCBjYXAxLCBjYXAyLCBwb3NpdGlvbikge1xyXG4gICAgICAgIHBhaXJzLnB1c2goWyBwb3NpdGlvbiwgcG9zaXRpb24gKyBtYXRjaC5sZW5ndGggXSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwYWlycztcclxufTtcclxuXHJcbnZhciBfaXNPdXRzaWRlT2ZBdHRyaWJ1dGUgPSBmdW5jdGlvbihwb3NpdGlvbiwgcG9zaXRpb25zKSB7XHJcbiAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gcG9zaXRpb25zLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgdmFyIHBvcyA9IHBvc2l0aW9uc1tpZHhdO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbiA+IHBvc1swXSAmJiBwb3NpdGlvbiA8IHBvc1sxXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG52YXIgX3BzZXVkb1JlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKF9QU0VVRE9fU0VMRUNULCBmdW5jdGlvbihtYXRjaCwgY2FwLCBwb3NpdGlvbikge1xyXG4gICAgICAgIGlmICghX2lzT3V0c2lkZU9mQXR0cmlidXRlKHBvc2l0aW9uLCBwb3NpdGlvbnMpKSB7IHJldHVybiBtYXRjaDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gX3Byb3h5U2VsZWN0b3JzW21hdGNoXSA/IF9wcm94eVNlbGVjdG9yc1ttYXRjaF0gOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIF9jYXB0dXJlUmVwbGFjZSA9IGZ1bmN0aW9uKHN0ciwgcG9zaXRpb25zKSB7XHJcbiAgICB2YXIgY2FwdHVyZVNlbGVjdG9yO1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKF9DQVBUVVJFX1NFTEVDVCwgZnVuY3Rpb24obWF0Y2gsIGNhcCwgdmFsdWUsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFfaXNPdXRzaWRlT2ZBdHRyaWJ1dGUocG9zaXRpb24sIHBvc2l0aW9ucykpIHsgcmV0dXJuIG1hdGNoOyB9XHJcblxyXG4gICAgICAgIHJldHVybiAoY2FwdHVyZVNlbGVjdG9yID0gX2NhcHR1cmVTZWxlY3RvcnNbY2FwXSkgPyBjYXB0dXJlU2VsZWN0b3IucmVwbGFjZSgneCcsIHZhbHVlKSA6IG1hdGNoO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgX2Jvb2xlYW5TZWxlY3RvclJlcGxhY2UgPSBfU1VQUE9SVFMuc2VsZWN0ZWRTZWxlY3RvclxyXG4gICAgLy8gSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgPyBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0cjsgfVxyXG4gICAgLy8gSUU4LTlcclxuICAgIDogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9ucyA9IF9nZXRBdHRyaWJ1dGVQb3NpdGlvbnMoc3RyKSxcclxuICAgICAgICAgICAgaWR4ID0gcG9zaXRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgcG9zLFxyXG4gICAgICAgICAgICBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIHBvcyA9IHBvc2l0aW9uc1tpZHhdO1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHN0ci5zdWJzdHJpbmcocG9zWzBdLCBwb3NbMV0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdbc2VsZWN0ZWRdJykge1xyXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBwb3NbMF0pICsgJ1tzZWxlY3RlZD1cInNlbGVjdGVkXCJdJyArIHN0ci5zdWJzdHJpbmcocG9zWzFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgcmV0dXJuIF9wc2V1ZG9DYWNoZS5nZXRPclNldChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhdHRyUG9zaXRpb25zID0gX2dldEF0dHJpYnV0ZVBvc2l0aW9ucyhzdHIpO1xyXG4gICAgICAgIHN0ciA9IF9wc2V1ZG9SZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICAgICAgc3RyID0gX2Jvb2xlYW5TZWxlY3RvclJlcGxhY2Uoc3RyKTtcclxuICAgICAgICByZXR1cm4gX2NhcHR1cmVSZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICB9KTtcclxufTtcclxuIiwiLypcclxuICogRml6emxlLmpzXHJcbiAqIEFkYXB0ZWQgZnJvbSBTaXp6bGUuanNcclxuICovXHJcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG5cclxuICAgIF9jYWNoZSAgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSxcclxuICAgIF90b2tlbkNhY2hlICAgID0gX2NhY2hlKCksXHJcbiAgICBfc3VicXVlcnlDYWNoZSA9IF9jYWNoZSgpLFxyXG4gICAgX2Jvb2xBdHRyQ2FjaGUgPSBfY2FjaGUoKSxcclxuXHJcbiAgICBfZXJyb3IgPSAoIWNvbnNvbGUgfHwgIWNvbnNvbGUuZXJyb3IpID8gXy5ub29wIDpcclxuICAgICAgICBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIHF1ZXJ5IHNlbGVjdG9yIChjYXVnaHQpOiAnICsgc2VsZWN0b3IpO1xyXG4gICAgICAgIH07XHJcblxyXG52YXIgX2Jvb2xlYW5zID0gJ2NoZWNrZWR8c2VsZWN0ZWR8YXN5bmN8YXV0b2ZvY3VzfGF1dG9wbGF5fGNvbnRyb2xzfGRlZmVyfGRpc2FibGVkfGhpZGRlbnxpc21hcHxsb29wfG11bHRpcGxlfG9wZW58cmVhZG9ubHl8cmVxdWlyZWR8c2NvcGVkJyxcclxuXHJcbiAgICBfZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcclxuXHJcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXNlbGVjdG9ycy8jd2hpdGVzcGFjZVxyXG4gICAgX3doaXRlc3BhY2UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgX2lkZW50aWZpZXIgPSAnKD86XFxcXFxcXFwufFtcXFxcdy1dfFteXFxcXHgwMC1cXFxceGEwXSkrJyxcclxuXHJcbiAgICAvLyBOT1RFOiBMZWF2aW5nIGRvdWJsZSBxdW90ZXMgdG8gcmVkdWNlIGVzY2FwaW5nXHJcbiAgICAvLyBBdHRyaWJ1dGUgc2VsZWN0b3JzOiBodHRwOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI2F0dHJpYnV0ZS1zZWxlY3RvcnNcclxuICAgIF9hdHRyaWJ1dGVzID0gXCJcXFxcW1wiICsgX3doaXRlc3BhY2UgKyBcIiooXCIgKyBfaWRlbnRpZmllciArIFwiKSg/OlwiICsgX3doaXRlc3BhY2UgK1xyXG4gICAgICAgIC8vIE9wZXJhdG9yIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIqKFsqXiR8IX5dPz0pXCIgKyBfd2hpdGVzcGFjZSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIGlkZW50aWZpZXJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgX2lkZW50aWZpZXIgKyBcIikpfClcIiArIF93aGl0ZXNwYWNlICtcclxuICAgICAgICBcIipcXFxcXVwiLFxyXG5cclxuICAgIF9wc2V1ZG9zID0gXCI6KFwiICsgX2lkZW50aWZpZXIgKyBcIikoPzpcXFxcKChcIiArXHJcbiAgICAgICAgLy8gVG8gcmVkdWNlIHRoZSBudW1iZXIgb2Ygc2VsZWN0b3JzIG5lZWRpbmcgX3Rva2VuaXplIGluIHRoZSBwcmVGaWx0ZXIsIHByZWZlciBhcmd1bWVudHM6XHJcbiAgICAgICAgLy8gMS4gcXVvdGVkIChjYXB0dXJlIDM7IGNhcHR1cmUgNCBvciBjYXB0dXJlIDUpXHJcbiAgICAgICAgXCIoJygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwiKXxcIiArXHJcbiAgICAgICAgLy8gMi4gc2ltcGxlIChjYXB0dXJlIDYpXHJcbiAgICAgICAgXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKVtcXFxcXV18XCIgKyBfYXR0cmlidXRlcyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgX3Jjb21tYSA9IG5ldyBSZWdFeHAoJ14nICsgX3doaXRlc3BhY2UgKyAnKiwnICsgX3doaXRlc3BhY2UgKyAnKicpLFxyXG4gICAgX3Jjb21iaW5hdG9ycyA9IG5ldyBSZWdFeHAoJ14nICsgX3doaXRlc3BhY2UgKyAnKihbPit+XXwnICsgX3doaXRlc3BhY2UgKyAnKScgKyBfd2hpdGVzcGFjZSArICcqJyksXHJcblxyXG4gICAgX3Jwc2V1ZG8gPSBuZXcgUmVnRXhwKF9wc2V1ZG9zKSxcclxuXHJcbiAgICBfbWF0Y2hFeHByID0ge1xyXG4gICAgICAgIElEOiAgICAgbmV3IFJlZ0V4cCgnXiMoJyAgICsgX2lkZW50aWZpZXIgKyAnKScpLFxyXG4gICAgICAgIENMQVNTOiAgbmV3IFJlZ0V4cCgnXlxcXFwuKCcgKyBfaWRlbnRpZmllciArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBfaWRlbnRpZmllciArICd8WypdKScpLFxyXG4gICAgICAgIEFUVFI6ICAgbmV3IFJlZ0V4cCgnXicgICAgICsgX2F0dHJpYnV0ZXMpLFxyXG4gICAgICAgIFBTRVVETzogbmV3IFJlZ0V4cCgnXicgICAgICsgX3BzZXVkb3MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgX3doaXRlc3BhY2UgK1xyXG4gICAgICAgICAgICAnKihldmVufG9kZHwoKFsrLV18KShcXFxcZCopbnwpJyArIF93aGl0ZXNwYWNlICsgJyooPzooWystXXwpJyArIF93aGl0ZXNwYWNlICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBfd2hpdGVzcGFjZSArICcqXFxcXCl8KScsICdpJyksXHJcblxyXG4gICAgICAgIGJvb2w6ICAgbmV3IFJlZ0V4cChcIl4oPzpcIiArIF9ib29sZWFucyArIFwiKSRcIiwgXCJpXCIpLFxyXG5cclxuICAgICAgICAvLyBGb3IgdXNlIGluIGxpYnJhcmllcyBpbXBsZW1lbnRpbmcgLmlzKClcclxuICAgICAgICAvLyBXZSB1c2UgdGhpcyBmb3IgUE9TIG1hdGNoaW5nIGluIGBzZWxlY3RgXHJcbiAgICAgICAgbmVlZHNDb250ZXh0OiBuZXcgUmVnRXhwKCdeJyArIF93aGl0ZXNwYWNlICsgJypbPit+XXw6KGV2ZW58b2RkfG50aHxlcXxndHxsdHxmaXJzdHxsYXN0KSg/OlxcXFwoJyArXHJcbiAgICAgICAgICAgIF93aGl0ZXNwYWNlICsgJyooKD86LVxcXFxkKT9cXFxcZCopJyArIF93aGl0ZXNwYWNlICsgJypcXFxcKXwpKD89W14tXXwkKScsICdpJylcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ1NTIGVzY2FwZXMgaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xyXG4gICAgX3J1bmVzY2FwZSA9IG5ldyBSZWdFeHAoJ1xcXFxcXFxcKFtcXFxcZGEtZl17MSw2fScgKyBfd2hpdGVzcGFjZSArICc/fCgnICsgX3doaXRlc3BhY2UgKyAnKXwuKScsICdpZycpLFxyXG4gICAgX2Z1bmVzY2FwZSA9IGZ1bmN0aW9uKF8sIGVzY2FwZWQsIGVzY2FwZWRXaGl0ZXNwYWNlKSB7XHJcbiAgICAgICAgdmFyIGhpZ2ggPSAnMHgnICsgKGVzY2FwZWQgLSAweDEwMDAwKTtcclxuICAgICAgICAvLyBOYU4gbWVhbnMgbm9uLWNvZGVwb2ludFxyXG4gICAgICAgIC8vIFN1cHBvcnQ6IEZpcmVmb3g8MjRcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGVycm9uZW91cyBudW1lcmljIGludGVycHJldGF0aW9uIG9mICsnMHgnXHJcbiAgICAgICAgcmV0dXJuIGhpZ2ggIT09IGhpZ2ggfHwgZXNjYXBlZFdoaXRlc3BhY2UgP1xyXG4gICAgICAgICAgICBlc2NhcGVkIDpcclxuICAgICAgICAgICAgaGlnaCA8IDAgP1xyXG4gICAgICAgICAgICAgICAgLy8gQk1QIGNvZGVwb2ludFxyXG4gICAgICAgICAgICAgICAgX2Zyb21DaGFyQ29kZShoaWdoICsgMHgxMDAwMCkgOlxyXG4gICAgICAgICAgICAgICAgLy8gU3VwcGxlbWVudGFsIFBsYW5lIGNvZGVwb2ludCAoc3Vycm9nYXRlIHBhaXIpXHJcbiAgICAgICAgICAgICAgICBfZnJvbUNoYXJDb2RlKChoaWdoID4+IDEwKSB8IDB4RDgwMCwgKGhpZ2ggJiAweDNGRikgfCAweERDMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBfcHJlRmlsdGVyID0ge1xyXG4gICAgICAgIEFUVFI6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0ucmVwbGFjZShfcnVuZXNjYXBlLCBfZnVuZXNjYXBlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1vdmUgdGhlIGdpdmVuIHZhbHVlIHRvIG1hdGNoWzNdIHdoZXRoZXIgcXVvdGVkIG9yIHVucXVvdGVkXHJcbiAgICAgICAgICAgIG1hdGNoWzNdID0gKCBtYXRjaFszXSB8fCBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJyApLnJlcGxhY2UoX3J1bmVzY2FwZSwgX2Z1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMl0gPT09ICd+PScpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzNdID0gJyAnICsgbWF0Y2hbM10gKyAnICc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCA0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBDSElMRDogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgLyogbWF0Y2hlcyBmcm9tIF9tYXRjaEV4cHJbJ0NISUxEJ11cclxuICAgICAgICAgICAgICAgIDEgdHlwZSAob25seXxudGh8Li4uKVxyXG4gICAgICAgICAgICAgICAgMiB3aGF0IChjaGlsZHxvZi10eXBlKVxyXG4gICAgICAgICAgICAgICAgMyBhcmd1bWVudCAoZXZlbnxvZGR8XFxkKnxcXGQqbihbKy1dXFxkKyk/fC4uLilcclxuICAgICAgICAgICAgICAgIDQgeG4tY29tcG9uZW50IG9mIHhuK3kgYXJndW1lbnQgKFsrLV0/XFxkKm58KVxyXG4gICAgICAgICAgICAgICAgNSBzaWduIG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNiB4IG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNyBzaWduIG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA4IHkgb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXS5zbGljZSgwLCAzKSA9PT0gJ250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIG50aC0qIHJlcXVpcmVzIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgUFNFVURPOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICB2YXIgZXhjZXNzLFxyXG4gICAgICAgICAgICAgICAgdW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoX21hdGNoRXhwci5DSElMRC50ZXN0KG1hdGNoWzBdKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFjY2VwdCBxdW90ZWQgYXJndW1lbnRzIGFzLWlzXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIC8vIFN0cmlwIGV4Y2VzcyBjaGFyYWN0ZXJzIGZyb20gdW5xdW90ZWQgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5xdW90ZWQgJiYgX3Jwc2V1ZG8udGVzdCh1bnF1b3RlZCkgJiZcclxuICAgICAgICAgICAgICAgIC8vIEdldCBleGNlc3MgZnJvbSBfdG9rZW5pemUgKHJlY3Vyc2l2ZWx5KVxyXG4gICAgICAgICAgICAgICAgKGV4Y2VzcyA9IF90b2tlbml6ZSh1bnF1b3RlZCwgdHJ1ZSkpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB1bnF1b3RlZC5pbmRleE9mKCcpJywgdW5xdW90ZWQubGVuZ3RoIC0gZXhjZXNzKSAtIHVucXVvdGVkLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleGNlc3MgaXMgYSBuZWdhdGl2ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSB1bnF1b3RlZC5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBbcGFyc2VPbmx5PWZhbHNlXVxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXXxOdW1iZXJ8bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgX3Rva2VuaXplID0gZnVuY3Rpb24oc2VsZWN0b3IsIHBhcnNlT25seSkge1xyXG4gICAgdmFyIGNhY2hlZCA9IF90b2tlbkNhY2hlLmdldChzZWxlY3Rvcik7XHJcblxyXG4gICAgaWYgKGNhY2hlZCkge1xyXG4gICAgICAgIHJldHVybiBwYXJzZU9ubHkgPyAwIDogY2FjaGVkLnNsaWNlKDApO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0eXBlLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1JlZ0V4cH0gKi9cclxuICAgICAgICByZWdleCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheX0gKi9cclxuICAgICAgICBtYXRjaCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgbWF0Y2hlZCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmdbXX0gKi9cclxuICAgICAgICBzdWJxdWVyaWVzID0gW10sXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJ5ID0gJycsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHNvRmFyID0gc2VsZWN0b3I7XHJcblxyXG4gICAgd2hpbGUgKHNvRmFyKSB7XHJcbiAgICAgICAgLy8gQ29tbWEgYW5kIGZpcnN0IHJ1blxyXG4gICAgICAgIGlmICghbWF0Y2hlZCB8fCAobWF0Y2ggPSBfcmNvbW1hLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGNvbnN1bWUgdHJhaWxpbmcgY29tbWFzIGFzIHZhbGlkXHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCkgfHwgc29GYXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuICAgICAgICAgICAgc3VicXVlcnkgPSAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hdGNoZWQgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yc1xyXG4gICAgICAgIGlmICgobWF0Y2ggPSBfcmNvbWJpbmF0b3JzLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGaWx0ZXJzXHJcbiAgICAgICAgZm9yICh0eXBlIGluIF9tYXRjaEV4cHIpIHtcclxuICAgICAgICAgICAgcmVnZXggPSBfbWF0Y2hFeHByW3R5cGVdO1xyXG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc29GYXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmICghX3ByZUZpbHRlclt0eXBlXSB8fCAobWF0Y2ggPSBfcHJlRmlsdGVyW3R5cGVdKG1hdGNoKSkpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgIHN1YnF1ZXJ5ICs9IG1hdGNoZWQ7XHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG5cclxuICAgIC8vIFJldHVybiB0aGUgbGVuZ3RoIG9mIHRoZSBpbnZhbGlkIGV4Y2Vzc1xyXG4gICAgLy8gaWYgd2UncmUganVzdCBwYXJzaW5nLlxyXG4gICAgaWYgKHBhcnNlT25seSkgeyByZXR1cm4gc29GYXIubGVuZ3RoOyB9XHJcblxyXG4gICAgaWYgKHNvRmFyKSB7IF9lcnJvcihzZWxlY3Rvcik7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgcmV0dXJuIF90b2tlbkNhY2hlLnNldChzZWxlY3Rvciwgc3VicXVlcmllcykuc2xpY2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gICAgICogQHJldHVybiB7U3RyaW5nW118bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcgdGhlIHNlbGVjdG9yLlxyXG4gICAgICovXHJcbiAgICBzdWJxdWVyaWVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBfc3VicXVlcnlDYWNoZS5nZXRPclNldChzZWxlY3RvciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfdG9rZW5pemUoc2VsZWN0b3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0Jvb2xlYW5BdHRyaWJ1dGU6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gX2Jvb2xBdHRyQ2FjaGUuZ2V0T3JTZXQobmFtZSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfbWF0Y2hFeHByLmJvb2wudGVzdChuYW1lKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcclxuICAgIF9vcmRlciA9IHJlcXVpcmUoJy4uL29yZGVyJyk7XHJcblxyXG52YXIgX3NsaWNlID0gKGZ1bmN0aW9uKHNsaWNlKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFyciwgc3RhcnQsIGVuZCkge1xyXG4gICAgICAgICAgICAvLyBFeGl0IGVhcmx5IGZvciBlbXB0eSBhcnJheVxyXG4gICAgICAgICAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAgICAgICAgIC8vIEVuZCwgbmF0dXJhbGx5LCBoYXMgdG8gYmUgaGlnaGVyIHRoYW4gMCB0byBtYXR0ZXIsXHJcbiAgICAgICAgICAgIC8vIHNvIGEgc2ltcGxlIGV4aXN0ZW5jZSBjaGVjayB3aWxsIGRvXHJcbiAgICAgICAgICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCB8fCAwKTtcclxuICAgICAgICB9O1xyXG4gICAgfShbXS5zbGljZSkpLFxyXG5cclxuICAgIF91bmlxdWUgPSBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICAgICAgdmFyIGhhc0R1cGxpY2F0ZXMgPSBfb3JkZXIuc29ydChyZXN1bHRzKTtcclxuICAgICAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGVsZW0sXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgICAgICAvLyBzbyB0aGF0IGEgbmV3IGFycmF5IGlzbid0XHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZWQvZGVzdHJveWVkIGV2ZXJ5IHVuaXF1ZSBjYWxsXHJcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gR28gdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGlkZW50aWZ5XHJcbiAgICAgICAgLy8gdGhlIGR1cGxpY2F0ZXMgdG8gYmUgcmVtb3ZlZFxyXG4gICAgICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbSA9PT0gcmVzdWx0c1tpZHhdKSB7XHJcbiAgICAgICAgICAgICAgICBkdXBsaWNhdGVzLnB1c2goaWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBkdXBsaWNhdGVzIGZyb20gdGhlIHJlc3VsdHNcclxuICAgICAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICByZXN1bHRzLnNwbGljZShkdXBsaWNhdGVzW2lkeF0sIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIF9tYXAgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFyci5sZW5ndGggfHwgIWl0ZXJhdG9yKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBpdGVtO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5jb25jYXRGbGF0KHJlc3VsdHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIW9iaiB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIC8vIEFycmF5IHN1cHBvcnRcclxuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpdGVtO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlbSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9iamVjdCBzdXBwb3J0XHJcbiAgICAgICAgdmFyIGtleSwgdmFsdWU7XHJcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5KSA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2xpY2U6IF9zbGljZSxcclxuICAgIGVsZW1lbnRTb3J0OiBfb3JkZXIuc29ydCxcclxuICAgIHVuaXF1ZTogX3VuaXF1ZSxcclxuICAgIGVhY2g6IF9lYWNoLFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgYXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWytpbmRleF07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICAgICAvLyBObyBpbmRleCwgcmV0dXJuIGFsbFxyXG4gICAgICAgICAgICBpZiAoIV8uZXhpc3RzKGluZGV4KSkgeyByZXR1cm4gdGhpcy50b0FycmF5KCk7IH1cclxuXHJcbiAgICAgICAgICAgIGluZGV4ID0gK2luZGV4O1xyXG5cclxuICAgICAgICAgICAgLy8gTG9va2luZyB0byBnZXQgYW4gaW5kZXggZnJvbSB0aGUgZW5kIG9mIHRoZSBzZXRcclxuICAgICAgICAgICAgaWYgKGluZGV4IDwgMCkgeyBpbmRleCA9ICh0aGlzLmxlbmd0aCArIGluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbaW5kZXhdO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVxOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNsaWNlOiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEKF9zbGljZSh0aGlzLnRvQXJyYXkoKSwgc3RhcnQsIGVuZCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQodGhpc1swXSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEKHRoaXNbdGhpcy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfc2xpY2UodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbWFwOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gRChfbWFwKHRoaXMsIGl0ZXJhdG9yKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICAgICAgX2VhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmb3JFYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgICAgICBfZWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCAgID0gcmVxdWlyZSgnb3ZlcmxvYWQtanMnKSxcclxuICAgIG8gICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG5cclxuICAgIF9TVVBQT1JUUyAgPSByZXF1aXJlKCcuLi9zdXBwb3J0cycpLFxyXG4gICAgTk9ERV9UWVBFID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcblxyXG4gICAgX3V0aWxzICAgICA9IHJlcXVpcmUoJy4uL3V0aWxzJyksXHJcbiAgICBfY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSxcclxuXHJcbiAgICBfc2VsZWN0b3IgID0gcmVxdWlyZSgnLi9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UnKSxcclxuXHJcbiAgICBfaXNEYXRhS2V5Q2FjaGUgICAgICAgPSBfY2FjaGUoKSxcclxuICAgIF9zYW5pdGl6ZURhdGFLZXlDYWNoZSA9IF9jYWNoZSgpLFxyXG4gICAgX3RyaW1EYXRhS2V5Q2FjaGUgICAgID0gX2NhY2hlKCksXHJcbiAgICBfYXR0ck5hbWVMb3dlckNhY2hlICAgPSBfY2FjaGUoKTtcclxuXHJcbnZhciBfaXNEYXRhS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIF9pc0RhdGFLZXlDYWNoZS5nZXRPclNldChrZXksIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBfc2FuaXRpemVEYXRhS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIF9zYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXRPclNldChrZXksIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gX2lzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBfdHJpbURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gX3RyaW1EYXRhS2V5Q2FjaGUuZ2V0T3JTZXQoa2V5LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleS5zdWJzdHIoMCwgNSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXREYXRhQXR0cktleXMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGF0dHJzID0gZWxlbS5hdHRyaWJ1dGVzLFxyXG4gICAgICAgICAgICBpZHggICA9IGF0dHIubGVuZ3RoLCBrZXlzID0gW107XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGF0dHJzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChfaXNEYXRhS2V5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ga2V5cztcclxuICAgIH07XHJcblxyXG52YXIgX2hhc0F0dHIgPSBfU1VQUE9SVFMuaW5wdXRWYWx1ZUF0dHJcclxuICAgIC8vIElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgPyBmdW5jdGlvbihlbGVtLCBhdHRyKSB7IHJldHVybiBlbGVtLmhhc0F0dHJpYnV0ZShhdHRyKTsgfVxyXG4gICAgLy8gSUU4XHJcbiAgICA6IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWUgPSBfdXRpbHMubm9ybWFsTm9kZU5hbWUoZWxlbSk7XHJcbiAgICAgICAgLy8gSW4gSUU4LCBpbnB1dC5oYXNBdHRyaWJ1dGUoJ3ZhbHVlJykgcmV0dXJucyBmYWxzZVxyXG4gICAgICAgIC8vIGFuZCBpbnB1dC5nZXRBdHRyaWJ1dGVOb2RlKCd2YWx1ZScpIHJldHVybnMgbnVsbFxyXG4gICAgICAgIC8vIGlmIHRoZSB2YWx1ZSBpcyBlbXB0eSAoXCJcIikuXHJcbiAgICAgICAgaWYgKG5vZGVOYW1lID09PSAnaW5wdXQnICYmIGF0dHIgPT09ICd2YWx1ZScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEluIElFOCwgb3B0aW9uLmhhc0F0dHJpYnV0ZSgnc2VsZWN0ZWQnKSBhbHdheXMgcmV0dXJucyBmYWxzZS5cclxuICAgICAgICAvLyBTZXJpb3VzbHkuXHJcbiAgICAgICAgaWYgKG5vZGVOYW1lID09PSAnb3B0aW9uJyAmJiBhdHRyID09PSAnc2VsZWN0ZWQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZU5vZGUoYXR0cikgIT09IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtLmhhc0F0dHJpYnV0ZShhdHRyKTtcclxuICAgIH07XHJcblxyXG52YXIgX2Jvb2xIb29rID0ge1xyXG4gICAgaXM6IGZ1bmN0aW9uKGF0dHJOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIF9zZWxlY3Rvci5pc0Jvb2xlYW5BdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgfSxcclxuICAgIGdldDogZnVuY3Rpb24oZWxlbSwgYXR0ck5hbWUpIHtcclxuICAgICAgICBpZiAoX2hhc0F0dHIoZWxlbSwgYXR0ck5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfYXR0ck5hbWVMb3dlckNhY2hlLmdldE9yU2V0KGF0dHJOYW1lLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhdHRyTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH0sXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlLCBhdHRyTmFtZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGJvb2xlYW4gYXR0cmlidXRlcyB3aGVuIHNldCB0byBmYWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJOYW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBfaG9va3MgPSB7XHJcbiAgICAgICAgdGFiaW5kZXg6IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuICAgICAgICAgICAgICAgIGlmICghXy5leGlzdHModGFiaW5kZXgpIHx8IHRhYmluZGV4ID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJpbmRleDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHR5cGU6IHtcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFfU1VQUE9SVFMucmFkaW9WYWx1ZSAmJiB2YWx1ZSA9PT0gJ3JhZGlvJyAmJiBfdXRpbHMuaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBJRThcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWwgPSBlbGVtLmRlZmF1bHRWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElFOFxyXG4gICAgICAgICAgICAgICAgaWYgKCFfU1VQUE9SVFMuYnV0dG9uVmFsdWUgJiYgdmFsID09PSAnJyAmJiBfdXRpbHMuaXNOb2RlTmFtZShlbGVtLCAnYnV0dG9uJykpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBfdXRpbHMubm9ybWFsaXplTmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfaXNFbGVtZW50Tm9kZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbSAmJiBlbGVtLm5vZGVUeXBlID09PSBOT0RFX1RZUEUuRUxFTUVOVDtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIV9pc0VsZW1lbnROb2RlKGVsZW0pIHx8ICFfaGFzQXR0cihlbGVtLCBhdHRyKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKF9ib29sSG9vay5pcyhhdHRyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gX2Jvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfaG9va3NbYXR0cl0gJiYgX2hvb2tzW2F0dHJdLmdldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gX2hvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gXy5leGlzdHMocmV0KSA/IHJldCA6IHVuZGVmaW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgX3NldHRlciA9IHtcclxuICAgICAgICBmb3JBdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoX2Jvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3NldHRlci5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKF9ob29rc1thdHRyXSAmJiBfaG9va3NbYXR0cl0uc2V0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX3NldHRlci5ob29rO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfc2V0dGVyLmVsZW07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBib29sOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBfYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIF9ob29rc1thdHRyXS5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWxlbTogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgX3NldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IF8uaXNGdW5jdGlvbih2YWx1ZSksXHJcbiAgICAgICAgICAgIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIHZhbCxcclxuICAgICAgICAgICAgc2V0dGVyID0gX3NldHRlci5mb3JBdHRyKGF0dHIsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFfaXNFbGVtZW50Tm9kZShlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgdmFsID0gaXNGbiA/IHZhbHVlLmNhbGwoZWxlbSwgaWR4LCBfZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpKSA6IHZhbHVlO1xyXG4gICAgICAgICAgICBzZXR0ZXIoZWxlbSwgYXR0ciwgdmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgX3NldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFfaXNFbGVtZW50Tm9kZShlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICB2YXIgc2V0dGVyID0gX3NldHRlci5mb3JBdHRyKGF0dHIsIHZhbHVlKTtcclxuICAgICAgICBzZXR0ZXIoZWxlbSwgYXR0ciwgdmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUoYXJyW2lkeF0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfcmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24oZWxlbSwgYXR0cikge1xyXG4gICAgICAgIGlmICghX2lzRWxlbWVudE5vZGUoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChfaG9va3NbYXR0cl0gJiYgX2hvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gX2hvb2tzW2F0dHJdLnJlbW92ZShlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBhdHRyOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZylcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldEF0dHJpYnV0ZSh0aGlzWzBdLCBhdHRyKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZywgby5hbnkoU3RyaW5nLCBOdW1iZXIsIEJvb2xlYW4pKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBfc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZywgbnVsbClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoT2JqZWN0KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0cjtcclxuICAgICAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIGF0dHJzW2F0dHJdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZywgRnVuY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXR0ciwgZm4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZEF0dHIgPSBfZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghXy5leGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICBfc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhfdXRpbHMucmV0dXJuVGhpcylcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgcmVtb3ZlQXR0cjogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXR0cikge1xyXG4gICAgICAgICAgICAgICAgX3JlbW92ZUF0dHJpYnV0ZXModGhpcywgYXR0cik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgYXR0ckRhdGE6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoT2JqZWN0KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKF9zYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcsIG8ud2lsZClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKF9zYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtYXAgID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAga2V5cyA9IF9nZXREYXRhQXR0cktleXMoZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCAgPSBrZXlzLmxlbmd0aCwga2V5O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAga2V5ID0ga2V5c1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcFtfdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmV4cG9zZSgpXHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBOT0RFX1RZUEUgPSByZXF1aXJlKCdub2RlLXR5cGUnKSxcclxuICAgIF9TVVBQT1JUUyAgPSByZXF1aXJlKCcuLi9zdXBwb3J0cycpLFxyXG5cclxuICAgIF8gICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCAgID0gcmVxdWlyZSgnb3ZlcmxvYWQtanMnKSxcclxuICAgIG8gICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG5cclxuICAgIHN0cmluZyAgICAgPSByZXF1aXJlKCcuLi9zdHJpbmcnKSxcclxuICAgIF9zcGxpdCAgICAgPSBzdHJpbmcuc3BsaXQsXHJcbiAgICBfaXNFbXB0eSAgID0gc3RyaW5nLmlzRW1wdHk7XHJcblxyXG52YXIgX2ltcGwgPSBfU1VQUE9SVFMuY2xhc3NMaXN0ID8gcmVxdWlyZSgnLi9jbGFzc2VzL2NsYXNzZXMtbW9kZXJuJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHJlcXVpcmUoJy4vY2xhc3Nlcy9jbGFzc2VzLWxlZ2FjeScpO1xyXG5cclxudmFyIF9kb0FueUVsZW1zSGF2ZUNsYXNzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWUpIHtcclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgaWYgKF9pbXBsLmhhc0NsYXNzKGVsZW1zW2VsZW1JZHhdLCBuYW1lKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIF9hZGRDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIV8uaXNBcnJheShuYW1lcykpIHsgbmFtZXMgPSBfLnRvQXJyYXkobmFtZXMpOyB9XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IE5PREVfVFlQRS5FTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIF9pbXBsLmFkZENsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIV8uaXNBcnJheShuYW1lcykpIHsgbmFtZXMgPSBfLnRvQXJyYXkobmFtZXMpOyB9XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IE5PREVfVFlQRS5FTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIF9pbXBsLnJlbW92ZUNsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgZWxlbXNbZWxlbUlkeF0uY2xhc3NOYW1lID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfdG9nZ2xlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFfLmlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBOT0RFX1RZUEUuRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBfaW1wbC50b2dnbGVDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBoYXNDbGFzczogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBfaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBfZG9BbnlFbGVtc0hhdmVDbGFzcyh0aGlzLCBuYW1lKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmV4cG9zZSgpLFxyXG5cclxuICAgICAgICBhZGRDbGFzczogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBfaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBfc3BsaXQobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKEFycmF5KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IF9pc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uYW55KG51bGwsIHVuZGVmaW5lZCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgcmVtb3ZlQ2xhc3M6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9yZW1vdmVBbGxDbGFzc2VzKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgX2lzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gX3NwbGl0KG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhBcnJheSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBfaXNFbXB0eShuYW1lcykgfHwgIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9yZW1vdmVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uYW55KG51bGwsIHVuZGVmaW5lZCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgdG9nZ2xlQ2xhc3M6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkoU3RyaW5nLCBBcnJheSkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24obmFtZXMpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgX2lzRW1wdHkobmFtZXMpIHx8ICFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBuYW1lcyA9IF9zcGxpdChuYW1lcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF90b2dnbGVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uYW55KFN0cmluZywgQXJyYXkpLCBvLndpbGQpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24obmFtZXMsIHNob3VsZEFkZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBfaXNFbXB0eShuYW1lcykgfHwgIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIG5hbWVzID0gX3NwbGl0KG5hbWVzKTtcclxuICAgICAgICAgICAgICAgIGlmICghbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZEFkZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3JlbW92ZUNsYXNzZXModGhpcywgbmFtZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmV4cG9zZSgpXHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBfY2FjaGUgPSByZXF1aXJlKCdjYWNoZScpLFxyXG4gICAgX3NwbGl0ID0gcmVxdWlyZSgnLi4vLi4vc3RyaW5nJykuc3BsaXQsXHJcblxyXG4gICAgX2dldENhY2hlICAgID0gX2NhY2hlKCksXHJcbiAgICBfaGFzQ2FjaGUgICAgPSBfY2FjaGUoMiksXHJcbiAgICBfYWRkQ2FjaGUgICAgPSBfY2FjaGUoMiksXHJcbiAgICBfcmVtb3ZlQ2FjaGUgPSBfY2FjaGUoMiksXHJcbiAgICBfdG9nZ2xlQ2FjaGUgPSBfY2FjaGUoMik7XHJcblxyXG52YXIgX2hhc0NsYXNzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgICAgIHZhciBlbGVtQ2xhc3NOYW1lcyA9IF9zcGxpdChlbGVtLmNsYXNzTmFtZSksXHJcbiAgICAgICAgICAgIGlkeCA9IGVsZW1DbGFzc05hbWVzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1DbGFzc05hbWVzW2lkeF0gPT09IG5hbWUpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBfYWRkQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzVG9BZGQpIHtcclxuICAgICAgICB2YXIgY3VyTmFtZXMgICA9IF9zcGxpdChlbGVtLmNsYXNzTmFtZSksXHJcbiAgICAgICAgICAgIG5ld05hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmV3TmFtZVNldCA9IF8ub2JqZWN0KGN1ck5hbWVzKSxcclxuICAgICAgICAgICAgbGVuID0gbmFtZXNUb0FkZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIG5ld05hbWUsXHJcbiAgICAgICAgICAgIGhhc05hbWU7XHJcblxyXG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCB0aGUgbmFtZXMgYmVpbmcgYWRkZWQgYW5kIG9ubHkgYWRkIG5ldyBvbmVzLlxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIG5ld05hbWUgPSBuYW1lc1RvQWRkW2lkeF07XHJcbiAgICAgICAgICAgIGhhc05hbWUgPSBuZXdOYW1lU2V0W25ld05hbWVdICE9PSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICAvLyBFbGVtZW50IGFscmVhZHkgaGFzIHRoaXMgY2xhc3MgbmFtZVxyXG4gICAgICAgICAgICBpZiAoaGFzTmFtZSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgbmV3TmFtZXMucHVzaChuZXdOYW1lKTtcclxuICAgICAgICAgICAgbmV3TmFtZVNldFtuZXdOYW1lXSA9IG5ld05hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY3VyTmFtZXMuY29uY2F0KG5ld05hbWVzKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3JlbW92ZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtLCBuYW1lc1RvUmVtb3ZlKSB7XHJcbiAgICAgICAgdmFyIGN1ck5hbWVzICAgICAgICAgPSBfc3BsaXQoZWxlbS5jbGFzc05hbWUpLFxyXG4gICAgICAgICAgICByZXN1bHROYW1lcyAgICAgID0gW10sXHJcbiAgICAgICAgICAgIHJlc3VsdE5hbWVTZXQgICAgPSB7fSxcclxuICAgICAgICAgICAgbmFtZXNUb1JlbW92ZVNldCA9IF8ub2JqZWN0KG5hbWVzVG9SZW1vdmUpLFxyXG4gICAgICAgICAgICBsZW4gPSBjdXJOYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGN1ck5hbWUsXHJcbiAgICAgICAgICAgIGhhc05hbWUsXHJcbiAgICAgICAgICAgIHNob3VsZFJlbW92ZTtcclxuXHJcbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBlbGVtZW50J3MgZXhpc3RpbmcgY2xhc3MgbmFtZXNcclxuICAgICAgICAvLyBhbmQgb25seSBrZWVwIG9uZXMgdGhhdCBhcmVuJ3QgYmVpbmcgcmVtb3ZlZC5cclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBjdXJOYW1lID0gY3VyTmFtZXNbaWR4XTtcclxuICAgICAgICAgICAgaGFzTmFtZSA9IHJlc3VsdE5hbWVTZXRbY3VyTmFtZV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgc2hvdWxkUmVtb3ZlID0gbmFtZXNUb1JlbW92ZVNldFtjdXJOYW1lXSAhPT0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3VycmVudCBjbGFzcyBuYW1lIGlzIGJlaW5nIHJlbW92ZWRcclxuICAgICAgICAgICAgaWYgKHNob3VsZFJlbW92ZSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgLy8gRWxlbWVudCBhbHJlYWR5IGhhcyB0aGlzIGNsYXNzIG5hbWVcclxuICAgICAgICAgICAgaWYgKGhhc05hbWUpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgIHJlc3VsdE5hbWVzLnB1c2goY3VyTmFtZSk7XHJcbiAgICAgICAgICAgIHJlc3VsdE5hbWVTZXRbY3VyTmFtZV0gPSBjdXJOYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdE5hbWVzO1xyXG4gICAgfSxcclxuXHJcbiAgICBfdG9nZ2xlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzVG9Ub2dnbGUpIHtcclxuICAgICAgICB2YXIgY3VyTmFtZXMgICA9IF9zcGxpdChlbGVtLmNsYXNzTmFtZSksXHJcbiAgICAgICAgICAgIG5ld05hbWVzICAgPSBjdXJOYW1lcy5zbGljZSgpLFxyXG4gICAgICAgICAgICBuZXdOYW1lU2V0ID0gXy5vYmplY3QoY3VyTmFtZXMpLFxyXG4gICAgICAgICAgICBsZW4gPSBuYW1lc1RvVG9nZ2xlLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAgICAgbmFtZVRvVG9nZ2xlLFxyXG4gICAgICAgICAgICBoYXNOYW1lO1xyXG5cclxuICAgICAgICAvLyBMb29wIHRocm91Z2ggdGhlIGVsZW1lbnQncyBleGlzdGluZyBjbGFzcyBuYW1lc1xyXG4gICAgICAgIC8vIGFuZCBvbmx5IGtlZXAgb25lcyB0aGF0IGFyZW4ndCBiZWluZyByZW1vdmVkLlxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIG5hbWVUb1RvZ2dsZSA9IG5hbWVzVG9Ub2dnbGVbaWR4XTtcclxuICAgICAgICAgICAgaGFzTmFtZSA9IG5ld05hbWVTZXRbbmFtZVRvVG9nZ2xlXSAhPT0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgLy8gRWxlbWVudCBhbHJlYWR5IGhhcyB0aGlzIGNsYXNzIG5hbWUgLSByZW1vdmUgaXRcclxuICAgICAgICAgICAgaWYgKGhhc05hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdOYW1lSWR4ID0gbmV3TmFtZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG5ld05hbWVJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdOYW1lc1tuZXdOYW1lSWR4XSA9PT0gbmFtZVRvVG9nZ2xlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld05hbWVzW25ld05hbWVJZHhdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgbmV3TmFtZVNldFtuYW1lVG9Ub2dnbGVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEVsZW1lbnQgZG9lcyBub3QgaGF2ZSB0aGlzIGNsYXNzIG5hbWUgLSBhZGQgaXRcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdOYW1lcy5wdXNoKG5hbWVUb1RvZ2dsZSk7XHJcbiAgICAgICAgICAgICAgICBuZXdOYW1lU2V0W25hbWVUb1RvZ2dsZV0gPSBuYW1lVG9Ub2dnbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZXdOYW1lc0NsZWFuID0gW107XHJcbiAgICAgICAgaWR4ID0gbmV3TmFtZXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAobmV3TmFtZXNbaWR4XSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbmV3TmFtZXNDbGVhbi5wdXNoKG5ld05hbWVzW2lkeF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3TmFtZXNDbGVhbjtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIF9oYXNDYWNoZS5nZXRPclNldChlbGVtLmNsYXNzTmFtZSwgbmFtZSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfaGFzQ2xhc3MoZWxlbSwgbmFtZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzZXM6IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0Q2xhc3NOYW1lKGVsZW0sIF9hZGRDYWNoZS5nZXRPclNldChlbGVtLmNsYXNzTmFtZSwgbmFtZXMuam9pbignICcpLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9hZGRDbGFzc2VzKGVsZW0sIG5hbWVzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzZXM6IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0Q2xhc3NOYW1lKGVsZW0sIF9yZW1vdmVDYWNoZS5nZXRPclNldChlbGVtLmNsYXNzTmFtZSwgbmFtZXMuam9pbignICcpLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9yZW1vdmVDbGFzc2VzKGVsZW0sIG5hbWVzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzZXM6IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgdGhpcy5fc2V0Q2xhc3NOYW1lKGVsZW0sIF90b2dnbGVDYWNoZS5nZXRPclNldChlbGVtLmNsYXNzTmFtZSwgbmFtZXMuam9pbignICcpLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF90b2dnbGVDbGFzc2VzKGVsZW0sIG5hbWVzKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zZXRDbGFzc05hbWU6IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gQWRkIGFsbCB0aGUgY2xhc3MgbmFtZXMgaW4gYSBzaW5nbGUgc3RlcFxyXG4gICAgICAgIGlmIChuYW1lcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc05hbWUgPSBuYW1lcy5qb2luKCcgJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2NsYXNzJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gISFlbGVtLmNsYXNzTGlzdCAmJiBlbGVtLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3NlczogZnVuY3Rpb24oZWxlbSwgbmFtZXMpIHtcclxuICAgICAgICBpZiAoIWVsZW0uY2xhc3NMaXN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LmFkZC5jYWxsKGVsZW0uY2xhc3NMaXN0LCBuYW1lc1tpZHhdKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzZXM6IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtLmNsYXNzTGlzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC5yZW1vdmUuY2FsbChlbGVtLmNsYXNzTGlzdCwgbmFtZXNbaWR4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzc2VzOiBmdW5jdGlvbihlbGVtLCBuYW1lcykge1xyXG4gICAgICAgIGlmICghZWxlbS5jbGFzc0xpc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QudG9nZ2xlLmNhbGwoZWxlbS5jbGFzc0xpc3QsIG5hbWVzW2lkeF0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcclxuICAgIG92ZXJsb2FkICAgICA9IHJlcXVpcmUoJ292ZXJsb2FkLWpzJyksXHJcbiAgICBvICAgICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG4gICAgc3RyaW5nICAgICAgID0gcmVxdWlyZSgnLi4vc3RyaW5nJyksXHJcblxyXG4gICAgX1NVUFBPUlRTICAgID0gcmVxdWlyZSgnLi4vc3VwcG9ydHMnKSxcclxuICAgIE5PREVfVFlQRSAgID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcblxyXG4gICAgX3V0aWxzICAgICAgID0gcmVxdWlyZSgnLi4vdXRpbHMnKSxcclxuICAgIF9jYWNoZSAgICAgICA9IHJlcXVpcmUoJ2NhY2hlJyksXHJcbiAgICBfcmVnZXggICAgICAgPSByZXF1aXJlKCcuLi9yZWdleCcpLFxyXG5cclxuICAgIF9jc3NLZXlDYWNoZSA9IF9jYWNoZSgpO1xyXG5cclxudmFyIF9zd2FwU2V0dGluZ3MgPSB7XHJcbiAgICBtZWFzdXJlRGlzcGxheToge1xyXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXHJcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBfZ2V0RG9jdW1lbnREaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAvLyBFaXRoZXIgc2Nyb2xsW1dpZHRoL0hlaWdodF0gb3Igb2Zmc2V0W1dpZHRoL0hlaWdodF0gb3JcclxuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdLCB3aGljaGV2ZXIgaXMgZ3JlYXRlc3RcclxuICAgIHZhciBkb2MgPSBlbGVtLmRvY3VtZW50RWxlbWVudDtcclxuICAgIHJldHVybiBNYXRoLm1heChcclxuICAgICAgICBlbGVtLmJvZHlbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBlbGVtLmJvZHlbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZG9jWydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snY2xpZW50JyArIG5hbWVdXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIF9oaWRlID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH0sXHJcbiAgICBfc2hvdyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgX2Nzc1N3YXAgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBvbGQgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMsIGFuZCBpbnNlcnQgdGhlIG5ldyBvbmVzXHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgb2xkW25hbWVdID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvbGRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Q29tcHV0ZWRTdHlsZSA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gX1NVUFBPUlRTLmdldENvbXB1dGVkU3R5bGUgP1xyXG4gICAgICAgICAgICAvLyBBdm9pZHMgYW4gJ0lsbGVnYWwgSW52b2NhdGlvbicgZXJyb3IgKENocm9tZSlcclxuICAgICAgICAgICAgLy8gQXZvaWRzIGEgJ1R5cGVFcnJvcjogQXJndW1lbnQgMSBvZiBXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkb2VzIG5vdCBpbXBsZW1lbnQgaW50ZXJmYWNlIEVsZW1lbnQnIGVycm9yIChGaXJlZm94KVxyXG4gICAgICAgICAgICBmdW5jdGlvbihlbGVtKSB7IHJldHVybiBfLmlzRWxlbWVudChlbGVtKSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pIDogbnVsbDsgfSA6XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVsZW0pIHsgcmV0dXJuIGVsZW0uY3VycmVudFN0eWxlOyB9O1xyXG4gICAgfSgpKSxcclxuXHJcbiAgICBfd2lkdGggPSB7XHJcbiAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoXy5pc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLkRPQ1VNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdXaWR0aCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAod2lkdGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gX2dldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChfcmVnZXguZGlzcGxheS5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2Nzc1N3YXAoZWxlbSwgX3N3YXBTZXR0aW5ncy5tZWFzdXJlRGlzcGxheSwgZnVuY3Rpb24oKSB7IHJldHVybiBfZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUud2lkdGggPSBfLmlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX2hlaWdodCA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKF8uaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBOT0RFX1RZUEUuRE9DVU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ0hlaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gX2dldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChfcmVnZXguZGlzcGxheS5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2Nzc1N3YXAoZWxlbSwgX3N3YXBTZXR0aW5ncy5tZWFzdXJlRGlzcGxheSwgZnVuY3Rpb24oKSB7IHJldHVybiBfZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gX2dldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gXy5pc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIF9nZXRXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG5cclxuICAgIC8vIFN0YXJ0IHdpdGggb2Zmc2V0IHByb3BlcnR5LCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIHRoZSBib3JkZXItYm94IHZhbHVlXHJcbiAgICB2YXIgdmFsdWVJc0JvcmRlckJveCA9IHRydWUsXHJcbiAgICAgICAgdmFsID0gKG5hbWUgPT09ICd3aWR0aCcpID8gZWxlbS5vZmZzZXRXaWR0aCA6IGVsZW0ub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICAgIHN0eWxlcyA9IF9nZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIGlzQm9yZGVyQm94ID0gc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnO1xyXG5cclxuICAgIC8vIHNvbWUgbm9uLWh0bWwgZWxlbWVudHMgcmV0dXJuIHVuZGVmaW5lZCBmb3Igb2Zmc2V0V2lkdGgsIHNvIGNoZWNrIGZvciBudWxsL3VuZGVmaW5lZFxyXG4gICAgLy8gc3ZnIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjQ5Mjg1XHJcbiAgICAvLyBNYXRoTUwgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD00OTE2NjhcclxuICAgIGlmICh2YWwgPD0gMCB8fCAhXy5leGlzdHModmFsKSkge1xyXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBjb21wdXRlZCB0aGVuIHVuY29tcHV0ZWQgY3NzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgIHZhbCA9IF9jdXJDc3MoZWxlbSwgbmFtZSwgc3R5bGVzKTtcclxuICAgICAgICBpZiAodmFsIDwgMCB8fCAhdmFsKSB7IHZhbCA9IGVsZW0uc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZWQgdW5pdCBpcyBub3QgcGl4ZWxzLiBTdG9wIGhlcmUgYW5kIHJldHVybi5cclxuICAgICAgICBpZiAoX3JlZ2V4Lm51bU5vdFB4KHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRoZSBjaGVjayBmb3Igc3R5bGUgaW4gY2FzZSBhIGJyb3dzZXIgd2hpY2ggcmV0dXJucyB1bnJlbGlhYmxlIHZhbHVlc1xyXG4gICAgICAgIC8vIGZvciBnZXRDb21wdXRlZFN0eWxlIHNpbGVudGx5IGZhbGxzIGJhY2sgdG8gdGhlIHJlbGlhYmxlIGVsZW0uc3R5bGVcclxuICAgICAgICB2YWx1ZUlzQm9yZGVyQm94ID0gaXNCb3JkZXJCb3ggJiYgdmFsID09PSBzdHlsZXNbbmFtZV07XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSAnJywgYXV0bywgYW5kIHByZXBhcmUgZm9yIGV4dHJhXHJcbiAgICAgICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIHRoZSBhY3RpdmUgYm94LXNpemluZyBtb2RlbCB0byBhZGQvc3VidHJhY3QgaXJyZWxldmFudCBzdHlsZXNcclxuICAgIHJldHVybiBfLnRvUHgoXHJcbiAgICAgICAgdmFsICsgX2F1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0KFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnLFxyXG4gICAgICAgICAgICB2YWx1ZUlzQm9yZGVyQm94LFxyXG4gICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICApXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIF9DU1NfRVhQQU5EID0gXy5zcGx0KCdUb3B8UmlnaHR8Qm90dG9tfExlZnQnKTtcclxudmFyIF9hdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGV4dHJhLCBpc0JvcmRlckJveCwgc3R5bGVzKSB7XHJcbiAgICB2YXIgdmFsID0gMCxcclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHJpZ2h0IG1lYXN1cmVtZW50LCBhdm9pZCBhdWdtZW50YXRpb25cclxuICAgICAgICBpZHggPSAoZXh0cmEgPT09IChpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnKSkgP1xyXG4gICAgICAgICAgICA0IDpcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGluaXRpYWxpemUgZm9yIGhvcml6b250YWwgb3IgdmVydGljYWwgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAobmFtZSA9PT0gJ3dpZHRoJykgP1xyXG4gICAgICAgICAgICAxIDpcclxuICAgICAgICAgICAgMCxcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIC8vIFB1bGxlZCBvdXQgb2YgdGhlIGxvb3AgdG8gcmVkdWNlIHN0cmluZyBjb21wYXJpc29uc1xyXG4gICAgICAgIGV4dHJhSXNNYXJnaW4gID0gKGV4dHJhID09PSAnbWFyZ2luJyksXHJcbiAgICAgICAgZXh0cmFJc0NvbnRlbnQgPSAoIWV4dHJhSXNNYXJnaW4gJiYgZXh0cmEgPT09ICdjb250ZW50JyksXHJcbiAgICAgICAgZXh0cmFJc1BhZGRpbmcgPSAoIWV4dHJhSXNNYXJnaW4gJiYgIWV4dHJhSXNDb250ZW50ICYmIGV4dHJhID09PSAncGFkZGluZycpO1xyXG5cclxuICAgIGZvciAoOyBpZHggPCA0OyBpZHggKz0gMikge1xyXG4gICAgICAgIHR5cGUgPSBfQ1NTX0VYUEFORFtpZHhdO1xyXG5cclxuICAgICAgICAvLyBib3RoIGJveCBtb2RlbHMgZXhjbHVkZSBtYXJnaW4sIHNvIGFkZCBpdCBpZiB3ZSB3YW50IGl0XHJcbiAgICAgICAgaWYgKGV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgYm9yZGVyIG5vciBtYXJnaW4sIHNvIHJlbW92ZSBib3JkZXJcclxuICAgICAgICAgICAgaWYgKCFleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlICsgJ1dpZHRoJ10pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQsIHNvIGFkZCBwYWRkaW5nXHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxudmFyIF9nZXRQcm9wZXJ0eVZhbHVlID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIF9TVVBQT1JUUy5nZXRQcm9wZXJ0eVZhbHVlID8gZnVuY3Rpb24oc3R5bGVzLCBuYW1lKSB7IHJldHVybiBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTsgfSA6XHJcbiAgICAgICAgICAgX1NVUFBPUlRTLmdldEF0dHJpYnV0ZSAgICAgPyBmdW5jdGlvbihzdHlsZXMsIG5hbWUpIHsgcmV0dXJuIHN0eWxlcy5nZXRBdHRyaWJ1dGUobmFtZSk7IH0gOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oc3R5bGVzLCBuYW1lKSB7IHJldHVybiBzdHlsZXNbbmFtZV07IH07XHJcbn0oKSk7XHJcblxyXG52YXIgX2N1ckNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGNvbXB1dGVkKSB7XHJcbiAgICB2YXIgc3R5bGUgPSBlbGVtLnN0eWxlLFxyXG4gICAgICAgIHN0eWxlcyA9IGNvbXB1dGVkIHx8IF9nZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIHJldCA9IHN0eWxlcyA/IF9nZXRQcm9wZXJ0eVZhbHVlKHN0eWxlcywgbmFtZSkgfHwgc3R5bGVzW25hbWVdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEF2b2lkIHNldHRpbmcgcmV0IHRvIGVtcHR5IHN0cmluZyBoZXJlXHJcbiAgICAvLyBzbyB3ZSBkb24ndCBkZWZhdWx0IHRvIGF1dG9cclxuICAgIGlmICghXy5leGlzdHMocmV0KSAmJiBzdHlsZSAmJiBzdHlsZVtuYW1lXSkgeyByZXQgPSBzdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgIC8vIEZyb20gdGhlIGhhY2sgYnkgRGVhbiBFZHdhcmRzXHJcbiAgICAvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXHJcblxyXG4gICAgaWYgKHN0eWxlcykge1xyXG4gICAgICAgIGlmIChyZXQgPT09ICcnICYmICFfdXRpbHMuaXNBdHRhY2hlZChlbGVtKSkge1xyXG4gICAgICAgICAgICByZXQgPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXHJcbiAgICAgICAgLy8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXHJcbiAgICAgICAgLy8gYnV0IG5vdCBwb3NpdGlvbiBjc3MgYXR0cmlidXRlcywgYXMgdGhvc2UgYXJlIHByb3BvcnRpb25hbCB0byB0aGUgcGFyZW50IGVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICAgIC8vIGFuZCB3ZSBjYW4ndCBtZWFzdXJlIHRoZSBwYXJlbnQgaW5zdGVhZCBiZWNhdXNlIGl0IG1pZ2h0IHRyaWdnZXIgYSAnc3RhY2tpbmcgZG9sbHMnIHByb2JsZW1cclxuICAgICAgICBpZiAoX3JlZ2V4Lm51bU5vdFB4KHJldCkgJiYgIV9yZWdleC5wb3NpdGlvbihuYW1lKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICBycyA9IGVsZW0ucnVudGltZVN0eWxlLFxyXG4gICAgICAgICAgICAgICAgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDsgfVxyXG5cclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IChuYW1lID09PSAnZm9udFNpemUnKSA/ICcxZW0nIDogcmV0O1xyXG4gICAgICAgICAgICByZXQgPSBfLnRvUHgoc3R5bGUucGl4ZWxMZWZ0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IHJzTGVmdDsgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0ID09PSB1bmRlZmluZWQgPyByZXQgOiByZXQgKyAnJyB8fCAnYXV0byc7XHJcbn07XHJcblxyXG52YXIgX2hvb2tzID0ge1xyXG4gICAgb3BhY2l0eTogX1NVUFBPUlRTLm9wYWNpdHkgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gSUUgdXNlcyBmaWx0ZXJzIGZvciBvcGFjaXR5XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IF9TVVBQT1JUUy5jdXJyZW50U3R5bGUgPyBlbGVtLmN1cnJlbnRTdHlsZS5maWx0ZXIgOiBlbGVtLnN0eWxlLmZpbHRlcjtcclxuICAgICAgICAgICAgcmV0dXJuIF9yZWdleC5vcGFjaXR5LnRlc3Qoc3R5bGUgfHwgJycpID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgKDAuMDEgKiBwYXJzZUZsb2F0KFJlZ0V4cC4kMSkpICsgJycgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzEnO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIHN0eWxlID0gZWxlbS5zdHlsZSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRTdHlsZSA9IGVsZW0uY3VycmVudFN0eWxlLFxyXG4gICAgICAgICAgICAgICAgZmlsdGVyID0gY3VycmVudFN0eWxlICYmIGN1cnJlbnRTdHlsZS5maWx0ZXIgfHwgc3R5bGUuZmlsdGVyIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgc2V0dGluZyBvcGFjaXR5IHRvIDEsIGFuZCBubyBvdGhlciBmaWx0ZXJzIGV4aXN0IC0gcmVtb3ZlIHRoZSBmaWx0ZXIgYXR0cmlidXRlXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA+PSAxIHx8IHZhbHVlID09PSAnJyAmJiBzdHJpbmcudHJpbShmaWx0ZXIucmVwbGFjZShfcmVnZXguYWxwaGEsICcnKSkgPT09ICcnKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0dGluZyBzdHlsZS5maWx0ZXIgdG8gbnVsbCwgJycgJiAnICcgc3RpbGwgbGVhdmUgJ2ZpbHRlcjonIGluIHRoZSBjc3NUZXh0XHJcbiAgICAgICAgICAgICAgICAvLyBpZiAnZmlsdGVyOicgaXMgcHJlc2VudCBhdCBhbGwsIGNsZWFyVHlwZSBpcyBkaXNhYmxlZCwgd2Ugd2FudCB0byBhdm9pZCB0aGlzXHJcbiAgICAgICAgICAgICAgICAvLyBzdHlsZS5yZW1vdmVBdHRyaWJ1dGUgaXMgSUUgT25seSwgYnV0IHNvIGFwcGFyZW50bHkgaXMgdGhpcyBjb2RlIHBhdGguLi5cclxuICAgICAgICAgICAgICAgIHN0eWxlLnJlbW92ZUF0dHJpYnV0ZSgnZmlsdGVyJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gZmlsdGVyIHN0eWxlIGFwcGxpZWQgaW4gYSBjc3MgcnVsZSBvciB1bnNldCBpbmxpbmUgb3BhY2l0eSwgd2UgYXJlIGRvbmVcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJycgfHwgX1NVUFBPUlRTLmN1cnJlbnRTdHlsZSAmJiAhY3VycmVudFN0eWxlLmZpbHRlcikgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSUUgaGFzIHRyb3VibGUgd2l0aCBvcGFjaXR5IGlmIGl0IGRvZXMgbm90IGhhdmUgbGF5b3V0XHJcbiAgICAgICAgICAgIC8vIEZvcmNlIGl0IGJ5IHNldHRpbmcgdGhlIHpvb20gbGV2ZWwuLiBidXQgb25seSBpZiB3ZSdyZVxyXG4gICAgICAgICAgICAvLyBhcHBseWluZyBhIHZhbHVlIChiZWxvdylcclxuICAgICAgICAgICAgc3R5bGUuem9vbSA9IDE7XHJcblxyXG4gICAgICAgICAgICAvLyBPbmx5IGNhbGN1bGF0ZSB0aGUgb3BhY2l0eSBpZiB3ZSdyZSBzZXR0aW5nIGEgdmFsdWUgKGJlbG93KVxyXG4gICAgICAgICAgICB2YXIgb3BhY2l0eSA9IChfLmlzTnVtYmVyKHZhbHVlKSA/ICdhbHBoYShvcGFjaXR5PScgKyAodmFsdWUgKiAxMDApICsgJyknIDogJycpO1xyXG5cclxuICAgICAgICAgICAgc3R5bGUuZmlsdGVyID0gX3JlZ2V4LmFscGhhLnRlc3QoZmlsdGVyKSA/XHJcbiAgICAgICAgICAgICAgICAvLyByZXBsYWNlICdhbHBoYShvcGFjaXR5KScgaW4gdGhlIGZpbHRlciBkZWZpbml0aW9uXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIucmVwbGFjZShfcmVnZXguYWxwaGEsIG9wYWNpdHkpIDpcclxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZCAnYWxwaGEob3BhY2l0eSknIHRvIHRoZSBjdXJyZW50IGZpbHRlciBkZWZpbml0aW9uXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKyAnICcgKyBvcGFjaXR5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbnZhciBfbm9ybWFsaXplQ3NzS2V5ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgcmV0dXJuIF9jc3NLZXlDYWNoZS5nZXQobmFtZSkgfHwgX2Nzc0tleUNhY2hlLnNldChuYW1lLCBfcmVnZXguY2FtZWxDYXNlKG5hbWUpKTtcclxufTtcclxuXHJcbnZhciBfc2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgbmFtZSA9IF9ub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcblxyXG4gICAgaWYgKF9ob29rc1tuYW1lXSAmJiBfaG9va3NbbmFtZV0uc2V0KSB7XHJcbiAgICAgICAgcmV0dXJuIF9ob29rc1tuYW1lXS5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGVsZW0uc3R5bGVbbmFtZV0gPSAodmFsdWUgPT09ICt2YWx1ZSkgPyBfLnRvUHgodmFsdWUpIDogdmFsdWU7XHJcbn07XHJcblxyXG52YXIgX2dldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgbmFtZSA9IF9ub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcblxyXG4gICAgaWYgKF9ob29rc1tuYW1lXSAmJiBfaG9va3NbbmFtZV0uZ2V0KSB7XHJcbiAgICAgICAgcmV0dXJuIF9ob29rc1tuYW1lXS5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIF9nZXRDb21wdXRlZFN0eWxlKGVsZW0pW25hbWVdO1xyXG59O1xyXG5cclxudmFyIF9pc0hpZGRlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQ6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC5vZmZzZXRQYXJlbnRcclxuICAgIHJldHVybiBlbGVtLm9mZnNldFBhcmVudCA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAvLyBTdXBwb3J0OiBPcGVyYSA8PSAxMi4xMlxyXG4gICAgICAgICAgICAvLyBPcGVyYSByZXBvcnRzIG9mZnNldFdpZHRocyBhbmQgb2Zmc2V0SGVpZ2h0cyBsZXNzIHRoYW4gemVybyBvbiBzb21lIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwIHx8XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICgoZWxlbS5zdHlsZSAmJiBlbGVtLnN0eWxlLmRpc3BsYXkpID8gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgOiBmYWxzZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHN3YXAgICAgICAgICAgICAgOiBfY3NzU3dhcCxcclxuICAgIHN3YXBTZXR0aW5nICAgICAgOiBfc3dhcFNldHRpbmdzLFxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZSA6IF9nZXRDb21wdXRlZFN0eWxlLFxyXG4gICAgY3VyQ3NzICAgICAgICAgICA6IF9jdXJDc3MsXHJcblxyXG4gICAgd2lkdGggICAgICAgICAgICA6IF93aWR0aCxcclxuICAgIGhlaWdodCAgICAgICAgICAgOiBfaGVpZ2h0LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY3NzOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZywgby5hbnkoU3RyaW5nLCBOdW1iZXIpKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRTdHlsZSh0aGlzW2lkeF0sIG5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoT2JqZWN0KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRTdHlsZSh0aGlzW2lkeF0sIGtleSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoQXJyYXkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghaWR4KSB7IHJldHVybiByZXQ7IH0gLy8gcmV0dXJuIGVhcmx5XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIV8uaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldFt2YWx1ZV0gPSBfZ2V0U3R5bGUoZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgX2hpZGUoZWxlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgX3Nob3coZWxlbSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKF8uaXNCb29sZWFuKHN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoX2lzSGlkZGVuKHRoaXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9zaG93KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9oaWRlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG4gICAgb3ZlcmxvYWQgICA9IHJlcXVpcmUoJ292ZXJsb2FkLWpzJyksXHJcbiAgICBvICAgICAgICAgID0gb3ZlcmxvYWQubyxcclxuICAgIGNhY2hlICAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIpLFxyXG5cclxuICAgIF9BQ0NFU1NPUiAgPSAnX19EX2lkX18gJyxcclxuXHJcbiAgICBfaWQgPSBfLm5vdygpLFxyXG4gICAgX3VuaXF1ZUlkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIF9pZCsrO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0gPyBlbGVtW19BQ0NFU1NPUl0gOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0T3JTZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IChpZCA9IGVsZW1bX0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtfQUNDRVNTT1JdID0gKGlkID0gX3VuaXF1ZUlkKCkpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gX2dldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBfZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9oYXNEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IF9nZXRJZChlbGVtKSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmhhcyhpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9zZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IF9nZXRPclNldElkKGVsZW0pO1xyXG4gICAgICAgIHJldHVybiBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfcmVtb3ZlQWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBfZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVEYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gX2dldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBoYXM6IF9oYXNEYXRhLFxyXG4gICAgc2V0OiBfc2V0RGF0YSxcclxuICAgIGdldDogZnVuY3Rpb24oZWxlbSwgc3RyKSB7XHJcbiAgICAgICAgaWYgKHN0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZ2V0QWxsRGF0YShlbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF9nZXREYXRhKGVsZW0sIHN0cik7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihlbGVtLCBzdHIpIHtcclxuICAgICAgICBpZiAoc3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9yZW1vdmVBbGxEYXRhKGVsZW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gX3JlbW92ZURhdGEoZWxlbSwgc3RyKTtcclxuICAgIH0sXHJcblxyXG4gICAgRDoge1xyXG4gICAgICAgIGRhdGE6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLy8gTk9URTogTm9kZUxpc3QgfHwgSHRtbENvbGxlY3Rpb24gc3VwcG9ydD9cclxuICAgICAgICAgICAgLmFyZ3Moby5lbGVtZW50LCBTdHJpbmcsIG8ud2lsZClcclxuICAgICAgICAgICAgLnVzZShfc2V0RGF0YSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uZWxlbWVudCwgU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKF9nZXREYXRhKVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5lbGVtZW50LCBPYmplY3QpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oZWxlbSwgbWFwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IF9nZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5O1xyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhvLmVsZW1lbnQpXHJcbiAgICAgICAgICAgIC51c2UoX2dldEFsbERhdGEpXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIGhhc0RhdGE6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3Moby5lbGVtZW50KVxyXG4gICAgICAgICAgICAudXNlKF9oYXNEYXRhKVxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLy8gTk9URTogTm9kZUxpc3QgfHwgSHRtbENvbGxlY3Rpb24gc3VwcG9ydD9cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgLmFyZ3Moby5lbGVtZW50LCBTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoX3JlbW92ZURhdGEpXHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICAuYXJncyhvLmVsZW1lbnQsIEFycmF5KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGVsZW0sIGFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IF9nZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVtpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICAuYXJncyhvLmVsZW1lbnQpXHJcbiAgICAgICAgICAgIC51c2UoX3JlbW92ZUFsbERhdGEpXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKClcclxuICAgIH0sXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBkYXRhOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC8vIFNldCBrZXkncyB2YWx1ZVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcsIG8ud2lsZClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IF9nZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgIC5hcmdzKE9iamVjdClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihtYXApIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IF9nZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBrZXlcclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IF9nZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgZGF0YVxyXG4gICAgICAgICAgICAuYXJncygpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gX2dldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAvLyBOT1RFOiBOb2RlTGlzdCB8fCBIdG1sQ29sbGVjdGlvbiBzdXBwb3J0P1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBfZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICAuYXJncyhBcnJheSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihhcnJheSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1JZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2VsZW1JZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gX2dldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJJZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFycklkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbYXJySWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGRhdGFcclxuICAgICAgICAgICAgLmFyZ3MoKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gX2dldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCA9IHJlcXVpcmUoJ292ZXJsb2FkLWpzJyksXHJcbiAgICBvICAgICAgICA9IG92ZXJsb2FkLm8sXHJcblxyXG4gICAgX2NzcyAgICAgPSByZXF1aXJlKCcuL2NzcycpO1xyXG5cclxudmFyIF9nZXRJbm5lcldpZHRoID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciB3aWR0aCA9IHBhcnNlRmxvYXQoX2Nzcy53aWR0aC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KF9jc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nTGVmdCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChfY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1JpZ2h0JykpIHx8IDApO1xyXG4gICAgfSxcclxuICAgIF9nZXRJbm5lckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChfY3NzLmhlaWdodC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChfY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1RvcCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChfY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldE91dGVyV2lkdGggPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gX2dldElubmVyV2lkdGgoZWxlbSk7XHJcblxyXG4gICAgICAgIGlmICh3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIHdpZHRoICs9IChfLnBhcnNlSW50KF9jc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KF9jc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5SaWdodCcpKSB8fCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KF9jc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJMZWZ0V2lkdGgnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoX2Nzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclJpZ2h0V2lkdGgnKSkgfHwgMCk7XHJcbiAgICB9LFxyXG4gICAgX2dldE91dGVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBfZ2V0SW5uZXJIZWlnaHQoZWxlbSk7XHJcblxyXG4gICAgICAgIGlmICh3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIGhlaWdodCArPSAoXy5wYXJzZUludChfY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KF9jc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Cb3R0b20nKSkgfHwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaGVpZ2h0ICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoX2Nzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclRvcFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KF9jc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKSB8fCAwKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgd2lkdGg6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoTnVtYmVyKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBfY3NzLndpZHRoLnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmZhbGxiYWNrKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChfY3NzLndpZHRoLmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgaGVpZ2h0OiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKE51bWJlcilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgX2Nzcy5oZWlnaHQuc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhvLmFueShudWxsLCB1bmRlZmluZWQpKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZmFsbGJhY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KF9jc3MuaGVpZ2h0LmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgaW5uZXJXaWR0aDogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhvLmFueShudWxsLCB1bmRlZmluZWQpKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZmFsbGJhY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0SW5uZXJXaWR0aChmaXJzdCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgaW5uZXJIZWlnaHQ6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmZhbGxiYWNrKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldElubmVySGVpZ2h0KGZpcnN0KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmV4cG9zZSgpLFxyXG5cclxuICAgICAgICBvdXRlcldpZHRoOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKG8uYW55KG51bGwsIHVuZGVmaW5lZCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBfZ2V0T3V0ZXJXaWR0aChmaXJzdCwgd2l0aE1hcmdpbik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgb3V0ZXJIZWlnaHQ6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmZhbGxiYWNrKGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRPdXRlckhlaWdodChmaXJzdCwgd2l0aE1hcmdpbik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcblxyXG4gICAgX3V0aWxzICAgICAgPSByZXF1aXJlKCcuLi8uLi91dGlscycpLFxyXG4gICAgX2V2ZW50VXRpbHMgPSByZXF1aXJlKCcuL2V2ZW50VXRpbHMnKTtcclxuXHJcbnZhciBFdmVudCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3JjLCBwcm9wcykge1xyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEV2ZW50KSkgeyByZXR1cm4gbmV3IEV2ZW50KHNyYywgcHJvcHMpOyB9XHJcblxyXG4gICAgLy8gRXZlbnQgb2JqZWN0XHJcbiAgICBpZiAoc3JjICYmIHNyYy50eXBlKSB7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbEV2ZW50ID0gc3JjO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IHNyYy50eXBlO1xyXG5cclxuICAgICAgICAvLyBFdmVudHMgYnViYmxpbmcgdXAgdGhlIGRvY3VtZW50IG1heSBoYXZlIGJlZW4gbWFya2VkIGFzIHByZXZlbnRlZFxyXG4gICAgICAgIC8vIGJ5IGEgaGFuZGxlciBsb3dlciBkb3duIHRoZSB0cmVlOyByZWZsZWN0IHRoZSBjb3JyZWN0IHZhbHVlLlxyXG4gICAgICAgIHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gc3JjLmRlZmF1bHRQcmV2ZW50ZWQgfHxcclxuICAgICAgICAgICAgLy8gU3VwcG9ydDogSUUgPCA5XHJcbiAgICAgICAgICAgIChzcmMuZGVmYXVsdFByZXZlbnRlZCA9PT0gdW5kZWZpbmVkICYmIHNyYy5yZXR1cm5WYWx1ZSA9PT0gZmFsc2UpID9cclxuICAgICAgICAgICAgICAgIF91dGlscy5yZXR1cm5UcnVlIDpcclxuICAgICAgICAgICAgICAgICAgICBfdXRpbHMucmV0dXJuRmFsc2U7XHJcblxyXG4gICAgLy8gRXZlbnQgdHlwZVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnR5cGUgPSBzcmM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUHV0IGV4cGxpY2l0bHkgcHJvdmlkZWQgcHJvcGVydGllcyBvbnRvIHRoZSBldmVudCBvYmplY3RcclxuICAgIF8uZXh0ZW5kKHRoaXMsIHByb3BzKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSB0aW1lc3RhbXAgaWYgaW5jb21pbmcgZXZlbnQgZG9lc24ndCBoYXZlIG9uZVxyXG4gICAgdGhpcy50aW1lU3RhbXAgPSBzcmMgJiYgc3JjLnRpbWVTdGFtcCB8fCBfLm5vdygpO1xyXG5cclxuICAgIC8vIE1hcmsgaXQgYXMgZml4ZWRcclxuICAgIHRoaXNbX2V2ZW50VXRpbHMuaWRdID0gdHJ1ZTtcclxufTtcclxuXHJcbi8vIEV2ZW50IGlzIGJhc2VkIG9uIERPTTMgRXZlbnRzIGFzIHNwZWNpZmllZCBieSB0aGUgRUNNQVNjcmlwdCBMYW5ndWFnZSBCaW5kaW5nXHJcbi8vIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMDMvV0QtRE9NLUxldmVsLTMtRXZlbnRzLTIwMDMwMzMxL2VjbWEtc2NyaXB0LWJpbmRpbmcuaHRtbFxyXG5FdmVudC5wcm90b3R5cGUgPSB7XHJcbiAgICBpc0RlZmF1bHRQcmV2ZW50ZWQ6ICAgICAgICAgICAgX3V0aWxzLnJldHVybkZhbHNlLFxyXG4gICAgaXNQcm9wYWdhdGlvblN0b3BwZWQ6ICAgICAgICAgIF91dGlscy5yZXR1cm5GYWxzZSxcclxuICAgIGlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOiBfdXRpbHMucmV0dXJuRmFsc2UsXHJcblxyXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xyXG5cclxuICAgICAgICB0aGlzLmlzRGVmYXVsdFByZXZlbnRlZCA9IF91dGlscy5yZXR1cm5UcnVlO1xyXG4gICAgICAgIGlmICghZSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgLy8gSWYgcHJldmVudERlZmF1bHQgZXhpc3RzLCBydW4gaXQgb24gdGhlIG9yaWdpbmFsIGV2ZW50XHJcbiAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcclxuXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gU3VwcG9ydDogSUVcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHNldCB0aGUgcmV0dXJuVmFsdWUgcHJvcGVydHkgb2YgdGhlIG9yaWdpbmFsIGV2ZW50IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgc3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcclxuXHJcbiAgICAgICAgdGhpcy5pc1Byb3BhZ2F0aW9uU3RvcHBlZCA9IF91dGlscy5yZXR1cm5UcnVlO1xyXG4gICAgICAgIGlmICghZSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgLy8gSWYgc3RvcFByb3BhZ2F0aW9uIGV4aXN0cywgcnVuIGl0IG9uIHRoZSBvcmlnaW5hbCBldmVudFxyXG4gICAgICAgIGlmIChlLnN0b3BQcm9wYWdhdGlvbikge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydDogSUVcclxuICAgICAgICAvLyBTZXQgdGhlIGNhbmNlbEJ1YmJsZSBwcm9wZXJ0eSBvZiB0aGUgb3JpZ2luYWwgZXZlbnQgdG8gdHJ1ZVxyXG4gICAgICAgIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSBfdXRpbHMucmV0dXJuVHJ1ZTtcclxuICAgICAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfVxyXG59OyIsInZhciBfICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCAgPSByZXF1aXJlKCdvdmVybG9hZC1qcycpLFxyXG4gICAgbyAgICAgICAgID0gb3ZlcmxvYWQubyxcclxuXHJcbiAgICBfdXRpbHMgICAgPSByZXF1aXJlKCcuLi8uLi91dGlscycpLFxyXG4gICAgX2V2ZW50ICAgID0gcmVxdWlyZSgnLi9ldmVudCcpLFxyXG4gICAgX3NwZWNpYWxzID0gcmVxdWlyZSgnLi9ldmVudFNwZWNpYWxzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcblxyXG4gICAgICAgIG9uOiBmdW5jdGlvbih0eXBlcywgc2VsZWN0b3IsIGRhdGEsIGZuLCAvKklOVEVSTkFMKi8gb25lKSB7XHJcbiAgICAgICAgICAgIC8vIFR5cGVzIGNhbiBiZSBhIG1hcCBvZiB0eXBlcy9oYW5kbGVyc1xyXG4gICAgICAgICAgICBpZiAoXy5pc09iamVjdCh0eXBlcykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAoIHR5cGVzLU9iamVjdCwgc2VsZWN0b3IsIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgaWYgKCFfLmlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICggdHlwZXMtT2JqZWN0LCBkYXRhIClcclxuICAgICAgICAgICAgICAgICAgICBkYXRhID0gZGF0YSB8fCBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RvciA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdHlwZTtcclxuICAgICAgICAgICAgICAgIGZvciAodHlwZSBpbiB0eXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub24odHlwZSwgc2VsZWN0b3IsIGRhdGEsIHR5cGVzW3R5cGVdLCBvbmUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIV8uZXhpc3RzKGRhdGEpICYmICFfLmV4aXN0cyhmbikpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAoIHR5cGVzLCBmbiApXHJcbiAgICAgICAgICAgICAgICBmbiA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHNlbGVjdG9yID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmICghXy5leGlzdHMoZm4pKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vICggdHlwZXMsIHNlbGVjdG9yLCBmbiApXHJcbiAgICAgICAgICAgICAgICAgICAgZm4gPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gKCB0eXBlcywgZGF0YSwgZm4gKVxyXG4gICAgICAgICAgICAgICAgICAgIGZuID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3IgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZm4gPT09IGZhbHNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZm4gPSBfdXRpbHMucmV0dXJuRmFsc2U7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFmbikge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIHNlbGYgcmVtb3ZpbmcgYnkgYWRkaW5nIGEgdW5pcXVlIG5hbWVzcGFjZSBhbmQgdGhlbiB1bmJpbmRpbmcgdGhhdCBuYW1lc3BhY2VcclxuICAgICAgICAgICAgdmFyIG9yaWdGbjtcclxuICAgICAgICAgICAgaWYgKG9uZSA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgb3JpZ0ZuID0gZm47XHJcbiAgICAgICAgICAgICAgICBmbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2FuIHVzZSBhbiBlbXB0eSBzZXQsIHNpbmNlIGV2ZW50IGNvbnRhaW5zIHRoZSBpbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogQWRkcmVzcyB0aGlzXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCkub2ZmKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ0ZuLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgX2V2ZW50LmFkZChlbGVtLCB0eXBlcywgZm4sIGRhdGEsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIG9uY2U6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoT2JqZWN0KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGV2ZW50cykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKGV2ZW50cywgZnVuY3Rpb24oZm4sIGV2dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub25jZShldnQsIGZuKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhPYmplY3QsIFN0cmluZylcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihldmVudHMsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goZXZlbnRzLCBmdW5jdGlvbihmbiwgZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vbmNlKGV2dCwgc2VsZWN0b3IsIGZuKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcsIEZ1bmN0aW9uKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGV2dCwgZm4pIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vbih0eXBlcywgc2VsZWN0b3IsIGRhdGEsIGZuLCAxKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcsIFN0cmluZywgRnVuY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oZXZ0LCBzZWxlY3RvciwgZm4pIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vbih0eXBlcywgc2VsZWN0b3IsIGRhdGEsIGZuLCAxKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIC8vICBUT0RPOiBEb24ndCB1c2UgdGhlIHN0dXBpZCAxIG9uIHRoZSBlbmRcclxuICAgICAgICBvbmU6IGZ1bmN0aW9uKHR5cGVzLCBzZWxlY3RvciwgZGF0YSwgZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub25jZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZjogb3ZlcmxvYWQoKVxyXG5cclxuICAgICAgICAgICAgLy8gSW4gbGV1IG9mIHsgc3RyaW5nOiBmdW5jdGlvbiB9LCBzaW5jZSB3ZVxyXG4gICAgICAgICAgICAvLyBkb250IGFsbG93IGZ1bmN0aW9ucyBpbiB0aGUgb2ZmLCBhbGxvdyBhbiBhcnJheVxyXG4gICAgICAgICAgICAvLyBvZiBzdHJpbmdzIGluc3RlYWQuLi5cclxuICAgICAgICAgICAgLmFyZ3MoQXJyYXkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX2V2ZW50LnJlbW92ZShlbGVtLCBldnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAvLyAuLi5hbmQsIG9mIGNvdXJzZSwgYWxsb3cgYSBzZWxlY3RvclxyXG4gICAgICAgICAgICAuYXJncyhBcnJheSwgU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGFyciwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfZXZlbnQucmVtb3ZlKGVsZW0sIGV2dCwgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBfZXZlbnQucmVtb3ZlKGVsZW0sIGV2dCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZywgU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGV2dCwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9ldmVudC5yZW1vdmUoZWxlbSwgZXZ0LCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhfdXRpbHMucmV0dXJuVGhpcylcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgdHJpZ2dlcjogZnVuY3Rpb24odHlwZSwgZGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIF9ldmVudC50cmlnZ2VyKHR5cGUsIGRhdGEsIGVsZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0cmlnZ2VySGFuZGxlcjogZnVuY3Rpb24odHlwZSwgZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF9ldmVudC50cmlnZ2VyKHR5cGUsIGRhdGEsIGZpcnN0LCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcclxuXHJcbiAgICBFdmVudCAgICAgICA9IHJlcXVpcmUoJy4vRScpLFxyXG4gICAgX25vZGVUeXBlICAgPSByZXF1aXJlKCdub2RlLXR5cGUnKSxcclxuICAgIF9yZWdleCAgICAgID0gcmVxdWlyZSgnLi4vLi4vcmVnZXgnKSxcclxuICAgIF91dGlscyAgICAgID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMnKSxcclxuICAgIF9hcnJheSAgICAgID0gcmVxdWlyZSgnLi4vYXJyYXknKSxcclxuICAgIF9kYXRhICAgICAgID0gcmVxdWlyZSgnLi4vZGF0YScpLFxyXG4gICAgX2V2ZW50VXRpbHMgPSByZXF1aXJlKCcuL2V2ZW50VXRpbHMnKSxcclxuXHJcbiAgICBfZ2xvYmFsICAgICA9IHt9LFxyXG5cclxuICAgIF9FVkVOVF9LRVkgID0gJ19fRF9ldmVudHNfXycsXHJcbiAgICBfTk9PUF9PQkogICA9IHt9LFxyXG4gICAgX0NMSUNLID0ge1xyXG4gICAgICAgIG5vbmUgIDogMCxcclxuICAgICAgICBsZWZ0ICA6IDEsXHJcbiAgICAgICAgbWlkZGxlOiAyLFxyXG4gICAgICAgIHJpZ2h0IDogM1xyXG4gICAgfTtcclxuXHJcbnZhciBfYWRkID0gZnVuY3Rpb24oZWxlbSwgZXZlbnRTdHIsIGhhbmRsZXIsIGRhdGEsIHNlbGVjdG9yKSB7XHJcbiAgICAvLyBEb24ndCBhdHRhY2ggZXZlbnRzIHRvIHRleHQvY29tbWVudCBub2Rlc1xyXG4gICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcclxuICAgIGlmIChub2RlVHlwZSA9PT0gX25vZGVUeXBlLlRFWFQgfHxcclxuICAgICAgICBub2RlVHlwZSA9PT0gX25vZGVUeXBlLkNPTU1FTlQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIGV2ZW50RGF0YSA9IF9kYXRhLmdldChlbGVtLCBfRVZFTlRfS0VZKTtcclxuICAgIGlmICghZXZlbnREYXRhKSB7XHJcbiAgICAgICAgZXZlbnREYXRhID0ge307XHJcbiAgICAgICAgX2RhdGEuc2V0KGVsZW0sIF9FVkVOVF9LRVksIGV2ZW50RGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGV2ZW50SGFuZGxlO1xyXG4gICAgaWYgKCEoZXZlbnRIYW5kbGUgPSBldmVudERhdGEuaGFuZGxlKSkge1xyXG4gICAgICAgIGV2ZW50SGFuZGxlID0gZXZlbnREYXRhLmhhbmRsZSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgLy8gRGlzY2FyZCB0aGUgc2Vjb25kIGV2ZW50IG9mIGEgRC5ldmVudC50cmlnZ2VyKCkgYW5kXHJcbiAgICAgICAgICAgIC8vIHdoZW4gYW4gZXZlbnQgaXMgY2FsbGVkIGFmdGVyIGEgcGFnZSBoYXMgdW5sb2FkZWRcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBEICE9PSAndW5kZWZpbmVkJyAmJiAoIWUgfHwgRC5ldmVudC50cmlnZ2VyZWQgIT09IGUudHlwZSkgP1xyXG4gICAgICAgICAgICAgICAgX2Rpc3BhdGNoLmFwcGx5KGV2ZW50SGFuZGxlLmVsZW0sIGFyZ3VtZW50cykgOlxyXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEFkZCBlbGVtIGFzIGEgcHJvcGVydHkgb2YgdGhlIGhhbmRsZSBmbiB0byBwcmV2ZW50IGEgbWVtb3J5IGxlYWsgd2l0aCBJRSBub24tbmF0aXZlIGV2ZW50c1xyXG4gICAgICAgIGV2ZW50SGFuZGxlLmVsZW0gPSBlbGVtO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZSBtdWx0aXBsZSBldmVudFN0ciBzZXBhcmF0ZWQgYnkgYSBzcGFjZVxyXG4gICAgdmFyIGV2ZW50U3RySW5zdGFuY2VzID0gX3JlZ2V4Lm1hdGNoTm90V2hpdGUoZXZlbnRTdHIpLFxyXG4gICAgICAgIGlkeCA9IGV2ZW50U3RySW5zdGFuY2VzLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG5cclxuICAgICAgICB2YXIgdG1wID0gX3JlZ2V4LnR5cGVOYW1lc3BhY2UoZXZlbnRTdHJJbnN0YW5jZXNbaWR4XSkgfHwgW10sXHJcbiAgICAgICAgICAgIHR5cGUgPSB0bXBbMV0sXHJcbiAgICAgICAgICAgIG9yaWdUeXBlID0gdHlwZTtcclxuICAgICAgICAvLyBUaGVyZSAqbXVzdCogYmUgYSB0eXBlLCBubyBhdHRhY2hpbmcgbmFtZXNwYWNlLW9ubHkgaGFuZGxlcnNcclxuICAgICAgICBpZiAoIXR5cGUpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgdmFyIG5hbWVzcGFjZXMgPSAodG1wWzJdIHx8ICcnKS5zcGxpdCgnLicpLnNvcnQoKSxcclxuICAgICAgICAgICAgLy8gSWYgZXZlbnQgY2hhbmdlcyBpdHMgdHlwZSwgdXNlIHRoZSBzcGVjaWFsIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgY2hhbmdlZCB0eXBlXHJcbiAgICAgICAgICAgIHNwZWNpYWwgPSBfc3BlY2lhbFt0eXBlXSB8fCBfTk9PUF9PQko7XHJcblxyXG4gICAgICAgIC8vIElmIHNlbGVjdG9yIGRlZmluZWQsIGRldGVybWluZSBzcGVjaWFsIGV2ZW50IGFwaSB0eXBlLCBvdGhlcndpc2UgZ2l2ZW4gdHlwZVxyXG4gICAgICAgIHR5cGUgPSAoc2VsZWN0b3IgPyBzcGVjaWFsLmRlbGVnYXRlVHlwZSA6IHNwZWNpYWwuYmluZFR5cGUpIHx8IHR5cGU7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0ZSBzcGVjaWFsIGJhc2VkIG9uIG5ld2x5IHJlc2V0IHR5cGVcclxuICAgICAgICBzcGVjaWFsID0gX3NwZWNpYWxbdHlwZV0gfHwgX05PT1BfT0JKO1xyXG5cclxuICAgICAgICAvLyBoYW5kbGVPYmogaXMgcGFzc2VkIHRvIGFsbCBldmVudCBoYW5kbGVyc1xyXG4gICAgICAgIHZhciBoYW5kbGVPYmogPSB7XHJcbiAgICAgICAgICAgIHR5cGUgICAgICAgIDogdHlwZSxcclxuICAgICAgICAgICAgb3JpZ1R5cGUgICAgOiBvcmlnVHlwZSxcclxuICAgICAgICAgICAgaGFuZGxlciAgICAgOiBoYW5kbGVyLFxyXG4gICAgICAgICAgICBzZWxlY3RvciAgICA6IHNlbGVjdG9yLFxyXG4gICAgICAgICAgICAvLyBUT0RPOiBJZiB0aGUgZXZlbnQgc3lzdGVtIGNoYW5nZXMgdG8gbm90IG5lZWRpbmcgdGhpcywgcmVtZW1iZXIgdG8gcmVtb3ZlIGl0IGhlcmUgYW5kIGluIF9yZWdleFxyXG4gICAgICAgICAgICBuZWVkc0NvbnRleHQ6IHNlbGVjdG9yICYmIF9yZWdleC5uZWVkc0NvbnRleHQoc2VsZWN0b3IpLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2UgICA6IG5hbWVzcGFjZXMuam9pbignLicpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIGhhbmRsZXJzO1xyXG4gICAgICAgIC8vIEluaXQgdGhlIGV2ZW50IGhhbmRsZXIgcXVldWUgaWYgd2UncmUgdGhlIGZpcnN0XHJcbiAgICAgICAgaWYgKCEoaGFuZGxlcnMgPSBldmVudERhdGFbdHlwZV0pKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZXJzID0gZXZlbnREYXRhW3R5cGVdID0gW107XHJcbiAgICAgICAgICAgIGhhbmRsZXJzLmRlbGVnYXRlQ291bnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgLy8gT25seSB1c2UgYWRkIHRoZSBldmVudCBpZiB0aGUgc3BlY2lhbCBldmVudHMgaGFuZGxlciByZXR1cm5zIGZhbHNlXHJcbiAgICAgICAgICAgIC8vIFRPRE86IGluIHNwZWNpYWwuc2V0dXAuY2FsbCwgdGhlIG51bGwgdXNlZCB0byBiZSBkYXRhLiBjaGVjayBpZiBhbnkgc3BlY2lhbHMgYXJlIHVzaW5nIHRoZSBkYXRhXHJcbiAgICAgICAgICAgIGlmICghc3BlY2lhbC5zZXR1cCB8fCBzcGVjaWFsLnNldHVwLmNhbGwoZWxlbSwgbnVsbCwgbmFtZXNwYWNlcywgZXZlbnRIYW5kbGUpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQmluZCB0aGUgZ2xvYmFsIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgIF9ldmVudFV0aWxzLmFkZEV2ZW50KGVsZW0sIHR5cGUsIGV2ZW50SGFuZGxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNwZWNpYWwuYWRkKSB7XHJcbiAgICAgICAgICAgIHNwZWNpYWwuYWRkLmNhbGwoZWxlbSwgaGFuZGxlT2JqKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFkZCB0byB0aGUgZWxlbWVudCdzIGhhbmRsZXIgbGlzdCwgZGVsZWdhdGVzIGluIGZyb250XHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZXJzLnNwbGljZShoYW5kbGVycy5kZWxlZ2F0ZUNvdW50KyssIDAsIGhhbmRsZU9iaik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaGFuZGxlcnMucHVzaChoYW5kbGVPYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiB3aGljaCBldmVudHMgaGF2ZSBldmVyIGJlZW4gdXNlZCwgZm9yIGV2ZW50IG9wdGltaXphdGlvblxyXG4gICAgICAgIF9nbG9iYWxbdHlwZV0gPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE51bGxpZnkgZWxlbSB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRVxyXG4gICAgZWxlbSA9IG51bGw7XHJcbn07XHJcblxyXG4vLyBEZXRhY2ggYW4gZXZlbnQgb3Igc2V0IG9mIGV2ZW50cyBmcm9tIGFuIGVsZW1lbnRcclxudmFyIF9yZW1vdmUgPSBmdW5jdGlvbihlbGVtLCB0eXBlcywgc2VsZWN0b3IsIG1hcHBlZFR5cGVzKSB7XHJcbiAgICB2YXIgZWxlbURhdGEgPSBfZGF0YS5oYXMoZWxlbSkgJiYgX2RhdGEuZ2V0KGVsZW0pLFxyXG4gICAgICAgIGV2ZW50cztcclxuICAgIGlmICghZWxlbURhdGEgfHwgIShldmVudHMgPSBlbGVtRGF0YVtfRVZFTlRfS0VZXSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gT25jZSBmb3IgZWFjaCB0eXBlLm5hbWVzcGFjZSBpbiB0eXBlczsgdHlwZSBtYXkgYmUgb21pdHRlZFxyXG4gICAgdHlwZXMgPSBfcmVnZXgubWF0Y2hOb3RXaGl0ZSh0eXBlcykgfHwgWycnXTtcclxuXHJcbiAgICB2YXIgaWR4ID0gdHlwZXMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgdmFyIHRtcCA9IF9yZWdleC50eXBlTmFtZXNwYWNlKHR5cGVzW2lkeF0pIHx8IFtdLFxyXG4gICAgICAgICAgICB0eXBlID0gdG1wWzFdLFxyXG4gICAgICAgICAgICBvcmlnVHlwZSA9IHR5cGUsXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZXMgPSAodG1wWzJdIHx8ICcnKS5zcGxpdCgnLicpLnNvcnQoKTtcclxuXHJcbiAgICAgICAgLy8gVW5iaW5kIGFsbCBldmVudHMgKG9uIHRoaXMgbmFtZXNwYWNlLCBpZiBwcm92aWRlZCkgZm9yIHRoZSBlbGVtZW50XHJcbiAgICAgICAgaWYgKCF0eXBlKSB7XHJcbiAgICAgICAgICAgIGZvciAodHlwZSBpbiBldmVudHMpIHtcclxuICAgICAgICAgICAgICAgIF9yZW1vdmUoZWxlbSwgdHlwZSArIHR5cGVzW2lkeF0sIHNlbGVjdG9yLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzcGVjaWFsID0gX3NwZWNpYWxbdHlwZV0gfHwge307XHJcbiAgICAgICAgdHlwZSA9IChzZWxlY3RvciA/IHNwZWNpYWwuZGVsZWdhdGVUeXBlIDogc3BlY2lhbC5iaW5kVHlwZSkgfHwgdHlwZTtcclxuXHJcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gZXZlbnRzW3R5cGVdIHx8IFtdO1xyXG4gICAgICAgIHRtcCA9IHRtcFsyXSAmJiBuZXcgUmVnRXhwKCcoXnxcXFxcLiknICsgbmFtZXNwYWNlcy5qb2luKCdcXFxcLig/Oi4qXFxcXC58KScpICsgJyhcXFxcLnwkKScpO1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgbWF0Y2hpbmcgZXZlbnRzXHJcbiAgICAgICAgdmFyIG9yaWdDb3VudCwgaSwgaGFuZGxlT2JqO1xyXG4gICAgICAgIG9yaWdDb3VudCA9IGkgPSBoYW5kbGVycy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICBoYW5kbGVPYmogPSBoYW5kbGVyc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIChtYXBwZWRUeXBlcyB8fCBvcmlnVHlwZSA9PT0gaGFuZGxlT2JqLm9yaWdUeXBlKSAmJlxyXG4gICAgICAgICAgICAgICAgKCF0bXAgICAgICAgIHx8IHRtcC50ZXN0KGhhbmRsZU9iai5uYW1lc3BhY2UpKSAgJiZcclxuICAgICAgICAgICAgICAgICghc2VsZWN0b3IgICB8fCBzZWxlY3RvciA9PT0gaGFuZGxlT2JqLnNlbGVjdG9yICB8fCBzZWxlY3RvciA9PT0gJyoqJyAmJiBoYW5kbGVPYmouc2VsZWN0b3IpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuc3BsaWNlKGksIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVPYmouc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVycy5kZWxlZ2F0ZUNvdW50LS07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3BlY2lhbC5yZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBzcGVjaWFsLnJlbW92ZS5jYWxsKGVsZW0sIGhhbmRsZU9iaik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBnZW5lcmljIGV2ZW50IGhhbmRsZXIgaWYgd2UgcmVtb3ZlZCBzb21ldGhpbmcgYW5kIG5vIG1vcmUgaGFuZGxlcnMgZXhpc3RcclxuICAgICAgICAvLyAoYXZvaWRzIHBvdGVudGlhbCBmb3IgZW5kbGVzcyByZWN1cnNpb24gZHVyaW5nIHJlbW92YWwgb2Ygc3BlY2lhbCBldmVudCBoYW5kbGVycylcclxuICAgICAgICBpZiAob3JpZ0NvdW50ICYmICFoYW5kbGVycy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKCFzcGVjaWFsLnRlYXJkb3duIHx8IHNwZWNpYWwudGVhcmRvd24uY2FsbChlbGVtLCBuYW1lc3BhY2VzLCBlbGVtRGF0YS5oYW5kbGUpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5LnJlbW92ZUV2ZW50KGVsZW0sIHR5cGUsIGVsZW1EYXRhLmhhbmRsZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgZXZlbnRzIGlmIGl0J3Mgbm8gbG9uZ2VyIHVzZWRcclxuICAgIGlmICghXy5oYXNTaXplKGV2ZW50cykpIHtcclxuICAgICAgICBkZWxldGUgZWxlbURhdGEuaGFuZGxlO1xyXG5cclxuICAgICAgICAvLyByZW1vdmVEYXRhIGFsc28gY2hlY2tzIGZvciBlbXB0aW5lc3MgYW5kIGNsZWFycyB0aGUgZXZlbnRzIGlmIGVtcHR5XHJcbiAgICAgICAgLy8gc28gdXNlIGl0IGluc3RlYWQgb2YgZGVsZXRlXHJcbiAgICAgICAgX2RhdGEucmVtb3ZlKGVsZW0sIF9FVkVOVF9LRVkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIF90cmlnZ2VyID0gZnVuY3Rpb24oZXZlbnQsIGRhdGEsIGVsZW0sIG9ubHlIYW5kbGVycykge1xyXG4gICAgdmFyIGV2ZW50UGF0aCA9IFtlbGVtIHx8IGRvY3VtZW50XSxcclxuICAgICAgICB0eXBlID0gZXZlbnQudHlwZSB8fCBldmVudCxcclxuICAgICAgICBuYW1lc3BhY2VzID0gZXZlbnQubmFtZXNwYWNlID8gZXZlbnQubmFtZXNwYWNlLnNwbGl0KCcuJykgOiBbXTtcclxuXHJcbiAgICB2YXIgY3VyLCB0bXA7XHJcbiAgICBjdXIgPSB0bXAgPSBlbGVtID0gZWxlbSB8fCBkb2N1bWVudDtcclxuXHJcbiAgICAvLyBEb24ndCBkbyBldmVudHMgb24gdGV4dCBhbmQgY29tbWVudCBub2Rlc1xyXG4gICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IF9ub2RlVHlwZS5URVhUIHx8IGVsZW0ubm9kZVR5cGUgPT09IF9ub2RlVHlwZS5DT01NRU5UKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGZvY3VzL2JsdXIgbW9ycGhzIHRvIGZvY3VzaW4vb3V0OyBlbnN1cmUgd2UncmUgbm90IGZpcmluZyB0aGVtIHJpZ2h0IG5vd1xyXG4gICAgaWYgKF9yZWdleC5mb2N1c01vcnBoKHR5cGUgKyBELmV2ZW50LnRyaWdnZXJlZCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGUuaW5kZXhPZignLicpID49IDApIHtcclxuICAgICAgICAvLyBOYW1lc3BhY2VkIHRyaWdnZXI7IGNyZWF0ZSBhIHJlZ2V4cCB0byBtYXRjaCBldmVudCB0eXBlIGluIGhhbmRsZSgpXHJcbiAgICAgICAgbmFtZXNwYWNlcyA9IHR5cGUuc3BsaXQoJy4nKTtcclxuICAgICAgICB0eXBlID0gbmFtZXNwYWNlcy5zaGlmdCgpO1xyXG4gICAgICAgIG5hbWVzcGFjZXMuc29ydCgpO1xyXG4gICAgfVxyXG4gICAgdmFyIG9udHlwZSA9IHR5cGUuaW5kZXhPZignOicpIDwgMCAmJiAnb24nICsgdHlwZTtcclxuXHJcbiAgICAvLyBDYWxsZXIgY2FuIHBhc3MgaW4gYSBFdmVudCBvYmplY3QsIE9iamVjdCwgb3IganVzdCBhbiBldmVudCB0eXBlIHN0cmluZ1xyXG4gICAgZXZlbnQgPSBldmVudFtfZXZlbnRVdGlscy5pZF0gP1xyXG4gICAgICAgIGV2ZW50IDpcclxuICAgICAgICBuZXcgRXZlbnQodHlwZSwgZXZlbnQgJiYgXy5pc09iamVjdChldmVudCkpO1xyXG5cclxuICAgIC8vIFRyaWdnZXIgYml0bWFzazogJiAxIGZvciBuYXRpdmUgaGFuZGxlcnM7ICYgMiBmb3IgalF1ZXJ5IChhbHdheXMgdHJ1ZSlcclxuICAgIGV2ZW50LmlzVHJpZ2dlciA9IG9ubHlIYW5kbGVycyA/IDIgOiAzO1xyXG4gICAgZXZlbnQubmFtZXNwYWNlID0gbmFtZXNwYWNlcy5qb2luKCcuJyk7XHJcbiAgICBldmVudC5uYW1lc3BhY2VSZWdleCA9IGV2ZW50Lm5hbWVzcGFjZSA/XHJcbiAgICAgICAgbmV3IFJlZ0V4cCgnKF58XFxcXC4pJyArIG5hbWVzcGFjZXMuam9pbignXFxcXC4oPzouKlxcXFwufCknKSArICcoXFxcXC58JCknKSA6XHJcbiAgICAgICAgbnVsbDtcclxuXHJcbiAgICAvLyBDbGVhbiB1cCB0aGUgZXZlbnQgaW4gY2FzZSBpdCBpcyBiZWluZyByZXVzZWRcclxuICAgIGV2ZW50LnJlc3VsdCA9IHVuZGVmaW5lZDtcclxuICAgIGV2ZW50LnRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBlbGVtO1xyXG5cclxuICAgIC8vIENsb25lIGFueSBpbmNvbWluZyBkYXRhIGFuZCBwcmVwZW5kIHRoZSBldmVudCwgY3JlYXRpbmcgdGhlIGhhbmRsZXIgYXJnIGxpc3RcclxuICAgIGRhdGEgPSAhXy5leGlzdHMoZGF0YSkgPyBbZXZlbnRdIDogW2V2ZW50LCBkYXRhXTtcclxuXHJcbiAgICAvLyBBbGxvdyBzcGVjaWFsIGV2ZW50cyB0byBkcmF3IG91dHNpZGUgdGhlIGxpbmVzXHJcbiAgICB2YXIgc3BlY2lhbCA9IF9zcGVjaWFsW3R5cGVdIHx8IHt9O1xyXG4gICAgaWYgKCFvbmx5SGFuZGxlcnMgJiYgc3BlY2lhbC50cmlnZ2VyICYmIHNwZWNpYWwudHJpZ2dlci5hcHBseShlbGVtLCBkYXRhKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIGV2ZW50IHByb3BhZ2F0aW9uIHBhdGggaW4gYWR2YW5jZSwgcGVyIFczQyBldmVudHMgc3BlYyAoIzk5NTEpXHJcbiAgICAvLyBCdWJibGUgdXAgdG8gZG9jdW1lbnQsIHRoZW4gdG8gd2luZG93OyB3YXRjaCBmb3IgYSBnbG9iYWwgb3duZXJEb2N1bWVudCB2YXIgKCM5NzI0KVxyXG4gICAgdmFyIGJ1YmJsZVR5cGU7XHJcbiAgICBpZiAoIW9ubHlIYW5kbGVycyAmJiAhc3BlY2lhbC5ub0J1YmJsZSAmJiAhXy5pc1dpbmRvdyhlbGVtKSkge1xyXG5cclxuICAgICAgICBidWJibGVUeXBlID0gc3BlY2lhbC5kZWxlZ2F0ZVR5cGUgfHwgdHlwZTtcclxuICAgICAgICBpZiAoIV9yZWdleC5mb2N1c01vcnBoKGJ1YmJsZVR5cGUgKyB0eXBlKSkge1xyXG4gICAgICAgICAgICBjdXIgPSBjdXIucGFyZW50Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICg7IGN1cjsgY3VyID0gY3VyLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgZXZlbnRQYXRoLnB1c2goY3VyKTtcclxuICAgICAgICAgICAgdG1wID0gY3VyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT25seSBhZGQgd2luZG93IGlmIHdlIGdvdCB0byBkb2N1bWVudCAoZS5nLiwgbm90IGRldGFjaGVkIERPTSlcclxuICAgICAgICBpZiAodG1wID09PSAoZWxlbS5vd25lckRvY3VtZW50IHx8IGRvY3VtZW50KSkge1xyXG4gICAgICAgICAgICBldmVudFBhdGgucHVzaCh0bXAuZGVmYXVsdFZpZXcgfHwgdG1wLnBhcmVudFdpbmRvdyB8fCB3aW5kb3cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXJlIGhhbmRsZXJzIG9uIHRoZSBldmVudCBwYXRoXHJcbiAgICB2YXIgaWR4ID0gMCwgaGFuZGxlO1xyXG4gICAgd2hpbGUgKChjdXIgPSBldmVudFBhdGhbaWR4KytdKSAmJiAhZXZlbnQuaXNQcm9wYWdhdGlvblN0b3BwZWQoKSkge1xyXG5cclxuICAgICAgICBldmVudC50eXBlID0gaWR4ID4gMSA/XHJcbiAgICAgICAgICAgIGJ1YmJsZVR5cGUgOlxyXG4gICAgICAgICAgICBzcGVjaWFsLmJpbmRUeXBlIHx8IHR5cGU7XHJcblxyXG4gICAgICAgIC8vIGpRdWVyeSBoYW5kbGVyXHJcbiAgICAgICAgdmFyIGV2ZW50RGF0YSA9IF9kYXRhLmdldChjdXIsIF9FVkVOVF9LRVkpIHx8IHt9O1xyXG4gICAgICAgIGhhbmRsZSA9IGV2ZW50RGF0YVtldmVudC50eXBlXSAmJiBldmVudERhdGEuaGFuZGxlO1xyXG5cclxuICAgICAgICBpZiAoaGFuZGxlKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZS5hcHBseShjdXIsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTmF0aXZlIGhhbmRsZXJcclxuICAgICAgICBoYW5kbGUgPSBvbnR5cGUgJiYgY3VyW29udHlwZV07XHJcbiAgICAgICAgLy8gTk9URTogUHVsbGVkIG91dCBqUXVlcnkuYWNjZXB0RGF0YShjdXIpIGFzIHdlIGRvbid0IGFsbG93IG5vbi1lbGVtZW50IHR5cGVzXHJcbiAgICAgICAgaWYgKGhhbmRsZSAmJiBoYW5kbGUuYXBwbHkpIHtcclxuICAgICAgICAgICAgZXZlbnQucmVzdWx0ID0gaGFuZGxlLmFwcGx5KGN1ciwgZGF0YSk7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5yZXN1bHQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZXZlbnQudHlwZSA9IHR5cGU7XHJcblxyXG4gICAgLy8gSWYgbm9ib2R5IHByZXZlbnRlZCB0aGUgZGVmYXVsdCBhY3Rpb24sIGRvIGl0IG5vd1xyXG4gICAgaWYgKCFvbmx5SGFuZGxlcnMgJiYgIWV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpKSB7XHJcblxyXG4gICAgICAgIC8vIE5PVEU6IFB1bGxlZCBvdXQgalF1ZXJ5LmFjY2VwdERhdGEoZWxlbSkgYXMgd2UgZG9uJ3QgYWxsb3cgbm9uLWVsZW1lbnQgdHlwZXNcclxuICAgICAgICBpZiAoIXNwZWNpYWwuX2RlZmF1bHQgfHwgc3BlY2lhbC5fZGVmYXVsdC5hcHBseShldmVudFBhdGgucG9wKCksIGRhdGEpID09PSBmYWxzZSkge1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsbCBhIG5hdGl2ZSBET00gbWV0aG9kIG9uIHRoZSB0YXJnZXQgd2l0aCB0aGUgc2FtZSBuYW1lIG5hbWUgYXMgdGhlIGV2ZW50LlxyXG4gICAgICAgICAgICAvLyBDYW4ndCB1c2UgYW4gLmlzRnVuY3Rpb24oKSBjaGVjayBoZXJlIGJlY2F1c2UgSUU2LzcgZmFpbHMgdGhhdCB0ZXN0LlxyXG4gICAgICAgICAgICAvLyBEb24ndCBkbyBkZWZhdWx0IGFjdGlvbnMgb24gd2luZG93LCB0aGF0J3Mgd2hlcmUgZ2xvYmFsIHZhcmlhYmxlcyBiZSAoIzYxNzApXHJcbiAgICAgICAgICAgIGlmIChvbnR5cGUgJiYgZWxlbVt0eXBlXSAmJiAhXy5pc1dpbmRvdyhlbGVtKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvbid0IHJlLXRyaWdnZXIgYW4gb25GT08gZXZlbnQgd2hlbiB3ZSBjYWxsIGl0cyBGT08oKSBtZXRob2RcclxuICAgICAgICAgICAgICAgIHRtcCA9IGVsZW1bb250eXBlXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodG1wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbVtvbnR5cGVdID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IHJlLXRyaWdnZXJpbmcgb2YgdGhlIHNhbWUgZXZlbnQsIHNpbmNlIHdlIGFscmVhZHkgYnViYmxlZCBpdCBhYm92ZVxyXG4gICAgICAgICAgICAgICAgRC5ldmVudC50cmlnZ2VyZWQgPSB0eXBlO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbVt0eXBlXSgpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElFIDwgOSBkaWVzIG9uIGZvY3VzL2JsdXIgdG8gaGlkZGVuIGVsZW1lbnQgKCMxNDg2LCAjMTI1MTgpXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb25seSByZXByb2R1Y2libGUgb24gd2luWFAgSUU4IG5hdGl2ZSwgbm90IElFOSBpbiBJRTggbW9kZVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIEQuZXZlbnQudHJpZ2dlcmVkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0bXApIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtW29udHlwZV0gPSB0bXA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGV2ZW50LnJlc3VsdDtcclxufTtcclxuXHJcbnZhciBfZGlzcGF0Y2ggPSBmdW5jdGlvbihldmVudCkge1xyXG5cclxuICAgIC8vIE1ha2UgYSB3cml0YWJsZSBFdmVudCBmcm9tIHRoZSBuYXRpdmUgZXZlbnQgb2JqZWN0XHJcbiAgICBldmVudCA9IF9maXgoZXZlbnQpO1xyXG5cclxuICAgIHZhciBhcmdzID0gX2FycmF5LnNsaWNlKGFyZ3VtZW50cyksXHJcbiAgICAgICAgaGFuZGxlcnMgPSAoX2RhdGEuZ2V0KHRoaXMsIF9FVkVOVF9LRVkpIHx8IHt9KVtldmVudC50eXBlXSB8fCBbXSxcclxuICAgICAgICBzcGVjaWFsID0gX3NwZWNpYWxbZXZlbnQudHlwZV0gfHwge307XHJcblxyXG4gICAgLy8gVXNlIHRoZSBmaXgtZWQgRXZlbnQgcmF0aGVyIHRoYW4gdGhlIChyZWFkLW9ubHkpIG5hdGl2ZSBldmVudFxyXG4gICAgYXJnc1swXSA9IGV2ZW50O1xyXG4gICAgZXZlbnQuZGVsZWdhdGVUYXJnZXQgPSB0aGlzO1xyXG5cclxuICAgIC8vIENhbGwgdGhlIHByZURpc3BhdGNoIGhvb2sgZm9yIHRoZSBtYXBwZWQgdHlwZSwgYW5kIGxldCBpdCBiYWlsIGlmIGRlc2lyZWRcclxuICAgIGlmIChzcGVjaWFsLnByZURpc3BhdGNoICYmIHNwZWNpYWwucHJlRGlzcGF0Y2guY2FsbCh0aGlzLCBldmVudCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERldGVybWluZSBoYW5kbGVyc1xyXG4gICAgdmFyIGhhbmRsZXJRdWV1ZSA9IF9oYW5kbGVycy5jYWxsKHRoaXMsIGV2ZW50LCBoYW5kbGVycyksXHJcbiAgICAgICAgLy8gUnVuIGRlbGVnYXRlcyBmaXJzdDsgdGhleSBtYXkgd2FudCB0byBzdG9wIHByb3BhZ2F0aW9uIGJlbmVhdGggdXNcclxuICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgIG1hdGNoZWQ7XHJcbiAgICB3aGlsZSAoKG1hdGNoZWQgPSBoYW5kbGVyUXVldWVbaWR4KytdKSAmJiAhZXZlbnQuaXNQcm9wYWdhdGlvblN0b3BwZWQoKSkge1xyXG4gICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSBtYXRjaGVkLmVsZW07XHJcblxyXG4gICAgICAgIHZhciBpID0gMCxcclxuICAgICAgICAgICAgaGFuZGxlT2JqO1xyXG4gICAgICAgIHdoaWxlICgoaGFuZGxlT2JqID0gbWF0Y2hlZC5oYW5kbGVyc1tpKytdKSAmJiAhZXZlbnQuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQoKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gVHJpZ2dlcmVkIGV2ZW50IG11c3QgZWl0aGVyIDEpIGhhdmUgbm8gbmFtZXNwYWNlLCBvclxyXG4gICAgICAgICAgICAvLyAyKSBoYXZlIG5hbWVzcGFjZShzKSBhIHN1YnNldCBvciBlcXVhbCB0byB0aG9zZSBpbiB0aGUgYm91bmQgZXZlbnQgKGJvdGggY2FuIGhhdmUgbm8gbmFtZXNwYWNlKS5cclxuICAgICAgICAgICAgaWYgKCFldmVudC5uYW1lc3BhY2VSZWdleCB8fCBldmVudC5uYW1lc3BhY2VSZWdleC50ZXN0KGhhbmRsZU9iai5uYW1lc3BhY2UpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZXZlbnQuaGFuZGxlT2JqID0gaGFuZGxlT2JqO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXQgPSAoKF9zcGVjaWFsW2hhbmRsZU9iai5vcmlnVHlwZV0gfHwge30pLmhhbmRsZSB8fCBoYW5kbGVPYmouaGFuZGxlcikuYXBwbHkobWF0Y2hlZC5lbGVtLCBhcmdzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKGV2ZW50LnJlc3VsdCA9IHJldCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxsIHRoZSBwb3N0RGlzcGF0Y2ggaG9vayBmb3IgdGhlIG1hcHBlZCB0eXBlXHJcbiAgICBpZiAoc3BlY2lhbC5wb3N0RGlzcGF0Y2gpIHtcclxuICAgICAgICBzcGVjaWFsLnBvc3REaXNwYXRjaC5jYWxsKHRoaXMsIGV2ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZXZlbnQucmVzdWx0O1xyXG59O1xyXG5cclxudmFyIF9oYW5kbGVycyA9IGZ1bmN0aW9uKGV2ZW50LCBoYW5kbGVycykge1xyXG4gICAgdmFyIGhhbmRsZXJRdWV1ZSA9IFtdLFxyXG4gICAgICAgIGRlbGVnYXRlQ291bnQgPSBoYW5kbGVycy5kZWxlZ2F0ZUNvdW50LFxyXG4gICAgICAgIGN1ciA9IGV2ZW50LnRhcmdldDtcclxuXHJcbiAgICAvLyBGaW5kIGRlbGVnYXRlIGhhbmRsZXJzXHJcbiAgICAvLyBCbGFjay1ob2xlIFNWRyA8dXNlPiBpbnN0YW5jZSB0cmVlcyAoIzEzMTgwKVxyXG4gICAgLy8gQXZvaWQgbm9uLWxlZnQtY2xpY2sgYnViYmxpbmcgaW4gRmlyZWZveCAoIzM4NjEpXHJcbiAgICBpZiAoZGVsZWdhdGVDb3VudCAmJiBjdXIubm9kZVR5cGUgJiYgKCFldmVudC5idXR0b24gfHwgZXZlbnQudHlwZSAhPT0gJ2NsaWNrJykpIHtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQmV0dGVyIGFzIGEgd2hpbGUgbG9vcD9cclxuICAgICAgICBmb3IgKDsgY3VyICE9IHRoaXM7IGN1ciA9IGN1ci5wYXJlbnROb2RlIHx8IHRoaXMpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIERvbid0IGNoZWNrIG5vbi1lbGVtZW50cyAoIzEzMjA4KVxyXG4gICAgICAgICAgICAvLyBEb24ndCBwcm9jZXNzIGNsaWNrcyBvbiBkaXNhYmxlZCBlbGVtZW50cyAoIzY5MTEsICM4MTY1LCAjMTEzODIsICMxMTc2NClcclxuICAgICAgICAgICAgaWYgKGN1ci5ub2RlVHlwZSA9PT0gX25vZGVUeXBlLkVMRU1FTlQgJiYgKGN1ci5kaXNhYmxlZCAhPT0gdHJ1ZSB8fCBldmVudC50eXBlICE9PSAnY2xpY2snKSApIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgZGVsZWdhdGVDb3VudDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlT2JqID0gaGFuZGxlcnNbaWR4XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uZmxpY3Qgd2l0aCBPYmplY3QucHJvdG90eXBlIHByb3BlcnRpZXMgKCMxMzIwMylcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsID0gaGFuZGxlT2JqLnNlbGVjdG9yICsgJyAnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlc1tzZWxdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlc1tzZWxdID0gaGFuZGxlT2JqLm5lZWRzQ29udGV4dCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmQoc2VsKS5pbmRleChjdXIpID49IDAgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogV2hhdCBpcyBoYXBwZW5pbmcgaGVyZT9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeS5maW5kKHNlbCwgdGhpcywgbnVsbCwgW2N1cl0pLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzW3NlbF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKGhhbmRsZU9iaik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXJRdWV1ZS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbTogY3VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyczogbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEFkZCB0aGUgcmVtYWluaW5nIChkaXJlY3RseS1ib3VuZCkgaGFuZGxlcnNcclxuICAgIGlmIChkZWxlZ2F0ZUNvdW50IDwgaGFuZGxlcnMubGVuZ3RoKSB7XHJcbiAgICAgICAgaGFuZGxlclF1ZXVlLnB1c2goe1xyXG4gICAgICAgICAgICBlbGVtOiB0aGlzLFxyXG4gICAgICAgICAgICBoYW5kbGVyczogaGFuZGxlcnMuc2xpY2UoZGVsZWdhdGVDb3VudClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaGFuZGxlclF1ZXVlO1xyXG59O1xyXG5cclxudmFyIF9maXggPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgaWYgKGV2ZW50W19ldmVudFV0aWxzLmlkXSkge1xyXG4gICAgICAgIHJldHVybiBldmVudDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgYSB3cml0YWJsZSBjb3B5IG9mIHRoZSBldmVudCBvYmplY3QgYW5kIG5vcm1hbGl6ZSBzb21lIHByb3BlcnRpZXNcclxuICAgIHZhciB0eXBlID0gZXZlbnQudHlwZSxcclxuICAgICAgICBvcmlnaW5hbEV2ZW50ID0gZXZlbnQsXHJcbiAgICAgICAgZml4SG9vayA9IF9maXhIb29rc1t0eXBlXTtcclxuXHJcbiAgICBpZiAoIWZpeEhvb2spIHtcclxuICAgICAgICBfZml4SG9va3NbdHlwZV0gPSBmaXhIb29rID1cclxuICAgICAgICAgICAgX3JlZ2V4Lm1vdXNlRXZlbnQodHlwZSkgPyBfbW91c2VIb29rcyA6XHJcbiAgICAgICAgICAgIF9yZWdleC5rZXlFdmVudCh0eXBlKSA/IF9rZXlIb29rcyA6XHJcbiAgICAgICAgICAgIHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb3B5ID0gZml4SG9vay5wcm9wcyA/IF9wcm9wcy5jb25jYXQoZml4SG9vay5wcm9wcykgOiBfcHJvcHM7XHJcblxyXG4gICAgZXZlbnQgPSBuZXcgRXZlbnQob3JpZ2luYWxFdmVudCk7XHJcblxyXG4gICAgdmFyIGlkeCA9IGNvcHkubGVuZ3RoLFxyXG4gICAgICAgIHByb3A7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBwcm9wID0gY29weVtpZHhdO1xyXG4gICAgICAgIGV2ZW50W3Byb3BdID0gb3JpZ2luYWxFdmVudFtwcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRSA8IDlcclxuICAgIC8vIEZpeCB0YXJnZXQgcHJvcGVydHkgKCMxOTI1KVxyXG4gICAgaWYgKCFldmVudC50YXJnZXQpIHtcclxuICAgICAgICBldmVudC50YXJnZXQgPSBvcmlnaW5hbEV2ZW50LnNyY0VsZW1lbnQgfHwgZG9jdW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3VwcG9ydDogQ2hyb21lIDIzKywgU2FmYXJpP1xyXG4gICAgLy8gVGFyZ2V0IHNob3VsZCBub3QgYmUgYSB0ZXh0IG5vZGUgKCM1MDQsICMxMzE0MylcclxuICAgIGlmIChldmVudC50YXJnZXQubm9kZVR5cGUgPT09IF9ub2RlVHlwZS5URVhUKSB7XHJcbiAgICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUUgPCA5XHJcbiAgICAvLyBGb3IgbW91c2Uva2V5IGV2ZW50cywgbWV0YUtleT09ZmFsc2UgaWYgaXQncyB1bmRlZmluZWQgKCMzMzY4LCAjMTEzMjgpXHJcbiAgICBldmVudC5tZXRhS2V5ID0gISFldmVudC5tZXRhS2V5O1xyXG5cclxuICAgIHJldHVybiBmaXhIb29rLmZpbHRlciA/IGZpeEhvb2suZmlsdGVyKGV2ZW50LCBvcmlnaW5hbEV2ZW50KSA6IGV2ZW50O1xyXG59O1xyXG5cclxuLy8gSW5jbHVkZXMgc29tZSBldmVudCBwcm9wcyBzaGFyZWQgYnkgS2V5RXZlbnQgYW5kIE1vdXNlRXZlbnRcclxudmFyIF9wcm9wcyA9IF8uc3BsdCgnYWx0S2V5fGJ1YmJsZXN8Y2FuY2VsYWJsZXxjdHJsS2V5fGN1cnJlbnRUYXJnZXR8ZXZlbnRQaGFzZXxtZXRhS2V5fHJlbGF0ZWRUYXJnZXR8c2hpZnRLZXl8dGFyZ2V0fHRpbWVTdGFtcHx2aWV3fHdoaWNoJyk7XHJcblxyXG52YXIgX2ZpeEhvb2tzID0ge307XHJcblxyXG52YXIgX2tleUhvb2tzID0ge1xyXG4gICAgcHJvcHM6IF8uc3BsdCgnY2hhcnxjaGFyQ29kZXxrZXl8a2V5Q29kZScpLFxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihldmVudCwgb3JpZ2luYWwpIHtcclxuXHJcbiAgICAgICAgLy8gQWRkIHdoaWNoIGZvciBrZXkgZXZlbnRzXHJcbiAgICAgICAgaWYgKCFfLmV4aXN0cyhldmVudC53aGljaCkpIHtcclxuICAgICAgICAgICAgZXZlbnQud2hpY2ggPSBfLmV4aXN0cyhvcmlnaW5hbC5jaGFyQ29kZSkgPyBvcmlnaW5hbC5jaGFyQ29kZSA6IG9yaWdpbmFsLmtleUNvZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgX21vdXNlSG9va3MgPSB7XHJcbiAgICBwcm9wczogXy5zcGx0KCdidXR0b258YnV0dG9uc3xjbGllbnRYfGNsaWVudFl8ZnJvbUVsZW1lbnR8b2Zmc2V0WHxvZmZzZXRZfHBhZ2VYfHBhZ2VZfHNjcmVlblh8c2NyZWVuWXx0b0VsZW1lbnQnKSxcclxuICAgIGZpbHRlcjogZnVuY3Rpb24oZXZlbnQsIG9yaWdpbmFsKSB7XHJcbiAgICAgICAgdmFyIGJvZHksIGV2ZW50RG9jLCBkb2MsXHJcbiAgICAgICAgICAgIGJ1dHRvbiA9IG9yaWdpbmFsLmJ1dHRvbixcclxuICAgICAgICAgICAgZnJvbUVsZW1lbnQgPSBvcmlnaW5hbC5mcm9tRWxlbWVudDtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHBhZ2VYL1kgaWYgbWlzc2luZyBhbmQgY2xpZW50WC9ZIGF2YWlsYWJsZVxyXG4gICAgICAgIGlmICghXy5leGlzdHMoZXZlbnQucGFnZVgpICYmICFfLmV4aXN0cyhvcmlnaW5hbC5jbGllbnRYKSkge1xyXG4gICAgICAgICAgICBldmVudERvYyA9IGV2ZW50LnRhcmdldC5vd25lckRvY3VtZW50IHx8IGRvY3VtZW50O1xyXG4gICAgICAgICAgICBkb2MgPSBldmVudERvYy5kb2N1bWVudEVsZW1lbnQ7XHJcbiAgICAgICAgICAgIGJvZHkgPSBldmVudERvYy5ib2R5O1xyXG5cclxuICAgICAgICAgICAgZXZlbnQucGFnZVggPSBvcmlnaW5hbC5jbGllbnRYICsgKGRvYyAmJiBkb2Muc2Nyb2xsTGVmdCB8fCBib2R5ICYmIGJvZHkuc2Nyb2xsTGVmdCB8fCAwICkgLSAoZG9jICYmIGRvYy5jbGllbnRMZWZ0IHx8IGJvZHkgJiYgYm9keS5jbGllbnRMZWZ0IHx8IDApO1xyXG4gICAgICAgICAgICBldmVudC5wYWdlWSA9IG9yaWdpbmFsLmNsaWVudFkgKyAoZG9jICYmIGRvYy5zY3JvbGxUb3AgIHx8IGJvZHkgJiYgYm9keS5zY3JvbGxUb3AgIHx8IDAgKSAtIChkb2MgJiYgZG9jLmNsaWVudFRvcCAgfHwgYm9keSAmJiBib2R5LmNsaWVudFRvcCAgfHwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBZGQgcmVsYXRlZFRhcmdldCwgaWYgbmVjZXNzYXJ5XHJcbiAgICAgICAgaWYgKCFldmVudC5yZWxhdGVkVGFyZ2V0ICYmIGZyb21FbGVtZW50KSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnJlbGF0ZWRUYXJnZXQgPSBmcm9tRWxlbWVudCA9PT0gZXZlbnQudGFyZ2V0ID8gb3JpZ2luYWwudG9FbGVtZW50IDogZnJvbUVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBZGQgd2hpY2ggZm9yIGNsaWNrOiAxID09PSBsZWZ0OyAyID09PSBtaWRkbGU7IDMgPT09IHJpZ2h0XHJcbiAgICAgICAgLy8gTm90ZTogYnV0dG9uIGlzIG5vdCBub3JtYWxpemVkLCBzbyBkb24ndCB1c2UgaXRcclxuICAgICAgICBpZiAoIWV2ZW50LndoaWNoICYmIGJ1dHRvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LndoaWNoID0gKGJ1dHRvbiAmIDEgPyBfQ0xJQ0subGVmdCA6IChidXR0b24gJiAyID8gX0NMSUNLLnJpZ2h0IDogKGJ1dHRvbiAmIDQgPyBfQ0xJQ0subWlkZGxlIDogX0NMSUNLLm5vbmUpKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgX3NwZWNpYWwgPSB7XHJcbiAgICBsb2FkOiB7XHJcbiAgICAgICAgLy8gUHJldmVudCB0cmlnZ2VyZWQgaW1hZ2UubG9hZCBldmVudHMgZnJvbSBidWJibGluZyB0byB3aW5kb3cubG9hZFxyXG4gICAgICAgIG5vQnViYmxlOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgZm9jdXM6IHtcclxuICAgICAgICBkZWxlZ2F0ZVR5cGU6ICdmb2N1c2luJyxcclxuICAgICAgICAvLyBGaXJlIG5hdGl2ZSBldmVudCBpZiBwb3NzaWJsZSBzbyBibHVyL2ZvY3VzIHNlcXVlbmNlIGlzIGNvcnJlY3RcclxuICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMgIT09IF9ldmVudFV0aWxzLmFjdGl2ZUVsZW1lbnQoKSAmJiB0aGlzLmZvY3VzKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9ydDogSUUgPCA5XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZXJyb3Igb24gZm9jdXMgdG8gaGlkZGVuIGVsZW1lbnQgKCMxNDg2LCAjMTI1MTgpLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxldCAudHJpZ2dlcigpIHJ1biB0aGUgaGFuZGxlcnNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBibHVyOiB7XHJcbiAgICAgICAgZGVsZWdhdGVUeXBlOiAnZm9jdXNvdXQnLFxyXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcyA9PT0gX2V2ZW50VXRpbHMuYWN0aXZlRWxlbWVudCgpICYmIHRoaXMuYmx1cikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ibHVyKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgY2xpY2s6IHtcclxuICAgICAgICAvLyBGb3IgY2hlY2tib3gsIGZpcmUgbmF0aXZlIGV2ZW50IHNvIGNoZWNrZWQgc3RhdGUgd2lsbCBiZSByaWdodFxyXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoX3V0aWxzLmlzTm9kZU5hbWUodGhpcywgJ2lucHV0JykgJiYgdGhpcy50eXBlID09PSAnY2hlY2tib3gnICYmIHRoaXMuY2xpY2spIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIEZvciBjcm9zcy1icm93c2VyIGNvbnNpc3RlbmN5LCBkb24ndCBmaXJlIG5hdGl2ZSAuY2xpY2soKSBvbiBsaW5rc1xyXG4gICAgICAgIF9kZWZhdWx0OiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gX3V0aWxzLmlzTm9kZU5hbWUoZXZlbnQudGFyZ2V0LCAnYScpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYmVmb3JldW5sb2FkOiB7XHJcbiAgICAgICAgcG9zdERpc3BhdGNoOiBmdW5jdGlvbihldmVudCkge1xyXG5cclxuICAgICAgICAgICAgLy8gRXZlbiB3aGVuIHJldHVyblZhbHVlIGVxdWFscyB0byB1bmRlZmluZWQgRmlyZWZveCB3aWxsIHN0aWxsIHNob3cgYWxlcnRcclxuICAgICAgICAgICAgaWYgKGV2ZW50LnJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LnJldHVyblZhbHVlID0gZXZlbnQucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIF9zaW11bGF0ZSA9IGZ1bmN0aW9uKHR5cGUsIGVsZW0sIGV2ZW50LCBidWJibGUpIHtcclxuICAgIC8vIFBpZ2d5YmFjayBvbiBhIGRvbm9yIGV2ZW50IHRvIHNpbXVsYXRlIGEgZGlmZmVyZW50IG9uZS5cclxuICAgIC8vIEZha2Ugb3JpZ2luYWxFdmVudCB0byBhdm9pZCBkb25vcidzIHN0b3BQcm9wYWdhdGlvbiwgYnV0IGlmIHRoZVxyXG4gICAgLy8gc2ltdWxhdGVkIGV2ZW50IHByZXZlbnRzIGRlZmF1bHQgdGhlbiB3ZSBkbyB0aGUgc2FtZSBvbiB0aGUgZG9ub3IuXHJcbiAgICB2YXIgZSA9IF8uZXh0ZW5kKFxyXG4gICAgICAgIG5ldyBFdmVudCgpLFxyXG4gICAgICAgIGV2ZW50LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgaXNTaW11bGF0ZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IHt9XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoYnViYmxlKSB7XHJcbiAgICAgICAgX3RyaWdnZXIoZSwgbnVsbCwgZWxlbSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIF9kaXNwYXRjaC5jYWxsKGVsZW0sIGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIH1cclxufTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFkZCAgICAgICA6IF9hZGQsXHJcbiAgICByZW1vdmUgICAgOiBfcmVtb3ZlLFxyXG4gICAgdHJpZ2dlciAgIDogX3RyaWdnZXIsXHJcbiAgICBzaW11bGF0ZSAgOiBfc2ltdWxhdGUsXHJcbiAgICBmaXggICAgICAgOiBfZml4LFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICBldmVudDoge1xyXG4gICAgICAgICAgICAvLyB0cmlnZ2VyZWQsIGEgc3RhdGUgaG9sZGVyIGZvciBldmVudHNcclxuICAgICAgICAgICAgZ2xvYmFsICAgIDogX2dsb2JhbCxcclxuICAgICAgICAgICAgYWRkICAgICAgIDogX2FkZCxcclxuICAgICAgICAgICAgcmVtb3ZlICAgIDogX3JlbW92ZSxcclxuICAgICAgICAgICAgdHJpZ2dlciAgIDogX3RyaWdnZXIsXHJcbiAgICAgICAgICAgIGRpc3BhdGNoICA6IF9kaXNwYXRjaCxcclxuICAgICAgICAgICAgaGFuZGxlcnMgIDogX2hhbmRsZXJzLFxyXG4gICAgICAgICAgICBmaXggICAgICAgOiBfZml4LFxyXG4gICAgICAgICAgICBwcm9wcyAgICAgOiBfcHJvcHMsXHJcbiAgICAgICAgICAgIGZpeEhvb2tzICA6IF9maXhIb29rcyxcclxuICAgICAgICAgICAga2V5SG9va3MgIDogX2tleUhvb2tzLFxyXG4gICAgICAgICAgICBtb3VzZUhvb2tzOiBfbW91c2VIb29rcyxcclxuICAgICAgICAgICAgc3BlY2lhbCAgIDogX3NwZWNpYWwsXHJcbiAgICAgICAgICAgIHNpbXVsYXRlICA6IF9zaW11bGF0ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBfc3VwcG9ydHMgICAgICA9IHJlcXVpcmUoJy4uLy4uL3N1cHBvcnRzJyksXHJcbiAgICBfZGF0YSAgICAgICAgICA9IHJlcXVpcmUoJy4uL2RhdGEnKSxcclxuICAgIF9ldmVudCAgICAgICAgID0gcmVxdWlyZSgnLi9ldmVudCcpO1xyXG5cclxuLy8gVE9ETzogUmVtb3ZlLiAgVGhpcyBpcyBuZWVkZWQgdG8gcHJldmVudCBJRTggZnJvbSBmYWlsaW5nIGNhdGFzdHJvcGhpY2FsbHkuXHJcbi8vIHJldHVybjtcclxuXHJcbmlmICghX3N1cHBvcnRzLnN1Ym1pdEJ1YmJsZXMpIHtcclxuICAgIC8vIElFIGNoYW5nZSBkZWxlZ2F0aW9uIGFuZCBjaGVja2JveC9yYWRpbyBmaXhcclxuICAgIF9ldmVudC5zcGVjaWFsLmNoYW5nZSA9IHtcclxuXHJcbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHJmb3JtRWxlbXMudGVzdCh0aGlzLm5vZGVOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSUUgZG9lc24ndCBmaXJlIGNoYW5nZSBvbiBhIGNoZWNrL3JhZGlvIHVudGlsIGJsdXI7IHRyaWdnZXIgaXQgb24gY2xpY2tcclxuICAgICAgICAgICAgICAgIC8vIGFmdGVyIGEgcHJvcGVydHljaGFuZ2UuIEVhdCB0aGUgYmx1ci1jaGFuZ2UgaW4gc3BlY2lhbC5jaGFuZ2UuaGFuZGxlLlxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBzdGlsbCBmaXJlcyBvbmNoYW5nZSBhIHNlY29uZCB0aW1lIGZvciBjaGVjay9yYWRpbyBhZnRlciBibHVyLlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHlwZSA9PT0gJ2NoZWNrYm94JyB8fCB0aGlzLnR5cGUgPT09ICdyYWRpbycpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50LmFkZCh0aGlzLCAncHJvcGVydHljaGFuZ2UuX2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5vcmlnaW5hbEV2ZW50LnByb3BlcnR5TmFtZSA9PT0gJ2NoZWNrZWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9qdXN0X2NoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIF9ldmVudC5hZGQodGhpcywgJ2NsaWNrLl9jaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fanVzdF9jaGFuZ2VkICYmICFldmVudC5pc1RyaWdnZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2p1c3RfY2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGxvdyB0cmlnZ2VyZWQsIHNpbXVsYXRlZCBjaGFuZ2UgZXZlbnRzICgjMTE1MDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9ldmVudC5zaW11bGF0ZSgnY2hhbmdlJywgdGhpcywgZXZlbnQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGVsZWdhdGVkIGV2ZW50OyBsYXp5LWFkZCBhIGNoYW5nZSBoYW5kbGVyIG9uIGRlc2NlbmRhbnQgaW5wdXRzXHJcbiAgICAgICAgICAgIF9ldmVudC5hZGQodGhpcywgJ2JlZm9yZWFjdGl2YXRlLl9jaGFuZ2UnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IGUudGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZm9ybUVsZW1zLnRlc3QoZWxlbS5ub2RlTmFtZSkgJiYgIV9kYXRhLmdldChlbGVtLCAnY2hhbmdlQnViYmxlcycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2V2ZW50LmFkZChlbGVtLCAnY2hhbmdlLl9jaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJlbnROb2RlICYmICFldmVudC5pc1NpbXVsYXRlZCAmJiAhZXZlbnQuaXNUcmlnZ2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZXZlbnQuc2ltdWxhdGUoJ2NoYW5nZScsIHRoaXMucGFyZW50Tm9kZSwgZXZlbnQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgX2RhdGEuc2V0KGVsZW0sICdjaGFuZ2VCdWJibGVzJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhhbmRsZTogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSBldmVudC50YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICAvLyBTd2FsbG93IG5hdGl2ZSBjaGFuZ2UgZXZlbnRzIGZyb20gY2hlY2tib3gvcmFkaW8sIHdlIGFscmVhZHkgdHJpZ2dlcmVkIHRoZW0gYWJvdmVcclxuICAgICAgICAgICAgaWYgKHRoaXMgIT09IGVsZW0gfHwgZXZlbnQuaXNTaW11bGF0ZWQgfHwgZXZlbnQuaXNUcmlnZ2VyIHx8IChlbGVtLnR5cGUgIT09ICdyYWRpbycgJiYgZWxlbS50eXBlICE9PSAnY2hlY2tib3gnKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2ZW50LmhhbmRsZU9iai5oYW5kbGVyLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgX2V2ZW50LnJlbW92ZSh0aGlzLCAnLl9jaGFuZ2UnKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAhcmZvcm1FbGVtcy50ZXN0KHRoaXMubm9kZU5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuXHJcbmlmICghX3N1cHBvcnRzLmNoYW5nZUJ1YmJsZXMpIHtcclxuICAgIC8vIENyZWF0ZSAnYnViYmxpbmcnIGZvY3VzIGFuZCBibHVyIGV2ZW50c1xyXG4gICAgXy5lYWNoKHtcclxuICAgICAgICBmb2N1czogJ2ZvY3VzaW4nLFxyXG4gICAgICAgIGJsdXI6ICdmb2N1c291dCdcclxuICAgIH0sIGZ1bmN0aW9uKGZpeCwgb3JpZykge1xyXG5cclxuICAgICAgICAvLyBBdHRhY2ggYSBzaW5nbGUgY2FwdHVyaW5nIGhhbmRsZXIgb24gdGhlIGRvY3VtZW50IHdoaWxlIHNvbWVvbmUgd2FudHMgZm9jdXNpbi9mb2N1c291dFxyXG4gICAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgX2V2ZW50LnNpbXVsYXRlKGZpeCwgZXZlbnQudGFyZ2V0LCBfZXZlbnQuZml4KGV2ZW50KSwgdHJ1ZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgX2V2ZW50LnNwZWNpYWxbZml4XSA9IHtcclxuICAgICAgICAgICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IHRoaXMub3duZXJEb2N1bWVudCB8fCB0aGlzLFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dGFjaGVzID0gX2RhdGEuZ2V0KGRvYywgZml4KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWF0dGFjaGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIob3JpZywgaGFuZGxlciwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBfZGF0YS5zZXQoZG9jLCBmaXgsIChhdHRhY2hlcyB8fCAwKSArIDEpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IHRoaXMub3duZXJEb2N1bWVudCB8fCB0aGlzLFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dGFjaGVzID0gX2RhdGEuZ2V0KGRvYywgZml4KSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFhdHRhY2hlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKG9yaWcsIGhhbmRsZXIsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIF9kYXRhLnJlbW92ZShkb2MsIGZpeCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIF9kYXRhLnNldChkb2MsIGZpeCwgYXR0YWNoZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcbiIsInZhciBfICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG4gICAgX2RpdiA9IHJlcXVpcmUoJy4uLy4uL2RpdicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBpZDogJ2QnICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKSxcclxuXHJcbiAgICBhY3RpdmVFbGVtZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHt9XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZEV2ZW50OiBfZGl2LmFkZEV2ZW50TGlzdGVuZXIgP1xyXG4gICAgICAgIGZ1bmN0aW9uKGVsZW0sIHR5cGUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBjYWxsYmFjaywgZmFsc2UpO1xyXG4gICAgICAgIH0gOlxyXG4gICAgICAgIF9kaXYuYXR0YWNoRXZlbnQgP1xyXG4gICAgICAgIGZ1bmN0aW9uKGVsZW0sIHR5cGUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9IDpcclxuICAgICAgICBfLm5vb3AsXHJcblxyXG4gICAgcmVtb3ZlRXZlbnQ6IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgP1xyXG4gICAgICAgIGZ1bmN0aW9uKGVsZW0sIHR5cGUsIGhhbmRsZSkge1xyXG4gICAgICAgICAgICBpZiAoIWVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcikgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZSwgZmFsc2UpO1xyXG4gICAgICAgIH0gOlxyXG4gICAgICAgIGZ1bmN0aW9uKGVsZW0sIHR5cGUsIGhhbmRsZSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9ICdvbicgKyB0eXBlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFlbGVtLmRldGFjaEV2ZW50KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgLy8gIzg1NDUsICM3MDU0LCBwcmV2ZW50aW5nIG1lbW9yeSBsZWFrcyBmb3IgY3VzdG9tIGV2ZW50cyBpbiBJRTYtOFxyXG4gICAgICAgICAgICAvLyBkZXRhY2hFdmVudCBuZWVkZWQgcHJvcGVydHkgb24gZWxlbWVudCwgYnkgbmFtZSBvZiB0aGF0IGV2ZW50LCB0byBwcm9wZXJseSBleHBvc2UgaXQgdG8gR0NcclxuICAgICAgICAgICAgaWYgKGVsZW1bbmFtZV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgZWxlbVtuYW1lXSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsZW0uZGV0YWNoRXZlbnQobmFtZSwgaGFuZGxlKTtcclxuICAgICAgICB9XHJcbn07IiwidmFyIF8gICAgICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcclxuICAgIG92ZXJsb2FkICA9IHJlcXVpcmUoJ292ZXJsb2FkLWpzJyksXHJcbiAgICBvICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG5cclxuICAgIF9zZWxlY3RvciA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzJyksXHJcbiAgICBfYXJyYXkgICAgPSByZXF1aXJlKCcuL2FycmF5JyksXHJcbiAgICBfdXRpbHMgICAgPSByZXF1aXJlKCcuLi91dGlscycpLFxyXG4gICAgX29yZGVyICAgID0gcmVxdWlyZSgnLi4vb3JkZXInKSxcclxuXHJcbiAgICBfZGF0YSAgICAgPSByZXF1aXJlKCcuL2RhdGEnKSxcclxuXHJcbiAgICBwYXJzZXIgICAgPSByZXF1aXJlKCcuL3BhcnNlci9wYXJzZXInKSxcclxuICAgIHV0aWxzICAgICA9IHJlcXVpcmUoJy4uL3V0aWxzJyk7XHJcblxyXG52YXIgX2VtcHR5ID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gYXJyW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIF9kYXRhLnJlbW92ZShkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmUgPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbSwgcGFyZW50O1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0gJiYgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhLnJlbW92ZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX2RldGFjaCA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLCBwYXJlbnQ7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICBpZiAoZWxlbSAmJiAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBUT0RPOiBJRTYtOCBjb3BpZXMgZXZlbnRzIGJvdW5kIHZpYSBhdHRhY2hFdmVudCB3aGVuIHVzaW5nIGNsb25lTm9kZS5cclxuICAgIC8vICAgICAgIFNlZSBqcXVlcnkuanM6NTQwMVxyXG4gICAgX2Nsb25lID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBlbGVtLmNsb25lTm9kZSh0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3N0cmluZ1RvRnJhZyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIGZyYWc7XHJcbiAgICB9LFxyXG5cclxuICAgIF9hcHBlbmRQcmVwZW5kRnVuYyA9IGZ1bmN0aW9uKGQsIGZuLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goZCwgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZWxlbS5pbm5lckhUTUwpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFfLmV4aXN0cyhyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChfLmlzU3RyaW5nKHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodXRpbHMuaXNIVE1MKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcGFyc2VyLnBhcnNlSHRtbCh2YWx1ZSksIHBlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIF9zdHJpbmdUb0ZyYWcocmVzdWx0KSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKF8uaXNFbGVtZW50KHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXy5pc05vZGVMaXN0KHJlc3VsdCkgfHwgcmVzdWx0IGluc3RhbmNlb2YgRCkge1xyXG5cclxuICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIF9hcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSA9IGZ1bmN0aW9uKGFyck9uZSwgYXJyVHdvLCBwZW5kZXIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyT25lLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGxlbiA9IGFyclR3by5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihhcnJPbmVbaWR4XSwgYXJyVHdvW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBfYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5ID0gZnVuY3Rpb24oYXJyLCBlbGVtLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihhcnJFbGVtLCBlbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBfYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtID0gZnVuY3Rpb24oZWxlbSwgYXJyLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihlbGVtLCBhcnJFbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2FwcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIV8uaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICB9LFxyXG4gICAgX3ByZXBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFfLmlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmluc2VydEJlZm9yZShlbGVtLCBiYXNlLmZpcnN0Q2hpbGQpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYXBwZW5kICA6IF9hcHBlbmQsXHJcbiAgICBwcmVwZW5kIDogX3ByZXBlbmQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmZhc3RtYXAodGhpcy5zbGljZSgpLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2Nsb25lKGVsZW0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhcHBlbmQ6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodXRpbHMuaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBwYXJzZXIucGFyc2VIdG1sKHZhbHVlKSwgX2FwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgX2FwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBfc3RyaW5nVG9GcmFnKHZhbHVlKSwgX2FwcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhOdW1iZXIpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgX3N0cmluZ1RvRnJhZygnJyArIHZhbHVlKSwgX2FwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKEZ1bmN0aW9uKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgICAgICAgICBfYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIF9hcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhFbGVtZW50KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgZWxlbSwgX2FwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uY29sbGVjdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIF9hcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIC8vIFRPRE86IFRoZXNlIG1ldGhvZHNcclxuICAgICAgICBiZWZvcmU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSxcclxuICAgICAgICBhZnRlcjogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9LFxyXG4gICAgICAgIGluc2VydEJlZm9yZTogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9LFxyXG4gICAgICAgIGluc2VydEFmdGVyOiBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0sXHJcblxyXG4gICAgICAgIGFwcGVuZFRvOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKG8uRClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICBkLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmZhbGxiYWNrKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICAgICAgRChvYmopLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmV4cG9zZSgpLFxyXG5cclxuICAgICAgICBwcmVwZW5kOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZylcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHV0aWxzLmlzSHRtbCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBfYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyLnBhcnNlSHRtbCh2YWx1ZSksIF9wcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBfYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIF9zdHJpbmdUb0ZyYWcodmFsdWUpLCBfcHJlcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhOdW1iZXIpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgX3N0cmluZ1RvRnJhZygnJyArIHZhbHVlKSwgX3ByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhGdW5jdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihmbikge1xyXG4gICAgICAgICAgICAgICAgX2FwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBfcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKEVsZW1lbnQpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgX2FwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBfcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uY29sbGVjdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICAgICAgICAgIF9hcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIF9wcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmV4cG9zZSgpLFxyXG5cclxuICAgICAgICBwcmVwZW5kVG86IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3Moby5EKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIGQucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmZhbGxiYWNrKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICAgICAgRChvYmopLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBfZW1wdHkodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZDogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAvLyBTdHJpbmcgc2VsZWN0b3JcclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSBfYXJyYXkudW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBEKHNlbGVjdG9yKS5nZXQoKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBfb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAvLyBBcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgICAgICAuYXJncyhvLmNvbGxlY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSBfYXJyYXkudW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBfLnRvQXJyYXkoYXJyKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBfb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAvLyBTaW5nbGUgZWxlbWVudFxyXG4gICAgICAgICAgICAuYXJncyhvLmFueShvLndpbmRvdywgby5kb2N1bWVudCwgRWxlbWVudCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gX2FycmF5LnVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICBbXS5jb25jYXQodGhpcy5nZXQoKSwgWyBlbGVtIF0pXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgX29yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLy8gRXZlcnl0aGluZyBlbHNlXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKHRoaXMpO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmV4cG9zZSgpLFxyXG5cclxuICAgICAgICByZW1vdmU6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IF9zZWxlY3Rvci5maWx0ZXIodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgX3JlbW92ZShhcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZmFsbGJhY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIGRldGFjaDogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gX3NlbGVjdG9yLmZpbHRlcih0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICBfZGV0YWNoKGFycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIF9kZXRhY2godGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgX2lzUmVhZHkgPSBmYWxzZSxcclxuICAgIF9yZWdpc3RyYXRpb24gPSBbXTtcclxuXHJcbnZhciBfYmluZCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbnZhciBfbWFrZUNhbGxzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICBsZW5ndGggPSBfcmVnaXN0cmF0aW9uLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgX3JlZ2lzdHJhdGlvbltpZHhdKCk7XHJcbiAgICB9XHJcbiAgICBfcmVnaXN0cmF0aW9uLmxlbmd0aCA9IDA7XHJcbn07XHJcblxyXG5fYmluZChmdW5jdGlvbigpIHtcclxuICAgIGlmIChfaXNSZWFkeSkgeyByZXR1cm47IH1cclxuXHJcbiAgICBfaXNSZWFkeSA9IHRydWU7XHJcbiAgICBfbWFrZUNhbGxzKCk7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgaWYgKF9pc1JlYWR5KSB7XHJcbiAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBfcmVnaXN0cmF0aW9uLnB1c2goY2FsbGJhY2spO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbiIsInZhciBfc3VwcG9ydHMgPSByZXF1aXJlKCcuLi8uLi9zdXBwb3J0cycpO1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgZGZsdDogZnVuY3Rpb24ocGFyZW50VGFnTmFtZSwgaHRtbFN0cikge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHBhcmVudFRhZ05hbWUpO1xyXG4gICAgICAgIHBhcmVudC5pbm5lckhUTUwgPSBodG1sU3RyO1xyXG4gICAgICAgIHJldHVybiBwYXJlbnQ7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBJRThcclxuaWYgKCFfc3VwcG9ydHMud3JpdGFibGVUYm9keSkge1xyXG4gICAgaG9va3MudGJvZHkgPSBmdW5jdGlvbihwYXJlbnRUYWdOYW1lLCBodG1sU3RyKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHBhcmVudC5pbm5lckhUTUwgPSAnPHRhYmxlPicgKyBodG1sU3RyICsgJzwvdGFibGU+JztcclxuICAgICAgICByZXR1cm4gcGFyZW50LmZpcnN0Q2hpbGQuZmlyc3RDaGlsZDtcclxuICAgIH07XHJcbn1cclxuXHJcbi8vIElFOFxyXG5pZiAoIV9zdXBwb3J0cy53cml0YWJsZVNlbGVjdCkge1xyXG4gICAgaG9va3Muc2VsZWN0ID0gZnVuY3Rpb24ocGFyZW50VGFnTmFtZSwgaHRtbFN0cikge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBwYXJlbnQuaW5uZXJIVE1MID0gJzxzZWxlY3Q+JyArIGh0bWxTdHIgKyAnPC9zZWxlY3Q+JztcclxuICAgICAgICByZXR1cm4gcGFyZW50LmZpcnN0Q2hpbGQ7XHJcbiAgICB9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGhvb2tzO1xyXG4iLCJ2YXIgX3JlZ2V4ID0gcmVxdWlyZSgnLi4vLi4vcmVnZXgnKSxcclxuICAgIF91dGlscyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzJyksXHJcbiAgICBfaG9va3MgPSByZXF1aXJlKCcuL2hvb2tzJyksXHJcblxyXG4gICAgX01BWF9TSU5HTEVfVEFHX0xFTkdUSCA9IDMwO1xyXG5cclxudmFyIF9wYXJzZVNpbmdsZVRhZyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIGlmIChodG1sU3RyLmxlbmd0aCA+IF9NQVhfU0lOR0xFX1RBR19MRU5HVEgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgc2luZ2xlVGFnTWF0Y2ggPSBfcmVnZXguc2luZ2xlVGFnTWF0Y2goaHRtbFN0cik7XHJcbiAgICBpZiAoIXNpbmdsZVRhZ01hdGNoKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHNpbmdsZVRhZ01hdGNoWzFdKTtcclxuXHJcbiAgICAvLyBJRThcclxuICAgIF91dGlscy5mbGFnUGFyc2VkTm9kZShlbGVtKTtcclxuXHJcbiAgICByZXR1cm4gWyBlbGVtIF07XHJcbn07XHJcblxyXG52YXIgX3BhcnNlID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgdmFyIHNpbmdsZVRhZyA9IF9wYXJzZVNpbmdsZVRhZyhodG1sU3RyKTtcclxuICAgIGlmIChzaW5nbGVUYWcpIHsgcmV0dXJuIHNpbmdsZVRhZzsgfVxyXG5cclxuICAgIHZhciBwYXJlbnRUYWdOYW1lID0gX3JlZ2V4LmdldFBhcmVudFRhZ05hbWUoaHRtbFN0ciksXHJcbiAgICAgICAgaG9vayAgICAgICAgICA9IF9ob29rc1twYXJlbnRUYWdOYW1lXSB8fCBfaG9va3MuZGZsdCxcclxuICAgICAgICBwYXJlbnQgICAgICAgID0gaG9vayhwYXJlbnRUYWdOYW1lLCBodG1sU3RyKTtcclxuXHJcbiAgICB2YXIgY2hpbGQsXHJcbiAgICAgICAgaWR4ID0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCxcclxuICAgICAgICBhcnIgPSBbXTtcclxuXHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jaGlsZHJlbltpZHhdO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcblxyXG4gICAgICAgIC8vIElFOFxyXG4gICAgICAgIF91dGlscy5mbGFnUGFyc2VkTm9kZShjaGlsZCk7XHJcblxyXG4gICAgICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2pzLXB1c2gtdnMtaW5kZXgxMS8yXHJcbiAgICAgICAgYXJyW2lkeF0gPSBjaGlsZDtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG59O1xyXG5cclxudmFyIF9wYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gX3BhcnNlKHN0cik7XHJcbiAgICBpZiAoIXJlc3VsdCB8fCAhcmVzdWx0Lmxlbmd0aCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIEQocmVzdWx0KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcGFyc2VIdG1sOiBfcGFyc2UsXHJcblxyXG4gICAgLy8gVG9wLWxldmVsIGZ1bmN0aW9ucyBhdHRhY2hlZCBkaXJlY3RseSB0byBELlxyXG4gICAgLy8gSW52b2tlZCB2aWEgYEQucGFyc2VIVE1MKCcuLi4nKWAsIGFzIG9wcG9zZWQgdG8gYEQoJ2RpdicpLnBhcnNlSFRNTCgnLi4uJylgLlxyXG4gICAgRDoge1xyXG4gICAgICAgIHBhcnNlSHRtbDogX3BhcnNlSHRtbCxcclxuICAgICAgICAvLyBCZWNhdXNlIG5vIG9uZSBrbm93IHdoYXQgdGhlIGNhc2Ugc2hvdWxkIGJlXHJcbiAgICAgICAgcGFyc2VIVE1MOiBfcGFyc2VIdG1sXHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcclxuICAgIG92ZXJsb2FkID0gcmVxdWlyZSgnb3ZlcmxvYWQtanMnKSxcclxuICAgIG8gICAgICAgID0gb3ZlcmxvYWQubyxcclxuXHJcbiAgICBfdXRpbHMgICA9IHJlcXVpcmUoJy4uL3V0aWxzJyksXHJcblxyXG4gICAgX2RvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG52YXIgX2dldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgX2dldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciByZWN0ID0gX3V0aWxzLmlzQXR0YWNoZWQoZWxlbSkgPyBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDoge307XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6ICAocmVjdC50b3AgICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApICB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IChyZWN0LmxlZnQgKyBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQpIHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgX3NldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IF9nZXRPZmZzZXQoZWxlbSksXHJcbiAgICAgICAgY3VyQ1NTVG9wICAgICAgICAgPSBlbGVtLnN0eWxlLnRvcCxcclxuICAgICAgICBjdXJDU1NMZWZ0ICAgICAgICA9IGVsZW0uc3R5bGUubGVmdCxcclxuICAgICAgICBjYWxjdWxhdGVQb3NpdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyB8fCBwb3NpdGlvbiA9PT0gJ2ZpeGVkJykgJiYgKGN1ckNTU1RvcCA9PT0gJ2F1dG8nIHx8IGN1ckNTU0xlZnQgPT09ICdhdXRvJyk7XHJcblxyXG4gICAgaWYgKF8uaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IF9nZXRQb3NpdGlvbihlbGVtKTtcclxuICAgICAgICBjdXJUb3AgID0gY3VyUG9zaXRpb24udG9wO1xyXG4gICAgICAgIGN1ckxlZnQgPSBjdXJQb3NpdGlvbi5sZWZ0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdXJUb3AgID0gcGFyc2VGbG9hdChjdXJDU1NUb3ApICB8fCAwO1xyXG4gICAgICAgIGN1ckxlZnQgPSBwYXJzZUZsb2F0KGN1ckNTU0xlZnQpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKF8uZXhpc3RzKHBvcy5sZWZ0KSkgeyBwcm9wcy5sZWZ0ID0gKHBvcy5sZWZ0IC0gY3VyT2Zmc2V0LmxlZnQpICsgY3VyTGVmdDsgfVxyXG5cclxuICAgIGVsZW0uc3R5bGUudG9wICA9IF8udG9QeChwcm9wcy50b3ApO1xyXG4gICAgZWxlbS5zdHlsZS5sZWZ0ID0gXy50b1B4KHByb3BzLmxlZnQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBmbjoge1xyXG4gICAgICAgIHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZnNldDogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhvLmFueShPYmplY3QsIEZ1bmN0aW9uKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRPZmZzZXQoZWxlbSwgaWR4LCBwb3NPckl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgb2Zmc2V0UGFyZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IF9kb2NFbGVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghX3V0aWxzLmlzTm9kZU5hbWUob2Zmc2V0UGFyZW50LCAnaHRtbCcpICYmIChvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycpID09PSAnc3RhdGljJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgX2RvY0VsZW07XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCAgID0gcmVxdWlyZSgnb3ZlcmxvYWQtanMnKSxcclxuICAgIG8gICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG5cclxuICAgIF9TVVBQT1JUUyAgPSByZXF1aXJlKCcuLi9zdXBwb3J0cycpLFxyXG4gICAgTk9ERV9UWVBFID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcblxyXG4gICAgX3JlZ2V4ICAgICA9IHJlcXVpcmUoJy4uL3JlZ2V4Jyk7XHJcblxyXG52YXIgX3Byb3BGaXggPSB7XHJcbiAgICAndGFiaW5kZXgnICAgICAgICA6ICd0YWJJbmRleCcsXHJcbiAgICAncmVhZG9ubHknICAgICAgICA6ICdyZWFkT25seScsXHJcbiAgICAnZm9yJyAgICAgICAgICAgICA6ICdodG1sRm9yJyxcclxuICAgICdjbGFzcycgICAgICAgICAgIDogJ2NsYXNzTmFtZScsXHJcbiAgICAnbWF4bGVuZ3RoJyAgICAgICA6ICdtYXhMZW5ndGgnLFxyXG4gICAgJ2NlbGxzcGFjaW5nJyAgICAgOiAnY2VsbFNwYWNpbmcnLFxyXG4gICAgJ2NlbGxwYWRkaW5nJyAgICAgOiAnY2VsbFBhZGRpbmcnLFxyXG4gICAgJ3Jvd3NwYW4nICAgICAgICAgOiAncm93U3BhbicsXHJcbiAgICAnY29sc3BhbicgICAgICAgICA6ICdjb2xTcGFuJyxcclxuICAgICd1c2VtYXAnICAgICAgICAgIDogJ3VzZU1hcCcsXHJcbiAgICAnZnJhbWVib3JkZXInICAgICA6ICdmcmFtZUJvcmRlcicsXHJcbiAgICAnY29udGVudGVkaXRhYmxlJyA6ICdjb250ZW50RWRpdGFibGUnXHJcbn07XHJcblxyXG52YXIgX3Byb3BIb29rcyA9IHtcclxuICAgIHNyYzogKF9TVVBQT1JUUy5ocmVmTm9ybWFsaXplZCkgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhyZWY6IChfU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQpID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnaHJlZicsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3VwcG9ydDogU2FmYXJpLCBJRTkrXHJcbiAgICAvLyBtaXMtcmVwb3J0cyB0aGUgZGVmYXVsdCBzZWxlY3RlZCBwcm9wZXJ0eSBvZiBhbiBvcHRpb25cclxuICAgIC8vIEFjY2Vzc2luZyB0aGUgcGFyZW50J3Mgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBmaXhlcyBpdFxyXG4gICAgc2VsZWN0ZWQ6IChfU1VQUE9SVFMub3B0U2VsZWN0ZWQpID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiggZWxlbSApIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgIGZpeDtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGl0IGFsc28gd29ya3Mgd2l0aCBvcHRncm91cHMsIHNlZSAjNTcwMVxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRhYkluZGV4OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiggZWxlbSApIHtcclxuICAgICAgICAgICAgLy8gZWxlbS50YWJJbmRleCBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlIGNvcnJlY3QgdmFsdWUgd2hlbiBpdCBoYXNuJ3QgYmVlbiBleHBsaWNpdGx5IHNldFxyXG4gICAgICAgICAgICAvLyBodHRwOi8vZmx1aWRwcm9qZWN0Lm9yZy9ibG9nLzIwMDgvMDEvMDkvZ2V0dGluZy1zZXR0aW5nLWFuZC1yZW1vdmluZy10YWJpbmRleC12YWx1ZXMtd2l0aC1qYXZhc2NyaXB0L1xyXG4gICAgICAgICAgICAvLyBVc2UgcHJvcGVyIGF0dHJpYnV0ZSByZXRyaWV2YWwoIzEyMDcyKVxyXG4gICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YWJpbmRleCkgeyByZXR1cm4gXy5wYXJzZUludCh0YWJpbmRleCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBub2RlTmFtZSA9IGVsZW0ubm9kZU5hbWU7XHJcbiAgICAgICAgICAgIHJldHVybiAoX3JlZ2V4LnR5cGUuaXNGb2N1c2FibGUobm9kZU5hbWUpIHx8IChfcmVnZXgudHlwZS5pc0NsaWNrYWJsZShub2RlTmFtZSkgJiYgZWxlbS5ocmVmKSkgPyAwIDogLTE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIF9nZXRPclNldFByb3AgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcclxuXHJcbiAgICAvLyBkb24ndCBnZXQvc2V0IHByb3BlcnRpZXMgb24gdGV4dCwgY29tbWVudCBhbmQgYXR0cmlidXRlIG5vZGVzXHJcbiAgICBpZiAoIWVsZW0gfHwgbm9kZVR5cGUgPT09IE5PREVfVFlQRS5URVhUIHx8IG5vZGVUeXBlID09PSBOT0RFX1RZUEUuQ09NTUVOVCB8fCBub2RlVHlwZSA9PT0gTk9ERV9UWVBFLkFUVFJJQlVURSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gX3Byb3BGaXhbbmFtZV0gfHwgbmFtZTtcclxuICAgIHZhciBob29rcyA9IF9wcm9wSG9va3NbbmFtZV07XHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2tzICYmICgnc2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLnNldChlbGVtLCB2YWx1ZSwgbmFtZSkpICE9PSB1bmRlZmluZWQgP1xyXG4gICAgICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgICAgICAoZWxlbVtuYW1lXSA9IHZhbHVlKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBwcm9wOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZylcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldE9yU2V0UHJvcChmaXJzdCwgcHJvcCk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcsIG8uYW55KFN0cmluZywgTnVtYmVyLCBCb29sZWFuKSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2dldE9yU2V0UHJvcChlbGVtLCBwcm9wLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZywgRnVuY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24ocHJvcCwgZm4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgX2dldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgX2dldE9yU2V0UHJvcChlbGVtLCBwcm9wLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIHJlbW92ZVByb3A6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHByb3ApIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gX3Byb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbGVtW25hbWVdO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCA9IHJlcXVpcmUoJ292ZXJsb2FkLWpzJyksXHJcbiAgICBvICAgICAgICA9IG92ZXJsb2FkLm8sXHJcblxyXG4gICAgX3V0aWxzICAgPSByZXF1aXJlKCcuLi91dGlscycpLFxyXG4gICAgX2FycmF5ICAgPSByZXF1aXJlKCcuL2FycmF5JyksXHJcbiAgICBfb3JkZXIgICA9IHJlcXVpcmUoJy4uL29yZGVyJyksXHJcblxyXG4gICAgRml6emxlICAgPSByZXF1aXJlKCcuL0ZpenpsZS9GaXp6bGUnKTtcclxuXHJcbnZhciBfZmluZCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBpc05ldykge1xyXG4gICAgdmFyIHF1ZXJ5ID0gRml6emxlLnF1ZXJ5KHNlbGVjdG9yKTtcclxuICAgIHJldHVybiBxdWVyeS5leGVjKHRoaXMsIGlzTmV3KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIF9maW5kV2l0aGluID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgIC8vIEZhaWwgZmFzdFxyXG4gICAgaWYgKCFjb250ZXh0Lmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICB2YXIgcXVlcnksIGRlc2NlbmRhbnRzLCByZXN1bHRzO1xyXG5cclxuICAgIGlmIChfLmlzRWxlbWVudChzZWxlY3RvcikgfHwgXy5pc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBfLmlzQXJyYXkoc2VsZWN0b3IpIHx8IHNlbGVjdG9yIGluc3RhbmNlb2YgRCkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IF8uaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IHNlbGVjdG9yO1xyXG5cclxuICAgICAgICBkZXNjZW5kYW50cyA9IF8uZmxhdHRlbihfLm1hcChjb250ZXh0LCBmdW5jdGlvbihlbGVtKSB7IHJldHVybiBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKTsgfSkpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBfLmZpbHRlcihkZXNjZW5kYW50cywgZnVuY3Rpb24oZGVzY2VuZGFudCkgeyByZXR1cm4gc2VsZWN0b3IuaW5kZXhPZihkZXNjZW5kYW50KSA+IC0xOyB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlcnkgPSBGaXp6bGUucXVlcnkoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBxdWVyeS5leGVjKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59O1xyXG5cclxudmFyIF9maWx0ZXIgPSBmdW5jdGlvbihhcnIsIHF1YWxpZmllcikge1xyXG4gICAgLy8gRWFybHkgcmV0dXJuLCBubyBxdWFsaWZpZXIuIEV2ZXJ5dGhpbmcgbWF0Y2hlc1xyXG4gICAgaWYgKCFxdWFsaWZpZXIpIHsgcmV0dXJuIGFycjsgfVxyXG5cclxuICAgIC8vIEZ1bmN0aW9uXHJcbiAgICAvLyBXaGVuIElFOCBzdXBwb3J0IGlzIHJlbW92ZWQsIHRoaXMgY2FuIGJlIHJldmVydGVkIGJhY2sgdG8gXy5pc0Z1bmN0aW9uKClcclxuICAgIGlmIChfLmlzUmVhbGx5RnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIChlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoXy5pc1N0cmluZyhxdWFsaWZpZXIpKSB7XHJcblxyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzLm1hdGNoKGVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IHF1YWxpZmllclxyXG4gICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBxdWFsaWZpZXIuaW5kZXhPZihlbGVtKSA+IC0xO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZpbmQ6IF9maW5kLFxyXG4gICAgZmlsdGVyOiBfZmlsdGVyLFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgLy8gVE9ETzogT3B0aW1pemUgdGhpcyBtZXRob2RcclxuICAgICAgICBoYXM6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3Moby5zZWxlY3RvcilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRzID0gdGhpcy5maW5kKHRhcmdldCksXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX29yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIGlzOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZylcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzLmFueSh0aGlzKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uY29sbGVjdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihhcnIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmluZGV4T2YoYXJyLCBlbGVtKSAhPT0gLTEpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKEZ1bmN0aW9uKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoRWxlbWVudClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihjb250ZXh0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGVsZW0gPT09IGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkLCBOdW1iZXIsIE9iamVjdCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgbm90OiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKFN0cmluZylcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBpcy5ub3QodGhpcylcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhvLmNvbGxlY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgICAgICAgICBhcnIgPSBfLnRvQXJyYXkoYXJyKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfLmluZGV4T2YoYXJyLCBlbGVtKSA9PT0gLTEpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhGdW5jdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihpdGVyYXRvcikge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhFbGVtZW50KVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoZWxlbSAhPT0gY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkobnVsbCwgdW5kZWZpbmVkLCBOdW1iZXIsIE9iamVjdCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmV4cG9zZSgpLFxyXG5cclxuICAgICAgICBmaW5kOiBvdmVybG9hZCgpXHJcbiAgICAgICAgICAgIC5hcmdzKG8uc2VsZWN0b3IpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gX2ZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9hcnJheS5lbGVtZW50U29ydChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF91dGlscy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIGZpbHRlcjogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIEQoKTsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpcy5tYXRjaChlbGVtKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhvLmNvbGxlY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oYXJyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoXy5pbmRleE9mKGFyciwgZWxlbSkgIT09IC0xKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoRWxlbWVudClcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihjb250ZXh0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGVsZW0gPT09IGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE86IEZpbHRlciB3aXRoIG9iamVjdD8gc2VlIF8uZmluZC9fLmZpbmRXaGVyZVxyXG4gICAgICAgICAgICAuYXJncyhGdW5jdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihjaGVja2VyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGVja2VyLmNhbGwoZWxlbSwgZWxlbSwgaWR4KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhvLmFueShudWxsLCB1bmRlZmluZWQsIE51bWJlcikpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZXhwb3NlKClcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG4gICAgb3ZlcmxvYWQgICAgPSByZXF1aXJlKCdvdmVybG9hZC1qcycpLFxyXG4gICAgbyAgICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG5cclxuICAgIE5PREVfVFlQRSAgPSByZXF1aXJlKCdub2RlLXR5cGUnKSxcclxuXHJcbiAgICBfdXRpbHMgICAgICA9IHJlcXVpcmUoJy4uL3V0aWxzJyksXHJcbiAgICBfYXJyYXkgICAgICA9IHJlcXVpcmUoJy4vYXJyYXknKSxcclxuICAgIF9zZWxlY3RvcnMgID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMnKSxcclxuXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJy4vRml6emxlL0ZpenpsZScpO1xyXG5cclxudmFyIF9nZXRTaWJsaW5ncyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gX2dldE5vZGVTaWJsaW5ncyhjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2licy5sZW5ndGgpIHsgcmVzdWx0LnB1c2goc2licyk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Tm9kZVNpYmxpbmdzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaWJzID0gXy50b0FycmF5KHBhcmVudC5jaGlsZHJlbiksXHJcbiAgICAgICAgICAgIGlkeCAgPSBzaWJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGUgdGhlIG5vZGUgaXRzZWxmIGZyb20gdGhlIGxpc3Qgb2YgaXRzIHBhcmVudCdzIGNoaWxkcmVuLFxyXG4gICAgICAgICAgICAvLyBhbmQgZXhjbHVkZSBjb21tZW50IG5vZGVzIGZvciBJRThcclxuICAgICAgICAgICAgaWYgKHNpYnNbaWR4XSA9PT0gbm9kZSB8fCBzaWJzW2lkeF0ubm9kZVR5cGUgPT09IE5PREVfVFlQRS5DT01NRU5UKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2licztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2hpbGRyZW4gLS0tLS0tXHJcbiAgICBfZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKF8ubWFwKGFyciwgX2NobGRybikpO1xyXG4gICAgfSxcclxuICAgIF9jaGxkcm4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGFyciAgPSBbXSxcclxuICAgICAgICAgICAga2lkcyA9IGVsZW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgIGlkeCAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gID0ga2lkcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGNoaWxkO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGNoaWxkID0ga2lkc1tpZHhdO1xyXG4gICAgICAgICAgICAvLyBTa2lwIGNvbW1lbnQgbm9kZXMgb24gSUU4XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkNPTU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIGFyci5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnRzIC0tLS0tLVxyXG4gICAgX2dldENsb3Nlc3QgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICBjbG9zZXN0LFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGVsZW1zW2lkeF0sIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBwYXJlbnRzLnVuc2hpZnQoZWxlbXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGNsb3Nlc3QgPSBfc2VsZWN0b3JzLmZpbHRlcihwYXJlbnRzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChjbG9zZXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2xvc2VzdFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldFBhcmVudHNVbnRpbCA9IGZ1bmN0aW9uKGQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShkW2lkeF0sIG51bGwsIHN0b3BTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmF3bFVwTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gbm9kZSxcclxuICAgICAgICAgICAgbm9kZVR5cGU7XHJcblxyXG4gICAgICAgIHdoaWxlICgocGFyZW50ICAgPSBfZ2V0Tm9kZVBhcmVudChwYXJlbnQpKSAmJlxyXG4gICAgICAgICAgICAgICAobm9kZVR5cGUgPSBwYXJlbnQubm9kZVR5cGUpICE9PSBOT0RFX1RZUEUuRE9DVU1FTlQgJiZcclxuICAgICAgICAgICAgICAgKCFjb250ZXh0ICAgICAgfHwgcGFyZW50ICE9PSBjb250ZXh0KSAmJlxyXG4gICAgICAgICAgICAgICAoIXN0b3BTZWxlY3RvciB8fCAhRml6emxlLmlzKHN0b3BTZWxlY3RvcikubWF0Y2gocGFyZW50KSkpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVUeXBlID09PSBOT0RFX1RZUEUuRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50IC0tLS0tLVxyXG4gICAgX2dldFBhcmVudCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBfZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgX2dldE5vZGVQYXJlbnQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0UHJldiA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcHJldiA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChwcmV2ID0gcHJldi5wcmV2aW91c1NpYmxpbmcpICYmIHByZXYubm9kZVR5cGUgIT09IE5PREVfVFlQRS5FTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0TmV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgbmV4dCA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykgJiYgbmV4dC5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkVMRU1FTlQpIHt9XHJcbiAgICAgICAgcmV0dXJuIG5leHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXRQcmV2QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcHJldiAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKHByZXYubm9kZVR5cGUgPT09IE5PREVfVFlQRS5FTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwcmV2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0TmV4dEFsbCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIG5leHQgICA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKG5leHQubm9kZVR5cGUgPT09IE5PREVfVFlQRS5FTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0UG9zaXRpb25hbEFsbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBmaWx0ZXI7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBmdW5jdGlvbihzaWJsaW5nKSB7IHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpOyB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgc2libGluZ3MgPSBfLmZpbHRlcihzaWJsaW5ncywgZmlsdGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXRQb3NpdGlvbmFsVW50aWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgaXRlcmF0b3I7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpdGVyYXRvciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc01hdGNoID0gaXMubWF0Y2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpYmxpbmdzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgX3VuaXF1ZVNvcnQgPSBmdW5jdGlvbihlbGVtcywgcmV2ZXJzZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBfYXJyYXkudW5pcXVlKGVsZW1zKTtcclxuICAgICAgICBfYXJyYXkuZWxlbWVudFNvcnQocmVzdWx0KTtcclxuICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRChyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiBfdW5pcXVlU29ydChfc2VsZWN0b3JzLmZpbHRlcihlbGVtcywgc2VsZWN0b3IpLCByZXZlcnNlKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgY29udGVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgICAgICBfLm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmNoaWxkTm9kZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbmRleDogb3ZlcmxvYWQoKVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoc2VsZWN0b3IpLmluZGV4T2YoZmlyc3QpO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkoRWxlbWVudCwgby53aW5kb3csIG8uZG9jdW1lbnQpKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2YoZWxlbSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhvLkQpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihkWzBdKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gZmlyc3QucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBfdXRpbHMuaXNBdHRhY2hlZCBjaGVjayB0byBwYXNzIHRlc3QgXCJOb2RlIHdpdGhvdXQgcGFyZW50IHJldHVybnMgLTFcIlxyXG4gICAgICAgICAgICAgICAgLy8gbm9kZVR5cGUgY2hlY2sgdG8gcGFzcyBcIklmIEQjaW5kZXggY2FsbGVkIG9uIGVsZW1lbnQgd2hvc2UgcGFyZW50IGlzIGZyYWdtZW50LCBpdCBzdGlsbCBzaG91bGQgd29yayBjb3JyZWN0bHlcIlxyXG4gICAgICAgICAgICAgICAgdmFyIGlzQXR0YWNoZWQgICAgICAgPSBfdXRpbHMuaXNBdHRhY2hlZChmaXJzdCksXHJcbiAgICAgICAgICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IHBhcmVudC5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLkRPQ1VNRU5UX0ZSQUdNRU5UO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghaXNBdHRhY2hlZCAmJiAoIWlzUGFyZW50RnJhZ21lbnQgfHwgX3V0aWxzLmlzUGFyc2VkTm9kZShmaXJzdCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZEVsZW1zID0gcGFyZW50LmNoaWxkcmVuIHx8IF8uZmlsdGVyKHBhcmVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IE5PREVfVFlQRS5FTEVNRU5UO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdLmluZGV4T2YuYXBwbHkoY2hpbGRFbGVtcywgWyBmaXJzdCBdKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF91bmlxdWVTb3J0KF9nZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyZW50OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gX2ZpbHRlckFuZFNvcnQoX2dldFBhcmVudCh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcmVudHM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZmlsdGVyQW5kU29ydChfZ2V0UGFyZW50cyh0aGlzKSwgc2VsZWN0b3IsIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfdW5pcXVlU29ydChfZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNpYmxpbmdzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gX2ZpbHRlckFuZFNvcnQoX2dldFNpYmxpbmdzKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2hpbGRyZW46IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZmlsdGVyQW5kU29ydChfZ2V0Q2hpbGRyZW4odGhpcyksIHNlbGVjdG9yKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gX3VuaXF1ZVNvcnQoX2dldFBvc2l0aW9uYWwoX2dldFByZXYsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF91bmlxdWVTb3J0KF9nZXRQb3NpdGlvbmFsKF9nZXROZXh0LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfdW5pcXVlU29ydChfZ2V0UG9zaXRpb25hbEFsbChfZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gX3VuaXF1ZVNvcnQoX2dldFBvc2l0aW9uYWxBbGwoX2dldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gX3VuaXF1ZVNvcnQoX2dldFBvc2l0aW9uYWxVbnRpbChfZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfdW5pcXVlU29ydChfZ2V0UG9zaXRpb25hbFVudGlsKF9nZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCAgID0gcmVxdWlyZSgnb3ZlcmxvYWQtanMnKSxcclxuICAgIG8gICAgICAgICAgPSBvdmVybG9hZC5vLFxyXG4gICAgc3RyaW5nICAgICA9IHJlcXVpcmUoJy4uL3N0cmluZycpLFxyXG5cclxuICAgIF9TVVBQT1JUUyAgPSByZXF1aXJlKCcuLi9zdXBwb3J0cycpLFxyXG4gICAgTk9ERV9UWVBFID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcblxyXG4gICAgX3V0aWxzICAgICA9IHJlcXVpcmUoJy4uL3V0aWxzJyksXHJcbiAgICBfZGl2ICAgICAgID0gcmVxdWlyZSgnLi4vZGl2Jyk7XHJcblxyXG52YXIgX291dGVySHRtbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMubGVuZ3RoID8gdGhpc1swXS5vdXRlckhUTUwgOiBudWxsO1xyXG59O1xyXG5cclxudmFyIF90ZXh0ID0ge1xyXG4gICAgZ2V0OiAoX2Rpdi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkKSA/XHJcbiAgICAgICAgZnVuY3Rpb24oZWxlbSkgeyByZXR1cm4gZWxlbS50ZXh0Q29udGVudDsgfSA6XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVsZW0pIHsgcmV0dXJuIGVsZW0uaW5uZXJUZXh0OyB9ICxcclxuICAgIHNldDogKF9kaXYudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCkgP1xyXG4gICAgICAgIGZ1bmN0aW9uKGVsZW0sIHN0cikgeyBlbGVtLnRleHRDb250ZW50ID0gc3RyOyB9IDpcclxuICAgICAgICAgICAgZnVuY3Rpb24oZWxlbSwgc3RyKSB7IGVsZW0uaW5uZXJUZXh0ID0gc3RyOyB9XHJcbn07XHJcblxyXG52YXIgX3ZhbEhvb2tzID0ge1xyXG4gICAgb3B0aW9uOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmluZy50cmltKF8uZXhpc3RzKHZhbCkgPyB2YWwgOiBfdGV4dC5nZXQoZWxlbSkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGluZGV4ICAgPSBlbGVtLnNlbGVjdGVkSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBvbmUgICAgID0gZWxlbS50eXBlID09PSAnc2VsZWN0LW9uZScgfHwgaW5kZXggPCAwLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IG9uZSA/IG51bGwgOiBbXSxcclxuICAgICAgICAgICAgICAgIG1heCAgICAgPSBvbmUgPyBpbmRleCArIDEgOiBvcHRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBpbmRleCA8IDAgPyBtYXggOiAob25lID8gaW5kZXggOiAwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIHNlbGVjdGVkIG9wdGlvbnNcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IG1heDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvbGRJRSBkb2Vzbid0IHVwZGF0ZSBzZWxlY3RlZCBhZnRlciBmb3JtIHJlc2V0ICgjMjU1MSlcclxuICAgICAgICAgICAgICAgIGlmICgob3B0aW9uLnNlbGVjdGVkIHx8IGlkeCA9PT0gaW5kZXgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHJldHVybiBvcHRpb25zIHRoYXQgYXJlIGRpc2FibGVkIG9yIGluIGEgZGlzYWJsZWQgb3B0Z3JvdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKF9TVVBQT1JUUy5vcHREaXNhYmxlZCA/ICFvcHRpb24uZGlzYWJsZWQgOiBvcHRpb24uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpID09PSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoIW9wdGlvbi5wYXJlbnROb2RlLmRpc2FibGVkIHx8ICFfdXRpbHMuaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IF92YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgYW4gYXJyYXkgZm9yIG9uZSBzZWxlY3RzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aS1TZWxlY3RzIHJldHVybiBhbiBhcnJheVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25TZXQsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gXy5tYWtlQXJyYXkodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IG9wdGlvbnMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uaW5kZXhPZih2YWx1ZXMsIF92YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbikpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBvcHRpb25TZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYnJvd3NlcnMgdG8gYmVoYXZlIGNvbnNpc3RlbnRseSB3aGVuIG5vbi1tYXRjaGluZyB2YWx1ZSBpcyBzZXRcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25TZXQpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIFJhZGlvIGFuZCBjaGVja2JveCBnZXR0ZXIgZm9yIFdlYmtpdFxyXG5pZiAoIV9TVVBQT1JUUy5jaGVja09uKSB7XHJcbiAgICBfLmVhY2goWydyYWRpbycsICdjaGVja2JveCddLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgX3ZhbEhvb2tzW3R5cGVdID0ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQ6IFdlYmtpdCAtICcnIGlzIHJldHVybmVkIGluc3RlYWQgb2YgJ29uJyBpZiBhIHZhbHVlIGlzbid0IHNwZWNpZmllZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpID09PSBudWxsID8gJ29uJyA6IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIF9nZXRWYWwgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICBpZiAoIWVsZW0gfHwgKGVsZW0ubm9kZVR5cGUgIT09IE5PREVfVFlQRS5FTEVNRU5UKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICB2YXIgaG9vayA9IF92YWxIb29rc1tlbGVtLnR5cGVdIHx8IF92YWxIb29rc1tfdXRpbHMubm9ybWFsTm9kZU5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5nZXQpIHtcclxuICAgICAgICByZXR1cm4gaG9vay5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gXy5pc1N0cmluZyh2YWwpID8gX3V0aWxzLm5vcm1hbGl6ZU5ld2xpbmVzKHZhbCkgOiB2YWw7XHJcbn07XHJcblxyXG52YXIgX3N0cmluZ2lmeSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoIV8uZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuICAgIHJldHVybiAnJyArIHZhbHVlO1xyXG59O1xyXG5cclxudmFyIF9zZXRWYWwgPSBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IE5PREVfVFlQRS5FTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIFN0cmluZ2lmeSB2YWx1ZXNcclxuICAgIGlmIChfLmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgdmFsdWUgPSBfLm1hcCh2YWx1ZSwgX3N0cmluZ2lmeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhbHVlID0gX3N0cmluZ2lmeSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGhvb2sgPSBfdmFsSG9va3NbZWxlbS50eXBlXSB8fCBfdmFsSG9va3NbX3V0aWxzLm5vcm1hbE5vZGVOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suc2V0KSB7XHJcbiAgICAgICAgaG9vay5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgLy8gVE9ETzogT3ZlcmxvYWQgYW5kIGRldGVybWluZSBhcGlcclxuICAgICAgICAvLyBUT0RPOiB1bml0IHRlc3RzXHJcbiAgICAgICAgb3V0ZXJIdG1sOiBfb3V0ZXJIdG1sLFxyXG4gICAgICAgIG91dGVySFRNTDogX291dGVySHRtbCxcclxuXHJcbiAgICAgICAgaHRtbDogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAuYXJncyhTdHJpbmcpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oaHRtbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSBodG1sO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuYXJncyhGdW5jdGlvbilcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKCFmaXJzdCkgPyB1bmRlZmluZWQgOiBmaXJzdC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKSxcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQWRkIGhhbmRsaW5nIG9mIChhbmQgdW5pdCB0ZXN0cyBmb3IpIFxcclxcbiBpbiBJRVxyXG4gICAgICAgIHZhbDogb3ZlcmxvYWQoKVxyXG4gICAgICAgICAgICAvLyBHZXR0ZXJcclxuICAgICAgICAgICAgLmFyZ3MoKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogU2VsZWN0IGZpcnN0IGVsZW1lbnQgbm9kZSBpbnN0ZWFkIG9mIGluZGV4IDA/XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2dldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC8vIFNldHRlcnNcclxuICAgICAgICAgICAgLmFyZ3Moby5hbnkoU3RyaW5nLCBOdW1iZXIsIEFycmF5KSlcclxuICAgICAgICAgICAgLnVzZShmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3NldFZhbChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKG8uYW55KG51bGwsIHVuZGVmaW5lZCkpXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBfc2V0VmFsKGVsZW0sICcnKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgLmFyZ3MoRnVuY3Rpb24pXHJcbiAgICAgICAgICAgIC51c2UoZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IE5PREVfVFlQRS5FTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgX2dldFZhbChlbGVtKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRWYWwoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZmFsbGJhY2soZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9zZXRWYWwoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAuZXhwb3NlKCksXHJcblxyXG4gICAgICAgIHRleHQ6IG92ZXJsb2FkKClcclxuICAgICAgICAgICAgLmFyZ3MoU3RyaW5nKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RleHQuc2V0KGVsZW0sIHN0cik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5hcmdzKEZ1bmN0aW9uKVxyXG4gICAgICAgICAgICAudXNlKGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIF90ZXh0LnNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgX3RleHQuZ2V0KGVsZW0pKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIC5mYWxsYmFjayhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdHIgPSAnJztcclxuICAgICAgICAgICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyICs9IF90ZXh0LmdldChlbGVtKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5leHBvc2UoKVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBvdmVybG9hZCA9IHJlcXVpcmUoJ292ZXJsb2FkLWpzJyk7XHJcblxyXG4vLyBDb25maWd1cmUgb3ZlcmxvYWQgdG8gdGhyb3cgdHlwZSBlcnJvcnNcclxub3ZlcmxvYWQuZXJyID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbn07XHJcblxyXG52YXIgaXNEID0gZnVuY3Rpb24odmFsKSB7XHJcbiAgICByZXR1cm4gdmFsIGluc3RhbmNlb2YgRDtcclxufTtcclxuXHJcbnZhciBpc0NvbGxlY3Rpb24gPSBmdW5jdGlvbih2YWwpIHtcclxuICAgIHJldHVybiBpc0QodmFsKSB8fCBfLmlzQXJyYXkodmFsKSB8fCBfLmlzTm9kZUxpc3QodmFsKTtcclxufTtcclxuXHJcbm92ZXJsb2FkLmRlZmluZVR5cGVzKHtcclxuICAgIEQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiB2YWwgJiYgaXNEKHZhbCk7XHJcbiAgICB9LFxyXG4gICAgbm9kZUxpc3Q6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBfLmlzTm9kZUxpc3QodmFsKTtcclxuICAgIH0sXHJcbiAgICB3aW5kb3c6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBfLmlzV2luZG93KHZhbCk7XHJcbiAgICB9LFxyXG4gICAgZG9jdW1lbnQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiB2YWwgJiYgdmFsID09PSBkb2N1bWVudDtcclxuICAgIH0sXHJcbiAgICBzZWxlY3RvcjogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbCAmJiAoXy5pc1N0cmluZyh2YWwpIHx8IF8uaXNGdW5jdGlvbih2YWwpIHx8IF8uaXNFbGVtZW50KHZhbCkgfHwgaXNDb2xsZWN0aW9uKHZhbCkpO1xyXG4gICAgfSxcclxuICAgIGNvbGxlY3Rpb246IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiB2YWwgJiYgaXNDb2xsZWN0aW9uKHZhbCk7XHJcbiAgICB9LFxyXG4gICAgZWxlbWVudDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbCA9PT0gZG9jdW1lbnQgfHwgXy5pc1dpbmRvdyh2YWwpIHx8IF8uaXNFbGVtZW50KHZhbCk7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJ2YXIgTk9ERV9UWVBFID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcbiAgICBfRE9DX1BPUyAgID0gcmVxdWlyZSgnLi9kb2NQb3MnKSxcclxuXHJcbiAgICBfdXRpbHMgICAgID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuLy8gQ29tcGFyZSBQb3NpdGlvbiAtIE1JVCBMaWNlbnNlZCwgSm9obiBSZXNpZ1xyXG4vLyBUT0RPOiBPcHRpbWl6ZSB0aGlzIGZ1bmN0aW9uXHJcbnZhciBfY29tcGFyZVBvc2l0aW9uID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XHJcbiAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgKElFOSspXHJcbiAgICBpZiAobm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24pIHtcclxuICAgICAgICByZXR1cm4gbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZTIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZWwgPSAwO1xyXG5cclxuICAgIGlmIChub2RlMSA9PT0gbm9kZTIpIHtcclxuICAgICAgICByZXR1cm4gcmVsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElFOFxyXG4gICAgaWYgKG5vZGUxLmNvbnRhaW5zKSB7XHJcbiAgICAgICAgaWYgKG5vZGUxLmNvbnRhaW5zKG5vZGUyKSkge1xyXG4gICAgICAgICAgICByZWwgKz0gX0RPQ19QT1MuQ09OVEFJTkVEX0JZO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobm9kZTIuY29udGFpbnMobm9kZTEpKSB7XHJcbiAgICAgICAgICAgIHJlbCArPSBfRE9DX1BPUy5DT05UQUlOUztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlMS5zb3VyY2VJbmRleCA+PSAwICYmIG5vZGUyLnNvdXJjZUluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgcmVsICs9IChub2RlMS5zb3VyY2VJbmRleCA8IG5vZGUyLnNvdXJjZUluZGV4ID8gX0RPQ19QT1MuRk9MTE9XSU5HIDogMCk7XHJcbiAgICAgICAgICAgIHJlbCArPSAobm9kZTEuc291cmNlSW5kZXggPiBub2RlMi5zb3VyY2VJbmRleCA/IF9ET0NfUE9TLlBSRUNFRElORyA6IDApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFfdXRpbHMuaXNBdHRhY2hlZChub2RlMSkgfHwgIV91dGlscy5pc0F0dGFjaGVkKG5vZGUyKSkge1xyXG4gICAgICAgICAgICAgICAgcmVsICs9IF9ET0NfUE9TLkRJU0NPTk5FQ1RFRDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlbCArPSBfRE9DX1BPUy5ESVNDT05ORUNURUQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZWw7XHJcbn07XHJcblxyXG52YXIgX2lzID0gZnVuY3Rpb24ocmVsLCBmbGFnKSB7XHJcbiAgICByZXR1cm4gKHJlbCAmIGZsYWcpID09PSBmbGFnO1xyXG59O1xyXG5cclxudmFyIF9pc05vZGUgPSBmdW5jdGlvbihiLCBmbGFnLCBhKSB7XHJcbiAgICB2YXIgcmVsID0gX2NvbXBhcmVQb3NpdGlvbihhLCBiKTtcclxuICAgIHJldHVybiBfaXMocmVsLCBmbGFnKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydHMgYW4gYXJyYXkgb2YgRCBlbGVtZW50cyBpbi1wbGFjZSAoaS5lLiwgbXV0YXRlcyB0aGUgb3JpZ2luYWwgYXJyYXkpXHJcbiAgICAgKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAgICAgKiBAZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudFtdfSBhcnJheSAgICAgICAgICBBcnJheSBvZiBEIGVsZW1lbnRzLlxyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKiBAc2VlIGpRdWVyeSBzcmMvc2VsZWN0b3ItbmF0aXZlLmpzOjM3XHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgX3NvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgICAgICAgICAgLy8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKG5vZGUxID09PSBub2RlMikge1xyXG4gICAgICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU29ydCBvbiBtZXRob2QgZXhpc3RlbmNlIGlmIG9ubHkgb25lIGlucHV0IGhhcyBjb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgICAgICAgICB2YXIgcmVsID0gIW5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIC0gIW5vZGUyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xyXG4gICAgICAgICAgICBpZiAocmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBpZiAoKG5vZGUxLm93bmVyRG9jdW1lbnQgfHwgbm9kZTEpID09PSAobm9kZTIub3duZXJEb2N1bWVudCB8fCBub2RlMikpIHtcclxuICAgICAgICAgICAgICAgIHJlbCA9IF9jb21wYXJlUG9zaXRpb24obm9kZTEsIG5vZGUyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWwgPSBfRE9DX1BPUy5ESVNDT05ORUNURUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vdCBkaXJlY3RseSBjb21wYXJhYmxlXHJcbiAgICAgICAgICAgIGlmICghcmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICAgICAgICAgIGlmIChfaXMocmVsLCBfRE9DX1BPUy5ESVNDT05ORUNURUQpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNOb2RlMURpc2Nvbm5lY3RlZCA9ICFfdXRpbHMuaXNBdHRhY2hlZChub2RlMSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNOb2RlMkRpc2Nvbm5lY3RlZCA9ICFfdXRpbHMuaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZTFEaXNjb25uZWN0ZWQgJiYgaXNOb2RlMkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc05vZGUyRGlzY29ubmVjdGVkID8gLTEgOiAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gX2lzKHJlbCwgX0RPQ19QT1MuRk9MTE9XSU5HKSA/IC0xIDogMTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJyYXksIHJldmVyc2UpIHtcclxuICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBhcnJheS5zb3J0KF9zb3J0KTtcclxuICAgICAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgICAgIGFycmF5LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2hhc0R1cGxpY2F0ZTtcclxuICAgICAgICB9O1xyXG4gICAgfSgpKSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVybWluZXMgd2hldGhlciBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYC5cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gYSBEIGVsZW1lbnQgbm9kZVxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBiIEQgZWxlbWVudCBub2RlXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYDsgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgIHZhciBhRG93biA9IGEubm9kZVR5cGUgPT09IE5PREVfVFlQRS5ET0NVTUVOVCA/IGEuZG9jdW1lbnRFbGVtZW50IDogYSxcclxuICAgICAgICAgICAgYlVwICAgPSBfdXRpbHMuaXNBdHRhY2hlZChiKSA/IGIucGFyZW50Tm9kZSA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChhID09PSBiVXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYlVwICYmIGJVcC5ub2RlVHlwZSA9PT0gTk9ERV9UWVBFLkVMRU1FTlQpIHtcclxuICAgICAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzIChJRTkrKVxyXG4gICAgICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pc05vZGUoYlVwLCBfRE9DX1BPUy5DT05UQUlORURfQlksIGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIElFOFxyXG4gICAgICAgICAgICBpZiAoYURvd24uY29udGFpbnMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhRG93bi5jb250YWlucyhiVXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG59O1xyXG4iLCIvLyBFUzUgMTUuNC40LjE0XHJcbi8vIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDE1LjQuNC4xNFxyXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mXHJcbmlmICghQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgKFswLCAxXS5pbmRleE9mKDEsIDIpICE9PSAtMSkpIHtcclxuXHJcbiAgICB2YXIgX3RvSW50ZWdlciA9IGZ1bmN0aW9uKG4pIHtcclxuICAgICAgICAgICAgbiA9ICtuO1xyXG4gICAgICAgICAgICBpZiAobiAhPT0gbikgeyAvLyBpc05hTlxyXG4gICAgICAgICAgICAgICAgbiA9IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobiAhPT0gMCAmJiBuICE9PSAoMS8wKSAmJiBuICE9PSAtKDEvMCkpIHtcclxuICAgICAgICAgICAgICAgIG4gPSAobiA+IDAgfHwgLTEpICogTWF0aC5mbG9vcihNYXRoLmFicyhuKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG47XHJcbiAgICAgICAgfSxcclxuICAgICAgICBfYm94ZWRTdHJpbmcgPSBPYmplY3QoJ2EnKSxcclxuICAgICAgICBfc3BsaXRTdHJpbmcgPSBfYm94ZWRTdHJpbmdbMF0gIT09ICdhJyB8fCAhKDAgaW4gX2JveGVkU3RyaW5nKSxcclxuICAgICAgICBfdG9TdHJpbmcgPSAoZnVuY3Rpb24odG9TdHJpbmcpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaik7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIH0oT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZykpLFxyXG5cclxuICAgICAgICBfdG9PYmplY3QgPSBmdW5jdGlvbihvKSB7XHJcbiAgICAgICAgICAgIGlmIChvID09IG51bGwpIHsgLy8gdGhpcyBtYXRjaGVzIGJvdGggbnVsbCBhbmQgdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2FuJ3QgY29udmVydCBcIitvK1wiIHRvIG9iamVjdFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0KG8pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mKHNvdWdodCAvKiwgZnJvbUluZGV4ICovICkge1xyXG4gICAgICAgIHZhciBzZWxmID0gX3NwbGl0U3RyaW5nICYmIF90b1N0cmluZyh0aGlzKSA9PT0gJ1tvYmplY3QgU3RyaW5nXScgP1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zcGxpdCgnJykgOlxyXG4gICAgICAgICAgICAgICAgX3RvT2JqZWN0KHRoaXMpLFxyXG4gICAgICAgICAgICBsZW5ndGggPSBzZWxmLmxlbmd0aCA+Pj4gMDtcclxuXHJcbiAgICAgICAgaWYgKCFsZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgaSA9IF90b0ludGVnZXIoYXJndW1lbnRzWzFdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGhhbmRsZSBuZWdhdGl2ZSBpbmRpY2VzXHJcbiAgICAgICAgaSA9IGkgPj0gMCA/IGkgOiBNYXRoLm1heCgwLCBsZW5ndGggKyBpKTtcclxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpIGluIHNlbGYgJiYgc2VsZltpXSA9PT0gc291Z2h0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICB9O1xyXG59IiwidmFyIF8gICAgICAgICAgICAgICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG5cclxuICAgIF9jYWNoZSAgICAgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSxcclxuXHJcbiAgICBfY2FtZWxDYWNoZSAgICAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfZGlzcGxheUNhY2hlICAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfZm9jdXNhYmxlQ2FjaGUgICAgID0gX2NhY2hlKCksXHJcbiAgICBfY2xpY2thYmxlQ2FjaGUgICAgID0gX2NhY2hlKCksXHJcbiAgICBfaWRDYWNoZSAgICAgICAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfdGFnQ2FjaGUgICAgICAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfbnVtTm90UHhDYWNoZSAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfcG9zaXRpb25DYWNoZSAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfY2xhc3NDYWNoZSAgICAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfbmVlZENvbnRleHRDYWNoZSAgID0gX2NhY2hlKCksXHJcbiAgICBfZm9jdXNNb3JwaENhY2hlICAgID0gX2NhY2hlKCksXHJcbiAgICBfbW91c2VFdmVudENhY2hlICAgID0gX2NhY2hlKCksXHJcbiAgICBfa2V5RXZlbnRDYWNoZSAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfc2luZ2xlVGFnQ2FjaGUgICAgID0gX2NhY2hlKCksXHJcbiAgICBfcGFyZW50Q2FjaGUgICAgICAgID0gX2NhY2hlKCksXHJcbiAgICBfdHlwZU5hbWVzcGFjZUNhY2hlID0gX2NhY2hlKCksXHJcbiAgICBfbm90V2hpdGVDYWNoZSAgICAgID0gX2NhY2hlKCk7XHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIi1tcy1cIiBzbyB0aGF0IGl0IGNhbiBiZSBjaGFuZ2VkIHRvIFwibXMtXCJcclxudmFyIF9UUlVOQ0FURV9NU19QUkVGSVggID0gL14tbXMtLyxcclxuXHJcbiAgICBfQUxQSEEgICAgICAgICAgICAgICA9IC9hbHBoYVxcKFteKV0qXFwpL2ksXHJcbiAgICBfT1BBQ0lUWSAgICAgICAgICAgICA9IC9vcGFjaXR5XFxzKj1cXHMqKFteKV0qKS8sXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBkYXNoZWQgc3RyaW5nIGZvciBjYW1lbGl6aW5nXHJcbiAgICBfREFTSF9DQVRDSCAgICAgICAgICA9IC8tKFtcXGRhLXpdKS9naSxcclxuXHJcbiAgICAvLyBNYXRjaGVzIFwibm9uZVwiIG9yIGEgdGFibGUgdHlwZSBlLmcuIFwidGFibGVcIixcclxuICAgIC8vIFwidGFibGUtY2VsbFwiIGV0Yy4uLlxyXG4gICAgX05PTkVfT1JfVEFCTEUgICAgICAgPSAvXihub25lfHRhYmxlKD8hLWNbZWFdKS4rKS8sXHJcblxyXG4gICAgX1RZUEVfVEVTVF9GT0NVU0FCTEUgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxidXR0b258b2JqZWN0KSQvaSxcclxuICAgIF9UWVBFX1RFU1RfQ0xJQ0tBQkxFID0gL14oPzphfGFyZWEpJC9pLFxyXG4gICAgX1RZUEVfTkFNRVNQQUNFICAgICAgPSAvXihbXi5dKikoPzpcXC4oLispfCkkLyxcclxuXHJcbiAgICBfU0VMRUNUT1JfSUQgICAgICAgICA9IC9eIyhbXFx3LV0rKSQvLFxyXG4gICAgX1NFTEVDVE9SX1RBRyAgICAgICAgPSAvXltcXHctXSskLyxcclxuICAgIF9TRUxFQ1RPUl9DTEFTUyAgICAgID0gL15cXC4oW1xcdy1dKykkLyxcclxuXHJcbiAgICBfUE9TSVRJT04gICAgICAgICAgICA9IC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkLyxcclxuXHJcbiAgICBfTlVNX05PTl9QWCAgICAgICAgICA9IG5ldyBSZWdFeHAoJ14oJyArICgvWystXT8oPzpcXGQqXFwufClcXGQrKD86W2VFXVsrLV0/XFxkK3wpLykuc291cmNlICsgJykoPyFweClbYS16JV0rJCcsICdpJyksXHJcblxyXG4gICAgX1dISVRFU1BBQ0UgICAgICAgICAgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG4gICAgX05FRURTX0NPTlRFWFQgICAgICAgPSBuZXcgUmVnRXhwKCdeJyArIF9XSElURVNQQUNFICsgJypbPit+XXw6KGV2ZW58b2RkfGVxfGd0fGx0fG50aHxmaXJzdHxsYXN0KSg/OlxcXFwoJyArIF9XSElURVNQQUNFICsgJyooKD86LVxcXFxkKT9cXFxcZCopJyArIF9XSElURVNQQUNFICsgJypcXFxcKXwpKD89W14tXXwkKScsICdpJyksXHJcblxyXG4gICAgX0ZPQ1VTX01PUlBIICAgICAgICAgPSAvXig/OmZvY3VzaW5mb2N1c3xmb2N1c291dGJsdXIpJC8sXHJcbiAgICBfTU9VU0VfRVZFTlQgICAgICAgICA9IC9eKD86bW91c2V8Y29udGV4dG1lbnUpfGNsaWNrLyxcclxuICAgIF9LRVlfRVZFTlQgICAgICAgICAgID0gL15rZXkvLFxyXG5cclxuICAgIF9TSU5HTEVfVEFHICAgICAgICAgID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFwIG9mIHBhcmVudCB0YWcgbmFtZXMgdG8gdGhlIGNoaWxkIHRhZ3MgdGhhdCByZXF1aXJlIHRoZW0uXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBfUEFSRU5UX01BUCA9IHtcclxuICAgICAgICB0YWJsZTogICAgL148KD86dGJvZHl8dGZvb3R8dGhlYWR8Y29sZ3JvdXB8Y2FwdGlvbilcXGIvLFxyXG4gICAgICAgIHRib2R5OiAgICAvXjwoPzp0cilcXGIvLFxyXG4gICAgICAgIHRyOiAgICAgICAvXjwoPzp0ZHx0aClcXGIvLFxyXG4gICAgICAgIGNvbGdyb3VwOiAvXjwoPzpjb2wpXFxiLyxcclxuICAgICAgICBzZWxlY3Q6ICAgL148KD86b3B0aW9uKVxcYi9cclxuICAgIH0sXHJcblxyXG4gICAgX05PVF9XSElURSA9IC9cXFMrL2c7XHJcblxyXG52YXIgX2NhbWVsQ2FzZSA9IGZ1bmN0aW9uKG1hdGNoLCBsZXR0ZXIpIHtcclxuICAgIHJldHVybiBsZXR0ZXIudG9VcHBlckNhc2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxwaGE6IF9BTFBIQSxcclxuICAgIG9wYWNpdHk6IF9PUEFDSVRZLFxyXG5cclxuICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIF9jYW1lbENhY2hlLmdldE9yU2V0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShfVFJVTkNBVEVfTVNfUFJFRklYLCAnbXMtJykucmVwbGFjZShfREFTSF9DQVRDSCwgX2NhbWVsQ2FzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG51bU5vdFB4OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gX251bU5vdFB4Q2FjaGUuZ2V0T3JTZXQodmFsLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9OVU1fTk9OX1BYLnRlc3QodmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcG9zaXRpb246IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBfcG9zaXRpb25DYWNoZS5nZXRPclNldCh2YWwsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gX1BPU0lUSU9OLnRlc3QodmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbmVlZHNDb250ZXh0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gX25lZWRDb250ZXh0Q2FjaGUuZ2V0T3JTZXQodmFsLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9ORUVEU19DT05URVhULnRlc3QodmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZm9jdXNNb3JwaDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIF9mb2N1c01vcnBoQ2FjaGUuZ2V0T3JTZXQodmFsLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9GT0NVU19NT1JQSC50ZXN0KHZhbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1vdXNlRXZlbnQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBfbW91c2VFdmVudENhY2hlLmdldE9yU2V0KHZhbCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfTU9VU0VfRVZFTlQudGVzdCh2YWwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBrZXlFdmVudDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIF9rZXlFdmVudENhY2hlLmdldE9yU2V0KHZhbCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfS0VZX0VWRU5ULnRlc3QodmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2luZ2xlVGFnTWF0Y2g6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBfc2luZ2xlVGFnQ2FjaGUuZ2V0T3JTZXQodmFsLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9TSU5HTEVfVEFHLmV4ZWModmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50VGFnTmFtZTogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFsID0gdmFsLnN1YnN0cigwLCAzMCk7XHJcbiAgICAgICAgcmV0dXJuIF9wYXJlbnRDYWNoZS5nZXRPclNldCh2YWwsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50VGFnTmFtZTtcclxuICAgICAgICAgICAgZm9yIChwYXJlbnRUYWdOYW1lIGluIF9QQVJFTlRfTUFQKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoX1BBUkVOVF9NQVBbcGFyZW50VGFnTmFtZV0udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudFRhZ05hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICdkaXYnO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0eXBlTmFtZXNwYWNlOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gX3R5cGVOYW1lc3BhY2VDYWNoZS5nZXRPclNldCh2YWwsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gX1RZUEVfTkFNRVNQQUNFLmV4ZWModmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgbWF0Y2hOb3RXaGl0ZTogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFsID0gdmFsIHx8ICcnO1xyXG4gICAgICAgIHJldHVybiBfbm90V2hpdGVDYWNoZS5nZXRPclNldCh2YWwsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsLm1hdGNoKF9OT1RfV0hJVEUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXNwbGF5OiB7XHJcbiAgICAgICAgaXNOb25lT3JUYWJsZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZGlzcGxheUNhY2hlLmdldE9yU2V0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX05PTkVfT1JfVEFCTEUudGVzdChzdHIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHR5cGU6IHtcclxuICAgICAgICBpc0ZvY3VzYWJsZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZm9jdXNhYmxlQ2FjaGUuZ2V0T3JTZXQoc3RyLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfVFlQRV9URVNUX0ZPQ1VTQUJMRS50ZXN0KHN0cik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNDbGlja2FibGU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgICAgICByZXR1cm4gX2NsaWNrYWJsZUNhY2hlLmdldE9yU2V0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX1RZUEVfVEVTVF9DTElDS0FCTEUudGVzdChzdHIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdG9yOiB7XHJcbiAgICAgICAgaXNTdHJpY3RJZDogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfaWRDYWNoZS5nZXRPclNldChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9TRUxFQ1RPUl9JRC50ZXN0KHN0cik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNUYWc6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgICAgICByZXR1cm4gX3RhZ0NhY2hlLmdldE9yU2V0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX1NFTEVDVE9SX1RBRy50ZXN0KHN0cik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNDbGFzczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfY2xhc3NDYWNoZS5nZXRPclNldChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9TRUxFQ1RPUl9DTEFTUy50ZXN0KHN0cik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgID0gcmVxdWlyZSgndW5kZXJzY29yZScpLFxyXG4gICAgY2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKDIpLFxyXG4gICAgXHJcbiAgICBSX1RSSU0gICAgICAgPSAvXlxccyt8XFxzKyQvZyxcclxuICAgIFJfU1BBQ0UgICAgICA9IC9cXHMrL2csXHJcblxyXG4gICAgaXNFbXB0eSA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIgPT09IG51bGwgfHwgc3RyID09PSB1bmRlZmluZWQgfHwgc3RyID09PSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgX3NwbGl0SW1wbCA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltKSB7XHJcbiAgICAgICAgdmFyIHNwbGl0ICAgPSBuYW1lLnNwbGl0KGRlbGltKSxcclxuICAgICAgICAgICAgbGVuICAgICA9IHNwbGl0Lmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ICAgICA9IHNwbGl0Lmxlbmd0aCxcclxuICAgICAgICAgICAgbmFtZXMgICA9IFtdLFxyXG4gICAgICAgICAgICBuYW1lU2V0ID0ge30sXHJcbiAgICAgICAgICAgIGN1ck5hbWU7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBjdXJOYW1lID0gc3BsaXRbbGVuIC0gKGlkeCArIDEpXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIG5hbWVTZXRbY3VyTmFtZV0gfHwgLy8gdW5pcXVlXHJcbiAgICAgICAgICAgICAgICBpc0VtcHR5KGN1ck5hbWUpICAgIC8vIG5vbi1lbXB0eVxyXG4gICAgICAgICAgICApIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgIG5hbWVzLnB1c2goY3VyTmFtZSk7XHJcbiAgICAgICAgICAgIG5hbWVTZXRbY3VyTmFtZV0gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xyXG4gICAgfSxcclxuXHJcbiAgICBfc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIGlmIChpc0VtcHR5KG5hbWUpKSB7IHJldHVybiBbXTsgfVxyXG4gICAgICAgIGlmIChfLmlzQXJyYXkobmFtZSkpIHsgcmV0dXJuIG5hbWU7IH1cclxuICAgICAgICBkZWxpbSA9IGRlbGltID09PSB1bmRlZmluZWQgPyBSX1NQQUNFIDogZGVsaW07XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldE9yU2V0KGRlbGltLCBuYW1lLCBmdW5jdGlvbigpIHsgcmV0dXJuIF9zcGxpdEltcGwobmFtZSwgZGVsaW0pOyB9KTtcclxuICAgIH07XHJcblxyXG52YXIgc3RyaW5nID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBpc0VtcHR5OiBpc0VtcHR5LFxyXG5cclxuICAgIHNwbGl0OiBfc3BsaXQsXHJcblxyXG4gICAgdHJpbTogU3RyaW5nLnByb3RvdHlwZS50cmltID9cclxuICAgICAgICBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0cmluZy5pc0VtcHR5KHN0cikgPyBzdHIgOiAoc3RyICsgJycpLnRyaW0oKTsgfSA6XHJcbiAgICAgICAgZnVuY3Rpb24oc3RyKSB7IHJldHVybiBzdHJpbmcuaXNFbXB0eShzdHIpID8gc3RyIDogKHN0ciArICcnKS5yZXBsYWNlKFJfVFJJTSwgJycpOyB9XHJcbn07IiwidmFyIF8gICAgICA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSxcclxuICAgIGRpdiAgICA9IHJlcXVpcmUoJy4vZGl2JyksXHJcbiAgICBhICAgICAgPSBkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2EnKVswXSxcclxuICAgIGJ1dHRvbiA9IGRpdi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYnV0dG9uJylbMF0sXHJcbiAgICBzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKSxcclxuICAgIG9wdGlvbiA9IHNlbGVjdC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKSk7XHJcblxyXG52YXIgX3Rlc3QgPSBmdW5jdGlvbih0YWdOYW1lLCB0ZXN0Rm4pIHtcclxuICAgIC8vIEF2b2lkIHZhcmlhYmxlIHJlZmVyZW5jZXMgdG8gZWxlbWVudHMgdG8gcHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUUuXHJcbiAgICByZXR1cm4gdGVzdEZuKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSkpO1xyXG59O1xyXG5cclxudmFyIHN1cHBvcnQgPSB7fTtcclxuXHJcbi8vIFN1cHBvcnQ6IElFIDwgOSAobGFjayBzdWJtaXQvY2hhbmdlIGJ1YmJsZSksIEZpcmVmb3ggMjMrIChsYWNrIGZvY3VzaW4gZXZlbnQpXHJcbl8uZWFjaChbICdzdWJtaXQnLCAnY2hhbmdlJywgJ2ZvY3VzaW4nIF0sIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIHZhciBldmVudE5hbWUgICA9ICdvbicgKyB0eXBlLFxyXG4gICAgICAgIHN1cHBvcnROYW1lID0gdHlwZSArICdCdWJibGVzJztcclxuXHJcbiAgICBpZiAoIShzdXBwb3J0W3N1cHBvcnROYW1lXSA9IGV2ZW50TmFtZSBpbiB3aW5kb3cpKSB7XHJcbiAgICAgICAgLy8gQmV3YXJlIG9mIENTUCByZXN0cmljdGlvbnMgKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL1NlY3VyaXR5L0NTUClcclxuICAgICAgICBkaXYuc2V0QXR0cmlidXRlKGV2ZW50TmFtZSwgJ3QnKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2tpbmcgJ18nIGFzIGl0IHNob3VsZCBiZSBudWxsIG9yIHVuZGVmaW5lZCBpZiB0aGVcclxuICAgICAgICAvLyBldmVudCBpcyBzdXBwb3J0ZWQsIGZhbHNlIGlmIGl0J3Mgbm90XHJcbiAgICAgICAgc3VwcG9ydFtzdXBwb3J0TmFtZV0gPSBkaXYuYXR0cmlidXRlc1tldmVudE5hbWVdLl8gPT09IGZhbHNlO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoc3VwcG9ydCwge1xyXG4gICAgY2xhc3NMaXN0OiAgICAgISFkaXYuY2xhc3NMaXN0LFxyXG4gICAgY3VycmVudFN0eWxlOiAgISFkaXYuY3VycmVudFN0eWxlLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yOiBkaXYubWF0Y2hlcyAgICAgICAgICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgIGRpdi5tYXRjaGVzU2VsZWN0b3IgICAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgZGl2Lm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICBkaXYubW96TWF0Y2hlc1NlbGVjdG9yICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgIGRpdi53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgZGl2Lm9NYXRjaGVzU2VsZWN0b3IsXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgZWxlbWVudCBvcGFjaXR5IGV4aXN0c1xyXG4gICAgLy8gKElFIHVzZXMgZmlsdGVyIGluc3RlYWQpXHJcbiAgICAvLyBVc2UgYSByZWdleCB0byB3b3JrIGFyb3VuZCBhIFdlYktpdCBpc3N1ZS4gU2VlIGpRdWVyeSAjNTE0NVxyXG4gICAgb3BhY2l0eTogKC9eMC41NSQvKS50ZXN0KGRpdi5zdHlsZS5vcGFjaXR5KSxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBVUkxzIGFyZW4ndCBtYW5pcHVsYXRlZFxyXG4gICAgLy8gKElFIG5vcm1hbGl6ZXMgaXQgYnkgZGVmYXVsdClcclxuICAgIGhyZWZOb3JtYWxpemVkOiBhLmdldEF0dHJpYnV0ZSgnaHJlZicpID09PSAnL2EnLFxyXG5cclxuICAgIC8vIENoZWNrIHRoZSBkZWZhdWx0IGNoZWNrYm94L3JhZGlvIHZhbHVlICgnJyBpbiBvbGRlciBXZWJLaXQ7ICdvbicgZWxzZXdoZXJlKVxyXG4gICAgY2hlY2tPbjogX3Rlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gISFpbnB1dC52YWx1ZTtcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFuIGlucHV0IG1haW50YWlucyBpdHMgdmFsdWUgYWZ0ZXIgYmVjb21pbmcgYSByYWRpb1xyXG4gICAgLy8gU3VwcG9ydDogTW9kZXJuIGJyb3dzZXJzIG9ubHkgKE5PVCBJRSA8PSAxMSlcclxuICAgIHJhZGlvVmFsdWU6IF90ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQudmFsdWUgPSAndCc7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnZhbHVlID09PSAndCc7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgb3B0aW9ucyBpbnNpZGUgZGlzYWJsZWQgc2VsZWN0cyBhcmVuJ3QgbWFya2VkIGFzIGRpc2FibGVkXHJcbiAgICAvLyAoV2ViS2l0IG1hcmtzIHRoZW0gYXMgZGlzYWJsZWQpXHJcbiAgICBvcHREaXNhYmxlZDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuICFvcHRpb24uZGlzYWJsZWQ7XHJcbiAgICB9KCkpLFxyXG5cclxuICAgIC8vIE1vZGVybiBicm93c2VycyBub3JtYWxpemUgXFxyXFxuIHRvIFxcbiBpbiB0ZXh0YXJlYSB2YWx1ZXMsXHJcbiAgICAvLyBidXQgSUUgPD0gMTEgKGFuZCBwb3NzaWJseSBuZXdlcikgZG8gbm90LlxyXG4gICAgdmFsdWVOb3JtYWxpemVkOiBfdGVzdCgndGV4dGFyZWEnLCBmdW5jdGlvbih0ZXh0YXJlYSkge1xyXG4gICAgICAgIHRleHRhcmVhLnZhbHVlID0gJ1xcclxcbic7XHJcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnZhbHVlID09PSAnXFxuJztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgZ2V0UHJvcGVydHlWYWx1ZTogICAgICAgISFhLnN0eWxlLmdldFByb3BlcnR5VmFsdWUsXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUU4XHJcbiAgICBnZXRBdHRyaWJ1dGU6ICAgICAgICAgICAhIWEuc3R5bGUuZ2V0QXR0cmlidXRlLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZTogISFhLmdldEVsZW1lbnRzQnlDbGFzc05hbWUsXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBnZXRDb21wdXRlZFN0eWxlOiAgICAgICAhIXdpbmRvdy5nZXRDb21wdXRlZFN0eWxlLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgLy8gaW5uZXJIVE1MIG9uIHRib2R5IGVsZW1lbnRzIGlzIHJlYWRPbmx5IGluIElFOFxyXG4gICAgLy8gU2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80NzI5NzQzLzQ2NzU4MlxyXG4gICAgd3JpdGFibGVUYm9keTogX3Rlc3QoJ3Rib2R5JywgZnVuY3Rpb24odGJvZHkpIHtcclxuICAgICAgICB0Ym9keS5pbm5lckhUTUwgPSAnPHRyPjx0ZD48L3RkPjwvdHI+JztcclxuICAgICAgICByZXR1cm4gISF0Ym9keS5pbm5lckhUTUw7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTkrLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIC8vIFRoZSBvbmx5IHdvcmthcm91bmQgc2VlbXMgdG8gYmUgdXNlIG91dGVySFRNTCBhbmQgaW5jbHVkZSB5b3VyIDxzZWxlY3Q+IGluIHRoZSBzdHJpbmdcclxuICAgIHdyaXRhYmxlU2VsZWN0OiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2VsZWN0LmlubmVySFRNTCA9ICc8b3B0aW9uPjwvb3B0aW9uPic7XHJcbiAgICAgICAgcmV0dXJuICEhKHNlbGVjdC5jaGlsZHJlbiAmJiBzZWxlY3QuY2hpbGRyZW4ubGVuZ3RoKTtcclxuICAgIH0oKSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICAvLyBVc2UgZGVmYXVsdFZhbHVlIHByb3BlcnR5IGluc3RlYWQgb2YgZ2V0QXR0cmlidXRlKFwidmFsdWVcIilcclxuICAgIGlucHV0VmFsdWVBdHRyOiBfdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCAnJyk7XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LmdldEF0dHJpYnV0ZSgndmFsdWUnKSA9PT0gJyc7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTkrLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIGJ1dHRvblZhbHVlOiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgYnV0dG9uLnNldEF0dHJpYnV0ZSgndmFsdWUnLCAnZm9vYmFyJyk7XHJcbiAgICAgICAgcmV0dXJuIGJ1dHRvbi52YWx1ZSA9PT0gJ2Zvb2Jhcic7XHJcbiAgICB9KCkpLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgZGlzYWJsZWRTZWxlY3RvcjogX3Rlc3QoJ2RpdicsIGZ1bmN0aW9uKGRpdikge1xyXG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSAnPGlucHV0IGRpc2FibGVkIC8+JztcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gZGl2LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0OmRpc2FibGVkJykubGVuZ3RoID4gMDtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIElFOFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTkrLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIGNoZWNrZWRTZWxlY3RvcjogX3Rlc3QoJ2RpdicsIGZ1bmN0aW9uKGRpdikge1xyXG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSAnPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQgLz4nO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIWRpdi5xdWVyeVNlbGVjdG9yKCdpbnB1dDpjaGVja2VkJyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAvLyBJRThcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgc2VsZWN0ZWRTZWxlY3RvcjogX3Rlc3QoJ3NlbGVjdCcsIGZ1bmN0aW9uKHNlbGVjdCkge1xyXG4gICAgICAgIHNlbGVjdC5pbm5lckhUTUwgPSAnPG9wdGlvbiB2YWx1ZT1cIjFcIj4xPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cIjJcIiBzZWxlY3RlZD4yPC9vcHRpb24+JztcclxuICAgICAgICByZXR1cm4gISFzZWxlY3QucXVlcnlTZWxlY3Rvcignb3B0aW9uW3NlbGVjdGVkXScpO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBkZXRhY2hlZENyZWF0ZUVsZW1lbnQ6IF90ZXN0KCdkaXYnLCBmdW5jdGlvbihkaXYpIHtcclxuICAgICAgICByZXR1cm4gIWRpdi5wYXJlbnROb2RlO1xyXG4gICAgfSlcclxufSk7XHJcblxyXG4vLyBQcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRVxyXG5kaXYgPSBhID0gYnV0dG9uID0gc2VsZWN0ID0gb3B0aW9uID0gbnVsbDtcclxuIiwidmFyIF8gICAgICAgICAgICAgPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBzdHJpbmcgICAgICAgID0gcmVxdWlyZSgnLi9zdHJpbmcnKSxcclxuICAgIFNVUFBPUlRTICAgICAgPSByZXF1aXJlKCcuL3N1cHBvcnRzJyksXHJcbiAgICBOT0RFX1RZUEUgICAgID0gcmVxdWlyZSgnbm9kZS10eXBlJyksXHJcbiAgICBjYWNoZSAgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG5cclxuICAgIF9mbGFnUGFyc2VkTm9kZSxcclxuICAgIF9pc1BhcnNlZE5vZGUsXHJcblxyXG4gICAgX3JldHVyblRydWUgICAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7ICB9LFxyXG4gICAgX3JldHVybkZhbHNlICAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9LFxyXG4gICAgX3JldHVyblRoaXMgICAgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7ICB9O1xyXG5cclxuLy8gSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbmlmIChTVVBQT1JUUy5kZXRhY2hlZENyZWF0ZUVsZW1lbnQpIHtcclxuICAgIF9mbGFnUGFyc2VkTm9kZSA9IF8ubm9vcDtcclxuICAgIF9pc1BhcnNlZE5vZGUgICA9IF9yZXR1cm5GYWxzZTtcclxufVxyXG4vLyBJRThcclxuZWxzZSB7XHJcbiAgICBfZmxhZ1BhcnNlZE5vZGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8ICFlbGVtLnBhcmVudE5vZGUpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIC8vIElFOCBjcmVhdGVzIGEgdW5pcXVlIERvY3VtZW50IEZyYWdtZW50IGZvciBldmVyeSBkZXRhY2hlZCBET00gbm9kZS5cclxuICAgICAgICAvLyBNYXJrIGl0IGFzIGJvZ3VzIHNvIHdlIGtub3cgdG8gaWdub3JlIGl0IGVsc2V3aGVyZSB3aGVuIGNoZWNraW5nIHBhcmVudE5vZGUuXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmlzUGFyc2VkTm9kZSA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgX2lzUGFyc2VkTm9kZSAgID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiAhIShlbGVtICYmIGVsZW0ucGFyZW50Tm9kZSAmJiBlbGVtLnBhcmVudE5vZGUuaXNQYXJzZWROb2RlKTtcclxuICAgIH07XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaXNBdHRhY2hlZDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiAhIShcclxuICAgICAgICAgICAgZWxlbSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgICAgIGVsZW0ub3duZXJEb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICAgICAgZWxlbS5wYXJlbnROb2RlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgICAgIGVsZW0ucGFyZW50Tm9kZS5ub2RlVHlwZSAhPT0gTk9ERV9UWVBFLkRPQ1VNRU5UX0ZSQUdNRU5UICAmJlxyXG4gICAgICAgICAgICBlbGVtLnBhcmVudE5vZGUuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzSHRtbDogZnVuY3Rpb24odGV4dCkge1xyXG4gICAgICAgIGlmICghXy5pc1N0cmluZyh0ZXh0KSkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgdGV4dCA9IHN0cmluZy50cmltKHRleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gKHRleHQuY2hhckF0KDApID09PSAnPCcgJiYgdGV4dC5jaGFyQXQodGV4dC5sZW5ndGggLSAxKSA9PT0gJz4nICYmIHRleHQubGVuZ3RoID49IDMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3JtYWxOb2RlTmFtZTogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZSA9IGVsZW0ubm9kZU5hbWU7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldE9yU2V0KG5vZGVOYW1lLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzTm9kZU5hbWU6IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWUgPSBjYWNoZS5nZXRPclNldChlbGVtLm5vZGVOYW1lLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBjb21wYXJlTmFtZSA9IGNhY2hlLmdldE9yU2V0KG5hbWUsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlTmFtZSA9PT0gY29tcGFyZU5hbWU7XHJcbiAgICB9LFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggZWFjaCBlbGVtZW50IGluIHRoZVxyXG4gICAgICAgIC8vIHNlY29uZCBhcnJheSBhbmQgYWRkIGl0IHRvIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtpZHhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgfSxcclxuXHJcbiAgICBub3JtYWxpemVOZXdsaW5lczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ciAmJiBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgPyBzdHIucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKSA6IHN0cjtcclxuICAgIH0sXHJcblxyXG4gICAgcmV0dXJuVHJ1ZTogIF9yZXR1cm5UcnVlLFxyXG4gICAgcmV0dXJuRmFsc2U6IF9yZXR1cm5GYWxzZSxcclxuICAgIHJldHVyblRoaXM6ICBfcmV0dXJuVGhpcyxcclxuICAgIGlkZW50aXR5OiAgICBfcmV0dXJuVGhpcyxcclxuXHJcbiAgICBmbGFnUGFyc2VkTm9kZTogX2ZsYWdQYXJzZWROb2RlLFxyXG4gICAgaXNQYXJzZWROb2RlOiAgIF9pc1BhcnNlZE5vZGVcclxufTtcclxuIl19
