/**
 * d-js - jQuery at half the size
 * @version v1.1.4
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

var Query = module.exports = function (selectors) {
    this._selectors = selectors;
};

Query.prototype = {
    exec: function exec(arr, isNew) {
        var result = [],
            idx = 0,
            length = isNew ? 1 : arr.length;
        for (; idx < length; idx++) {
            result = result.concat(find(this._selectors, arr[idx]));
        }
        return result;
    }
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
    childOrSiblingQuery = function childOrSiblingQuery(context, _this) {
    // Child select - needs special help so that "> div" doesn't break
    var method = _this.method,
        selector = _this.selector,
        idApplied = false,
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
    classQuery = function classQuery(context, _this) {
    var method = _this.method,
        selector = _this.selector,

    // Class search, don't start with '.'
    selector = _this.selector.substr(1);

    var selection = context[method](selector);

    return processQuerySelection(selection);
},
    idQuery = function idQuery(context, _this) {
    var method = _this.method,
        selector = _this.selector.substr(1),
        selection = document[method](selector);

    return processQuerySelection(selection);
},
    defaultQuery = function defaultQuery(context, _this) {
    var selection = context[_this.method](_this.selector);
    return processQuerySelection(selection);
},
    determineQuery = function determineQuery(_this) {
    return _this.isChildOrSiblingSelect ? childOrSiblingQuery : _this.isClassSearch ? classQuery : _this.isIdSearch ? idQuery : defaultQuery;
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
        return !this.isChildOrSiblingSelect ? matches(context, this.selector) : false;
    },

    exec: function exec(context) {
        var query = determineQuery(this);

        // these are the types we're expecting to fall through
        // isElement(context) || isNodeList(context) || isCollection(context)
        // if no context is given, use document
        return query(context || document, this);
    }
};

},{"REGEX":13,"_":15,"is/element":24,"is/exists":25,"is/nodeList":28,"matchesSelector":35,"util/uniqueId":64}],9:[function(require,module,exports){
'use strict';

var _ = require('../_'),
    queryCache = require('../cache')(),
    isCache = require('../cache')(),
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
    selector: toSelectors,
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

},{"../_":15,"../cache":16,"./constructs/Is":6,"./constructs/Query":7,"./constructs/Selector":8,"./selector/selector-normalize":11,"./selector/selector-parse":12}],10:[function(require,module,exports){
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
/*
 * Fizzle.js
 * Adapted from Sizzle.js
 */
'use strict';

var tokenCache = require('cache')(),
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
                throw match[0];
            }

            // numeric x and y parameters for Expr.filter.CHILD
            // remember that false/true cast respectively to 0/1
            match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === 'even' || match[3] === 'odd'));
            match[5] = +(match[7] + match[8] || match[3] === 'odd');

            // other types prohibit arguments
        } else if (match[3]) {
            throw match[0];
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
var tokenize = function tokenize(selector) {
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

    return soFar ? null : subqueries;
};

module.exports = {
    /**
     * Splits the given comma-separated CSS selector into separate sub-queries.
     * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
     * @return {String[]|null} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]') or null if there was an error parsing the selector.
     */
    subqueries: function subqueries(selector) {
        var tokens = tokenCache.has(selector) ? tokenCache.get(selector) : tokenCache.set(selector, tokenize(selector));

        if (!tokens) {
            error(selector);return tokens;
        }
        return tokens.slice();
    },

    isBool: function isBool(name) {
        return R_MATCH_EXPR.bool.test(name);
    }
};

// Get excess from tokenize (recursively)

// advance to the next closing parenthesis

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
    Fizzle = require('Fizzle'),
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
        return Fizzle.parse.isBool(attrName);
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

},{"Fizzle":9,"SUPPORTS":14,"_":15,"cache":16,"is/exists":25,"is/function":26,"is/nodeName":29,"is/string":33,"nodeType":55,"util/newlines":61}],40:[function(require,module,exports){
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

    map: _.map,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvcHJveHkuanNvbiIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ub2RlTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvbnVtYmVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9vYmplY3QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9zdHJpbmcuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3dpbmRvdy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbWF0Y2hlc1NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L21hcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZVR5cGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zbGljZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zcGxpdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztBQ0ZuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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TSxJQUFJLENBQUMsQ0FBQztBQUN2QixXQUFPO2VBQU0sTUFBTSxHQUFHLElBQUksRUFBRTtLQUFBLENBQUM7Q0FDaEMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vRCcpO1xyXG5yZXF1aXJlKCcuL3Byb3BzJyk7XHJcbnJlcXVpcmUoJy4vcHJvdG8nKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCB1bndyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSkge1xuICB2YXIgZTtcbiAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ICA9IGUucHJldmVudERlZmF1bHQgIHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCdpcy9hcnJheUxpa2UnKSxcclxuICAgIGlzSHRtbCAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgcGFyc2VyICAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIG9ucmVhZHkgICAgID0gcmVxdWlyZSgnb25yZWFkeScpLFxyXG4gICAgRml6emxlICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBBcGkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBEKHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEFwaSk7XHJcblxyXG5mdW5jdGlvbiBEKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgLy8gbm90aGluXHJcbiAgICBpZiAoIXNlbGVjdG9yKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgLy8gZWxlbWVudCBvciB3aW5kb3cgKGRvY3VtZW50cyBoYXZlIGEgbm9kZVR5cGUpXHJcbiAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUgfHwgc2VsZWN0b3IgPT09IHdpbmRvdykge1xyXG4gICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcclxuICAgICAgICB0aGlzLmxlbmd0aCA9IDE7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSFRNTCBzdHJpbmdcclxuICAgIGlmIChpc0h0bWwoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBwYXJzZXIoc2VsZWN0b3IpKTtcclxuICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTdHJpbmdcclxuICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBGaXp6bGUucXVlcnkoc2VsZWN0b3IpLmV4ZWModGhpcywgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvY3VtZW50IHJlYWR5XHJcbiAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICBvbnJlYWR5KHNlbGVjdG9yKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBvZiBFbGVtZW50cywgTm9kZUxpc3QsIG9yIEQgb2JqZWN0XHJcbiAgICBpZiAoaXNBcnJheUxpa2Uoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuRC5wcm90b3R5cGUgPSBBcGkucHJvdG90eXBlOyIsIm1vZHVsZS5leHBvcnRzID0gKHRhZykgPT4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpOyIsInZhciBkaXYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY3JlYXRlJykoJ2RpdicpO1xyXG5cclxuZGl2LmlubmVySFRNTCA9ICc8YSBocmVmPVwiL2FcIj5hPC9hPic7IiwidmFyIF8gPSByZXF1aXJlKCdfJyk7XHJcblxyXG52YXIgSXMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5Jcy5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSB0aGlzLl9zZWxlY3RvcnMsXHJcbiAgICAgICAgICAgIGlkeCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3JzW2lkeF0ubWF0Y2goY29udGV4dCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5hbnkoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgdGhpcy5tYXRjaChlbGVtKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vdDogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICF0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsInZhciBmaW5kID0gZnVuY3Rpb24oc2VsZWN0b3JzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5cclxuUXVlcnkucHJvdG90eXBlID0ge1xyXG4gICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGZpbmQodGhpcy5fc2VsZWN0b3JzLCBhcnJbaWR4XSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgbWF0Y2hlcyAgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgdW5pcXVlSWQgICA9IHJlcXVpcmUoJ3V0aWwvdW5pcXVlSWQnKS5zZWVkKDAsICdfRCcgKyBEYXRlLm5vdygpKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnO1xyXG5cclxudmFyIGRldGVybWluZU1ldGhvZCA9IChzZWxlY3RvcikgPT5cclxuICAgICAgICBSRUdFWC5pc1N0cmljdElkKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UX0JZX0lEIDpcclxuICAgICAgICBSRUdFWC5pc0NsYXNzKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FIDpcclxuICAgICAgICBSRUdFWC5pc1RhZyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgOiAgICAgICBcclxuICAgICAgICBRVUVSWV9TRUxFQ1RPUl9BTEwsXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gKHNlbGVjdGlvbikgPT5cclxuICAgICAgICAvLyBObyBzZWxlY3Rpb24gb3IgYSBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgLy8gc2hvdWxkIHJlc3VsdCBpbiBub3RoaW5nXHJcbiAgICAgICAgIXNlbGVjdGlvbiB8fCAoaXNOb2RlTGlzdChzZWxlY3Rpb24pICYmICFzZWxlY3Rpb24ubGVuZ3RoKSA/IFtdIDpcclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkIHNlbGVjdGlvbiwgcmV0dXJuIGl0IGFzIGFuIGFycmF5XHJcbiAgICAgICAgaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IFxyXG4gICAgICAgIC8vIGVuc3VyZSBpdCdzIGFuIGFycmF5IGFuZCBub3QgYW4gSFRNTENvbGxlY3Rpb25cclxuICAgICAgICBfLnRvQXJyYXkoc2VsZWN0aW9uKSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgX3RoaXMpIHtcclxuICAgICAgICAvLyBDaGlsZCBzZWxlY3QgLSBuZWVkcyBzcGVjaWFsIGhlbHAgc28gdGhhdCBcIj4gZGl2XCIgZG9lc24ndCBicmVha1xyXG4gICAgICAgIHZhciBtZXRob2QgICAgPSBfdGhpcy5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yICA9IF90aGlzLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKFxyXG4gICAgICAgICAgICAvLyB0YWlsb3IgdGhlIGNoaWxkIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGAjJHtpZEFwcGxpZWQgPyBuZXdJZCA6IGlkfSAke3NlbGVjdG9yfWBcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoaWRBcHBsaWVkKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xhc3NRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIF90aGlzKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gX3RoaXMubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IF90aGlzLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICAvLyBDbGFzcyBzZWFyY2gsIGRvbid0IHN0YXJ0IHdpdGggJy4nXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gX3RoaXMuc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgX3RoaXMpIHtcclxuICAgICAgICB2YXIgbWV0aG9kICAgPSBfdGhpcy5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gX3RoaXMuc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWZhdWx0UXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBfdGhpcykge1xyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W190aGlzLm1ldGhvZF0oX3RoaXMuc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSAoX3RoaXMpID0+XHJcbiAgICAgICAgX3RoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IGNoaWxkT3JTaWJsaW5nUXVlcnkgOlxyXG4gICAgICAgIF90aGlzLmlzQ2xhc3NTZWFyY2ggPyBjbGFzc1F1ZXJ5IDpcclxuICAgICAgICBfdGhpcy5pc0lkU2VhcmNoID8gaWRRdWVyeSA6XHJcbiAgICAgICAgZGVmYXVsdFF1ZXJ5O1xyXG5cclxudmFyIFNlbGVjdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHZhciBzZWxlY3RvciAgICAgICAgICAgICAgICA9IHN0ci50cmltKCksXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCAgPSBzZWxlY3RvclswXSA9PT0gJz4nIHx8IHNlbGVjdG9yWzBdID09PSAnKycsXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gUVVFUllfU0VMRUNUT1JfQUxMIDogZGV0ZXJtaW5lTWV0aG9kKHNlbGVjdG9yKTtcclxuXHJcbiAgICB0aGlzLnN0ciAgICAgICAgICAgICAgICAgICAgPSBzdHI7XHJcbiAgICB0aGlzLnNlbGVjdG9yICAgICAgICAgICAgICAgPSBzZWxlY3RvcjtcclxuICAgIHRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3Q7XHJcbiAgICB0aGlzLmlzSWRTZWFyY2ggICAgICAgICAgICAgPSBtZXRob2QgPT09IEdFVF9FTEVNRU5UX0JZX0lEO1xyXG4gICAgdGhpcy5pc0NsYXNzU2VhcmNoICAgICAgICAgID0gIXRoaXMuaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FO1xyXG4gICAgdGhpcy5tZXRob2QgICAgICAgICAgICAgICAgID0gbWV0aG9kO1xyXG59O1xyXG5cclxuU2VsZWN0b3IucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAvLyBObyBuZWVlZCB0byBjaGVjaywgYSBtYXRjaCB3aWxsIGZhaWwgaWYgaXQnc1xyXG4gICAgICAgIC8vIGNoaWxkIG9yIHNpYmxpbmdcclxuICAgICAgICByZXR1cm4gIXRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IG1hdGNoZXMoY29udGV4dCwgdGhpcy5zZWxlY3RvcikgOiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXhlYzogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBxdWVyeSA9IGRldGVybWluZVF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAvLyB0aGVzZSBhcmUgdGhlIHR5cGVzIHdlJ3JlIGV4cGVjdGluZyB0byBmYWxsIHRocm91Z2hcclxuICAgICAgICAvLyBpc0VsZW1lbnQoY29udGV4dCkgfHwgaXNOb2RlTGlzdChjb250ZXh0KSB8fCBpc0NvbGxlY3Rpb24oY29udGV4dClcclxuICAgICAgICAvLyBpZiBubyBjb250ZXh0IGlzIGdpdmVuLCB1c2UgZG9jdW1lbnRcclxuICAgICAgICByZXR1cm4gcXVlcnkoY29udGV4dCB8fCBkb2N1bWVudCwgdGhpcyk7XHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCcuLi9fJyksXHJcbiAgICBxdWVyeUNhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgaXNDYWNoZSAgICA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIFNlbGVjdG9yICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvU2VsZWN0b3InKSxcclxuICAgIFF1ZXJ5ICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvUXVlcnknKSxcclxuICAgIElzICAgICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvSXMnKSxcclxuICAgIHBhcnNlICAgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlJyksXHJcbiAgICBub3JtYWxpemUgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1ub3JtYWxpemUnKTtcclxuXHJcbnZhciB0b1NlbGVjdG9ycyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgLy8gU2VsZWN0b3JzIHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgLy8gTm90IHJldHVybmluZyBlYXJseSBvciBkb2luZyBleHRyYSBjaGVja3MgYXMgdGhpcyB3aWxsXHJcbiAgICAvLyBub29wIG9uIHRoZSBRdWVyeSBhbmQgSXMgbGV2ZWwgYW5kIGlzIHRoZSBleGNlcHRpb25cclxuICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgIHZhciBzZWxlY3RvcnMgPSBwYXJzZS5zdWJxdWVyaWVzKHN0cikgfHwgW107XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIGVhY2ggb2YgdGhlIHNlbGVjdG9ycy4uLlxyXG4gICAgc2VsZWN0b3JzID0gXy5tYXAoc2VsZWN0b3JzLCBub3JtYWxpemUpO1xyXG5cclxuICAgIC8vIC4uLmFuZCBtYXAgdGhlbSB0byBTZWxlY3RvciBvYmplY3RzXHJcbiAgICByZXR1cm4gXy5mYXN0bWFwKHNlbGVjdG9ycywgKHNlbGVjdG9yKSA9PiBuZXcgU2VsZWN0b3Ioc2VsZWN0b3IpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2VsZWN0b3I6IHRvU2VsZWN0b3JzLFxyXG4gICAgcGFyc2U6IHBhcnNlLFxyXG4gICAgXHJcbiAgICBxdWVyeTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5Q2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLnB1dChzdHIsICgpID0+IG5ldyBRdWVyeSh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBpc0NhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIGlzQ2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgaXNDYWNoZS5wdXQoc3RyLCAoKSA9PiBuZXcgSXModG9TZWxlY3RvcnMoc3RyKSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG4gICAgXCI6Y2hpbGQtZXZlblwiIDogXCI6bnRoLWNoaWxkKGV2ZW4pXCIsXHJcbiAgICBcIjpjaGlsZC1vZGRcIiAgOiBcIjpudGgtY2hpbGQob2RkKVwiLFxyXG4gICAgXCI6dGV4dFwiICAgICAgIDogXCJbdHlwZT10ZXh0XVwiLFxyXG4gICAgXCI6cGFzc3dvcmRcIiAgIDogXCJbdHlwZT1wYXNzd29yZF1cIixcclxuICAgIFwiOnJhZGlvXCIgICAgICA6IFwiW3R5cGU9cmFkaW9dXCIsXHJcbiAgICBcIjpjaGVja2JveFwiICAgOiBcIlt0eXBlPWNoZWNrYm94XVwiLFxyXG4gICAgXCI6c3VibWl0XCIgICAgIDogXCJbdHlwZT1zdWJtaXRdXCIsXHJcbiAgICBcIjpyZXNldFwiICAgICAgOiBcIlt0eXBlPXJlc2V0XVwiLFxyXG4gICAgXCI6YnV0dG9uXCIgICAgIDogXCJbdHlwZT1idXR0b25dXCIsXHJcbiAgICBcIjppbWFnZVwiICAgICAgOiBcIlt0eXBlPWltYWdlXVwiLFxyXG4gICAgXCI6aW5wdXRcIiAgICAgIDogXCJbdHlwZT1pbnB1dF1cIixcclxuICAgIFwiOmZpbGVcIiAgICAgICA6IFwiW3R5cGU9ZmlsZV1cIixcclxuICAgIFwiOnNlbGVjdGVkXCIgICA6IFwiW3NlbGVjdGVkPXNlbGVjdGVkXVwiXHJcbn0iLCJ2YXIgU1VQUE9SVFMgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFBTRVVET19TRUxFQ1QgICAgICA9IC8oOlteXFxzXFwoXFxbKV0rKS9nLFxyXG4gICAgU0VMRUNURURfU0VMRUNUICAgID0gL1xcW3NlbGVjdGVkXFxdL2dpLFxyXG4gICAgY2FjaGUgICAgICAgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgcHJveGllcyAgICAgICAgICAgID0gcmVxdWlyZSgnLi9wcm94eS5qc29uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgcmV0dXJuIGNhY2hlLmhhcyhzdHIpID8gY2FjaGUuZ2V0KHN0cikgOiBjYWNoZS5wdXQoc3RyLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBwc2V1ZG8gcmVwbGFjZSBpZiB0aGUgY2FwdHVyZWQgc2VsZWN0b3IgaXMgaW4gdGhlIHByb3hpZXNcclxuICAgICAgICB2YXIgcyA9IHN0ci5yZXBsYWNlKFBTRVVET19TRUxFQ1QsIChtYXRjaCkgPT4gcHJveGllc1ttYXRjaF0gPyBwcm94aWVzW21hdGNoXSA6IG1hdGNoKTtcclxuXHJcbiAgICAgICAgLy8gYm9vbGVhbiBzZWxlY3RvciByZXBsYWNlbWVudD9cclxuICAgICAgICAvLyBzdXBwb3J0cyBJRTgtOVxyXG4gICAgICAgIHJldHVybiBTVVBQT1JUUy5zZWxlY3RlZFNlbGVjdG9yID8gcyA6IHMucmVwbGFjZShTRUxFQ1RFRF9TRUxFQ1QsICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXScpO1xyXG4gICAgfSk7XHJcbn07IiwiLypcclxuICogRml6emxlLmpzXHJcbiAqIEFkYXB0ZWQgZnJvbSBTaXp6bGUuanNcclxuICovXHJcbnZhciB0b2tlbkNhY2hlICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgZXJyb3IgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciAoY2F1Z2h0KSBcIicrIHNlbGVjdG9yICsnXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zZWxlY3RvcnMvI3doaXRlc3BhY2VcclxuICAgIFdISVRFU1BBQ0UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgSURFTlRJRklFUiA9ICcoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXFxceDAwLVxcXFx4YTBdKSsnLFxyXG5cclxuICAgIC8vIE5PVEU6IExlYXZpbmcgZG91YmxlIHF1b3RlcyB0byByZWR1Y2UgZXNjYXBpbmdcclxuICAgIC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xyXG4gICAgQVRUUklCVVRFUyA9IFwiXFxcXFtcIiArIFdISVRFU1BBQ0UgKyBcIiooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBPcGVyYXRvciAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiKihbKl4kfCF+XT89KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIElERU5USUZJRVJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgSURFTlRJRklFUiArIFwiKSl8KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgXCIqXFxcXF1cIixcclxuXHJcbiAgICBQU0VVRE9TID0gXCI6KFwiICsgSURFTlRJRklFUiArIFwiKSg/OlxcXFwoKFwiICtcclxuICAgICAgICAvLyBUbyByZWR1Y2UgdGhlIG51bWJlciBvZiBzZWxlY3RvcnMgbmVlZGluZyB0b2tlbml6ZSBpbiB0aGUgcHJlRmlsdGVyLCBwcmVmZXIgYXJndW1lbnRzOlxyXG4gICAgICAgIC8vIDEuIHF1b3RlZCAoY2FwdHVyZSAzOyBjYXB0dXJlIDQgb3IgY2FwdHVyZSA1KVxyXG4gICAgICAgIFwiKCcoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcIil8XCIgK1xyXG4gICAgICAgIC8vIDIuIHNpbXBsZSAoY2FwdHVyZSA2KVxyXG4gICAgICAgIFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKClbXFxcXF1dfFwiICsgQVRUUklCVVRFUyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgUl9DT01NQSAgICAgICA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqLCcgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfQ09NQklOQVRPUlMgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKihbPit+XXwnICsgV0hJVEVTUEFDRSArICcpJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9QU0VVRE8gICAgICA9IG5ldyBSZWdFeHAoUFNFVURPUyksXHJcbiAgICBSX01BVENIX0VYUFIgPSB7XHJcbiAgICAgICAgSUQ6ICAgICBuZXcgUmVnRXhwKCdeIygnICAgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBDTEFTUzogIG5ldyBSZWdFeHAoJ15cXFxcLignICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBJREVOVElGSUVSICsgJ3xbKl0pJyksXHJcbiAgICAgICAgQVRUUjogICBuZXcgUmVnRXhwKCdeJyAgICAgKyBBVFRSSUJVVEVTKSxcclxuICAgICAgICBQU0VVRE86IG5ldyBSZWdFeHAoJ14nICAgICArIFBTRVVET1MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufCknICsgV0hJVEVTUEFDRSArICcqKD86KFsrLV18KScgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBXSElURVNQQUNFICsgJypcXFxcKXwpJywgJ2knKSxcclxuICAgICAgICBib29sOiAgIG5ldyBSZWdFeHAoJ14oPzpjaGVja2VkfHNlbGVjdGVkfGFzeW5jfGF1dG9mb2N1c3xhdXRvcGxheXxjb250cm9sc3xkZWZlcnxkaXNhYmxlZHxoaWRkZW58aXNtYXB8bG9vcHxtdWx0aXBsZXxvcGVufHJlYWRvbmx5fHJlcXVpcmVkfHNjb3BlZCkkJywgJ2knKVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDU1MgZXNjYXBlcyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjZXNjYXBlZC1jaGFyYWN0ZXJzXHJcbiAgICBSX1VORVNDQVBFID0gbmV3IFJlZ0V4cCgnXFxcXFxcXFwoW1xcXFxkYS1mXXsxLDZ9JyArIFdISVRFU1BBQ0UgKyAnP3woJyArIFdISVRFU1BBQ0UgKyAnKXwuKScsICdpZycpLFxyXG4gICAgZnVuZXNjYXBlID0gZnVuY3Rpb24oXywgZXNjYXBlZCwgZXNjYXBlZFdoaXRlc3BhY2UpIHtcclxuICAgICAgICB2YXIgaGlnaCA9ICcweCcgKyAoZXNjYXBlZCAtIDB4MTAwMDApO1xyXG4gICAgICAgIC8vIE5hTiBtZWFucyBub24tY29kZXBvaW50XHJcbiAgICAgICAgLy8gU3VwcG9ydDogRmlyZWZveDwyNFxyXG4gICAgICAgIC8vIFdvcmthcm91bmQgZXJyb25lb3VzIG51bWVyaWMgaW50ZXJwcmV0YXRpb24gb2YgKycweCdcclxuICAgICAgICByZXR1cm4gaGlnaCAhPT0gaGlnaCB8fCBlc2NhcGVkV2hpdGVzcGFjZSA/XHJcbiAgICAgICAgICAgIGVzY2FwZWQgOlxyXG4gICAgICAgICAgICBoaWdoIDwgMCA/XHJcbiAgICAgICAgICAgICAgICAvLyBCTVAgY29kZXBvaW50XHJcbiAgICAgICAgICAgICAgICBmcm9tQ2hhckNvZGUoaGlnaCArIDB4MTAwMDApIDpcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBsZW1lbnRhbCBQbGFuZSBjb2RlcG9pbnQgKHN1cnJvZ2F0ZSBwYWlyKVxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKChoaWdoID4+IDEwKSB8IDB4RDgwMCwgKGhpZ2ggJiAweDNGRikgfCAweERDMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVGaWx0ZXIgPSB7XHJcbiAgICAgICAgQVRUUjogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS5yZXBsYWNlKFJfVU5FU0NBUEUsIGZ1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBNb3ZlIHRoZSBnaXZlbiB2YWx1ZSB0byBtYXRjaFszXSB3aGV0aGVyIHF1b3RlZCBvciB1bnF1b3RlZFxyXG4gICAgICAgICAgICBtYXRjaFszXSA9ICggbWF0Y2hbM10gfHwgbWF0Y2hbNF0gfHwgbWF0Y2hbNV0gfHwgJycgKS5yZXBsYWNlKFJfVU5FU0NBUEUsIGZ1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMl0gPT09ICd+PScpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzNdID0gJyAnICsgbWF0Y2hbM10gKyAnICc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCA0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBDSElMRDogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgLyogbWF0Y2hlcyBmcm9tIFJfTUFUQ0hfRVhQUlsnQ0hJTEQnXVxyXG4gICAgICAgICAgICAgICAgMSB0eXBlIChvbmx5fG50aHwuLi4pXHJcbiAgICAgICAgICAgICAgICAyIHdoYXQgKGNoaWxkfG9mLXR5cGUpXHJcbiAgICAgICAgICAgICAgICAzIGFyZ3VtZW50IChldmVufG9kZHxcXGQqfFxcZCpuKFsrLV1cXGQrKT98Li4uKVxyXG4gICAgICAgICAgICAgICAgNCB4bi1jb21wb25lbnQgb2YgeG4reSBhcmd1bWVudCAoWystXT9cXGQqbnwpXHJcbiAgICAgICAgICAgICAgICA1IHNpZ24gb2YgeG4tY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA2IHggb2YgeG4tY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA3IHNpZ24gb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDggeSBvZiB5LWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdLnNsaWNlKDAsIDMpID09PSAnbnRoJykge1xyXG4gICAgICAgICAgICAgICAgLy8gbnRoLSogcmVxdWlyZXMgYXJndW1lbnRcclxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBtYXRjaFswXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBtYXRjaFswXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFBTRVVETzogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgdmFyIGV4Y2VzcyxcclxuICAgICAgICAgICAgICAgIHVucXVvdGVkID0gIW1hdGNoWzZdICYmIG1hdGNoWzJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKFJfTUFUQ0hfRVhQUi5DSElMRC50ZXN0KG1hdGNoWzBdKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFjY2VwdCBxdW90ZWQgYXJndW1lbnRzIGFzLWlzXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIC8vIFN0cmlwIGV4Y2VzcyBjaGFyYWN0ZXJzIGZyb20gdW5xdW90ZWQgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5xdW90ZWQgJiYgUl9QU0VVRE8udGVzdCh1bnF1b3RlZCkgJiZcclxuICAgICAgICAgICAgICAgIC8vIEdldCBleGNlc3MgZnJvbSB0b2tlbml6ZSAocmVjdXJzaXZlbHkpXHJcbiAgICAgICAgICAgICAgICAoZXhjZXNzID0gdG9rZW5pemUodW5xdW90ZWQsIHRydWUpKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gYWR2YW5jZSB0byB0aGUgbmV4dCBjbG9zaW5nIHBhcmVudGhlc2lzXHJcbiAgICAgICAgICAgICAgICAoZXhjZXNzID0gdW5xdW90ZWQuaW5kZXhPZignKScsIHVucXVvdGVkLmxlbmd0aCAtIGV4Y2VzcykgLSB1bnF1b3RlZC5sZW5ndGgpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZXhjZXNzIGlzIGEgbmVnYXRpdmUgaW5kZXhcclxuICAgICAgICAgICAgICAgIG1hdGNoWzBdID0gbWF0Y2hbMF0uc2xpY2UoMCwgZXhjZXNzKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gdW5xdW90ZWQuc2xpY2UoMCwgZXhjZXNzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIG9ubHkgY2FwdHVyZXMgbmVlZGVkIGJ5IHRoZSBwc2V1ZG8gZmlsdGVyIG1ldGhvZCAodHlwZSBhbmQgYXJndW1lbnQpXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCAzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIEZ1bGwgQ1NTIHNlbGVjdG9yIChlLmcuLCAnYSwgaW5wdXQ6Zm9jdXMsIGRpdlthdHRyPVwidmFsdWVcIl0nKS5cclxuICogQHBhcmFtICB7Qm9vbGVhbn0gW3BhcnNlT25seT1mYWxzZV1cclxuICogQHJldHVybiB7U3RyaW5nW118TnVtYmVyfG51bGx9IEFycmF5IG9mIHN1Yi1xdWVyaWVzIChlLmcuLCBbICdhJywgJ2lucHV0OmZvY3VzJywgJ2RpdlthdHRyPVwiKHZhbHVlMSksW3ZhbHVlMl1cIl0nKSBvciBudWxsIGlmIHRoZXJlIHdhcyBhbiBlcnJvciBwYXJzaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIHRva2VuaXplID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgIHZhciAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0eXBlLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1JlZ0V4cH0gKi9cclxuICAgICAgICByZWdleCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheX0gKi9cclxuICAgICAgICBtYXRjaCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgbWF0Y2hlZCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmdbXX0gKi9cclxuICAgICAgICBzdWJxdWVyaWVzID0gW10sXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJ5ID0gJycsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHNvRmFyID0gc2VsZWN0b3I7XHJcblxyXG4gICAgd2hpbGUgKHNvRmFyKSB7XHJcbiAgICAgICAgLy8gQ29tbWEgYW5kIGZpcnN0IHJ1blxyXG4gICAgICAgIGlmICghbWF0Y2hlZCB8fCAobWF0Y2ggPSBSX0NPTU1BLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGNvbnN1bWUgdHJhaWxpbmcgY29tbWFzIGFzIHZhbGlkXHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCkgfHwgc29GYXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuICAgICAgICAgICAgc3VicXVlcnkgPSAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hdGNoZWQgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yc1xyXG4gICAgICAgIGlmICgobWF0Y2ggPSBSX0NPTUJJTkFUT1JTLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGaWx0ZXJzXHJcbiAgICAgICAgZm9yICh0eXBlIGluIFJfTUFUQ0hfRVhQUikge1xyXG4gICAgICAgICAgICByZWdleCA9IFJfTUFUQ0hfRVhQUlt0eXBlXTtcclxuICAgICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKHNvRmFyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaCAmJiAoIXByZUZpbHRlclt0eXBlXSB8fCAobWF0Y2ggPSBwcmVGaWx0ZXJbdHlwZV0obWF0Y2gpKSkpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hlZC5sZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW1hdGNoZWQpIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzdWJxdWVyeSkgeyBzdWJxdWVyaWVzLnB1c2goc3VicXVlcnkpOyB9XHJcblxyXG4gICAgcmV0dXJuIHNvRmFyID8gbnVsbCA6IHN1YnF1ZXJpZXM7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIEZ1bGwgQ1NTIHNlbGVjdG9yIChlLmcuLCAnYSwgaW5wdXQ6Zm9jdXMsIGRpdlthdHRyPVwidmFsdWVcIl0nKS5cclxuICAgICAqIEByZXR1cm4ge1N0cmluZ1tdfG51bGx9IEFycmF5IG9mIHN1Yi1xdWVyaWVzIChlLmcuLCBbICdhJywgJ2lucHV0OmZvY3VzJywgJ2RpdlthdHRyPVwiKHZhbHVlMSksW3ZhbHVlMl1cIl0nKSBvciBudWxsIGlmIHRoZXJlIHdhcyBhbiBlcnJvciBwYXJzaW5nIHRoZSBzZWxlY3Rvci5cclxuICAgICAqL1xyXG4gICAgc3VicXVlcmllczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgdG9rZW5zID0gdG9rZW5DYWNoZS5oYXMoc2VsZWN0b3IpID8gXHJcbiAgICAgICAgICAgIHRva2VuQ2FjaGUuZ2V0KHNlbGVjdG9yKSA6IFxyXG4gICAgICAgICAgICB0b2tlbkNhY2hlLnNldChzZWxlY3RvciwgdG9rZW5pemUoc2VsZWN0b3IpKTtcclxuXHJcbiAgICAgICAgaWYgKCF0b2tlbnMpIHsgZXJyb3Ioc2VsZWN0b3IpOyByZXR1cm4gdG9rZW5zOyB9XHJcbiAgICAgICAgcmV0dXJuIHRva2Vucy5zbGljZSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0Jvb2w6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gUl9NQVRDSF9FWFBSLmJvb2wudGVzdChuYW1lKTtcclxuICAgIH1cclxufTtcclxuIiwiICAgIC8vIE1hdGNoZXMgXCItbXMtXCIgc28gdGhhdCBpdCBjYW4gYmUgY2hhbmdlZCB0byBcIm1zLVwiXHJcbnZhciBUUlVOQ0FURV9NU19QUkVGSVggID0gL14tbXMtLyxcclxuXHJcbiAgICAvLyBNYXRjaGVzIGRhc2hlZCBzdHJpbmcgZm9yIGNhbWVsaXppbmdcclxuICAgIERBU0hfQ0FUQ0ggICAgICAgICAgPSAvLShbXFxkYS16XSkvZ2ksXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIm5vbmVcIiBvciBhIHRhYmxlIHR5cGUgZS5nLiBcInRhYmxlXCIsXHJcbiAgICAvLyBcInRhYmxlLWNlbGxcIiBldGMuLi5cclxuICAgIE5PTkVfT1JfVEFCTEUgICAgICAgPSAvXihub25lfHRhYmxlKD8hLWNbZWFdKS4rKS8sXHJcbiAgICBcclxuICAgIFRZUEVfVEVTVF9GT0NVU0FCTEUgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxidXR0b258b2JqZWN0KSQvaSxcclxuICAgIFRZUEVfVEVTVF9DTElDS0FCTEUgPSAvXig/OmF8YXJlYSkkL2ksXHJcbiAgICBTRUxFQ1RPUl9JRCAgICAgICAgID0gL14jKFtcXHctXSspJC8sXHJcbiAgICBTRUxFQ1RPUl9UQUcgICAgICAgID0gL15bXFx3LV0rJC8sXHJcbiAgICBTRUxFQ1RPUl9DTEFTUyAgICAgID0gL15cXC4oW1xcdy1dKykkLyxcclxuICAgIFBPU0lUSU9OICAgICAgICAgICAgPSAvXih0b3B8cmlnaHR8Ym90dG9tfGxlZnQpJC8sXHJcbiAgICBOVU1fTk9OX1BYICAgICAgICAgID0gbmV3IFJlZ0V4cCgnXignICsgKC9bKy1dPyg/OlxcZCpcXC58KVxcZCsoPzpbZUVdWystXT9cXGQrfCkvKS5zb3VyY2UgKyAnKSg/IXB4KVthLXolXSskJywgJ2knKSxcclxuICAgIFNJTkdMRV9UQUcgICAgICAgICAgPSAvXjwoXFx3KylcXHMqXFwvPz4oPzo8XFwvXFwxPnwpJC8sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYXAgb2YgcGFyZW50IHRhZyBuYW1lcyB0byB0aGUgY2hpbGQgdGFncyB0aGF0IHJlcXVpcmUgdGhlbS5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIFBBUkVOVF9NQVAgPSB7XHJcbiAgICAgICAgdGFibGU6ICAgIC9ePCg/OnRib2R5fHRmb290fHRoZWFkfGNvbGdyb3VwfGNhcHRpb24pXFxiLyxcclxuICAgICAgICB0Ym9keTogICAgL148KD86dHIpXFxiLyxcclxuICAgICAgICB0cjogICAgICAgL148KD86dGR8dGgpXFxiLyxcclxuICAgICAgICBjb2xncm91cDogL148KD86Y29sKVxcYi8sXHJcbiAgICAgICAgc2VsZWN0OiAgIC9ePCg/Om9wdGlvbilcXGIvXHJcbiAgICB9O1xyXG5cclxuLy8gaGF2aW5nIGNhY2hlcyBpc24ndCBhY3R1YWxseSBmYXN0ZXJcclxuLy8gZm9yIGEgbWFqb3JpdHkgb2YgdXNlIGNhc2VzIGZvciBzdHJpbmdcclxuLy8gbWFuaXB1bGF0aW9uc1xyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9zaW1wbGUtY2FjaGUtZm9yLXN0cmluZy1tYW5pcFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG51bU5vdFB4OiAgICAgICAodmFsKSA9PiBOVU1fTk9OX1BYLnRlc3QodmFsKSxcclxuICAgIHBvc2l0aW9uOiAgICAgICAodmFsKSA9PiBQT1NJVElPTi50ZXN0KHZhbCksXHJcbiAgICBzaW5nbGVUYWdNYXRjaDogKHZhbCkgPT4gU0lOR0xFX1RBRy5leGVjKHZhbCksXHJcbiAgICBpc05vbmVPclRhYmxlOiAgKHN0cikgPT4gTk9ORV9PUl9UQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0ZvY3VzYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0ZPQ1VTQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0NsaWNrYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0NMSUNLQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc1N0cmljdElkOiAgICAgKHN0cikgPT4gU0VMRUNUT1JfSUQudGVzdChzdHIpLFxyXG4gICAgaXNUYWc6ICAgICAgICAgIChzdHIpID0+IFNFTEVDVE9SX1RBRy50ZXN0KHN0ciksXHJcbiAgICBpc0NsYXNzOiAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfQ0xBU1MudGVzdChzdHIpLFxyXG5cclxuICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKFRSVU5DQVRFX01TX1BSRUZJWCwgJ21zLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKERBU0hfQ0FUQ0gsIChtYXRjaCwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudFRhZ05hbWU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciB2YWwgPSBzdHIuc3Vic3RyKDAsIDMwKTtcclxuICAgICAgICBmb3IgKHZhciBwYXJlbnRUYWdOYW1lIGluIFBBUkVOVF9NQVApIHtcclxuICAgICAgICAgICAgaWYgKFBBUkVOVF9NQVBbcGFyZW50VGFnTmFtZV0udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50VGFnTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ2Rpdic7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBESVYgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKSxcclxuICAgIGEgICAgICA9IERJVi5xdWVyeVNlbGVjdG9yKCdhJyksXHJcbiAgICBzZWxlY3QgPSBjcmVhdGUoJ3NlbGVjdCcpLFxyXG4gICAgb3B0aW9uID0gc2VsZWN0LmFwcGVuZENoaWxkKGNyZWF0ZSgnb3B0aW9uJykpLFxyXG5cclxuICAgIHRlc3QgPSAodGFnTmFtZSwgdGVzdEZuKSA9PiB0ZXN0Rm4oY3JlYXRlKHRhZ05hbWUpKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgVVJMcyBhcmVuJ3QgbWFuaXB1bGF0ZWRcclxuICAgIC8vIChJRSBub3JtYWxpemVzIGl0IGJ5IGRlZmF1bHQpXHJcbiAgICBocmVmTm9ybWFsaXplZDogYS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSA9PT0gJy9hJyxcclxuXHJcbiAgICAvLyBDaGVjayB0aGUgZGVmYXVsdCBjaGVja2JveC9yYWRpbyB2YWx1ZSAoJycgaW4gb2xkZXIgV2ViS2l0OyAnb24nIGVsc2V3aGVyZSlcclxuICAgIGNoZWNrT246IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gISFpbnB1dC52YWx1ZTtcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFuIGlucHV0IG1haW50YWlucyBpdHMgdmFsdWUgYWZ0ZXIgYmVjb21pbmcgYSByYWRpb1xyXG4gICAgLy8gU3VwcG9ydDogTW9kZXJuIGJyb3dzZXJzIG9ubHkgKE5PVCBJRSA8PSAxMSlcclxuICAgIHJhZGlvVmFsdWU6IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC52YWx1ZSA9ICd0JztcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gaW5wdXQudmFsdWUgPT09ICd0JztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGEgc2VsZWN0ZWQtYnktZGVmYXVsdCBvcHRpb24gaGFzIGEgd29ya2luZyBzZWxlY3RlZCBwcm9wZXJ0eS5cclxuICAgIC8vIChXZWJLaXQgZGVmYXVsdHMgdG8gZmFsc2UgaW5zdGVhZCBvZiB0cnVlLCBJRSB0b28sIGlmIGl0J3MgaW4gYW4gb3B0Z3JvdXApXHJcbiAgICBvcHRTZWxlY3RlZDogb3B0aW9uLnNlbGVjdGVkLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBvcHRpb25zIGluc2lkZSBkaXNhYmxlZCBzZWxlY3RzIGFyZW4ndCBtYXJrZWQgYXMgZGlzYWJsZWRcclxuICAgIC8vIChXZWJLaXQgbWFya3MgdGhlbSBhcyBkaXNhYmxlZClcclxuICAgIG9wdERpc2FibGVkOiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2VsZWN0LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gIW9wdGlvbi5kaXNhYmxlZDtcclxuICAgIH0oKSksXHJcbiAgICBcclxuICAgIHRleHRDb250ZW50OiBESVYudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCxcclxuXHJcbiAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgbm9ybWFsaXplIFxcclxcbiB0byBcXG4gaW4gdGV4dGFyZWEgdmFsdWVzLFxyXG4gICAgLy8gYnV0IElFIDw9IDExIChhbmQgcG9zc2libHkgbmV3ZXIpIGRvIG5vdC5cclxuICAgIHZhbHVlTm9ybWFsaXplZDogdGVzdCgndGV4dGFyZWEnLCBmdW5jdGlvbih0ZXh0YXJlYSkge1xyXG4gICAgICAgIHRleHRhcmVhLnZhbHVlID0gJ1xcclxcbic7XHJcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnZhbHVlID09PSAnXFxuJztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIHNlbGVjdGVkU2VsZWN0b3I6IHRlc3QoJ3NlbGVjdCcsIGZ1bmN0aW9uKHNlbGVjdCkge1xyXG4gICAgICAgIHNlbGVjdC5pbm5lckhUTUwgPSAnPG9wdGlvbiB2YWx1ZT1cIjFcIj4xPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cIjJcIiBzZWxlY3RlZD4yPC9vcHRpb24+JztcclxuICAgICAgICByZXR1cm4gISFzZWxlY3QucXVlcnlTZWxlY3Rvcignb3B0aW9uW3NlbGVjdGVkXScpO1xyXG4gICAgfSlcclxufTtcclxuIiwidmFyIGV4aXN0cyAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgc2xpY2UgICAgICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyk7XHJcblxyXG52YXIgbG9vcCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSkge1xyXG4gICAgICAgIGlmICghb2JqIHx8ICFpdGVyYXRlZSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7XHJcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gK2xlbmd0aCkge1xyXG4gICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGl0ZXJhdGVlLCBvYmpbaWR4XSwgaWR4LCBvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xyXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihpdGVyYXRlZSwgb2JqW2tleXNbaWR4XV0sIGtleXNbaWR4XSwgb2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBfID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBGbGF0dGVuIHRoYXQgYWxzbyBjaGVja3MgaWYgdmFsdWUgaXMgYSBOb2RlTGlzdFxyXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpIHx8IGlzTm9kZUxpc3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KF8uZmxhdHRlbih2YWx1ZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB0b1B4OiAodmFsdWUpID0+IHZhbHVlICsgJ3B4JyxcclxuICAgIFxyXG4gICAgcGFyc2VJbnQ6IChudW0pID0+IHBhcnNlSW50KG51bSwgMTApLFxyXG5cclxuICAgIGV2ZXJ5OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdHMoYXJyKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAoIWl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4dGVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIG9iaiAgPSBhcmdzWzBdLFxyXG4gICAgICAgICAgICBsZW4gID0gYXJncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICghb2JqIHx8IGxlbiA8IDIpIHsgcmV0dXJuIG9iajsgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmdzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdGFuZGFyZCBtYXBcclxuICAgIG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBcnJheS1wcmVzZXJ2aW5nIG1hcFxyXG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vcHVzaC1tYXAtdnMtaW5kZXgtcmVwbGFjZW1lbnQtbWFwXHJcbiAgICBmYXN0bWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoYXJyICYmIGFyci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXJyW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKGFyciAmJiBhcnIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gcHVsbGVkIGZyb20gQU1EXHJcbiAgICB0eXBlY2FzdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFyIHI7XHJcbiAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09ICdudWxsJykge1xyXG4gICAgICAgICAgICByID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3RydWUnKSB7XHJcbiAgICAgICAgICAgIHIgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIHIgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJycgfHwgaXNOYU4odmFsKSkge1xyXG4gICAgICAgICAgICAvLyBpc05hTignJykgcmV0dXJucyBmYWxzZVxyXG4gICAgICAgICAgICByID0gdmFsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHBhcnNlRmxvYXQobnVsbCB8fCAnJykgcmV0dXJucyBOYU5cclxuICAgICAgICAgICAgciA9IHBhcnNlRmxvYXQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFRPRE86XHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZShvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycixcclxuICAgICAgICAgICAgbGVuID0gK29iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcnIgPSBBcnJheShvYmoubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGFycltpZHhdID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgYXJyLnB1c2gob2JqW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQXJyYXk6IChhcmcpID0+XHJcbiAgICAgICAgIWV4aXN0cyhhcmcpID8gW10gOlxyXG4gICAgICAgIGlzQXJyYXlMaWtlKGFyZykgPyBzbGljZShhcmcpIDogWyBhcmcgXSxcclxuXHJcbiAgICBjb250YWluczogKGFyciwgaXRlbSkgPT4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xLFxyXG5cclxuICAgIGpxRWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4LCBjb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgZm4uY2FsbCh2YWx1ZSwga2V5SW5kZXgsIHZhbHVlLCBjb2xsZWN0aW9uKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRFYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmbi5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4KSB7XHJcbiAgICAgICAgZm4odmFsdWUsIGtleUluZGV4KTtcclxuICAgIH0pLFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggZWFjaCBlbGVtZW50IGluIHRoZVxyXG4gICAgICAgIC8vIHNlY29uZCBhcnJheSBhbmQgYWRkIGl0IHRvIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtpZHhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwbHVja1xyXG4gICAgLy8gVE9ETzogQ2hlY2sgZm9yIHBsYWNlcyB0aGlzIGNhbiBiZSBhcHBsaWVkXHJcbiAgICBwbHVjazogZnVuY3Rpb24oYXJyLCBrZXkpIHtcclxuICAgICAgICByZXR1cm4gXy5tYXAoYXJyLCAob2JqKSA9PiBvYmogPyBvYmpba2V5XSA6IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbn07IiwidmFyIGRlbGV0ZXIgPSAoZGVsZXRhYmxlKSA9PlxyXG4gICAgZGVsZXRhYmxlID8gXHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBkZWxldGUgc3RvcmVba2V5XTsgfSA6XHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBzdG9yZVtrZXldID0gdW5kZWZpbmVkOyB9O1xyXG5cclxudmFyIGdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBzdG9yZSAmJiBzdG9yZVtrZXldICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5LCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgZGVsKHN0b3JlLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgYmlMZXZlbEdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciBoYXMxID0ga2V5MSBpbiBzdG9yZSAmJiBzdG9yZVtrZXkxXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBpZiAoIWhhczEgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhczE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBrZXkyIGluIHN0b3JlW2tleTFdICYmIHN0b3JlW2tleTFdW2tleTJdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyByZWYxIDogKHJlZjEgIT09IHVuZGVmaW5lZCA/IHJlZjFba2V5Ml0gOiByZWYxKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5MSwga2V5MiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5MSwga2V5MiwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIC8vIEVhc3kgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbChzdG9yZSwga2V5MSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERlZXAgcmVtb3ZhbFxyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdIHx8IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgZGVsKHJlZjEsIGtleTIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGx2bCwgZGVsZXRhYmxlKSB7XHJcbiAgICByZXR1cm4gbHZsID09PSAyID8gYmlMZXZlbEdldHRlclNldHRlcihkZWxldGFibGUpIDogZ2V0dGVyU2V0dGVyKGRlbGV0YWJsZSk7XHJcbn07IiwidmFyIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMuc2V0ID0gKEQpID0+IGNvbnN0cnVjdG9yID0gRDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiArdmFsdWUubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGg7XHJcbiIsInZhciBpc0RvY3VtZW50RnJhZ21lbnQgPSByZXF1aXJlKCdub2RlVHlwZScpLmRvY19mcmFnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICB2YXIgcGFyZW50O1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpICAgICAgICAgICAgICYmXHJcbiAgICAgICAgIWlzRG9jdW1lbnRGcmFnbWVudChwYXJlbnQpICAgICAgICAgICAgJiZcclxuICAgICAgICBwYXJlbnQuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9EJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgdmFsdWUgJiYgKHZhbHVlID09PSBkb2N1bWVudCB8fCBpc1dpbmRvdyh2YWx1ZSkgfHwgaXNFbGVtZW50KHZhbHVlKSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIG5hbWUpID0+XHJcbiAgICBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJzsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8ICghIXZhbHVlICYmIHR5cGUgPT09ICdvYmplY3QnKTtcclxufTsiLCJ2YXIgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNDb2xsZWN0aW9uID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsKSA9PlxyXG4gICAgdmFsICYmIChpc1N0cmluZyh2YWwpIHx8IGlzRnVuY3Rpb24odmFsKSB8fCBpc0VsZW1lbnQodmFsKSB8fCBpc0NvbGxlY3Rpb24odmFsKSk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSB2YWx1ZS53aW5kb3c7XHJcbiIsInZhciBpc0VsZW1lbnQgICAgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG4vLyBvbmx5IGVsZW1lbnQgdHlwZXMgc3VwcG9ydGVkXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIHNlbGVjdG9yKSA9PlxyXG4gICAgaXNFbGVtZW50KGVsZW0pID8gbWF0Y2hlc1NlbGVjdG9yLmNhbGwoZWxlbSwgc2VsZWN0b3IpIDogZmFsc2U7XHJcbiIsInZhciBfICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIHNsaWNlICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyksXHJcbiAgICBtYXAgICAgID0gcmVxdWlyZSgnLi9tYXAnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHNsaWNlKHRoaXMpOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAraW5kZXg7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbXHJcbiAgICAgICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgICAgIC8vIGlmIG5lZ2F0aXZlLCBvciB0aGUgc3RhcnQgb2YgdGhlIHNldCBpZiBwb3NpdGl2ZVxyXG4gICAgICAgICAgICBpZHggPCAwID8gdGhpcy5sZW5ndGggKyBpZHggOiBpZHhcclxuICAgICAgICBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgIHJldHVybiBEKHNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBfLmRFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBfLmRFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgaWYgKCFhcnIubGVuZ3RoIHx8ICFpdGVyYXRvcikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgIGl0ZW07XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25jYXQgZmxhdCBmb3IgYSBzaW5nbGUgYXJyYXkgb2YgYXJyYXlzXHJcbiAgICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCByZXN1bHRzKTtcclxufTsiLCJ2YXIgb3JkZXIgPSByZXF1aXJlKCdvcmRlcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICB2YXIgaGFzRHVwbGljYXRlcyA9IG9yZGVyLnNvcnQocmVzdWx0cyk7XHJcbiAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgZWxlbSxcclxuICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgIC8vIHNvIHRoYXQgYSBuZXcgYXJyYXkgaXNuJ3RcclxuICAgICAgICAvLyBjcmVhdGVkL2Rlc3Ryb3llZCBldmVyeSB1bmlxdWUgY2FsbFxyXG4gICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAvLyBHbyB0aHJvdWdoIHRoZSBhcnJheSBhbmQgaWRlbnRpZnlcclxuICAgIC8vIHRoZSBkdXBsaWNhdGVzIHRvIGJlIHJlbW92ZWRcclxuICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgIGlmIChlbGVtID09PSByZXN1bHRzW2lkeF0pIHtcclxuICAgICAgICAgICAgZHVwbGljYXRlcy5wdXNoKGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgcmVzdWx0cy5zcGxpY2UoZHVwbGljYXRlc1tpZHhdLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgICAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgaXNOb2RlTmFtZSAgICAgICAgICAgPSByZXF1aXJlKCdpcy9ub2RlTmFtZScpLFxyXG4gICAgbmV3bGluZXMgICAgICAgICAgICAgPSByZXF1aXJlKCd1dGlsL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG5cclxuICAgIHNwbGl0ID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ciA9PT0gJycgPyBbXSA6IHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XHJcbiAgICB9O1xyXG5cclxudmFyIGFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LmFkZChuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC50b2dnbGUobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvdWJsZUNsYXNzTG9vcCA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcywgbWV0aG9kKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZWxlbSA9IGVsZW1zW2lkeF07XHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgICAgIGNsYXNzTGlzdCA9IGVsZW0uY2xhc3NMaXN0O1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2QoY2xhc3NMaXN0LCBuYW1lc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb0FueUVsZW1zSGF2ZUNsYXNzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWUpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBpZiAoZWxlbXNbaWR4XS5jbGFzc0xpc3QuY29udGFpbnMobmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBlbGVtc1tpZHhdLmNsYXNzTmFtZSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoICYmIGV4aXN0cyhuYW1lKSAmJiBuYW1lICE9PSAnJyA/IGRvQW55RWxlbXNIYXZlQ2xhc3ModGhpcywgbmFtZSkgOiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCBhZGRDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsQ2xhc3Nlcyh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHsgbmFtZXMgPSBzcGxpdChuYW1lcyk7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuYW1lcy5sZW5ndGggPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZXMsIHJlbW92ZUNsYXNzKSA6IHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzLCBzaG91bGRBZGQpIHtcclxuICAgICAgICB2YXIgbmFtZUxpc3Q7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoIHx8ICF0aGlzLmxlbmd0aCB8fCAhKG5hbWVMaXN0ID0gc3BsaXQobmFtZXMpKS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNob3VsZEFkZCA9PT0gdW5kZWZpbmVkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCB0b2dnbGVDbGFzcykgOlxyXG4gICAgICAgICAgICBzaG91bGRBZGQgPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIGFkZENsYXNzKSA6XHJcbiAgICAgICAgICAgIGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgcmVtb3ZlQ2xhc3MpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBzcGxpdCAgICAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkICAgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzQm9vbGVhbiAgICAgID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICAgICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzQXJyYXkgICAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRG9jdW1lbnRUeXBlID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5kb2MsXHJcbiAgICBSRUdFWCAgICAgICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MgPSB7XHJcbiAgICBkaXNwbGF5OiAgICAnYmxvY2snLFxyXG4gICAgcG9zaXRpb246ICAgJ2Fic29sdXRlJyxcclxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXHJcbn07XHJcblxyXG52YXIgZ2V0RG9jdW1lbnREaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAvLyBFaXRoZXIgc2Nyb2xsW1dpZHRoL0hlaWdodF0gb3Igb2Zmc2V0W1dpZHRoL0hlaWdodF0gb3JcclxuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdLCB3aGljaGV2ZXIgaXMgZ3JlYXRlc3RcclxuICAgIHZhciBkb2MgPSBlbGVtLmRvY3VtZW50RWxlbWVudDtcclxuICAgIHJldHVybiBNYXRoLm1heChcclxuICAgICAgICBlbGVtLmJvZHlbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBlbGVtLmJvZHlbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZG9jWydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snY2xpZW50JyArIG5hbWVdXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIGhpZGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSxcclxuICAgIHNob3cgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGNzc1N3YXAgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBvbGQgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMsIGFuZCBpbnNlcnQgdGhlIG5ldyBvbmVzXHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgb2xkW25hbWVdID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvbGRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBdm9pZHMgYW4gJ0lsbGVnYWwgSW52b2NhdGlvbicgZXJyb3IgKENocm9tZSlcclxuICAgIC8vIEF2b2lkcyBhICdUeXBlRXJyb3I6IEFyZ3VtZW50IDEgb2YgV2luZG93LmdldENvbXB1dGVkU3R5bGUgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBFbGVtZW50JyBlcnJvciAoRmlyZWZveClcclxuICAgIGdldENvbXB1dGVkU3R5bGUgPSAoZWxlbSkgPT5cclxuICAgICAgICBpc0VsZW1lbnQoZWxlbSkgJiYgIWlzV2luZG93KGVsZW0pICYmICFpc0RvY3VtZW50KGVsZW0pID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSkgOiBudWxsLFxyXG5cclxuICAgIF93aWR0aCA9IHtcclxuICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEb2N1bWVudFR5cGUoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnV2lkdGgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgaWYgKHdpZHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLndpZHRoID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfaGVpZ2h0ID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0RvY3VtZW50VHlwZShlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdIZWlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGVsZW0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoaGVpZ2h0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLmhlaWdodCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgZ2V0V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuXHJcbiAgICAvLyBTdGFydCB3aXRoIG9mZnNldCBwcm9wZXJ0eSwgd2hpY2ggaXMgZXF1aXZhbGVudCB0byB0aGUgYm9yZGVyLWJveCB2YWx1ZVxyXG4gICAgdmFyIHZhbHVlSXNCb3JkZXJCb3ggPSB0cnVlLFxyXG4gICAgICAgIHZhbCA9IChuYW1lID09PSAnd2lkdGgnKSA/IGVsZW0ub2Zmc2V0V2lkdGggOiBlbGVtLm9mZnNldEhlaWdodCxcclxuICAgICAgICBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIGlzQm9yZGVyQm94ID0gc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnO1xyXG5cclxuICAgIC8vIHNvbWUgbm9uLWh0bWwgZWxlbWVudHMgcmV0dXJuIHVuZGVmaW5lZCBmb3Igb2Zmc2V0V2lkdGgsIHNvIGNoZWNrIGZvciBudWxsL3VuZGVmaW5lZFxyXG4gICAgLy8gc3ZnIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjQ5Mjg1XHJcbiAgICAvLyBNYXRoTUwgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD00OTE2NjhcclxuICAgIGlmICh2YWwgPD0gMCB8fCAhZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gY29tcHV0ZWQgdGhlbiB1bmNvbXB1dGVkIGNzcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICB2YWwgPSBjdXJDc3MoZWxlbSwgbmFtZSwgc3R5bGVzKTtcclxuICAgICAgICBpZiAodmFsIDwgMCB8fCAhdmFsKSB7IHZhbCA9IGVsZW0uc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZWQgdW5pdCBpcyBub3QgcGl4ZWxzLiBTdG9wIGhlcmUgYW5kIHJldHVybi5cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgodmFsKSkgeyByZXR1cm4gdmFsOyB9XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdGhlIGNoZWNrIGZvciBzdHlsZSBpbiBjYXNlIGEgYnJvd3NlciB3aGljaCByZXR1cm5zIHVucmVsaWFibGUgdmFsdWVzXHJcbiAgICAgICAgLy8gZm9yIGdldENvbXB1dGVkU3R5bGUgc2lsZW50bHkgZmFsbHMgYmFjayB0byB0aGUgcmVsaWFibGUgZWxlbS5zdHlsZVxyXG4gICAgICAgIHZhbHVlSXNCb3JkZXJCb3ggPSBpc0JvcmRlckJveCAmJiB2YWwgPT09IHN0eWxlc1tuYW1lXTtcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplICcnLCBhdXRvLCBhbmQgcHJlcGFyZSBmb3IgZXh0cmFcclxuICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHZhbCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1c2UgdGhlIGFjdGl2ZSBib3gtc2l6aW5nIG1vZGVsIHRvIGFkZC9zdWJ0cmFjdCBpcnJlbGV2YW50IHN0eWxlc1xyXG4gICAgcmV0dXJuIF8udG9QeChcclxuICAgICAgICB2YWwgKyBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodChcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JyxcclxuICAgICAgICAgICAgdmFsdWVJc0JvcmRlckJveCxcclxuICAgICAgICAgICAgc3R5bGVzXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBDU1NfRVhQQU5EID0gc3BsaXQoJ1RvcHxSaWdodHxCb3R0b218TGVmdCcpO1xyXG52YXIgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBleHRyYSwgaXNCb3JkZXJCb3gsIHN0eWxlcykge1xyXG4gICAgdmFyIHZhbCA9IDAsXHJcbiAgICAgICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIHRoZSByaWdodCBtZWFzdXJlbWVudCwgYXZvaWQgYXVnbWVudGF0aW9uXHJcbiAgICAgICAgaWR4ID0gKGV4dHJhID09PSAoaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JykpID9cclxuICAgICAgICAgICAgNCA6XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpbml0aWFsaXplIGZvciBob3Jpem9udGFsIG9yIHZlcnRpY2FsIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgKG5hbWUgPT09ICd3aWR0aCcpID9cclxuICAgICAgICAgICAgMSA6XHJcbiAgICAgICAgICAgIDAsXHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICAvLyBQdWxsZWQgb3V0IG9mIHRoZSBsb29wIHRvIHJlZHVjZSBzdHJpbmcgY29tcGFyaXNvbnNcclxuICAgICAgICBleHRyYUlzTWFyZ2luICA9IChleHRyYSA9PT0gJ21hcmdpbicpLFxyXG4gICAgICAgIGV4dHJhSXNDb250ZW50ID0gKCFleHRyYUlzTWFyZ2luICYmIGV4dHJhID09PSAnY29udGVudCcpLFxyXG4gICAgICAgIGV4dHJhSXNQYWRkaW5nID0gKCFleHRyYUlzTWFyZ2luICYmICFleHRyYUlzQ29udGVudCAmJiBleHRyYSA9PT0gJ3BhZGRpbmcnKTtcclxuXHJcbiAgICBmb3IgKDsgaWR4IDwgNDsgaWR4ICs9IDIpIHtcclxuICAgICAgICB0eXBlID0gQ1NTX0VYUEFORFtpZHhdO1xyXG5cclxuICAgICAgICAvLyBib3RoIGJveCBtb2RlbHMgZXhjbHVkZSBtYXJnaW4sIHNvIGFkZCBpdCBpZiB3ZSB3YW50IGl0XHJcbiAgICAgICAgaWYgKGV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgYm9yZGVyIG5vciBtYXJnaW4sIHNvIHJlbW92ZSBib3JkZXJcclxuICAgICAgICAgICAgaWYgKCFleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlICsgJ1dpZHRoJ10pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQsIHNvIGFkZCBwYWRkaW5nXHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxudmFyIGN1ckNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGNvbXB1dGVkKSB7XHJcbiAgICB2YXIgc3R5bGUgPSBlbGVtLnN0eWxlLFxyXG4gICAgICAgIHN0eWxlcyA9IGNvbXB1dGVkIHx8IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgcmV0ID0gc3R5bGVzID8gc3R5bGVzLmdldFByb3BlcnR5VmFsdWUobmFtZSkgfHwgc3R5bGVzW25hbWVdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEF2b2lkIHNldHRpbmcgcmV0IHRvIGVtcHR5IHN0cmluZyBoZXJlXHJcbiAgICAvLyBzbyB3ZSBkb24ndCBkZWZhdWx0IHRvIGF1dG9cclxuICAgIGlmICghZXhpc3RzKHJldCkgJiYgc3R5bGUgJiYgc3R5bGVbbmFtZV0pIHsgcmV0ID0gc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAvLyBGcm9tIHRoZSBoYWNrIGJ5IERlYW4gRWR3YXJkc1xyXG4gICAgLy8gaHR0cDovL2VyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA3LzA3LzI3LzE4LjU0LjE1LyNjb21tZW50LTEwMjI5MVxyXG5cclxuICAgIGlmIChzdHlsZXMpIHtcclxuICAgICAgICBpZiAocmV0ID09PSAnJyAmJiAhaXNBdHRhY2hlZChlbGVtKSkge1xyXG4gICAgICAgICAgICByZXQgPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXHJcbiAgICAgICAgLy8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXHJcbiAgICAgICAgLy8gYnV0IG5vdCBwb3NpdGlvbiBjc3MgYXR0cmlidXRlcywgYXMgdGhvc2UgYXJlIHByb3BvcnRpb25hbCB0byB0aGUgcGFyZW50IGVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICAgIC8vIGFuZCB3ZSBjYW4ndCBtZWFzdXJlIHRoZSBwYXJlbnQgaW5zdGVhZCBiZWNhdXNlIGl0IG1pZ2h0IHRyaWdnZXIgYSAnc3RhY2tpbmcgZG9sbHMnIHByb2JsZW1cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgocmV0KSAmJiAhUkVHRVgucG9zaXRpb24obmFtZSkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyIGxlZnQgPSBzdHlsZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcnMgPSBlbGVtLnJ1bnRpbWVTdHlsZSxcclxuICAgICAgICAgICAgICAgIHJzTGVmdCA9IHJzICYmIHJzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IGVsZW0uY3VycmVudFN0eWxlLmxlZnQ7IH1cclxuXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAobmFtZSA9PT0gJ2ZvbnRTaXplJykgPyAnMWVtJyA6IHJldDtcclxuICAgICAgICAgICAgcmV0ID0gXy50b1B4KHN0eWxlLnBpeGVsTGVmdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXZlcnQgdGhlIGNoYW5nZWQgdmFsdWVzXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSByc0xlZnQ7IH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJldCA9PT0gdW5kZWZpbmVkID8gcmV0IDogcmV0ICsgJycgfHwgJ2F1dG8nO1xyXG59O1xyXG5cclxudmFyIG5vcm1hbGl6ZUNzc0tleSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHJldHVybiBSRUdFWC5jYW1lbENhc2UobmFtZSk7XHJcbn07XHJcblxyXG52YXIgc2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIGVsZW0uc3R5bGVbbmFtZV0gPSAodmFsdWUgPT09ICt2YWx1ZSkgPyBfLnRvUHgodmFsdWUpIDogdmFsdWU7XHJcbn07XHJcblxyXG52YXIgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUoZWxlbSlbbmFtZV07XHJcbn07XHJcblxyXG52YXIgaXNIaWRkZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkOlxyXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQub2Zmc2V0UGFyZW50XHJcbiAgICByZXR1cm4gZWxlbS5vZmZzZXRQYXJlbnQgPT09IG51bGwgfHxcclxuICAgICAgICAgICAgLy8gU3VwcG9ydDogT3BlcmEgPD0gMTIuMTJcclxuICAgICAgICAgICAgLy8gT3BlcmEgcmVwb3J0cyBvZmZzZXRXaWR0aHMgYW5kIG9mZnNldEhlaWdodHMgbGVzcyB0aGFuIHplcm8gb24gc29tZSBlbGVtZW50c1xyXG4gICAgICAgICAgICBlbGVtLm9mZnNldFdpZHRoIDw9IDAgJiYgZWxlbS5vZmZzZXRIZWlnaHQgPD0gMCB8fFxyXG4gICAgICAgICAgICAvLyBGYWxsYmFja1xyXG4gICAgICAgICAgICAoKGVsZW0uc3R5bGUgJiYgZWxlbS5zdHlsZS5kaXNwbGF5KSA/IGVsZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIDogZmFsc2UpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjdXJDc3M6IGN1ckNzcyxcclxuICAgIHdpZHRoOiAgX3dpZHRoLFxyXG4gICAgaGVpZ2h0OiBfaGVpZ2h0LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY3NzOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIG5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5O1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBrZXksIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlkeCkgeyByZXR1cm4gcmV0OyB9IC8vIHJldHVybiBlYXJseVxyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0W3ZhbHVlXSA9IGdldFN0eWxlKGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBoaWRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIHNob3cpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKGlzQm9vbGVhbihzdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZSA/IHRoaXMuc2hvdygpIDogdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGlzSGlkZGVuKGVsZW0pID8gc2hvdyhlbGVtKSA6IGhpZGUoZWxlbSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwiLy8gVE9ETzogT25seSBwbGFjZSBiaSBsZXZlbCBjYWNoaW5nIGlzIHVzZWQgbm93Li4uZmlndXJlIG91dCBob3cgdG8gcmVtb3ZlXHJcbnZhciBjYWNoZSAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIsIHRydWUpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgQUNDRVNTT1IgID0gJ19fRF9pZF9fICcsXHJcbiAgICB1bmlxdWVJZCAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZChEYXRlLm5vdygpKSxcclxuXHJcbiAgICBnZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbSA/IGVsZW1bQUNDRVNTT1JdIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3JTZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IChpZCA9IGVsZW1bQUNDRVNTT1JdKSkgeyByZXR1cm4gaWQ7IH1cclxuICAgICAgICBlbGVtW0FDQ0VTU09SXSA9IChpZCA9IHVuaXF1ZUlkKCkpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFzRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmhhcyhpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gZ2V0T3JTZXRJZChlbGVtKTtcclxuICAgICAgICByZXR1cm4gY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlRGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICB9O1xyXG5cclxuLy8gVE9ETzogQWRkcmVzcyBBUElcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZW1vdmU6IChlbGVtLCBzdHIpID0+XHJcbiAgICAgICAgc3RyID09PSB1bmRlZmluZWQgPyByZW1vdmVBbGxEYXRhKGVsZW0pIDogcmVtb3ZlRGF0YShlbGVtLCBzdHIpLFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0RGF0YShlbGVtLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcGFzc2VkXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpc0VsZW1lbnQoZWxlbSkgPyBnZXRBbGxEYXRhKGVsZW0pIDogdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoYXNEYXRhOiAoZWxlbSkgPT5cclxuICAgICAgICAgICAgaXNFbGVtZW50KGVsZW0pID8gaGFzRGF0YShlbGVtKSA6IHRoaXMsXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZURhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVtpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGlzRWxlbWVudChlbGVtKSA/IHJlbW92ZUFsbERhdGEoZWxlbSkgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgdmFsdWVzIGZyb20gaGFzaCBtYXBcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBrZXkncyB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtSWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tlbGVtSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJJZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFycklkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbYXJySWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNOdW1iZXIgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGNzcyAgICAgID0gcmVxdWlyZSgnLi9jc3MnKTtcclxuXHJcbnZhciBhZGQgPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgdG90YWwgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICB0b3RhbCArPSAoYXJyW2lkeF0gfHwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdldElubmVyV2lkdGggPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChlbGVtKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0xlZnQnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1JpZ2h0JykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0SW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZWxlbSkpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRlcldpZHRoID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBnZXRJbm5lcldpZHRoKGVsZW0pLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIDogMCxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luUmlnaHQnKSkgOiAwLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckxlZnRXaWR0aCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJSaWdodFdpZHRoJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0T3V0ZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIGdldElubmVySGVpZ2h0KGVsZW0pLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Ub3AnKSkgOiAwLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Cb3R0b20nKSkgOiAwLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclRvcFdpZHRoJykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckJvdHRvbVdpZHRoJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHdpZHRoOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3Mud2lkdGguc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBoZWlnaHQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy5oZWlnaHQuc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJXaWR0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lcldpZHRoKGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJIZWlnaHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJIZWlnaHQoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlcldpZHRoOiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJXaWR0aChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJIZWlnaHQ6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlckhlaWdodChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGhhbmRsZXJzID0ge307XHJcblxyXG52YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lLCB0eXBlLCBmaWx0ZXIpIHtcclxuICAgIGhhbmRsZXJzW25hbWVdID0ge1xyXG4gICAgICAgIGV2ZW50OiB0eXBlLFxyXG4gICAgICAgIGZpbHRlcjogZmlsdGVyLFxyXG4gICAgICAgIHdyYXA6IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyKG5hbWUsIGZuKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHdyYXBwZXIgPSBmdW5jdGlvbihuYW1lLCBmbikge1xyXG4gICAgaWYgKCFmbikgeyByZXR1cm4gZm47IH1cclxuXHJcbiAgICB2YXIga2V5ID0gJ19fZGNlXycgKyBuYW1lO1xyXG4gICAgaWYgKGZuW2tleV0pIHsgcmV0dXJuIGZuW2tleV07IH1cclxuXHJcbiAgICByZXR1cm4gZm5ba2V5XSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBoYW5kbGVyc1tuYW1lXS5maWx0ZXIoZSk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxucmVnaXN0ZXIoJ2xlZnQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMSAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcignbWlkZGxlLWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDIgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ3JpZ2h0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDMgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxyXG4gICAgaGFuZGxlcnM6IGhhbmRsZXJzXHJcbn07IiwidmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpLFxyXG4gICAgZXhpc3RzICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBtYXRjaGVzICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIGRlbGVnYXRlcyA9IHt9O1xyXG5cclxuLy8gdGhpcyBtZXRob2QgY2FjaGVzIGRlbGVnYXRlcyBzbyB0aGF0IC5vZmYoKSB3b3JrcyBzZWFtbGVzc2x5XHJcbnZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHJvb3QsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKGRlbGVnYXRlc1tmbi5fZGRdKSB7IHJldHVybiBkZWxlZ2F0ZXNbZm4uX2RkXTsgfVxyXG5cclxuICAgIHZhciBpZCA9IGZuLl9kZCA9IERhdGUubm93KCk7XHJcbiAgICByZXR1cm4gZGVsZWdhdGVzW2lkXSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoZWwgJiYgZWwgIT09IHJvb3QpIHtcclxuICAgICAgICAgICAgaWYgKG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBldmVudGVkID0gZnVuY3Rpb24obWV0aG9kLCBlbCwgdHlwZSwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoIWV4aXN0cyhzZWxlY3RvcikpIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGZuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBkZWxlZ2F0ZShlbCwgc2VsZWN0b3IsIGZuKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuYWRkKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQucmVtb3ZlKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuZmFicmljYXRlKVxyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBkZWxlZ2F0ZSAgID0gcmVxdWlyZSgnLi9kZWxlZ2F0ZScpLFxyXG4gICAgY3VzdG9tICAgICA9IHJlcXVpcmUoJy4vY3VzdG9tJyk7XHJcblxyXG52YXIgZXZlbnRlciA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGVzLCBmaWx0ZXIsIGZuKSB7XHJcbiAgICAgICAgdmFyIHR5cGVsaXN0ID0gdHlwZXMuc3BsaXQoJyAnKTtcclxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XHJcbiAgICAgICAgICAgIGZuID0gZmlsdGVyO1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBfLmVhY2godHlwZWxpc3QsIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gY3VzdG9tLmhhbmRsZXJzW3R5cGVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgaGFuZGxlci5ldmVudCwgZmlsdGVyLCBoYW5kbGVyLndyYXAoZm4pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIHR5cGUsIGZpbHRlciwgZm4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vbiksXHJcbiAgICBvZmY6ICAgICBldmVudGVyKGRlbGVnYXRlLm9mZiksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVyKGRlbGVnYXRlLnRyaWdnZXIpXHJcbn07IiwidmFyIF8gICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzSHRtbCAgICAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTm9kZUxpc3QgICAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzTnVtYmVyICAgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBvcmRlciAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBkYXRhICAgICAgICAgICA9IHJlcXVpcmUoJy4vZGF0YScpLFxyXG4gICAgcGFyc2VyICAgICAgICAgPSByZXF1aXJlKCdwYXJzZXInKTtcclxuXHJcbnZhciBwYXJlbnRMb29wID0gZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihlbGVtcykge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gZWxlbXNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0gJiYgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGVsZW0sIHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciByZW1vdmUgPSBwYXJlbnRMb29wKGZ1bmN0aW9uKGVsZW0sIHBhcmVudCkge1xyXG4gICAgICAgIGRhdGEucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRldGFjaCA9IHBhcmVudExvb3AoZnVuY3Rpb24oZWxlbSwgcGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfSksXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnbWVudCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSAnJyArIHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHBhcnNlcihlbGVtKSwgcGVuZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgc3RyaW5nVG9GcmFnbWVudChyZXN1bHQpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0VsZW1lbnQocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkgPSBmdW5jdGlvbihhcnJPbmUsIGFyclR3bywgcGVuZGVyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyck9uZS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIGkgPSAwLCBsZW4gPSBhcnJUd28ubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoYXJyT25lW2lkeF0sIGFyclR3b1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5ID0gZnVuY3Rpb24oYXJyLCBlbGVtLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihhcnJFbGVtLCBlbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0gPSBmdW5jdGlvbihlbGVtLCBhcnIsIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGVsZW0sIGFyckVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgIH0sXHJcbiAgICBwcmVwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuaW5zZXJ0QmVmb3JlKGVsZW0sIGJhc2UuZmlyc3RDaGlsZCk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gXy5mYXN0bWFwKHRoaXMuc2xpY2UoKSwgKGVsZW0pID0+IGVsZW0uY2xvbmVOb2RlKHRydWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZ21lbnQodmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgaW5zZXJ0QmVmb3JlOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRhcmdldCwgZWxlbS5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0Lm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbnNlcnRBZnRlcjogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICBEKG9iaikuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnbWVudCh2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcHJlcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgRChkKS5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGVsZW1zID0gdGhpcyxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IGVsZW1zW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KCkuY29uY2F0KFxyXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nXHJcbiAgICAgICAgICAgICAgICBpc1N0cmluZyhzZWxlY3RvcikgPyBEKHNlbGVjdG9yKS5nZXQoKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAgICBpc0NvbGxlY3Rpb24oc2VsZWN0b3IpID8gXy50b0FycmF5KHNlbGVjdG9yKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikgfHwgaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IFtdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmVtb3ZlKHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gcmVtb3ZlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZXRhY2g6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBkZXRhY2goc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGV0YWNoKHRoaXMpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ2lzL25vZGVOYW1lJyksXHJcbiAgICBET0NfRUxFTSAgID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxudmFyIGdldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHJlY3QgPSBpc0F0dGFjaGVkKGVsZW0pID8gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiAgKHJlY3QudG9wICArIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSAgfHwgMCxcclxuICAgICAgICBsZWZ0OiAocmVjdC5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IGdldE9mZnNldChlbGVtKSxcclxuICAgICAgICBjdXJDU1NUb3AgICAgICAgICA9IGVsZW0uc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gZWxlbS5zdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBlbGVtLnN0eWxlLnRvcCAgPSBfLnRvUHgocHJvcHMudG9wKTtcclxuICAgIGVsZW0uc3R5bGUubGVmdCA9IF8udG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXQ6IGZ1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB8fCBpc09iamVjdChwb3NPckl0ZXJhdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+IHNldE9mZnNldChlbGVtLCBpZHgsIHBvc09ySXRlcmF0b3IpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldFBhcmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8ubWFwKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBlbGVtLm9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghaXNOb2RlTmFtZShvZmZzZXRQYXJlbnQsICdodG1sJykgJiYgKG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJykgPT09ICdzdGF0aWMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgc3BsaXQgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgbm9kZVR5cGUgICA9IHJlcXVpcmUoJ25vZGVUeXBlJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBwcm9wRml4ID0gc3BsaXQoJ3RhYkluZGV4fHJlYWRPbmx5fGNsYXNzTmFtZXxtYXhMZW5ndGh8Y2VsbFNwYWNpbmd8Y2VsbFBhZGRpbmd8cm93U3Bhbnxjb2xTcGFufHVzZU1hcHxmcmFtZUJvcmRlcnxjb250ZW50RWRpdGFibGUnKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cikge1xyXG4gICAgICAgIG9ialtzdHIudG9Mb3dlckNhc2UoKV0gPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHtcclxuICAgICAgICAnZm9yJzogICAnaHRtbEZvcicsXHJcbiAgICAgICAgJ2NsYXNzJzogJ2NsYXNzTmFtZSdcclxuICAgIH0pO1xyXG5cclxudmFyIHByb3BIb29rcyA9IHtcclxuICAgIHNyYzogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhyZWY6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnaHJlZicsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3VwcG9ydDogU2FmYXJpLCBJRTkrXHJcbiAgICAvLyBtaXMtcmVwb3J0cyB0aGUgZGVmYXVsdCBzZWxlY3RlZCBwcm9wZXJ0eSBvZiBhbiBvcHRpb25cclxuICAgIC8vIEFjY2Vzc2luZyB0aGUgcGFyZW50J3Mgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBmaXhlcyBpdFxyXG4gICAgc2VsZWN0ZWQ6IFNVUFBPUlRTLm9wdFNlbGVjdGVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgICAgICBmaXg7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQuc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBhbHNvIHdvcmtzIHdpdGggb3B0Z3JvdXBzLCBzZWUgIzU3MDFcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5wYXJlbnROb2RlLnNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0YWJJbmRleDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBlbGVtLnRhYkluZGV4IGRvZXNuJ3QgYWx3YXlzIHJldHVybiB0aGUgY29ycmVjdCB2YWx1ZSB3aGVuIGl0IGhhc24ndCBiZWVuIGV4cGxpY2l0bHkgc2V0XHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9mbHVpZHByb2plY3Qub3JnL2Jsb2cvMjAwOC8wMS8wOS9nZXR0aW5nLXNldHRpbmctYW5kLXJlbW92aW5nLXRhYmluZGV4LXZhbHVlcy13aXRoLWphdmFzY3JpcHQvXHJcbiAgICAgICAgICAgIC8vIFVzZSBwcm9wZXIgYXR0cmlidXRlIHJldHJpZXZhbCgjMTIwNzIpXHJcbiAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhYmluZGV4KSB7IHJldHVybiBfLnBhcnNlSW50KHRhYmluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChSRUdFWC5pc0ZvY3VzYWJsZShub2RlTmFtZSkgfHwgKFJFR0VYLmlzQ2xpY2thYmxlKG5vZGVOYW1lKSAmJiBlbGVtLmhyZWYpKSA/IDAgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0T3JTZXRQcm9wID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIC8vIGRvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcclxuICAgIGlmICghZWxlbSB8fCBub2RlVHlwZS50ZXh0KGVsZW0pIHx8IG5vZGVUeXBlLmNvbW1lbnQoZWxlbSkgfHwgbm9kZVR5cGUuYXR0cihlbGVtKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3JTZXRQcm9wKGZpcnN0LCBwcm9wKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVQcm9wOiBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgZXhpc3RzICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBjb2VyY2VOdW0gPSAodmFsdWUpID0+XHJcbiAgICAvLyBJdHMgYSBudW1iZXIhIHx8IDAgdG8gYXZvaWQgTmFOIChhcyBOYU4ncyBhIG51bWJlcilcclxuICAgICt2YWx1ZSA9PT0gdmFsdWUgPyAodmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gQXZvaWQgTmFOIGFnYWluXHJcbiAgICBpc1N0cmluZyh2YWx1ZSkgPyAoK3ZhbHVlIHx8IDApIDpcclxuICAgIC8vIERlZmF1bHQgdG8gemVyb1xyXG4gICAgMDtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxMZWZ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbFRvcCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0cyA9IHRoaXMuZmluZCh0YXJnZXQpLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIGlzLm5vdCh0aGlzKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+ICFfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gIT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBEKCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY2hlY2tlciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+IGNoZWNrZXIuY2FsbChlbGVtLCBlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIG5vZGVUeXBlICAgICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKSxcclxuICAgIGV4aXN0cyAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNEICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBvcmRlciAgICAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBzZWxlY3RvckZpbHRlciAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgRml6emxlICAgICAgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBnZXRTaWJsaW5ncyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gX2dldE5vZGVTaWJsaW5ncyhjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2licy5sZW5ndGgpIHsgcmVzdWx0LnB1c2goc2licyk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Tm9kZVNpYmxpbmdzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaWJzID0gXy50b0FycmF5KHBhcmVudC5jaGlsZHJlbiksXHJcbiAgICAgICAgICAgIGlkeCAgPSBzaWJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGUgdGhlIG5vZGUgaXRzZWxmIGZyb20gdGhlIGxpc3Qgb2YgaXRzIHBhcmVudCdzIGNoaWxkcmVuXHJcbiAgICAgICAgICAgIGlmIChzaWJzW2lkeF0gPT09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHNpYnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaWJzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDaGlsZHJlbiAtLS0tLS1cclxuICAgIGdldENoaWxkcmVuID0gKGFycikgPT4gXy5mbGF0dGVuKF8ubWFwKGFyciwgX2NoaWxkcmVuKSksXHJcbiAgICBfY2hpbGRyZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGtpZHMgPSBlbGVtLmNoaWxkcmVuLFxyXG4gICAgICAgICAgICBpZHggID0gMCwgbGVuICA9IGtpZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgID0gQXJyYXkobGVuKTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGtpZHNbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50cyAtLS0tLS1cclxuICAgIGdldENsb3Nlc3QgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICBjbG9zZXN0LFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGVsZW1zW2lkeF0sIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBwYXJlbnRzLnVuc2hpZnQoZWxlbXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGNsb3Nlc3QgPSBzZWxlY3RvckZpbHRlcihwYXJlbnRzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChjbG9zZXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2xvc2VzdFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRzVW50aWwgPSBmdW5jdGlvbihkLCBzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZFtpZHhdLCBudWxsLCBzdG9wU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTYWZlbHkgZ2V0IHBhcmVudCBub2RlXHJcbiAgICBfZ2V0Tm9kZVBhcmVudCA9IChub2RlKSA9PiBub2RlICYmIG5vZGUucGFyZW50Tm9kZSxcclxuXHJcbiAgICBfY3Jhd2xVcE5vZGUgPSBmdW5jdGlvbihub2RlLCBjb250ZXh0LCBzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IG5vZGU7XHJcblxyXG4gICAgICAgIHdoaWxlICgocGFyZW50ICAgPSBfZ2V0Tm9kZVBhcmVudChwYXJlbnQpKSAgICYmXHJcbiAgICAgICAgICAgICAgICFub2RlVHlwZS5kb2MocGFyZW50KSAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICAgICAgICAgKCFjb250ZXh0ICAgICAgfHwgcGFyZW50ICE9PSBjb250ZXh0KSAmJlxyXG4gICAgICAgICAgICAgICAoIXN0b3BTZWxlY3RvciB8fCAhRml6emxlLmlzKHN0b3BTZWxlY3RvcikubWF0Y2gocGFyZW50KSkpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVUeXBlLmVsZW0ocGFyZW50KSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50IC0tLS0tLVxyXG4gICAgZ2V0UGFyZW50ID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IF9nZXROb2RlUGFyZW50KGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHsgcmVzdWx0LnB1c2gocGFyZW50KTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBfcHJldk5leHRDcmF3bCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gbm9kZTtcclxuICAgICAgICAgICAgd2hpbGUgKChjdXJyZW50ID0gY3VycmVudFttZXRob2RdKSAmJiAhbm9kZVR5cGUuZWxlbShjdXJyZW50KSkge31cclxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQ7ICAgIFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgZ2V0UHJldiA9IF9wcmV2TmV4dENyYXdsKCdwcmV2aW91c1NpYmxpbmcnKSxcclxuICAgIGdldE5leHQgPSBfcHJldk5leHRDcmF3bCgnbmV4dFNpYmxpbmcnKSxcclxuXHJcbiAgICBfcHJldk5leHRDcmF3bEFsbCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgID0gW10sXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gbm9kZTtcclxuICAgICAgICAgICAgd2hpbGUgKChjdXJyZW50ID0gY3VycmVudFttZXRob2RdKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVUeXBlLmVsZW0oY3VycmVudCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjdXJyZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgZ2V0UHJldkFsbCA9IF9wcmV2TmV4dENyYXdsQWxsKCdwcmV2aW91c1NpYmxpbmcnKSxcclxuICAgIGdldE5leHRBbGwgPSBfcHJldk5leHRDcmF3bEFsbCgnbmV4dFNpYmxpbmcnKSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZztcclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmcgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYmxpbmcgJiYgKCFzZWxlY3RvciB8fCBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxBbGwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgZmlsdGVyO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgZmlsdGVyID0gZnVuY3Rpb24oc2libGluZykgeyByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKTsgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gXy5maWx0ZXIoc2libGluZ3MsIGZpbHRlciB8fCBleGlzdHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbFVudGlsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGl0ZXJhdG9yO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaXRlcmF0b3IgPSBmdW5jdGlvbihzaWJsaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNNYXRjaCA9IGlzLm1hdGNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc01hdGNoO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChzaWJsaW5ncywgaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHVuaXF1ZVNvcnQgPSBmdW5jdGlvbihlbGVtcywgcmV2ZXJzZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB1bmlxdWUoZWxlbXMpO1xyXG4gICAgICAgIG9yZGVyLnNvcnQocmVzdWx0KTtcclxuICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRChyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXJBbmRTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCByZXZlcnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoc2VsZWN0b3JGaWx0ZXIoZWxlbXMsIHNlbGVjdG9yKSwgcmV2ZXJzZSk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNvbnRlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5mbGF0dGVuKFxyXG4gICAgICAgICAgICAgICAgXy5wbHVjayh0aGlzLCAnY2hpbGROb2RlcycpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbmRleDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoIXRoaXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoc2VsZWN0b3IpLmluZGV4T2YoZmlyc3QpOyAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrICAgICAgICBcclxuICAgICAgICB2YXIgZmlyc3QgID0gdGhpc1swXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gZmlyc3QucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaXNBdHRhY2hlZCBjaGVjayB0byBwYXNzIHRlc3QgXCJOb2RlIHdpdGhvdXQgcGFyZW50IHJldHVybnMgLTFcIlxyXG4gICAgICAgIC8vIG5vZGVUeXBlIGNoZWNrIHRvIHBhc3MgXCJJZiBEI2luZGV4IGNhbGxlZCBvbiBlbGVtZW50IHdob3NlIHBhcmVudCBpcyBmcmFnbWVudCwgaXQgc3RpbGwgc2hvdWxkIHdvcmsgY29ycmVjdGx5XCJcclxuICAgICAgICB2YXIgYXR0YWNoZWQgICAgICAgICA9IGlzQXR0YWNoZWQoZmlyc3QpLFxyXG4gICAgICAgICAgICBpc1BhcmVudEZyYWdtZW50ID0gbm9kZVR5cGUuZG9jX2ZyYWcocGFyZW50KTtcclxuXHJcbiAgICAgICAgaWYgKCFhdHRhY2hlZCAmJiAhaXNQYXJlbnRGcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2hpbGRFbGVtcyA9IHBhcmVudC5jaGlsZHJlbiB8fCBfLmZpbHRlcihwYXJlbnQuY2hpbGROb2Rlcywgbm9kZVR5cGUuZWxlbSk7XHJcblxyXG4gICAgICAgIHJldHVybiBbXS5pbmRleE9mLmNhbGwoY2hpbGRFbGVtcywgZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9zZXN0OiBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldENsb3Nlc3QodGhpcywgc2VsZWN0b3IsIGNvbnRleHQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFBhcmVudCh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnRzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFBhcmVudHModGhpcyksIHNlbGVjdG9yLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50c1VudGlsOiBmdW5jdGlvbihzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQYXJlbnRzVW50aWwodGhpcywgc3RvcFNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNpYmxpbmdzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFNpYmxpbmdzKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoaWxkcmVuOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldENoaWxkcmVuKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXY6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbChnZXRQcmV2LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0TmV4dCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldkFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsQWxsKGdldFByZXZBbGwsIHRoaXMsIHNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHRBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldFByZXZBbGwsIHRoaXMsIHNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHRVbnRpbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsVW50aWwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBuZXdsaW5lcyAgID0gcmVxdWlyZSgndXRpbC9uZXdsaW5lcycpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdpcy9ub2RlTmFtZScpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtO1xyXG5cclxudmFyIG5vcm1hbE5vZGVOYW1lID0gKGVsZW0pID0+IGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSxcclxuXHJcbiAgICBvdXRlckh0bWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPyB0aGlzWzBdLm91dGVySFRNTCA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHRHZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0pID0+IGVsZW0udGV4dENvbnRlbnQgOlxyXG4gICAgICAgICAgICAoZWxlbSkgPT4gZWxlbS5pbm5lclRleHQsXHJcblxyXG4gICAgdGV4dFNldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLnRleHRDb250ZW50ID0gc3RyIDpcclxuICAgICAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS5pbm5lclRleHQgPSBzdHI7XHJcblxyXG52YXIgdmFsSG9va3MgPSB7XHJcbiAgICBvcHRpb246IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gKGV4aXN0cyh2YWwpID8gdmFsIDogdGV4dEdldChlbGVtKSkudHJpbSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGluZGV4ICAgPSBlbGVtLnNlbGVjdGVkSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBvbmUgICAgID0gZWxlbS50eXBlID09PSAnc2VsZWN0LW9uZScgfHwgaW5kZXggPCAwLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IG9uZSA/IG51bGwgOiBbXSxcclxuICAgICAgICAgICAgICAgIG1heCAgICAgPSBvbmUgPyBpbmRleCArIDEgOiBvcHRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBpbmRleCA8IDAgPyBtYXggOiAob25lID8gaW5kZXggOiAwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIHNlbGVjdGVkIG9wdGlvbnNcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IG1heDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBJRTYtOCBidWcuIHJlbW92ZVxyXG4gICAgICAgICAgICAgICAgLy8gb2xkSUUgZG9lc24ndCB1cGRhdGUgc2VsZWN0ZWQgYWZ0ZXIgZm9ybSByZXNldCAoIzI1NTEpXHJcbiAgICAgICAgICAgICAgICBpZiAoKG9wdGlvbi5zZWxlY3RlZCB8fCBpZHggPT09IGluZGV4KSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCByZXR1cm4gb3B0aW9ucyB0aGF0IGFyZSBkaXNhYmxlZCBvciBpbiBhIGRpc2FibGVkIG9wdGdyb3VwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChTVVBQT1JUUy5vcHREaXNhYmxlZCA/ICFvcHRpb24uZGlzYWJsZWQgOiBvcHRpb24uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpID09PSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoIW9wdGlvbi5wYXJlbnROb2RlLmRpc2FibGVkIHx8ICFpc05vZGVOYW1lKG9wdGlvbi5wYXJlbnROb2RlLCAnb3B0Z3JvdXAnKSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBzcGVjaWZpYyB2YWx1ZSBmb3IgdGhlIG9wdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsSG9va3Mub3B0aW9uLmdldChvcHRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIGFuIGFycmF5IGZvciBvbmUgc2VsZWN0c1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTXVsdGktU2VsZWN0cyByZXR1cm4gYW4gYXJyYXlcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9uU2V0LCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IF8ubWFrZUFycmF5KHZhbHVlKSxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBvcHRpb25zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKHZhbHVlcywgdmFsSG9va3Mub3B0aW9uLmdldChvcHRpb24pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IG9wdGlvblNldCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGb3JjZSBicm93c2VycyB0byBiZWhhdmUgY29uc2lzdGVudGx5IHdoZW4gbm9uLW1hdGNoaW5nIHZhbHVlIGlzIHNldFxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvblNldCkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZWxlY3RlZEluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuLy8gUmFkaW8gYW5kIGNoZWNrYm94IGdldHRlciBmb3IgV2Via2l0XHJcbmlmICghU1VQUE9SVFMuY2hlY2tPbikge1xyXG4gICAgXy5lYWNoKFsncmFkaW8nLCAnY2hlY2tib3gnXSwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIHZhbEhvb2tzW3R5cGVdID0ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQ6IFdlYmtpdCAtICcnIGlzIHJldHVybmVkIGluc3RlYWQgb2YgJ29uJyBpZiBhIHZhbHVlIGlzbid0IHNwZWNpZmllZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpID09PSBudWxsID8gJ29uJyA6IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBnZXRWYWwgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTm9kZU5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5nZXQpIHtcclxuICAgICAgICByZXR1cm4gaG9vay5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXNTdHJpbmcodmFsKSA/IG5ld2xpbmVzKHZhbCkgOiB2YWw7XHJcbn07XHJcblxyXG52YXIgc3RyaW5naWZ5ID0gKHZhbHVlKSA9PlxyXG4gICAgIWV4aXN0cyh2YWx1ZSkgPyAnJyA6ICh2YWx1ZSArICcnKTtcclxuXHJcbnZhciBzZXRWYWwgPSBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIFN0cmluZ2lmeSB2YWx1ZXNcclxuICAgIHZhciB2YWx1ZSA9IGlzQXJyYXkodmFsKSA/IF8ubWFwKHZhbCwgc3RyaW5naWZ5KSA6IHN0cmluZ2lmeSh2YWwpO1xyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOb2RlTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLnNldCkge1xyXG4gICAgICAgIGhvb2suc2V0KGVsZW0sIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIG91dGVySHRtbDogb3V0ZXJIdG1sLFxyXG4gICAgb3V0ZXJIVE1MOiBvdXRlckh0bWwsXHJcblxyXG4gICAgaHRtbDogZnVuY3Rpb24oaHRtbCkge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhodG1sKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBlbGVtLmlubmVySFRNTCA9IGh0bWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oaHRtbCkpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gaHRtbDtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZWxlbS5pbm5lckhUTUwpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIHJldHVybiAoIWZpcnN0KSA/IHVuZGVmaW5lZCA6IGZpcnN0LmlubmVySFRNTDtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIC8vIGdldHRlclxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0VmFsKHRoaXNbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFleGlzdHModmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCAnJykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGdldFZhbChlbGVtKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2V0VmFsKGVsZW0sIHZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzZXR0ZXJzXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGV4dDogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHN0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gdGV4dFNldChlbGVtLCBzdHIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHN0cikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc3RyO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICB0ZXh0U2V0KGVsZW0sIGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCB0ZXh0R2V0KGVsZW0pKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLCAoZWxlbSkgPT4gdGV4dEdldChlbGVtKSkuam9pbignJyk7XHJcbiAgICB9XHJcbn07IiwidmFyIGlzID0gZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuIChlbGVtKSA9PiBlbGVtICYmIGVsZW0ubm9kZVR5cGUgPT09IHg7XHJcbn07XHJcblxyXG4vLyBjb21tZW50ZWQtb3V0IG1ldGhvZHMgYXJlIG5vdCBiZWluZyB1c2VkXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZWxlbTogaXMoMSksXHJcbiAgICBhdHRyOiBpcygyKSxcclxuICAgIHRleHQ6IGlzKDMpLFxyXG4gICAgLy8gY2RhdGE6IGlzKDQpLFxyXG4gICAgLy8gZW50aXR5X3JlZmVyZW5jZTogaXMoNSksXHJcbiAgICAvLyBlbnRpdHk6IGlzKDYpLFxyXG4gICAgLy8gcHJvY2Vzc2luZ19pbnN0cnVjdGlvbjogaXMoNyksXHJcbiAgICBjb21tZW50OiBpcyg4KSxcclxuICAgIGRvYzogaXMoOSksXHJcbiAgICAvLyBkb2N1bWVudF90eXBlOiBpcygxMCksXHJcbiAgICBkb2NfZnJhZzogaXMoMTEpXHJcbiAgICAvLyBub3RhdGlvbjogaXMoMTIpLFxyXG59OyIsInZhciByZWFkeSA9IGZhbHNlLFxyXG4gICAgcmVnaXN0cmF0aW9uID0gW107XHJcblxyXG52YXIgd2FpdCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbndhaXQoZnVuY3Rpb24oKSB7XHJcbiAgICByZWFkeSA9IHRydWU7XHJcblxyXG4gICAgLy8gY2FsbCByZWdpc3RlcmVkIG1ldGhvZHMgICAgXHJcbiAgICB3aGlsZSAocmVnaXN0cmF0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbi5zaGlmdCgpKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoY2FsbGJhY2spID0+XHJcbiAgICByZWFkeSA/IGNhbGxiYWNrKCkgOiByZWdpc3RyYXRpb24ucHVzaChjYWxsYmFjayk7XHJcbiIsInZhciBpc0F0dGFjaGVkICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2NvbXBhcmluZy1kb2N1bWVudC1wb3NpdGlvbi9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICBDT05UQUlORURfQlkgPSAxNixcclxuICAgIEZPTExPV0lORyAgICA9IDQsXHJcbiAgICBESVNDT05ORUNURUQgPSAxO1xyXG5cclxuICAgIC8vIENvbXBhcmUgUG9zaXRpb24gLSBNSVQgTGljZW5zZWQsIEpvaG4gUmVzaWdcclxudmFyIGNvbXBhcmVQb3NpdGlvbiA9IChub2RlMSwgbm9kZTIpID0+XHJcbiAgICAgICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gP1xyXG4gICAgICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5vZGUyKSA6XHJcbiAgICAgICAgMCxcclxuICAgIFxyXG4gICAgaXMgPSAocmVsLCBmbGFnKSA9PiAocmVsICYgZmxhZykgPT09IGZsYWcsXHJcblxyXG4gICAgaXNOb2RlID0gKGIsIGZsYWcsIGEpID0+IGlzKGNvbXBhcmVQb3NpdGlvbihhLCBiKSwgZmxhZyksXHJcblxyXG4gICAgaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcblxyXG52YXIgc29ydCA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xyXG4gICAgLy8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcclxuICAgIGlmIChub2RlMSA9PT0gbm9kZTIpIHtcclxuICAgICAgICBoYXNEdXBsaWNhdGUgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNvcnQgb24gbWV0aG9kIGV4aXN0ZW5jZSBpZiBvbmx5IG9uZSBpbnB1dCBoYXMgY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgIHZhciByZWwgPSAhbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gLSAhbm9kZTIuY29tcGFyZURvY3VtZW50UG9zaXRpb247XHJcbiAgICBpZiAocmVsKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgaWYgKChub2RlMS5vd25lckRvY3VtZW50IHx8IG5vZGUxKSA9PT0gKG5vZGUyLm93bmVyRG9jdW1lbnQgfHwgbm9kZTIpKSB7XHJcbiAgICAgICAgcmVsID0gY29tcGFyZVBvc2l0aW9uKG5vZGUxLCBub2RlMik7XHJcbiAgICB9XHJcbiAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJlbCA9IERJU0NPTk5FQ1RFRDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3QgZGlyZWN0bHkgY29tcGFyYWJsZVxyXG4gICAgaWYgKCFyZWwpIHtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEaXNjb25uZWN0ZWQgbm9kZXNcclxuICAgIGlmIChpcyhyZWwsIERJU0NPTk5FQ1RFRCkpIHtcclxuICAgICAgICB2YXIgaXNOb2RlMURpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUxKTtcclxuICAgICAgICB2YXIgaXNOb2RlMkRpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUyKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTm9kZTFEaXNjb25uZWN0ZWQgJiYgaXNOb2RlMkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpc05vZGUyRGlzY29ubmVjdGVkID8gLTEgOiAxO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpcyhyZWwsIEZPTExPV0lORykgPyAtMSA6IDE7XHJcbn07XHJcblxyXG4vKipcclxuICogU29ydHMgYW4gYXJyYXkgb2YgRCBlbGVtZW50cyBpbi1wbGFjZSAoaS5lLiwgbXV0YXRlcyB0aGUgb3JpZ2luYWwgYXJyYXkpXHJcbiAqIGluIGRvY3VtZW50IG9yZGVyIGFuZCByZXR1cm5zIHdoZXRoZXIgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7RWxlbWVudFtdfSBhcnJheSAgICAgICAgICBBcnJheSBvZiBEIGVsZW1lbnRzLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59ICBbcmV2ZXJzZT1mYWxzZV0gSWYgYSB0cnV0aHkgdmFsdWUgaXMgcGFzc2VkLCB0aGUgZ2l2ZW4gYXJyYXkgd2lsbCBiZSByZXZlcnNlZC5cclxuICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gKiBAc2VlIGpRdWVyeSBzcmMvc2VsZWN0b3ItbmF0aXZlLmpzOjM3XHJcbiAqL1xyXG5leHBvcnRzLnNvcnQgPSBmdW5jdGlvbihhcnJheSwgcmV2ZXJzZSkge1xyXG4gICAgaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcbiAgICBhcnJheS5zb3J0KHNvcnQpO1xyXG4gICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICBhcnJheS5yZXZlcnNlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaGFzRHVwbGljYXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgd2hldGhlciBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYC5cclxuICogQHBhcmFtIHtFbGVtZW50fSBhIEQgZWxlbWVudCBub2RlXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gYiBEIGVsZW1lbnQgbm9kZVxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYDsgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gKi9cclxuZXhwb3J0cy5jb250YWlucyA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgIHZhciBiVXAgPSBpc0F0dGFjaGVkKGIpID8gYi5wYXJlbnROb2RlIDogbnVsbDtcclxuXHJcbiAgICBpZiAoYSA9PT0gYlVwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChiVXApKSB7XHJcbiAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzIChJRTkrKVxyXG4gICAgICAgIGlmIChhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc05vZGUoYlVwLCBDT05UQUlORURfQlksIGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcbiIsInZhciBSRUdFWCA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBNQVhfU0lOR0xFX1RBR19MRU5HVEggPSAzMCxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKTtcclxuXHJcbnZhciBwYXJzZVN0cmluZyA9IGZ1bmN0aW9uKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpIHtcclxuICAgIHZhciBwYXJlbnQgPSBjcmVhdGUocGFyZW50VGFnTmFtZSk7XHJcbiAgICBwYXJlbnQuaW5uZXJIVE1MID0gaHRtbFN0cjtcclxuICAgIHJldHVybiBwYXJlbnQ7XHJcbn07XHJcblxyXG52YXIgcGFyc2VTaW5nbGVUYWcgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICBpZiAoaHRtbFN0ci5sZW5ndGggPiBNQVhfU0lOR0xFX1RBR19MRU5HVEgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgc2luZ2xlVGFnTWF0Y2ggPSBSRUdFWC5zaW5nbGVUYWdNYXRjaChodG1sU3RyKTtcclxuICAgIHJldHVybiBzaW5nbGVUYWdNYXRjaCA/IFtjcmVhdGUoc2luZ2xlVGFnTWF0Y2hbMV0pXSA6IG51bGw7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIHZhciBzaW5nbGVUYWcgPSBwYXJzZVNpbmdsZVRhZyhodG1sU3RyKTtcclxuICAgIGlmIChzaW5nbGVUYWcpIHsgcmV0dXJuIHNpbmdsZVRhZzsgfVxyXG5cclxuICAgIHZhciBwYXJlbnRUYWdOYW1lID0gUkVHRVguZ2V0UGFyZW50VGFnTmFtZShodG1sU3RyKSxcclxuICAgICAgICBwYXJlbnQgICAgICAgID0gcGFyc2VTdHJpbmcocGFyZW50VGFnTmFtZSwgaHRtbFN0cik7XHJcblxyXG4gICAgdmFyIGNoaWxkLFxyXG4gICAgICAgIGlkeCA9IHBhcmVudC5jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgYXJyID0gQXJyYXkoaWR4KTtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgIGNoaWxkID0gcGFyZW50LmNoaWxkcmVuW2lkeF07XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcclxuICAgICAgICBhcnJbaWR4XSA9IGNoaWxkO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcmVudCA9IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZXZlcnNlKCk7XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICA9IHJlcXVpcmUoJy4vRCcpLFxyXG4gICAgcGFyc2VyICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgRml6emxlICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgZGF0YSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpO1xyXG5cclxudmFyIHBhcnNlSHRtbCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgaWYgKCFzdHIpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIHZhciByZXN1bHQgPSBwYXJzZXIoc3RyKTtcclxuICAgIHJldHVybiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCA/IEQocmVzdWx0KSA6IG51bGw7XHJcbn07XHJcblxyXG5fLmV4dGVuZChELFxyXG4gICAgZGF0YS5ELFxyXG57XHJcbiAgICAvLyBCZWNhdXNlIG5vIG9uZSBrbm93IHdoYXQgdGhlIGNhc2Ugc2hvdWxkIGJlXHJcbiAgICBwYXJzZUh0bWw6IHBhcnNlSHRtbCxcclxuICAgIHBhcnNlSFRNTDogcGFyc2VIdG1sLFxyXG5cclxuICAgIC8vIGV4cG9zZSB0aGUgc2VsZWN0b3IgZW5naW5lIGZvciBkZWJ1Z2dpbmdcclxuICAgIEZpenpsZTogIEZpenpsZSxcclxuXHJcbiAgICBlYWNoOiAgICBfLmpxRWFjaCxcclxuICAgIGZvckVhY2g6IF8uZEVhY2gsXHJcblxyXG4gICAgbWFwOiAgICAgXy5tYXAsXHJcbiAgICBleHRlbmQ6ICBfLmV4dGVuZCxcclxuXHJcbiAgICBtb3JlQ29uZmxpY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdpbmRvdy5qUXVlcnkgPSB3aW5kb3cuWmVwdG8gPSB3aW5kb3cuJCA9IEQ7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICA9IHJlcXVpcmUoJy4vRCcpLFxyXG4gICAgc3BsaXQgICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBhcnJheSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXJyYXknKSxcclxuICAgIHNlbGVjdG9ycyAgID0gcmVxdWlyZSgnbW9kdWxlcy9zZWxlY3RvcnMnKSxcclxuICAgIHRyYW5zdmVyc2FsID0gcmVxdWlyZSgnbW9kdWxlcy90cmFuc3ZlcnNhbCcpLFxyXG4gICAgZGltZW5zaW9ucyAgPSByZXF1aXJlKCdtb2R1bGVzL2RpbWVuc2lvbnMnKSxcclxuICAgIG1hbmlwICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9tYW5pcCcpLFxyXG4gICAgY3NzICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2NzcycpLFxyXG4gICAgYXR0ciAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2F0dHInKSxcclxuICAgIHByb3AgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9wcm9wJyksXHJcbiAgICB2YWwgICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvdmFsJyksXHJcbiAgICBwb3NpdGlvbiAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcG9zaXRpb24nKSxcclxuICAgIGNsYXNzZXMgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jbGFzc2VzJyksXHJcbiAgICBzY3JvbGwgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2Nyb2xsJyksXHJcbiAgICBkYXRhICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpLFxyXG4gICAgZXZlbnRzICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2V2ZW50cycpO1xyXG5cclxudmFyIGFycmF5UHJvdG8gPSBzcGxpdCgnbGVuZ3RofHRvU3RyaW5nfHRvTG9jYWxlU3RyaW5nfGpvaW58cG9wfHB1c2h8Y29uY2F0fHJldmVyc2V8c2hpZnR8dW5zaGlmdHxzbGljZXxzcGxpY2V8c29ydHxzb21lfGV2ZXJ5fGluZGV4T2Z8bGFzdEluZGV4T2Z8cmVkdWNlfHJlZHVjZVJpZ2h0fG1hcHxmaWx0ZXInKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIGtleSkge1xyXG4gICAgICAgIG9ialtrZXldID0gQXJyYXkucHJvdG90eXBlW2tleV07XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHt9KTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgcHJvdG90eXBlIHNvIHRoYXRcclxuLy8gaXQgY2FuIGJlIGhvb2tlZCBpbnRvIGZvciBwbHVnaW5zXHJcbkQuZm4gPSBELnByb3RvdHlwZTtcclxuXHJcbl8uZXh0ZW5kKFxyXG4gICAgRC5mbixcclxuICAgIHsgY29uc3RydWN0b3I6IEQsIH0sXHJcbiAgICBhcnJheVByb3RvLFxyXG4gICAgYXJyYXkuZm4sXHJcbiAgICBzZWxlY3RvcnMuZm4sXHJcbiAgICB0cmFuc3ZlcnNhbC5mbixcclxuICAgIG1hbmlwLmZuLFxyXG4gICAgZGltZW5zaW9ucy5mbixcclxuICAgIGNzcy5mbixcclxuICAgIGF0dHIuZm4sXHJcbiAgICBwcm9wLmZuLFxyXG4gICAgdmFsLmZuLFxyXG4gICAgY2xhc3Nlcy5mbixcclxuICAgIHBvc2l0aW9uLmZuLFxyXG4gICAgc2Nyb2xsLmZuLFxyXG4gICAgZGF0YS5mbixcclxuICAgIGV2ZW50cy5mblxyXG4pO1xyXG4iLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBzdGFydCwgZW5kKSB7XHJcbiAgICAvLyBFeGl0IGVhcmx5IGZvciBlbXB0eSBhcnJheVxyXG4gICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgLy8gRW5kLCBuYXR1cmFsbHksIGhhcyB0byBiZSBoaWdoZXIgdGhhbiAwIHRvIG1hdHRlcixcclxuICAgIC8vIHNvIGEgc2ltcGxlIGV4aXN0ZW5jZSBjaGVjayB3aWxsIGRvXHJcbiAgICBpZiAoZW5kKSB7IHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQsIGVuZCk7IH1cclxuXHJcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0IHx8IDApO1xyXG59OyIsIi8vIEJyZWFrcyBldmVuIG9uIGFycmF5cyB3aXRoIDMgaXRlbXMuIDMgb3IgbW9yZVxyXG4vLyBpdGVtcyBzdGFydHMgc2F2aW5nIHNwYWNlXHJcbm1vZHVsZS5leHBvcnRzID0gKHN0ciwgZGVsaW1pdGVyKSA9PiBzdHIuc3BsaXQoZGVsaW1pdGVyIHx8ICd8Jyk7XHJcbiIsInZhciBpZCA9IDA7XHJcbnZhciB1bmlxdWVJZCA9IG1vZHVsZS5leHBvcnRzID0gKCkgPT4gaWQrKztcclxudW5pcXVlSWQuc2VlZCA9IGZ1bmN0aW9uKHNlZWRlZCwgcHJlKSB7XHJcbiAgICB2YXIgcHJlZml4ID0gcHJlIHx8ICcnLFxyXG4gICAgICAgIHNlZWQgPSBzZWVkZWQgfHwgMDtcclxuICAgIHJldHVybiAoKSA9PiBwcmVmaXggKyBzZWVkKys7XHJcbn07Il19
