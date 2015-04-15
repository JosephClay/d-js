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
        _.merge(this, Fizzle.query(selector).exec(this, true));
        return this;
    }

    // document ready
    if (isFunction(selector)) {
        onready(selector);
    }

    // Array of Elements, NodeList, or D object
    if (isArrayLike(selector)) {
        _.merge(this, selector);
        return this;
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

},{"REGEX":13,"_":15,"is/element":24,"is/exists":25,"is/nodeList":28,"matchesSelector":35,"util/uniqueId":64}],9:[function(require,module,exports){
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

// having caches isn't actually faster
// for a majority of use cases for string
// manipulations
// http://jsperf.com/simple-cache-for-string-manip
module.exports = {
    // TODO:
    numNotPx: function numNotPx(val) {
        return NUM_NON_PX.test(val);
    },
    position: function position(val) {
        return POSITION.test(val);
    },
    singleTagMatch: function singleTagMatch(val) {
        return SINGLE_TAG.exec(val);
    },
    isNoneOrTable: function isNoneOrTable(str) {
        return NONE_OR_TABLE.test(str);
    },
    isFocusable: function isFocusable(str) {
        return TYPE_TEST_FOCUSABLE.test(str);
    },
    isClickable: function isClickable(str) {
        return TYPE_TEST_CLICKABLE.test(str);
    },
    isStrictId: function isStrictId(str) {
        return SELECTOR_ID.test(str);
    },
    isTag: function isTag(str) {
        return SELECTOR_TAG.test(str);
    },
    isClass: function isClass(str) {
        return SELECTOR_CLASS.test(str);
    },
    isBoolAttr: function isBoolAttr(str) {
        return IS_BOOL_ATTR.test(str);
    },

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

    // TODO:
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
    exists = require('is/exists'),
    slice = require('util/slice'),
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
        _.dEach(this, iterator);
        return this;
    },

    forEach: function forEach(iterator) {
        _.dEach(this, iterator);
        return this;
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

},{"REGEX":13,"_":15,"is/array":18,"is/attached":20,"is/boolean":21,"is/document":23,"is/element":24,"is/exists":25,"is/number":30,"is/object":31,"is/string":33,"is/window":34,"nodeType":55,"util/split":63}],42:[function(require,module,exports){
// TODO: Only place bi level caching is used now...figure out how to remove
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

},{"cache":16,"is/array":18,"is/element":24,"is/string":33,"util/uniqueId":64}],43:[function(require,module,exports){
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
        var idx = 0,
            length = elems.length,
            elem,
            parent;
        for (; idx < length; idx++) {
            elem = elems[idx];
            if (elem && (parent = elem.parentNode)) {
                iterator(elem, parent);
            }
        }
        return elems;
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

    elem.style.top = _.toPx(props.top);
    elem.style.left = _.toPx(props.left);
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
    split = require('util/split'),
    SUPPORTS = require('SUPPORTS'),
    nodeType = require('nodeType'),
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

},{"REGEX":13,"SUPPORTS":14,"_":15,"is/function":26,"is/string":33,"nodeType":55,"util/split":63}],50:[function(require,module,exports){
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
        filter;

    if (selector) {
        filter = function (sibling) {
            return Fizzle.is(selector).match(sibling);
        };
    }

    for (idx = 0; idx < len; idx++) {
        siblings = getter(d[idx]);
        if (selector) {
            siblings = _.filter(siblings, filter || exists);
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
        if (!this.length) {
            return -1;
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
            return -1;
        }

        // isAttached check to pass test "Node without parent returns -1"
        // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
        var attached = isAttached(first),
            isParentFragment = nodeType.doc_frag(parent);

        if (!attached && !isParentFragment) {
            return -1;
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

                // TODO: IE6-8 bug. remove
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

        return _.map(this, function (elem) {
            return textGet(elem);
        }).join('');
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

// Compare Position - MIT Licensed, John Resig
var comparePosition = function comparePosition(node1, node2) {
    return node1.compareDocumentPosition ? node1.compareDocumentPosition(node2) : 0;
},
    is = function is(rel, flag) {
    return (rel & flag) === flag;
},
    isNode = function isNode(b, flag, a) {
    return is(comparePosition(a, b), flag);
},
    hasDuplicate = false;

var sort = function sort(node1, node2) {
    // Flag for duplicate removal
    if (node1 === node2) {
        hasDuplicate = true;
        return 0;
    }

    // Sort on method existence if only one input has compareDocumentPosition
    var rel = !node1.compareDocumentPosition - !node2.compareDocumentPosition;
    if (rel) {
        return rel;
    }

    // Nodes share the same document
    if ((node1.ownerDocument || node1) === (node2.ownerDocument || node2)) {
        rel = comparePosition(node1, node2);
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
    split = require('util/split'),
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

var arrayProto = split('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight|map|filter').reduce(function (obj, key) {
    obj[key] = Array.prototype[key];
    return obj;
}, {});

// Expose the prototype so that
// it can be hooked into for plugins
D.fn = D.prototype;

_.extend(D.fn, { constructor: D }, arrayProto, array.fn, selectors.fn, transversal.fn, manip.fn, dimensions.fn, css.fn, attr.fn, prop.fn, val.fn, classes.fn, position.fn, scroll.fn, data.fn, events.fn);

},{"./D":3,"_":15,"modules/array":36,"modules/attr":39,"modules/classes":40,"modules/css":41,"modules/data":42,"modules/dimensions":43,"modules/events":46,"modules/manip":47,"modules/position":48,"modules/prop":49,"modules/scroll":50,"modules/selectors":52,"modules/transversal":53,"modules/val":54,"util/split":63}],61:[function(require,module,exports){
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
// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
'use strict';

module.exports = function (str, delimiter) {
  return str.split(delimiter || '|');
};

},{}],64:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL2lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9xdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvcHJveHkuanNvbiIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ub2RlTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvbnVtYmVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9vYmplY3QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9zdHJpbmcuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3dpbmRvdy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbWF0Y2hlc1NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L21hcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZVR5cGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zbGljZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zcGxpdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztBQ0ZuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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SUFBSSxHQUFHLENBQUM7Q0FBQSxDQUFDOzs7OztBQ0ZqRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDWCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHO1dBQU0sRUFBRSxFQUFFO0NBQUEsQ0FBQztBQUMzQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVMsTUFBTSxFQUFFLEdBQUcsRUFBRTtBQUNsQyxRQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksRUFBRTtRQUNsQixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUN2QixXQUFPO2VBQU0sTUFBTSxHQUFHLElBQUksRUFBRTtLQUFBLENBQUM7Q0FDaEMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vRCcpO1xyXG5yZXF1aXJlKCcuL3Byb3BzJyk7XHJcbnJlcXVpcmUoJy4vcHJvdG8nKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCB1bndyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSkge1xuICB2YXIgZTtcbiAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ICA9IGUucHJldmVudERlZmF1bHQgIHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCdpcy9hcnJheUxpa2UnKSxcclxuICAgIGlzSHRtbCAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgcGFyc2VyICAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIG9ucmVhZHkgICAgID0gcmVxdWlyZSgnb25yZWFkeScpLFxyXG4gICAgRml6emxlICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBBcGkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBEKHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEFwaSk7XHJcblxyXG5mdW5jdGlvbiBEKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgLy8gbm90aGluXHJcbiAgICBpZiAoIXNlbGVjdG9yKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgLy8gZWxlbWVudCBvciB3aW5kb3cgKGRvY3VtZW50cyBoYXZlIGEgbm9kZVR5cGUpXHJcbiAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUgfHwgc2VsZWN0b3IgPT09IHdpbmRvdykge1xyXG4gICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcclxuICAgICAgICB0aGlzLmxlbmd0aCA9IDE7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSFRNTCBzdHJpbmdcclxuICAgIGlmIChpc0h0bWwoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBwYXJzZXIoc2VsZWN0b3IpKTtcclxuICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTdHJpbmdcclxuICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBGaXp6bGUucXVlcnkoc2VsZWN0b3IpLmV4ZWModGhpcywgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvY3VtZW50IHJlYWR5XHJcbiAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICBvbnJlYWR5KHNlbGVjdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBvZiBFbGVtZW50cywgTm9kZUxpc3QsIG9yIEQgb2JqZWN0XHJcbiAgICBpZiAoaXNBcnJheUxpa2Uoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuRC5wcm90b3R5cGUgPSBBcGkucHJvdG90eXBlOyIsIm1vZHVsZS5leHBvcnRzID0gKHRhZykgPT4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpOyIsInZhciBkaXYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY3JlYXRlJykoJ2RpdicpO1xyXG5cclxuZGl2LmlubmVySFRNTCA9ICc8YSBocmVmPVwiL2FcIj5hPC9hPic7IiwidmFyIF8gPSByZXF1aXJlKCdfJyk7XHJcblxyXG52YXIgbWF0Y2ggPSBmdW5jdGlvbihjb250ZXh0LCBzZWxlY3RvcnMpIHtcclxuICAgIHZhciBpZHggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgaWYgKHNlbGVjdG9yc1tpZHhdLm1hdGNoKGNvbnRleHQpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBJcyhzZWxlY3RvcnMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoKGNvbnRleHQsIHNlbGVjdG9ycyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYW55OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICAgICBtYXRjaChlbGVtLCBzZWxlY3RvcnMpID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICAgICAhbWF0Y2goZWxlbSwgc2VsZWN0b3JzKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07IiwidmFyIGZpbmQgPSBmdW5jdGlvbihzZWxlY3RvcnMsIGNvbnRleHQpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHNlbGVjdG9yc1tpZHhdLmV4ZWMoY29udGV4dCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gUXVlcnkoc2VsZWN0b3JzKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGV4ZWM6IGZ1bmN0aW9uKGFyciwgaXNOZXcpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoZmluZChzZWxlY3RvcnMsIGFycltpZHhdKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIG1hdGNoZXMgICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIHVuaXF1ZUlkICAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZCgwLCAnX0QnICsgRGF0ZS5ub3coKSksXHJcblxyXG4gICAgR0VUX0VMRU1FTlRfQllfSUQgICAgICAgICAgPSAnZ2V0RWxlbWVudEJ5SWQnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FICAgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUUgPSAnZ2V0RWxlbWVudHNCeUNsYXNzTmFtZScsXHJcbiAgICBRVUVSWV9TRUxFQ1RPUl9BTEwgICAgICAgICA9ICdxdWVyeVNlbGVjdG9yQWxsJztcclxuXHJcbnZhciBkZXRlcm1pbmVNZXRob2QgPSAoc2VsZWN0b3IpID0+XHJcbiAgICAgICAgUkVHRVguaXNTdHJpY3RJZChzZWxlY3RvcikgPyBHRVRfRUxFTUVOVF9CWV9JRCA6XHJcbiAgICAgICAgUkVHRVguaXNDbGFzcyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA6XHJcbiAgICAgICAgUkVHRVguaXNUYWcoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FIDogICAgICAgXHJcbiAgICAgICAgUVVFUllfU0VMRUNUT1JfQUxMLFxyXG5cclxuICAgIHByb2Nlc3NRdWVyeVNlbGVjdGlvbiA9IChzZWxlY3Rpb24pID0+XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uIG9yIGEgTm9kZWxpc3Qgd2l0aG91dCBhIGxlbmd0aFxyXG4gICAgICAgIC8vIHNob3VsZCByZXN1bHQgaW4gbm90aGluZ1xyXG4gICAgICAgICFzZWxlY3Rpb24gfHwgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkgPyBbXSA6XHJcbiAgICAgICAgLy8gSWYgaXQncyBhbiBpZCBzZWxlY3Rpb24sIHJldHVybiBpdCBhcyBhbiBhcnJheVxyXG4gICAgICAgIGlzRWxlbWVudChzZWxlY3Rpb24pIHx8ICFzZWxlY3Rpb24ubGVuZ3RoID8gW3NlbGVjdGlvbl0gOiBcclxuICAgICAgICAvLyBlbnN1cmUgaXQncyBhbiBhcnJheSBhbmQgbm90IGFuIEhUTUxDb2xsZWN0aW9uXHJcbiAgICAgICAgXy50b0FycmF5KHNlbGVjdGlvbiksXHJcblxyXG4gICAgY2hpbGRPclNpYmxpbmdRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICAvLyBDaGlsZCBzZWxlY3QgLSBuZWVkcyBzcGVjaWFsIGhlbHAgc28gdGhhdCBcIj4gZGl2XCIgZG9lc24ndCBicmVha1xyXG4gICAgICAgIHZhciBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKFxyXG4gICAgICAgICAgICAvLyB0YWlsb3IgdGhlIGNoaWxkIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGAjJHtpZEFwcGxpZWQgPyBuZXdJZCA6IGlkfSAke3NlbGVjdG9yfWBcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoaWRBcHBsaWVkKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xhc3NRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICAvLyBDbGFzcyBzZWFyY2gsIGRvbid0IHN0YXJ0IHdpdGggJy4nXHJcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBjb250ZXh0W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGlkUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBtZXRob2QsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHNlbCA9IHNlbGVjdG9yLnN1YnN0cigxKSxcclxuICAgICAgICAgICAgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWwpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRlZmF1bHRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIG1ldGhvZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGVybWluZVF1ZXJ5ID0gKGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QsIGlzQ2xhc3NTZWFyY2gsIGlzSWRTZWFyY2gpID0+XHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IGNoaWxkT3JTaWJsaW5nUXVlcnkgOlxyXG4gICAgICAgIGlzQ2xhc3NTZWFyY2ggPyBjbGFzc1F1ZXJ5IDpcclxuICAgICAgICBpc0lkU2VhcmNoID8gaWRRdWVyeSA6XHJcbiAgICAgICAgZGVmYXVsdFF1ZXJ5O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTZWxlY3RvcihzdHIpIHtcclxuICAgIHZhciBzZWxlY3RvciAgICAgICAgICAgICAgICA9IHN0ci50cmltKCksXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCAgPSBzZWxlY3RvclswXSA9PT0gJz4nIHx8IHNlbGVjdG9yWzBdID09PSAnKycsXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gUVVFUllfU0VMRUNUT1JfQUxMIDogZGV0ZXJtaW5lTWV0aG9kKHNlbGVjdG9yKSxcclxuICAgICAgICBpc0lkU2VhcmNoICAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRfQllfSUQsXHJcbiAgICAgICAgaXNDbGFzc1NlYXJjaCAgICAgICAgICAgPSAhaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FO1xyXG5cclxuICAgIHZhciBxdWVyeSA9IGRldGVybWluZVF1ZXJ5KFxyXG4gICAgICAgIGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QsXHJcbiAgICAgICAgaXNDbGFzc1NlYXJjaCxcclxuICAgICAgICBpc0lkU2VhcmNoXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3RyOiBzdHIsXHJcblxyXG4gICAgICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIC8vIE5vIG5lZWVkIHRvIGNoZWNrLCBhIG1hdGNoIHdpbGwgZmFpbCBpZiBpdCdzXHJcbiAgICAgICAgICAgIC8vIGNoaWxkIG9yIHNpYmxpbmdcclxuICAgICAgICAgICAgcmV0dXJuICFpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gbWF0Y2hlcyhjb250ZXh0LCBzZWxlY3RvcikgOiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgICAgICAvLyBpc0VsZW1lbnQoY29udGV4dCkgfHwgaXNOb2RlTGlzdChjb250ZXh0KSB8fCBpc0NvbGxlY3Rpb24oY29udGV4dClcclxuICAgICAgICAgICAgLy8gaWYgbm8gY29udGV4dCBpcyBnaXZlbiwgdXNlIGRvY3VtZW50XHJcbiAgICAgICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0IHx8IGRvY3VtZW50LCBtZXRob2QsIHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnLi4vXycpLFxyXG4gICAgcXVlcnlDYWNoZSA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIGlzQ2FjaGUgICAgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBzZWxlY3RvciAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL3NlbGVjdG9yJyksXHJcbiAgICBxdWVyeSAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL3F1ZXJ5JyksXHJcbiAgICBpcyAgICAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL2lzJyksXHJcbiAgICBwYXJzZSAgICAgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1wYXJzZScpLFxyXG4gICAgbm9ybWFsaXplICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplJyk7XHJcblxyXG52YXIgdG9TZWxlY3RvcnMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBfLmZhc3RtYXAoXHJcbiAgICAgICAgXy5mYXN0bWFwKFxyXG4gICAgICAgICAgICAvLyBTZWxlY3RvcnMgd2lsbCByZXR1cm4gW10gaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgICAgICAgICAvLyBOb3QgcmV0dXJuaW5nIGVhcmx5IG9yIGRvaW5nIGV4dHJhIGNoZWNrcyBhcyB0aGlzIHdpbGxcclxuICAgICAgICAgICAgLy8gbm9vcCBvbiB0aGUgcXVlcnkgYW5kIGlzIGxldmVsIGFuZCBpcyB0aGUgZXhjZXB0aW9uXHJcbiAgICAgICAgICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgICAgICAgICAgcGFyc2Uoc3RyKSxcclxuICAgICAgICAgICAgLy8gTm9ybWFsaXplIGVhY2ggb2YgdGhlIHNlbGVjdG9ycy4uLlxyXG4gICAgICAgICAgICBub3JtYWxpemVcclxuICAgICAgICApLFxyXG4gICAgICAgIC8vIC4uLmFuZCBtYXAgdGhlbSB0byBzZWxlY3RvciBvYmplY3RzXHJcbiAgICAgICAgc2VsZWN0b3JcclxuICAgICk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbGVjdG9yOiB0b1NlbGVjdG9ycyxcclxuICAgIHBhcnNlOiBwYXJzZSxcclxuICAgIFxyXG4gICAgcXVlcnk6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBxdWVyeUNhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5zZXQoc3RyLCBxdWVyeSh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBpc0NhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIGlzQ2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgaXNDYWNoZS5zZXQoc3RyLCBpcyh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcbiAgICBcIjpjaGlsZC1ldmVuXCIgOiBcIjpudGgtY2hpbGQoZXZlbilcIixcclxuICAgIFwiOmNoaWxkLW9kZFwiICA6IFwiOm50aC1jaGlsZChvZGQpXCIsXHJcbiAgICBcIjp0ZXh0XCIgICAgICAgOiBcIlt0eXBlPXRleHRdXCIsXHJcbiAgICBcIjpwYXNzd29yZFwiICAgOiBcIlt0eXBlPXBhc3N3b3JkXVwiLFxyXG4gICAgXCI6cmFkaW9cIiAgICAgIDogXCJbdHlwZT1yYWRpb11cIixcclxuICAgIFwiOmNoZWNrYm94XCIgICA6IFwiW3R5cGU9Y2hlY2tib3hdXCIsXHJcbiAgICBcIjpzdWJtaXRcIiAgICAgOiBcIlt0eXBlPXN1Ym1pdF1cIixcclxuICAgIFwiOnJlc2V0XCIgICAgICA6IFwiW3R5cGU9cmVzZXRdXCIsXHJcbiAgICBcIjpidXR0b25cIiAgICAgOiBcIlt0eXBlPWJ1dHRvbl1cIixcclxuICAgIFwiOmltYWdlXCIgICAgICA6IFwiW3R5cGU9aW1hZ2VdXCIsXHJcbiAgICBcIjppbnB1dFwiICAgICAgOiBcIlt0eXBlPWlucHV0XVwiLFxyXG4gICAgXCI6ZmlsZVwiICAgICAgIDogXCJbdHlwZT1maWxlXVwiLFxyXG4gICAgXCI6c2VsZWN0ZWRcIiAgIDogXCJbc2VsZWN0ZWQ9c2VsZWN0ZWRdXCJcclxufSIsInZhciBTVVBQT1JUUyAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgUFNFVURPX1NFTEVDVCAgICAgID0gLyg6W15cXHNcXChcXFspXSspL2csXHJcbiAgICBTRUxFQ1RFRF9TRUxFQ1QgICAgPSAvXFxbc2VsZWN0ZWRcXF0vZ2ksXHJcbiAgICBjYWNoZSAgICAgICAgICAgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBwcm94aWVzICAgICAgICAgICAgPSByZXF1aXJlKCcuL3Byb3h5Lmpzb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICByZXR1cm4gY2FjaGUuaGFzKHN0cikgPyBjYWNoZS5nZXQoc3RyKSA6IGNhY2hlLnB1dChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIHBzZXVkbyByZXBsYWNlIGlmIHRoZSBjYXB0dXJlZCBzZWxlY3RvciBpcyBpbiB0aGUgcHJveGllc1xyXG4gICAgICAgIHZhciBzID0gc3RyLnJlcGxhY2UoUFNFVURPX1NFTEVDVCwgKG1hdGNoKSA9PiBwcm94aWVzW21hdGNoXSA/IHByb3hpZXNbbWF0Y2hdIDogbWF0Y2gpO1xyXG5cclxuICAgICAgICAvLyBib29sZWFuIHNlbGVjdG9yIHJlcGxhY2VtZW50P1xyXG4gICAgICAgIC8vIHN1cHBvcnRzIElFOC05XHJcbiAgICAgICAgcmV0dXJuIFNVUFBPUlRTLnNlbGVjdGVkU2VsZWN0b3IgPyBzIDogcy5yZXBsYWNlKFNFTEVDVEVEX1NFTEVDVCwgJ1tzZWxlY3RlZD1cInNlbGVjdGVkXCJdJyk7XHJcbiAgICB9KTtcclxufTsiLCJ2YXIgdG9rZW5DYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuXHJcbiAgICB0b2tlbml6ZSA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBhcnIgPSBzdHIuc3BsaXQoJywgJyksXHJcbiAgICAgICAgICAgIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IGFycltpZHhdID0gYXJyW2lkeF0udHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnICB8fFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgPT09ICcjJyB8fFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3IgPT09ICcuJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXX0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpLlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgdmFyIHRva2VucyA9IHRva2VuQ2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgIHRva2VuQ2FjaGUuZ2V0KHNlbGVjdG9yKSA6IFxyXG4gICAgICAgIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCB0b2tlbml6ZShzZWxlY3RvcikpO1xyXG5cclxuICAgIGlmICghdG9rZW5zKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciBcIiR7c2VsZWN0b3J9XCJgKTtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRva2Vucy5zbGljZSgpO1xyXG59O1xyXG4iLCIgICAgLy8gTWF0Y2hlcyBcIi1tcy1cIiBzbyB0aGF0IGl0IGNhbiBiZSBjaGFuZ2VkIHRvIFwibXMtXCJcclxudmFyIFRSVU5DQVRFX01TX1BSRUZJWCAgPSAvXi1tcy0vLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgZGFzaGVkIHN0cmluZyBmb3IgY2FtZWxpemluZ1xyXG4gICAgREFTSF9DQVRDSCAgICAgICAgICA9IC8tKFtcXGRhLXpdKS9naSxcclxuXHJcbiAgICAvLyBNYXRjaGVzIFwibm9uZVwiIG9yIGEgdGFibGUgdHlwZSBlLmcuIFwidGFibGVcIixcclxuICAgIC8vIFwidGFibGUtY2VsbFwiIGV0Yy4uLlxyXG4gICAgTk9ORV9PUl9UQUJMRSAgICAgICA9IC9eKG5vbmV8dGFibGUoPyEtY1tlYV0pLispLyxcclxuICAgIFxyXG4gICAgVFlQRV9URVNUX0ZPQ1VTQUJMRSA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbnxvYmplY3QpJC9pLFxyXG4gICAgVFlQRV9URVNUX0NMSUNLQUJMRSA9IC9eKD86YXxhcmVhKSQvaSxcclxuICAgIFNFTEVDVE9SX0lEICAgICAgICAgPSAvXiMoW1xcdy1dKykkLyxcclxuICAgIFNFTEVDVE9SX1RBRyAgICAgICAgPSAvXltcXHctXSskLyxcclxuICAgIFNFTEVDVE9SX0NMQVNTICAgICAgPSAvXlxcLihbXFx3LV0rKSQvLFxyXG4gICAgUE9TSVRJT04gICAgICAgICAgICA9IC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkLyxcclxuICAgIE5VTV9OT05fUFggICAgICAgICAgPSBuZXcgUmVnRXhwKCdeKCcgKyAoL1srLV0/KD86XFxkKlxcLnwpXFxkKyg/OltlRV1bKy1dP1xcZCt8KS8pLnNvdXJjZSArICcpKD8hcHgpW2EteiVdKyQnLCAnaScpLFxyXG4gICAgU0lOR0xFX1RBRyAgICAgICAgICA9IC9ePChcXHcrKVxccypcXC8/Pig/OjxcXC9cXDE+fCkkLyxcclxuICAgIElTX0JPT0xfQVRUUiAgICAgICAgPSAvXig/OmNoZWNrZWR8c2VsZWN0ZWR8YXN5bmN8YXV0b2ZvY3VzfGF1dG9wbGF5fGNvbnRyb2xzfGRlZmVyfGRpc2FibGVkfGhpZGRlbnxpc21hcHxsb29wfG11bHRpcGxlfG9wZW58cmVhZG9ubHl8cmVxdWlyZWR8c2NvcGVkKSQvaSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBvZiBwYXJlbnQgdGFnIG5hbWVzIHRvIHRoZSBjaGlsZCB0YWdzIHRoYXQgcmVxdWlyZSB0aGVtLlxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgUEFSRU5UX01BUCA9IHtcclxuICAgICAgICB0YWJsZTogICAgL148KD86dGJvZHl8dGZvb3R8dGhlYWR8Y29sZ3JvdXB8Y2FwdGlvbilcXGIvLFxyXG4gICAgICAgIHRib2R5OiAgICAvXjwoPzp0cilcXGIvLFxyXG4gICAgICAgIHRyOiAgICAgICAvXjwoPzp0ZHx0aClcXGIvLFxyXG4gICAgICAgIGNvbGdyb3VwOiAvXjwoPzpjb2wpXFxiLyxcclxuICAgICAgICBzZWxlY3Q6ICAgL148KD86b3B0aW9uKVxcYi9cclxuICAgIH07XHJcblxyXG4vLyBoYXZpbmcgY2FjaGVzIGlzbid0IGFjdHVhbGx5IGZhc3RlclxyXG4vLyBmb3IgYSBtYWpvcml0eSBvZiB1c2UgY2FzZXMgZm9yIHN0cmluZ1xyXG4vLyBtYW5pcHVsYXRpb25zXHJcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3NpbXBsZS1jYWNoZS1mb3Itc3RyaW5nLW1hbmlwXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gVE9ETzpcclxuICAgIG51bU5vdFB4OiAgICAgICAodmFsKSA9PiBOVU1fTk9OX1BYLnRlc3QodmFsKSxcclxuICAgIHBvc2l0aW9uOiAgICAgICAodmFsKSA9PiBQT1NJVElPTi50ZXN0KHZhbCksXHJcbiAgICBzaW5nbGVUYWdNYXRjaDogKHZhbCkgPT4gU0lOR0xFX1RBRy5leGVjKHZhbCksXHJcbiAgICBpc05vbmVPclRhYmxlOiAgKHN0cikgPT4gTk9ORV9PUl9UQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0ZvY3VzYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0ZPQ1VTQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0NsaWNrYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0NMSUNLQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc1N0cmljdElkOiAgICAgKHN0cikgPT4gU0VMRUNUT1JfSUQudGVzdChzdHIpLFxyXG4gICAgaXNUYWc6ICAgICAgICAgIChzdHIpID0+IFNFTEVDVE9SX1RBRy50ZXN0KHN0ciksXHJcbiAgICBpc0NsYXNzOiAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfQ0xBU1MudGVzdChzdHIpLFxyXG4gICAgaXNCb29sQXR0cjogICAgIChzdHIpID0+IElTX0JPT0xfQVRUUi50ZXN0KHN0ciksXHJcblxyXG4gICAgY2FtZWxDYXNlOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoVFJVTkNBVEVfTVNfUFJFRklYLCAnbXMtJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoREFTSF9DQVRDSCwgKG1hdGNoLCBsZXR0ZXIpID0+IGxldHRlci50b1VwcGVyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50VGFnTmFtZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9IHN0ci5zdWJzdHIoMCwgMzApO1xyXG4gICAgICAgIGZvciAodmFyIHBhcmVudFRhZ05hbWUgaW4gUEFSRU5UX01BUCkge1xyXG4gICAgICAgICAgICBpZiAoUEFSRU5UX01BUFtwYXJlbnRUYWdOYW1lXS50ZXN0KHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRUYWdOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnZGl2JztcclxuICAgIH1cclxufTtcclxuIiwidmFyIERJViAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgY3JlYXRlID0gcmVxdWlyZSgnRElWL2NyZWF0ZScpLFxyXG4gICAgYSAgICAgID0gRElWLnF1ZXJ5U2VsZWN0b3IoJ2EnKSxcclxuICAgIHNlbGVjdCA9IGNyZWF0ZSgnc2VsZWN0JyksXHJcbiAgICBvcHRpb24gPSBzZWxlY3QuYXBwZW5kQ2hpbGQoY3JlYXRlKCdvcHRpb24nKSksXHJcblxyXG4gICAgdGVzdCA9ICh0YWdOYW1lLCB0ZXN0Rm4pID0+IHRlc3RGbihjcmVhdGUodGFnTmFtZSkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBVUkxzIGFyZW4ndCBtYW5pcHVsYXRlZFxyXG4gICAgLy8gKElFIG5vcm1hbGl6ZXMgaXQgYnkgZGVmYXVsdClcclxuICAgIGhyZWZOb3JtYWxpemVkOiBhLmdldEF0dHJpYnV0ZSgnaHJlZicpID09PSAnL2EnLFxyXG5cclxuICAgIC8vIENoZWNrIHRoZSBkZWZhdWx0IGNoZWNrYm94L3JhZGlvIHZhbHVlICgnJyBpbiBvbGRlciBXZWJLaXQ7ICdvbicgZWxzZXdoZXJlKVxyXG4gICAgY2hlY2tPbjogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiAhIWlucHV0LnZhbHVlO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgYW4gaW5wdXQgbWFpbnRhaW5zIGl0cyB2YWx1ZSBhZnRlciBiZWNvbWluZyBhIHJhZGlvXHJcbiAgICAvLyBTdXBwb3J0OiBNb2Rlcm4gYnJvd3NlcnMgb25seSAoTk9UIElFIDw9IDExKVxyXG4gICAgcmFkaW9WYWx1ZTogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnZhbHVlID0gJ3QnO1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiBpbnB1dC52YWx1ZSA9PT0gJ3QnO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgYSBzZWxlY3RlZC1ieS1kZWZhdWx0IG9wdGlvbiBoYXMgYSB3b3JraW5nIHNlbGVjdGVkIHByb3BlcnR5LlxyXG4gICAgLy8gKFdlYktpdCBkZWZhdWx0cyB0byBmYWxzZSBpbnN0ZWFkIG9mIHRydWUsIElFIHRvbywgaWYgaXQncyBpbiBhbiBvcHRncm91cClcclxuICAgIG9wdFNlbGVjdGVkOiBvcHRpb24uc2VsZWN0ZWQsXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG9wdGlvbnMgaW5zaWRlIGRpc2FibGVkIHNlbGVjdHMgYXJlbid0IG1hcmtlZCBhcyBkaXNhYmxlZFxyXG4gICAgLy8gKFdlYktpdCBtYXJrcyB0aGVtIGFzIGRpc2FibGVkKVxyXG4gICAgb3B0RGlzYWJsZWQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICBzZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAhb3B0aW9uLmRpc2FibGVkO1xyXG4gICAgfSgpKSxcclxuICAgIFxyXG4gICAgdGV4dENvbnRlbnQ6IERJVi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkLFxyXG5cclxuICAgIC8vIE1vZGVybiBicm93c2VycyBub3JtYWxpemUgXFxyXFxuIHRvIFxcbiBpbiB0ZXh0YXJlYSB2YWx1ZXMsXHJcbiAgICAvLyBidXQgSUUgPD0gMTEgKGFuZCBwb3NzaWJseSBuZXdlcikgZG8gbm90LlxyXG4gICAgdmFsdWVOb3JtYWxpemVkOiB0ZXN0KCd0ZXh0YXJlYScsIGZ1bmN0aW9uKHRleHRhcmVhKSB7XHJcbiAgICAgICAgdGV4dGFyZWEudmFsdWUgPSAnXFxyXFxuJztcclxuICAgICAgICByZXR1cm4gdGV4dGFyZWEudmFsdWUgPT09ICdcXG4nO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgc2VsZWN0ZWRTZWxlY3RvcjogdGVzdCgnc2VsZWN0JywgZnVuY3Rpb24oc2VsZWN0KSB7XHJcbiAgICAgICAgc2VsZWN0LmlubmVySFRNTCA9ICc8b3B0aW9uIHZhbHVlPVwiMVwiPjE8L29wdGlvbj48b3B0aW9uIHZhbHVlPVwiMlwiIHNlbGVjdGVkPjI8L29wdGlvbj4nO1xyXG4gICAgICAgIHJldHVybiAhIXNlbGVjdC5xdWVyeVNlbGVjdG9yKCdvcHRpb25bc2VsZWN0ZWRdJyk7XHJcbiAgICB9KVxyXG59O1xyXG4iLCJ2YXIgZXhpc3RzICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXJyYXkgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnaXMvYXJyYXlMaWtlJyksXHJcbiAgICBpc05vZGVMaXN0ICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBzbGljZSAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKTtcclxuXHJcbnZhciBsb29wID0gZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdGVlKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICBpZiAobGVuZ3RoID09PSArbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoaXRlcmF0ZWUsIG9ialtpZHhdLCBpZHgsIG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0ga2V5cy5sZW5ndGg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGl0ZXJhdGVlLCBvYmpba2V5c1tpZHhdXSwga2V5c1tpZHhdLCBvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIF8gPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIEZsYXR0ZW4gdGhhdCBhbHNvIGNoZWNrcyBpZiB2YWx1ZSBpcyBhIE5vZGVMaXN0XHJcbiAgICBmbGF0dGVuOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvUHg6ICh2YWx1ZSkgPT4gdmFsdWUgKyAncHgnLFxyXG4gICAgXHJcbiAgICBwYXJzZUludDogKG51bSkgPT4gcGFyc2VJbnQobnVtLCAxMCksXHJcblxyXG4gICAgZXZlcnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcnIpKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmICghaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICAgICAgb2JqICA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGxlbiAgPSBhcmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCFvYmogfHwgbGVuIDwgMikgeyByZXR1cm4gb2JqOyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3NbaWR4XTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN0YW5kYXJkIG1hcFxyXG4gICAgbWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEFycmF5LXByZXNlcnZpbmcgbWFwXHJcbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9wdXNoLW1hcC12cy1pbmRleC1yZXBsYWNlbWVudC1tYXBcclxuICAgIGZhc3RtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBpdGVyYXRvcihhcnJbaWR4XSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcblxyXG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhcnJbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoYXJyICYmIGFyci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwdWxsZWQgZnJvbSBBTURcclxuICAgIHR5cGVjYXN0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgIHIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgciA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICdmYWxzZScpIHtcclxuICAgICAgICAgICAgciA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnJyB8fCBpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgIC8vIGlzTmFOKCcnKSByZXR1cm5zIGZhbHNlXHJcbiAgICAgICAgICAgIHIgPSB2YWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcGFyc2VGbG9hdChudWxsIHx8ICcnKSByZXR1cm5zIE5hTlxyXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gVE9ETzpcclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlKG9iaik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXJyLFxyXG4gICAgICAgICAgICBsZW4gPSArb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGFyciA9IEFycmF5KG9iai5sZW5ndGgpO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgYXJyW2lkeF0gPSBvYmpbaWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBhcnIucHVzaChvYmpba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VBcnJheTogKGFyZykgPT5cclxuICAgICAgICAhZXhpc3RzKGFyZykgPyBbXSA6XHJcbiAgICAgICAgaXNBcnJheUxpa2UoYXJnKSA/IHNsaWNlKGFyZykgOiBbIGFyZyBdLFxyXG5cclxuICAgIGNvbnRhaW5zOiAoYXJyLCBpdGVtKSA9PiBhcnIuaW5kZXhPZihpdGVtKSAhPT0gLTEsXHJcblxyXG4gICAganFFYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmbi5jYWxsKHZhbHVlLCBrZXlJbmRleCwgdmFsdWUsIGNvbGxlY3Rpb24pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZEVhY2g6IGxvb3AoZnVuY3Rpb24oZm4sIHZhbHVlLCBrZXlJbmRleCwgY29sbGVjdGlvbikge1xyXG4gICAgICAgIGZuLmNhbGwodmFsdWUsIHZhbHVlLCBrZXlJbmRleCwgY29sbGVjdGlvbik7XHJcbiAgICB9KSxcclxuXHJcbiAgICBlYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgpIHtcclxuICAgICAgICBmbih2YWx1ZSwga2V5SW5kZXgpO1xyXG4gICAgfSksXHJcblxyXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gc2Vjb25kLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gR28gdGhyb3VnaCBlYWNoIGVsZW1lbnQgaW4gdGhlXHJcbiAgICAgICAgLy8gc2Vjb25kIGFycmF5IGFuZCBhZGQgaXQgdG8gdGhlXHJcbiAgICAgICAgLy8gZmlyc3RcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2lkeF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJzdC5sZW5ndGggPSBpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmlyc3Q7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHBsdWNrXHJcbiAgICAvLyBUT0RPOiBDaGVjayBmb3IgcGxhY2VzIHRoaXMgY2FuIGJlIGFwcGxpZWRcclxuICAgIHBsdWNrOiBmdW5jdGlvbihhcnIsIGtleSkge1xyXG4gICAgICAgIHJldHVybiBfLm1hcChhcnIsIChvYmopID0+IG9iaiA/IG9ialtrZXldIDogdW5kZWZpbmVkKTtcclxuICAgIH1cclxufTsiLCJ2YXIgZGVsZXRlciA9IChkZWxldGFibGUpID0+XHJcbiAgICBkZWxldGFibGUgPyBcclxuICAgICAgICBmdW5jdGlvbihzdG9yZSwga2V5KSB7IGRlbGV0ZSBzdG9yZVtrZXldOyB9IDpcclxuICAgICAgICBmdW5jdGlvbihzdG9yZSwga2V5KSB7IHN0b3JlW2tleV0gPSB1bmRlZmluZWQ7IH07XHJcblxyXG52YXIgZ2V0dGVyU2V0dGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICB2YXIgc3RvcmUgPSB7fSxcclxuICAgICAgICBkZWwgPSBkZWxldGVyKGRlbGV0YWJsZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4ga2V5IGluIHN0b3JlICYmIHN0b3JlW2tleV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdG9yZVtrZXldO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHV0OiBmdW5jdGlvbihrZXksIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm4oYXJnKTtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICBkZWwoc3RvcmUsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBiaUxldmVsR2V0dGVyU2V0dGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICB2YXIgc3RvcmUgPSB7fSxcclxuICAgICAgICBkZWwgPSBkZWxldGVyKGRlbGV0YWJsZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIGhhczEgPSBrZXkxIGluIHN0b3JlICYmIHN0b3JlW2tleTFdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGlmICghaGFzMSB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGtleTIgaW4gc3RvcmVba2V5MV0gJiYgc3RvcmVba2V5MV1ba2V5Ml0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdO1xyXG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/IHJlZjEgOiAocmVmMSAhPT0gdW5kZWZpbmVkID8gcmVmMVtrZXkyXSA6IHJlZjEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHV0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm4oYXJnKTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgLy8gRWFzeSByZW1vdmFsXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsKHN0b3JlLCBrZXkxKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGVlcCByZW1vdmFsXHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV0gfHwgKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICBkZWwocmVmMSwga2V5Mik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obHZsLCBkZWxldGFibGUpIHtcclxuICAgIHJldHVybiBsdmwgPT09IDIgPyBiaUxldmVsR2V0dGVyU2V0dGVyKGRlbGV0YWJsZSkgOiBnZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKTtcclxufTsiLCJ2YXIgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSBpbnN0YW5jZW9mIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cy5zZXQgPSAoRCkgPT4gY29uc3RydWN0b3IgPSBEO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmICt2YWx1ZS5sZW5ndGggPT09IHZhbHVlLmxlbmd0aDtcclxuIiwidmFyIGlzRG9jdW1lbnRGcmFnbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZG9jX2ZyYWc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciBwYXJlbnQ7XHJcbiAgICByZXR1cm4gZWxlbSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLm93bmVyRG9jdW1lbnQgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0gIT09IGRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkgICAgICAgICAgICAgJiZcclxuICAgICAgICAhaXNEb2N1bWVudEZyYWdtZW50KHBhcmVudCkgICAgICAgICAgICAmJlxyXG4gICAgICAgIHBhcmVudC5pc1BhcnNlSHRtbEZyYWdtZW50ICE9PSB0cnVlO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2U7XHJcbiIsInZhciBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNEICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgaXNEKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSBkb2N1bWVudDtcclxuIiwidmFyIGlzV2luZG93ICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCBpc0VsZW1lbnQodmFsdWUpKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGw7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgdmFyIHRleHQgPSB2YWx1ZS50cmltKCk7XHJcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApID09PSAnPCcgJiYgdGV4dC5jaGFyQXQodGV4dC5sZW5ndGggLSAxKSA9PT0gJz4nICYmIHRleHQubGVuZ3RoID49IDMpO1xyXG59OyIsIi8vIE5vZGVMaXN0IGNoZWNrLiBGb3Igb3VyIHB1cnBvc2VzLCBhIE5vZGVMaXN0IGFuZCBhbiBIVE1MQ29sbGVjdGlvbiBhcmUgdGhlIHNhbWUuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSAmJiAoXHJcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBOb2RlTGlzdCB8fFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb25cclxuICAgICk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAoZWxlbSwgbmFtZSkgPT5cclxuICAgIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgKCEhdmFsdWUgJiYgdHlwZSA9PT0gJ29iamVjdCcpO1xyXG59OyIsInZhciBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWwpID0+XHJcbiAgICB2YWwgJiYgKGlzU3RyaW5nKHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpIHx8IGlzRWxlbWVudCh2YWwpIHx8IGlzQ29sbGVjdGlvbih2YWwpKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJzsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IHZhbHVlLndpbmRvdztcclxuIiwidmFyIGlzRWxlbWVudCAgICAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIERJViAgICAgICAgICAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgLy8gU3VwcG9ydDogSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBtYXRjaGVzU2VsZWN0b3IgPSBESVYubWF0Y2hlcyAgICAgICAgICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubWF0Y2hlc1NlbGVjdG9yICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubXNNYXRjaGVzU2VsZWN0b3IgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubW96TWF0Y2hlc1NlbGVjdG9yICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYub01hdGNoZXNTZWxlY3RvcjtcclxuXHJcbi8vIG9ubHkgZWxlbWVudCB0eXBlcyBzdXBwb3J0ZWRcclxubW9kdWxlLmV4cG9ydHMgPSAoZWxlbSwgc2VsZWN0b3IpID0+XHJcbiAgICBpc0VsZW1lbnQoZWxlbSkgPyBtYXRjaGVzU2VsZWN0b3IuY2FsbChlbGVtLCBzZWxlY3RvcikgOiBmYWxzZTtcclxuIiwidmFyIF8gICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgc2xpY2UgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKSxcclxuICAgIG1hcCAgICAgPSByZXF1aXJlKCcuL21hcCcpO1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzWytpbmRleF07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAvLyBObyBpbmRleCwgcmV0dXJuIGFsbFxyXG4gICAgICAgIGlmICghZXhpc3RzKGluZGV4KSkgeyByZXR1cm4gc2xpY2UodGhpcyk7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9ICtpbmRleDtcclxuICAgICAgICByZXR1cm4gdGhpc1tcclxuICAgICAgICAgICAgLy8gTG9va2luZyB0byBnZXQgYW4gaW5kZXggZnJvbSB0aGUgZW5kIG9mIHRoZSBzZXRcclxuICAgICAgICAgICAgLy8gaWYgbmVnYXRpdmUsIG9yIHRoZSBzdGFydCBvZiB0aGUgc2V0IGlmIHBvc2l0aXZlXHJcbiAgICAgICAgICAgIGlkeCA8IDAgPyB0aGlzLmxlbmd0aCArIGlkeCA6IGlkeFxyXG4gICAgICAgIF07XHJcbiAgICB9LFxyXG5cclxuICAgIGVxOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXMuZ2V0KGluZGV4KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNsaWNlOiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoc2xpY2UodGhpcywgc3RhcnQsIGVuZCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaXJzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpc1swXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbdGhpcy5sZW5ndGggLSAxXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBzbGljZSh0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgbWFwOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgIHJldHVybiBEKG1hcCh0aGlzLCBpdGVyYXRvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgIF8uZEVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmb3JFYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgIF8uZEVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICBpZiAoIWFyci5sZW5ndGggfHwgIWl0ZXJhdG9yKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgaXRlbTtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgaXRlbSA9IGFycltpZHhdO1xyXG4gICAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvci5jYWxsKGl0ZW0sIGl0ZW0sIGlkeCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbmNhdCBmbGF0IGZvciBhIHNpbmdsZSBhcnJheSBvZiBhcnJheXNcclxuICAgIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIHJlc3VsdHMpO1xyXG59OyIsInZhciBvcmRlciA9IHJlcXVpcmUoJ29yZGVyJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgIHZhciBoYXNEdXBsaWNhdGVzID0gb3JkZXIuc29ydChyZXN1bHRzKTtcclxuICAgIGlmICghaGFzRHVwbGljYXRlcykgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBlbGVtLFxyXG4gICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgLy8gY3JlYXRlIHRoZSBhcnJheSBoZXJlXHJcbiAgICAgICAgLy8gc28gdGhhdCBhIG5ldyBhcnJheSBpc24ndFxyXG4gICAgICAgIC8vIGNyZWF0ZWQvZGVzdHJveWVkIGV2ZXJ5IHVuaXF1ZSBjYWxsXHJcbiAgICAgICAgZHVwbGljYXRlcyA9IFtdO1xyXG5cclxuICAgIC8vIEdvIHRocm91Z2ggdGhlIGFycmF5IGFuZCBpZGVudGlmeVxyXG4gICAgLy8gdGhlIGR1cGxpY2F0ZXMgdG8gYmUgcmVtb3ZlZFxyXG4gICAgd2hpbGUgKChlbGVtID0gcmVzdWx0c1tpZHgrK10pKSB7XHJcbiAgICAgICAgaWYgKGVsZW0gPT09IHJlc3VsdHNbaWR4XSkge1xyXG4gICAgICAgICAgICBkdXBsaWNhdGVzLnB1c2goaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBkdXBsaWNhdGVzIGZyb20gdGhlIHJlc3VsdHNcclxuICAgIGlkeCA9IGR1cGxpY2F0ZXMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICByZXN1bHRzLnNwbGljZShkdXBsaWNhdGVzW2lkeF0sIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59OyIsInZhciBfICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGV4aXN0cyAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBpc05vZGVOYW1lICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL25vZGVOYW1lJyksXHJcbiAgICBuZXdsaW5lcyAgICAgICAgICAgICA9IHJlcXVpcmUoJ3V0aWwvbmV3bGluZXMnKSxcclxuICAgIFNVUFBPUlRTICAgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFJFR0VYICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIHNhbml0aXplRGF0YUtleUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpO1xyXG5cclxudmFyIGlzRGF0YUtleSA9IChrZXkpID0+IChrZXkgfHwgJycpLnN1YnN0cigwLCA1KSA9PT0gJ2RhdGEtJyxcclxuXHJcbiAgICB0cmltRGF0YUtleSA9IChrZXkpID0+IGtleS5zdWJzdHIoMCwgNSksXHJcblxyXG4gICAgc2FuaXRpemVEYXRhS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHNhbml0aXplRGF0YUtleUNhY2hlLmhhcyhrZXkpID9cclxuICAgICAgICAgICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUuZ2V0KGtleSkgOlxyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5wdXQoa2V5LCAoKSA9PiBpc0RhdGFLZXkoa2V5KSA/IGtleSA6ICdkYXRhLScgKyBrZXkudG9Mb3dlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGFBdHRyS2V5cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgYXR0cnMgPSBlbGVtLmF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIGlkeCAgID0gYXR0cnMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXlzICA9IFtdLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGF0dHJzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChpc0RhdGFLZXkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfTtcclxuXHJcbnZhciBib29sSG9vayA9IHtcclxuICAgIGlzOiAoYXR0ck5hbWUpID0+IFJFR0VYLmlzQm9vbEF0dHIoYXR0ck5hbWUpLFxyXG4gICAgZ2V0OiAoZWxlbSwgYXR0ck5hbWUpID0+IGVsZW0uaGFzQXR0cmlidXRlKGF0dHJOYW1lKSA/IGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkgOiB1bmRlZmluZWQsXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlLCBhdHRyTmFtZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGJvb2xlYW4gYXR0cmlidXRlcyB3aGVuIHNldCB0byBmYWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJOYW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBob29rcyA9IHtcclxuICAgICAgICB0YWJpbmRleDoge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdHModGFiaW5kZXgpIHx8IHRhYmluZGV4ID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJpbmRleDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHR5cGU6IHtcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFTVVBQT1JUUy5yYWRpb1ZhbHVlICYmIHZhbHVlID09PSAncmFkaW8nICYmIGlzTm9kZU5hbWUoZWxlbSwgJ2lucHV0JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIHRoZSB0eXBlIG9uIGEgcmFkaW8gYnV0dG9uIGFmdGVyIHRoZSB2YWx1ZSByZXNldHMgdGhlIHZhbHVlIGluIElFNi05XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdmFsdWUgdG8gZGVmYXVsdCBpbiBjYXNlIHR5cGUgaXMgc2V0IGFmdGVyIHZhbHVlIGR1cmluZyBjcmVhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS52YWx1ZSA9IG9sZFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld2xpbmVzKHZhbCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QXR0cmlidXRlID0gZnVuY3Rpb24oZWxlbSwgYXR0cikge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pIHx8ICFlbGVtLmhhc0F0dHJpYnV0ZShhdHRyKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBib29sSG9vay5nZXQoZWxlbSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0uZ2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBob29rc1thdHRyXS5nZXQoZWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gZWxlbS5nZXRBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICAgICAgcmV0dXJuIGV4aXN0cyhyZXQpID8gcmV0IDogdW5kZWZpbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXR0ZXJzID0ge1xyXG4gICAgICAgIGZvckF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChib29sSG9vay5pcyhhdHRyKSAmJiAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuYm9vbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmhvb2s7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuZWxlbTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvb2w6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGJvb2xIb29rLnNldChlbGVtLCB2YWx1ZSwgYXR0cik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBob29rOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBob29rc1thdHRyXS5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWxlbTogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXJyLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpc0ZuICAgPSBpc0Z1bmN0aW9uKHZhbHVlKSxcclxuICAgICAgICAgICAgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgdmFsLFxyXG4gICAgICAgICAgICBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG5cclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgdmFsID0gaXNGbiA/IHZhbHVlLmNhbGwoZWxlbSwgaWR4LCBnZXRBdHRyaWJ1dGUoZWxlbSwgYXR0cikpIDogdmFsdWU7XHJcbiAgICAgICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHZhciBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGUoYXJyW2lkeF0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICByZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLnJlbW92ZShlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhhdHRyKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEF0dHJpYnV0ZSh0aGlzWzBdLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXNzdW1lIGFuIG9iamVjdFxyXG4gICAgICAgICAgICB2YXIgYXR0cnMgPSBhdHRyO1xyXG4gICAgICAgICAgICBmb3IgKGF0dHIgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgYXR0cnNbYXR0cl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgLy8gcmVtb3ZlXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpdGVyYXRvclxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkQXR0ciA9IGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICA9IGZuLmNhbGwoZWxlbSwgaWR4LCBvbGRBdHRyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyhyZXN1bHQpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZShlbGVtLCBhdHRyLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNldFxyXG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBdHRyOiBmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7IHJlbW92ZUF0dHJpYnV0ZXModGhpcywgYXR0cik7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGF0dHJEYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG1hcCAgPSB7fSxcclxuICAgICAgICAgICAgICAgIGtleXMgPSBnZXREYXRhQXR0cktleXMoZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICA9IGtleXMubGVuZ3RoLCBrZXk7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAga2V5ID0ga2V5c1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgbWFwW3RyaW1EYXRhS2V5KGtleSldID0gXy50eXBlY2FzdChmaXJzdC5nZXRBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFjayB0byBhbiBvYmplY3QgZGVmaW5pdGlvblxyXG4gICAgICAgIHZhciBvYmogPSBrZXksXHJcbiAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc0VsZW1lbnQgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuXHJcbiAgICBzcGxpdCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIgPT09ICcnID8gW10gOiBzdHIudHJpbSgpLnNwbGl0KC9cXHMrL2cpO1xyXG4gICAgfTtcclxuXHJcbnZhciBhZGRDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC5hZGQobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QudG9nZ2xlKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3VibGVDbGFzc0xvb3AgPSBmdW5jdGlvbihlbGVtcywgbmFtZXMsIG1ldGhvZCkge1xyXG4gICAgICAgIHZhciBpZHggPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBlbGVtc1tpZHhdO1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgICAgICBjbGFzc0xpc3QgPSBlbGVtLmNsYXNzTGlzdDtcclxuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kKGNsYXNzTGlzdCwgbmFtZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtcztcclxuICAgIH0sXHJcblxyXG4gICAgZG9BbnlFbGVtc0hhdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbXNbaWR4XSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgaWYgKGVsZW1zW2lkeF0uY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbXNbaWR4XSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgZWxlbXNbaWR4XS5jbGFzc05hbWUgPSAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBoYXNDbGFzczogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCAmJiBleGlzdHMobmFtZSkgJiYgbmFtZSAhPT0gJycgPyBkb0FueUVsZW1zSGF2ZUNsYXNzKHRoaXMsIG5hbWUpIDogZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkgeyBuYW1lcyA9IHNwbGl0KG5hbWVzKTsgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5hbWVzLmxlbmd0aCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lcywgYWRkQ2xhc3MpIDogdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUFsbENsYXNzZXModGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCByZW1vdmVDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzOiBmdW5jdGlvbihuYW1lcywgc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgdmFyIG5hbWVMaXN0O1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCAhdGhpcy5sZW5ndGggfHwgIShuYW1lTGlzdCA9IHNwbGl0KG5hbWVzKSkubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaG91bGRBZGQgPT09IHVuZGVmaW5lZCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgdG9nZ2xlQ2xhc3MpIDpcclxuICAgICAgICAgICAgc2hvdWxkQWRkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCBhZGRDbGFzcykgOlxyXG4gICAgICAgICAgICBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIHJlbW92ZUNsYXNzKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgc3BsaXQgICAgICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBleGlzdHMgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTnVtYmVyICAgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Jvb2xlYW4gICAgICA9IHJlcXVpcmUoJ2lzL2Jvb2xlYW4nKSxcclxuICAgIGlzT2JqZWN0ICAgICAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc0FycmF5ICAgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0RvY3VtZW50VHlwZSA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZG9jLFxyXG4gICAgUkVHRVggICAgICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzID0ge1xyXG4gICAgZGlzcGxheTogICAgJ2Jsb2NrJyxcclxuICAgIHBvc2l0aW9uOiAgICdhYnNvbHV0ZScsXHJcbiAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xyXG59O1xyXG5cclxudmFyIGdldERvY3VtZW50RGltZW5zaW9uID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgLy8gRWl0aGVyIHNjcm9sbFtXaWR0aC9IZWlnaHRdIG9yIG9mZnNldFtXaWR0aC9IZWlnaHRdIG9yXHJcbiAgICAvLyBjbGllbnRbV2lkdGgvSGVpZ2h0XSwgd2hpY2hldmVyIGlzIGdyZWF0ZXN0XHJcbiAgICB2YXIgZG9jID0gZWxlbS5kb2N1bWVudEVsZW1lbnQ7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgoXHJcbiAgICAgICAgZWxlbS5ib2R5WydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZWxlbS5ib2R5WydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGRvY1snb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ2NsaWVudCcgKyBuYW1lXVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBoaWRlID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH0sXHJcbiAgICBzaG93ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBjc3NTd2FwID0gZnVuY3Rpb24oZWxlbSwgb3B0aW9ucywgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgb2xkID0ge307XHJcblxyXG4gICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzLCBhbmQgaW5zZXJ0IHRoZSBuZXcgb25lc1xyXG4gICAgICAgIHZhciBuYW1lO1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIG9sZFtuYW1lXSA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvcHRpb25zW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJldCA9IGNhbGxiYWNrKGVsZW0pO1xyXG5cclxuICAgICAgICAvLyBSZXZlcnQgdGhlIG9sZCB2YWx1ZXNcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb2xkW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQXZvaWRzIGFuICdJbGxlZ2FsIEludm9jYXRpb24nIGVycm9yIChDaHJvbWUpXHJcbiAgICAvLyBBdm9pZHMgYSAnVHlwZUVycm9yOiBBcmd1bWVudCAxIG9mIFdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIGRvZXMgbm90IGltcGxlbWVudCBpbnRlcmZhY2UgRWxlbWVudCcgZXJyb3IgKEZpcmVmb3gpXHJcbiAgICBnZXRDb21wdXRlZFN0eWxlID0gKGVsZW0pID0+XHJcbiAgICAgICAgaXNFbGVtZW50KGVsZW0pICYmICFpc1dpbmRvdyhlbGVtKSAmJiAhaXNEb2N1bWVudChlbGVtKSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pIDogbnVsbCxcclxuXHJcbiAgICBfd2lkdGggPSB7XHJcbiAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRG9jdW1lbnRUeXBlKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ1dpZHRoJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgIGlmICh3aWR0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MsIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX2hlaWdodCA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEb2N1bWVudFR5cGUoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnSGVpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgICAgaWYgKGhlaWdodCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MsIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS5oZWlnaHQgPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGdldFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcblxyXG4gICAgLy8gU3RhcnQgd2l0aCBvZmZzZXQgcHJvcGVydHksIHdoaWNoIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGJvcmRlci1ib3ggdmFsdWVcclxuICAgIHZhciB2YWx1ZUlzQm9yZGVyQm94ID0gdHJ1ZSxcclxuICAgICAgICB2YWwgPSAobmFtZSA9PT0gJ3dpZHRoJykgPyBlbGVtLm9mZnNldFdpZHRoIDogZWxlbS5vZmZzZXRIZWlnaHQsXHJcbiAgICAgICAgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICBpc0JvcmRlckJveCA9IHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94JztcclxuXHJcbiAgICAvLyBzb21lIG5vbi1odG1sIGVsZW1lbnRzIHJldHVybiB1bmRlZmluZWQgZm9yIG9mZnNldFdpZHRoLCBzbyBjaGVjayBmb3IgbnVsbC91bmRlZmluZWRcclxuICAgIC8vIHN2ZyAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY0OTI4NVxyXG4gICAgLy8gTWF0aE1MIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NDkxNjY4XHJcbiAgICBpZiAodmFsIDw9IDAgfHwgIWV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGNvbXB1dGVkIHRoZW4gdW5jb21wdXRlZCBjc3MgaWYgbmVjZXNzYXJ5XHJcbiAgICAgICAgdmFsID0gY3VyQ3NzKGVsZW0sIG5hbWUsIHN0eWxlcyk7XHJcbiAgICAgICAgaWYgKHZhbCA8IDAgfHwgIXZhbCkgeyB2YWwgPSBlbGVtLnN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGVkIHVuaXQgaXMgbm90IHBpeGVscy4gU3RvcCBoZXJlIGFuZCByZXR1cm4uXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRoZSBjaGVjayBmb3Igc3R5bGUgaW4gY2FzZSBhIGJyb3dzZXIgd2hpY2ggcmV0dXJucyB1bnJlbGlhYmxlIHZhbHVlc1xyXG4gICAgICAgIC8vIGZvciBnZXRDb21wdXRlZFN0eWxlIHNpbGVudGx5IGZhbGxzIGJhY2sgdG8gdGhlIHJlbGlhYmxlIGVsZW0uc3R5bGVcclxuICAgICAgICB2YWx1ZUlzQm9yZGVyQm94ID0gaXNCb3JkZXJCb3ggJiYgdmFsID09PSBzdHlsZXNbbmFtZV07XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSAnJywgYXV0bywgYW5kIHByZXBhcmUgZm9yIGV4dHJhXHJcbiAgICAgICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIHRoZSBhY3RpdmUgYm94LXNpemluZyBtb2RlbCB0byBhZGQvc3VidHJhY3QgaXJyZWxldmFudCBzdHlsZXNcclxuICAgIHJldHVybiBfLnRvUHgoXHJcbiAgICAgICAgdmFsICsgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQoXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcsXHJcbiAgICAgICAgICAgIHZhbHVlSXNCb3JkZXJCb3gsXHJcbiAgICAgICAgICAgIHN0eWxlc1xyXG4gICAgICAgIClcclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgQ1NTX0VYUEFORCA9IHNwbGl0KCdUb3B8UmlnaHR8Qm90dG9tfExlZnQnKTtcclxudmFyIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgZXh0cmEsIGlzQm9yZGVyQm94LCBzdHlsZXMpIHtcclxuICAgIHZhciB2YWwgPSAwLFxyXG4gICAgICAgIC8vIElmIHdlIGFscmVhZHkgaGF2ZSB0aGUgcmlnaHQgbWVhc3VyZW1lbnQsIGF2b2lkIGF1Z21lbnRhdGlvblxyXG4gICAgICAgIGlkeCA9IChleHRyYSA9PT0gKGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcpKSA/XHJcbiAgICAgICAgICAgIDQgOlxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UgaW5pdGlhbGl6ZSBmb3IgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIChuYW1lID09PSAnd2lkdGgnKSA/XHJcbiAgICAgICAgICAgIDEgOlxyXG4gICAgICAgICAgICAwLFxyXG4gICAgICAgIHR5cGUsXHJcbiAgICAgICAgLy8gUHVsbGVkIG91dCBvZiB0aGUgbG9vcCB0byByZWR1Y2Ugc3RyaW5nIGNvbXBhcmlzb25zXHJcbiAgICAgICAgZXh0cmFJc01hcmdpbiAgPSAoZXh0cmEgPT09ICdtYXJnaW4nKSxcclxuICAgICAgICBleHRyYUlzQ29udGVudCA9ICghZXh0cmFJc01hcmdpbiAmJiBleHRyYSA9PT0gJ2NvbnRlbnQnKSxcclxuICAgICAgICBleHRyYUlzUGFkZGluZyA9ICghZXh0cmFJc01hcmdpbiAmJiAhZXh0cmFJc0NvbnRlbnQgJiYgZXh0cmEgPT09ICdwYWRkaW5nJyk7XHJcblxyXG4gICAgZm9yICg7IGlkeCA8IDQ7IGlkeCArPSAyKSB7XHJcbiAgICAgICAgdHlwZSA9IENTU19FWFBBTkRbaWR4XTtcclxuXHJcbiAgICAgICAgLy8gYm90aCBib3ggbW9kZWxzIGV4Y2x1ZGUgbWFyZ2luLCBzbyBhZGQgaXQgaWYgd2Ugd2FudCBpdFxyXG4gICAgICAgIGlmIChleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1tleHRyYSArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQm9yZGVyQm94KSB7XHJcblxyXG4gICAgICAgICAgICAvLyBib3JkZXItYm94IGluY2x1ZGVzIHBhZGRpbmcsIHNvIHJlbW92ZSBpdCBpZiB3ZSB3YW50IGNvbnRlbnRcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNDb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGJvcmRlciBub3IgbWFyZ2luLCBzbyByZW1vdmUgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmICghZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IF8ucGFyc2VJbnQoc3R5bGVzWydib3JkZXInICsgdHlwZSArICdXaWR0aCddKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBjb250ZW50LCBzbyBhZGQgcGFkZGluZ1xyXG4gICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBjb250ZW50IG5vciBwYWRkaW5nLCBzbyBhZGQgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzUGFkZGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzWydib3JkZXInICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZhbDtcclxufTtcclxuXHJcbnZhciBjdXJDc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBjb21wdXRlZCkge1xyXG4gICAgdmFyIHN0eWxlID0gZWxlbS5zdHlsZSxcclxuICAgICAgICBzdHlsZXMgPSBjb21wdXRlZCB8fCBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIHJldCA9IHN0eWxlcyA/IHN0eWxlcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpIHx8IHN0eWxlc1tuYW1lXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICAvLyBBdm9pZCBzZXR0aW5nIHJldCB0byBlbXB0eSBzdHJpbmcgaGVyZVxyXG4gICAgLy8gc28gd2UgZG9uJ3QgZGVmYXVsdCB0byBhdXRvXHJcbiAgICBpZiAoIWV4aXN0cyhyZXQpICYmIHN0eWxlICYmIHN0eWxlW25hbWVdKSB7IHJldCA9IHN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgLy8gRnJvbSB0aGUgaGFjayBieSBEZWFuIEVkd2FyZHNcclxuICAgIC8vIGh0dHA6Ly9lcmlrLmVhZS5uZXQvYXJjaGl2ZXMvMjAwNy8wNy8yNy8xOC41NC4xNS8jY29tbWVudC0xMDIyOTFcclxuXHJcbiAgICBpZiAoc3R5bGVzKSB7XHJcbiAgICAgICAgaWYgKHJldCA9PT0gJycgJiYgIWlzQXR0YWNoZWQoZWxlbSkpIHtcclxuICAgICAgICAgICAgcmV0ID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHdlJ3JlIG5vdCBkZWFsaW5nIHdpdGggYSByZWd1bGFyIHBpeGVsIG51bWJlclxyXG4gICAgICAgIC8vIGJ1dCBhIG51bWJlciB0aGF0IGhhcyBhIHdlaXJkIGVuZGluZywgd2UgbmVlZCB0byBjb252ZXJ0IGl0IHRvIHBpeGVsc1xyXG4gICAgICAgIC8vIGJ1dCBub3QgcG9zaXRpb24gY3NzIGF0dHJpYnV0ZXMsIGFzIHRob3NlIGFyZSBwcm9wb3J0aW9uYWwgdG8gdGhlIHBhcmVudCBlbGVtZW50IGluc3RlYWRcclxuICAgICAgICAvLyBhbmQgd2UgY2FuJ3QgbWVhc3VyZSB0aGUgcGFyZW50IGluc3RlYWQgYmVjYXVzZSBpdCBtaWdodCB0cmlnZ2VyIGEgJ3N0YWNraW5nIGRvbGxzJyBwcm9ibGVtXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHJldCkgJiYgIVJFR0VYLnBvc2l0aW9uKG5hbWUpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1lbWJlciB0aGUgb3JpZ2luYWwgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gc3R5bGUubGVmdCxcclxuICAgICAgICAgICAgICAgIHJzID0gZWxlbS5ydW50aW1lU3R5bGUsXHJcbiAgICAgICAgICAgICAgICByc0xlZnQgPSBycyAmJiBycy5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgLy8gUHV0IGluIHRoZSBuZXcgdmFsdWVzIHRvIGdldCBhIGNvbXB1dGVkIHZhbHVlIG91dFxyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSBlbGVtLmN1cnJlbnRTdHlsZS5sZWZ0OyB9XHJcblxyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gKG5hbWUgPT09ICdmb250U2l6ZScpID8gJzFlbScgOiByZXQ7XHJcbiAgICAgICAgICAgIHJldCA9IF8udG9QeChzdHlsZS5waXhlbExlZnQpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV2ZXJ0IHRoZSBjaGFuZ2VkIHZhbHVlc1xyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gbGVmdDtcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gcnNMZWZ0OyB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXQgPT09IHVuZGVmaW5lZCA/IHJldCA6IHJldCArICcnIHx8ICdhdXRvJztcclxufTtcclxuXHJcbnZhciBub3JtYWxpemVDc3NLZXkgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICByZXR1cm4gUkVHRVguY2FtZWxDYXNlKG5hbWUpO1xyXG59O1xyXG5cclxudmFyIHNldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICBlbGVtLnN0eWxlW25hbWVdID0gKHZhbHVlID09PSArdmFsdWUpID8gXy50b1B4KHZhbHVlKSA6IHZhbHVlO1xyXG59O1xyXG5cclxudmFyIGdldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKGVsZW0pW25hbWVdO1xyXG59O1xyXG5cclxudmFyIGlzSGlkZGVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBTdGFuZGFyZDpcclxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50Lm9mZnNldFBhcmVudFxyXG4gICAgcmV0dXJuIGVsZW0ub2Zmc2V0UGFyZW50ID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgIC8vIFN1cHBvcnQ6IE9wZXJhIDw9IDEyLjEyXHJcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcG9ydHMgb2Zmc2V0V2lkdGhzIGFuZCBvZmZzZXRIZWlnaHRzIGxlc3MgdGhhbiB6ZXJvIG9uIHNvbWUgZWxlbWVudHNcclxuICAgICAgICAgICAgZWxlbS5vZmZzZXRXaWR0aCA8PSAwICYmIGVsZW0ub2Zmc2V0SGVpZ2h0IDw9IDAgfHxcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2tcclxuICAgICAgICAgICAgKChlbGVtLnN0eWxlICYmIGVsZW0uc3R5bGUuZGlzcGxheSkgPyBlbGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyA6IGZhbHNlKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3VyQ3NzOiBjdXJDc3MsXHJcbiAgICB3aWR0aDogIF93aWR0aCxcclxuICAgIGhlaWdodDogX2hlaWdodCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNzczogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwga2V5LCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpZHgpIHsgcmV0dXJuIHJldDsgfSAvLyByZXR1cm4gZWFybHlcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldFt2YWx1ZV0gPSBnZXRTdHlsZShmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgaGlkZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBzaG93KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Jvb2xlYW4oc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgPyB0aGlzLnNob3coKSA6IHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBpc0hpZGRlbihlbGVtKSA/IHNob3coZWxlbSkgOiBoaWRlKGVsZW0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsIi8vIFRPRE86IE9ubHkgcGxhY2UgYmkgbGV2ZWwgY2FjaGluZyBpcyB1c2VkIG5vdy4uLmZpZ3VyZSBvdXQgaG93IHRvIHJlbW92ZVxyXG52YXIgY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgyLCB0cnVlKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIEFDQ0VTU09SICA9ICdfX0RfaWRfXyAnLFxyXG4gICAgdW5pcXVlSWQgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoRGF0ZS5ub3coKSksXHJcblxyXG4gICAgZ2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0gPyBlbGVtW0FDQ0VTU09SXSA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE9yU2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghZWxlbSB8fCAoaWQgPSBlbGVtW0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtBQ0NFU1NPUl0gPSAoaWQgPSB1bmlxdWVJZCgpKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc0RhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5oYXMoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IGdldE9yU2V0SWQoZWxlbSk7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZURhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgfTtcclxuXHJcbi8vIFRPRE86IEFkZHJlc3MgQVBJXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVtb3ZlOiAoZWxlbSwgc3RyKSA9PlxyXG4gICAgICAgIHN0ciA9PT0gdW5kZWZpbmVkID8gcmVtb3ZlQWxsRGF0YShlbGVtKSA6IHJlbW92ZURhdGEoZWxlbSwgc3RyKSxcclxuXHJcbiAgICBEOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldERhdGEoZWxlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHBhc3NlZFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaXNFbGVtZW50KGVsZW0pID8gZ2V0QWxsRGF0YShlbGVtKSA6IHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzRGF0YTogKGVsZW0pID0+XHJcbiAgICAgICAgICAgIGlzRWxlbWVudChlbGVtKSA/IGhhc0RhdGEoZWxlbSkgOiB0aGlzLFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpc0VsZW1lbnQoZWxlbSkgPyByZW1vdmVBbGxEYXRhKGVsZW0pIDogdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQga2V5J3MgdmFsdWVcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbZWxlbUlkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJySWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcnJJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2FycklkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzTnVtYmVyID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBjc3MgICAgICA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG52YXIgYWRkID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHRvdGFsID0gMDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gKGFycltpZHhdIHx8IDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9LFxyXG4gICAgXHJcbiAgICBnZXRJbm5lcldpZHRoID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZWxlbSkpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdMZWZ0JykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdSaWdodCcpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuICAgIGdldElubmVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGVsZW0pKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nVG9wJykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdCb3R0b20nKSlcclxuICAgICAgICBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0ZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICByZXR1cm4gYWRkKFtcclxuICAgICAgICAgICAgZ2V0SW5uZXJXaWR0aChlbGVtKSxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luTGVmdCcpKSA6IDAsXHJcbiAgICAgICAgICAgIHdpdGhNYXJnaW4gPyBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblJpZ2h0JykpIDogMCxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJMZWZ0V2lkdGgnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyUmlnaHRXaWR0aCcpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuICAgIGdldE91dGVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBnZXRJbm5lckhlaWdodChlbGVtKSxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIDogMCxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luQm90dG9tJykpIDogMCxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJUb3BXaWR0aCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICB3aWR0aDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLndpZHRoLnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3Mud2lkdGguZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGVpZ2h0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3MuaGVpZ2h0LnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVyV2lkdGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJXaWR0aChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVySGVpZ2h0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVySGVpZ2h0KGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJXaWR0aDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVyV2lkdGgoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVySGVpZ2h0OiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJIZWlnaHQoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBoYW5kbGVycyA9IHt9O1xyXG5cclxudmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24obmFtZSwgdHlwZSwgZmlsdGVyKSB7XHJcbiAgICBoYW5kbGVyc1tuYW1lXSA9IHtcclxuICAgICAgICBldmVudDogdHlwZSxcclxuICAgICAgICBmaWx0ZXI6IGZpbHRlcixcclxuICAgICAgICB3cmFwOiBmdW5jdGlvbihmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlcihuYW1lLCBmbik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciB3cmFwcGVyID0gZnVuY3Rpb24obmFtZSwgZm4pIHtcclxuICAgIGlmICghZm4pIHsgcmV0dXJuIGZuOyB9XHJcblxyXG4gICAgdmFyIGtleSA9ICdfX2RjZV8nICsgbmFtZTtcclxuICAgIGlmIChmbltrZXldKSB7IHJldHVybiBmbltrZXldOyB9XHJcblxyXG4gICAgcmV0dXJuIGZuW2tleV0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gaGFuZGxlcnNbbmFtZV0uZmlsdGVyKGUpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTsgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnJlZ2lzdGVyKCdsZWZ0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ21pZGRsZS1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAyICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdyaWdodC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAzICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlZ2lzdGVyOiByZWdpc3RlcixcclxuICAgIGhhbmRsZXJzOiBoYW5kbGVyc1xyXG59OyIsInZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgbWF0Y2hlcyAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyksXHJcbiAgICBkZWxlZ2F0ZXMgPSB7fTtcclxuXHJcbi8vIHRoaXMgbWV0aG9kIGNhY2hlcyBkZWxlZ2F0ZXMgc28gdGhhdCAub2ZmKCkgd29ya3Mgc2VhbWxlc3NseVxyXG52YXIgZGVsZWdhdGUgPSBmdW5jdGlvbihyb290LCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmIChkZWxlZ2F0ZXNbZm4uX2RkXSkgeyByZXR1cm4gZGVsZWdhdGVzW2ZuLl9kZF07IH1cclxuXHJcbiAgICB2YXIgaWQgPSBmbi5fZGQgPSBEYXRlLm5vdygpO1xyXG4gICAgcmV0dXJuIGRlbGVnYXRlc1tpZF0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgd2hpbGUgKGVsICYmIGVsICE9PSByb290KSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVzKGVsLCBzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZXZlbnRlZCA9IGZ1bmN0aW9uKG1ldGhvZCwgZWwsIHR5cGUsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKCFleGlzdHMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBmbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZGVsZWdhdGUoZWwsIHNlbGVjdG9yLCBmbikpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvbjogICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmFkZCksXHJcbiAgICBvZmY6ICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LnJlbW92ZSksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmZhYnJpY2F0ZSlcclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgZGVsZWdhdGUgICA9IHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcclxuICAgIGN1c3RvbSAgICAgPSByZXF1aXJlKCcuL2N1c3RvbScpO1xyXG5cclxudmFyIGV2ZW50ZXIgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbih0eXBlcywgZmlsdGVyLCBmbikge1xyXG4gICAgICAgIHZhciB0eXBlbGlzdCA9IHR5cGVzLnNwbGl0KCcgJyk7XHJcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xyXG4gICAgICAgICAgICBmbiA9IGZpbHRlcjtcclxuICAgICAgICAgICAgZmlsdGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgXy5lYWNoKHR5cGVsaXN0LCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IGN1c3RvbS5oYW5kbGVyc1t0eXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIGhhbmRsZXIuZXZlbnQsIGZpbHRlciwgaGFuZGxlci53cmFwKGZuKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCB0eXBlLCBmaWx0ZXIsIGZuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZXIoZGVsZWdhdGUub24pLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vZmYpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlcihkZWxlZ2F0ZS50cmlnZ2VyKVxyXG59OyIsInZhciBfICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0h0bWwgICAgICAgICA9IHJlcXVpcmUoJ2lzL2h0bWwnKSxcclxuICAgIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ICAgICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc051bWJlciAgICAgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNDb2xsZWN0aW9uICAgPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzV2luZG93ICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBzZWxlY3RvckZpbHRlciA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgb3JkZXIgICAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgZGF0YSAgICAgICAgICAgPSByZXF1aXJlKCcuL2RhdGEnKSxcclxuICAgIHBhcnNlciAgICAgICAgID0gcmVxdWlyZSgncGFyc2VyJyk7XHJcblxyXG52YXIgcGFyZW50TG9vcCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLCBwYXJlbnQ7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGVsZW1zW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihlbGVtLCBwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtcztcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgcmVtb3ZlID0gcGFyZW50TG9vcChmdW5jdGlvbihlbGVtLCBwYXJlbnQpIHtcclxuICAgICAgICBkYXRhLnJlbW92ZShlbGVtKTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICB9KSxcclxuXHJcbiAgICBkZXRhY2ggPSBwYXJlbnRMb29wKGZ1bmN0aW9uKGVsZW0sIHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH0pLFxyXG5cclxuICAgIHN0cmluZ1RvRnJhZ21lbnQgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBmcmFnLnRleHRDb250ZW50ID0gJycgKyBzdHI7XHJcbiAgICAgICAgcmV0dXJuIGZyYWc7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZFByZXBlbmRGdW5jID0gZnVuY3Rpb24oZCwgZm4sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChkLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTCk7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCBwYXJzZXIoZWxlbSksIHBlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHN0cmluZ1RvRnJhZ21lbnQocmVzdWx0KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNFbGVtZW50KHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihlbGVtLCByZXN1bHQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTm9kZUxpc3QocmVzdWx0KSB8fCBpc0QocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHJlc3VsdCwgcGVuZGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5ID0gZnVuY3Rpb24oYXJyT25lLCBhcnJUd28sIHBlbmRlcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnJPbmUubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gMCwgbGVuID0gYXJyVHdvLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGFyck9uZVtpZHhdLCBhcnJUd29baV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSA9IGZ1bmN0aW9uKGFyciwgZWxlbSwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoYXJyRWxlbSwgZWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtID0gZnVuY3Rpb24oZWxlbSwgYXJyLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihlbGVtLCBhcnJFbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICB9LFxyXG4gICAgcHJlcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmluc2VydEJlZm9yZShlbGVtLCBiYXNlLmZpcnN0Q2hpbGQpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmFzdG1hcCh0aGlzLnNsaWNlKCksIChlbGVtKSA9PiBlbGVtLmNsb25lTm9kZSh0cnVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBwYXJzZXIodmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWdtZW50KHZhbHVlKSwgYXBwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgYXJyLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGJlZm9yZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gRChlbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudC5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGluc2VydEJlZm9yZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0YXJnZXQsIGVsZW0ubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZnRlcjogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgaW5zZXJ0QWZ0ZXI6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgIHRhcmdldCA9IEQodGFyZ2V0KVswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbSwgdGFyZ2V0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICBpZiAoaXNEKGQpKSB7XHJcbiAgICAgICAgICAgIGQuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgRChvYmopLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcHJlcGVuZDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBwYXJzZXIodmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZ21lbnQodmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIEQoZCkucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBlbGVtcyA9IHRoaXMsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGVsZW0gPSBlbGVtc1tpZHhdLFxyXG4gICAgICAgICAgICAgICAgZGVzY2VuZGFudHMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSxcclxuICAgICAgICAgICAgICAgIGkgPSBkZXNjZW5kYW50cy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBkZXNjO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBkZXNjID0gZGVzY2VuZGFudHNbaV07XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICB0aGlzLmdldCgpLmNvbmNhdChcclxuICAgICAgICAgICAgICAgIC8vIHN0cmluZ1xyXG4gICAgICAgICAgICAgICAgaXNTdHJpbmcoc2VsZWN0b3IpID8gRChzZWxlY3RvcikuZ2V0KCkgOlxyXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvblxyXG4gICAgICAgICAgICAgICAgaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSA/IF8udG9BcnJheShzZWxlY3RvcikgOlxyXG4gICAgICAgICAgICAgICAgLy8gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpIHx8IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBbXVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZShzZWxlY3RvckZpbHRlcih0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHJlbW92ZSh0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgZGV0YWNoKHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRldGFjaCh0aGlzKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzT2JqZWN0ICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdpcy9ub2RlTmFtZScpLFxyXG4gICAgRE9DX0VMRU0gICA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuXHJcbnZhciBnZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiBlbGVtLm9mZnNldFRvcCB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IGVsZW0ub2Zmc2V0TGVmdCB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciByZWN0ID0gaXNBdHRhY2hlZChlbGVtKSA/IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7fTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogIChyZWN0LnRvcCAgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCkgIHx8IDAsXHJcbiAgICAgICAgbGVmdDogKHJlY3QubGVmdCArIGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCkgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtLCBpZHgsIHBvcykge1xyXG4gICAgdmFyIHBvc2l0aW9uID0gZWxlbS5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJyxcclxuICAgICAgICBwcm9wcyAgICA9IHt9O1xyXG5cclxuICAgIC8vIHNldCBwb3NpdGlvbiBmaXJzdCwgaW4tY2FzZSB0b3AvbGVmdCBhcmUgc2V0IGV2ZW4gb24gc3RhdGljIGVsZW1cclxuICAgIGlmIChwb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHsgZWxlbS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7IH1cclxuXHJcbiAgICB2YXIgY3VyT2Zmc2V0ICAgICAgICAgPSBnZXRPZmZzZXQoZWxlbSksXHJcbiAgICAgICAgY3VyQ1NTVG9wICAgICAgICAgPSBlbGVtLnN0eWxlLnRvcCxcclxuICAgICAgICBjdXJDU1NMZWZ0ICAgICAgICA9IGVsZW0uc3R5bGUubGVmdCxcclxuICAgICAgICBjYWxjdWxhdGVQb3NpdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyB8fCBwb3NpdGlvbiA9PT0gJ2ZpeGVkJykgJiYgKGN1ckNTU1RvcCA9PT0gJ2F1dG8nIHx8IGN1ckNTU0xlZnQgPT09ICdhdXRvJyk7XHJcblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocG9zKSkge1xyXG4gICAgICAgIHBvcyA9IHBvcy5jYWxsKGVsZW0sIGlkeCwgY3VyT2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY3VyVG9wLCBjdXJMZWZ0O1xyXG4gICAgLy8gbmVlZCB0byBiZSBhYmxlIHRvIGNhbGN1bGF0ZSBwb3NpdGlvbiBpZiBlaXRoZXIgdG9wIG9yIGxlZnQgaXMgYXV0byBhbmQgcG9zaXRpb24gaXMgZWl0aGVyIGFic29sdXRlIG9yIGZpeGVkXHJcbiAgICBpZiAoY2FsY3VsYXRlUG9zaXRpb24pIHtcclxuICAgICAgICB2YXIgY3VyUG9zaXRpb24gPSBnZXRQb3NpdGlvbihlbGVtKTtcclxuICAgICAgICBjdXJUb3AgID0gY3VyUG9zaXRpb24udG9wO1xyXG4gICAgICAgIGN1ckxlZnQgPSBjdXJQb3NpdGlvbi5sZWZ0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdXJUb3AgID0gcGFyc2VGbG9hdChjdXJDU1NUb3ApICB8fCAwO1xyXG4gICAgICAgIGN1ckxlZnQgPSBwYXJzZUZsb2F0KGN1ckNTU0xlZnQpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV4aXN0cyhwb3MudG9wKSkgIHsgcHJvcHMudG9wICA9IChwb3MudG9wICAtIGN1ck9mZnNldC50b3ApICArIGN1clRvcDsgIH1cclxuICAgIGlmIChleGlzdHMocG9zLmxlZnQpKSB7IHByb3BzLmxlZnQgPSAocG9zLmxlZnQgLSBjdXJPZmZzZXQubGVmdCkgKyBjdXJMZWZ0OyB9XHJcblxyXG4gICAgZWxlbS5zdHlsZS50b3AgID0gXy50b1B4KHByb3BzLnRvcCk7XHJcbiAgICBlbGVtLnN0eWxlLmxlZnQgPSBfLnRvUHgocHJvcHMubGVmdCk7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgcG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aW9uKGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgb2Zmc2V0OiBmdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXQoZmlyc3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ocG9zT3JJdGVyYXRvcikgfHwgaXNPYmplY3QocG9zT3JJdGVyYXRvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PiBzZXRPZmZzZXQoZWxlbSwgaWR4LCBwb3NPckl0ZXJhdG9yKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXRQYXJlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgRE9DX0VMRU07XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiAoIWlzTm9kZU5hbWUob2Zmc2V0UGFyZW50LCAnaHRtbCcpICYmIChvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycpID09PSAnc3RhdGljJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgRE9DX0VMRU07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIG5vZGVUeXBlICAgPSByZXF1aXJlKCdub2RlVHlwZScpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgcHJvcEZpeCA9IHNwbGl0KCd0YWJJbmRleHxyZWFkT25seXxjbGFzc05hbWV8bWF4TGVuZ3RofGNlbGxTcGFjaW5nfGNlbGxQYWRkaW5nfHJvd1NwYW58Y29sU3Bhbnx1c2VNYXB8ZnJhbWVCb3JkZXJ8Y29udGVudEVkaXRhYmxlJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBzdHIpIHtcclxuICAgICAgICBvYmpbc3RyLnRvTG93ZXJDYXNlKCldID0gc3RyO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7XHJcbiAgICAgICAgJ2Zvcic6ICAgJ2h0bWxGb3InLFxyXG4gICAgICAgICdjbGFzcyc6ICdjbGFzc05hbWUnXHJcbiAgICB9KTtcclxuXHJcbnZhciBwcm9wSG9va3MgPSB7XHJcbiAgICBzcmM6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnc3JjJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBocmVmOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ2hyZWYnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IFNhZmFyaSwgSUU5K1xyXG4gICAgLy8gbWlzLXJlcG9ydHMgdGhlIGRlZmF1bHQgc2VsZWN0ZWQgcHJvcGVydHkgb2YgYW4gb3B0aW9uXHJcbiAgICAvLyBBY2Nlc3NpbmcgdGhlIHBhcmVudCdzIHNlbGVjdGVkSW5kZXggcHJvcGVydHkgZml4ZXMgaXRcclxuICAgIHNlbGVjdGVkOiBTVVBQT1JUUy5vcHRTZWxlY3RlZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlLFxyXG4gICAgICAgICAgICAgICAgZml4O1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgaXQgYWxzbyB3b3JrcyB3aXRoIG9wdGdyb3Vwcywgc2VlICM1NzAxXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQucGFyZW50Tm9kZS5zZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdGFiSW5kZXg6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gZWxlbS50YWJJbmRleCBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlIGNvcnJlY3QgdmFsdWUgd2hlbiBpdCBoYXNuJ3QgYmVlbiBleHBsaWNpdGx5IHNldFxyXG4gICAgICAgICAgICAvLyBodHRwOi8vZmx1aWRwcm9qZWN0Lm9yZy9ibG9nLzIwMDgvMDEvMDkvZ2V0dGluZy1zZXR0aW5nLWFuZC1yZW1vdmluZy10YWJpbmRleC12YWx1ZXMtd2l0aC1qYXZhc2NyaXB0L1xyXG4gICAgICAgICAgICAvLyBVc2UgcHJvcGVyIGF0dHJpYnV0ZSByZXRyaWV2YWwoIzEyMDcyKVxyXG4gICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YWJpbmRleCkgeyByZXR1cm4gXy5wYXJzZUludCh0YWJpbmRleCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBub2RlTmFtZSA9IGVsZW0ubm9kZU5hbWU7XHJcbiAgICAgICAgICAgIHJldHVybiAoUkVHRVguaXNGb2N1c2FibGUobm9kZU5hbWUpIHx8IChSRUdFWC5pc0NsaWNrYWJsZShub2RlTmFtZSkgJiYgZWxlbS5ocmVmKSkgPyAwIDogLTE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGdldE9yU2V0UHJvcCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICAvLyBkb24ndCBnZXQvc2V0IHByb3BlcnRpZXMgb24gdGV4dCwgY29tbWVudCBhbmQgYXR0cmlidXRlIG5vZGVzXHJcbiAgICBpZiAoIWVsZW0gfHwgbm9kZVR5cGUudGV4dChlbGVtKSB8fCBub2RlVHlwZS5jb21tZW50KGVsZW0pIHx8IG5vZGVUeXBlLmF0dHIoZWxlbSkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRml4IG5hbWUgYW5kIGF0dGFjaCBob29rc1xyXG4gICAgbmFtZSA9IHByb3BGaXhbbmFtZV0gfHwgbmFtZTtcclxuICAgIHZhciBob29rcyA9IHByb3BIb29rc1tuYW1lXTtcclxuXHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gaG9va3MgJiYgKCdzZXQnIGluIGhvb2tzKSAmJiAocmVzdWx0ID0gaG9va3Muc2V0KGVsZW0sIHZhbHVlLCBuYW1lKSkgIT09IHVuZGVmaW5lZCA/XHJcbiAgICAgICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgICAgIChlbGVtW25hbWVdID0gdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBob29rcyAmJiAoJ2dldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5nZXQoZWxlbSwgbmFtZSkpICE9PSBudWxsID9cclxuICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgIGVsZW1bbmFtZV07XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgcHJvcDogZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9yU2V0UHJvcChmaXJzdCwgcHJvcCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwoZWxlbSwgaWR4LCBnZXRPclNldFByb3AoZWxlbSwgcHJvcCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGdldE9yU2V0UHJvcChlbGVtLCBwcm9wLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlUHJvcDogZnVuY3Rpb24ocHJvcCkge1xyXG4gICAgICAgIGlmICghaXNTdHJpbmcocHJvcCkpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIG5hbWUgPSBwcm9wRml4W3Byb3BdIHx8IHByb3A7XHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBlbGVtW25hbWVdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGV4aXN0cyAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyk7XHJcblxyXG52YXIgY29lcmNlTnVtID0gKHZhbHVlKSA9PlxyXG4gICAgLy8gSXRzIGEgbnVtYmVyISB8fCAwIHRvIGF2b2lkIE5hTiAoYXMgTmFOJ3MgYSBudW1iZXIpXHJcbiAgICArdmFsdWUgPT09IHZhbHVlID8gKHZhbHVlIHx8IDApIDpcclxuICAgIC8vIEF2b2lkIE5hTiBhZ2FpblxyXG4gICAgaXNTdHJpbmcodmFsdWUpID8gKCt2YWx1ZSB8fCAwKSA6XHJcbiAgICAvLyBEZWZhdWx0IHRvIHplcm9cclxuICAgIDA7XHJcblxyXG52YXIgcHJvdGVjdCA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbCwgY2FsbGJhY2spIHtcclxuICAgIHZhciBlbGVtID0gY29udGV4dFswXTtcclxuICAgIGlmICghZWxlbSAmJiAhZXhpc3RzKHZhbCkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIGlmICghZWxlbSkgeyByZXR1cm4gY29udGV4dDsgfVxyXG5cclxuICAgIHJldHVybiBjYWxsYmFjayhjb250ZXh0LCBlbGVtLCB2YWwpO1xyXG59O1xyXG5cclxudmFyIGhhbmRsZXIgPSBmdW5jdGlvbihhdHRyaWJ1dGUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCBlbGVtLCB2YWwpIHtcclxuICAgICAgICBpZiAoZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAgICAgZWxlbVthdHRyaWJ1dGVdID0gY29lcmNlTnVtKHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1bYXR0cmlidXRlXTtcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgc2Nyb2xsVG9wID0gaGFuZGxlcignc2Nyb2xsVG9wJyk7XHJcbnZhciBzY3JvbGxMZWZ0ID0gaGFuZGxlcignc2Nyb2xsTGVmdCcpO1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHNjcm9sbExlZnQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBwcm90ZWN0KHRoaXMsIHZhbCwgc2Nyb2xsTGVmdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNjcm9sbFRvcDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxUb3ApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgRml6emxlICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgcXVhbGlmaWVyKSB7XHJcbiAgICAvLyBFYXJseSByZXR1cm4sIG5vIHF1YWxpZmllci4gRXZlcnl0aGluZyBtYXRjaGVzXHJcbiAgICBpZiAoIXF1YWxpZmllcikgeyByZXR1cm4gYXJyOyB9XHJcblxyXG4gICAgLy8gRnVuY3Rpb25cclxuICAgIGlmIChpc0Z1bmN0aW9uKHF1YWxpZmllcikpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEVsZW1lbnRcclxuICAgIGlmIChxdWFsaWZpZXIubm9kZVR5cGUpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gZWxlbSA9PT0gcXVhbGlmaWVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWxlY3RvclxyXG4gICAgaWYgKGlzU3RyaW5nKHF1YWxpZmllcikpIHtcclxuICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMocXVhbGlmaWVyKTtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gaXMubWF0Y2goZWxlbSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IHF1YWxpZmllclxyXG4gICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IF8uY29udGFpbnMocXVhbGlmaWVyLCBlbGVtKSk7XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBpc1NlbGVjdG9yICAgPSByZXF1aXJlKCdpcy9zZWxlY3RvcicpLFxyXG4gICAgaXNDb2xsZWN0aW9uID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzTm9kZUxpc3QgICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0FycmF5ICAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0QgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBvcmRlciAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgRml6emxlICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb258RWxlbWVudHxOb2RlTGlzdHxBcnJheXxEfSBzZWxlY3RvclxyXG4gKiBAcGFyYW0ge0R9IGNvbnRleHRcclxuICogQHJldHVybnMge0VsZW1lbnRbXX1cclxuICogQHByaXZhdGVcclxuICovXHJcbnZhciBmaW5kV2l0aGluID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgIC8vIEZhaWwgZmFzdFxyXG4gICAgaWYgKCFjb250ZXh0Lmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICB2YXIgcXVlcnksIGRlc2NlbmRhbnRzLCByZXN1bHRzO1xyXG5cclxuICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpIHx8IGlzTm9kZUxpc3Qoc2VsZWN0b3IpIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8IGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBDb252ZXJ0IHNlbGVjdG9yIHRvIGFuIGFycmF5IG9mIGVsZW1lbnRzXHJcbiAgICAgICAgc2VsZWN0b3IgPSBpc0VsZW1lbnQoc2VsZWN0b3IpID8gWyBzZWxlY3RvciBdIDogc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIGRlc2NlbmRhbnRzID0gXy5mbGF0dGVuKF8ubWFwKGNvbnRleHQsIChlbGVtKSA9PiBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSkpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBfLmZpbHRlcihkZXNjZW5kYW50cywgKGRlc2NlbmRhbnQpID0+IF8uY29udGFpbnMoc2VsZWN0b3IsIGRlc2NlbmRhbnQpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlcnkgPSBGaXp6bGUucXVlcnkoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBxdWVyeS5leGVjKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhczogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHRhcmdldCkpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHRhcmdldHMgPSB0aGlzLmZpbmQodGFyZ2V0KSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSB0YXJnZXRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmRlci5jb250YWlucyhlbGVtLCB0YXJnZXRzW2lkeF0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5hbnkodGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtLCBpZHgpID0+ICEhaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBpcy5ub3QodGhpcylcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBfLnRvQXJyYXkoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiAhXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+ICFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtICE9PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZmluZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3Ioc2VsZWN0b3IpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciByZXN1bHQgPSBmaW5kV2l0aGluKHNlbGVjdG9yLCB0aGlzKTtcclxuICAgICAgICBpZiAodGhpcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIG9yZGVyLnNvcnQocmVzdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8ubWVyZ2UoRCgpLCByZXN1bHQpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gRCgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNoZWNrZXIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiBjaGVja2VyLmNhbGwoZWxlbSwgZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIEQoKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBub2RlVHlwZSAgICAgICAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXR0YWNoZWQgICAgICAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzRCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIEZpenpsZSAgICAgICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgZ2V0U2libGluZ3MgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc2licyA9IF9nZXROb2RlU2libGluZ3MoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYnMubGVuZ3RoKSB7IHJlc3VsdC5wdXNoKHNpYnMpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldE5vZGVTaWJsaW5ncyA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2licyA9IF8udG9BcnJheShwYXJlbnQuY2hpbGRyZW4pLFxyXG4gICAgICAgICAgICBpZHggID0gc2licy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAvLyBFeGNsdWRlIHRoZSBub2RlIGl0c2VsZiBmcm9tIHRoZSBsaXN0IG9mIGl0cyBwYXJlbnQncyBjaGlsZHJlblxyXG4gICAgICAgICAgICBpZiAoc2lic1tpZHhdID09PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2licztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2hpbGRyZW4gLS0tLS0tXHJcbiAgICBnZXRDaGlsZHJlbiA9IChhcnIpID0+IF8uZmxhdHRlbihfLm1hcChhcnIsIF9jaGlsZHJlbikpLFxyXG4gICAgX2NoaWxkcmVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBraWRzID0gZWxlbS5jaGlsZHJlbixcclxuICAgICAgICAgICAgaWR4ICA9IDAsIGxlbiAgPSBraWRzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyICA9IEFycmF5KGxlbik7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBraWRzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudHMgLS0tLS0tXHJcbiAgICBnZXRDbG9zZXN0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgY2xvc2VzdCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShlbGVtc1tpZHhdLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGVsZW1zW2lkeF0pO1xyXG4gICAgICAgICAgICBjbG9zZXN0ID0gc2VsZWN0b3JGaWx0ZXIocGFyZW50cywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2xvc2VzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNsb3Nlc3RbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50c1VudGlsID0gZnVuY3Rpb24oZCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGRbaWR4XSwgbnVsbCwgc3RvcFNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgX2dldE5vZGVQYXJlbnQgPSAobm9kZSkgPT4gbm9kZSAmJiBub2RlLnBhcmVudE5vZGUsXHJcblxyXG4gICAgX2NyYXdsVXBOb2RlID0gZnVuY3Rpb24obm9kZSwgY29udGV4dCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlO1xyXG5cclxuICAgICAgICB3aGlsZSAoKHBhcmVudCAgID0gX2dldE5vZGVQYXJlbnQocGFyZW50KSkgICAmJlxyXG4gICAgICAgICAgICAgICAhbm9kZVR5cGUuZG9jKHBhcmVudCkgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKHBhcmVudCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudCAtLS0tLS1cclxuICAgIGdldFBhcmVudCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBfZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgX3ByZXZOZXh0Q3Jhd2wgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kXSkgJiYgIW5vZGVUeXBlLmVsZW0oY3VycmVudCkpIHt9XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50OyAgICBcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGdldFByZXYgPSBfcHJldk5leHRDcmF3bCgncHJldmlvdXNTaWJsaW5nJyksXHJcbiAgICBnZXROZXh0ID0gX3ByZXZOZXh0Q3Jhd2woJ25leHRTaWJsaW5nJyksXHJcblxyXG4gICAgX3ByZXZOZXh0Q3Jhd2xBbGwgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ICA9IFtdLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kXSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKGN1cnJlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGdldFByZXZBbGwgPSBfcHJldk5leHRDcmF3bEFsbCgncHJldmlvdXNTaWJsaW5nJyksXHJcbiAgICBnZXROZXh0QWxsID0gX3ByZXZOZXh0Q3Jhd2xBbGwoJ25leHRTaWJsaW5nJyksXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsQWxsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGZpbHRlcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHsgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZyk7IH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJsaW5ncyA9IF8uZmlsdGVyKHNpYmxpbmdzLCBmaWx0ZXIgfHwgZXhpc3RzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxVbnRpbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBpdGVyYXRvcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gZnVuY3Rpb24oc2libGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBpcy5tYXRjaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNNYXRjaDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goc2libGluZ3MsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHJldmVyc2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdW5pcXVlKGVsZW1zKTtcclxuICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEQocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KHNlbGVjdG9yRmlsdGVyKGVsZW1zLCBzZWxlY3RvciksIHJldmVyc2UpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBjb250ZW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgIF8ucGx1Y2sodGhpcywgJ2NoaWxkTm9kZXMnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIHJldHVybiBEKHNlbGVjdG9yKS5pbmRleE9mKGZpcnN0KTsgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3RvclswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFjayAgICAgICAgXHJcbiAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGZpcnN0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlzQXR0YWNoZWQgY2hlY2sgdG8gcGFzcyB0ZXN0IFwiTm9kZSB3aXRob3V0IHBhcmVudCByZXR1cm5zIC0xXCJcclxuICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IG5vZGVUeXBlLmRvY19mcmFnKHBhcmVudCk7XHJcblxyXG4gICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIG5vZGVUeXBlLmVsZW0pO1xyXG5cclxuICAgICAgICByZXR1cm4gW10uaW5kZXhPZi5jYWxsKGNoaWxkRWxlbXMsIGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgbmV3bGluZXMgICA9IHJlcXVpcmUoJ3V0aWwvbmV3bGluZXMnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOdW1iZXIgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnaXMvbm9kZU5hbWUnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbTtcclxuXHJcbnZhciBub3JtYWxOb2RlTmFtZSA9IChlbGVtKSA9PiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCksXHJcblxyXG4gICAgb3V0ZXJIdG1sID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID8gdGhpc1swXS5vdXRlckhUTUwgOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0R2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtKSA9PiBlbGVtLnRleHRDb250ZW50IDpcclxuICAgICAgICAgICAgKGVsZW0pID0+IGVsZW0uaW5uZXJUZXh0LFxyXG5cclxuICAgIHRleHRTZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS50ZXh0Q29udGVudCA9IHN0ciA6XHJcbiAgICAgICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0uaW5uZXJUZXh0ID0gc3RyO1xyXG5cclxudmFyIHZhbEhvb2tzID0ge1xyXG4gICAgb3B0aW9uOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgcmV0dXJuIChleGlzdHModmFsKSA/IHZhbCA6IHRleHRHZXQoZWxlbSkpLnRyaW0oKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBpbmRleCAgID0gZWxlbS5zZWxlY3RlZEluZGV4LFxyXG4gICAgICAgICAgICAgICAgb25lICAgICA9IGVsZW0udHlwZSA9PT0gJ3NlbGVjdC1vbmUnIHx8IGluZGV4IDwgMCxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBvbmUgPyBudWxsIDogW10sXHJcbiAgICAgICAgICAgICAgICBtYXggICAgID0gb25lID8gaW5kZXggKyAxIDogb3B0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gaW5kZXggPCAwID8gbWF4IDogKG9uZSA/IGluZGV4IDogMCk7XHJcblxyXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHRoZSBzZWxlY3RlZCBvcHRpb25zXHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBtYXg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogSUU2LTggYnVnLiByZW1vdmVcclxuICAgICAgICAgICAgICAgIC8vIG9sZElFIGRvZXNuJ3QgdXBkYXRlIHNlbGVjdGVkIGFmdGVyIGZvcm0gcmVzZXQgKCMyNTUxKVxyXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb24uc2VsZWN0ZWQgfHwgaWR4ID09PSBpbmRleCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgcmV0dXJuIG9wdGlvbnMgdGhhdCBhcmUgZGlzYWJsZWQgb3IgaW4gYSBkaXNhYmxlZCBvcHRncm91cFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoU1VQUE9SVFMub3B0RGlzYWJsZWQgPyAhb3B0aW9uLmRpc2FibGVkIDogb3B0aW9uLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fCAhaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcclxuICAgICAgICAgICAgICAgICAgICBpZiAob25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9wdGlvblNldCwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBfLm1ha2VBcnJheSh2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gb3B0aW9ucy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh2YWx1ZXMsIHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBvcHRpb25TZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYnJvd3NlcnMgdG8gYmVoYXZlIGNvbnNpc3RlbnRseSB3aGVuIG5vbi1tYXRjaGluZyB2YWx1ZSBpcyBzZXRcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25TZXQpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIFJhZGlvIGFuZCBjaGVja2JveCBnZXR0ZXIgZm9yIFdlYmtpdFxyXG5pZiAoIVNVUFBPUlRTLmNoZWNrT24pIHtcclxuICAgIF8uZWFjaChbJ3JhZGlvJywgJ2NoZWNrYm94J10sIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICB2YWxIb29rc1t0eXBlXSA9IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0OiBXZWJraXQgLSAnJyBpcyByZXR1cm5lZCBpbnN0ZWFkIG9mICdvbicgaWYgYSB2YWx1ZSBpc24ndCBzcGVjaWZpZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKSA9PT0gbnVsbCA/ICdvbicgOiBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgZ2V0VmFsID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5vZGVOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suZ2V0KSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2suZ2V0KGVsZW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzU3RyaW5nKHZhbCkgPyBuZXdsaW5lcyh2YWwpIDogdmFsO1xyXG59O1xyXG5cclxudmFyIHN0cmluZ2lmeSA9ICh2YWx1ZSkgPT5cclxuICAgICFleGlzdHModmFsdWUpID8gJycgOiAodmFsdWUgKyAnJyk7XHJcblxyXG52YXIgc2V0VmFsID0gZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAvLyBTdHJpbmdpZnkgdmFsdWVzXHJcbiAgICB2YXIgdmFsdWUgPSBpc0FycmF5KHZhbCkgPyBfLm1hcCh2YWwsIHN0cmluZ2lmeSkgOiBzdHJpbmdpZnkodmFsKTtcclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTm9kZU5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5zZXQpIHtcclxuICAgICAgICBob29rLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvdXRlckh0bWw6IG91dGVySHRtbCxcclxuICAgIG91dGVySFRNTDogb3V0ZXJIdG1sLFxyXG5cclxuICAgIGh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoaHRtbCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZWxlbS5pbm5lckhUTUwgPSBodG1sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IGh0bWw7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICByZXR1cm4gKCFmaXJzdCkgPyB1bmRlZmluZWQgOiBmaXJzdC5pbm5lckhUTUw7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAvLyBnZXR0ZXJcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgJycpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBnZXRWYWwoZWxlbSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFZhbChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0dGVyc1xyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzdHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHRleHRTZXQoZWxlbSwgc3RyKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzdHIpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHN0cjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgdGV4dEdldChlbGVtKSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAodGhpcywgKGVsZW0pID0+IHRleHRHZXQoZWxlbSkpLmpvaW4oJycpO1xyXG4gICAgfVxyXG59OyIsInZhciBpcyA9IGZ1bmN0aW9uKHgpIHtcclxuICAgIHJldHVybiAoZWxlbSkgPT4gZWxlbSAmJiBlbGVtLm5vZGVUeXBlID09PSB4O1xyXG59O1xyXG5cclxuLy8gY29tbWVudGVkLW91dCBtZXRob2RzIGFyZSBub3QgYmVpbmcgdXNlZFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGVsZW06IGlzKDEpLFxyXG4gICAgYXR0cjogaXMoMiksXHJcbiAgICB0ZXh0OiBpcygzKSxcclxuICAgIC8vIGNkYXRhOiBpcyg0KSxcclxuICAgIC8vIGVudGl0eV9yZWZlcmVuY2U6IGlzKDUpLFxyXG4gICAgLy8gZW50aXR5OiBpcyg2KSxcclxuICAgIC8vIHByb2Nlc3NpbmdfaW5zdHJ1Y3Rpb246IGlzKDcpLFxyXG4gICAgY29tbWVudDogaXMoOCksXHJcbiAgICBkb2M6IGlzKDkpLFxyXG4gICAgLy8gZG9jdW1lbnRfdHlwZTogaXMoMTApLFxyXG4gICAgZG9jX2ZyYWc6IGlzKDExKVxyXG4gICAgLy8gbm90YXRpb246IGlzKDEyKSxcclxufTsiLCJ2YXIgcmVhZHkgPSBmYWxzZSxcclxuICAgIHJlZ2lzdHJhdGlvbiA9IFtdO1xyXG5cclxudmFyIHdhaXQgPSBmdW5jdGlvbihmbikge1xyXG4gICAgLy8gQWxyZWFkeSBsb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgcmV0dXJuIGZuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhbmRhcmRzLWJhc2VkIGJyb3dzZXJzIHN1cHBvcnQgRE9NQ29udGVudExvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBJRSBldmVudCBtb2RlbCBpcyB1c2VkXHJcblxyXG4gICAgLy8gRW5zdXJlIGZpcmluZyBiZWZvcmUgb25sb2FkLCBtYXliZSBsYXRlIGJ1dCBzYWZlIGFsc28gZm9yIGlmcmFtZXNcclxuICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykgeyBmbigpOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBIGZhbGxiYWNrIHRvIHdpbmRvdy5vbmxvYWQsIHRoYXQgd2lsbCBhbHdheXMgd29ya1xyXG4gICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmbik7XHJcbn07XHJcblxyXG53YWl0KGZ1bmN0aW9uKCkge1xyXG4gICAgcmVhZHkgPSB0cnVlO1xyXG5cclxuICAgIC8vIGNhbGwgcmVnaXN0ZXJlZCBtZXRob2RzICAgIFxyXG4gICAgd2hpbGUgKHJlZ2lzdHJhdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICByZWdpc3RyYXRpb24uc2hpZnQoKSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGNhbGxiYWNrKSA9PlxyXG4gICAgcmVhZHkgPyBjYWxsYmFjaygpIDogcmVnaXN0cmF0aW9uLnB1c2goY2FsbGJhY2spO1xyXG4iLCJ2YXIgaXNBdHRhY2hlZCAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIC8vIGh0dHA6Ly9lam9obi5vcmcvYmxvZy9jb21wYXJpbmctZG9jdW1lbnQtcG9zaXRpb24vXHJcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgQ09OVEFJTkVEX0JZID0gMTYsXHJcbiAgICBGT0xMT1dJTkcgICAgPSA0LFxyXG4gICAgRElTQ09OTkVDVEVEID0gMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIFBvc2l0aW9uIC0gTUlUIExpY2Vuc2VkLCBKb2huIFJlc2lnXHJcbnZhciBjb21wYXJlUG9zaXRpb24gPSAobm9kZTEsIG5vZGUyKSA9PlxyXG4gICAgICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cclxuICAgICAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihub2RlMikgOlxyXG4gICAgICAgIDAsXHJcbiAgICBcclxuICAgIGlzID0gKHJlbCwgZmxhZykgPT4gKHJlbCAmIGZsYWcpID09PSBmbGFnLFxyXG5cclxuICAgIGlzTm9kZSA9IChiLCBmbGFnLCBhKSA9PiBpcyhjb21wYXJlUG9zaXRpb24oYSwgYiksIGZsYWcpLFxyXG5cclxuICAgIGhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxudmFyIHNvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgIC8vIEZsYWcgZm9yIGR1cGxpY2F0ZSByZW1vdmFsXHJcbiAgICBpZiAobm9kZTEgPT09IG5vZGUyKSB7XHJcbiAgICAgICAgaGFzRHVwbGljYXRlID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTb3J0IG9uIG1ldGhvZCBleGlzdGVuY2UgaWYgb25seSBvbmUgaW5wdXQgaGFzIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICB2YXIgcmVsID0gIW5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIC0gIW5vZGUyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xyXG4gICAgaWYgKHJlbCkge1xyXG4gICAgICAgIHJldHVybiByZWw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm9kZXMgc2hhcmUgdGhlIHNhbWUgZG9jdW1lbnRcclxuICAgIGlmICgobm9kZTEub3duZXJEb2N1bWVudCB8fCBub2RlMSkgPT09IChub2RlMi5vd25lckRvY3VtZW50IHx8IG5vZGUyKSkge1xyXG4gICAgICAgIHJlbCA9IGNvbXBhcmVQb3NpdGlvbihub2RlMSwgbm9kZTIpO1xyXG4gICAgfVxyXG4gICAgLy8gT3RoZXJ3aXNlIHdlIGtub3cgdGhleSBhcmUgZGlzY29ubmVjdGVkXHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZWwgPSBESVNDT05ORUNURUQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm90IGRpcmVjdGx5IGNvbXBhcmFibGVcclxuICAgIGlmICghcmVsKSB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICBpZiAoaXMocmVsLCBESVNDT05ORUNURUQpKSB7XHJcbiAgICAgICAgdmFyIGlzTm9kZTFEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMSk7XHJcbiAgICAgICAgdmFyIGlzTm9kZTJEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgIGlmIChpc05vZGUxRGlzY29ubmVjdGVkICYmIGlzTm9kZTJEaXNjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaXNOb2RlMkRpc2Nvbm5lY3RlZCA/IC0xIDogMTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXMocmVsLCBGT0xMT1dJTkcpID8gLTEgOiAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnRzIGFuIGFycmF5IG9mIEQgZWxlbWVudHMgaW4tcGxhY2UgKGkuZS4sIG11dGF0ZXMgdGhlIG9yaWdpbmFsIGFycmF5KVxyXG4gKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge0VsZW1lbnRbXX0gYXJyYXkgICAgICAgICAgQXJyYXkgb2YgRCBlbGVtZW50cy5cclxuICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQsIG90aGVyd2lzZSBmYWxzZS5cclxuICogQHNlZSBqUXVlcnkgc3JjL3NlbGVjdG9yLW5hdGl2ZS5qczozN1xyXG4gKi9cclxuZXhwb3J0cy5zb3J0ID0gZnVuY3Rpb24oYXJyYXksIHJldmVyc2UpIHtcclxuICAgIGhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG4gICAgYXJyYXkuc29ydChzb3J0KTtcclxuICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgYXJyYXkucmV2ZXJzZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhhc0R1cGxpY2F0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmAuXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gYSBEIGVsZW1lbnQgbm9kZVxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGIgRCBlbGVtZW50IG5vZGVcclxuICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmA7IG90aGVyd2lzZSBmYWxzZS5cclxuICovXHJcbmV4cG9ydHMuY29udGFpbnMgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICB2YXIgYlVwID0gaXNBdHRhY2hlZChiKSA/IGIucGFyZW50Tm9kZSA6IG51bGw7XHJcblxyXG4gICAgaWYgKGEgPT09IGJVcCkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc0VsZW1lbnQoYlVwKSkge1xyXG4gICAgICAgIC8vIE1vZGVybiBicm93c2VycyAoSUU5KylcclxuICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNOb2RlKGJVcCwgQ09OVEFJTkVEX0JZLCBhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG4iLCJ2YXIgUkVHRVggPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgTUFYX1NJTkdMRV9UQUdfTEVOR1RIID0gMzAsXHJcbiAgICBjcmVhdGUgPSByZXF1aXJlKCdESVYvY3JlYXRlJyk7XHJcblxyXG52YXIgcGFyc2VTdHJpbmcgPSBmdW5jdGlvbihwYXJlbnRUYWdOYW1lLCBodG1sU3RyKSB7XHJcbiAgICB2YXIgcGFyZW50ID0gY3JlYXRlKHBhcmVudFRhZ05hbWUpO1xyXG4gICAgcGFyZW50LmlubmVySFRNTCA9IGh0bWxTdHI7XHJcbiAgICByZXR1cm4gcGFyZW50O1xyXG59O1xyXG5cclxudmFyIHBhcnNlU2luZ2xlVGFnID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgaWYgKGh0bWxTdHIubGVuZ3RoID4gTUFYX1NJTkdMRV9UQUdfTEVOR1RIKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIHNpbmdsZVRhZ01hdGNoID0gUkVHRVguc2luZ2xlVGFnTWF0Y2goaHRtbFN0cik7XHJcbiAgICByZXR1cm4gc2luZ2xlVGFnTWF0Y2ggPyBbY3JlYXRlKHNpbmdsZVRhZ01hdGNoWzFdKV0gOiBudWxsO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICB2YXIgc2luZ2xlVGFnID0gcGFyc2VTaW5nbGVUYWcoaHRtbFN0cik7XHJcbiAgICBpZiAoc2luZ2xlVGFnKSB7IHJldHVybiBzaW5nbGVUYWc7IH1cclxuXHJcbiAgICB2YXIgcGFyZW50VGFnTmFtZSA9IFJFR0VYLmdldFBhcmVudFRhZ05hbWUoaHRtbFN0ciksXHJcbiAgICAgICAgcGFyZW50ICAgICAgICA9IHBhcnNlU3RyaW5nKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpO1xyXG5cclxuICAgIHZhciBjaGlsZCxcclxuICAgICAgICBpZHggPSBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgICAgIGFyciA9IEFycmF5KGlkeCk7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jaGlsZHJlbltpZHhdO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgYXJyW2lkeF0gPSBjaGlsZDtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHBhcnNlciAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIEZpenpsZSAgICAgPSByZXF1aXJlKCdGaXp6bGUnKSxcclxuICAgIGRhdGEgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKTtcclxuXHJcbnZhciBwYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gcGFyc2VyKHN0cik7XHJcbiAgICByZXR1cm4gcmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggPyBEKHJlc3VsdCkgOiBudWxsO1xyXG59O1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIGRhdGEuRCxcclxue1xyXG4gICAgLy8gQmVjYXVzZSBubyBvbmUga25vdyB3aGF0IHRoZSBjYXNlIHNob3VsZCBiZVxyXG4gICAgcGFyc2VIdG1sOiBwYXJzZUh0bWwsXHJcbiAgICBwYXJzZUhUTUw6IHBhcnNlSHRtbCxcclxuXHJcbiAgICAvLyBleHBvc2UgdGhlIHNlbGVjdG9yIGVuZ2luZSBmb3IgZGVidWdnaW5nXHJcbiAgICBGaXp6bGU6ICBGaXp6bGUsXHJcblxyXG4gICAgZWFjaDogICAgXy5qcUVhY2gsXHJcbiAgICBmb3JFYWNoOiBfLmRFYWNoLFxyXG4gICAgZXh0ZW5kOiAgXy5leHRlbmQsXHJcblxyXG4gICAgbW9yZUNvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cualF1ZXJ5ID0gd2luZG93LlplcHRvID0gd2luZG93LiQgPSBEO1xyXG4gICAgfVxyXG59KTtcclxuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHNwbGl0ICAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgYXJyYXkgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJ21vZHVsZXMvdHJhbnN2ZXJzYWwnKSxcclxuICAgIGRpbWVuc2lvbnMgID0gcmVxdWlyZSgnbW9kdWxlcy9kaW1lbnNpb25zJyksXHJcbiAgICBtYW5pcCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jc3MnKSxcclxuICAgIGF0dHIgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hdHRyJyksXHJcbiAgICBwcm9wICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3ZhbCcpLFxyXG4gICAgcG9zaXRpb24gICAgPSByZXF1aXJlKCdtb2R1bGVzL3Bvc2l0aW9uJyksXHJcbiAgICBjbGFzc2VzICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgc2Nyb2xsICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Njcm9sbCcpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKSxcclxuICAgIGV2ZW50cyAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9ldmVudHMnKTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIFNVUFBPUlRTID0gcmVxdWlyZSgnU1VQUE9SVFMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU1VQUE9SVFMudmFsdWVOb3JtYWxpemVkID9cclxuICAgIChzdHIpID0+IHN0ciA6XHJcbiAgICAoc3RyKSA9PiBzdHIgPyBzdHIucmVwbGFjZSgvXFxyXFxuL2csICdcXG4nKSA6IHN0cjsiLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgc3RhcnQsIGVuZCkge1xyXG4gICAgLy8gRXhpdCBlYXJseSBmb3IgZW1wdHkgYXJyYXlcclxuICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIC8vIEVuZCwgbmF0dXJhbGx5LCBoYXMgdG8gYmUgaGlnaGVyIHRoYW4gMCB0byBtYXR0ZXIsXHJcbiAgICAvLyBzbyBhIHNpbXBsZSBleGlzdGVuY2UgY2hlY2sgd2lsbCBkb1xyXG4gICAgaWYgKGVuZCkgeyByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0LCBlbmQpOyB9XHJcblxyXG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCB8fCAwKTtcclxufTsiLCIvLyBCcmVha3MgZXZlbiBvbiBhcnJheXMgd2l0aCAzIGl0ZW1zLiAzIG9yIG1vcmVcclxuLy8gaXRlbXMgc3RhcnRzIHNhdmluZyBzcGFjZVxyXG5tb2R1bGUuZXhwb3J0cyA9IChzdHIsIGRlbGltaXRlcikgPT4gc3RyLnNwbGl0KGRlbGltaXRlciB8fCAnfCcpO1xyXG4iLCJ2YXIgaWQgPSAwO1xyXG52YXIgdW5pcXVlSWQgPSBtb2R1bGUuZXhwb3J0cyA9ICgpID0+IGlkKys7XHJcbnVuaXF1ZUlkLnNlZWQgPSBmdW5jdGlvbihzZWVkZWQsIHByZSkge1xyXG4gICAgdmFyIHByZWZpeCA9IHByZSB8fCAnJyxcclxuICAgICAgICBzZWVkID0gc2VlZGVkIHx8IDA7XHJcbiAgICByZXR1cm4gKCkgPT4gcHJlZml4ICsgc2VlZCsrO1xyXG59OyJdfQ==
