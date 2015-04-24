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

    each: function each(iterator) {
        return _.jqEach(this, iterator);
    },
    forEach: function forEach(iterator) {
        return _.dEach(this, iterator);
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL2lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9xdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvcHJveHkuanNvbiIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ub2RlTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvbnVtYmVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9vYmplY3QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9zdHJpbmcuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3dpbmRvdy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbWF0Y2hlc1NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L21hcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZVR5cGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zbGljZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztBQ0ZuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QU0sQ0FBQyxPQUFPLEdBQUc7V0FBTSxFQUFFLEVBQUU7Q0FBQSxDQUFDO0FBQzNDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBUyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ2xDLFFBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxFQUFFO1FBQ2xCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLFdBQU87ZUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFO0tBQUEsQ0FBQztDQUNoQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9EJyk7XHJcbnJlcXVpcmUoJy4vcHJvcHMnKTtcclxucmVxdWlyZSgnLi9wcm90bycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHVud3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlKSB7XG4gIHZhciBlO1xuICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgID0gZS5wcmV2ZW50RGVmYXVsdCAgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNIdG1sICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNGdW5jdGlvbiAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCdvbnJlYWR5JyksXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIEFwaSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IsIGF0dHJzKSB7XHJcbiAgICByZXR1cm4gbmV3IEQoc2VsZWN0b3IsIGF0dHJzKTtcclxufTtcclxuXHJcbmlzRC5zZXQoQXBpKTtcclxuXHJcbmZ1bmN0aW9uIEQoc2VsZWN0b3IsIGF0dHJzKSB7XHJcbiAgICAvLyBub3RoaW5cclxuICAgIGlmICghc2VsZWN0b3IpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAvLyBlbGVtZW50IG9yIHdpbmRvdyAoZG9jdW1lbnRzIGhhdmUgYSBub2RlVHlwZSlcclxuICAgIGlmIChzZWxlY3Rvci5ub2RlVHlwZSB8fCBzZWxlY3RvciA9PT0gd2luZG93KSB7XHJcbiAgICAgICAgdGhpc1swXSA9IHNlbGVjdG9yO1xyXG4gICAgICAgIHRoaXMubGVuZ3RoID0gMTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBIVE1MIHN0cmluZ1xyXG4gICAgaWYgKGlzSHRtbChzZWxlY3RvcikpIHtcclxuICAgICAgICBfLm1lcmdlKHRoaXMsIHBhcnNlcihzZWxlY3RvcikpO1xyXG4gICAgICAgIGlmIChhdHRycykgeyB0aGlzLmF0dHIoYXR0cnMpOyB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFN0cmluZ1xyXG4gICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIFNlbGVjdG9yOiBwZXJmb3JtIGEgZmluZCB3aXRob3V0IGNyZWF0aW5nIGEgbmV3IERcclxuICAgICAgICByZXR1cm4gXy5tZXJnZSh0aGlzLCBGaXp6bGUucXVlcnkoc2VsZWN0b3IpLmV4ZWModGhpcywgdHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvY3VtZW50IHJlYWR5XHJcbiAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICBvbnJlYWR5KHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gQXJyYXkgb2YgRWxlbWVudHMsIE5vZGVMaXN0LCBvciBEIG9iamVjdFxyXG4gICAgaWYgKGlzQXJyYXlMaWtlKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIHJldHVybiBfLm1lcmdlKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5ELnByb3RvdHlwZSA9IEFwaS5wcm90b3R5cGU7IiwibW9kdWxlLmV4cG9ydHMgPSAodGFnKSA9PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7IiwidmFyIGRpdiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUnKSgnZGl2Jyk7XHJcblxyXG5kaXYuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCIvYVwiPmE8L2E+JzsiLCJ2YXIgXyA9IHJlcXVpcmUoJ18nKTtcclxuXHJcbnZhciBtYXRjaCA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGVjdG9ycykge1xyXG4gICAgdmFyIGlkeCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBpZiAoc2VsZWN0b3JzW2lkeF0ubWF0Y2goY29udGV4dCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIElzKHNlbGVjdG9ycykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2goY29udGV4dCwgc2VsZWN0b3JzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhbnk6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgICAgIG1hdGNoKGVsZW0sIHNlbGVjdG9ycykgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBub3Q6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgICAgICFtYXRjaChlbGVtLCBzZWxlY3RvcnMpID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTsiLCJ2YXIgZmluZCA9IGZ1bmN0aW9uKHNlbGVjdG9ycywgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoc2VsZWN0b3JzW2lkeF0uZXhlYyhjb250ZXh0KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBRdWVyeShzZWxlY3RvcnMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBpc05ldyA/IDEgOiBhcnIubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChmaW5kKHNlbGVjdG9ycywgYXJyW2lkeF0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgbWF0Y2hlcyAgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgdW5pcXVlSWQgICA9IHJlcXVpcmUoJ3V0aWwvdW5pcXVlSWQnKS5zZWVkKDAsICdfRCcgKyBEYXRlLm5vdygpKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnO1xyXG5cclxudmFyIGRldGVybWluZU1ldGhvZCA9IChzZWxlY3RvcikgPT5cclxuICAgICAgICBSRUdFWC5pc1N0cmljdElkKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UX0JZX0lEIDpcclxuICAgICAgICBSRUdFWC5pc0NsYXNzKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FIDpcclxuICAgICAgICBSRUdFWC5pc1RhZyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgOiAgICAgICBcclxuICAgICAgICBRVUVSWV9TRUxFQ1RPUl9BTEwsXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gKHNlbGVjdGlvbikgPT5cclxuICAgICAgICAvLyBObyBzZWxlY3Rpb24gb3IgYSBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgLy8gc2hvdWxkIHJlc3VsdCBpbiBub3RoaW5nXHJcbiAgICAgICAgIXNlbGVjdGlvbiB8fCAoaXNOb2RlTGlzdChzZWxlY3Rpb24pICYmICFzZWxlY3Rpb24ubGVuZ3RoKSA/IFtdIDpcclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkIHNlbGVjdGlvbiwgcmV0dXJuIGl0IGFzIGFuIGFycmF5XHJcbiAgICAgICAgaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IFxyXG4gICAgICAgIC8vIGVuc3VyZSBpdCdzIGFuIGFycmF5IGFuZCBub3QgYW4gSFRNTENvbGxlY3Rpb25cclxuICAgICAgICBfLnRvQXJyYXkoc2VsZWN0aW9uKSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgbWV0aG9kLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIC8vIENoaWxkIHNlbGVjdCAtIG5lZWRzIHNwZWNpYWwgaGVscCBzbyB0aGF0IFwiPiBkaXZcIiBkb2Vzbid0IGJyZWFrXHJcbiAgICAgICAgdmFyIGlkQXBwbGllZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICBuZXdJZCxcclxuICAgICAgICAgICAgaWQ7XHJcblxyXG4gICAgICAgIGlkID0gY29udGV4dC5pZDtcclxuICAgICAgICBpZiAoaWQgPT09ICcnIHx8ICFleGlzdHMoaWQpKSB7XHJcbiAgICAgICAgICAgIG5ld0lkID0gdW5pcXVlSWQoKTtcclxuICAgICAgICAgICAgY29udGV4dC5pZCA9IG5ld0lkO1xyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGRvY3VtZW50W21ldGhvZF0oXHJcbiAgICAgICAgICAgIC8vIHRhaWxvciB0aGUgY2hpbGQgc2VsZWN0b3JcclxuICAgICAgICAgICAgYCMke2lkQXBwbGllZCA/IG5ld0lkIDogaWR9ICR7c2VsZWN0b3J9YFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChpZEFwcGxpZWQpIHtcclxuICAgICAgICAgICAgY29udGV4dC5pZCA9IGlkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGFzc1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgbWV0aG9kLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIC8vIENsYXNzIHNlYXJjaCwgZG9uJ3Qgc3RhcnQgd2l0aCAnLidcclxuICAgICAgICB2YXIgc2VsZWN0b3IgPSBzZWxlY3Rvci5zdWJzdHIoMSksXHJcbiAgICAgICAgICAgIHNlbGVjdGlvbiA9IGNvbnRleHRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgaWRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgc2VsID0gc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbCk7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVmYXVsdFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgbWV0aG9kLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W21ldGhvZF0oc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSAoaXNDaGlsZE9yU2libGluZ1NlbGVjdCwgaXNDbGFzc1NlYXJjaCwgaXNJZFNlYXJjaCkgPT5cclxuICAgICAgICBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gY2hpbGRPclNpYmxpbmdRdWVyeSA6XHJcbiAgICAgICAgaXNDbGFzc1NlYXJjaCA/IGNsYXNzUXVlcnkgOlxyXG4gICAgICAgIGlzSWRTZWFyY2ggPyBpZFF1ZXJ5IDpcclxuICAgICAgICBkZWZhdWx0UXVlcnk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFNlbGVjdG9yKHN0cikge1xyXG4gICAgdmFyIHNlbGVjdG9yICAgICAgICAgICAgICAgID0gc3RyLnRyaW0oKSxcclxuICAgICAgICBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ICA9IHNlbGVjdG9yWzBdID09PSAnPicgfHwgc2VsZWN0b3JbMF0gPT09ICcrJyxcclxuICAgICAgICBtZXRob2QgICAgICAgICAgICAgICAgICA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBRVUVSWV9TRUxFQ1RPUl9BTEwgOiBkZXRlcm1pbmVNZXRob2Qoc2VsZWN0b3IpLFxyXG4gICAgICAgIGlzSWRTZWFyY2ggICAgICAgICAgICAgID0gbWV0aG9kID09PSBHRVRfRUxFTUVOVF9CWV9JRCxcclxuICAgICAgICBpc0NsYXNzU2VhcmNoICAgICAgICAgICA9ICFpc0lkU2VhcmNoICYmIG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUU7XHJcblxyXG4gICAgdmFyIHF1ZXJ5ID0gZGV0ZXJtaW5lUXVlcnkoXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCxcclxuICAgICAgICBpc0NsYXNzU2VhcmNoLFxyXG4gICAgICAgIGlzSWRTZWFyY2hcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdHI6IHN0cixcclxuXHJcbiAgICAgICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgLy8gTm8gbmVlZWQgdG8gY2hlY2ssIGEgbWF0Y2ggd2lsbCBmYWlsIGlmIGl0J3NcclxuICAgICAgICAgICAgLy8gY2hpbGQgb3Igc2libGluZ1xyXG4gICAgICAgICAgICByZXR1cm4gIWlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBtYXRjaGVzKGNvbnRleHQsIHNlbGVjdG9yKSA6IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGV4ZWM6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgLy8gdGhlc2UgYXJlIHRoZSB0eXBlcyB3ZSdyZSBleHBlY3RpbmcgdG8gZmFsbCB0aHJvdWdoXHJcbiAgICAgICAgICAgIC8vIGlzRWxlbWVudChjb250ZXh0KSB8fCBpc05vZGVMaXN0KGNvbnRleHQpIHx8IGlzQ29sbGVjdGlvbihjb250ZXh0KVxyXG4gICAgICAgICAgICAvLyBpZiBubyBjb250ZXh0IGlzIGdpdmVuLCB1c2UgZG9jdW1lbnRcclxuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5KGNvbnRleHQgfHwgZG9jdW1lbnQsIG1ldGhvZCwgc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCcuLi9fJyksXHJcbiAgICBxdWVyeUNhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgaXNDYWNoZSAgICA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIHNlbGVjdG9yICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvc2VsZWN0b3InKSxcclxuICAgIHF1ZXJ5ICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvcXVlcnknKSxcclxuICAgIGlzICAgICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvaXMnKSxcclxuICAgIHBhcnNlICAgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlJyksXHJcbiAgICBub3JtYWxpemUgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1ub3JtYWxpemUnKTtcclxuXHJcbnZhciB0b1NlbGVjdG9ycyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgcmV0dXJuIF8uZmFzdG1hcChcclxuICAgICAgICBfLmZhc3RtYXAoXHJcbiAgICAgICAgICAgIC8vIFNlbGVjdG9ycyB3aWxsIHJldHVybiBbXSBpZiB0aGUgcXVlcnkgd2FzIGludmFsaWQuXHJcbiAgICAgICAgICAgIC8vIE5vdCByZXR1cm5pbmcgZWFybHkgb3IgZG9pbmcgZXh0cmEgY2hlY2tzIGFzIHRoaXMgd2lsbFxyXG4gICAgICAgICAgICAvLyBub29wIG9uIHRoZSBxdWVyeSBhbmQgaXMgbGV2ZWwgYW5kIGlzIHRoZSBleGNlcHRpb25cclxuICAgICAgICAgICAgLy8gaW5zdGVhZCBvZiB0aGUgcnVsZVxyXG4gICAgICAgICAgICBwYXJzZShzdHIpLFxyXG4gICAgICAgICAgICAvLyBOb3JtYWxpemUgZWFjaCBvZiB0aGUgc2VsZWN0b3JzLi4uXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZVxyXG4gICAgICAgICksXHJcbiAgICAgICAgLy8gLi4uYW5kIG1hcCB0aGVtIHRvIHNlbGVjdG9yIG9iamVjdHNcclxuICAgICAgICBzZWxlY3RvclxyXG4gICAgKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2VsZWN0b3I6IHRvU2VsZWN0b3JzLFxyXG4gICAgcGFyc2U6IHBhcnNlLFxyXG4gICAgXHJcbiAgICBxdWVyeTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5Q2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLnNldChzdHIsIHF1ZXJ5KHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH0sXHJcbiAgICBpczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQ2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgaXNDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBpc0NhY2hlLnNldChzdHIsIGlzKHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuICAgIFwiOmNoaWxkLWV2ZW5cIiA6IFwiOm50aC1jaGlsZChldmVuKVwiLFxyXG4gICAgXCI6Y2hpbGQtb2RkXCIgIDogXCI6bnRoLWNoaWxkKG9kZClcIixcclxuICAgIFwiOnRleHRcIiAgICAgICA6IFwiW3R5cGU9dGV4dF1cIixcclxuICAgIFwiOnBhc3N3b3JkXCIgICA6IFwiW3R5cGU9cGFzc3dvcmRdXCIsXHJcbiAgICBcIjpyYWRpb1wiICAgICAgOiBcIlt0eXBlPXJhZGlvXVwiLFxyXG4gICAgXCI6Y2hlY2tib3hcIiAgIDogXCJbdHlwZT1jaGVja2JveF1cIixcclxuICAgIFwiOnN1Ym1pdFwiICAgICA6IFwiW3R5cGU9c3VibWl0XVwiLFxyXG4gICAgXCI6cmVzZXRcIiAgICAgIDogXCJbdHlwZT1yZXNldF1cIixcclxuICAgIFwiOmJ1dHRvblwiICAgICA6IFwiW3R5cGU9YnV0dG9uXVwiLFxyXG4gICAgXCI6aW1hZ2VcIiAgICAgIDogXCJbdHlwZT1pbWFnZV1cIixcclxuICAgIFwiOmlucHV0XCIgICAgICA6IFwiW3R5cGU9aW5wdXRdXCIsXHJcbiAgICBcIjpmaWxlXCIgICAgICAgOiBcIlt0eXBlPWZpbGVdXCIsXHJcbiAgICBcIjpzZWxlY3RlZFwiICAgOiBcIltzZWxlY3RlZD1zZWxlY3RlZF1cIlxyXG59IiwidmFyIFNVUFBPUlRTICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBQU0VVRE9fU0VMRUNUICAgICAgPSAvKDpbXlxcc1xcKFxcWyldKykvZyxcclxuICAgIFNFTEVDVEVEX1NFTEVDVCAgICA9IC9cXFtzZWxlY3RlZFxcXS9naSxcclxuICAgIGNhY2hlICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHByb3hpZXMgICAgICAgICAgICA9IHJlcXVpcmUoJy4vcHJveHkuanNvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoc3RyKSA/IGNhY2hlLmdldChzdHIpIDogY2FjaGUucHV0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gcHNldWRvIHJlcGxhY2UgaWYgdGhlIGNhcHR1cmVkIHNlbGVjdG9yIGlzIGluIHRoZSBwcm94aWVzXHJcbiAgICAgICAgdmFyIHMgPSBzdHIucmVwbGFjZShQU0VVRE9fU0VMRUNULCAobWF0Y2gpID0+IHByb3hpZXNbbWF0Y2hdID8gcHJveGllc1ttYXRjaF0gOiBtYXRjaCk7XHJcblxyXG4gICAgICAgIC8vIGJvb2xlYW4gc2VsZWN0b3IgcmVwbGFjZW1lbnQ/XHJcbiAgICAgICAgLy8gc3VwcG9ydHMgSUU4LTlcclxuICAgICAgICByZXR1cm4gU1VQUE9SVFMuc2VsZWN0ZWRTZWxlY3RvciA/IHMgOiBzLnJlcGxhY2UoU0VMRUNURURfU0VMRUNULCAnW3NlbGVjdGVkPVwic2VsZWN0ZWRcIl0nKTtcclxuICAgIH0pO1xyXG59OyIsInZhciB0b2tlbkNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG5cclxuICAgIHRva2VuaXplID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIGFyciA9IHN0ci5zcGxpdCgnLCAnKSxcclxuICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgc2VsZWN0b3I7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gYXJyW2lkeF0gPSBhcnJbaWR4XS50cmltKCk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycgIHx8XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvciA9PT0gJyMnIHx8XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvciA9PT0gJy4nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAqIEByZXR1cm4ge1N0cmluZ1tdfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgdG9rZW5zID0gdG9rZW5DYWNoZS5oYXMoc2VsZWN0b3IpID8gXHJcbiAgICAgICAgdG9rZW5DYWNoZS5nZXQoc2VsZWN0b3IpIDogXHJcbiAgICAgICAgdG9rZW5DYWNoZS5zZXQoc2VsZWN0b3IsIHRva2VuaXplKHNlbGVjdG9yKSk7XHJcblxyXG4gICAgaWYgKCF0b2tlbnMpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGBkLWpzOiBJbnZhbGlkIHF1ZXJ5IHNlbGVjdG9yIFwiJHtzZWxlY3Rvcn1cImApO1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdG9rZW5zLnNsaWNlKCk7XHJcbn07XHJcbiIsIi8vIGhhdmluZyBjYWNoZXMgaXNuJ3QgYWN0dWFsbHkgZmFzdGVyXHJcbi8vIGZvciBhIG1ham9yaXR5IG9mIHVzZSBjYXNlcyBmb3Igc3RyaW5nXHJcbi8vIG1hbmlwdWxhdGlvbnNcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxuXHJcbiAgICAvLyBNYXRjaGVzIFwiLW1zLVwiIHNvIHRoYXQgaXQgY2FuIGJlIGNoYW5nZWQgdG8gXCJtcy1cIlxyXG52YXIgVFJVTkNBVEVfTVNfUFJFRklYICA9IC9eLW1zLS8sXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBkYXNoZWQgc3RyaW5nIGZvciBjYW1lbGl6aW5nXHJcbiAgICBEQVNIX0NBVENIICAgICAgICAgID0gLy0oW1xcZGEtel0pL2dpLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgXCJub25lXCIgb3IgYSB0YWJsZSB0eXBlIGUuZy4gXCJ0YWJsZVwiLFxyXG4gICAgLy8gXCJ0YWJsZS1jZWxsXCIgZXRjLi4uXHJcbiAgICBOT05FX09SX1RBQkxFICAgICAgID0gL14obm9uZXx0YWJsZSg/IS1jW2VhXSkuKykvLFxyXG4gICAgXHJcbiAgICBUWVBFX1RFU1RfRk9DVVNBQkxFID0gL14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8YnV0dG9ufG9iamVjdCkkL2ksXHJcbiAgICBUWVBFX1RFU1RfQ0xJQ0tBQkxFID0gL14oPzphfGFyZWEpJC9pLFxyXG4gICAgU0VMRUNUT1JfSUQgICAgICAgICA9IC9eIyhbXFx3LV0rKSQvLFxyXG4gICAgU0VMRUNUT1JfVEFHICAgICAgICA9IC9eW1xcdy1dKyQvLFxyXG4gICAgU0VMRUNUT1JfQ0xBU1MgICAgICA9IC9eXFwuKFtcXHctXSspJC8sXHJcbiAgICBQT1NJVElPTiAgICAgICAgICAgID0gL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvLFxyXG4gICAgTlVNX05PTl9QWCAgICAgICAgICA9IG5ldyBSZWdFeHAoJ14oJyArICgvWystXT8oPzpcXGQqXFwufClcXGQrKD86W2VFXVsrLV0/XFxkK3wpLykuc291cmNlICsgJykoPyFweClbYS16JV0rJCcsICdpJyksXHJcbiAgICBTSU5HTEVfVEFHICAgICAgICAgID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxyXG4gICAgSVNfQk9PTF9BVFRSICAgICAgICA9IC9eKD86Y2hlY2tlZHxzZWxlY3RlZHxhc3luY3xhdXRvZm9jdXN8YXV0b3BsYXl8Y29udHJvbHN8ZGVmZXJ8ZGlzYWJsZWR8aGlkZGVufGlzbWFwfGxvb3B8bXVsdGlwbGV8b3BlbnxyZWFkb25seXxyZXF1aXJlZHxzY29wZWQpJC9pLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFwIG9mIHBhcmVudCB0YWcgbmFtZXMgdG8gdGhlIGNoaWxkIHRhZ3MgdGhhdCByZXF1aXJlIHRoZW0uXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBQQVJFTlRfTUFQID0ge1xyXG4gICAgICAgIHRhYmxlOiAgICAvXjwoPzp0Ym9keXx0Zm9vdHx0aGVhZHxjb2xncm91cHxjYXB0aW9uKVxcYi8sXHJcbiAgICAgICAgdGJvZHk6ICAgIC9ePCg/OnRyKVxcYi8sXHJcbiAgICAgICAgdHI6ICAgICAgIC9ePCg/OnRkfHRoKVxcYi8sXHJcbiAgICAgICAgY29sZ3JvdXA6IC9ePCg/OmNvbClcXGIvLFxyXG4gICAgICAgIHNlbGVjdDogICAvXjwoPzpvcHRpb24pXFxiL1xyXG4gICAgfTtcclxuXHJcbnZhciB0ZXN0ID0gZnVuY3Rpb24ocmVnKSB7XHJcbiAgICByZXR1cm4gKHN0cikgPT4gcmVnLnRlc3Qoc3RyKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2luZ2xlVGFnTWF0Y2g6ICh2YWwpID0+IFNJTkdMRV9UQUcuZXhlYyh2YWwpLFxyXG5cclxuICAgIG51bU5vdFB4OiAgICAgICB0ZXN0KE5VTV9OT05fUFgpLFxyXG4gICAgcG9zaXRpb246ICAgICAgIHRlc3QoUE9TSVRJT04pLFxyXG4gICAgaXNOb25lT3JUYWJsZTogIHRlc3QoTk9ORV9PUl9UQUJMRSksXHJcbiAgICBpc0ZvY3VzYWJsZTogICAgdGVzdChUWVBFX1RFU1RfRk9DVVNBQkxFKSxcclxuICAgIGlzQ2xpY2thYmxlOiAgICB0ZXN0KFRZUEVfVEVTVF9DTElDS0FCTEUpLFxyXG4gICAgaXNTdHJpY3RJZDogICAgIHRlc3QoU0VMRUNUT1JfSUQpLFxyXG4gICAgaXNUYWc6ICAgICAgICAgIHRlc3QoU0VMRUNUT1JfVEFHKSxcclxuICAgIGlzQ2xhc3M6ICAgICAgICB0ZXN0KFNFTEVDVE9SX0NMQVNTKSxcclxuICAgIGlzQm9vbEF0dHI6ICAgICB0ZXN0KElTX0JPT0xfQVRUUiksXHJcblxyXG4gICAgY2FtZWxDYXNlOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoVFJVTkNBVEVfTVNfUFJFRklYLCAnbXMtJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoREFTSF9DQVRDSCwgKG1hdGNoLCBsZXR0ZXIpID0+IGxldHRlci50b1VwcGVyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50VGFnTmFtZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9IHN0ci5zdWJzdHIoMCwgMzApO1xyXG4gICAgICAgIGZvciAodmFyIHBhcmVudFRhZ05hbWUgaW4gUEFSRU5UX01BUCkge1xyXG4gICAgICAgICAgICBpZiAoUEFSRU5UX01BUFtwYXJlbnRUYWdOYW1lXS50ZXN0KHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRUYWdOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnZGl2JztcclxuICAgIH1cclxufTtcclxuIiwidmFyIERJViAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgY3JlYXRlID0gcmVxdWlyZSgnRElWL2NyZWF0ZScpLFxyXG4gICAgYSAgICAgID0gRElWLnF1ZXJ5U2VsZWN0b3IoJ2EnKSxcclxuICAgIHNlbGVjdCA9IGNyZWF0ZSgnc2VsZWN0JyksXHJcbiAgICBvcHRpb24gPSBzZWxlY3QuYXBwZW5kQ2hpbGQoY3JlYXRlKCdvcHRpb24nKSksXHJcblxyXG4gICAgdGVzdCA9ICh0YWdOYW1lLCB0ZXN0Rm4pID0+IHRlc3RGbihjcmVhdGUodGFnTmFtZSkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBVUkxzIGFyZW4ndCBtYW5pcHVsYXRlZFxyXG4gICAgLy8gKElFIG5vcm1hbGl6ZXMgaXQgYnkgZGVmYXVsdClcclxuICAgIGhyZWZOb3JtYWxpemVkOiBhLmdldEF0dHJpYnV0ZSgnaHJlZicpID09PSAnL2EnLFxyXG5cclxuICAgIC8vIENoZWNrIHRoZSBkZWZhdWx0IGNoZWNrYm94L3JhZGlvIHZhbHVlICgnJyBpbiBvbGRlciBXZWJLaXQ7ICdvbicgZWxzZXdoZXJlKVxyXG4gICAgY2hlY2tPbjogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiAhIWlucHV0LnZhbHVlO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgYW4gaW5wdXQgbWFpbnRhaW5zIGl0cyB2YWx1ZSBhZnRlciBiZWNvbWluZyBhIHJhZGlvXHJcbiAgICAvLyBTdXBwb3J0OiBNb2Rlcm4gYnJvd3NlcnMgb25seSAoTk9UIElFIDw9IDExKVxyXG4gICAgcmFkaW9WYWx1ZTogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnZhbHVlID0gJ3QnO1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiBpbnB1dC52YWx1ZSA9PT0gJ3QnO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgYSBzZWxlY3RlZC1ieS1kZWZhdWx0IG9wdGlvbiBoYXMgYSB3b3JraW5nIHNlbGVjdGVkIHByb3BlcnR5LlxyXG4gICAgLy8gKFdlYktpdCBkZWZhdWx0cyB0byBmYWxzZSBpbnN0ZWFkIG9mIHRydWUsIElFIHRvbywgaWYgaXQncyBpbiBhbiBvcHRncm91cClcclxuICAgIG9wdFNlbGVjdGVkOiBvcHRpb24uc2VsZWN0ZWQsXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG9wdGlvbnMgaW5zaWRlIGRpc2FibGVkIHNlbGVjdHMgYXJlbid0IG1hcmtlZCBhcyBkaXNhYmxlZFxyXG4gICAgLy8gKFdlYktpdCBtYXJrcyB0aGVtIGFzIGRpc2FibGVkKVxyXG4gICAgb3B0RGlzYWJsZWQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICBzZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAhb3B0aW9uLmRpc2FibGVkO1xyXG4gICAgfSgpKSxcclxuICAgIFxyXG4gICAgdGV4dENvbnRlbnQ6IERJVi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkLFxyXG5cclxuICAgIC8vIE1vZGVybiBicm93c2VycyBub3JtYWxpemUgXFxyXFxuIHRvIFxcbiBpbiB0ZXh0YXJlYSB2YWx1ZXMsXHJcbiAgICAvLyBidXQgSUUgPD0gMTEgKGFuZCBwb3NzaWJseSBuZXdlcikgZG8gbm90LlxyXG4gICAgdmFsdWVOb3JtYWxpemVkOiB0ZXN0KCd0ZXh0YXJlYScsIGZ1bmN0aW9uKHRleHRhcmVhKSB7XHJcbiAgICAgICAgdGV4dGFyZWEudmFsdWUgPSAnXFxyXFxuJztcclxuICAgICAgICByZXR1cm4gdGV4dGFyZWEudmFsdWUgPT09ICdcXG4nO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgc2VsZWN0ZWRTZWxlY3RvcjogdGVzdCgnc2VsZWN0JywgZnVuY3Rpb24oc2VsZWN0KSB7XHJcbiAgICAgICAgc2VsZWN0LmlubmVySFRNTCA9ICc8b3B0aW9uIHZhbHVlPVwiMVwiPjE8L29wdGlvbj48b3B0aW9uIHZhbHVlPVwiMlwiIHNlbGVjdGVkPjI8L29wdGlvbj4nO1xyXG4gICAgICAgIHJldHVybiAhIXNlbGVjdC5xdWVyeVNlbGVjdG9yKCdvcHRpb25bc2VsZWN0ZWRdJyk7XHJcbiAgICB9KVxyXG59O1xyXG4iLCJ2YXIgZXhpc3RzICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXJyYXkgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnaXMvYXJyYXlMaWtlJyksXHJcbiAgICBpc05vZGVMaXN0ICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBzbGljZSAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKTtcclxuXHJcbnZhciBsb29wID0gZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdGVlKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICBpZiAobGVuZ3RoID09PSArbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoaXRlcmF0ZWUsIG9ialtpZHhdLCBpZHgsIG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0ga2V5cy5sZW5ndGg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGl0ZXJhdGVlLCBvYmpba2V5c1tpZHhdXSwga2V5c1tpZHhdLCBvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIF8gPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIEJyZWFrcyBldmVuIG9uIGFycmF5cyB3aXRoIDMgaXRlbXMuIDMgb3IgbW9yZVxyXG4gICAgLy8gaXRlbXMgc3RhcnRzIHNhdmluZyBzcGFjZVxyXG4gICAgczogKHN0cikgPT4gc3RyLnNwbGl0KCd8JyksXHJcblxyXG4gICAgLy8gRmxhdHRlbiB0aGF0IGFsc28gY2hlY2tzIGlmIHZhbHVlIGlzIGEgTm9kZUxpc3RcclxuICAgIGZsYXR0ZW46IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChfLmZsYXR0ZW4odmFsdWUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgdG9QeDogKHZhbHVlKSA9PiB2YWx1ZSArICdweCcsXHJcbiAgICBcclxuICAgIHBhcnNlSW50OiAobnVtKSA9PiBwYXJzZUludChudW0sIDEwKSxcclxuXHJcbiAgICBldmVyeTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghZXhpc3RzKGFycikpIHsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKCFpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBleHRlbmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxyXG4gICAgICAgICAgICBvYmogID0gYXJnc1swXSxcclxuICAgICAgICAgICAgbGVuICA9IGFyZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIW9iaiB8fCBsZW4gPCAyKSB7IHJldHVybiBvYmo7IH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaWR4ID0gMTsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gYXJnc1tpZHhdO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3RhbmRhcmQgbWFwXHJcbiAgICBtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQXJyYXktcHJlc2VydmluZyBtYXBcclxuICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL3B1c2gtbWFwLXZzLWluZGV4LXJlcGxhY2VtZW50LW1hcFxyXG4gICAgZmFzdG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghYXJyKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKGFyciAmJiBhcnIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFycltpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHB1bGxlZCBmcm9tIEFNRFxyXG4gICAgdHlwZWNhc3Q6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSAnbnVsbCcpIHtcclxuICAgICAgICAgICAgciA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICByID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykge1xyXG4gICAgICAgICAgICByID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICcnIHx8IGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgLy8gaXNOYU4oJycpIHJldHVybnMgZmFsc2VcclxuICAgICAgICAgICAgciA9IHZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBwYXJzZUZsb2F0KG51bGwgfHwgJycpIHJldHVybnMgTmFOXHJcbiAgICAgICAgICAgIHIgPSBwYXJzZUZsb2F0KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZShvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycixcclxuICAgICAgICAgICAgbGVuID0gK29iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcnIgPSBBcnJheShvYmoubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGFycltpZHhdID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgYXJyLnB1c2gob2JqW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQXJyYXk6IChhcmcpID0+XHJcbiAgICAgICAgIWV4aXN0cyhhcmcpID8gW10gOlxyXG4gICAgICAgIGlzQXJyYXlMaWtlKGFyZykgPyBzbGljZShhcmcpIDogWyBhcmcgXSxcclxuXHJcbiAgICBjb250YWluczogKGFyciwgaXRlbSkgPT4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xLFxyXG5cclxuICAgIGpxRWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4LCBjb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgZm4uY2FsbCh2YWx1ZSwga2V5SW5kZXgsIHZhbHVlLCBjb2xsZWN0aW9uKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRFYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmbi5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4KSB7XHJcbiAgICAgICAgZm4odmFsdWUsIGtleUluZGV4KTtcclxuICAgIH0pLFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggZWFjaCBlbGVtZW50IGluIHRoZVxyXG4gICAgICAgIC8vIHNlY29uZCBhcnJheSBhbmQgYWRkIGl0IHRvIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtpZHhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwbHVja1xyXG4gICAgLy8gVE9ETzogQ2hlY2sgZm9yIHBsYWNlcyB0aGlzIGNhbiBiZSBhcHBsaWVkXHJcbiAgICBwbHVjazogZnVuY3Rpb24oYXJyLCBrZXkpIHtcclxuICAgICAgICByZXR1cm4gXy5tYXAoYXJyLCAob2JqKSA9PiBvYmogPyBvYmpba2V5XSA6IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbn07IiwidmFyIGRlbGV0ZXIgPSAoZGVsZXRhYmxlKSA9PlxyXG4gICAgZGVsZXRhYmxlID8gXHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBkZWxldGUgc3RvcmVba2V5XTsgfSA6XHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBzdG9yZVtrZXldID0gdW5kZWZpbmVkOyB9O1xyXG5cclxudmFyIGdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBzdG9yZSAmJiBzdG9yZVtrZXldICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5LCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgZGVsKHN0b3JlLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgYmlMZXZlbEdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciBoYXMxID0ga2V5MSBpbiBzdG9yZSAmJiBzdG9yZVtrZXkxXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBpZiAoIWhhczEgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhczE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBrZXkyIGluIHN0b3JlW2tleTFdICYmIHN0b3JlW2tleTFdW2tleTJdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyByZWYxIDogKHJlZjEgIT09IHVuZGVmaW5lZCA/IHJlZjFba2V5Ml0gOiByZWYxKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5MSwga2V5MiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5MSwga2V5MiwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIC8vIEVhc3kgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbChzdG9yZSwga2V5MSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERlZXAgcmVtb3ZhbFxyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdIHx8IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgZGVsKHJlZjEsIGtleTIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGx2bCwgZGVsZXRhYmxlKSB7XHJcbiAgICByZXR1cm4gbHZsID09PSAyID8gYmlMZXZlbEdldHRlclNldHRlcihkZWxldGFibGUpIDogZ2V0dGVyU2V0dGVyKGRlbGV0YWJsZSk7XHJcbn07IiwidmFyIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMuc2V0ID0gKEQpID0+IGNvbnN0cnVjdG9yID0gRDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiArdmFsdWUubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGg7XHJcbiIsInZhciBpc0RvY3VtZW50RnJhZ21lbnQgPSByZXF1aXJlKCdub2RlVHlwZScpLmRvY19mcmFnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICB2YXIgcGFyZW50O1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpICAgICAgICAgICAgICYmXHJcbiAgICAgICAgIWlzRG9jdW1lbnRGcmFnbWVudChwYXJlbnQpICAgICAgICAgICAgJiZcclxuICAgICAgICBwYXJlbnQuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9EJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgdmFsdWUgJiYgKHZhbHVlID09PSBkb2N1bWVudCB8fCBpc1dpbmRvdyh2YWx1ZSkgfHwgaXNFbGVtZW50KHZhbHVlKSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIG5hbWUpID0+XHJcbiAgICBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJzsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8ICghIXZhbHVlICYmIHR5cGUgPT09ICdvYmplY3QnKTtcclxufTsiLCJ2YXIgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNDb2xsZWN0aW9uID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsKSA9PlxyXG4gICAgdmFsICYmIChpc1N0cmluZyh2YWwpIHx8IGlzRnVuY3Rpb24odmFsKSB8fCBpc0VsZW1lbnQodmFsKSB8fCBpc0NvbGxlY3Rpb24odmFsKSk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSB2YWx1ZS53aW5kb3c7XHJcbiIsInZhciBpc0VsZW1lbnQgICAgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG4vLyBvbmx5IGVsZW1lbnQgdHlwZXMgc3VwcG9ydGVkXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIHNlbGVjdG9yKSA9PlxyXG4gICAgaXNFbGVtZW50KGVsZW0pID8gbWF0Y2hlc1NlbGVjdG9yLmNhbGwoZWxlbSwgc2VsZWN0b3IpIDogZmFsc2U7XHJcbiIsInZhciBfICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIHNsaWNlICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyksXHJcbiAgICBleGlzdHMgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBtYXAgICAgID0gcmVxdWlyZSgnLi9tYXAnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHNsaWNlKHRoaXMpOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAraW5kZXg7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbXHJcbiAgICAgICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgICAgIC8vIGlmIG5lZ2F0aXZlLCBvciB0aGUgc3RhcnQgb2YgdGhlIHNldCBpZiBwb3NpdGl2ZVxyXG4gICAgICAgICAgICBpZHggPCAwID8gdGhpcy5sZW5ndGggKyBpZHggOiBpZHhcclxuICAgICAgICBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgIHJldHVybiBEKHNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gXy5qcUVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgfSxcclxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZEVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICBpZiAoIWFyci5sZW5ndGggfHwgIWl0ZXJhdG9yKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgaXRlbTtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgaXRlbSA9IGFycltpZHhdO1xyXG4gICAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvci5jYWxsKGl0ZW0sIGl0ZW0sIGlkeCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbmNhdCBmbGF0IGZvciBhIHNpbmdsZSBhcnJheSBvZiBhcnJheXNcclxuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3VsdHMpO1xyXG59OyIsInZhciBvcmRlciA9IHJlcXVpcmUoJ29yZGVyJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgIHZhciBoYXNEdXBsaWNhdGVzID0gb3JkZXIuc29ydChyZXN1bHRzKTtcclxuICAgIGlmICghaGFzRHVwbGljYXRlcykgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBlbGVtLFxyXG4gICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgLy8gY3JlYXRlIHRoZSBhcnJheSBoZXJlXHJcbiAgICAgICAgLy8gc28gdGhhdCBhIG5ldyBhcnJheSBpc24ndFxyXG4gICAgICAgIC8vIGNyZWF0ZWQvZGVzdHJveWVkIGV2ZXJ5IHVuaXF1ZSBjYWxsXHJcbiAgICAgICAgZHVwbGljYXRlcyA9IFtdO1xyXG5cclxuICAgIC8vIEdvIHRocm91Z2ggdGhlIGFycmF5IGFuZCBpZGVudGlmeVxyXG4gICAgLy8gdGhlIGR1cGxpY2F0ZXMgdG8gYmUgcmVtb3ZlZFxyXG4gICAgd2hpbGUgKChlbGVtID0gcmVzdWx0c1tpZHgrK10pKSB7XHJcbiAgICAgICAgaWYgKGVsZW0gPT09IHJlc3VsdHNbaWR4XSkge1xyXG4gICAgICAgICAgICBkdXBsaWNhdGVzLnB1c2goaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBkdXBsaWNhdGVzIGZyb20gdGhlIHJlc3VsdHNcclxuICAgIGlkeCA9IGR1cGxpY2F0ZXMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICByZXN1bHRzLnNwbGljZShkdXBsaWNhdGVzW2lkeF0sIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59OyIsInZhciBfICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGV4aXN0cyAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBpc05vZGVOYW1lICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL25vZGVOYW1lJyksXHJcbiAgICBuZXdsaW5lcyAgICAgICAgICAgICA9IHJlcXVpcmUoJ3V0aWwvbmV3bGluZXMnKSxcclxuICAgIFNVUFBPUlRTICAgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFJFR0VYICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIHNhbml0aXplRGF0YUtleUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpO1xyXG5cclxudmFyIGlzRGF0YUtleSA9IChrZXkpID0+IChrZXkgfHwgJycpLnN1YnN0cigwLCA1KSA9PT0gJ2RhdGEtJyxcclxuXHJcbiAgICB0cmltRGF0YUtleSA9IChrZXkpID0+IGtleS5zdWJzdHIoMCwgNSksXHJcblxyXG4gICAgc2FuaXRpemVEYXRhS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHNhbml0aXplRGF0YUtleUNhY2hlLmhhcyhrZXkpID9cclxuICAgICAgICAgICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUuZ2V0KGtleSkgOlxyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5wdXQoa2V5LCAoKSA9PiBpc0RhdGFLZXkoa2V5KSA/IGtleSA6ICdkYXRhLScgKyBrZXkudG9Mb3dlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGFBdHRyS2V5cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgYXR0cnMgPSBlbGVtLmF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIGlkeCAgID0gYXR0cnMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXlzICA9IFtdLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGF0dHJzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChpc0RhdGFLZXkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfTtcclxuXHJcbnZhciBib29sSG9vayA9IHtcclxuICAgIGlzOiAoYXR0ck5hbWUpID0+IFJFR0VYLmlzQm9vbEF0dHIoYXR0ck5hbWUpLFxyXG4gICAgZ2V0OiAoZWxlbSwgYXR0ck5hbWUpID0+IGVsZW0uaGFzQXR0cmlidXRlKGF0dHJOYW1lKSA/IGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkgOiB1bmRlZmluZWQsXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlLCBhdHRyTmFtZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGJvb2xlYW4gYXR0cmlidXRlcyB3aGVuIHNldCB0byBmYWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJOYW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBob29rcyA9IHtcclxuICAgICAgICB0YWJpbmRleDoge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdHModGFiaW5kZXgpIHx8IHRhYmluZGV4ID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJpbmRleDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHR5cGU6IHtcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFTVVBQT1JUUy5yYWRpb1ZhbHVlICYmIHZhbHVlID09PSAncmFkaW8nICYmIGlzTm9kZU5hbWUoZWxlbSwgJ2lucHV0JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIHRoZSB0eXBlIG9uIGEgcmFkaW8gYnV0dG9uIGFmdGVyIHRoZSB2YWx1ZSByZXNldHMgdGhlIHZhbHVlIGluIElFNi05XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdmFsdWUgdG8gZGVmYXVsdCBpbiBjYXNlIHR5cGUgaXMgc2V0IGFmdGVyIHZhbHVlIGR1cmluZyBjcmVhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS52YWx1ZSA9IG9sZFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld2xpbmVzKHZhbCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QXR0cmlidXRlID0gZnVuY3Rpb24oZWxlbSwgYXR0cikge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pIHx8ICFlbGVtLmhhc0F0dHJpYnV0ZShhdHRyKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBib29sSG9vay5nZXQoZWxlbSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0uZ2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBob29rc1thdHRyXS5nZXQoZWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gZWxlbS5nZXRBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICAgICAgcmV0dXJuIGV4aXN0cyhyZXQpID8gcmV0IDogdW5kZWZpbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXR0ZXJzID0ge1xyXG4gICAgICAgIGZvckF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChib29sSG9vay5pcyhhdHRyKSAmJiAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuYm9vbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmhvb2s7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuZWxlbTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvb2w6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGJvb2xIb29rLnNldChlbGVtLCB2YWx1ZSwgYXR0cik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBob29rOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBob29rc1thdHRyXS5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWxlbTogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXJyLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpc0ZuICAgPSBpc0Z1bmN0aW9uKHZhbHVlKSxcclxuICAgICAgICAgICAgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgdmFsLFxyXG4gICAgICAgICAgICBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG5cclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgdmFsID0gaXNGbiA/IHZhbHVlLmNhbGwoZWxlbSwgaWR4LCBnZXRBdHRyaWJ1dGUoZWxlbSwgYXR0cikpIDogdmFsdWU7XHJcbiAgICAgICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHZhciBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGUoYXJyW2lkeF0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICByZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLnJlbW92ZShlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhhdHRyKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEF0dHJpYnV0ZSh0aGlzWzBdLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXNzdW1lIGFuIG9iamVjdFxyXG4gICAgICAgICAgICB2YXIgYXR0cnMgPSBhdHRyO1xyXG4gICAgICAgICAgICBmb3IgKGF0dHIgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgYXR0cnNbYXR0cl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgLy8gcmVtb3ZlXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpdGVyYXRvclxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkQXR0ciA9IGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICA9IGZuLmNhbGwoZWxlbSwgaWR4LCBvbGRBdHRyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyhyZXN1bHQpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZShlbGVtLCBhdHRyLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNldFxyXG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBdHRyOiBmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7IHJlbW92ZUF0dHJpYnV0ZXModGhpcywgYXR0cik7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGF0dHJEYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG1hcCAgPSB7fSxcclxuICAgICAgICAgICAgICAgIGtleXMgPSBnZXREYXRhQXR0cktleXMoZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICA9IGtleXMubGVuZ3RoLCBrZXk7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAga2V5ID0ga2V5c1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgbWFwW3RyaW1EYXRhS2V5KGtleSldID0gXy50eXBlY2FzdChmaXJzdC5nZXRBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFjayB0byBhbiBvYmplY3QgZGVmaW5pdGlvblxyXG4gICAgICAgIHZhciBvYmogPSBrZXksXHJcbiAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc0VsZW1lbnQgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuXHJcbiAgICBzcGxpdCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIgPT09ICcnID8gW10gOiBzdHIudHJpbSgpLnNwbGl0KC9cXHMrL2cpO1xyXG4gICAgfTtcclxuXHJcbnZhciBhZGRDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC5hZGQobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QudG9nZ2xlKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3VibGVDbGFzc0xvb3AgPSBmdW5jdGlvbihlbGVtcywgbmFtZXMsIG1ldGhvZCkge1xyXG4gICAgICAgIHZhciBpZHggPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBlbGVtc1tpZHhdO1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgICAgICBjbGFzc0xpc3QgPSBlbGVtLmNsYXNzTGlzdDtcclxuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kKGNsYXNzTGlzdCwgbmFtZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtcztcclxuICAgIH0sXHJcblxyXG4gICAgZG9BbnlFbGVtc0hhdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbXNbaWR4XSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgaWYgKGVsZW1zW2lkeF0uY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbXNbaWR4XSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgZWxlbXNbaWR4XS5jbGFzc05hbWUgPSAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBoYXNDbGFzczogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCAmJiBleGlzdHMobmFtZSkgJiYgbmFtZSAhPT0gJycgPyBkb0FueUVsZW1zSGF2ZUNsYXNzKHRoaXMsIG5hbWUpIDogZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkgeyBuYW1lcyA9IHNwbGl0KG5hbWVzKTsgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5hbWVzLmxlbmd0aCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lcywgYWRkQ2xhc3MpIDogdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUFsbENsYXNzZXModGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCByZW1vdmVDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzOiBmdW5jdGlvbihuYW1lcywgc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgdmFyIG5hbWVMaXN0O1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCAhdGhpcy5sZW5ndGggfHwgIShuYW1lTGlzdCA9IHNwbGl0KG5hbWVzKSkubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaG91bGRBZGQgPT09IHVuZGVmaW5lZCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgdG9nZ2xlQ2xhc3MpIDpcclxuICAgICAgICAgICAgc2hvdWxkQWRkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCBhZGRDbGFzcykgOlxyXG4gICAgICAgICAgICBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIHJlbW92ZUNsYXNzKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgZXhpc3RzICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXR0YWNoZWQgICAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc051bWJlciAgICAgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNCb29sZWFuICAgICAgPSByZXF1aXJlKCdpcy9ib29sZWFuJyksXHJcbiAgICBpc09iamVjdCAgICAgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNBcnJheSAgICAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNEb2N1bWVudFR5cGUgPSByZXF1aXJlKCdub2RlVHlwZScpLmRvYyxcclxuICAgIFJFR0VYICAgICAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncyA9IHtcclxuICAgIGRpc3BsYXk6ICAgICdibG9jaycsXHJcbiAgICBwb3NpdGlvbjogICAnYWJzb2x1dGUnLFxyXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcclxufTtcclxuXHJcbnZhciBnZXREb2N1bWVudERpbWVuc2lvbiA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIC8vIEVpdGhlciBzY3JvbGxbV2lkdGgvSGVpZ2h0XSBvciBvZmZzZXRbV2lkdGgvSGVpZ2h0XSBvclxyXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0sIHdoaWNoZXZlciBpcyBncmVhdGVzdFxyXG4gICAgdmFyIGRvYyA9IGVsZW0uZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KFxyXG4gICAgICAgIGVsZW0uYm9keVsnc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGVsZW0uYm9keVsnb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBkb2NbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydjbGllbnQnICsgbmFtZV1cclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgaGlkZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9LFxyXG4gICAgc2hvdyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgY3NzU3dhcCA9IGZ1bmN0aW9uKGVsZW0sIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG9sZCA9IHt9O1xyXG5cclxuICAgICAgICAvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvbGRbbmFtZV0gPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhlbGVtKTtcclxuXHJcbiAgICAgICAgLy8gUmV2ZXJ0IHRoZSBvbGQgdmFsdWVzXHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9sZFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEF2b2lkcyBhbiAnSWxsZWdhbCBJbnZvY2F0aW9uJyBlcnJvciAoQ2hyb21lKVxyXG4gICAgLy8gQXZvaWRzIGEgJ1R5cGVFcnJvcjogQXJndW1lbnQgMSBvZiBXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkb2VzIG5vdCBpbXBsZW1lbnQgaW50ZXJmYWNlIEVsZW1lbnQnIGVycm9yIChGaXJlZm94KVxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZSA9IChlbGVtKSA9PlxyXG4gICAgICAgIGlzRWxlbWVudChlbGVtKSAmJiAhaXNXaW5kb3coZWxlbSkgJiYgIWlzRG9jdW1lbnQoZWxlbSkgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSA6IG51bGwsXHJcblxyXG4gICAgX3dpZHRoID0ge1xyXG4gICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0RvY3VtZW50VHlwZShlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdXaWR0aCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAod2lkdGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUud2lkdGggPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9oZWlnaHQgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRG9jdW1lbnRUeXBlKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ0hlaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBnZXRXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG5cclxuICAgIC8vIFN0YXJ0IHdpdGggb2Zmc2V0IHByb3BlcnR5LCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIHRoZSBib3JkZXItYm94IHZhbHVlXHJcbiAgICB2YXIgdmFsdWVJc0JvcmRlckJveCA9IHRydWUsXHJcbiAgICAgICAgdmFsID0gKG5hbWUgPT09ICd3aWR0aCcpID8gZWxlbS5vZmZzZXRXaWR0aCA6IGVsZW0ub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICAgIHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgaXNCb3JkZXJCb3ggPSBzdHlsZXMuYm94U2l6aW5nID09PSAnYm9yZGVyLWJveCc7XHJcblxyXG4gICAgLy8gc29tZSBub24taHRtbCBlbGVtZW50cyByZXR1cm4gdW5kZWZpbmVkIGZvciBvZmZzZXRXaWR0aCwgc28gY2hlY2sgZm9yIG51bGwvdW5kZWZpbmVkXHJcbiAgICAvLyBzdmcgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02NDkyODVcclxuICAgIC8vIE1hdGhNTCAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTQ5MTY2OFxyXG4gICAgaWYgKHZhbCA8PSAwIHx8ICFleGlzdHModmFsKSkge1xyXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBjb21wdXRlZCB0aGVuIHVuY29tcHV0ZWQgY3NzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgIHZhbCA9IGN1ckNzcyhlbGVtLCBuYW1lLCBzdHlsZXMpO1xyXG4gICAgICAgIGlmICh2YWwgPCAwIHx8ICF2YWwpIHsgdmFsID0gZWxlbS5zdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlZCB1bml0IGlzIG5vdCBwaXhlbHMuIFN0b3AgaGVyZSBhbmQgcmV0dXJuLlxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeCh2YWwpKSB7IHJldHVybiB2YWw7IH1cclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0aGUgY2hlY2sgZm9yIHN0eWxlIGluIGNhc2UgYSBicm93c2VyIHdoaWNoIHJldHVybnMgdW5yZWxpYWJsZSB2YWx1ZXNcclxuICAgICAgICAvLyBmb3IgZ2V0Q29tcHV0ZWRTdHlsZSBzaWxlbnRseSBmYWxscyBiYWNrIHRvIHRoZSByZWxpYWJsZSBlbGVtLnN0eWxlXHJcbiAgICAgICAgdmFsdWVJc0JvcmRlckJveCA9IGlzQm9yZGVyQm94ICYmIHZhbCA9PT0gc3R5bGVzW25hbWVdO1xyXG5cclxuICAgICAgICAvLyBOb3JtYWxpemUgJycsIGF1dG8sIGFuZCBwcmVwYXJlIGZvciBleHRyYVxyXG4gICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVzZSB0aGUgYWN0aXZlIGJveC1zaXppbmcgbW9kZWwgdG8gYWRkL3N1YnRyYWN0IGlycmVsZXZhbnQgc3R5bGVzXHJcbiAgICByZXR1cm4gXy50b1B4KFxyXG4gICAgICAgIHZhbCArIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0KFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnLFxyXG4gICAgICAgICAgICB2YWx1ZUlzQm9yZGVyQm94LFxyXG4gICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICApXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIENTU19FWFBBTkQgPSBfLnMoJ1RvcHxSaWdodHxCb3R0b218TGVmdCcpO1xyXG52YXIgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBleHRyYSwgaXNCb3JkZXJCb3gsIHN0eWxlcykge1xyXG4gICAgdmFyIHZhbCA9IDAsXHJcbiAgICAgICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIHRoZSByaWdodCBtZWFzdXJlbWVudCwgYXZvaWQgYXVnbWVudGF0aW9uXHJcbiAgICAgICAgaWR4ID0gKGV4dHJhID09PSAoaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JykpID9cclxuICAgICAgICAgICAgNCA6XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpbml0aWFsaXplIGZvciBob3Jpem9udGFsIG9yIHZlcnRpY2FsIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgKG5hbWUgPT09ICd3aWR0aCcpID9cclxuICAgICAgICAgICAgMSA6XHJcbiAgICAgICAgICAgIDAsXHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICAvLyBQdWxsZWQgb3V0IG9mIHRoZSBsb29wIHRvIHJlZHVjZSBzdHJpbmcgY29tcGFyaXNvbnNcclxuICAgICAgICBleHRyYUlzTWFyZ2luICA9IChleHRyYSA9PT0gJ21hcmdpbicpLFxyXG4gICAgICAgIGV4dHJhSXNDb250ZW50ID0gKCFleHRyYUlzTWFyZ2luICYmIGV4dHJhID09PSAnY29udGVudCcpLFxyXG4gICAgICAgIGV4dHJhSXNQYWRkaW5nID0gKCFleHRyYUlzTWFyZ2luICYmICFleHRyYUlzQ29udGVudCAmJiBleHRyYSA9PT0gJ3BhZGRpbmcnKTtcclxuXHJcbiAgICBmb3IgKDsgaWR4IDwgNDsgaWR4ICs9IDIpIHtcclxuICAgICAgICB0eXBlID0gQ1NTX0VYUEFORFtpZHhdO1xyXG5cclxuICAgICAgICAvLyBib3RoIGJveCBtb2RlbHMgZXhjbHVkZSBtYXJnaW4sIHNvIGFkZCBpdCBpZiB3ZSB3YW50IGl0XHJcbiAgICAgICAgaWYgKGV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgdmFsICs9IHBhcnNlSW50KHN0eWxlc1tleHRyYSArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQm9yZGVyQm94KSB7XHJcblxyXG4gICAgICAgICAgICAvLyBib3JkZXItYm94IGluY2x1ZGVzIHBhZGRpbmcsIHNvIHJlbW92ZSBpdCBpZiB3ZSB3YW50IGNvbnRlbnRcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNDb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gcGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBib3JkZXIgbm9yIG1hcmdpbiwgc28gcmVtb3ZlIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoIWV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBwYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlICsgJ1dpZHRoJ10pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQsIHNvIGFkZCBwYWRkaW5nXHJcbiAgICAgICAgICAgIHZhbCArPSBwYXJzZUludChzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBjb250ZW50IG5vciBwYWRkaW5nLCBzbyBhZGQgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzUGFkZGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFsICs9IHBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWw7XHJcbn07XHJcblxyXG52YXIgY3VyQ3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgY29tcHV0ZWQpIHtcclxuICAgIHZhciBzdHlsZSA9IGVsZW0uc3R5bGUsXHJcbiAgICAgICAgc3R5bGVzID0gY29tcHV0ZWQgfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICByZXQgPSBzdHlsZXMgPyBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKSB8fCBzdHlsZXNbbmFtZV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQXZvaWQgc2V0dGluZyByZXQgdG8gZW1wdHkgc3RyaW5nIGhlcmVcclxuICAgIC8vIHNvIHdlIGRvbid0IGRlZmF1bHQgdG8gYXV0b1xyXG4gICAgaWYgKCFleGlzdHMocmV0KSAmJiBzdHlsZSAmJiBzdHlsZVtuYW1lXSkgeyByZXQgPSBzdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgIC8vIEZyb20gdGhlIGhhY2sgYnkgRGVhbiBFZHdhcmRzXHJcbiAgICAvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXHJcblxyXG4gICAgaWYgKHN0eWxlcykge1xyXG4gICAgICAgIGlmIChyZXQgPT09ICcnICYmICFpc0F0dGFjaGVkKGVsZW0pKSB7XHJcbiAgICAgICAgICAgIHJldCA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgcmVndWxhciBwaXhlbCBudW1iZXJcclxuICAgICAgICAvLyBidXQgYSBudW1iZXIgdGhhdCBoYXMgYSB3ZWlyZCBlbmRpbmcsIHdlIG5lZWQgdG8gY29udmVydCBpdCB0byBwaXhlbHNcclxuICAgICAgICAvLyBidXQgbm90IHBvc2l0aW9uIGNzcyBhdHRyaWJ1dGVzLCBhcyB0aG9zZSBhcmUgcHJvcG9ydGlvbmFsIHRvIHRoZSBwYXJlbnQgZWxlbWVudCBpbnN0ZWFkXHJcbiAgICAgICAgLy8gYW5kIHdlIGNhbid0IG1lYXN1cmUgdGhlIHBhcmVudCBpbnN0ZWFkIGJlY2F1c2UgaXQgbWlnaHQgdHJpZ2dlciBhICdzdGFja2luZyBkb2xscycgcHJvYmxlbVxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeChyZXQpICYmICFSRUdFWC5wb3NpdGlvbihuYW1lKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICBycyA9IGVsZW0ucnVudGltZVN0eWxlLFxyXG4gICAgICAgICAgICAgICAgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDsgfVxyXG5cclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IChuYW1lID09PSAnZm9udFNpemUnKSA/ICcxZW0nIDogcmV0O1xyXG4gICAgICAgICAgICByZXQgPSBfLnRvUHgoc3R5bGUucGl4ZWxMZWZ0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IHJzTGVmdDsgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0ID09PSB1bmRlZmluZWQgPyByZXQgOiByZXQgKyAnJyB8fCAnYXV0byc7XHJcbn07XHJcblxyXG52YXIgbm9ybWFsaXplQ3NzS2V5ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgcmV0dXJuIFJFR0VYLmNhbWVsQ2FzZShuYW1lKTtcclxufTtcclxuXHJcbnZhciBzZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgZWxlbS5zdHlsZVtuYW1lXSA9ICh2YWx1ZSA9PT0gK3ZhbHVlKSA/IF8udG9QeCh2YWx1ZSkgOiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVtuYW1lXTtcclxufTtcclxuXHJcbnZhciBpc0hpZGRlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQ6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC5vZmZzZXRQYXJlbnRcclxuICAgIHJldHVybiBlbGVtLm9mZnNldFBhcmVudCA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAvLyBTdXBwb3J0OiBPcGVyYSA8PSAxMi4xMlxyXG4gICAgICAgICAgICAvLyBPcGVyYSByZXBvcnRzIG9mZnNldFdpZHRocyBhbmQgb2Zmc2V0SGVpZ2h0cyBsZXNzIHRoYW4gemVybyBvbiBzb21lIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwIHx8XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICgoZWxlbS5zdHlsZSAmJiBlbGVtLnN0eWxlLmRpc3BsYXkpID8gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgOiBmYWxzZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGN1ckNzczogY3VyQ3NzLFxyXG4gICAgd2lkdGg6ICBfd2lkdGgsXHJcbiAgICBoZWlnaHQ6IF9oZWlnaHQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjc3M6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwgbmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIGtleSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghaWR4KSB7IHJldHVybiByZXQ7IH0gLy8gcmV0dXJuIGVhcmx5XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXRbdmFsdWVdID0gZ2V0U3R5bGUoZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGhpZGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgc2hvdyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNCb29sZWFuKHN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gaXNIaWRkZW4oZWxlbSkgPyBzaG93KGVsZW0pIDogaGlkZShlbGVtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgyLCB0cnVlKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIEFDQ0VTU09SICA9ICdfX0RfaWRfXyAnLFxyXG4gICAgdW5pcXVlSWQgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoRGF0ZS5ub3coKSksXHJcblxyXG4gICAgZ2V0SWQgPSAoZWxlbSkgPT4gZWxlbSAmJiBlbGVtW0FDQ0VTU09SXSxcclxuXHJcbiAgICBnZXRPclNldElkID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIWVsZW0gfHwgKGlkID0gZWxlbVtBQ0NFU1NPUl0pKSB7IHJldHVybiBpZDsgfVxyXG4gICAgICAgIGVsZW1bQUNDRVNTT1JdID0gKGlkID0gdW5pcXVlSWQoKSk7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBbGxEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkLCBrZXkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuaGFzKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0RGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgaWQgPSBnZXRPclNldElkKGVsZW0pO1xyXG4gICAgICAgIHJldHVybiBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBbGxEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVEYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCwga2V5KTtcclxuICAgIH07XHJcblxyXG4vLyBUT0RPOiBBZGRyZXNzIEFQSVxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlbW92ZTogKGVsZW0sIHN0cikgPT5cclxuICAgICAgICBzdHIgPT09IHVuZGVmaW5lZCA/IHJlbW92ZUFsbERhdGEoZWxlbSkgOiByZW1vdmVEYXRhKGVsZW0sIHN0ciksXHJcblxyXG4gICAgRDoge1xyXG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXREYXRhKGVsZW0sIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShlbGVtLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9iamVjdCBwYXNzZWRcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5O1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGlzRWxlbWVudChlbGVtKSA/IGdldEFsbERhdGEoZWxlbSkgOiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhhc0RhdGE6IChlbGVtKSA9PlxyXG4gICAgICAgICAgICBpc0VsZW1lbnQoZWxlbSkgPyBoYXNEYXRhKGVsZW0pIDogdGhpcyxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlRGF0YShlbGVtLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaXNFbGVtZW50KGVsZW0pID8gcmVtb3ZlQWxsRGF0YShlbGVtKSA6IHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdldCBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCB2YWx1ZXMgZnJvbSBoYXNoIG1hcFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBnZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU2V0IGtleSdzIHZhbHVlXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBnZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1JZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2VsZW1JZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFycklkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoYXJySWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVthcnJJZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc051bWJlciA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgY3NzICAgICAgPSByZXF1aXJlKCcuL2NzcycpO1xyXG5cclxudmFyIGFkZCA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICB0b3RhbCA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIHRvdGFsICs9IChhcnJbaWR4XSB8fCAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgZ2V0SW5uZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gYWRkKFtcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChjc3Mud2lkdGguZ2V0KGVsZW0pKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nTGVmdCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nUmlnaHQnKSlcclxuICAgICAgICBdKTtcclxuICAgIH0sXHJcbiAgICBnZXRJbm5lckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gYWRkKFtcclxuICAgICAgICAgICAgcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChlbGVtKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1RvcCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nQm90dG9tJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE91dGVyV2lkdGggPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIGdldElubmVyV2lkdGgoZWxlbSksXHJcbiAgICAgICAgICAgIHdpdGhNYXJnaW4gPyBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkxlZnQnKSkgOiAwLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5SaWdodCcpKSA6IDAsXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyTGVmdFdpZHRoJykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclJpZ2h0V2lkdGgnKSlcclxuICAgICAgICBdKTtcclxuICAgIH0sXHJcbiAgICBnZXRPdXRlckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICByZXR1cm4gYWRkKFtcclxuICAgICAgICAgICAgZ2V0SW5uZXJIZWlnaHQoZWxlbSksXHJcbiAgICAgICAgICAgIHdpdGhNYXJnaW4gPyBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblRvcCcpKSA6IDAsXHJcbiAgICAgICAgICAgIHdpdGhNYXJnaW4gPyBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkJvdHRvbScpKSA6IDAsXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyVG9wV2lkdGgnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyQm90dG9tV2lkdGgnKSlcclxuICAgICAgICBdKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgd2lkdGg6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy53aWR0aC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhlaWdodDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLmhlaWdodC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lcldpZHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVyV2lkdGgoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lckhlaWdodDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lckhlaWdodChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVyV2lkdGg6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlcldpZHRoKGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlckhlaWdodDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVySGVpZ2h0KGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaGFuZGxlcnMgPSB7fTtcclxuXHJcbnZhciByZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUsIHR5cGUsIGZpbHRlcikge1xyXG4gICAgaGFuZGxlcnNbbmFtZV0gPSB7XHJcbiAgICAgICAgZXZlbnQ6IHR5cGUsXHJcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXHJcbiAgICAgICAgd3JhcDogZnVuY3Rpb24oZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIobmFtZSwgZm4pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgd3JhcHBlciA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcbiAgICBpZiAoIWZuKSB7IHJldHVybiBmbjsgfVxyXG5cclxuICAgIHZhciBrZXkgPSAnX19kY2VfJyArIG5hbWU7XHJcbiAgICBpZiAoZm5ba2V5XSkgeyByZXR1cm4gZm5ba2V5XTsgfVxyXG5cclxuICAgIHJldHVybiBmbltrZXldID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBtYXRjaCA9IGhhbmRsZXJzW25hbWVdLmZpbHRlcihlKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5yZWdpc3RlcignbGVmdC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAxICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdtaWRkbGUtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMiAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcigncmlnaHQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMyAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZWdpc3RlcjogcmVnaXN0ZXIsXHJcbiAgICBoYW5kbGVyczogaGFuZGxlcnNcclxufTsiLCJ2YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50JyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIG1hdGNoZXMgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgZGVsZWdhdGVzID0ge307XHJcblxyXG4vLyB0aGlzIG1ldGhvZCBjYWNoZXMgZGVsZWdhdGVzIHNvIHRoYXQgLm9mZigpIHdvcmtzIHNlYW1sZXNzbHlcclxudmFyIGRlbGVnYXRlID0gZnVuY3Rpb24ocm9vdCwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoZGVsZWdhdGVzW2ZuLl9kZF0pIHsgcmV0dXJuIGRlbGVnYXRlc1tmbi5fZGRdOyB9XHJcblxyXG4gICAgdmFyIGlkID0gZm4uX2RkID0gRGF0ZS5ub3coKTtcclxuICAgIHJldHVybiBkZWxlZ2F0ZXNbaWRdID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gcm9vdCkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGV2ZW50ZWQgPSBmdW5jdGlvbihtZXRob2QsIGVsLCB0eXBlLCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmICghZXhpc3RzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZm4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGRlbGVnYXRlKGVsLCBzZWxlY3RvciwgZm4pKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5hZGQpLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5yZW1vdmUpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5mYWJyaWNhdGUpXHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGRlbGVnYXRlICAgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyksXHJcbiAgICBjdXN0b20gICAgID0gcmVxdWlyZSgnLi9jdXN0b20nKTtcclxuXHJcbnZhciBldmVudGVyID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZXMsIGZpbHRlciwgZm4pIHtcclxuICAgICAgICB2YXIgdHlwZWxpc3QgPSB0eXBlcy5zcGxpdCgnICcpO1xyXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmbikpIHtcclxuICAgICAgICAgICAgZm4gPSBmaWx0ZXI7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0eXBlbGlzdCwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjdXN0b20uaGFuZGxlcnNbdHlwZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCBoYW5kbGVyLmV2ZW50LCBmaWx0ZXIsIGhhbmRsZXIud3JhcChmbikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgdHlwZSwgZmlsdGVyLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvbjogICAgICBldmVudGVyKGRlbGVnYXRlLm9uKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZXIoZGVsZWdhdGUub2ZmKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZXIoZGVsZWdhdGUudHJpZ2dlcilcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzRWxlbWVudCAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNIdG1sICAgICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzQ29sbGVjdGlvbiAgID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc1dpbmRvdyAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIG9yZGVyICAgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIGRhdGEgICAgICAgICAgID0gcmVxdWlyZSgnLi9kYXRhJyksXHJcbiAgICBwYXJzZXIgICAgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpO1xyXG5cclxudmFyIHBhcmVudExvb3AgPSBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVsZW1zKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaChlbGVtcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50O1xyXG4gICAgICAgICAgICBpZiAoZWxlbSAmJiAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoZWxlbSwgcGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciByZW1vdmUgPSBwYXJlbnRMb29wKGZ1bmN0aW9uKGVsZW0sIHBhcmVudCkge1xyXG4gICAgICAgIGRhdGEucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRldGFjaCA9IHBhcmVudExvb3AoZnVuY3Rpb24oZWxlbSwgcGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfSksXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnbWVudCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSAnJyArIHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHBhcnNlcihlbGVtKSwgcGVuZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgc3RyaW5nVG9GcmFnbWVudChyZXN1bHQpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0VsZW1lbnQocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkgPSBmdW5jdGlvbihhcnJPbmUsIGFyclR3bywgcGVuZGVyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyck9uZS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIGkgPSAwLCBsZW4gPSBhcnJUd28ubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoYXJyT25lW2lkeF0sIGFyclR3b1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5ID0gZnVuY3Rpb24oYXJyLCBlbGVtLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihhcnJFbGVtLCBlbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0gPSBmdW5jdGlvbihlbGVtLCBhcnIsIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGVsZW0sIGFyckVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgIH0sXHJcbiAgICBwcmVwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuaW5zZXJ0QmVmb3JlKGVsZW0sIGJhc2UuZmlyc3RDaGlsZCk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gXy5mYXN0bWFwKHRoaXMuc2xpY2UoKSwgKGVsZW0pID0+IGVsZW0uY2xvbmVOb2RlKHRydWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZ21lbnQodmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IHRhcmdldCAmJiB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICBpZiAoIXRhcmdldCB8fCAhcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IEQodGFyZ2V0KVswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGFyZ2V0LCBlbGVtLm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gdGFyZ2V0ICYmIHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghdGFyZ2V0IHx8ICFwYXJlbnQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gRChlbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGluc2VydEFmdGVyOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW0sIHRhcmdldCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgaWYgKGlzRChkKSkge1xyXG4gICAgICAgICAgICBkLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBvYmogPSBkO1xyXG4gICAgICAgIEQob2JqKS5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGlzSHRtbCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyKHZhbHVlKSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWdtZW50KHZhbHVlKSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNFbGVtZW50KHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgZWxlbSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgYXJyLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBEKGQpLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZWxlbXMgPSB0aGlzLFxyXG4gICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gZWxlbXNbaWR4XSxcclxuICAgICAgICAgICAgICAgIGRlc2NlbmRhbnRzID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCcqJyksXHJcbiAgICAgICAgICAgICAgICBpID0gZGVzY2VuZGFudHMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgZGVzYztcclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgZGVzYyA9IGRlc2NlbmRhbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5yZW1vdmUoZGVzYyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtcztcclxuICAgIH0sXHJcblxyXG4gICAgYWRkOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBlbGVtcyA9IHVuaXF1ZShcclxuICAgICAgICAgICAgdGhpcy5nZXQoKS5jb25jYXQoXHJcbiAgICAgICAgICAgICAgICAvLyBzdHJpbmdcclxuICAgICAgICAgICAgICAgIGlzU3RyaW5nKHNlbGVjdG9yKSA/IEQoc2VsZWN0b3IpLmdldCgpIDpcclxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb25cclxuICAgICAgICAgICAgICAgIGlzQ29sbGVjdGlvbihzZWxlY3RvcikgPyBfLnRvQXJyYXkoc2VsZWN0b3IpIDpcclxuICAgICAgICAgICAgICAgIC8vIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgIGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSB8fCBpc0VsZW1lbnQoc2VsZWN0b3IpID8gWyBzZWxlY3RvciBdIDogW11cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZW1vdmUoc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiByZW1vdmUodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGFjaDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGRldGFjaChzZWxlY3RvckZpbHRlcih0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkZXRhY2godGhpcyk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXR0YWNoZWQgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc09iamVjdCAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnaXMvbm9kZU5hbWUnKSxcclxuICAgIERPQ19FTEVNICAgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG52YXIgZ2V0UG9zaXRpb24gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogZWxlbS5vZmZzZXRUb3AgfHwgMCxcclxuICAgICAgICBsZWZ0OiBlbGVtLm9mZnNldExlZnQgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBnZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICB2YXIgcmVjdCA9IGlzQXR0YWNoZWQoZWxlbSkgPyBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDoge30sXHJcbiAgICAgICAgYm9keSA9IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6ICAocmVjdC50b3AgICsgYm9keS5zY3JvbGxUb3ApICB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IChyZWN0LmxlZnQgKyBib2R5LnNjcm9sbExlZnQpIHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgc2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSwgaWR4LCBwb3MpIHtcclxuICAgIHZhciBzdHlsZSAgICA9IGVsZW0uc3R5bGUsXHJcbiAgICAgICAgcG9zaXRpb24gPSBzdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJyxcclxuICAgICAgICBwcm9wcyAgICA9IHt9O1xyXG5cclxuICAgIC8vIHNldCBwb3NpdGlvbiBmaXJzdCwgaW4tY2FzZSB0b3AvbGVmdCBhcmUgc2V0IGV2ZW4gb24gc3RhdGljIGVsZW1cclxuICAgIGlmIChwb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHsgc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnOyB9XHJcblxyXG4gICAgdmFyIGN1ck9mZnNldCAgICAgICAgID0gZ2V0T2Zmc2V0KGVsZW0pLFxyXG4gICAgICAgIGN1ckNTU1RvcCAgICAgICAgID0gc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gc3R5bGUubGVmdCxcclxuICAgICAgICBjYWxjdWxhdGVQb3NpdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyB8fCBwb3NpdGlvbiA9PT0gJ2ZpeGVkJykgJiYgKGN1ckNTU1RvcCA9PT0gJ2F1dG8nIHx8IGN1ckNTU0xlZnQgPT09ICdhdXRvJyk7XHJcblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocG9zKSkge1xyXG4gICAgICAgIHBvcyA9IHBvcy5jYWxsKGVsZW0sIGlkeCwgY3VyT2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY3VyVG9wLCBjdXJMZWZ0O1xyXG4gICAgLy8gbmVlZCB0byBiZSBhYmxlIHRvIGNhbGN1bGF0ZSBwb3NpdGlvbiBpZiBlaXRoZXIgdG9wIG9yIGxlZnQgaXMgYXV0byBhbmQgcG9zaXRpb24gaXMgZWl0aGVyIGFic29sdXRlIG9yIGZpeGVkXHJcbiAgICBpZiAoY2FsY3VsYXRlUG9zaXRpb24pIHtcclxuICAgICAgICB2YXIgY3VyUG9zaXRpb24gPSBnZXRQb3NpdGlvbihlbGVtKTtcclxuICAgICAgICBjdXJUb3AgID0gY3VyUG9zaXRpb24udG9wO1xyXG4gICAgICAgIGN1ckxlZnQgPSBjdXJQb3NpdGlvbi5sZWZ0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdXJUb3AgID0gcGFyc2VGbG9hdChjdXJDU1NUb3ApICB8fCAwO1xyXG4gICAgICAgIGN1ckxlZnQgPSBwYXJzZUZsb2F0KGN1ckNTU0xlZnQpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV4aXN0cyhwb3MudG9wKSkgIHsgcHJvcHMudG9wICA9IChwb3MudG9wICAtIGN1ck9mZnNldC50b3ApICArIGN1clRvcDsgIH1cclxuICAgIGlmIChleGlzdHMocG9zLmxlZnQpKSB7IHByb3BzLmxlZnQgPSAocG9zLmxlZnQgLSBjdXJPZmZzZXQubGVmdCkgKyBjdXJMZWZ0OyB9XHJcblxyXG4gICAgc3R5bGUudG9wICA9IF8udG9QeChwcm9wcy50b3ApO1xyXG4gICAgc3R5bGUubGVmdCA9IF8udG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXQ6IGZ1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB8fCBpc09iamVjdChwb3NPckl0ZXJhdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+IHNldE9mZnNldChlbGVtLCBpZHgsIHBvc09ySXRlcmF0b3IpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldFBhcmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8ubWFwKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBlbGVtLm9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmIFxyXG4gICAgICAgICAgICAgICAgICAgICghaXNOb2RlTmFtZShvZmZzZXRQYXJlbnQsICdodG1sJykgJiYgKG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJykgPT09ICdzdGF0aWMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBub2RlVHlwZSAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHByb3BGaXggPSBfLnMoJ3RhYkluZGV4fHJlYWRPbmx5fGNsYXNzTmFtZXxtYXhMZW5ndGh8Y2VsbFNwYWNpbmd8Y2VsbFBhZGRpbmd8cm93U3Bhbnxjb2xTcGFufHVzZU1hcHxmcmFtZUJvcmRlcnxjb250ZW50RWRpdGFibGUnKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cikge1xyXG4gICAgICAgIG9ialtzdHIudG9Mb3dlckNhc2UoKV0gPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHtcclxuICAgICAgICAnZm9yJzogICAnaHRtbEZvcicsXHJcbiAgICAgICAgJ2NsYXNzJzogJ2NsYXNzTmFtZSdcclxuICAgIH0pO1xyXG5cclxudmFyIHByb3BIb29rcyA9IHtcclxuICAgIHNyYzogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhyZWY6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnaHJlZicsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3VwcG9ydDogU2FmYXJpLCBJRTkrXHJcbiAgICAvLyBtaXMtcmVwb3J0cyB0aGUgZGVmYXVsdCBzZWxlY3RlZCBwcm9wZXJ0eSBvZiBhbiBvcHRpb25cclxuICAgIC8vIEFjY2Vzc2luZyB0aGUgcGFyZW50J3Mgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBmaXhlcyBpdFxyXG4gICAgc2VsZWN0ZWQ6IFNVUFBPUlRTLm9wdFNlbGVjdGVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgICAgICBmaXg7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQuc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBhbHNvIHdvcmtzIHdpdGggb3B0Z3JvdXBzLCBzZWUgIzU3MDFcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5wYXJlbnROb2RlLnNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0YWJJbmRleDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBlbGVtLnRhYkluZGV4IGRvZXNuJ3QgYWx3YXlzIHJldHVybiB0aGUgY29ycmVjdCB2YWx1ZSB3aGVuIGl0IGhhc24ndCBiZWVuIGV4cGxpY2l0bHkgc2V0XHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9mbHVpZHByb2plY3Qub3JnL2Jsb2cvMjAwOC8wMS8wOS9nZXR0aW5nLXNldHRpbmctYW5kLXJlbW92aW5nLXRhYmluZGV4LXZhbHVlcy13aXRoLWphdmFzY3JpcHQvXHJcbiAgICAgICAgICAgIC8vIFVzZSBwcm9wZXIgYXR0cmlidXRlIHJldHJpZXZhbCgjMTIwNzIpXHJcbiAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhYmluZGV4KSB7IHJldHVybiBfLnBhcnNlSW50KHRhYmluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChSRUdFWC5pc0ZvY3VzYWJsZShub2RlTmFtZSkgfHwgKFJFR0VYLmlzQ2xpY2thYmxlKG5vZGVOYW1lKSAmJiBlbGVtLmhyZWYpKSA/IDAgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0T3JTZXRQcm9wID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIC8vIGRvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcclxuICAgIGlmICghZWxlbSB8fCBub2RlVHlwZS50ZXh0KGVsZW0pIHx8IG5vZGVUeXBlLmNvbW1lbnQoZWxlbSkgfHwgbm9kZVR5cGUuYXR0cihlbGVtKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3JTZXRQcm9wKGZpcnN0LCBwcm9wKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVQcm9wOiBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgZXhpc3RzICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBjb2VyY2VOdW0gPSAodmFsdWUpID0+XHJcbiAgICAvLyBJdHMgYSBudW1iZXIhIHx8IDAgdG8gYXZvaWQgTmFOIChhcyBOYU4ncyBhIG51bWJlcilcclxuICAgICt2YWx1ZSA9PT0gdmFsdWUgPyAodmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gQXZvaWQgTmFOIGFnYWluXHJcbiAgICBpc1N0cmluZyh2YWx1ZSkgPyAoK3ZhbHVlIHx8IDApIDpcclxuICAgIC8vIERlZmF1bHQgdG8gemVyb1xyXG4gICAgMDtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxMZWZ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbFRvcCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0cyA9IHRoaXMuZmluZCh0YXJnZXQpLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIGlzLm5vdCh0aGlzKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+ICFfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gIT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIEQoKTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gaXMubWF0Y2goZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gPT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGVja2VyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gY2hlY2tlci5jYWxsKGVsZW0sIGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiBEKCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgbm9kZVR5cGUgICAgICAgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLFxyXG4gICAgZXhpc3RzICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0F0dGFjaGVkICAgICAgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc0QgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyICAgID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIGdldFNpYmxpbmdzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNpYnMgPSBfZ2V0Tm9kZVNpYmxpbmdzKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJzLmxlbmd0aCkgeyByZXN1bHQucHVzaChzaWJzKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXROb2RlU2libGluZ3MgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNpYnMgPSBfLnRvQXJyYXkocGFyZW50LmNoaWxkcmVuKSxcclxuICAgICAgICAgICAgaWR4ICA9IHNpYnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgLy8gRXhjbHVkZSB0aGUgbm9kZSBpdHNlbGYgZnJvbSB0aGUgbGlzdCBvZiBpdHMgcGFyZW50J3MgY2hpbGRyZW5cclxuICAgICAgICAgICAgaWYgKHNpYnNbaWR4XSA9PT0gbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgc2licy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNpYnM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENoaWxkcmVuIC0tLS0tLVxyXG4gICAgZ2V0Q2hpbGRyZW4gPSAoYXJyKSA9PiBfLmZsYXR0ZW4oXy5tYXAoYXJyLCBfY2hpbGRyZW4pKSxcclxuICAgIF9jaGlsZHJlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIga2lkcyA9IGVsZW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgIGlkeCAgPSAwLCBsZW4gID0ga2lkcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGFyciAgPSBBcnJheShsZW4pO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0ga2lkc1tpZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnRzIC0tLS0tLVxyXG4gICAgZ2V0Q2xvc2VzdCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIGNsb3Nlc3QsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZWxlbXNbaWR4XSwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIHBhcmVudHMudW5zaGlmdChlbGVtc1tpZHhdKTtcclxuICAgICAgICAgICAgY2xvc2VzdCA9IHNlbGVjdG9yRmlsdGVyKHBhcmVudHMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKGNsb3Nlc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjbG9zZXN0WzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHMgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHNVbnRpbCA9IGZ1bmN0aW9uKGQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShkW2lkeF0sIG51bGwsIHN0b3BTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFNhZmVseSBnZXQgcGFyZW50IG5vZGVcclxuICAgIF9nZXROb2RlUGFyZW50ID0gKG5vZGUpID0+IG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlLFxyXG5cclxuICAgIF9jcmF3bFVwTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gbm9kZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKChwYXJlbnQgPSBfZ2V0Tm9kZVBhcmVudChwYXJlbnQpKSAgICAgJiZcclxuICAgICAgICAgICAgICAgIW5vZGVUeXBlLmRvYyhwYXJlbnQpICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgICAgICAgICAoIWNvbnRleHQgICAgICB8fCBwYXJlbnQgIT09IGNvbnRleHQpICYmXHJcbiAgICAgICAgICAgICAgICghc3RvcFNlbGVjdG9yIHx8ICFGaXp6bGUuaXMoc3RvcFNlbGVjdG9yKS5tYXRjaChwYXJlbnQpKSkge1xyXG4gICAgICAgICAgICBpZiAobm9kZVR5cGUuZWxlbShwYXJlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnQgLS0tLS0tXHJcbiAgICBnZXRQYXJlbnQgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gX2dldE5vZGVQYXJlbnQoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkgeyByZXN1bHQucHVzaChwYXJlbnQpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIF9wcmV2TmV4dENyYXdsID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBub2RlO1xyXG4gICAgICAgICAgICB3aGlsZSAoKGN1cnJlbnQgPSBjdXJyZW50W21ldGhvZF0pICYmICFub2RlVHlwZS5lbGVtKGN1cnJlbnQpKSB7fVxyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudDsgICAgXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBnZXRQcmV2ID0gX3ByZXZOZXh0Q3Jhd2woJ3ByZXZpb3VzU2libGluZycpLFxyXG4gICAgZ2V0TmV4dCA9IF9wcmV2TmV4dENyYXdsKCduZXh0U2libGluZycpLFxyXG5cclxuICAgIF9wcmV2TmV4dENyYXdsQWxsID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCAgPSBbXSxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBub2RlO1xyXG4gICAgICAgICAgICB3aGlsZSAoKGN1cnJlbnQgPSBjdXJyZW50W21ldGhvZF0pKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZVR5cGUuZWxlbShjdXJyZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBnZXRQcmV2QWxsID0gX3ByZXZOZXh0Q3Jhd2xBbGwoJ3ByZXZpb3VzU2libGluZycpLFxyXG4gICAgZ2V0TmV4dEFsbCA9IF9wcmV2TmV4dENyYXdsQWxsKCduZXh0U2libGluZycpLFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5nO1xyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2libGluZyAmJiAoIXNlbGVjdG9yIHx8IEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZykpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbEFsbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBmaWx0ZXIgPSBzZWxlY3RvciA/IGZ1bmN0aW9uKHNpYmxpbmcpIHsgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZyk7IH0gOiBleGlzdHM7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gXy5maWx0ZXIoc2libGluZ3MsIGZpbHRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsVW50aWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgaXRlcmF0b3I7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpdGVyYXRvciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc01hdGNoID0gaXMubWF0Y2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpYmxpbmdzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgdW5pcXVlU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCByZXZlcnNlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHVuaXF1ZShlbGVtcyk7XHJcbiAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBEKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlckFuZFNvcnQgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIHJldmVyc2UpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChzZWxlY3RvckZpbHRlcihlbGVtcywgc2VsZWN0b3IpLCByZXZlcnNlKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgY29udGVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLmZsYXR0ZW4oXHJcbiAgICAgICAgICAgICAgICBfLnBsdWNrKHRoaXMsICdjaGlsZE5vZGVzJylcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBvdXRPZkJvdW5kcyA9IC0xO1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIG91dE9mQm91bmRzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoc2VsZWN0b3IpLmluZGV4T2YoZmlyc3QpOyAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrICAgICAgICBcclxuICAgICAgICB2YXIgZmlyc3QgID0gdGhpc1swXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gZmlyc3QucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHsgcmV0dXJuIG91dE9mQm91bmRzOyB9XHJcblxyXG4gICAgICAgIC8vIGlzQXR0YWNoZWQgY2hlY2sgdG8gcGFzcyB0ZXN0IFwiTm9kZSB3aXRob3V0IHBhcmVudCByZXR1cm5zIC0xXCJcclxuICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IG5vZGVUeXBlLmRvY19mcmFnKHBhcmVudCk7XHJcblxyXG4gICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHsgcmV0dXJuIG91dE9mQm91bmRzOyB9XHJcblxyXG4gICAgICAgIHZhciBjaGlsZEVsZW1zID0gcGFyZW50LmNoaWxkcmVuIHx8IF8uZmlsdGVyKHBhcmVudC5jaGlsZE5vZGVzLCBub2RlVHlwZS5lbGVtKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtdLmluZGV4T2YuY2FsbChjaGlsZEVsZW1zLCBmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb3Nlc3Q6IGZ1bmN0aW9uKHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0Q2xvc2VzdCh0aGlzLCBzZWxlY3RvciwgY29udGV4dCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0UGFyZW50KHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0UGFyZW50cyh0aGlzKSwgc2VsZWN0b3IsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnRzVW50aWw6IGZ1bmN0aW9uKHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBhcmVudHNVbnRpbCh0aGlzLCBzdG9wU2VsZWN0b3IpLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2libGluZ3M6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0U2libGluZ3ModGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hpbGRyZW46IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0Q2hpbGRyZW4odGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldFByZXYsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbChnZXROZXh0LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dEFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsQWxsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZVbnRpbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsVW50aWwoZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dFVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIG5ld2xpbmVzICAgPSByZXF1aXJlKCd1dGlsL25ld2xpbmVzJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTnVtYmVyICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ2lzL25vZGVOYW1lJyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW07XHJcblxyXG52YXIgbm9ybWFsTm9kZU5hbWUgPSAoZWxlbSkgPT4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLFxyXG5cclxuICAgIG91dGVySHRtbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA/IHRoaXNbMF0ub3V0ZXJIVE1MIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgdGV4dEdldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSkgPT4gZWxlbS50ZXh0Q29udGVudCA6XHJcbiAgICAgICAgICAgIChlbGVtKSA9PiBlbGVtLmlubmVyVGV4dCxcclxuXHJcbiAgICB0ZXh0U2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0udGV4dENvbnRlbnQgPSBzdHIgOlxyXG4gICAgICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLmlubmVyVGV4dCA9IHN0cjtcclxuXHJcbnZhciB2YWxIb29rcyA9IHtcclxuICAgIG9wdGlvbjoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgIHJldHVybiAoZXhpc3RzKHZhbCkgPyB2YWwgOiB0ZXh0R2V0KGVsZW0pKS50cmltKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZWxlY3Q6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlLCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgaW5kZXggICA9IGVsZW0uc2VsZWN0ZWRJbmRleCxcclxuICAgICAgICAgICAgICAgIG9uZSAgICAgPSBlbGVtLnR5cGUgPT09ICdzZWxlY3Qtb25lJyB8fCBpbmRleCA8IDAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gb25lID8gbnVsbCA6IFtdLFxyXG4gICAgICAgICAgICAgICAgbWF4ICAgICA9IG9uZSA/IGluZGV4ICsgMSA6IG9wdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IGluZGV4IDwgMCA/IG1heCA6IChvbmUgPyBpbmRleCA6IDApO1xyXG5cclxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgc2VsZWN0ZWQgb3B0aW9uc1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbWF4OyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgob3B0aW9uLnNlbGVjdGVkIHx8IGlkeCA9PT0gaW5kZXgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgcmV0dXJuIG9wdGlvbnMgdGhhdCBhcmUgZGlzYWJsZWQgb3IgaW4gYSBkaXNhYmxlZCBvcHRncm91cFxyXG4gICAgICAgICAgICAgICAgICAgIChTVVBQT1JUUy5vcHREaXNhYmxlZCA/ICFvcHRpb24uZGlzYWJsZWQgOiBvcHRpb24uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpID09PSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICghb3B0aW9uLnBhcmVudE5vZGUuZGlzYWJsZWQgfHwgIWlzTm9kZU5hbWUob3B0aW9uLnBhcmVudE5vZGUsICdvcHRncm91cCcpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHNwZWNpZmljIHZhbHVlIGZvciB0aGUgb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgYW4gYXJyYXkgZm9yIG9uZSBzZWxlY3RzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aS1TZWxlY3RzIHJldHVybiBhbiBhcnJheVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICB9LFxyXG4gICAgICAgXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9uU2V0LCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IF8ubWFrZUFycmF5KHZhbHVlKSxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBvcHRpb25zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKHZhbHVlcywgdmFsSG9va3Mub3B0aW9uLmdldChvcHRpb24pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IG9wdGlvblNldCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGb3JjZSBicm93c2VycyB0byBiZWhhdmUgY29uc2lzdGVudGx5IHdoZW4gbm9uLW1hdGNoaW5nIHZhbHVlIGlzIHNldFxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvblNldCkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZWxlY3RlZEluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuLy8gUmFkaW8gYW5kIGNoZWNrYm94IGdldHRlciBmb3IgV2Via2l0XHJcbmlmICghU1VQUE9SVFMuY2hlY2tPbikge1xyXG4gICAgXy5lYWNoKFsncmFkaW8nLCAnY2hlY2tib3gnXSwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIHZhbEhvb2tzW3R5cGVdID0ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQ6IFdlYmtpdCAtICcnIGlzIHJldHVybmVkIGluc3RlYWQgb2YgJ29uJyBpZiBhIHZhbHVlIGlzbid0IHNwZWNpZmllZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpID09PSBudWxsID8gJ29uJyA6IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBnZXRWYWwgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTm9kZU5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5nZXQpIHtcclxuICAgICAgICByZXR1cm4gaG9vay5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXNTdHJpbmcodmFsKSA/IG5ld2xpbmVzKHZhbCkgOiB2YWw7XHJcbn07XHJcblxyXG52YXIgc3RyaW5naWZ5ID0gKHZhbHVlKSA9PlxyXG4gICAgIWV4aXN0cyh2YWx1ZSkgPyAnJyA6ICh2YWx1ZSArICcnKTtcclxuXHJcbnZhciBzZXRWYWwgPSBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIFN0cmluZ2lmeSB2YWx1ZXNcclxuICAgIHZhciB2YWx1ZSA9IGlzQXJyYXkodmFsKSA/IF8ubWFwKHZhbCwgc3RyaW5naWZ5KSA6IHN0cmluZ2lmeSh2YWwpO1xyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOb2RlTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLnNldCkge1xyXG4gICAgICAgIGhvb2suc2V0KGVsZW0sIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIG91dGVySHRtbDogb3V0ZXJIdG1sLFxyXG4gICAgb3V0ZXJIVE1MOiBvdXRlckh0bWwsXHJcblxyXG4gICAgaHRtbDogZnVuY3Rpb24oaHRtbCkge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhodG1sKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBlbGVtLmlubmVySFRNTCA9IGh0bWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oaHRtbCkpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gaHRtbDtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZWxlbS5pbm5lckhUTUwpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIHJldHVybiAhZmlyc3QgPyB1bmRlZmluZWQgOiBmaXJzdC5pbm5lckhUTUw7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAvLyBnZXR0ZXJcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgJycpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBnZXRWYWwoZWxlbSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFZhbChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0dGVyc1xyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzdHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHRleHRTZXQoZWxlbSwgc3RyKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzdHIpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHN0cjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgdGV4dEdldChlbGVtKSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAodGhpcywgdGV4dEdldCkuam9pbignJyk7XHJcbiAgICB9XHJcbn07IiwidmFyIGlzID0gZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuIChlbGVtKSA9PiBlbGVtICYmIGVsZW0ubm9kZVR5cGUgPT09IHg7XHJcbn07XHJcblxyXG4vLyBjb21tZW50ZWQtb3V0IG1ldGhvZHMgYXJlIG5vdCBiZWluZyB1c2VkXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZWxlbTogaXMoMSksXHJcbiAgICBhdHRyOiBpcygyKSxcclxuICAgIHRleHQ6IGlzKDMpLFxyXG4gICAgLy8gY2RhdGE6IGlzKDQpLFxyXG4gICAgLy8gZW50aXR5X3JlZmVyZW5jZTogaXMoNSksXHJcbiAgICAvLyBlbnRpdHk6IGlzKDYpLFxyXG4gICAgLy8gcHJvY2Vzc2luZ19pbnN0cnVjdGlvbjogaXMoNyksXHJcbiAgICBjb21tZW50OiBpcyg4KSxcclxuICAgIGRvYzogaXMoOSksXHJcbiAgICAvLyBkb2N1bWVudF90eXBlOiBpcygxMCksXHJcbiAgICBkb2NfZnJhZzogaXMoMTEpXHJcbiAgICAvLyBub3RhdGlvbjogaXMoMTIpLFxyXG59OyIsInZhciByZWFkeSA9IGZhbHNlLFxyXG4gICAgcmVnaXN0cmF0aW9uID0gW107XHJcblxyXG52YXIgd2FpdCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbndhaXQoZnVuY3Rpb24oKSB7XHJcbiAgICByZWFkeSA9IHRydWU7XHJcblxyXG4gICAgLy8gY2FsbCByZWdpc3RlcmVkIG1ldGhvZHMgICAgXHJcbiAgICB3aGlsZSAocmVnaXN0cmF0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbi5zaGlmdCgpKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoY2FsbGJhY2spID0+XHJcbiAgICByZWFkeSA/IGNhbGxiYWNrKCkgOiByZWdpc3RyYXRpb24ucHVzaChjYWxsYmFjayk7XHJcbiIsInZhciBpc0F0dGFjaGVkICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2NvbXBhcmluZy1kb2N1bWVudC1wb3NpdGlvbi9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICBDT05UQUlORURfQlkgPSAxNixcclxuICAgIEZPTExPV0lORyAgICA9IDQsXHJcbiAgICBESVNDT05ORUNURUQgPSAxO1xyXG5cclxudmFyIGlzID0gKHJlbCwgZmxhZykgPT4gKHJlbCAmIGZsYWcpID09PSBmbGFnLFxyXG5cclxuICAgIGlzTm9kZSA9IChiLCBmbGFnLCBhKSA9PiBpcyhhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpLCBmbGFnKSxcclxuXHJcbiAgICBoYXNEdXBsaWNhdGUgPSBmYWxzZTtcclxuXHJcbnZhciBzb3J0ID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XHJcbiAgICAvLyBGbGFnIGZvciBkdXBsaWNhdGUgcmVtb3ZhbFxyXG4gICAgaWYgKG5vZGUxID09PSBub2RlMikge1xyXG4gICAgICAgIGhhc0R1cGxpY2F0ZSA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm9kZXMgc2hhcmUgdGhlIHNhbWUgZG9jdW1lbnRcclxuICAgIHZhciByZWwgPSAobm9kZTEub3duZXJEb2N1bWVudCB8fCBub2RlMSkgPT09IChub2RlMi5vd25lckRvY3VtZW50IHx8IG5vZGUyKSA/XHJcbiAgICAgICAgLy8gdGhlbiBjb21wYXJlIHBvc2l0aW9uXHJcbiAgICAgICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZTIpIDpcclxuICAgICAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgICAgICBESVNDT05ORUNURUQ7XHJcblxyXG4gICAgLy8gTm90IGRpcmVjdGx5IGNvbXBhcmFibGVcclxuICAgIGlmICghcmVsKSB7IHJldHVybiAwOyB9XHJcblxyXG4gICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICBpZiAoaXMocmVsLCBESVNDT05ORUNURUQpKSB7XHJcbiAgICAgICAgdmFyIGlzTm9kZTFEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMSksXHJcbiAgICAgICAgICAgIGlzTm9kZTJEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgIC8vIHNvcnQgb3JkZXJcclxuICAgICAgICByZXR1cm4gaXNOb2RlMURpc2Nvbm5lY3RlZCAmJiBpc05vZGUyRGlzY29ubmVjdGVkID8gMCA6XHJcbiAgICAgICAgICAgIGlzTm9kZTJEaXNjb25uZWN0ZWQgPyAtMSA6IDE7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzKHJlbCwgRk9MTE9XSU5HKSA/IC0xIDogMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0cyBhbiBhcnJheSBvZiBEIGVsZW1lbnRzIGluLXBsYWNlIChpLmUuLCBtdXRhdGVzIHRoZSBvcmlnaW5hbCBhcnJheSlcclxuICogaW4gZG9jdW1lbnQgb3JkZXIgYW5kIHJldHVybnMgd2hldGhlciBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtFbGVtZW50W119IGFycmF5ICAgICAgICAgIEFycmF5IG9mIEQgZWxlbWVudHMuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gIFtyZXZlcnNlPWZhbHNlXSBJZiBhIHRydXRoeSB2YWx1ZSBpcyBwYXNzZWQsIHRoZSBnaXZlbiBhcnJheSB3aWxsIGJlIHJldmVyc2VkLlxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAqIEBzZWUgalF1ZXJ5IHNyYy9zZWxlY3Rvci1uYXRpdmUuanM6MzdcclxuICovXHJcbmV4cG9ydHMuc29ydCA9IGZ1bmN0aW9uKGFycmF5LCByZXZlcnNlKSB7XHJcbiAgICBoYXNEdXBsaWNhdGUgPSBmYWxzZTtcclxuICAgIGFycmF5LnNvcnQoc29ydCk7XHJcbiAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgIGFycmF5LnJldmVyc2UoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBoYXNEdXBsaWNhdGU7XHJcbn07XHJcblxyXG4vKipcclxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgLlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGEgRCBlbGVtZW50IG5vZGVcclxuICogQHBhcmFtIHtFbGVtZW50fSBiIEQgZWxlbWVudCBub2RlXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgOyBvdGhlcndpc2UgZmFsc2UuXHJcbiAqL1xyXG5leHBvcnRzLmNvbnRhaW5zID0gZnVuY3Rpb24oYSwgYikge1xyXG4gICAgdmFyIGJVcCA9IGlzQXR0YWNoZWQoYikgPyBiLnBhcmVudE5vZGUgOiBudWxsO1xyXG5cclxuICAgIGlmIChhID09PSBiVXApIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNFbGVtZW50KGJVcCkpIHtcclxuICAgICAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgKElFOSspXHJcbiAgICAgICAgaWYgKGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzTm9kZShiVXAsIENPTlRBSU5FRF9CWSwgYSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuIiwidmFyIFJFR0VYID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIE1BWF9TSU5HTEVfVEFHX0xFTkdUSCA9IDMwLFxyXG4gICAgY3JlYXRlID0gcmVxdWlyZSgnRElWL2NyZWF0ZScpO1xyXG5cclxudmFyIHBhcnNlU3RyaW5nID0gZnVuY3Rpb24ocGFyZW50VGFnTmFtZSwgaHRtbFN0cikge1xyXG4gICAgdmFyIHBhcmVudCA9IGNyZWF0ZShwYXJlbnRUYWdOYW1lKTtcclxuICAgIHBhcmVudC5pbm5lckhUTUwgPSBodG1sU3RyO1xyXG4gICAgcmV0dXJuIHBhcmVudDtcclxufTtcclxuXHJcbnZhciBwYXJzZVNpbmdsZVRhZyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIGlmIChodG1sU3RyLmxlbmd0aCA+IE1BWF9TSU5HTEVfVEFHX0xFTkdUSCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHZhciBzaW5nbGVUYWdNYXRjaCA9IFJFR0VYLnNpbmdsZVRhZ01hdGNoKGh0bWxTdHIpO1xyXG4gICAgcmV0dXJuIHNpbmdsZVRhZ01hdGNoID8gW2NyZWF0ZShzaW5nbGVUYWdNYXRjaFsxXSldIDogbnVsbDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgdmFyIHNpbmdsZVRhZyA9IHBhcnNlU2luZ2xlVGFnKGh0bWxTdHIpO1xyXG4gICAgaWYgKHNpbmdsZVRhZykgeyByZXR1cm4gc2luZ2xlVGFnOyB9XHJcblxyXG4gICAgdmFyIHBhcmVudFRhZ05hbWUgPSBSRUdFWC5nZXRQYXJlbnRUYWdOYW1lKGh0bWxTdHIpLFxyXG4gICAgICAgIHBhcmVudCAgICAgICAgPSBwYXJzZVN0cmluZyhwYXJlbnRUYWdOYW1lLCBodG1sU3RyKTtcclxuXHJcbiAgICB2YXIgY2hpbGQsXHJcbiAgICAgICAgaWR4ID0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCxcclxuICAgICAgICBhcnIgPSBBcnJheShpZHgpO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2hpbGRyZW5baWR4XTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIGFycltpZHhdID0gY2hpbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyZW50ID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnLi9EJyksXHJcbiAgICBwYXJzZXIgICAgID0gcmVxdWlyZSgncGFyc2VyJyksXHJcbiAgICBGaXp6bGUgICAgID0gcmVxdWlyZSgnRml6emxlJyksXHJcbiAgICBkYXRhICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9kYXRhJyk7XHJcblxyXG52YXIgcGFyc2VIdG1sID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICBpZiAoIXN0cikgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgdmFyIHJlc3VsdCA9IHBhcnNlcihzdHIpO1xyXG4gICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoID8gRChyZXN1bHQpIDogbnVsbDtcclxufTtcclxuXHJcbl8uZXh0ZW5kKEQsXHJcbiAgICBkYXRhLkQsXHJcbntcclxuICAgIC8vIEJlY2F1c2Ugbm8gb25lIGtub3cgd2hhdCB0aGUgY2FzZSBzaG91bGQgYmVcclxuICAgIHBhcnNlSHRtbDogcGFyc2VIdG1sLFxyXG4gICAgcGFyc2VIVE1MOiBwYXJzZUh0bWwsXHJcblxyXG4gICAgLy8gZXhwb3NlIHRoZSBzZWxlY3RvciBlbmdpbmUgZm9yIGRlYnVnZ2luZ1xyXG4gICAgRml6emxlOiAgRml6emxlLFxyXG5cclxuICAgIGVhY2g6ICAgIF8uanFFYWNoLFxyXG4gICAgZm9yRWFjaDogXy5kRWFjaCxcclxuICAgIGV4dGVuZDogIF8uZXh0ZW5kLFxyXG5cclxuICAgIG1vcmVDb25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmpRdWVyeSA9IHdpbmRvdy5aZXB0byA9IHdpbmRvdy4kID0gRDtcclxuICAgIH1cclxufSk7XHJcbiIsInZhciBfICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgID0gcmVxdWlyZSgnLi9EJyksXHJcbiAgICBhcnJheSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXJyYXknKSxcclxuICAgIHNlbGVjdG9ycyAgID0gcmVxdWlyZSgnbW9kdWxlcy9zZWxlY3RvcnMnKSxcclxuICAgIHRyYW5zdmVyc2FsID0gcmVxdWlyZSgnbW9kdWxlcy90cmFuc3ZlcnNhbCcpLFxyXG4gICAgZGltZW5zaW9ucyAgPSByZXF1aXJlKCdtb2R1bGVzL2RpbWVuc2lvbnMnKSxcclxuICAgIG1hbmlwICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9tYW5pcCcpLFxyXG4gICAgY3NzICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2NzcycpLFxyXG4gICAgYXR0ciAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2F0dHInKSxcclxuICAgIHByb3AgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9wcm9wJyksXHJcbiAgICB2YWwgICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvdmFsJyksXHJcbiAgICBwb3NpdGlvbiAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcG9zaXRpb24nKSxcclxuICAgIGNsYXNzZXMgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jbGFzc2VzJyksXHJcbiAgICBzY3JvbGwgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2Nyb2xsJyksXHJcbiAgICBkYXRhICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpLFxyXG4gICAgZXZlbnRzICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2V2ZW50cycpO1xyXG5cclxudmFyIGFycmF5UHJvdG8gPSBfLnMoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIFNVUFBPUlRTID0gcmVxdWlyZSgnU1VQUE9SVFMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1VQUE9SVFMudmFsdWVOb3JtYWxpemVkID9cclxuICAgIChzdHIpID0+IHN0ciA6XHJcbiAgICAoc3RyKSA9PiBzdHIgPyBzdHIucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKSA6IHN0cjsiLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgc3RhcnQsIGVuZCkge1xyXG4gICAgLy8gRXhpdCBlYXJseSBmb3IgZW1wdHkgYXJyYXlcclxuICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIC8vIEVuZCwgbmF0dXJhbGx5LCBoYXMgdG8gYmUgaGlnaGVyIHRoYW4gMCB0byBtYXR0ZXIsXHJcbiAgICAvLyBzbyBhIHNpbXBsZSBleGlzdGVuY2UgY2hlY2sgd2lsbCBkb1xyXG4gICAgaWYgKGVuZCkgeyByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0LCBlbmQpOyB9XHJcblxyXG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCB8fCAwKTtcclxufTsiLCJ2YXIgaWQgPSAwO1xyXG52YXIgdW5pcXVlSWQgPSBtb2R1bGUuZXhwb3J0cyA9ICgpID0+IGlkKys7XHJcbnVuaXF1ZUlkLnNlZWQgPSBmdW5jdGlvbihzZWVkZWQsIHByZSkge1xyXG4gICAgdmFyIHByZWZpeCA9IHByZSB8fCAnJyxcclxuICAgICAgICBzZWVkID0gc2VlZGVkIHx8IDA7XHJcbiAgICByZXR1cm4gKCkgPT4gcHJlZml4ICsgc2VlZCsrO1xyXG59OyJdfQ==
