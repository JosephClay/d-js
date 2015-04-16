/**
 * d-js - jQuery at half the size
 * @version v1.1.5
 * @link https://github.com/JosephClay/d-js
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./D');
require('./props');
require('./proto');

},{"./D":3,"./props":59,"./proto":60}],2:[function(require,module,exports){
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

var _ = require('_'),
    isArrayLike = require('is/arrayLike'),
    isHtml = require('is/html'),
    isString = require('is/string'),
    isFunction = require('is/function'),
    isD = require('is/D'),
    parser = require('parser'),
    onready = require('onready'),
    Fizzle = require('Fizzle');

var Api = module.exports = function (selector, attrs) {
    return new D(selector, attrs);
};

isD.set(Api);

function D(selector, attrs) {
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
        _.merge(this, parser(selector));
        if (attrs) {
            this.attr(attrs);
        }
        return this;
    }

    // String
    if (isString(selector)) {
        // Selector: perform a find without creating a new D
        return _.merge(this, Fizzle.query(selector).exec(this, true));
    }

    // document ready
    if (isFunction(selector)) {
        onready(selector);
        return this;
    }

    // Array of Elements, NodeList, or D object
    if (isArrayLike(selector)) {
        return _.merge(this, selector);
    }

    return this;
}
D.prototype = Api.prototype;

},{"Fizzle":9,"_":15,"is/D":17,"is/arrayLike":19,"is/function":26,"is/html":27,"is/string":33,"onready":56,"parser":58}],4:[function(require,module,exports){
"use strict";

module.exports = function (tag) {
  return document.createElement(tag);
};

},{}],5:[function(require,module,exports){
'use strict';

var div = module.exports = require('./create')('div');

div.innerHTML = '<a href="/a">a</a>';

},{"./create":4}],6:[function(require,module,exports){
'use strict';

var _ = require('_');

var match = function match(context, selectors) {
    var idx = selectors.length;
    while (idx--) {
        if (selectors[idx].match(context)) {
            return true;
        }
    }

    return false;
};

module.exports = function Is(selectors) {
    return {
        match: (function (_match) {
            function match(_x) {
                return _match.apply(this, arguments);
            }

            match.toString = function () {
                return _match.toString();
            };

            return match;
        })(function (context) {
            return match(context, selectors);
        }),

        any: function any(arr) {
            return _.any(arr, function (elem) {
                return match(elem, selectors) ? true : false;
            });
        },

        not: function not(arr) {
            return _.filter(arr, function (elem) {
                return !match(elem, selectors) ? true : false;
            });
        }
    };
};

},{"_":15}],7:[function(require,module,exports){
"use strict";

var find = function find(selectors, context) {
    var result = [],
        idx = 0,
        length = selectors.length;
    for (; idx < length; idx++) {
        result = result.concat(selectors[idx].exec(context));
    }
    return result;
};

module.exports = function Query(selectors) {
    return {
        exec: function exec(arr, isNew) {
            var result = [],
                idx = 0,
                length = isNew ? 1 : arr.length;
            for (; idx < length; idx++) {
                result = result.concat(find(selectors, arr[idx]));
            }
            return result;
        }
    };
};

},{}],8:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isNodeList = require('is/nodeList'),
    isElement = require('is/element'),
    REGEX = require('REGEX'),
    matches = require('matchesSelector'),
    uniqueId = require('util/uniqueId').seed(0, '_D' + Date.now()),
    GET_ELEMENT_BY_ID = 'getElementById',
    GET_ELEMENTS_BY_TAG_NAME = 'getElementsByTagName',
    GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    QUERY_SELECTOR_ALL = 'querySelectorAll';

var determineMethod = function determineMethod(selector) {
    return REGEX.isStrictId(selector) ? GET_ELEMENT_BY_ID : REGEX.isClass(selector) ? GET_ELEMENTS_BY_CLASS_NAME : REGEX.isTag(selector) ? GET_ELEMENTS_BY_TAG_NAME : QUERY_SELECTOR_ALL;
},
    processQuerySelection = function processQuerySelection(selection) {
    return (
        // No selection or a Nodelist without a length
        // should result in nothing
        !selection || isNodeList(selection) && !selection.length ? [] :
        // If it's an id selection, return it as an array
        isElement(selection) || !selection.length ? [selection] :
        // ensure it's an array and not an HTMLCollection
        _.toArray(selection)
    );
},
    childOrSiblingQuery = function childOrSiblingQuery(context, method, selector) {
    // Child select - needs special help so that "> div" doesn't break
    var idApplied = false,
        newId,
        id;

    id = context.id;
    if (id === '' || !exists(id)) {
        newId = uniqueId();
        context.id = newId;
        idApplied = true;
    }

    var selection = document[method](
    // tailor the child selector
    '#' + (idApplied ? newId : id) + ' ' + selector);

    if (idApplied) {
        context.id = id;
    }

    return processQuerySelection(selection);
},
    classQuery = function classQuery(context, method, selector) {
    // Class search, don't start with '.'
    var selector = selector.substr(1),
        selection = context[method](selector);

    return processQuerySelection(selection);
},
    idQuery = function idQuery(context, method, selector) {
    var sel = selector.substr(1),
        selection = document[method](sel);

    return processQuerySelection(selection);
},
    defaultQuery = function defaultQuery(context, method, selector) {
    var selection = context[method](selector);
    return processQuerySelection(selection);
},
    determineQuery = function determineQuery(isChildOrSiblingSelect, isClassSearch, isIdSearch) {
    return isChildOrSiblingSelect ? childOrSiblingQuery : isClassSearch ? classQuery : isIdSearch ? idQuery : defaultQuery;
};

module.exports = function Selector(str) {
    var selector = str.trim(),
        isChildOrSiblingSelect = selector[0] === '>' || selector[0] === '+',
        method = isChildOrSiblingSelect ? QUERY_SELECTOR_ALL : determineMethod(selector),
        isIdSearch = method === GET_ELEMENT_BY_ID,
        isClassSearch = !isIdSearch && method === GET_ELEMENTS_BY_CLASS_NAME;

    var query = determineQuery(isChildOrSiblingSelect, isClassSearch, isIdSearch);

    return {
        str: str,

        match: function match(context) {
            // No neeed to check, a match will fail if it's
            // child or sibling
            return !isChildOrSiblingSelect ? matches(context, selector) : false;
        },

        exec: function exec(context) {
            // these are the types we're expecting to fall through
            // isElement(context) || isNodeList(context) || isCollection(context)
            // if no context is given, use document
            return query(context || document, method, selector);
        }
    };
};

},{"REGEX":13,"_":15,"is/element":24,"is/exists":25,"is/nodeList":28,"matchesSelector":35,"util/uniqueId":63}],9:[function(require,module,exports){
'use strict';

var _ = require('../_'),
    queryCache = require('../cache')(),
    isCache = require('../cache')(),
    selector = require('./constructs/selector'),
    query = require('./constructs/query'),
    is = require('./constructs/is'),
    parse = require('./selector/selector-parse'),
    normalize = require('./selector/selector-normalize');

var toSelectors = function toSelectors(str) {
    return _.fastmap(_.fastmap(
    // Selectors will return [] if the query was invalid.
    // Not returning early or doing extra checks as this will
    // noop on the query and is level and is the exception
    // instead of the rule
    parse(str),
    // Normalize each of the selectors...
    normalize),
    // ...and map them to selector objects
    selector);
};

module.exports = {
    selector: toSelectors,
    parse: parse,

    query: (function (_query) {
        function query(_x) {
            return _query.apply(this, arguments);
        }

        query.toString = function () {
            return _query.toString();
        };

        return query;
    })(function (str) {
        return queryCache.has(str) ? queryCache.get(str) : queryCache.set(str, query(toSelectors(str)));
    }),
    is: (function (_is) {
        function is(_x2) {
            return _is.apply(this, arguments);
        }

        is.toString = function () {
            return _is.toString();
        };

        return is;
    })(function (str) {
        return isCache.has(str) ? isCache.get(str) : isCache.set(str, is(toSelectors(str)));
    })
};

},{"../_":15,"../cache":16,"./constructs/is":6,"./constructs/query":7,"./constructs/selector":8,"./selector/selector-normalize":11,"./selector/selector-parse":12}],10:[function(require,module,exports){
module.exports={
    ":child-even" : ":nth-child(even)",
    ":child-odd"  : ":nth-child(odd)",
    ":text"       : "[type=text]",
    ":password"   : "[type=password]",
    ":radio"      : "[type=radio]",
    ":checkbox"   : "[type=checkbox]",
    ":submit"     : "[type=submit]",
    ":reset"      : "[type=reset]",
    ":button"     : "[type=button]",
    ":image"      : "[type=image]",
    ":input"      : "[type=input]",
    ":file"       : "[type=file]",
    ":selected"   : "[selected=selected]"
}
},{}],11:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS'),
    PSEUDO_SELECT = /(:[^\s\(\[)]+)/g,
    SELECTED_SELECT = /\[selected\]/gi,
    cache = require('cache')(),
    proxies = require('./proxy.json');

module.exports = function (str) {
    return cache.has(str) ? cache.get(str) : cache.put(str, function () {
        // pseudo replace if the captured selector is in the proxies
        var s = str.replace(PSEUDO_SELECT, function (match) {
            return proxies[match] ? proxies[match] : match;
        });

        // boolean selector replacement?
        // supports IE8-9
        return SUPPORTS.selectedSelector ? s : s.replace(SELECTED_SELECT, '[selected="selected"]');
    });
};

},{"./proxy.json":10,"SUPPORTS":14,"cache":16}],12:[function(require,module,exports){
'use strict';

var tokenCache = require('cache')(),
    tokenize = function tokenize(str) {
    var arr = str.split(', '),
        idx = arr.length,
        selector;
    while (idx--) {
        selector = arr[idx] = arr[idx].trim();
        if (selector === '' || selector === '#' || selector === '.') {
            return null;
        }
    }
    return arr;
};

/**
 * Splits the given comma-separated CSS selector into separate sub-queries.
 * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
 * @return {String[]} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]').
 */
module.exports = function (selector) {
    var tokens = tokenCache.has(selector) ? tokenCache.get(selector) : tokenCache.set(selector, tokenize(selector));

    if (!tokens) {
        console.error('d-js: Invalid query selector "' + selector + '"');
        return [];
    }

    return tokens.slice();
};

},{"cache":16}],13:[function(require,module,exports){
// having caches isn't actually faster
// for a majority of use cases for string
// manipulations
// http://jsperf.com/simple-cache-for-string-manip

// Matches "-ms-" so that it can be changed to "ms-"
'use strict';

var TRUNCATE_MS_PREFIX = /^-ms-/,

// Matches dashed string for camelizing
DASH_CATCH = /-([\da-z])/gi,

// Matches "none" or a table type e.g. "table",
// "table-cell" etc...
NONE_OR_TABLE = /^(none|table(?!-c[ea]).+)/,
    TYPE_TEST_FOCUSABLE = /^(?:input|select|textarea|button|object)$/i,
    TYPE_TEST_CLICKABLE = /^(?:a|area)$/i,
    SELECTOR_ID = /^#([\w-]+)$/,
    SELECTOR_TAG = /^[\w-]+$/,
    SELECTOR_CLASS = /^\.([\w-]+)$/,
    POSITION = /^(top|right|bottom|left)$/,
    NUM_NON_PX = new RegExp('^(' + /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source + ')(?!px)[a-z%]+$', 'i'),
    SINGLE_TAG = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    IS_BOOL_ATTR = /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i,

/**
 * Map of parent tag names to the child tags that require them.
 * @type {Object}
 */
PARENT_MAP = {
    table: /^<(?:tbody|tfoot|thead|colgroup|caption)\b/,
    tbody: /^<(?:tr)\b/,
    tr: /^<(?:td|th)\b/,
    colgroup: /^<(?:col)\b/,
    select: /^<(?:option)\b/
};

var test = function test(reg) {
    return function (str) {
        return reg.test(str);
    };
};

module.exports = {
    singleTagMatch: function singleTagMatch(val) {
        return SINGLE_TAG.exec(val);
    },

    numNotPx: test(NUM_NON_PX),
    position: test(POSITION),
    isNoneOrTable: test(NONE_OR_TABLE),
    isFocusable: test(TYPE_TEST_FOCUSABLE),
    isClickable: test(TYPE_TEST_CLICKABLE),
    isStrictId: test(SELECTOR_ID),
    isTag: test(SELECTOR_TAG),
    isClass: test(SELECTOR_CLASS),
    isBoolAttr: test(IS_BOOL_ATTR),

    camelCase: function camelCase(str) {
        return str.replace(TRUNCATE_MS_PREFIX, 'ms-').replace(DASH_CATCH, function (match, letter) {
            return letter.toUpperCase();
        });
    },

    getParentTagName: function getParentTagName(str) {
        var val = str.substr(0, 30);
        for (var parentTagName in PARENT_MAP) {
            if (PARENT_MAP[parentTagName].test(val)) {
                return parentTagName;
            }
        }
        return 'div';
    }
};

},{}],14:[function(require,module,exports){
'use strict';

var DIV = require('DIV'),
    create = require('DIV/create'),
    a = DIV.querySelector('a'),
    select = create('select'),
    option = select.appendChild(create('option')),
    test = function test(tagName, testFn) {
    return testFn(create(tagName));
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

    textContent: DIV.textContent !== undefined,

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

},{"DIV":5,"DIV/create":4}],15:[function(require,module,exports){
'use strict';

var exists = require('is/exists'),
    isArray = require('is/array'),
    isArrayLike = require('is/arrayLike'),
    isNodeList = require('is/nodeList'),
    slice = require('util/slice');

var loop = function loop(iterator) {
    return function (obj, iteratee) {
        if (!obj || !iteratee) {
            return;
        }

        var idx = 0,
            length = obj.length;
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
    // Breaks even on arrays with 3 items. 3 or more
    // items starts saving space
    s: function s(str) {
        return str.split('|');
    },

    // Flatten that also checks if value is a NodeList
    flatten: function flatten(arr) {
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

    toPx: function toPx(value) {
        return value + 'px';
    },

    parseInt: (function (_parseInt) {
        function parseInt(_x) {
            return _parseInt.apply(this, arguments);
        }

        parseInt.toString = function () {
            return _parseInt.toString();
        };

        return parseInt;
    })(function (num) {
        return parseInt(num, 10);
    }),

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

        if (arr && arr.length) {
            var idx = 0,
                length = arr.length;
            for (; idx < length; idx++) {
                if (iterator(arr[idx], idx)) {
                    results.push(arr[idx]);
                }
            }
        }

        return results;
    },

    any: function any(arr, iterator) {
        if (arr && arr.length) {
            var idx = 0,
                length = arr.length;
            for (; idx < length; idx++) {
                if (iterator(arr[idx], idx)) {
                    return true;
                }
            }
        }

        return false;
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
            arr = Array(obj.length);
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
        return !exists(arg) ? [] : isArrayLike(arg) ? slice(arg) : [arg];
    },

    contains: function contains(arr, item) {
        return arr.indexOf(item) !== -1;
    },

    jqEach: loop(function (fn, value, keyIndex, collection) {
        fn.call(value, keyIndex, value, collection);
    }),

    dEach: loop(function (fn, value, keyIndex, collection) {
        fn.call(value, value, keyIndex, collection);
    }),

    each: loop(function (fn, value, keyIndex) {
        fn(value, keyIndex);
    }),

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
    },

    // pluck
    // TODO: Check for places this can be applied
    pluck: function pluck(arr, key) {
        return _.map(arr, function (obj) {
            return obj ? obj[key] : undefined;
        });
    }
};

},{"is/array":18,"is/arrayLike":19,"is/exists":25,"is/nodeList":28,"util/slice":62}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
"use strict";

var constructor;
module.exports = function (value) {
  return value && value instanceof constructor;
};
module.exports.set = function (D) {
  return constructor = D;
};

},{}],18:[function(require,module,exports){
"use strict";

module.exports = Array.isArray;

},{}],19:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && +value.length === value.length;
};

},{}],20:[function(require,module,exports){
'use strict';

var isDocumentFragment = require('nodeType').doc_frag;

module.exports = function (elem) {
    var parent;
    return elem && elem.ownerDocument && elem !== document && (parent = elem.parentNode) && !isDocumentFragment(parent) && parent.isParseHtmlFragment !== true;
};

},{"nodeType":55}],21:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value === true || value === false;
};

},{}],22:[function(require,module,exports){
'use strict';

var isArray = require('is/array'),
    isNodeList = require('is/nodeList'),
    isD = require('is/D');

module.exports = function (value) {
    return isD(value) || isArray(value) || isNodeList(value);
};

},{"is/D":17,"is/array":18,"is/nodeList":28}],23:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === document;
};

},{}],24:[function(require,module,exports){
'use strict';

var isWindow = require('is/window'),
    isElement = require('nodeType').elem;

module.exports = function (value) {
    return value && (value === document || isWindow(value) || isElement(value));
};

},{"is/window":34,"nodeType":55}],25:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value !== undefined && value !== null;
};

},{}],26:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return value && typeof value === 'function';
};

},{}],27:[function(require,module,exports){
'use strict';

var isString = require('is/string');

module.exports = function (value) {
    if (!isString(value)) {
        return false;
    }

    var text = value.trim();
    return text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3;
};

},{"is/string":33}],28:[function(require,module,exports){
// NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
"use strict";

module.exports = function (value) {
    return value && (value instanceof NodeList || value instanceof HTMLCollection);
};

},{}],29:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};

},{}],30:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'number';
};

},{}],31:[function(require,module,exports){
'use strict';

module.exports = function (value) {
    var type = typeof value;
    return type === 'function' || !!value && type === 'object';
};

},{}],32:[function(require,module,exports){
'use strict';

var isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('is/element'),
    isCollection = require('is/collection');

module.exports = function (val) {
    return val && (isString(val) || isFunction(val) || isElement(val) || isCollection(val));
};

},{"is/collection":22,"is/element":24,"is/function":26,"is/string":33}],33:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'string';
};

},{}],34:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === value.window;
};

},{}],35:[function(require,module,exports){
'use strict';

var isElement = require('nodeType').elem,
    DIV = require('DIV'),

// Support: IE9+, modern browsers
matchesSelector = DIV.matches || DIV.matchesSelector || DIV.msMatchesSelector || DIV.mozMatchesSelector || DIV.webkitMatchesSelector || DIV.oMatchesSelector;

// only element types supported
module.exports = function (elem, selector) {
    return isElement(elem) ? matchesSelector.call(elem, selector) : false;
};

},{"DIV":5,"nodeType":55}],36:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    slice = require('util/slice'),
    exists = require('is/exists'),
    map = require('./map');

var each = function each(iterator) {
    return _.dEach(this, iterator);
};

exports.fn = {
    at: function at(index) {
        return this[+index];
    },

    get: function get(index) {
        // No index, return all
        if (!exists(index)) {
            return slice(this);
        }

        var idx = +index;
        return this[
        // Looking to get an index from the end of the set
        // if negative, or the start of the set if positive
        idx < 0 ? this.length + idx : idx];
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
        return D(slice(this, start, end));
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

    each: each,
    forEach: each
};

},{"./map":37,"D":3,"_":15,"is/exists":25,"util/slice":62}],37:[function(require,module,exports){
"use strict";

module.exports = function (arr, iterator) {
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

    // Concat flat for a single array of arrays
    return [].concat.apply([], results);
};

},{}],38:[function(require,module,exports){
'use strict';

var order = require('order');

module.exports = function (results) {
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
};

},{"order":57}],39:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('nodeType').elem,
    isNodeName = require('is/nodeName'),
    newlines = require('util/newlines'),
    SUPPORTS = require('SUPPORTS'),
    REGEX = require('REGEX'),
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

var boolHook = {
    is: function is(attrName) {
        return REGEX.isBoolAttr(attrName);
    },
    get: function get(elem, attrName) {
        return elem.hasAttribute(attrName) ? attrName.toLowerCase() : undefined;
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
    if (!isElement(elem) || !elem.hasAttribute(attr)) {
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
    })
},
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
    setAttribute = function setAttribute(elem, attr, value) {
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

exports.fn = {
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
                    setAttribute(elem, attr, result);
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
};

},{"REGEX":13,"SUPPORTS":14,"_":15,"cache":16,"is/exists":25,"is/function":26,"is/nodeName":29,"is/string":33,"nodeType":55,"util/newlines":61}],40:[function(require,module,exports){
'use strict';

var isElement = require('nodeType').elem,
    isArray = require('is/array'),
    isString = require('is/string'),
    exists = require('is/exists'),
    split = function split(str) {
    return str === '' ? [] : str.trim().split(/\s+/g);
};

var addClass = function addClass(classList, name) {
    classList.add(name);
},
    removeClass = function removeClass(classList, name) {
    classList.remove(name);
},
    toggleClass = function toggleClass(classList, name) {
    classList.toggle(name);
},
    doubleClassLoop = function doubleClassLoop(elems, names, method) {
    var idx = elems.length,
        elem;
    while (idx--) {
        elem = elems[idx];
        if (!isElement(elem)) {
            continue;
        }
        var len = names.length,
            i = 0,
            classList = elem.classList;
        for (; i < len; i++) {
            method(classList, names[i]);
        }
    }
    return elems;
},
    doAnyElemsHaveClass = function doAnyElemsHaveClass(elems, name) {
    var idx = elems.length;
    while (idx--) {
        if (!isElement(elems[idx])) {
            continue;
        }
        if (elems[idx].classList.contains(name)) {
            return true;
        }
    }
    return false;
},
    removeAllClasses = function removeAllClasses(elems) {
    var idx = elems.length;
    while (idx--) {
        if (!isElement(elems[idx])) {
            continue;
        }
        elems[idx].className = '';
    }
    return elems;
};

exports.fn = {
    hasClass: function hasClass(name) {
        return this.length && exists(name) && name !== '' ? doAnyElemsHaveClass(this, name) : false;
    },

    addClass: (function (_addClass) {
        function addClass(_x) {
            return _addClass.apply(this, arguments);
        }

        addClass.toString = function () {
            return _addClass.toString();
        };

        return addClass;
    })(function (names) {
        if (!this.length) {
            return this;
        }

        if (isString(names)) {
            names = split(names);
        }

        if (isArray(names)) {
            return names.length ? doubleClassLoop(this, names, addClass) : this;
        }

        // fallback
        return this;
    }),

    removeClass: (function (_removeClass) {
        function removeClass(_x2) {
            return _removeClass.apply(this, arguments);
        }

        removeClass.toString = function () {
            return _removeClass.toString();
        };

        return removeClass;
    })(function (names) {
        if (!this.length) {
            return this;
        }

        if (!arguments.length) {
            return removeAllClasses(this);
        }

        if (isString(names)) {
            names = split(names);
        }

        if (isArray(names)) {
            return names.length ? doubleClassLoop(this, names, removeClass) : this;
        }

        // fallback
        return this;
    }),

    toggleClass: (function (_toggleClass) {
        function toggleClass(_x3, _x4) {
            return _toggleClass.apply(this, arguments);
        }

        toggleClass.toString = function () {
            return _toggleClass.toString();
        };

        return toggleClass;
    })(function (names, shouldAdd) {
        var nameList;
        if (!arguments.length || !this.length || !(nameList = split(names)).length) {
            return this;
        }

        return shouldAdd === undefined ? doubleClassLoop(this, nameList, toggleClass) : shouldAdd ? doubleClassLoop(this, nameList, addClass) : doubleClassLoop(this, nameList, removeClass);
    })
};

},{"is/array":18,"is/exists":25,"is/string":33,"nodeType":55}],41:[function(require,module,exports){
'use strict';

var _ = require('_'),
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
    isDocumentType = require('nodeType').doc,
    REGEX = require('REGEX');

var swapMeasureDisplaySettings = {
    display: 'block',
    position: 'absolute',
    visibility: 'hidden'
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

        if (isDocumentType(elem)) {
            return getDocumentDimension(elem, 'Width');
        }

        var width = elem.offsetWidth;
        if (width === 0) {
            var computedStyle = getComputedStyle(elem);
            if (!computedStyle) {
                return 0;
            }
            if (REGEX.isNoneOrTable(computedStyle.display)) {
                return cssSwap(elem, swapMeasureDisplaySettings, function () {
                    return getWidthOrHeight(elem, 'width');
                });
            }
        }

        return getWidthOrHeight(elem, 'width');
    },
    set: function set(elem, val) {
        elem.style.width = isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
    }
},
    _height = {
    get: function get(elem) {
        if (isWindow(elem)) {
            return elem.document.documentElement.clientHeight;
        }

        if (isDocumentType(elem)) {
            return getDocumentDimension(elem, 'Height');
        }

        var height = elem.offsetHeight;
        if (height === 0) {
            var computedStyle = getComputedStyle(elem);
            if (!computedStyle) {
                return 0;
            }
            if (REGEX.isNoneOrTable(computedStyle.display)) {
                return cssSwap(elem, swapMeasureDisplaySettings, function () {
                    return getWidthOrHeight(elem, 'height');
                });
            }
        }

        return getWidthOrHeight(elem, 'height');
    },

    set: function set(elem, val) {
        elem.style.height = isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
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
    return _.toPx(val + augmentBorderBoxWidthOrHeight(elem, name, isBorderBox ? 'border' : 'content', valueIsBorderBox, styles));
};

var CSS_EXPAND = _.s('Top|Right|Bottom|Left');
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
            val += parseInt(styles[extra + type]) || 0;
        }

        if (isBorderBox) {

            // border-box includes padding, so remove it if we want content
            if (extraIsContent) {
                val -= parseInt(styles['padding' + type]) || 0;
            }

            // at this point, extra isn't border nor margin, so remove border
            if (!extraIsMargin) {
                val -= parseInt(styles['border' + type + 'Width']) || 0;
            }
        } else {

            // at this point, extra isn't content, so add padding
            val += parseInt(styles['padding' + type]) || 0;

            // at this point, extra isn't content nor padding, so add border
            if (extraIsPadding) {
                val += parseInt(styles['border' + type]) || 0;
            }
        }
    }

    return val;
};

var curCss = function curCss(elem, name, computed) {
    var style = elem.style,
        styles = computed || getComputedStyle(elem),
        ret = styles ? styles.getPropertyValue(name) || styles[name] : undefined;

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
            ret = _.toPx(style.pixelLeft);

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
    elem.style[name] = value === +value ? _.toPx(value) : value;
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

},{"REGEX":13,"_":15,"is/array":18,"is/attached":20,"is/boolean":21,"is/document":23,"is/element":24,"is/exists":25,"is/number":30,"is/object":31,"is/string":33,"is/window":34,"nodeType":55}],42:[function(require,module,exports){
'use strict';

var cache = require('cache')(2, true),
    isString = require('is/string'),
    isArray = require('is/array'),
    isElement = require('is/element'),
    ACCESSOR = '__D_id__ ',
    uniqueId = require('util/uniqueId').seed(Date.now()),
    getId = function getId(elem) {
    return elem && elem[ACCESSOR];
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

// TODO: Address API
module.exports = {
    remove: function remove(elem, str) {
        return str === undefined ? removeAllData(elem) : removeData(elem, str);
    },

    D: {
        data: function data(elem, key, value) {
            if (arguments.length === 3) {
                return setData(elem, key, value);
            }

            if (arguments.length === 2) {
                if (isString(key)) {
                    return getData(elem, key);
                }

                // object passed
                var map = key,
                    id,
                    key;
                if (!(id = getId(elem))) {
                    return;
                }
                for (key in map) {
                    cache.set(id, key, map[key]);
                }
                return map;
            }

            return isElement(elem) ? getAllData(elem) : this;
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
            return isElement(elem) ? hasData(elem) : undefined;
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
                var array = key,
                    id;
                if (!(id = getId(elem))) {
                    return;
                }
                var idx = array.length;
                while (idx--) {
                    cache.remove(id, array[idx]);
                }
            }

            return isElement(elem) ? removeAllData(elem) : this;
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

},{"cache":16,"is/array":18,"is/element":24,"is/string":33,"util/uniqueId":63}],43:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isNumber = require('is/number'),
    css = require('./css');

var add = function add(arr) {
    var idx = arr.length,
        total = 0;
    while (idx--) {
        total += arr[idx] || 0;
    }
    return total;
},
    getInnerWidth = function getInnerWidth(elem) {
    return add([parseFloat(css.width.get(elem)), _.parseInt(css.curCss(elem, 'paddingLeft')), _.parseInt(css.curCss(elem, 'paddingRight'))]);
},
    getInnerHeight = function getInnerHeight(elem) {
    return add([parseFloat(css.height.get(elem)), _.parseInt(css.curCss(elem, 'paddingTop')), _.parseInt(css.curCss(elem, 'paddingBottom'))]);
},
    getOuterWidth = function getOuterWidth(elem, withMargin) {
    return add([getInnerWidth(elem), withMargin ? _.parseInt(css.curCss(elem, 'marginLeft')) : 0, withMargin ? _.parseInt(css.curCss(elem, 'marginRight')) : 0, _.parseInt(css.curCss(elem, 'borderLeftWidth')), _.parseInt(css.curCss(elem, 'borderRightWidth'))]);
},
    getOuterHeight = function getOuterHeight(elem, withMargin) {
    return add([getInnerHeight(elem), withMargin ? _.parseInt(css.curCss(elem, 'marginTop')) : 0, withMargin ? _.parseInt(css.curCss(elem, 'marginBottom')) : 0, _.parseInt(css.curCss(elem, 'borderTopWidth')), _.parseInt(css.curCss(elem, 'borderBottomWidth'))]);
};

exports.fn = {
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
};

},{"./css":41,"_":15,"is/number":30}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{"crossvent":2,"is/exists":25,"matchesSelector":35}],46:[function(require,module,exports){
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

exports.fn = {
    on: eventer(delegate.on),
    off: eventer(delegate.off),
    trigger: eventer(delegate.trigger)
};

},{"./custom":44,"./delegate":45,"_":15,"is/function":26}],47:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    exists = require('is/exists'),
    isD = require('is/D'),
    isElement = require('is/element'),
    isHtml = require('is/html'),
    isString = require('is/string'),
    isNodeList = require('is/nodeList'),
    isNumber = require('is/number'),
    isFunction = require('is/function'),
    isCollection = require('is/collection'),
    isD = require('is/D'),
    isWindow = require('is/window'),
    isDocument = require('is/document'),
    selectorFilter = require('./selectors/filter'),
    unique = require('./array/unique'),
    order = require('order'),
    data = require('./data'),
    parser = require('parser');

var parentLoop = function parentLoop(iterator) {
    return function (elems) {
        return _.each(elems, function (elem) {
            var parent;
            if (elem && (parent = elem.parentNode)) {
                iterator(elem, parent);
            }
        });
    };
};

var remove = parentLoop(function (elem, parent) {
    data.remove(elem);
    parent.removeChild(elem);
}),
    detach = parentLoop(function (elem, parent) {
    parent.removeChild(elem);
}),
    stringToFragment = function stringToFragment(str) {
    var frag = document.createDocumentFragment();
    frag.textContent = '' + str;
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
                appendPrependArrayToElem(elem, parser(elem), pender);
                return this;
            }

            pender(elem, stringToFragment(result));
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

exports.fn = {
    clone: function clone() {
        return _.fastmap(this.slice(), function (elem) {
            return elem.cloneNode(true);
        });
    },

    append: (function (_append) {
        function append(_x) {
            return _append.apply(this, arguments);
        }

        append.toString = function () {
            return _append.toString();
        };

        return append;
    })(function (value) {
        if (isHtml(value)) {
            appendPrependMergeArray(this, parser(value), append);
            return this;
        }

        if (isString(value) || isNumber(value)) {
            appendPrependElemToArray(this, stringToFragment(value), append);
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
        var target = this[0],
            parent = target && target.parentNode;
        if (!target || !parent) {
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

    insertBefore: function insertBefore(target) {
        if (!target) {
            return this;
        }

        if (isString(target)) {
            target = D(target)[0];
        }

        _.each(this, function (elem) {
            var parent = elem.parentNode;
            if (parent) {
                parent.insertBefore(target, elem.nextSibling);
            }
        });

        return this;
    },

    after: function after(element) {
        var target = this[0],
            parent = target && target.parentNode;
        if (!target || !parent) {
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

    insertAfter: function insertAfter(target) {
        if (!target) {
            return this;
        }

        if (isString(target)) {
            target = D(target)[0];
        }

        _.each(this, function (elem) {
            var parent = elem.parentNode;
            if (parent) {
                parent.insertBefore(elem, target);
            }
        });

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
        if (isHtml(value)) {
            appendPrependMergeArray(this, parser(value), prepend);
            return this;
        }

        if (isString(value) || isNumber(value)) {
            appendPrependElemToArray(this, stringToFragment(value), prepend);
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
        D(d).prepend(this);
        return this;
    },

    empty: function empty() {
        var elems = this,
            idx = 0,
            length = elems.length;
        for (; idx < length; idx++) {

            var elem = elems[idx],
                descendants = elem.querySelectorAll('*'),
                i = descendants.length,
                desc;
            while (i--) {
                desc = descendants[i];
                data.remove(desc);
            }

            elem.innerHTML = '';
        }
        return elems;
    },

    add: function add(selector) {
        var elems = unique(this.get().concat(
        // string
        isString(selector) ? D(selector).get() :
        // collection
        isCollection(selector) ? _.toArray(selector) :
        // element
        isWindow(selector) || isDocument(selector) || isElement(selector) ? [selector] : []));
        order.sort(elems);
        return D(elems);
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
            remove(selectorFilter(this, selector));
            return this;
        }

        // fallback
        return remove(this);
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
            detach(selectorFilter(this, selector));
            return this;
        }

        return detach(this);
    })
};

},{"./array/unique":38,"./data":42,"./selectors/filter":51,"D":3,"_":15,"is/D":17,"is/collection":22,"is/document":23,"is/element":24,"is/exists":25,"is/function":26,"is/html":27,"is/nodeList":28,"is/number":30,"is/string":33,"is/window":34,"order":57,"parser":58}],48:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    exists = require('is/exists'),
    isAttached = require('is/attached'),
    isFunction = require('is/function'),
    isObject = require('is/object'),
    isNodeName = require('is/nodeName'),
    DOC_ELEM = document.documentElement;

var getPosition = function getPosition(elem) {
    return {
        top: elem.offsetTop || 0,
        left: elem.offsetLeft || 0
    };
};

var getOffset = function getOffset(elem) {
    var rect = isAttached(elem) ? elem.getBoundingClientRect() : {},
        body = document.body;

    return {
        top: rect.top + body.scrollTop || 0,
        left: rect.left + body.scrollLeft || 0
    };
};

var setOffset = function setOffset(elem, idx, pos) {
    var style = elem.style,
        position = style.position || 'static',
        props = {};

    // set position first, in-case top/left are set even on static elem
    if (position === 'static') {
        style.position = 'relative';
    }

    var curOffset = getOffset(elem),
        curCSSTop = style.top,
        curCSSLeft = style.left,
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

    style.top = _.toPx(props.top);
    style.left = _.toPx(props.left);
};

exports.fn = {
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
            var offsetParent = elem.offsetParent || DOC_ELEM;

            while (offsetParent && (!isNodeName(offsetParent, 'html') && (offsetParent.style.position || 'static') === 'static')) {
                offsetParent = offsetParent.offsetParent;
            }

            return offsetParent || DOC_ELEM;
        }));
    }
};

},{"D":3,"_":15,"is/attached":20,"is/exists":25,"is/function":26,"is/nodeName":29,"is/object":31}],49:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isString = require('is/string'),
    isFunction = require('is/function'),
    SUPPORTS = require('SUPPORTS'),
    nodeType = require('nodeType'),
    REGEX = require('REGEX');

var propFix = _.s('tabIndex|readOnly|className|maxLength|cellSpacing|cellPadding|rowSpan|colSpan|useMap|frameBorder|contentEditable').reduce(function (obj, str) {
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
                return _.parseInt(tabindex);
            }

            var nodeName = elem.nodeName;
            return REGEX.isFocusable(nodeName) || REGEX.isClickable(nodeName) && elem.href ? 0 : -1;
        }
    }
};

var getOrSetProp = function getOrSetProp(elem, name, value) {
    // don't get/set properties on text, comment and attribute nodes
    if (!elem || nodeType.text(elem) || nodeType.comment(elem) || nodeType.attr(elem)) {
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

exports.fn = {
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
};

},{"REGEX":13,"SUPPORTS":14,"_":15,"is/function":26,"is/string":33,"nodeType":55}],50:[function(require,module,exports){
'use strict';

var isString = require('is/string'),
    exists = require('is/exists');

var coerceNum = function coerceNum(value) {
    return (
        // Its a number! || 0 to avoid NaN (as NaN's a number)
        +value === value ? value || 0 :
        // Avoid NaN again
        isString(value) ? +value || 0 :
        // Default to zero
        0
    );
};

var protect = function protect(context, val, callback) {
    var elem = context[0];
    if (!elem && !exists(val)) {
        return null;
    }
    if (!elem) {
        return context;
    }

    return callback(context, elem, val);
};

var handler = function handler(attribute) {
    return function (context, elem, val) {
        if (exists(val)) {
            elem[attribute] = coerceNum(val);
            return context;
        }

        return elem[attribute];
    };
};

var scrollTop = handler('scrollTop');
var scrollLeft = handler('scrollLeft');

exports.fn = {
    scrollLeft: (function (_scrollLeft) {
        function scrollLeft(_x) {
            return _scrollLeft.apply(this, arguments);
        }

        scrollLeft.toString = function () {
            return _scrollLeft.toString();
        };

        return scrollLeft;
    })(function (val) {
        return protect(this, val, scrollLeft);
    }),

    scrollTop: (function (_scrollTop) {
        function scrollTop(_x2) {
            return _scrollTop.apply(this, arguments);
        }

        scrollTop.toString = function () {
            return _scrollTop.toString();
        };

        return scrollTop;
    })(function (val) {
        return protect(this, val, scrollTop);
    })
};

},{"is/exists":25,"is/string":33}],51:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isFunction = require('is/function'),
    isString = require('is/string'),
    Fizzle = require('Fizzle');

module.exports = function (arr, qualifier) {
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

},{"Fizzle":9,"_":15,"is/function":26,"is/string":33}],52:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    isSelector = require('is/selector'),
    isCollection = require('is/collection'),
    isFunction = require('is/function'),
    isElement = require('is/element'),
    isNodeList = require('is/nodeList'),
    isArray = require('is/array'),
    isString = require('is/string'),
    isD = require('is/D'),
    order = require('order'),
    Fizzle = require('Fizzle');

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

exports.fn = {
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
            order.sort(result);
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
};

},{"D":3,"Fizzle":9,"_":15,"is/D":17,"is/array":18,"is/collection":22,"is/element":24,"is/function":26,"is/nodeList":28,"is/selector":32,"is/string":33,"order":57}],53:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    nodeType = require('nodeType'),
    exists = require('is/exists'),
    isString = require('is/string'),
    isAttached = require('is/attached'),
    isElement = require('is/element'),
    isWindow = require('is/window'),
    isDocument = require('is/document'),
    isD = require('is/D'),
    order = require('order'),
    unique = require('./array/unique'),
    selectorFilter = require('./selectors/filter'),
    Fizzle = require('Fizzle');

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
        arr = Array(len);
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
        closest = selectorFilter(parents, selector);
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

// Safely get parent node
_getNodeParent = function _getNodeParent(node) {
    return node && node.parentNode;
},
    _crawlUpNode = function _crawlUpNode(node, context, stopSelector) {
    var result = [],
        parent = node;

    while ((parent = _getNodeParent(parent)) && !nodeType.doc(parent) && (!context || parent !== context) && (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
        if (nodeType.elem(parent)) {
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
        var parent = _getNodeParent(context[idx]);
        if (parent) {
            result.push(parent);
        }
    }
    return result;
},
    _prevNextCrawl = function _prevNextCrawl(method) {
    return function (node) {
        var current = node;
        while ((current = current[method]) && !nodeType.elem(current)) {}
        return current;
    };
},
    getPrev = _prevNextCrawl('previousSibling'),
    getNext = _prevNextCrawl('nextSibling'),
    _prevNextCrawlAll = function _prevNextCrawlAll(method) {
    return function (node) {
        var result = [],
            current = node;
        while (current = current[method]) {
            if (nodeType.elem(current)) {
                result.push(current);
            }
        }
        return result;
    };
},
    getPrevAll = _prevNextCrawlAll('previousSibling'),
    getNextAll = _prevNextCrawlAll('nextSibling'),
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
        filter = selector ? function (sibling) {
        return Fizzle.is(selector).match(sibling);
    } : exists;

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
    var result = unique(elems);
    order.sort(result);
    if (reverse) {
        result.reverse();
    }
    return D(result);
},
    filterAndSort = function filterAndSort(elems, selector, reverse) {
    return uniqueSort(selectorFilter(elems, selector), reverse);
};

exports.fn = {
    contents: function contents() {
        return D(_.flatten(_.pluck(this, 'childNodes')));
    },

    index: function index(selector) {
        var outOfBounds = -1;
        if (!this.length) {
            return outOfBounds;
        }

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
        var first = this[0],
            parent = first.parentNode;

        if (!parent) {
            return outOfBounds;
        }

        // isAttached check to pass test "Node without parent returns -1"
        // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
        var attached = isAttached(first),
            isParentFragment = nodeType.doc_frag(parent);

        if (!attached && !isParentFragment) {
            return outOfBounds;
        }

        var childElems = parent.children || _.filter(parent.childNodes, nodeType.elem);

        return [].indexOf.call(childElems, first);
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
};

},{"./array/unique":38,"./selectors/filter":51,"D":3,"Fizzle":9,"_":15,"is/D":17,"is/attached":20,"is/document":23,"is/element":24,"is/exists":25,"is/string":33,"is/window":34,"nodeType":55,"order":57}],54:[function(require,module,exports){
'use strict';

var _ = require('_'),
    newlines = require('util/newlines'),
    exists = require('is/exists'),
    isString = require('is/string'),
    isArray = require('is/array'),
    isNumber = require('is/number'),
    isFunction = require('is/function'),
    isNodeName = require('is/nodeName'),
    SUPPORTS = require('SUPPORTS'),
    isElement = require('nodeType').elem;

var normalNodeName = function normalNodeName(elem) {
    return elem.nodeName.toLowerCase();
},
    outerHtml = function outerHtml() {
    return this.length ? this[0].outerHTML : null;
},
    textGet = SUPPORTS.textContent ? function (elem) {
    return elem.textContent;
} : function (elem) {
    return elem.innerText;
},
    textSet = SUPPORTS.textContent ? function (elem, str) {
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
    if (!isElement(elem)) {
        return;
    }

    var hook = valHooks[elem.type] || valHooks[normalNodeName(elem)];
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
    if (!isElement(elem)) {
        return;
    }

    // Stringify values
    var value = isArray(val) ? _.map(val, stringify) : stringify(val);

    var hook = valHooks[elem.type] || valHooks[normalNodeName(elem)];
    if (hook && hook.set) {
        hook.set(elem, value);
    } else {
        elem.setAttribute('value', value);
    }
};

exports.fn = {
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
                if (!isElement(elem)) {
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

        return _.map(this, textGet).join('');
    }
};

// Don't return options that are disabled or in a disabled optgroup

},{"SUPPORTS":14,"_":15,"is/array":18,"is/exists":25,"is/function":26,"is/nodeName":29,"is/number":30,"is/string":33,"nodeType":55,"util/newlines":61}],55:[function(require,module,exports){
"use strict";

var is = function is(x) {
    return function (elem) {
        return elem && elem.nodeType === x;
    };
};

// commented-out methods are not being used
module.exports = {
    elem: is(1),
    attr: is(2),
    text: is(3),
    // cdata: is(4),
    // entity_reference: is(5),
    // entity: is(6),
    // processing_instruction: is(7),
    comment: is(8),
    doc: is(9),
    // document_type: is(10),
    doc_frag: is(11)
    // notation: is(12),
};

},{}],56:[function(require,module,exports){
'use strict';

var ready = false,
    registration = [];

var wait = function wait(fn) {
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

wait(function () {
    ready = true;

    // call registered methods   
    while (registration.length) {
        registration.shift()();
    }
});

module.exports = function (callback) {
    return ready ? callback() : registration.push(callback);
};

},{}],57:[function(require,module,exports){
'use strict';

var isAttached = require('is/attached'),
    isElement = require('nodeType').elem,

// http://ejohn.org/blog/comparing-document-position/
// https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
CONTAINED_BY = 16,
    FOLLOWING = 4,
    DISCONNECTED = 1;

var is = function is(rel, flag) {
    return (rel & flag) === flag;
},
    isNode = function isNode(b, flag, a) {
    return is(a.compareDocumentPosition(b), flag);
},
    hasDuplicate = false;

var sort = function sort(node1, node2) {
    // Flag for duplicate removal
    if (node1 === node2) {
        hasDuplicate = true;
        return 0;
    }

    // Nodes share the same document
    var rel = (node1.ownerDocument || node1) === (node2.ownerDocument || node2) ?
    // then compare position
    node1.compareDocumentPosition(node2) :
    // Otherwise we know they are disconnected
    DISCONNECTED;

    // Not directly comparable
    if (!rel) {
        return 0;
    }

    // Disconnected nodes
    if (is(rel, DISCONNECTED)) {
        var isNode1Disconnected = !isAttached(node1),
            isNode2Disconnected = !isAttached(node2);

        // sort order
        return isNode1Disconnected && isNode2Disconnected ? 0 : isNode2Disconnected ? -1 : 1;
    }

    return is(rel, FOLLOWING) ? -1 : 1;
};

/**
 * Sorts an array of D elements in-place (i.e., mutates the original array)
 * in document order and returns whether any duplicates were found.
 * @function
 * @param {Element[]} array          Array of D elements.
 * @param {Boolean}  [reverse=false] If a truthy value is passed, the given array will be reversed.
 * @returns {Boolean} true if any duplicates were found, otherwise false.
 * @see jQuery src/selector-native.js:37
 */
exports.sort = function (array, reverse) {
    hasDuplicate = false;
    array.sort(sort);
    if (reverse) {
        array.reverse();
    }
    return hasDuplicate;
};

/**
 * Determines whether node `a` contains node `b`.
 * @param {Element} a D element node
 * @param {Element} b D element node
 * @returns {Boolean} true if node `a` contains node `b`; otherwise false.
 */
exports.contains = function (a, b) {
    var bUp = isAttached(b) ? b.parentNode : null;

    if (a === bUp) {
        return true;
    }

    if (isElement(bUp)) {
        // Modern browsers (IE9+)
        if (a.compareDocumentPosition) {
            return isNode(bUp, CONTAINED_BY, a);
        }
    }

    return false;
};

},{"is/attached":20,"nodeType":55}],58:[function(require,module,exports){
'use strict';

var REGEX = require('REGEX'),
    MAX_SINGLE_TAG_LENGTH = 30,
    create = require('DIV/create');

var parseString = function parseString(parentTagName, htmlStr) {
    var parent = create(parentTagName);
    parent.innerHTML = htmlStr;
    return parent;
};

var parseSingleTag = function parseSingleTag(htmlStr) {
    if (htmlStr.length > MAX_SINGLE_TAG_LENGTH) {
        return null;
    }

    var singleTagMatch = REGEX.singleTagMatch(htmlStr);
    return singleTagMatch ? [create(singleTagMatch[1])] : null;
};

module.exports = function (htmlStr) {
    var singleTag = parseSingleTag(htmlStr);
    if (singleTag) {
        return singleTag;
    }

    var parentTagName = REGEX.getParentTagName(htmlStr),
        parent = parseString(parentTagName, htmlStr);

    var child,
        idx = parent.children.length,
        arr = Array(idx);
    while (idx--) {
        child = parent.children[idx];
        parent.removeChild(child);
        arr[idx] = child;
    }

    parent = null;

    return arr.reverse();
};

},{"DIV/create":4,"REGEX":13}],59:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('./D'),
    parser = require('parser'),
    Fizzle = require('Fizzle'),
    data = require('modules/data');

var parseHtml = function parseHtml(str) {
    if (!str) {
        return null;
    }
    var result = parser(str);
    return result && result.length ? D(result) : null;
};

_.extend(D, data.D, {
    // Because no one know what the case should be
    parseHtml: parseHtml,
    parseHTML: parseHtml,

    // expose the selector engine for debugging
    Fizzle: Fizzle,

    each: _.jqEach,
    forEach: _.dEach,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

},{"./D":3,"Fizzle":9,"_":15,"modules/data":42,"parser":58}],60:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('./D'),
    array = require('modules/array'),
    selectors = require('modules/selectors'),
    transversal = require('modules/transversal'),
    dimensions = require('modules/dimensions'),
    manip = require('modules/manip'),
    css = require('modules/css'),
    attr = require('modules/attr'),
    prop = require('modules/prop'),
    val = require('modules/val'),
    position = require('modules/position'),
    classes = require('modules/classes'),
    scroll = require('modules/scroll'),
    data = require('modules/data'),
    events = require('modules/events');

var arrayProto = _.s('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight|map|filter').reduce(function (obj, key) {
    obj[key] = Array.prototype[key];
    return obj;
}, {});

// Expose the prototype so that
// it can be hooked into for plugins
D.fn = D.prototype;

_.extend(D.fn, { constructor: D }, arrayProto, array.fn, selectors.fn, transversal.fn, manip.fn, dimensions.fn, css.fn, attr.fn, prop.fn, val.fn, classes.fn, position.fn, scroll.fn, data.fn, events.fn);

},{"./D":3,"_":15,"modules/array":36,"modules/attr":39,"modules/classes":40,"modules/css":41,"modules/data":42,"modules/dimensions":43,"modules/events":46,"modules/manip":47,"modules/position":48,"modules/prop":49,"modules/scroll":50,"modules/selectors":52,"modules/transversal":53,"modules/val":54}],61:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ? function (str) {
    return str;
} : function (str) {
    return str ? str.replace(/\r\n/g, '\n') : str;
};

},{"SUPPORTS":14}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL2lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9xdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvcHJveHkuanNvbiIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ub2RlTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvbnVtYmVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9vYmplY3QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9zdHJpbmcuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3dpbmRvdy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbWF0Y2hlc1NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L21hcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZVR5cGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zbGljZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztBQ0ZuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QztBQUMzQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVMsTUFBTSxFQUFFLEdBQUcsRUFBRTtBQUNsQyxRQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksRUFBRTtRQUNsQixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUN2QixXQUFPO2VBQU0sTUFBTSxHQUFHLElBQUksRUFBRTtLQUFBLENBQUM7Q0FDaEMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vRCcpO1xyXG5yZXF1aXJlKCcuL3Byb3BzJyk7XHJcbnJlcXVpcmUoJy4vcHJvdG8nKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCB1bndyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSkge1xuICB2YXIgZTtcbiAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ICA9IGUucHJldmVudERlZmF1bHQgIHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCdpcy9hcnJheUxpa2UnKSxcclxuICAgIGlzSHRtbCAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgcGFyc2VyICAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIG9ucmVhZHkgICAgID0gcmVxdWlyZSgnb25yZWFkeScpLFxyXG4gICAgRml6emxlICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBBcGkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBEKHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEFwaSk7XHJcblxyXG5mdW5jdGlvbiBEKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgLy8gbm90aGluXHJcbiAgICBpZiAoIXNlbGVjdG9yKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgLy8gZWxlbWVudCBvciB3aW5kb3cgKGRvY3VtZW50cyBoYXZlIGEgbm9kZVR5cGUpXHJcbiAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUgfHwgc2VsZWN0b3IgPT09IHdpbmRvdykge1xyXG4gICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcclxuICAgICAgICB0aGlzLmxlbmd0aCA9IDE7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSFRNTCBzdHJpbmdcclxuICAgIGlmIChpc0h0bWwoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBwYXJzZXIoc2VsZWN0b3IpKTtcclxuICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTdHJpbmdcclxuICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgcmV0dXJuIF8ubWVyZ2UodGhpcywgRml6emxlLnF1ZXJ5KHNlbGVjdG9yKS5leGVjKHRoaXMsIHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBkb2N1bWVudCByZWFkeVxyXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgb25yZWFkeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEFycmF5IG9mIEVsZW1lbnRzLCBOb2RlTGlzdCwgb3IgRCBvYmplY3RcclxuICAgIGlmIChpc0FycmF5TGlrZShzZWxlY3RvcikpIHtcclxuICAgICAgICByZXR1cm4gXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuRC5wcm90b3R5cGUgPSBBcGkucHJvdG90eXBlOyIsIm1vZHVsZS5leHBvcnRzID0gKHRhZykgPT4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpOyIsInZhciBkaXYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY3JlYXRlJykoJ2RpdicpO1xyXG5cclxuZGl2LmlubmVySFRNTCA9ICc8YSBocmVmPVwiL2FcIj5hPC9hPic7IiwidmFyIF8gPSByZXF1aXJlKCdfJyk7XHJcblxyXG52YXIgbWF0Y2ggPSBmdW5jdGlvbihjb250ZXh0LCBzZWxlY3RvcnMpIHtcclxuICAgIHZhciBpZHggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgaWYgKHNlbGVjdG9yc1tpZHhdLm1hdGNoKGNvbnRleHQpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBJcyhzZWxlY3RvcnMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoKGNvbnRleHQsIHNlbGVjdG9ycyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYW55OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICAgICBtYXRjaChlbGVtLCBzZWxlY3RvcnMpID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICAgICAhbWF0Y2goZWxlbSwgc2VsZWN0b3JzKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07IiwidmFyIGZpbmQgPSBmdW5jdGlvbihzZWxlY3RvcnMsIGNvbnRleHQpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHNlbGVjdG9yc1tpZHhdLmV4ZWMoY29udGV4dCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gUXVlcnkoc2VsZWN0b3JzKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGV4ZWM6IGZ1bmN0aW9uKGFyciwgaXNOZXcpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoZmluZChzZWxlY3RvcnMsIGFycltpZHhdKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIG1hdGNoZXMgICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIHVuaXF1ZUlkICAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZCgwLCAnX0QnICsgRGF0ZS5ub3coKSksXHJcblxyXG4gICAgR0VUX0VMRU1FTlRfQllfSUQgICAgICAgICAgPSAnZ2V0RWxlbWVudEJ5SWQnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FICAgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUUgPSAnZ2V0RWxlbWVudHNCeUNsYXNzTmFtZScsXHJcbiAgICBRVUVSWV9TRUxFQ1RPUl9BTEwgICAgICAgICA9ICdxdWVyeVNlbGVjdG9yQWxsJztcclxuXHJcbnZhciBkZXRlcm1pbmVNZXRob2QgPSAoc2VsZWN0b3IpID0+XHJcbiAgICAgICAgUkVHRVguaXNTdHJpY3RJZChzZWxlY3RvcikgPyBHRVRfRUxFTUVOVF9CWV9JRCA6XHJcbiAgICAgICAgUkVHRVguaXNDbGFzcyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA6XHJcbiAgICAgICAgUkVHRVguaXNUYWcoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FIDogICAgICAgXHJcbiAgICAgICAgUVVFUllfU0VMRUNUT1JfQUxMLFxyXG5cclxuICAgIHByb2Nlc3NRdWVyeVNlbGVjdGlvbiA9IChzZWxlY3Rpb24pID0+XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uIG9yIGEgTm9kZWxpc3Qgd2l0aG91dCBhIGxlbmd0aFxyXG4gICAgICAgIC8vIHNob3VsZCByZXN1bHQgaW4gbm90aGluZ1xyXG4gICAgICAgICFzZWxlY3Rpb24gfHwgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkgPyBbXSA6XHJcbiAgICAgICAgLy8gSWYgaXQncyBhbiBpZCBzZWxlY3Rpb24sIHJldHVybiBpdCBhcyBhbiBhcnJheVxyXG4gICAgICAgIGlzRWxlbWVudChzZWxlY3Rpb24pIHx8ICFzZWxlY3Rpb24ubGVuZ3RoID8gW3NlbGVjdGlvbl0gOiBcclxuICAgICAgICAvLyBlbnN1cmUgaXQncyBhbiBhcnJheSBhbmQgbm90IGFuIEhUTUxDb2xsZWN0aW9uXHJcbiAgICAgICAgXy50b0FycmF5KHNlbGVjdGlvbiksXHJcblxyXG4gICAgY2hpbGRPclNpYmxpbmdRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICAvLyBDaGlsZCBzZWxlY3QgLSBuZWVkcyBzcGVjaWFsIGhlbHAgc28gdGhhdCBcIj4gZGl2XCIgZG9lc24ndCBicmVha1xyXG4gICAgICAgIHZhciBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKFxyXG4gICAgICAgICAgICAvLyB0YWlsb3IgdGhlIGNoaWxkIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGAjJHtpZEFwcGxpZWQgPyBuZXdJZCA6IGlkfSAke3NlbGVjdG9yfWBcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoaWRBcHBsaWVkKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xhc3NRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICAvLyBDbGFzcyBzZWFyY2gsIGRvbid0IHN0YXJ0IHdpdGggJy4nXHJcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBjb250ZXh0W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGlkUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBtZXRob2QsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHNlbCA9IHNlbGVjdG9yLnN1YnN0cigxKSxcclxuICAgICAgICAgICAgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWwpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRlZmF1bHRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGVybWluZVF1ZXJ5ID0gKGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QsIGlzQ2xhc3NTZWFyY2gsIGlzSWRTZWFyY2gpID0+XHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IGNoaWxkT3JTaWJsaW5nUXVlcnkgOlxyXG4gICAgICAgIGlzQ2xhc3NTZWFyY2ggPyBjbGFzc1F1ZXJ5IDpcclxuICAgICAgICBpc0lkU2VhcmNoID8gaWRRdWVyeSA6XHJcbiAgICAgICAgZGVmYXVsdFF1ZXJ5O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTZWxlY3RvcihzdHIpIHtcclxuICAgIHZhciBzZWxlY3RvciAgICAgICAgICAgICAgICA9IHN0ci50cmltKCksXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCAgPSBzZWxlY3RvclswXSA9PT0gJz4nIHx8IHNlbGVjdG9yWzBdID09PSAnKycsXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gUVVFUllfU0VMRUNUT1JfQUxMIDogZGV0ZXJtaW5lTWV0aG9kKHNlbGVjdG9yKSxcclxuICAgICAgICBpc0lkU2VhcmNoICAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRfQllfSUQsXHJcbiAgICAgICAgaXNDbGFzc1NlYXJjaCAgICAgICAgICAgPSAhaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FO1xyXG5cclxuICAgIHZhciBxdWVyeSA9IGRldGVybWluZVF1ZXJ5KFxyXG4gICAgICAgIGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QsXHJcbiAgICAgICAgaXNDbGFzc1NlYXJjaCxcclxuICAgICAgICBpc0lkU2VhcmNoXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RyOiBzdHIsXHJcblxyXG4gICAgICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIC8vIE5vIG5lZWVkIHRvIGNoZWNrLCBhIG1hdGNoIHdpbGwgZmFpbCBpZiBpdCdzXHJcbiAgICAgICAgICAgIC8vIGNoaWxkIG9yIHNpYmxpbmdcclxuICAgICAgICAgICAgcmV0dXJuICFpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gbWF0Y2hlcyhjb250ZXh0LCBzZWxlY3RvcikgOiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgICAgICAvLyBpc0VsZW1lbnQoY29udGV4dCkgfHwgaXNOb2RlTGlzdChjb250ZXh0KSB8fCBpc0NvbGxlY3Rpb24oY29udGV4dClcclxuICAgICAgICAgICAgLy8gaWYgbm8gY29udGV4dCBpcyBnaXZlbiwgdXNlIGRvY3VtZW50XHJcbiAgICAgICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0IHx8IGRvY3VtZW50LCBtZXRob2QsIHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnLi4vXycpLFxyXG4gICAgcXVlcnlDYWNoZSA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIGlzQ2FjaGUgICAgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBzZWxlY3RvciAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL3NlbGVjdG9yJyksXHJcbiAgICBxdWVyeSAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL3F1ZXJ5JyksXHJcbiAgICBpcyAgICAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL2lzJyksXHJcbiAgICBwYXJzZSAgICAgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1wYXJzZScpLFxyXG4gICAgbm9ybWFsaXplICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplJyk7XHJcblxyXG52YXIgdG9TZWxlY3RvcnMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBfLmZhc3RtYXAoXHJcbiAgICAgICAgXy5mYXN0bWFwKFxyXG4gICAgICAgICAgICAvLyBTZWxlY3RvcnMgd2lsbCByZXR1cm4gW10gaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgICAgICAgICAvLyBOb3QgcmV0dXJuaW5nIGVhcmx5IG9yIGRvaW5nIGV4dHJhIGNoZWNrcyBhcyB0aGlzIHdpbGxcclxuICAgICAgICAgICAgLy8gbm9vcCBvbiB0aGUgcXVlcnkgYW5kIGlzIGxldmVsIGFuZCBpcyB0aGUgZXhjZXB0aW9uXHJcbiAgICAgICAgICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgICAgICAgICAgcGFyc2Uoc3RyKSxcclxuICAgICAgICAgICAgLy8gTm9ybWFsaXplIGVhY2ggb2YgdGhlIHNlbGVjdG9ycy4uLlxyXG4gICAgICAgICAgICBub3JtYWxpemVcclxuICAgICAgICApLFxyXG4gICAgICAgIC8vIC4uLmFuZCBtYXAgdGhlbSB0byBzZWxlY3RvciBvYmplY3RzXHJcbiAgICAgICAgc2VsZWN0b3JcclxuICAgICk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbGVjdG9yOiB0b1NlbGVjdG9ycyxcclxuICAgIHBhcnNlOiBwYXJzZSxcclxuICAgIFxyXG4gICAgcXVlcnk6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBxdWVyeUNhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5zZXQoc3RyLCBxdWVyeSh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBpc0NhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIGlzQ2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgaXNDYWNoZS5zZXQoc3RyLCBpcyh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcbiAgICBcIjpjaGlsZC1ldmVuXCIgOiBcIjpudGgtY2hpbGQoZXZlbilcIixcclxuICAgIFwiOmNoaWxkLW9kZFwiICA6IFwiOm50aC1jaGlsZChvZGQpXCIsXHJcbiAgICBcIjp0ZXh0XCIgICAgICAgOiBcIlt0eXBlPXRleHRdXCIsXHJcbiAgICBcIjpwYXNzd29yZFwiICAgOiBcIlt0eXBlPXBhc3N3b3JkXVwiLFxyXG4gICAgXCI6cmFkaW9cIiAgICAgIDogXCJbdHlwZT1yYWRpb11cIixcclxuICAgIFwiOmNoZWNrYm94XCIgICA6IFwiW3R5cGU9Y2hlY2tib3hdXCIsXHJcbiAgICBcIjpzdWJtaXRcIiAgICAgOiBcIlt0eXBlPXN1Ym1pdF1cIixcclxuICAgIFwiOnJlc2V0XCIgICAgICA6IFwiW3R5cGU9cmVzZXRdXCIsXHJcbiAgICBcIjpidXR0b25cIiAgICAgOiBcIlt0eXBlPWJ1dHRvbl1cIixcclxuICAgIFwiOmltYWdlXCIgICAgICA6IFwiW3R5cGU9aW1hZ2VdXCIsXHJcbiAgICBcIjppbnB1dFwiICAgICAgOiBcIlt0eXBlPWlucHV0XVwiLFxyXG4gICAgXCI6ZmlsZVwiICAgICAgIDogXCJbdHlwZT1maWxlXVwiLFxyXG4gICAgXCI6c2VsZWN0ZWRcIiAgIDogXCJbc2VsZWN0ZWQ9c2VsZWN0ZWRdXCJcclxufSIsInZhciBTVVBQT1JUUyAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgUFNFVURPX1NFTEVDVCAgICAgID0gLyg6W15cXHNcXChcXFspXSspL2csXHJcbiAgICBTRUxFQ1RFRF9TRUxFQ1QgICAgPSAvXFxbc2VsZWN0ZWRcXF0vZ2ksXHJcbiAgICBjYWNoZSAgICAgICAgICAgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBwcm94aWVzICAgICAgICAgICAgPSByZXF1aXJlKCcuL3Byb3h5Lmpzb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICByZXR1cm4gY2FjaGUuaGFzKHN0cikgPyBjYWNoZS5nZXQoc3RyKSA6IGNhY2hlLnB1dChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIHBzZXVkbyByZXBsYWNlIGlmIHRoZSBjYXB0dXJlZCBzZWxlY3RvciBpcyBpbiB0aGUgcHJveGllc1xyXG4gICAgICAgIHZhciBzID0gc3RyLnJlcGxhY2UoUFNFVURPX1NFTEVDVCwgKG1hdGNoKSA9PiBwcm94aWVzW21hdGNoXSA/IHByb3hpZXNbbWF0Y2hdIDogbWF0Y2gpO1xyXG5cclxuICAgICAgICAvLyBib29sZWFuIHNlbGVjdG9yIHJlcGxhY2VtZW50P1xyXG4gICAgICAgIC8vIHN1cHBvcnRzIElFOC05XHJcbiAgICAgICAgcmV0dXJuIFNVUFBPUlRTLnNlbGVjdGVkU2VsZWN0b3IgPyBzIDogcy5yZXBsYWNlKFNFTEVDVEVEX1NFTEVDVCwgJ1tzZWxlY3RlZD1cInNlbGVjdGVkXCJdJyk7XHJcbiAgICB9KTtcclxufTsiLCJ2YXIgdG9rZW5DYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuXHJcbiAgICB0b2tlbml6ZSA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBhcnIgPSBzdHIuc3BsaXQoJywgJyksXHJcbiAgICAgICAgICAgIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IGFycltpZHhdID0gYXJyW2lkeF0udHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnICB8fFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgPT09ICcjJyB8fFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgPT09ICcuJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXX0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpLlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgdmFyIHRva2VucyA9IHRva2VuQ2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgIHRva2VuQ2FjaGUuZ2V0KHNlbGVjdG9yKSA6IFxyXG4gICAgICAgIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCB0b2tlbml6ZShzZWxlY3RvcikpO1xyXG5cclxuICAgIGlmICghdG9rZW5zKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciBcIiR7c2VsZWN0b3J9XCJgKTtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRva2Vucy5zbGljZSgpO1xyXG59O1xyXG4iLCIvLyBoYXZpbmcgY2FjaGVzIGlzbid0IGFjdHVhbGx5IGZhc3RlclxyXG4vLyBmb3IgYSBtYWpvcml0eSBvZiB1c2UgY2FzZXMgZm9yIHN0cmluZ1xyXG4vLyBtYW5pcHVsYXRpb25zXHJcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3NpbXBsZS1jYWNoZS1mb3Itc3RyaW5nLW1hbmlwXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIi1tcy1cIiBzbyB0aGF0IGl0IGNhbiBiZSBjaGFuZ2VkIHRvIFwibXMtXCJcclxudmFyIFRSVU5DQVRFX01TX1BSRUZJWCAgPSAvXi1tcy0vLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgZGFzaGVkIHN0cmluZyBmb3IgY2FtZWxpemluZ1xyXG4gICAgREFTSF9DQVRDSCAgICAgICAgICA9IC8tKFtcXGRhLXpdKS9naSxcclxuXHJcbiAgICAvLyBNYXRjaGVzIFwibm9uZVwiIG9yIGEgdGFibGUgdHlwZSBlLmcuIFwidGFibGVcIixcclxuICAgIC8vIFwidGFibGUtY2VsbFwiIGV0Yy4uLlxyXG4gICAgTk9ORV9PUl9UQUJMRSAgICAgICA9IC9eKG5vbmV8dGFibGUoPyEtY1tlYV0pLispLyxcclxuICAgIFxyXG4gICAgVFlQRV9URVNUX0ZPQ1VTQUJMRSA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbnxvYmplY3QpJC9pLFxyXG4gICAgVFlQRV9URVNUX0NMSUNLQUJMRSA9IC9eKD86YXxhcmVhKSQvaSxcclxuICAgIFNFTEVDVE9SX0lEICAgICAgICAgPSAvXiMoW1xcdy1dKykkLyxcclxuICAgIFNFTEVDVE9SX1RBRyAgICAgICAgPSAvXltcXHctXSskLyxcclxuICAgIFNFTEVDVE9SX0NMQVNTICAgICAgPSAvXlxcLihbXFx3LV0rKSQvLFxyXG4gICAgUE9TSVRJT04gICAgICAgICAgICA9IC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkLyxcclxuICAgIE5VTV9OT05fUFggICAgICAgICAgPSBuZXcgUmVnRXhwKCdeKCcgKyAoL1srLV0/KD86XFxkKlxcLnwpXFxkKyg/OltlRV1bKy1dP1xcZCt8KS8pLnNvdXJjZSArICcpKD8hcHgpW2EteiVdKyQnLCAnaScpLFxyXG4gICAgU0lOR0xFX1RBRyAgICAgICAgICA9IC9ePChcXHcrKVxccypcXC8/Pig/OjxcXC9cXDE+fCkkLyxcclxuICAgIElTX0JPT0xfQVRUUiAgICAgICAgPSAvXig/OmNoZWNrZWR8c2VsZWN0ZWR8YXN5bmN8YXV0b2ZvY3VzfGF1dG9wbGF5fGNvbnRyb2xzfGRlZmVyfGRpc2FibGVkfGhpZGRlbnxpc21hcHxsb29wfG11bHRpcGxlfG9wZW58cmVhZG9ubHl8cmVxdWlyZWR8c2NvcGVkKSQvaSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBvZiBwYXJlbnQgdGFnIG5hbWVzIHRvIHRoZSBjaGlsZCB0YWdzIHRoYXQgcmVxdWlyZSB0aGVtLlxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgUEFSRU5UX01BUCA9IHtcclxuICAgICAgICB0YWJsZTogICAgL148KD86dGJvZHl8dGZvb3R8dGhlYWR8Y29sZ3JvdXB8Y2FwdGlvbilcXGIvLFxyXG4gICAgICAgIHRib2R5OiAgICAvXjwoPzp0cilcXGIvLFxyXG4gICAgICAgIHRyOiAgICAgICAvXjwoPzp0ZHx0aClcXGIvLFxyXG4gICAgICAgIGNvbGdyb3VwOiAvXjwoPzpjb2wpXFxiLyxcclxuICAgICAgICBzZWxlY3Q6ICAgL148KD86b3B0aW9uKVxcYi9cclxuICAgIH07XHJcblxyXG52YXIgdGVzdCA9IGZ1bmN0aW9uKHJlZykge1xyXG4gICAgcmV0dXJuIChzdHIpID0+IHJlZy50ZXN0KHN0cik7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNpbmdsZVRhZ01hdGNoOiAodmFsKSA9PiBTSU5HTEVfVEFHLmV4ZWModmFsKSxcclxuXHJcbiAgICBudW1Ob3RQeDogICAgICAgdGVzdChOVU1fTk9OX1BYKSxcclxuICAgIHBvc2l0aW9uOiAgICAgICB0ZXN0KFBPU0lUSU9OKSxcclxuICAgIGlzTm9uZU9yVGFibGU6ICB0ZXN0KE5PTkVfT1JfVEFCTEUpLFxyXG4gICAgaXNGb2N1c2FibGU6ICAgIHRlc3QoVFlQRV9URVNUX0ZPQ1VTQUJMRSksXHJcbiAgICBpc0NsaWNrYWJsZTogICAgdGVzdChUWVBFX1RFU1RfQ0xJQ0tBQkxFKSxcclxuICAgIGlzU3RyaWN0SWQ6ICAgICB0ZXN0KFNFTEVDVE9SX0lEKSxcclxuICAgIGlzVGFnOiAgICAgICAgICB0ZXN0KFNFTEVDVE9SX1RBRyksXHJcbiAgICBpc0NsYXNzOiAgICAgICAgdGVzdChTRUxFQ1RPUl9DTEFTUyksXHJcbiAgICBpc0Jvb2xBdHRyOiAgICAgdGVzdChJU19CT09MX0FUVFIpLFxyXG5cclxuICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKFRSVU5DQVRFX01TX1BSRUZJWCwgJ21zLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKERBU0hfQ0FUQ0gsIChtYXRjaCwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudFRhZ05hbWU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciB2YWwgPSBzdHIuc3Vic3RyKDAsIDMwKTtcclxuICAgICAgICBmb3IgKHZhciBwYXJlbnRUYWdOYW1lIGluIFBBUkVOVF9NQVApIHtcclxuICAgICAgICAgICAgaWYgKFBBUkVOVF9NQVBbcGFyZW50VGFnTmFtZV0udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50VGFnTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ2Rpdic7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBESVYgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKSxcclxuICAgIGEgICAgICA9IERJVi5xdWVyeVNlbGVjdG9yKCdhJyksXHJcbiAgICBzZWxlY3QgPSBjcmVhdGUoJ3NlbGVjdCcpLFxyXG4gICAgb3B0aW9uID0gc2VsZWN0LmFwcGVuZENoaWxkKGNyZWF0ZSgnb3B0aW9uJykpLFxyXG5cclxuICAgIHRlc3QgPSAodGFnTmFtZSwgdGVzdEZuKSA9PiB0ZXN0Rm4oY3JlYXRlKHRhZ05hbWUpKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgVVJMcyBhcmVuJ3QgbWFuaXB1bGF0ZWRcclxuICAgIC8vIChJRSBub3JtYWxpemVzIGl0IGJ5IGRlZmF1bHQpXHJcbiAgICBocmVmTm9ybWFsaXplZDogYS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSA9PT0gJy9hJyxcclxuXHJcbiAgICAvLyBDaGVjayB0aGUgZGVmYXVsdCBjaGVja2JveC9yYWRpbyB2YWx1ZSAoJycgaW4gb2xkZXIgV2ViS2l0OyAnb24nIGVsc2V3aGVyZSlcclxuICAgIGNoZWNrT246IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gISFpbnB1dC52YWx1ZTtcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFuIGlucHV0IG1haW50YWlucyBpdHMgdmFsdWUgYWZ0ZXIgYmVjb21pbmcgYSByYWRpb1xyXG4gICAgLy8gU3VwcG9ydDogTW9kZXJuIGJyb3dzZXJzIG9ubHkgKE5PVCBJRSA8PSAxMSlcclxuICAgIHJhZGlvVmFsdWU6IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC52YWx1ZSA9ICd0JztcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gaW5wdXQudmFsdWUgPT09ICd0JztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGEgc2VsZWN0ZWQtYnktZGVmYXVsdCBvcHRpb24gaGFzIGEgd29ya2luZyBzZWxlY3RlZCBwcm9wZXJ0eS5cclxuICAgIC8vIChXZWJLaXQgZGVmYXVsdHMgdG8gZmFsc2UgaW5zdGVhZCBvZiB0cnVlLCBJRSB0b28sIGlmIGl0J3MgaW4gYW4gb3B0Z3JvdXApXHJcbiAgICBvcHRTZWxlY3RlZDogb3B0aW9uLnNlbGVjdGVkLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBvcHRpb25zIGluc2lkZSBkaXNhYmxlZCBzZWxlY3RzIGFyZW4ndCBtYXJrZWQgYXMgZGlzYWJsZWRcclxuICAgIC8vIChXZWJLaXQgbWFya3MgdGhlbSBhcyBkaXNhYmxlZClcclxuICAgIG9wdERpc2FibGVkOiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2VsZWN0LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gIW9wdGlvbi5kaXNhYmxlZDtcclxuICAgIH0oKSksXHJcbiAgICBcclxuICAgIHRleHRDb250ZW50OiBESVYudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCxcclxuXHJcbiAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgbm9ybWFsaXplIFxcclxcbiB0byBcXG4gaW4gdGV4dGFyZWEgdmFsdWVzLFxyXG4gICAgLy8gYnV0IElFIDw9IDExIChhbmQgcG9zc2libHkgbmV3ZXIpIGRvIG5vdC5cclxuICAgIHZhbHVlTm9ybWFsaXplZDogdGVzdCgndGV4dGFyZWEnLCBmdW5jdGlvbih0ZXh0YXJlYSkge1xyXG4gICAgICAgIHRleHRhcmVhLnZhbHVlID0gJ1xcclxcbic7XHJcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnZhbHVlID09PSAnXFxuJztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIHNlbGVjdGVkU2VsZWN0b3I6IHRlc3QoJ3NlbGVjdCcsIGZ1bmN0aW9uKHNlbGVjdCkge1xyXG4gICAgICAgIHNlbGVjdC5pbm5lckhUTUwgPSAnPG9wdGlvbiB2YWx1ZT1cIjFcIj4xPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cIjJcIiBzZWxlY3RlZD4yPC9vcHRpb24+JztcclxuICAgICAgICByZXR1cm4gISFzZWxlY3QucXVlcnlTZWxlY3Rvcignb3B0aW9uW3NlbGVjdGVkXScpO1xyXG4gICAgfSlcclxufTtcclxuIiwidmFyIGV4aXN0cyAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgc2xpY2UgICAgICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyk7XHJcblxyXG52YXIgbG9vcCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSkge1xyXG4gICAgICAgIGlmICghb2JqIHx8ICFpdGVyYXRlZSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7XHJcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gK2xlbmd0aCkge1xyXG4gICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGl0ZXJhdGVlLCBvYmpbaWR4XSwgaWR4LCBvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xyXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihpdGVyYXRlZSwgb2JqW2tleXNbaWR4XV0sIGtleXNbaWR4XSwgb2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBfID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBCcmVha3MgZXZlbiBvbiBhcnJheXMgd2l0aCAzIGl0ZW1zLiAzIG9yIG1vcmVcclxuICAgIC8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxuICAgIHM6IChzdHIpID0+IHN0ci5zcGxpdCgnfCcpLFxyXG5cclxuICAgIC8vIEZsYXR0ZW4gdGhhdCBhbHNvIGNoZWNrcyBpZiB2YWx1ZSBpcyBhIE5vZGVMaXN0XHJcbiAgICBmbGF0dGVuOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvUHg6ICh2YWx1ZSkgPT4gdmFsdWUgKyAncHgnLFxyXG4gICAgXHJcbiAgICBwYXJzZUludDogKG51bSkgPT4gcGFyc2VJbnQobnVtLCAxMCksXHJcblxyXG4gICAgZXZlcnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcnIpKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmICghaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICAgICAgb2JqICA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGxlbiAgPSBhcmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCFvYmogfHwgbGVuIDwgMikgeyByZXR1cm4gb2JqOyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3NbaWR4XTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN0YW5kYXJkIG1hcFxyXG4gICAgbWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEFycmF5LXByZXNlcnZpbmcgbWFwXHJcbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9wdXNoLW1hcC12cy1pbmRleC1yZXBsYWNlbWVudC1tYXBcclxuICAgIGZhc3RtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBpdGVyYXRvcihhcnJbaWR4XSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcblxyXG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhcnJbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoYXJyICYmIGFyci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwdWxsZWQgZnJvbSBBTURcclxuICAgIHR5cGVjYXN0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgIHIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgciA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICdmYWxzZScpIHtcclxuICAgICAgICAgICAgciA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnJyB8fCBpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgIC8vIGlzTmFOKCcnKSByZXR1cm5zIGZhbHNlXHJcbiAgICAgICAgICAgIHIgPSB2YWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcGFyc2VGbG9hdChudWxsIHx8ICcnKSByZXR1cm5zIE5hTlxyXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH0sXHJcblxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYgKCFvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2Uob2JqKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhcnIsXHJcbiAgICAgICAgICAgIGxlbiA9ICtvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG5cclxuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICAgICAgYXJyID0gQXJyYXkob2JqLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJbaWR4XSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKG9ialtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUFycmF5OiAoYXJnKSA9PlxyXG4gICAgICAgICFleGlzdHMoYXJnKSA/IFtdIDpcclxuICAgICAgICBpc0FycmF5TGlrZShhcmcpID8gc2xpY2UoYXJnKSA6IFsgYXJnIF0sXHJcblxyXG4gICAgY29udGFpbnM6IChhcnIsIGl0ZW0pID0+IGFyci5pbmRleE9mKGl0ZW0pICE9PSAtMSxcclxuXHJcbiAgICBqcUVhY2g6IGxvb3AoZnVuY3Rpb24oZm4sIHZhbHVlLCBrZXlJbmRleCwgY29sbGVjdGlvbikge1xyXG4gICAgICAgIGZuLmNhbGwodmFsdWUsIGtleUluZGV4LCB2YWx1ZSwgY29sbGVjdGlvbik7XHJcbiAgICB9KSxcclxuXHJcbiAgICBkRWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4LCBjb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgZm4uY2FsbCh2YWx1ZSwgdmFsdWUsIGtleUluZGV4LCBjb2xsZWN0aW9uKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGVhY2g6IGxvb3AoZnVuY3Rpb24oZm4sIHZhbHVlLCBrZXlJbmRleCkge1xyXG4gICAgICAgIGZuKHZhbHVlLCBrZXlJbmRleCk7XHJcbiAgICB9KSxcclxuXHJcbiAgICBtZXJnZTogZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBzZWNvbmQubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgICAgICBpID0gZmlyc3QubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBHbyB0aHJvdWdoIGVhY2ggZWxlbWVudCBpbiB0aGVcclxuICAgICAgICAvLyBzZWNvbmQgYXJyYXkgYW5kIGFkZCBpdCB0byB0aGVcclxuICAgICAgICAvLyBmaXJzdFxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaWR4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcnN0Lmxlbmd0aCA9IGk7XHJcblxyXG4gICAgICAgIHJldHVybiBmaXJzdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gcGx1Y2tcclxuICAgIC8vIFRPRE86IENoZWNrIGZvciBwbGFjZXMgdGhpcyBjYW4gYmUgYXBwbGllZFxyXG4gICAgcGx1Y2s6IGZ1bmN0aW9uKGFyciwga2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKGFyciwgKG9iaikgPT4gb2JqID8gb2JqW2tleV0gOiB1bmRlZmluZWQpO1xyXG4gICAgfVxyXG59OyIsInZhciBkZWxldGVyID0gKGRlbGV0YWJsZSkgPT5cclxuICAgIGRlbGV0YWJsZSA/IFxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgZGVsZXRlIHN0b3JlW2tleV07IH0gOlxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgc3RvcmVba2V5XSA9IHVuZGVmaW5lZDsgfTtcclxuXHJcbnZhciBnZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gc3RvcmUgJiYgc3RvcmVba2V5XSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleSwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIGRlbChzdG9yZSwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGJpTGV2ZWxHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgaGFzMSA9IGtleTEgaW4gc3RvcmUgJiYgc3RvcmVba2V5MV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKCFoYXMxIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoYXMxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ga2V5MiBpbiBzdG9yZVtrZXkxXSAmJiBzdG9yZVtrZXkxXVtrZXkyXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV07XHJcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gcmVmMSA6IChyZWYxICE9PSB1bmRlZmluZWQgPyByZWYxW2tleTJdIDogcmVmMSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICAvLyBFYXN5IHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWwoc3RvcmUsIGtleTEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEZWVwIHJlbW92YWxcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXSB8fCAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIGRlbChyZWYxLCBrZXkyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsdmwsIGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGx2bCA9PT0gMiA/IGJpTGV2ZWxHZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKSA6IGdldHRlclNldHRlcihkZWxldGFibGUpO1xyXG59OyIsInZhciBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzLnNldCA9IChEKSA9PiBjb25zdHJ1Y3RvciA9IEQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgK3ZhbHVlLmxlbmd0aCA9PT0gdmFsdWUubGVuZ3RoO1xyXG4iLCJ2YXIgaXNEb2N1bWVudEZyYWdtZW50ID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5kb2NfZnJhZztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHBhcmVudDtcclxuICAgIHJldHVybiBlbGVtICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ub3duZXJEb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbSAhPT0gZG9jdW1lbnQgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSAgICAgICAgICAgICAmJlxyXG4gICAgICAgICFpc0RvY3VtZW50RnJhZ21lbnQocGFyZW50KSAgICAgICAgICAgICYmXHJcbiAgICAgICAgcGFyZW50LmlzUGFyc2VIdG1sRnJhZ21lbnQgIT09IHRydWU7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBmYWxzZTtcclxuIiwidmFyIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOb2RlTGlzdCA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0QgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICBpc0QodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpIHx8IGlzTm9kZUxpc3QodmFsdWUpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IGRvY3VtZW50O1xyXG4iLCJ2YXIgaXNXaW5kb3cgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0VsZW1lbnQgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIHZhbHVlICYmICh2YWx1ZSA9PT0gZG9jdW1lbnQgfHwgaXNXaW5kb3codmFsdWUpIHx8IGlzRWxlbWVudCh2YWx1ZSkpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcclxuIiwidmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnaXMvc3RyaW5nJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICBpZiAoIWlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICB2YXIgdGV4dCA9IHZhbHVlLnRyaW0oKTtcclxuICAgIHJldHVybiAodGV4dC5jaGFyQXQoMCkgPT09ICc8JyAmJiB0ZXh0LmNoYXJBdCh0ZXh0Lmxlbmd0aCAtIDEpID09PSAnPicgJiYgdGV4dC5sZW5ndGggPj0gMyk7XHJcbn07IiwiLy8gTm9kZUxpc3QgY2hlY2suIEZvciBvdXIgcHVycG9zZXMsIGEgTm9kZUxpc3QgYW5kIGFuIEhUTUxDb2xsZWN0aW9uIGFyZSB0aGUgc2FtZS5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHZhbHVlICYmIChcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIE5vZGVMaXN0IHx8XHJcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBIVE1MQ29sbGVjdGlvblxyXG4gICAgKTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBuYW1lKSA9PlxyXG4gICAgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBuYW1lLnRvTG93ZXJDYXNlKCk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XHJcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAoISF2YWx1ZSAmJiB0eXBlID09PSAnb2JqZWN0Jyk7XHJcbn07IiwidmFyIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbCkgPT5cclxuICAgIHZhbCAmJiAoaXNTdHJpbmcodmFsKSB8fCBpc0Z1bmN0aW9uKHZhbCkgfHwgaXNFbGVtZW50KHZhbCkgfHwgaXNDb2xsZWN0aW9uKHZhbCkpOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gdmFsdWUud2luZG93O1xyXG4iLCJ2YXIgaXNFbGVtZW50ICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgRElWICAgICAgICAgICAgID0gcmVxdWlyZSgnRElWJyksXHJcbiAgICAvLyBTdXBwb3J0OiBJRTkrLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIG1hdGNoZXNTZWxlY3RvciA9IERJVi5tYXRjaGVzICAgICAgICAgICAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5tYXRjaGVzU2VsZWN0b3IgICAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5tc01hdGNoZXNTZWxlY3RvciAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5tb3pNYXRjaGVzU2VsZWN0b3IgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5vTWF0Y2hlc1NlbGVjdG9yO1xyXG5cclxuLy8gb25seSBlbGVtZW50IHR5cGVzIHN1cHBvcnRlZFxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGlzRWxlbWVudChlbGVtKSA/IG1hdGNoZXNTZWxlY3Rvci5jYWxsKGVsZW0sIHNlbGVjdG9yKSA6IGZhbHNlO1xyXG4iLCJ2YXIgXyAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBzbGljZSAgID0gcmVxdWlyZSgndXRpbC9zbGljZScpLFxyXG4gICAgZXhpc3RzICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgbWFwICAgICA9IHJlcXVpcmUoJy4vbWFwJyk7XHJcblxyXG52YXIgZWFjaCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gXy5kRWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgYXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbK2luZGV4XTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIC8vIE5vIGluZGV4LCByZXR1cm4gYWxsXHJcbiAgICAgICAgaWYgKCFleGlzdHMoaW5kZXgpKSB7IHJldHVybiBzbGljZSh0aGlzKTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gK2luZGV4O1xyXG4gICAgICAgIHJldHVybiB0aGlzW1xyXG4gICAgICAgICAgICAvLyBMb29raW5nIHRvIGdldCBhbiBpbmRleCBmcm9tIHRoZSBlbmQgb2YgdGhlIHNldFxyXG4gICAgICAgICAgICAvLyBpZiBuZWdhdGl2ZSwgb3IgdGhlIHN0YXJ0IG9mIHRoZSBzZXQgaWYgcG9zaXRpdmVcclxuICAgICAgICAgICAgaWR4IDwgMCA/IHRoaXMubGVuZ3RoICsgaWR4IDogaWR4XHJcbiAgICAgICAgXTtcclxuICAgIH0sXHJcblxyXG4gICAgZXE6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpcy5nZXQoaW5kZXgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2xpY2U6IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcclxuICAgICAgICByZXR1cm4gRChzbGljZSh0aGlzLCBzdGFydCwgZW5kKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzWzBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgbGFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpc1t0aGlzLmxlbmd0aCAtIDFdKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHNsaWNlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYXA6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIEQobWFwKHRoaXMsIGl0ZXJhdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGVhY2g6IGVhY2gsXHJcbiAgICBmb3JFYWNoOiBlYWNoXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgIGlmICghYXJyLmxlbmd0aCB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICBpdGVtO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICBpdGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29uY2F0IGZsYXQgZm9yIGEgc2luZ2xlIGFycmF5IG9mIGFycmF5c1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdC5hcHBseShbXSwgcmVzdWx0cyk7XHJcbn07IiwidmFyIG9yZGVyID0gcmVxdWlyZSgnb3JkZXInKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocmVzdWx0cykge1xyXG4gICAgdmFyIGhhc0R1cGxpY2F0ZXMgPSBvcmRlci5zb3J0KHJlc3VsdHMpO1xyXG4gICAgaWYgKCFoYXNEdXBsaWNhdGVzKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgdmFyIGVsZW0sXHJcbiAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAvLyBjcmVhdGUgdGhlIGFycmF5IGhlcmVcclxuICAgICAgICAvLyBzbyB0aGF0IGEgbmV3IGFycmF5IGlzbid0XHJcbiAgICAgICAgLy8gY3JlYXRlZC9kZXN0cm95ZWQgZXZlcnkgdW5pcXVlIGNhbGxcclxuICAgICAgICBkdXBsaWNhdGVzID0gW107XHJcblxyXG4gICAgLy8gR28gdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGlkZW50aWZ5XHJcbiAgICAvLyB0aGUgZHVwbGljYXRlcyB0byBiZSByZW1vdmVkXHJcbiAgICB3aGlsZSAoKGVsZW0gPSByZXN1bHRzW2lkeCsrXSkpIHtcclxuICAgICAgICBpZiAoZWxlbSA9PT0gcmVzdWx0c1tpZHhdKSB7XHJcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMucHVzaChpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGR1cGxpY2F0ZXMgZnJvbSB0aGUgcmVzdWx0c1xyXG4gICAgaWR4ID0gZHVwbGljYXRlcy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgIHJlc3VsdHMuc3BsaWNlKGR1cGxpY2F0ZXNbaWR4XSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07IiwidmFyIF8gICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgZXhpc3RzICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRnVuY3Rpb24gICAgICAgICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIGlzTm9kZU5hbWUgICAgICAgICAgID0gcmVxdWlyZSgnaXMvbm9kZU5hbWUnKSxcclxuICAgIG5ld2xpbmVzICAgICAgICAgICAgID0gcmVxdWlyZSgndXRpbC9uZXdsaW5lcycpLFxyXG4gICAgU1VQUE9SVFMgICAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgUkVHRVggICAgICAgICAgICAgICAgPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gUkVHRVguaXNCb29sQXR0cihhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG5cclxuICAgIHNwbGl0ID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ciA9PT0gJycgPyBbXSA6IHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XHJcbiAgICB9O1xyXG5cclxudmFyIGFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LmFkZChuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC50b2dnbGUobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvdWJsZUNsYXNzTG9vcCA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcywgbWV0aG9kKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZWxlbSA9IGVsZW1zW2lkeF07XHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgICAgIGNsYXNzTGlzdCA9IGVsZW0uY2xhc3NMaXN0O1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2QoY2xhc3NMaXN0LCBuYW1lc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb0FueUVsZW1zSGF2ZUNsYXNzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWUpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBpZiAoZWxlbXNbaWR4XS5jbGFzc0xpc3QuY29udGFpbnMobmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBlbGVtc1tpZHhdLmNsYXNzTmFtZSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoICYmIGV4aXN0cyhuYW1lKSAmJiBuYW1lICE9PSAnJyA/IGRvQW55RWxlbXNIYXZlQ2xhc3ModGhpcywgbmFtZSkgOiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCBhZGRDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsQ2xhc3Nlcyh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHsgbmFtZXMgPSBzcGxpdChuYW1lcyk7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuYW1lcy5sZW5ndGggPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZXMsIHJlbW92ZUNsYXNzKSA6IHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzLCBzaG91bGRBZGQpIHtcclxuICAgICAgICB2YXIgbmFtZUxpc3Q7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoIHx8ICF0aGlzLmxlbmd0aCB8fCAhKG5hbWVMaXN0ID0gc3BsaXQobmFtZXMpKS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNob3VsZEFkZCA9PT0gdW5kZWZpbmVkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCB0b2dnbGVDbGFzcykgOlxyXG4gICAgICAgICAgICBzaG91bGRBZGQgPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIGFkZENsYXNzKSA6XHJcbiAgICAgICAgICAgIGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgcmVtb3ZlQ2xhc3MpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTnVtYmVyICAgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Jvb2xlYW4gICAgICA9IHJlcXVpcmUoJ2lzL2Jvb2xlYW4nKSxcclxuICAgIGlzT2JqZWN0ICAgICAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc0FycmF5ICAgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0RvY3VtZW50VHlwZSA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZG9jLFxyXG4gICAgUkVHRVggICAgICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzID0ge1xyXG4gICAgZGlzcGxheTogICAgJ2Jsb2NrJyxcclxuICAgIHBvc2l0aW9uOiAgICdhYnNvbHV0ZScsXHJcbiAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xyXG59O1xyXG5cclxudmFyIGdldERvY3VtZW50RGltZW5zaW9uID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgLy8gRWl0aGVyIHNjcm9sbFtXaWR0aC9IZWlnaHRdIG9yIG9mZnNldFtXaWR0aC9IZWlnaHRdIG9yXHJcbiAgICAvLyBjbGllbnRbV2lkdGgvSGVpZ2h0XSwgd2hpY2hldmVyIGlzIGdyZWF0ZXN0XHJcbiAgICB2YXIgZG9jID0gZWxlbS5kb2N1bWVudEVsZW1lbnQ7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgoXHJcbiAgICAgICAgZWxlbS5ib2R5WydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZWxlbS5ib2R5WydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGRvY1snb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ2NsaWVudCcgKyBuYW1lXVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBoaWRlID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH0sXHJcbiAgICBzaG93ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBjc3NTd2FwID0gZnVuY3Rpb24oZWxlbSwgb3B0aW9ucywgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgb2xkID0ge307XHJcblxyXG4gICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzLCBhbmQgaW5zZXJ0IHRoZSBuZXcgb25lc1xyXG4gICAgICAgIHZhciBuYW1lO1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIG9sZFtuYW1lXSA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvcHRpb25zW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJldCA9IGNhbGxiYWNrKGVsZW0pO1xyXG5cclxuICAgICAgICAvLyBSZXZlcnQgdGhlIG9sZCB2YWx1ZXNcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb2xkW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQXZvaWRzIGFuICdJbGxlZ2FsIEludm9jYXRpb24nIGVycm9yIChDaHJvbWUpXHJcbiAgICAvLyBBdm9pZHMgYSAnVHlwZUVycm9yOiBBcmd1bWVudCAxIG9mIFdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIGRvZXMgbm90IGltcGxlbWVudCBpbnRlcmZhY2UgRWxlbWVudCcgZXJyb3IgKEZpcmVmb3gpXHJcbiAgICBnZXRDb21wdXRlZFN0eWxlID0gKGVsZW0pID0+XHJcbiAgICAgICAgaXNFbGVtZW50KGVsZW0pICYmICFpc1dpbmRvdyhlbGVtKSAmJiAhaXNEb2N1bWVudChlbGVtKSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pIDogbnVsbCxcclxuXHJcbiAgICBfd2lkdGggPSB7XHJcbiAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRG9jdW1lbnRUeXBlKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ1dpZHRoJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgIGlmICh3aWR0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MsIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX2hlaWdodCA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEb2N1bWVudFR5cGUoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnSGVpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgICAgaWYgKGhlaWdodCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MsIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS5oZWlnaHQgPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGdldFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcblxyXG4gICAgLy8gU3RhcnQgd2l0aCBvZmZzZXQgcHJvcGVydHksIHdoaWNoIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGJvcmRlci1ib3ggdmFsdWVcclxuICAgIHZhciB2YWx1ZUlzQm9yZGVyQm94ID0gdHJ1ZSxcclxuICAgICAgICB2YWwgPSAobmFtZSA9PT0gJ3dpZHRoJykgPyBlbGVtLm9mZnNldFdpZHRoIDogZWxlbS5vZmZzZXRIZWlnaHQsXHJcbiAgICAgICAgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICBpc0JvcmRlckJveCA9IHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94JztcclxuXHJcbiAgICAvLyBzb21lIG5vbi1odG1sIGVsZW1lbnRzIHJldHVybiB1bmRlZmluZWQgZm9yIG9mZnNldFdpZHRoLCBzbyBjaGVjayBmb3IgbnVsbC91bmRlZmluZWRcclxuICAgIC8vIHN2ZyAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY0OTI4NVxyXG4gICAgLy8gTWF0aE1MIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NDkxNjY4XHJcbiAgICBpZiAodmFsIDw9IDAgfHwgIWV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGNvbXB1dGVkIHRoZW4gdW5jb21wdXRlZCBjc3MgaWYgbmVjZXNzYXJ5XHJcbiAgICAgICAgdmFsID0gY3VyQ3NzKGVsZW0sIG5hbWUsIHN0eWxlcyk7XHJcbiAgICAgICAgaWYgKHZhbCA8IDAgfHwgIXZhbCkgeyB2YWwgPSBlbGVtLnN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGVkIHVuaXQgaXMgbm90IHBpeGVscy4gU3RvcCBoZXJlIGFuZCByZXR1cm4uXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRoZSBjaGVjayBmb3Igc3R5bGUgaW4gY2FzZSBhIGJyb3dzZXIgd2hpY2ggcmV0dXJucyB1bnJlbGlhYmxlIHZhbHVlc1xyXG4gICAgICAgIC8vIGZvciBnZXRDb21wdXRlZFN0eWxlIHNpbGVudGx5IGZhbGxzIGJhY2sgdG8gdGhlIHJlbGlhYmxlIGVsZW0uc3R5bGVcclxuICAgICAgICB2YWx1ZUlzQm9yZGVyQm94ID0gaXNCb3JkZXJCb3ggJiYgdmFsID09PSBzdHlsZXNbbmFtZV07XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSAnJywgYXV0bywgYW5kIHByZXBhcmUgZm9yIGV4dHJhXHJcbiAgICAgICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIHRoZSBhY3RpdmUgYm94LXNpemluZyBtb2RlbCB0byBhZGQvc3VidHJhY3QgaXJyZWxldmFudCBzdHlsZXNcclxuICAgIHJldHVybiBfLnRvUHgoXHJcbiAgICAgICAgdmFsICsgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQoXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcsXHJcbiAgICAgICAgICAgIHZhbHVlSXNCb3JkZXJCb3gsXHJcbiAgICAgICAgICAgIHN0eWxlc1xyXG4gICAgICAgIClcclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgQ1NTX0VYUEFORCA9IF8ucygnVG9wfFJpZ2h0fEJvdHRvbXxMZWZ0Jyk7XHJcbnZhciBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGV4dHJhLCBpc0JvcmRlckJveCwgc3R5bGVzKSB7XHJcbiAgICB2YXIgdmFsID0gMCxcclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHJpZ2h0IG1lYXN1cmVtZW50LCBhdm9pZCBhdWdtZW50YXRpb25cclxuICAgICAgICBpZHggPSAoZXh0cmEgPT09IChpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnKSkgP1xyXG4gICAgICAgICAgICA0IDpcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGluaXRpYWxpemUgZm9yIGhvcml6b250YWwgb3IgdmVydGljYWwgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAobmFtZSA9PT0gJ3dpZHRoJykgP1xyXG4gICAgICAgICAgICAxIDpcclxuICAgICAgICAgICAgMCxcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIC8vIFB1bGxlZCBvdXQgb2YgdGhlIGxvb3AgdG8gcmVkdWNlIHN0cmluZyBjb21wYXJpc29uc1xyXG4gICAgICAgIGV4dHJhSXNNYXJnaW4gID0gKGV4dHJhID09PSAnbWFyZ2luJyksXHJcbiAgICAgICAgZXh0cmFJc0NvbnRlbnQgPSAoIWV4dHJhSXNNYXJnaW4gJiYgZXh0cmEgPT09ICdjb250ZW50JyksXHJcbiAgICAgICAgZXh0cmFJc1BhZGRpbmcgPSAoIWV4dHJhSXNNYXJnaW4gJiYgIWV4dHJhSXNDb250ZW50ICYmIGV4dHJhID09PSAncGFkZGluZycpO1xyXG5cclxuICAgIGZvciAoOyBpZHggPCA0OyBpZHggKz0gMikge1xyXG4gICAgICAgIHR5cGUgPSBDU1NfRVhQQU5EW2lkeF07XHJcblxyXG4gICAgICAgIC8vIGJvdGggYm94IG1vZGVscyBleGNsdWRlIG1hcmdpbiwgc28gYWRkIGl0IGlmIHdlIHdhbnQgaXRcclxuICAgICAgICBpZiAoZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICB2YWwgKz0gcGFyc2VJbnQoc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBwYXJzZUludChzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGJvcmRlciBub3IgbWFyZ2luLCBzbyByZW1vdmUgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmICghZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IHBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGUgKyAnV2lkdGgnXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCwgc28gYWRkIHBhZGRpbmdcclxuICAgICAgICAgICAgdmFsICs9IHBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gcGFyc2VJbnQoc3R5bGVzWydib3JkZXInICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZhbDtcclxufTtcclxuXHJcbnZhciBjdXJDc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBjb21wdXRlZCkge1xyXG4gICAgdmFyIHN0eWxlID0gZWxlbS5zdHlsZSxcclxuICAgICAgICBzdHlsZXMgPSBjb21wdXRlZCB8fCBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIHJldCA9IHN0eWxlcyA/IHN0eWxlcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpIHx8IHN0eWxlc1tuYW1lXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICAvLyBBdm9pZCBzZXR0aW5nIHJldCB0byBlbXB0eSBzdHJpbmcgaGVyZVxyXG4gICAgLy8gc28gd2UgZG9uJ3QgZGVmYXVsdCB0byBhdXRvXHJcbiAgICBpZiAoIWV4aXN0cyhyZXQpICYmIHN0eWxlICYmIHN0eWxlW25hbWVdKSB7IHJldCA9IHN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgLy8gRnJvbSB0aGUgaGFjayBieSBEZWFuIEVkd2FyZHNcclxuICAgIC8vIGh0dHA6Ly9lcmlrLmVhZS5uZXQvYXJjaGl2ZXMvMjAwNy8wNy8yNy8xOC41NC4xNS8jY29tbWVudC0xMDIyOTFcclxuXHJcbiAgICBpZiAoc3R5bGVzKSB7XHJcbiAgICAgICAgaWYgKHJldCA9PT0gJycgJiYgIWlzQXR0YWNoZWQoZWxlbSkpIHtcclxuICAgICAgICAgICAgcmV0ID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHdlJ3JlIG5vdCBkZWFsaW5nIHdpdGggYSByZWd1bGFyIHBpeGVsIG51bWJlclxyXG4gICAgICAgIC8vIGJ1dCBhIG51bWJlciB0aGF0IGhhcyBhIHdlaXJkIGVuZGluZywgd2UgbmVlZCB0byBjb252ZXJ0IGl0IHRvIHBpeGVsc1xyXG4gICAgICAgIC8vIGJ1dCBub3QgcG9zaXRpb24gY3NzIGF0dHJpYnV0ZXMsIGFzIHRob3NlIGFyZSBwcm9wb3J0aW9uYWwgdG8gdGhlIHBhcmVudCBlbGVtZW50IGluc3RlYWRcclxuICAgICAgICAvLyBhbmQgd2UgY2FuJ3QgbWVhc3VyZSB0aGUgcGFyZW50IGluc3RlYWQgYmVjYXVzZSBpdCBtaWdodCB0cmlnZ2VyIGEgJ3N0YWNraW5nIGRvbGxzJyBwcm9ibGVtXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHJldCkgJiYgIVJFR0VYLnBvc2l0aW9uKG5hbWUpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1lbWJlciB0aGUgb3JpZ2luYWwgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gc3R5bGUubGVmdCxcclxuICAgICAgICAgICAgICAgIHJzID0gZWxlbS5ydW50aW1lU3R5bGUsXHJcbiAgICAgICAgICAgICAgICByc0xlZnQgPSBycyAmJiBycy5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgLy8gUHV0IGluIHRoZSBuZXcgdmFsdWVzIHRvIGdldCBhIGNvbXB1dGVkIHZhbHVlIG91dFxyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSBlbGVtLmN1cnJlbnRTdHlsZS5sZWZ0OyB9XHJcblxyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gKG5hbWUgPT09ICdmb250U2l6ZScpID8gJzFlbScgOiByZXQ7XHJcbiAgICAgICAgICAgIHJldCA9IF8udG9QeChzdHlsZS5waXhlbExlZnQpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV2ZXJ0IHRoZSBjaGFuZ2VkIHZhbHVlc1xyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gbGVmdDtcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gcnNMZWZ0OyB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXQgPT09IHVuZGVmaW5lZCA/IHJldCA6IHJldCArICcnIHx8ICdhdXRvJztcclxufTtcclxuXHJcbnZhciBub3JtYWxpemVDc3NLZXkgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICByZXR1cm4gUkVHRVguY2FtZWxDYXNlKG5hbWUpO1xyXG59O1xyXG5cclxudmFyIHNldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICBlbGVtLnN0eWxlW25hbWVdID0gKHZhbHVlID09PSArdmFsdWUpID8gXy50b1B4KHZhbHVlKSA6IHZhbHVlO1xyXG59O1xyXG5cclxudmFyIGdldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKGVsZW0pW25hbWVdO1xyXG59O1xyXG5cclxudmFyIGlzSGlkZGVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBTdGFuZGFyZDpcclxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50Lm9mZnNldFBhcmVudFxyXG4gICAgcmV0dXJuIGVsZW0ub2Zmc2V0UGFyZW50ID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgIC8vIFN1cHBvcnQ6IE9wZXJhIDw9IDEyLjEyXHJcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcG9ydHMgb2Zmc2V0V2lkdGhzIGFuZCBvZmZzZXRIZWlnaHRzIGxlc3MgdGhhbiB6ZXJvIG9uIHNvbWUgZWxlbWVudHNcclxuICAgICAgICAgICAgZWxlbS5vZmZzZXRXaWR0aCA8PSAwICYmIGVsZW0ub2Zmc2V0SGVpZ2h0IDw9IDAgfHxcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2tcclxuICAgICAgICAgICAgKChlbGVtLnN0eWxlICYmIGVsZW0uc3R5bGUuZGlzcGxheSkgPyBlbGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyA6IGZhbHNlKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3VyQ3NzOiBjdXJDc3MsXHJcbiAgICB3aWR0aDogIF93aWR0aCxcclxuICAgIGhlaWdodDogX2hlaWdodCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNzczogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwga2V5LCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpZHgpIHsgcmV0dXJuIHJldDsgfSAvLyByZXR1cm4gZWFybHlcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldFt2YWx1ZV0gPSBnZXRTdHlsZShmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgaGlkZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBzaG93KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Jvb2xlYW4oc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgPyB0aGlzLnNob3coKSA6IHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBpc0hpZGRlbihlbGVtKSA/IHNob3coZWxlbSkgOiBoaWRlKGVsZW0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBjYWNoZSAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIsIHRydWUpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgQUNDRVNTT1IgID0gJ19fRF9pZF9fICcsXHJcbiAgICB1bmlxdWVJZCAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZChEYXRlLm5vdygpKSxcclxuXHJcbiAgICBnZXRJZCA9IChlbGVtKSA9PiBlbGVtICYmIGVsZW1bQUNDRVNTT1JdLFxyXG5cclxuICAgIGdldE9yU2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghZWxlbSB8fCAoaWQgPSBlbGVtW0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtBQ0NFU1NPUl0gPSAoaWQgPSB1bmlxdWVJZCgpKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc0RhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5oYXMoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IGdldE9yU2V0SWQoZWxlbSk7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZURhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgfTtcclxuXHJcbi8vIFRPRE86IEFkZHJlc3MgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVtb3ZlOiAoZWxlbSwgc3RyKSA9PlxyXG4gICAgICAgIHN0ciA9PT0gdW5kZWZpbmVkID8gcmVtb3ZlQWxsRGF0YShlbGVtKSA6IHJlbW92ZURhdGEoZWxlbSwgc3RyKSxcclxuXHJcbiAgICBEOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldERhdGEoZWxlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHBhc3NlZFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaXNFbGVtZW50KGVsZW0pID8gZ2V0QWxsRGF0YShlbGVtKSA6IHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzRGF0YTogKGVsZW0pID0+XHJcbiAgICAgICAgICAgIGlzRWxlbWVudChlbGVtKSA/IGhhc0RhdGEoZWxlbSkgOiB0aGlzLFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpc0VsZW1lbnQoZWxlbSkgPyByZW1vdmVBbGxEYXRhKGVsZW0pIDogdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQga2V5J3MgdmFsdWVcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbZWxlbUlkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJySWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcnJJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2FycklkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzTnVtYmVyID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBjc3MgICAgICA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG52YXIgYWRkID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHRvdGFsID0gMDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gKGFycltpZHhdIHx8IDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnZXRJbm5lcldpZHRoID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZWxlbSkpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdMZWZ0JykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdSaWdodCcpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuICAgIGdldElubmVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGVsZW0pKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nVG9wJykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdCb3R0b20nKSlcclxuICAgICAgICBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0ZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICByZXR1cm4gYWRkKFtcclxuICAgICAgICAgICAgZ2V0SW5uZXJXaWR0aChlbGVtKSxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luTGVmdCcpKSA6IDAsXHJcbiAgICAgICAgICAgIHdpdGhNYXJnaW4gPyBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblJpZ2h0JykpIDogMCxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJMZWZ0V2lkdGgnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyUmlnaHRXaWR0aCcpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuICAgIGdldE91dGVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBnZXRJbm5lckhlaWdodChlbGVtKSxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIDogMCxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luQm90dG9tJykpIDogMCxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJUb3BXaWR0aCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICB3aWR0aDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLndpZHRoLnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3Mud2lkdGguZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGVpZ2h0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3MuaGVpZ2h0LnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVyV2lkdGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJXaWR0aChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVySGVpZ2h0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVySGVpZ2h0KGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJXaWR0aDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVyV2lkdGgoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVySGVpZ2h0OiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJIZWlnaHQoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBoYW5kbGVycyA9IHt9O1xyXG5cclxudmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24obmFtZSwgdHlwZSwgZmlsdGVyKSB7XHJcbiAgICBoYW5kbGVyc1tuYW1lXSA9IHtcclxuICAgICAgICBldmVudDogdHlwZSxcclxuICAgICAgICBmaWx0ZXI6IGZpbHRlcixcclxuICAgICAgICB3cmFwOiBmdW5jdGlvbihmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlcihuYW1lLCBmbik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciB3cmFwcGVyID0gZnVuY3Rpb24obmFtZSwgZm4pIHtcclxuICAgIGlmICghZm4pIHsgcmV0dXJuIGZuOyB9XHJcblxyXG4gICAgdmFyIGtleSA9ICdfX2RjZV8nICsgbmFtZTtcclxuICAgIGlmIChmbltrZXldKSB7IHJldHVybiBmbltrZXldOyB9XHJcblxyXG4gICAgcmV0dXJuIGZuW2tleV0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gaGFuZGxlcnNbbmFtZV0uZmlsdGVyKGUpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTsgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnJlZ2lzdGVyKCdsZWZ0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ21pZGRsZS1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAyICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdyaWdodC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAzICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlZ2lzdGVyOiByZWdpc3RlcixcclxuICAgIGhhbmRsZXJzOiBoYW5kbGVyc1xyXG59OyIsInZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgbWF0Y2hlcyAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyksXHJcbiAgICBkZWxlZ2F0ZXMgPSB7fTtcclxuXHJcbi8vIHRoaXMgbWV0aG9kIGNhY2hlcyBkZWxlZ2F0ZXMgc28gdGhhdCAub2ZmKCkgd29ya3Mgc2VhbWxlc3NseVxyXG52YXIgZGVsZWdhdGUgPSBmdW5jdGlvbihyb290LCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmIChkZWxlZ2F0ZXNbZm4uX2RkXSkgeyByZXR1cm4gZGVsZWdhdGVzW2ZuLl9kZF07IH1cclxuXHJcbiAgICB2YXIgaWQgPSBmbi5fZGQgPSBEYXRlLm5vdygpO1xyXG4gICAgcmV0dXJuIGRlbGVnYXRlc1tpZF0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgd2hpbGUgKGVsICYmIGVsICE9PSByb290KSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVzKGVsLCBzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZXZlbnRlZCA9IGZ1bmN0aW9uKG1ldGhvZCwgZWwsIHR5cGUsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKCFleGlzdHMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBmbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZGVsZWdhdGUoZWwsIHNlbGVjdG9yLCBmbikpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvbjogICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmFkZCksXHJcbiAgICBvZmY6ICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LnJlbW92ZSksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmZhYnJpY2F0ZSlcclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgZGVsZWdhdGUgICA9IHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcclxuICAgIGN1c3RvbSAgICAgPSByZXF1aXJlKCcuL2N1c3RvbScpO1xyXG5cclxudmFyIGV2ZW50ZXIgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbih0eXBlcywgZmlsdGVyLCBmbikge1xyXG4gICAgICAgIHZhciB0eXBlbGlzdCA9IHR5cGVzLnNwbGl0KCcgJyk7XHJcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xyXG4gICAgICAgICAgICBmbiA9IGZpbHRlcjtcclxuICAgICAgICAgICAgZmlsdGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgXy5lYWNoKHR5cGVsaXN0LCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IGN1c3RvbS5oYW5kbGVyc1t0eXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIGhhbmRsZXIuZXZlbnQsIGZpbHRlciwgaGFuZGxlci53cmFwKGZuKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCB0eXBlLCBmaWx0ZXIsIGZuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZXIoZGVsZWdhdGUub24pLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vZmYpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlcihkZWxlZ2F0ZS50cmlnZ2VyKVxyXG59OyIsInZhciBfICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0h0bWwgICAgICAgICA9IHJlcXVpcmUoJ2lzL2h0bWwnKSxcclxuICAgIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ICAgICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc051bWJlciAgICAgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNDb2xsZWN0aW9uICAgPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzV2luZG93ICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBzZWxlY3RvckZpbHRlciA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgb3JkZXIgICAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgZGF0YSAgICAgICAgICAgPSByZXF1aXJlKCcuL2RhdGEnKSxcclxuICAgIHBhcnNlciAgICAgICAgID0gcmVxdWlyZSgncGFyc2VyJyk7XHJcblxyXG52YXIgcGFyZW50TG9vcCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKGVsZW1zLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQ7XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihlbGVtLCBwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHJlbW92ZSA9IHBhcmVudExvb3AoZnVuY3Rpb24oZWxlbSwgcGFyZW50KSB7XHJcbiAgICAgICAgZGF0YS5yZW1vdmUoZWxlbSk7XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZGV0YWNoID0gcGFyZW50TG9vcChmdW5jdGlvbihlbGVtLCBwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICB9KSxcclxuXHJcbiAgICBzdHJpbmdUb0ZyYWdtZW50ID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZnJhZy50ZXh0Q29udGVudCA9ICcnICsgc3RyO1xyXG4gICAgICAgIHJldHVybiBmcmFnO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmRQcmVwZW5kRnVuYyA9IGZ1bmN0aW9uKGQsIGZuLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goZCwgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZWxlbS5pbm5lckhUTUwpO1xyXG5cclxuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cyhyZXN1bHQpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcGFyc2VyKGVsZW0pLCBwZW5kZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHBlbmRlcihlbGVtLCBzdHJpbmdUb0ZyYWdtZW50KHJlc3VsdCkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzRWxlbWVudChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgcmVzdWx0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc05vZGVMaXN0KHJlc3VsdCkgfHwgaXNEKHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCByZXN1bHQsIHBlbmRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSA9IGZ1bmN0aW9uKGFyck9uZSwgYXJyVHdvLCBwZW5kZXIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyT25lLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGxlbiA9IGFyclR3by5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihhcnJPbmVbaWR4XSwgYXJyVHdvW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVsZW0sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGFyckVsZW0sIGVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbSA9IGZ1bmN0aW9uKGVsZW0sIGFyciwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoZWxlbSwgYXJyRWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgfSxcclxuICAgIHByZXBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5pbnNlcnRCZWZvcmUoZWxlbSwgYmFzZS5maXJzdENoaWxkKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBfLmZhc3RtYXAodGhpcy5zbGljZSgpLCAoZWxlbSkgPT4gZWxlbS5jbG9uZU5vZGUodHJ1ZSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGlzSHRtbCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyKHZhbHVlKSwgYXBwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnbWVudCh2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgYXBwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgZWxlbSwgYXBwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgYXBwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBiZWZvcmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gdGFyZ2V0ICYmIHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghdGFyZ2V0IHx8ICFwYXJlbnQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gRChlbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGluc2VydEJlZm9yZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0YXJnZXQsIGVsZW0ubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZnRlcjogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSB0YXJnZXQgJiYgdGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQgfHwgIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgaW5zZXJ0QWZ0ZXI6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IEQodGFyZ2V0KVswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbSwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBpZiAoaXNEKGQpKSB7XHJcbiAgICAgICAgICAgIGQuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgRChvYmopLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcHJlcGVuZDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBwYXJzZXIodmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZ21lbnQodmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIEQoZCkucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBlbGVtcyA9IHRoaXMsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGVsZW0gPSBlbGVtc1tpZHhdLFxyXG4gICAgICAgICAgICAgICAgZGVzY2VuZGFudHMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSxcclxuICAgICAgICAgICAgICAgIGkgPSBkZXNjZW5kYW50cy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBkZXNjO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBkZXNjID0gZGVzY2VuZGFudHNbaV07XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICB0aGlzLmdldCgpLmNvbmNhdChcclxuICAgICAgICAgICAgICAgIC8vIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgaXNTdHJpbmcoc2VsZWN0b3IpID8gRChzZWxlY3RvcikuZ2V0KCkgOlxyXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvblxyXG4gICAgICAgICAgICAgICAgaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSA/IF8udG9BcnJheShzZWxlY3RvcikgOlxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpIHx8IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBbXVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZShzZWxlY3RvckZpbHRlcih0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHJlbW92ZSh0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgZGV0YWNoKHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRldGFjaCh0aGlzKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzT2JqZWN0ICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdpcy9ub2RlTmFtZScpLFxyXG4gICAgRE9DX0VMRU0gICA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuXHJcbnZhciBnZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiBlbGVtLm9mZnNldFRvcCB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IGVsZW0ub2Zmc2V0TGVmdCB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciByZWN0ID0gaXNBdHRhY2hlZChlbGVtKSA/IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7fSxcclxuICAgICAgICBib2R5ID0gZG9jdW1lbnQuYm9keTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogIChyZWN0LnRvcCAgKyBib2R5LnNjcm9sbFRvcCkgIHx8IDAsXHJcbiAgICAgICAgbGVmdDogKHJlY3QubGVmdCArIGJvZHkuc2Nyb2xsTGVmdCkgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtLCBpZHgsIHBvcykge1xyXG4gICAgdmFyIHN0eWxlICAgID0gZWxlbS5zdHlsZSxcclxuICAgICAgICBwb3NpdGlvbiA9IHN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBzdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7IH1cclxuXHJcbiAgICB2YXIgY3VyT2Zmc2V0ICAgICAgICAgPSBnZXRPZmZzZXQoZWxlbSksXHJcbiAgICAgICAgY3VyQ1NTVG9wICAgICAgICAgPSBzdHlsZS50b3AsXHJcbiAgICAgICAgY3VyQ1NTTGVmdCAgICAgICAgPSBzdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBzdHlsZS50b3AgID0gXy50b1B4KHByb3BzLnRvcCk7XHJcbiAgICBzdHlsZS5sZWZ0ID0gXy50b1B4KHByb3BzLmxlZnQpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRQb3NpdGlvbihmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldDogZnVuY3Rpb24ocG9zT3JJdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0KGZpcnN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHx8IGlzT2JqZWN0KHBvc09ySXRlcmF0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT4gc2V0T2Zmc2V0KGVsZW0sIGlkeCwgcG9zT3JJdGVyYXRvcikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgb2Zmc2V0UGFyZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5tYXAodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IERPQ19FTEVNO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgXHJcbiAgICAgICAgICAgICAgICAgICAgKCFpc05vZGVOYW1lKG9mZnNldFBhcmVudCwgJ2h0bWwnKSAmJiAob2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnKSA9PT0gJ3N0YXRpYycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IERPQ19FTEVNO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIG5vZGVUeXBlICAgPSByZXF1aXJlKCdub2RlVHlwZScpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgcHJvcEZpeCA9IF8ucygndGFiSW5kZXh8cmVhZE9ubHl8Y2xhc3NOYW1lfG1heExlbmd0aHxjZWxsU3BhY2luZ3xjZWxsUGFkZGluZ3xyb3dTcGFufGNvbFNwYW58dXNlTWFwfGZyYW1lQm9yZGVyfGNvbnRlbnRFZGl0YWJsZScpXHJcbiAgICAucmVkdWNlKGZ1bmN0aW9uKG9iaiwgc3RyKSB7XHJcbiAgICAgICAgb2JqW3N0ci50b0xvd2VyQ2FzZSgpXSA9IHN0cjtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSwge1xyXG4gICAgICAgICdmb3InOiAgICdodG1sRm9yJyxcclxuICAgICAgICAnY2xhc3MnOiAnY2xhc3NOYW1lJ1xyXG4gICAgfSk7XHJcblxyXG52YXIgcHJvcEhvb2tzID0ge1xyXG4gICAgc3JjOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NyYycsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaHJlZjogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdocmVmJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBTYWZhcmksIElFOStcclxuICAgIC8vIG1pcy1yZXBvcnRzIHRoZSBkZWZhdWx0IHNlbGVjdGVkIHByb3BlcnR5IG9mIGFuIG9wdGlvblxyXG4gICAgLy8gQWNjZXNzaW5nIHRoZSBwYXJlbnQncyBzZWxlY3RlZEluZGV4IHByb3BlcnR5IGZpeGVzIGl0XHJcbiAgICBzZWxlY3RlZDogU1VQUE9SVFMub3B0U2VsZWN0ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgIGZpeDtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGl0IGFsc28gd29ya3Mgd2l0aCBvcHRncm91cHMsIHNlZSAjNTcwMVxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRhYkluZGV4OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIGVsZW0udGFiSW5kZXggZG9lc24ndCBhbHdheXMgcmV0dXJuIHRoZSBjb3JyZWN0IHZhbHVlIHdoZW4gaXQgaGFzbid0IGJlZW4gZXhwbGljaXRseSBzZXRcclxuICAgICAgICAgICAgLy8gaHR0cDovL2ZsdWlkcHJvamVjdC5vcmcvYmxvZy8yMDA4LzAxLzA5L2dldHRpbmctc2V0dGluZy1hbmQtcmVtb3ZpbmctdGFiaW5kZXgtdmFsdWVzLXdpdGgtamF2YXNjcmlwdC9cclxuICAgICAgICAgICAgLy8gVXNlIHByb3BlciBhdHRyaWJ1dGUgcmV0cmlldmFsKCMxMjA3MilcclxuICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFiaW5kZXgpIHsgcmV0dXJuIF8ucGFyc2VJbnQodGFiaW5kZXgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZU5hbWUgPSBlbGVtLm5vZGVOYW1lO1xyXG4gICAgICAgICAgICByZXR1cm4gKFJFR0VYLmlzRm9jdXNhYmxlKG5vZGVOYW1lKSB8fCAoUkVHRVguaXNDbGlja2FibGUobm9kZU5hbWUpICYmIGVsZW0uaHJlZikpID8gMCA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRPclNldFByb3AgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgLy8gZG9uJ3QgZ2V0L3NldCBwcm9wZXJ0aWVzIG9uIHRleHQsIGNvbW1lbnQgYW5kIGF0dHJpYnV0ZSBub2Rlc1xyXG4gICAgaWYgKCFlbGVtIHx8IG5vZGVUeXBlLnRleHQoZWxlbSkgfHwgbm9kZVR5cGUuY29tbWVudChlbGVtKSB8fCBub2RlVHlwZS5hdHRyKGVsZW0pKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpeCBuYW1lIGFuZCBhdHRhY2ggaG9va3NcclxuICAgIG5hbWUgPSBwcm9wRml4W25hbWVdIHx8IG5hbWU7XHJcbiAgICB2YXIgaG9va3MgPSBwcm9wSG9va3NbbmFtZV07XHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2tzICYmICgnc2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLnNldChlbGVtLCB2YWx1ZSwgbmFtZSkpICE9PSB1bmRlZmluZWQgP1xyXG4gICAgICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgICAgICAoZWxlbVtuYW1lXSA9IHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaG9va3MgJiYgKCdnZXQnIGluIGhvb2tzKSAmJiAocmVzdWx0ID0gaG9va3MuZ2V0KGVsZW0sIG5hbWUpKSAhPT0gbnVsbCA/XHJcbiAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICBlbGVtW25hbWVdO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHByb3A6IGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPclNldFByb3AoZmlyc3QsIHByb3ApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3ApKTtcclxuICAgICAgICAgICAgICAgICAgICBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgdmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZVByb3A6IGZ1bmN0aW9uKHByb3ApIHtcclxuICAgICAgICBpZiAoIWlzU3RyaW5nKHByb3ApKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBuYW1lID0gcHJvcEZpeFtwcm9wXSB8fCBwcm9wO1xyXG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZWxlbVtuYW1lXTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBleGlzdHMgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxudmFyIGNvZXJjZU51bSA9ICh2YWx1ZSkgPT5cclxuICAgIC8vIEl0cyBhIG51bWJlciEgfHwgMCB0byBhdm9pZCBOYU4gKGFzIE5hTidzIGEgbnVtYmVyKVxyXG4gICAgK3ZhbHVlID09PSB2YWx1ZSA/ICh2YWx1ZSB8fCAwKSA6XHJcbiAgICAvLyBBdm9pZCBOYU4gYWdhaW5cclxuICAgIGlzU3RyaW5nKHZhbHVlKSA/ICgrdmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gRGVmYXVsdCB0byB6ZXJvXHJcbiAgICAwO1xyXG5cclxudmFyIHByb3RlY3QgPSBmdW5jdGlvbihjb250ZXh0LCB2YWwsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgZWxlbSA9IGNvbnRleHRbMF07XHJcbiAgICBpZiAoIWVsZW0gJiYgIWV4aXN0cyh2YWwpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICBpZiAoIWVsZW0pIHsgcmV0dXJuIGNvbnRleHQ7IH1cclxuXHJcbiAgICByZXR1cm4gY2FsbGJhY2soY29udGV4dCwgZWxlbSwgdmFsKTtcclxufTtcclxuXHJcbnZhciBoYW5kbGVyID0gZnVuY3Rpb24oYXR0cmlidXRlKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY29udGV4dCwgZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgaWYgKGV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgICAgIGVsZW1bYXR0cmlidXRlXSA9IGNvZXJjZU51bSh2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtW2F0dHJpYnV0ZV07XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNjcm9sbFRvcCA9IGhhbmRsZXIoJ3Njcm9sbFRvcCcpO1xyXG52YXIgc2Nyb2xsTGVmdCA9IGhhbmRsZXIoJ3Njcm9sbExlZnQnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBzY3JvbGxMZWZ0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbExlZnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzY3JvbGxUb3A6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBwcm90ZWN0KHRoaXMsIHZhbCwgc2Nyb2xsVG9wKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHF1YWxpZmllcikge1xyXG4gICAgLy8gRWFybHkgcmV0dXJuLCBubyBxdWFsaWZpZXIuIEV2ZXJ5dGhpbmcgbWF0Y2hlc1xyXG4gICAgaWYgKCFxdWFsaWZpZXIpIHsgcmV0dXJuIGFycjsgfVxyXG5cclxuICAgIC8vIEZ1bmN0aW9uXHJcbiAgICBpZiAoaXNGdW5jdGlvbihxdWFsaWZpZXIpKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgcXVhbGlmaWVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBFbGVtZW50XHJcbiAgICBpZiAocXVhbGlmaWVyLm5vZGVUeXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IGVsZW0gPT09IHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2VsZWN0b3JcclxuICAgIGlmIChpc1N0cmluZyhxdWFsaWZpZXIpKSB7XHJcbiAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHF1YWxpZmllcik7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBxdWFsaWZpZXJcclxuICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBfLmNvbnRhaW5zKHF1YWxpZmllciwgZWxlbSkpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgaXNTZWxlY3RvciAgID0gcmVxdWlyZSgnaXMvc2VsZWN0b3InKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc05vZGVMaXN0ICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNBcnJheSAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNEICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufEVsZW1lbnR8Tm9kZUxpc3R8QXJyYXl8RH0gc2VsZWN0b3JcclxuICogQHBhcmFtIHtEfSBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHtFbGVtZW50W119XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgZmluZFdpdGhpbiA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAvLyBGYWlsIGZhc3RcclxuICAgIGlmICghY29udGV4dC5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgdmFyIHF1ZXJ5LCBkZXNjZW5kYW50cywgcmVzdWx0cztcclxuXHJcbiAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gQ29udmVydCBzZWxlY3RvciB0byBhbiBhcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgIHNlbGVjdG9yID0gaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IHNlbGVjdG9yO1xyXG5cclxuICAgICAgICBkZXNjZW5kYW50cyA9IF8uZmxhdHRlbihfLm1hcChjb250ZXh0LCAoZWxlbSkgPT4gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCcqJykpKTtcclxuICAgICAgICByZXN1bHRzID0gXy5maWx0ZXIoZGVzY2VuZGFudHMsIChkZXNjZW5kYW50KSA9PiBfLmNvbnRhaW5zKHNlbGVjdG9yLCBkZXNjZW5kYW50KSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXJ5ID0gRml6emxlLnF1ZXJ5KHNlbGVjdG9yKTtcclxuICAgICAgICByZXN1bHRzID0gcXVlcnkuZXhlYyhjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBoYXM6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3Rvcih0YXJnZXQpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXRzID0gdGhpcy5maW5kKHRhcmdldCksXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gdGFyZ2V0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3JkZXIuY29udGFpbnMoZWxlbSwgdGFyZ2V0c1tpZHhdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikuYW55KHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSwgaWR4KSA9PiAhIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IGVsZW0gPT09IGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vdDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgaXMubm90KHRoaXMpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gXy50b0FycmF5KHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gIV8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiAhaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSAhPT0gY29udGV4dClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbmQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHNlbGVjdG9yKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgcmVzdWx0ID0gZmluZFdpdGhpbihzZWxlY3RvciwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLm1lcmdlKEQoKSwgcmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gRCgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNoZWNrZXIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiBjaGVja2VyLmNhbGwoZWxlbSwgZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIEQoKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBub2RlVHlwZSAgICAgICAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXR0YWNoZWQgICAgICAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzRCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIEZpenpsZSAgICAgICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgZ2V0U2libGluZ3MgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc2licyA9IF9nZXROb2RlU2libGluZ3MoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYnMubGVuZ3RoKSB7IHJlc3VsdC5wdXNoKHNpYnMpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldE5vZGVTaWJsaW5ncyA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2licyA9IF8udG9BcnJheShwYXJlbnQuY2hpbGRyZW4pLFxyXG4gICAgICAgICAgICBpZHggID0gc2licy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAvLyBFeGNsdWRlIHRoZSBub2RlIGl0c2VsZiBmcm9tIHRoZSBsaXN0IG9mIGl0cyBwYXJlbnQncyBjaGlsZHJlblxyXG4gICAgICAgICAgICBpZiAoc2lic1tpZHhdID09PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2licztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2hpbGRyZW4gLS0tLS0tXHJcbiAgICBnZXRDaGlsZHJlbiA9IChhcnIpID0+IF8uZmxhdHRlbihfLm1hcChhcnIsIF9jaGlsZHJlbikpLFxyXG4gICAgX2NoaWxkcmVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBraWRzID0gZWxlbS5jaGlsZHJlbixcclxuICAgICAgICAgICAgaWR4ICA9IDAsIGxlbiAgPSBraWRzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyICA9IEFycmF5KGxlbik7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBraWRzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudHMgLS0tLS0tXHJcbiAgICBnZXRDbG9zZXN0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgY2xvc2VzdCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShlbGVtc1tpZHhdLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGVsZW1zW2lkeF0pO1xyXG4gICAgICAgICAgICBjbG9zZXN0ID0gc2VsZWN0b3JGaWx0ZXIocGFyZW50cywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2xvc2VzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNsb3Nlc3RbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50c1VudGlsID0gZnVuY3Rpb24oZCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGRbaWR4XSwgbnVsbCwgc3RvcFNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgX2dldE5vZGVQYXJlbnQgPSAobm9kZSkgPT4gbm9kZSAmJiBub2RlLnBhcmVudE5vZGUsXHJcblxyXG4gICAgX2NyYXdsVXBOb2RlID0gZnVuY3Rpb24obm9kZSwgY29udGV4dCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlO1xyXG5cclxuICAgICAgICB3aGlsZSAoKHBhcmVudCA9IF9nZXROb2RlUGFyZW50KHBhcmVudCkpICAgICAmJlxyXG4gICAgICAgICAgICAgICAhbm9kZVR5cGUuZG9jKHBhcmVudCkgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKHBhcmVudCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudCAtLS0tLS1cclxuICAgIGdldFBhcmVudCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBfZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgX3ByZXZOZXh0Q3Jhd2wgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kXSkgJiYgIW5vZGVUeXBlLmVsZW0oY3VycmVudCkpIHt9XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50OyAgICBcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGdldFByZXYgPSBfcHJldk5leHRDcmF3bCgncHJldmlvdXNTaWJsaW5nJyksXHJcbiAgICBnZXROZXh0ID0gX3ByZXZOZXh0Q3Jhd2woJ25leHRTaWJsaW5nJyksXHJcblxyXG4gICAgX3ByZXZOZXh0Q3Jhd2xBbGwgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ICA9IFtdLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kXSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKGN1cnJlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGdldFByZXZBbGwgPSBfcHJldk5leHRDcmF3bEFsbCgncHJldmlvdXNTaWJsaW5nJyksXHJcbiAgICBnZXROZXh0QWxsID0gX3ByZXZOZXh0Q3Jhd2xBbGwoJ25leHRTaWJsaW5nJyksXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsQWxsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGZpbHRlciA9IHNlbGVjdG9yID8gZnVuY3Rpb24oc2libGluZykgeyByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKTsgfSA6IGV4aXN0cztcclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgc2libGluZ3MgPSBfLmZpbHRlcihzaWJsaW5ncywgZmlsdGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxVbnRpbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBpdGVyYXRvcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gZnVuY3Rpb24oc2libGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBpcy5tYXRjaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNNYXRjaDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goc2libGluZ3MsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHJldmVyc2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdW5pcXVlKGVsZW1zKTtcclxuICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEQocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KHNlbGVjdG9yRmlsdGVyKGVsZW1zLCBzZWxlY3RvciksIHJldmVyc2UpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBjb250ZW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgIF8ucGx1Y2sodGhpcywgJ2NoaWxkTm9kZXMnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG91dE9mQm91bmRzID0gLTE7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gb3V0T2ZCb3VuZHM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICByZXR1cm4gRChzZWxlY3RvcikuaW5kZXhPZihmaXJzdCk7ICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpIHx8IGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3JbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2sgICAgICAgIFxyXG4gICAgICAgIHZhciBmaXJzdCAgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBmaXJzdC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gb3V0T2ZCb3VuZHM7IH1cclxuXHJcbiAgICAgICAgLy8gaXNBdHRhY2hlZCBjaGVjayB0byBwYXNzIHRlc3QgXCJOb2RlIHdpdGhvdXQgcGFyZW50IHJldHVybnMgLTFcIlxyXG4gICAgICAgIC8vIG5vZGVUeXBlIGNoZWNrIHRvIHBhc3MgXCJJZiBEI2luZGV4IGNhbGxlZCBvbiBlbGVtZW50IHdob3NlIHBhcmVudCBpcyBmcmFnbWVudCwgaXQgc3RpbGwgc2hvdWxkIHdvcmsgY29ycmVjdGx5XCJcclxuICAgICAgICB2YXIgYXR0YWNoZWQgICAgICAgICA9IGlzQXR0YWNoZWQoZmlyc3QpLFxyXG4gICAgICAgICAgICBpc1BhcmVudEZyYWdtZW50ID0gbm9kZVR5cGUuZG9jX2ZyYWcocGFyZW50KTtcclxuXHJcbiAgICAgICAgaWYgKCFhdHRhY2hlZCAmJiAhaXNQYXJlbnRGcmFnbWVudCkgeyByZXR1cm4gb3V0T2ZCb3VuZHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIG5vZGVUeXBlLmVsZW0pO1xyXG5cclxuICAgICAgICByZXR1cm4gW10uaW5kZXhPZi5jYWxsKGNoaWxkRWxlbXMsIGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgbmV3bGluZXMgICA9IHJlcXVpcmUoJ3V0aWwvbmV3bGluZXMnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOdW1iZXIgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnaXMvbm9kZU5hbWUnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbTtcclxuXHJcbnZhciBub3JtYWxOb2RlTmFtZSA9IChlbGVtKSA9PiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCksXHJcblxyXG4gICAgb3V0ZXJIdG1sID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID8gdGhpc1swXS5vdXRlckhUTUwgOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0R2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtKSA9PiBlbGVtLnRleHRDb250ZW50IDpcclxuICAgICAgICAgICAgKGVsZW0pID0+IGVsZW0uaW5uZXJUZXh0LFxyXG5cclxuICAgIHRleHRTZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS50ZXh0Q29udGVudCA9IHN0ciA6XHJcbiAgICAgICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0uaW5uZXJUZXh0ID0gc3RyO1xyXG5cclxudmFyIHZhbEhvb2tzID0ge1xyXG4gICAgb3B0aW9uOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgcmV0dXJuIChleGlzdHModmFsKSA/IHZhbCA6IHRleHRHZXQoZWxlbSkpLnRyaW0oKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBpbmRleCAgID0gZWxlbS5zZWxlY3RlZEluZGV4LFxyXG4gICAgICAgICAgICAgICAgb25lICAgICA9IGVsZW0udHlwZSA9PT0gJ3NlbGVjdC1vbmUnIHx8IGluZGV4IDwgMCxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBvbmUgPyBudWxsIDogW10sXHJcbiAgICAgICAgICAgICAgICBtYXggICAgID0gb25lID8gaW5kZXggKyAxIDogb3B0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gaW5kZXggPCAwID8gbWF4IDogKG9uZSA/IGluZGV4IDogMCk7XHJcblxyXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHRoZSBzZWxlY3RlZCBvcHRpb25zXHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBtYXg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb24uc2VsZWN0ZWQgfHwgaWR4ID09PSBpbmRleCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCByZXR1cm4gb3B0aW9ucyB0aGF0IGFyZSBkaXNhYmxlZCBvciBpbiBhIGRpc2FibGVkIG9wdGdyb3VwXHJcbiAgICAgICAgICAgICAgICAgICAgKFNVUFBPUlRTLm9wdERpc2FibGVkID8gIW9wdGlvbi5kaXNhYmxlZCA6IG9wdGlvbi5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKCFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fCAhaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcclxuICAgICAgICAgICAgICAgICAgICBpZiAob25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICBcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25TZXQsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gXy5tYWtlQXJyYXkodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IG9wdGlvbnMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWVzLCB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gb3B0aW9uU2V0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZvcmNlIGJyb3dzZXJzIHRvIGJlaGF2ZSBjb25zaXN0ZW50bHkgd2hlbiBub24tbWF0Y2hpbmcgdmFsdWUgaXMgc2V0XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uU2V0KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNlbGVjdGVkSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn07XHJcblxyXG4vLyBSYWRpbyBhbmQgY2hlY2tib3ggZ2V0dGVyIGZvciBXZWJraXRcclxuaWYgKCFTVVBQT1JUUy5jaGVja09uKSB7XHJcbiAgICBfLmVhY2goWydyYWRpbycsICdjaGVja2JveCddLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgdmFsSG9va3NbdHlwZV0gPSB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydDogV2Via2l0IC0gJycgaXMgcmV0dXJuZWQgaW5zdGVhZCBvZiAnb24nIGlmIGEgdmFsdWUgaXNuJ3Qgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwgPyAnb24nIDogZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIGdldFZhbCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOb2RlTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLmdldCkge1xyXG4gICAgICAgIHJldHVybiBob29rLmdldChlbGVtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc1N0cmluZyh2YWwpID8gbmV3bGluZXModmFsKSA6IHZhbDtcclxufTtcclxuXHJcbnZhciBzdHJpbmdpZnkgPSAodmFsdWUpID0+XHJcbiAgICAhZXhpc3RzKHZhbHVlKSA/ICcnIDogKHZhbHVlICsgJycpO1xyXG5cclxudmFyIHNldFZhbCA9IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gU3RyaW5naWZ5IHZhbHVlc1xyXG4gICAgdmFyIHZhbHVlID0gaXNBcnJheSh2YWwpID8gXy5tYXAodmFsLCBzdHJpbmdpZnkpIDogc3RyaW5naWZ5KHZhbCk7XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5vZGVOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suc2V0KSB7XHJcbiAgICAgICAgaG9vay5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb3V0ZXJIdG1sOiBvdXRlckh0bWwsXHJcbiAgICBvdXRlckhUTUw6IG91dGVySHRtbCxcclxuXHJcbiAgICBodG1sOiBmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGVsZW0uaW5uZXJIVE1MID0gaHRtbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihodG1sKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBodG1sO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgcmV0dXJuICFmaXJzdCA/IHVuZGVmaW5lZCA6IGZpcnN0LmlubmVySFRNTDtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIC8vIGdldHRlclxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0VmFsKHRoaXNbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFleGlzdHModmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCAnJykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGdldFZhbChlbGVtKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2V0VmFsKGVsZW0sIHZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzZXR0ZXJzXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGV4dDogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHN0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gdGV4dFNldChlbGVtLCBzdHIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHN0cikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc3RyO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICB0ZXh0U2V0KGVsZW0sIGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCB0ZXh0R2V0KGVsZW0pKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLCB0ZXh0R2V0KS5qb2luKCcnKTtcclxuICAgIH1cclxufTsiLCJ2YXIgaXMgPSBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4gKGVsZW0pID0+IGVsZW0gJiYgZWxlbS5ub2RlVHlwZSA9PT0geDtcclxufTtcclxuXHJcbi8vIGNvbW1lbnRlZC1vdXQgbWV0aG9kcyBhcmUgbm90IGJlaW5nIHVzZWRcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBlbGVtOiBpcygxKSxcclxuICAgIGF0dHI6IGlzKDIpLFxyXG4gICAgdGV4dDogaXMoMyksXHJcbiAgICAvLyBjZGF0YTogaXMoNCksXHJcbiAgICAvLyBlbnRpdHlfcmVmZXJlbmNlOiBpcyg1KSxcclxuICAgIC8vIGVudGl0eTogaXMoNiksXHJcbiAgICAvLyBwcm9jZXNzaW5nX2luc3RydWN0aW9uOiBpcyg3KSxcclxuICAgIGNvbW1lbnQ6IGlzKDgpLFxyXG4gICAgZG9jOiBpcyg5KSxcclxuICAgIC8vIGRvY3VtZW50X3R5cGU6IGlzKDEwKSxcclxuICAgIGRvY19mcmFnOiBpcygxMSlcclxuICAgIC8vIG5vdGF0aW9uOiBpcygxMiksXHJcbn07IiwidmFyIHJlYWR5ID0gZmFsc2UsXHJcbiAgICByZWdpc3RyYXRpb24gPSBbXTtcclxuXHJcbnZhciB3YWl0ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIC8vIEFscmVhZHkgbG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xyXG4gICAgICAgIHJldHVybiBmbigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0YW5kYXJkcy1iYXNlZCBicm93c2VycyBzdXBwb3J0IERPTUNvbnRlbnRMb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgSUUgZXZlbnQgbW9kZWwgaXMgdXNlZFxyXG5cclxuICAgIC8vIEVuc3VyZSBmaXJpbmcgYmVmb3JlIG9ubG9hZCwgbWF5YmUgbGF0ZSBidXQgc2FmZSBhbHNvIGZvciBpZnJhbWVzXHJcbiAgICBkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdpbnRlcmFjdGl2ZScpIHsgZm4oKTsgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQSBmYWxsYmFjayB0byB3aW5kb3cub25sb2FkLCB0aGF0IHdpbGwgYWx3YXlzIHdvcmtcclxuICAgIHdpbmRvdy5hdHRhY2hFdmVudCgnb25sb2FkJywgZm4pO1xyXG59O1xyXG5cclxud2FpdChmdW5jdGlvbigpIHtcclxuICAgIHJlYWR5ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBjYWxsIHJlZ2lzdGVyZWQgbWV0aG9kcyAgICBcclxuICAgIHdoaWxlIChyZWdpc3RyYXRpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgcmVnaXN0cmF0aW9uLnNoaWZ0KCkoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChjYWxsYmFjaykgPT5cclxuICAgIHJlYWR5ID8gY2FsbGJhY2soKSA6IHJlZ2lzdHJhdGlvbi5wdXNoKGNhbGxiYWNrKTtcclxuIiwidmFyIGlzQXR0YWNoZWQgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICAvLyBodHRwOi8vZWpvaG4ub3JnL2Jsb2cvY29tcGFyaW5nLWRvY3VtZW50LXBvc2l0aW9uL1xyXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgIENPTlRBSU5FRF9CWSA9IDE2LFxyXG4gICAgRk9MTE9XSU5HICAgID0gNCxcclxuICAgIERJU0NPTk5FQ1RFRCA9IDE7XHJcblxyXG52YXIgaXMgPSAocmVsLCBmbGFnKSA9PiAocmVsICYgZmxhZykgPT09IGZsYWcsXHJcblxyXG4gICAgaXNOb2RlID0gKGIsIGZsYWcsIGEpID0+IGlzKGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYiksIGZsYWcpLFxyXG5cclxuICAgIGhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxudmFyIHNvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgIC8vIEZsYWcgZm9yIGR1cGxpY2F0ZSByZW1vdmFsXHJcbiAgICBpZiAobm9kZTEgPT09IG5vZGUyKSB7XHJcbiAgICAgICAgaGFzRHVwbGljYXRlID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgdmFyIHJlbCA9IChub2RlMS5vd25lckRvY3VtZW50IHx8IG5vZGUxKSA9PT0gKG5vZGUyLm93bmVyRG9jdW1lbnQgfHwgbm9kZTIpID9cclxuICAgICAgICAvLyB0aGVuIGNvbXBhcmUgcG9zaXRpb25cclxuICAgICAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihub2RlMikgOlxyXG4gICAgICAgIC8vIE90aGVyd2lzZSB3ZSBrbm93IHRoZXkgYXJlIGRpc2Nvbm5lY3RlZFxyXG4gICAgICAgIERJU0NPTk5FQ1RFRDtcclxuXHJcbiAgICAvLyBOb3QgZGlyZWN0bHkgY29tcGFyYWJsZVxyXG4gICAgaWYgKCFyZWwpIHsgcmV0dXJuIDA7IH1cclxuXHJcbiAgICAvLyBEaXNjb25uZWN0ZWQgbm9kZXNcclxuICAgIGlmIChpcyhyZWwsIERJU0NPTk5FQ1RFRCkpIHtcclxuICAgICAgICB2YXIgaXNOb2RlMURpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUxKSxcclxuICAgICAgICAgICAgaXNOb2RlMkRpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUyKTtcclxuXHJcbiAgICAgICAgLy8gc29ydCBvcmRlclxyXG4gICAgICAgIHJldHVybiBpc05vZGUxRGlzY29ubmVjdGVkICYmIGlzTm9kZTJEaXNjb25uZWN0ZWQgPyAwIDpcclxuICAgICAgICAgICAgaXNOb2RlMkRpc2Nvbm5lY3RlZCA/IC0xIDogMTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXMocmVsLCBGT0xMT1dJTkcpID8gLTEgOiAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnRzIGFuIGFycmF5IG9mIEQgZWxlbWVudHMgaW4tcGxhY2UgKGkuZS4sIG11dGF0ZXMgdGhlIG9yaWdpbmFsIGFycmF5KVxyXG4gKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge0VsZW1lbnRbXX0gYXJyYXkgICAgICAgICAgQXJyYXkgb2YgRCBlbGVtZW50cy5cclxuICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQsIG90aGVyd2lzZSBmYWxzZS5cclxuICogQHNlZSBqUXVlcnkgc3JjL3NlbGVjdG9yLW5hdGl2ZS5qczozN1xyXG4gKi9cclxuZXhwb3J0cy5zb3J0ID0gZnVuY3Rpb24oYXJyYXksIHJldmVyc2UpIHtcclxuICAgIGhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG4gICAgYXJyYXkuc29ydChzb3J0KTtcclxuICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgYXJyYXkucmV2ZXJzZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhhc0R1cGxpY2F0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmAuXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gYSBEIGVsZW1lbnQgbm9kZVxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGIgRCBlbGVtZW50IG5vZGVcclxuICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmA7IG90aGVyd2lzZSBmYWxzZS5cclxuICovXHJcbmV4cG9ydHMuY29udGFpbnMgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICB2YXIgYlVwID0gaXNBdHRhY2hlZChiKSA/IGIucGFyZW50Tm9kZSA6IG51bGw7XHJcblxyXG4gICAgaWYgKGEgPT09IGJVcCkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc0VsZW1lbnQoYlVwKSkge1xyXG4gICAgICAgIC8vIE1vZGVybiBicm93c2VycyAoSUU5KylcclxuICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNOb2RlKGJVcCwgQ09OVEFJTkVEX0JZLCBhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG4iLCJ2YXIgUkVHRVggPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgTUFYX1NJTkdMRV9UQUdfTEVOR1RIID0gMzAsXHJcbiAgICBjcmVhdGUgPSByZXF1aXJlKCdESVYvY3JlYXRlJyk7XHJcblxyXG52YXIgcGFyc2VTdHJpbmcgPSBmdW5jdGlvbihwYXJlbnRUYWdOYW1lLCBodG1sU3RyKSB7XHJcbiAgICB2YXIgcGFyZW50ID0gY3JlYXRlKHBhcmVudFRhZ05hbWUpO1xyXG4gICAgcGFyZW50LmlubmVySFRNTCA9IGh0bWxTdHI7XHJcbiAgICByZXR1cm4gcGFyZW50O1xyXG59O1xyXG5cclxudmFyIHBhcnNlU2luZ2xlVGFnID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgaWYgKGh0bWxTdHIubGVuZ3RoID4gTUFYX1NJTkdMRV9UQUdfTEVOR1RIKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIHNpbmdsZVRhZ01hdGNoID0gUkVHRVguc2luZ2xlVGFnTWF0Y2goaHRtbFN0cik7XHJcbiAgICByZXR1cm4gc2luZ2xlVGFnTWF0Y2ggPyBbY3JlYXRlKHNpbmdsZVRhZ01hdGNoWzFdKV0gOiBudWxsO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICB2YXIgc2luZ2xlVGFnID0gcGFyc2VTaW5nbGVUYWcoaHRtbFN0cik7XHJcbiAgICBpZiAoc2luZ2xlVGFnKSB7IHJldHVybiBzaW5nbGVUYWc7IH1cclxuXHJcbiAgICB2YXIgcGFyZW50VGFnTmFtZSA9IFJFR0VYLmdldFBhcmVudFRhZ05hbWUoaHRtbFN0ciksXHJcbiAgICAgICAgcGFyZW50ICAgICAgICA9IHBhcnNlU3RyaW5nKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpO1xyXG5cclxuICAgIHZhciBjaGlsZCxcclxuICAgICAgICBpZHggPSBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgICAgIGFyciA9IEFycmF5KGlkeCk7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jaGlsZHJlbltpZHhdO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgYXJyW2lkeF0gPSBjaGlsZDtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHBhcnNlciAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIEZpenpsZSAgICAgPSByZXF1aXJlKCdGaXp6bGUnKSxcclxuICAgIGRhdGEgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKTtcclxuXHJcbnZhciBwYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gcGFyc2VyKHN0cik7XHJcbiAgICByZXR1cm4gcmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggPyBEKHJlc3VsdCkgOiBudWxsO1xyXG59O1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIGRhdGEuRCxcclxue1xyXG4gICAgLy8gQmVjYXVzZSBubyBvbmUga25vdyB3aGF0IHRoZSBjYXNlIHNob3VsZCBiZVxyXG4gICAgcGFyc2VIdG1sOiBwYXJzZUh0bWwsXHJcbiAgICBwYXJzZUhUTUw6IHBhcnNlSHRtbCxcclxuXHJcbiAgICAvLyBleHBvc2UgdGhlIHNlbGVjdG9yIGVuZ2luZSBmb3IgZGVidWdnaW5nXHJcbiAgICBGaXp6bGU6ICBGaXp6bGUsXHJcblxyXG4gICAgZWFjaDogICAgXy5qcUVhY2gsXHJcbiAgICBmb3JFYWNoOiBfLmRFYWNoLFxyXG4gICAgZXh0ZW5kOiAgXy5leHRlbmQsXHJcblxyXG4gICAgbW9yZUNvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cualF1ZXJ5ID0gd2luZG93LlplcHRvID0gd2luZG93LiQgPSBEO1xyXG4gICAgfVxyXG59KTtcclxuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIGFycmF5ICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hcnJheScpLFxyXG4gICAgc2VsZWN0b3JzICAgPSByZXF1aXJlKCdtb2R1bGVzL3NlbGVjdG9ycycpLFxyXG4gICAgdHJhbnN2ZXJzYWwgPSByZXF1aXJlKCdtb2R1bGVzL3RyYW5zdmVyc2FsJyksXHJcbiAgICBkaW1lbnNpb25zICA9IHJlcXVpcmUoJ21vZHVsZXMvZGltZW5zaW9ucycpLFxyXG4gICAgbWFuaXAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL21hbmlwJyksXHJcbiAgICBjc3MgICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY3NzJyksXHJcbiAgICBhdHRyICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXR0cicpLFxyXG4gICAgcHJvcCAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Byb3AnKSxcclxuICAgIHZhbCAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy92YWwnKSxcclxuICAgIHBvc2l0aW9uICAgID0gcmVxdWlyZSgnbW9kdWxlcy9wb3NpdGlvbicpLFxyXG4gICAgY2xhc3NlcyAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2NsYXNzZXMnKSxcclxuICAgIHNjcm9sbCAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9zY3JvbGwnKSxcclxuICAgIGRhdGEgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9kYXRhJyksXHJcbiAgICBldmVudHMgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZXZlbnRzJyk7XHJcblxyXG52YXIgYXJyYXlQcm90byA9IF8ucygnbGVuZ3RofHRvU3RyaW5nfHRvTG9jYWxlU3RyaW5nfGpvaW58cG9wfHB1c2h8Y29uY2F0fHJldmVyc2V8c2hpZnR8dW5zaGlmdHxzbGljZXxzcGxpY2V8c29ydHxzb21lfGV2ZXJ5fGluZGV4T2Z8bGFzdEluZGV4T2Z8cmVkdWNlfHJlZHVjZVJpZ2h0fG1hcHxmaWx0ZXInKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIGtleSkge1xyXG4gICAgICAgIG9ialtrZXldID0gQXJyYXkucHJvdG90eXBlW2tleV07XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHt9KTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgcHJvdG90eXBlIHNvIHRoYXRcclxuLy8gaXQgY2FuIGJlIGhvb2tlZCBpbnRvIGZvciBwbHVnaW5zXHJcbkQuZm4gPSBELnByb3RvdHlwZTtcclxuXHJcbl8uZXh0ZW5kKFxyXG4gICAgRC5mbixcclxuICAgIHsgY29uc3RydWN0b3I6IEQsIH0sXHJcbiAgICBhcnJheVByb3RvLFxyXG4gICAgYXJyYXkuZm4sXHJcbiAgICBzZWxlY3RvcnMuZm4sXHJcbiAgICB0cmFuc3ZlcnNhbC5mbixcclxuICAgIG1hbmlwLmZuLFxyXG4gICAgZGltZW5zaW9ucy5mbixcclxuICAgIGNzcy5mbixcclxuICAgIGF0dHIuZm4sXHJcbiAgICBwcm9wLmZuLFxyXG4gICAgdmFsLmZuLFxyXG4gICAgY2xhc3Nlcy5mbixcclxuICAgIHBvc2l0aW9uLmZuLFxyXG4gICAgc2Nyb2xsLmZuLFxyXG4gICAgZGF0YS5mbixcclxuICAgIGV2ZW50cy5mblxyXG4pO1xyXG4iLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBzdGFydCwgZW5kKSB7XHJcbiAgICAvLyBFeGl0IGVhcmx5IGZvciBlbXB0eSBhcnJheVxyXG4gICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgLy8gRW5kLCBuYXR1cmFsbHksIGhhcyB0byBiZSBoaWdoZXIgdGhhbiAwIHRvIG1hdHRlcixcclxuICAgIC8vIHNvIGEgc2ltcGxlIGV4aXN0ZW5jZSBjaGVjayB3aWxsIGRvXHJcbiAgICBpZiAoZW5kKSB7IHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQsIGVuZCk7IH1cclxuXHJcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0IHx8IDApO1xyXG59OyIsInZhciBpZCA9IDA7XHJcbnZhciB1bmlxdWVJZCA9IG1vZHVsZS5leHBvcnRzID0gKCkgPT4gaWQrKztcclxudW5pcXVlSWQuc2VlZCA9IGZ1bmN0aW9uKHNlZWRlZCwgcHJlKSB7XHJcbiAgICB2YXIgcHJlZml4ID0gcHJlIHx8ICcnLFxyXG4gICAgICAgIHNlZWQgPSBzZWVkZWQgfHwgMDtcclxuICAgIHJldHVybiAoKSA9PiBwcmVmaXggKyBzZWVkKys7XHJcbn07Il19
