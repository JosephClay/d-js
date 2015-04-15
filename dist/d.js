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

var D = module.exports = function (selector, attrs) {
    return new Init(selector, attrs);
};

isD.set(D);

var Init = function Init(selector, attrs) {
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
};
Init.prototype = D.prototype;

},{"Fizzle":9,"_":15,"is/D":17,"is/arrayLike":19,"is/function":26,"is/html":27,"is/string":32,"onready":56,"parser":58}],4:[function(require,module,exports){
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

},{"REGEX":13,"_":15,"is/element":24,"is/exists":25,"is/nodeList":28,"matchesSelector":34,"util/uniqueId":64}],9:[function(require,module,exports){
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

},{"nodeType":54}],21:[function(require,module,exports){
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

},{"is/window":33,"nodeType":54}],25:[function(require,module,exports){
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

},{"is/string":32}],28:[function(require,module,exports){
// NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
"use strict";

module.exports = function (value) {
    return value && (value instanceof NodeList || value instanceof HTMLCollection);
};

},{}],29:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'number';
};

},{}],30:[function(require,module,exports){
'use strict';

module.exports = function (value) {
    var type = typeof value;
    return type === 'function' || !!value && type === 'object';
};

},{}],31:[function(require,module,exports){
'use strict';

var isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('is/element'),
    isCollection = require('is/collection');

module.exports = function (val) {
    return val && (isString(val) || isFunction(val) || isElement(val) || isCollection(val));
};

},{"is/collection":22,"is/element":24,"is/function":26,"is/string":32}],32:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'string';
};

},{}],33:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === value.window;
};

},{}],34:[function(require,module,exports){
'use strict';

var isElement = require('nodeType').elem,
    DIV = require('DIV'),

// Support: IE9+, modern browsers
matchesSelector = DIV.matches || DIV.matchesSelector || DIV.msMatchesSelector || DIV.mozMatchesSelector || DIV.webkitMatchesSelector || DIV.oMatchesSelector;

// only element types supported
module.exports = function (elem, selector) {
    return isElement(elem) ? matchesSelector.call(elem, selector) : false;
};

},{"DIV":5,"nodeType":54}],35:[function(require,module,exports){
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

},{"./map":36,"D":3,"_":15,"is/exists":25,"util/slice":62}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{"order":57}],38:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('nodeType').elem,
    isNodeName = require('node/isName'),
    newlines = require('string/newlines'),
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

},{"Fizzle":9,"SUPPORTS":14,"_":15,"cache":16,"is/exists":25,"is/function":26,"is/string":32,"node/isName":55,"nodeType":54,"string/newlines":61}],39:[function(require,module,exports){
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

},{"is/array":18,"is/exists":25,"is/string":32,"nodeType":54}],40:[function(require,module,exports){
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

},{"REGEX":13,"_":15,"is/array":18,"is/attached":20,"is/boolean":21,"is/document":23,"is/element":24,"is/exists":25,"is/number":29,"is/object":30,"is/string":32,"is/window":33,"nodeType":54,"util/split":63}],41:[function(require,module,exports){
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

},{"cache":16,"is/array":18,"is/element":24,"is/string":32,"util/uniqueId":64}],42:[function(require,module,exports){
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

},{"./css":40,"_":15,"is/number":29}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{"crossvent":2,"is/exists":25,"matchesSelector":34}],45:[function(require,module,exports){
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

},{"./custom":43,"./delegate":44,"_":15,"is/function":26}],46:[function(require,module,exports){
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

},{"./array/unique":37,"./data":41,"./selectors/filter":50,"D":3,"_":15,"is/D":17,"is/collection":22,"is/document":23,"is/element":24,"is/exists":25,"is/function":26,"is/html":27,"is/nodeList":28,"is/number":29,"is/string":32,"is/window":33,"order":57,"parser":58}],47:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    exists = require('is/exists'),
    isAttached = require('is/attached'),
    isFunction = require('is/function'),
    isObject = require('is/object'),
    isNodeName = require('node/isName'),
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

},{"D":3,"_":15,"is/attached":20,"is/exists":25,"is/function":26,"is/object":30,"node/isName":55}],48:[function(require,module,exports){
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

},{"REGEX":13,"SUPPORTS":14,"_":15,"is/function":26,"is/string":32,"nodeType":54,"util/split":63}],49:[function(require,module,exports){
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

},{"is/exists":25,"is/string":32}],50:[function(require,module,exports){
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

},{"Fizzle":9,"_":15,"is/function":26,"is/string":32}],51:[function(require,module,exports){
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

},{"D":3,"Fizzle":9,"_":15,"is/D":17,"is/array":18,"is/collection":22,"is/element":24,"is/function":26,"is/nodeList":28,"is/selector":31,"is/string":32,"order":57}],52:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    nodeType = require('nodeType'),
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
    _crawlUpNode = function _crawlUpNode(node, context, stopSelector) {
    var result = [],
        parent = node;

    while ((parent = getNodeParent(parent)) && !nodeType.doc(parent) && (!context || parent !== context) && (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
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

// TODO: This can be more generic
getPrev = function getPrev(node) {
    var prev = node;
    while ((prev = prev.previousSibling) && !nodeType.elem(prev)) {}
    return prev;
},
    getNext = function getNext(node) {
    var next = node;
    while ((next = next.nextSibling) && !nodeType.elem(next)) {}
    return next;
},

// TODO: This can be more generic
getPrevAll = function getPrevAll(node) {
    var result = [],
        prev = node;
    while (prev = prev.previousSibling) {
        if (nodeType.elem(prev)) {
            result.push(prev);
        }
    }
    return result;
},
    getNextAll = function getNextAll(node) {
    var result = [],
        next = node;
    while (next = next.nextSibling) {
        if (nodeType.elem(next)) {
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

},{"./array/unique":37,"./selectors/filter":50,"D":3,"Fizzle":9,"_":15,"is/D":17,"is/attached":20,"is/document":23,"is/element":24,"is/string":32,"is/window":33,"nodeType":54,"order":57}],53:[function(require,module,exports){
'use strict';

var _ = require('_'),
    newlines = require('string/newlines'),
    exists = require('is/exists'),
    isString = require('is/string'),
    isArray = require('is/array'),
    isNumber = require('is/number'),
    isFunction = require('is/function'),
    isNodeName = require('node/isName'),
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

},{"SUPPORTS":14,"_":15,"is/array":18,"is/exists":25,"is/function":26,"is/number":29,"is/string":32,"node/isName":55,"nodeType":54,"string/newlines":61}],54:[function(require,module,exports){
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

},{}],55:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
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

},{"is/attached":20,"nodeType":54}],58:[function(require,module,exports){
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
        arr = new Array(idx);
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

    Fizzle: Fizzle,
    each: _.jqEach,
    forEach: _.dEach,

    map: _.map,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

},{"./D":3,"Fizzle":9,"_":15,"modules/data":41,"parser":58}],60:[function(require,module,exports){
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

},{"./D":3,"_":15,"modules/array":35,"modules/attr":38,"modules/classes":39,"modules/css":40,"modules/data":41,"modules/dimensions":42,"modules/events":45,"modules/manip":46,"modules/position":47,"modules/prop":48,"modules/scroll":49,"modules/selectors":51,"modules/transversal":52,"modules/val":53,"util/split":63}],61:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvcHJveHkuanNvbiIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvbWFwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L3VuaXF1ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hdHRyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2NsYXNzZXMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvY3NzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RhdGEuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZGltZW5zaW9ucy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvY3VzdG9tLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2V2ZW50cy9kZWxlZ2F0ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvbWFuaXAuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvcG9zaXRpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvcHJvcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9zY3JvbGwuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2ZpbHRlci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9zZWxlY3RvcnMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvdHJhbnN2ZXJzYWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvdmFsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlVHlwZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc05hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL25ld2xpbmVzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NsaWNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3VuaXF1ZUlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O0FDRm5CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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U0FBUyxJQUFJLEdBQUcsQ0FBQztDQUFBLENBQUM7Ozs7O0FDRmpFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUc7V0FBTSxFQUFFLEVBQUU7Q0FBQSxDQUFDO0FBQzNDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBUyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ2xDLFFBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxFQUFFO1FBQ2xCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLFdBQU87ZUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFO0tBQUEsQ0FBQztDQUNoQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9EJyk7XHJcbnJlcXVpcmUoJy4vcHJvcHMnKTtcclxucmVxdWlyZSgnLi9wcm90bycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHVud3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlKSB7XG4gIHZhciBlO1xuICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgID0gZS5wcmV2ZW50RGVmYXVsdCAgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNIdG1sICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNGdW5jdGlvbiAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCdvbnJlYWR5JyksXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIEQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBJbml0KHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEQpO1xyXG5cclxudmFyIEluaXQgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIC8vIG5vdGhpblxyXG4gICAgaWYgKCFzZWxlY3RvcikgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgIC8vIGVsZW1lbnQgb3Igd2luZG93IChkb2N1bWVudHMgaGF2ZSBhIG5vZGVUeXBlKVxyXG4gICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlIHx8IHNlbGVjdG9yID09PSB3aW5kb3cpIHtcclxuICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XHJcbiAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhUTUwgc3RyaW5nXHJcbiAgICBpZiAoaXNIdG1sKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgcGFyc2VyKHNlbGVjdG9yKSk7XHJcbiAgICAgICAgaWYgKGF0dHJzKSB7IHRoaXMuYXR0cihhdHRycyk7IH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3RyaW5nXHJcbiAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gU2VsZWN0b3I6IHBlcmZvcm0gYSBmaW5kIHdpdGhvdXQgY3JlYXRpbmcgYSBuZXcgRFxyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgRml6emxlLnF1ZXJ5KHNlbGVjdG9yKS5leGVjKHRoaXMsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBkb2N1bWVudCByZWFkeVxyXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgb25yZWFkeShzZWxlY3Rvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgb2YgRWxlbWVudHMsIE5vZGVMaXN0LCBvciBEIG9iamVjdFxyXG4gICAgaWYgKGlzQXJyYXlMaWtlKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5Jbml0LnByb3RvdHlwZSA9IEQucHJvdG90eXBlOyIsIm1vZHVsZS5leHBvcnRzID0gKHRhZykgPT4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpOyIsInZhciBkaXYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY3JlYXRlJykoJ2RpdicpO1xyXG5cclxuZGl2LmlubmVySFRNTCA9ICc8YSBocmVmPVwiL2FcIj5hPC9hPic7IiwidmFyIF8gPSByZXF1aXJlKCdfJyk7XHJcblxyXG52YXIgSXMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5Jcy5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSB0aGlzLl9zZWxlY3RvcnMsXHJcbiAgICAgICAgICAgIGlkeCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3JzW2lkeF0ubWF0Y2goY29udGV4dCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5hbnkoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgdGhpcy5tYXRjaChlbGVtKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vdDogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICF0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsInZhciBmaW5kID0gZnVuY3Rpb24oc2VsZWN0b3JzLCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5cclxuUXVlcnkucHJvdG90eXBlID0ge1xyXG4gICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGZpbmQodGhpcy5fc2VsZWN0b3JzLCBhcnJbaWR4XSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgbWF0Y2hlcyAgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgdW5pcXVlSWQgICA9IHJlcXVpcmUoJ3V0aWwvdW5pcXVlSWQnKS5zZWVkKDAsICdfRCcgKyBEYXRlLm5vdygpKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnO1xyXG5cclxudmFyIGRldGVybWluZU1ldGhvZCA9IChzZWxlY3RvcikgPT5cclxuICAgICAgICBSRUdFWC5pc1N0cmljdElkKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UX0JZX0lEIDpcclxuICAgICAgICBSRUdFWC5pc0NsYXNzKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FIDpcclxuICAgICAgICBSRUdFWC5pc1RhZyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgOiAgICAgICBcclxuICAgICAgICBRVUVSWV9TRUxFQ1RPUl9BTEwsXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gKHNlbGVjdGlvbikgPT5cclxuICAgICAgICAvLyBObyBzZWxlY3Rpb24gb3IgYSBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgLy8gc2hvdWxkIHJlc3VsdCBpbiBub3RoaW5nXHJcbiAgICAgICAgIXNlbGVjdGlvbiB8fCAoaXNOb2RlTGlzdChzZWxlY3Rpb24pICYmICFzZWxlY3Rpb24ubGVuZ3RoKSA/IFtdIDpcclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkIHNlbGVjdGlvbiwgcmV0dXJuIGl0IGFzIGFuIGFycmF5XHJcbiAgICAgICAgaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IFxyXG4gICAgICAgIC8vIGVuc3VyZSBpdCdzIGFuIGFycmF5IGFuZCBub3QgYW4gSFRNTENvbGxlY3Rpb25cclxuICAgICAgICBfLnRvQXJyYXkoc2VsZWN0aW9uKSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgX3RoaXMpIHtcclxuICAgICAgICAvLyBDaGlsZCBzZWxlY3QgLSBuZWVkcyBzcGVjaWFsIGhlbHAgc28gdGhhdCBcIj4gZGl2XCIgZG9lc24ndCBicmVha1xyXG4gICAgICAgIHZhciBtZXRob2QgICAgPSBfdGhpcy5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yICA9IF90aGlzLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKFxyXG4gICAgICAgICAgICAvLyB0YWlsb3IgdGhlIGNoaWxkIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGAjJHtpZEFwcGxpZWQgPyBuZXdJZCA6IGlkfSAke3NlbGVjdG9yfWBcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoaWRBcHBsaWVkKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xhc3NRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIF90aGlzKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gX3RoaXMubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IF90aGlzLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICAvLyBDbGFzcyBzZWFyY2gsIGRvbid0IHN0YXJ0IHdpdGggJy4nXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gX3RoaXMuc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgX3RoaXMpIHtcclxuICAgICAgICB2YXIgbWV0aG9kICAgPSBfdGhpcy5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gX3RoaXMuc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWZhdWx0UXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBfdGhpcykge1xyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W190aGlzLm1ldGhvZF0oX3RoaXMuc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSAoX3RoaXMpID0+XHJcbiAgICAgICAgX3RoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IGNoaWxkT3JTaWJsaW5nUXVlcnkgOlxyXG4gICAgICAgIF90aGlzLmlzQ2xhc3NTZWFyY2ggPyBjbGFzc1F1ZXJ5IDpcclxuICAgICAgICBfdGhpcy5pc0lkU2VhcmNoID8gaWRRdWVyeSA6XHJcbiAgICAgICAgZGVmYXVsdFF1ZXJ5O1xyXG5cclxudmFyIFNlbGVjdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHZhciBzZWxlY3RvciAgICAgICAgICAgICAgICA9IHN0ci50cmltKCksXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCAgPSBzZWxlY3RvclswXSA9PT0gJz4nIHx8IHNlbGVjdG9yWzBdID09PSAnKycsXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gUVVFUllfU0VMRUNUT1JfQUxMIDogZGV0ZXJtaW5lTWV0aG9kKHNlbGVjdG9yKTtcclxuXHJcbiAgICB0aGlzLnN0ciAgICAgICAgICAgICAgICAgICAgPSBzdHI7XHJcbiAgICB0aGlzLnNlbGVjdG9yICAgICAgICAgICAgICAgPSBzZWxlY3RvcjtcclxuICAgIHRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3Q7XHJcbiAgICB0aGlzLmlzSWRTZWFyY2ggICAgICAgICAgICAgPSBtZXRob2QgPT09IEdFVF9FTEVNRU5UX0JZX0lEO1xyXG4gICAgdGhpcy5pc0NsYXNzU2VhcmNoICAgICAgICAgID0gIXRoaXMuaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FO1xyXG4gICAgdGhpcy5tZXRob2QgICAgICAgICAgICAgICAgID0gbWV0aG9kO1xyXG59O1xyXG5cclxuU2VsZWN0b3IucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAvLyBObyBuZWVlZCB0byBjaGVjaywgYSBtYXRjaCB3aWxsIGZhaWwgaWYgaXQnc1xyXG4gICAgICAgIC8vIGNoaWxkIG9yIHNpYmxpbmdcclxuICAgICAgICByZXR1cm4gIXRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IG1hdGNoZXMoY29udGV4dCwgdGhpcy5zZWxlY3RvcikgOiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXhlYzogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBxdWVyeSA9IGRldGVybWluZVF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAvLyB0aGVzZSBhcmUgdGhlIHR5cGVzIHdlJ3JlIGV4cGVjdGluZyB0byBmYWxsIHRocm91Z2hcclxuICAgICAgICAvLyBpc0VsZW1lbnQoY29udGV4dCkgfHwgaXNOb2RlTGlzdChjb250ZXh0KSB8fCBpc0NvbGxlY3Rpb24oY29udGV4dClcclxuICAgICAgICAvLyBpZiBubyBjb250ZXh0IGlzIGdpdmVuLCB1c2UgZG9jdW1lbnRcclxuICAgICAgICByZXR1cm4gcXVlcnkoY29udGV4dCB8fCBkb2N1bWVudCwgdGhpcyk7XHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCcuLi9fJyksXHJcbiAgICBxdWVyeUNhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgaXNDYWNoZSAgICA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIFNlbGVjdG9yICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvU2VsZWN0b3InKSxcclxuICAgIFF1ZXJ5ICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvUXVlcnknKSxcclxuICAgIElzICAgICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvSXMnKSxcclxuICAgIHBhcnNlICAgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlJyksXHJcbiAgICBub3JtYWxpemUgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1ub3JtYWxpemUnKTtcclxuXHJcbnZhciB0b1NlbGVjdG9ycyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgLy8gU2VsZWN0b3JzIHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgLy8gTm90IHJldHVybmluZyBlYXJseSBvciBkb2luZyBleHRyYSBjaGVja3MgYXMgdGhpcyB3aWxsXHJcbiAgICAvLyBub29wIG9uIHRoZSBRdWVyeSBhbmQgSXMgbGV2ZWwgYW5kIGlzIHRoZSBleGNlcHRpb25cclxuICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgIHZhciBzZWxlY3RvcnMgPSBwYXJzZS5zdWJxdWVyaWVzKHN0cikgfHwgW107XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIGVhY2ggb2YgdGhlIHNlbGVjdG9ycy4uLlxyXG4gICAgc2VsZWN0b3JzID0gXy5tYXAoc2VsZWN0b3JzLCBub3JtYWxpemUpO1xyXG5cclxuICAgIC8vIC4uLmFuZCBtYXAgdGhlbSB0byBTZWxlY3RvciBvYmplY3RzXHJcbiAgICByZXR1cm4gXy5mYXN0bWFwKHNlbGVjdG9ycywgKHNlbGVjdG9yKSA9PiBuZXcgU2VsZWN0b3Ioc2VsZWN0b3IpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2VsZWN0b3I6IHRvU2VsZWN0b3JzLFxyXG4gICAgcGFyc2U6IHBhcnNlLFxyXG4gICAgXHJcbiAgICBxdWVyeTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5Q2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLnB1dChzdHIsICgpID0+IG5ldyBRdWVyeSh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBpc0NhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIGlzQ2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgaXNDYWNoZS5wdXQoc3RyLCAoKSA9PiBuZXcgSXModG9TZWxlY3RvcnMoc3RyKSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG4gICAgXCI6Y2hpbGQtZXZlblwiIDogXCI6bnRoLWNoaWxkKGV2ZW4pXCIsXHJcbiAgICBcIjpjaGlsZC1vZGRcIiAgOiBcIjpudGgtY2hpbGQob2RkKVwiLFxyXG4gICAgXCI6dGV4dFwiICAgICAgIDogXCJbdHlwZT10ZXh0XVwiLFxyXG4gICAgXCI6cGFzc3dvcmRcIiAgIDogXCJbdHlwZT1wYXNzd29yZF1cIixcclxuICAgIFwiOnJhZGlvXCIgICAgICA6IFwiW3R5cGU9cmFkaW9dXCIsXHJcbiAgICBcIjpjaGVja2JveFwiICAgOiBcIlt0eXBlPWNoZWNrYm94XVwiLFxyXG4gICAgXCI6c3VibWl0XCIgICAgIDogXCJbdHlwZT1zdWJtaXRdXCIsXHJcbiAgICBcIjpyZXNldFwiICAgICAgOiBcIlt0eXBlPXJlc2V0XVwiLFxyXG4gICAgXCI6YnV0dG9uXCIgICAgIDogXCJbdHlwZT1idXR0b25dXCIsXHJcbiAgICBcIjppbWFnZVwiICAgICAgOiBcIlt0eXBlPWltYWdlXVwiLFxyXG4gICAgXCI6aW5wdXRcIiAgICAgIDogXCJbdHlwZT1pbnB1dF1cIixcclxuICAgIFwiOmZpbGVcIiAgICAgICA6IFwiW3R5cGU9ZmlsZV1cIixcclxuICAgIFwiOnNlbGVjdGVkXCIgICA6IFwiW3NlbGVjdGVkPXNlbGVjdGVkXVwiXHJcbn0iLCJ2YXIgU1VQUE9SVFMgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFBTRVVET19TRUxFQ1QgICAgICA9IC8oOlteXFxzXFwoXFxbKV0rKS9nLFxyXG4gICAgU0VMRUNURURfU0VMRUNUICAgID0gL1xcW3NlbGVjdGVkXFxdL2dpLFxyXG4gICAgY2FjaGUgICAgICAgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgcHJveGllcyAgICAgICAgICAgID0gcmVxdWlyZSgnLi9wcm94eS5qc29uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgcmV0dXJuIGNhY2hlLmhhcyhzdHIpID8gY2FjaGUuZ2V0KHN0cikgOiBjYWNoZS5wdXQoc3RyLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBwc2V1ZG8gcmVwbGFjZSBpZiB0aGUgY2FwdHVyZWQgc2VsZWN0b3IgaXMgaW4gdGhlIHByb3hpZXNcclxuICAgICAgICB2YXIgcyA9IHN0ci5yZXBsYWNlKFBTRVVET19TRUxFQ1QsIChtYXRjaCkgPT4gcHJveGllc1ttYXRjaF0gPyBwcm94aWVzW21hdGNoXSA6IG1hdGNoKTtcclxuXHJcbiAgICAgICAgLy8gYm9vbGVhbiBzZWxlY3RvciByZXBsYWNlbWVudD9cclxuICAgICAgICAvLyBzdXBwb3J0cyBJRTgtOVxyXG4gICAgICAgIHJldHVybiBTVVBQT1JUUy5zZWxlY3RlZFNlbGVjdG9yID8gcyA6IHMucmVwbGFjZShTRUxFQ1RFRF9TRUxFQ1QsICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXScpO1xyXG4gICAgfSk7XHJcbn07IiwiLypcclxuICogRml6emxlLmpzXHJcbiAqIEFkYXB0ZWQgZnJvbSBTaXp6bGUuanNcclxuICovXHJcbnZhciB0b2tlbkNhY2hlICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgZXJyb3IgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciAoY2F1Z2h0KSBcIicrIHNlbGVjdG9yICsnXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zZWxlY3RvcnMvI3doaXRlc3BhY2VcclxuICAgIFdISVRFU1BBQ0UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgSURFTlRJRklFUiA9ICcoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXFxceDAwLVxcXFx4YTBdKSsnLFxyXG5cclxuICAgIC8vIE5PVEU6IExlYXZpbmcgZG91YmxlIHF1b3RlcyB0byByZWR1Y2UgZXNjYXBpbmdcclxuICAgIC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xyXG4gICAgQVRUUklCVVRFUyA9IFwiXFxcXFtcIiArIFdISVRFU1BBQ0UgKyBcIiooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBPcGVyYXRvciAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiKihbKl4kfCF+XT89KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIElERU5USUZJRVJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgSURFTlRJRklFUiArIFwiKSl8KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgXCIqXFxcXF1cIixcclxuXHJcbiAgICBQU0VVRE9TID0gXCI6KFwiICsgSURFTlRJRklFUiArIFwiKSg/OlxcXFwoKFwiICtcclxuICAgICAgICAvLyBUbyByZWR1Y2UgdGhlIG51bWJlciBvZiBzZWxlY3RvcnMgbmVlZGluZyB0b2tlbml6ZSBpbiB0aGUgcHJlRmlsdGVyLCBwcmVmZXIgYXJndW1lbnRzOlxyXG4gICAgICAgIC8vIDEuIHF1b3RlZCAoY2FwdHVyZSAzOyBjYXB0dXJlIDQgb3IgY2FwdHVyZSA1KVxyXG4gICAgICAgIFwiKCcoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcIil8XCIgK1xyXG4gICAgICAgIC8vIDIuIHNpbXBsZSAoY2FwdHVyZSA2KVxyXG4gICAgICAgIFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKClbXFxcXF1dfFwiICsgQVRUUklCVVRFUyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgUl9DT01NQSAgICAgICA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqLCcgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfQ09NQklOQVRPUlMgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKihbPit+XXwnICsgV0hJVEVTUEFDRSArICcpJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9QU0VVRE8gICAgICA9IG5ldyBSZWdFeHAoUFNFVURPUyksXHJcbiAgICBSX01BVENIX0VYUFIgPSB7XHJcbiAgICAgICAgSUQ6ICAgICBuZXcgUmVnRXhwKCdeIygnICAgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBDTEFTUzogIG5ldyBSZWdFeHAoJ15cXFxcLignICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBJREVOVElGSUVSICsgJ3xbKl0pJyksXHJcbiAgICAgICAgQVRUUjogICBuZXcgUmVnRXhwKCdeJyAgICAgKyBBVFRSSUJVVEVTKSxcclxuICAgICAgICBQU0VVRE86IG5ldyBSZWdFeHAoJ14nICAgICArIFBTRVVET1MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufCknICsgV0hJVEVTUEFDRSArICcqKD86KFsrLV18KScgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBXSElURVNQQUNFICsgJypcXFxcKXwpJywgJ2knKSxcclxuICAgICAgICBib29sOiAgIG5ldyBSZWdFeHAoJ14oPzpjaGVja2VkfHNlbGVjdGVkfGFzeW5jfGF1dG9mb2N1c3xhdXRvcGxheXxjb250cm9sc3xkZWZlcnxkaXNhYmxlZHxoaWRkZW58aXNtYXB8bG9vcHxtdWx0aXBsZXxvcGVufHJlYWRvbmx5fHJlcXVpcmVkfHNjb3BlZCkkJywgJ2knKVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDU1MgZXNjYXBlcyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjZXNjYXBlZC1jaGFyYWN0ZXJzXHJcbiAgICBSX1VORVNDQVBFID0gbmV3IFJlZ0V4cCgnXFxcXFxcXFwoW1xcXFxkYS1mXXsxLDZ9JyArIFdISVRFU1BBQ0UgKyAnP3woJyArIFdISVRFU1BBQ0UgKyAnKXwuKScsICdpZycpLFxyXG4gICAgZnVuZXNjYXBlID0gZnVuY3Rpb24oXywgZXNjYXBlZCwgZXNjYXBlZFdoaXRlc3BhY2UpIHtcclxuICAgICAgICB2YXIgaGlnaCA9ICcweCcgKyAoZXNjYXBlZCAtIDB4MTAwMDApO1xyXG4gICAgICAgIC8vIE5hTiBtZWFucyBub24tY29kZXBvaW50XHJcbiAgICAgICAgLy8gU3VwcG9ydDogRmlyZWZveDwyNFxyXG4gICAgICAgIC8vIFdvcmthcm91bmQgZXJyb25lb3VzIG51bWVyaWMgaW50ZXJwcmV0YXRpb24gb2YgKycweCdcclxuICAgICAgICByZXR1cm4gaGlnaCAhPT0gaGlnaCB8fCBlc2NhcGVkV2hpdGVzcGFjZSA/XHJcbiAgICAgICAgICAgIGVzY2FwZWQgOlxyXG4gICAgICAgICAgICBoaWdoIDwgMCA/XHJcbiAgICAgICAgICAgICAgICAvLyBCTVAgY29kZXBvaW50XHJcbiAgICAgICAgICAgICAgICBmcm9tQ2hhckNvZGUoaGlnaCArIDB4MTAwMDApIDpcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBsZW1lbnRhbCBQbGFuZSBjb2RlcG9pbnQgKHN1cnJvZ2F0ZSBwYWlyKVxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKChoaWdoID4+IDEwKSB8IDB4RDgwMCwgKGhpZ2ggJiAweDNGRikgfCAweERDMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVGaWx0ZXIgPSB7XHJcbiAgICAgICAgQVRUUjogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS5yZXBsYWNlKFJfVU5FU0NBUEUsIGZ1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBNb3ZlIHRoZSBnaXZlbiB2YWx1ZSB0byBtYXRjaFszXSB3aGV0aGVyIHF1b3RlZCBvciB1bnF1b3RlZFxyXG4gICAgICAgICAgICBtYXRjaFszXSA9ICggbWF0Y2hbM10gfHwgbWF0Y2hbNF0gfHwgbWF0Y2hbNV0gfHwgJycgKS5yZXBsYWNlKFJfVU5FU0NBUEUsIGZ1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMl0gPT09ICd+PScpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzNdID0gJyAnICsgbWF0Y2hbM10gKyAnICc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCA0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBDSElMRDogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgLyogbWF0Y2hlcyBmcm9tIFJfTUFUQ0hfRVhQUlsnQ0hJTEQnXVxyXG4gICAgICAgICAgICAgICAgMSB0eXBlIChvbmx5fG50aHwuLi4pXHJcbiAgICAgICAgICAgICAgICAyIHdoYXQgKGNoaWxkfG9mLXR5cGUpXHJcbiAgICAgICAgICAgICAgICAzIGFyZ3VtZW50IChldmVufG9kZHxcXGQqfFxcZCpuKFsrLV1cXGQrKT98Li4uKVxyXG4gICAgICAgICAgICAgICAgNCB4bi1jb21wb25lbnQgb2YgeG4reSBhcmd1bWVudCAoWystXT9cXGQqbnwpXHJcbiAgICAgICAgICAgICAgICA1IHNpZ24gb2YgeG4tY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA2IHggb2YgeG4tY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA3IHNpZ24gb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDggeSBvZiB5LWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdLnNsaWNlKDAsIDMpID09PSAnbnRoJykge1xyXG4gICAgICAgICAgICAgICAgLy8gbnRoLSogcmVxdWlyZXMgYXJndW1lbnRcclxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG51bWVyaWMgeCBhbmQgeSBwYXJhbWV0ZXJzIGZvciBFeHByLmZpbHRlci5DSElMRFxyXG4gICAgICAgICAgICAgICAgLy8gcmVtZW1iZXIgdGhhdCBmYWxzZS90cnVlIGNhc3QgcmVzcGVjdGl2ZWx5IHRvIDAvMVxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNF0gPSArKG1hdGNoWzRdID8gbWF0Y2hbNV0gKyAobWF0Y2hbNl0gfHwgMSkgOiAyICogKG1hdGNoWzNdID09PSAnZXZlbicgfHwgbWF0Y2hbM10gPT09ICdvZGQnKSk7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFs1XSA9ICsoKCBtYXRjaFs3XSArIG1hdGNoWzhdKSB8fCBtYXRjaFszXSA9PT0gJ29kZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gb3RoZXIgdHlwZXMgcHJvaGliaXQgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtYXRjaFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBQU0VVRE86IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHZhciBleGNlc3MsXHJcbiAgICAgICAgICAgICAgICB1bnF1b3RlZCA9ICFtYXRjaFs2XSAmJiBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChSX01BVENIX0VYUFIuQ0hJTEQudGVzdChtYXRjaFswXSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBY2NlcHQgcXVvdGVkIGFyZ3VtZW50cyBhcy1pc1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gbWF0Y2hbNF0gfHwgbWF0Y2hbNV0gfHwgJyc7XHJcblxyXG4gICAgICAgICAgICAvLyBTdHJpcCBleGNlc3MgY2hhcmFjdGVycyBmcm9tIHVucXVvdGVkIGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVucXVvdGVkICYmIFJfUFNFVURPLnRlc3QodW5xdW90ZWQpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgZXhjZXNzIGZyb20gdG9rZW5pemUgKHJlY3Vyc2l2ZWx5KVxyXG4gICAgICAgICAgICAgICAgKGV4Y2VzcyA9IHRva2VuaXplKHVucXVvdGVkLCB0cnVlKSkgJiZcclxuICAgICAgICAgICAgICAgIC8vIGFkdmFuY2UgdG8gdGhlIG5leHQgY2xvc2luZyBwYXJlbnRoZXNpc1xyXG4gICAgICAgICAgICAgICAgKGV4Y2VzcyA9IHVucXVvdGVkLmluZGV4T2YoJyknLCB1bnF1b3RlZC5sZW5ndGggLSBleGNlc3MpIC0gdW5xdW90ZWQubGVuZ3RoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGV4Y2VzcyBpcyBhIG5lZ2F0aXZlIGluZGV4XHJcbiAgICAgICAgICAgICAgICBtYXRjaFswXSA9IG1hdGNoWzBdLnNsaWNlKDAsIGV4Y2Vzcyk7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IHVucXVvdGVkLnNsaWNlKDAsIGV4Y2Vzcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiBvbmx5IGNhcHR1cmVzIG5lZWRlZCBieSB0aGUgcHNldWRvIGZpbHRlciBtZXRob2QgKHR5cGUgYW5kIGFyZ3VtZW50KVxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgMyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAqIEBwYXJhbSAge0Jvb2xlYW59IFtwYXJzZU9ubHk9ZmFsc2VdXHJcbiAqIEByZXR1cm4ge1N0cmluZ1tdfE51bWJlcnxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZy5cclxuICogQHByaXZhdGVcclxuICovXHJcbnZhciB0b2tlbml6ZSA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICB2YXIgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgdHlwZSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtSZWdFeHB9ICovXHJcbiAgICAgICAgcmVnZXgsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7QXJyYXl9ICovXHJcbiAgICAgICAgbWF0Y2gsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIG1hdGNoZWQsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nW119ICovXHJcbiAgICAgICAgc3VicXVlcmllcyA9IFtdLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBzdWJxdWVyeSA9ICcnLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBzb0ZhciA9IHNlbGVjdG9yO1xyXG5cclxuICAgIHdoaWxlIChzb0Zhcikge1xyXG4gICAgICAgIC8vIENvbW1hIGFuZCBmaXJzdCBydW5cclxuICAgICAgICBpZiAoIW1hdGNoZWQgfHwgKG1hdGNoID0gUl9DT01NQS5leGVjKHNvRmFyKSkpIHtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBjb25zdW1lIHRyYWlsaW5nIGNvbW1hcyBhcyB2YWxpZFxyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaFswXS5sZW5ndGgpIHx8IHNvRmFyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdWJxdWVyeSkgeyBzdWJxdWVyaWVzLnB1c2goc3VicXVlcnkpOyB9XHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5ID0gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXRjaGVkID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gQ29tYmluYXRvcnNcclxuICAgICAgICBpZiAoKG1hdGNoID0gUl9DT01CSU5BVE9SUy5leGVjKHNvRmFyKSkpIHtcclxuICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5ICs9IG1hdGNoZWQ7XHJcbiAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hlZC5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRmlsdGVyc1xyXG4gICAgICAgIGZvciAodHlwZSBpbiBSX01BVENIX0VYUFIpIHtcclxuICAgICAgICAgICAgcmVnZXggPSBSX01BVENIX0VYUFJbdHlwZV07XHJcbiAgICAgICAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhzb0Zhcik7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2ggJiYgKCFwcmVGaWx0ZXJbdHlwZV0gfHwgKG1hdGNoID0gcHJlRmlsdGVyW3R5cGVdKG1hdGNoKSkpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgIHN1YnF1ZXJ5ICs9IG1hdGNoZWQ7XHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG5cclxuICAgIHJldHVybiBzb0ZhciA/IG51bGwgOiBzdWJxdWVyaWVzO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmdbXXxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZyB0aGUgc2VsZWN0b3IuXHJcbiAgICAgKi9cclxuICAgIHN1YnF1ZXJpZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHRva2VucyA9IHRva2VuQ2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgICAgICB0b2tlbkNhY2hlLmdldChzZWxlY3RvcikgOiBcclxuICAgICAgICAgICAgdG9rZW5DYWNoZS5zZXQoc2VsZWN0b3IsIHRva2VuaXplKHNlbGVjdG9yKSk7XHJcblxyXG4gICAgICAgIGlmICghdG9rZW5zKSB7IGVycm9yKHNlbGVjdG9yKTsgcmV0dXJuIHRva2VuczsgfVxyXG4gICAgICAgIHJldHVybiB0b2tlbnMuc2xpY2UoKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNCb29sOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIFJfTUFUQ0hfRVhQUi5ib29sLnRlc3QobmFtZSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIiAgICAvLyBNYXRjaGVzIFwiLW1zLVwiIHNvIHRoYXQgaXQgY2FuIGJlIGNoYW5nZWQgdG8gXCJtcy1cIlxyXG52YXIgVFJVTkNBVEVfTVNfUFJFRklYICA9IC9eLW1zLS8sXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBkYXNoZWQgc3RyaW5nIGZvciBjYW1lbGl6aW5nXHJcbiAgICBEQVNIX0NBVENIICAgICAgICAgID0gLy0oW1xcZGEtel0pL2dpLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgXCJub25lXCIgb3IgYSB0YWJsZSB0eXBlIGUuZy4gXCJ0YWJsZVwiLFxyXG4gICAgLy8gXCJ0YWJsZS1jZWxsXCIgZXRjLi4uXHJcbiAgICBOT05FX09SX1RBQkxFICAgICAgID0gL14obm9uZXx0YWJsZSg/IS1jW2VhXSkuKykvLFxyXG4gICAgXHJcbiAgICBUWVBFX1RFU1RfRk9DVVNBQkxFID0gL14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8YnV0dG9ufG9iamVjdCkkL2ksXHJcbiAgICBUWVBFX1RFU1RfQ0xJQ0tBQkxFID0gL14oPzphfGFyZWEpJC9pLFxyXG4gICAgU0VMRUNUT1JfSUQgICAgICAgICA9IC9eIyhbXFx3LV0rKSQvLFxyXG4gICAgU0VMRUNUT1JfVEFHICAgICAgICA9IC9eW1xcdy1dKyQvLFxyXG4gICAgU0VMRUNUT1JfQ0xBU1MgICAgICA9IC9eXFwuKFtcXHctXSspJC8sXHJcbiAgICBQT1NJVElPTiAgICAgICAgICAgID0gL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvLFxyXG4gICAgTlVNX05PTl9QWCAgICAgICAgICA9IG5ldyBSZWdFeHAoJ14oJyArICgvWystXT8oPzpcXGQqXFwufClcXGQrKD86W2VFXVsrLV0/XFxkK3wpLykuc291cmNlICsgJykoPyFweClbYS16JV0rJCcsICdpJyksXHJcbiAgICBTSU5HTEVfVEFHICAgICAgICAgID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFwIG9mIHBhcmVudCB0YWcgbmFtZXMgdG8gdGhlIGNoaWxkIHRhZ3MgdGhhdCByZXF1aXJlIHRoZW0uXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBQQVJFTlRfTUFQID0ge1xyXG4gICAgICAgIHRhYmxlOiAgICAvXjwoPzp0Ym9keXx0Zm9vdHx0aGVhZHxjb2xncm91cHxjYXB0aW9uKVxcYi8sXHJcbiAgICAgICAgdGJvZHk6ICAgIC9ePCg/OnRyKVxcYi8sXHJcbiAgICAgICAgdHI6ICAgICAgIC9ePCg/OnRkfHRoKVxcYi8sXHJcbiAgICAgICAgY29sZ3JvdXA6IC9ePCg/OmNvbClcXGIvLFxyXG4gICAgICAgIHNlbGVjdDogICAvXjwoPzpvcHRpb24pXFxiL1xyXG4gICAgfTtcclxuXHJcbi8vIGhhdmluZyBjYWNoZXMgaXNuJ3QgYWN0dWFsbHkgZmFzdGVyXHJcbi8vIGZvciBhIG1ham9yaXR5IG9mIHVzZSBjYXNlcyBmb3Igc3RyaW5nXHJcbi8vIG1hbmlwdWxhdGlvbnNcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBudW1Ob3RQeDogICAgICAgKHZhbCkgPT4gTlVNX05PTl9QWC50ZXN0KHZhbCksXHJcbiAgICBwb3NpdGlvbjogICAgICAgKHZhbCkgPT4gUE9TSVRJT04udGVzdCh2YWwpLFxyXG4gICAgc2luZ2xlVGFnTWF0Y2g6ICh2YWwpID0+IFNJTkdMRV9UQUcuZXhlYyh2YWwpLFxyXG4gICAgaXNOb25lT3JUYWJsZTogIChzdHIpID0+IE5PTkVfT1JfVEFCTEUudGVzdChzdHIpLFxyXG4gICAgaXNGb2N1c2FibGU6ICAgIChzdHIpID0+IFRZUEVfVEVTVF9GT0NVU0FCTEUudGVzdChzdHIpLFxyXG4gICAgaXNDbGlja2FibGU6ICAgIChzdHIpID0+IFRZUEVfVEVTVF9DTElDS0FCTEUudGVzdChzdHIpLFxyXG4gICAgaXNTdHJpY3RJZDogICAgIChzdHIpID0+IFNFTEVDVE9SX0lELnRlc3Qoc3RyKSxcclxuICAgIGlzVGFnOiAgICAgICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9UQUcudGVzdChzdHIpLFxyXG4gICAgaXNDbGFzczogICAgICAgIChzdHIpID0+IFNFTEVDVE9SX0NMQVNTLnRlc3Qoc3RyKSxcclxuXHJcbiAgICBjYW1lbENhc2U6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShUUlVOQ0FURV9NU19QUkVGSVgsICdtcy0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZShEQVNIX0NBVENILCAobWF0Y2gsIGxldHRlcikgPT4gbGV0dGVyLnRvVXBwZXJDYXNlKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRUYWdOYW1lOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgdmFsID0gc3RyLnN1YnN0cigwLCAzMCk7XHJcbiAgICAgICAgZm9yICh2YXIgcGFyZW50VGFnTmFtZSBpbiBQQVJFTlRfTUFQKSB7XHJcbiAgICAgICAgICAgIGlmIChQQVJFTlRfTUFQW3BhcmVudFRhZ05hbWVdLnRlc3QodmFsKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudFRhZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICdkaXYnO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgRElWICAgID0gcmVxdWlyZSgnRElWJyksXHJcbiAgICBjcmVhdGUgPSByZXF1aXJlKCdESVYvY3JlYXRlJyksXHJcbiAgICBhICAgICAgPSBESVYucXVlcnlTZWxlY3RvcignYScpLFxyXG4gICAgc2VsZWN0ID0gY3JlYXRlKCdzZWxlY3QnKSxcclxuICAgIG9wdGlvbiA9IHNlbGVjdC5hcHBlbmRDaGlsZChjcmVhdGUoJ29wdGlvbicpKSxcclxuXHJcbiAgICB0ZXN0ID0gKHRhZ05hbWUsIHRlc3RGbikgPT4gdGVzdEZuKGNyZWF0ZSh0YWdOYW1lKSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IFVSTHMgYXJlbid0IG1hbmlwdWxhdGVkXHJcbiAgICAvLyAoSUUgbm9ybWFsaXplcyBpdCBieSBkZWZhdWx0KVxyXG4gICAgaHJlZk5vcm1hbGl6ZWQ6IGEuZ2V0QXR0cmlidXRlKCdocmVmJykgPT09ICcvYScsXHJcblxyXG4gICAgLy8gQ2hlY2sgdGhlIGRlZmF1bHQgY2hlY2tib3gvcmFkaW8gdmFsdWUgKCcnIGluIG9sZGVyIFdlYktpdDsgJ29uJyBlbHNld2hlcmUpXHJcbiAgICBjaGVja09uOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuICEhaW5wdXQudmFsdWU7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbiBpbnB1dCBtYWludGFpbnMgaXRzIHZhbHVlIGFmdGVyIGJlY29taW5nIGEgcmFkaW9cclxuICAgIC8vIFN1cHBvcnQ6IE1vZGVybiBicm93c2VycyBvbmx5IChOT1QgSUUgPD0gMTEpXHJcbiAgICByYWRpb1ZhbHVlOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQudmFsdWUgPSAndCc7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnZhbHVlID09PSAndCc7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBhIHNlbGVjdGVkLWJ5LWRlZmF1bHQgb3B0aW9uIGhhcyBhIHdvcmtpbmcgc2VsZWN0ZWQgcHJvcGVydHkuXHJcbiAgICAvLyAoV2ViS2l0IGRlZmF1bHRzIHRvIGZhbHNlIGluc3RlYWQgb2YgdHJ1ZSwgSUUgdG9vLCBpZiBpdCdzIGluIGFuIG9wdGdyb3VwKVxyXG4gICAgb3B0U2VsZWN0ZWQ6IG9wdGlvbi5zZWxlY3RlZCxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgb3B0aW9ucyBpbnNpZGUgZGlzYWJsZWQgc2VsZWN0cyBhcmVuJ3QgbWFya2VkIGFzIGRpc2FibGVkXHJcbiAgICAvLyAoV2ViS2l0IG1hcmtzIHRoZW0gYXMgZGlzYWJsZWQpXHJcbiAgICBvcHREaXNhYmxlZDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuICFvcHRpb24uZGlzYWJsZWQ7XHJcbiAgICB9KCkpLFxyXG4gICAgXHJcbiAgICB0ZXh0Q29udGVudDogRElWLnRleHRDb250ZW50ICE9PSB1bmRlZmluZWQsXHJcblxyXG4gICAgLy8gTW9kZXJuIGJyb3dzZXJzIG5vcm1hbGl6ZSBcXHJcXG4gdG8gXFxuIGluIHRleHRhcmVhIHZhbHVlcyxcclxuICAgIC8vIGJ1dCBJRSA8PSAxMSAoYW5kIHBvc3NpYmx5IG5ld2VyKSBkbyBub3QuXHJcbiAgICB2YWx1ZU5vcm1hbGl6ZWQ6IHRlc3QoJ3RleHRhcmVhJywgZnVuY3Rpb24odGV4dGFyZWEpIHtcclxuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9ICdcXHJcXG4nO1xyXG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS52YWx1ZSA9PT0gJ1xcbic7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBzZWxlY3RlZFNlbGVjdG9yOiB0ZXN0KCdzZWxlY3QnLCBmdW5jdGlvbihzZWxlY3QpIHtcclxuICAgICAgICBzZWxlY3QuaW5uZXJIVE1MID0gJzxvcHRpb24gdmFsdWU9XCIxXCI+MTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XCIyXCIgc2VsZWN0ZWQ+Mjwvb3B0aW9uPic7XHJcbiAgICAgICAgcmV0dXJuICEhc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJ29wdGlvbltzZWxlY3RlZF0nKTtcclxuICAgIH0pXHJcbn07XHJcbiIsInZhciBleGlzdHMgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBcnJheSAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCdpcy9hcnJheUxpa2UnKSxcclxuICAgIGlzTm9kZUxpc3QgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIHNsaWNlICAgICAgID0gcmVxdWlyZSgndXRpbC9zbGljZScpO1xyXG5cclxudmFyIGxvb3AgPSBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUpIHtcclxuICAgICAgICBpZiAoIW9iaiB8fCAhaXRlcmF0ZWUpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoO1xyXG4gICAgICAgIGlmIChsZW5ndGggPT09ICtsZW5ndGgpIHtcclxuICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihpdGVyYXRlZSwgb2JqW2lkeF0sIGlkeCwgb2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcclxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSBrZXlzLmxlbmd0aDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoaXRlcmF0ZWUsIG9ialtrZXlzW2lkeF1dLCBrZXlzW2lkeF0sIG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgXyA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gRmxhdHRlbiB0aGF0IGFsc28gY2hlY2tzIGlmIHZhbHVlIGlzIGEgTm9kZUxpc3RcclxuICAgIGZsYXR0ZW46IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChfLmZsYXR0ZW4odmFsdWUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgdG9QeDogKHZhbHVlKSA9PiB2YWx1ZSArICdweCcsXHJcbiAgICBcclxuICAgIHBhcnNlSW50OiAobnVtKSA9PiBwYXJzZUludChudW0sIDEwKSxcclxuXHJcbiAgICBldmVyeTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghZXhpc3RzKGFycikpIHsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKCFpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBleHRlbmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxyXG4gICAgICAgICAgICBvYmogID0gYXJnc1swXSxcclxuICAgICAgICAgICAgbGVuICA9IGFyZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIW9iaiB8fCBsZW4gPCAyKSB7IHJldHVybiBvYmo7IH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaWR4ID0gMTsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gYXJnc1tpZHhdO1xyXG4gICAgICAgICAgICBpZiAoc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3RhbmRhcmQgbWFwXHJcbiAgICBtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQXJyYXktcHJlc2VydmluZyBtYXBcclxuICAgIC8vIGh0dHA6Ly9qc3BlcmYuY29tL3B1c2gtbWFwLXZzLWluZGV4LXJlcGxhY2VtZW50LW1hcFxyXG4gICAgZmFzdG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghYXJyKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKGFyciAmJiBhcnIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFycltpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHB1bGxlZCBmcm9tIEFNRFxyXG4gICAgdHlwZWNhc3Q6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSAnbnVsbCcpIHtcclxuICAgICAgICAgICAgciA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICByID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykge1xyXG4gICAgICAgICAgICByID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICcnIHx8IGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgLy8gaXNOYU4oJycpIHJldHVybnMgZmFsc2VcclxuICAgICAgICAgICAgciA9IHZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBwYXJzZUZsb2F0KG51bGwgfHwgJycpIHJldHVybnMgTmFOXHJcbiAgICAgICAgICAgIHIgPSBwYXJzZUZsb2F0KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBUT0RPOlxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYgKCFvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2Uob2JqKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhcnIsXHJcbiAgICAgICAgICAgIGxlbiA9ICtvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG5cclxuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICAgICAgYXJyID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgYXJyW2lkeF0gPSBvYmpbaWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBhcnIucHVzaChvYmpba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VBcnJheTogKGFyZykgPT5cclxuICAgICAgICAhZXhpc3RzKGFyZykgPyBbXSA6XHJcbiAgICAgICAgaXNBcnJheUxpa2UoYXJnKSA/IHNsaWNlKGFyZykgOiBbIGFyZyBdLFxyXG5cclxuICAgIGNvbnRhaW5zOiAoYXJyLCBpdGVtKSA9PiBhcnIuaW5kZXhPZihpdGVtKSAhPT0gLTEsXHJcblxyXG4gICAganFFYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmbi5jYWxsKHZhbHVlLCBrZXlJbmRleCwgdmFsdWUsIGNvbGxlY3Rpb24pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZEVhY2g6IGxvb3AoZnVuY3Rpb24oZm4sIHZhbHVlLCBrZXlJbmRleCwgY29sbGVjdGlvbikge1xyXG4gICAgICAgIGZuLmNhbGwodmFsdWUsIHZhbHVlLCBrZXlJbmRleCwgY29sbGVjdGlvbik7XHJcbiAgICB9KSxcclxuXHJcbiAgICBlYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgpIHtcclxuICAgICAgICBmbih2YWx1ZSwga2V5SW5kZXgpO1xyXG4gICAgfSksXHJcblxyXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gc2Vjb25kLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gR28gdGhyb3VnaCBlYWNoIGVsZW1lbnQgaW4gdGhlXHJcbiAgICAgICAgLy8gc2Vjb25kIGFycmF5IGFuZCBhZGQgaXQgdG8gdGhlXHJcbiAgICAgICAgLy8gZmlyc3RcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2lkeF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJzdC5sZW5ndGggPSBpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmlyc3Q7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHBsdWNrXHJcbiAgICAvLyBUT0RPOiBDaGVjayBmb3IgcGxhY2VzIHRoaXMgY2FuIGJlIGFwcGxpZWRcclxuICAgIHBsdWNrOiBmdW5jdGlvbihhcnIsIGtleSkge1xyXG4gICAgICAgIHJldHVybiBfLm1hcChhcnIsIChvYmopID0+IG9iaiA/IG9ialtrZXldIDogdW5kZWZpbmVkKTtcclxuICAgIH1cclxufTsiLCJ2YXIgZGVsZXRlciA9IChkZWxldGFibGUpID0+XHJcbiAgICBkZWxldGFibGUgPyBcclxuICAgICAgICBmdW5jdGlvbihzdG9yZSwga2V5KSB7IGRlbGV0ZSBzdG9yZVtrZXldOyB9IDpcclxuICAgICAgICBmdW5jdGlvbihzdG9yZSwga2V5KSB7IHN0b3JlW2tleV0gPSB1bmRlZmluZWQ7IH07XHJcblxyXG52YXIgZ2V0dGVyU2V0dGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICB2YXIgc3RvcmUgPSB7fSxcclxuICAgICAgICBkZWwgPSBkZWxldGVyKGRlbGV0YWJsZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4ga2V5IGluIHN0b3JlICYmIHN0b3JlW2tleV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdG9yZVtrZXldO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHV0OiBmdW5jdGlvbihrZXksIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm4oYXJnKTtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICBkZWwoc3RvcmUsIGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBiaUxldmVsR2V0dGVyU2V0dGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICB2YXIgc3RvcmUgPSB7fSxcclxuICAgICAgICBkZWwgPSBkZWxldGVyKGRlbGV0YWJsZSk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIGhhczEgPSBrZXkxIGluIHN0b3JlICYmIHN0b3JlW2tleTFdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGlmICghaGFzMSB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGtleTIgaW4gc3RvcmVba2V5MV0gJiYgc3RvcmVba2V5MV1ba2V5Ml0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdO1xyXG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/IHJlZjEgOiAocmVmMSAhPT0gdW5kZWZpbmVkID8gcmVmMVtrZXkyXSA6IHJlZjEpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHV0OiBmdW5jdGlvbihrZXkxLCBrZXkyLCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZm4oYXJnKTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgLy8gRWFzeSByZW1vdmFsXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsKHN0b3JlLCBrZXkxKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGVlcCByZW1vdmFsXHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV0gfHwgKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICBkZWwocmVmMSwga2V5Mik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obHZsLCBkZWxldGFibGUpIHtcclxuICAgIHJldHVybiBsdmwgPT09IDIgPyBiaUxldmVsR2V0dGVyU2V0dGVyKGRlbGV0YWJsZSkgOiBnZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKTtcclxufTsiLCJ2YXIgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSBpbnN0YW5jZW9mIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cy5zZXQgPSAoRCkgPT4gY29uc3RydWN0b3IgPSBEO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmICt2YWx1ZS5sZW5ndGggPT09IHZhbHVlLmxlbmd0aDtcclxuIiwidmFyIGlzRG9jdW1lbnRGcmFnbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZG9jX2ZyYWc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciBwYXJlbnQ7XHJcbiAgICByZXR1cm4gZWxlbSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLm93bmVyRG9jdW1lbnQgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0gIT09IGRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkgICAgICAgICAgICAgJiZcclxuICAgICAgICAhaXNEb2N1bWVudEZyYWdtZW50KHBhcmVudCkgICAgICAgICAgICAmJlxyXG4gICAgICAgIHBhcmVudC5pc1BhcnNlSHRtbEZyYWdtZW50ICE9PSB0cnVlO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2U7XHJcbiIsInZhciBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNEICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgaXNEKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSBkb2N1bWVudDtcclxuIiwidmFyIGlzV2luZG93ICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCBpc0VsZW1lbnQodmFsdWUpKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGw7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgdmFyIHRleHQgPSB2YWx1ZS50cmltKCk7XHJcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApID09PSAnPCcgJiYgdGV4dC5jaGFyQXQodGV4dC5sZW5ndGggLSAxKSA9PT0gJz4nICYmIHRleHQubGVuZ3RoID49IDMpO1xyXG59OyIsIi8vIE5vZGVMaXN0IGNoZWNrLiBGb3Igb3VyIHB1cnBvc2VzLCBhIE5vZGVMaXN0IGFuZCBhbiBIVE1MQ29sbGVjdGlvbiBhcmUgdGhlIHNhbWUuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSAmJiAoXHJcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBOb2RlTGlzdCB8fFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb25cclxuICAgICk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XHJcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAoISF2YWx1ZSAmJiB0eXBlID09PSAnb2JqZWN0Jyk7XHJcbn07IiwidmFyIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbCkgPT5cclxuICAgIHZhbCAmJiAoaXNTdHJpbmcodmFsKSB8fCBpc0Z1bmN0aW9uKHZhbCkgfHwgaXNFbGVtZW50KHZhbCkgfHwgaXNDb2xsZWN0aW9uKHZhbCkpOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gdmFsdWUud2luZG93O1xyXG4iLCJ2YXIgaXNFbGVtZW50ICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgRElWICAgICAgICAgICAgID0gcmVxdWlyZSgnRElWJyksXHJcbiAgICAvLyBTdXBwb3J0OiBJRTkrLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIG1hdGNoZXNTZWxlY3RvciA9IERJVi5tYXRjaGVzICAgICAgICAgICAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5tYXRjaGVzU2VsZWN0b3IgICAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5tc01hdGNoZXNTZWxlY3RvciAgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5tb3pNYXRjaGVzU2VsZWN0b3IgICAgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHxcclxuICAgICAgICAgICAgICAgICAgICAgIERJVi5vTWF0Y2hlc1NlbGVjdG9yO1xyXG5cclxuLy8gb25seSBlbGVtZW50IHR5cGVzIHN1cHBvcnRlZFxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGlzRWxlbWVudChlbGVtKSA/IG1hdGNoZXNTZWxlY3Rvci5jYWxsKGVsZW0sIHNlbGVjdG9yKSA6IGZhbHNlO1xyXG4iLCJ2YXIgXyAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBzbGljZSAgID0gcmVxdWlyZSgndXRpbC9zbGljZScpLFxyXG4gICAgbWFwICAgICA9IHJlcXVpcmUoJy4vbWFwJyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgYXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbK2luZGV4XTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIC8vIE5vIGluZGV4LCByZXR1cm4gYWxsXHJcbiAgICAgICAgaWYgKCFleGlzdHMoaW5kZXgpKSB7IHJldHVybiBzbGljZSh0aGlzKTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gK2luZGV4O1xyXG4gICAgICAgIHJldHVybiB0aGlzW1xyXG4gICAgICAgICAgICAvLyBMb29raW5nIHRvIGdldCBhbiBpbmRleCBmcm9tIHRoZSBlbmQgb2YgdGhlIHNldFxyXG4gICAgICAgICAgICAvLyBpZiBuZWdhdGl2ZSwgb3IgdGhlIHN0YXJ0IG9mIHRoZSBzZXQgaWYgcG9zaXRpdmVcclxuICAgICAgICAgICAgaWR4IDwgMCA/IHRoaXMubGVuZ3RoICsgaWR4IDogaWR4XHJcbiAgICAgICAgXTtcclxuICAgIH0sXHJcblxyXG4gICAgZXE6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpcy5nZXQoaW5kZXgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2xpY2U6IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcclxuICAgICAgICByZXR1cm4gRChzbGljZSh0aGlzLCBzdGFydCwgZW5kKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzWzBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgbGFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpc1t0aGlzLmxlbmd0aCAtIDFdKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHNsaWNlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYXA6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIEQobWFwKHRoaXMsIGl0ZXJhdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgXy5kRWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgXy5kRWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgIGlmICghYXJyLmxlbmd0aCB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICBpdGVtO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICBpdGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29uY2F0IGZsYXQgZm9yIGEgc2luZ2xlIGFycmF5IG9mIGFycmF5c1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdC5hcHBseShbXSwgcmVzdWx0cyk7XHJcbn07IiwidmFyIG9yZGVyID0gcmVxdWlyZSgnb3JkZXInKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocmVzdWx0cykge1xyXG4gICAgdmFyIGhhc0R1cGxpY2F0ZXMgPSBvcmRlci5zb3J0KHJlc3VsdHMpO1xyXG4gICAgaWYgKCFoYXNEdXBsaWNhdGVzKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgdmFyIGVsZW0sXHJcbiAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAvLyBjcmVhdGUgdGhlIGFycmF5IGhlcmVcclxuICAgICAgICAvLyBzbyB0aGF0IGEgbmV3IGFycmF5IGlzbid0XHJcbiAgICAgICAgLy8gY3JlYXRlZC9kZXN0cm95ZWQgZXZlcnkgdW5pcXVlIGNhbGxcclxuICAgICAgICBkdXBsaWNhdGVzID0gW107XHJcblxyXG4gICAgLy8gR28gdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGlkZW50aWZ5XHJcbiAgICAvLyB0aGUgZHVwbGljYXRlcyB0byBiZSByZW1vdmVkXHJcbiAgICB3aGlsZSAoKGVsZW0gPSByZXN1bHRzW2lkeCsrXSkpIHtcclxuICAgICAgICBpZiAoZWxlbSA9PT0gcmVzdWx0c1tpZHhdKSB7XHJcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMucHVzaChpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGR1cGxpY2F0ZXMgZnJvbSB0aGUgcmVzdWx0c1xyXG4gICAgaWR4ID0gZHVwbGljYXRlcy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgIHJlc3VsdHMuc3BsaWNlKGR1cGxpY2F0ZXNbaWR4XSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07IiwidmFyIF8gICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgZXhpc3RzICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRnVuY3Rpb24gICAgICAgICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIGlzTm9kZU5hbWUgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIG5ld2xpbmVzICAgICAgICAgICAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG5cclxuICAgIHNwbGl0ID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ciA9PT0gJycgPyBbXSA6IHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XHJcbiAgICB9O1xyXG5cclxudmFyIGFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LmFkZChuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC50b2dnbGUobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvdWJsZUNsYXNzTG9vcCA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcywgbWV0aG9kKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZWxlbSA9IGVsZW1zW2lkeF07XHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgICAgIGNsYXNzTGlzdCA9IGVsZW0uY2xhc3NMaXN0O1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2QoY2xhc3NMaXN0LCBuYW1lc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb0FueUVsZW1zSGF2ZUNsYXNzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWUpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBpZiAoZWxlbXNbaWR4XS5jbGFzc0xpc3QuY29udGFpbnMobmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBlbGVtc1tpZHhdLmNsYXNzTmFtZSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoICYmIGV4aXN0cyhuYW1lKSAmJiBuYW1lICE9PSAnJyA/IGRvQW55RWxlbXNIYXZlQ2xhc3ModGhpcywgbmFtZSkgOiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCBhZGRDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsQ2xhc3Nlcyh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHsgbmFtZXMgPSBzcGxpdChuYW1lcyk7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuYW1lcy5sZW5ndGggPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZXMsIHJlbW92ZUNsYXNzKSA6IHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzLCBzaG91bGRBZGQpIHtcclxuICAgICAgICB2YXIgbmFtZUxpc3Q7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoIHx8ICF0aGlzLmxlbmd0aCB8fCAhKG5hbWVMaXN0ID0gc3BsaXQobmFtZXMpKS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNob3VsZEFkZCA9PT0gdW5kZWZpbmVkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCB0b2dnbGVDbGFzcykgOlxyXG4gICAgICAgICAgICBzaG91bGRBZGQgPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIGFkZENsYXNzKSA6XHJcbiAgICAgICAgICAgIGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgcmVtb3ZlQ2xhc3MpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBzcGxpdCAgICAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkICAgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzQm9vbGVhbiAgICAgID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICAgICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzQXJyYXkgICAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRG9jdW1lbnRUeXBlID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5kb2MsXHJcbiAgICBSRUdFWCAgICAgICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MgPSB7XHJcbiAgICBkaXNwbGF5OiAgICAnYmxvY2snLFxyXG4gICAgcG9zaXRpb246ICAgJ2Fic29sdXRlJyxcclxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXHJcbn07XHJcblxyXG52YXIgZ2V0RG9jdW1lbnREaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAvLyBFaXRoZXIgc2Nyb2xsW1dpZHRoL0hlaWdodF0gb3Igb2Zmc2V0W1dpZHRoL0hlaWdodF0gb3JcclxuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdLCB3aGljaGV2ZXIgaXMgZ3JlYXRlc3RcclxuICAgIHZhciBkb2MgPSBlbGVtLmRvY3VtZW50RWxlbWVudDtcclxuICAgIHJldHVybiBNYXRoLm1heChcclxuICAgICAgICBlbGVtLmJvZHlbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBlbGVtLmJvZHlbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZG9jWydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snY2xpZW50JyArIG5hbWVdXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIGhpZGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSxcclxuICAgIHNob3cgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGNzc1N3YXAgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBvbGQgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMsIGFuZCBpbnNlcnQgdGhlIG5ldyBvbmVzXHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgb2xkW25hbWVdID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvbGRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBdm9pZHMgYW4gJ0lsbGVnYWwgSW52b2NhdGlvbicgZXJyb3IgKENocm9tZSlcclxuICAgIC8vIEF2b2lkcyBhICdUeXBlRXJyb3I6IEFyZ3VtZW50IDEgb2YgV2luZG93LmdldENvbXB1dGVkU3R5bGUgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBFbGVtZW50JyBlcnJvciAoRmlyZWZveClcclxuICAgIGdldENvbXB1dGVkU3R5bGUgPSAoZWxlbSkgPT5cclxuICAgICAgICBpc0VsZW1lbnQoZWxlbSkgJiYgIWlzV2luZG93KGVsZW0pICYmICFpc0RvY3VtZW50KGVsZW0pID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSkgOiBudWxsLFxyXG5cclxuICAgIF93aWR0aCA9IHtcclxuICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEb2N1bWVudFR5cGUoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnV2lkdGgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgaWYgKHdpZHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLndpZHRoID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfaGVpZ2h0ID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0RvY3VtZW50VHlwZShlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdIZWlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGVsZW0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoaGVpZ2h0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLmhlaWdodCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgZ2V0V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuXHJcbiAgICAvLyBTdGFydCB3aXRoIG9mZnNldCBwcm9wZXJ0eSwgd2hpY2ggaXMgZXF1aXZhbGVudCB0byB0aGUgYm9yZGVyLWJveCB2YWx1ZVxyXG4gICAgdmFyIHZhbHVlSXNCb3JkZXJCb3ggPSB0cnVlLFxyXG4gICAgICAgIHZhbCA9IChuYW1lID09PSAnd2lkdGgnKSA/IGVsZW0ub2Zmc2V0V2lkdGggOiBlbGVtLm9mZnNldEhlaWdodCxcclxuICAgICAgICBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIGlzQm9yZGVyQm94ID0gc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnO1xyXG5cclxuICAgIC8vIHNvbWUgbm9uLWh0bWwgZWxlbWVudHMgcmV0dXJuIHVuZGVmaW5lZCBmb3Igb2Zmc2V0V2lkdGgsIHNvIGNoZWNrIGZvciBudWxsL3VuZGVmaW5lZFxyXG4gICAgLy8gc3ZnIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjQ5Mjg1XHJcbiAgICAvLyBNYXRoTUwgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD00OTE2NjhcclxuICAgIGlmICh2YWwgPD0gMCB8fCAhZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gY29tcHV0ZWQgdGhlbiB1bmNvbXB1dGVkIGNzcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICB2YWwgPSBjdXJDc3MoZWxlbSwgbmFtZSwgc3R5bGVzKTtcclxuICAgICAgICBpZiAodmFsIDwgMCB8fCAhdmFsKSB7IHZhbCA9IGVsZW0uc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZWQgdW5pdCBpcyBub3QgcGl4ZWxzLiBTdG9wIGhlcmUgYW5kIHJldHVybi5cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgodmFsKSkgeyByZXR1cm4gdmFsOyB9XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdGhlIGNoZWNrIGZvciBzdHlsZSBpbiBjYXNlIGEgYnJvd3NlciB3aGljaCByZXR1cm5zIHVucmVsaWFibGUgdmFsdWVzXHJcbiAgICAgICAgLy8gZm9yIGdldENvbXB1dGVkU3R5bGUgc2lsZW50bHkgZmFsbHMgYmFjayB0byB0aGUgcmVsaWFibGUgZWxlbS5zdHlsZVxyXG4gICAgICAgIHZhbHVlSXNCb3JkZXJCb3ggPSBpc0JvcmRlckJveCAmJiB2YWwgPT09IHN0eWxlc1tuYW1lXTtcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplICcnLCBhdXRvLCBhbmQgcHJlcGFyZSBmb3IgZXh0cmFcclxuICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHZhbCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1c2UgdGhlIGFjdGl2ZSBib3gtc2l6aW5nIG1vZGVsIHRvIGFkZC9zdWJ0cmFjdCBpcnJlbGV2YW50IHN0eWxlc1xyXG4gICAgcmV0dXJuIF8udG9QeChcclxuICAgICAgICB2YWwgKyBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodChcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JyxcclxuICAgICAgICAgICAgdmFsdWVJc0JvcmRlckJveCxcclxuICAgICAgICAgICAgc3R5bGVzXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBDU1NfRVhQQU5EID0gc3BsaXQoJ1RvcHxSaWdodHxCb3R0b218TGVmdCcpO1xyXG52YXIgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBleHRyYSwgaXNCb3JkZXJCb3gsIHN0eWxlcykge1xyXG4gICAgdmFyIHZhbCA9IDAsXHJcbiAgICAgICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIHRoZSByaWdodCBtZWFzdXJlbWVudCwgYXZvaWQgYXVnbWVudGF0aW9uXHJcbiAgICAgICAgaWR4ID0gKGV4dHJhID09PSAoaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JykpID9cclxuICAgICAgICAgICAgNCA6XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpbml0aWFsaXplIGZvciBob3Jpem9udGFsIG9yIHZlcnRpY2FsIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgKG5hbWUgPT09ICd3aWR0aCcpID9cclxuICAgICAgICAgICAgMSA6XHJcbiAgICAgICAgICAgIDAsXHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICAvLyBQdWxsZWQgb3V0IG9mIHRoZSBsb29wIHRvIHJlZHVjZSBzdHJpbmcgY29tcGFyaXNvbnNcclxuICAgICAgICBleHRyYUlzTWFyZ2luICA9IChleHRyYSA9PT0gJ21hcmdpbicpLFxyXG4gICAgICAgIGV4dHJhSXNDb250ZW50ID0gKCFleHRyYUlzTWFyZ2luICYmIGV4dHJhID09PSAnY29udGVudCcpLFxyXG4gICAgICAgIGV4dHJhSXNQYWRkaW5nID0gKCFleHRyYUlzTWFyZ2luICYmICFleHRyYUlzQ29udGVudCAmJiBleHRyYSA9PT0gJ3BhZGRpbmcnKTtcclxuXHJcbiAgICBmb3IgKDsgaWR4IDwgNDsgaWR4ICs9IDIpIHtcclxuICAgICAgICB0eXBlID0gQ1NTX0VYUEFORFtpZHhdO1xyXG5cclxuICAgICAgICAvLyBib3RoIGJveCBtb2RlbHMgZXhjbHVkZSBtYXJnaW4sIHNvIGFkZCBpdCBpZiB3ZSB3YW50IGl0XHJcbiAgICAgICAgaWYgKGV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgYm9yZGVyIG5vciBtYXJnaW4sIHNvIHJlbW92ZSBib3JkZXJcclxuICAgICAgICAgICAgaWYgKCFleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlICsgJ1dpZHRoJ10pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQsIHNvIGFkZCBwYWRkaW5nXHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxudmFyIGN1ckNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGNvbXB1dGVkKSB7XHJcbiAgICB2YXIgc3R5bGUgPSBlbGVtLnN0eWxlLFxyXG4gICAgICAgIHN0eWxlcyA9IGNvbXB1dGVkIHx8IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgcmV0ID0gc3R5bGVzID8gc3R5bGVzLmdldFByb3BlcnR5VmFsdWUobmFtZSkgfHwgc3R5bGVzW25hbWVdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEF2b2lkIHNldHRpbmcgcmV0IHRvIGVtcHR5IHN0cmluZyBoZXJlXHJcbiAgICAvLyBzbyB3ZSBkb24ndCBkZWZhdWx0IHRvIGF1dG9cclxuICAgIGlmICghZXhpc3RzKHJldCkgJiYgc3R5bGUgJiYgc3R5bGVbbmFtZV0pIHsgcmV0ID0gc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAvLyBGcm9tIHRoZSBoYWNrIGJ5IERlYW4gRWR3YXJkc1xyXG4gICAgLy8gaHR0cDovL2VyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA3LzA3LzI3LzE4LjU0LjE1LyNjb21tZW50LTEwMjI5MVxyXG5cclxuICAgIGlmIChzdHlsZXMpIHtcclxuICAgICAgICBpZiAocmV0ID09PSAnJyAmJiAhaXNBdHRhY2hlZChlbGVtKSkge1xyXG4gICAgICAgICAgICByZXQgPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXHJcbiAgICAgICAgLy8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXHJcbiAgICAgICAgLy8gYnV0IG5vdCBwb3NpdGlvbiBjc3MgYXR0cmlidXRlcywgYXMgdGhvc2UgYXJlIHByb3BvcnRpb25hbCB0byB0aGUgcGFyZW50IGVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICAgIC8vIGFuZCB3ZSBjYW4ndCBtZWFzdXJlIHRoZSBwYXJlbnQgaW5zdGVhZCBiZWNhdXNlIGl0IG1pZ2h0IHRyaWdnZXIgYSAnc3RhY2tpbmcgZG9sbHMnIHByb2JsZW1cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgocmV0KSAmJiAhUkVHRVgucG9zaXRpb24obmFtZSkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyIGxlZnQgPSBzdHlsZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcnMgPSBlbGVtLnJ1bnRpbWVTdHlsZSxcclxuICAgICAgICAgICAgICAgIHJzTGVmdCA9IHJzICYmIHJzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IGVsZW0uY3VycmVudFN0eWxlLmxlZnQ7IH1cclxuXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAobmFtZSA9PT0gJ2ZvbnRTaXplJykgPyAnMWVtJyA6IHJldDtcclxuICAgICAgICAgICAgcmV0ID0gXy50b1B4KHN0eWxlLnBpeGVsTGVmdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXZlcnQgdGhlIGNoYW5nZWQgdmFsdWVzXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSByc0xlZnQ7IH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJldCA9PT0gdW5kZWZpbmVkID8gcmV0IDogcmV0ICsgJycgfHwgJ2F1dG8nO1xyXG59O1xyXG5cclxudmFyIG5vcm1hbGl6ZUNzc0tleSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHJldHVybiBSRUdFWC5jYW1lbENhc2UobmFtZSk7XHJcbn07XHJcblxyXG52YXIgc2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIGVsZW0uc3R5bGVbbmFtZV0gPSAodmFsdWUgPT09ICt2YWx1ZSkgPyBfLnRvUHgodmFsdWUpIDogdmFsdWU7XHJcbn07XHJcblxyXG52YXIgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUoZWxlbSlbbmFtZV07XHJcbn07XHJcblxyXG52YXIgaXNIaWRkZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkOlxyXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQub2Zmc2V0UGFyZW50XHJcbiAgICByZXR1cm4gZWxlbS5vZmZzZXRQYXJlbnQgPT09IG51bGwgfHxcclxuICAgICAgICAgICAgLy8gU3VwcG9ydDogT3BlcmEgPD0gMTIuMTJcclxuICAgICAgICAgICAgLy8gT3BlcmEgcmVwb3J0cyBvZmZzZXRXaWR0aHMgYW5kIG9mZnNldEhlaWdodHMgbGVzcyB0aGFuIHplcm8gb24gc29tZSBlbGVtZW50c1xyXG4gICAgICAgICAgICBlbGVtLm9mZnNldFdpZHRoIDw9IDAgJiYgZWxlbS5vZmZzZXRIZWlnaHQgPD0gMCB8fFxyXG4gICAgICAgICAgICAvLyBGYWxsYmFja1xyXG4gICAgICAgICAgICAoKGVsZW0uc3R5bGUgJiYgZWxlbS5zdHlsZS5kaXNwbGF5KSA/IGVsZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIDogZmFsc2UpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjdXJDc3M6IGN1ckNzcyxcclxuICAgIHdpZHRoOiAgX3dpZHRoLFxyXG4gICAgaGVpZ2h0OiBfaGVpZ2h0LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY3NzOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIG5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5O1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBrZXksIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlkeCkgeyByZXR1cm4gcmV0OyB9IC8vIHJldHVybiBlYXJseVxyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0W3ZhbHVlXSA9IGdldFN0eWxlKGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBoaWRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIHNob3cpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKGlzQm9vbGVhbihzdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZSA/IHRoaXMuc2hvdygpIDogdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGlzSGlkZGVuKGVsZW0pID8gc2hvdyhlbGVtKSA6IGhpZGUoZWxlbSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwiLy8gVE9ETzogT25seSBwbGFjZSBiaSBsZXZlbCBjYWNoaW5nIGlzIHVzZWQgbm93Li4uZmlndXJlIG91dCBob3cgdG8gcmVtb3ZlXHJcbnZhciBjYWNoZSAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIsIHRydWUpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgQUNDRVNTT1IgID0gJ19fRF9pZF9fICcsXHJcbiAgICB1bmlxdWVJZCAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZChEYXRlLm5vdygpKSxcclxuXHJcbiAgICBnZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbSA/IGVsZW1bQUNDRVNTT1JdIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3JTZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IChpZCA9IGVsZW1bQUNDRVNTT1JdKSkgeyByZXR1cm4gaWQ7IH1cclxuICAgICAgICBlbGVtW0FDQ0VTU09SXSA9IChpZCA9IHVuaXF1ZUlkKCkpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFzRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmhhcyhpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gZ2V0T3JTZXRJZChlbGVtKTtcclxuICAgICAgICByZXR1cm4gY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlRGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICB9O1xyXG5cclxuLy8gVE9ETzogQWRkcmVzcyBBUElcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZW1vdmU6IChlbGVtLCBzdHIpID0+XHJcbiAgICAgICAgc3RyID09PSB1bmRlZmluZWQgPyByZW1vdmVBbGxEYXRhKGVsZW0pIDogcmVtb3ZlRGF0YShlbGVtLCBzdHIpLFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0RGF0YShlbGVtLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcGFzc2VkXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpc0VsZW1lbnQoZWxlbSkgPyBnZXRBbGxEYXRhKGVsZW0pIDogdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoYXNEYXRhOiAoZWxlbSkgPT5cclxuICAgICAgICAgICAgaXNFbGVtZW50KGVsZW0pID8gaGFzRGF0YShlbGVtKSA6IHRoaXMsXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZURhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVtpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGlzRWxlbWVudChlbGVtKSA/IHJlbW92ZUFsbERhdGEoZWxlbSkgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgdmFsdWVzIGZyb20gaGFzaCBtYXBcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBrZXkncyB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtSWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tlbGVtSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJJZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFycklkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbYXJySWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNOdW1iZXIgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGNzcyAgICAgID0gcmVxdWlyZSgnLi9jc3MnKTtcclxuXHJcbnZhciBhZGQgPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgdG90YWwgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICB0b3RhbCArPSAoYXJyW2lkeF0gfHwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdldElubmVyV2lkdGggPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChlbGVtKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0xlZnQnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1JpZ2h0JykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0SW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZWxlbSkpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRlcldpZHRoID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBnZXRJbm5lcldpZHRoKGVsZW0pLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIDogMCxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luUmlnaHQnKSkgOiAwLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckxlZnRXaWR0aCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJSaWdodFdpZHRoJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0T3V0ZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIGdldElubmVySGVpZ2h0KGVsZW0pLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Ub3AnKSkgOiAwLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Cb3R0b20nKSkgOiAwLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclRvcFdpZHRoJykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckJvdHRvbVdpZHRoJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHdpZHRoOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3Mud2lkdGguc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBoZWlnaHQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy5oZWlnaHQuc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJXaWR0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lcldpZHRoKGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJIZWlnaHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJIZWlnaHQoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlcldpZHRoOiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJXaWR0aChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJIZWlnaHQ6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlckhlaWdodChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGhhbmRsZXJzID0ge307XHJcblxyXG52YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lLCB0eXBlLCBmaWx0ZXIpIHtcclxuICAgIGhhbmRsZXJzW25hbWVdID0ge1xyXG4gICAgICAgIGV2ZW50OiB0eXBlLFxyXG4gICAgICAgIGZpbHRlcjogZmlsdGVyLFxyXG4gICAgICAgIHdyYXA6IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyKG5hbWUsIGZuKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHdyYXBwZXIgPSBmdW5jdGlvbihuYW1lLCBmbikge1xyXG4gICAgaWYgKCFmbikgeyByZXR1cm4gZm47IH1cclxuXHJcbiAgICB2YXIga2V5ID0gJ19fZGNlXycgKyBuYW1lO1xyXG4gICAgaWYgKGZuW2tleV0pIHsgcmV0dXJuIGZuW2tleV07IH1cclxuXHJcbiAgICByZXR1cm4gZm5ba2V5XSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBoYW5kbGVyc1tuYW1lXS5maWx0ZXIoZSk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxucmVnaXN0ZXIoJ2xlZnQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMSAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcignbWlkZGxlLWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDIgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ3JpZ2h0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDMgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxyXG4gICAgaGFuZGxlcnM6IGhhbmRsZXJzXHJcbn07IiwidmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpLFxyXG4gICAgZXhpc3RzICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBtYXRjaGVzICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIGRlbGVnYXRlcyA9IHt9O1xyXG5cclxuLy8gdGhpcyBtZXRob2QgY2FjaGVzIGRlbGVnYXRlcyBzbyB0aGF0IC5vZmYoKSB3b3JrcyBzZWFtbGVzc2x5XHJcbnZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHJvb3QsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKGRlbGVnYXRlc1tmbi5fZGRdKSB7IHJldHVybiBkZWxlZ2F0ZXNbZm4uX2RkXTsgfVxyXG5cclxuICAgIHZhciBpZCA9IGZuLl9kZCA9IERhdGUubm93KCk7XHJcbiAgICByZXR1cm4gZGVsZWdhdGVzW2lkXSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoZWwgJiYgZWwgIT09IHJvb3QpIHtcclxuICAgICAgICAgICAgaWYgKG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBldmVudGVkID0gZnVuY3Rpb24obWV0aG9kLCBlbCwgdHlwZSwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoIWV4aXN0cyhzZWxlY3RvcikpIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGZuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBkZWxlZ2F0ZShlbCwgc2VsZWN0b3IsIGZuKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuYWRkKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQucmVtb3ZlKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuZmFicmljYXRlKVxyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBkZWxlZ2F0ZSAgID0gcmVxdWlyZSgnLi9kZWxlZ2F0ZScpLFxyXG4gICAgY3VzdG9tICAgICA9IHJlcXVpcmUoJy4vY3VzdG9tJyk7XHJcblxyXG52YXIgZXZlbnRlciA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGVzLCBmaWx0ZXIsIGZuKSB7XHJcbiAgICAgICAgdmFyIHR5cGVsaXN0ID0gdHlwZXMuc3BsaXQoJyAnKTtcclxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XHJcbiAgICAgICAgICAgIGZuID0gZmlsdGVyO1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBfLmVhY2godHlwZWxpc3QsIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gY3VzdG9tLmhhbmRsZXJzW3R5cGVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgaGFuZGxlci5ldmVudCwgZmlsdGVyLCBoYW5kbGVyLndyYXAoZm4pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIHR5cGUsIGZpbHRlciwgZm4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vbiksXHJcbiAgICBvZmY6ICAgICBldmVudGVyKGRlbGVnYXRlLm9mZiksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVyKGRlbGVnYXRlLnRyaWdnZXIpXHJcbn07IiwidmFyIF8gICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzSHRtbCAgICAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTm9kZUxpc3QgICAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzTnVtYmVyICAgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBvcmRlciAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBkYXRhICAgICAgICAgICA9IHJlcXVpcmUoJy4vZGF0YScpLFxyXG4gICAgcGFyc2VyICAgICAgICAgPSByZXF1aXJlKCdwYXJzZXInKTtcclxuXHJcbnZhciBwYXJlbnRMb29wID0gZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihlbGVtcykge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gZWxlbXNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0gJiYgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGVsZW0sIHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciByZW1vdmUgPSBwYXJlbnRMb29wKGZ1bmN0aW9uKGVsZW0sIHBhcmVudCkge1xyXG4gICAgICAgIGRhdGEucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRldGFjaCA9IHBhcmVudExvb3AoZnVuY3Rpb24oZWxlbSwgcGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfSksXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnbWVudCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSAnJyArIHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHBhcnNlcihlbGVtKSwgcGVuZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgc3RyaW5nVG9GcmFnbWVudChyZXN1bHQpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0VsZW1lbnQocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkgPSBmdW5jdGlvbihhcnJPbmUsIGFyclR3bywgcGVuZGVyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyck9uZS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIGkgPSAwLCBsZW4gPSBhcnJUd28ubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoYXJyT25lW2lkeF0sIGFyclR3b1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5ID0gZnVuY3Rpb24oYXJyLCBlbGVtLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihhcnJFbGVtLCBlbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0gPSBmdW5jdGlvbihlbGVtLCBhcnIsIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGVsZW0sIGFyckVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgIH0sXHJcbiAgICBwcmVwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuaW5zZXJ0QmVmb3JlKGVsZW0sIGJhc2UuZmlyc3RDaGlsZCk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gXy5mYXN0bWFwKHRoaXMuc2xpY2UoKSwgKGVsZW0pID0+IGVsZW0uY2xvbmVOb2RlKHRydWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZ21lbnQodmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgaW5zZXJ0QmVmb3JlOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRhcmdldCwgZWxlbS5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0Lm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbnNlcnRBZnRlcjogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICBEKG9iaikuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnbWVudCh2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcHJlcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgRChkKS5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGVsZW1zID0gdGhpcyxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IGVsZW1zW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KCkuY29uY2F0KFxyXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nXHJcbiAgICAgICAgICAgICAgICBpc1N0cmluZyhzZWxlY3RvcikgPyBEKHNlbGVjdG9yKS5nZXQoKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAgICBpc0NvbGxlY3Rpb24oc2VsZWN0b3IpID8gXy50b0FycmF5KHNlbGVjdG9yKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikgfHwgaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IFtdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmVtb3ZlKHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gcmVtb3ZlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZXRhY2g6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBkZXRhY2goc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGV0YWNoKHRoaXMpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBET0NfRUxFTSAgID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxudmFyIGdldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHJlY3QgPSBpc0F0dGFjaGVkKGVsZW0pID8gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiAgKHJlY3QudG9wICArIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSAgfHwgMCxcclxuICAgICAgICBsZWZ0OiAocmVjdC5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IGdldE9mZnNldChlbGVtKSxcclxuICAgICAgICBjdXJDU1NUb3AgICAgICAgICA9IGVsZW0uc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gZWxlbS5zdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBlbGVtLnN0eWxlLnRvcCAgPSBfLnRvUHgocHJvcHMudG9wKTtcclxuICAgIGVsZW0uc3R5bGUubGVmdCA9IF8udG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXQ6IGZ1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB8fCBpc09iamVjdChwb3NPckl0ZXJhdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+IHNldE9mZnNldChlbGVtLCBpZHgsIHBvc09ySXRlcmF0b3IpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldFBhcmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8ubWFwKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBlbGVtLm9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghaXNOb2RlTmFtZShvZmZzZXRQYXJlbnQsICdodG1sJykgJiYgKG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJykgPT09ICdzdGF0aWMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgc3BsaXQgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgbm9kZVR5cGUgICA9IHJlcXVpcmUoJ25vZGVUeXBlJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBwcm9wRml4ID0gc3BsaXQoJ3RhYkluZGV4fHJlYWRPbmx5fGNsYXNzTmFtZXxtYXhMZW5ndGh8Y2VsbFNwYWNpbmd8Y2VsbFBhZGRpbmd8cm93U3Bhbnxjb2xTcGFufHVzZU1hcHxmcmFtZUJvcmRlcnxjb250ZW50RWRpdGFibGUnKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cikge1xyXG4gICAgICAgIG9ialtzdHIudG9Mb3dlckNhc2UoKV0gPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHtcclxuICAgICAgICAnZm9yJzogICAnaHRtbEZvcicsXHJcbiAgICAgICAgJ2NsYXNzJzogJ2NsYXNzTmFtZSdcclxuICAgIH0pO1xyXG5cclxudmFyIHByb3BIb29rcyA9IHtcclxuICAgIHNyYzogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhyZWY6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnaHJlZicsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3VwcG9ydDogU2FmYXJpLCBJRTkrXHJcbiAgICAvLyBtaXMtcmVwb3J0cyB0aGUgZGVmYXVsdCBzZWxlY3RlZCBwcm9wZXJ0eSBvZiBhbiBvcHRpb25cclxuICAgIC8vIEFjY2Vzc2luZyB0aGUgcGFyZW50J3Mgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBmaXhlcyBpdFxyXG4gICAgc2VsZWN0ZWQ6IFNVUFBPUlRTLm9wdFNlbGVjdGVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgICAgICBmaXg7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQuc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBhbHNvIHdvcmtzIHdpdGggb3B0Z3JvdXBzLCBzZWUgIzU3MDFcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5wYXJlbnROb2RlLnNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0YWJJbmRleDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBlbGVtLnRhYkluZGV4IGRvZXNuJ3QgYWx3YXlzIHJldHVybiB0aGUgY29ycmVjdCB2YWx1ZSB3aGVuIGl0IGhhc24ndCBiZWVuIGV4cGxpY2l0bHkgc2V0XHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9mbHVpZHByb2plY3Qub3JnL2Jsb2cvMjAwOC8wMS8wOS9nZXR0aW5nLXNldHRpbmctYW5kLXJlbW92aW5nLXRhYmluZGV4LXZhbHVlcy13aXRoLWphdmFzY3JpcHQvXHJcbiAgICAgICAgICAgIC8vIFVzZSBwcm9wZXIgYXR0cmlidXRlIHJldHJpZXZhbCgjMTIwNzIpXHJcbiAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhYmluZGV4KSB7IHJldHVybiBfLnBhcnNlSW50KHRhYmluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChSRUdFWC5pc0ZvY3VzYWJsZShub2RlTmFtZSkgfHwgKFJFR0VYLmlzQ2xpY2thYmxlKG5vZGVOYW1lKSAmJiBlbGVtLmhyZWYpKSA/IDAgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0T3JTZXRQcm9wID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIC8vIGRvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcclxuICAgIGlmICghZWxlbSB8fCBub2RlVHlwZS50ZXh0KGVsZW0pIHx8IG5vZGVUeXBlLmNvbW1lbnQoZWxlbSkgfHwgbm9kZVR5cGUuYXR0cihlbGVtKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3JTZXRQcm9wKGZpcnN0LCBwcm9wKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVQcm9wOiBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgZXhpc3RzICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBjb2VyY2VOdW0gPSAodmFsdWUpID0+XHJcbiAgICAvLyBJdHMgYSBudW1iZXIhIHx8IDAgdG8gYXZvaWQgTmFOIChhcyBOYU4ncyBhIG51bWJlcilcclxuICAgICt2YWx1ZSA9PT0gdmFsdWUgPyAodmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gQXZvaWQgTmFOIGFnYWluXHJcbiAgICBpc1N0cmluZyh2YWx1ZSkgPyAoK3ZhbHVlIHx8IDApIDpcclxuICAgIC8vIERlZmF1bHQgdG8gemVyb1xyXG4gICAgMDtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxMZWZ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbFRvcCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0cyA9IHRoaXMuZmluZCh0YXJnZXQpLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIGlzLm5vdCh0aGlzKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+ICFfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gIT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBEKCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY2hlY2tlciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+IGNoZWNrZXIuY2FsbChlbGVtLCBlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIG5vZGVUeXBlICAgICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0F0dGFjaGVkICAgICAgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc0QgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyICAgID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIGdldFNpYmxpbmdzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNpYnMgPSBfZ2V0Tm9kZVNpYmxpbmdzKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJzLmxlbmd0aCkgeyByZXN1bHQucHVzaChzaWJzKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXROb2RlU2libGluZ3MgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNpYnMgPSBfLnRvQXJyYXkocGFyZW50LmNoaWxkcmVuKSxcclxuICAgICAgICAgICAgaWR4ICA9IHNpYnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgLy8gRXhjbHVkZSB0aGUgbm9kZSBpdHNlbGYgZnJvbSB0aGUgbGlzdCBvZiBpdHMgcGFyZW50J3MgY2hpbGRyZW5cclxuICAgICAgICAgICAgaWYgKHNpYnNbaWR4XSA9PT0gbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgc2licy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNpYnM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENoaWxkcmVuIC0tLS0tLVxyXG4gICAgZ2V0Q2hpbGRyZW4gPSAoYXJyKSA9PiBfLmZsYXR0ZW4oXy5tYXAoYXJyLCBfY2hpbGRyZW4pKSxcclxuICAgIF9jaGlsZHJlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIga2lkcyA9IGVsZW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgIGlkeCAgPSAwLCBsZW4gID0ga2lkcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGFyciAgPSBuZXcgQXJyYXkobGVuKTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGtpZHNbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50cyAtLS0tLS1cclxuICAgIGdldENsb3Nlc3QgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICBjbG9zZXN0LFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGVsZW1zW2lkeF0sIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBwYXJlbnRzLnVuc2hpZnQoZWxlbXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGNsb3Nlc3QgPSBzZWxlY3RvckZpbHRlcihwYXJlbnRzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChjbG9zZXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2xvc2VzdFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRzVW50aWwgPSBmdW5jdGlvbihkLCBzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZFtpZHhdLCBudWxsLCBzdG9wU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfY3Jhd2xVcE5vZGUgPSBmdW5jdGlvbihub2RlLCBjb250ZXh0LCBzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IG5vZGU7XHJcblxyXG4gICAgICAgIHdoaWxlICgocGFyZW50ICAgPSBnZXROb2RlUGFyZW50KHBhcmVudCkpICAgICYmXHJcbiAgICAgICAgICAgICAgICFub2RlVHlwZS5kb2MocGFyZW50KSAgICAgICAgICAgICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKHBhcmVudCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudCAtLS0tLS1cclxuICAgIGdldFBhcmVudCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBnZXROb2RlUGFyZW50KGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHsgcmVzdWx0LnB1c2gocGFyZW50KTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTYWZlbHkgZ2V0IHBhcmVudCBub2RlXHJcbiAgICBnZXROb2RlUGFyZW50ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUucGFyZW50Tm9kZTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gVE9ETzogVGhpcyBjYW4gYmUgbW9yZSBnZW5lcmljXHJcbiAgICBnZXRQcmV2ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwcmV2ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykgJiYgIW5vZGVUeXBlLmVsZW0ocHJldikpIHt9XHJcbiAgICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5leHQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIG5leHQgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgobmV4dCA9IG5leHQubmV4dFNpYmxpbmcpICYmICFub2RlVHlwZS5lbGVtKG5leHQpKSB7fVxyXG4gICAgICAgIHJldHVybiBuZXh0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBUT0RPOiBUaGlzIGNhbiBiZSBtb3JlIGdlbmVyaWNcclxuICAgIGdldFByZXZBbGwgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwcmV2ICAgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSkge1xyXG4gICAgICAgICAgICBpZiAobm9kZVR5cGUuZWxlbShwcmV2KSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocHJldik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TmV4dEFsbCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIG5leHQgICA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVUeXBlLmVsZW0obmV4dCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5leHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5nO1xyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2libGluZyAmJiAoIXNlbGVjdG9yIHx8IEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZykpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbEFsbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBmaWx0ZXI7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBmdW5jdGlvbihzaWJsaW5nKSB7IHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpOyB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgc2libGluZ3MgPSBfLmZpbHRlcihzaWJsaW5ncywgZmlsdGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxVbnRpbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBpdGVyYXRvcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gZnVuY3Rpb24oc2libGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBpcy5tYXRjaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNNYXRjaDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goc2libGluZ3MsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHJldmVyc2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdW5pcXVlKGVsZW1zKTtcclxuICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEQocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KHNlbGVjdG9yRmlsdGVyKGVsZW1zLCBzZWxlY3RvciksIHJldmVyc2UpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBjb250ZW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgIF8ucGx1Y2sodGhpcywgJ2NoaWxkTm9kZXMnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIHJldHVybiBEKHNlbGVjdG9yKS5pbmRleE9mKGZpcnN0KTsgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3RvclswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFjayAgICAgICAgXHJcbiAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGZpcnN0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlzQXR0YWNoZWQgY2hlY2sgdG8gcGFzcyB0ZXN0IFwiTm9kZSB3aXRob3V0IHBhcmVudCByZXR1cm5zIC0xXCJcclxuICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IG5vZGVUeXBlLmRvY19mcmFnKHBhcmVudCk7XHJcblxyXG4gICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIG5vZGVUeXBlLmVsZW0pO1xyXG5cclxuICAgICAgICByZXR1cm4gW10uaW5kZXhPZi5jYWxsKGNoaWxkRWxlbXMsIGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgbmV3bGluZXMgICA9IHJlcXVpcmUoJ3N0cmluZy9uZXdsaW5lcycpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdub2RlL2lzTmFtZScpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtO1xyXG5cclxudmFyIG5vcm1hbE5vZGVOYW1lID0gKGVsZW0pID0+IGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSxcclxuXHJcbiAgICBvdXRlckh0bWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPyB0aGlzWzBdLm91dGVySFRNTCA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHRHZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0pID0+IGVsZW0udGV4dENvbnRlbnQgOlxyXG4gICAgICAgICAgICAoZWxlbSkgPT4gZWxlbS5pbm5lclRleHQsXHJcblxyXG4gICAgdGV4dFNldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLnRleHRDb250ZW50ID0gc3RyIDpcclxuICAgICAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS5pbm5lclRleHQgPSBzdHI7XHJcblxyXG52YXIgdmFsSG9va3MgPSB7XHJcbiAgICBvcHRpb246IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gKGV4aXN0cyh2YWwpID8gdmFsIDogdGV4dEdldChlbGVtKSkudHJpbSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGluZGV4ICAgPSBlbGVtLnNlbGVjdGVkSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBvbmUgICAgID0gZWxlbS50eXBlID09PSAnc2VsZWN0LW9uZScgfHwgaW5kZXggPCAwLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IG9uZSA/IG51bGwgOiBbXSxcclxuICAgICAgICAgICAgICAgIG1heCAgICAgPSBvbmUgPyBpbmRleCArIDEgOiBvcHRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBpbmRleCA8IDAgPyBtYXggOiAob25lID8gaW5kZXggOiAwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIHNlbGVjdGVkIG9wdGlvbnNcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IG1heDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvbGRJRSBkb2Vzbid0IHVwZGF0ZSBzZWxlY3RlZCBhZnRlciBmb3JtIHJlc2V0ICgjMjU1MSlcclxuICAgICAgICAgICAgICAgIGlmICgob3B0aW9uLnNlbGVjdGVkIHx8IGlkeCA9PT0gaW5kZXgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHJldHVybiBvcHRpb25zIHRoYXQgYXJlIGRpc2FibGVkIG9yIGluIGEgZGlzYWJsZWQgb3B0Z3JvdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKFNVUFBPUlRTLm9wdERpc2FibGVkID8gIW9wdGlvbi5kaXNhYmxlZCA6IG9wdGlvbi5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICghb3B0aW9uLnBhcmVudE5vZGUuZGlzYWJsZWQgfHwgIWlzTm9kZU5hbWUob3B0aW9uLnBhcmVudE5vZGUsICdvcHRncm91cCcpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHNwZWNpZmljIHZhbHVlIGZvciB0aGUgb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgYW4gYXJyYXkgZm9yIG9uZSBzZWxlY3RzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aS1TZWxlY3RzIHJldHVybiBhbiBhcnJheVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25TZXQsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gXy5tYWtlQXJyYXkodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IG9wdGlvbnMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWVzLCB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gb3B0aW9uU2V0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZvcmNlIGJyb3dzZXJzIHRvIGJlaGF2ZSBjb25zaXN0ZW50bHkgd2hlbiBub24tbWF0Y2hpbmcgdmFsdWUgaXMgc2V0XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uU2V0KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNlbGVjdGVkSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn07XHJcblxyXG4vLyBSYWRpbyBhbmQgY2hlY2tib3ggZ2V0dGVyIGZvciBXZWJraXRcclxuaWYgKCFTVVBQT1JUUy5jaGVja09uKSB7XHJcbiAgICBfLmVhY2goWydyYWRpbycsICdjaGVja2JveCddLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgdmFsSG9va3NbdHlwZV0gPSB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydDogV2Via2l0IC0gJycgaXMgcmV0dXJuZWQgaW5zdGVhZCBvZiAnb24nIGlmIGEgdmFsdWUgaXNuJ3Qgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwgPyAnb24nIDogZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIGdldFZhbCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOb2RlTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLmdldCkge1xyXG4gICAgICAgIHJldHVybiBob29rLmdldChlbGVtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc1N0cmluZyh2YWwpID8gbmV3bGluZXModmFsKSA6IHZhbDtcclxufTtcclxuXHJcbnZhciBzdHJpbmdpZnkgPSAodmFsdWUpID0+XHJcbiAgICAhZXhpc3RzKHZhbHVlKSA/ICcnIDogKHZhbHVlICsgJycpO1xyXG5cclxudmFyIHNldFZhbCA9IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gU3RyaW5naWZ5IHZhbHVlc1xyXG4gICAgdmFyIHZhbHVlID0gaXNBcnJheSh2YWwpID8gXy5tYXAodmFsLCBzdHJpbmdpZnkpIDogc3RyaW5naWZ5KHZhbCk7XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5vZGVOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suc2V0KSB7XHJcbiAgICAgICAgaG9vay5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb3V0ZXJIdG1sOiBvdXRlckh0bWwsXHJcbiAgICBvdXRlckhUTUw6IG91dGVySHRtbCxcclxuXHJcbiAgICBodG1sOiBmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGVsZW0uaW5uZXJIVE1MID0gaHRtbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihodG1sKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBodG1sO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgcmV0dXJuICghZmlyc3QpID8gdW5kZWZpbmVkIDogZmlyc3QuaW5uZXJIVE1MO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWw6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgLy8gZ2V0dGVyXHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRWYWwodGhpc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWV4aXN0cyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sICcnKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZ2V0VmFsKGVsZW0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZXRWYWwoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNldHRlcnNcclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc3RyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiB0ZXh0U2V0KGVsZW0sIHN0cikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc3RyKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzdHI7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRTZXQoZWxlbSwgaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIHRleHRHZXQoZWxlbSkpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMsIChlbGVtKSA9PiB0ZXh0R2V0KGVsZW0pKS5qb2luKCcnKTtcclxuICAgIH1cclxufTsiLCJ2YXIgaXMgPSBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4gKGVsZW0pID0+IGVsZW0gJiYgZWxlbS5ub2RlVHlwZSA9PT0geDtcclxufTtcclxuXHJcbi8vIGNvbW1lbnRlZC1vdXQgbWV0aG9kcyBhcmUgbm90IGJlaW5nIHVzZWRcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBlbGVtOiBpcygxKSxcclxuICAgIGF0dHI6IGlzKDIpLFxyXG4gICAgdGV4dDogaXMoMyksXHJcbiAgICAvLyBjZGF0YTogaXMoNCksXHJcbiAgICAvLyBlbnRpdHlfcmVmZXJlbmNlOiBpcyg1KSxcclxuICAgIC8vIGVudGl0eTogaXMoNiksXHJcbiAgICAvLyBwcm9jZXNzaW5nX2luc3RydWN0aW9uOiBpcyg3KSxcclxuICAgIGNvbW1lbnQ6IGlzKDgpLFxyXG4gICAgZG9jOiBpcyg5KSxcclxuICAgIC8vIGRvY3VtZW50X3R5cGU6IGlzKDEwKSxcclxuICAgIGRvY19mcmFnOiBpcygxMSlcclxuICAgIC8vIG5vdGF0aW9uOiBpcygxMiksXHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAoZWxlbSwgbmFtZSkgPT5cclxuICAgIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpOyIsInZhciByZWFkeSA9IGZhbHNlLFxyXG4gICAgcmVnaXN0cmF0aW9uID0gW107XHJcblxyXG52YXIgd2FpdCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbndhaXQoZnVuY3Rpb24oKSB7XHJcbiAgICByZWFkeSA9IHRydWU7XHJcblxyXG4gICAgLy8gY2FsbCByZWdpc3RlcmVkIG1ldGhvZHMgICAgXHJcbiAgICB3aGlsZSAocmVnaXN0cmF0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbi5zaGlmdCgpKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoY2FsbGJhY2spID0+XHJcbiAgICByZWFkeSA/IGNhbGxiYWNrKCkgOiByZWdpc3RyYXRpb24ucHVzaChjYWxsYmFjayk7XHJcbiIsInZhciBpc0F0dGFjaGVkICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2NvbXBhcmluZy1kb2N1bWVudC1wb3NpdGlvbi9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICBDT05UQUlORURfQlkgPSAxNixcclxuICAgIEZPTExPV0lORyAgICA9IDQsXHJcbiAgICBESVNDT05ORUNURUQgPSAxO1xyXG5cclxuICAgIC8vIENvbXBhcmUgUG9zaXRpb24gLSBNSVQgTGljZW5zZWQsIEpvaG4gUmVzaWdcclxudmFyIGNvbXBhcmVQb3NpdGlvbiA9IChub2RlMSwgbm9kZTIpID0+XHJcbiAgICAgICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gP1xyXG4gICAgICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5vZGUyKSA6XHJcbiAgICAgICAgMCxcclxuICAgIFxyXG4gICAgaXMgPSAocmVsLCBmbGFnKSA9PiAocmVsICYgZmxhZykgPT09IGZsYWcsXHJcblxyXG4gICAgaXNOb2RlID0gKGIsIGZsYWcsIGEpID0+IGlzKGNvbXBhcmVQb3NpdGlvbihhLCBiKSwgZmxhZyksXHJcblxyXG4gICAgaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcblxyXG52YXIgc29ydCA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xyXG4gICAgLy8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcclxuICAgIGlmIChub2RlMSA9PT0gbm9kZTIpIHtcclxuICAgICAgICBoYXNEdXBsaWNhdGUgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNvcnQgb24gbWV0aG9kIGV4aXN0ZW5jZSBpZiBvbmx5IG9uZSBpbnB1dCBoYXMgY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgIHZhciByZWwgPSAhbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gLSAhbm9kZTIuY29tcGFyZURvY3VtZW50UG9zaXRpb247XHJcbiAgICBpZiAocmVsKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgaWYgKChub2RlMS5vd25lckRvY3VtZW50IHx8IG5vZGUxKSA9PT0gKG5vZGUyLm93bmVyRG9jdW1lbnQgfHwgbm9kZTIpKSB7XHJcbiAgICAgICAgcmVsID0gY29tcGFyZVBvc2l0aW9uKG5vZGUxLCBub2RlMik7XHJcbiAgICB9XHJcbiAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJlbCA9IERJU0NPTk5FQ1RFRDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3QgZGlyZWN0bHkgY29tcGFyYWJsZVxyXG4gICAgaWYgKCFyZWwpIHtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEaXNjb25uZWN0ZWQgbm9kZXNcclxuICAgIGlmIChpcyhyZWwsIERJU0NPTk5FQ1RFRCkpIHtcclxuICAgICAgICB2YXIgaXNOb2RlMURpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUxKTtcclxuICAgICAgICB2YXIgaXNOb2RlMkRpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUyKTtcclxuXHJcbiAgICAgICAgaWYgKGlzTm9kZTFEaXNjb25uZWN0ZWQgJiYgaXNOb2RlMkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpc05vZGUyRGlzY29ubmVjdGVkID8gLTEgOiAxO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpcyhyZWwsIEZPTExPV0lORykgPyAtMSA6IDE7XHJcbn07XHJcblxyXG4vKipcclxuICogU29ydHMgYW4gYXJyYXkgb2YgRCBlbGVtZW50cyBpbi1wbGFjZSAoaS5lLiwgbXV0YXRlcyB0aGUgb3JpZ2luYWwgYXJyYXkpXHJcbiAqIGluIGRvY3VtZW50IG9yZGVyIGFuZCByZXR1cm5zIHdoZXRoZXIgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7RWxlbWVudFtdfSBhcnJheSAgICAgICAgICBBcnJheSBvZiBEIGVsZW1lbnRzLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59ICBbcmV2ZXJzZT1mYWxzZV0gSWYgYSB0cnV0aHkgdmFsdWUgaXMgcGFzc2VkLCB0aGUgZ2l2ZW4gYXJyYXkgd2lsbCBiZSByZXZlcnNlZC5cclxuICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gKiBAc2VlIGpRdWVyeSBzcmMvc2VsZWN0b3ItbmF0aXZlLmpzOjM3XHJcbiAqL1xyXG5leHBvcnRzLnNvcnQgPSBmdW5jdGlvbihhcnJheSwgcmV2ZXJzZSkge1xyXG4gICAgaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcbiAgICBhcnJheS5zb3J0KHNvcnQpO1xyXG4gICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICBhcnJheS5yZXZlcnNlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaGFzRHVwbGljYXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERldGVybWluZXMgd2hldGhlciBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYC5cclxuICogQHBhcmFtIHtFbGVtZW50fSBhIEQgZWxlbWVudCBub2RlXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gYiBEIGVsZW1lbnQgbm9kZVxyXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYDsgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gKi9cclxuZXhwb3J0cy5jb250YWlucyA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgIHZhciBiVXAgPSBpc0F0dGFjaGVkKGIpID8gYi5wYXJlbnROb2RlIDogbnVsbDtcclxuXHJcbiAgICBpZiAoYSA9PT0gYlVwKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChiVXApKSB7XHJcbiAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzIChJRTkrKVxyXG4gICAgICAgIGlmIChhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc05vZGUoYlVwLCBDT05UQUlORURfQlksIGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcbiIsInZhciBSRUdFWCA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBNQVhfU0lOR0xFX1RBR19MRU5HVEggPSAzMCxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKTtcclxuXHJcbnZhciBwYXJzZVN0cmluZyA9IGZ1bmN0aW9uKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpIHtcclxuICAgIHZhciBwYXJlbnQgPSBjcmVhdGUocGFyZW50VGFnTmFtZSk7XHJcbiAgICBwYXJlbnQuaW5uZXJIVE1MID0gaHRtbFN0cjtcclxuICAgIHJldHVybiBwYXJlbnQ7XHJcbn07XHJcblxyXG52YXIgcGFyc2VTaW5nbGVUYWcgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICBpZiAoaHRtbFN0ci5sZW5ndGggPiBNQVhfU0lOR0xFX1RBR19MRU5HVEgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgc2luZ2xlVGFnTWF0Y2ggPSBSRUdFWC5zaW5nbGVUYWdNYXRjaChodG1sU3RyKTtcclxuICAgIHJldHVybiBzaW5nbGVUYWdNYXRjaCA/IFtjcmVhdGUoc2luZ2xlVGFnTWF0Y2hbMV0pXSA6IG51bGw7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIHZhciBzaW5nbGVUYWcgPSBwYXJzZVNpbmdsZVRhZyhodG1sU3RyKTtcclxuICAgIGlmIChzaW5nbGVUYWcpIHsgcmV0dXJuIHNpbmdsZVRhZzsgfVxyXG5cclxuICAgIHZhciBwYXJlbnRUYWdOYW1lID0gUkVHRVguZ2V0UGFyZW50VGFnTmFtZShodG1sU3RyKSxcclxuICAgICAgICBwYXJlbnQgICAgICAgID0gcGFyc2VTdHJpbmcocGFyZW50VGFnTmFtZSwgaHRtbFN0cik7XHJcblxyXG4gICAgdmFyIGNoaWxkLFxyXG4gICAgICAgIGlkeCA9IHBhcmVudC5jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgYXJyID0gbmV3IEFycmF5KGlkeCk7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jaGlsZHJlbltpZHhdO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgYXJyW2lkeF0gPSBjaGlsZDtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHBhcnNlciAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIEZpenpsZSAgICAgPSByZXF1aXJlKCdGaXp6bGUnKSxcclxuICAgIGRhdGEgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKTtcclxuXHJcbnZhciBwYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gcGFyc2VyKHN0cik7XHJcbiAgICByZXR1cm4gcmVzdWx0ICYmIHJlc3VsdC5sZW5ndGggPyBEKHJlc3VsdCkgOiBudWxsO1xyXG59O1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIGRhdGEuRCxcclxue1xyXG4gICAgLy8gQmVjYXVzZSBubyBvbmUga25vdyB3aGF0IHRoZSBjYXNlIHNob3VsZCBiZVxyXG4gICAgcGFyc2VIdG1sOiBwYXJzZUh0bWwsXHJcbiAgICBwYXJzZUhUTUw6IHBhcnNlSHRtbCxcclxuXHJcbiAgICBGaXp6bGU6ICBGaXp6bGUsXHJcbiAgICBlYWNoOiAgICBfLmpxRWFjaCxcclxuICAgIGZvckVhY2g6IF8uZEVhY2gsXHJcblxyXG4gICAgbWFwOiAgICAgXy5tYXAsXHJcbiAgICBleHRlbmQ6ICBfLmV4dGVuZCxcclxuXHJcbiAgICBtb3JlQ29uZmxpY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdpbmRvdy5qUXVlcnkgPSB3aW5kb3cuWmVwdG8gPSB3aW5kb3cuJCA9IEQ7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICA9IHJlcXVpcmUoJy4vRCcpLFxyXG4gICAgc3BsaXQgICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBhcnJheSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXJyYXknKSxcclxuICAgIHNlbGVjdG9ycyAgID0gcmVxdWlyZSgnbW9kdWxlcy9zZWxlY3RvcnMnKSxcclxuICAgIHRyYW5zdmVyc2FsID0gcmVxdWlyZSgnbW9kdWxlcy90cmFuc3ZlcnNhbCcpLFxyXG4gICAgZGltZW5zaW9ucyAgPSByZXF1aXJlKCdtb2R1bGVzL2RpbWVuc2lvbnMnKSxcclxuICAgIG1hbmlwICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9tYW5pcCcpLFxyXG4gICAgY3NzICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2NzcycpLFxyXG4gICAgYXR0ciAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2F0dHInKSxcclxuICAgIHByb3AgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9wcm9wJyksXHJcbiAgICB2YWwgICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvdmFsJyksXHJcbiAgICBwb3NpdGlvbiAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcG9zaXRpb24nKSxcclxuICAgIGNsYXNzZXMgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jbGFzc2VzJyksXHJcbiAgICBzY3JvbGwgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2Nyb2xsJyksXHJcbiAgICBkYXRhICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpLFxyXG4gICAgZXZlbnRzICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2V2ZW50cycpO1xyXG5cclxudmFyIGFycmF5UHJvdG8gPSBzcGxpdCgnbGVuZ3RofHRvU3RyaW5nfHRvTG9jYWxlU3RyaW5nfGpvaW58cG9wfHB1c2h8Y29uY2F0fHJldmVyc2V8c2hpZnR8dW5zaGlmdHxzbGljZXxzcGxpY2V8c29ydHxzb21lfGV2ZXJ5fGluZGV4T2Z8bGFzdEluZGV4T2Z8cmVkdWNlfHJlZHVjZVJpZ2h0fG1hcHxmaWx0ZXInKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIGtleSkge1xyXG4gICAgICAgIG9ialtrZXldID0gQXJyYXkucHJvdG90eXBlW2tleV07XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHt9KTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgcHJvdG90eXBlIHNvIHRoYXRcclxuLy8gaXQgY2FuIGJlIGhvb2tlZCBpbnRvIGZvciBwbHVnaW5zXHJcbkQuZm4gPSBELnByb3RvdHlwZTtcclxuXHJcbl8uZXh0ZW5kKFxyXG4gICAgRC5mbixcclxuICAgIHsgY29uc3RydWN0b3I6IEQsIH0sXHJcbiAgICBhcnJheVByb3RvLFxyXG4gICAgYXJyYXkuZm4sXHJcbiAgICBzZWxlY3RvcnMuZm4sXHJcbiAgICB0cmFuc3ZlcnNhbC5mbixcclxuICAgIG1hbmlwLmZuLFxyXG4gICAgZGltZW5zaW9ucy5mbixcclxuICAgIGNzcy5mbixcclxuICAgIGF0dHIuZm4sXHJcbiAgICBwcm9wLmZuLFxyXG4gICAgdmFsLmZuLFxyXG4gICAgY2xhc3Nlcy5mbixcclxuICAgIHBvc2l0aW9uLmZuLFxyXG4gICAgc2Nyb2xsLmZuLFxyXG4gICAgZGF0YS5mbixcclxuICAgIGV2ZW50cy5mblxyXG4pO1xyXG4iLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBzdGFydCwgZW5kKSB7XHJcbiAgICAvLyBFeGl0IGVhcmx5IGZvciBlbXB0eSBhcnJheVxyXG4gICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgLy8gRW5kLCBuYXR1cmFsbHksIGhhcyB0byBiZSBoaWdoZXIgdGhhbiAwIHRvIG1hdHRlcixcclxuICAgIC8vIHNvIGEgc2ltcGxlIGV4aXN0ZW5jZSBjaGVjayB3aWxsIGRvXHJcbiAgICBpZiAoZW5kKSB7IHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQsIGVuZCk7IH1cclxuXHJcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0IHx8IDApO1xyXG59OyIsIi8vIEJyZWFrcyBldmVuIG9uIGFycmF5cyB3aXRoIDMgaXRlbXMuIDMgb3IgbW9yZVxyXG4vLyBpdGVtcyBzdGFydHMgc2F2aW5nIHNwYWNlXHJcbm1vZHVsZS5leHBvcnRzID0gKHN0ciwgZGVsaW1pdGVyKSA9PiBzdHIuc3BsaXQoZGVsaW1pdGVyIHx8ICd8Jyk7XHJcbiIsInZhciBpZCA9IDA7XHJcbnZhciB1bmlxdWVJZCA9IG1vZHVsZS5leHBvcnRzID0gKCkgPT4gaWQrKztcclxudW5pcXVlSWQuc2VlZCA9IGZ1bmN0aW9uKHNlZWRlZCwgcHJlKSB7XHJcbiAgICB2YXIgcHJlZml4ID0gcHJlIHx8ICcnLFxyXG4gICAgICAgIHNlZWQgPSBzZWVkZWQgfHwgMDtcclxuICAgIHJldHVybiAoKSA9PiBwcmVmaXggKyBzZWVkKys7XHJcbn07Il19
