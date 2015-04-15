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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvcHJveHkuanNvbiIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ub2RlTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvbnVtYmVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9vYmplY3QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9zdHJpbmcuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3dpbmRvdy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbWF0Y2hlc1NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L21hcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZVR5cGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zbGljZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9zcGxpdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztBQ0ZuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDbEMsUUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUM7QUFDdkIsV0FBTztlQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUU7S0FBQSxDQUFDO0NBQ2hDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL0QnKTtcclxucmVxdWlyZSgnLi9wcm9wcycpO1xyXG5yZXF1aXJlKCcuL3Byb3RvJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9jID0gZG9jdW1lbnQ7XG52YXIgYWRkRXZlbnQgPSBhZGRFdmVudEVhc3k7XG52YXIgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEVhc3k7XG52YXIgaGFyZENhY2hlID0gW107XG5cbmlmICghZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgYWRkRXZlbnQgPSBhZGRFdmVudEhhcmQ7XG4gIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRIYXJkO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgdW53cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUpIHtcbiAgdmFyIGU7XG4gIGlmIChkb2MuY3JlYXRlRXZlbnQpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIGVsLmRpc3BhdGNoRXZlbnQoZSk7XG4gIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCAgPSBlLnByZXZlbnREZWZhdWx0ICB8fCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdCAoKSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IGUuc3RvcFByb3BhZ2F0aW9uIHx8IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbiAoKSB7IGUuY2FuY2VsQnViYmxlID0gdHJ1ZTsgfTtcbiAgICBmbi5jYWxsKGVsLCBlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gd3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciB3cmFwcGVyID0gdW53cmFwKGVsLCB0eXBlLCBmbikgfHwgd3JhcHBlckZhY3RvcnkoZWwsIHR5cGUsIGZuKTtcbiAgaGFyZENhY2hlLnB1c2goe1xuICAgIHdyYXBwZXI6IHdyYXBwZXIsXG4gICAgZWxlbWVudDogZWwsXG4gICAgdHlwZTogdHlwZSxcbiAgICBmbjogZm5cbiAgfSk7XG4gIHJldHVybiB3cmFwcGVyO1xufVxuXG5mdW5jdGlvbiB1bndyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSA9IGZpbmQoZWwsIHR5cGUsIGZuKTtcbiAgaWYgKGkpIHtcbiAgICB2YXIgd3JhcHBlciA9IGhhcmRDYWNoZVtpXS53cmFwcGVyO1xuICAgIGhhcmRDYWNoZS5zcGxpY2UoaSwgMSk7IC8vIGZyZWUgdXAgYSB0YWQgb2YgbWVtb3J5XG4gICAgcmV0dXJuIHdyYXBwZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpLCBpdGVtO1xuICBmb3IgKGkgPSAwOyBpIDwgaGFyZENhY2hlLmxlbmd0aDsgaSsrKSB7XG4gICAgaXRlbSA9IGhhcmRDYWNoZVtpXTtcbiAgICBpZiAoaXRlbS5lbGVtZW50ID09PSBlbCAmJiBpdGVtLnR5cGUgPT09IHR5cGUgJiYgaXRlbS5mbiA9PT0gZm4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGRFdmVudCxcbiAgcmVtb3ZlOiByZW1vdmVFdmVudCxcbiAgZmFicmljYXRlOiBmYWJyaWNhdGVFdmVudFxufTtcbiIsInZhciBfICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnaXMvYXJyYXlMaWtlJyksXHJcbiAgICBpc0h0bWwgICAgICA9IHJlcXVpcmUoJ2lzL2h0bWwnKSxcclxuICAgIGlzU3RyaW5nICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0Z1bmN0aW9uICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0QgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIHBhcnNlciAgICAgID0gcmVxdWlyZSgncGFyc2VyJyksXHJcbiAgICBvbnJlYWR5ICAgICA9IHJlcXVpcmUoJ29ucmVhZHknKSxcclxuICAgIEZpenpsZSAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgQXBpID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIHJldHVybiBuZXcgRChzZWxlY3RvciwgYXR0cnMpO1xyXG59O1xyXG5cclxuaXNELnNldChBcGkpO1xyXG5cclxuZnVuY3Rpb24gRChzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIC8vIG5vdGhpblxyXG4gICAgaWYgKCFzZWxlY3RvcikgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgIC8vIGVsZW1lbnQgb3Igd2luZG93IChkb2N1bWVudHMgaGF2ZSBhIG5vZGVUeXBlKVxyXG4gICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlIHx8IHNlbGVjdG9yID09PSB3aW5kb3cpIHtcclxuICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XHJcbiAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhUTUwgc3RyaW5nXHJcbiAgICBpZiAoaXNIdG1sKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgcGFyc2VyKHNlbGVjdG9yKSk7XHJcbiAgICAgICAgaWYgKGF0dHJzKSB7IHRoaXMuYXR0cihhdHRycyk7IH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3RyaW5nXHJcbiAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gU2VsZWN0b3I6IHBlcmZvcm0gYSBmaW5kIHdpdGhvdXQgY3JlYXRpbmcgYSBuZXcgRFxyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgRml6emxlLnF1ZXJ5KHNlbGVjdG9yKS5leGVjKHRoaXMsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBkb2N1bWVudCByZWFkeVxyXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgb25yZWFkeShzZWxlY3Rvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgb2YgRWxlbWVudHMsIE5vZGVMaXN0LCBvciBEIG9iamVjdFxyXG4gICAgaWYgKGlzQXJyYXlMaWtlKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbkQucHJvdG90eXBlID0gQXBpLnByb3RvdHlwZTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh0YWcpID0+IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTsiLCJ2YXIgZGl2ID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2NyZWF0ZScpKCdkaXYnKTtcclxuXHJcbmRpdi5pbm5lckhUTUwgPSAnPGEgaHJlZj1cIi9hXCI+YTwvYT4nOyIsInZhciBfID0gcmVxdWlyZSgnXycpO1xyXG5cclxudmFyIElzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvcnMpIHtcclxuICAgIHRoaXMuX3NlbGVjdG9ycyA9IHNlbGVjdG9ycztcclxufTtcclxuSXMucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gdGhpcy5fc2VsZWN0b3JzLFxyXG4gICAgICAgICAgICBpZHggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yc1tpZHhdLm1hdGNoKGNvbnRleHQpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uYW55KGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgIHRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICAhdGhpcy5tYXRjaChlbGVtKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJ2YXIgZmluZCA9IGZ1bmN0aW9uKHNlbGVjdG9ycywgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoc2VsZWN0b3JzW2lkeF0uZXhlYyhjb250ZXh0KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIFF1ZXJ5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvcnMpIHtcclxuICAgIHRoaXMuX3NlbGVjdG9ycyA9IHNlbGVjdG9ycztcclxufTtcclxuXHJcblF1ZXJ5LnByb3RvdHlwZSA9IHtcclxuICAgIGV4ZWM6IGZ1bmN0aW9uKGFyciwgaXNOZXcpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IGlzTmV3ID8gMSA6IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChmaW5kKHRoaXMuX3NlbGVjdG9ycywgYXJyW2lkeF0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIG1hdGNoZXMgICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIHVuaXF1ZUlkICAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZCgwLCAnX0QnICsgRGF0ZS5ub3coKSksXHJcblxyXG4gICAgR0VUX0VMRU1FTlRfQllfSUQgICAgICAgICAgPSAnZ2V0RWxlbWVudEJ5SWQnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FICAgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUUgPSAnZ2V0RWxlbWVudHNCeUNsYXNzTmFtZScsXHJcbiAgICBRVUVSWV9TRUxFQ1RPUl9BTEwgICAgICAgICA9ICdxdWVyeVNlbGVjdG9yQWxsJztcclxuXHJcbnZhciBkZXRlcm1pbmVNZXRob2QgPSAoc2VsZWN0b3IpID0+XHJcbiAgICAgICAgUkVHRVguaXNTdHJpY3RJZChzZWxlY3RvcikgPyBHRVRfRUxFTUVOVF9CWV9JRCA6XHJcbiAgICAgICAgUkVHRVguaXNDbGFzcyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA6XHJcbiAgICAgICAgUkVHRVguaXNUYWcoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FIDogICAgICAgXHJcbiAgICAgICAgUVVFUllfU0VMRUNUT1JfQUxMLFxyXG5cclxuICAgIHByb2Nlc3NRdWVyeVNlbGVjdGlvbiA9IChzZWxlY3Rpb24pID0+XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uIG9yIGEgTm9kZWxpc3Qgd2l0aG91dCBhIGxlbmd0aFxyXG4gICAgICAgIC8vIHNob3VsZCByZXN1bHQgaW4gbm90aGluZ1xyXG4gICAgICAgICFzZWxlY3Rpb24gfHwgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkgPyBbXSA6XHJcbiAgICAgICAgLy8gSWYgaXQncyBhbiBpZCBzZWxlY3Rpb24sIHJldHVybiBpdCBhcyBhbiBhcnJheVxyXG4gICAgICAgIGlzRWxlbWVudChzZWxlY3Rpb24pIHx8ICFzZWxlY3Rpb24ubGVuZ3RoID8gW3NlbGVjdGlvbl0gOiBcclxuICAgICAgICAvLyBlbnN1cmUgaXQncyBhbiBhcnJheSBhbmQgbm90IGFuIEhUTUxDb2xsZWN0aW9uXHJcbiAgICAgICAgXy50b0FycmF5KHNlbGVjdGlvbiksXHJcblxyXG4gICAgY2hpbGRPclNpYmxpbmdRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIF90aGlzKSB7XHJcbiAgICAgICAgLy8gQ2hpbGQgc2VsZWN0IC0gbmVlZHMgc3BlY2lhbCBoZWxwIHNvIHRoYXQgXCI+IGRpdlwiIGRvZXNuJ3QgYnJlYWtcclxuICAgICAgICB2YXIgbWV0aG9kICAgID0gX3RoaXMubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciAgPSBfdGhpcy5zZWxlY3RvcixcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgIG5ld0lkLFxyXG4gICAgICAgICAgICBpZDtcclxuXHJcbiAgICAgICAgaWQgPSBjb250ZXh0LmlkO1xyXG4gICAgICAgIGlmIChpZCA9PT0gJycgfHwgIWV4aXN0cyhpZCkpIHtcclxuICAgICAgICAgICAgbmV3SWQgPSB1bmlxdWVJZCgpO1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gbmV3SWQ7XHJcbiAgICAgICAgICAgIGlkQXBwbGllZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShcclxuICAgICAgICAgICAgLy8gdGFpbG9yIHRoZSBjaGlsZCBzZWxlY3RvclxyXG4gICAgICAgICAgICBgIyR7aWRBcHBsaWVkID8gbmV3SWQgOiBpZH0gJHtzZWxlY3Rvcn1gXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKGlkQXBwbGllZCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsYXNzUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBfdGhpcykge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IF90aGlzLm1ldGhvZCxcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBfdGhpcy5zZWxlY3RvcixcclxuICAgICAgICAgICAgLy8gQ2xhc3Mgc2VhcmNoLCBkb24ndCBzdGFydCB3aXRoICcuJ1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IF90aGlzLnNlbGVjdG9yLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgaWRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIF90aGlzKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gX3RoaXMubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IF90aGlzLnNlbGVjdG9yLnN1YnN0cigxKSxcclxuICAgICAgICAgICAgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVmYXVsdFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgX3RoaXMpIHtcclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFtfdGhpcy5tZXRob2RdKF90aGlzLnNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGVybWluZVF1ZXJ5ID0gKF90aGlzKSA9PlxyXG4gICAgICAgIF90aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBjaGlsZE9yU2libGluZ1F1ZXJ5IDpcclxuICAgICAgICBfdGhpcy5pc0NsYXNzU2VhcmNoID8gY2xhc3NRdWVyeSA6XHJcbiAgICAgICAgX3RoaXMuaXNJZFNlYXJjaCA/IGlkUXVlcnkgOlxyXG4gICAgICAgIGRlZmF1bHRRdWVyeTtcclxuXHJcbnZhciBTZWxlY3RvciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgc2VsZWN0b3IgICAgICAgICAgICAgICAgPSBzdHIudHJpbSgpLFxyXG4gICAgICAgIGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgID0gc2VsZWN0b3JbMF0gPT09ICc+JyB8fCBzZWxlY3RvclswXSA9PT0gJysnLFxyXG4gICAgICAgIG1ldGhvZCAgICAgICAgICAgICAgICAgID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IFFVRVJZX1NFTEVDVE9SX0FMTCA6IGRldGVybWluZU1ldGhvZChzZWxlY3Rvcik7XHJcblxyXG4gICAgdGhpcy5zdHIgICAgICAgICAgICAgICAgICAgID0gc3RyO1xyXG4gICAgdGhpcy5zZWxlY3RvciAgICAgICAgICAgICAgID0gc2VsZWN0b3I7XHJcbiAgICB0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0O1xyXG4gICAgdGhpcy5pc0lkU2VhcmNoICAgICAgICAgICAgID0gbWV0aG9kID09PSBHRVRfRUxFTUVOVF9CWV9JRDtcclxuICAgIHRoaXMuaXNDbGFzc1NlYXJjaCAgICAgICAgICA9ICF0aGlzLmlzSWRTZWFyY2ggJiYgbWV0aG9kID09PSBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRTtcclxuICAgIHRoaXMubWV0aG9kICAgICAgICAgICAgICAgICA9IG1ldGhvZDtcclxufTtcclxuXHJcblNlbGVjdG9yLnByb3RvdHlwZSA9IHtcclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgLy8gTm8gbmVlZWQgdG8gY2hlY2ssIGEgbWF0Y2ggd2lsbCBmYWlsIGlmIGl0J3NcclxuICAgICAgICAvLyBjaGlsZCBvciBzaWJsaW5nXHJcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBtYXRjaGVzKGNvbnRleHQsIHRoaXMuc2VsZWN0b3IpIDogZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4ZWM6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgcXVlcnkgPSBkZXRlcm1pbmVRdWVyeSh0aGlzKTtcclxuXHJcbiAgICAgICAgLy8gdGhlc2UgYXJlIHRoZSB0eXBlcyB3ZSdyZSBleHBlY3RpbmcgdG8gZmFsbCB0aHJvdWdoXHJcbiAgICAgICAgLy8gaXNFbGVtZW50KGNvbnRleHQpIHx8IGlzTm9kZUxpc3QoY29udGV4dCkgfHwgaXNDb2xsZWN0aW9uKGNvbnRleHQpXHJcbiAgICAgICAgLy8gaWYgbm8gY29udGV4dCBpcyBnaXZlbiwgdXNlIGRvY3VtZW50XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5KGNvbnRleHQgfHwgZG9jdW1lbnQsIHRoaXMpO1xyXG4gICAgfVxyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnLi4vXycpLFxyXG4gICAgcXVlcnlDYWNoZSA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIGlzQ2FjaGUgICAgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBTZWxlY3RvciAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL1NlbGVjdG9yJyksXHJcbiAgICBRdWVyeSAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL1F1ZXJ5JyksXHJcbiAgICBJcyAgICAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL0lzJyksXHJcbiAgICBwYXJzZSAgICAgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1wYXJzZScpLFxyXG4gICAgbm9ybWFsaXplICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplJyk7XHJcblxyXG52YXIgdG9TZWxlY3RvcnMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIC8vIFNlbGVjdG9ycyB3aWxsIHJldHVybiBudWxsIGlmIHRoZSBxdWVyeSB3YXMgaW52YWxpZC5cclxuICAgIC8vIE5vdCByZXR1cm5pbmcgZWFybHkgb3IgZG9pbmcgZXh0cmEgY2hlY2tzIGFzIHRoaXMgd2lsbFxyXG4gICAgLy8gbm9vcCBvbiB0aGUgUXVlcnkgYW5kIElzIGxldmVsIGFuZCBpcyB0aGUgZXhjZXB0aW9uXHJcbiAgICAvLyBpbnN0ZWFkIG9mIHRoZSBydWxlXHJcbiAgICB2YXIgc2VsZWN0b3JzID0gcGFyc2Uuc3VicXVlcmllcyhzdHIpIHx8IFtdO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBlYWNoIG9mIHRoZSBzZWxlY3RvcnMuLi5cclxuICAgIHNlbGVjdG9ycyA9IF8ubWFwKHNlbGVjdG9ycywgbm9ybWFsaXplKTtcclxuXHJcbiAgICAvLyAuLi5hbmQgbWFwIHRoZW0gdG8gU2VsZWN0b3Igb2JqZWN0c1xyXG4gICAgcmV0dXJuIF8uZmFzdG1hcChzZWxlY3RvcnMsIChzZWxlY3RvcikgPT4gbmV3IFNlbGVjdG9yKHNlbGVjdG9yKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbGVjdG9yOiB0b1NlbGVjdG9ycyxcclxuICAgIHBhcnNlOiBwYXJzZSxcclxuICAgIFxyXG4gICAgcXVlcnk6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBxdWVyeUNhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5wdXQoc3RyLCAoKSA9PiBuZXcgUXVlcnkodG9TZWxlY3RvcnMoc3RyKSkpO1xyXG4gICAgfSxcclxuICAgIGlzOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gaXNDYWNoZS5oYXMoc3RyKSA/IFxyXG4gICAgICAgICAgICBpc0NhY2hlLmdldChzdHIpIDogXHJcbiAgICAgICAgICAgIGlzQ2FjaGUucHV0KHN0ciwgKCkgPT4gbmV3IElzKHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuICAgIFwiOmNoaWxkLWV2ZW5cIiA6IFwiOm50aC1jaGlsZChldmVuKVwiLFxyXG4gICAgXCI6Y2hpbGQtb2RkXCIgIDogXCI6bnRoLWNoaWxkKG9kZClcIixcclxuICAgIFwiOnRleHRcIiAgICAgICA6IFwiW3R5cGU9dGV4dF1cIixcclxuICAgIFwiOnBhc3N3b3JkXCIgICA6IFwiW3R5cGU9cGFzc3dvcmRdXCIsXHJcbiAgICBcIjpyYWRpb1wiICAgICAgOiBcIlt0eXBlPXJhZGlvXVwiLFxyXG4gICAgXCI6Y2hlY2tib3hcIiAgIDogXCJbdHlwZT1jaGVja2JveF1cIixcclxuICAgIFwiOnN1Ym1pdFwiICAgICA6IFwiW3R5cGU9c3VibWl0XVwiLFxyXG4gICAgXCI6cmVzZXRcIiAgICAgIDogXCJbdHlwZT1yZXNldF1cIixcclxuICAgIFwiOmJ1dHRvblwiICAgICA6IFwiW3R5cGU9YnV0dG9uXVwiLFxyXG4gICAgXCI6aW1hZ2VcIiAgICAgIDogXCJbdHlwZT1pbWFnZV1cIixcclxuICAgIFwiOmlucHV0XCIgICAgICA6IFwiW3R5cGU9aW5wdXRdXCIsXHJcbiAgICBcIjpmaWxlXCIgICAgICAgOiBcIlt0eXBlPWZpbGVdXCIsXHJcbiAgICBcIjpzZWxlY3RlZFwiICAgOiBcIltzZWxlY3RlZD1zZWxlY3RlZF1cIlxyXG59IiwidmFyIFNVUFBPUlRTICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBQU0VVRE9fU0VMRUNUICAgICAgPSAvKDpbXlxcc1xcKFxcWyldKykvZyxcclxuICAgIFNFTEVDVEVEX1NFTEVDVCAgICA9IC9cXFtzZWxlY3RlZFxcXS9naSxcclxuICAgIGNhY2hlICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHByb3hpZXMgICAgICAgICAgICA9IHJlcXVpcmUoJy4vcHJveHkuanNvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoc3RyKSA/IGNhY2hlLmdldChzdHIpIDogY2FjaGUucHV0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gcHNldWRvIHJlcGxhY2UgaWYgdGhlIGNhcHR1cmVkIHNlbGVjdG9yIGlzIGluIHRoZSBwcm94aWVzXHJcbiAgICAgICAgdmFyIHMgPSBzdHIucmVwbGFjZShQU0VVRE9fU0VMRUNULCAobWF0Y2gpID0+IHByb3hpZXNbbWF0Y2hdID8gcHJveGllc1ttYXRjaF0gOiBtYXRjaCk7XHJcblxyXG4gICAgICAgIC8vIGJvb2xlYW4gc2VsZWN0b3IgcmVwbGFjZW1lbnQ/XHJcbiAgICAgICAgLy8gc3VwcG9ydHMgSUU4LTlcclxuICAgICAgICByZXR1cm4gU1VQUE9SVFMuc2VsZWN0ZWRTZWxlY3RvciA/IHMgOiBzLnJlcGxhY2UoU0VMRUNURURfU0VMRUNULCAnW3NlbGVjdGVkPVwic2VsZWN0ZWRcIl0nKTtcclxuICAgIH0pO1xyXG59OyIsIi8qXHJcbiAqIEZpenpsZS5qc1xyXG4gKiBBZGFwdGVkIGZyb20gU2l6emxlLmpzXHJcbiAqL1xyXG52YXIgdG9rZW5DYWNoZSAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIGVycm9yID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2QtanM6IEludmFsaWQgcXVlcnkgc2VsZWN0b3IgKGNhdWdodCkgXCInKyBzZWxlY3RvciArJ1wiJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtc2VsZWN0b3JzLyN3aGl0ZXNwYWNlXHJcbiAgICBXSElURVNQQUNFID0gJ1tcXFxceDIwXFxcXHRcXFxcclxcXFxuXFxcXGZdJyxcclxuXHJcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjdmFsdWUtZGVmLWlkZW50aWZpZXJcclxuICAgIElERU5USUZJRVIgPSAnKD86XFxcXFxcXFwufFtcXFxcdy1dfFteXFxcXHgwMC1cXFxceGEwXSkrJyxcclxuXHJcbiAgICAvLyBOT1RFOiBMZWF2aW5nIGRvdWJsZSBxdW90ZXMgdG8gcmVkdWNlIGVzY2FwaW5nXHJcbiAgICAvLyBBdHRyaWJ1dGUgc2VsZWN0b3JzOiBodHRwOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI2F0dHJpYnV0ZS1zZWxlY3RvcnNcclxuICAgIEFUVFJJQlVURVMgPSBcIlxcXFxbXCIgKyBXSElURVNQQUNFICsgXCIqKFwiICsgSURFTlRJRklFUiArIFwiKSg/OlwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gT3BlcmF0b3IgKGNhcHR1cmUgMilcclxuICAgICAgICBcIiooWypeJHwhfl0/PSlcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIC8vIFwiQXR0cmlidXRlIHZhbHVlcyBtdXN0IGJlIENTUyBJREVOVElGSUVScyBbY2FwdHVyZSA1XSBvciBzdHJpbmdzIFtjYXB0dXJlIDMgb3IgY2FwdHVyZSA0XVwiXHJcbiAgICAgICAgXCIqKD86JygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwifChcIiArIElERU5USUZJRVIgKyBcIikpfClcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIFwiKlxcXFxdXCIsXHJcblxyXG4gICAgUFNFVURPUyA9IFwiOihcIiArIElERU5USUZJRVIgKyBcIikoPzpcXFxcKChcIiArXHJcbiAgICAgICAgLy8gVG8gcmVkdWNlIHRoZSBudW1iZXIgb2Ygc2VsZWN0b3JzIG5lZWRpbmcgdG9rZW5pemUgaW4gdGhlIHByZUZpbHRlciwgcHJlZmVyIGFyZ3VtZW50czpcclxuICAgICAgICAvLyAxLiBxdW90ZWQgKGNhcHR1cmUgMzsgY2FwdHVyZSA0IG9yIGNhcHR1cmUgNSlcclxuICAgICAgICBcIignKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCIpfFwiICtcclxuICAgICAgICAvLyAyLiBzaW1wbGUgKGNhcHR1cmUgNilcclxuICAgICAgICBcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpW1xcXFxdXXxcIiArIEFUVFJJQlVURVMgKyBcIikqKXxcIiArXHJcbiAgICAgICAgLy8gMy4gYW55dGhpbmcgZWxzZSAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiLipcIiArXHJcbiAgICAgICAgXCIpXFxcXCl8KVwiLFxyXG5cclxuICAgIFJfQ09NTUEgICAgICAgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKiwnICsgV0hJVEVTUEFDRSArICcqJyksXHJcbiAgICBSX0NPTUJJTkFUT1JTID0gbmV3IFJlZ0V4cCgnXicgKyBXSElURVNQQUNFICsgJyooWz4rfl18JyArIFdISVRFU1BBQ0UgKyAnKScgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfUFNFVURPICAgICAgPSBuZXcgUmVnRXhwKFBTRVVET1MpLFxyXG4gICAgUl9NQVRDSF9FWFBSID0ge1xyXG4gICAgICAgIElEOiAgICAgbmV3IFJlZ0V4cCgnXiMoJyAgICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgQ0xBU1M6ICBuZXcgUmVnRXhwKCdeXFxcXC4oJyArIElERU5USUZJRVIgKyAnKScpLFxyXG4gICAgICAgIFRBRzogICAgbmV3IFJlZ0V4cCgnXignICAgICsgSURFTlRJRklFUiArICd8WypdKScpLFxyXG4gICAgICAgIEFUVFI6ICAgbmV3IFJlZ0V4cCgnXicgICAgICsgQVRUUklCVVRFUyksXHJcbiAgICAgICAgUFNFVURPOiBuZXcgUmVnRXhwKCdeJyAgICAgKyBQU0VVRE9TKSxcclxuICAgICAgICBDSElMRDogIG5ldyBSZWdFeHAoJ146KG9ubHl8Zmlyc3R8bGFzdHxudGh8bnRoLWxhc3QpLShjaGlsZHxvZi10eXBlKSg/OlxcXFwoJyArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgICAgICAnKihldmVufG9kZHwoKFsrLV18KShcXFxcZCopbnwpJyArIFdISVRFU1BBQ0UgKyAnKig/OihbKy1dfCknICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKFxcXFxkKyl8KSknICsgV0hJVEVTUEFDRSArICcqXFxcXCl8KScsICdpJyksXHJcbiAgICAgICAgYm9vbDogICBuZXcgUmVnRXhwKCdeKD86Y2hlY2tlZHxzZWxlY3RlZHxhc3luY3xhdXRvZm9jdXN8YXV0b3BsYXl8Y29udHJvbHN8ZGVmZXJ8ZGlzYWJsZWR8aGlkZGVufGlzbWFwfGxvb3B8bXVsdGlwbGV8b3BlbnxyZWFkb25seXxyZXF1aXJlZHxzY29wZWQpJCcsICdpJylcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ1NTIGVzY2FwZXMgaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xyXG4gICAgUl9VTkVTQ0FQRSA9IG5ldyBSZWdFeHAoJ1xcXFxcXFxcKFtcXFxcZGEtZl17MSw2fScgKyBXSElURVNQQUNFICsgJz98KCcgKyBXSElURVNQQUNFICsgJyl8LiknLCAnaWcnKSxcclxuICAgIGZ1bmVzY2FwZSA9IGZ1bmN0aW9uKF8sIGVzY2FwZWQsIGVzY2FwZWRXaGl0ZXNwYWNlKSB7XHJcbiAgICAgICAgdmFyIGhpZ2ggPSAnMHgnICsgKGVzY2FwZWQgLSAweDEwMDAwKTtcclxuICAgICAgICAvLyBOYU4gbWVhbnMgbm9uLWNvZGVwb2ludFxyXG4gICAgICAgIC8vIFN1cHBvcnQ6IEZpcmVmb3g8MjRcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGVycm9uZW91cyBudW1lcmljIGludGVycHJldGF0aW9uIG9mICsnMHgnXHJcbiAgICAgICAgcmV0dXJuIGhpZ2ggIT09IGhpZ2ggfHwgZXNjYXBlZFdoaXRlc3BhY2UgP1xyXG4gICAgICAgICAgICBlc2NhcGVkIDpcclxuICAgICAgICAgICAgaGlnaCA8IDAgP1xyXG4gICAgICAgICAgICAgICAgLy8gQk1QIGNvZGVwb2ludFxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKGhpZ2ggKyAweDEwMDAwKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwbGVtZW50YWwgUGxhbmUgY29kZXBvaW50IChzdXJyb2dhdGUgcGFpcilcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZSgoaGlnaCA+PiAxMCkgfCAweEQ4MDAsIChoaWdoICYgMHgzRkYpIHwgMHhEQzAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJlRmlsdGVyID0ge1xyXG4gICAgICAgIEFUVFI6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0ucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSB0aGUgZ2l2ZW4gdmFsdWUgdG8gbWF0Y2hbM10gd2hldGhlciBxdW90ZWQgb3IgdW5xdW90ZWRcclxuICAgICAgICAgICAgbWF0Y2hbM10gPSAoIG1hdGNoWzNdIHx8IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnICkucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdID09PSAnfj0nKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFszXSA9ICcgJyArIG1hdGNoWzNdICsgJyAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgNCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgQ0hJTEQ6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIC8qIG1hdGNoZXMgZnJvbSBSX01BVENIX0VYUFJbJ0NISUxEJ11cclxuICAgICAgICAgICAgICAgIDEgdHlwZSAob25seXxudGh8Li4uKVxyXG4gICAgICAgICAgICAgICAgMiB3aGF0IChjaGlsZHxvZi10eXBlKVxyXG4gICAgICAgICAgICAgICAgMyBhcmd1bWVudCAoZXZlbnxvZGR8XFxkKnxcXGQqbihbKy1dXFxkKyk/fC4uLilcclxuICAgICAgICAgICAgICAgIDQgeG4tY29tcG9uZW50IG9mIHhuK3kgYXJndW1lbnQgKFsrLV0/XFxkKm58KVxyXG4gICAgICAgICAgICAgICAgNSBzaWduIG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNiB4IG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNyBzaWduIG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA4IHkgb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXS5zbGljZSgwLCAzKSA9PT0gJ250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIG50aC0qIHJlcXVpcmVzIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgUFNFVURPOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICB2YXIgZXhjZXNzLFxyXG4gICAgICAgICAgICAgICAgdW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoUl9NQVRDSF9FWFBSLkNISUxELnRlc3QobWF0Y2hbMF0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWNjZXB0IHF1b3RlZCBhcmd1bWVudHMgYXMtaXNcclxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgLy8gU3RyaXAgZXhjZXNzIGNoYXJhY3RlcnMgZnJvbSB1bnF1b3RlZCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1bnF1b3RlZCAmJiBSX1BTRVVETy50ZXN0KHVucXVvdGVkKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB0b2tlbml6ZSh1bnF1b3RlZCwgdHJ1ZSkpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB1bnF1b3RlZC5pbmRleE9mKCcpJywgdW5xdW90ZWQubGVuZ3RoIC0gZXhjZXNzKSAtIHVucXVvdGVkLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleGNlc3MgaXMgYSBuZWdhdGl2ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSB1bnF1b3RlZC5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBbcGFyc2VPbmx5PWZhbHNlXVxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXXxOdW1iZXJ8bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgdG9rZW5pemUgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgdmFyIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHR5cGUsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7UmVnRXhwfSAqL1xyXG4gICAgICAgIHJlZ2V4LFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge0FycmF5fSAqL1xyXG4gICAgICAgIG1hdGNoLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBtYXRjaGVkLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ1tdfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJpZXMgPSBbXSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc3VicXVlcnkgPSAnJyxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc29GYXIgPSBzZWxlY3RvcjtcclxuXHJcbiAgICB3aGlsZSAoc29GYXIpIHtcclxuICAgICAgICAvLyBDb21tYSBhbmQgZmlyc3QgcnVuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkIHx8IChtYXRjaCA9IFJfQ09NTUEuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uc3VtZSB0cmFpbGluZyBjb21tYXMgYXMgdmFsaWRcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKSB8fCBzb0ZhcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG4gICAgICAgICAgICBzdWJxdWVyeSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF0Y2hlZCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIENvbWJpbmF0b3JzXHJcbiAgICAgICAgaWYgKChtYXRjaCA9IFJfQ09NQklOQVRPUlMuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpbHRlcnNcclxuICAgICAgICBmb3IgKHR5cGUgaW4gUl9NQVRDSF9FWFBSKSB7XHJcbiAgICAgICAgICAgIHJlZ2V4ID0gUl9NQVRDSF9FWFBSW3R5cGVdO1xyXG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc29GYXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmICghcHJlRmlsdGVyW3R5cGVdIHx8IChtYXRjaCA9IHByZUZpbHRlclt0eXBlXShtYXRjaCkpKSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbWF0Y2hlZCkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuXHJcbiAgICByZXR1cm4gc29GYXIgPyBudWxsIDogc3VicXVlcmllcztcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gICAgICogQHJldHVybiB7U3RyaW5nW118bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcgdGhlIHNlbGVjdG9yLlxyXG4gICAgICovXHJcbiAgICBzdWJxdWVyaWVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciB0b2tlbnMgPSB0b2tlbkNhY2hlLmhhcyhzZWxlY3RvcikgPyBcclxuICAgICAgICAgICAgdG9rZW5DYWNoZS5nZXQoc2VsZWN0b3IpIDogXHJcbiAgICAgICAgICAgIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCB0b2tlbml6ZShzZWxlY3RvcikpO1xyXG5cclxuICAgICAgICBpZiAoIXRva2VucykgeyBlcnJvcihzZWxlY3Rvcik7IHJldHVybiB0b2tlbnM7IH1cclxuICAgICAgICByZXR1cm4gdG9rZW5zLnNsaWNlKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzQm9vbDogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiBSX01BVENIX0VYUFIuYm9vbC50ZXN0KG5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG4iLCIgICAgLy8gTWF0Y2hlcyBcIi1tcy1cIiBzbyB0aGF0IGl0IGNhbiBiZSBjaGFuZ2VkIHRvIFwibXMtXCJcclxudmFyIFRSVU5DQVRFX01TX1BSRUZJWCAgPSAvXi1tcy0vLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgZGFzaGVkIHN0cmluZyBmb3IgY2FtZWxpemluZ1xyXG4gICAgREFTSF9DQVRDSCAgICAgICAgICA9IC8tKFtcXGRhLXpdKS9naSxcclxuXHJcbiAgICAvLyBNYXRjaGVzIFwibm9uZVwiIG9yIGEgdGFibGUgdHlwZSBlLmcuIFwidGFibGVcIixcclxuICAgIC8vIFwidGFibGUtY2VsbFwiIGV0Yy4uLlxyXG4gICAgTk9ORV9PUl9UQUJMRSAgICAgICA9IC9eKG5vbmV8dGFibGUoPyEtY1tlYV0pLispLyxcclxuICAgIFxyXG4gICAgVFlQRV9URVNUX0ZPQ1VTQUJMRSA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbnxvYmplY3QpJC9pLFxyXG4gICAgVFlQRV9URVNUX0NMSUNLQUJMRSA9IC9eKD86YXxhcmVhKSQvaSxcclxuICAgIFNFTEVDVE9SX0lEICAgICAgICAgPSAvXiMoW1xcdy1dKykkLyxcclxuICAgIFNFTEVDVE9SX1RBRyAgICAgICAgPSAvXltcXHctXSskLyxcclxuICAgIFNFTEVDVE9SX0NMQVNTICAgICAgPSAvXlxcLihbXFx3LV0rKSQvLFxyXG4gICAgUE9TSVRJT04gICAgICAgICAgICA9IC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkLyxcclxuICAgIE5VTV9OT05fUFggICAgICAgICAgPSBuZXcgUmVnRXhwKCdeKCcgKyAoL1srLV0/KD86XFxkKlxcLnwpXFxkKyg/OltlRV1bKy1dP1xcZCt8KS8pLnNvdXJjZSArICcpKD8hcHgpW2EteiVdKyQnLCAnaScpLFxyXG4gICAgU0lOR0xFX1RBRyAgICAgICAgICA9IC9ePChcXHcrKVxccypcXC8/Pig/OjxcXC9cXDE+fCkkLyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBvZiBwYXJlbnQgdGFnIG5hbWVzIHRvIHRoZSBjaGlsZCB0YWdzIHRoYXQgcmVxdWlyZSB0aGVtLlxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgUEFSRU5UX01BUCA9IHtcclxuICAgICAgICB0YWJsZTogICAgL148KD86dGJvZHl8dGZvb3R8dGhlYWR8Y29sZ3JvdXB8Y2FwdGlvbilcXGIvLFxyXG4gICAgICAgIHRib2R5OiAgICAvXjwoPzp0cilcXGIvLFxyXG4gICAgICAgIHRyOiAgICAgICAvXjwoPzp0ZHx0aClcXGIvLFxyXG4gICAgICAgIGNvbGdyb3VwOiAvXjwoPzpjb2wpXFxiLyxcclxuICAgICAgICBzZWxlY3Q6ICAgL148KD86b3B0aW9uKVxcYi9cclxuICAgIH07XHJcblxyXG4vLyBoYXZpbmcgY2FjaGVzIGlzbid0IGFjdHVhbGx5IGZhc3RlclxyXG4vLyBmb3IgYSBtYWpvcml0eSBvZiB1c2UgY2FzZXMgZm9yIHN0cmluZ1xyXG4vLyBtYW5pcHVsYXRpb25zXHJcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3NpbXBsZS1jYWNoZS1mb3Itc3RyaW5nLW1hbmlwXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbnVtTm90UHg6ICAgICAgICh2YWwpID0+IE5VTV9OT05fUFgudGVzdCh2YWwpLFxyXG4gICAgcG9zaXRpb246ICAgICAgICh2YWwpID0+IFBPU0lUSU9OLnRlc3QodmFsKSxcclxuICAgIHNpbmdsZVRhZ01hdGNoOiAodmFsKSA9PiBTSU5HTEVfVEFHLmV4ZWModmFsKSxcclxuICAgIGlzTm9uZU9yVGFibGU6ICAoc3RyKSA9PiBOT05FX09SX1RBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzRm9jdXNhYmxlOiAgICAoc3RyKSA9PiBUWVBFX1RFU1RfRk9DVVNBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzQ2xpY2thYmxlOiAgICAoc3RyKSA9PiBUWVBFX1RFU1RfQ0xJQ0tBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzU3RyaWN0SWQ6ICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9JRC50ZXN0KHN0ciksXHJcbiAgICBpc1RhZzogICAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfVEFHLnRlc3Qoc3RyKSxcclxuICAgIGlzQ2xhc3M6ICAgICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9DTEFTUy50ZXN0KHN0ciksXHJcblxyXG4gICAgY2FtZWxDYXNlOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoVFJVTkNBVEVfTVNfUFJFRklYLCAnbXMtJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoREFTSF9DQVRDSCwgKG1hdGNoLCBsZXR0ZXIpID0+IGxldHRlci50b1VwcGVyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50VGFnTmFtZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9IHN0ci5zdWJzdHIoMCwgMzApO1xyXG4gICAgICAgIGZvciAodmFyIHBhcmVudFRhZ05hbWUgaW4gUEFSRU5UX01BUCkge1xyXG4gICAgICAgICAgICBpZiAoUEFSRU5UX01BUFtwYXJlbnRUYWdOYW1lXS50ZXN0KHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRUYWdOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnZGl2JztcclxuICAgIH1cclxufTtcclxuIiwidmFyIERJViAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgY3JlYXRlID0gcmVxdWlyZSgnRElWL2NyZWF0ZScpLFxyXG4gICAgYSAgICAgID0gRElWLnF1ZXJ5U2VsZWN0b3IoJ2EnKSxcclxuICAgIHNlbGVjdCA9IGNyZWF0ZSgnc2VsZWN0JyksXHJcbiAgICBvcHRpb24gPSBzZWxlY3QuYXBwZW5kQ2hpbGQoY3JlYXRlKCdvcHRpb24nKSksXHJcblxyXG4gICAgdGVzdCA9ICh0YWdOYW1lLCB0ZXN0Rm4pID0+IHRlc3RGbihjcmVhdGUodGFnTmFtZSkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBVUkxzIGFyZW4ndCBtYW5pcHVsYXRlZFxyXG4gICAgLy8gKElFIG5vcm1hbGl6ZXMgaXQgYnkgZGVmYXVsdClcclxuICAgIGhyZWZOb3JtYWxpemVkOiBhLmdldEF0dHJpYnV0ZSgnaHJlZicpID09PSAnL2EnLFxyXG5cclxuICAgIC8vIENoZWNrIHRoZSBkZWZhdWx0IGNoZWNrYm94L3JhZGlvIHZhbHVlICgnJyBpbiBvbGRlciBXZWJLaXQ7ICdvbicgZWxzZXdoZXJlKVxyXG4gICAgY2hlY2tPbjogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiAhIWlucHV0LnZhbHVlO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgYW4gaW5wdXQgbWFpbnRhaW5zIGl0cyB2YWx1ZSBhZnRlciBiZWNvbWluZyBhIHJhZGlvXHJcbiAgICAvLyBTdXBwb3J0OiBNb2Rlcm4gYnJvd3NlcnMgb25seSAoTk9UIElFIDw9IDExKVxyXG4gICAgcmFkaW9WYWx1ZTogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnZhbHVlID0gJ3QnO1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiBpbnB1dC52YWx1ZSA9PT0gJ3QnO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgYSBzZWxlY3RlZC1ieS1kZWZhdWx0IG9wdGlvbiBoYXMgYSB3b3JraW5nIHNlbGVjdGVkIHByb3BlcnR5LlxyXG4gICAgLy8gKFdlYktpdCBkZWZhdWx0cyB0byBmYWxzZSBpbnN0ZWFkIG9mIHRydWUsIElFIHRvbywgaWYgaXQncyBpbiBhbiBvcHRncm91cClcclxuICAgIG9wdFNlbGVjdGVkOiBvcHRpb24uc2VsZWN0ZWQsXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG9wdGlvbnMgaW5zaWRlIGRpc2FibGVkIHNlbGVjdHMgYXJlbid0IG1hcmtlZCBhcyBkaXNhYmxlZFxyXG4gICAgLy8gKFdlYktpdCBtYXJrcyB0aGVtIGFzIGRpc2FibGVkKVxyXG4gICAgb3B0RGlzYWJsZWQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICBzZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAhb3B0aW9uLmRpc2FibGVkO1xyXG4gICAgfSgpKSxcclxuICAgIFxyXG4gICAgdGV4dENvbnRlbnQ6IERJVi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkLFxyXG5cclxuICAgIC8vIE1vZGVybiBicm93c2VycyBub3JtYWxpemUgXFxyXFxuIHRvIFxcbiBpbiB0ZXh0YXJlYSB2YWx1ZXMsXHJcbiAgICAvLyBidXQgSUUgPD0gMTEgKGFuZCBwb3NzaWJseSBuZXdlcikgZG8gbm90LlxyXG4gICAgdmFsdWVOb3JtYWxpemVkOiB0ZXN0KCd0ZXh0YXJlYScsIGZ1bmN0aW9uKHRleHRhcmVhKSB7XHJcbiAgICAgICAgdGV4dGFyZWEudmFsdWUgPSAnXFxyXFxuJztcclxuICAgICAgICByZXR1cm4gdGV4dGFyZWEudmFsdWUgPT09ICdcXG4nO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgc2VsZWN0ZWRTZWxlY3RvcjogdGVzdCgnc2VsZWN0JywgZnVuY3Rpb24oc2VsZWN0KSB7XHJcbiAgICAgICAgc2VsZWN0LmlubmVySFRNTCA9ICc8b3B0aW9uIHZhbHVlPVwiMVwiPjE8L29wdGlvbj48b3B0aW9uIHZhbHVlPVwiMlwiIHNlbGVjdGVkPjI8L29wdGlvbj4nO1xyXG4gICAgICAgIHJldHVybiAhIXNlbGVjdC5xdWVyeVNlbGVjdG9yKCdvcHRpb25bc2VsZWN0ZWRdJyk7XHJcbiAgICB9KVxyXG59O1xyXG4iLCJ2YXIgZXhpc3RzICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXJyYXkgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnaXMvYXJyYXlMaWtlJyksXHJcbiAgICBpc05vZGVMaXN0ICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBzbGljZSAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKTtcclxuXHJcbnZhciBsb29wID0gZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdGVlKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICBpZiAobGVuZ3RoID09PSArbGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlcmF0b3IoaXRlcmF0ZWUsIG9ialtpZHhdLCBpZHgsIG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0ga2V5cy5sZW5ndGg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGl0ZXJhdGVlLCBvYmpba2V5c1tpZHhdXSwga2V5c1tpZHhdLCBvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIF8gPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIEZsYXR0ZW4gdGhhdCBhbHNvIGNoZWNrcyBpZiB2YWx1ZSBpcyBhIE5vZGVMaXN0XHJcbiAgICBmbGF0dGVuOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvUHg6ICh2YWx1ZSkgPT4gdmFsdWUgKyAncHgnLFxyXG4gICAgXHJcbiAgICBwYXJzZUludDogKG51bSkgPT4gcGFyc2VJbnQobnVtLCAxMCksXHJcblxyXG4gICAgZXZlcnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcnIpKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmICghaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICAgICAgb2JqICA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGxlbiAgPSBhcmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCFvYmogfHwgbGVuIDwgMikgeyByZXR1cm4gb2JqOyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3NbaWR4XTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN0YW5kYXJkIG1hcFxyXG4gICAgbWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEFycmF5LXByZXNlcnZpbmcgbWFwXHJcbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9wdXNoLW1hcC12cy1pbmRleC1yZXBsYWNlbWVudC1tYXBcclxuICAgIGZhc3RtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBpdGVyYXRvcihhcnJbaWR4XSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcblxyXG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhcnJbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoYXJyICYmIGFyci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwdWxsZWQgZnJvbSBBTURcclxuICAgIHR5cGVjYXN0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgIHIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgciA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICdmYWxzZScpIHtcclxuICAgICAgICAgICAgciA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnJyB8fCBpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgIC8vIGlzTmFOKCcnKSByZXR1cm5zIGZhbHNlXHJcbiAgICAgICAgICAgIHIgPSB2YWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcGFyc2VGbG9hdChudWxsIHx8ICcnKSByZXR1cm5zIE5hTlxyXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gVE9ETzpcclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlKG9iaik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXJyLFxyXG4gICAgICAgICAgICBsZW4gPSArb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGFycltpZHhdID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgYXJyLnB1c2gob2JqW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQXJyYXk6IChhcmcpID0+XHJcbiAgICAgICAgIWV4aXN0cyhhcmcpID8gW10gOlxyXG4gICAgICAgIGlzQXJyYXlMaWtlKGFyZykgPyBzbGljZShhcmcpIDogWyBhcmcgXSxcclxuXHJcbiAgICBjb250YWluczogKGFyciwgaXRlbSkgPT4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xLFxyXG5cclxuICAgIGpxRWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4LCBjb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgZm4uY2FsbCh2YWx1ZSwga2V5SW5kZXgsIHZhbHVlLCBjb2xsZWN0aW9uKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRFYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmbi5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4KSB7XHJcbiAgICAgICAgZm4odmFsdWUsIGtleUluZGV4KTtcclxuICAgIH0pLFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggZWFjaCBlbGVtZW50IGluIHRoZVxyXG4gICAgICAgIC8vIHNlY29uZCBhcnJheSBhbmQgYWRkIGl0IHRvIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtpZHhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwbHVja1xyXG4gICAgLy8gVE9ETzogQ2hlY2sgZm9yIHBsYWNlcyB0aGlzIGNhbiBiZSBhcHBsaWVkXHJcbiAgICBwbHVjazogZnVuY3Rpb24oYXJyLCBrZXkpIHtcclxuICAgICAgICByZXR1cm4gXy5tYXAoYXJyLCAob2JqKSA9PiBvYmogPyBvYmpba2V5XSA6IHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcbn07IiwidmFyIGRlbGV0ZXIgPSAoZGVsZXRhYmxlKSA9PlxyXG4gICAgZGVsZXRhYmxlID8gXHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBkZWxldGUgc3RvcmVba2V5XTsgfSA6XHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBzdG9yZVtrZXldID0gdW5kZWZpbmVkOyB9O1xyXG5cclxudmFyIGdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBzdG9yZSAmJiBzdG9yZVtrZXldICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5LCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgZGVsKHN0b3JlLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgYmlMZXZlbEdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciBoYXMxID0ga2V5MSBpbiBzdG9yZSAmJiBzdG9yZVtrZXkxXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBpZiAoIWhhczEgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhczE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBrZXkyIGluIHN0b3JlW2tleTFdICYmIHN0b3JlW2tleTFdW2tleTJdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyByZWYxIDogKHJlZjEgIT09IHVuZGVmaW5lZCA/IHJlZjFba2V5Ml0gOiByZWYxKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5MSwga2V5MiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5MSwga2V5MiwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIC8vIEVhc3kgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbChzdG9yZSwga2V5MSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERlZXAgcmVtb3ZhbFxyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdIHx8IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgZGVsKHJlZjEsIGtleTIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGx2bCwgZGVsZXRhYmxlKSB7XHJcbiAgICByZXR1cm4gbHZsID09PSAyID8gYmlMZXZlbEdldHRlclNldHRlcihkZWxldGFibGUpIDogZ2V0dGVyU2V0dGVyKGRlbGV0YWJsZSk7XHJcbn07IiwidmFyIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMuc2V0ID0gKEQpID0+IGNvbnN0cnVjdG9yID0gRDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiArdmFsdWUubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGg7XHJcbiIsInZhciBpc0RvY3VtZW50RnJhZ21lbnQgPSByZXF1aXJlKCdub2RlVHlwZScpLmRvY19mcmFnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICB2YXIgcGFyZW50O1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpICAgICAgICAgICAgICYmXHJcbiAgICAgICAgIWlzRG9jdW1lbnRGcmFnbWVudChwYXJlbnQpICAgICAgICAgICAgJiZcclxuICAgICAgICBwYXJlbnQuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9EJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgdmFsdWUgJiYgKHZhbHVlID09PSBkb2N1bWVudCB8fCBpc1dpbmRvdyh2YWx1ZSkgfHwgaXNFbGVtZW50KHZhbHVlKSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIG5hbWUpID0+XHJcbiAgICBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJzsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8ICghIXZhbHVlICYmIHR5cGUgPT09ICdvYmplY3QnKTtcclxufTsiLCJ2YXIgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNDb2xsZWN0aW9uID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsKSA9PlxyXG4gICAgdmFsICYmIChpc1N0cmluZyh2YWwpIHx8IGlzRnVuY3Rpb24odmFsKSB8fCBpc0VsZW1lbnQodmFsKSB8fCBpc0NvbGxlY3Rpb24odmFsKSk7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSB2YWx1ZS53aW5kb3c7XHJcbiIsInZhciBpc0VsZW1lbnQgICAgICAgPSByZXF1aXJlKCdub2RlVHlwZScpLmVsZW0sXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG4vLyBvbmx5IGVsZW1lbnQgdHlwZXMgc3VwcG9ydGVkXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIHNlbGVjdG9yKSA9PlxyXG4gICAgaXNFbGVtZW50KGVsZW0pID8gbWF0Y2hlc1NlbGVjdG9yLmNhbGwoZWxlbSwgc2VsZWN0b3IpIDogZmFsc2U7XHJcbiIsInZhciBfICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIHNsaWNlICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyksXHJcbiAgICBtYXAgICAgID0gcmVxdWlyZSgnLi9tYXAnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHNsaWNlKHRoaXMpOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAraW5kZXg7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbXHJcbiAgICAgICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgICAgIC8vIGlmIG5lZ2F0aXZlLCBvciB0aGUgc3RhcnQgb2YgdGhlIHNldCBpZiBwb3NpdGl2ZVxyXG4gICAgICAgICAgICBpZHggPCAwID8gdGhpcy5sZW5ndGggKyBpZHggOiBpZHhcclxuICAgICAgICBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgIHJldHVybiBEKHNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBfLmRFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBfLmRFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgaWYgKCFhcnIubGVuZ3RoIHx8ICFpdGVyYXRvcikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgIGl0ZW07XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25jYXQgZmxhdCBmb3IgYSBzaW5nbGUgYXJyYXkgb2YgYXJyYXlzXHJcbiAgICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCByZXN1bHRzKTtcclxufTsiLCJ2YXIgb3JkZXIgPSByZXF1aXJlKCdvcmRlcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICB2YXIgaGFzRHVwbGljYXRlcyA9IG9yZGVyLnNvcnQocmVzdWx0cyk7XHJcbiAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgZWxlbSxcclxuICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgIC8vIHNvIHRoYXQgYSBuZXcgYXJyYXkgaXNuJ3RcclxuICAgICAgICAvLyBjcmVhdGVkL2Rlc3Ryb3llZCBldmVyeSB1bmlxdWUgY2FsbFxyXG4gICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAvLyBHbyB0aHJvdWdoIHRoZSBhcnJheSBhbmQgaWRlbnRpZnlcclxuICAgIC8vIHRoZSBkdXBsaWNhdGVzIHRvIGJlIHJlbW92ZWRcclxuICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgIGlmIChlbGVtID09PSByZXN1bHRzW2lkeF0pIHtcclxuICAgICAgICAgICAgZHVwbGljYXRlcy5wdXNoKGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgcmVzdWx0cy5zcGxpY2UoZHVwbGljYXRlc1tpZHhdLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgICAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5lbGVtLFxyXG4gICAgaXNOb2RlTmFtZSAgICAgICAgICAgPSByZXF1aXJlKCdpcy9ub2RlTmFtZScpLFxyXG4gICAgbmV3bGluZXMgICAgICAgICAgICAgPSByZXF1aXJlKCd1dGlsL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzRWxlbWVudCA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG5cclxuICAgIHNwbGl0ID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ciA9PT0gJycgPyBbXSA6IHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XHJcbiAgICB9O1xyXG5cclxudmFyIGFkZENsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LmFkZChuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC50b2dnbGUobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvdWJsZUNsYXNzTG9vcCA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcywgbWV0aG9kKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZWxlbSA9IGVsZW1zW2lkeF07XHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgICAgIGNsYXNzTGlzdCA9IGVsZW0uY2xhc3NMaXN0O1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBtZXRob2QoY2xhc3NMaXN0LCBuYW1lc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb0FueUVsZW1zSGF2ZUNsYXNzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWUpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBpZiAoZWxlbXNbaWR4XS5jbGFzc0xpc3QuY29udGFpbnMobmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtc1tpZHhdKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBlbGVtc1tpZHhdLmNsYXNzTmFtZSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoICYmIGV4aXN0cyhuYW1lKSAmJiBuYW1lICE9PSAnJyA/IGRvQW55RWxlbXNIYXZlQ2xhc3ModGhpcywgbmFtZSkgOiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCBhZGRDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsQ2xhc3Nlcyh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHsgbmFtZXMgPSBzcGxpdChuYW1lcyk7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuYW1lcy5sZW5ndGggPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZXMsIHJlbW92ZUNsYXNzKSA6IHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzLCBzaG91bGRBZGQpIHtcclxuICAgICAgICB2YXIgbmFtZUxpc3Q7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoIHx8ICF0aGlzLmxlbmd0aCB8fCAhKG5hbWVMaXN0ID0gc3BsaXQobmFtZXMpKS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNob3VsZEFkZCA9PT0gdW5kZWZpbmVkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCB0b2dnbGVDbGFzcykgOlxyXG4gICAgICAgICAgICBzaG91bGRBZGQgPyBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIGFkZENsYXNzKSA6XHJcbiAgICAgICAgICAgIGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgcmVtb3ZlQ2xhc3MpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBzcGxpdCAgICAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkICAgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzQm9vbGVhbiAgICAgID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICAgICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzQXJyYXkgICAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRG9jdW1lbnRUeXBlID0gcmVxdWlyZSgnbm9kZVR5cGUnKS5kb2MsXHJcbiAgICBSRUdFWCAgICAgICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MgPSB7XHJcbiAgICBkaXNwbGF5OiAgICAnYmxvY2snLFxyXG4gICAgcG9zaXRpb246ICAgJ2Fic29sdXRlJyxcclxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXHJcbn07XHJcblxyXG52YXIgZ2V0RG9jdW1lbnREaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAvLyBFaXRoZXIgc2Nyb2xsW1dpZHRoL0hlaWdodF0gb3Igb2Zmc2V0W1dpZHRoL0hlaWdodF0gb3JcclxuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdLCB3aGljaGV2ZXIgaXMgZ3JlYXRlc3RcclxuICAgIHZhciBkb2MgPSBlbGVtLmRvY3VtZW50RWxlbWVudDtcclxuICAgIHJldHVybiBNYXRoLm1heChcclxuICAgICAgICBlbGVtLmJvZHlbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBlbGVtLmJvZHlbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZG9jWydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snY2xpZW50JyArIG5hbWVdXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIGhpZGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSxcclxuICAgIHNob3cgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGNzc1N3YXAgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBvbGQgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMsIGFuZCBpbnNlcnQgdGhlIG5ldyBvbmVzXHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgb2xkW25hbWVdID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvbGRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBdm9pZHMgYW4gJ0lsbGVnYWwgSW52b2NhdGlvbicgZXJyb3IgKENocm9tZSlcclxuICAgIC8vIEF2b2lkcyBhICdUeXBlRXJyb3I6IEFyZ3VtZW50IDEgb2YgV2luZG93LmdldENvbXB1dGVkU3R5bGUgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBFbGVtZW50JyBlcnJvciAoRmlyZWZveClcclxuICAgIGdldENvbXB1dGVkU3R5bGUgPSAoZWxlbSkgPT5cclxuICAgICAgICBpc0VsZW1lbnQoZWxlbSkgJiYgIWlzV2luZG93KGVsZW0pICYmICFpc0RvY3VtZW50KGVsZW0pID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSkgOiBudWxsLFxyXG5cclxuICAgIF93aWR0aCA9IHtcclxuICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEb2N1bWVudFR5cGUoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnV2lkdGgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgaWYgKHdpZHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLndpZHRoID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfaGVpZ2h0ID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0RvY3VtZW50VHlwZShlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdIZWlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGVsZW0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoaGVpZ2h0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLmhlaWdodCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgZ2V0V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuXHJcbiAgICAvLyBTdGFydCB3aXRoIG9mZnNldCBwcm9wZXJ0eSwgd2hpY2ggaXMgZXF1aXZhbGVudCB0byB0aGUgYm9yZGVyLWJveCB2YWx1ZVxyXG4gICAgdmFyIHZhbHVlSXNCb3JkZXJCb3ggPSB0cnVlLFxyXG4gICAgICAgIHZhbCA9IChuYW1lID09PSAnd2lkdGgnKSA/IGVsZW0ub2Zmc2V0V2lkdGggOiBlbGVtLm9mZnNldEhlaWdodCxcclxuICAgICAgICBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIGlzQm9yZGVyQm94ID0gc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnO1xyXG5cclxuICAgIC8vIHNvbWUgbm9uLWh0bWwgZWxlbWVudHMgcmV0dXJuIHVuZGVmaW5lZCBmb3Igb2Zmc2V0V2lkdGgsIHNvIGNoZWNrIGZvciBudWxsL3VuZGVmaW5lZFxyXG4gICAgLy8gc3ZnIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjQ5Mjg1XHJcbiAgICAvLyBNYXRoTUwgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD00OTE2NjhcclxuICAgIGlmICh2YWwgPD0gMCB8fCAhZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gY29tcHV0ZWQgdGhlbiB1bmNvbXB1dGVkIGNzcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICB2YWwgPSBjdXJDc3MoZWxlbSwgbmFtZSwgc3R5bGVzKTtcclxuICAgICAgICBpZiAodmFsIDwgMCB8fCAhdmFsKSB7IHZhbCA9IGVsZW0uc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZWQgdW5pdCBpcyBub3QgcGl4ZWxzLiBTdG9wIGhlcmUgYW5kIHJldHVybi5cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgodmFsKSkgeyByZXR1cm4gdmFsOyB9XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdGhlIGNoZWNrIGZvciBzdHlsZSBpbiBjYXNlIGEgYnJvd3NlciB3aGljaCByZXR1cm5zIHVucmVsaWFibGUgdmFsdWVzXHJcbiAgICAgICAgLy8gZm9yIGdldENvbXB1dGVkU3R5bGUgc2lsZW50bHkgZmFsbHMgYmFjayB0byB0aGUgcmVsaWFibGUgZWxlbS5zdHlsZVxyXG4gICAgICAgIHZhbHVlSXNCb3JkZXJCb3ggPSBpc0JvcmRlckJveCAmJiB2YWwgPT09IHN0eWxlc1tuYW1lXTtcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplICcnLCBhdXRvLCBhbmQgcHJlcGFyZSBmb3IgZXh0cmFcclxuICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHZhbCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1c2UgdGhlIGFjdGl2ZSBib3gtc2l6aW5nIG1vZGVsIHRvIGFkZC9zdWJ0cmFjdCBpcnJlbGV2YW50IHN0eWxlc1xyXG4gICAgcmV0dXJuIF8udG9QeChcclxuICAgICAgICB2YWwgKyBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodChcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JyxcclxuICAgICAgICAgICAgdmFsdWVJc0JvcmRlckJveCxcclxuICAgICAgICAgICAgc3R5bGVzXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBDU1NfRVhQQU5EID0gc3BsaXQoJ1RvcHxSaWdodHxCb3R0b218TGVmdCcpO1xyXG52YXIgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBleHRyYSwgaXNCb3JkZXJCb3gsIHN0eWxlcykge1xyXG4gICAgdmFyIHZhbCA9IDAsXHJcbiAgICAgICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIHRoZSByaWdodCBtZWFzdXJlbWVudCwgYXZvaWQgYXVnbWVudGF0aW9uXHJcbiAgICAgICAgaWR4ID0gKGV4dHJhID09PSAoaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JykpID9cclxuICAgICAgICAgICAgNCA6XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpbml0aWFsaXplIGZvciBob3Jpem9udGFsIG9yIHZlcnRpY2FsIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgKG5hbWUgPT09ICd3aWR0aCcpID9cclxuICAgICAgICAgICAgMSA6XHJcbiAgICAgICAgICAgIDAsXHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICAvLyBQdWxsZWQgb3V0IG9mIHRoZSBsb29wIHRvIHJlZHVjZSBzdHJpbmcgY29tcGFyaXNvbnNcclxuICAgICAgICBleHRyYUlzTWFyZ2luICA9IChleHRyYSA9PT0gJ21hcmdpbicpLFxyXG4gICAgICAgIGV4dHJhSXNDb250ZW50ID0gKCFleHRyYUlzTWFyZ2luICYmIGV4dHJhID09PSAnY29udGVudCcpLFxyXG4gICAgICAgIGV4dHJhSXNQYWRkaW5nID0gKCFleHRyYUlzTWFyZ2luICYmICFleHRyYUlzQ29udGVudCAmJiBleHRyYSA9PT0gJ3BhZGRpbmcnKTtcclxuXHJcbiAgICBmb3IgKDsgaWR4IDwgNDsgaWR4ICs9IDIpIHtcclxuICAgICAgICB0eXBlID0gQ1NTX0VYUEFORFtpZHhdO1xyXG5cclxuICAgICAgICAvLyBib3RoIGJveCBtb2RlbHMgZXhjbHVkZSBtYXJnaW4sIHNvIGFkZCBpdCBpZiB3ZSB3YW50IGl0XHJcbiAgICAgICAgaWYgKGV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgYm9yZGVyIG5vciBtYXJnaW4sIHNvIHJlbW92ZSBib3JkZXJcclxuICAgICAgICAgICAgaWYgKCFleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlICsgJ1dpZHRoJ10pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQsIHNvIGFkZCBwYWRkaW5nXHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxudmFyIGN1ckNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGNvbXB1dGVkKSB7XHJcbiAgICB2YXIgc3R5bGUgPSBlbGVtLnN0eWxlLFxyXG4gICAgICAgIHN0eWxlcyA9IGNvbXB1dGVkIHx8IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgcmV0ID0gc3R5bGVzID8gc3R5bGVzLmdldFByb3BlcnR5VmFsdWUobmFtZSkgfHwgc3R5bGVzW25hbWVdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEF2b2lkIHNldHRpbmcgcmV0IHRvIGVtcHR5IHN0cmluZyBoZXJlXHJcbiAgICAvLyBzbyB3ZSBkb24ndCBkZWZhdWx0IHRvIGF1dG9cclxuICAgIGlmICghZXhpc3RzKHJldCkgJiYgc3R5bGUgJiYgc3R5bGVbbmFtZV0pIHsgcmV0ID0gc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAvLyBGcm9tIHRoZSBoYWNrIGJ5IERlYW4gRWR3YXJkc1xyXG4gICAgLy8gaHR0cDovL2VyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA3LzA3LzI3LzE4LjU0LjE1LyNjb21tZW50LTEwMjI5MVxyXG5cclxuICAgIGlmIChzdHlsZXMpIHtcclxuICAgICAgICBpZiAocmV0ID09PSAnJyAmJiAhaXNBdHRhY2hlZChlbGVtKSkge1xyXG4gICAgICAgICAgICByZXQgPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXHJcbiAgICAgICAgLy8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXHJcbiAgICAgICAgLy8gYnV0IG5vdCBwb3NpdGlvbiBjc3MgYXR0cmlidXRlcywgYXMgdGhvc2UgYXJlIHByb3BvcnRpb25hbCB0byB0aGUgcGFyZW50IGVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICAgIC8vIGFuZCB3ZSBjYW4ndCBtZWFzdXJlIHRoZSBwYXJlbnQgaW5zdGVhZCBiZWNhdXNlIGl0IG1pZ2h0IHRyaWdnZXIgYSAnc3RhY2tpbmcgZG9sbHMnIHByb2JsZW1cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgocmV0KSAmJiAhUkVHRVgucG9zaXRpb24obmFtZSkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyIGxlZnQgPSBzdHlsZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcnMgPSBlbGVtLnJ1bnRpbWVTdHlsZSxcclxuICAgICAgICAgICAgICAgIHJzTGVmdCA9IHJzICYmIHJzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IGVsZW0uY3VycmVudFN0eWxlLmxlZnQ7IH1cclxuXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAobmFtZSA9PT0gJ2ZvbnRTaXplJykgPyAnMWVtJyA6IHJldDtcclxuICAgICAgICAgICAgcmV0ID0gXy50b1B4KHN0eWxlLnBpeGVsTGVmdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXZlcnQgdGhlIGNoYW5nZWQgdmFsdWVzXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSByc0xlZnQ7IH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJldCA9PT0gdW5kZWZpbmVkID8gcmV0IDogcmV0ICsgJycgfHwgJ2F1dG8nO1xyXG59O1xyXG5cclxudmFyIG5vcm1hbGl6ZUNzc0tleSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHJldHVybiBSRUdFWC5jYW1lbENhc2UobmFtZSk7XHJcbn07XHJcblxyXG52YXIgc2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIGVsZW0uc3R5bGVbbmFtZV0gPSAodmFsdWUgPT09ICt2YWx1ZSkgPyBfLnRvUHgodmFsdWUpIDogdmFsdWU7XHJcbn07XHJcblxyXG52YXIgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUoZWxlbSlbbmFtZV07XHJcbn07XHJcblxyXG52YXIgaXNIaWRkZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkOlxyXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQub2Zmc2V0UGFyZW50XHJcbiAgICByZXR1cm4gZWxlbS5vZmZzZXRQYXJlbnQgPT09IG51bGwgfHxcclxuICAgICAgICAgICAgLy8gU3VwcG9ydDogT3BlcmEgPD0gMTIuMTJcclxuICAgICAgICAgICAgLy8gT3BlcmEgcmVwb3J0cyBvZmZzZXRXaWR0aHMgYW5kIG9mZnNldEhlaWdodHMgbGVzcyB0aGFuIHplcm8gb24gc29tZSBlbGVtZW50c1xyXG4gICAgICAgICAgICBlbGVtLm9mZnNldFdpZHRoIDw9IDAgJiYgZWxlbS5vZmZzZXRIZWlnaHQgPD0gMCB8fFxyXG4gICAgICAgICAgICAvLyBGYWxsYmFja1xyXG4gICAgICAgICAgICAoKGVsZW0uc3R5bGUgJiYgZWxlbS5zdHlsZS5kaXNwbGF5KSA/IGVsZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIDogZmFsc2UpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjdXJDc3M6IGN1ckNzcyxcclxuICAgIHdpZHRoOiAgX3dpZHRoLFxyXG4gICAgaGVpZ2h0OiBfaGVpZ2h0LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY3NzOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIG5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5O1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBrZXksIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlkeCkgeyByZXR1cm4gcmV0OyB9IC8vIHJldHVybiBlYXJseVxyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0W3ZhbHVlXSA9IGdldFN0eWxlKGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBoaWRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIHNob3cpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKGlzQm9vbGVhbihzdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZSA/IHRoaXMuc2hvdygpIDogdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGlzSGlkZGVuKGVsZW0pID8gc2hvdyhlbGVtKSA6IGhpZGUoZWxlbSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwiLy8gVE9ETzogT25seSBwbGFjZSBiaSBsZXZlbCBjYWNoaW5nIGlzIHVzZWQgbm93Li4uZmlndXJlIG91dCBob3cgdG8gcmVtb3ZlXHJcbnZhciBjYWNoZSAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIsIHRydWUpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgQUNDRVNTT1IgID0gJ19fRF9pZF9fICcsXHJcbiAgICB1bmlxdWVJZCAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZChEYXRlLm5vdygpKSxcclxuXHJcbiAgICBnZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbSA/IGVsZW1bQUNDRVNTT1JdIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3JTZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IChpZCA9IGVsZW1bQUNDRVNTT1JdKSkgeyByZXR1cm4gaWQ7IH1cclxuICAgICAgICBlbGVtW0FDQ0VTU09SXSA9IChpZCA9IHVuaXF1ZUlkKCkpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFzRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmhhcyhpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gZ2V0T3JTZXRJZChlbGVtKTtcclxuICAgICAgICByZXR1cm4gY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlRGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICB9O1xyXG5cclxuLy8gVE9ETzogQWRkcmVzcyBBUElcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZW1vdmU6IChlbGVtLCBzdHIpID0+XHJcbiAgICAgICAgc3RyID09PSB1bmRlZmluZWQgPyByZW1vdmVBbGxEYXRhKGVsZW0pIDogcmVtb3ZlRGF0YShlbGVtLCBzdHIpLFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0RGF0YShlbGVtLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcGFzc2VkXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpc0VsZW1lbnQoZWxlbSkgPyBnZXRBbGxEYXRhKGVsZW0pIDogdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoYXNEYXRhOiAoZWxlbSkgPT5cclxuICAgICAgICAgICAgaXNFbGVtZW50KGVsZW0pID8gaGFzRGF0YShlbGVtKSA6IHRoaXMsXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZURhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVtpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGlzRWxlbWVudChlbGVtKSA/IHJlbW92ZUFsbERhdGEoZWxlbSkgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgdmFsdWVzIGZyb20gaGFzaCBtYXBcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBrZXkncyB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtSWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tlbGVtSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJJZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFycklkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbYXJySWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNOdW1iZXIgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGNzcyAgICAgID0gcmVxdWlyZSgnLi9jc3MnKTtcclxuXHJcbnZhciBhZGQgPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgdG90YWwgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICB0b3RhbCArPSAoYXJyW2lkeF0gfHwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH0sXHJcbiAgICBcclxuICAgIGdldElubmVyV2lkdGggPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChlbGVtKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0xlZnQnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1JpZ2h0JykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0SW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZWxlbSkpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSksXHJcbiAgICAgICAgICAgIF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRlcldpZHRoID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHJldHVybiBhZGQoW1xyXG4gICAgICAgICAgICBnZXRJbm5lcldpZHRoKGVsZW0pLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIDogMCxcclxuICAgICAgICAgICAgd2l0aE1hcmdpbiA/IF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luUmlnaHQnKSkgOiAwLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckxlZnRXaWR0aCcpKSxcclxuICAgICAgICAgICAgXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJSaWdodFdpZHRoJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0T3V0ZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgcmV0dXJuIGFkZChbXHJcbiAgICAgICAgICAgIGdldElubmVySGVpZ2h0KGVsZW0pLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Ub3AnKSkgOiAwLFxyXG4gICAgICAgICAgICB3aXRoTWFyZ2luID8gXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Cb3R0b20nKSkgOiAwLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclRvcFdpZHRoJykpLFxyXG4gICAgICAgICAgICBfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckJvdHRvbVdpZHRoJykpXHJcbiAgICAgICAgXSk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHdpZHRoOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3Mud2lkdGguc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBoZWlnaHQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy5oZWlnaHQuc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJXaWR0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lcldpZHRoKGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJIZWlnaHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJIZWlnaHQoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlcldpZHRoOiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJXaWR0aChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJIZWlnaHQ6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlckhlaWdodChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGhhbmRsZXJzID0ge307XHJcblxyXG52YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lLCB0eXBlLCBmaWx0ZXIpIHtcclxuICAgIGhhbmRsZXJzW25hbWVdID0ge1xyXG4gICAgICAgIGV2ZW50OiB0eXBlLFxyXG4gICAgICAgIGZpbHRlcjogZmlsdGVyLFxyXG4gICAgICAgIHdyYXA6IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyKG5hbWUsIGZuKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHdyYXBwZXIgPSBmdW5jdGlvbihuYW1lLCBmbikge1xyXG4gICAgaWYgKCFmbikgeyByZXR1cm4gZm47IH1cclxuXHJcbiAgICB2YXIga2V5ID0gJ19fZGNlXycgKyBuYW1lO1xyXG4gICAgaWYgKGZuW2tleV0pIHsgcmV0dXJuIGZuW2tleV07IH1cclxuXHJcbiAgICByZXR1cm4gZm5ba2V5XSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBoYW5kbGVyc1tuYW1lXS5maWx0ZXIoZSk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxucmVnaXN0ZXIoJ2xlZnQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMSAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcignbWlkZGxlLWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDIgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ3JpZ2h0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDMgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxyXG4gICAgaGFuZGxlcnM6IGhhbmRsZXJzXHJcbn07IiwidmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpLFxyXG4gICAgZXhpc3RzICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBtYXRjaGVzICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIGRlbGVnYXRlcyA9IHt9O1xyXG5cclxuLy8gdGhpcyBtZXRob2QgY2FjaGVzIGRlbGVnYXRlcyBzbyB0aGF0IC5vZmYoKSB3b3JrcyBzZWFtbGVzc2x5XHJcbnZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHJvb3QsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKGRlbGVnYXRlc1tmbi5fZGRdKSB7IHJldHVybiBkZWxlZ2F0ZXNbZm4uX2RkXTsgfVxyXG5cclxuICAgIHZhciBpZCA9IGZuLl9kZCA9IERhdGUubm93KCk7XHJcbiAgICByZXR1cm4gZGVsZWdhdGVzW2lkXSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoZWwgJiYgZWwgIT09IHJvb3QpIHtcclxuICAgICAgICAgICAgaWYgKG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBldmVudGVkID0gZnVuY3Rpb24obWV0aG9kLCBlbCwgdHlwZSwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoIWV4aXN0cyhzZWxlY3RvcikpIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGZuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBkZWxlZ2F0ZShlbCwgc2VsZWN0b3IsIGZuKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuYWRkKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQucmVtb3ZlKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuZmFicmljYXRlKVxyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBkZWxlZ2F0ZSAgID0gcmVxdWlyZSgnLi9kZWxlZ2F0ZScpLFxyXG4gICAgY3VzdG9tICAgICA9IHJlcXVpcmUoJy4vY3VzdG9tJyk7XHJcblxyXG52YXIgZXZlbnRlciA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGVzLCBmaWx0ZXIsIGZuKSB7XHJcbiAgICAgICAgdmFyIHR5cGVsaXN0ID0gdHlwZXMuc3BsaXQoJyAnKTtcclxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XHJcbiAgICAgICAgICAgIGZuID0gZmlsdGVyO1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBfLmVhY2godHlwZWxpc3QsIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gY3VzdG9tLmhhbmRsZXJzW3R5cGVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgaGFuZGxlci5ldmVudCwgZmlsdGVyLCBoYW5kbGVyLndyYXAoZm4pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIHR5cGUsIGZpbHRlciwgZm4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vbiksXHJcbiAgICBvZmY6ICAgICBldmVudGVyKGRlbGVnYXRlLm9mZiksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVyKGRlbGVnYXRlLnRyaWdnZXIpXHJcbn07IiwidmFyIF8gICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzSHRtbCAgICAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTm9kZUxpc3QgICAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzTnVtYmVyICAgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBvcmRlciAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBkYXRhICAgICAgICAgICA9IHJlcXVpcmUoJy4vZGF0YScpLFxyXG4gICAgcGFyc2VyICAgICAgICAgPSByZXF1aXJlKCdwYXJzZXInKTtcclxuXHJcbnZhciBwYXJlbnRMb29wID0gZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihlbGVtcykge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gZWxlbXNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0gJiYgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGVsZW0sIHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGVsZW1zO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciByZW1vdmUgPSBwYXJlbnRMb29wKGZ1bmN0aW9uKGVsZW0sIHBhcmVudCkge1xyXG4gICAgICAgIGRhdGEucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRldGFjaCA9IHBhcmVudExvb3AoZnVuY3Rpb24oZWxlbSwgcGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgfSksXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnbWVudCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSAnJyArIHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHBhcnNlcihlbGVtKSwgcGVuZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgc3RyaW5nVG9GcmFnbWVudChyZXN1bHQpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0VsZW1lbnQocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHJlc3VsdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkgPSBmdW5jdGlvbihhcnJPbmUsIGFyclR3bywgcGVuZGVyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyck9uZS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIGkgPSAwLCBsZW4gPSBhcnJUd28ubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoYXJyT25lW2lkeF0sIGFyclR3b1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5ID0gZnVuY3Rpb24oYXJyLCBlbGVtLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihhcnJFbGVtLCBlbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0gPSBmdW5jdGlvbihlbGVtLCBhcnIsIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGVsZW0sIGFyckVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgIH0sXHJcbiAgICBwcmVwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuaW5zZXJ0QmVmb3JlKGVsZW0sIGJhc2UuZmlyc3RDaGlsZCk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gXy5mYXN0bWFwKHRoaXMuc2xpY2UoKSwgKGVsZW0pID0+IGVsZW0uY2xvbmVOb2RlKHRydWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZ21lbnQodmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIGFwcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgaW5zZXJ0QmVmb3JlOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRhcmdldCwgZWxlbS5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0Lm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbnNlcnRBZnRlcjogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICBEKG9iaikuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnbWVudCh2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcHJlcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgRChkKS5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGVsZW1zID0gdGhpcyxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IGVsZW1zW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0KCkuY29uY2F0KFxyXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nXHJcbiAgICAgICAgICAgICAgICBpc1N0cmluZyhzZWxlY3RvcikgPyBEKHNlbGVjdG9yKS5nZXQoKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAgICBpc0NvbGxlY3Rpb24oc2VsZWN0b3IpID8gXy50b0FycmF5KHNlbGVjdG9yKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikgfHwgaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IFtdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmVtb3ZlKHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gcmVtb3ZlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZXRhY2g6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBkZXRhY2goc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGV0YWNoKHRoaXMpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ2lzL25vZGVOYW1lJyksXHJcbiAgICBET0NfRUxFTSAgID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxudmFyIGdldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHJlY3QgPSBpc0F0dGFjaGVkKGVsZW0pID8gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiAgKHJlY3QudG9wICArIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSAgfHwgMCxcclxuICAgICAgICBsZWZ0OiAocmVjdC5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IGdldE9mZnNldChlbGVtKSxcclxuICAgICAgICBjdXJDU1NUb3AgICAgICAgICA9IGVsZW0uc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gZWxlbS5zdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBlbGVtLnN0eWxlLnRvcCAgPSBfLnRvUHgocHJvcHMudG9wKTtcclxuICAgIGVsZW0uc3R5bGUubGVmdCA9IF8udG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXQ6IGZ1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB8fCBpc09iamVjdChwb3NPckl0ZXJhdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+IHNldE9mZnNldChlbGVtLCBpZHgsIHBvc09ySXRlcmF0b3IpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldFBhcmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8ubWFwKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBlbGVtLm9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghaXNOb2RlTmFtZShvZmZzZXRQYXJlbnQsICdodG1sJykgJiYgKG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJykgPT09ICdzdGF0aWMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgc3BsaXQgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgbm9kZVR5cGUgICA9IHJlcXVpcmUoJ25vZGVUeXBlJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBwcm9wRml4ID0gc3BsaXQoJ3RhYkluZGV4fHJlYWRPbmx5fGNsYXNzTmFtZXxtYXhMZW5ndGh8Y2VsbFNwYWNpbmd8Y2VsbFBhZGRpbmd8cm93U3Bhbnxjb2xTcGFufHVzZU1hcHxmcmFtZUJvcmRlcnxjb250ZW50RWRpdGFibGUnKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cikge1xyXG4gICAgICAgIG9ialtzdHIudG9Mb3dlckNhc2UoKV0gPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHtcclxuICAgICAgICAnZm9yJzogICAnaHRtbEZvcicsXHJcbiAgICAgICAgJ2NsYXNzJzogJ2NsYXNzTmFtZSdcclxuICAgIH0pO1xyXG5cclxudmFyIHByb3BIb29rcyA9IHtcclxuICAgIHNyYzogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhyZWY6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnaHJlZicsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3VwcG9ydDogU2FmYXJpLCBJRTkrXHJcbiAgICAvLyBtaXMtcmVwb3J0cyB0aGUgZGVmYXVsdCBzZWxlY3RlZCBwcm9wZXJ0eSBvZiBhbiBvcHRpb25cclxuICAgIC8vIEFjY2Vzc2luZyB0aGUgcGFyZW50J3Mgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBmaXhlcyBpdFxyXG4gICAgc2VsZWN0ZWQ6IFNVUFBPUlRTLm9wdFNlbGVjdGVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgICAgICBmaXg7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQuc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBhbHNvIHdvcmtzIHdpdGggb3B0Z3JvdXBzLCBzZWUgIzU3MDFcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5wYXJlbnROb2RlLnNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0YWJJbmRleDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBlbGVtLnRhYkluZGV4IGRvZXNuJ3QgYWx3YXlzIHJldHVybiB0aGUgY29ycmVjdCB2YWx1ZSB3aGVuIGl0IGhhc24ndCBiZWVuIGV4cGxpY2l0bHkgc2V0XHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9mbHVpZHByb2plY3Qub3JnL2Jsb2cvMjAwOC8wMS8wOS9nZXR0aW5nLXNldHRpbmctYW5kLXJlbW92aW5nLXRhYmluZGV4LXZhbHVlcy13aXRoLWphdmFzY3JpcHQvXHJcbiAgICAgICAgICAgIC8vIFVzZSBwcm9wZXIgYXR0cmlidXRlIHJldHJpZXZhbCgjMTIwNzIpXHJcbiAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhYmluZGV4KSB7IHJldHVybiBfLnBhcnNlSW50KHRhYmluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChSRUdFWC5pc0ZvY3VzYWJsZShub2RlTmFtZSkgfHwgKFJFR0VYLmlzQ2xpY2thYmxlKG5vZGVOYW1lKSAmJiBlbGVtLmhyZWYpKSA/IDAgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0T3JTZXRQcm9wID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIC8vIGRvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcclxuICAgIGlmICghZWxlbSB8fCBub2RlVHlwZS50ZXh0KGVsZW0pIHx8IG5vZGVUeXBlLmNvbW1lbnQoZWxlbSkgfHwgbm9kZVR5cGUuYXR0cihlbGVtKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3JTZXRQcm9wKGZpcnN0LCBwcm9wKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVQcm9wOiBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgZXhpc3RzICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBjb2VyY2VOdW0gPSAodmFsdWUpID0+XHJcbiAgICAvLyBJdHMgYSBudW1iZXIhIHx8IDAgdG8gYXZvaWQgTmFOIChhcyBOYU4ncyBhIG51bWJlcilcclxuICAgICt2YWx1ZSA9PT0gdmFsdWUgPyAodmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gQXZvaWQgTmFOIGFnYWluXHJcbiAgICBpc1N0cmluZyh2YWx1ZSkgPyAoK3ZhbHVlIHx8IDApIDpcclxuICAgIC8vIERlZmF1bHQgdG8gemVyb1xyXG4gICAgMDtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxMZWZ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbFRvcCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0cyA9IHRoaXMuZmluZCh0YXJnZXQpLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIGlzLm5vdCh0aGlzKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+ICFfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gIT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBEKCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY2hlY2tlciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+IGNoZWNrZXIuY2FsbChlbGVtLCBlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIG5vZGVUeXBlICAgICAgICAgID0gcmVxdWlyZSgnbm9kZVR5cGUnKSxcclxuICAgIGV4aXN0cyAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNEICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBvcmRlciAgICAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBzZWxlY3RvckZpbHRlciAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgRml6emxlICAgICAgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBnZXRTaWJsaW5ncyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gX2dldE5vZGVTaWJsaW5ncyhjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2licy5sZW5ndGgpIHsgcmVzdWx0LnB1c2goc2licyk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Tm9kZVNpYmxpbmdzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaWJzID0gXy50b0FycmF5KHBhcmVudC5jaGlsZHJlbiksXHJcbiAgICAgICAgICAgIGlkeCAgPSBzaWJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGUgdGhlIG5vZGUgaXRzZWxmIGZyb20gdGhlIGxpc3Qgb2YgaXRzIHBhcmVudCdzIGNoaWxkcmVuXHJcbiAgICAgICAgICAgIGlmIChzaWJzW2lkeF0gPT09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHNpYnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaWJzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDaGlsZHJlbiAtLS0tLS1cclxuICAgIGdldENoaWxkcmVuID0gKGFycikgPT4gXy5mbGF0dGVuKF8ubWFwKGFyciwgX2NoaWxkcmVuKSksXHJcbiAgICBfY2hpbGRyZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGtpZHMgPSBlbGVtLmNoaWxkcmVuLFxyXG4gICAgICAgICAgICBpZHggID0gMCwgbGVuICA9IGtpZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgID0gbmV3IEFycmF5KGxlbik7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBraWRzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudHMgLS0tLS0tXHJcbiAgICBnZXRDbG9zZXN0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgY2xvc2VzdCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShlbGVtc1tpZHhdLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGVsZW1zW2lkeF0pO1xyXG4gICAgICAgICAgICBjbG9zZXN0ID0gc2VsZWN0b3JGaWx0ZXIocGFyZW50cywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2xvc2VzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNsb3Nlc3RbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50c1VudGlsID0gZnVuY3Rpb24oZCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGRbaWR4XSwgbnVsbCwgc3RvcFNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgX2dldE5vZGVQYXJlbnQgPSAobm9kZSkgPT4gbm9kZSAmJiBub2RlLnBhcmVudE5vZGUsXHJcblxyXG4gICAgX2NyYXdsVXBOb2RlID0gZnVuY3Rpb24obm9kZSwgY29udGV4dCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlO1xyXG5cclxuICAgICAgICB3aGlsZSAoKHBhcmVudCAgID0gX2dldE5vZGVQYXJlbnQocGFyZW50KSkgICAmJlxyXG4gICAgICAgICAgICAgICAhbm9kZVR5cGUuZG9jKHBhcmVudCkgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKHBhcmVudCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudCAtLS0tLS1cclxuICAgIGdldFBhcmVudCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBfZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgX3ByZXZOZXh0Q3Jhd2wgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kXSkgJiYgIW5vZGVUeXBlLmVsZW0oY3VycmVudCkpIHt9XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50OyAgICBcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGdldFByZXYgPSBfcHJldk5leHRDcmF3bCgncHJldmlvdXNTaWJsaW5nJyksXHJcbiAgICBnZXROZXh0ID0gX3ByZXZOZXh0Q3Jhd2woJ25leHRTaWJsaW5nJyksXHJcblxyXG4gICAgX3ByZXZOZXh0Q3Jhd2xBbGwgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ICA9IFtdLFxyXG4gICAgICAgICAgICAgICAgY3VycmVudCA9IG5vZGU7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kXSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlVHlwZS5lbGVtKGN1cnJlbnQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIGdldFByZXZBbGwgPSBfcHJldk5leHRDcmF3bEFsbCgncHJldmlvdXNTaWJsaW5nJyksXHJcbiAgICBnZXROZXh0QWxsID0gX3ByZXZOZXh0Q3Jhd2xBbGwoJ25leHRTaWJsaW5nJyksXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsQWxsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGZpbHRlcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHsgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZyk7IH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJsaW5ncyA9IF8uZmlsdGVyKHNpYmxpbmdzLCBmaWx0ZXIgfHwgZXhpc3RzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxVbnRpbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBpdGVyYXRvcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gZnVuY3Rpb24oc2libGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBpcy5tYXRjaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNNYXRjaDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goc2libGluZ3MsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHJldmVyc2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdW5pcXVlKGVsZW1zKTtcclxuICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEQocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KHNlbGVjdG9yRmlsdGVyKGVsZW1zLCBzZWxlY3RvciksIHJldmVyc2UpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBjb250ZW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgIF8ucGx1Y2sodGhpcywgJ2NoaWxkTm9kZXMnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIHJldHVybiBEKHNlbGVjdG9yKS5pbmRleE9mKGZpcnN0KTsgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3RvclswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFjayAgICAgICAgXHJcbiAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGZpcnN0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlzQXR0YWNoZWQgY2hlY2sgdG8gcGFzcyB0ZXN0IFwiTm9kZSB3aXRob3V0IHBhcmVudCByZXR1cm5zIC0xXCJcclxuICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IG5vZGVUeXBlLmRvY19mcmFnKHBhcmVudCk7XHJcblxyXG4gICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIG5vZGVUeXBlLmVsZW0pO1xyXG5cclxuICAgICAgICByZXR1cm4gW10uaW5kZXhPZi5jYWxsKGNoaWxkRWxlbXMsIGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgbmV3bGluZXMgICA9IHJlcXVpcmUoJ3V0aWwvbmV3bGluZXMnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOdW1iZXIgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnaXMvbm9kZU5hbWUnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbTtcclxuXHJcbnZhciBub3JtYWxOb2RlTmFtZSA9IChlbGVtKSA9PiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCksXHJcblxyXG4gICAgb3V0ZXJIdG1sID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID8gdGhpc1swXS5vdXRlckhUTUwgOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0R2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtKSA9PiBlbGVtLnRleHRDb250ZW50IDpcclxuICAgICAgICAgICAgKGVsZW0pID0+IGVsZW0uaW5uZXJUZXh0LFxyXG5cclxuICAgIHRleHRTZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS50ZXh0Q29udGVudCA9IHN0ciA6XHJcbiAgICAgICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0uaW5uZXJUZXh0ID0gc3RyO1xyXG5cclxudmFyIHZhbEhvb2tzID0ge1xyXG4gICAgb3B0aW9uOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgcmV0dXJuIChleGlzdHModmFsKSA/IHZhbCA6IHRleHRHZXQoZWxlbSkpLnRyaW0oKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBpbmRleCAgID0gZWxlbS5zZWxlY3RlZEluZGV4LFxyXG4gICAgICAgICAgICAgICAgb25lICAgICA9IGVsZW0udHlwZSA9PT0gJ3NlbGVjdC1vbmUnIHx8IGluZGV4IDwgMCxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBvbmUgPyBudWxsIDogW10sXHJcbiAgICAgICAgICAgICAgICBtYXggICAgID0gb25lID8gaW5kZXggKyAxIDogb3B0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gaW5kZXggPCAwID8gbWF4IDogKG9uZSA/IGluZGV4IDogMCk7XHJcblxyXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHRoZSBzZWxlY3RlZCBvcHRpb25zXHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBtYXg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogSUU2LTggYnVnLiByZW1vdmVcclxuICAgICAgICAgICAgICAgIC8vIG9sZElFIGRvZXNuJ3QgdXBkYXRlIHNlbGVjdGVkIGFmdGVyIGZvcm0gcmVzZXQgKCMyNTUxKVxyXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb24uc2VsZWN0ZWQgfHwgaWR4ID09PSBpbmRleCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgcmV0dXJuIG9wdGlvbnMgdGhhdCBhcmUgZGlzYWJsZWQgb3IgaW4gYSBkaXNhYmxlZCBvcHRncm91cFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoU1VQUE9SVFMub3B0RGlzYWJsZWQgPyAhb3B0aW9uLmRpc2FibGVkIDogb3B0aW9uLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fCAhaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcclxuICAgICAgICAgICAgICAgICAgICBpZiAob25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9wdGlvblNldCwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBfLm1ha2VBcnJheSh2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gb3B0aW9ucy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh2YWx1ZXMsIHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBvcHRpb25TZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYnJvd3NlcnMgdG8gYmVoYXZlIGNvbnNpc3RlbnRseSB3aGVuIG5vbi1tYXRjaGluZyB2YWx1ZSBpcyBzZXRcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25TZXQpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIFJhZGlvIGFuZCBjaGVja2JveCBnZXR0ZXIgZm9yIFdlYmtpdFxyXG5pZiAoIVNVUFBPUlRTLmNoZWNrT24pIHtcclxuICAgIF8uZWFjaChbJ3JhZGlvJywgJ2NoZWNrYm94J10sIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICB2YWxIb29rc1t0eXBlXSA9IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0OiBXZWJraXQgLSAnJyBpcyByZXR1cm5lZCBpbnN0ZWFkIG9mICdvbicgaWYgYSB2YWx1ZSBpc24ndCBzcGVjaWZpZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKSA9PT0gbnVsbCA/ICdvbicgOiBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgZ2V0VmFsID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5vZGVOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suZ2V0KSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2suZ2V0KGVsZW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzU3RyaW5nKHZhbCkgPyBuZXdsaW5lcyh2YWwpIDogdmFsO1xyXG59O1xyXG5cclxudmFyIHN0cmluZ2lmeSA9ICh2YWx1ZSkgPT5cclxuICAgICFleGlzdHModmFsdWUpID8gJycgOiAodmFsdWUgKyAnJyk7XHJcblxyXG52YXIgc2V0VmFsID0gZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAvLyBTdHJpbmdpZnkgdmFsdWVzXHJcbiAgICB2YXIgdmFsdWUgPSBpc0FycmF5KHZhbCkgPyBfLm1hcCh2YWwsIHN0cmluZ2lmeSkgOiBzdHJpbmdpZnkodmFsKTtcclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTm9kZU5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5zZXQpIHtcclxuICAgICAgICBob29rLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvdXRlckh0bWw6IG91dGVySHRtbCxcclxuICAgIG91dGVySFRNTDogb3V0ZXJIdG1sLFxyXG5cclxuICAgIGh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoaHRtbCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZWxlbS5pbm5lckhUTUwgPSBodG1sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IGh0bWw7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICByZXR1cm4gKCFmaXJzdCkgPyB1bmRlZmluZWQgOiBmaXJzdC5pbm5lckhUTUw7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAvLyBnZXR0ZXJcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgJycpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBnZXRWYWwoZWxlbSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFZhbChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0dGVyc1xyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzdHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHRleHRTZXQoZWxlbSwgc3RyKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzdHIpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHN0cjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgdGV4dEdldChlbGVtKSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAodGhpcywgKGVsZW0pID0+IHRleHRHZXQoZWxlbSkpLmpvaW4oJycpO1xyXG4gICAgfVxyXG59OyIsInZhciBpcyA9IGZ1bmN0aW9uKHgpIHtcclxuICAgIHJldHVybiAoZWxlbSkgPT4gZWxlbSAmJiBlbGVtLm5vZGVUeXBlID09PSB4O1xyXG59O1xyXG5cclxuLy8gY29tbWVudGVkLW91dCBtZXRob2RzIGFyZSBub3QgYmVpbmcgdXNlZFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGVsZW06IGlzKDEpLFxyXG4gICAgYXR0cjogaXMoMiksXHJcbiAgICB0ZXh0OiBpcygzKSxcclxuICAgIC8vIGNkYXRhOiBpcyg0KSxcclxuICAgIC8vIGVudGl0eV9yZWZlcmVuY2U6IGlzKDUpLFxyXG4gICAgLy8gZW50aXR5OiBpcyg2KSxcclxuICAgIC8vIHByb2Nlc3NpbmdfaW5zdHJ1Y3Rpb246IGlzKDcpLFxyXG4gICAgY29tbWVudDogaXMoOCksXHJcbiAgICBkb2M6IGlzKDkpLFxyXG4gICAgLy8gZG9jdW1lbnRfdHlwZTogaXMoMTApLFxyXG4gICAgZG9jX2ZyYWc6IGlzKDExKVxyXG4gICAgLy8gbm90YXRpb246IGlzKDEyKSxcclxufTsiLCJ2YXIgcmVhZHkgPSBmYWxzZSxcclxuICAgIHJlZ2lzdHJhdGlvbiA9IFtdO1xyXG5cclxudmFyIHdhaXQgPSBmdW5jdGlvbihmbikge1xyXG4gICAgLy8gQWxyZWFkeSBsb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgcmV0dXJuIGZuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhbmRhcmRzLWJhc2VkIGJyb3dzZXJzIHN1cHBvcnQgRE9NQ29udGVudExvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBJRSBldmVudCBtb2RlbCBpcyB1c2VkXHJcblxyXG4gICAgLy8gRW5zdXJlIGZpcmluZyBiZWZvcmUgb25sb2FkLCBtYXliZSBsYXRlIGJ1dCBzYWZlIGFsc28gZm9yIGlmcmFtZXNcclxuICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykgeyBmbigpOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBIGZhbGxiYWNrIHRvIHdpbmRvdy5vbmxvYWQsIHRoYXQgd2lsbCBhbHdheXMgd29ya1xyXG4gICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmbik7XHJcbn07XHJcblxyXG53YWl0KGZ1bmN0aW9uKCkge1xyXG4gICAgcmVhZHkgPSB0cnVlO1xyXG5cclxuICAgIC8vIGNhbGwgcmVnaXN0ZXJlZCBtZXRob2RzICAgIFxyXG4gICAgd2hpbGUgKHJlZ2lzdHJhdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICByZWdpc3RyYXRpb24uc2hpZnQoKSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGNhbGxiYWNrKSA9PlxyXG4gICAgcmVhZHkgPyBjYWxsYmFjaygpIDogcmVnaXN0cmF0aW9uLnB1c2goY2FsbGJhY2spO1xyXG4iLCJ2YXIgaXNBdHRhY2hlZCAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ25vZGVUeXBlJykuZWxlbSxcclxuICAgIC8vIGh0dHA6Ly9lam9obi5vcmcvYmxvZy9jb21wYXJpbmctZG9jdW1lbnQtcG9zaXRpb24vXHJcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgQ09OVEFJTkVEX0JZID0gMTYsXHJcbiAgICBGT0xMT1dJTkcgICAgPSA0LFxyXG4gICAgRElTQ09OTkVDVEVEID0gMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIFBvc2l0aW9uIC0gTUlUIExpY2Vuc2VkLCBKb2huIFJlc2lnXHJcbnZhciBjb21wYXJlUG9zaXRpb24gPSAobm9kZTEsIG5vZGUyKSA9PlxyXG4gICAgICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cclxuICAgICAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihub2RlMikgOlxyXG4gICAgICAgIDAsXHJcbiAgICBcclxuICAgIGlzID0gKHJlbCwgZmxhZykgPT4gKHJlbCAmIGZsYWcpID09PSBmbGFnLFxyXG5cclxuICAgIGlzTm9kZSA9IChiLCBmbGFnLCBhKSA9PiBpcyhjb21wYXJlUG9zaXRpb24oYSwgYiksIGZsYWcpLFxyXG5cclxuICAgIGhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxudmFyIHNvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgIC8vIEZsYWcgZm9yIGR1cGxpY2F0ZSByZW1vdmFsXHJcbiAgICBpZiAobm9kZTEgPT09IG5vZGUyKSB7XHJcbiAgICAgICAgaGFzRHVwbGljYXRlID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTb3J0IG9uIG1ldGhvZCBleGlzdGVuY2UgaWYgb25seSBvbmUgaW5wdXQgaGFzIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICB2YXIgcmVsID0gIW5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIC0gIW5vZGUyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xyXG4gICAgaWYgKHJlbCkge1xyXG4gICAgICAgIHJldHVybiByZWw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm9kZXMgc2hhcmUgdGhlIHNhbWUgZG9jdW1lbnRcclxuICAgIGlmICgobm9kZTEub3duZXJEb2N1bWVudCB8fCBub2RlMSkgPT09IChub2RlMi5vd25lckRvY3VtZW50IHx8IG5vZGUyKSkge1xyXG4gICAgICAgIHJlbCA9IGNvbXBhcmVQb3NpdGlvbihub2RlMSwgbm9kZTIpO1xyXG4gICAgfVxyXG4gICAgLy8gT3RoZXJ3aXNlIHdlIGtub3cgdGhleSBhcmUgZGlzY29ubmVjdGVkXHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZWwgPSBESVNDT05ORUNURUQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm90IGRpcmVjdGx5IGNvbXBhcmFibGVcclxuICAgIGlmICghcmVsKSB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICBpZiAoaXMocmVsLCBESVNDT05ORUNURUQpKSB7XHJcbiAgICAgICAgdmFyIGlzTm9kZTFEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMSk7XHJcbiAgICAgICAgdmFyIGlzTm9kZTJEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgIGlmIChpc05vZGUxRGlzY29ubmVjdGVkICYmIGlzTm9kZTJEaXNjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaXNOb2RlMkRpc2Nvbm5lY3RlZCA/IC0xIDogMTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXMocmVsLCBGT0xMT1dJTkcpID8gLTEgOiAxO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnRzIGFuIGFycmF5IG9mIEQgZWxlbWVudHMgaW4tcGxhY2UgKGkuZS4sIG11dGF0ZXMgdGhlIG9yaWdpbmFsIGFycmF5KVxyXG4gKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcGFyYW0ge0VsZW1lbnRbXX0gYXJyYXkgICAgICAgICAgQXJyYXkgb2YgRCBlbGVtZW50cy5cclxuICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQsIG90aGVyd2lzZSBmYWxzZS5cclxuICogQHNlZSBqUXVlcnkgc3JjL3NlbGVjdG9yLW5hdGl2ZS5qczozN1xyXG4gKi9cclxuZXhwb3J0cy5zb3J0ID0gZnVuY3Rpb24oYXJyYXksIHJldmVyc2UpIHtcclxuICAgIGhhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG4gICAgYXJyYXkuc29ydChzb3J0KTtcclxuICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgYXJyYXkucmV2ZXJzZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhhc0R1cGxpY2F0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmAuXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gYSBEIGVsZW1lbnQgbm9kZVxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGIgRCBlbGVtZW50IG5vZGVcclxuICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmA7IG90aGVyd2lzZSBmYWxzZS5cclxuICovXHJcbmV4cG9ydHMuY29udGFpbnMgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICB2YXIgYlVwID0gaXNBdHRhY2hlZChiKSA/IGIucGFyZW50Tm9kZSA6IG51bGw7XHJcblxyXG4gICAgaWYgKGEgPT09IGJVcCkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpc0VsZW1lbnQoYlVwKSkge1xyXG4gICAgICAgIC8vIE1vZGVybiBicm93c2VycyAoSUU5KylcclxuICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNOb2RlKGJVcCwgQ09OVEFJTkVEX0JZLCBhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG4iLCJ2YXIgUkVHRVggPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgTUFYX1NJTkdMRV9UQUdfTEVOR1RIID0gMzAsXHJcbiAgICBjcmVhdGUgPSByZXF1aXJlKCdESVYvY3JlYXRlJyk7XHJcblxyXG52YXIgcGFyc2VTdHJpbmcgPSBmdW5jdGlvbihwYXJlbnRUYWdOYW1lLCBodG1sU3RyKSB7XHJcbiAgICB2YXIgcGFyZW50ID0gY3JlYXRlKHBhcmVudFRhZ05hbWUpO1xyXG4gICAgcGFyZW50LmlubmVySFRNTCA9IGh0bWxTdHI7XHJcbiAgICByZXR1cm4gcGFyZW50O1xyXG59O1xyXG5cclxudmFyIHBhcnNlU2luZ2xlVGFnID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgaWYgKGh0bWxTdHIubGVuZ3RoID4gTUFYX1NJTkdMRV9UQUdfTEVOR1RIKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIHNpbmdsZVRhZ01hdGNoID0gUkVHRVguc2luZ2xlVGFnTWF0Y2goaHRtbFN0cik7XHJcbiAgICByZXR1cm4gc2luZ2xlVGFnTWF0Y2ggPyBbY3JlYXRlKHNpbmdsZVRhZ01hdGNoWzFdKV0gOiBudWxsO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICB2YXIgc2luZ2xlVGFnID0gcGFyc2VTaW5nbGVUYWcoaHRtbFN0cik7XHJcbiAgICBpZiAoc2luZ2xlVGFnKSB7IHJldHVybiBzaW5nbGVUYWc7IH1cclxuXHJcbiAgICB2YXIgcGFyZW50VGFnTmFtZSA9IFJFR0VYLmdldFBhcmVudFRhZ05hbWUoaHRtbFN0ciksXHJcbiAgICAgICAgcGFyZW50ICAgICAgICA9IHBhcnNlU3RyaW5nKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpO1xyXG5cclxuICAgIHZhciBjaGlsZCxcclxuICAgICAgICBpZHggPSBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgICAgIGFyciA9IG5ldyBBcnJheShpZHgpO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2hpbGRyZW5baWR4XTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIGFycltpZHhdID0gY2hpbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyZW50ID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnLi9EJyksXHJcbiAgICBwYXJzZXIgICAgID0gcmVxdWlyZSgncGFyc2VyJyksXHJcbiAgICBGaXp6bGUgICAgID0gcmVxdWlyZSgnRml6emxlJyksXHJcbiAgICBkYXRhICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9kYXRhJyk7XHJcblxyXG52YXIgcGFyc2VIdG1sID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICBpZiAoIXN0cikgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgdmFyIHJlc3VsdCA9IHBhcnNlcihzdHIpO1xyXG4gICAgcmV0dXJuIHJlc3VsdCAmJiByZXN1bHQubGVuZ3RoID8gRChyZXN1bHQpIDogbnVsbDtcclxufTtcclxuXHJcbl8uZXh0ZW5kKEQsXHJcbiAgICBkYXRhLkQsXHJcbntcclxuICAgIC8vIEJlY2F1c2Ugbm8gb25lIGtub3cgd2hhdCB0aGUgY2FzZSBzaG91bGQgYmVcclxuICAgIHBhcnNlSHRtbDogcGFyc2VIdG1sLFxyXG4gICAgcGFyc2VIVE1MOiBwYXJzZUh0bWwsXHJcblxyXG4gICAgLy8gZXhwb3NlIHRoZSBzZWxlY3RvciBlbmdpbmUgZm9yIGRlYnVnZ2luZ1xyXG4gICAgRml6emxlOiAgRml6emxlLFxyXG5cclxuICAgIGVhY2g6ICAgIF8uanFFYWNoLFxyXG4gICAgZm9yRWFjaDogXy5kRWFjaCxcclxuXHJcbiAgICBtYXA6ICAgICBfLm1hcCxcclxuICAgIGV4dGVuZDogIF8uZXh0ZW5kLFxyXG5cclxuICAgIG1vcmVDb25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmpRdWVyeSA9IHdpbmRvdy5aZXB0byA9IHdpbmRvdy4kID0gRDtcclxuICAgIH1cclxufSk7XHJcbiIsInZhciBfICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgID0gcmVxdWlyZSgnLi9EJyksXHJcbiAgICBzcGxpdCAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIGFycmF5ICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hcnJheScpLFxyXG4gICAgc2VsZWN0b3JzICAgPSByZXF1aXJlKCdtb2R1bGVzL3NlbGVjdG9ycycpLFxyXG4gICAgdHJhbnN2ZXJzYWwgPSByZXF1aXJlKCdtb2R1bGVzL3RyYW5zdmVyc2FsJyksXHJcbiAgICBkaW1lbnNpb25zICA9IHJlcXVpcmUoJ21vZHVsZXMvZGltZW5zaW9ucycpLFxyXG4gICAgbWFuaXAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL21hbmlwJyksXHJcbiAgICBjc3MgICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY3NzJyksXHJcbiAgICBhdHRyICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXR0cicpLFxyXG4gICAgcHJvcCAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Byb3AnKSxcclxuICAgIHZhbCAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy92YWwnKSxcclxuICAgIHBvc2l0aW9uICAgID0gcmVxdWlyZSgnbW9kdWxlcy9wb3NpdGlvbicpLFxyXG4gICAgY2xhc3NlcyAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2NsYXNzZXMnKSxcclxuICAgIHNjcm9sbCAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9zY3JvbGwnKSxcclxuICAgIGRhdGEgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9kYXRhJyksXHJcbiAgICBldmVudHMgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZXZlbnRzJyk7XHJcblxyXG52YXIgYXJyYXlQcm90byA9IHNwbGl0KCdsZW5ndGh8dG9TdHJpbmd8dG9Mb2NhbGVTdHJpbmd8am9pbnxwb3B8cHVzaHxjb25jYXR8cmV2ZXJzZXxzaGlmdHx1bnNoaWZ0fHNsaWNlfHNwbGljZXxzb3J0fHNvbWV8ZXZlcnl8aW5kZXhPZnxsYXN0SW5kZXhPZnxyZWR1Y2V8cmVkdWNlUmlnaHR8bWFwfGZpbHRlcicpXHJcbiAgICAucmVkdWNlKGZ1bmN0aW9uKG9iaiwga2V5KSB7XHJcbiAgICAgICAgb2JqW2tleV0gPSBBcnJheS5wcm90b3R5cGVba2V5XTtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSwge30pO1xyXG5cclxuLy8gRXhwb3NlIHRoZSBwcm90b3R5cGUgc28gdGhhdFxyXG4vLyBpdCBjYW4gYmUgaG9va2VkIGludG8gZm9yIHBsdWdpbnNcclxuRC5mbiA9IEQucHJvdG90eXBlO1xyXG5cclxuXy5leHRlbmQoXHJcbiAgICBELmZuLFxyXG4gICAgeyBjb25zdHJ1Y3RvcjogRCwgfSxcclxuICAgIGFycmF5UHJvdG8sXHJcbiAgICBhcnJheS5mbixcclxuICAgIHNlbGVjdG9ycy5mbixcclxuICAgIHRyYW5zdmVyc2FsLmZuLFxyXG4gICAgbWFuaXAuZm4sXHJcbiAgICBkaW1lbnNpb25zLmZuLFxyXG4gICAgY3NzLmZuLFxyXG4gICAgYXR0ci5mbixcclxuICAgIHByb3AuZm4sXHJcbiAgICB2YWwuZm4sXHJcbiAgICBjbGFzc2VzLmZuLFxyXG4gICAgcG9zaXRpb24uZm4sXHJcbiAgICBzY3JvbGwuZm4sXHJcbiAgICBkYXRhLmZuLFxyXG4gICAgZXZlbnRzLmZuXHJcbik7XHJcbiIsInZhciBTVVBQT1JUUyA9IHJlcXVpcmUoJ1NVUFBPUlRTJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNVUFBPUlRTLnZhbHVlTm9ybWFsaXplZCA/XHJcbiAgICAoc3RyKSA9PiBzdHIgOlxyXG4gICAgKHN0cikgPT4gc3RyID8gc3RyLnJlcGxhY2UoL1xcclxcbi9nLCAnXFxuJykgOiBzdHI7IiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIC8vIEV4aXQgZWFybHkgZm9yIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAvLyBFbmQsIG5hdHVyYWxseSwgaGFzIHRvIGJlIGhpZ2hlciB0aGFuIDAgdG8gbWF0dGVyLFxyXG4gICAgLy8gc28gYSBzaW1wbGUgZXhpc3RlbmNlIGNoZWNrIHdpbGwgZG9cclxuICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgIHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQgfHwgMCk7XHJcbn07IiwiLy8gQnJlYWtzIGV2ZW4gb24gYXJyYXlzIHdpdGggMyBpdGVtcy4gMyBvciBtb3JlXHJcbi8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBkZWxpbWl0ZXIpID0+IHN0ci5zcGxpdChkZWxpbWl0ZXIgfHwgJ3wnKTtcclxuIiwidmFyIGlkID0gMDtcclxudmFyIHVuaXF1ZUlkID0gbW9kdWxlLmV4cG9ydHMgPSAoKSA9PiBpZCsrO1xyXG51bmlxdWVJZC5zZWVkID0gZnVuY3Rpb24oc2VlZGVkLCBwcmUpIHtcclxuICAgIHZhciBwcmVmaXggPSBwcmUgfHwgJycsXHJcbiAgICAgICAgc2VlZCA9IHNlZWRlZCB8fCAwO1xyXG4gICAgcmV0dXJuICgpID0+IHByZWZpeCArIHNlZWQrKztcclxufTsiXX0=
