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
            "main": "/D.js",
            "aliases": {
                "_": "/_.js",
                "overload": "/libs/Overload.js",
                "signal": "/libs/Signal.js"
            }
        },
        {
            "/D.js": function(require, module, exports) {
                var _ = require('_'),
                    parser = require('/D/parser.js'),
                    utils = require('/utils.js'),
                    array = require('/modules/array.js'),
                    onready = require('/modules/onready.js'),
                    selectors = require('/modules/selectors.js'),
                    transversal = require('/modules/transversal.js'),
                    dimensions = require('/modules/dimensions.js'),
                    manip = require('/modules/manip.js'),
                    css = require('/modules/css.js'),
                    attr = require('/modules/attr.js'),
                    prop = require('/modules/prop.js'),
                    val = require('/modules/val.js'),
                    classes = require('/modules/classes.js');

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
                    prop.fn,
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
            "/D/parser.js": function(require, module, exports) {
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
            "/utils.js": function(require, module, exports) {
                var _ = require('_'),

                    _BEGINNING_NEW_LINES = /^[\n]*/;

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
            "/modules/array.js": function(require, module, exports) {
                var _ = require('_'),
                    _utils = require('/utils.js');

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
            "/modules/onready.js": function(require, module, exports) {
                var _isReady = false,
                    _registration = [];

                var _bind = function(fn) {
                    if (document.readyState === 'complete') {
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
            "/modules/selectors.js": function(require, module, exports) {
                var _ = require('_'),
                    _utils = require('/utils.js'),
                    _cache = require('/cache.js'),
                    _regex = require('/regex.js'),
                    _array = require('/modules/array.js'),
                    _nodeType = require('/nodeType.js'),
                    _supports = require('/supports.js'),

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
                                .args(O.any(null, undefined, Number, Object)).use(function() {
                                    return false;
                                })

                                .args(String).use(function(selector) {
                                    if (selector === '') { return false; }

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
            "/cache.js": function(require, module, exports) {
                var _ = require('_');

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
                            'typeTestFocusable',
                            'typeTestClickable',
                            'selectorTestId',
                            'selectorTestTag',
                            'selectorTestClass',
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
            "/regex.js": function(require, module, exports) {
                var _cache = require('/cache.js');

                    // Matches "-ms-" so that it can be changed to "ms-"
                var _TRUNCATE_MS_PREFIX = /^-ms-/,

                    // Matches dashed string for camelizing
                    _DASH_CATCH = /-([\da-z])/gi,

                    // Matches "none" or a table type e.g. "table",
                    // "table-cell" etc...
                    _NONE_OR_TABLE = /^(none|table(?!-c[ea]).+)/,

                    _TYPE_TEST = {
                        focusable: /^(?:input|select|textarea|button|object)$/i,
                        clickable: /^(?:a|area)$/i
                    },

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

                    type: {
                        isFocusable: function(str) {
                            _cache.typeTestFocusable.getOrSet(str, function() {
                                var result = _TYPE_TEST.focusable.exec(str);
                                return !!result;
                            });
                        },
                        isClickable: function(str) {
                            _cache.typeTestClickable.getOrSet(str, function() {
                                var result = _TYPE_TEST.clickable.exec(str);
                                return !!result;
                            });
                        }
                    },

                    selector: {
                        isStrictId: function(str) {
                            return _cache.selectorTestId.getOrSet(str, function() {
                                var result = _SELECTOR_TEST.id.exec(str);
                                return result ? !result[1] : false;
                            });
                        },
                        isTag: function(str) {
                            return _cache.selectorTestTag.getOrSet(str, function() {
                                var result = _SELECTOR_TEST.tag.exec(str);
                                return result ? !result[1] : false;
                            });
                        },
                        isClass: function(str) {
                            return _cache.selectorTestClass.getOrSet(str, function() {
                                var result = _SELECTOR_TEST.klass.exec(str);
                                return result ? !result[1] : false;
                            });
                        }
                    }
                };
            },
            "/nodeType.js": function(require, module, exports) {
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
            "/supports.js": function(require, module, exports) {
                var div = require('/div.js'),
                    a = div.getElementsByTagName('a')[0];

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
                    opacity: (/^0.55$/).test(div.style.opacity),

                    // Make sure that URLs aren't manipulated
                    // (IE normalizes it by default)
                    hrefNormalized: a.getAttribute('href') === '/a'
                };
            },
            "/div.js": function(require, module, exports) {
                var div = document.createElement('div');
                div.cssText = 'opacity:.55';
                div.innerHTML = '<a href="/a">a</a><input type="checkbox"/>';
                module.exports = div;
            },
            "/modules/transversal.js": function(require, module, exports) {
                var _ = require('_'),
                    _nodeType = require('/nodeType.js'),

                    _array = require('/modules/array.js'),
                    _selectors = require('/modules/selectors.js');

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
            "/modules/dimensions.js": function(require, module, exports) {
                var _ = require('_'),
                    _css = require('/modules/css.js');

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
            "/modules/css.js": function(require, module, exports) {
                var _ = require('_'),
                    _cache = require('/cache.js'),
                    _regex = require('/regex.js'),
                    _nodeType = require('/nodeType.js'),
                    _supports = require('/supports.js');

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
            "/modules/manip.js": function(require, module, exports) {
                var _ = require('_'),
                    utils = require('/utils.js');

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
            "/modules/attr.js": function(require, module, exports) {
                var _ = require('_');

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
            "/modules/prop.js": function(require, module, exports) {
                var _ = require('_'),
                    _supports = require('/supports.js'),
                    _nodeType = require('/nodeType.js');

                var _propFix = {
                    'for': 'htmlFor',
                    'class': 'className'
                };

                var _propHooks = {
                    src: (_supports.hrefNormalized) ? {} : {
                        get: function(elem) {
                            return elem.getAttribute('src', 4);
                        }
                    },

                    href: (_supports.hrefNormalized) ? {} : {
                        get: function(elem) {
                            return elem.getAttribute('href', 4);
                        }
                    },

                    // Support: Safari, IE9+
                    // mis-reports the default selected property of an option
                    // Accessing the parent's selectedIndex property fixes it
                    selected: (_supports.optSelected) ? {} : {
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
                    if (!elem || nodeType === _nodeType.TEXT || nodeType === _nodeType.COMMENT || nodeType === _nodeType.ATTRIBUTE) {
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
                        prop: Overload().args(String).use(function(prop) {
                                var first = this[0];
                                if (!first) { return; }

                                return _getOrSetProp(prop);
                            })

                            .args(String, O.any(String, Number, Boolean)).use(function(prop, value) {
                                var idx = 0, length = this.length;
                                for (; idx < length; idx++) {
                                    _getOrSetProp(this[idx], prop, value);
                                }
                                return this;
                            })

                            .args(String, Function).use(function(prop, fn) {
                                var idx = 0, length = this.length,
                                    elem, result;
                                for (; idx < length; idx++) {
                                    elem = this[idx];
                                    result = fn.call(elem, idx, _getOrSetProp(elem, prop));
                                    _getOrSetProp(elem, prop, result);
                                }
                                return this;
                            })

                            .expose(),

                        removeProp: Overload().args(String).use(function(prop) {
                                var name = _propFix[prop] || prop,
                                    idx = 0, length = this.length;
                                for (; idx < length; idx++) {
                                    delete this[idx][name];
                                }
                                return this;
                            })
                            .expose()
                    }
                };
            },
            "/modules/val.js": function(require, module, exports) {
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
            "/modules/classes.js": function(require, module, exports) {
                var _ = require('_'),
                    supports = require('/supports.js'),
                    array = require('/modules/array.js');

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
            },
            "/_.js": function(require, module, exports) {
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
            "/libs/Overload.js": function(require, module, exports) {
                (function(root, undefined) {

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
                			if (!root[globalObject].name) {
                				root[globalObject].name = globalObject;
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

                		/**
                		 * Type checks
                		 */
                		_checkMap = (function(map) {

                			var types = [
                					// Only mapping items that need to be mapped.
                					// Items not in this list are doing faster
                					// (non-string) checks
                					//
                					// k = key, v = value
                					{ k: sDate,     v: _types[sDate]     },
                					{ k: sNumber,   v: _types[sNumber]   },
                					{ k: sString,   v: _types[sString]   },
                					{ k: sObject,   v: _types[sObject]   },
                					{ k: sArray,    v: _types[sArray]    },
                					{ k: sRegExp,   v: _types[sRegExp]   },
                					{ k: sFunction, v: _types[sFunction] }
                				],
                				idx = types.length;
                			while (idx--) {
                				map['[object ' + types[idx].k + ']'] = types[idx].v;
                			}

                			return map;

                		}({})),

                		/**
                		 * Changes arguments to an array
                		 * @param  {Arguments} arraylike
                		 * @return {Array}
                		 */
                		_slice = (function(slice) {
                			return function(arraylike) {
                				return slice.call(arraylike);
                			};
                		}([].slice));

                	// Reference: https://gist.github.com/dhm116/1790197
                	if (!('bind' in Function.prototype)) {
                		Function.prototype.bind = function(owner) {
                			var self = this;

                			if (arguments.length <= 1) {
                				return function() {
                					return self.apply(owner, arguments);
                				};
                			}

                			var args = _slice(arguments);
                			return function() {
                				return self.apply(owner, arguments.length === 0 ? args : args.concat(_slice(arguments)));
                			};
                		};
                	}

                	var _getConfigurationType = function(val) {
                		if (val === null) { return _types[sNull]; }
                		if (val === undefined) { return _types[sUndefined]; }

                		// we have something, but don't know what
                		if (val.name === undefined) {
                			if (val !== +val) { return _types[sNaN]; } // NaN check
                			return _types[sInfinity]; // Infinity check
                		}

                		return _types[val.name];
                	};

                	var _getParameterType = function(val) {
                		if (val === null) { return _types[sNull]; }
                		if (val === undefined) { return _types[sUndefined]; }
                		if (val === true || val === false) { return _types[sBoolean]; }
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

                		if (mapLength === 0 && argLength === 0) { return true; }
                		if (mapLength !== argLength) { return false; }

                		var idx = 0,
                			mapItem;
                		for (; idx < argLength; idx++) {
                			mapItem = map[idx];

                			if (mapItem instanceof Custom) {
                				if (mapItem.check(args[idx])) {
                					continue;
                				} else {
                					return false;
                				}
                			}

                			if (argTypes[idx] !== mapItem) {
                				return false;
                			}
                		}

                		return true;
                	};

                	var _getArgumentMatch = function(mappings, args) {
                		mappings = mappings || [];

                		var argTypes = _convertParametersTypes(args),
                			idx = 0, length = mappings.length;
                		for (; idx < length; idx++) {
                			if (_doesMapMatchArgsTypes(mappings[idx].params, argTypes, args)) {
                				return mappings[idx];
                			}
                		}

                		return null;
                	};

                	var _getLengthMatch = function(mappings, args) {
                		mappings = mappings || [];

                		var argLength = args.length,
                			idx = 0, length = mappings.length;
                		for (; idx < length; idx++) {
                			if (mappings[idx].length === argLength) {
                				return mappings[idx];
                			}
                		}

                		return null;
                	};

                	var _matchAny = function(args, val) {
                		var type = _getParameterType(val),
                			idx = args.length,
                			mapItem;

                		while (idx--) {
                			mapItem = args[idx];

                			if (mapItem instanceof Custom) {
                				if (mapItem.check(args[idx])) {
                					return true;
                				} else {
                					return false;
                				}
                			}

                			if (args[idx] === type) {
                				return true;
                			}
                		}

                		return false;
                	};

                	/**
                	 * Custom type that validates a value
                	 * @constructor
                	 * @param {Function} check
                	 */
                	var Custom = function(check) {
                		this.check = check;
                	};

                	var O = {
                		truthy: new Custom(function(val) {
                			return (!!val) === true;
                		}),
                		falsy: new Custom(function(val) {
                			return (!!val) === false;
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
                		}
                	};

                	/**
                	 * @constructor
                	 */
                	var Overload = function() {
                		if (!(this instanceof Overload)) { return new Overload(); }

                		/**
                		 * Methods mapped to argument types
                		 * Lazily instanciated
                		 * @type {Array}
                		 */
                		// this._argMaps;

                		/**
                		 * Methods mapped to argument lengths
                		 * Lazily instanciated
                		 * @type {Array}
                		 */
                		// this._lenMaps;

                		/**
                		 * A fallback function if none
                		 * of the criteria match on a call
                		 * @type {Function}
                		 */
                		// this._f;
                	};

                	Overload.defineType = function(name, check) {
                		var custom = new Custom(check);
                		return (O[name] = custom);
                	};

                	Overload.prototype = {

                		/** @constructor */
                		constructor: Overload,

                		args: function() {
                			var self = this,
                				args = arguments;

                			return {
                				use: function(method) {
                					var argMappings = self._argMaps || (self._argMaps = []);
                					argMappings.push({
                						params: _convertConfigurationTypes(args),
                						method: method
                					});
                					return self;
                				}
                			};
                		},

                		length: function(num) {
                			var self = this;
                			return {
                				use: function(method) {
                					var lengthMappings = self._lenMaps || (self._lenMaps = []);
                					lengthMappings.push({
                						length: (num === undefined) ? method.length : num,
                						method: method
                					});
                					return self;
                				}
                			};
                		},

                		err: function() {
                			throw 'Overload - exception: No methods matched';
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
                			return this._call(context, args);
                		},

                		bind: function(context) {
                			var self = this;
                			return function() {
                				return self._call(context, arguments);
                			}.bind(context);
                		},

                		expose: function() {
                			var self = this;
                			return function() {
                				return self._call(this, arguments);
                			};
                		},

                		_call: function(context, args) {
                			args = args || [];

                			// Any argument match, of course, already matches
                			// the length match, so this should be done first
                			var argMatch = _getArgumentMatch(this._argMaps, args);
                			if (argMatch) {
                				return argMatch.method.apply(context, args);
                			}

                			// Check for a length match
                			var lengthMatch = _getLengthMatch(this._lenMaps, args);
                			if (lengthMatch) {
                				return lengthMatch.method.apply(context, args);
                			}

                			// Check for a fallback
                			if (this._f) {
                				return this._f.apply(context, args);
                			}

                			// Error
                			return this.err(args);
                		}
                	};

                	root.Overload = Overload;
                	root.O = O;

                }(window));
            },
            "/libs/Signal.js": function(require, module, exports) {
                (function(root, undefined) {

                		/**
                		 * Quick reference to Array.prototype.splice
                		 * for duplicating arrays (while removing the
                		 * first parameter)
                		 * @type {Function}
                		 */
                	var _ripFirstArg = (function(splice) {
                			return function(arr) {
                				return splice.call(arr, 0, 1)[0];
                			};
                		}([].splice)),

                		/**
                		 * Object merger
                		 * @param {Objects}
                		 * @return {Object}
                		 */
                		_extend = function() {
                			var args = arguments,
                				base = args[0],
                				idx = 1, length = args.length,
                				key, merger;
                			for (; idx < length; idx += 1) {
                				merger = args[idx];

                				for (key in merger) {
                					base[key] = merger[key];
                				}
                			}
                		},

                		/**
                		 * Holds cached, parsed event keys by string
                		 * @type {Object}
                		 */
                		_cache = {},

                		/**
                		 * Unique Id
                		 * @type {Number}
                		 */
                		_id = 0,
                		_uniqueId = function() {
                			return _id++;
                		},

                		/**
                		 * Cached regex used to parse event string
                		 * @type {RegExp}
                		 */
                		_NAME_REGEX = /(?:([\w-]+):)?([\w-]*)(?:.([\w-]+))?/,
                		_parseConfig = function(eventname) {
                			var match = _NAME_REGEX.exec(eventname);
                			return {
                				// [0] : the entire match, don't care!
                				// [1] : handle
                				handle:    (match[1] === undefined) ? '' : match[1],
                				// [2] : event
                				evt:       (match[2] === undefined) ? '' : match[2],
                				// [3] : namespace
                				namespace: (match[3] === undefined) ? '' : match[3]
                			};
                		},

                		_reassignEvents = function(handle, active, inactive) {
                			inactive[handle] = inactive[handle] || {};
                			inactive[handle] = _extend({}, active[handle]);
                			delete active[handle];
                		},

                		_callEvents = function(events, args) {
                			args = args || [];

                			var idx = 0, length = events.length,
                				evt;
                			for (; idx < length; idx += 1) {
                				evt = events[idx];
                				if (!evt) { continue; }
                				if (evt.apply(null, args) === false) { return; }
                			}
                		},

                		_eventLookup = function(eventConfig, location) {
                			var handle    = location[eventConfig.handle] || (location[eventConfig.handle] = {}),
                				evt       = handle[eventConfig.evt]      || (handle[eventConfig.evt]      = {}),
                				namespace = evt[eventConfig.namespace]   || (evt[eventConfig.namespace]   = []);

                			return namespace;
                		};


                	var Signal = function() {
                		/**
                		 * Holds active events by handle + event + namespace
                		 * @type {Object}
                		 */
                		this._active = {};

                		/**
                		 * Holds inactive events by handle - lazy creation
                		 * @type {Object}
                		 */
                		// this._inactive;

                		/**
                		 * Holds subscriptions - lazy creation
                		 * @type {Object}
                		 */
                		// this._subs;
                	};

                	_extend(Signal, {

                		/**
                		 * Returns a new Signal instance
                		 * @return {Signal}
                		 */
                		construct: function() {
                			return new Signal();
                		},

                		/**
                		 * Klass extend method
                		 * @param  {Function} constructor
                		 * @param  {Object} extension   prototype extension
                		 * @return {Function} constructor
                		 */
                		extend: function(constructor, extension) {
                			var hasConstructor = (typeof constructor === 'function');
                			if (!hasConstructor) { extension = constructor; }

                			var self = this,
                				fn = function() {
                					var ret = self.apply(this, arguments);
                					if (hasConstructor) {
                						ret = constructor.apply(this, arguments);
                					}
                					return ret;
                				};

                			// Add properties to the object
                			_extend(fn, this);

                			// Duplicate the prototype
                			var NoOp = function() {};
                			NoOp.prototype = this.prototype;
                			fn.prototype = new NoOp();

                			// Merge the prototypes
                			_extend(fn.prototype, this.prototype, extension);
                			fn.prototype.constructor = constructor || fn;

                			return fn;
                		}
                	});

                	Signal.prototype = {

                		constructor: Signal,

                		subscribe: function(name, func) {
                			var subscriptions = this._subs || (this._subs = {});

                			var id = _uniqueId(),
                				location = subscriptions[name] || (subscriptions[name] = []);

                			func.__subid__ = id;
                			location.push(func);

                			return id;
                		},

                		unsubscribe: function(name, id) {
                			var subscriptions = this._subs || (this._subs = {});

                			var location = subscriptions[name];
                			if (!location) { return; }

                			var idx = 0, length = location.length;
                			for (; idx < length; idx += 1) {
                				if (location[idx].__subid__ === id) {
                					location.splice(idx, 1);
                					return true;
                				}
                			}

                			return false;
                		},

                		dispatch: function() {
                			var subscriptions = this._subs || (this._subs = {});

                			var args = arguments,
                				name = _ripFirstArg(args),
                				location = subscriptions[name] || (subscriptions[name] = []),
                				idx = 0, length = location.length,
                				func;
                			for (; idx < length; idx++) {
                				func = location[idx];
                				if (func) { func.apply(null, args); }
                			}
                		},

                		// Disable | Enable *************************************
                		disable: function(handle) {
                			var active = this._active,
                				inactive = this._inactive || (this._inactive = {});

                			_reassignEvents(handle, active, inactive);

                			return this;
                		},

                		enable: function(handle) {
                			var active = this._active,
                				inactive = this._inactive || (this._inactive = {});

                			_reassignEvents(handle, inactive, active);

                			return this;
                		},

                		// On | Off ************************************************
                		on: function(eventname, callback) {
                			var eventConfig = _cache[eventname] || (_cache[eventname] = _parseConfig(eventname));

                			_eventLookup(eventConfig, this._active).push(callback);

                			return this;
                		},
                		bind: function() { this.on.apply(this, arguments); },

                		off: function(eventname) {
                			var active = this._active,
                				eventConfig = _cache[eventname] || (_cache[eventname] = _parseConfig(eventname));

                			if (eventConfig.evt === '') { // Removing a namespace

                				var events = active[eventConfig.handle],
                					eventName,
                					namespaceName;
                				for (eventName in events) {
                					for (namespaceName in events[eventName]) {
                						if (namespaceName === eventConfig.namespace) {
                							active[eventConfig.handle][eventName][namespaceName].length = 0;
                						}
                					}
                				}

                			} else if (eventConfig.namespace !== '') { // Has a namespace

                				active[eventConfig.handle][eventConfig.evt][eventConfig.namespace].length = 0;

                			} else { // Does not have a namespace

                				active[eventConfig.handle][eventConfig.evt] = { '': [] };

                			}

                			return this;
                		},
                		unbind: function() { this.off.apply(this, arguments); },

                		// Based on underscore's once implementation
                		once: function(eventname, callback) {
                			var hasRan = false,
                				memo;
                			return this.on(eventname, function() {
                				return function() {
                					if (hasRan) { return memo; }
                					hasRan = true;

                					memo = callback.apply(this, arguments);
                					callback = null;

                					return memo;
                				};
                			});
                		},

                		// Trigger ************************************************
                		trigger: function() {
                			var args = arguments,
                				active = this._active,
                				eventname = _ripFirstArg(args),
                				eventConfig = _cache[eventname] || (_cache[eventname] = _parseConfig(eventname)),
                				// Always do an event lookup. This ensures that the location
                				// of the event has been created so that calls to trigger
                				// for events that haven't been registered don't throw exceptions
                				location = _eventLookup(eventConfig, active);

                			if (eventConfig.namespace !== '') { // If there's a namespace, trigger only that array

                				_callEvents(location, args);

                			} else { // Else, trigger everything registered to the event

                				var subSignal = active[eventConfig.handle][eventConfig.evt],
                					key;
                				for (key in subSignal) {
                					_callEvents(subSignal[key], args);
                				}

                			}

                			return this;
                		},

                		// ListenTo | StopListening ********************************
                		listenTo: function(obj, eventname, callback) {
                			obj.on(eventname, callback);
                			return this;
                		},
                		stopListening: function(obj, eventname) {
                			obj.off(eventname);
                			return this;
                		}
                	};

                	// Create a pub/sub to expose Signal as
                	// e.g. Signal.on(), Signal.trigger()
                	var pubSub = new Signal();

                	// Attach the Signal object as a property
                	// of the exposed object so that new instances
                	// can be constructed/extended
                	// e.g. Signal.core.construct(), Signal.core.extend({})
                	pubSub.core = Signal;

                	// Expose
                	root.Signal = pubSub;

                }(window));
            }
        }
    ));
}());
