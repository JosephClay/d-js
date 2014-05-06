(function(undefined) {
    (function(config, definitions, undefined) {

        var modules = {

        };

        var moduleCache = {

        };

        var aliases = {

        };

        for (var alias in config.aliases) {
            aliases[alias] = config.aliases[alias];
        }

        var require = function(path) {
            path = aliases[path] || path;
            return moduleCache[path] || (moduleCache[path] = modules[path]());
        };

        var define = function(path, definition) {
            var module;

            modules[path] = function() {
                if (module) {
                    return module.exports;
                }
                module = { exports: {} };
                definition(require, module, module.exports);
                return module.exports;
            };
        };

        for (var path in definitions) {
            define(path, definitions[path]);
        }

        require(config.main);

    }(
        {
            "main": 1,
            "aliases": {}
        },
        {
            "1": function(require, module, exports) {
                var _ = require('2'),
                    parser = require('9'),
                    utils = require('8'),
                    array = require('13'),
                    onready = require('22'),
                    selectors = require('26'),
                    transversal = require('27'),
                    dimensions = require('18'),
                    manip = require('21'),
                    css = require('16'),
                    attr = require('14'),
                    val = require('28'),
                    classes = require('15');

                // Store previous reference
                var _prevD = window.D;

                // Configure overload to throw type errors
                Overload.prototype.err = function() {
                    throw new TypeError();
                };

                var DOM = function(arg) {
                    // Wasn't created with "new"
                    if (!(this instanceof DOM)) { return new DOM(arg); }

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
                            return;
                        }

                        // Selector: perform a find without creating a new DOM
                        utils.merge(this, selectors.find(arg, this));
                        return;
                    }

                    // Array of Elements or NodeList
                    if (_.isArray(arg) || _.isNodeList(arg)) {
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

                _.extend(DOM, parser.D, {
                    each:    array.each,
                    map:     _.map,
                    extend:  _.extend,
                    forEach: _.each,

                    noConflict: function() {
                        if (_hasMoreConflict) {
                            window.jQuery = _prevjQuery;
                            window.$ = _prev$;

                            _hasMoreConflict = false;
                        }

                        window.D = _prevD;
                        return DOM;
                    },

                    moreConflict: function() {
                        _hasMoreConflict = true;
                        _prevjQuery = window.jQuery;
                        _prev$ = window.$;
                        window.jQuery = window.Zepto = window.$ = DOM;
                    }
                });

                var arrayProto = (function() {

                    var keys = [
                            'length',
                            'toString',
                            'toLocaleString',
                            'join',
                            'pop',
                            'push',
                            'concat',
                            'reverse',
                            'shift',
                            'unshift',
                            'slice',
                            'splice',
                            'sort',
                            'some',
                            'every',
                            'indexOf',
                            'lastIndexOf',
                            'reduce',
                            'reduceRight'
                        ],
                        idx = keys.length,
                        obj = {};

                    while (idx--) {
                        obj[keys[idx]] = Array.prototype[keys[idx]];
                    }

                    return obj;

                }());

                _.extend(
                    DOM.prototype,
                    arrayProto,
                    array.fn,
                    selectors.fn,
                    transversal.fn,
                    manip.fn,
                    dimensions.fn,
                    css.fn,
                    attr.fn,
                    val.fn,
                    classes.fn,
                    { constructor: DOM }
                );

                // Expose the prototype so that
                // it can be hooked into for plugins
                DOM.fn = DOM.prototype;

                module.exports = window.D = DOM;


                if (typeof define === 'function' && define.amd) {
                    define('D', [], function() {
                        return DOM;
                    });
                }

                /*
                        _bind = function(elem, eventName, callback) {
                            if (elem.addEventListener) {
                                return elem.addEventListener(eventName, callback);
                            }

                            elem.attachEvent('on' + eventName, function() {
                                callback.call(elem);
                            });
                        },

                        _unbind = function(elem, eventName, callback) {
                            if (elem.removeEventListener) {
                                return elem.removeEventListener(eventName, callback);
                            }

                            elem.detachEvent('on' + eventName, callback);
                        },


                    Dom.prototype = {

                        clone: function() {
                            return new Dom(this.elem.cloneNode(true));
                        },

                        empty: function() {
                            while (this.elem.firstChild) {
                                this.elem.removeChild(this.elem.firstChild);
                            }
                            return this;
                        },

                        remove: function() {
                            this.elem.parentNode.removeChild(this.elem);
                            return this;
                        },

                        text: function(str) {
                            if (_.exists(str)) {
                                this.elem.textContent = ('' + str);
                                return this;
                            }

                            return this.elem.textContent;
                        },

                        parent: function() {
                            return new Dom(this.elem.parentNode);
                        },

                        children: function() {
                            return new Dom(this.elem.children);
                        },

                        position: function() {
                            return {
                                left: this.elem.offsetLeft,
                                top: this.elem.offsetTop
                            };
                        },

                        html: function(str) {
                            if (_exists(str)) {
                                this.elem.innerHTML = ('' + str);
                                return this;
                            }

                            return this.elem.innerHTML;
                        },

                        offset: function() {
                            return this.elem.getBoundingClientRect();
                        },

                        on: function(eventName, callback) {
                            _bind(this.elem, eventName, callback);
                            return this;
                        },

                        off: function(eventName, callback) {
                            _unbind(this.elem, eventName, callback);
                            return this;
                        }
                    };
                */
            },
            "2": function(require, module, exports) {
                var _id = 0,
                    _toString = Object.prototype.toString,
                    _stringProto = String.prototype,
                    _rtrim = /^\s+|\s+$/g;

                var _ = {
                    uniqueId: function() {
                        return _id++;
                    },

                    exists: function(obj) {
                        return obj !== null && obj !== undefined;
                    },

                    trim: _stringProto.trim ?
                            function(str) { return (str + '').trim(); } :
                                function(str) { return (str + '').replace(_rtrim, ''); },

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
                        if (!arr) { return results; }

                        var idx = 0, length = arr.length;
                        for (; idx < length; idx++) {
                            if (iterator(arr[idx], idx)) {
                                results.push(value);
                            }
                        }

                        return results;
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

                module.exports = _;
            },
            "9": function(require, module, exports) {
                var _parse = function(htmlStr) {
                    var tmp = document.implementation.createHTMLDocument();
                        tmp.body.innerHTML = htmlStr;
                    return tmp.body.children;
                };

                var _parseHtml = function(str) {
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
            },
            "8": function(require, module, exports) {
                var _BEGINNING_NEW_LINES = /^[\n]*/;

                module.exports = {
                    exists: function(val) {
                        return (val !== null && val !== undefined);
                    },

                    isHtml: function(text) {
                        if (!_.isString(text)) { return false; }

                        // TODO: Using es5 native method (trim)
                        text = text.trim();
                        text = text.replace(_BEGINNING_NEW_LINES, '');

                        return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
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
            },
            "13": function(require, module, exports) {
                var _ = require('2'),
                    _utils = require('8');

                var _slice = (function(_slice) {
                        return function(arr, start, end) {
                            // Exit early for empty array
                            if (!arr || !arr.length) { return []; }

                            // End, naturally, has to be higher than 0 to matter,
                            // so a simple existance check will do
                            if (end) { return _slice.call(arr, start, end); }

                            return _slice.call(arr, start || 0);
                        };
                    }([].slice)),

                    // See jQuery
                    // src\selector-native.js: 37
                    _elementSort = (function() {

                        var _hasDuplicate = false;
                        var _sort = function(a, b) {
                            // Flag for duplicate removal
                            if (a === b) {
                                _hasDuplicate = true;
                                return 0;
                            }

                            var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);

                            // Not directly comparable, sort on existence of method
                            if (!compare) { return a.compareDocumentPosition ? -1 : 1; }

                            // Disconnected nodes
                            if (compare & 1) {

                                // Choose the first element that is related to our document
                                if (a === document || b === document) { return 1; }

                                // Maintain original order
                                return 0;
                            }

                            return compare & 4 ? -1 : 1;
                        };

                        return function(array) {
                            _hasDuplicate = false;
                            array.sort(_sort);
                            return _hasDuplicate;
                        };

                    }()),

                    _unique = function(results) {
                        var hasDuplicates = _elementSort(results);
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
                    elementSort: _elementSort,
                    unique: _unique,
                    each: _each,

                    fn: {
                        at: function(index) {
                            return this[+index];
                        },

                        get: function(index) {
                            // No index, return all
                            if (!_utils.exists(index)) { return this.toArray(); }

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
            },
            "22": function(require, module, exports) {
                var _isReady = false,
                    _registration = [];

                var _bind = function(fn) {
                    if (document.readyState === "complete") {
                        return fn();
                    }

                    if (document.addEventListener) {
                        return document.addEventListener('DOMContentLoaded', fn);
                    }

                    document.attachEvent('onreadystatechange', function() {
                        if (document.readyState === 'interactive') { fn(); }
                    });
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
            },
            "26": function(require, module, exports) {
                var _utils = require('8'),
                    _cache = require('3'),
                    _regex = require('6'),
                    _array = require('13'),
                    _nodeType = require('5'),
                    _supports = require('7'),

                    _selectorBlackList = ['.', '#', '', ' '];

                var _isMatch = (function(matchSelector) {
                    if (matchSelector) {
                        return function(elem, selector) {
                            return matchSelector.call(elem, selector);
                        };
                    }

                    return function(elem, selector) {
                        var nodes = elem.parentNode.querySelectorAll(selector),
                            idx = nodes.length;
                        while (idx--) {
                            if (nodes[idx] === elem) {
                                return true;
                            }
                        }
                        return false;
                    };
                }(_supports.matchesSelector));

                var _find = function(selector, context) {
                    var idx = 0,
                        length = context.length || 1,
                        result = [];

                    // Early return if the selector is bad
                    if (_selectorBlackList.indexOf(selector) > -1) { return result; }

                    var method = _determineMethod(selector);
                    for (; idx < length; idx++) {
                        var ret = _findWithQuery(selector, context[idx], method);
                        if (ret) { result.push(ret); }
                    }

                    return _array.unique(_.flatten(result));
                };

                var _determineMethod = function(selector) {
                    var method = _cache.selector.get(selector);
                    if (method) { return method; }

                    if (_regex.selector.isStrictId(selector)) {
                        method = 'getElementById';
                    } else if (_regex.selector.isClass(selector)) {
                        method = 'getElementsByClassName';
                    } else if (_regex.selector.isTag(selector)) {
                        method = 'getElementsByTagName';
                    } else {
                        method = 'querySelectorAll';
                    }

                    _cache.selector.set(selector, method);
                    return method;
                };

                var _findWithQuery = function(selector, context, method) {
                    context = context || document;

                    // TODO: What to do if ">" child selector is used @ index = 0;

                    var nodeType;
                    // Early return if context is not an element or document
                    if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

                    var query = context[method](selector);
                    if (!query.length) { return; }
                    return _array.slice(query);
                };

                var _filter = function(arr, qualifier) {
                    // Early return, no qualifier. Everything matches
                    if (!qualifier) { return arr; }

                    // Function
                    if (_.isFunction(qualifier)) {
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
                        return _.filter(arr, function(elem) {
                            return elem.nodeType === 1 && _isMatch(elem, qualifier);
                        });
                    }

                    // Array qualifier
                    return _.filter(arr, function(elem) {
                        return arr.indexOf(qualifier) > -1;
                    });
                };

                module.exports = {
                    find: _find,
                    is: _isMatch,
                    filter: _filter,

                    fn: {
                        has: function(target) {
                            // TODO: Has
                            /*var i,
                                targets = jQuery( target, this ),
                                len = targets.length;

                            return this.filter(function() {
                                for ( i = 0; i < len; i++ ) {
                                    if ( jQuery.contains( this, targets[i] ) ) {
                                        return true;
                                    }
                                }
                            });*/
                        },

                        is: Overload()
                                .args(String).use(function(selector) {
                                    return _.any(this, function(elem) {
                                        return _isMatch(elem, selector);
                                    });
                                })
                                .args(Function).use(function(iterator) {
                                    // TODO: Internal "every"
                                    return _.any(this, iterator);
                                })
                                .expose(),

                        not: function() {},

                        find: Overload()
                                .args(String)
                                .use(function(selector) {

                                    return _utils.merge(D(), _find(selector, this));

                                }).expose(),

                        filter: Overload()
                                    .args(String)
                                    .use(function(selector) {
                                        return this.is(selector);
                                    })
                                    .args(Function)
                                    .use(function(checker) {
                                        var result = [],
                                            idx = this.length;

                                        while (idx--) {
                                            if (checker(this[idx])) { result.unshift(this[idx]); }
                                        }

                                        return D(result);
                                    })
                                    .expose()
                    }
                };
            },
            "3": function(require, module, exports) {
                var _ = require('2');

                var _cache = {};

                var getterSetter = function(key) {

                    var ref = (_cache[key] = {});

                    return {
                        get: function(key) {
                            return ref[key];
                        },
                        set: function(key, value) {
                            ref[key] = value;
                            return value;
                        },
                        getOrSet: function(key, fn) {
                            var cachedVal = ref[key];
                            if (cachedVal !== undefined) { return cachedVal; }
                            return (ref[key] = fn());
                        }
                    };
                };

                module.exports = (function() {

                    var exp = getterSetter(''),
                        caches = [
                            'classArray',
                            'classMap',
                            'selector',
                            'selectedTestId',
                            'selectedTestTag',
                            'selectedTestClass',
                            'camelCase',
                            'display',
                            'csskey'
                        ],
                        idx = caches.length;

                    while (idx--) {
                        exp[caches[idx]] = getterSetter(_.uniqueId());
                    }

                    return exp;

                }());
            },
            "6": function(require, module, exports) {
                var _cache = require('3');

                    // Matches "-ms-" so that it can be changed to "ms-"
                var _TRUNCATE_MS_PREFIX = /^-ms-/,

                    // Matches dashed string for camelizing
                    _DASH_CATCH = /-([\da-z])/gi,

                    // Matches "none" or a table type e.g. "table",
                    // "table-cell" etc...
                    _NONE_OR_TABLE = /^(none|table(?!-c[ea]).+)/,

                    _SELECTOR_TEST = {
                        id:    /^#([\w-]+)$/,
                        tag:   /^[\w-]+$/,
                        klass: /^\.([\w-]+)$/
                    };

                var _camelCase = function(match, letter) {
                    return letter.toUpperCase();
                };

                module.exports = {
                    alpha: /alpha\([^)]*\)/i,
                    opacity: /opacity\s*=\s*([^)]*)/,

                    camelCase: function(str) {
                        return _cache.camelCase.getOrSet(str, function() {
                            return str.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, _camelCase);
                        });
                    },

                    display: {
                        isNoneOrTable: function(str) {
                            return _cache.display.getOrSet(str, function() {
                                return !!_NONE_OR_TABLE.exec(str);
                            });
                        }
                    },

                    selector: {
                        isStrictId: function(str) {
                            return _cache.selectedTestId.getOrSet(str, function() {
                                var result = _SELECTOR_TEST.id.exec(str);
                                return result ? !result[1] : false;
                            });
                        },
                        isTag: function(str) {
                            return _cache.selectedTestTag.getOrSet(str, function() {
                                var result = _SELECTOR_TEST.tag.exec(str);
                                return result ? !result[1] : false;
                            });
                        },
                        isClass: function(str) {
                            return _cache.selectedTestClass.getOrSet(str, function() {
                                var result = _SELECTOR_TEST.klass.exec(str);
                                return result ? !result[1] : false;
                            });
                        }
                    }
                };
            },
            "5": function(require, module, exports) {
                module.exports = {
                    ELEMENT:                1,
                    ATTRIBUTE:              2,
                    TEXT:                   3,
                    CDATA:                  4,
                    ENTITY_REFERENCE:       5,
                    ENTITY:                 6,
                    PROCESSING_INSTRUCTION: 7,
                    COMMENT:                8,
                    DOCUMENT:               9,
                    DOCUMENT_TYPE:          10,
                    DOCUMENT_FRAGMENT:      11,
                    NOTATION:               12
                };
            },
            "7": function(require, module, exports) {
                var div = require('4');

                module.exports = {
                    classList: !!div.classList,
                    currentStyle: !!div.currentStyle,
                    matchesSelector: div.matches ||
                                        div.matchesSelector ||
                                            div.msMatchesSelector ||
                                                div.mozMatchesSelector ||
                                                    div.webkitMatchesSelector ||
                                                        div.oMatchesSelector,

                    // Make sure that element opacity exists
                    // (IE uses filter instead)
                    // Use a regex to work around a WebKit issue. See #5145
                    opacity: (/^0.55$/).test(div.style.opacity)
                };
            },
            "4": function(require, module, exports) {
                var div = document.createElement('div');
                div.cssText = 'opacity:.55';
                module.exports = div;
            },
            "27": function(require, module, exports) {
                var _ = require('2'),
                    _nodeType = require('5'),

                    _array = require('13'),
                    _selectors = require('26');

                var _getSiblings = function(context) {
                        var idx = 0,
                            length = context.length,
                            result = [];
                        for (; idx < length; idx++) {
                            var sibs = _getNodeSiblings(context[idx]);
                            if (sibs.length) { result.push(sibs); }
                        }
                        return _.flatten(result);
                    },

                    _getNodeSiblings = function(node) {
                        var siblings = _array.slice(node.parentNode.children),
                            idx = siblings.length;

                        while (idx--) {
                            if (siblings[idx] === node) {
                                siblings.splice(i, 1);
                            }
                        }

                        return siblings;
                    },

                    // Children ------
                    _getChildren = function(arr) {
                        return _.flatten(_.map(arr, _chldrn));
                    },
                    _chldrn = function(elem) {
                        var arr = [],
                            children = elem.children,
                            idx = 0, length = children.length,
                            child;
                        for (; idx < length; idx++) {
                            child = children[idx];
                            // Skip comment nodes on IE8
                            if (child.nodeType !== _nodeType.COMMENT) {
                                arr.push(child);
                            }
                        }
                        return arr;
                    },

                    // Parents ------
                    _getParents = function(context) {
                        var idx = 0,
                            length = context.length,
                            result = [];
                        for (; idx < length; idx++) {
                            var parents = _crawlUpNode(context[idx]);
                            result.push(parents);
                        }
                        return _.flatten(result);
                    },

                    _crawlUpNode = function(node) {
                        var result = [],
                            parent = node;
                        while ((parent = _getNodeParent(parent))) {
                            result.push(parent);
                        }

                        return result;
                    },

                    // Parent ------
                    _getParent = function(context) {
                        var idx = 0,
                            length = context.length,
                            result = [];
                        for (; idx < length; idx++) {
                            var parent = _getNodeParent(context[idx]);
                            if (parent) { result.push(parent); }
                        }
                        return result;
                    },

                    // Safely get parent node
                    _getNodeParent = function(node) {
                        return node && node.parentNode;
                    },

                    _getIndex = function(d) {
                        return d.__idx || 0;
                    };

                module.exports = {
                    fn: {
                        // TODO: Filter by selector
                        closest: function(selector) {

                        },

                        siblings: function(selector) {
                            return D(
                                _selectors.filter(_getSiblings(this), selector)
                            );
                        },

                        parents: function(selector) {
                            return D(
                                _selectors.filter(_getParents(this), selector)
                            );
                        },

                        parent: function(selector) {
                            return D(
                                _selectors.filter(_getParent(this), selector)
                            );
                        },

                        children: function(selector) {
                            return D(
                                _selectors.filter(_getChildren(this), selector)
                            );
                        },

                        // TODO: next
                        next: function(str) {
                            if (_.isString(str)) {
                                // TODO:
                            }

                            return; // TODO:
                        },

                        // TODO: prev
                        prev: function(str) {
                            if (_.isString(str)) {
                                // TODO:
                            }

                            return; // TODO:
                        }
                    }
                };
            },
            "18": function(require, module, exports) {
                var _ = require('2'),
                    _css = require('16');

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
                    },

                    _getInnerWidth = function(elem) {
                        var width = _css.width.get(elem),
                            style = _css.getComputedStyle(elem);

                        return width + _.parseInt(style.paddingLeft) + _.parseInt(style.paddingRight);
                    },
                    _getInnerHeight = function(elem) {
                        var height = _css.height.get(elem),
                            style = _css.getComputedStyle(elem);

                        return height + _.parseInt(style.paddingTop) + _.parseInt(style.paddingBottom);
                    },

                    _getOuterWidth = function(elem, withMargin) {
                        var width = _getInnerWidth(elem),
                            style = _css.getComputedStyle(elem);

                        if (withMargin) {
                            width += _.parseInt(style.marginLeft) + _.parseInt(style.marginRight);
                        }

                        return width + _.parseInt(style.borderLeftWidth) + _.parseInt(style.borderRightWidth);
                    },
                    _getOuterHeight = function(elem, withMargin) {
                        var height = _getInnerHeight(elem),
                            style = _css.getComputedStyle(elem);

                        if (withMargin) {
                            height += _.parseInt(style.marginTop) + _.parseInt(style.marginBottom);
                        }

                        return height + _.parseInt(style.borderTopWidth) + _.parseInt(style.borderBottomWidth);
                    };

                module.exports = {
                    fn: {
                        width: Overload().args(Number).use(function(val) {
                                    var elem = this[0]; // The first elem
                                    if (!elem) { return this; }

                                    _css.width.set(elem, val);
                                    return this;
                                })
                                .fallback(function() {
                                    var elem = this[0]; // The first elem
                                    if (!elem) { return null; }

                                    return _css.width.get(elem);
                                })
                                .expose(),

                        height: Overload().args(Number).use(function(val) {
                                    var elem = this[0]; // The first elem
                                    if (!elem) { return this; }

                                    _css.height.set(elem, val);
                                    return this;
                                })
                                .fallback(function() {
                                    var elem = this[0]; // The first elem
                                    if (!elem) { return null; }

                                    return _css.height.get(elem);
                                })
                                .expose(),

                        innerWidth: function() {
                            var elem = this[0];
                            if (!elem) { return this; }

                            return _getInnerWidth(elem);
                        },

                        innerHeight: function() {
                            var elem = this[0];
                            if (!elem) { return this; }

                            return _getInnerHeight(elem);
                        },

                        outerWidth: function(withMargin) {
                            var elem = this[0];
                            if (!elem) { return this; }

                            return _getOuterWidth(elem, withMargin);
                        },
                        outerHeight: function(withMargin) {
                            var elem = this[0];
                            if (!elem) { return this; }

                            return _getOuterHeight(elem, withMargin);
                        }
                    }
                };
            },
            "16": function(require, module, exports) {
                var _ = require('2'),
                    _cache = require('3'),
                    _regex = require('6'),
                    _nodeType = require('5'),
                    _supports = require('7');

                var _swapSettings = {
                    measureDisplay: {
                        display: 'block',
                        position: 'absolute',
                        visibility: 'hidden'
                    }
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
                        return _supports.currentStyle ?
                            function(elem) { return elem.currentStyle; } :
                                // Avoids an 'Illegal Invocation' error
                                function(elem) { return window.getComputedStyle(elem); };
                    }()),

                    _width = {
                         get: function(elem) {
                            if (_.isWindow(elem)) {
                                return elem.document.documentElement.clientWidth;
                            }

                            if (elem.nodeType === _nodeType.DOCUMENT) {
                                return _getDocumentDimension(elem, 'Width');
                            }

                            var width = elem.offsetWidth;
                            return (width === 0 &&
                                    _regex.display.isNoneOrTable(_getComputedStyle(elem).display)) ?
                                        _cssSwap(elem, _swapSettings.measureDisplay, function() { return elem.offsetWidth; }) :
                                            _getWidthOrHeight(elem, 'width'); // TODO: Eeewwww
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

                            if (elem.nodeType === _nodeType.DOCUMENT) {
                                return _getDocumentDimension(elem, 'Height');
                            }

                            var height = elem.offsetHeight;
                            return (height === 0 &&
                                    _regex.display.isNoneOrTable(_getComputedStyle(elem).display)) ?
                                        _cssSwap(elem, _swapSettings.measureDisplay, function() { return elem.offsetHeight; }) :
                                            _getWidthOrHeight(elem, 'height');
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
                        val = _curCSS(elem, name, styles);
                        if (val < 0 || !val) { val = elem.style[name]; }

                        // Computed unit is not pixels. Stop here and return.
                        if (rnumnonpx.test(val)) {
                            return val;
                        }

                        // we need the check for style in case a browser which returns unreliable values
                        // for getComputedStyle silently falls back to the reliable elem.style
                        valueIsBorderBox = isBorderBox && val === styles[name];

                        // Normalize '', auto, and prepare for extra
                        val = parseFloat( val ) || 0;
                    }

                    // use the active box-sizing model to add/subtract irrelevant styles
                    return (val +
                        _augmentWidthOrHeight(
                            elem,
                            name,
                            isBorderBox ? 'border' : 'content',
                            valueIsBorderBox,
                            styles
                        )
                    ) + 'px';
                };

                var _augmentWidthOrHeight = function(elem, name, extra, isBorderBox, styles) {
                    var i = isBorderBox ?
                        // If we already have the right measurement, avoid augmentation
                        4 :
                        // Otherwise initialize for horizontal or vertical properties
                        name === 'width' ? 1 : 0,

                        val = 0;

                    for (; i < 4; i += 2) {
                        // both box models exclude margin, so add it if we want it
                        if ( extra === 'margin' ) {
                            val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
                        }

                        if (isBorderBox) {
                            // border-box includes padding, so remove it if we want content
                            if ( extra === 'content' ) {
                                val -= jQuery.css( elem, 'padding' + cssExpand[ i ], true, styles );
                            }

                            // at this point, extra isn't border nor margin, so remove border
                            if ( extra !== 'margin' ) {
                                val -= jQuery.css( elem, 'border' + cssExpand[ i ] + 'Width', true, styles );
                            }
                        } else {
                            // at this point, extra isn't content, so add padding
                            val += jQuery.css( elem, 'padding' + cssExpand[ i ], true, styles );

                            // at this point, extra isn't content nor padding, so add border
                            if ( extra !== 'padding' ) {
                                val += jQuery.css( elem, 'border' + cssExpand[ i ] + 'Width', true, styles );
                            }
                        }
                    }

                    return val;
                };

                var _curCSS = function(elem, name, computed) {
                    var style = elem.style,
                        styles = computed || _getComputedStyle(elem),
                        ret = styles ? styles[name] : undefined;

                    // Avoid setting ret to empty string here
                    // so we don't default to auto
                    if (!_.exists(ret) && style && style[name]) { ret = style[name]; }

                    // From the awesome hack by Dean Edwards
                    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

                    // If we're not dealing with a regular pixel number
                    // but a number that has a weird ending, we need to convert it to pixels
                    // but not position css attributes, as those are proportional to the parent element instead
                    // and we can't measure the parent instead because it might trigger a 'stacking dolls' problem
                    if (rnumnonpx.test( ret ) && !rposition.test( name )) {

                        // Remember the original values
                        var left = style.left,
                            rs = elem.runtimeStyle,
                            rsLeft = rs && rs.left;

                        // Put in the new values to get a computed value out
                        if (rsLeft) { rs.left = elem.currentStyle.left; }

                        style.left = (name === 'fontSize') ? '1em' : ret;
                        ret = style.pixelLeft + 'px';

                        // Revert the changed values
                        style.left = left;
                        if (rsLeft) { rs.left = rsLeft; }
                    }

                    // Support: IE
                    // IE returns zIndex value as an integer.
                    return ret === undefined ? ret : ret + '' || 'auto';
                };

                var _hooks = {
                    opacity: _supports.opacity ? {} : {
                        get: function(elem) {
                            // IE uses filters for opacity
                            var style = _supports.currentStyle ? elem.currentStyle.filter : elem.style.filter;
                            return _regex.opacity.test(style || '') ?
                                        (0.01 * parseFloat(RegExp.$1)) + '' :
                                            '1';
                        },

                        set: function(elem, value) {
                            var style = elem.style,
                                currentStyle = elem.currentStyle,
                                filter = currentStyle && currentStyle.filter || style.filter || '';

                            // if setting opacity to 1, and no other filters exist - remove the filter attribute
                            if (value >= 1 || value === '' && _.trim(filter.replace(_regex.alpha, '')) === '') {

                                // Setting style.filter to null, '' & ' ' still leave 'filter:' in the cssText
                                // if 'filter:' is present at all, clearType is disabled, we want to avoid this
                                // style.removeAttribute is IE Only, but so apparently is this code path...
                                style.removeAttribute('filter');

                                // if there is no filter style applied in a css rule or unset inline opacity, we are done
                                if (value === '' || _supports.currentStyle && !currentStyle.filter) { return; }
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
                    return _cache.csskey.get(name) || _cache.csskey.set(name, _regex.camelCase(name));
                };

                var _setStyle = function(elem, name, value) {
                    name = _normalizeCssKey(name);

                    if (_hooks[name] && _hooks[name].set) {
                        return _hooks[name].set(elem, value);
                    }

                    elem.style[name] = value;
                };

                var _getStyle = function(elem, name) {
                    name = _normalizeCssKey(name);

                    if (_hooks[name] && _hooks[name].get) {
                        return _hooks[name].get(elem);
                    }

                    return _getComputedStyle(elem)[name];
                };

                module.exports = {
                    swap: _cssSwap,
                    swapSetting: _swapSettings,
                    getComputedStyle: _getComputedStyle,

                    width: _width,
                    height: _width,

                    fn: {
                        css: Overload().args(String, O.any(String, Number)).use(function(name, value) {
                                            var idx = 0, length = this.length;
                                            for (; idx < length; idx++) {
                                                _setStyle(this[idx], name, value);
                                            }
                                            return this;
                                        })

                                        .args(Object).use(function(obj) {
                                            var idx = 0, length = this.length,
                                                key;
                                            for (; idx < length; idx++) {
                                                for (key in obj) {
                                                    _setStyle(this[idx], key, obj[key]);
                                                }
                                            }
                                            return this;
                                        })

                                        .args(Array).use(function(arr) {
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
                            var idx = 0, length = this.length;
                            for (; idx < length; idx++) {
                                _hide(this[idx]);
                            }
                            return this;
                        },
                        show: function() {
                            var idx = 0, length = this.length;
                            for (; idx < length; idx++) {
                                _show(this[idx]);
                            }
                            return this;
                        },

                        // TODO: Toggle
                        toggle: function() {

                        }
                    }
                };
            },
            "21": function(require, module, exports) {
                var _ = require('2'),
                    utils = require('8');

                /*
                var _empty = function(elem) {
                        var child;
                        while ((child = elem.firstChild)) {
                            elem.removeChild(child);
                        }
                    },

                    _clone = function(elem) {
                        return elem.cloneNode(true);
                    };
                */

                var _clone = function(elem) {
                        return elem.cloneNode(true);
                    },

                    _stringToFrag = function(str) {
                        var frag = document.createDocumentFragment();
                        frag.textContent = str;
                        return frag;
                    },

                    _appendFunc = function(d, fn) {
                        var idx = 0, length = d.length,
                            elem, result;
                        for (; idx < length; idx++) {
                            elem = d[idx];
                            result = fn.call(elem, idx, elem.innerHTML);

                            if (!_.exists(result)) {

                                // do nothing

                            } else if (_.isString(result)) {

                                if (utils.isHTML(value)) {
                                    _appendArrToElem(elem, parser.parseHtml(value));
                                    return this;
                                }

                                _appendElem(elem, _stringToFrag(result));

                            } else if (_.isElement(result)) {

                                _appendElem(elem, result);

                            } else if (_.isNodeList(result) || result instanceof D) {

                                _appendArrToElem(elem, result);

                            } else {
                                // do nothing
                            }
                        }

                    },

                    _appendMergeArr = function(arrOne, arrTwo) {
                        var idx = 0, length = arrOne.length;
                        for (; idx < length; idx++) {
                            var i = 0, len = arrTwo.length;
                            for (; i < len; i++) {
                                _appendElem(arrOne[idx], arrTwo[i]);
                            }
                        }
                    },

                    _appendElemToArr = function(arr, elem) {
                        var idx = 0, length = arr.length;
                        for (; idx < length; idx++) {
                            _appendElem(arr[idx], elem);
                        }
                    },

                    _appendArrToElem = function(elem, arr) {
                        var idx = 0, length = arr.length;
                        for (; idx < length; idx++) {
                            _appendElem(elem, arr[idx]);
                        }
                    },

                    _appendElem = function(base, elem) {
                        if (!base || !elem || !_.isElement(elem)) { return; }
                        base.appendChild(elem);
                    };

                module.exports = {
                    fn: {
                        empty: function() {
                            var idx = 0, length = this.length;
                            for (; idx < length; idx++) {
                                _empty(this[idx]);
                            }
                            return this;
                        },

                        // TODO: should this follow jQuery API?
                        // http://api.jquery.com/clone/
                        // .clone( [withDataAndEvents ] [, deepWithDataAndEvents ] )
                        clone: function() {
                            return _.fastmap(this.slice(), function(elem) {
                                return _clone(elem);
                            });
                        },

                        append: Overload().args(String).use(function(value) {
                                            if (utils.isHtml(value)) {
                                                _appendMergeArr(this, parser.parseHtml(value));
                                                return this;
                                            }

                                            _appendElemToArr(this, _stringToFrag(value));

                                            return this;
                                        })

                                        .args(Number).use(function(value) {
                                            value = '' + value; // change to a string
                                            _appendString(this, value);
                                            return this;
                                        })

                                        .args(Array).use(function(arr) {
                                            // TODO: Array
                                            return this;
                                        })

                                        .args(Function).use(function(fn) {
                                            _appendFunc(this, fn);
                                            return this;
                                        })

                                        .fallback(function(elementOrD) {
                                            if (_.isElement(elementOrD)) {
                                                var elem = elementOrD;
                                                _appendElemToArr(this, elem);
                                            }

                                            if (_.isNodeList(elementOrD) || elementOrD instanceof D) {
                                                var otherArr = elementOrD;
                                                _appendMergeArr(this, otherArr);
                                            }

                                            return this;
                                        })

                                        .expose(),

                        appendTo: function(thing) {
                            thing = (thing instanceof D) ? thing : D(thing);
                            thing.append(this);
                            return this;
                        },

                        // TODO: prepend
                        prepend: function() {

                        },

                        prependTo: function(thing) {
                            thing = (thing instanceof D) ? thing : D(thing);
                            thing.prepend(this);
                            return this;
                        },
                    }
                };
            },
            "14": function(require, module, exports) {
                var _ = require('2');

                var _hooks = {
                        tabindex: {
                            get: function(elem) {
                                var tabindex = elem.getAttribute('tabindex');
                                if (!_.exists(tabindex) || tabindex === '') { return; }
                                return _.parseInt(tabindex) || 0;
                            }
                        }
                    },

                    _getAttribute = function(elem, attr) {
                        if (!elem) { return; }

                        if (_hooks[attr] && _hooks[attr].get) {
                            return _hooks[attr].get(elem);
                        }

                        return elem.getAttribute(attr);
                    },

                    _setAttributes = function(arr, attr, value) {
                        var isFn = _.isFunction(value),
                            idx = 0, length = arr.length,
                            elem, val;
                        for (; idx < length; idx++) {
                            elem = arr[idx];
                            val = isFn ? value.call(elem, idx, _getAttribute(elem, attr)) : value;
                            _setAttribute(elem, attr, val);
                        }
                    },
                    _setAttribute = function(elem, attr, value) {
                        if (!elem) { return; }

                        if (_hooks[attr] && _hooks[attr].set) {
                            return _hooks[attr].set(elem, value);
                        }

                        elem.setAttribute(attr, value);
                    },

                    _removeAttributes = function(arr, attr) {
                        var idx = 0, length = arr.length;
                        for (; idx < length; idx++) {
                            _removeAttribute(arr[idx], attr);
                        }
                    },
                    _removeAttribute = function(elem, attr) {
                        if (!elem) { return; }

                        if (_hooks[attr] && _hooks[attr].remove) {
                            return _hooks[attr].remove(elem);
                        }

                        elem.removeAttribute(attr);
                    };

                module.exports = {
                    fn: {
                        attr: Overload().args(String).use(function(attr) {
                                        return _getAttribute(this[0], attr);
                                    })

                                    .args(String, O.any(String, Number))
                                    .use(function(attr, value) {
                                        _setAttributes(this, attr, value);
                                        return this;
                                    })

                                    .args(String, null)
                                    .use(function(attr) {
                                        _removeAttributes(this, attr);
                                        return this;
                                    })

                                    .args(String, Boolean)
                                    .use(function(attr, bool) {
                                        if (bool) {
                                            _setAttributes(this, attr, bool);
                                            return this;
                                        }

                                        _removeAttributes(this, attr);
                                        return this;
                                    })

                                    .args(Object).use(function(attrs) {
                                        var attr, value;
                                        for (attr in attrs) {
                                            _setAttributes(this, attr, attrs[attr]);
                                        }

                                        return this;
                                    })

                                    .args(String, Function)
                                    .use(function(attr, fn) {
                                        var idx = 0, length = this.length;
                                        for (; idx < length; idx++) {
                                            var elem = this[idx],
                                                oldAttr = _getAttribute(this[0], attr),
                                                result = fn.call(elem, idx, oldAttr);
                                            if (!_.exists(result)) { continue; }
                                            _setAttribute(elem, attr, result);
                                        }

                                        return this;
                                    })

                                    .expose(),

                        removeAttr: Overload().args(String).use(function(attr) {
                                        _removeAttributes(this, attr);
                                        return this;
                                    })

                                    .expose()
                    }
                };
            },
            "28": function(require, module, exports) {
                var _getText = function(elem) {
                    if (!elem) { return ''; }
                    return elem.textContent || elem.innerText;
                };

                module.exports = {
                    fn: {
                        html: function() {},
                        val: function() {},
                        text: function() {
                            var str = '',
                                idx = 0, length = this.length;
                            for (; idx < length; idx++) {
                                str += _getText(this[idx]);
                            }

                            return str;
                        }
                    }
                };
            },
            "15": function(require, module, exports) {
                var supports = require('7'),
                    array = require('13');

                var _rspace = /\s+/g;

                var _classArrayCache = {};
                var _classMapCache = {};

                var _isEmpty = function(str) { return str === null || str === undefined || str === ''; };
                var _isNotEmpty = function(str) { return str !== null && str !== undefined && str !== ''; };

                var _splitImpl = function(name) {
                    if (_isEmpty(name)) { return []; }
                    var split = name.split(_rspace),
                        len = split.length,
                        idx = split.length,
                        names = [],
                        nameSet = {},
                        curName;
                    while (idx--) {
                        curName = split[len - (idx + 1)];
                        if (nameSet[curName]) { continue; }  // unique
                        if (_isEmpty(curName)) { continue; } // non-empty
                        names.push(curName);
                        nameSet[curName] = true;
                    }
                    return names;
                };

                var _split = function(name) {
                    if (_.isArray(name)) { return name; }
                    return _classArrayCache[name] || (_classArrayCache[name] = _splitImpl(name));
                };

                var _modern = {
                    getClasses: function(elem) {
                        return array.slice(elem.classList);
                    },

                    hasClass: function(elem, name) {
                        return elem.classList.contains(name);
                    },

                    addClasses: function(elem, names) {
                        elem.classList.add.apply(elem.classList, names);
                    },

                    removeClasses: function(elem, names) {
                        elem.classList.remove.apply(elem.classList, names);
                    },

                    toggleClasses: function(elem, names) {
                        elem.classList.toggle.apply(elem.classList, names);
                    }
                };

                var _legacy = {
                    getClasses: function(elem) {
                        return _split(elem.className);
                    },

                    hasClass: function(elem, name) {
                        var elemClassNames = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
                            idx = elemClassNames.length;
                        while (idx--) {
                            if (elemClassNames[idx] === name) { return true; }
                        }
                        return false;
                    },

                    addClasses: function(elem, names) {
                        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
                            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
                            nameIdx = elemClassNameArray.length,
                            name,
                            append = '';

                        while (nameIdx--) {
                            name = names[nameIdx];

                            // Element already has this class name
                            if (elemClassNameMap[name] !== undefined) { continue; }

                            append += ' ' + name;
                        }

                        // Add all the class names in a single step
                        elem.className += append;
                    },

                    removeClasses: function(elem, names) {
                        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
                            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
                            nameIdx = elemClassNameArray.length,
                            name,
                            newClasses = array.slice(elemClassNameArray);

                        while (nameIdx--) {
                            name = names[nameIdx];

                            // Element has this class name
                            if (elemClassNameMap[name] !== undefined) {
                                newClasses.splice(nameIdx, 1);
                                elem.className = newClasses.join(' ');
                                return;
                            }
                        }
                    },

                    toggleClasses: function(elem, names) {
                        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
                            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
                            nameIdx = elemClassNameArray.length,
                            name,
                            addClasses = [],
                            addClassSet = {},
                            removeClasses = [],
                            removeClassSet = {};

                        while (nameIdx--) {
                            name = names[nameIdx];

                            // Element has this class name
                            if (elemClassNameMap[name] !== undefined) {
                                // Already added to the list
                                if (addClassSet[name]) { continue; }
                                addClasses.push(name);
                                addClassSet[name] = true;
                            } else {
                                // Already added to the list
                                if (removeClassSet[name]) { continue; }
                                removeClasses.push(name);
                                removeClassSet[name] = true;
                            }
                        }

                        if (addClasses.length) {
                            this.addClasses(elem, addClasses);
                        }
                        if (removeClasses.length) {
                            this.removeClasses(elem, removeClasses);
                        }
                    }
                };

                var _impl = supports.classList ? _modern : _legacy;

                var _classes = {
                    getClasses: function(elems) {
                        var names = [],
                            nameSet = {},
                            elemIdx = elems.length,
                            curNames,
                            curNameIdx,
                            curName;
                        while (elemIdx--) {
                            curNames = _impl.getClasses(elems[elemIdx]);
                            curNameIdx = curNames.length;
                            while (curNameIdx--) {
                                curName = curNames[curNameIdx];
                                if (nameSet[curName]) { continue; }
                                names.push(curName);
                                nameSet[curName] = true;
                            }
                        }
                    },

                    hasAllClasses: function(elems, names) {
                        var numElems = elems.length,
                            numNames = names.length,
                            elemIdx = numElems,
                            nameIdx,
                            elem,
                            name;

                        while (elemIdx--) {
                            elem = elems[elemIdx];

                            nameIdx = numNames;
                            while (nameIdx--) {
                                name = names[nameIdx];

                                if (!_impl.hasClass(elem, name)) { return false; }
                            }
                        }

                        return true;
                    },

                    addClasses: function(elems, names) {
                        // Support array-like objects
                        if (!_.isArray(names)) { names = array.slice(names); }
                        var elemIdx = elems.length;
                        while (elemIdx--) {
                            _impl.addClasses(elems[elemIdx], names);
                        }
                    },

                    removeClasses: function(elems, names) {
                        // Support array-like objects
                        if (!_.isArray(names)) { names = array.slice(names); }
                        var elemIdx = elems.length;
                        while (elemIdx--) {
                            _impl.removeClasses(elems[elemIdx], names);
                        }
                    },

                    removeAllClasses: function(elems) {
                        var elemIdx = elems.length;
                        while (elemIdx--) {
                            elems[elemIdx].className = '';
                        }
                    },

                    toggleClasses: function(elems, names) {
                        // Support array-like objects
                        if (!_.isArray(names)) { names = array.slice(names); }
                        var elemIdx = elems.length;
                        while (elemIdx--) {
                            _impl.toggleClasses(elems[elemIdx], names);
                        }
                    }
                };

                module.exports = _.extend({}, _classes, {
                    fn: {
                        hasClass: Overload()
                            .args(String).use(function(name) {
                                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                                var names = _split(name);
                                if (!names.length) { return this; }

                                return _classes.hasAllClasses(this, names);
                            })
                            .expose(),

                        addClass: Overload()
                            .args(String).use(function(name) {
                                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                                var names = _split(name);
                                if (!names.length) { return this; }

                                _classes.addClasses(this, names);

                                return this;
                            })
                //            .args(Array).use(function(names) {
                            .length(1).use(function(names) {
                                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                                _classes.addClasses(this, names);

                                return this;
                            })
                            .expose(),

                        removeClass: Overload()
                            .args().use(function() {
                                if (!this.length) { return this; }

                                _classes.removeAllClasses(this);

                                return this;
                            })
                            .args(String).use(function(name) {
                                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                                var names = _split(name);
                                if (!names.length) { return this; }

                                _classes.removeClasses(this, names);

                                return this;
                            })
                //            .args(Array).use(function(names) {
                            .length(1).use(function(names) {
                                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                                _classes.removeClasses(this, names);

                                return this;
                            })
                            .expose(),

                        toggleClass: Overload()
                            .args(String).use(function(name) {
                                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                                var names = _split(name);
                                if (!names.length) { return this; }

                                _classes.toggleClasses(this, names);

                                return this;
                            })
                            .args(String, Boolean).use(function(name, shouldAdd) {
                                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                                var names = _split(name);
                                if (!names.length) { return this; }

                                if (shouldAdd) {
                                    _classes.addClasses(this, names);
                                } else {
                                    _classes.removeClasses(this, names);
                                }

                                return this;
                            })
                //            .args(Array).use(function(names) {
                            .length(1).use(function(names) {
                                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                                _classes.toggleClasses(this, names);

                                return this;
                            })
                            .length(2).use(function(names, shouldAdd) {
                                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                                if (shouldAdd) {
                                    _classes.addClasses(this, names);
                                } else {
                                    _classes.removeClasses(this, names);
                                }

                                return this;
                            })
                            .expose()
                    }
                });
            }
        }
    ));
}());
