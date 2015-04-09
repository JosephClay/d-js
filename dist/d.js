/**
 * d-js - jQuery at half the size
 * @version v1.0.0
 * @link https://github.com/JosephClay/d-js
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _ = require('_'),
    split = require('util/split'),
    isArray = require('is/array'),
    isHtml = require('is/html'),
    isString = require('is/string'),
    isNodeList = require('is/nodeList'),
    isFunction = require('is/function'),
    isD = require('is/d'),
    parser = require('./modules/parser/parser'),
    array = require('./modules/array'),
    onready = require('./modules/onready'),
    selectors = require('./modules/selectors'),
    transversal = require('./modules/transversal'),
    dimensions = require('./modules/dimensions'),
    manip = require('./modules/manip'),
    css = require('./modules/css'),
    attr = require('./modules/attr'),
    prop = require('./modules/prop'),
    val = require('./modules/val'),
    position = require('./modules/position'),
    classes = require('./modules/classes'),
    data = require('./modules/data'),
    events = require('./modules/events'),
    Fizzle = require('./modules/Fizzle');

var D = module.exports = function (selector, attrs) {
    return new Init(selector, attrs);
};

var Init = D.prototype.init = function (selector, attrs) {
    // nothin
    if (!selector) {
        return this;
    }

    // element or window (documents have a nodeType)
    if (selector.nodeType || selector === window) {
        this[0] = selector;
        this.length = 1;
        return this;
    }

    // HTML string
    if (isHtml(selector)) {
        _.merge(this, parser.parseHtml(selector));
        if (attrs) {
            this.attr(attrs);
        }
        return this;
    }

    // String
    if (isString(selector)) {
        // Selector: perform a find without creating a new D
        _.merge(this, Fizzle.query(selector).exec(this, true));
        return this;
    }

    // Array of Elements, NodeList, or D object
    if (isArray(selector) || isNodeList(selector) || isD(selector)) {
        _.merge(this, selector);
        return this;
    }

    // document ready
    if (isFunction(selector)) {
        onready(selector);
    }
    return this;
};
Init.prototype = D.prototype;

_.extend(D, parser.D, data.D, {
    Fizzle: Fizzle,
    each: array.each,
    forEach: array.each,

    map: _.map,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

var arrayProto = split('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight|map|filter').reduce(function (obj, key) {
    obj[key] = Array.prototype[key];
    return obj;
}, {});

_.extend(D.prototype, { constructor: D }, arrayProto, array.fn, selectors.fn, transversal.fn, manip.fn, dimensions.fn, css.fn, attr.fn, prop.fn, val.fn, classes.fn, position.fn, data.fn, events.fn);

// Expose the prototype so that
// it can be hooked into for plugins
D.fn = D.prototype;

},{"./modules/Fizzle":35,"./modules/array":40,"./modules/attr":41,"./modules/classes":42,"./modules/css":43,"./modules/data":44,"./modules/dimensions":45,"./modules/events":48,"./modules/manip":49,"./modules/onready":50,"./modules/parser/parser":51,"./modules/position":52,"./modules/prop":53,"./modules/selectors":54,"./modules/transversal":55,"./modules/val":56,"_":12,"is/array":14,"is/d":19,"is/function":23,"is/html":24,"is/nodeList":25,"is/string":29,"util/split":66}],2:[function(require,module,exports){
(function (global){
'use strict';

var doc = document;
var addEvent = addEventEasy;
var removeEvent = removeEventEasy;
var hardCache = [];

if (!global.addEventListener) {
  addEvent = addEventHard;
  removeEvent = removeEventHard;
}

function addEventEasy (el, type, fn, capturing) {
  return el.addEventListener(type, fn, capturing);
}

function addEventHard (el, type, fn) {
  return el.attachEvent('on' + type, wrap(el, type, fn));
}

function removeEventEasy (el, type, fn, capturing) {
  return el.removeEventListener(type, fn, capturing);
}

function removeEventHard (el, type, fn) {
  return el.detachEvent('on' + type, unwrap(el, type, fn));
}

function fabricateEvent (el, type) {
  var e;
  if (doc.createEvent) {
    e = doc.createEvent('Event');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  } else if (doc.createEventObject) {
    e = doc.createEventObject();
    el.fireEvent('on' + type, e);
  }
}

function wrapperFactory (el, type, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault  = e.preventDefault  || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    fn.call(el, e);
  };
}

function wrap (el, type, fn) {
  var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
  hardCache.push({
    wrapper: wrapper,
    element: el,
    type: type,
    fn: fn
  });
  return wrapper;
}

function unwrap (el, type, fn) {
  var i = find(el, type, fn);
  if (i) {
    var wrapper = hardCache[i].wrapper;
    hardCache.splice(i, 1); // free up a tad of memory
    return wrapper;
  }
}

function find (el, type, fn) {
  var i, item;
  for (i = 0; i < hardCache.length; i++) {
    item = hardCache[i];
    if (item.element === el && item.type === type && item.fn === fn) {
      return i;
    }
  }
}

module.exports = {
  add: addEvent,
  remove: removeEvent,
  fabricate: fabricateEvent
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
'use strict';

var div = module.exports = document.createElement('div');

div.innerHTML = '<a href="/a">a</a><button>button</button>';

},{}],4:[function(require,module,exports){
"use strict";

module.exports = 2;

},{}],5:[function(require,module,exports){
"use strict";

module.exports = 8;

},{}],6:[function(require,module,exports){
"use strict";

module.exports = 9;

},{}],7:[function(require,module,exports){
"use strict";

module.exports = 11;

},{}],8:[function(require,module,exports){
"use strict";

module.exports = 1;

},{}],9:[function(require,module,exports){
"use strict";

module.exports = 3;

},{}],10:[function(require,module,exports){
// Matches "-ms-" so that it can be changed to "ms-"
'use strict';

var _TRUNCATE_MS_PREFIX = /^-ms-/,

// Matches dashed string for camelizing
_DASH_CATCH = /-([\da-z])/gi,

// Matches "none" or a table type e.g. "table",
// "table-cell" etc...
_NONE_OR_TABLE = /^(none|table(?!-c[ea]).+)/,
    _TYPE_TEST_FOCUSABLE = /^(?:input|select|textarea|button|object)$/i,
    _TYPE_TEST_CLICKABLE = /^(?:a|area)$/i,
    _SELECTOR_ID = /^#([\w-]+)$/,
    _SELECTOR_TAG = /^[\w-]+$/,
    _SELECTOR_CLASS = /^\.([\w-]+)$/,
    _POSITION = /^(top|right|bottom|left)$/,
    _NUM_NON_PX = new RegExp('^(' + /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source + ')(?!px)[a-z%]+$', 'i'),
    _SINGLE_TAG = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

/**
 * Map of parent tag names to the child tags that require them.
 * @type {Object}
 */
_PARENT_MAP = {
    table: /^<(?:tbody|tfoot|thead|colgroup|caption)\b/,
    tbody: /^<(?:tr)\b/,
    tr: /^<(?:td|th)\b/,
    colgroup: /^<(?:col)\b/,
    select: /^<(?:option)\b/
};

// having caches isn't actually faster
// for a majority of use cases for string
// manipulations
// http://jsperf.com/simple-cache-for-string-manip
module.exports = {
    numNotPx: function numNotPx(val) {
        return _NUM_NON_PX.test(val);
    },
    position: function position(val) {
        return _POSITION.test(val);
    },
    singleTagMatch: function singleTagMatch(val) {
        return _SINGLE_TAG.exec(val);
    },
    isNoneOrTable: function isNoneOrTable(str) {
        return _NONE_OR_TABLE.test(str);
    },
    isFocusable: function isFocusable(str) {
        return _TYPE_TEST_FOCUSABLE.test(str);
    },
    isClickable: function isClickable(str) {
        return _TYPE_TEST_CLICKABLE.test(str);
    },
    isStrictId: function isStrictId(str) {
        return _SELECTOR_ID.test(str);
    },
    isTag: function isTag(str) {
        return _SELECTOR_TAG.test(str);
    },
    isClass: function isClass(str) {
        return _SELECTOR_CLASS.test(str);
    },

    camelCase: function camelCase(str) {
        return str.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, function (match, letter) {
            return letter.toUpperCase();
        });
    },

    getParentTagName: function getParentTagName(str) {
        var val = str.substr(0, 30);
        for (var parentTagName in _PARENT_MAP) {
            if (_PARENT_MAP[parentTagName].test(val)) {
                return parentTagName;
            }
        }
        return 'div';
    }
};

},{}],11:[function(require,module,exports){
'use strict';

var DIV = require('DIV'),
    a = DIV.getElementsByTagName('a')[0],
    button = DIV.getElementsByTagName('button')[0],
    select = document.createElement('select'),
    option = select.appendChild(document.createElement('option'));

var test = function test(tagName, testFn) {
    // Avoid variable references to elements to prevent memory leaks in IE.
    // Avoid variable references to elements to prevent memory leaks in IE.
    return testFn(document.createElement(tagName));
};

module.exports = {
    // Make sure that URLs aren't manipulated
    // (IE normalizes it by default)
    hrefNormalized: a.getAttribute('href') === '/a',

    // Check the default checkbox/radio value ('' in older WebKit; 'on' elsewhere)
    checkOn: test('input', function (input) {
        input.setAttribute('type', 'radio');
        return !!input.value;
    }),

    // Check if an input maintains its value after becoming a radio
    // Support: Modern browsers only (NOT IE <= 11)
    radioValue: test('input', function (input) {
        input.value = 't';
        input.setAttribute('type', 'radio');
        return input.value === 't';
    }),

    // Make sure that a selected-by-default option has a working selected property.
    // (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
    optSelected: option.selected,

    // Make sure that the options inside disabled selects aren't marked as disabled
    // (WebKit marks them as disabled)
    optDisabled: (function () {
        select.disabled = true;
        return !option.disabled;
    })(),

    // Modern browsers normalize \r\n to \n in textarea values,
    // but IE <= 11 (and possibly newer) do not.
    valueNormalized: test('textarea', function (textarea) {
        textarea.value = '\r\n';
        return textarea.value === '\n';
    }),

    // Support: IE10+, modern browsers
    selectedSelector: test('select', function (select) {
        select.innerHTML = '<option value="1">1</option><option value="2" selected>2</option>';
        return !!select.querySelector('option[selected]');
    })
};

// Prevent memory leaks in IE
DIV = a = button = select = option = null;

},{"DIV":3}],12:[function(require,module,exports){
'use strict';

var exists = require('is/exists'),
    isArray = require('is/array'),
    isArrayLike = require('is/arrayLike'),
    isNodeList = require('is/nodeList'),
    slice = require('util/slice');

var _ = module.exports = {
    // Flatten that also checks if value is a NodeList
    flatten: function flatten(arr) {
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
    concatFlat: (function (concat) {

        return function (nestedArrays) {
            return concat.apply([], nestedArrays);
        };
    })([].concat),

    every: function every(arr, iterator) {
        if (!exists(arr)) {
            return true;
        }

        var idx = 0,
            length = arr.length;
        for (; idx < length; idx++) {
            if (!iterator(arr[idx], idx)) {
                return false;
            }
        }

        return true;
    },

    extend: function extend() {
        var args = arguments,
            obj = args[0],
            len = args.length;

        if (!obj || len < 2) {
            return obj;
        }

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
    map: function map(arr, iterator) {
        var results = [];
        if (!arr) {
            return results;
        }

        var idx = 0,
            length = arr.length;
        for (; idx < length; idx++) {
            results.push(iterator(arr[idx], idx));
        }

        return results;
    },

    // Array-preserving map
    // http://jsperf.com/push-map-vs-index-replacement-map
    fastmap: function fastmap(arr, iterator) {
        if (!arr) {
            return [];
        }

        var idx = 0,
            length = arr.length;
        for (; idx < length; idx++) {
            arr[idx] = iterator(arr[idx], idx);
        }

        return arr;
    },

    filter: function filter(arr, iterator) {
        var results = [];
        if (!arr || !arr.length) {
            return results;
        }
        iterator = iterator || function (arg) {
            return !!arg;
        };

        var idx = 0,
            length = arr.length;
        for (; idx < length; idx++) {
            if (iterator(arr[idx], idx)) {
                results.push(arr[idx]);
            }
        }

        return results;
    },

    any: function any(arr, iterator) {
        var result = false;
        if (!arr || !arr.length) {
            return result;
        }

        var idx = 0,
            length = arr.length;
        for (; idx < length; idx++) {
            if (result || (result = iterator(arr[idx], idx))) {
                break;
            }
        }

        return !!result;
    },

    // pulled from AMD
    typecast: function typecast(val) {
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

    toArray: function toArray(obj) {
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

    makeArray: function makeArray(arg) {
        if (!exists(arg)) {
            return [];
        }
        if (arg.slice === slice) {
            return arg.slice();
        }
        if (isArrayLike(arg)) {
            return slice(arg);
        }
        return [arg];
    },

    contains: function contains(arr, item) {
        return arr.indexOf(item) !== -1;
    },

    each: function each(obj, iterator) {
        if (!obj || !iterator) {
            return;
        }

        // Array-like
        if (obj.length !== undefined) {
            var idx = 0,
                length = obj.length;
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

    hasSize: function hasSize(obj) {
        var name;
        for (name in obj) {
            return false;
        }
        return true;
    },

    merge: function merge(first, second) {
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

},{"is/array":14,"is/arrayLike":15,"is/exists":22,"is/nodeList":25,"util/slice":65}],13:[function(require,module,exports){
"use strict";

var deleter = function deleter(deletable) {
    return deletable ? function (store, key) {
        delete store[key];
    } : function (store, key) {
        store[key] = undefined;
    };
};

var getterSetter = function getterSetter(deletable) {
    var store = {},
        del = deleter(deletable);

    return {
        has: function has(key) {
            return key in store && store[key] !== undefined;
        },
        get: function get(key) {
            return store[key];
        },
        set: function set(key, value) {
            store[key] = value;
            return value;
        },
        put: function put(key, fn, arg) {
            var value = fn(arg);
            store[key] = value;
            return value;
        },
        remove: function remove(key) {
            del(store, key);
        }
    };
};

var biLevelGetterSetter = function biLevelGetterSetter(deletable) {
    var store = {},
        del = deleter(deletable);

    return {
        has: function has(key1, key2) {
            var has1 = key1 in store && store[key1] !== undefined;
            if (!has1 || arguments.length === 1) {
                return has1;
            }

            return key2 in store[key1] && store[key1][key2] !== undefined;
        },
        get: function get(key1, key2) {
            var ref1 = store[key1];
            return arguments.length === 1 ? ref1 : ref1 !== undefined ? ref1[key2] : ref1;
        },
        set: function set(key1, key2, value) {
            var ref1 = this.has(key1) ? store[key1] : store[key1] = {};
            ref1[key2] = value;
            return value;
        },
        put: function put(key1, key2, fn, arg) {
            var ref1 = this.has(key1) ? store[key1] : store[key1] = {};
            var value = fn(arg);
            ref1[key2] = value;
            return value;
        },
        remove: function remove(key1, key2) {
            // Easy removal
            if (arguments.length === 1) {
                return del(store, key1);
            }

            // Deep removal
            var ref1 = store[key1] || (store[key1] = {});
            del(ref1, key2);
        }
    };
};

module.exports = function (lvl, deletable) {
    return lvl === 2 ? biLevelGetterSetter(deletable) : getterSetter(deletable);
};

},{}],14:[function(require,module,exports){
"use strict";

module.exports = Array.isArray;

},{}],15:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && +value.length === value.length;
};

},{}],16:[function(require,module,exports){
'use strict';

var DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT');

module.exports = function (elem) {
    return elem && elem.ownerDocument && elem !== document && elem.parentNode && elem.parentNode.nodeType !== DOCUMENT_FRAGMENT && elem.parentNode.isParseHtmlFragment !== true;
};

},{"NODE_TYPE/DOCUMENT_FRAGMENT":7}],17:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value === true || value === false;
};

},{}],18:[function(require,module,exports){
'use strict';

var isArray = require('is/array'),
    isNodeList = require('is/nodeList'),
    isD = require('is/d');

module.exports = function (value) {
    return isD(value) || isArray(value) || isNodeList(value);
};

},{"is/array":14,"is/d":19,"is/nodeList":25}],19:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value instanceof D;
};

},{}],20:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === document;
};

},{}],21:[function(require,module,exports){
'use strict';

var isWindow = require('is/window'),
    ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (value) {
    return value && (value === document || isWindow(value) || value.nodeType === ELEMENT);
};

},{"NODE_TYPE/ELEMENT":8,"is/window":30}],22:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value !== undefined && value !== null;
};

},{}],23:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return value && typeof value === 'function';
};

},{}],24:[function(require,module,exports){
'use strict';

var isString = require('is/string');

module.exports = function (value) {
    if (!isString(value)) {
        return false;
    }

    var text = value.trim();
    return text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3;
};

},{"is/string":29}],25:[function(require,module,exports){
// NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
"use strict";

module.exports = function (value) {
    return value && (value instanceof NodeList || value instanceof HTMLCollection);
};

},{}],26:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'number';
};

},{}],27:[function(require,module,exports){
'use strict';

module.exports = function (value) {
    var type = typeof value;
    return type === 'function' || !!value && type === 'object';
};

},{}],28:[function(require,module,exports){
'use strict';

var isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('is/element'),
    isCollection = require('is/collection');

module.exports = function (val) {
    return val && (isString(val) || isFunction(val) || isElement(val) || isCollection(val));
};

},{"is/collection":18,"is/element":21,"is/function":23,"is/string":29}],29:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'string';
};

},{}],30:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === value.window;
};

},{}],31:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT'),
    DIV = require('DIV'),

// Support: IE9+, modern browsers
matchesSelector = DIV.matches || DIV.matchesSelector || DIV.msMatchesSelector || DIV.mozMatchesSelector || DIV.webkitMatchesSelector || DIV.oMatchesSelector;

module.exports = function (elem, selector) {
    return elem.nodeType === ELEMENT ? matchesSelector.call(elem, selector) : false;
};

// Prevent memory leaks in IE
DIV = null;

},{"DIV":3,"NODE_TYPE/ELEMENT":8}],32:[function(require,module,exports){
'use strict';

var _ = require('_');

var Is = module.exports = function (selectors) {
    this._selectors = selectors;
};
Is.prototype = {
    match: function match(context) {
        var selectors = this._selectors,
            idx = selectors.length;

        while (idx--) {
            if (selectors[idx].match(context)) {
                return true;
            }
        }

        return false;
    },

    any: function any(arr) {
        var _this = this;

        return _.any(arr, function (elem) {
            return _this.match(elem) ? true : false;
        });
    },

    not: function not(arr) {
        var _this2 = this;

        return _.filter(arr, function (elem) {
            return !_this2.match(elem) ? true : false;
        });
    }
};

},{"_":12}],33:[function(require,module,exports){
"use strict";

var find = function find(query, context) {
    var result = [],
        selectors = query._selectors,
        idx = 0,
        length = selectors.length;
    for (; idx < length; idx++) {
        result.push.apply(result, selectors[idx].exec(context));
    }
    return result;
};

var Query = module.exports = function (selectors) {
    this._selectors = selectors;
};

Query.prototype = {
    exec: function exec(arr, isNew) {
        var result = [],
            idx = 0,
            length = isNew ? 1 : arr.length;
        for (; idx < length; idx++) {
            result.push.apply(result, find(this, arr[idx]));
        }
        return result;
    }
};

},{}],34:[function(require,module,exports){
'use strict';

var exists = require('is/exists'),
    isNodeList = require('is/nodeList'),
    isElement = require('is/element'),
    GET_ELEMENT_BY_ID = 'getElementById',
    GET_ELEMENTS_BY_TAG_NAME = 'getElementsByTagName',
    GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    QUERY_SELECTOR_ALL = 'querySelectorAll',
    selectorCache = require('cache')(),
    REGEX = require('REGEX'),
    matches = require('matchesSelector');

var determineMethod = function determineMethod(selector) {
    var method = selectorCache.get(selector);
    if (method) {
        return method;
    }

    method = REGEX.isStrictId(selector) ? GET_ELEMENT_BY_ID : REGEX.isClass(selector) ? GET_ELEMENTS_BY_CLASS_NAME : REGEX.isTag(selector) ? GET_ELEMENTS_BY_TAG_NAME : QUERY_SELECTOR_ALL;

    selectorCache.set(selector, method);
    return method;
},
    uniqueId = require('util/uniqueId').seed(0, 'D-uniqueId-'),

// need to force an array here
fromDomArrayToArray = function fromDomArrayToArray(arrayLike) {
    var idx = arrayLike.length,
        arr = new Array(idx);
    while (idx--) {
        arr[idx] = arrayLike[idx];
    }
    return arr;
},
    processQuerySelection = function processQuerySelection(selection) {
    // No selection
    if (!selection) {
        return [];
    }
    // Nodelist without a length
    if (isNodeList(selection) && !selection.length) {
        return [];
    }

    // If it's an id, return it as an array
    return isElement(selection) || !selection.length ? [selection] : fromDomArrayToArray(selection);
},
    tailorChildSelector = function tailorChildSelector(id, selector) {
    return '#' + id + ' ' + selector;
},
    childOrSiblingQuery = function childOrSiblingQuery(context, self) {
    // Child select - needs special help so that "> div" doesn't break
    var method = self.method,
        idApplied = false,
        selector = self.selector,
        newId,
        id;

    id = context.id;
    if (id === '' || !exists(id)) {
        newId = uniqueId();
        context.id = newId;
        idApplied = true;
    }

    selector = tailorChildSelector(idApplied ? newId : id, selector);

    var selection = document[method](selector);

    if (idApplied) {
        context.id = id;
    }

    return processQuerySelection(selection);
},
    classQuery = function classQuery(context, self) {
    var method = self.method,
        selector = self.selector,

    // Class search, don't start with '.'
    selector = self.selector.substr(1);

    var selection = context[method](selector);

    return processQuerySelection(selection);
},
    idQuery = function idQuery(context, self) {
    var method = self.method,
        selector = self.selector.substr(1),
        selection = document[method](selector);

    return processQuerySelection(selection);
},
    defaultQuery = function defaultQuery(context, self) {
    var selection = context[self.method](self.selector);
    return processQuerySelection(selection);
},
    determineQuery = function determineQuery(self) {
    if (self.isChildOrSiblingSelect) {
        return childOrSiblingQuery;
    }

    if (self.isClassSearch) {
        return classQuery;
    }

    if (self.isIdSearch) {
        return idQuery;
    }

    return defaultQuery;
};

var Selector = module.exports = function (str) {
    var selector = str.trim(),
        isChildOrSiblingSelect = selector[0] === '>' || selector[0] === '+',
        method = isChildOrSiblingSelect ? QUERY_SELECTOR_ALL : determineMethod(selector);

    this.str = str;
    this.selector = selector;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.isIdSearch = method === GET_ELEMENT_BY_ID;
    this.isClassSearch = !this.isIdSearch && method === GET_ELEMENTS_BY_CLASS_NAME;
    this.method = method;
};

Selector.prototype = {
    match: function match(context) {
        // No neeed to check, a match will fail if it's
        // child or sibling
        if (this.isChildOrSiblingSelect) {
            return false;
        }

        return matches(context, this.selector);
    },

    exec: function exec(context) {
        var query = determineQuery(this);

        // these are the types we're expecting to fall through
        // isElement(context) || isNodeList(context) || isCollection(context)
        // if no context is given, use document
        return query(context || document, this);
    }
};

},{"REGEX":10,"cache":13,"is/element":21,"is/exists":22,"is/nodeList":25,"matchesSelector":31,"util/uniqueId":68}],35:[function(require,module,exports){
'use strict';

var _ = require('_'),
    queryCache = require('cache')(),
    isCache = require('cache')(),
    Selector = require('./constructs/Selector'),
    Query = require('./constructs/Query'),
    Is = require('./constructs/Is'),
    parse = require('./selector/selector-parse'),
    normalize = require('./selector/selector-normalize');

var toSelectors = function toSelectors(str) {
    // Selectors will return null if the query was invalid.
    // Not returning early or doing extra checks as this will
    // noop on the Query and Is level and is the exception
    // instead of the rule
    var selectors = parse.subqueries(str) || [];

    // Normalize each of the selectors...
    selectors = _.map(selectors, normalize);

    // ...and map them to Selector objects
    return _.fastmap(selectors, function (selector) {
        return new Selector(selector);
    });
};

module.exports = {
    parse: parse,

    query: function query(str) {
        return queryCache.has(str) ? queryCache.get(str) : queryCache.put(str, function () {
            return new Query(toSelectors(str));
        });
    },
    is: function is(str) {
        return isCache.has(str) ? isCache.get(str) : isCache.put(str, function () {
            return new Is(toSelectors(str));
        });
    }
};

},{"./constructs/Is":32,"./constructs/Query":33,"./constructs/Selector":34,"./selector/selector-normalize":38,"./selector/selector-parse":39,"_":12,"cache":13}],36:[function(require,module,exports){
'use strict';

module.exports = {
	':child-at': ':nth-child(x)',
	':child-gt': ':nth-child(n+x)',
	':child-lt': ':nth-child(~n+x)'
};

},{}],37:[function(require,module,exports){
'use strict';

module.exports = {
    ':child-even': ':nth-child(even)',
    ':child-odd': ':nth-child(odd)',
    ':text': '[type="text"]',
    ':password': '[type="password"]',
    ':radio': '[type="radio"]',
    ':checkbox': '[type="checkbox"]',
    ':submit': '[type="submit"]',
    ':reset': '[type="reset"]',
    ':button': '[type="button"]',
    ':image': '[type="image"]',
    ':input': '[type="input"]',
    ':file': '[type="file"]',
    ':selected': '[selected="selected"]'
};

},{}],38:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS'),
    ATTRIBUTE_SELECTOR = /\[\s*[\w-]+\s*[!$^*]?(?:=\s*(['"]?)(.*?[^\\]|[^\\]*))?\1\s*\]/g,
    PSEUDO_SELECT = /(:[^\s\(\[)]+)/g,
    CAPTURE_SELECT = /(:[^\s^(]+)\(([^\)]+)\)/g,
    pseudoCache = require('cache')(),
    proxySelectors = require('./proxy'),
    captureSelectors = require('./capture');

var getAttributePositions = function getAttributePositions(str) {
    var pairs = [];
    // Not using return value. Simply using it to iterate
    // through all of the matches to populate match positions
    str.replace(ATTRIBUTE_SELECTOR, function (match, cap1, cap2, position) {
        pairs.push([position, position + match.length]);
    });
    return pairs;
};

var isOutsideOfAttribute = function isOutsideOfAttribute(position, positions) {
    var idx = 0,
        length = positions.length;
    for (; idx < length; idx++) {
        var pos = positions[idx];
        if (position > pos[0] && position < pos[1]) {
            return false;
        }
    }
    return true;
};

var pseudoReplace = function pseudoReplace(str, positions) {
    return str.replace(PSEUDO_SELECT, function (match, cap, position) {
        if (!isOutsideOfAttribute(position, positions)) {
            return match;
        }

        return proxySelectors[match] ? proxySelectors[match] : match;
    });
};

var captureReplace = function captureReplace(str, positions) {
    var captureSelector;
    return str.replace(CAPTURE_SELECT, function (match, cap, value, position) {
        if (!isOutsideOfAttribute(position, positions)) {
            return match;
        }

        return (captureSelector = captureSelectors[cap]) ? captureSelector.replace('x', value) : match;
    });
};

var booleanSelectorReplace = SUPPORTS.selectedSelector ?
// IE10+, modern browsers
function (str) {
    return str;
} :
// IE8-9
function (str) {
    var positions = getAttributePositions(str),
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

module.exports = function (str) {
    return pseudoCache.has(str) ? pseudoCache.get(str) : pseudoCache.put(str, function () {
        var attrPositions = getAttributePositions(str);
        str = pseudoReplace(str, attrPositions);
        str = booleanSelectorReplace(str);
        return captureReplace(str, attrPositions);
    });
};

},{"./capture":36,"./proxy":37,"SUPPORTS":11,"cache":13}],39:[function(require,module,exports){
/*
 * Fizzle.js
 * Adapted from Sizzle.js
 */
'use strict';

var tokenCache = require('cache')(),
    subqueryCache = require('cache')(),
    error = function error(selector) {
    if (console && console.error) {
        console.error('d-js: Invalid query selector (caught) "' + selector + '"');
    }
};

var fromCharCode = String.fromCharCode,

// http://www.w3.org/TR/css3-selectors/#whitespace
WHITESPACE = '[\\x20\\t\\r\\n\\f]',

// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
IDENTIFIER = '(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+',

// NOTE: Leaving double quotes to reduce escaping
// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
ATTRIBUTES = '\\[' + WHITESPACE + '*(' + IDENTIFIER + ')(?:' + WHITESPACE +
// Operator (capture 2)
'*([*^$|!~]?=)' + WHITESPACE +
// "Attribute values must be CSS IDENTIFIERs [capture 5] or strings [capture 3 or capture 4]"
'*(?:\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)"|(' + IDENTIFIER + '))|)' + WHITESPACE + '*\\]',
    PSEUDOS = ':(' + IDENTIFIER + ')(?:\\((' +
// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
// 1. quoted (capture 3; capture 4 or capture 5)
'(\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)")|' +
// 2. simple (capture 6)
'((?:\\\\.|[^\\\\()[\\]]|' + ATTRIBUTES + ')*)|' +
// 3. anything else (capture 2)
'.*' + ')\\)|)',
    R_COMMA = new RegExp('^' + WHITESPACE + '*,' + WHITESPACE + '*'),
    R_COMBINATORS = new RegExp('^' + WHITESPACE + '*([>+~]|' + WHITESPACE + ')' + WHITESPACE + '*'),
    R_PSEUDO = new RegExp(PSEUDOS),
    R_MATCH_EXPR = {
    ID: new RegExp('^#(' + IDENTIFIER + ')'),
    CLASS: new RegExp('^\\.(' + IDENTIFIER + ')'),
    TAG: new RegExp('^(' + IDENTIFIER + '|[*])'),
    ATTR: new RegExp('^' + ATTRIBUTES),
    PSEUDO: new RegExp('^' + PSEUDOS),
    CHILD: new RegExp('^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(' + WHITESPACE + '*(even|odd|(([+-]|)(\\d*)n|)' + WHITESPACE + '*(?:([+-]|)' + WHITESPACE + '*(\\d+)|))' + WHITESPACE + '*\\)|)', 'i'),
    bool: new RegExp('^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$', 'i')
},

// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
R_UNESCAPE = new RegExp('\\\\([\\da-f]{1,6}' + WHITESPACE + '?|(' + WHITESPACE + ')|.)', 'ig'),
    funescape = function funescape(_, escaped, escapedWhitespace) {
    var high = '0x' + (escaped - 65536);
    // NaN means non-codepoint
    // Support: Firefox<24
    // Workaround erroneous numeric interpretation of +'0x'
    return high !== high || escapedWhitespace ? escaped : high < 0 ?
    // BMP codepoint
    fromCharCode(high + 65536) :
    // Supplemental Plane codepoint (surrogate pair)
    fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
},
    preFilter = {
    ATTR: function ATTR(match) {
        match[1] = match[1].replace(R_UNESCAPE, funescape);

        // Move the given value to match[3] whether quoted or unquoted
        match[3] = (match[3] || match[4] || match[5] || '').replace(R_UNESCAPE, funescape);

        if (match[2] === '~=') {
            match[3] = ' ' + match[3] + ' ';
        }

        return match.slice(0, 4);
    },

    CHILD: function CHILD(match) {
        /* matches from R_MATCH_EXPR['CHILD']
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
            match[5] = +(match[7] + match[8] || match[3] === 'odd');

            // other types prohibit arguments
        } else if (match[3]) {
            throw new Error(match[0]);
        }

        return match;
    },

    PSEUDO: function PSEUDO(match) {
        var excess,
            unquoted = !match[6] && match[2];

        if (R_MATCH_EXPR.CHILD.test(match[0])) {
            return null;
        }

        // Accept quoted arguments as-is
        if (match[3]) {
            match[2] = match[4] || match[5] || '';

            // Strip excess characters from unquoted arguments
        } else if (unquoted && R_PSEUDO.test(unquoted) && (excess = tokenize(unquoted, true)) && (excess = unquoted.indexOf(')', unquoted.length - excess) - unquoted.length)) {

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
var tokenize = function tokenize(selector, parseOnly) {
    if (tokenCache.has(selector)) {
        return parseOnly ? 0 : tokenCache.get(selector).slice(0);
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
        if (!matched || (match = R_COMMA.exec(soFar))) {
            if (match) {
                // Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar;
            }
            if (subquery) {
                subqueries.push(subquery);
            }
            subquery = '';
        }

        matched = null;

        // Combinators
        if (match = R_COMBINATORS.exec(soFar)) {
            matched = match.shift();
            subquery += matched;
            soFar = soFar.slice(matched.length);
        }

        // Filters
        for (type in R_MATCH_EXPR) {
            regex = R_MATCH_EXPR[type];
            match = regex.exec(soFar);

            if (match && (!preFilter[type] || (match = preFilter[type](match)))) {
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

    if (subquery) {
        subqueries.push(subquery);
    }

    // Return the length of the invalid excess
    // if we're just parsing.
    if (parseOnly) {
        return soFar.length;
    }

    if (soFar) {
        error(selector);return null;
    }

    return tokenCache.set(selector, subqueries).slice();
};

module.exports = {
    /**
     * Splits the given comma-separated CSS selector into separate sub-queries.
     * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
     * @return {String[]|null} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]') or null if there was an error parsing the selector.
     */
    subqueries: function subqueries(selector) {
        return subqueryCache.has(selector) ? subqueryCache.get(selector) : subqueryCache.put(selector, function () {
            return tokenize(selector);
        });
    },

    isBool: function isBool(name) {
        return R_MATCH_EXPR.bool.test(name);
    }
};

// Get excess from tokenize (recursively)

// advance to the next closing parenthesis

},{"cache":13}],40:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    slice = require('util/slice'),
    order = require('../order');

var unique = function unique(results) {
    var hasDuplicates = order.sort(results);
    if (!hasDuplicates) {
        return results;
    }

    var elem,
        idx = 0,

    // create the array here
    // so that a new array isn't
    // created/destroyed every unique call
    duplicates = [];

    // Go through the array and identify
    // the duplicates to be removed
    while (elem = results[idx++]) {
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
    map = function map(arr, iterator) {
    var results = [];
    if (!arr.length || !iterator) {
        return results;
    }

    var idx = 0,
        length = arr.length,
        item;
    for (; idx < length; idx++) {
        item = arr[idx];
        results.push(iterator.call(item, item, idx));
    }

    return _.concatFlat(results);
},
    each = function each(obj, iterator) {
    if (!obj || !iterator) {
        return;
    }

    // Array support
    if (obj.length === +obj.length) {
        var idx = 0,
            length = obj.length,
            item;
        for (; idx < length; idx++) {
            item = obj[idx];
            if (iterator.call(item, item, idx) === false) {
                return;
            }
        }

        return;
    }

    // Object support
    var key, value;
    for (key in obj) {
        value = obj[key];
        if (iterator.call(value, value, key) === false) {
            return;
        }
    }
};

module.exports = {
    elementSort: order.sort,
    unique: unique,
    each: each,

    fn: {
        at: function at(index) {
            return this[+index];
        },

        get: function get(index) {
            // No index, return all
            if (!exists(index)) {
                return this.toArray();
            }

            index = +index;

            // Looking to get an index from the end of the set
            if (index < 0) {
                index = this.length + index;
            }

            return this[index];
        },

        eq: function eq(index) {
            return D(this.get(index));
        },

        slice: (function (_slice) {
            function slice(_x, _x2) {
                return _slice.apply(this, arguments);
            }

            slice.toString = function () {
                return _slice.toString();
            };

            return slice;
        })(function (start, end) {
            return D(slice(this.toArray(), start, end));
        }),

        first: function first() {
            return D(this[0]);
        },

        last: function last() {
            return D(this[this.length - 1]);
        },

        toArray: function toArray() {
            return slice(this);
        },

        map: (function (_map) {
            function map(_x3) {
                return _map.apply(this, arguments);
            }

            map.toString = function () {
                return _map.toString();
            };

            return map;
        })(function (iterator) {
            return D(map(this, iterator));
        }),

        each: (function (_each) {
            function each(_x4) {
                return _each.apply(this, arguments);
            }

            each.toString = function () {
                return _each.toString();
            };

            return each;
        })(function (iterator) {
            each(this, iterator);
            return this;
        }),

        forEach: function forEach(iterator) {
            each(this, iterator);
            return this;
        }
    }
};

},{"../order":60,"_":12,"is/exists":22,"util/slice":65}],41:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('node/isElement'),
    newlines = require('string/newlines'),
    SUPPORTS = require('SUPPORTS'),
    isNodeName = require('node/isName'),
    Fizzle = require('./Fizzle/'),
    sanitizeDataKeyCache = require('cache')();

var isDataKey = function isDataKey(key) {
    return (key || '').substr(0, 5) === 'data-';
},
    trimDataKey = function trimDataKey(key) {
    return key.substr(0, 5);
},
    sanitizeDataKey = function sanitizeDataKey(key) {
    return sanitizeDataKeyCache.has(key) ? sanitizeDataKeyCache.get(key) : sanitizeDataKeyCache.put(key, function () {
        return isDataKey(key) ? key : 'data-' + key.toLowerCase();
    });
},
    getDataAttrKeys = function getDataAttrKeys(elem) {
    var attrs = elem.attributes,
        idx = attrs.length,
        keys = [],
        key;
    while (idx--) {
        key = attrs[idx];
        if (isDataKey(key)) {
            keys.push(key);
        }
    }

    return keys;
};

// IE9+, modern browsers
var hasAttr = function hasAttr(elem, attr) {
    return elem.hasAttribute(attr);
};

var boolHook = {
    is: function is(attrName) {
        return Fizzle.parse.isBool(attrName);
    },
    get: function get(elem, attrName) {
        return hasAttr(elem, attrName) ? attrName.toLowerCase() : undefined;
    },
    set: function set(elem, value, attrName) {
        if (value === false) {
            // Remove boolean attributes when set to false
            return elem.removeAttribute(attrName);
        }

        elem.setAttribute(attrName, attrName);
    }
};

var hooks = {
    tabindex: {
        get: function get(elem) {
            var tabindex = elem.getAttribute('tabindex');
            if (!exists(tabindex) || tabindex === '') {
                return;
            }
            return tabindex;
        }
    },

    type: {
        set: function set(elem, value) {
            if (!SUPPORTS.radioValue && value === 'radio' && isNodeName(elem, 'input')) {
                // Setting the type on a radio button after the value resets the value in IE6-9
                // Reset value to default in case type is set after value during creation
                var oldValue = elem.value;
                elem.setAttribute('type', value);
                elem.value = oldValue;
            } else {
                elem.setAttribute('type', value);
            }
        }
    },

    value: {
        get: function get(elem) {
            var val = elem.value;
            if (val === null || val === undefined) {
                val = elem.getAttribute('value');
            }
            return newlines(val);
        },
        set: function set(elem, value) {
            elem.setAttribute('value', value);
        }
    }
},
    getAttribute = function getAttribute(elem, attr) {
    if (!isElement(elem) || !hasAttr(elem, attr)) {
        return;
    }

    if (boolHook.is(attr)) {
        return boolHook.get(elem, attr);
    }

    if (hooks[attr] && hooks[attr].get) {
        return hooks[attr].get(elem);
    }

    var ret = elem.getAttribute(attr);
    return exists(ret) ? ret : undefined;
},
    setters = {
    forAttr: function forAttr(attr, value) {
        if (boolHook.is(attr) && (value === true || value === false)) {
            return setters.bool;
        } else if (hooks[attr] && hooks[attr].set) {
            return setters.hook;
        }
        return setters.elem;
    },
    bool: function bool(elem, attr, value) {
        boolHook.set(elem, value, attr);
    },
    hook: function hook(elem, attr, value) {
        hooks[attr].set(elem, value);
    },
    elem: (function (_elem) {
        function elem(_x, _x2, _x3) {
            return _elem.apply(this, arguments);
        }

        elem.toString = function () {
            return _elem.toString();
        };

        return elem;
    })(function (elem, attr, value) {
        elem.setAttribute(attr, value);
    }) },
    setAttributes = function setAttributes(arr, attr, value) {
    var isFn = isFunction(value),
        idx = 0,
        len = arr.length,
        elem,
        val,
        setter = setters.forAttr(attr, value);

    for (; idx < len; idx++) {
        elem = arr[idx];

        if (!isElement(elem)) {
            continue;
        }

        val = isFn ? value.call(elem, idx, getAttribute(elem, attr)) : value;
        setter(elem, attr, val);
    }
},
    _setAttribute = function _setAttribute(elem, attr, value) {
    if (!isElement(elem)) {
        return;
    }
    var setter = setters.forAttr(attr, value);
    setter(elem, attr, value);
},
    removeAttributes = function removeAttributes(arr, attr) {
    var idx = 0,
        length = arr.length;
    for (; idx < length; idx++) {
        removeAttribute(arr[idx], attr);
    }
},
    removeAttribute = function removeAttribute(elem, attr) {
    if (!isElement(elem)) {
        return;
    }

    if (hooks[attr] && hooks[attr].remove) {
        return hooks[attr].remove(elem);
    }

    elem.removeAttribute(attr);
};

module.exports = {
    fn: {
        attr: (function (_attr) {
            function attr(_x4, _x5) {
                return _attr.apply(this, arguments);
            }

            attr.toString = function () {
                return _attr.toString();
            };

            return attr;
        })(function (attr, value) {
            if (arguments.length === 1) {
                if (isString(attr)) {
                    return getAttribute(this[0], attr);
                }

                // assume an object
                var attrs = attr;
                for (attr in attrs) {
                    setAttributes(this, attr, attrs[attr]);
                }
            }

            if (arguments.length === 2) {
                if (value === undefined) {
                    return this;
                }

                // remove
                if (value === null) {
                    removeAttributes(this, attr);
                    return this;
                }

                // iterator
                if (isFunction(value)) {
                    var fn = value;
                    return _.each(this, function (elem, idx) {
                        var oldAttr = getAttribute(elem, attr),
                            result = fn.call(elem, idx, oldAttr);
                        if (!exists(result)) {
                            return;
                        }
                        _setAttribute(elem, attr, result);
                    });
                }

                // set
                setAttributes(this, attr, value);
                return this;
            }

            // fallback
            return this;
        }),

        removeAttr: function removeAttr(attr) {
            if (isString(attr)) {
                removeAttributes(this, attr);
            }
            return this;
        },

        attrData: function attrData(key, value) {
            if (!arguments.length) {

                var first = this[0];
                if (!first) {
                    return;
                }

                var map = {},
                    keys = getDataAttrKeys(first),
                    idx = keys.length,
                    key;
                while (idx--) {
                    key = keys[idx];
                    map[trimDataKey(key)] = _.typecast(first.getAttribute(key));
                }

                return map;
            }

            if (arguments.length === 2) {
                var idx = this.length;
                while (idx--) {
                    this[idx].setAttribute(sanitizeDataKey(key), '' + value);
                }
                return this;
            }

            // fallback to an object definition
            var obj = key,
                idx = this.length,
                key;
            while (idx--) {
                for (key in obj) {
                    this[idx].setAttribute(sanitizeDataKey(key), '' + obj[key]);
                }
            }
            return this;
        }
    }
};

},{"./Fizzle/":35,"SUPPORTS":11,"_":12,"cache":13,"is/exists":22,"is/function":23,"is/string":29,"node/isElement":57,"node/isName":58,"string/newlines":62}],42:[function(require,module,exports){
'use strict';

var _ = require('_'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),
    isArray = require('is/array'),
    isString = require('is/string'),
    split = require('string/split'),
    isEmpty = require('string/isEmpty');

var hasClass = function hasClass(elem, name) {
    return !!elem.classList && elem.classList.contains(name);
},
    addClasses = function addClasses(elem, names) {
    if (!elem.classList) {
        return;
    }

    var len = names.length,
        idx = 0;
    for (; idx < len; idx++) {
        elem.classList.add(names[idx]);
    }
},
    removeClasses = function removeClasses(elem, names) {
    if (!elem.classList) {
        return;
    }

    var len = names.length,
        idx = 0;
    for (; idx < len; idx++) {
        elem.classList.remove(names[idx]);
    }
},
    toggleClasses = function toggleClasses(elem, names) {
    if (!elem.classList) {
        return;
    }

    var len = names.length,
        idx = 0;
    for (; idx < len; idx++) {
        elem.classList.toggle(names[idx]);
    }
};

var _doAnyElemsHaveClass = function _doAnyElemsHaveClass(elems, name) {
    var elemIdx = elems.length;
    while (elemIdx--) {
        if (elems[elemIdx].nodeType !== ELEMENT) {
            continue;
        }
        if (hasClass(elems[elemIdx], name)) {
            return true;
        }
    }
    return false;
},
    _addClasses = function _addClasses(elems, names) {
    // Support array-like objects
    if (!isArray(names)) {
        names = _.toArray(names);
    }
    var elemIdx = elems.length;
    while (elemIdx--) {
        if (elems[elemIdx].nodeType !== ELEMENT) {
            continue;
        }
        addClasses(elems[elemIdx], names);
    }
},
    _removeClasses = function _removeClasses(elems, names) {
    // Support array-like objects
    if (!isArray(names)) {
        names = _.toArray(names);
    }
    var elemIdx = elems.length;
    while (elemIdx--) {
        if (elems[elemIdx].nodeType !== ELEMENT) {
            continue;
        }
        removeClasses(elems[elemIdx], names);
    }
},
    _removeAllClasses = function _removeAllClasses(elems) {
    var elemIdx = elems.length;
    while (elemIdx--) {
        if (elems[elemIdx].nodeType !== ELEMENT) {
            continue;
        }
        elems[elemIdx].className = '';
    }
},
    _toggleClasses = function _toggleClasses(elems, names) {
    // Support array-like objects
    if (!isArray(names)) {
        names = _.toArray(names);
    }
    var elemIdx = elems.length;
    while (elemIdx--) {
        if (elems[elemIdx].nodeType !== ELEMENT) {
            continue;
        }
        toggleClasses(elems[elemIdx], names);
    }
};

module.exports = {
    fn: {
        hasClass: function hasClass(name) {
            if (name === undefined || !this.length || isEmpty(name) || !name.length) {
                return this;
            }
            return _doAnyElemsHaveClass(this, name);
        },

        addClass: function addClass(names) {
            if (isArray(names)) {
                if (!this.length || isEmpty(name) || !name.length) {
                    return this;
                }

                _addClasses(this, names);

                return this;
            }

            if (isString(names)) {
                var name = names;
                if (!this.length || isEmpty(name) || !name.length) {
                    return this;
                }

                var names = split(name);
                if (!names.length) {
                    return this;
                }

                _addClasses(this, names);

                return this;
            }

            // fallback
            return this;
        },

        removeClass: function removeClass(names) {
            if (!arguments.length) {
                if (this.length) {
                    _removeAllClasses(this);
                }

                return this;
            }

            if (isArray(names)) {

                if (!this.length || isEmpty(names) || !names.length) {
                    return this;
                }

                _removeClasses(this, names);

                return this;
            }

            if (isString(names)) {
                var name = names;
                if (!this.length || isEmpty(name) || !name.length) {
                    return this;
                }

                var names = split(name);
                if (!names.length) {
                    return this;
                }

                _removeClasses(this, names);

                return this;
            }

            // fallback
            return this;
        },

        toggleClass: function toggleClass(names, shouldAdd) {
            if (!arguments.length) {
                return this;
            }

            if (!this.length || isEmpty(names) || !names.length) {
                return this;
            }

            names = split(names);
            if (!names.length) {
                return this;
            }

            if (shouldAdd === undefined) {
                _toggleClasses(this, names);
            } else if (shouldAdd) {
                _addClasses(this, names);
            } else {
                _removeClasses(this, names);
            }

            return this;
        }
    }
};

},{"NODE_TYPE/ELEMENT":8,"_":12,"is/array":14,"is/string":29,"string/isEmpty":61,"string/split":63}],43:[function(require,module,exports){
'use strict';

var _ = require('_'),
    toPx = require('util/toPx'),
    split = require('util/split'),
    exists = require('is/exists'),
    isAttached = require('is/attached'),
    isElement = require('is/element'),
    isDocument = require('is/document'),
    isWindow = require('is/window'),
    isString = require('is/string'),
    isNumber = require('is/number'),
    isBoolean = require('is/boolean'),
    isObject = require('is/object'),
    isArray = require('is/array'),
    parseNum = require('util/parseInt'),
    DOCUMENT = require('NODE_TYPE/DOCUMENT'),
    REGEX = require('REGEX');

var swapSettings = {
    measureDisplay: {
        display: 'block',
        position: 'absolute',
        visibility: 'hidden'
    }
};

var getDocumentDimension = function getDocumentDimension(elem, name) {
    // Either scroll[Width/Height] or offset[Width/Height] or
    // client[Width/Height], whichever is greatest
    var doc = elem.documentElement;
    return Math.max(elem.body['scroll' + name], elem.body['offset' + name], doc['scroll' + name], doc['offset' + name], doc['client' + name]);
};

var hide = function hide(elem) {
    elem.style.display = 'none';
},
    show = function show(elem) {
    elem.style.display = '';
},
    cssSwap = function cssSwap(elem, options, callback) {
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

// Avoids an 'Illegal Invocation' error (Chrome)
// Avoids a 'TypeError: Argument 1 of Window.getComputedStyle does not implement interface Element' error (Firefox)
getComputedStyle = function getComputedStyle(elem) {
    return isElement(elem) && !isWindow(elem) && !isDocument(elem) ? window.getComputedStyle(elem) : null;
},
    _width = {
    get: function get(elem) {
        if (isWindow(elem)) {
            return elem.document.documentElement.clientWidth;
        }

        if (elem.nodeType === DOCUMENT) {
            return getDocumentDimension(elem, 'Width');
        }

        var width = elem.offsetWidth;
        if (width === 0) {
            var computedStyle = getComputedStyle(elem);
            if (!computedStyle) {
                return 0;
            }
            if (REGEX.isNoneOrTable(computedStyle.display)) {
                return cssSwap(elem, swapSettings.measureDisplay, function () {
                    return getWidthOrHeight(elem, 'width');
                });
            }
        }

        return getWidthOrHeight(elem, 'width');
    },
    set: function set(elem, val) {
        elem.style.width = isNumber(val) ? toPx(val < 0 ? 0 : val) : val;
    }
},
    _height = {
    get: function get(elem) {
        if (isWindow(elem)) {
            return elem.document.documentElement.clientHeight;
        }

        if (elem.nodeType === DOCUMENT) {
            return getDocumentDimension(elem, 'Height');
        }

        var height = elem.offsetHeight;
        if (height === 0) {
            var computedStyle = getComputedStyle(elem);
            if (!computedStyle) {
                return 0;
            }
            if (REGEX.isNoneOrTable(computedStyle.display)) {
                return cssSwap(elem, swapSettings.measureDisplay, function () {
                    return getWidthOrHeight(elem, 'height');
                });
            }
        }

        return getWidthOrHeight(elem, 'height');
    },

    set: function set(elem, val) {
        elem.style.height = isNumber(val) ? toPx(val < 0 ? 0 : val) : val;
    }
};

var getWidthOrHeight = function getWidthOrHeight(elem, name) {

    // Start with offset property, which is equivalent to the border-box value
    var valueIsBorderBox = true,
        val = name === 'width' ? elem.offsetWidth : elem.offsetHeight,
        styles = getComputedStyle(elem),
        isBorderBox = styles.boxSizing === 'border-box';

    // some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if (val <= 0 || !exists(val)) {
        // Fall back to computed then uncomputed css if necessary
        val = curCss(elem, name, styles);
        if (val < 0 || !val) {
            val = elem.style[name];
        }

        // Computed unit is not pixels. Stop here and return.
        if (REGEX.numNotPx(val)) {
            return val;
        }

        // we need the check for style in case a browser which returns unreliable values
        // for getComputedStyle silently falls back to the reliable elem.style
        valueIsBorderBox = isBorderBox && val === styles[name];

        // Normalize '', auto, and prepare for extra
        val = parseFloat(val) || 0;
    }

    // use the active box-sizing model to add/subtract irrelevant styles
    return toPx(val + augmentBorderBoxWidthOrHeight(elem, name, isBorderBox ? 'border' : 'content', valueIsBorderBox, styles));
};

var CSS_EXPAND = split('Top|Right|Bottom|Left');
var augmentBorderBoxWidthOrHeight = function augmentBorderBoxWidthOrHeight(elem, name, extra, isBorderBox, styles) {
    var val = 0,

    // If we already have the right measurement, avoid augmentation
    idx = extra === (isBorderBox ? 'border' : 'content') ? 4 :
    // Otherwise initialize for horizontal or vertical properties
    name === 'width' ? 1 : 0,
        type,

    // Pulled out of the loop to reduce string comparisons
    extraIsMargin = extra === 'margin',
        extraIsContent = !extraIsMargin && extra === 'content',
        extraIsPadding = !extraIsMargin && !extraIsContent && extra === 'padding';

    for (; idx < 4; idx += 2) {
        type = CSS_EXPAND[idx];

        // both box models exclude margin, so add it if we want it
        if (extraIsMargin) {
            val += parseNum(styles[extra + type]) || 0;
        }

        if (isBorderBox) {

            // border-box includes padding, so remove it if we want content
            if (extraIsContent) {
                val -= parseNum(styles['padding' + type]) || 0;
            }

            // at this point, extra isn't border nor margin, so remove border
            if (!extraIsMargin) {
                val -= parseNum(styles['border' + type + 'Width']) || 0;
            }
        } else {

            // at this point, extra isn't content, so add padding
            val += parseNum(styles['padding' + type]) || 0;

            // at this point, extra isn't content nor padding, so add border
            if (extraIsPadding) {
                val += parseNum(styles['border' + type]) || 0;
            }
        }
    }

    return val;
};

var getPropertyValue = function getPropertyValue(styles, name) {
    return styles.getPropertyValue(name);
};

var curCss = function curCss(elem, name, computed) {
    var style = elem.style,
        styles = computed || getComputedStyle(elem),
        ret = styles ? getPropertyValue(styles, name) || styles[name] : undefined;

    // Avoid setting ret to empty string here
    // so we don't default to auto
    if (!exists(ret) && style && style[name]) {
        ret = style[name];
    }

    // From the hack by Dean Edwards
    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    if (styles) {
        if (ret === '' && !isAttached(elem)) {
            ret = elem.style[name];
        }

        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        // but not position css attributes, as those are proportional to the parent element instead
        // and we can't measure the parent instead because it might trigger a 'stacking dolls' problem
        if (REGEX.numNotPx(ret) && !REGEX.position(name)) {

            // Remember the original values
            var left = style.left,
                rs = elem.runtimeStyle,
                rsLeft = rs && rs.left;

            // Put in the new values to get a computed value out
            if (rsLeft) {
                rs.left = elem.currentStyle.left;
            }

            style.left = name === 'fontSize' ? '1em' : ret;
            ret = toPx(style.pixelLeft);

            // Revert the changed values
            style.left = left;
            if (rsLeft) {
                rs.left = rsLeft;
            }
        }
    }

    return ret === undefined ? ret : ret + '' || 'auto';
};

var normalizeCssKey = function normalizeCssKey(name) {
    return REGEX.camelCase(name);
};

var setStyle = function setStyle(elem, name, value) {
    name = normalizeCssKey(name);
    elem.style[name] = value === +value ? toPx(value) : value;
};

var getStyle = function getStyle(elem, name) {
    name = normalizeCssKey(name);
    return getComputedStyle(elem)[name];
};

var isHidden = function isHidden(elem) {
    // Standard:
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetParent
    return elem.offsetParent === null ||
    // Support: Opera <= 12.12
    // Opera reports offsetWidths and offsetHeights less than zero on some elements
    elem.offsetWidth <= 0 && elem.offsetHeight <= 0 || (elem.style && elem.style.display ? elem.style.display === 'none' : false);
};

module.exports = {
    swap: cssSwap,
    swapSetting: swapSettings,
    curCss: curCss,
    width: _width,
    height: _height,

    fn: {
        css: function css(name, value) {
            if (arguments.length === 2) {
                var idx = 0,
                    length = this.length;
                for (; idx < length; idx++) {
                    setStyle(this[idx], name, value);
                }
                return this;
            }

            if (isObject(name)) {
                var obj = name;
                var idx = 0,
                    length = this.length,
                    key;
                for (; idx < length; idx++) {
                    for (key in obj) {
                        setStyle(this[idx], key, obj[key]);
                    }
                }
                return this;
            }

            if (isArray(name)) {
                var arr = name;
                var first = this[0];
                if (!first) {
                    return;
                }

                var ret = {},
                    idx = arr.length,
                    value;
                if (!idx) {
                    return ret;
                } // return early

                while (idx--) {
                    value = arr[idx];
                    if (!isString(value)) {
                        return;
                    }
                    ret[value] = getStyle(first);
                }

                return ret;
            }

            // fallback
            return this;
        },

        hide: (function (_hide) {
            function hide() {
                return _hide.apply(this, arguments);
            }

            hide.toString = function () {
                return _hide.toString();
            };

            return hide;
        })(function () {
            return _.each(this, hide);
        }),
        show: (function (_show) {
            function show() {
                return _show.apply(this, arguments);
            }

            show.toString = function () {
                return _show.toString();
            };

            return show;
        })(function () {
            return _.each(this, show);
        }),

        toggle: function toggle(state) {
            if (isBoolean(state)) {
                return state ? this.show() : this.hide();
            }

            return _.each(this, function (elem) {
                return isHidden(elem) ? show(elem) : hide(elem);
            });
        }
    }
};

// Fallback

},{"NODE_TYPE/DOCUMENT":6,"REGEX":10,"_":12,"is/array":14,"is/attached":16,"is/boolean":17,"is/document":20,"is/element":21,"is/exists":22,"is/number":26,"is/object":27,"is/string":29,"is/window":30,"util/parseInt":64,"util/split":66,"util/toPx":67}],44:[function(require,module,exports){
'use strict';

var cache = require('cache')(2, true),
    isString = require('is/string'),
    isArray = require('is/array'),
    isElement = require('is/element'),
    ACCESSOR = '__D_id__ ',
    uniqueId = require('util/uniqueId').seed(Date.now()),
    getId = function getId(elem) {
    return elem ? elem[ACCESSOR] : null;
},
    getOrSetId = function getOrSetId(elem) {
    var id;
    if (!elem || (id = elem[ACCESSOR])) {
        return id;
    }
    elem[ACCESSOR] = id = uniqueId();
    return id;
},
    getAllData = function getAllData(elem) {
    var id;
    if (!(id = getId(elem))) {
        return;
    }
    return cache.get(id);
},
    getData = function getData(elem, key) {
    var id;
    if (!(id = getId(elem))) {
        return;
    }
    return cache.get(id, key);
},
    hasData = function hasData(elem) {
    var id;
    if (!(id = getId(elem))) {
        return false;
    }
    return cache.has(id);
},
    setData = function setData(elem, key, value) {
    var id = getOrSetId(elem);
    return cache.set(id, key, value);
},
    removeAllData = function removeAllData(elem) {
    var id;
    if (!(id = getId(elem))) {
        return;
    }
    cache.remove(id);
},
    removeData = function removeData(elem, key) {
    var id;
    if (!(id = getId(elem))) {
        return;
    }
    cache.remove(id, key);
};

module.exports = {
    has: hasData,
    set: setData,
    get: function get(elem, str) {
        if (str === undefined) {
            return getAllData(elem);
        }
        return getData(elem, str);
    },
    remove: function remove(elem, str) {
        if (str === undefined) {
            return removeAllData(elem);
        }
        return removeData(elem, str);
    },

    D: {
        // NOTE: NodeList || HtmlCollection support?
        data: function data(elem, key, value) {
            if (arguments.length === 3) {
                return setData(elem, key, value);
            }

            if (arguments.length === 2) {
                if (isString(key)) {
                    return getData(elem, key);
                }

                // object passed
                var map = key;
                var id;
                if (!(id = getId(elem))) {
                    return;
                }
                var key;
                for (key in map) {
                    cache.set(id, key, map[key]);
                }
                return map;
            }

            if (isElement(elem)) {
                return getAllData(elem);
            }

            // fallback
            return this;
        },

        hasData: (function (_hasData) {
            function hasData(_x) {
                return _hasData.apply(this, arguments);
            }

            hasData.toString = function () {
                return _hasData.toString();
            };

            return hasData;
        })(function (elem) {
            if (isElement(elem)) {
                return hasData(elem);
            }
            return this;
        }),

        removeData: (function (_removeData) {
            function removeData(_x2, _x3) {
                return _removeData.apply(this, arguments);
            }

            removeData.toString = function () {
                return _removeData.toString();
            };

            return removeData;
        })(function (elem, key) {
            if (arguments.length === 2) {
                // Remove single key
                if (isString(key)) {
                    return removeData(elem, key);
                }

                // Remove multiple keys
                var array = key;
                var id;
                if (!(id = getId(elem))) {
                    return;
                }
                var idx = array.length;
                while (idx--) {
                    cache.remove(id, array[idx]);
                }
            }

            if (isElement(elem)) {
                return removeAllData(elem);
            }

            // fallback
            return this;
        })
    },

    fn: {
        data: function data(key, value) {
            // Get all data
            if (!arguments.length) {
                var first = this[0],
                    id;
                if (!first || !(id = getId(first))) {
                    return;
                }
                return cache.get(id);
            }

            if (arguments.length === 1) {
                // Get key
                if (isString(key)) {
                    var first = this[0],
                        id;
                    if (!first || !(id = getId(first))) {
                        return;
                    }
                    return cache.get(id, key);
                }

                // Set values from hash map
                var map = key,
                    idx = this.length,
                    id,
                    key,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!isElement(elem)) {
                        continue;
                    }

                    id = getOrSetId(this[idx]);
                    for (key in map) {
                        cache.set(id, key, map[key]);
                    }
                }
                return map;
            }

            // Set key's value
            if (arguments.length === 2) {
                var idx = this.length,
                    id,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!isElement(elem)) {
                        continue;
                    }

                    id = getOrSetId(this[idx]);
                    cache.set(id, key, value);
                }
                return this;
            }

            // fallback
            return this;
        },

        // NOTE: NodeList || HtmlCollection support?
        removeData: function removeData(value) {
            // Remove all data
            if (!arguments.length) {
                var idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = getId(elem))) {
                        continue;
                    }
                    cache.remove(id);
                }
                return this;
            }

            // Remove single key
            if (isString(value)) {
                var key = value,
                    idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = getId(elem))) {
                        continue;
                    }
                    cache.remove(id, key);
                }
                return this;
            }

            // Remove multiple keys
            if (isArray(value)) {
                var array = value,
                    elemIdx = this.length,
                    elem,
                    id;
                while (elemIdx--) {
                    elem = this[elemIdx];
                    if (!(id = getId(elem))) {
                        continue;
                    }
                    var arrIdx = array.length;
                    while (arrIdx--) {
                        cache.remove(id, array[arrIdx]);
                    }
                }
                return this;
            }

            // fallback
            return this;
        }
    }
};

},{"cache":13,"is/array":14,"is/element":21,"is/string":29,"util/uniqueId":68}],45:[function(require,module,exports){
'use strict';

var parseNum = require('util/parseInt'),
    isNumber = require('is/number'),
    css = require('./css');

var getInnerWidth = function getInnerWidth(elem) {
    var width = parseFloat(css.width.get(elem)) || 0;

    return width + (parseNum(css.curCss(elem, 'paddingLeft')) || 0) + (parseNum(css.curCss(elem, 'paddingRight')) || 0);
},
    getInnerHeight = function getInnerHeight(elem) {
    var height = parseFloat(css.height.get(elem)) || 0;

    return height + (parseNum(css.curCss(elem, 'paddingTop')) || 0) + (parseNum(css.curCss(elem, 'paddingBottom')) || 0);
},
    getOuterWidth = function getOuterWidth(elem, withMargin) {
    var width = getInnerWidth(elem);

    if (withMargin) {
        width += (parseNum(css.curCss(elem, 'marginLeft')) || 0) + (parseNum(css.curCss(elem, 'marginRight')) || 0);
    }

    return width + (parseNum(css.curCss(elem, 'borderLeftWidth')) || 0) + (parseNum(css.curCss(elem, 'borderRightWidth')) || 0);
},
    getOuterHeight = function getOuterHeight(elem, withMargin) {
    var height = getInnerHeight(elem);

    if (withMargin) {
        height += (parseNum(css.curCss(elem, 'marginTop')) || 0) + (parseNum(css.curCss(elem, 'marginBottom')) || 0);
    }

    return height + (parseNum(css.curCss(elem, 'borderTopWidth')) || 0) + (parseNum(css.curCss(elem, 'borderBottomWidth')) || 0);
};

module.exports = {
    fn: {
        width: function width(val) {
            if (isNumber(val)) {
                var first = this[0];
                if (!first) {
                    return this;
                }

                css.width.set(first, val);
                return this;
            }

            if (arguments.length) {
                return this;
            }

            // fallback
            var first = this[0];
            if (!first) {
                return null;
            }

            return parseFloat(css.width.get(first) || 0);
        },

        height: function height(val) {
            if (isNumber(val)) {
                var first = this[0];
                if (!first) {
                    return this;
                }

                css.height.set(first, val);
                return this;
            }

            if (arguments.length) {
                return this;
            }

            // fallback
            var first = this[0];
            if (!first) {
                return null;
            }

            return parseFloat(css.height.get(first) || 0);
        },

        innerWidth: function innerWidth() {
            if (arguments.length) {
                return this;
            }

            var first = this[0];
            if (!first) {
                return this;
            }

            return getInnerWidth(first);
        },

        innerHeight: function innerHeight() {
            if (arguments.length) {
                return this;
            }

            var first = this[0];
            if (!first) {
                return this;
            }

            return getInnerHeight(first);
        },

        outerWidth: function outerWidth(withMargin) {
            if (arguments.length && withMargin === undefined) {
                return this;
            }

            var first = this[0];
            if (!first) {
                return this;
            }

            return getOuterWidth(first, !!withMargin);
        },

        outerHeight: function outerHeight(withMargin) {
            if (arguments.length && withMargin === undefined) {
                return this;
            }

            var first = this[0];
            if (!first) {
                return this;
            }

            return getOuterHeight(first, !!withMargin);
        }
    }
};

},{"./css":43,"is/number":26,"util/parseInt":64}],46:[function(require,module,exports){
'use strict';

var handlers = {};

var register = function register(name, type, filter) {
    handlers[name] = {
        event: type,
        filter: filter,
        wrap: function wrap(fn) {
            return wrapper(name, fn);
        }
    };
};

var wrapper = function wrapper(name, fn) {
    if (!fn) {
        return fn;
    }

    var key = '__dce_' + name;
    if (fn[key]) {
        return fn[key];
    }

    return fn[key] = function (e) {
        var match = handlers[name].filter(e);
        if (match) {
            return fn.apply(this, arguments);
        }
    };
};

register('left-click', 'click', function (e) {
    return e.which === 1 && !e.metaKey && !e.ctrlKey;
});
register('middle-click', 'click', function (e) {
    return e.which === 2 && !e.metaKey && !e.ctrlKey;
});
register('right-click', 'click', function (e) {
    return e.which === 3 && !e.metaKey && !e.ctrlKey;
});

module.exports = {
    register: register,
    handlers: handlers
};

},{}],47:[function(require,module,exports){
'use strict';

var crossvent = require('crossvent'),
    exists = require('is/exists'),
    matches = require('matchesSelector'),
    delegates = {};

// this method caches delegates so that .off() works seamlessly
var delegate = function delegate(root, selector, fn) {
    if (delegates[fn._dd]) {
        return delegates[fn._dd];
    }

    var id = fn._dd = Date.now();
    return delegates[id] = function (e) {
        var el = e.target;
        while (el && el !== root) {
            if (matches(el, selector)) {
                fn.apply(this, arguments);
                return;
            }
            el = el.parentElement;
        }
    };
};

var evented = function evented(method, el, type, selector, fn) {
    if (!exists(selector)) {
        method(el, type, fn);
    } else {
        method(el, type, delegate(el, selector, fn));
    }
};

module.exports = {
    on: evented.bind(null, crossvent.add),
    off: evented.bind(null, crossvent.remove),
    trigger: evented.bind(null, crossvent.fabricate)
};

},{"crossvent":2,"is/exists":22,"matchesSelector":31}],48:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isFunction = require('is/function'),
    delegate = require('./delegate'),
    custom = require('./custom');

var eventer = function eventer(method) {
    return function (types, filter, fn) {
        var typelist = types.split(' ');
        if (!isFunction(fn)) {
            fn = filter;
            filter = null;
        }
        _.each(this, function (elem) {
            _.each(typelist, function (type) {
                var handler = custom.handlers[type];
                if (handler) {
                    method(elem, handler.event, filter, handler.wrap(fn));
                } else {
                    method(elem, type, filter, fn);
                }
            });
        });
        return this;
    };
};

module.exports = {
    fn: {
        on: eventer(delegate.on),
        off: eventer(delegate.off),
        trigger: eventer(delegate.trigger)
    }
};

},{"./custom":46,"./delegate":47,"_":12,"is/function":23}],49:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isD = require('is/d'),
    isElement = require('is/element'),
    isHtml = require('is/html'),
    isString = require('is/string'),
    isNodeList = require('is/nodeList'),
    isNumber = require('is/number'),
    isFunction = require('is/function'),
    isCollection = require('is/collection'),
    isD = require('is/d'),
    isWindow = require('is/window'),
    isDocument = require('is/document'),
    selectors = require('./selectors'),
    array = require('./array'),
    order = require('../order'),
    data = require('./data'),
    parser = require('./parser/parser');

var empty = function empty(arr) {
    var idx = 0,
        length = arr.length;
    for (; idx < length; idx++) {

        var elem = arr[idx],
            descendants = elem.querySelectorAll('*'),
            i = descendants.length,
            desc;
        while (i--) {
            desc = descendants[i];
            data.remove(desc);
        }

        elem.innerHTML = '';
    }
},
    remove = function remove(arr) {
    var idx = 0,
        length = arr.length,
        elem,
        parent;
    for (; idx < length; idx++) {
        elem = arr[idx];
        if (elem && (parent = elem.parentNode)) {
            data.remove(elem);
            parent.removeChild(elem);
        }
    }
},
    detach = function detach(arr) {
    var idx = 0,
        length = arr.length,
        elem,
        parent;
    for (; idx < length; idx++) {
        elem = arr[idx];
        if (elem && (parent = elem.parentNode)) {
            parent.removeChild(elem);
        }
    }
},
    clone = function clone(elem) {
    return elem.cloneNode(true);
},
    stringToFrag = function stringToFrag(str) {
    var frag = document.createDocumentFragment();
    frag.textContent = str;
    return frag;
},
    appendPrependFunc = function appendPrependFunc(d, fn, pender) {
    _.each(d, function (elem, idx) {
        var result = fn.call(elem, idx, elem.innerHTML);

        // do nothing
        if (!exists(result)) {
            return;
        }

        if (isString(result)) {

            if (isHtml(elem)) {
                appendPrependArrayToElem(elem, parser.parseHtml(elem), pender);
                return this;
            }

            pender(elem, stringToFrag(result));
        } else if (isElement(result)) {

            pender(elem, result);
        } else if (isNodeList(result) || isD(result)) {

            appendPrependArrayToElem(elem, result, pender);
        }

        // do nothing
    });
},
    appendPrependMergeArray = function appendPrependMergeArray(arrOne, arrTwo, pender) {
    var idx = 0,
        length = arrOne.length;
    for (; idx < length; idx++) {
        var i = 0,
            len = arrTwo.length;
        for (; i < len; i++) {
            pender(arrOne[idx], arrTwo[i]);
        }
    }
},
    appendPrependElemToArray = function appendPrependElemToArray(arr, elem, pender) {
    _.each(arr, function (arrElem) {
        pender(arrElem, elem);
    });
},
    appendPrependArrayToElem = function appendPrependArrayToElem(elem, arr, pender) {
    _.each(arr, function (arrElem) {
        pender(elem, arrElem);
    });
},
    append = function append(base, elem) {
    if (!base || !elem || !isElement(elem)) {
        return;
    }
    base.appendChild(elem);
},
    prepend = function prepend(base, elem) {
    if (!base || !elem || !isElement(elem)) {
        return;
    }
    base.insertBefore(elem, base.firstChild);
};

module.exports = {
    append: append,
    prepend: prepend,

    fn: {
        clone: (function (_clone) {
            function clone() {
                return _clone.apply(this, arguments);
            }

            clone.toString = function () {
                return _clone.toString();
            };

            return clone;
        })(function () {
            return _.fastmap(this.slice(), function (elem) {
                return clone(elem);
            });
        }),

        append: (function (_append) {
            function append(_x) {
                return _append.apply(this, arguments);
            }

            append.toString = function () {
                return _append.toString();
            };

            return append;
        })(function (value) {
            if (isString(value)) {
                if (isHtml(value)) {
                    appendPrependMergeArray(this, parser.parseHtml(value), append);
                    return this;
                }

                appendPrependElemToArray(this, stringToFrag(value), append);

                return this;
            }

            if (isNumber(value)) {
                appendPrependElemToArray(this, stringToFrag('' + value), append);
                return this;
            }

            if (isFunction(value)) {
                var fn = value;
                appendPrependFunc(this, fn, append);
                return this;
            }

            if (isElement(value)) {
                var elem = value;
                appendPrependElemToArray(this, elem, append);
                return this;
            }

            if (isCollection(value)) {
                var arr = value;
                appendPrependMergeArray(this, arr, append);
                return this;
            }
        }),

        before: function before(element) {
            var target = this[0];
            if (!target) {
                return this;
            }

            var parent = target.parentNode;
            if (!parent) {
                return this;
            }

            if (isElement(element) || isString(element)) {
                element = D(element);
            }

            if (isD(element)) {
                element.each(function () {
                    parent.insertBefore(this, target);
                });
            }

            // fallback
            return this;
        },

        after: function after(element) {
            var target = this[0];
            if (!target) {
                return this;
            }

            var parent = target.parentNode;
            if (!parent) {
                return this;
            }

            if (isElement(element) || isString(element)) {
                element = D(element);
            }

            if (isD(element)) {
                element.each(function () {
                    parent.insertBefore(this, target.nextSibling);
                });
            }

            // fallback
            return this;
        },

        appendTo: function appendTo(d) {
            if (isD(d)) {
                d.append(this);
                return this;
            }

            // fallback
            var obj = d;
            D(obj).append(this);
            return this;
        },

        prepend: (function (_prepend) {
            function prepend(_x2) {
                return _prepend.apply(this, arguments);
            }

            prepend.toString = function () {
                return _prepend.toString();
            };

            return prepend;
        })(function (value) {
            if (isString(value)) {
                if (isHtml(value)) {
                    appendPrependMergeArray(this, parser.parseHtml(value), prepend);
                    return this;
                }

                appendPrependElemToArray(this, stringToFrag(value), prepend);

                return this;
            }

            if (isNumber(value)) {
                appendPrependElemToArray(this, stringToFrag('' + value), prepend);
                return this;
            }

            if (isFunction(value)) {
                var fn = value;
                appendPrependFunc(this, fn, prepend);
                return this;
            }

            if (isElement(value)) {
                var elem = value;
                appendPrependElemToArray(this, elem, prepend);
                return this;
            }

            if (isCollection(value)) {
                var arr = value;
                appendPrependMergeArray(this, arr, prepend);
                return this;
            }

            // fallback
            return this;
        }),

        prependTo: function prependTo(d) {
            if (isD(d)) {
                d.prepend(this);
                return this;
            }

            // fallback
            var obj = d;
            D(obj).prepend(this);
            return this;
        },

        empty: (function (_empty) {
            function empty() {
                return _empty.apply(this, arguments);
            }

            empty.toString = function () {
                return _empty.toString();
            };

            return empty;
        })(function () {
            empty(this);
            return this;
        }),

        add: function add(selector) {
            // String selector
            if (isString(selector)) {
                var elems = array.unique([].concat(this.get(), D(selector).get()));
                order.sort(elems);
                return D(elems);
            }

            // Array of elements
            if (isCollection(selector)) {
                var arr = selector;
                var elems = array.unique([].concat(this.get(), _.toArray(arr)));
                order.sort(elems);
                return D(elems);
            }

            // Single element
            if (isWindow(selector) || isDocument(selector) || isElement(selector)) {
                var elem = selector;
                var elems = array.unique([].concat(this.get(), [elem]));
                order.sort(elems);
                return D(elems);
            }

            // fallback
            return D(this);
        },

        remove: (function (_remove) {
            function remove(_x3) {
                return _remove.apply(this, arguments);
            }

            remove.toString = function () {
                return _remove.toString();
            };

            return remove;
        })(function (selector) {
            if (isString(selector)) {
                if (selector === '') {
                    return;
                }
                var arr = selectors.filter(this, selector);
                remove(arr);
                return this;
            }

            // fallback
            remove(this);
            return this;
        }),

        detach: (function (_detach) {
            function detach(_x4) {
                return _detach.apply(this, arguments);
            }

            detach.toString = function () {
                return _detach.toString();
            };

            return detach;
        })(function (selector) {
            if (isString(selector)) {
                if (selector === '') {
                    return;
                }
                var arr = selectors.filter(this, selector);
                detach(arr);
                return this;
            }

            // fallback
            detach(this);
            return this;
        })
    }
};

},{"../order":60,"./array":40,"./data":44,"./parser/parser":51,"./selectors":54,"_":12,"is/collection":18,"is/d":19,"is/document":20,"is/element":21,"is/exists":22,"is/function":23,"is/html":24,"is/nodeList":25,"is/number":26,"is/string":29,"is/window":30}],50:[function(require,module,exports){
'use strict';

var isReady = false,
    registration = [];

var bind = function bind(fn) {
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
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState === 'interactive') {
            fn();
        }
    });

    // A fallback to window.onload, that will always work
    window.attachEvent('onload', fn);
};

var makeCalls = function makeCalls() {
    var idx = 0,
        length = registration.length;
    for (; idx < length; idx++) {
        registration[idx]();
    }
    registration.length = 0;
};

bind(function () {
    isReady = true;
    makeCalls();
});

module.exports = function (callback) {
    if (isReady) {
        callback();
    } else {
        registration.push(callback);
    }

    return this;
};

},{}],51:[function(require,module,exports){
'use strict';

var REGEX = require('REGEX'),
    MAX_SINGLE_TAG_LENGTH = 30;

var parseString = function parseString(parentTagName, htmlStr) {
    var parent = document.createElement(parentTagName);
    parent.innerHTML = htmlStr;
    return parent;
};

var parseSingleTag = function parseSingleTag(htmlStr) {
    if (htmlStr.length > MAX_SINGLE_TAG_LENGTH) {
        return null;
    }

    var singleTagMatch = REGEX.singleTagMatch(htmlStr);
    if (!singleTagMatch) {
        return null;
    }

    var elem = document.createElement(singleTagMatch[1]);

    return [elem];
};

var parse = function parse(htmlStr) {
    var singleTag = parseSingleTag(htmlStr);
    if (singleTag) {
        return singleTag;
    }

    var parentTagName = REGEX.getParentTagName(htmlStr),
        parent = parseString(parentTagName, htmlStr);

    var child,
        idx = parent.children.length,
        arr = [];

    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);

        // http://jsperf.com/js-push-vs-index11/2
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};

var parseHtml = function parseHtml(str) {
    if (!str) {
        return null;
    }
    var result = parse(str);
    if (!result || !result.length) {
        return null;
    }
    return D(result);
};

module.exports = {
    parseHtml: parse,

    // Top-level functions attached directly to D.
    // Invoked via `D.parseHTML('...')`, as opposed to `D('div').parseHTML('...')`.
    D: {
        parseHtml: parseHtml,
        // Because no one know what the case should be
        parseHTML: parseHtml
    }
};

},{"REGEX":10}],52:[function(require,module,exports){
'use strict';

var _ = require('_'),
    toPx = require('util/toPx'),
    exists = require('is/exists'),
    isAttached = require('is/attached'),
    isFunction = require('is/function'),
    isObject = require('is/object'),
    isNodeName = require('node/isName'),
    docElem = document.documentElement;

var getPosition = function getPosition(elem) {
    return {
        top: elem.offsetTop || 0,
        left: elem.offsetLeft || 0
    };
};

var getOffset = function getOffset(elem) {
    var rect = isAttached(elem) ? elem.getBoundingClientRect() : {};

    return {
        top: rect.top + document.body.scrollTop || 0,
        left: rect.left + document.body.scrollLeft || 0
    };
};

var setOffset = function setOffset(elem, idx, pos) {
    var position = elem.style.position || 'static',
        props = {};

    // set position first, in-case top/left are set even on static elem
    if (position === 'static') {
        elem.style.position = 'relative';
    }

    var curOffset = getOffset(elem),
        curCSSTop = elem.style.top,
        curCSSLeft = elem.style.left,
        calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop === 'auto' || curCSSLeft === 'auto');

    if (isFunction(pos)) {
        pos = pos.call(elem, idx, curOffset);
    }

    var curTop, curLeft;
    // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
    if (calculatePosition) {
        var curPosition = getPosition(elem);
        curTop = curPosition.top;
        curLeft = curPosition.left;
    } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
    }

    if (exists(pos.top)) {
        props.top = pos.top - curOffset.top + curTop;
    }
    if (exists(pos.left)) {
        props.left = pos.left - curOffset.left + curLeft;
    }

    elem.style.top = toPx(props.top);
    elem.style.left = toPx(props.left);
};

module.exports = {
    fn: {
        position: function position() {
            var first = this[0];
            if (!first) {
                return;
            }

            return getPosition(first);
        },

        offset: function offset(posOrIterator) {

            if (!arguments.length) {
                var first = this[0];
                if (!first) {
                    return;
                }
                return getOffset(first);
            }

            if (isFunction(posOrIterator) || isObject(posOrIterator)) {
                return _.each(this, function (elem, idx) {
                    return setOffset(elem, idx, posOrIterator);
                });
            }

            // fallback
            return this;
        },

        offsetParent: function offsetParent() {
            return D(_.map(this, function (elem) {
                var offsetParent = elem.offsetParent || docElem;

                while (offsetParent && (!isNodeName(offsetParent, 'html') && (offsetParent.style.position || 'static') === 'static')) {
                    offsetParent = offsetParent.offsetParent;
                }

                return offsetParent || docElem;
            }));
        }
    }
};

},{"_":12,"is/attached":16,"is/exists":22,"is/function":23,"is/object":27,"node/isName":58,"util/toPx":67}],53:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isString = require('is/string'),
    isFunction = require('is/function'),
    parseNum = require('util/parseInt'),
    split = require('util/split'),
    SUPPORTS = require('SUPPORTS'),
    TEXT = require('NODE_TYPE/TEXT'),
    COMMENT = require('NODE_TYPE/COMMENT'),
    ATTRIBUTE = require('NODE_TYPE/ATTRIBUTE'),
    REGEX = require('REGEX');

var propFix = split('tabIndex|readOnly|className|maxLength|cellSpacing|cellPadding|rowSpan|colSpan|useMap|frameBorder|contentEditable').reduce(function (obj, str) {
    obj[str.toLowerCase()] = str;
    return obj;
}, {
    'for': 'htmlFor',
    'class': 'className'
});

var propHooks = {
    src: SUPPORTS.hrefNormalized ? {} : {
        get: function get(elem) {
            return elem.getAttribute('src', 4);
        }
    },

    href: SUPPORTS.hrefNormalized ? {} : {
        get: function get(elem) {
            return elem.getAttribute('href', 4);
        }
    },

    // Support: Safari, IE9+
    // mis-reports the default selected property of an option
    // Accessing the parent's selectedIndex property fixes it
    selected: SUPPORTS.optSelected ? {} : {
        get: function get(elem) {
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
        get: function get(elem) {
            // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
            // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
            // Use proper attribute retrieval(#12072)
            var tabindex = elem.getAttribute('tabindex');

            if (tabindex) {
                return parseNum(tabindex);
            }

            var nodeName = elem.nodeName;
            return REGEX.isFocusable(nodeName) || REGEX.isClickable(nodeName) && elem.href ? 0 : -1;
        }
    }
};

var getOrSetProp = function getOrSetProp(elem, name, value) {
    var nodeType = elem.nodeType;

    // don't get/set properties on text, comment and attribute nodes
    if (!elem || nodeType === TEXT || nodeType === COMMENT || nodeType === ATTRIBUTE) {
        return;
    }

    // Fix name and attach hooks
    name = propFix[name] || name;
    var hooks = propHooks[name];

    var result;
    if (value !== undefined) {
        return hooks && 'set' in hooks && (result = hooks.set(elem, value, name)) !== undefined ? result : elem[name] = value;
    }

    return hooks && 'get' in hooks && (result = hooks.get(elem, name)) !== null ? result : elem[name];
};

module.exports = {
    fn: {
        prop: (function (_prop) {
            function prop(_x, _x2) {
                return _prop.apply(this, arguments);
            }

            prop.toString = function () {
                return _prop.toString();
            };

            return prop;
        })(function (prop, value) {
            if (arguments.length === 1 && isString(prop)) {
                var first = this[0];
                if (!first) {
                    return;
                }

                return getOrSetProp(first, prop);
            }

            if (isString(prop)) {
                if (isFunction(value)) {
                    var fn = value;
                    return _.each(this, function (elem, idx) {
                        var result = fn.call(elem, idx, getOrSetProp(elem, prop));
                        getOrSetProp(elem, prop, result);
                    });
                }

                return _.each(this, function (elem) {
                    return getOrSetProp(elem, prop, value);
                });
            }

            // fallback
            return this;
        }),

        removeProp: function removeProp(prop) {
            if (!isString(prop)) {
                return this;
            }

            var name = propFix[prop] || prop;
            return _.each(this, function (elem) {
                delete elem[name];
            });
        }
    }
};

},{"NODE_TYPE/ATTRIBUTE":4,"NODE_TYPE/COMMENT":5,"NODE_TYPE/TEXT":9,"REGEX":10,"SUPPORTS":11,"_":12,"is/function":23,"is/string":29,"util/parseInt":64,"util/split":66}],54:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isSelector = require('is/selector'),
    isCollection = require('is/collection'),
    isFunction = require('is/function'),
    isElement = require('is/element'),
    isNodeList = require('is/nodeList'),
    isArray = require('is/array'),
    isString = require('is/string'),
    isD = require('is/d'),
    array = require('./array'),
    order = require('../order'),
    Fizzle = require('./Fizzle');

/**
 * @param {String|Function|Element|NodeList|Array|D} selector
 * @param {D} context
 * @returns {Element[]}
 * @private
 */
var findWithin = function findWithin(selector, context) {
    // Fail fast
    if (!context.length) {
        return [];
    }

    var query, descendants, results;

    if (isElement(selector) || isNodeList(selector) || isArray(selector) || isD(selector)) {
        // Convert selector to an array of elements
        selector = isElement(selector) ? [selector] : selector;

        descendants = _.flatten(_.map(context, function (elem) {
            return elem.querySelectorAll('*');
        }));
        results = _.filter(descendants, function (descendant) {
            return _.contains(selector, descendant);
        });
    } else {
        query = Fizzle.query(selector);
        results = query.exec(context);
    }

    return results;
};

var filter = function filter(arr, qualifier) {
    // Early return, no qualifier. Everything matches
    if (!qualifier) {
        return arr;
    }

    // Function
    if (isFunction(qualifier)) {
        return _.filter(arr, qualifier);
    }

    // Element
    if (qualifier.nodeType) {
        return _.filter(arr, function (elem) {
            return elem === qualifier;
        });
    }

    // Selector
    if (isString(qualifier)) {
        var is = Fizzle.is(qualifier);
        return _.filter(arr, function (elem) {
            return is.match(elem);
        });
    }

    // Array qualifier
    return _.filter(arr, function (elem) {
        return _.contains(qualifier, elem);
    });
};

module.exports = {
    filter: filter,

    fn: {
        has: function has(target) {
            if (!isSelector(target)) {
                return this;
            }

            var targets = this.find(target),
                idx,
                len = targets.length;

            return D(_.filter(this, function (elem) {
                for (idx = 0; idx < len; idx++) {
                    if (order.contains(elem, targets[idx])) {
                        return true;
                    }
                }
                return false;
            }));
        },

        is: function is(selector) {
            if (isString(selector)) {
                if (selector === '') {
                    return false;
                }

                return Fizzle.is(selector).any(this);
            }

            if (isCollection(selector)) {
                var arr = selector;
                return _.any(this, function (elem) {
                    return _.contains(arr, elem);
                });
            }

            if (isFunction(selector)) {
                var iterator = selector;
                return _.any(this, function (elem, idx) {
                    return !!iterator.call(elem, idx);
                });
            }

            if (isElement(selector)) {
                var context = selector;
                return _.any(this, function (elem) {
                    return elem === context;
                });
            }

            // fallback
            return false;
        },

        not: function not(selector) {
            if (isString(selector)) {
                if (selector === '') {
                    return this;
                }

                var is = Fizzle.is(selector);
                return D(is.not(this));
            }

            if (isCollection(selector)) {
                var arr = _.toArray(selector);
                return D(_.filter(this, function (elem) {
                    return !_.contains(arr, elem);
                }));
            }

            if (isFunction(selector)) {
                var iterator = selector;
                return D(_.filter(this, function (elem, idx) {
                    return !iterator.call(elem, idx);
                }));
            }

            if (isElement(selector)) {
                var context = selector;
                return D(_.filter(this, function (elem) {
                    return elem !== context;
                }));
            }

            // fallback
            return this;
        },

        find: function find(selector) {
            if (!isSelector(selector)) {
                return this;
            }

            var result = findWithin(selector, this);
            if (this.length > 1) {
                array.elementSort(result);
            }
            return _.merge(D(), result);
        },

        filter: function filter(selector) {
            if (isString(selector)) {
                if (selector === '') {
                    return D();
                }

                var is = Fizzle.is(selector);
                return D(_.filter(this, function (elem) {
                    return is.match(elem);
                }));
            }

            if (isCollection(selector)) {
                var arr = selector;
                return D(_.filter(this, function (elem) {
                    return _.contains(arr, elem);
                }));
            }

            if (isElement(selector)) {
                var context = selector;
                return D(_.filter(this, function (elem) {
                    return elem === context;
                }));
            }

            if (isFunction(selector)) {
                var checker = selector;
                return D(_.filter(this, function (elem, idx) {
                    return checker.call(elem, elem, idx);
                }));
            }

            // fallback
            return D();
        }
    }
};

},{"../order":60,"./Fizzle":35,"./array":40,"_":12,"is/array":14,"is/collection":18,"is/d":19,"is/element":21,"is/function":23,"is/nodeList":25,"is/selector":28,"is/string":29}],55:[function(require,module,exports){
'use strict';

var _ = require('_'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),
    DOCUMENT = require('NODE_TYPE/DOCUMENT'),
    DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT'),
    isString = require('is/string'),
    isAttached = require('is/attached'),
    isElement = require('is/element'),
    isWindow = require('is/window'),
    isDocument = require('is/document'),
    isD = require('is/d'),
    array = require('./array'),
    selectors = require('./selectors'),
    Fizzle = require('./Fizzle');

var getSiblings = function getSiblings(context) {
    var idx = 0,
        len = context.length,
        result = [];
    for (; idx < len; idx++) {
        var sibs = _getNodeSiblings(context[idx]);
        if (sibs.length) {
            result.push(sibs);
        }
    }
    return _.flatten(result);
},
    _getNodeSiblings = function _getNodeSiblings(node) {
    var parent = node.parentNode;

    if (!parent) {
        return [];
    }

    var sibs = _.toArray(parent.children),
        idx = sibs.length;

    while (idx--) {
        // Exclude the node itself from the list of its parent's children
        if (sibs[idx] === node) {
            sibs.splice(idx, 1);
        }
    }

    return sibs;
},

// Children ------
getChildren = function getChildren(arr) {
    return _.flatten(_.map(arr, _children));
},
    _children = function _children(elem) {
    var kids = elem.children,
        idx = 0,
        len = kids.length,
        arr = new Array(len);
    for (; idx < len; idx++) {
        arr[idx] = kids[idx];
    }
    return arr;
},

// Parents ------
getClosest = function getClosest(elems, selector, context) {
    var idx = 0,
        len = elems.length,
        parents,
        closest,
        result = [];
    for (; idx < len; idx++) {
        parents = _crawlUpNode(elems[idx], context);
        parents.unshift(elems[idx]);
        closest = selectors.filter(parents, selector);
        if (closest.length) {
            result.push(closest[0]);
        }
    }
    return _.flatten(result);
},
    getParents = function getParents(context) {
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
    getParentsUntil = function getParentsUntil(d, stopSelector) {
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
    _crawlUpNode = function _crawlUpNode(node, context, stopSelector) {
    var result = [],
        parent = node,
        nodeType;

    while ((parent = getNodeParent(parent)) && (nodeType = parent.nodeType) !== DOCUMENT && (!context || parent !== context) && (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
        if (nodeType === ELEMENT) {
            result.push(parent);
        }
    }

    return result;
},

// Parent ------
getParent = function getParent(context) {
    var idx = 0,
        len = context.length,
        result = [];
    for (; idx < len; idx++) {
        var parent = getNodeParent(context[idx]);
        if (parent) {
            result.push(parent);
        }
    }
    return result;
},

// Safely get parent node
getNodeParent = function getNodeParent(node) {
    return node && node.parentNode;
},
    getPrev = function getPrev(node) {
    var prev = node;
    while ((prev = prev.previousSibling) && prev.nodeType !== ELEMENT) {}
    return prev;
},
    getNext = function getNext(node) {
    var next = node;
    while ((next = next.nextSibling) && next.nodeType !== ELEMENT) {}
    return next;
},
    getPrevAll = function getPrevAll(node) {
    var result = [],
        prev = node;
    while (prev = prev.previousSibling) {
        if (prev.nodeType === ELEMENT) {
            result.push(prev);
        }
    }
    return result;
},
    getNextAll = function getNextAll(node) {
    var result = [],
        next = node;
    while (next = next.nextSibling) {
        if (next.nodeType === ELEMENT) {
            result.push(next);
        }
    }
    return result;
},
    getPositional = function getPositional(getter, d, selector) {
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
    getPositionalAll = function getPositionalAll(getter, d, selector) {
    var result = [],
        idx,
        len = d.length,
        siblings,
        filter;

    if (selector) {
        filter = function (sibling) {
            return Fizzle.is(selector).match(sibling);
        };
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
    getPositionalUntil = function getPositionalUntil(getter, d, selector) {
    var result = [],
        idx,
        len = d.length,
        siblings,
        iterator;

    if (selector) {
        var is = Fizzle.is(selector);
        iterator = function (sibling) {
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
    uniqueSort = function uniqueSort(elems, reverse) {
    var result = array.unique(elems);
    array.elementSort(result);
    if (reverse) {
        result.reverse();
    }
    return D(result);
},
    filterAndSort = function filterAndSort(elems, selector, reverse) {
    return uniqueSort(selectors.filter(elems, selector), reverse);
};

module.exports = {
    fn: {
        contents: function contents() {
            return D(_.flatten(_.map(this, function (elem) {
                return elem.childNodes;
            })));
        },

        index: function index(selector) {
            if (isString(selector)) {
                var first = this[0];
                return D(selector).indexOf(first);
            }

            if (isElement(selector) || isWindow(selector) || isDocument(selector)) {
                return this.indexOf(selector);
            }

            if (isD(selector)) {
                return this.indexOf(selector[0]);
            }

            // fallback
            if (!this.length) {
                return -1;
            }

            var first = this[0],
                parent = first.parentNode;

            if (!parent) {
                return -1;
            }

            // isAttached check to pass test "Node without parent returns -1"
            // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
            var attached = isAttached(first),
                isParentFragment = parent.nodeType === DOCUMENT_FRAGMENT;

            if (!attached && !isParentFragment) {
                return -1;
            }

            var childElems = parent.children || _.filter(parent.childNodes, function (node) {
                return node.nodeType === ELEMENT;
            });

            return [].indexOf.apply(childElems, [first]);
        },

        closest: function closest(selector, context) {
            return uniqueSort(getClosest(this, selector, context));
        },

        parent: function parent(selector) {
            return filterAndSort(getParent(this), selector);
        },

        parents: function parents(selector) {
            return filterAndSort(getParents(this), selector, true);
        },

        parentsUntil: function parentsUntil(stopSelector) {
            return uniqueSort(getParentsUntil(this, stopSelector), true);
        },

        siblings: function siblings(selector) {
            return filterAndSort(getSiblings(this), selector);
        },

        children: function children(selector) {
            return filterAndSort(getChildren(this), selector);
        },

        prev: function prev(selector) {
            return uniqueSort(getPositional(getPrev, this, selector));
        },

        next: function next(selector) {
            return uniqueSort(getPositional(getNext, this, selector));
        },

        prevAll: function prevAll(selector) {
            return uniqueSort(getPositionalAll(getPrevAll, this, selector), true);
        },

        nextAll: function nextAll(selector) {
            return uniqueSort(getPositionalAll(getNextAll, this, selector));
        },

        prevUntil: function prevUntil(selector) {
            return uniqueSort(getPositionalUntil(getPrevAll, this, selector), true);
        },

        nextUntil: function nextUntil(selector) {
            return uniqueSort(getPositionalUntil(getNextAll, this, selector));
        }
    }
};

},{"./Fizzle":35,"./array":40,"./selectors":54,"NODE_TYPE/DOCUMENT":6,"NODE_TYPE/DOCUMENT_FRAGMENT":7,"NODE_TYPE/ELEMENT":8,"_":12,"is/attached":16,"is/d":19,"is/document":20,"is/element":21,"is/string":29,"is/window":30}],56:[function(require,module,exports){
'use strict';

var _ = require('_'),
    newlines = require('string/newlines'),
    exists = require('is/exists'),
    isString = require('is/string'),
    isArray = require('is/array'),
    isNumber = require('is/number'),
    isFunction = require('is/function'),
    isNodeName = require('node/isName'),
    normalName = require('node/normalizeName'),
    SUPPORTS = require('SUPPORTS'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),
    DIV = require('DIV');

var outerHtml = function outerHtml() {
    return undefined.length ? undefined[0].outerHTML : null;
},
    textGet = DIV.textContent !== undefined ? function (elem) {
    return elem.textContent;
} : function (elem) {
    return elem.innerText;
},
    textSet = DIV.textContent !== undefined ? function (elem, str) {
    return elem.textContent = str;
} : function (elem, str) {
    return elem.innerText = str;
};

var valHooks = {
    option: {
        get: function get(elem) {
            var val = elem.getAttribute('value');
            return (exists(val) ? val : textGet(elem)).trim();
        }
    },

    select: {
        get: function get(elem) {
            var value,
                option,
                options = elem.options,
                index = elem.selectedIndex,
                one = elem.type === 'select-one' || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                idx = index < 0 ? max : one ? index : 0;

            // Loop through all the selected options
            for (; idx < max; idx++) {
                option = options[idx];

                // oldIE doesn't update selected after form reset (#2551)
                if ((option.selected || idx === index) && (SUPPORTS.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) && (!option.parentNode.disabled || !isNodeName(option.parentNode, 'optgroup'))) {

                    // Get the specific value for the option
                    value = valHooks.option.get(option);

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

        set: function set(elem, value) {
            var optionSet,
                option,
                options = elem.options,
                values = _.makeArray(value),
                idx = options.length;

            while (idx--) {
                option = options[idx];

                if (_.contains(values, valHooks.option.get(option))) {
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
if (!SUPPORTS.checkOn) {
    _.each(['radio', 'checkbox'], function (type) {
        valHooks[type] = {
            get: function get(elem) {
                // Support: Webkit - '' is returned instead of 'on' if a value isn't specified
                return elem.getAttribute('value') === null ? 'on' : elem.value;
            }
        };
    });
}

var getVal = function getVal(elem) {
    if (!elem || elem.nodeType !== ELEMENT) {
        return;
    }

    var hook = valHooks[elem.type] || valHooks[normalName(elem)];
    if (hook && hook.get) {
        return hook.get(elem);
    }

    var val = elem.value;
    if (val === undefined) {
        val = elem.getAttribute('value');
    }

    return isString(val) ? newlines(val) : val;
};

var stringify = function stringify(value) {
    return !exists(value) ? '' : value + '';
};

var setVal = function setVal(elem, val) {
    if (elem.nodeType !== ELEMENT) {
        return;
    }

    // Stringify values
    var value = isArray(val) ? _.map(val, stringify) : stringify(val);

    var hook = valHooks[elem.type] || valHooks[normalName(elem)];
    if (hook && hook.set) {
        hook.set(elem, value);
    } else {
        elem.setAttribute('value', value);
    }
};

module.exports = {
    fn: {
        outerHtml: outerHtml,
        outerHTML: outerHtml,

        html: (function (_html) {
            function html(_x) {
                return _html.apply(this, arguments);
            }

            html.toString = function () {
                return _html.toString();
            };

            return html;
        })(function (html) {
            if (isString(html)) {
                return _.each(this, function (elem) {
                    return elem.innerHTML = html;
                });
            }

            if (isFunction(html)) {
                var iterator = html;
                return _.each(this, function (elem, idx) {
                    return elem.innerHTML = iterator.call(elem, idx, elem.innerHTML);
                });
            }

            var first = this[0];
            return !first ? undefined : first.innerHTML;
        }),

        val: function val(value) {
            // getter
            if (!arguments.length) {
                return getVal(this[0]);
            }

            if (!exists(value)) {
                return _.each(this, function (elem) {
                    return setVal(elem, '');
                });
            }

            if (isFunction(value)) {
                var iterator = value;
                return _.each(this, function (elem, idx) {
                    if (elem.nodeType !== ELEMENT) {
                        return;
                    }

                    var value = iterator.call(elem, idx, getVal(elem));

                    setVal(elem, value);
                });
            }

            // setters
            if (isString(value) || isNumber(value) || isArray(value)) {
                return _.each(this, function (elem) {
                    return setVal(elem, value);
                });
            }

            return _.each(this, function (elem) {
                return setVal(elem, value);
            });
        },

        text: function text(str) {
            if (isString(str)) {
                return _.each(this, function (elem) {
                    return textSet(elem, str);
                });
            }

            if (isFunction(str)) {
                var iterator = str;
                return _.each(this, function (elem, idx) {
                    return textSet(elem, iterator.call(elem, idx, textGet(elem)));
                });
            }

            return _.map(this, function (elem) {
                return textGet(elem);
            }).join('');
        }
    }
};

// Don't return options that are disabled or in a disabled optgroup

},{"DIV":3,"NODE_TYPE/ELEMENT":8,"SUPPORTS":11,"_":12,"is/array":14,"is/exists":22,"is/function":23,"is/number":26,"is/string":29,"node/isName":58,"node/normalizeName":59,"string/newlines":62}],57:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (elem) {
        return elem && elem.nodeType === ELEMENT;
};

},{"NODE_TYPE/ELEMENT":8}],58:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};

},{}],59:[function(require,module,exports){
// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
"use strict";

module.exports = function (elem) {
  return elem.nodeName.toLowerCase();
};

},{}],60:[function(require,module,exports){
'use strict';

var isAttached = require('is/attached'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),

// http://ejohn.org/blog/comparing-document-position/
// https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
CONTAINED_BY = 16,
    FOLLOWING = 4,
    DISCONNECTED = 1;

var is = function is(rel, flag) {
    return (rel & flag) === flag;
};

var isNode = function isNode(b, flag, a) {
    return is(_comparePosition(a, b), flag);
};

// Compare Position - MIT Licensed, John Resig
var _comparePosition = function _comparePosition(node1, node2) {
    return node1.compareDocumentPosition ? node1.compareDocumentPosition(node2) : 0;
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
    sort: (function () {
        var _hasDuplicate = false;

        var _sort = function _sort(node1, node2) {
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
                rel = DISCONNECTED;
            }

            // Not directly comparable
            if (!rel) {
                return 0;
            }

            // Disconnected nodes
            if (is(rel, DISCONNECTED)) {
                var isNode1Disconnected = !isAttached(node1);
                var isNode2Disconnected = !isAttached(node2);

                if (isNode1Disconnected && isNode2Disconnected) {
                    return 0;
                }

                return isNode2Disconnected ? -1 : 1;
            }

            return is(rel, FOLLOWING) ? -1 : 1;
        };

        return function (array, reverse) {
            _hasDuplicate = false;
            array.sort(_sort);
            if (reverse) {
                array.reverse();
            }
            return _hasDuplicate;
        };
    })(),

    /**
     * Determines whether node `a` contains node `b`.
     * @param {Element} a D element node
     * @param {Element} b D element node
     * @returns {Boolean} true if node `a` contains node `b`; otherwise false.
     */
    contains: function contains(a, b) {
        var bUp = isAttached(b) ? b.parentNode : null;

        if (a === bUp) {
            return true;
        }

        if (bUp && bUp.nodeType === ELEMENT) {
            // Modern browsers (IE9+)
            if (a.compareDocumentPosition) {
                return isNode(bUp, CONTAINED_BY, a);
            }
        }

        return false;
    }
};

},{"NODE_TYPE/ELEMENT":8,"is/attached":16}],61:[function(require,module,exports){
'use strict';

var exists = require('is/exists');

module.exports = function (str) {
  return !exists(str) || str === '';
};

},{"is/exists":22}],62:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ? function (str) {
    return str;
} : function (str) {
    return str ? str.replace(/\r\n/g, '\n') : str;
};

},{"SUPPORTS":11}],63:[function(require,module,exports){
'use strict';

var cache = require('cache')(2),
    isEmpty = require('string/isEmpty'),
    isArray = require('is/array'),
    R_SPACE = /\s+/g,
    split = function split(name, delim) {
    var split = name.split(delim),
        len = split.length,
        idx = split.length,
        names = [],
        nameSet = {},
        curName;

    while (idx--) {
        curName = split[len - (idx + 1)];

        if (nameSet[curName] || // unique
        isEmpty(curName) // non-empty
        ) {
            continue;
        }

        names.push(curName);
        nameSet[curName] = true;
    }

    return names;
};

module.exports = function (name, delimiter) {
    if (isEmpty(name)) {
        return [];
    }
    if (isArray(name)) {
        return name;
    }

    var delim = delimiter === undefined ? R_SPACE : delimiter;
    return cache.has(delim, name) ? cache.get(delim, name) : cache.put(delim, name, function () {
        return split(name, delim);
    });
};

},{"cache":13,"is/array":14,"string/isEmpty":61}],64:[function(require,module,exports){
"use strict";

module.exports = function (num) {
  return parseInt(num, 10);
};

},{}],65:[function(require,module,exports){
"use strict";

var slice = Array.prototype.slice;

module.exports = function (arr, start, end) {
    // Exit early for empty array
    if (!arr || !arr.length) {
        return [];
    }

    // End, naturally, has to be higher than 0 to matter,
    // so a simple existence check will do
    if (end) {
        return slice.call(arr, start, end);
    }

    return slice.call(arr, start || 0);
};

},{}],66:[function(require,module,exports){
// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
'use strict';

module.exports = function (str, delimiter) {
  return str.split(delimiter || '|');
};

},{}],67:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return value + 'px';
};

},{}],68:[function(require,module,exports){
'use strict';

var id = 0;
var uniqueId = module.exports = function () {
    return id++;
};
uniqueId.seed = function (seeded, pre) {
    var prefix = pre || '',
        seed = seeded || 0;
    return function () {
        return prefix + seed++;
    };
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9BVFRSSUJVVEUuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9DT01NRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0VMRU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9URVhULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvRml6emxlL2NvbnN0cnVjdHMvSXMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvRml6emxlL2NvbnN0cnVjdHMvUXVlcnkuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvRml6emxlL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL0ZpenpsZS9zZWxlY3Rvci9jYXB0dXJlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL0ZpenpsZS9zZWxlY3Rvci9zZWxlY3Rvci1wYXJzZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hdHRyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2NsYXNzZXMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvY3NzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RhdGEuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZGltZW5zaW9ucy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvY3VzdG9tLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2V2ZW50cy9kZWxlZ2F0ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvbWFuaXAuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvb25yZWFkeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9wYXJzZXIvcGFyc2VyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc0VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvaXNOYW1lLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL25vcm1hbGl6ZU5hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvaXNFbXB0eS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL25ld2xpbmVzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvcGFyc2VJbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc2xpY2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvdG9QeC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxDQUFD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USxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUc7V0FBTSxFQUFFLEVBQUU7Q0FBQSxDQUFDO0FBQzNDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBUyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ2xDLFFBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxFQUFFO1FBQ2xCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLFdBQU87ZUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFO0tBQUEsQ0FBQztDQUNoQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBfID0gcmVxdWlyZSgnXycpLFxyXG5cclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzSHRtbCAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICA9IHJlcXVpcmUoJ2lzL2QnKSxcclxuXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9wYXJzZXIvcGFyc2VyJyksXHJcbiAgICBhcnJheSAgICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9hcnJheScpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvb25yZWFkeScpLFxyXG4gICAgc2VsZWN0b3JzICAgPSByZXF1aXJlKCcuL21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJy4vbW9kdWxlcy90cmFuc3ZlcnNhbCcpLFxyXG4gICAgZGltZW5zaW9ucyAgPSByZXF1aXJlKCcuL21vZHVsZXMvZGltZW5zaW9ucycpLFxyXG4gICAgbWFuaXAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnLi9tb2R1bGVzL2NzcycpLFxyXG4gICAgYXR0ciAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvYXR0cicpLFxyXG4gICAgcHJvcCAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvdmFsJyksXHJcbiAgICBwb3NpdGlvbiAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9wb3NpdGlvbicpLFxyXG4gICAgY2xhc3NlcyAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvZGF0YScpLFxyXG4gICAgZXZlbnRzICAgICAgPSByZXF1aXJlKCcuL21vZHVsZXMvZXZlbnRzJyksXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJy4vbW9kdWxlcy9GaXp6bGUnKTtcclxuXHJcbnZhciBEID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIHJldHVybiBuZXcgSW5pdChzZWxlY3RvciwgYXR0cnMpO1xyXG59O1xyXG5cclxudmFyIEluaXQgPSBELnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oc2VsZWN0b3IsIGF0dHJzKSB7XHJcbiAgICAvLyBub3RoaW5cclxuICAgIGlmICghc2VsZWN0b3IpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAvLyBlbGVtZW50IG9yIHdpbmRvdyAoZG9jdW1lbnRzIGhhdmUgYSBub2RlVHlwZSlcclxuICAgIGlmIChzZWxlY3Rvci5ub2RlVHlwZSB8fCBzZWxlY3RvciA9PT0gd2luZG93KSB7XHJcbiAgICAgICAgdGhpc1swXSA9IHNlbGVjdG9yO1xyXG4gICAgICAgIHRoaXMubGVuZ3RoID0gMTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBIVE1MIHN0cmluZ1xyXG4gICAgaWYgKGlzSHRtbChzZWxlY3RvcikpIHtcclxuICAgICAgICBfLm1lcmdlKHRoaXMsIHBhcnNlci5wYXJzZUh0bWwoc2VsZWN0b3IpKTtcclxuICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTdHJpbmdcclxuICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBGaXp6bGUucXVlcnkoc2VsZWN0b3IpLmV4ZWModGhpcywgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IG9mIEVsZW1lbnRzLCBOb2RlTGlzdCwgb3IgRCBvYmplY3RcclxuICAgIGlmIChpc0FycmF5KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG9jdW1lbnQgcmVhZHlcclxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG9ucmVhZHkoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbkluaXQucHJvdG90eXBlID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChELFxyXG4gICAgcGFyc2VyLkQsXHJcbiAgICBkYXRhLkQsXHJcbntcclxuICAgIEZpenpsZTogIEZpenpsZSxcclxuICAgIGVhY2g6ICAgIGFycmF5LmVhY2gsXHJcbiAgICBmb3JFYWNoOiBhcnJheS5lYWNoLFxyXG5cclxuICAgIG1hcDogICAgIF8ubWFwLFxyXG4gICAgZXh0ZW5kOiAgXy5leHRlbmQsXHJcblxyXG4gICAgbW9yZUNvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cualF1ZXJ5ID0gd2luZG93LlplcHRvID0gd2luZG93LiQgPSBEO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQucHJvdG90eXBlLFxyXG4gICAgeyBjb25zdHJ1Y3RvcjogRCwgfSxcclxuICAgIGFycmF5UHJvdG8sXHJcbiAgICBhcnJheS5mbixcclxuICAgIHNlbGVjdG9ycy5mbixcclxuICAgIHRyYW5zdmVyc2FsLmZuLFxyXG4gICAgbWFuaXAuZm4sXHJcbiAgICBkaW1lbnNpb25zLmZuLFxyXG4gICAgY3NzLmZuLFxyXG4gICAgYXR0ci5mbixcclxuICAgIHByb3AuZm4sXHJcbiAgICB2YWwuZm4sXHJcbiAgICBjbGFzc2VzLmZuLFxyXG4gICAgcG9zaXRpb24uZm4sXHJcbiAgICBkYXRhLmZuLFxyXG4gICAgZXZlbnRzLmZuXHJcbik7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHVud3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlKSB7XG4gIHZhciBlO1xuICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgID0gZS5wcmV2ZW50RGVmYXVsdCAgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG4iLCJ2YXIgZGl2ID0gbW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuXHJcbmRpdi5pbm5lckhUTUwgPSAnPGEgaHJlZj1cIi9hXCI+YTwvYT48YnV0dG9uPmJ1dHRvbjwvYnV0dG9uPic7IiwibW9kdWxlLmV4cG9ydHMgPSAyOyIsIm1vZHVsZS5leHBvcnRzID0gODsiLCJtb2R1bGUuZXhwb3J0cyA9IDk7IiwibW9kdWxlLmV4cG9ydHMgPSAxMTsiLCJtb2R1bGUuZXhwb3J0cyA9IDE7IiwibW9kdWxlLmV4cG9ydHMgPSAzOyIsIiAgICAvLyBNYXRjaGVzIFwiLW1zLVwiIHNvIHRoYXQgaXQgY2FuIGJlIGNoYW5nZWQgdG8gXCJtcy1cIlxyXG52YXIgX1RSVU5DQVRFX01TX1BSRUZJWCAgPSAvXi1tcy0vLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgZGFzaGVkIHN0cmluZyBmb3IgY2FtZWxpemluZ1xyXG4gICAgX0RBU0hfQ0FUQ0ggICAgICAgICAgPSAvLShbXFxkYS16XSkvZ2ksXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIm5vbmVcIiBvciBhIHRhYmxlIHR5cGUgZS5nLiBcInRhYmxlXCIsXHJcbiAgICAvLyBcInRhYmxlLWNlbGxcIiBldGMuLi5cclxuICAgIF9OT05FX09SX1RBQkxFICAgICAgID0gL14obm9uZXx0YWJsZSg/IS1jW2VhXSkuKykvLFxyXG4gICAgXHJcbiAgICBfVFlQRV9URVNUX0ZPQ1VTQUJMRSA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbnxvYmplY3QpJC9pLFxyXG4gICAgX1RZUEVfVEVTVF9DTElDS0FCTEUgPSAvXig/OmF8YXJlYSkkL2ksXHJcbiAgICBfU0VMRUNUT1JfSUQgICAgICAgICA9IC9eIyhbXFx3LV0rKSQvLFxyXG4gICAgX1NFTEVDVE9SX1RBRyAgICAgICAgPSAvXltcXHctXSskLyxcclxuICAgIF9TRUxFQ1RPUl9DTEFTUyAgICAgID0gL15cXC4oW1xcdy1dKykkLyxcclxuICAgIF9QT1NJVElPTiAgICAgICAgICAgID0gL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvLFxyXG4gICAgX05VTV9OT05fUFggICAgICAgICAgPSBuZXcgUmVnRXhwKCdeKCcgKyAoL1srLV0/KD86XFxkKlxcLnwpXFxkKyg/OltlRV1bKy1dP1xcZCt8KS8pLnNvdXJjZSArICcpKD8hcHgpW2EteiVdKyQnLCAnaScpLFxyXG4gICAgX1NJTkdMRV9UQUcgICAgICAgICAgPSAvXjwoXFx3KylcXHMqXFwvPz4oPzo8XFwvXFwxPnwpJC8sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYXAgb2YgcGFyZW50IHRhZyBuYW1lcyB0byB0aGUgY2hpbGQgdGFncyB0aGF0IHJlcXVpcmUgdGhlbS5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIF9QQVJFTlRfTUFQID0ge1xyXG4gICAgICAgIHRhYmxlOiAgICAvXjwoPzp0Ym9keXx0Zm9vdHx0aGVhZHxjb2xncm91cHxjYXB0aW9uKVxcYi8sXHJcbiAgICAgICAgdGJvZHk6ICAgIC9ePCg/OnRyKVxcYi8sXHJcbiAgICAgICAgdHI6ICAgICAgIC9ePCg/OnRkfHRoKVxcYi8sXHJcbiAgICAgICAgY29sZ3JvdXA6IC9ePCg/OmNvbClcXGIvLFxyXG4gICAgICAgIHNlbGVjdDogICAvXjwoPzpvcHRpb24pXFxiL1xyXG4gICAgfTtcclxuXHJcbi8vIGhhdmluZyBjYWNoZXMgaXNuJ3QgYWN0dWFsbHkgZmFzdGVyXHJcbi8vIGZvciBhIG1ham9yaXR5IG9mIHVzZSBjYXNlcyBmb3Igc3RyaW5nXHJcbi8vIG1hbmlwdWxhdGlvbnNcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBudW1Ob3RQeDogKHZhbCkgPT4gX05VTV9OT05fUFgudGVzdCh2YWwpLFxyXG4gICAgcG9zaXRpb246ICh2YWwpID0+IF9QT1NJVElPTi50ZXN0KHZhbCksXHJcbiAgICBzaW5nbGVUYWdNYXRjaDogKHZhbCkgPT4gX1NJTkdMRV9UQUcuZXhlYyh2YWwpLFxyXG4gICAgaXNOb25lT3JUYWJsZTogKHN0cikgPT4gX05PTkVfT1JfVEFCTEUudGVzdChzdHIpLFxyXG4gICAgaXNGb2N1c2FibGU6IChzdHIpID0+IF9UWVBFX1RFU1RfRk9DVVNBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzQ2xpY2thYmxlOiAoc3RyKSA9PiBfVFlQRV9URVNUX0NMSUNLQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc1N0cmljdElkOiAoc3RyKSA9PiBfU0VMRUNUT1JfSUQudGVzdChzdHIpLFxyXG4gICAgaXNUYWc6IChzdHIpID0+IF9TRUxFQ1RPUl9UQUcudGVzdChzdHIpLFxyXG4gICAgaXNDbGFzczogKHN0cikgPT4gX1NFTEVDVE9SX0NMQVNTLnRlc3Qoc3RyKSxcclxuXHJcbiAgICBjYW1lbENhc2U6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShfVFJVTkNBVEVfTVNfUFJFRklYLCAnbXMtJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoX0RBU0hfQ0FUQ0gsIChtYXRjaCwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudFRhZ05hbWU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciB2YWwgPSBzdHIuc3Vic3RyKDAsIDMwKTtcclxuICAgICAgICBmb3IgKHZhciBwYXJlbnRUYWdOYW1lIGluIF9QQVJFTlRfTUFQKSB7XHJcbiAgICAgICAgICAgIGlmIChfUEFSRU5UX01BUFtwYXJlbnRUYWdOYW1lXS50ZXN0KHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRUYWdOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnZGl2JztcclxuICAgIH1cclxufTtcclxuIiwidmFyIERJViAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgYSAgICAgID0gRElWLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdhJylbMF0sXHJcbiAgICBidXR0b24gPSBESVYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2J1dHRvbicpWzBdLFxyXG4gICAgc2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0JyksXHJcbiAgICBvcHRpb24gPSBzZWxlY3QuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJykpO1xyXG5cclxudmFyIHRlc3QgPSBmdW5jdGlvbih0YWdOYW1lLCB0ZXN0Rm4pIHtcclxuICAgIC8vIEF2b2lkIHZhcmlhYmxlIHJlZmVyZW5jZXMgdG8gZWxlbWVudHMgdG8gcHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUUuXHJcbiAgICAvLyBBdm9pZCB2YXJpYWJsZSByZWZlcmVuY2VzIHRvIGVsZW1lbnRzIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFLlxyXG4gICAgcmV0dXJuIHRlc3RGbihkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgVVJMcyBhcmVuJ3QgbWFuaXB1bGF0ZWRcclxuICAgIC8vIChJRSBub3JtYWxpemVzIGl0IGJ5IGRlZmF1bHQpXHJcbiAgICBocmVmTm9ybWFsaXplZDogYS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSA9PT0gJy9hJyxcclxuXHJcbiAgICAvLyBDaGVjayB0aGUgZGVmYXVsdCBjaGVja2JveC9yYWRpbyB2YWx1ZSAoJycgaW4gb2xkZXIgV2ViS2l0OyAnb24nIGVsc2V3aGVyZSlcclxuICAgIGNoZWNrT246IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gISFpbnB1dC52YWx1ZTtcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFuIGlucHV0IG1haW50YWlucyBpdHMgdmFsdWUgYWZ0ZXIgYmVjb21pbmcgYSByYWRpb1xyXG4gICAgLy8gU3VwcG9ydDogTW9kZXJuIGJyb3dzZXJzIG9ubHkgKE5PVCBJRSA8PSAxMSlcclxuICAgIHJhZGlvVmFsdWU6IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC52YWx1ZSA9ICd0JztcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gaW5wdXQudmFsdWUgPT09ICd0JztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGEgc2VsZWN0ZWQtYnktZGVmYXVsdCBvcHRpb24gaGFzIGEgd29ya2luZyBzZWxlY3RlZCBwcm9wZXJ0eS5cclxuICAgIC8vIChXZWJLaXQgZGVmYXVsdHMgdG8gZmFsc2UgaW5zdGVhZCBvZiB0cnVlLCBJRSB0b28sIGlmIGl0J3MgaW4gYW4gb3B0Z3JvdXApXHJcbiAgICBvcHRTZWxlY3RlZDogb3B0aW9uLnNlbGVjdGVkLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBvcHRpb25zIGluc2lkZSBkaXNhYmxlZCBzZWxlY3RzIGFyZW4ndCBtYXJrZWQgYXMgZGlzYWJsZWRcclxuICAgIC8vIChXZWJLaXQgbWFya3MgdGhlbSBhcyBkaXNhYmxlZClcclxuICAgIG9wdERpc2FibGVkOiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2VsZWN0LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gIW9wdGlvbi5kaXNhYmxlZDtcclxuICAgIH0oKSksXHJcblxyXG4gICAgLy8gTW9kZXJuIGJyb3dzZXJzIG5vcm1hbGl6ZSBcXHJcXG4gdG8gXFxuIGluIHRleHRhcmVhIHZhbHVlcyxcclxuICAgIC8vIGJ1dCBJRSA8PSAxMSAoYW5kIHBvc3NpYmx5IG5ld2VyKSBkbyBub3QuXHJcbiAgICB2YWx1ZU5vcm1hbGl6ZWQ6IHRlc3QoJ3RleHRhcmVhJywgZnVuY3Rpb24odGV4dGFyZWEpIHtcclxuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9ICdcXHJcXG4nO1xyXG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS52YWx1ZSA9PT0gJ1xcbic7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBzZWxlY3RlZFNlbGVjdG9yOiB0ZXN0KCdzZWxlY3QnLCBmdW5jdGlvbihzZWxlY3QpIHtcclxuICAgICAgICBzZWxlY3QuaW5uZXJIVE1MID0gJzxvcHRpb24gdmFsdWU9XCIxXCI+MTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XCIyXCIgc2VsZWN0ZWQ+Mjwvb3B0aW9uPic7XHJcbiAgICAgICAgcmV0dXJuICEhc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJ29wdGlvbltzZWxlY3RlZF0nKTtcclxuICAgIH0pXHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRVxyXG5ESVYgPSBhID0gYnV0dG9uID0gc2VsZWN0ID0gb3B0aW9uID0gbnVsbDtcclxuIiwidmFyIGV4aXN0cyAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgc2xpY2UgICAgICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyk7XHJcblxyXG52YXIgXyA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gRmxhdHRlbiB0aGF0IGFsc28gY2hlY2tzIGlmIHZhbHVlIGlzIGEgTm9kZUxpc3RcclxuICAgIGZsYXR0ZW46IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENvbmNhdCBmbGF0IGZvciBhIHNpbmdsZSBhcnJheSBvZiBhcnJheXNcclxuICAgIGNvbmNhdEZsYXQ6IChmdW5jdGlvbihjb25jYXQpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5lc3RlZEFycmF5cykge1xyXG4gICAgICAgICAgICByZXR1cm4gY29uY2F0LmFwcGx5KFtdLCBuZXN0ZWRBcnJheXMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfShbXS5jb25jYXQpKSxcclxuXHJcbiAgICBldmVyeTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghZXhpc3RzKGFycikpIHsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKCFpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBleHRlbmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxyXG4gICAgICAgICAgICBvYmogID0gYXJnc1swXSxcclxuICAgICAgICAgICAgbGVuICA9IGFyZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIW9iaiB8fCBsZW4gPCAyKSB7IHJldHVybiBvYmo7IH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaWR4ID0gMTsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gYXJnc1tpZHhdO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3RhbmRhcmQgbWFwXHJcbiAgICBtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQXJyYXktcHJlc2VydmluZyBtYXBcclxuICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL3B1c2gtbWFwLXZzLWluZGV4LXJlcGxhY2VtZW50LW1hcFxyXG4gICAgZmFzdG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghYXJyKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gcmVzdWx0czsgfVxyXG4gICAgICAgIGl0ZXJhdG9yID0gaXRlcmF0b3IgfHwgKGFyZykgPT4gISFhcmc7XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFycltpZHhdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gcmVzdWx0OyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSkgeyBicmVhazsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICEhcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwdWxsZWQgZnJvbSBBTURcclxuICAgIHR5cGVjYXN0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgIHIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgciA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICdmYWxzZScpIHtcclxuICAgICAgICAgICAgciA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnJyB8fCBpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgIC8vIGlzTmFOKCcnKSByZXR1cm5zIGZhbHNlXHJcbiAgICAgICAgICAgIHIgPSB2YWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcGFyc2VGbG9hdChudWxsIHx8ICcnKSByZXR1cm5zIE5hTlxyXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH0sXHJcblxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYgKCFvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2Uob2JqKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhcnIsXHJcbiAgICAgICAgICAgIGxlbiA9ICtvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG5cclxuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICAgICAgYXJyID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgYXJyW2lkeF0gPSBvYmpbaWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBhcnIucHVzaChvYmpba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VBcnJheTogZnVuY3Rpb24oYXJnKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdHMoYXJnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChhcmcuc2xpY2UgPT09IHNsaWNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcmcuc2xpY2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGlzQXJyYXlMaWtlKGFyZykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlKGFyZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbIGFyZyBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oYXJyLCBpdGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyci5pbmRleE9mKGl0ZW0pICE9PSAtMTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghb2JqIHx8ICFpdGVyYXRvcikgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgLy8gQXJyYXktbGlrZVxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3Iob2JqW2lkeF0sIGlkeCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gUGxhaW4gb2JqZWN0XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3Iob2JqW3Byb3BdLCBwcm9wKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sXHJcblxyXG4gICAgaGFzU2l6ZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9iaikgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gc2Vjb25kLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gR28gdGhyb3VnaCBlYWNoIGVsZW1lbnQgaW4gdGhlXHJcbiAgICAgICAgLy8gc2Vjb25kIGFycmF5IGFuZCBhZGQgaXQgdG8gdGhlXHJcbiAgICAgICAgLy8gZmlyc3RcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2lkeF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJzdC5sZW5ndGggPSBpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmlyc3Q7XHJcbiAgICB9XHJcbn07IiwidmFyIGRlbGV0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHJldHVybiBkZWxldGFibGUgPyBcclxuICAgICAgICBmdW5jdGlvbihzdG9yZSwga2V5KSB7IGRlbGV0ZSBzdG9yZVtrZXldOyB9IDpcclxuICAgICAgICBmdW5jdGlvbihzdG9yZSwga2V5KSB7IHN0b3JlW2tleV0gPSB1bmRlZmluZWQ7IH07XHJcbn07XHJcblxyXG52YXIgZ2V0dGVyU2V0dGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICB2YXIgc3RvcmUgPSB7fSxcclxuICAgICAgICBkZWwgPSBkZWxldGVyKGRlbGV0YWJsZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4ga2V5IGluIHN0b3JlICYmIHN0b3JlW2tleV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdG9yZVtrZXldO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHV0OiBmdW5jdGlvbihrZXksIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm4oYXJnKTtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICBkZWwoc3RvcmUsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBiaUxldmVsR2V0dGVyU2V0dGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICB2YXIgc3RvcmUgPSB7fSxcclxuICAgICAgICBkZWwgPSBkZWxldGVyKGRlbGV0YWJsZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIGhhczEgPSBrZXkxIGluIHN0b3JlICYmIHN0b3JlW2tleTFdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGlmICghaGFzMSB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGtleTIgaW4gc3RvcmVba2V5MV0gJiYgc3RvcmVba2V5MV1ba2V5Ml0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdO1xyXG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/IHJlZjEgOiAocmVmMSAhPT0gdW5kZWZpbmVkID8gcmVmMVtrZXkyXSA6IHJlZjEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHV0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm4oYXJnKTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgLy8gRWFzeSByZW1vdmFsXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsKHN0b3JlLCBrZXkxKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGVlcCByZW1vdmFsXHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV0gfHwgKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICBkZWwocmVmMSwga2V5Mik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obHZsLCBkZWxldGFibGUpIHtcclxuICAgIHJldHVybiBsdmwgPT09IDIgPyBiaUxldmVsR2V0dGVyU2V0dGVyKGRlbGV0YWJsZSkgOiBnZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmICt2YWx1ZS5sZW5ndGggPT09IHZhbHVlLmxlbmd0aDtcclxuIiwidmFyIERPQ1VNRU5UX0ZSQUdNRU5UID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UX0ZSQUdNRU5UJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHJldHVybiBlbGVtICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ub3duZXJEb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbSAhPT0gZG9jdW1lbnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5ub2RlVHlwZSAhPT0gRE9DVU1FTlRfRlJBR01FTlQgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLmlzUGFyc2VIdG1sRnJhZ21lbnQgIT09IHRydWU7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBmYWxzZTtcclxuIiwidmFyIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOb2RlTGlzdCA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0QgICAgICAgID0gcmVxdWlyZSgnaXMvZCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICBpc0QodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpIHx8IGlzTm9kZUxpc3QodmFsdWUpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBEOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgRUxFTUVOVCAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCB2YWx1ZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgKCEhdmFsdWUgJiYgdHlwZSA9PT0gJ29iamVjdCcpO1xyXG59OyIsInZhciBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWwpID0+XHJcbiAgICB2YWwgJiYgKGlzU3RyaW5nKHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpIHx8IGlzRWxlbWVudCh2YWwpIHx8IGlzQ29sbGVjdGlvbih2YWwpKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJzsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IHZhbHVlLndpbmRvdztcclxuIiwidmFyIEVMRU1FTlQgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQgPyBtYXRjaGVzU2VsZWN0b3IuY2FsbChlbGVtLCBzZWxlY3RvcikgOiBmYWxzZTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IG51bGw7XHJcbiIsInZhciBfID0gcmVxdWlyZSgnXycpO1xyXG5cclxudmFyIElzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvcnMpIHtcclxuICAgIHRoaXMuX3NlbGVjdG9ycyA9IHNlbGVjdG9ycztcclxufTtcclxuSXMucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gdGhpcy5fc2VsZWN0b3JzLFxyXG4gICAgICAgICAgICBpZHggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yc1tpZHhdLm1hdGNoKGNvbnRleHQpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uYW55KGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgIHRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICAhdGhpcy5tYXRjaChlbGVtKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJ2YXIgZmluZCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgc2VsZWN0b3JzID0gcXVlcnkuX3NlbGVjdG9ycyxcclxuICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNlbGVjdG9yc1tpZHhdLmV4ZWMoY29udGV4dCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBRdWVyeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcblxyXG5RdWVyeS5wcm90b3R5cGUgPSB7XHJcbiAgICBleGVjOiBmdW5jdGlvbihhcnIsIGlzTmV3KSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBpc05ldyA/IDEgOiBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgZmluZCh0aGlzLCBhcnJbaWR4XSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNOb2RlTGlzdCA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG5cclxuICAgIEdFVF9FTEVNRU5UX0JZX0lEICAgICAgICAgID0gJ2dldEVsZW1lbnRCeUlkJyxcclxuICAgIEdFVF9FTEVNRU5UU19CWV9UQUdfTkFNRSAgID0gJ2dldEVsZW1lbnRzQnlUYWdOYW1lJyxcclxuICAgIEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FID0gJ2dldEVsZW1lbnRzQnlDbGFzc05hbWUnLFxyXG4gICAgUVVFUllfU0VMRUNUT1JfQUxMICAgICAgICAgPSAncXVlcnlTZWxlY3RvckFsbCcsXHJcblxyXG4gICAgc2VsZWN0b3JDYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIFJFR0VYICAgICAgICAgPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgbWF0Y2hlcyAgICAgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpO1xyXG5cclxudmFyIGRldGVybWluZU1ldGhvZCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9IHNlbGVjdG9yQ2FjaGUuZ2V0KHNlbGVjdG9yKTtcclxuICAgICAgICBpZiAobWV0aG9kKSB7IHJldHVybiBtZXRob2Q7IH1cclxuXHJcbiAgICAgICAgbWV0aG9kID0gUkVHRVguaXNTdHJpY3RJZChzZWxlY3RvcikgPyBHRVRfRUxFTUVOVF9CWV9JRCA6XHJcbiAgICAgICAgICAgIFJFR0VYLmlzQ2xhc3Moc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUUgOlxyXG4gICAgICAgICAgICBSRUdFWC5pc1RhZyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgOiAgICAgICBcclxuICAgICAgICAgICAgUVVFUllfU0VMRUNUT1JfQUxMO1xyXG5cclxuICAgICAgICBzZWxlY3RvckNhY2hlLnNldChzZWxlY3RvciwgbWV0aG9kKTtcclxuICAgICAgICByZXR1cm4gbWV0aG9kO1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVJZCA9IHJlcXVpcmUoJ3V0aWwvdW5pcXVlSWQnKS5zZWVkKDAsICdELXVuaXF1ZUlkLScpLFxyXG5cclxuICAgIC8vIG5lZWQgdG8gZm9yY2UgYW4gYXJyYXkgaGVyZVxyXG4gICAgZnJvbURvbUFycmF5VG9BcnJheSA9IGZ1bmN0aW9uKGFycmF5TGlrZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBhcnJheUxpa2UubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBhcnJheUxpa2VbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gZnVuY3Rpb24oc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgaWYgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkLCByZXR1cm4gaXQgYXMgYW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IGZyb21Eb21BcnJheVRvQXJyYXkoc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGFpbG9yQ2hpbGRTZWxlY3RvciA9IGZ1bmN0aW9uKGlkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiAnIycgKyBpZCArICcgJyArIHNlbGVjdG9yO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIC8vIENoaWxkIHNlbGVjdCAtIG5lZWRzIHNwZWNpYWwgaGVscCBzbyB0aGF0IFwiPiBkaXZcIiBkb2Vzbid0IGJyZWFrXHJcbiAgICAgICAgdmFyIG1ldGhvZCAgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgc2VsZWN0b3IgID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdG9yID0gdGFpbG9yQ2hpbGRTZWxlY3RvcihpZEFwcGxpZWQgPyBuZXdJZCA6IGlkLCBzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGlkQXBwbGllZCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsYXNzUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgLy8gQ2xhc3Mgc2VhcmNoLCBkb24ndCBzdGFydCB3aXRoICcuJ1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWZhdWx0UXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbc2VsZi5tZXRob2RdKHNlbGYuc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgICAgICAgaWYgKHNlbGYuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRPclNpYmxpbmdRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmlzQ2xhc3NTZWFyY2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNsYXNzUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0lkU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpZFF1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRRdWVyeTtcclxuICAgIH07XHJcblxyXG52YXIgU2VsZWN0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgdmFyIHNlbGVjdG9yICAgICAgICAgICAgICAgID0gc3RyLnRyaW0oKSxcclxuICAgICAgICBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ICA9IHNlbGVjdG9yWzBdID09PSAnPicgfHwgc2VsZWN0b3JbMF0gPT09ICcrJyxcclxuICAgICAgICBtZXRob2QgICAgICAgICAgICAgICAgICA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBRVUVSWV9TRUxFQ1RPUl9BTEwgOiBkZXRlcm1pbmVNZXRob2Qoc2VsZWN0b3IpO1xyXG5cclxuICAgIHRoaXMuc3RyICAgICAgICAgICAgICAgICAgICA9IHN0cjtcclxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgICAgICAgICA9IHNlbGVjdG9yO1xyXG4gICAgdGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdDtcclxuICAgIHRoaXMuaXNJZFNlYXJjaCAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRfQllfSUQ7XHJcbiAgICB0aGlzLmlzQ2xhc3NTZWFyY2ggICAgICAgICAgPSAhdGhpcy5pc0lkU2VhcmNoICYmIG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUU7XHJcbiAgICB0aGlzLm1ldGhvZCAgICAgICAgICAgICAgICAgPSBtZXRob2Q7XHJcbn07XHJcblxyXG5TZWxlY3Rvci5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIC8vIE5vIG5lZWVkIHRvIGNoZWNrLCBhIG1hdGNoIHdpbGwgZmFpbCBpZiBpdCdzXHJcbiAgICAgICAgLy8gY2hpbGQgb3Igc2libGluZ1xyXG4gICAgICAgIGlmICh0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRjaGVzKGNvbnRleHQsIHRoaXMuc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gZGV0ZXJtaW5lUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgIC8vIGlzRWxlbWVudChjb250ZXh0KSB8fCBpc05vZGVMaXN0KGNvbnRleHQpIHx8IGlzQ29sbGVjdGlvbihjb250ZXh0KVxyXG4gICAgICAgIC8vIGlmIG5vIGNvbnRleHQgaXMgZ2l2ZW4sIHVzZSBkb2N1bWVudFxyXG4gICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0IHx8IGRvY3VtZW50LCB0aGlzKTtcclxuICAgIH1cclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIHF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBpc0NhY2hlICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgU2VsZWN0b3IgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9TZWxlY3RvcicpLFxyXG4gICAgUXVlcnkgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9RdWVyeScpLFxyXG4gICAgSXMgICAgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9JcycpLFxyXG4gICAgcGFyc2UgICAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UnKSxcclxuICAgIG5vcm1hbGl6ZSAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZScpO1xyXG5cclxudmFyIHRvU2VsZWN0b3JzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAvLyBTZWxlY3RvcnMgd2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgcXVlcnkgd2FzIGludmFsaWQuXHJcbiAgICAvLyBOb3QgcmV0dXJuaW5nIGVhcmx5IG9yIGRvaW5nIGV4dHJhIGNoZWNrcyBhcyB0aGlzIHdpbGxcclxuICAgIC8vIG5vb3Agb24gdGhlIFF1ZXJ5IGFuZCBJcyBsZXZlbCBhbmQgaXMgdGhlIGV4Y2VwdGlvblxyXG4gICAgLy8gaW5zdGVhZCBvZiB0aGUgcnVsZVxyXG4gICAgdmFyIHNlbGVjdG9ycyA9IHBhcnNlLnN1YnF1ZXJpZXMoc3RyKSB8fCBbXTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZWFjaCBvZiB0aGUgc2VsZWN0b3JzLi4uXHJcbiAgICBzZWxlY3RvcnMgPSBfLm1hcChzZWxlY3RvcnMsIG5vcm1hbGl6ZSk7XHJcblxyXG4gICAgLy8gLi4uYW5kIG1hcCB0aGVtIHRvIFNlbGVjdG9yIG9iamVjdHNcclxuICAgIHJldHVybiBfLmZhc3RtYXAoc2VsZWN0b3JzLCAoc2VsZWN0b3IpID0+IG5ldyBTZWxlY3RvcihzZWxlY3RvcikpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZTogcGFyc2UsXHJcbiAgICBcclxuICAgIHF1ZXJ5OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZS5oYXMoc3RyKSA/IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLmdldChzdHIpIDogXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUucHV0KHN0ciwgKCkgPT4gbmV3IFF1ZXJ5KHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH0sXHJcbiAgICBpczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQ2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgaXNDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBpc0NhY2hlLnB1dChzdHIsICgpID0+IG5ldyBJcyh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHQnOmNoaWxkLWF0JzogJzpudGgtY2hpbGQoeCknLFxyXG5cdCc6Y2hpbGQtZ3QnOiAnOm50aC1jaGlsZChuK3gpJyxcclxuXHQnOmNoaWxkLWx0JzogJzpudGgtY2hpbGQofm4reCknXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgJzpjaGlsZC1ldmVuJyA6ICc6bnRoLWNoaWxkKGV2ZW4pJyxcclxuICAgICc6Y2hpbGQtb2RkJyAgOiAnOm50aC1jaGlsZChvZGQpJyxcclxuICAgICc6dGV4dCcgICAgICAgOiAnW3R5cGU9XCJ0ZXh0XCJdJyxcclxuICAgICc6cGFzc3dvcmQnICAgOiAnW3R5cGU9XCJwYXNzd29yZFwiXScsXHJcbiAgICAnOnJhZGlvJyAgICAgIDogJ1t0eXBlPVwicmFkaW9cIl0nLFxyXG4gICAgJzpjaGVja2JveCcgICA6ICdbdHlwZT1cImNoZWNrYm94XCJdJyxcclxuICAgICc6c3VibWl0JyAgICAgOiAnW3R5cGU9XCJzdWJtaXRcIl0nLFxyXG4gICAgJzpyZXNldCcgICAgICA6ICdbdHlwZT1cInJlc2V0XCJdJyxcclxuICAgICc6YnV0dG9uJyAgICAgOiAnW3R5cGU9XCJidXR0b25cIl0nLFxyXG4gICAgJzppbWFnZScgICAgICA6ICdbdHlwZT1cImltYWdlXCJdJyxcclxuICAgICc6aW5wdXQnICAgICAgOiAnW3R5cGU9XCJpbnB1dFwiXScsXHJcbiAgICAnOmZpbGUnICAgICAgIDogJ1t0eXBlPVwiZmlsZVwiXScsXHJcbiAgICAnOnNlbGVjdGVkJyAgIDogJ1tzZWxlY3RlZD1cInNlbGVjdGVkXCJdJ1xyXG59OyIsInZhciBTVVBQT1JUUyAgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuXHJcbiAgICBBVFRSSUJVVEVfU0VMRUNUT1IgPSAvXFxbXFxzKltcXHctXStcXHMqWyEkXipdPyg/Oj1cXHMqKFsnXCJdPykoLio/W15cXFxcXXxbXlxcXFxdKikpP1xcMVxccypcXF0vZyxcclxuICAgIFBTRVVET19TRUxFQ1QgICAgICA9IC8oOlteXFxzXFwoXFxbKV0rKS9nLFxyXG4gICAgQ0FQVFVSRV9TRUxFQ1QgICAgID0gLyg6W15cXHNeKF0rKVxcKChbXlxcKV0rKVxcKS9nLFxyXG4gICAgcHNldWRvQ2FjaGUgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgcHJveHlTZWxlY3RvcnMgICAgID0gcmVxdWlyZSgnLi9wcm94eScpLFxyXG4gICAgY2FwdHVyZVNlbGVjdG9ycyAgID0gcmVxdWlyZSgnLi9jYXB0dXJlJyk7XHJcblxyXG52YXIgZ2V0QXR0cmlidXRlUG9zaXRpb25zID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgcGFpcnMgPSBbXTtcclxuICAgIC8vIE5vdCB1c2luZyByZXR1cm4gdmFsdWUuIFNpbXBseSB1c2luZyBpdCB0byBpdGVyYXRlXHJcbiAgICAvLyB0aHJvdWdoIGFsbCBvZiB0aGUgbWF0Y2hlcyB0byBwb3B1bGF0ZSBtYXRjaCBwb3NpdGlvbnNcclxuICAgIHN0ci5yZXBsYWNlKEFUVFJJQlVURV9TRUxFQ1RPUiwgZnVuY3Rpb24obWF0Y2gsIGNhcDEsIGNhcDIsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcGFpcnMucHVzaChbIHBvc2l0aW9uLCBwb3NpdGlvbiArIG1hdGNoLmxlbmd0aCBdKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHBhaXJzO1xyXG59O1xyXG5cclxudmFyIGlzT3V0c2lkZU9mQXR0cmlidXRlID0gZnVuY3Rpb24ocG9zaXRpb24sIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHBvc2l0aW9ucy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHZhciBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICBpZiAocG9zaXRpb24gPiBwb3NbMF0gJiYgcG9zaXRpb24gPCBwb3NbMV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxudmFyIHBzZXVkb1JlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKFBTRVVET19TRUxFQ1QsIGZ1bmN0aW9uKG1hdGNoLCBjYXAsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb3h5U2VsZWN0b3JzW21hdGNoXSA/IHByb3h5U2VsZWN0b3JzW21hdGNoXSA6IG1hdGNoO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgY2FwdHVyZVJlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGNhcHR1cmVTZWxlY3RvcjtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZShDQVBUVVJFX1NFTEVDVCwgZnVuY3Rpb24obWF0Y2gsIGNhcCwgdmFsdWUsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChjYXB0dXJlU2VsZWN0b3IgPSBjYXB0dXJlU2VsZWN0b3JzW2NhcF0pID8gY2FwdHVyZVNlbGVjdG9yLnJlcGxhY2UoJ3gnLCB2YWx1ZSkgOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIGJvb2xlYW5TZWxlY3RvclJlcGxhY2UgPSBTVVBQT1JUUy5zZWxlY3RlZFNlbGVjdG9yID9cclxuICAgIC8vIElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIGZ1bmN0aW9uKHN0cikgeyByZXR1cm4gc3RyOyB9IDpcclxuICAgIC8vIElFOC05XHJcbiAgICBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb25zID0gZ2V0QXR0cmlidXRlUG9zaXRpb25zKHN0ciksXHJcbiAgICAgICAgICAgIGlkeCA9IHBvc2l0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBvcyxcclxuICAgICAgICAgICAgc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzdHIuc3Vic3RyaW5nKHBvc1swXSwgcG9zWzFdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnW3NlbGVjdGVkXScpIHtcclxuICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgcG9zWzBdKSArICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXScgKyBzdHIuc3Vic3RyaW5nKHBvc1sxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBwc2V1ZG9DYWNoZS5oYXMoc3RyKSA/IHBzZXVkb0NhY2hlLmdldChzdHIpIDogcHNldWRvQ2FjaGUucHV0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGF0dHJQb3NpdGlvbnMgPSBnZXRBdHRyaWJ1dGVQb3NpdGlvbnMoc3RyKTtcclxuICAgICAgICBzdHIgPSBwc2V1ZG9SZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICAgICAgc3RyID0gYm9vbGVhblNlbGVjdG9yUmVwbGFjZShzdHIpO1xyXG4gICAgICAgIHJldHVybiBjYXB0dXJlUmVwbGFjZShzdHIsIGF0dHJQb3NpdGlvbnMpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qXHJcbiAqIEZpenpsZS5qc1xyXG4gKiBBZGFwdGVkIGZyb20gU2l6emxlLmpzXHJcbiAqL1xyXG52YXIgdG9rZW5DYWNoZSAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHN1YnF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcblxyXG4gICAgZXJyb3IgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciAoY2F1Z2h0KSBcIicrIHNlbGVjdG9yICsnXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zZWxlY3RvcnMvI3doaXRlc3BhY2VcclxuICAgIFdISVRFU1BBQ0UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgSURFTlRJRklFUiA9ICcoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXFxceDAwLVxcXFx4YTBdKSsnLFxyXG5cclxuICAgIC8vIE5PVEU6IExlYXZpbmcgZG91YmxlIHF1b3RlcyB0byByZWR1Y2UgZXNjYXBpbmdcclxuICAgIC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xyXG4gICAgQVRUUklCVVRFUyA9IFwiXFxcXFtcIiArIFdISVRFU1BBQ0UgKyBcIiooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBPcGVyYXRvciAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiKihbKl4kfCF+XT89KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIElERU5USUZJRVJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgSURFTlRJRklFUiArIFwiKSl8KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgXCIqXFxcXF1cIixcclxuXHJcbiAgICBQU0VVRE9TID0gXCI6KFwiICsgSURFTlRJRklFUiArIFwiKSg/OlxcXFwoKFwiICtcclxuICAgICAgICAvLyBUbyByZWR1Y2UgdGhlIG51bWJlciBvZiBzZWxlY3RvcnMgbmVlZGluZyB0b2tlbml6ZSBpbiB0aGUgcHJlRmlsdGVyLCBwcmVmZXIgYXJndW1lbnRzOlxyXG4gICAgICAgIC8vIDEuIHF1b3RlZCAoY2FwdHVyZSAzOyBjYXB0dXJlIDQgb3IgY2FwdHVyZSA1KVxyXG4gICAgICAgIFwiKCcoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcIil8XCIgK1xyXG4gICAgICAgIC8vIDIuIHNpbXBsZSAoY2FwdHVyZSA2KVxyXG4gICAgICAgIFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKClbXFxcXF1dfFwiICsgQVRUUklCVVRFUyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgUl9DT01NQSAgICAgICA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqLCcgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfQ09NQklOQVRPUlMgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKihbPit+XXwnICsgV0hJVEVTUEFDRSArICcpJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9QU0VVRE8gICAgICA9IG5ldyBSZWdFeHAoUFNFVURPUyksXHJcbiAgICBSX01BVENIX0VYUFIgPSB7XHJcbiAgICAgICAgSUQ6ICAgICBuZXcgUmVnRXhwKCdeIygnICAgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBDTEFTUzogIG5ldyBSZWdFeHAoJ15cXFxcLignICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBJREVOVElGSUVSICsgJ3xbKl0pJyksXHJcbiAgICAgICAgQVRUUjogICBuZXcgUmVnRXhwKCdeJyAgICAgKyBBVFRSSUJVVEVTKSxcclxuICAgICAgICBQU0VVRE86IG5ldyBSZWdFeHAoJ14nICAgICArIFBTRVVET1MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufCknICsgV0hJVEVTUEFDRSArICcqKD86KFsrLV18KScgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBXSElURVNQQUNFICsgJypcXFxcKXwpJywgJ2knKSxcclxuICAgICAgICBib29sOiAgIG5ldyBSZWdFeHAoXCJeKD86Y2hlY2tlZHxzZWxlY3RlZHxhc3luY3xhdXRvZm9jdXN8YXV0b3BsYXl8Y29udHJvbHN8ZGVmZXJ8ZGlzYWJsZWR8aGlkZGVufGlzbWFwfGxvb3B8bXVsdGlwbGV8b3BlbnxyZWFkb25seXxyZXF1aXJlZHxzY29wZWQpJFwiLCBcImlcIilcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ1NTIGVzY2FwZXMgaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xyXG4gICAgUl9VTkVTQ0FQRSA9IG5ldyBSZWdFeHAoJ1xcXFxcXFxcKFtcXFxcZGEtZl17MSw2fScgKyBXSElURVNQQUNFICsgJz98KCcgKyBXSElURVNQQUNFICsgJyl8LiknLCAnaWcnKSxcclxuICAgIGZ1bmVzY2FwZSA9IGZ1bmN0aW9uKF8sIGVzY2FwZWQsIGVzY2FwZWRXaGl0ZXNwYWNlKSB7XHJcbiAgICAgICAgdmFyIGhpZ2ggPSAnMHgnICsgKGVzY2FwZWQgLSAweDEwMDAwKTtcclxuICAgICAgICAvLyBOYU4gbWVhbnMgbm9uLWNvZGVwb2ludFxyXG4gICAgICAgIC8vIFN1cHBvcnQ6IEZpcmVmb3g8MjRcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGVycm9uZW91cyBudW1lcmljIGludGVycHJldGF0aW9uIG9mICsnMHgnXHJcbiAgICAgICAgcmV0dXJuIGhpZ2ggIT09IGhpZ2ggfHwgZXNjYXBlZFdoaXRlc3BhY2UgP1xyXG4gICAgICAgICAgICBlc2NhcGVkIDpcclxuICAgICAgICAgICAgaGlnaCA8IDAgP1xyXG4gICAgICAgICAgICAgICAgLy8gQk1QIGNvZGVwb2ludFxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKGhpZ2ggKyAweDEwMDAwKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwbGVtZW50YWwgUGxhbmUgY29kZXBvaW50IChzdXJyb2dhdGUgcGFpcilcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZSgoaGlnaCA+PiAxMCkgfCAweEQ4MDAsIChoaWdoICYgMHgzRkYpIHwgMHhEQzAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJlRmlsdGVyID0ge1xyXG4gICAgICAgIEFUVFI6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0ucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSB0aGUgZ2l2ZW4gdmFsdWUgdG8gbWF0Y2hbM10gd2hldGhlciBxdW90ZWQgb3IgdW5xdW90ZWRcclxuICAgICAgICAgICAgbWF0Y2hbM10gPSAoIG1hdGNoWzNdIHx8IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnICkucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdID09PSAnfj0nKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFszXSA9ICcgJyArIG1hdGNoWzNdICsgJyAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgNCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgQ0hJTEQ6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIC8qIG1hdGNoZXMgZnJvbSBSX01BVENIX0VYUFJbJ0NISUxEJ11cclxuICAgICAgICAgICAgICAgIDEgdHlwZSAob25seXxudGh8Li4uKVxyXG4gICAgICAgICAgICAgICAgMiB3aGF0IChjaGlsZHxvZi10eXBlKVxyXG4gICAgICAgICAgICAgICAgMyBhcmd1bWVudCAoZXZlbnxvZGR8XFxkKnxcXGQqbihbKy1dXFxkKyk/fC4uLilcclxuICAgICAgICAgICAgICAgIDQgeG4tY29tcG9uZW50IG9mIHhuK3kgYXJndW1lbnQgKFsrLV0/XFxkKm58KVxyXG4gICAgICAgICAgICAgICAgNSBzaWduIG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNiB4IG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNyBzaWduIG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA4IHkgb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXS5zbGljZSgwLCAzKSA9PT0gJ250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIG50aC0qIHJlcXVpcmVzIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgUFNFVURPOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICB2YXIgZXhjZXNzLFxyXG4gICAgICAgICAgICAgICAgdW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoUl9NQVRDSF9FWFBSLkNISUxELnRlc3QobWF0Y2hbMF0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWNjZXB0IHF1b3RlZCBhcmd1bWVudHMgYXMtaXNcclxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgLy8gU3RyaXAgZXhjZXNzIGNoYXJhY3RlcnMgZnJvbSB1bnF1b3RlZCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1bnF1b3RlZCAmJiBSX1BTRVVETy50ZXN0KHVucXVvdGVkKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB0b2tlbml6ZSh1bnF1b3RlZCwgdHJ1ZSkpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB1bnF1b3RlZC5pbmRleE9mKCcpJywgdW5xdW90ZWQubGVuZ3RoIC0gZXhjZXNzKSAtIHVucXVvdGVkLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleGNlc3MgaXMgYSBuZWdhdGl2ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSB1bnF1b3RlZC5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBbcGFyc2VPbmx5PWZhbHNlXVxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXXxOdW1iZXJ8bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgdG9rZW5pemUgPSBmdW5jdGlvbihzZWxlY3RvciwgcGFyc2VPbmx5KSB7XHJcbiAgICBpZiAodG9rZW5DYWNoZS5oYXMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlT25seSA/IDAgOiB0b2tlbkNhY2hlLmdldChzZWxlY3Rvcikuc2xpY2UoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHR5cGUsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7UmVnRXhwfSAqL1xyXG4gICAgICAgIHJlZ2V4LFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge0FycmF5fSAqL1xyXG4gICAgICAgIG1hdGNoLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBtYXRjaGVkLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ1tdfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJpZXMgPSBbXSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc3VicXVlcnkgPSAnJyxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc29GYXIgPSBzZWxlY3RvcjtcclxuXHJcbiAgICB3aGlsZSAoc29GYXIpIHtcclxuICAgICAgICAvLyBDb21tYSBhbmQgZmlyc3QgcnVuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkIHx8IChtYXRjaCA9IFJfQ09NTUEuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uc3VtZSB0cmFpbGluZyBjb21tYXMgYXMgdmFsaWRcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKSB8fCBzb0ZhcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG4gICAgICAgICAgICBzdWJxdWVyeSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF0Y2hlZCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIENvbWJpbmF0b3JzXHJcbiAgICAgICAgaWYgKChtYXRjaCA9IFJfQ09NQklOQVRPUlMuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpbHRlcnNcclxuICAgICAgICBmb3IgKHR5cGUgaW4gUl9NQVRDSF9FWFBSKSB7XHJcbiAgICAgICAgICAgIHJlZ2V4ID0gUl9NQVRDSF9FWFBSW3R5cGVdO1xyXG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc29GYXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmICghcHJlRmlsdGVyW3R5cGVdIHx8IChtYXRjaCA9IHByZUZpbHRlclt0eXBlXShtYXRjaCkpKSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbWF0Y2hlZCkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuXHJcbiAgICAvLyBSZXR1cm4gdGhlIGxlbmd0aCBvZiB0aGUgaW52YWxpZCBleGNlc3NcclxuICAgIC8vIGlmIHdlJ3JlIGp1c3QgcGFyc2luZy5cclxuICAgIGlmIChwYXJzZU9ubHkpIHsgcmV0dXJuIHNvRmFyLmxlbmd0aDsgfVxyXG5cclxuICAgIGlmIChzb0ZhcikgeyBlcnJvcihzZWxlY3Rvcik7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgcmV0dXJuIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCBzdWJxdWVyaWVzKS5zbGljZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmdbXXxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZyB0aGUgc2VsZWN0b3IuXHJcbiAgICAgKi9cclxuICAgIHN1YnF1ZXJpZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHN1YnF1ZXJ5Q2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgICAgICBzdWJxdWVyeUNhY2hlLmdldChzZWxlY3RvcikgOiBcclxuICAgICAgICAgICAgc3VicXVlcnlDYWNoZS5wdXQoc2VsZWN0b3IsICgpID0+IHRva2VuaXplKHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzQm9vbDogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiBSX01BVENIX0VYUFIuYm9vbC50ZXN0KG5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgZXhpc3RzID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBzbGljZSAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyksXHJcbiAgICBvcmRlciAgPSByZXF1aXJlKCcuLi9vcmRlcicpO1xyXG5cclxudmFyIHVuaXF1ZSA9IGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgICAgICB2YXIgaGFzRHVwbGljYXRlcyA9IG9yZGVyLnNvcnQocmVzdWx0cyk7XHJcbiAgICAgICAgaWYgKCFoYXNEdXBsaWNhdGVzKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgICAgIHZhciBlbGVtLFxyXG4gICAgICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgICAgICAvLyBjcmVhdGUgdGhlIGFycmF5IGhlcmVcclxuICAgICAgICAgICAgLy8gc28gdGhhdCBhIG5ldyBhcnJheSBpc24ndFxyXG4gICAgICAgICAgICAvLyBjcmVhdGVkL2Rlc3Ryb3llZCBldmVyeSB1bmlxdWUgY2FsbFxyXG4gICAgICAgICAgICBkdXBsaWNhdGVzID0gW107XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggdGhlIGFycmF5IGFuZCBpZGVudGlmeVxyXG4gICAgICAgIC8vIHRoZSBkdXBsaWNhdGVzIHRvIGJlIHJlbW92ZWRcclxuICAgICAgICB3aGlsZSAoKGVsZW0gPSByZXN1bHRzW2lkeCsrXSkpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW0gPT09IHJlc3VsdHNbaWR4XSkge1xyXG4gICAgICAgICAgICAgICAgZHVwbGljYXRlcy5wdXNoKGlkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICAgICAgaWR4ID0gZHVwbGljYXRlcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgcmVzdWx0cy5zcGxpY2UoZHVwbGljYXRlc1tpZHhdLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYXAgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFyci5sZW5ndGggfHwgIWl0ZXJhdG9yKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBpdGVtO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5jb25jYXRGbGF0KHJlc3VsdHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghb2JqIHx8ICFpdGVyYXRvcikgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgLy8gQXJyYXkgc3VwcG9ydFxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGl0ZW07XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT2JqZWN0IHN1cHBvcnRcclxuICAgICAgICB2YXIga2V5LCB2YWx1ZTtcclxuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwodmFsdWUsIHZhbHVlLCBrZXkpID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBlbGVtZW50U29ydDogb3JkZXIuc29ydCxcclxuICAgIHVuaXF1ZTogdW5pcXVlLFxyXG4gICAgZWFjaDogZWFjaCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGF0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMoaW5kZXgpKSB7IHJldHVybiB0aGlzLnRvQXJyYXkoKTsgfVxyXG5cclxuICAgICAgICAgICAgaW5kZXggPSAraW5kZXg7XHJcblxyXG4gICAgICAgICAgICAvLyBMb29raW5nIHRvIGdldCBhbiBpbmRleCBmcm9tIHRoZSBlbmQgb2YgdGhlIHNldFxyXG4gICAgICAgICAgICBpZiAoaW5kZXggPCAwKSB7IGluZGV4ID0gKHRoaXMubGVuZ3RoICsgaW5kZXgpOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tpbmRleF07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZXE6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEKHRoaXMuZ2V0KGluZGV4KSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2xpY2U6IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQoc2xpY2UodGhpcy50b0FycmF5KCksIHN0YXJ0LCBlbmQpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmaXJzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvQXJyYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbWFwOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZm9yRWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICAgICAgZWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgZXhpc3RzICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRnVuY3Rpb24gICAgICAgICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICAgICA9IHJlcXVpcmUoJ25vZGUvaXNFbGVtZW50JyksXHJcbiAgICBuZXdsaW5lcyAgICAgICAgICAgICA9IHJlcXVpcmUoJ3N0cmluZy9uZXdsaW5lcycpLFxyXG4gICAgU1VQUE9SVFMgICAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgaXNOb2RlTmFtZSAgICAgICAgICAgPSByZXF1aXJlKCdub2RlL2lzTmFtZScpLFxyXG4gICAgRml6emxlICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0ZpenpsZS8nKSxcclxuICAgIHNhbml0aXplRGF0YUtleUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpO1xyXG5cclxudmFyIGlzRGF0YUtleSA9IChrZXkpID0+IChrZXkgfHwgJycpLnN1YnN0cigwLCA1KSA9PT0gJ2RhdGEtJyxcclxuXHJcbiAgICB0cmltRGF0YUtleSA9IChrZXkpID0+IGtleS5zdWJzdHIoMCwgNSksXHJcblxyXG4gICAgc2FuaXRpemVEYXRhS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHNhbml0aXplRGF0YUtleUNhY2hlLmhhcyhrZXkpID9cclxuICAgICAgICAgICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUuZ2V0KGtleSkgOlxyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5wdXQoa2V5LCAoKSA9PiBpc0RhdGFLZXkoa2V5KSA/IGtleSA6ICdkYXRhLScgKyBrZXkudG9Mb3dlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGFBdHRyS2V5cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgYXR0cnMgPSBlbGVtLmF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIGlkeCAgID0gYXR0cnMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXlzICA9IFtdLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGF0dHJzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChpc0RhdGFLZXkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfTtcclxuXHJcbi8vIElFOSssIG1vZGVybiBicm93c2Vyc1xyXG52YXIgaGFzQXR0ciA9IChlbGVtLCBhdHRyKSA9PiBlbGVtLmhhc0F0dHJpYnV0ZShhdHRyKTtcclxuXHJcbnZhciBib29sSG9vayA9IHtcclxuICAgIGlzOiAoYXR0ck5hbWUpID0+IEZpenpsZS5wYXJzZS5pc0Jvb2woYXR0ck5hbWUpLFxyXG4gICAgZ2V0OiAoZWxlbSwgYXR0ck5hbWUpID0+IGhhc0F0dHIoZWxlbSwgYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWhhc0F0dHIoZWxlbSwgYXR0cikpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChib29sSG9vay5pcyhhdHRyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYm9vbEhvb2suZ2V0KGVsZW0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLmdldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0uZ2V0KGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJldCA9IGVsZW0uZ2V0QXR0cmlidXRlKGF0dHIpO1xyXG4gICAgICAgIHJldHVybiBleGlzdHMocmV0KSA/IHJldCA6IHVuZGVmaW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0dGVycyA9IHtcclxuICAgICAgICBmb3JBdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikgJiYgKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmJvb2w7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0uc2V0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ob29rO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmVsZW07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBib29sOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBib29sSG9vay5zZXQoZWxlbSwgdmFsdWUsIGF0dHIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaG9vazogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaG9va3NbYXR0cl0uc2V0KGVsZW0sIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVsZW06IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGF0dHIsIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIF9zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHZhciBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGUoYXJyW2lkeF0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICByZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLnJlbW92ZShlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBhdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldEF0dHJpYnV0ZSh0aGlzWzBdLCBhdHRyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0cnMgPSBhdHRyO1xyXG4gICAgICAgICAgICAgICAgZm9yIChhdHRyIGluIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZVxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRvclxyXG4gICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZEF0dHIgPSBnZXRBdHRyaWJ1dGUoZWxlbSwgYXR0ciksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyhyZXN1bHQpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmVBdHRyOiBmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhhdHRyKSkge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhdHRyRGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGtleXMgPSBnZXREYXRhQXR0cktleXMoZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCAgPSBrZXlzLmxlbmd0aCwga2V5O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAga2V5ID0ga2V5c1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcFt0cmltRGF0YUtleShrZXkpXSA9IF8udHlwZWNhc3QoZmlyc3QuZ2V0QXR0cmlidXRlKGtleSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBhbiBvYmplY3QgZGVmaW5pdGlvblxyXG4gICAgICAgICAgICB2YXIgb2JqID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRUxFTUVOVCAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIHNwbGl0ICAgICA9IHJlcXVpcmUoJ3N0cmluZy9zcGxpdCcpLFxyXG4gICAgaXNFbXB0eSAgID0gcmVxdWlyZSgnc3RyaW5nL2lzRW1wdHknKTtcclxuXHJcbnZhciBoYXNDbGFzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gISFlbGVtLmNsYXNzTGlzdCAmJiBlbGVtLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtLmNsYXNzTGlzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC5hZGQobmFtZXNbaWR4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbSwgbmFtZXMpIHtcclxuICAgICAgICBpZiAoIWVsZW0uY2xhc3NMaXN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZShuYW1lc1tpZHhdKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtLCBuYW1lcykge1xyXG4gICAgICAgIGlmICghZWxlbS5jbGFzc0xpc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QudG9nZ2xlKG5hbWVzW2lkeF0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgX2RvQW55RWxlbXNIYXZlQ2xhc3MgPSBmdW5jdGlvbihlbGVtcywgbmFtZSkge1xyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGlmIChoYXNDbGFzcyhlbGVtc1tlbGVtSWR4XSwgbmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBfYWRkQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KG5hbWVzKSkgeyBuYW1lcyA9IF8udG9BcnJheShuYW1lcyk7IH1cclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBhZGRDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfcmVtb3ZlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KG5hbWVzKSkgeyBuYW1lcyA9IF8udG9BcnJheShuYW1lcyk7IH1cclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICByZW1vdmVDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfcmVtb3ZlQWxsQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zKSB7XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgZWxlbXNbZWxlbUlkeF0uY2xhc3NOYW1lID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfdG9nZ2xlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KG5hbWVzKSkgeyBuYW1lcyA9IF8udG9BcnJheShuYW1lcyk7IH1cclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICB0b2dnbGVDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBoYXNDbGFzczogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2RvQW55RWxlbXNIYXZlQ2xhc3ModGhpcywgbmFtZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lcztcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBzcGxpdChuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmICghbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgX2FkZENsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmVDbGFzczogZnVuY3Rpb24obmFtZXMpIHtcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlQWxsQ2xhc3Nlcyh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWVzKSB8fCAhbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgX3JlbW92ZUNsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IHNwbGl0KG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzLCBzaG91bGRBZGQpIHtcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZXMpIHx8ICFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIG5hbWVzID0gc3BsaXQobmFtZXMpO1xyXG4gICAgICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHNob3VsZEFkZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBfdG9nZ2xlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgICAgICAgICBfYWRkQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICB0b1B4ICAgICAgID0gcmVxdWlyZSgndXRpbC90b1B4JyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNEb2N1bWVudCA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Jvb2xlYW4gID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBwYXJzZU51bSAgID0gcmVxdWlyZSgndXRpbC9wYXJzZUludCcpLFxyXG4gICAgRE9DVU1FTlQgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVCcpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgc3dhcFNldHRpbmdzID0ge1xyXG4gICAgbWVhc3VyZURpc3BsYXk6IHtcclxuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxyXG4gICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0RG9jdW1lbnREaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAvLyBFaXRoZXIgc2Nyb2xsW1dpZHRoL0hlaWdodF0gb3Igb2Zmc2V0W1dpZHRoL0hlaWdodF0gb3JcclxuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdLCB3aGljaGV2ZXIgaXMgZ3JlYXRlc3RcclxuICAgIHZhciBkb2MgPSBlbGVtLmRvY3VtZW50RWxlbWVudDtcclxuICAgIHJldHVybiBNYXRoLm1heChcclxuICAgICAgICBlbGVtLmJvZHlbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBlbGVtLmJvZHlbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZG9jWydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snY2xpZW50JyArIG5hbWVdXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIGhpZGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSxcclxuICAgIHNob3cgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGNzc1N3YXAgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBvbGQgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMsIGFuZCBpbnNlcnQgdGhlIG5ldyBvbmVzXHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgb2xkW25hbWVdID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvbGRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBdm9pZHMgYW4gJ0lsbGVnYWwgSW52b2NhdGlvbicgZXJyb3IgKENocm9tZSlcclxuICAgIC8vIEF2b2lkcyBhICdUeXBlRXJyb3I6IEFyZ3VtZW50IDEgb2YgV2luZG93LmdldENvbXB1dGVkU3R5bGUgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBFbGVtZW50JyBlcnJvciAoRmlyZWZveClcclxuICAgIGdldENvbXB1dGVkU3R5bGUgPSAoZWxlbSkgPT5cclxuICAgICAgICBpc0VsZW1lbnQoZWxlbSkgJiYgIWlzV2luZG93KGVsZW0pICYmICFpc0RvY3VtZW50KGVsZW0pID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSkgOiBudWxsLFxyXG5cclxuICAgIF93aWR0aCA9IHtcclxuICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gRE9DVU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnV2lkdGgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgaWYgKHdpZHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwU2V0dGluZ3MubWVhc3VyZURpc3BsYXksIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9IGlzTnVtYmVyKHZhbCkgPyB0b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9oZWlnaHQgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IERPQ1VNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ0hlaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBTZXR0aW5ncy5tZWFzdXJlRGlzcGxheSwgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLmhlaWdodCA9IGlzTnVtYmVyKHZhbCkgPyB0b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGdldFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcblxyXG4gICAgLy8gU3RhcnQgd2l0aCBvZmZzZXQgcHJvcGVydHksIHdoaWNoIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGJvcmRlci1ib3ggdmFsdWVcclxuICAgIHZhciB2YWx1ZUlzQm9yZGVyQm94ID0gdHJ1ZSxcclxuICAgICAgICB2YWwgPSAobmFtZSA9PT0gJ3dpZHRoJykgPyBlbGVtLm9mZnNldFdpZHRoIDogZWxlbS5vZmZzZXRIZWlnaHQsXHJcbiAgICAgICAgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICBpc0JvcmRlckJveCA9IHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94JztcclxuXHJcbiAgICAvLyBzb21lIG5vbi1odG1sIGVsZW1lbnRzIHJldHVybiB1bmRlZmluZWQgZm9yIG9mZnNldFdpZHRoLCBzbyBjaGVjayBmb3IgbnVsbC91bmRlZmluZWRcclxuICAgIC8vIHN2ZyAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY0OTI4NVxyXG4gICAgLy8gTWF0aE1MIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NDkxNjY4XHJcbiAgICBpZiAodmFsIDw9IDAgfHwgIWV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGNvbXB1dGVkIHRoZW4gdW5jb21wdXRlZCBjc3MgaWYgbmVjZXNzYXJ5XHJcbiAgICAgICAgdmFsID0gY3VyQ3NzKGVsZW0sIG5hbWUsIHN0eWxlcyk7XHJcbiAgICAgICAgaWYgKHZhbCA8IDAgfHwgIXZhbCkgeyB2YWwgPSBlbGVtLnN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGVkIHVuaXQgaXMgbm90IHBpeGVscy4gU3RvcCBoZXJlIGFuZCByZXR1cm4uXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRoZSBjaGVjayBmb3Igc3R5bGUgaW4gY2FzZSBhIGJyb3dzZXIgd2hpY2ggcmV0dXJucyB1bnJlbGlhYmxlIHZhbHVlc1xyXG4gICAgICAgIC8vIGZvciBnZXRDb21wdXRlZFN0eWxlIHNpbGVudGx5IGZhbGxzIGJhY2sgdG8gdGhlIHJlbGlhYmxlIGVsZW0uc3R5bGVcclxuICAgICAgICB2YWx1ZUlzQm9yZGVyQm94ID0gaXNCb3JkZXJCb3ggJiYgdmFsID09PSBzdHlsZXNbbmFtZV07XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSAnJywgYXV0bywgYW5kIHByZXBhcmUgZm9yIGV4dHJhXHJcbiAgICAgICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIHRoZSBhY3RpdmUgYm94LXNpemluZyBtb2RlbCB0byBhZGQvc3VidHJhY3QgaXJyZWxldmFudCBzdHlsZXNcclxuICAgIHJldHVybiB0b1B4KFxyXG4gICAgICAgIHZhbCArIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0KFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnLFxyXG4gICAgICAgICAgICB2YWx1ZUlzQm9yZGVyQm94LFxyXG4gICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICApXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIENTU19FWFBBTkQgPSBzcGxpdCgnVG9wfFJpZ2h0fEJvdHRvbXxMZWZ0Jyk7XHJcbnZhciBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGV4dHJhLCBpc0JvcmRlckJveCwgc3R5bGVzKSB7XHJcbiAgICB2YXIgdmFsID0gMCxcclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHJpZ2h0IG1lYXN1cmVtZW50LCBhdm9pZCBhdWdtZW50YXRpb25cclxuICAgICAgICBpZHggPSAoZXh0cmEgPT09IChpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnKSkgP1xyXG4gICAgICAgICAgICA0IDpcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGluaXRpYWxpemUgZm9yIGhvcml6b250YWwgb3IgdmVydGljYWwgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAobmFtZSA9PT0gJ3dpZHRoJykgP1xyXG4gICAgICAgICAgICAxIDpcclxuICAgICAgICAgICAgMCxcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIC8vIFB1bGxlZCBvdXQgb2YgdGhlIGxvb3AgdG8gcmVkdWNlIHN0cmluZyBjb21wYXJpc29uc1xyXG4gICAgICAgIGV4dHJhSXNNYXJnaW4gID0gKGV4dHJhID09PSAnbWFyZ2luJyksXHJcbiAgICAgICAgZXh0cmFJc0NvbnRlbnQgPSAoIWV4dHJhSXNNYXJnaW4gJiYgZXh0cmEgPT09ICdjb250ZW50JyksXHJcbiAgICAgICAgZXh0cmFJc1BhZGRpbmcgPSAoIWV4dHJhSXNNYXJnaW4gJiYgIWV4dHJhSXNDb250ZW50ICYmIGV4dHJhID09PSAncGFkZGluZycpO1xyXG5cclxuICAgIGZvciAoOyBpZHggPCA0OyBpZHggKz0gMikge1xyXG4gICAgICAgIHR5cGUgPSBDU1NfRVhQQU5EW2lkeF07XHJcblxyXG4gICAgICAgIC8vIGJvdGggYm94IG1vZGVscyBleGNsdWRlIG1hcmdpbiwgc28gYWRkIGl0IGlmIHdlIHdhbnQgaXRcclxuICAgICAgICBpZiAoZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICB2YWwgKz0gcGFyc2VOdW0oc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBwYXJzZU51bShzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGJvcmRlciBub3IgbWFyZ2luLCBzbyByZW1vdmUgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmICghZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IHBhcnNlTnVtKHN0eWxlc1snYm9yZGVyJyArIHR5cGUgKyAnV2lkdGgnXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCwgc28gYWRkIHBhZGRpbmdcclxuICAgICAgICAgICAgdmFsICs9IHBhcnNlTnVtKHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gcGFyc2VOdW0oc3R5bGVzWydib3JkZXInICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZhbDtcclxufTtcclxuXHJcbnZhciBnZXRQcm9wZXJ0eVZhbHVlID0gZnVuY3Rpb24oc3R5bGVzLCBuYW1lKSB7XHJcbiAgICByZXR1cm4gc3R5bGVzLmdldFByb3BlcnR5VmFsdWUobmFtZSk7XHJcbn07XHJcblxyXG52YXIgY3VyQ3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgY29tcHV0ZWQpIHtcclxuICAgIHZhciBzdHlsZSA9IGVsZW0uc3R5bGUsXHJcbiAgICAgICAgc3R5bGVzID0gY29tcHV0ZWQgfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICByZXQgPSBzdHlsZXMgPyBnZXRQcm9wZXJ0eVZhbHVlKHN0eWxlcywgbmFtZSkgfHwgc3R5bGVzW25hbWVdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEF2b2lkIHNldHRpbmcgcmV0IHRvIGVtcHR5IHN0cmluZyBoZXJlXHJcbiAgICAvLyBzbyB3ZSBkb24ndCBkZWZhdWx0IHRvIGF1dG9cclxuICAgIGlmICghZXhpc3RzKHJldCkgJiYgc3R5bGUgJiYgc3R5bGVbbmFtZV0pIHsgcmV0ID0gc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAvLyBGcm9tIHRoZSBoYWNrIGJ5IERlYW4gRWR3YXJkc1xyXG4gICAgLy8gaHR0cDovL2VyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA3LzA3LzI3LzE4LjU0LjE1LyNjb21tZW50LTEwMjI5MVxyXG5cclxuICAgIGlmIChzdHlsZXMpIHtcclxuICAgICAgICBpZiAocmV0ID09PSAnJyAmJiAhaXNBdHRhY2hlZChlbGVtKSkge1xyXG4gICAgICAgICAgICByZXQgPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXHJcbiAgICAgICAgLy8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXHJcbiAgICAgICAgLy8gYnV0IG5vdCBwb3NpdGlvbiBjc3MgYXR0cmlidXRlcywgYXMgdGhvc2UgYXJlIHByb3BvcnRpb25hbCB0byB0aGUgcGFyZW50IGVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICAgIC8vIGFuZCB3ZSBjYW4ndCBtZWFzdXJlIHRoZSBwYXJlbnQgaW5zdGVhZCBiZWNhdXNlIGl0IG1pZ2h0IHRyaWdnZXIgYSAnc3RhY2tpbmcgZG9sbHMnIHByb2JsZW1cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgocmV0KSAmJiAhUkVHRVgucG9zaXRpb24obmFtZSkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyIGxlZnQgPSBzdHlsZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcnMgPSBlbGVtLnJ1bnRpbWVTdHlsZSxcclxuICAgICAgICAgICAgICAgIHJzTGVmdCA9IHJzICYmIHJzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IGVsZW0uY3VycmVudFN0eWxlLmxlZnQ7IH1cclxuXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAobmFtZSA9PT0gJ2ZvbnRTaXplJykgPyAnMWVtJyA6IHJldDtcclxuICAgICAgICAgICAgcmV0ID0gdG9QeChzdHlsZS5waXhlbExlZnQpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV2ZXJ0IHRoZSBjaGFuZ2VkIHZhbHVlc1xyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gbGVmdDtcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gcnNMZWZ0OyB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXQgPT09IHVuZGVmaW5lZCA/IHJldCA6IHJldCArICcnIHx8ICdhdXRvJztcclxufTtcclxuXHJcbnZhciBub3JtYWxpemVDc3NLZXkgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICByZXR1cm4gUkVHRVguY2FtZWxDYXNlKG5hbWUpO1xyXG59O1xyXG5cclxudmFyIHNldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICBlbGVtLnN0eWxlW25hbWVdID0gKHZhbHVlID09PSArdmFsdWUpID8gdG9QeCh2YWx1ZSkgOiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVtuYW1lXTtcclxufTtcclxuXHJcbnZhciBpc0hpZGRlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQ6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC5vZmZzZXRQYXJlbnRcclxuICAgIHJldHVybiBlbGVtLm9mZnNldFBhcmVudCA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAvLyBTdXBwb3J0OiBPcGVyYSA8PSAxMi4xMlxyXG4gICAgICAgICAgICAvLyBPcGVyYSByZXBvcnRzIG9mZnNldFdpZHRocyBhbmQgb2Zmc2V0SGVpZ2h0cyBsZXNzIHRoYW4gemVybyBvbiBzb21lIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwIHx8XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICgoZWxlbS5zdHlsZSAmJiBlbGVtLnN0eWxlLmRpc3BsYXkpID8gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgOiBmYWxzZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHN3YXA6ICAgICAgICBjc3NTd2FwLFxyXG4gICAgc3dhcFNldHRpbmc6IHN3YXBTZXR0aW5ncyxcclxuICAgIGN1ckNzczogICAgICBjdXJDc3MsXHJcbiAgICB3aWR0aDogICAgICAgX3dpZHRoLFxyXG4gICAgaGVpZ2h0OiAgICAgIF9oZWlnaHQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjc3M6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwgbmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIGtleSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghaWR4KSB7IHJldHVybiByZXQ7IH0gLy8gcmV0dXJuIGVhcmx5XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXRbdmFsdWVdID0gZ2V0U3R5bGUoZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGhpZGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgc2hvdyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNCb29sZWFuKHN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gaXNIaWRkZW4oZWxlbSkgPyBzaG93KGVsZW0pIDogaGlkZShlbGVtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgyLCB0cnVlKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIEFDQ0VTU09SICA9ICdfX0RfaWRfXyAnLFxyXG4gICAgdW5pcXVlSWQgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoRGF0ZS5ub3coKSksXHJcblxyXG4gICAgZ2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0gPyBlbGVtW0FDQ0VTU09SXSA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE9yU2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghZWxlbSB8fCAoaWQgPSBlbGVtW0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtBQ0NFU1NPUl0gPSAoaWQgPSB1bmlxdWVJZCgpKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc0RhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5oYXMoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IGdldE9yU2V0SWQoZWxlbSk7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZURhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaGFzOiBoYXNEYXRhLFxyXG4gICAgc2V0OiBzZXREYXRhLFxyXG4gICAgZ2V0OiBmdW5jdGlvbihlbGVtLCBzdHIpIHtcclxuICAgICAgICBpZiAoc3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldEFsbERhdGEoZWxlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIHN0cik7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihlbGVtLCBzdHIpIHtcclxuICAgICAgICBpZiAoc3RyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUFsbERhdGEoZWxlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIHN0cik7XHJcbiAgICB9LFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICAvLyBOT1RFOiBOb2RlTGlzdCB8fCBIdG1sQ29sbGVjdGlvbiBzdXBwb3J0P1xyXG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXREYXRhKGVsZW0sIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShlbGVtLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9iamVjdCBwYXNzZWRcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBrZXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEFsbERhdGEoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhhc0RhdGE6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhc0RhdGEoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlRGF0YShlbGVtLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSBrZXk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdldCBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCB2YWx1ZXMgZnJvbSBoYXNoIG1hcFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBnZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU2V0IGtleSdzIHZhbHVlXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBnZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBOT1RFOiBOb2RlTGlzdCB8fCBIdG1sQ29sbGVjdGlvbiBzdXBwb3J0P1xyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbZWxlbUlkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJySWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcnJJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2FycklkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBwYXJzZU51bSA9IHJlcXVpcmUoJ3V0aWwvcGFyc2VJbnQnKSxcclxuICAgIGlzTnVtYmVyID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBjc3MgICAgICA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG52YXIgZ2V0SW5uZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChwYXJzZU51bShjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nTGVmdCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1JpZ2h0JykpIHx8IDApO1xyXG4gICAgfSxcclxuICAgIGdldElubmVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGVsZW0pKSB8fCAwO1xyXG5cclxuICAgICAgICByZXR1cm4gaGVpZ2h0ICtcclxuICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdCb3R0b20nKSkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE91dGVyV2lkdGggPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gZ2V0SW5uZXJXaWR0aChlbGVtKTtcclxuXHJcbiAgICAgICAgaWYgKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgd2lkdGggKz0gKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkxlZnQnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblJpZ2h0JykpIHx8IDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoICtcclxuICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckxlZnRXaWR0aCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyUmlnaHRXaWR0aCcpKSB8fCAwKTtcclxuICAgIH0sXHJcbiAgICBnZXRPdXRlckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gZ2V0SW5uZXJIZWlnaHQoZWxlbSk7XHJcblxyXG4gICAgICAgIGlmICh3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIGhlaWdodCArPSAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChwYXJzZU51bShjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Cb3R0b20nKSkgfHwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaGVpZ2h0ICtcclxuICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclRvcFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChwYXJzZU51bShjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKSB8fCAwKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgd2lkdGg6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBjc3Mud2lkdGguc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3Mud2lkdGguZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoZWlnaHQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBjc3MuaGVpZ2h0LnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5uZXJXaWR0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0SW5uZXJXaWR0aChmaXJzdCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5uZXJIZWlnaHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldElubmVySGVpZ2h0KGZpcnN0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvdXRlcldpZHRoOiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldE91dGVyV2lkdGgoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb3V0ZXJIZWlnaHQ6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3V0ZXJIZWlnaHQoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaGFuZGxlcnMgPSB7fTtcclxuXHJcbnZhciByZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUsIHR5cGUsIGZpbHRlcikge1xyXG4gICAgaGFuZGxlcnNbbmFtZV0gPSB7XHJcbiAgICAgICAgZXZlbnQ6IHR5cGUsXHJcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXHJcbiAgICAgICAgd3JhcDogZnVuY3Rpb24oZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIobmFtZSwgZm4pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgd3JhcHBlciA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcbiAgICBpZiAoIWZuKSB7IHJldHVybiBmbjsgfVxyXG5cclxuICAgIHZhciBrZXkgPSAnX19kY2VfJyArIG5hbWU7XHJcbiAgICBpZiAoZm5ba2V5XSkgeyByZXR1cm4gZm5ba2V5XTsgfVxyXG5cclxuICAgIHJldHVybiBmbltrZXldID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBtYXRjaCA9IGhhbmRsZXJzW25hbWVdLmZpbHRlcihlKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5yZWdpc3RlcignbGVmdC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAxICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdtaWRkbGUtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMiAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcigncmlnaHQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMyAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZWdpc3RlcjogcmVnaXN0ZXIsXHJcbiAgICBoYW5kbGVyczogaGFuZGxlcnNcclxufTsiLCJ2YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50JyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIG1hdGNoZXMgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgZGVsZWdhdGVzID0ge307XHJcblxyXG4vLyB0aGlzIG1ldGhvZCBjYWNoZXMgZGVsZWdhdGVzIHNvIHRoYXQgLm9mZigpIHdvcmtzIHNlYW1sZXNzbHlcclxudmFyIGRlbGVnYXRlID0gZnVuY3Rpb24ocm9vdCwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoZGVsZWdhdGVzW2ZuLl9kZF0pIHsgcmV0dXJuIGRlbGVnYXRlc1tmbi5fZGRdOyB9XHJcblxyXG4gICAgdmFyIGlkID0gZm4uX2RkID0gRGF0ZS5ub3coKTtcclxuICAgIHJldHVybiBkZWxlZ2F0ZXNbaWRdID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gcm9vdCkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGV2ZW50ZWQgPSBmdW5jdGlvbihtZXRob2QsIGVsLCB0eXBlLCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmICghZXhpc3RzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZm4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGRlbGVnYXRlKGVsLCBzZWxlY3RvciwgZm4pKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5hZGQpLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5yZW1vdmUpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5mYWJyaWNhdGUpXHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGRlbGVnYXRlICAgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyksXHJcbiAgICBjdXN0b20gICAgID0gcmVxdWlyZSgnLi9jdXN0b20nKTtcclxuXHJcbnZhciBldmVudGVyID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZXMsIGZpbHRlciwgZm4pIHtcclxuICAgICAgICB2YXIgdHlwZWxpc3QgPSB0eXBlcy5zcGxpdCgnICcpO1xyXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmbikpIHtcclxuICAgICAgICAgICAgZm4gPSBmaWx0ZXI7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0eXBlbGlzdCwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjdXN0b20uaGFuZGxlcnNbdHlwZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCBoYW5kbGVyLmV2ZW50LCBmaWx0ZXIsIGhhbmRsZXIud3JhcChmbikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgdHlwZSwgZmlsdGVyLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBvbjogICAgICBldmVudGVyKGRlbGVnYXRlLm9uKSxcclxuICAgICAgICBvZmY6ICAgICBldmVudGVyKGRlbGVnYXRlLm9mZiksXHJcbiAgICAgICAgdHJpZ2dlcjogZXZlbnRlcihkZWxlZ2F0ZS50cmlnZ2VyKVxyXG4gICAgfVxyXG59OyIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksICAgXHJcbiAgICBleGlzdHMgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2QnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzSHRtbCAgICAgICA9IHJlcXVpcmUoJ2lzL2h0bWwnKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzTnVtYmVyICAgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2QnKSxcclxuICAgIGlzV2luZG93ICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIHNlbGVjdG9ycyAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzJyksXHJcbiAgICBhcnJheSAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5JyksXHJcbiAgICBvcmRlciAgICAgICAgPSByZXF1aXJlKCcuLi9vcmRlcicpLFxyXG4gICAgZGF0YSAgICAgICAgID0gcmVxdWlyZSgnLi9kYXRhJyksXHJcbiAgICBwYXJzZXIgICAgICAgPSByZXF1aXJlKCcuL3BhcnNlci9wYXJzZXInKTtcclxuXHJcbnZhciBlbXB0eSA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IGFycltpZHhdLFxyXG4gICAgICAgICAgICAgICAgZGVzY2VuZGFudHMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSxcclxuICAgICAgICAgICAgICAgIGkgPSBkZXNjZW5kYW50cy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBkZXNjO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBkZXNjID0gZGVzY2VuZGFudHNbaV07XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZSA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLCBwYXJlbnQ7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICBpZiAoZWxlbSAmJiAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5yZW1vdmUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGFjaCA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLCBwYXJlbnQ7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICBpZiAoZWxlbSAmJiAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbS5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0cmluZ1RvRnJhZyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIGZyYWc7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZFByZXBlbmRGdW5jID0gZnVuY3Rpb24oZCwgZm4sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChkLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTCk7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcocmVzdWx0KSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcGFyc2VyLnBhcnNlSHRtbChlbGVtKSwgcGVuZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgc3RyaW5nVG9GcmFnKHJlc3VsdCkpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0VsZW1lbnQocmVzdWx0KSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHBlbmRlcihlbGVtLCByZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc05vZGVMaXN0KHJlc3VsdCkgfHwgaXNEKHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5ID0gZnVuY3Rpb24oYXJyT25lLCBhcnJUd28sIHBlbmRlcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnJPbmUubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gMCwgbGVuID0gYXJyVHdvLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGFyck9uZVtpZHhdLCBhcnJUd29baV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSA9IGZ1bmN0aW9uKGFyciwgZWxlbSwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoYXJyRWxlbSwgZWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtID0gZnVuY3Rpb24oZWxlbSwgYXJyLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihlbGVtLCBhcnJFbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICB9LFxyXG4gICAgcHJlcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmluc2VydEJlZm9yZShlbGVtLCBiYXNlLmZpcnN0Q2hpbGQpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYXBwZW5kICA6IGFwcGVuZCxcclxuICAgIHByZXBlbmQgOiBwcmVwZW5kLFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5mYXN0bWFwKHRoaXMuc2xpY2UoKSwgKGVsZW0pID0+IGNsb25lKGVsZW0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyLnBhcnNlSHRtbCh2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIGFwcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgaWYgKGlzRChkKSkge1xyXG4gICAgICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyLnBhcnNlSHRtbCh2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcodmFsdWUpLCBwcmVwZW5kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnKCcnICsgdmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBpZiAoaXNEKGQpKSB7XHJcbiAgICAgICAgICAgICAgICBkLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGVtcHR5KHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIC8vIFN0cmluZyBzZWxlY3RvclxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSBhcnJheS51bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIEQoc2VsZWN0b3IpLmdldCgpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gYXJyYXkudW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBfLnRvQXJyYXkoYXJyKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU2luZ2xlIGVsZW1lbnRcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSB8fCBpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gYXJyYXkudW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBbIGVsZW0gXSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIEQodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9ycy5maWx0ZXIodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlKGFycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3JzLmZpbHRlcih0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICBkZXRhY2goYXJyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICBkZXRhY2godGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzUmVhZHkgPSBmYWxzZSxcclxuICAgIHJlZ2lzdHJhdGlvbiA9IFtdO1xyXG5cclxudmFyIGJpbmQgPSBmdW5jdGlvbihmbikge1xyXG4gICAgLy8gQWxyZWFkeSBsb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgcmV0dXJuIGZuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhbmRhcmRzLWJhc2VkIGJyb3dzZXJzIHN1cHBvcnQgRE9NQ29udGVudExvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBJRSBldmVudCBtb2RlbCBpcyB1c2VkXHJcblxyXG4gICAgLy8gRW5zdXJlIGZpcmluZyBiZWZvcmUgb25sb2FkLCBtYXliZSBsYXRlIGJ1dCBzYWZlIGFsc28gZm9yIGlmcmFtZXNcclxuICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykgeyBmbigpOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBIGZhbGxiYWNrIHRvIHdpbmRvdy5vbmxvYWQsIHRoYXQgd2lsbCBhbHdheXMgd29ya1xyXG4gICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmbik7XHJcbn07XHJcblxyXG52YXIgbWFrZUNhbGxzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICBsZW5ndGggPSByZWdpc3RyYXRpb24ubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZWdpc3RyYXRpb25baWR4XSgpO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0cmF0aW9uLmxlbmd0aCA9IDA7XHJcbn07XHJcblxyXG5iaW5kKGZ1bmN0aW9uKCkge1xyXG4gICAgaXNSZWFkeSA9IHRydWU7XHJcbiAgICBtYWtlQ2FsbHMoKTtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICBpZiAoaXNSZWFkeSkge1xyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgfSBlbHNlIHtcclxuICAgICAgICByZWdpc3RyYXRpb24ucHVzaChjYWxsYmFjayk7XHJcbiAgICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuIiwidmFyIFJFR0VYID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIE1BWF9TSU5HTEVfVEFHX0xFTkdUSCA9IDMwO1xyXG5cclxudmFyIHBhcnNlU3RyaW5nID0gZnVuY3Rpb24ocGFyZW50VGFnTmFtZSwgaHRtbFN0cikge1xyXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQocGFyZW50VGFnTmFtZSk7XHJcbiAgICBwYXJlbnQuaW5uZXJIVE1MID0gaHRtbFN0cjtcclxuICAgIHJldHVybiBwYXJlbnQ7XHJcbn07XHJcblxyXG52YXIgcGFyc2VTaW5nbGVUYWcgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICBpZiAoaHRtbFN0ci5sZW5ndGggPiBNQVhfU0lOR0xFX1RBR19MRU5HVEgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgc2luZ2xlVGFnTWF0Y2ggPSBSRUdFWC5zaW5nbGVUYWdNYXRjaChodG1sU3RyKTtcclxuICAgIGlmICghc2luZ2xlVGFnTWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoc2luZ2xlVGFnTWF0Y2hbMV0pO1xyXG5cclxuICAgIHJldHVybiBbIGVsZW0gXTtcclxufTtcclxuXHJcbnZhciBwYXJzZSA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIHZhciBzaW5nbGVUYWcgPSBwYXJzZVNpbmdsZVRhZyhodG1sU3RyKTtcclxuICAgIGlmIChzaW5nbGVUYWcpIHsgcmV0dXJuIHNpbmdsZVRhZzsgfVxyXG5cclxuICAgIHZhciBwYXJlbnRUYWdOYW1lID0gUkVHRVguZ2V0UGFyZW50VGFnTmFtZShodG1sU3RyKSxcclxuICAgICAgICBwYXJlbnQgICAgICAgID0gcGFyc2VTdHJpbmcocGFyZW50VGFnTmFtZSwgaHRtbFN0cik7XHJcblxyXG4gICAgdmFyIGNoaWxkLFxyXG4gICAgICAgIGlkeCA9IHBhcmVudC5jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgYXJyID0gW107XHJcblxyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2hpbGRyZW5baWR4XTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG5cclxuICAgICAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9qcy1wdXNoLXZzLWluZGV4MTEvMlxyXG4gICAgICAgIGFycltpZHhdID0gY2hpbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyZW50ID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxufTtcclxuXHJcbnZhciBwYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gcGFyc2Uoc3RyKTtcclxuICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQubGVuZ3RoKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICByZXR1cm4gRChyZXN1bHQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZUh0bWw6IHBhcnNlLFxyXG5cclxuICAgIC8vIFRvcC1sZXZlbCBmdW5jdGlvbnMgYXR0YWNoZWQgZGlyZWN0bHkgdG8gRC5cclxuICAgIC8vIEludm9rZWQgdmlhIGBELnBhcnNlSFRNTCgnLi4uJylgLCBhcyBvcHBvc2VkIHRvIGBEKCdkaXYnKS5wYXJzZUhUTUwoJy4uLicpYC5cclxuICAgIEQ6IHtcclxuICAgICAgICBwYXJzZUh0bWw6IHBhcnNlSHRtbCxcclxuICAgICAgICAvLyBCZWNhdXNlIG5vIG9uZSBrbm93IHdoYXQgdGhlIGNhc2Ugc2hvdWxkIGJlXHJcbiAgICAgICAgcGFyc2VIVE1MOiBwYXJzZUh0bWxcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG5cclxuICAgIHRvUHggICAgICAgPSByZXF1aXJlKCd1dGlsL3RvUHgnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXR0YWNoZWQgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc09iamVjdCAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuXHJcbiAgICBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxudmFyIGdldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHJlY3QgPSBpc0F0dGFjaGVkKGVsZW0pID8gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiAgKHJlY3QudG9wICArIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSAgfHwgMCxcclxuICAgICAgICBsZWZ0OiAocmVjdC5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IGdldE9mZnNldChlbGVtKSxcclxuICAgICAgICBjdXJDU1NUb3AgICAgICAgICA9IGVsZW0uc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gZWxlbS5zdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBlbGVtLnN0eWxlLnRvcCAgPSB0b1B4KHByb3BzLnRvcCk7XHJcbiAgICBlbGVtLnN0eWxlLmxlZnQgPSB0b1B4KHByb3BzLmxlZnQpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBmbjoge1xyXG4gICAgICAgIHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRQb3NpdGlvbihmaXJzdCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb2Zmc2V0OiBmdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0KGZpcnN0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24ocG9zT3JJdGVyYXRvcikgfHwgaXNPYmplY3QocG9zT3JJdGVyYXRvcikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT4gc2V0T2Zmc2V0KGVsZW0sIGlkeCwgcG9zT3JJdGVyYXRvcikpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvZmZzZXRQYXJlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8ubWFwKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgZG9jRWxlbTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiAoIWlzTm9kZU5hbWUob2Zmc2V0UGFyZW50LCAnaHRtbCcpICYmIChvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycpID09PSAnc3RhdGljJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZG9jRWxlbTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgcGFyc2VOdW0gICA9IHJlcXVpcmUoJ3V0aWwvcGFyc2VJbnQnKSxcclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFRFWFQgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvVEVYVCcpLFxyXG4gICAgQ09NTUVOVCAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9DT01NRU5UJyksXHJcbiAgICBBVFRSSUJVVEUgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0FUVFJJQlVURScpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgcHJvcEZpeCA9IHNwbGl0KCd0YWJJbmRleHxyZWFkT25seXxjbGFzc05hbWV8bWF4TGVuZ3RofGNlbGxTcGFjaW5nfGNlbGxQYWRkaW5nfHJvd1NwYW58Y29sU3Bhbnx1c2VNYXB8ZnJhbWVCb3JkZXJ8Y29udGVudEVkaXRhYmxlJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBzdHIpIHtcclxuICAgICAgICBvYmpbc3RyLnRvTG93ZXJDYXNlKCldID0gc3RyO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7XHJcbiAgICAgICAgJ2Zvcic6ICAgJ2h0bWxGb3InLFxyXG4gICAgICAgICdjbGFzcyc6ICdjbGFzc05hbWUnXHJcbiAgICB9KTtcclxuXHJcbnZhciBwcm9wSG9va3MgPSB7XHJcbiAgICBzcmM6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnc3JjJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBocmVmOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ2hyZWYnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IFNhZmFyaSwgSUU5K1xyXG4gICAgLy8gbWlzLXJlcG9ydHMgdGhlIGRlZmF1bHQgc2VsZWN0ZWQgcHJvcGVydHkgb2YgYW4gb3B0aW9uXHJcbiAgICAvLyBBY2Nlc3NpbmcgdGhlIHBhcmVudCdzIHNlbGVjdGVkSW5kZXggcHJvcGVydHkgZml4ZXMgaXRcclxuICAgIHNlbGVjdGVkOiBTVVBQT1JUUy5vcHRTZWxlY3RlZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlLFxyXG4gICAgICAgICAgICAgICAgZml4O1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgaXQgYWxzbyB3b3JrcyB3aXRoIG9wdGdyb3Vwcywgc2VlICM1NzAxXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQucGFyZW50Tm9kZS5zZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdGFiSW5kZXg6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gZWxlbS50YWJJbmRleCBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlIGNvcnJlY3QgdmFsdWUgd2hlbiBpdCBoYXNuJ3QgYmVlbiBleHBsaWNpdGx5IHNldFxyXG4gICAgICAgICAgICAvLyBodHRwOi8vZmx1aWRwcm9qZWN0Lm9yZy9ibG9nLzIwMDgvMDEvMDkvZ2V0dGluZy1zZXR0aW5nLWFuZC1yZW1vdmluZy10YWJpbmRleC12YWx1ZXMtd2l0aC1qYXZhc2NyaXB0L1xyXG4gICAgICAgICAgICAvLyBVc2UgcHJvcGVyIGF0dHJpYnV0ZSByZXRyaWV2YWwoIzEyMDcyKVxyXG4gICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YWJpbmRleCkgeyByZXR1cm4gcGFyc2VOdW0odGFiaW5kZXgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZU5hbWUgPSBlbGVtLm5vZGVOYW1lO1xyXG4gICAgICAgICAgICByZXR1cm4gKFJFR0VYLmlzRm9jdXNhYmxlKG5vZGVOYW1lKSB8fCAoUkVHRVguaXNDbGlja2FibGUobm9kZU5hbWUpICYmIGVsZW0uaHJlZikpID8gMCA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRPclNldFByb3AgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcclxuXHJcbiAgICAvLyBkb24ndCBnZXQvc2V0IHByb3BlcnRpZXMgb24gdGV4dCwgY29tbWVudCBhbmQgYXR0cmlidXRlIG5vZGVzXHJcbiAgICBpZiAoIWVsZW0gfHwgbm9kZVR5cGUgPT09IFRFWFQgfHwgbm9kZVR5cGUgPT09IENPTU1FTlQgfHwgbm9kZVR5cGUgPT09IEFUVFJJQlVURSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldE9yU2V0UHJvcChmaXJzdCwgcHJvcCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwoZWxlbSwgaWR4LCBnZXRPclNldFByb3AoZWxlbSwgcHJvcCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgdmFsdWUpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlUHJvcDogZnVuY3Rpb24ocHJvcCkge1xyXG4gICAgICAgICAgICBpZiAoIWlzU3RyaW5nKHByb3ApKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgZWxlbVtuYW1lXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNTZWxlY3RvciAgID0gcmVxdWlyZSgnaXMvc2VsZWN0b3InKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc05vZGVMaXN0ICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNBcnJheSAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNEICAgICAgICAgID0gcmVxdWlyZSgnaXMvZCcpLFxyXG4gICAgYXJyYXkgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheScpLFxyXG4gICAgb3JkZXIgICAgICAgID0gcmVxdWlyZSgnLi4vb3JkZXInKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJy4vRml6emxlJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb258RWxlbWVudHxOb2RlTGlzdHxBcnJheXxEfSBzZWxlY3RvclxyXG4gKiBAcGFyYW0ge0R9IGNvbnRleHRcclxuICogQHJldHVybnMge0VsZW1lbnRbXX1cclxuICogQHByaXZhdGVcclxuICovXHJcbnZhciBmaW5kV2l0aGluID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgIC8vIEZhaWwgZmFzdFxyXG4gICAgaWYgKCFjb250ZXh0Lmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICB2YXIgcXVlcnksIGRlc2NlbmRhbnRzLCByZXN1bHRzO1xyXG5cclxuICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpIHx8IGlzTm9kZUxpc3Qoc2VsZWN0b3IpIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8IGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBDb252ZXJ0IHNlbGVjdG9yIHRvIGFuIGFycmF5IG9mIGVsZW1lbnRzXHJcbiAgICAgICAgc2VsZWN0b3IgPSBpc0VsZW1lbnQoc2VsZWN0b3IpID8gWyBzZWxlY3RvciBdIDogc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIGRlc2NlbmRhbnRzID0gXy5mbGF0dGVuKF8ubWFwKGNvbnRleHQsIChlbGVtKSA9PiBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSkpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBfLmZpbHRlcihkZXNjZW5kYW50cywgKGRlc2NlbmRhbnQpID0+IF8uY29udGFpbnMoc2VsZWN0b3IsIGRlc2NlbmRhbnQpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlcnkgPSBGaXp6bGUucXVlcnkoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBxdWVyeS5leGVjKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59O1xyXG5cclxudmFyIGZpbHRlciA9IGZ1bmN0aW9uKGFyciwgcXVhbGlmaWVyKSB7XHJcbiAgICAvLyBFYXJseSByZXR1cm4sIG5vIHF1YWxpZmllci4gRXZlcnl0aGluZyBtYXRjaGVzXHJcbiAgICBpZiAoIXF1YWxpZmllcikgeyByZXR1cm4gYXJyOyB9XHJcblxyXG4gICAgLy8gRnVuY3Rpb25cclxuICAgIGlmIChpc0Z1bmN0aW9uKHF1YWxpZmllcikpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEVsZW1lbnRcclxuICAgIGlmIChxdWFsaWZpZXIubm9kZVR5cGUpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gZWxlbSA9PT0gcXVhbGlmaWVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWxlY3RvclxyXG4gICAgaWYgKGlzU3RyaW5nKHF1YWxpZmllcikpIHtcclxuICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMocXVhbGlmaWVyKTtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gaXMubWF0Y2goZWxlbSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IHF1YWxpZmllclxyXG4gICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IF8uY29udGFpbnMocXVhbGlmaWVyLCBlbGVtKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZpbHRlcjogZmlsdGVyLFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHRhcmdldCkpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRzID0gdGhpcy5maW5kKHRhcmdldCksXHJcbiAgICAgICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgICAgICBsZW4gPSB0YXJnZXRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3JkZXIuY29udGFpbnMoZWxlbSwgdGFyZ2V0c1tpZHhdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5hbnkodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICAgICAgaXMubm90KHRoaXMpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gIV8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiAhaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSAhPT0gY29udGV4dClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBmaW5kV2l0aGluKHNlbGVjdG9yLCB0aGlzKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgYXJyYXkuZWxlbWVudFNvcnQocmVzdWx0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZpbHRlcjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gRCgpOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hlY2tlciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gY2hlY2tlci5jYWxsKGVsZW0sIGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRUxFTUVOVCAgICAgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgRE9DVU1FTlQgICAgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlQnKSxcclxuICAgIERPQ1VNRU5UX0ZSQUdNRU5UID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UX0ZSQUdNRU5UJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNEICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9kJyksXHJcbiAgICBhcnJheSAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXknKSxcclxuICAgIHNlbGVjdG9ycyAgICAgICAgID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMnKSxcclxuICAgIEZpenpsZSAgICAgICAgICAgID0gcmVxdWlyZSgnLi9GaXp6bGUnKTtcclxuXHJcbnZhciBnZXRTaWJsaW5ncyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gX2dldE5vZGVTaWJsaW5ncyhjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2licy5sZW5ndGgpIHsgcmVzdWx0LnB1c2goc2licyk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Tm9kZVNpYmxpbmdzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaWJzID0gXy50b0FycmF5KHBhcmVudC5jaGlsZHJlbiksXHJcbiAgICAgICAgICAgIGlkeCAgPSBzaWJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGUgdGhlIG5vZGUgaXRzZWxmIGZyb20gdGhlIGxpc3Qgb2YgaXRzIHBhcmVudCdzIGNoaWxkcmVuXHJcbiAgICAgICAgICAgIGlmIChzaWJzW2lkeF0gPT09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHNpYnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaWJzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDaGlsZHJlbiAtLS0tLS1cclxuICAgIGdldENoaWxkcmVuID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihfLm1hcChhcnIsIF9jaGlsZHJlbikpO1xyXG4gICAgfSxcclxuICAgIF9jaGlsZHJlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIga2lkcyA9IGVsZW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgIGlkeCAgPSAwLCBsZW4gID0ga2lkcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGFyciAgPSBuZXcgQXJyYXkobGVuKTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGtpZHNbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50cyAtLS0tLS1cclxuICAgIGdldENsb3Nlc3QgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICBjbG9zZXN0LFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGVsZW1zW2lkeF0sIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBwYXJlbnRzLnVuc2hpZnQoZWxlbXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGNsb3Nlc3QgPSBzZWxlY3RvcnMuZmlsdGVyKHBhcmVudHMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKGNsb3Nlc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjbG9zZXN0WzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHMgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHNVbnRpbCA9IGZ1bmN0aW9uKGQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShkW2lkeF0sIG51bGwsIHN0b3BTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmF3bFVwTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gbm9kZSxcclxuICAgICAgICAgICAgbm9kZVR5cGU7XHJcblxyXG4gICAgICAgIHdoaWxlICgocGFyZW50ICAgPSBnZXROb2RlUGFyZW50KHBhcmVudCkpICYmXHJcbiAgICAgICAgICAgICAgIChub2RlVHlwZSA9IHBhcmVudC5ub2RlVHlwZSkgIT09IERPQ1VNRU5UICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50IC0tLS0tLVxyXG4gICAgZ2V0UGFyZW50ID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGdldE5vZGVQYXJlbnQoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkgeyByZXN1bHQucHVzaChwYXJlbnQpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFNhZmVseSBnZXQgcGFyZW50IG5vZGVcclxuICAgIGdldE5vZGVQYXJlbnQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQcmV2ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwcmV2ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykgJiYgcHJldi5ub2RlVHlwZSAhPT0gRUxFTUVOVCkge31cclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TmV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgbmV4dCA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykgJiYgbmV4dC5ub2RlVHlwZSAhPT0gRUxFTUVOVCkge31cclxuICAgICAgICByZXR1cm4gbmV4dDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UHJldkFsbCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHByZXYgICA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChwcmV2ID0gcHJldi5wcmV2aW91c1NpYmxpbmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmV2Lm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwcmV2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROZXh0QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgbmV4dCAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nKSkge1xyXG4gICAgICAgICAgICBpZiAobmV4dC5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsQWxsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGZpbHRlcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHsgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZyk7IH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJsaW5ncyA9IF8uZmlsdGVyKHNpYmxpbmdzLCBmaWx0ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbFVudGlsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGl0ZXJhdG9yO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaXRlcmF0b3IgPSBmdW5jdGlvbihzaWJsaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNNYXRjaCA9IGlzLm1hdGNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc01hdGNoO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChzaWJsaW5ncywgaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHVuaXF1ZVNvcnQgPSBmdW5jdGlvbihlbGVtcywgcmV2ZXJzZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBhcnJheS51bmlxdWUoZWxlbXMpO1xyXG4gICAgICAgIGFycmF5LmVsZW1lbnRTb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEQocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KHNlbGVjdG9ycy5maWx0ZXIoZWxlbXMsIHNlbGVjdG9yKSwgcmV2ZXJzZSk7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNvbnRlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZsYXR0ZW4oXHJcbiAgICAgICAgICAgICAgICAgICAgXy5tYXAodGhpcywgKGVsZW0pID0+IGVsZW0uY2hpbGROb2RlcylcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbmRleDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKHNlbGVjdG9yKS5pbmRleE9mKGZpcnN0KTsgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3RvclswXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBmaXJzdC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaXNBdHRhY2hlZCBjaGVjayB0byBwYXNzIHRlc3QgXCJOb2RlIHdpdGhvdXQgcGFyZW50IHJldHVybnMgLTFcIlxyXG4gICAgICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgICAgIHZhciBhdHRhY2hlZCAgICAgICAgID0gaXNBdHRhY2hlZChmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpc1BhcmVudEZyYWdtZW50ID0gcGFyZW50Lm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVDtcclxuXHJcbiAgICAgICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSBFTEVNRU5UKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXS5pbmRleE9mLmFwcGx5KGNoaWxkRWxlbXMsIFsgZmlyc3QgXSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0Q2xvc2VzdCh0aGlzLCBzZWxlY3RvciwgY29udGV4dCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0UGFyZW50KHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0UGFyZW50cyh0aGlzKSwgc2VsZWN0b3IsIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBhcmVudHNVbnRpbCh0aGlzLCBzdG9wU2VsZWN0b3IpLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0U2libGluZ3ModGhpcyksIHNlbGVjdG9yKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0Q2hpbGRyZW4odGhpcyksIHNlbGVjdG9yKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldFByZXYsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbChnZXROZXh0LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsQWxsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsVW50aWwoZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBuZXdsaW5lcyAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTnVtYmVyICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBub3JtYWxOYW1lID0gcmVxdWlyZSgnbm9kZS9ub3JtYWxpemVOYW1lJyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIEVMRU1FTlQgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgRElWICAgICAgICA9IHJlcXVpcmUoJ0RJVicpO1xyXG5cclxudmFyIG91dGVySHRtbCA9ICgpID0+IHRoaXMubGVuZ3RoID8gdGhpc1swXS5vdXRlckhUTUwgOiBudWxsLFxyXG5cclxuICAgIHRleHRHZXQgPSBESVYudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCA/XHJcbiAgICAgICAgKGVsZW0pID0+IGVsZW0udGV4dENvbnRlbnQgOlxyXG4gICAgICAgICAgICAoZWxlbSkgPT4gZWxlbS5pbm5lclRleHQsXHJcblxyXG4gICAgdGV4dFNldCA9IERJVi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLnRleHRDb250ZW50ID0gc3RyIDpcclxuICAgICAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS5pbm5lclRleHQgPSBzdHI7XHJcblxyXG52YXIgdmFsSG9va3MgPSB7XHJcbiAgICBvcHRpb246IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gKGV4aXN0cyh2YWwpID8gdmFsIDogdGV4dEdldChlbGVtKSkudHJpbSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGluZGV4ICAgPSBlbGVtLnNlbGVjdGVkSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBvbmUgICAgID0gZWxlbS50eXBlID09PSAnc2VsZWN0LW9uZScgfHwgaW5kZXggPCAwLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IG9uZSA/IG51bGwgOiBbXSxcclxuICAgICAgICAgICAgICAgIG1heCAgICAgPSBvbmUgPyBpbmRleCArIDEgOiBvcHRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBpbmRleCA8IDAgPyBtYXggOiAob25lID8gaW5kZXggOiAwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIHNlbGVjdGVkIG9wdGlvbnNcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IG1heDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvbGRJRSBkb2Vzbid0IHVwZGF0ZSBzZWxlY3RlZCBhZnRlciBmb3JtIHJlc2V0ICgjMjU1MSlcclxuICAgICAgICAgICAgICAgIGlmICgob3B0aW9uLnNlbGVjdGVkIHx8IGlkeCA9PT0gaW5kZXgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHJldHVybiBvcHRpb25zIHRoYXQgYXJlIGRpc2FibGVkIG9yIGluIGEgZGlzYWJsZWQgb3B0Z3JvdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKFNVUFBPUlRTLm9wdERpc2FibGVkID8gIW9wdGlvbi5kaXNhYmxlZCA6IG9wdGlvbi5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICghb3B0aW9uLnBhcmVudE5vZGUuZGlzYWJsZWQgfHwgIWlzTm9kZU5hbWUob3B0aW9uLnBhcmVudE5vZGUsICdvcHRncm91cCcpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHNwZWNpZmljIHZhbHVlIGZvciB0aGUgb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgYW4gYXJyYXkgZm9yIG9uZSBzZWxlY3RzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aS1TZWxlY3RzIHJldHVybiBhbiBhcnJheVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25TZXQsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gXy5tYWtlQXJyYXkodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IG9wdGlvbnMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWVzLCB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gb3B0aW9uU2V0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZvcmNlIGJyb3dzZXJzIHRvIGJlaGF2ZSBjb25zaXN0ZW50bHkgd2hlbiBub24tbWF0Y2hpbmcgdmFsdWUgaXMgc2V0XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uU2V0KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNlbGVjdGVkSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn07XHJcblxyXG4vLyBSYWRpbyBhbmQgY2hlY2tib3ggZ2V0dGVyIGZvciBXZWJraXRcclxuaWYgKCFTVVBQT1JUUy5jaGVja09uKSB7XHJcbiAgICBfLmVhY2goWydyYWRpbycsICdjaGVja2JveCddLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgdmFsSG9va3NbdHlwZV0gPSB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydDogV2Via2l0IC0gJycgaXMgcmV0dXJuZWQgaW5zdGVhZCBvZiAnb24nIGlmIGEgdmFsdWUgaXNuJ3Qgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwgPyAnb24nIDogZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIGdldFZhbCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIGlmICghZWxlbSB8fCAoZWxlbS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5nZXQpIHtcclxuICAgICAgICByZXR1cm4gaG9vay5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXNTdHJpbmcodmFsKSA/IG5ld2xpbmVzKHZhbCkgOiB2YWw7XHJcbn07XHJcblxyXG52YXIgc3RyaW5naWZ5ID0gKHZhbHVlKSA9PlxyXG4gICAgIWV4aXN0cyh2YWx1ZSkgPyAnJyA6ICh2YWx1ZSArICcnKTtcclxuXHJcbnZhciBzZXRWYWwgPSBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgIGlmIChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIFN0cmluZ2lmeSB2YWx1ZXNcclxuICAgIHZhciB2YWx1ZSA9IGlzQXJyYXkodmFsKSA/IF8ubWFwKHZhbCwgc3RyaW5naWZ5KSA6IHN0cmluZ2lmeSh2YWwpO1xyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suc2V0KSB7XHJcbiAgICAgICAgaG9vay5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgb3V0ZXJIdG1sOiBvdXRlckh0bWwsXHJcbiAgICAgICAgb3V0ZXJIVE1MOiBvdXRlckh0bWwsXHJcblxyXG4gICAgICAgIGh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGh0bWwpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBlbGVtLmlubmVySFRNTCA9IGh0bWwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihodG1sKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gaHRtbDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIHJldHVybiAoIWZpcnN0KSA/IHVuZGVmaW5lZCA6IGZpcnN0LmlubmVySFRNTDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2YWw6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIGdldHRlclxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRWYWwodGhpc1swXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sICcnKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZ2V0VmFsKGVsZW0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VmFsKGVsZW0sIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBzZXR0ZXJzXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdGV4dDogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzdHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiB0ZXh0U2V0KGVsZW0sIHN0cikpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihzdHIpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzdHI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgdGV4dEdldChlbGVtKSkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5tYXAodGhpcywgKGVsZW0pID0+IHRleHRHZXQoZWxlbSkpLmpvaW4oJycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIEVMRU1FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZWxlbSkgPT5cclxuICAgICAgICBlbGVtICYmIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIG5hbWUpID0+XHJcbiAgICBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKTsiLCIvLyBjYWNoZSBpcyBqdXN0IG5vdCB3b3J0aCBpdCBoZXJlXHJcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3NpbXBsZS1jYWNoZS1mb3Itc3RyaW5nLW1hbmlwXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0pID0+IGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcclxuIiwidmFyIGlzQXR0YWNoZWQgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBFTEVNRU5UICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2NvbXBhcmluZy1kb2N1bWVudC1wb3NpdGlvbi9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICBDT05UQUlORURfQlkgPSAxNixcclxuICAgIEZPTExPV0lORyAgICA9IDQsXHJcbiAgICBESVNDT05ORUNURUQgPSAxO1xyXG5cclxudmFyIGlzID0gKHJlbCwgZmxhZykgPT4gKHJlbCAmIGZsYWcpID09PSBmbGFnO1xyXG5cclxudmFyIGlzTm9kZSA9IChiLCBmbGFnLCBhKSA9PiBpcyhfY29tcGFyZVBvc2l0aW9uKGEsIGIpLCBmbGFnKTtcclxuXHJcbi8vIENvbXBhcmUgUG9zaXRpb24gLSBNSVQgTGljZW5zZWQsIEpvaG4gUmVzaWdcclxudmFyIF9jb21wYXJlUG9zaXRpb24gPSAobm9kZTEsIG5vZGUyKSA9PlxyXG4gICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gP1xyXG4gICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZTIpIDpcclxuICAgIDA7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogU29ydHMgYW4gYXJyYXkgb2YgRCBlbGVtZW50cyBpbi1wbGFjZSAoaS5lLiwgbXV0YXRlcyB0aGUgb3JpZ2luYWwgYXJyYXkpXHJcbiAgICAgKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAgICAgKiBAZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudFtdfSBhcnJheSAgICAgICAgICBBcnJheSBvZiBEIGVsZW1lbnRzLlxyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKiBAc2VlIGpRdWVyeSBzcmMvc2VsZWN0b3ItbmF0aXZlLmpzOjM3XHJcbiAgICAgKi9cclxuICAgIHNvcnQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgX3NvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgICAgICAgICAgLy8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKG5vZGUxID09PSBub2RlMikge1xyXG4gICAgICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU29ydCBvbiBtZXRob2QgZXhpc3RlbmNlIGlmIG9ubHkgb25lIGlucHV0IGhhcyBjb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgICAgICAgICB2YXIgcmVsID0gIW5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIC0gIW5vZGUyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xyXG4gICAgICAgICAgICBpZiAocmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBpZiAoKG5vZGUxLm93bmVyRG9jdW1lbnQgfHwgbm9kZTEpID09PSAobm9kZTIub3duZXJEb2N1bWVudCB8fCBub2RlMikpIHtcclxuICAgICAgICAgICAgICAgIHJlbCA9IF9jb21wYXJlUG9zaXRpb24obm9kZTEsIG5vZGUyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWwgPSBESVNDT05ORUNURUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vdCBkaXJlY3RseSBjb21wYXJhYmxlXHJcbiAgICAgICAgICAgIGlmICghcmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICAgICAgICAgIGlmIChpcyhyZWwsIERJU0NPTk5FQ1RFRCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc05vZGUxRGlzY29ubmVjdGVkID0gIWlzQXR0YWNoZWQobm9kZTEpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTm9kZTJEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZTFEaXNjb25uZWN0ZWQgJiYgaXNOb2RlMkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc05vZGUyRGlzY29ubmVjdGVkID8gLTEgOiAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaXMocmVsLCBGT0xMT1dJTkcpID8gLTEgOiAxO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgcmV2ZXJzZSkge1xyXG4gICAgICAgICAgICBfaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGFycmF5LnNvcnQoX3NvcnQpO1xyXG4gICAgICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICAgICAgYXJyYXkucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfaGFzRHVwbGljYXRlO1xyXG4gICAgICAgIH07XHJcbiAgICB9KCkpLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgLlxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBhIEQgZWxlbWVudCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGIgRCBlbGVtZW50IG5vZGVcclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgOyBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgdmFyIGJVcCA9IGlzQXR0YWNoZWQoYikgPyBiLnBhcmVudE5vZGUgOiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoYSA9PT0gYlVwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGJVcCAmJiBiVXAubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzIChJRTkrKVxyXG4gICAgICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTm9kZShiVXAsIENPTlRBSU5FRF9CWSwgYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyKSA9PiAhZXhpc3RzKHN0cikgfHwgc3RyID09PSAnJzsiLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBjYWNoZSAgID0gcmVxdWlyZSgnY2FjaGUnKSgyKSxcclxuICAgIGlzRW1wdHkgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpLFxyXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcblxyXG4gICAgUl9TUEFDRSA9IC9cXHMrL2csXHJcblxyXG4gICAgc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIHZhciBzcGxpdCAgID0gbmFtZS5zcGxpdChkZWxpbSksXHJcbiAgICAgICAgICAgIGxlbiAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIG5hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmFtZVNldCA9IHt9LFxyXG4gICAgICAgICAgICBjdXJOYW1lO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgY3VyTmFtZSA9IHNwbGl0W2xlbiAtIChpZHggKyAxKV07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdIHx8IC8vIHVuaXF1ZVxyXG4gICAgICAgICAgICAgICAgaXNFbXB0eShjdXJOYW1lKSAgICAvLyBub24tZW1wdHlcclxuICAgICAgICAgICAgKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKGN1ck5hbWUpO1xyXG4gICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltaXRlcikge1xyXG4gICAgaWYgKGlzRW1wdHkobmFtZSkpIHsgcmV0dXJuIFtdOyB9XHJcbiAgICBpZiAoaXNBcnJheShuYW1lKSkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAgIHZhciBkZWxpbSA9IGRlbGltaXRlciA9PT0gdW5kZWZpbmVkID8gUl9TUEFDRSA6IGRlbGltaXRlcjtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoZGVsaW0sIG5hbWUpID8gXHJcbiAgICAgICAgY2FjaGUuZ2V0KGRlbGltLCBuYW1lKSA6IFxyXG4gICAgICAgIGNhY2hlLnB1dChkZWxpbSwgbmFtZSwgKCkgPT4gc3BsaXQobmFtZSwgZGVsaW0pKTtcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAobnVtKSA9PiBwYXJzZUludChudW0sIDEwKTtcclxuIiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIC8vIEV4aXQgZWFybHkgZm9yIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAvLyBFbmQsIG5hdHVyYWxseSwgaGFzIHRvIGJlIGhpZ2hlciB0aGFuIDAgdG8gbWF0dGVyLFxyXG4gICAgLy8gc28gYSBzaW1wbGUgZXhpc3RlbmNlIGNoZWNrIHdpbGwgZG9cclxuICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgIHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQgfHwgMCk7XHJcbn07IiwiLy8gQnJlYWtzIGV2ZW4gb24gYXJyYXlzIHdpdGggMyBpdGVtcy4gMyBvciBtb3JlXHJcbi8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBkZWxpbWl0ZXIpID0+IHN0ci5zcGxpdChkZWxpbWl0ZXIgfHwgJ3wnKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICsgJ3B4JztcclxuIiwidmFyIGlkID0gMDtcclxudmFyIHVuaXF1ZUlkID0gbW9kdWxlLmV4cG9ydHMgPSAoKSA9PiBpZCsrO1xyXG51bmlxdWVJZC5zZWVkID0gZnVuY3Rpb24oc2VlZGVkLCBwcmUpIHtcclxuICAgIHZhciBwcmVmaXggPSBwcmUgfHwgJycsXHJcbiAgICAgICAgc2VlZCA9IHNlZWRlZCB8fCAwO1xyXG4gICAgcmV0dXJuICgpID0+IHByZWZpeCArIHNlZWQrKztcclxufTsiXX0=
