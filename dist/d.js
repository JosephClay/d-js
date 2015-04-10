(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./D');
require('./props');
require('./proto');

},{"./D":3,"./props":64,"./proto":65}],2:[function(require,module,exports){
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
    isArray = require('is/array'),
    isHtml = require('is/html'),
    isString = require('is/string'),
    isNodeList = require('is/nodeList'),
    isFunction = require('is/function'),
    isD = require('is/d'),
    parser = require('parser'),
    onready = require('modules/onready'),
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

},{"Fizzle":9,"_":22,"is/array":24,"is/d":29,"is/function":33,"is/html":34,"is/nodeList":35,"is/string":39,"modules/onready":52,"parser":63}],4:[function(require,module,exports){
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

},{"_":22}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"REGEX":20,"cache":23,"is/element":31,"is/exists":32,"is/nodeList":35,"matchesSelector":41,"util/uniqueId":74}],9:[function(require,module,exports){
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

},{"./constructs/Is":6,"./constructs/Query":7,"./constructs/Selector":8,"./selector/selector-normalize":12,"./selector/selector-parse":13,"_":22,"cache":23}],10:[function(require,module,exports){
'use strict';

module.exports = {
	':child-at': ':nth-child(x)',
	':child-gt': ':nth-child(n+x)',
	':child-lt': ':nth-child(~n+x)'
};

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{"./capture":10,"./proxy":11,"SUPPORTS":21,"cache":23}],13:[function(require,module,exports){
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

},{"cache":23}],14:[function(require,module,exports){
"use strict";

module.exports = 2;

},{}],15:[function(require,module,exports){
"use strict";

module.exports = 8;

},{}],16:[function(require,module,exports){
"use strict";

module.exports = 9;

},{}],17:[function(require,module,exports){
"use strict";

module.exports = 11;

},{}],18:[function(require,module,exports){
"use strict";

module.exports = 1;

},{}],19:[function(require,module,exports){
"use strict";

module.exports = 3;

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
'use strict';

var DIV = require('DIV'),
    create = require('DIV/create'),
    a = DIV.querySelector('a'),
    select = create('select'),
    option = select.appendChild(create('option'));

var test = function test(tagName, testFn) {
    // Avoid variable references to elements to prevent memory leaks in IE.
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
DIV = a = select = option = null;

},{"DIV":5,"DIV/create":4}],22:[function(require,module,exports){
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

},{"is/array":24,"is/arrayLike":25,"is/exists":32,"is/nodeList":35,"util/slice":71}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
"use strict";

module.exports = Array.isArray;

},{}],25:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && +value.length === value.length;
};

},{}],26:[function(require,module,exports){
'use strict';

var DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT');

module.exports = function (elem) {
    return elem && elem.ownerDocument && elem !== document && elem.parentNode && elem.parentNode.nodeType !== DOCUMENT_FRAGMENT && elem.parentNode.isParseHtmlFragment !== true;
};

},{"NODE_TYPE/DOCUMENT_FRAGMENT":17}],27:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value === true || value === false;
};

},{}],28:[function(require,module,exports){
'use strict';

var isArray = require('is/array'),
    isNodeList = require('is/nodeList'),
    isD = require('is/d');

module.exports = function (value) {
    return isD(value) || isArray(value) || isNodeList(value);
};

},{"is/array":24,"is/d":29,"is/nodeList":35}],29:[function(require,module,exports){
"use strict";

var constructor;
module.exports = function (value) {
  return value && value instanceof constructor;
};
module.exports.set = function (D) {
  return constructor = D;
};

},{}],30:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === document;
};

},{}],31:[function(require,module,exports){
'use strict';

var isWindow = require('is/window'),
    ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (value) {
    return value && (value === document || isWindow(value) || value.nodeType === ELEMENT);
};

},{"NODE_TYPE/ELEMENT":18,"is/window":40}],32:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value !== undefined && value !== null;
};

},{}],33:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return value && typeof value === 'function';
};

},{}],34:[function(require,module,exports){
'use strict';

var isString = require('is/string');

module.exports = function (value) {
    if (!isString(value)) {
        return false;
    }

    var text = value.trim();
    return text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3;
};

},{"is/string":39}],35:[function(require,module,exports){
// NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
"use strict";

module.exports = function (value) {
    return value && (value instanceof NodeList || value instanceof HTMLCollection);
};

},{}],36:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'number';
};

},{}],37:[function(require,module,exports){
'use strict';

module.exports = function (value) {
    var type = typeof value;
    return type === 'function' || !!value && type === 'object';
};

},{}],38:[function(require,module,exports){
'use strict';

var isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('is/element'),
    isCollection = require('is/collection');

module.exports = function (val) {
    return val && (isString(val) || isFunction(val) || isElement(val) || isCollection(val));
};

},{"is/collection":28,"is/element":31,"is/function":33,"is/string":39}],39:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return typeof value === 'string';
};

},{}],40:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && value === value.window;
};

},{}],41:[function(require,module,exports){
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

},{"DIV":5,"NODE_TYPE/ELEMENT":18}],42:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('../D'),
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

},{"../D":3,"../order":62,"_":22,"is/exists":32,"util/slice":71}],43:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('node/isElement'),
    newlines = require('string/newlines'),
    SUPPORTS = require('SUPPORTS'),
    isNodeName = require('node/isName'),
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

},{"Fizzle":9,"SUPPORTS":21,"_":22,"cache":23,"is/exists":32,"is/function":33,"is/string":39,"node/isElement":59,"node/isName":60,"string/newlines":67}],44:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"_":22,"is/array":24,"is/string":39,"string/isEmpty":66,"string/split":68}],45:[function(require,module,exports){
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

},{"NODE_TYPE/DOCUMENT":16,"REGEX":20,"_":22,"is/array":24,"is/attached":26,"is/boolean":27,"is/document":30,"is/element":31,"is/exists":32,"is/number":36,"is/object":37,"is/string":39,"is/window":40,"util/parseInt":70,"util/split":72,"util/toPx":73}],46:[function(require,module,exports){
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

},{"cache":23,"is/array":24,"is/element":31,"is/string":39,"util/uniqueId":74}],47:[function(require,module,exports){
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

},{"./css":45,"is/number":36,"util/parseInt":70}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{"crossvent":2,"is/exists":32,"matchesSelector":41}],50:[function(require,module,exports){
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

},{"./custom":48,"./delegate":49,"_":22,"is/function":33}],51:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('../D'),
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
    parser = require('parser');

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
                appendPrependArrayToElem(elem, parser(elem), pender);
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
                    appendPrependMergeArray(this, parser(value), append);
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
                    appendPrependMergeArray(this, parser(value), prepend);
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

},{"../D":3,"../order":62,"./array":42,"./data":46,"./selectors":56,"_":22,"is/collection":28,"is/d":29,"is/document":30,"is/element":31,"is/exists":32,"is/function":33,"is/html":34,"is/nodeList":35,"is/number":36,"is/string":39,"is/window":40,"parser":63}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('../D'),
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

},{"../D":3,"_":22,"is/attached":26,"is/exists":32,"is/function":33,"is/object":37,"node/isName":60,"util/toPx":73}],54:[function(require,module,exports){
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

},{"NODE_TYPE/ATTRIBUTE":14,"NODE_TYPE/COMMENT":15,"NODE_TYPE/TEXT":19,"REGEX":20,"SUPPORTS":21,"_":22,"is/function":33,"is/string":39,"util/parseInt":70,"util/split":72}],55:[function(require,module,exports){
'use strict';

var coerceNum = require('util/coerceNum'),
    exists = require('is/exists');

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

module.exports = {
    fn: {
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
    }
};

},{"is/exists":32,"util/coerceNum":69}],56:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('../D'),
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

},{"../D":3,"../order":62,"./array":42,"Fizzle":9,"_":22,"is/array":24,"is/collection":28,"is/d":29,"is/element":31,"is/function":33,"is/nodeList":35,"is/selector":38,"is/string":39}],57:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('../D'),
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

},{"../D":3,"./array":42,"./selectors":56,"Fizzle":9,"NODE_TYPE/DOCUMENT":16,"NODE_TYPE/DOCUMENT_FRAGMENT":17,"NODE_TYPE/ELEMENT":18,"_":22,"is/attached":26,"is/d":29,"is/document":30,"is/element":31,"is/string":39,"is/window":40}],58:[function(require,module,exports){
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

},{"DIV":5,"NODE_TYPE/ELEMENT":18,"SUPPORTS":21,"_":22,"is/array":24,"is/exists":32,"is/function":33,"is/number":36,"is/string":39,"node/isName":60,"node/normalizeName":61,"string/newlines":67}],59:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (elem) {
        return elem && elem.nodeType === ELEMENT;
};

},{"NODE_TYPE/ELEMENT":18}],60:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};

},{}],61:[function(require,module,exports){
// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
"use strict";

module.exports = function (elem) {
  return elem.nodeName.toLowerCase();
};

},{}],62:[function(require,module,exports){
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
    // TODO: Address encapsulation
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

},{"NODE_TYPE/ELEMENT":18,"is/attached":26}],63:[function(require,module,exports){
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

},{"REGEX":20}],64:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('./D'),
    parser = require('parser'),
    Fizzle = require('Fizzle'),
    array = require('modules/array'),
    data = require('modules/data');

var parseHtml = function parseHtml(str) {
    if (!str) {
        return null;
    }
    var result = parser(str);
    if (!result || !result.length) {
        return null;
    }
    return D(result);
};

_.extend(D, data.D, {
    // Because no one know what the case should be
    parseHtml: parseHtml,
    parseHTML: parseHtml,

    Fizzle: Fizzle,
    each: array.each,
    forEach: array.each,

    map: _.map,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

},{"./D":3,"Fizzle":9,"_":22,"modules/array":42,"modules/data":46,"parser":63}],65:[function(require,module,exports){
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

},{"./D":3,"_":22,"modules/array":42,"modules/attr":43,"modules/classes":44,"modules/css":45,"modules/data":46,"modules/dimensions":47,"modules/events":50,"modules/manip":51,"modules/position":53,"modules/prop":54,"modules/scroll":55,"modules/selectors":56,"modules/transversal":57,"modules/val":58,"util/split":72}],66:[function(require,module,exports){
'use strict';

var exists = require('is/exists');

module.exports = function (str) {
  return !exists(str) || str === '';
};

},{"is/exists":32}],67:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ? function (str) {
    return str;
} : function (str) {
    return str ? str.replace(/\r\n/g, '\n') : str;
};

},{"SUPPORTS":21}],68:[function(require,module,exports){
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

},{"cache":23,"is/array":24,"string/isEmpty":66}],69:[function(require,module,exports){
'use strict';

var isString = require('is/string');

module.exports = function (value) {
    return (
        // Its a number! || 0 to avoid NaN (as NaN's a number)
        +value === value ? value || 0 :
        // Avoid NaN again
        isString(value) ? +value || 0 :
        // Default to zero
        0
    );
};

},{"is/string":39}],70:[function(require,module,exports){
"use strict";

module.exports = function (num) {
  return parseInt(num, 10);
};

},{}],71:[function(require,module,exports){
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

},{}],72:[function(require,module,exports){
// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
'use strict';

module.exports = function (str, delimiter) {
  return str.split(delimiter || '|');
};

},{}],73:[function(require,module,exports){
'use strict';

module.exports = function (value) {
  return value + 'px';
};

},{}],74:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL2NhcHR1cmUuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvQVRUUklCVVRFLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvQ09NTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0RPQ1VNRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlRfRlJBR01FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9FTEVNRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvVEVYVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvUkVHRVguanMiLCJDOi9fRGV2L2QtanMvc3JjL1NVUFBPUlRTLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9fLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9jYWNoZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXkuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2FycmF5TGlrZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXR0YWNoZWQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2Jvb2xlYW4uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2NvbGxlY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2RvY3VtZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9lbGVtZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9leGlzdHMuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2Z1bmN0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9odG1sLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ub2RlTGlzdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvbnVtYmVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9vYmplY3QuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9zdHJpbmcuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3dpbmRvdy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbWF0Y2hlc1NlbGVjdG9yLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2F0dHIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvY2xhc3Nlcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jc3MuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZGF0YS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kaW1lbnNpb25zLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2V2ZW50cy9jdXN0b20uanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2RlbGVnYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2V2ZW50cy9pbmRleC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9tYW5pcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9vbnJlYWR5LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy90cmFuc3ZlcnNhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy92YWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvaXNFbGVtZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL2lzTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9ub3JtYWxpemVOYW1lLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9vcmRlci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvcGFyc2VyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm9wcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvcHJvdG8uanMiLCJDOi9fRGV2L2QtanMvc3JjL3N0cmluZy9pc0VtcHR5LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvbmV3bGluZXMuanMiLCJDOi9fRGV2L2QtanMvc3JjL3N0cmluZy9zcGxpdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC9jb2VyY2VOdW0uanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvcGFyc2VJbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc2xpY2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvdG9QeC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvdXRpbC91bmlxdWVJZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztBQ0ZuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNyRkEsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQztJQUVoQixPQUFPLEdBQU0sT0FBTyxDQUFDLFVBQVUsQ0FBQztJQUNoQyxNQUFNLEdBQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQztJQUMvQixRQUFRLEdBQUssT0FBTyxDQUFDLFdBQVcsQ0FBQztJQUNqQyxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNuQyxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNuQyxHQUFHLEdBQVUsT0FBTyxDQUFDLE1B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QU8sR0FBRyxVQUFDLEdBQUcsRUFBRSxTQUFTO1NBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDO0NBQUEsQ0FBQzs7Ozs7QUNGakUsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFDLEtBQUs7U0FBSyxLQUFLLEdBQUcsSUFBSTtDQUFBLENBQUM7Ozs7O0FDQXpDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUc7V0FBTSxFQUFFLEVBQUU7Q0FBQSxDQUFDO0FBQzNDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBUyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ2xDLFFBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxFQUFFO1FBQ2xCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLFdBQU87ZUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFO0tBQUEsQ0FBQztDQUNoQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9EJyk7XHJcbnJlcXVpcmUoJy4vcHJvcHMnKTtcclxucmVxdWlyZSgnLi9wcm90bycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHVud3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlKSB7XG4gIHZhciBlO1xuICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgID0gZS5wcmV2ZW50RGVmYXVsdCAgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJ18nKSxcclxuXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzSHRtbCAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICA9IHJlcXVpcmUoJ2lzL2QnKSxcclxuXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCdtb2R1bGVzL29ucmVhZHknKSxcclxuICAgIEZpenpsZSAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgRCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IsIGF0dHJzKSB7XHJcbiAgICByZXR1cm4gbmV3IEluaXQoc2VsZWN0b3IsIGF0dHJzKTtcclxufTtcclxuXHJcbmlzRC5zZXQoRCk7XHJcblxyXG52YXIgSW5pdCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgLy8gbm90aGluXHJcbiAgICBpZiAoIXNlbGVjdG9yKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgLy8gZWxlbWVudCBvciB3aW5kb3cgKGRvY3VtZW50cyBoYXZlIGEgbm9kZVR5cGUpXHJcbiAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUgfHwgc2VsZWN0b3IgPT09IHdpbmRvdykge1xyXG4gICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcclxuICAgICAgICB0aGlzLmxlbmd0aCA9IDE7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSFRNTCBzdHJpbmdcclxuICAgIGlmIChpc0h0bWwoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBwYXJzZXIoc2VsZWN0b3IpKTtcclxuICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTdHJpbmdcclxuICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBGaXp6bGUucXVlcnkoc2VsZWN0b3IpLmV4ZWModGhpcywgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IG9mIEVsZW1lbnRzLCBOb2RlTGlzdCwgb3IgRCBvYmplY3RcclxuICAgIGlmIChpc0FycmF5KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG9jdW1lbnQgcmVhZHlcclxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG9ucmVhZHkoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbkluaXQucHJvdG90eXBlID0gRC5wcm90b3R5cGU7IiwibW9kdWxlLmV4cG9ydHMgPSAodGFnKSA9PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7IiwidmFyIGRpdiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUnKSgnZGl2Jyk7XHJcblxyXG5kaXYuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCIvYVwiPmE8L2E+JzsiLCJ2YXIgXyA9IHJlcXVpcmUoJ18nKTtcclxuXHJcbnZhciBJcyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcbklzLnByb3RvdHlwZSA9IHtcclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IHRoaXMuX3NlbGVjdG9ycyxcclxuICAgICAgICAgICAgaWR4ID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvcnNbaWR4XS5tYXRjaChjb250ZXh0KSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmFueShhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICB0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgIXRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwidmFyIGZpbmQgPSBmdW5jdGlvbihxdWVyeSwgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgIHNlbGVjdG9ycyA9IHF1ZXJ5Ll9zZWxlY3RvcnMsXHJcbiAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5cclxuUXVlcnkucHJvdG90eXBlID0ge1xyXG4gICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGZpbmQodGhpcywgYXJyW2lkeF0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnLFxyXG5cclxuICAgIHNlbGVjdG9yQ2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBSRUdFWCAgICAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIG1hdGNoZXMgICAgICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKTtcclxuXHJcbnZhciBkZXRlcm1pbmVNZXRob2QgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBzZWxlY3RvckNhY2hlLmdldChzZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKG1ldGhvZCkgeyByZXR1cm4gbWV0aG9kOyB9XHJcblxyXG4gICAgICAgIG1ldGhvZCA9IFJFR0VYLmlzU3RyaWN0SWQoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRfQllfSUQgOlxyXG4gICAgICAgICAgICBSRUdFWC5pc0NsYXNzKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FIDpcclxuICAgICAgICAgICAgUkVHRVguaXNUYWcoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FIDogICAgICAgXHJcbiAgICAgICAgICAgIFFVRVJZX1NFTEVDVE9SX0FMTDtcclxuXHJcbiAgICAgICAgc2VsZWN0b3JDYWNoZS5zZXQoc2VsZWN0b3IsIG1ldGhvZCk7XHJcbiAgICAgICAgcmV0dXJuIG1ldGhvZDtcclxuICAgIH0sXHJcblxyXG4gICAgdW5pcXVlSWQgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZCgwLCAnRC11bmlxdWVJZC0nKSxcclxuXHJcbiAgICAvLyBuZWVkIHRvIGZvcmNlIGFuIGFycmF5IGhlcmVcclxuICAgIGZyb21Eb21BcnJheVRvQXJyYXkgPSBmdW5jdGlvbihhcnJheUxpa2UpIHtcclxuICAgICAgICB2YXIgaWR4ID0gYXJyYXlMaWtlLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyID0gbmV3IEFycmF5KGlkeCk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gYXJyYXlMaWtlW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIHByb2Nlc3NRdWVyeVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlbGVjdGlvbikge1xyXG4gICAgICAgIC8vIE5vIHNlbGVjdGlvblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTm9kZWxpc3Qgd2l0aG91dCBhIGxlbmd0aFxyXG4gICAgICAgIGlmIChpc05vZGVMaXN0KHNlbGVjdGlvbikgJiYgIXNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgaXQncyBhbiBpZCwgcmV0dXJuIGl0IGFzIGFuIGFycmF5XHJcbiAgICAgICAgcmV0dXJuIGlzRWxlbWVudChzZWxlY3Rpb24pIHx8ICFzZWxlY3Rpb24ubGVuZ3RoID8gW3NlbGVjdGlvbl0gOiBmcm9tRG9tQXJyYXlUb0FycmF5KHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIHRhaWxvckNoaWxkU2VsZWN0b3IgPSBmdW5jdGlvbihpZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gJyMnICsgaWQgKyAnICcgKyBzZWxlY3RvcjtcclxuICAgIH0sXHJcblxyXG4gICAgY2hpbGRPclNpYmxpbmdRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGYpIHtcclxuICAgICAgICAvLyBDaGlsZCBzZWxlY3QgLSBuZWVkcyBzcGVjaWFsIGhlbHAgc28gdGhhdCBcIj4gZGl2XCIgZG9lc24ndCBicmVha1xyXG4gICAgICAgIHZhciBtZXRob2QgICAgPSBzZWxmLm1ldGhvZCxcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yICA9IHNlbGYuc2VsZWN0b3IsXHJcbiAgICAgICAgICAgIG5ld0lkLFxyXG4gICAgICAgICAgICBpZDtcclxuXHJcbiAgICAgICAgaWQgPSBjb250ZXh0LmlkO1xyXG4gICAgICAgIGlmIChpZCA9PT0gJycgfHwgIWV4aXN0cyhpZCkpIHtcclxuICAgICAgICAgICAgbmV3SWQgPSB1bmlxdWVJZCgpO1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gbmV3SWQ7XHJcbiAgICAgICAgICAgIGlkQXBwbGllZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3RvciA9IHRhaWxvckNoaWxkU2VsZWN0b3IoaWRBcHBsaWVkID8gbmV3SWQgOiBpZCwgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIGlmIChpZEFwcGxpZWQpIHtcclxuICAgICAgICAgICAgY29udGV4dC5pZCA9IGlkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGFzc1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3IsXHJcbiAgICAgICAgICAgIC8vIENsYXNzIHNlYXJjaCwgZG9uJ3Qgc3RhcnQgd2l0aCAnLidcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxmLnNlbGVjdG9yLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgaWRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGYpIHtcclxuICAgICAgICB2YXIgbWV0aG9kICAgPSBzZWxmLm1ldGhvZCxcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxmLnNlbGVjdG9yLnN1YnN0cigxKSxcclxuICAgICAgICAgICAgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVmYXVsdFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W3NlbGYubWV0aG9kXShzZWxmLnNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGVybWluZVF1ZXJ5ID0gZnVuY3Rpb24oc2VsZikge1xyXG4gICAgICAgIGlmIChzZWxmLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkT3JTaWJsaW5nUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0NsYXNzU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGFzc1F1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNlbGYuaXNJZFNlYXJjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaWRRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UXVlcnk7XHJcbiAgICB9O1xyXG5cclxudmFyIFNlbGVjdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHZhciBzZWxlY3RvciAgICAgICAgICAgICAgICA9IHN0ci50cmltKCksXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCAgPSBzZWxlY3RvclswXSA9PT0gJz4nIHx8IHNlbGVjdG9yWzBdID09PSAnKycsXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gUVVFUllfU0VMRUNUT1JfQUxMIDogZGV0ZXJtaW5lTWV0aG9kKHNlbGVjdG9yKTtcclxuXHJcbiAgICB0aGlzLnN0ciAgICAgICAgICAgICAgICAgICAgPSBzdHI7XHJcbiAgICB0aGlzLnNlbGVjdG9yICAgICAgICAgICAgICAgPSBzZWxlY3RvcjtcclxuICAgIHRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3Q7XHJcbiAgICB0aGlzLmlzSWRTZWFyY2ggICAgICAgICAgICAgPSBtZXRob2QgPT09IEdFVF9FTEVNRU5UX0JZX0lEO1xyXG4gICAgdGhpcy5pc0NsYXNzU2VhcmNoICAgICAgICAgID0gIXRoaXMuaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FO1xyXG4gICAgdGhpcy5tZXRob2QgICAgICAgICAgICAgICAgID0gbWV0aG9kO1xyXG59O1xyXG5cclxuU2VsZWN0b3IucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAvLyBObyBuZWVlZCB0byBjaGVjaywgYSBtYXRjaCB3aWxsIGZhaWwgaWYgaXQnc1xyXG4gICAgICAgIC8vIGNoaWxkIG9yIHNpYmxpbmdcclxuICAgICAgICBpZiAodGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0KSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWF0Y2hlcyhjb250ZXh0LCB0aGlzLnNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgZXhlYzogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBxdWVyeSA9IGRldGVybWluZVF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAvLyB0aGVzZSBhcmUgdGhlIHR5cGVzIHdlJ3JlIGV4cGVjdGluZyB0byBmYWxsIHRocm91Z2hcclxuICAgICAgICAvLyBpc0VsZW1lbnQoY29udGV4dCkgfHwgaXNOb2RlTGlzdChjb250ZXh0KSB8fCBpc0NvbGxlY3Rpb24oY29udGV4dClcclxuICAgICAgICAvLyBpZiBubyBjb250ZXh0IGlzIGdpdmVuLCB1c2UgZG9jdW1lbnRcclxuICAgICAgICByZXR1cm4gcXVlcnkoY29udGV4dCB8fCBkb2N1bWVudCwgdGhpcyk7XHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBxdWVyeUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgaXNDYWNoZSAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIFNlbGVjdG9yICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvU2VsZWN0b3InKSxcclxuICAgIFF1ZXJ5ICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvUXVlcnknKSxcclxuICAgIElzICAgICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvSXMnKSxcclxuICAgIHBhcnNlICAgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlJyksXHJcbiAgICBub3JtYWxpemUgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1ub3JtYWxpemUnKTtcclxuXHJcbnZhciB0b1NlbGVjdG9ycyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgLy8gU2VsZWN0b3JzIHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgLy8gTm90IHJldHVybmluZyBlYXJseSBvciBkb2luZyBleHRyYSBjaGVja3MgYXMgdGhpcyB3aWxsXHJcbiAgICAvLyBub29wIG9uIHRoZSBRdWVyeSBhbmQgSXMgbGV2ZWwgYW5kIGlzIHRoZSBleGNlcHRpb25cclxuICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgIHZhciBzZWxlY3RvcnMgPSBwYXJzZS5zdWJxdWVyaWVzKHN0cikgfHwgW107XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIGVhY2ggb2YgdGhlIHNlbGVjdG9ycy4uLlxyXG4gICAgc2VsZWN0b3JzID0gXy5tYXAoc2VsZWN0b3JzLCBub3JtYWxpemUpO1xyXG5cclxuICAgIC8vIC4uLmFuZCBtYXAgdGhlbSB0byBTZWxlY3RvciBvYmplY3RzXHJcbiAgICByZXR1cm4gXy5mYXN0bWFwKHNlbGVjdG9ycywgKHNlbGVjdG9yKSA9PiBuZXcgU2VsZWN0b3Ioc2VsZWN0b3IpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcGFyc2U6IHBhcnNlLFxyXG4gICAgXHJcbiAgICBxdWVyeTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5Q2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLnB1dChzdHIsICgpID0+IG5ldyBRdWVyeSh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBpc0NhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIGlzQ2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgaXNDYWNoZS5wdXQoc3RyLCAoKSA9PiBuZXcgSXModG9TZWxlY3RvcnMoc3RyKSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcblx0JzpjaGlsZC1hdCc6ICc6bnRoLWNoaWxkKHgpJyxcclxuXHQnOmNoaWxkLWd0JzogJzpudGgtY2hpbGQobit4KScsXHJcblx0JzpjaGlsZC1sdCc6ICc6bnRoLWNoaWxkKH5uK3gpJ1xyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICc6Y2hpbGQtZXZlbicgOiAnOm50aC1jaGlsZChldmVuKScsXHJcbiAgICAnOmNoaWxkLW9kZCcgIDogJzpudGgtY2hpbGQob2RkKScsXHJcbiAgICAnOnRleHQnICAgICAgIDogJ1t0eXBlPVwidGV4dFwiXScsXHJcbiAgICAnOnBhc3N3b3JkJyAgIDogJ1t0eXBlPVwicGFzc3dvcmRcIl0nLFxyXG4gICAgJzpyYWRpbycgICAgICA6ICdbdHlwZT1cInJhZGlvXCJdJyxcclxuICAgICc6Y2hlY2tib3gnICAgOiAnW3R5cGU9XCJjaGVja2JveFwiXScsXHJcbiAgICAnOnN1Ym1pdCcgICAgIDogJ1t0eXBlPVwic3VibWl0XCJdJyxcclxuICAgICc6cmVzZXQnICAgICAgOiAnW3R5cGU9XCJyZXNldFwiXScsXHJcbiAgICAnOmJ1dHRvbicgICAgIDogJ1t0eXBlPVwiYnV0dG9uXCJdJyxcclxuICAgICc6aW1hZ2UnICAgICAgOiAnW3R5cGU9XCJpbWFnZVwiXScsXHJcbiAgICAnOmlucHV0JyAgICAgIDogJ1t0eXBlPVwiaW5wdXRcIl0nLFxyXG4gICAgJzpmaWxlJyAgICAgICA6ICdbdHlwZT1cImZpbGVcIl0nLFxyXG4gICAgJzpzZWxlY3RlZCcgICA6ICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXSdcclxufTsiLCJ2YXIgU1VQUE9SVFMgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcblxyXG4gICAgQVRUUklCVVRFX1NFTEVDVE9SID0gL1xcW1xccypbXFx3LV0rXFxzKlshJF4qXT8oPzo9XFxzKihbJ1wiXT8pKC4qP1teXFxcXF18W15cXFxcXSopKT9cXDFcXHMqXFxdL2csXHJcbiAgICBQU0VVRE9fU0VMRUNUICAgICAgPSAvKDpbXlxcc1xcKFxcWyldKykvZyxcclxuICAgIENBUFRVUkVfU0VMRUNUICAgICA9IC8oOlteXFxzXihdKylcXCgoW15cXCldKylcXCkvZyxcclxuICAgIHBzZXVkb0NhY2hlICAgICAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHByb3h5U2VsZWN0b3JzICAgICA9IHJlcXVpcmUoJy4vcHJveHknKSxcclxuICAgIGNhcHR1cmVTZWxlY3RvcnMgICA9IHJlcXVpcmUoJy4vY2FwdHVyZScpO1xyXG5cclxudmFyIGdldEF0dHJpYnV0ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgdmFyIHBhaXJzID0gW107XHJcbiAgICAvLyBOb3QgdXNpbmcgcmV0dXJuIHZhbHVlLiBTaW1wbHkgdXNpbmcgaXQgdG8gaXRlcmF0ZVxyXG4gICAgLy8gdGhyb3VnaCBhbGwgb2YgdGhlIG1hdGNoZXMgdG8gcG9wdWxhdGUgbWF0Y2ggcG9zaXRpb25zXHJcbiAgICBzdHIucmVwbGFjZShBVFRSSUJVVEVfU0VMRUNUT1IsIGZ1bmN0aW9uKG1hdGNoLCBjYXAxLCBjYXAyLCBwb3NpdGlvbikge1xyXG4gICAgICAgIHBhaXJzLnB1c2goWyBwb3NpdGlvbiwgcG9zaXRpb24gKyBtYXRjaC5sZW5ndGggXSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwYWlycztcclxufTtcclxuXHJcbnZhciBpc091dHNpZGVPZkF0dHJpYnV0ZSA9IGZ1bmN0aW9uKHBvc2l0aW9uLCBwb3NpdGlvbnMpIHtcclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBwb3NpdGlvbnMubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICB2YXIgcG9zID0gcG9zaXRpb25zW2lkeF07XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uID4gcG9zWzBdICYmIHBvc2l0aW9uIDwgcG9zWzFdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbnZhciBwc2V1ZG9SZXBsYWNlID0gZnVuY3Rpb24oc3RyLCBwb3NpdGlvbnMpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZShQU0VVRE9fU0VMRUNULCBmdW5jdGlvbihtYXRjaCwgY2FwLCBwb3NpdGlvbikge1xyXG4gICAgICAgIGlmICghaXNPdXRzaWRlT2ZBdHRyaWJ1dGUocG9zaXRpb24sIHBvc2l0aW9ucykpIHsgcmV0dXJuIG1hdGNoOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm94eVNlbGVjdG9yc1ttYXRjaF0gPyBwcm94eVNlbGVjdG9yc1ttYXRjaF0gOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIGNhcHR1cmVSZXBsYWNlID0gZnVuY3Rpb24oc3RyLCBwb3NpdGlvbnMpIHtcclxuICAgIHZhciBjYXB0dXJlU2VsZWN0b3I7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoQ0FQVFVSRV9TRUxFQ1QsIGZ1bmN0aW9uKG1hdGNoLCBjYXAsIHZhbHVlLCBwb3NpdGlvbikge1xyXG4gICAgICAgIGlmICghaXNPdXRzaWRlT2ZBdHRyaWJ1dGUocG9zaXRpb24sIHBvc2l0aW9ucykpIHsgcmV0dXJuIG1hdGNoOyB9XHJcblxyXG4gICAgICAgIHJldHVybiAoY2FwdHVyZVNlbGVjdG9yID0gY2FwdHVyZVNlbGVjdG9yc1tjYXBdKSA/IGNhcHR1cmVTZWxlY3Rvci5yZXBsYWNlKCd4JywgdmFsdWUpIDogbWF0Y2g7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbnZhciBib29sZWFuU2VsZWN0b3JSZXBsYWNlID0gU1VQUE9SVFMuc2VsZWN0ZWRTZWxlY3RvciA/XHJcbiAgICAvLyBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0cjsgfSA6XHJcbiAgICAvLyBJRTgtOVxyXG4gICAgZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9ucyA9IGdldEF0dHJpYnV0ZVBvc2l0aW9ucyhzdHIpLFxyXG4gICAgICAgICAgICBpZHggPSBwb3NpdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwb3MsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgcG9zID0gcG9zaXRpb25zW2lkeF07XHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc3RyLnN1YnN0cmluZyhwb3NbMF0sIHBvc1sxXSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ1tzZWxlY3RlZF0nKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIHBvc1swXSkgKyAnW3NlbGVjdGVkPVwic2VsZWN0ZWRcIl0nICsgc3RyLnN1YnN0cmluZyhwb3NbMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICByZXR1cm4gcHNldWRvQ2FjaGUuaGFzKHN0cikgPyBwc2V1ZG9DYWNoZS5nZXQoc3RyKSA6IHBzZXVkb0NhY2hlLnB1dChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhdHRyUG9zaXRpb25zID0gZ2V0QXR0cmlidXRlUG9zaXRpb25zKHN0cik7XHJcbiAgICAgICAgc3RyID0gcHNldWRvUmVwbGFjZShzdHIsIGF0dHJQb3NpdGlvbnMpO1xyXG4gICAgICAgIHN0ciA9IGJvb2xlYW5TZWxlY3RvclJlcGxhY2Uoc3RyKTtcclxuICAgICAgICByZXR1cm4gY2FwdHVyZVJlcGxhY2Uoc3RyLCBhdHRyUG9zaXRpb25zKTtcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKlxyXG4gKiBGaXp6bGUuanNcclxuICogQWRhcHRlZCBmcm9tIFNpenpsZS5qc1xyXG4gKi9cclxudmFyIHRva2VuQ2FjaGUgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBzdWJxdWVyeUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG5cclxuICAgIGVycm9yID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2QtanM6IEludmFsaWQgcXVlcnkgc2VsZWN0b3IgKGNhdWdodCkgXCInKyBzZWxlY3RvciArJ1wiJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtc2VsZWN0b3JzLyN3aGl0ZXNwYWNlXHJcbiAgICBXSElURVNQQUNFID0gJ1tcXFxceDIwXFxcXHRcXFxcclxcXFxuXFxcXGZdJyxcclxuXHJcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjdmFsdWUtZGVmLWlkZW50aWZpZXJcclxuICAgIElERU5USUZJRVIgPSAnKD86XFxcXFxcXFwufFtcXFxcdy1dfFteXFxcXHgwMC1cXFxceGEwXSkrJyxcclxuXHJcbiAgICAvLyBOT1RFOiBMZWF2aW5nIGRvdWJsZSBxdW90ZXMgdG8gcmVkdWNlIGVzY2FwaW5nXHJcbiAgICAvLyBBdHRyaWJ1dGUgc2VsZWN0b3JzOiBodHRwOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI2F0dHJpYnV0ZS1zZWxlY3RvcnNcclxuICAgIEFUVFJJQlVURVMgPSBcIlxcXFxbXCIgKyBXSElURVNQQUNFICsgXCIqKFwiICsgSURFTlRJRklFUiArIFwiKSg/OlwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gT3BlcmF0b3IgKGNhcHR1cmUgMilcclxuICAgICAgICBcIiooWypeJHwhfl0/PSlcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIC8vIFwiQXR0cmlidXRlIHZhbHVlcyBtdXN0IGJlIENTUyBJREVOVElGSUVScyBbY2FwdHVyZSA1XSBvciBzdHJpbmdzIFtjYXB0dXJlIDMgb3IgY2FwdHVyZSA0XVwiXHJcbiAgICAgICAgXCIqKD86JygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwifChcIiArIElERU5USUZJRVIgKyBcIikpfClcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIFwiKlxcXFxdXCIsXHJcblxyXG4gICAgUFNFVURPUyA9IFwiOihcIiArIElERU5USUZJRVIgKyBcIikoPzpcXFxcKChcIiArXHJcbiAgICAgICAgLy8gVG8gcmVkdWNlIHRoZSBudW1iZXIgb2Ygc2VsZWN0b3JzIG5lZWRpbmcgdG9rZW5pemUgaW4gdGhlIHByZUZpbHRlciwgcHJlZmVyIGFyZ3VtZW50czpcclxuICAgICAgICAvLyAxLiBxdW90ZWQgKGNhcHR1cmUgMzsgY2FwdHVyZSA0IG9yIGNhcHR1cmUgNSlcclxuICAgICAgICBcIignKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCIpfFwiICtcclxuICAgICAgICAvLyAyLiBzaW1wbGUgKGNhcHR1cmUgNilcclxuICAgICAgICBcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpW1xcXFxdXXxcIiArIEFUVFJJQlVURVMgKyBcIikqKXxcIiArXHJcbiAgICAgICAgLy8gMy4gYW55dGhpbmcgZWxzZSAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiLipcIiArXHJcbiAgICAgICAgXCIpXFxcXCl8KVwiLFxyXG5cclxuICAgIFJfQ09NTUEgICAgICAgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKiwnICsgV0hJVEVTUEFDRSArICcqJyksXHJcbiAgICBSX0NPTUJJTkFUT1JTID0gbmV3IFJlZ0V4cCgnXicgKyBXSElURVNQQUNFICsgJyooWz4rfl18JyArIFdISVRFU1BBQ0UgKyAnKScgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfUFNFVURPICAgICAgPSBuZXcgUmVnRXhwKFBTRVVET1MpLFxyXG4gICAgUl9NQVRDSF9FWFBSID0ge1xyXG4gICAgICAgIElEOiAgICAgbmV3IFJlZ0V4cCgnXiMoJyAgICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgQ0xBU1M6ICBuZXcgUmVnRXhwKCdeXFxcXC4oJyArIElERU5USUZJRVIgKyAnKScpLFxyXG4gICAgICAgIFRBRzogICAgbmV3IFJlZ0V4cCgnXignICAgICsgSURFTlRJRklFUiArICd8WypdKScpLFxyXG4gICAgICAgIEFUVFI6ICAgbmV3IFJlZ0V4cCgnXicgICAgICsgQVRUUklCVVRFUyksXHJcbiAgICAgICAgUFNFVURPOiBuZXcgUmVnRXhwKCdeJyAgICAgKyBQU0VVRE9TKSxcclxuICAgICAgICBDSElMRDogIG5ldyBSZWdFeHAoJ146KG9ubHl8Zmlyc3R8bGFzdHxudGh8bnRoLWxhc3QpLShjaGlsZHxvZi10eXBlKSg/OlxcXFwoJyArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgICAgICAnKihldmVufG9kZHwoKFsrLV18KShcXFxcZCopbnwpJyArIFdISVRFU1BBQ0UgKyAnKig/OihbKy1dfCknICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKFxcXFxkKyl8KSknICsgV0hJVEVTUEFDRSArICcqXFxcXCl8KScsICdpJyksXHJcbiAgICAgICAgYm9vbDogICBuZXcgUmVnRXhwKFwiXig/OmNoZWNrZWR8c2VsZWN0ZWR8YXN5bmN8YXV0b2ZvY3VzfGF1dG9wbGF5fGNvbnRyb2xzfGRlZmVyfGRpc2FibGVkfGhpZGRlbnxpc21hcHxsb29wfG11bHRpcGxlfG9wZW58cmVhZG9ubHl8cmVxdWlyZWR8c2NvcGVkKSRcIiwgXCJpXCIpXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENTUyBlc2NhcGVzIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCNlc2NhcGVkLWNoYXJhY3RlcnNcclxuICAgIFJfVU5FU0NBUEUgPSBuZXcgUmVnRXhwKCdcXFxcXFxcXChbXFxcXGRhLWZdezEsNn0nICsgV0hJVEVTUEFDRSArICc/fCgnICsgV0hJVEVTUEFDRSArICcpfC4pJywgJ2lnJyksXHJcbiAgICBmdW5lc2NhcGUgPSBmdW5jdGlvbihfLCBlc2NhcGVkLCBlc2NhcGVkV2hpdGVzcGFjZSkge1xyXG4gICAgICAgIHZhciBoaWdoID0gJzB4JyArIChlc2NhcGVkIC0gMHgxMDAwMCk7XHJcbiAgICAgICAgLy8gTmFOIG1lYW5zIG5vbi1jb2RlcG9pbnRcclxuICAgICAgICAvLyBTdXBwb3J0OiBGaXJlZm94PDI0XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBlcnJvbmVvdXMgbnVtZXJpYyBpbnRlcnByZXRhdGlvbiBvZiArJzB4J1xyXG4gICAgICAgIHJldHVybiBoaWdoICE9PSBoaWdoIHx8IGVzY2FwZWRXaGl0ZXNwYWNlID9cclxuICAgICAgICAgICAgZXNjYXBlZCA6XHJcbiAgICAgICAgICAgIGhpZ2ggPCAwID9cclxuICAgICAgICAgICAgICAgIC8vIEJNUCBjb2RlcG9pbnRcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZShoaWdoICsgMHgxMDAwMCkgOlxyXG4gICAgICAgICAgICAgICAgLy8gU3VwcGxlbWVudGFsIFBsYW5lIGNvZGVwb2ludCAoc3Vycm9nYXRlIHBhaXIpXHJcbiAgICAgICAgICAgICAgICBmcm9tQ2hhckNvZGUoKGhpZ2ggPj4gMTApIHwgMHhEODAwLCAoaGlnaCAmIDB4M0ZGKSB8IDB4REMwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZUZpbHRlciA9IHtcclxuICAgICAgICBBVFRSOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnJlcGxhY2UoUl9VTkVTQ0FQRSwgZnVuZXNjYXBlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1vdmUgdGhlIGdpdmVuIHZhbHVlIHRvIG1hdGNoWzNdIHdoZXRoZXIgcXVvdGVkIG9yIHVucXVvdGVkXHJcbiAgICAgICAgICAgIG1hdGNoWzNdID0gKCBtYXRjaFszXSB8fCBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJyApLnJlcGxhY2UoUl9VTkVTQ0FQRSwgZnVuZXNjYXBlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsyXSA9PT0gJ349Jykge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbM10gPSAnICcgKyBtYXRjaFszXSArICcgJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIENISUxEOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICAvKiBtYXRjaGVzIGZyb20gUl9NQVRDSF9FWFBSWydDSElMRCddXHJcbiAgICAgICAgICAgICAgICAxIHR5cGUgKG9ubHl8bnRofC4uLilcclxuICAgICAgICAgICAgICAgIDIgd2hhdCAoY2hpbGR8b2YtdHlwZSlcclxuICAgICAgICAgICAgICAgIDMgYXJndW1lbnQgKGV2ZW58b2RkfFxcZCp8XFxkKm4oWystXVxcZCspP3wuLi4pXHJcbiAgICAgICAgICAgICAgICA0IHhuLWNvbXBvbmVudCBvZiB4bit5IGFyZ3VtZW50IChbKy1dP1xcZCpufClcclxuICAgICAgICAgICAgICAgIDUgc2lnbiBvZiB4bi1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDYgeCBvZiB4bi1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDcgc2lnbiBvZiB5LWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgOCB5IG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMV0uc2xpY2UoMCwgMykgPT09ICdudGgnKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBudGgtKiByZXF1aXJlcyBhcmd1bWVudFxyXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtYXRjaFswXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbnVtZXJpYyB4IGFuZCB5IHBhcmFtZXRlcnMgZm9yIEV4cHIuZmlsdGVyLkNISUxEXHJcbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGF0IGZhbHNlL3RydWUgY2FzdCByZXNwZWN0aXZlbHkgdG8gMC8xXHJcbiAgICAgICAgICAgICAgICBtYXRjaFs0XSA9ICsobWF0Y2hbNF0gPyBtYXRjaFs1XSArIChtYXRjaFs2XSB8fCAxKSA6IDIgKiAobWF0Y2hbM10gPT09ICdldmVuJyB8fCBtYXRjaFszXSA9PT0gJ29kZCcpKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzVdID0gKygoIG1hdGNoWzddICsgbWF0Y2hbOF0pIHx8IG1hdGNoWzNdID09PSAnb2RkJyk7XHJcblxyXG4gICAgICAgICAgICAvLyBvdGhlciB0eXBlcyBwcm9oaWJpdCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFBTRVVETzogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgdmFyIGV4Y2VzcyxcclxuICAgICAgICAgICAgICAgIHVucXVvdGVkID0gIW1hdGNoWzZdICYmIG1hdGNoWzJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKFJfTUFUQ0hfRVhQUi5DSElMRC50ZXN0KG1hdGNoWzBdKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFjY2VwdCBxdW90ZWQgYXJndW1lbnRzIGFzLWlzXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIC8vIFN0cmlwIGV4Y2VzcyBjaGFyYWN0ZXJzIGZyb20gdW5xdW90ZWQgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5xdW90ZWQgJiYgUl9QU0VVRE8udGVzdCh1bnF1b3RlZCkgJiZcclxuICAgICAgICAgICAgICAgIC8vIEdldCBleGNlc3MgZnJvbSB0b2tlbml6ZSAocmVjdXJzaXZlbHkpXHJcbiAgICAgICAgICAgICAgICAoZXhjZXNzID0gdG9rZW5pemUodW5xdW90ZWQsIHRydWUpKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gYWR2YW5jZSB0byB0aGUgbmV4dCBjbG9zaW5nIHBhcmVudGhlc2lzXHJcbiAgICAgICAgICAgICAgICAoZXhjZXNzID0gdW5xdW90ZWQuaW5kZXhPZignKScsIHVucXVvdGVkLmxlbmd0aCAtIGV4Y2VzcykgLSB1bnF1b3RlZC5sZW5ndGgpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZXhjZXNzIGlzIGEgbmVnYXRpdmUgaW5kZXhcclxuICAgICAgICAgICAgICAgIG1hdGNoWzBdID0gbWF0Y2hbMF0uc2xpY2UoMCwgZXhjZXNzKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gdW5xdW90ZWQuc2xpY2UoMCwgZXhjZXNzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIG9ubHkgY2FwdHVyZXMgbmVlZGVkIGJ5IHRoZSBwc2V1ZG8gZmlsdGVyIG1ldGhvZCAodHlwZSBhbmQgYXJndW1lbnQpXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCAzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIEZ1bGwgQ1NTIHNlbGVjdG9yIChlLmcuLCAnYSwgaW5wdXQ6Zm9jdXMsIGRpdlthdHRyPVwidmFsdWVcIl0nKS5cclxuICogQHBhcmFtICB7Qm9vbGVhbn0gW3BhcnNlT25seT1mYWxzZV1cclxuICogQHJldHVybiB7U3RyaW5nW118TnVtYmVyfG51bGx9IEFycmF5IG9mIHN1Yi1xdWVyaWVzIChlLmcuLCBbICdhJywgJ2lucHV0OmZvY3VzJywgJ2RpdlthdHRyPVwiKHZhbHVlMSksW3ZhbHVlMl1cIl0nKSBvciBudWxsIGlmIHRoZXJlIHdhcyBhbiBlcnJvciBwYXJzaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIHRva2VuaXplID0gZnVuY3Rpb24oc2VsZWN0b3IsIHBhcnNlT25seSkge1xyXG4gICAgaWYgKHRva2VuQ2FjaGUuaGFzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIHJldHVybiBwYXJzZU9ubHkgPyAwIDogdG9rZW5DYWNoZS5nZXQoc2VsZWN0b3IpLnNsaWNlKDApO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0eXBlLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1JlZ0V4cH0gKi9cclxuICAgICAgICByZWdleCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheX0gKi9cclxuICAgICAgICBtYXRjaCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgbWF0Y2hlZCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmdbXX0gKi9cclxuICAgICAgICBzdWJxdWVyaWVzID0gW10sXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJ5ID0gJycsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHNvRmFyID0gc2VsZWN0b3I7XHJcblxyXG4gICAgd2hpbGUgKHNvRmFyKSB7XHJcbiAgICAgICAgLy8gQ29tbWEgYW5kIGZpcnN0IHJ1blxyXG4gICAgICAgIGlmICghbWF0Y2hlZCB8fCAobWF0Y2ggPSBSX0NPTU1BLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGNvbnN1bWUgdHJhaWxpbmcgY29tbWFzIGFzIHZhbGlkXHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCkgfHwgc29GYXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuICAgICAgICAgICAgc3VicXVlcnkgPSAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hdGNoZWQgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yc1xyXG4gICAgICAgIGlmICgobWF0Y2ggPSBSX0NPTUJJTkFUT1JTLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGaWx0ZXJzXHJcbiAgICAgICAgZm9yICh0eXBlIGluIFJfTUFUQ0hfRVhQUikge1xyXG4gICAgICAgICAgICByZWdleCA9IFJfTUFUQ0hfRVhQUlt0eXBlXTtcclxuICAgICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKHNvRmFyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaCAmJiAoIXByZUZpbHRlclt0eXBlXSB8fCAobWF0Y2ggPSBwcmVGaWx0ZXJbdHlwZV0obWF0Y2gpKSkpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hlZC5sZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW1hdGNoZWQpIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzdWJxdWVyeSkgeyBzdWJxdWVyaWVzLnB1c2goc3VicXVlcnkpOyB9XHJcblxyXG4gICAgLy8gUmV0dXJuIHRoZSBsZW5ndGggb2YgdGhlIGludmFsaWQgZXhjZXNzXHJcbiAgICAvLyBpZiB3ZSdyZSBqdXN0IHBhcnNpbmcuXHJcbiAgICBpZiAocGFyc2VPbmx5KSB7IHJldHVybiBzb0Zhci5sZW5ndGg7IH1cclxuXHJcbiAgICBpZiAoc29GYXIpIHsgZXJyb3Ioc2VsZWN0b3IpOyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHJldHVybiB0b2tlbkNhY2hlLnNldChzZWxlY3Rvciwgc3VicXVlcmllcykuc2xpY2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gICAgICogQHJldHVybiB7U3RyaW5nW118bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcgdGhlIHNlbGVjdG9yLlxyXG4gICAgICovXHJcbiAgICBzdWJxdWVyaWVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBzdWJxdWVyeUNhY2hlLmhhcyhzZWxlY3RvcikgPyBcclxuICAgICAgICAgICAgc3VicXVlcnlDYWNoZS5nZXQoc2VsZWN0b3IpIDogXHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5Q2FjaGUucHV0KHNlbGVjdG9yLCAoKSA9PiB0b2tlbml6ZShzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0Jvb2w6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gUl9NQVRDSF9FWFBSLmJvb2wudGVzdChuYW1lKTtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAyOyIsIm1vZHVsZS5leHBvcnRzID0gODsiLCJtb2R1bGUuZXhwb3J0cyA9IDk7IiwibW9kdWxlLmV4cG9ydHMgPSAxMTsiLCJtb2R1bGUuZXhwb3J0cyA9IDE7IiwibW9kdWxlLmV4cG9ydHMgPSAzOyIsIiAgICAvLyBNYXRjaGVzIFwiLW1zLVwiIHNvIHRoYXQgaXQgY2FuIGJlIGNoYW5nZWQgdG8gXCJtcy1cIlxyXG52YXIgVFJVTkNBVEVfTVNfUFJFRklYICA9IC9eLW1zLS8sXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBkYXNoZWQgc3RyaW5nIGZvciBjYW1lbGl6aW5nXHJcbiAgICBEQVNIX0NBVENIICAgICAgICAgID0gLy0oW1xcZGEtel0pL2dpLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgXCJub25lXCIgb3IgYSB0YWJsZSB0eXBlIGUuZy4gXCJ0YWJsZVwiLFxyXG4gICAgLy8gXCJ0YWJsZS1jZWxsXCIgZXRjLi4uXHJcbiAgICBOT05FX09SX1RBQkxFICAgICAgID0gL14obm9uZXx0YWJsZSg/IS1jW2VhXSkuKykvLFxyXG4gICAgXHJcbiAgICBUWVBFX1RFU1RfRk9DVVNBQkxFID0gL14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8YnV0dG9ufG9iamVjdCkkL2ksXHJcbiAgICBUWVBFX1RFU1RfQ0xJQ0tBQkxFID0gL14oPzphfGFyZWEpJC9pLFxyXG4gICAgU0VMRUNUT1JfSUQgICAgICAgICA9IC9eIyhbXFx3LV0rKSQvLFxyXG4gICAgU0VMRUNUT1JfVEFHICAgICAgICA9IC9eW1xcdy1dKyQvLFxyXG4gICAgU0VMRUNUT1JfQ0xBU1MgICAgICA9IC9eXFwuKFtcXHctXSspJC8sXHJcbiAgICBQT1NJVElPTiAgICAgICAgICAgID0gL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvLFxyXG4gICAgTlVNX05PTl9QWCAgICAgICAgICA9IG5ldyBSZWdFeHAoJ14oJyArICgvWystXT8oPzpcXGQqXFwufClcXGQrKD86W2VFXVsrLV0/XFxkK3wpLykuc291cmNlICsgJykoPyFweClbYS16JV0rJCcsICdpJyksXHJcbiAgICBTSU5HTEVfVEFHICAgICAgICAgID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFwIG9mIHBhcmVudCB0YWcgbmFtZXMgdG8gdGhlIGNoaWxkIHRhZ3MgdGhhdCByZXF1aXJlIHRoZW0uXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBQQVJFTlRfTUFQID0ge1xyXG4gICAgICAgIHRhYmxlOiAgICAvXjwoPzp0Ym9keXx0Zm9vdHx0aGVhZHxjb2xncm91cHxjYXB0aW9uKVxcYi8sXHJcbiAgICAgICAgdGJvZHk6ICAgIC9ePCg/OnRyKVxcYi8sXHJcbiAgICAgICAgdHI6ICAgICAgIC9ePCg/OnRkfHRoKVxcYi8sXHJcbiAgICAgICAgY29sZ3JvdXA6IC9ePCg/OmNvbClcXGIvLFxyXG4gICAgICAgIHNlbGVjdDogICAvXjwoPzpvcHRpb24pXFxiL1xyXG4gICAgfTtcclxuXHJcbi8vIGhhdmluZyBjYWNoZXMgaXNuJ3QgYWN0dWFsbHkgZmFzdGVyXHJcbi8vIGZvciBhIG1ham9yaXR5IG9mIHVzZSBjYXNlcyBmb3Igc3RyaW5nXHJcbi8vIG1hbmlwdWxhdGlvbnNcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBudW1Ob3RQeDogICAgICAgKHZhbCkgPT4gTlVNX05PTl9QWC50ZXN0KHZhbCksXHJcbiAgICBwb3NpdGlvbjogICAgICAgKHZhbCkgPT4gUE9TSVRJT04udGVzdCh2YWwpLFxyXG4gICAgc2luZ2xlVGFnTWF0Y2g6ICh2YWwpID0+IFNJTkdMRV9UQUcuZXhlYyh2YWwpLFxyXG4gICAgaXNOb25lT3JUYWJsZTogIChzdHIpID0+IE5PTkVfT1JfVEFCTEUudGVzdChzdHIpLFxyXG4gICAgaXNGb2N1c2FibGU6ICAgIChzdHIpID0+IFRZUEVfVEVTVF9GT0NVU0FCTEUudGVzdChzdHIpLFxyXG4gICAgaXNDbGlja2FibGU6ICAgIChzdHIpID0+IFRZUEVfVEVTVF9DTElDS0FCTEUudGVzdChzdHIpLFxyXG4gICAgaXNTdHJpY3RJZDogICAgIChzdHIpID0+IFNFTEVDVE9SX0lELnRlc3Qoc3RyKSxcclxuICAgIGlzVGFnOiAgICAgICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9UQUcudGVzdChzdHIpLFxyXG4gICAgaXNDbGFzczogICAgICAgIChzdHIpID0+IFNFTEVDVE9SX0NMQVNTLnRlc3Qoc3RyKSxcclxuXHJcbiAgICBjYW1lbENhc2U6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShUUlVOQ0FURV9NU19QUkVGSVgsICdtcy0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZShEQVNIX0NBVENILCAobWF0Y2gsIGxldHRlcikgPT4gbGV0dGVyLnRvVXBwZXJDYXNlKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRUYWdOYW1lOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgdmFsID0gc3RyLnN1YnN0cigwLCAzMCk7XHJcbiAgICAgICAgZm9yICh2YXIgcGFyZW50VGFnTmFtZSBpbiBQQVJFTlRfTUFQKSB7XHJcbiAgICAgICAgICAgIGlmIChQQVJFTlRfTUFQW3BhcmVudFRhZ05hbWVdLnRlc3QodmFsKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudFRhZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICdkaXYnO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgRElWICAgID0gcmVxdWlyZSgnRElWJyksXHJcbiAgICBjcmVhdGUgPSByZXF1aXJlKCdESVYvY3JlYXRlJyksXHJcbiAgICBhICAgICAgPSBESVYucXVlcnlTZWxlY3RvcignYScpLFxyXG4gICAgc2VsZWN0ID0gY3JlYXRlKCdzZWxlY3QnKSxcclxuICAgIG9wdGlvbiA9IHNlbGVjdC5hcHBlbmRDaGlsZChjcmVhdGUoJ29wdGlvbicpKTtcclxuXHJcbnZhciB0ZXN0ID0gZnVuY3Rpb24odGFnTmFtZSwgdGVzdEZuKSB7XHJcbiAgICAvLyBBdm9pZCB2YXJpYWJsZSByZWZlcmVuY2VzIHRvIGVsZW1lbnRzIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFLlxyXG4gICAgcmV0dXJuIHRlc3RGbihjcmVhdGUodGFnTmFtZSkpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBVUkxzIGFyZW4ndCBtYW5pcHVsYXRlZFxyXG4gICAgLy8gKElFIG5vcm1hbGl6ZXMgaXQgYnkgZGVmYXVsdClcclxuICAgIGhyZWZOb3JtYWxpemVkOiBhLmdldEF0dHJpYnV0ZSgnaHJlZicpID09PSAnL2EnLFxyXG5cclxuICAgIC8vIENoZWNrIHRoZSBkZWZhdWx0IGNoZWNrYm94L3JhZGlvIHZhbHVlICgnJyBpbiBvbGRlciBXZWJLaXQ7ICdvbicgZWxzZXdoZXJlKVxyXG4gICAgY2hlY2tPbjogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiAhIWlucHV0LnZhbHVlO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgYW4gaW5wdXQgbWFpbnRhaW5zIGl0cyB2YWx1ZSBhZnRlciBiZWNvbWluZyBhIHJhZGlvXHJcbiAgICAvLyBTdXBwb3J0OiBNb2Rlcm4gYnJvd3NlcnMgb25seSAoTk9UIElFIDw9IDExKVxyXG4gICAgcmFkaW9WYWx1ZTogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnZhbHVlID0gJ3QnO1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiBpbnB1dC52YWx1ZSA9PT0gJ3QnO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgYSBzZWxlY3RlZC1ieS1kZWZhdWx0IG9wdGlvbiBoYXMgYSB3b3JraW5nIHNlbGVjdGVkIHByb3BlcnR5LlxyXG4gICAgLy8gKFdlYktpdCBkZWZhdWx0cyB0byBmYWxzZSBpbnN0ZWFkIG9mIHRydWUsIElFIHRvbywgaWYgaXQncyBpbiBhbiBvcHRncm91cClcclxuICAgIG9wdFNlbGVjdGVkOiBvcHRpb24uc2VsZWN0ZWQsXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG9wdGlvbnMgaW5zaWRlIGRpc2FibGVkIHNlbGVjdHMgYXJlbid0IG1hcmtlZCBhcyBkaXNhYmxlZFxyXG4gICAgLy8gKFdlYktpdCBtYXJrcyB0aGVtIGFzIGRpc2FibGVkKVxyXG4gICAgb3B0RGlzYWJsZWQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICBzZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAhb3B0aW9uLmRpc2FibGVkO1xyXG4gICAgfSgpKSxcclxuXHJcbiAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgbm9ybWFsaXplIFxcclxcbiB0byBcXG4gaW4gdGV4dGFyZWEgdmFsdWVzLFxyXG4gICAgLy8gYnV0IElFIDw9IDExIChhbmQgcG9zc2libHkgbmV3ZXIpIGRvIG5vdC5cclxuICAgIHZhbHVlTm9ybWFsaXplZDogdGVzdCgndGV4dGFyZWEnLCBmdW5jdGlvbih0ZXh0YXJlYSkge1xyXG4gICAgICAgIHRleHRhcmVhLnZhbHVlID0gJ1xcclxcbic7XHJcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnZhbHVlID09PSAnXFxuJztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIHNlbGVjdGVkU2VsZWN0b3I6IHRlc3QoJ3NlbGVjdCcsIGZ1bmN0aW9uKHNlbGVjdCkge1xyXG4gICAgICAgIHNlbGVjdC5pbm5lckhUTUwgPSAnPG9wdGlvbiB2YWx1ZT1cIjFcIj4xPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cIjJcIiBzZWxlY3RlZD4yPC9vcHRpb24+JztcclxuICAgICAgICByZXR1cm4gISFzZWxlY3QucXVlcnlTZWxlY3Rvcignb3B0aW9uW3NlbGVjdGVkXScpO1xyXG4gICAgfSlcclxufTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IGEgPSBzZWxlY3QgPSBvcHRpb24gPSBudWxsO1xyXG4iLCJ2YXIgZXhpc3RzICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXJyYXkgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnaXMvYXJyYXlMaWtlJyksXHJcbiAgICBpc05vZGVMaXN0ICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBzbGljZSAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKTtcclxuXHJcbnZhciBfID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBGbGF0dGVuIHRoYXQgYWxzbyBjaGVja3MgaWYgdmFsdWUgaXMgYSBOb2RlTGlzdFxyXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChfLmZsYXR0ZW4odmFsdWUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ29uY2F0IGZsYXQgZm9yIGEgc2luZ2xlIGFycmF5IG9mIGFycmF5c1xyXG4gICAgY29uY2F0RmxhdDogKGZ1bmN0aW9uKGNvbmNhdCkge1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmVzdGVkQXJyYXlzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25jYXQuYXBwbHkoW10sIG5lc3RlZEFycmF5cyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KFtdLmNvbmNhdCkpLFxyXG5cclxuICAgIGV2ZXJ5OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdHMoYXJyKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAoIWl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4dGVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIG9iaiAgPSBhcmdzWzBdLFxyXG4gICAgICAgICAgICBsZW4gID0gYXJncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICghb2JqIHx8IGxlbiA8IDIpIHsgcmV0dXJuIG9iajsgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmdzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdGFuZGFyZCBtYXBcclxuICAgIG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBcnJheS1wcmVzZXJ2aW5nIG1hcFxyXG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vcHVzaC1tYXAtdnMtaW5kZXgtcmVwbGFjZW1lbnQtbWFwXHJcbiAgICBmYXN0bWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHRzOyB9XHJcbiAgICAgICAgaXRlcmF0b3IgPSBpdGVyYXRvciB8fCAoYXJnKSA9PiAhIWFyZztcclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXJyW2lkeF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHQ7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpKSB7IGJyZWFrOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gISFyZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHB1bGxlZCBmcm9tIEFNRFxyXG4gICAgdHlwZWNhc3Q6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSAnbnVsbCcpIHtcclxuICAgICAgICAgICAgciA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICByID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykge1xyXG4gICAgICAgICAgICByID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICcnIHx8IGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgLy8gaXNOYU4oJycpIHJldHVybnMgZmFsc2VcclxuICAgICAgICAgICAgciA9IHZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBwYXJzZUZsb2F0KG51bGwgfHwgJycpIHJldHVybnMgTmFOXHJcbiAgICAgICAgICAgIHIgPSBwYXJzZUZsb2F0KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZShvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycixcclxuICAgICAgICAgICAgbGVuID0gK29iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkob2JqLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJbaWR4XSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKG9ialtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUFycmF5OiBmdW5jdGlvbihhcmcpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcmcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGFyZy5zbGljZSA9PT0gc2xpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZy5zbGljZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaXNBcnJheUxpa2UoYXJnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2UoYXJnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFsgYXJnIF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihhcnIsIGl0ZW0pIHtcclxuICAgICAgICByZXR1cm4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdG9yKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAvLyBBcnJheS1saWtlXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbaWR4XSwgaWR4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQbGFpbiBvYmplY3RcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbcHJvcF0sIHByb3ApID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNTaXplOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBtZXJnZTogZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBzZWNvbmQubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgICAgICBpID0gZmlyc3QubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBHbyB0aHJvdWdoIGVhY2ggZWxlbWVudCBpbiB0aGVcclxuICAgICAgICAvLyBzZWNvbmQgYXJyYXkgYW5kIGFkZCBpdCB0byB0aGVcclxuICAgICAgICAvLyBmaXJzdFxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaWR4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcnN0Lmxlbmd0aCA9IGk7XHJcblxyXG4gICAgICAgIHJldHVybiBmaXJzdDtcclxuICAgIH1cclxufTsiLCJ2YXIgZGVsZXRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGRlbGV0YWJsZSA/IFxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgZGVsZXRlIHN0b3JlW2tleV07IH0gOlxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgc3RvcmVba2V5XSA9IHVuZGVmaW5lZDsgfTtcclxufTtcclxuXHJcbnZhciBnZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gc3RvcmUgJiYgc3RvcmVba2V5XSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleSwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIGRlbChzdG9yZSwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGJpTGV2ZWxHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgaGFzMSA9IGtleTEgaW4gc3RvcmUgJiYgc3RvcmVba2V5MV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKCFoYXMxIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoYXMxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ga2V5MiBpbiBzdG9yZVtrZXkxXSAmJiBzdG9yZVtrZXkxXVtrZXkyXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV07XHJcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gcmVmMSA6IChyZWYxICE9PSB1bmRlZmluZWQgPyByZWYxW2tleTJdIDogcmVmMSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICAvLyBFYXN5IHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWwoc3RvcmUsIGtleTEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEZWVwIHJlbW92YWxcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXSB8fCAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIGRlbChyZWYxLCBrZXkyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsdmwsIGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGx2bCA9PT0gMiA/IGJpTGV2ZWxHZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKSA6IGdldHRlclNldHRlcihkZWxldGFibGUpO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgK3ZhbHVlLmxlbmd0aCA9PT0gdmFsdWUubGVuZ3RoO1xyXG4iLCJ2YXIgRE9DVU1FTlRfRlJBR01FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlRfRlJBR01FTlQnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLm5vZGVUeXBlICE9PSBET0NVTUVOVF9GUkFHTUVOVCAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9kJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsInZhciBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzLnNldCA9IChEKSA9PiBjb25zdHJ1Y3RvciA9IEQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgRUxFTUVOVCAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCB2YWx1ZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgKCEhdmFsdWUgJiYgdHlwZSA9PT0gJ29iamVjdCcpO1xyXG59OyIsInZhciBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWwpID0+XHJcbiAgICB2YWwgJiYgKGlzU3RyaW5nKHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpIHx8IGlzRWxlbWVudCh2YWwpIHx8IGlzQ29sbGVjdGlvbih2YWwpKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJzsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IHZhbHVlLndpbmRvdztcclxuIiwidmFyIEVMRU1FTlQgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQgPyBtYXRjaGVzU2VsZWN0b3IuY2FsbChlbGVtLCBzZWxlY3RvcikgOiBmYWxzZTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IG51bGw7XHJcbiIsInZhciBfICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgPSByZXF1aXJlKCcuLi9EJyksXHJcbiAgICBleGlzdHMgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIHNsaWNlICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKSxcclxuICAgIG9yZGVyICA9IHJlcXVpcmUoJy4uL29yZGVyJyk7XHJcblxyXG52YXIgdW5pcXVlID0gZnVuY3Rpb24ocmVzdWx0cykge1xyXG4gICAgICAgIHZhciBoYXNEdXBsaWNhdGVzID0gb3JkZXIuc29ydChyZXN1bHRzKTtcclxuICAgICAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGVsZW0sXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgICAgICAvLyBzbyB0aGF0IGEgbmV3IGFycmF5IGlzbid0XHJcbiAgICAgICAgICAgIC8vIGNyZWF0ZWQvZGVzdHJveWVkIGV2ZXJ5IHVuaXF1ZSBjYWxsXHJcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gR28gdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGlkZW50aWZ5XHJcbiAgICAgICAgLy8gdGhlIGR1cGxpY2F0ZXMgdG8gYmUgcmVtb3ZlZFxyXG4gICAgICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbSA9PT0gcmVzdWx0c1tpZHhdKSB7XHJcbiAgICAgICAgICAgICAgICBkdXBsaWNhdGVzLnB1c2goaWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBkdXBsaWNhdGVzIGZyb20gdGhlIHJlc3VsdHNcclxuICAgICAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICByZXN1bHRzLnNwbGljZShkdXBsaWNhdGVzW2lkeF0sIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcCA9IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyLmxlbmd0aCB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGl0ZW07XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaXRlbSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLmNvbmNhdEZsYXQocmVzdWx0cyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdG9yKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAvLyBBcnJheSBzdXBwb3J0XHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaXRlbTtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0gPSBvYmpbaWR4XTtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGl0ZW0sIGl0ZW0sIGlkeCkgPT09IGZhbHNlKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPYmplY3Qgc3VwcG9ydFxyXG4gICAgICAgIHZhciBrZXksIHZhbHVlO1xyXG4gICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IG9ialtrZXldO1xyXG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbCh2YWx1ZSwgdmFsdWUsIGtleSkgPT09IGZhbHNlKSB7IHJldHVybjsgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGVsZW1lbnRTb3J0OiBvcmRlci5zb3J0LFxyXG4gICAgdW5pcXVlOiB1bmlxdWUsXHJcbiAgICBlYWNoOiBlYWNoLFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgYXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzWytpbmRleF07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICAgICAvLyBObyBpbmRleCwgcmV0dXJuIGFsbFxyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHRoaXMudG9BcnJheSgpOyB9XHJcblxyXG4gICAgICAgICAgICBpbmRleCA9ICtpbmRleDtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHsgaW5kZXggPSAodGhpcy5sZW5ndGggKyBpbmRleCk7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW2luZGV4XTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQodGhpcy5nZXQoaW5kZXgpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gRChzbGljZSh0aGlzLnRvQXJyYXkoKSwgc3RhcnQsIGVuZCkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQodGhpc1swXSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEKHRoaXNbdGhpcy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZSh0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBtYXA6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBEKG1hcCh0aGlzLCBpdGVyYXRvcikpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgICAgIGVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmb3JFYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgICAgICBlYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgICAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc0VsZW1lbnQnKSxcclxuICAgIG5ld2xpbmVzICAgICAgICAgICAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBpc05vZGVOYW1lICAgICAgICAgICA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxuLy8gSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbnZhciBoYXNBdHRyID0gKGVsZW0sIGF0dHIpID0+IGVsZW0uaGFzQXR0cmlidXRlKGF0dHIpO1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gaGFzQXR0cihlbGVtLCBhdHRyTmFtZSkgPyBhdHRyTmFtZS50b0xvd2VyQ2FzZSgpIDogdW5kZWZpbmVkLFxyXG4gICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSwgYXR0ck5hbWUpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBib29sZWFuIGF0dHJpYnV0ZXMgd2hlbiBzZXQgdG8gZmFsc2VcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyTmFtZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgaG9va3MgPSB7XHJcbiAgICAgICAgdGFiaW5kZXg6IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHRhYmluZGV4KSB8fCB0YWJpbmRleCA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFiaW5kZXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0eXBlOiB7XHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghU1VQUE9SVFMucmFkaW9WYWx1ZSAmJiB2YWx1ZSA9PT0gJ3JhZGlvJyAmJiBpc05vZGVOYW1lKGVsZW0sICdpbnB1dCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0dGluZyB0aGUgdHlwZSBvbiBhIHJhZGlvIGJ1dHRvbiBhZnRlciB0aGUgdmFsdWUgcmVzZXRzIHRoZSB2YWx1ZSBpbiBJRTYtOVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHZhbHVlIHRvIGRlZmF1bHQgaW4gY2FzZSB0eXBlIGlzIHNldCBhZnRlciB2YWx1ZSBkdXJpbmcgY3JlYXRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd0eXBlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0udmFsdWUgPSBvbGRWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd0eXBlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdsaW5lcyh2YWwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSB8fCAhaGFzQXR0cihlbGVtLCBhdHRyKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBib29sSG9vay5nZXQoZWxlbSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0uZ2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBob29rc1thdHRyXS5nZXQoZWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gZWxlbS5nZXRBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICAgICAgcmV0dXJuIGV4aXN0cyhyZXQpID8gcmV0IDogdW5kZWZpbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXR0ZXJzID0ge1xyXG4gICAgICAgIGZvckF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChib29sSG9vay5pcyhhdHRyKSAmJiAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuYm9vbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmhvb2s7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuZWxlbTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvb2w6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGJvb2xIb29rLnNldChlbGVtLCB2YWx1ZSwgYXR0cik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBob29rOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBob29rc1thdHRyXS5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWxlbTogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgc2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgaXNGbiAgID0gaXNGdW5jdGlvbih2YWx1ZSksXHJcbiAgICAgICAgICAgIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIHZhbCxcclxuICAgICAgICAgICAgc2V0dGVyID0gc2V0dGVycy5mb3JBdHRyKGF0dHIsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgIHZhbCA9IGlzRm4gPyB2YWx1ZS5jYWxsKGVsZW0sIGlkeCwgZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpKSA6IHZhbHVlO1xyXG4gICAgICAgICAgICBzZXR0ZXIoZWxlbSwgYXR0ciwgdmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgX3NldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBmbjoge1xyXG4gICAgICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGFzc3VtZSBhbiBvYmplY3RcclxuICAgICAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGF0dHIgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIGF0dHJzW2F0dHJdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkQXR0ciA9IGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCAgPSBmbi5jYWxsKGVsZW0sIGlkeCwgb2xkQXR0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRBdHRyaWJ1dGUoZWxlbSwgYXR0ciwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBzZXRcclxuICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGF0dHJEYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtYXAgID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ICA9IGtleXMubGVuZ3RoLCBrZXk7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgbWFwW3RyaW1EYXRhS2V5KGtleSldID0gXy50eXBlY2FzdChmaXJzdC5nZXRBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbaWR4XS5zZXRBdHRyaWJ1dGUoc2FuaXRpemVEYXRhS2V5KGtleSksICcnICsgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgICAgIHZhciBvYmogPSBrZXksXHJcbiAgICAgICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBFTEVNRU5UICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgc3BsaXQgICAgID0gcmVxdWlyZSgnc3RyaW5nL3NwbGl0JyksXHJcbiAgICBpc0VtcHR5ICAgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpO1xyXG5cclxudmFyIGhhc0NsYXNzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgICAgIHJldHVybiAhIWVsZW0uY2xhc3NMaXN0ICYmIGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRDbGFzc2VzID0gZnVuY3Rpb24oZWxlbSwgbmFtZXMpIHtcclxuICAgICAgICBpZiAoIWVsZW0uY2xhc3NMaXN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LmFkZChuYW1lc1tpZHhdKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtLCBuYW1lcykge1xyXG4gICAgICAgIGlmICghZWxlbS5jbGFzc0xpc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QucmVtb3ZlKG5hbWVzW2lkeF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtLmNsYXNzTGlzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC50b2dnbGUobmFtZXNbaWR4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBfZG9BbnlFbGVtc0hhdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lKSB7XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgaWYgKGhhc0NsYXNzKGVsZW1zW2VsZW1JZHhdLCBuYW1lKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIF9hZGRDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIWlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGFkZENsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIWlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBlbGVtc1tlbGVtSWR4XS5jbGFzc05hbWUgPSAnJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF90b2dnbGVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIWlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHRvZ2dsZUNsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBmbjoge1xyXG4gICAgICAgIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQgfHwgIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcbiAgICAgICAgICAgIHJldHVybiBfZG9BbnlFbGVtc0hhdmVDbGFzcyh0aGlzLCBuYW1lKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGRDbGFzczogZnVuY3Rpb24obmFtZXMpIHtcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgX2FkZENsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IHNwbGl0KG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBfYWRkQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9yZW1vdmVBbGxDbGFzc2VzKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZXMpIHx8ICFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXM7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gc3BsaXQobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIF9yZW1vdmVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2dnbGVDbGFzczogZnVuY3Rpb24obmFtZXMsIHNob3VsZEFkZCkge1xyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lcykgfHwgIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgbmFtZXMgPSBzcGxpdChuYW1lcyk7XHJcbiAgICAgICAgICAgIGlmICghbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2hvdWxkQWRkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIF90b2dnbGVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaG91bGRBZGQpIHtcclxuICAgICAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIF9yZW1vdmVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIHRvUHggICAgICAgPSByZXF1aXJlKCd1dGlsL3RvUHgnKSxcclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0RvY3VtZW50ID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTnVtYmVyICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzQm9vbGVhbiAgPSByZXF1aXJlKCdpcy9ib29sZWFuJyksXHJcbiAgICBpc09iamVjdCAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIHBhcnNlTnVtICAgPSByZXF1aXJlKCd1dGlsL3BhcnNlSW50JyksXHJcbiAgICBET0NVTUVOVCAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBzd2FwU2V0dGluZ3MgPSB7XHJcbiAgICBtZWFzdXJlRGlzcGxheToge1xyXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXHJcbiAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXREb2N1bWVudERpbWVuc2lvbiA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIC8vIEVpdGhlciBzY3JvbGxbV2lkdGgvSGVpZ2h0XSBvciBvZmZzZXRbV2lkdGgvSGVpZ2h0XSBvclxyXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0sIHdoaWNoZXZlciBpcyBncmVhdGVzdFxyXG4gICAgdmFyIGRvYyA9IGVsZW0uZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KFxyXG4gICAgICAgIGVsZW0uYm9keVsnc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGVsZW0uYm9keVsnb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBkb2NbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydjbGllbnQnICsgbmFtZV1cclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgaGlkZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9LFxyXG4gICAgc2hvdyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgY3NzU3dhcCA9IGZ1bmN0aW9uKGVsZW0sIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG9sZCA9IHt9O1xyXG5cclxuICAgICAgICAvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvbGRbbmFtZV0gPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhlbGVtKTtcclxuXHJcbiAgICAgICAgLy8gUmV2ZXJ0IHRoZSBvbGQgdmFsdWVzXHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9sZFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEF2b2lkcyBhbiAnSWxsZWdhbCBJbnZvY2F0aW9uJyBlcnJvciAoQ2hyb21lKVxyXG4gICAgLy8gQXZvaWRzIGEgJ1R5cGVFcnJvcjogQXJndW1lbnQgMSBvZiBXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkb2VzIG5vdCBpbXBsZW1lbnQgaW50ZXJmYWNlIEVsZW1lbnQnIGVycm9yIChGaXJlZm94KVxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZSA9IChlbGVtKSA9PlxyXG4gICAgICAgIGlzRWxlbWVudChlbGVtKSAmJiAhaXNXaW5kb3coZWxlbSkgJiYgIWlzRG9jdW1lbnQoZWxlbSkgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSA6IG51bGwsXHJcblxyXG4gICAgX3dpZHRoID0ge1xyXG4gICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBET0NVTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdXaWR0aCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAod2lkdGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBTZXR0aW5ncy5tZWFzdXJlRGlzcGxheSwgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLndpZHRoID0gaXNOdW1iZXIodmFsKSA/IHRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX2hlaWdodCA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gRE9DVU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnSGVpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgICAgaWYgKGhlaWdodCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcFNldHRpbmdzLm1lYXN1cmVEaXNwbGF5LCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gaXNOdW1iZXIodmFsKSA/IHRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgZ2V0V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuXHJcbiAgICAvLyBTdGFydCB3aXRoIG9mZnNldCBwcm9wZXJ0eSwgd2hpY2ggaXMgZXF1aXZhbGVudCB0byB0aGUgYm9yZGVyLWJveCB2YWx1ZVxyXG4gICAgdmFyIHZhbHVlSXNCb3JkZXJCb3ggPSB0cnVlLFxyXG4gICAgICAgIHZhbCA9IChuYW1lID09PSAnd2lkdGgnKSA/IGVsZW0ub2Zmc2V0V2lkdGggOiBlbGVtLm9mZnNldEhlaWdodCxcclxuICAgICAgICBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIGlzQm9yZGVyQm94ID0gc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnO1xyXG5cclxuICAgIC8vIHNvbWUgbm9uLWh0bWwgZWxlbWVudHMgcmV0dXJuIHVuZGVmaW5lZCBmb3Igb2Zmc2V0V2lkdGgsIHNvIGNoZWNrIGZvciBudWxsL3VuZGVmaW5lZFxyXG4gICAgLy8gc3ZnIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjQ5Mjg1XHJcbiAgICAvLyBNYXRoTUwgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD00OTE2NjhcclxuICAgIGlmICh2YWwgPD0gMCB8fCAhZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gY29tcHV0ZWQgdGhlbiB1bmNvbXB1dGVkIGNzcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICB2YWwgPSBjdXJDc3MoZWxlbSwgbmFtZSwgc3R5bGVzKTtcclxuICAgICAgICBpZiAodmFsIDwgMCB8fCAhdmFsKSB7IHZhbCA9IGVsZW0uc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZWQgdW5pdCBpcyBub3QgcGl4ZWxzLiBTdG9wIGhlcmUgYW5kIHJldHVybi5cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgodmFsKSkgeyByZXR1cm4gdmFsOyB9XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdGhlIGNoZWNrIGZvciBzdHlsZSBpbiBjYXNlIGEgYnJvd3NlciB3aGljaCByZXR1cm5zIHVucmVsaWFibGUgdmFsdWVzXHJcbiAgICAgICAgLy8gZm9yIGdldENvbXB1dGVkU3R5bGUgc2lsZW50bHkgZmFsbHMgYmFjayB0byB0aGUgcmVsaWFibGUgZWxlbS5zdHlsZVxyXG4gICAgICAgIHZhbHVlSXNCb3JkZXJCb3ggPSBpc0JvcmRlckJveCAmJiB2YWwgPT09IHN0eWxlc1tuYW1lXTtcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplICcnLCBhdXRvLCBhbmQgcHJlcGFyZSBmb3IgZXh0cmFcclxuICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHZhbCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1c2UgdGhlIGFjdGl2ZSBib3gtc2l6aW5nIG1vZGVsIHRvIGFkZC9zdWJ0cmFjdCBpcnJlbGV2YW50IHN0eWxlc1xyXG4gICAgcmV0dXJuIHRvUHgoXHJcbiAgICAgICAgdmFsICsgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQoXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcsXHJcbiAgICAgICAgICAgIHZhbHVlSXNCb3JkZXJCb3gsXHJcbiAgICAgICAgICAgIHN0eWxlc1xyXG4gICAgICAgIClcclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgQ1NTX0VYUEFORCA9IHNwbGl0KCdUb3B8UmlnaHR8Qm90dG9tfExlZnQnKTtcclxudmFyIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgZXh0cmEsIGlzQm9yZGVyQm94LCBzdHlsZXMpIHtcclxuICAgIHZhciB2YWwgPSAwLFxyXG4gICAgICAgIC8vIElmIHdlIGFscmVhZHkgaGF2ZSB0aGUgcmlnaHQgbWVhc3VyZW1lbnQsIGF2b2lkIGF1Z21lbnRhdGlvblxyXG4gICAgICAgIGlkeCA9IChleHRyYSA9PT0gKGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcpKSA/XHJcbiAgICAgICAgICAgIDQgOlxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UgaW5pdGlhbGl6ZSBmb3IgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIChuYW1lID09PSAnd2lkdGgnKSA/XHJcbiAgICAgICAgICAgIDEgOlxyXG4gICAgICAgICAgICAwLFxyXG4gICAgICAgIHR5cGUsXHJcbiAgICAgICAgLy8gUHVsbGVkIG91dCBvZiB0aGUgbG9vcCB0byByZWR1Y2Ugc3RyaW5nIGNvbXBhcmlzb25zXHJcbiAgICAgICAgZXh0cmFJc01hcmdpbiAgPSAoZXh0cmEgPT09ICdtYXJnaW4nKSxcclxuICAgICAgICBleHRyYUlzQ29udGVudCA9ICghZXh0cmFJc01hcmdpbiAmJiBleHRyYSA9PT0gJ2NvbnRlbnQnKSxcclxuICAgICAgICBleHRyYUlzUGFkZGluZyA9ICghZXh0cmFJc01hcmdpbiAmJiAhZXh0cmFJc0NvbnRlbnQgJiYgZXh0cmEgPT09ICdwYWRkaW5nJyk7XHJcblxyXG4gICAgZm9yICg7IGlkeCA8IDQ7IGlkeCArPSAyKSB7XHJcbiAgICAgICAgdHlwZSA9IENTU19FWFBBTkRbaWR4XTtcclxuXHJcbiAgICAgICAgLy8gYm90aCBib3ggbW9kZWxzIGV4Y2x1ZGUgbWFyZ2luLCBzbyBhZGQgaXQgaWYgd2Ugd2FudCBpdFxyXG4gICAgICAgIGlmIChleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIHZhbCArPSBwYXJzZU51bShzdHlsZXNbZXh0cmEgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0JvcmRlckJveCkge1xyXG5cclxuICAgICAgICAgICAgLy8gYm9yZGVyLWJveCBpbmNsdWRlcyBwYWRkaW5nLCBzbyByZW1vdmUgaXQgaWYgd2Ugd2FudCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IHBhcnNlTnVtKHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgYm9yZGVyIG5vciBtYXJnaW4sIHNvIHJlbW92ZSBib3JkZXJcclxuICAgICAgICAgICAgaWYgKCFleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gcGFyc2VOdW0oc3R5bGVzWydib3JkZXInICsgdHlwZSArICdXaWR0aCddKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBjb250ZW50LCBzbyBhZGQgcGFkZGluZ1xyXG4gICAgICAgICAgICB2YWwgKz0gcGFyc2VOdW0oc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCBub3IgcGFkZGluZywgc28gYWRkIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc1BhZGRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhbCArPSBwYXJzZU51bShzdHlsZXNbJ2JvcmRlcicgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxudmFyIGdldFByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbihzdHlsZXMsIG5hbWUpIHtcclxuICAgIHJldHVybiBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKTtcclxufTtcclxuXHJcbnZhciBjdXJDc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBjb21wdXRlZCkge1xyXG4gICAgdmFyIHN0eWxlID0gZWxlbS5zdHlsZSxcclxuICAgICAgICBzdHlsZXMgPSBjb21wdXRlZCB8fCBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIHJldCA9IHN0eWxlcyA/IGdldFByb3BlcnR5VmFsdWUoc3R5bGVzLCBuYW1lKSB8fCBzdHlsZXNbbmFtZV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQXZvaWQgc2V0dGluZyByZXQgdG8gZW1wdHkgc3RyaW5nIGhlcmVcclxuICAgIC8vIHNvIHdlIGRvbid0IGRlZmF1bHQgdG8gYXV0b1xyXG4gICAgaWYgKCFleGlzdHMocmV0KSAmJiBzdHlsZSAmJiBzdHlsZVtuYW1lXSkgeyByZXQgPSBzdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgIC8vIEZyb20gdGhlIGhhY2sgYnkgRGVhbiBFZHdhcmRzXHJcbiAgICAvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXHJcblxyXG4gICAgaWYgKHN0eWxlcykge1xyXG4gICAgICAgIGlmIChyZXQgPT09ICcnICYmICFpc0F0dGFjaGVkKGVsZW0pKSB7XHJcbiAgICAgICAgICAgIHJldCA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgcmVndWxhciBwaXhlbCBudW1iZXJcclxuICAgICAgICAvLyBidXQgYSBudW1iZXIgdGhhdCBoYXMgYSB3ZWlyZCBlbmRpbmcsIHdlIG5lZWQgdG8gY29udmVydCBpdCB0byBwaXhlbHNcclxuICAgICAgICAvLyBidXQgbm90IHBvc2l0aW9uIGNzcyBhdHRyaWJ1dGVzLCBhcyB0aG9zZSBhcmUgcHJvcG9ydGlvbmFsIHRvIHRoZSBwYXJlbnQgZWxlbWVudCBpbnN0ZWFkXHJcbiAgICAgICAgLy8gYW5kIHdlIGNhbid0IG1lYXN1cmUgdGhlIHBhcmVudCBpbnN0ZWFkIGJlY2F1c2UgaXQgbWlnaHQgdHJpZ2dlciBhICdzdGFja2luZyBkb2xscycgcHJvYmxlbVxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeChyZXQpICYmICFSRUdFWC5wb3NpdGlvbihuYW1lKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICBycyA9IGVsZW0ucnVudGltZVN0eWxlLFxyXG4gICAgICAgICAgICAgICAgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDsgfVxyXG5cclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IChuYW1lID09PSAnZm9udFNpemUnKSA/ICcxZW0nIDogcmV0O1xyXG4gICAgICAgICAgICByZXQgPSB0b1B4KHN0eWxlLnBpeGVsTGVmdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXZlcnQgdGhlIGNoYW5nZWQgdmFsdWVzXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSByc0xlZnQ7IH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJldCA9PT0gdW5kZWZpbmVkID8gcmV0IDogcmV0ICsgJycgfHwgJ2F1dG8nO1xyXG59O1xyXG5cclxudmFyIG5vcm1hbGl6ZUNzc0tleSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHJldHVybiBSRUdFWC5jYW1lbENhc2UobmFtZSk7XHJcbn07XHJcblxyXG52YXIgc2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIGVsZW0uc3R5bGVbbmFtZV0gPSAodmFsdWUgPT09ICt2YWx1ZSkgPyB0b1B4KHZhbHVlKSA6IHZhbHVlO1xyXG59O1xyXG5cclxudmFyIGdldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKGVsZW0pW25hbWVdO1xyXG59O1xyXG5cclxudmFyIGlzSGlkZGVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBTdGFuZGFyZDpcclxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50Lm9mZnNldFBhcmVudFxyXG4gICAgcmV0dXJuIGVsZW0ub2Zmc2V0UGFyZW50ID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgIC8vIFN1cHBvcnQ6IE9wZXJhIDw9IDEyLjEyXHJcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcG9ydHMgb2Zmc2V0V2lkdGhzIGFuZCBvZmZzZXRIZWlnaHRzIGxlc3MgdGhhbiB6ZXJvIG9uIHNvbWUgZWxlbWVudHNcclxuICAgICAgICAgICAgZWxlbS5vZmZzZXRXaWR0aCA8PSAwICYmIGVsZW0ub2Zmc2V0SGVpZ2h0IDw9IDAgfHxcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2tcclxuICAgICAgICAgICAgKChlbGVtLnN0eWxlICYmIGVsZW0uc3R5bGUuZGlzcGxheSkgPyBlbGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyA6IGZhbHNlKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc3dhcDogICAgICAgIGNzc1N3YXAsXHJcbiAgICBzd2FwU2V0dGluZzogc3dhcFNldHRpbmdzLFxyXG4gICAgY3VyQ3NzOiAgICAgIGN1ckNzcyxcclxuICAgIHdpZHRoOiAgICAgICBfd2lkdGgsXHJcbiAgICBoZWlnaHQ6ICAgICAgX2hlaWdodCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNzczogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwga2V5LCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpZHgpIHsgcmV0dXJuIHJldDsgfSAvLyByZXR1cm4gZWFybHlcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldFt2YWx1ZV0gPSBnZXRTdHlsZShmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgaGlkZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBzaG93KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Jvb2xlYW4oc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgPyB0aGlzLnNob3coKSA6IHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBpc0hpZGRlbihlbGVtKSA/IHNob3coZWxlbSkgOiBoaWRlKGVsZW0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBjYWNoZSAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIsIHRydWUpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgQUNDRVNTT1IgID0gJ19fRF9pZF9fICcsXHJcbiAgICB1bmlxdWVJZCAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZChEYXRlLm5vdygpKSxcclxuXHJcbiAgICBnZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbSA/IGVsZW1bQUNDRVNTT1JdIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3JTZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IChpZCA9IGVsZW1bQUNDRVNTT1JdKSkgeyByZXR1cm4gaWQ7IH1cclxuICAgICAgICBlbGVtW0FDQ0VTU09SXSA9IChpZCA9IHVuaXF1ZUlkKCkpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFzRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmhhcyhpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gZ2V0T3JTZXRJZChlbGVtKTtcclxuICAgICAgICByZXR1cm4gY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlRGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBoYXM6IGhhc0RhdGEsXHJcbiAgICBzZXQ6IHNldERhdGEsXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0sIHN0cikge1xyXG4gICAgICAgIGlmIChzdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0QWxsRGF0YShlbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdldERhdGEoZWxlbSwgc3RyKTtcclxuICAgIH0sXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKGVsZW0sIHN0cikge1xyXG4gICAgICAgIGlmIChzdHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsRGF0YShlbGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlbW92ZURhdGEoZWxlbSwgc3RyKTtcclxuICAgIH0sXHJcblxyXG4gICAgRDoge1xyXG4gICAgICAgIC8vIE5PVEU6IE5vZGVMaXN0IHx8IEh0bWxDb2xsZWN0aW9uIHN1cHBvcnQ/XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldERhdGEoZWxlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHBhc3NlZFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleTtcclxuICAgICAgICAgICAgICAgIHZhciBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGtleTtcclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWxsRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzRGF0YTogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFzRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGtleTtcclxuICAgICAgICAgICAgICAgIHZhciBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVBbGxEYXRhKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQga2V5J3MgdmFsdWVcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIE5PVEU6IE5vZGVMaXN0IHx8IEh0bWxDb2xsZWN0aW9uIHN1cHBvcnQ/XHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtSWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tlbGVtSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJJZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFycklkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbYXJySWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIHBhcnNlTnVtID0gcmVxdWlyZSgndXRpbC9wYXJzZUludCcpLFxyXG4gICAgaXNOdW1iZXIgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGNzcyAgICAgID0gcmVxdWlyZSgnLi9jc3MnKTtcclxuXHJcbnZhciBnZXRJbm5lcldpZHRoID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciB3aWR0aCA9IHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChlbGVtKSkgfHwgMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoICtcclxuICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdMZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChwYXJzZU51bShjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nUmlnaHQnKSkgfHwgMCk7XHJcbiAgICB9LFxyXG4gICAgZ2V0SW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1RvcCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0ZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBnZXRJbm5lcldpZHRoKGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICB3aWR0aCArPSAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luTGVmdCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luUmlnaHQnKSkgfHwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gd2lkdGggK1xyXG4gICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyTGVmdFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChwYXJzZU51bShjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJSaWdodFdpZHRoJykpIHx8IDApO1xyXG4gICAgfSxcclxuICAgIGdldE91dGVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBnZXRJbm5lckhlaWdodChlbGVtKTtcclxuXHJcbiAgICAgICAgaWYgKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgaGVpZ2h0ICs9IChwYXJzZU51bShjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Ub3AnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkJvdHRvbScpKSB8fCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAocGFyc2VOdW0oY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyVG9wV2lkdGgnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKHBhcnNlTnVtKGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckJvdHRvbVdpZHRoJykpIHx8IDApO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICB3aWR0aDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNzcy53aWR0aC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhlaWdodDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNzcy5oZWlnaHQuc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbm5lcldpZHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRJbm5lcldpZHRoKGZpcnN0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbm5lckhlaWdodDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0SW5uZXJIZWlnaHQoZmlyc3QpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG91dGVyV2lkdGg6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3V0ZXJXaWR0aChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvdXRlckhlaWdodDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPdXRlckhlaWdodChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBoYW5kbGVycyA9IHt9O1xyXG5cclxudmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24obmFtZSwgdHlwZSwgZmlsdGVyKSB7XHJcbiAgICBoYW5kbGVyc1tuYW1lXSA9IHtcclxuICAgICAgICBldmVudDogdHlwZSxcclxuICAgICAgICBmaWx0ZXI6IGZpbHRlcixcclxuICAgICAgICB3cmFwOiBmdW5jdGlvbihmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlcihuYW1lLCBmbik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciB3cmFwcGVyID0gZnVuY3Rpb24obmFtZSwgZm4pIHtcclxuICAgIGlmICghZm4pIHsgcmV0dXJuIGZuOyB9XHJcblxyXG4gICAgdmFyIGtleSA9ICdfX2RjZV8nICsgbmFtZTtcclxuICAgIGlmIChmbltrZXldKSB7IHJldHVybiBmbltrZXldOyB9XHJcblxyXG4gICAgcmV0dXJuIGZuW2tleV0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gaGFuZGxlcnNbbmFtZV0uZmlsdGVyKGUpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTsgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnJlZ2lzdGVyKCdsZWZ0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ21pZGRsZS1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAyICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdyaWdodC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAzICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlZ2lzdGVyOiByZWdpc3RlcixcclxuICAgIGhhbmRsZXJzOiBoYW5kbGVyc1xyXG59OyIsInZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgbWF0Y2hlcyAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyksXHJcbiAgICBkZWxlZ2F0ZXMgPSB7fTtcclxuXHJcbi8vIHRoaXMgbWV0aG9kIGNhY2hlcyBkZWxlZ2F0ZXMgc28gdGhhdCAub2ZmKCkgd29ya3Mgc2VhbWxlc3NseVxyXG52YXIgZGVsZWdhdGUgPSBmdW5jdGlvbihyb290LCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmIChkZWxlZ2F0ZXNbZm4uX2RkXSkgeyByZXR1cm4gZGVsZWdhdGVzW2ZuLl9kZF07IH1cclxuXHJcbiAgICB2YXIgaWQgPSBmbi5fZGQgPSBEYXRlLm5vdygpO1xyXG4gICAgcmV0dXJuIGRlbGVnYXRlc1tpZF0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgd2hpbGUgKGVsICYmIGVsICE9PSByb290KSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVzKGVsLCBzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZXZlbnRlZCA9IGZ1bmN0aW9uKG1ldGhvZCwgZWwsIHR5cGUsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKCFleGlzdHMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBmbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZGVsZWdhdGUoZWwsIHNlbGVjdG9yLCBmbikpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvbjogICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmFkZCksXHJcbiAgICBvZmY6ICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LnJlbW92ZSksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmZhYnJpY2F0ZSlcclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgZGVsZWdhdGUgICA9IHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcclxuICAgIGN1c3RvbSAgICAgPSByZXF1aXJlKCcuL2N1c3RvbScpO1xyXG5cclxudmFyIGV2ZW50ZXIgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbih0eXBlcywgZmlsdGVyLCBmbikge1xyXG4gICAgICAgIHZhciB0eXBlbGlzdCA9IHR5cGVzLnNwbGl0KCcgJyk7XHJcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xyXG4gICAgICAgICAgICBmbiA9IGZpbHRlcjtcclxuICAgICAgICAgICAgZmlsdGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgXy5lYWNoKHR5cGVsaXN0LCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IGN1c3RvbS5oYW5kbGVyc1t0eXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIGhhbmRsZXIuZXZlbnQsIGZpbHRlciwgaGFuZGxlci53cmFwKGZuKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCB0eXBlLCBmaWx0ZXIsIGZuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBmbjoge1xyXG4gICAgICAgIG9uOiAgICAgIGV2ZW50ZXIoZGVsZWdhdGUub24pLFxyXG4gICAgICAgIG9mZjogICAgIGV2ZW50ZXIoZGVsZWdhdGUub2ZmKSxcclxuICAgICAgICB0cmlnZ2VyOiBldmVudGVyKGRlbGVnYXRlLnRyaWdnZXIpXHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0QnKSxcclxuICAgIGV4aXN0cyAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNEICAgICAgICAgID0gcmVxdWlyZSgnaXMvZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNIdG1sICAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNOdW1iZXIgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNDb2xsZWN0aW9uID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgID0gcmVxdWlyZSgnaXMvZCcpLFxyXG4gICAgaXNXaW5kb3cgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgc2VsZWN0b3JzICAgID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMnKSxcclxuICAgIGFycmF5ICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXknKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJy4uL29yZGVyJyksXHJcbiAgICBkYXRhICAgICAgICAgPSByZXF1aXJlKCcuL2RhdGEnKSxcclxuICAgIHBhcnNlciAgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpO1xyXG5cclxudmFyIGVtcHR5ID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gYXJyW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBlbGVtLmNsb25lTm9kZSh0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZnJhZy50ZXh0Q29udGVudCA9IHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCBwYXJzZXIoZWxlbSksIHBlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHN0cmluZ1RvRnJhZyhyZXN1bHQpKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNFbGVtZW50KHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHJlc3VsdCwgcGVuZGVyKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSA9IGZ1bmN0aW9uKGFyck9uZSwgYXJyVHdvLCBwZW5kZXIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyT25lLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGxlbiA9IGFyclR3by5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihhcnJPbmVbaWR4XSwgYXJyVHdvW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVsZW0sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGFyckVsZW0sIGVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbSA9IGZ1bmN0aW9uKGVsZW0sIGFyciwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoZWxlbSwgYXJyRWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgfSxcclxuICAgIHByZXBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5pbnNlcnRCZWZvcmUoZWxlbSwgYmFzZS5maXJzdENoaWxkKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFwcGVuZCAgOiBhcHBlbmQsXHJcbiAgICBwcmVwZW5kIDogcHJlcGVuZCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmFzdG1hcCh0aGlzLnNsaWNlKCksIChlbGVtKSA9PiBjbG9uZShlbGVtKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIGFwcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgaWYgKGlzRChkKSkge1xyXG4gICAgICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyKHZhbHVlKSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIHByZXBlbmQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJlcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgICAgIGQucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICAgICAgRChvYmopLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgZW1wdHkodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgLy8gU3RyaW5nIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtcyA9IGFycmF5LnVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICBbXS5jb25jYXQodGhpcy5nZXQoKSwgRChzZWxlY3RvcikuZ2V0KCkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFycmF5IG9mIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSBhcnJheS51bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIF8udG9BcnJheShhcnIpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTaW5nbGUgZWxlbWVudFxyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpIHx8IGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSBhcnJheS51bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIFsgZWxlbSBdKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gRCh0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3JzLmZpbHRlcih0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICByZW1vdmUoYXJyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZW1vdmUodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRldGFjaDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcnMuZmlsdGVyKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIGRldGFjaChhcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIGRldGFjaCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaXNSZWFkeSA9IGZhbHNlLFxyXG4gICAgcmVnaXN0cmF0aW9uID0gW107XHJcblxyXG52YXIgYmluZCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbnZhciBtYWtlQ2FsbHMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgIGxlbmd0aCA9IHJlZ2lzdHJhdGlvbi5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbltpZHhdKCk7XHJcbiAgICB9XHJcbiAgICByZWdpc3RyYXRpb24ubGVuZ3RoID0gMDtcclxufTtcclxuXHJcbmJpbmQoZnVuY3Rpb24oKSB7XHJcbiAgICBpc1JlYWR5ID0gdHJ1ZTtcclxuICAgIG1ha2VDYWxscygpO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgIGlmIChpc1JlYWR5KSB7XHJcbiAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbi5wdXNoKGNhbGxiYWNrKTtcclxuICAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCcuLi9EJyksXHJcbiAgICB0b1B4ICAgICAgID0gcmVxdWlyZSgndXRpbC90b1B4JyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcblxyXG4gICAgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuXHJcbnZhciBnZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiBlbGVtLm9mZnNldFRvcCB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IGVsZW0ub2Zmc2V0TGVmdCB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciByZWN0ID0gaXNBdHRhY2hlZChlbGVtKSA/IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7fTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogIChyZWN0LnRvcCAgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCkgIHx8IDAsXHJcbiAgICAgICAgbGVmdDogKHJlY3QubGVmdCArIGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCkgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtLCBpZHgsIHBvcykge1xyXG4gICAgdmFyIHBvc2l0aW9uID0gZWxlbS5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJyxcclxuICAgICAgICBwcm9wcyAgICA9IHt9O1xyXG5cclxuICAgIC8vIHNldCBwb3NpdGlvbiBmaXJzdCwgaW4tY2FzZSB0b3AvbGVmdCBhcmUgc2V0IGV2ZW4gb24gc3RhdGljIGVsZW1cclxuICAgIGlmIChwb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHsgZWxlbS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7IH1cclxuXHJcbiAgICB2YXIgY3VyT2Zmc2V0ICAgICAgICAgPSBnZXRPZmZzZXQoZWxlbSksXHJcbiAgICAgICAgY3VyQ1NTVG9wICAgICAgICAgPSBlbGVtLnN0eWxlLnRvcCxcclxuICAgICAgICBjdXJDU1NMZWZ0ICAgICAgICA9IGVsZW0uc3R5bGUubGVmdCxcclxuICAgICAgICBjYWxjdWxhdGVQb3NpdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyB8fCBwb3NpdGlvbiA9PT0gJ2ZpeGVkJykgJiYgKGN1ckNTU1RvcCA9PT0gJ2F1dG8nIHx8IGN1ckNTU0xlZnQgPT09ICdhdXRvJyk7XHJcblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocG9zKSkge1xyXG4gICAgICAgIHBvcyA9IHBvcy5jYWxsKGVsZW0sIGlkeCwgY3VyT2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY3VyVG9wLCBjdXJMZWZ0O1xyXG4gICAgLy8gbmVlZCB0byBiZSBhYmxlIHRvIGNhbGN1bGF0ZSBwb3NpdGlvbiBpZiBlaXRoZXIgdG9wIG9yIGxlZnQgaXMgYXV0byBhbmQgcG9zaXRpb24gaXMgZWl0aGVyIGFic29sdXRlIG9yIGZpeGVkXHJcbiAgICBpZiAoY2FsY3VsYXRlUG9zaXRpb24pIHtcclxuICAgICAgICB2YXIgY3VyUG9zaXRpb24gPSBnZXRQb3NpdGlvbihlbGVtKTtcclxuICAgICAgICBjdXJUb3AgID0gY3VyUG9zaXRpb24udG9wO1xyXG4gICAgICAgIGN1ckxlZnQgPSBjdXJQb3NpdGlvbi5sZWZ0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdXJUb3AgID0gcGFyc2VGbG9hdChjdXJDU1NUb3ApICB8fCAwO1xyXG4gICAgICAgIGN1ckxlZnQgPSBwYXJzZUZsb2F0KGN1ckNTU0xlZnQpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV4aXN0cyhwb3MudG9wKSkgIHsgcHJvcHMudG9wICA9IChwb3MudG9wICAtIGN1ck9mZnNldC50b3ApICArIGN1clRvcDsgIH1cclxuICAgIGlmIChleGlzdHMocG9zLmxlZnQpKSB7IHByb3BzLmxlZnQgPSAocG9zLmxlZnQgLSBjdXJPZmZzZXQubGVmdCkgKyBjdXJMZWZ0OyB9XHJcblxyXG4gICAgZWxlbS5zdHlsZS50b3AgID0gdG9QeChwcm9wcy50b3ApO1xyXG4gICAgZWxlbS5zdHlsZS5sZWZ0ID0gdG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZnNldDogZnVuY3Rpb24ocG9zT3JJdGVyYXRvcikge1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHx8IGlzT2JqZWN0KHBvc09ySXRlcmF0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+IHNldE9mZnNldChlbGVtLCBpZHgsIHBvc09ySXRlcmF0b3IpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb2Zmc2V0UGFyZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IGRvY0VsZW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgKCFpc05vZGVOYW1lKG9mZnNldFBhcmVudCwgJ2h0bWwnKSAmJiAob2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnKSA9PT0gJ3N0YXRpYycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IGRvY0VsZW07XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIHBhcnNlTnVtICAgPSByZXF1aXJlKCd1dGlsL3BhcnNlSW50JyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBURVhUICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL1RFWFQnKSxcclxuICAgIENPTU1FTlQgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvQ09NTUVOVCcpLFxyXG4gICAgQVRUUklCVVRFICA9IHJlcXVpcmUoJ05PREVfVFlQRS9BVFRSSUJVVEUnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHByb3BGaXggPSBzcGxpdCgndGFiSW5kZXh8cmVhZE9ubHl8Y2xhc3NOYW1lfG1heExlbmd0aHxjZWxsU3BhY2luZ3xjZWxsUGFkZGluZ3xyb3dTcGFufGNvbFNwYW58dXNlTWFwfGZyYW1lQm9yZGVyfGNvbnRlbnRFZGl0YWJsZScpXHJcbiAgICAucmVkdWNlKGZ1bmN0aW9uKG9iaiwgc3RyKSB7XHJcbiAgICAgICAgb2JqW3N0ci50b0xvd2VyQ2FzZSgpXSA9IHN0cjtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSwge1xyXG4gICAgICAgICdmb3InOiAgICdodG1sRm9yJyxcclxuICAgICAgICAnY2xhc3MnOiAnY2xhc3NOYW1lJ1xyXG4gICAgfSk7XHJcblxyXG52YXIgcHJvcEhvb2tzID0ge1xyXG4gICAgc3JjOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NyYycsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaHJlZjogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdocmVmJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBTYWZhcmksIElFOStcclxuICAgIC8vIG1pcy1yZXBvcnRzIHRoZSBkZWZhdWx0IHNlbGVjdGVkIHByb3BlcnR5IG9mIGFuIG9wdGlvblxyXG4gICAgLy8gQWNjZXNzaW5nIHRoZSBwYXJlbnQncyBzZWxlY3RlZEluZGV4IHByb3BlcnR5IGZpeGVzIGl0XHJcbiAgICBzZWxlY3RlZDogU1VQUE9SVFMub3B0U2VsZWN0ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgIGZpeDtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGl0IGFsc28gd29ya3Mgd2l0aCBvcHRncm91cHMsIHNlZSAjNTcwMVxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRhYkluZGV4OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIGVsZW0udGFiSW5kZXggZG9lc24ndCBhbHdheXMgcmV0dXJuIHRoZSBjb3JyZWN0IHZhbHVlIHdoZW4gaXQgaGFzbid0IGJlZW4gZXhwbGljaXRseSBzZXRcclxuICAgICAgICAgICAgLy8gaHR0cDovL2ZsdWlkcHJvamVjdC5vcmcvYmxvZy8yMDA4LzAxLzA5L2dldHRpbmctc2V0dGluZy1hbmQtcmVtb3ZpbmctdGFiaW5kZXgtdmFsdWVzLXdpdGgtamF2YXNjcmlwdC9cclxuICAgICAgICAgICAgLy8gVXNlIHByb3BlciBhdHRyaWJ1dGUgcmV0cmlldmFsKCMxMjA3MilcclxuICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFiaW5kZXgpIHsgcmV0dXJuIHBhcnNlTnVtKHRhYmluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChSRUdFWC5pc0ZvY3VzYWJsZShub2RlTmFtZSkgfHwgKFJFR0VYLmlzQ2xpY2thYmxlKG5vZGVOYW1lKSAmJiBlbGVtLmhyZWYpKSA/IDAgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0T3JTZXRQcm9wID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIHZhciBub2RlVHlwZSA9IGVsZW0ubm9kZVR5cGU7XHJcblxyXG4gICAgLy8gZG9uJ3QgZ2V0L3NldCBwcm9wZXJ0aWVzIG9uIHRleHQsIGNvbW1lbnQgYW5kIGF0dHJpYnV0ZSBub2Rlc1xyXG4gICAgaWYgKCFlbGVtIHx8IG5vZGVUeXBlID09PSBURVhUIHx8IG5vZGVUeXBlID09PSBDT01NRU5UIHx8IG5vZGVUeXBlID09PSBBVFRSSUJVVEUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRml4IG5hbWUgYW5kIGF0dGFjaCBob29rc1xyXG4gICAgbmFtZSA9IHByb3BGaXhbbmFtZV0gfHwgbmFtZTtcclxuICAgIHZhciBob29rcyA9IHByb3BIb29rc1tuYW1lXTtcclxuXHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gaG9va3MgJiYgKCdzZXQnIGluIGhvb2tzKSAmJiAocmVzdWx0ID0gaG9va3Muc2V0KGVsZW0sIHZhbHVlLCBuYW1lKSkgIT09IHVuZGVmaW5lZCA/XHJcbiAgICAgICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgICAgIChlbGVtW25hbWVdID0gdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBob29rcyAmJiAoJ2dldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5nZXQoZWxlbSwgbmFtZSkpICE9PSBudWxsID9cclxuICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgIGVsZW1bbmFtZV07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgcHJvcDogZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRPclNldFByb3AoZmlyc3QsIHByb3ApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3ApKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZVByb3A6IGZ1bmN0aW9uKHByb3ApIHtcclxuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBwcm9wRml4W3Byb3BdIHx8IHByb3A7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIGNvZXJjZU51bSA9IHJlcXVpcmUoJ3V0aWwvY29lcmNlTnVtJyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwcm90ZWN0KHRoaXMsIHZhbCwgc2Nyb2xsTGVmdCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxUb3ApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2QnKSxcclxuICAgIGFycmF5ICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXknKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJy4uL29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG52YXIgZmlsdGVyID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZmlsdGVyOiBmaWx0ZXIsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBoYXM6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHRhcmdldHMgPSB0aGlzLmZpbmQodGFyZ2V0KSxcclxuICAgICAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcmRlci5jb250YWlucyhlbGVtLCB0YXJnZXRzW2lkeF0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSwgaWR4KSA9PiAhIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG5vdDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBpcy5ub3QodGhpcylcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gXy50b0FycmF5KHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiAhXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+ICFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtICE9PSBjb250ZXh0KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZmluZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHNlbGVjdG9yKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJheS5lbGVtZW50U29ydChyZXN1bHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfLm1lcmdlKEQoKSwgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZmlsdGVyOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBEKCk7IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGVja2VyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiBjaGVja2VyLmNhbGwoZWxlbSwgZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiBEKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0QnKSxcclxuICAgIEVMRU1FTlQgICAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIERPQ1VNRU5UICAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBET0NVTUVOVF9GUkFHTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXR0YWNoZWQgICAgICAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzRCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvZCcpLFxyXG4gICAgYXJyYXkgICAgICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICAgICAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIGdldFNpYmxpbmdzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNpYnMgPSBfZ2V0Tm9kZVNpYmxpbmdzKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJzLmxlbmd0aCkgeyByZXN1bHQucHVzaChzaWJzKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXROb2RlU2libGluZ3MgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNpYnMgPSBfLnRvQXJyYXkocGFyZW50LmNoaWxkcmVuKSxcclxuICAgICAgICAgICAgaWR4ICA9IHNpYnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgLy8gRXhjbHVkZSB0aGUgbm9kZSBpdHNlbGYgZnJvbSB0aGUgbGlzdCBvZiBpdHMgcGFyZW50J3MgY2hpbGRyZW5cclxuICAgICAgICAgICAgaWYgKHNpYnNbaWR4XSA9PT0gbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgc2licy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNpYnM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENoaWxkcmVuIC0tLS0tLVxyXG4gICAgZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKF8ubWFwKGFyciwgX2NoaWxkcmVuKSk7XHJcbiAgICB9LFxyXG4gICAgX2NoaWxkcmVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBraWRzID0gZWxlbS5jaGlsZHJlbixcclxuICAgICAgICAgICAgaWR4ICA9IDAsIGxlbiAgPSBraWRzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyICA9IG5ldyBBcnJheShsZW4pO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0ga2lkc1tpZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnRzIC0tLS0tLVxyXG4gICAgZ2V0Q2xvc2VzdCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIGNsb3Nlc3QsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZWxlbXNbaWR4XSwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIHBhcmVudHMudW5zaGlmdChlbGVtc1tpZHhdKTtcclxuICAgICAgICAgICAgY2xvc2VzdCA9IHNlbGVjdG9ycy5maWx0ZXIocGFyZW50cywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2xvc2VzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNsb3Nlc3RbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50c1VudGlsID0gZnVuY3Rpb24oZCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGRbaWR4XSwgbnVsbCwgc3RvcFNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NyYXdsVXBOb2RlID0gZnVuY3Rpb24obm9kZSwgY29udGV4dCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlLFxyXG4gICAgICAgICAgICBub2RlVHlwZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKChwYXJlbnQgICA9IGdldE5vZGVQYXJlbnQocGFyZW50KSkgJiZcclxuICAgICAgICAgICAgICAgKG5vZGVUeXBlID0gcGFyZW50Lm5vZGVUeXBlKSAhPT0gRE9DVU1FTlQgJiZcclxuICAgICAgICAgICAgICAgKCFjb250ZXh0ICAgICAgfHwgcGFyZW50ICE9PSBjb250ZXh0KSAmJlxyXG4gICAgICAgICAgICAgICAoIXN0b3BTZWxlY3RvciB8fCAhRml6emxlLmlzKHN0b3BTZWxlY3RvcikubWF0Y2gocGFyZW50KSkpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnQgLS0tLS0tXHJcbiAgICBnZXRQYXJlbnQgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgZ2V0Tm9kZVBhcmVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICByZXR1cm4gbm9kZSAmJiBub2RlLnBhcmVudE5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFByZXYgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHByZXYgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSAmJiBwcmV2Lm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROZXh0ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBuZXh0ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nKSAmJiBuZXh0Lm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBuZXh0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQcmV2QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcHJldiAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKHByZXYubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHByZXYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5leHRBbGwgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBuZXh0ICAgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgobmV4dCA9IG5leHQubmV4dFNpYmxpbmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXh0Lm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZztcclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmcgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYmxpbmcgJiYgKCFzZWxlY3RvciB8fCBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxBbGwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgZmlsdGVyO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgZmlsdGVyID0gZnVuY3Rpb24oc2libGluZykgeyByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKTsgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gXy5maWx0ZXIoc2libGluZ3MsIGZpbHRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsVW50aWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgaXRlcmF0b3I7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpdGVyYXRvciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc01hdGNoID0gaXMubWF0Y2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpYmxpbmdzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgdW5pcXVlU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCByZXZlcnNlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGFycmF5LnVuaXF1ZShlbGVtcyk7XHJcbiAgICAgICAgYXJyYXkuZWxlbWVudFNvcnQocmVzdWx0KTtcclxuICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRChyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXJBbmRTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCByZXZlcnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoc2VsZWN0b3JzLmZpbHRlcihlbGVtcywgc2VsZWN0b3IpLCByZXZlcnNlKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGZuOiB7XHJcbiAgICAgICAgY29udGVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgICAgICBfLm1hcCh0aGlzLCAoZWxlbSkgPT4gZWxlbS5jaGlsZE5vZGVzKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluZGV4OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoc2VsZWN0b3IpLmluZGV4T2YoZmlyc3QpOyAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpIHx8IGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yWzBdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgIHBhcmVudCA9IGZpcnN0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpc0F0dGFjaGVkIGNoZWNrIHRvIHBhc3MgdGVzdCBcIk5vZGUgd2l0aG91dCBwYXJlbnQgcmV0dXJucyAtMVwiXHJcbiAgICAgICAgICAgIC8vIG5vZGVUeXBlIGNoZWNrIHRvIHBhc3MgXCJJZiBEI2luZGV4IGNhbGxlZCBvbiBlbGVtZW50IHdob3NlIHBhcmVudCBpcyBmcmFnbWVudCwgaXQgc3RpbGwgc2hvdWxkIHdvcmsgY29ycmVjdGx5XCJcclxuICAgICAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgICAgIGlzUGFyZW50RnJhZ21lbnQgPSBwYXJlbnQubm9kZVR5cGUgPT09IERPQ1VNRU5UX0ZSQUdNRU5UO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFhdHRhY2hlZCAmJiAhaXNQYXJlbnRGcmFnbWVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY2hpbGRFbGVtcyA9IHBhcmVudC5jaGlsZHJlbiB8fCBfLmZpbHRlcihwYXJlbnQuY2hpbGROb2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IEVMRU1FTlQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdLmluZGV4T2YuYXBwbHkoY2hpbGRFbGVtcywgWyBmaXJzdCBdKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjbG9zZXN0OiBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyZW50OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwYXJlbnRzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGFyZW50c1VudGlsOiBmdW5jdGlvbihzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNpYmxpbmdzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNoaWxkcmVuOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXY6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBuZXh0OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJldkFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG5leHRBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmV2VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG5leHRVbnRpbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIG5ld2xpbmVzICAgPSByZXF1aXJlKCdzdHJpbmcvbmV3bGluZXMnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOdW1iZXIgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIG5vcm1hbE5hbWUgPSByZXF1aXJlKCdub2RlL25vcm1hbGl6ZU5hbWUnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgRUxFTUVOVCAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBESVYgICAgICAgID0gcmVxdWlyZSgnRElWJyk7XHJcblxyXG52YXIgb3V0ZXJIdG1sID0gKCkgPT4gdGhpcy5sZW5ndGggPyB0aGlzWzBdLm91dGVySFRNTCA6IG51bGwsXHJcblxyXG4gICAgdGV4dEdldCA9IERJVi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAoZWxlbSkgPT4gZWxlbS50ZXh0Q29udGVudCA6XHJcbiAgICAgICAgICAgIChlbGVtKSA9PiBlbGVtLmlubmVyVGV4dCxcclxuXHJcbiAgICB0ZXh0U2V0ID0gRElWLnRleHRDb250ZW50ICE9PSB1bmRlZmluZWQgP1xyXG4gICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0udGV4dENvbnRlbnQgPSBzdHIgOlxyXG4gICAgICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLmlubmVyVGV4dCA9IHN0cjtcclxuXHJcbnZhciB2YWxIb29rcyA9IHtcclxuICAgIG9wdGlvbjoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgIHJldHVybiAoZXhpc3RzKHZhbCkgPyB2YWwgOiB0ZXh0R2V0KGVsZW0pKS50cmltKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZWxlY3Q6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlLCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgaW5kZXggICA9IGVsZW0uc2VsZWN0ZWRJbmRleCxcclxuICAgICAgICAgICAgICAgIG9uZSAgICAgPSBlbGVtLnR5cGUgPT09ICdzZWxlY3Qtb25lJyB8fCBpbmRleCA8IDAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gb25lID8gbnVsbCA6IFtdLFxyXG4gICAgICAgICAgICAgICAgbWF4ICAgICA9IG9uZSA/IGluZGV4ICsgMSA6IG9wdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IGluZGV4IDwgMCA/IG1heCA6IChvbmUgPyBpbmRleCA6IDApO1xyXG5cclxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgc2VsZWN0ZWQgb3B0aW9uc1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbWF4OyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9sZElFIGRvZXNuJ3QgdXBkYXRlIHNlbGVjdGVkIGFmdGVyIGZvcm0gcmVzZXQgKCMyNTUxKVxyXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb24uc2VsZWN0ZWQgfHwgaWR4ID09PSBpbmRleCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgcmV0dXJuIG9wdGlvbnMgdGhhdCBhcmUgZGlzYWJsZWQgb3IgaW4gYSBkaXNhYmxlZCBvcHRncm91cFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoU1VQUE9SVFMub3B0RGlzYWJsZWQgPyAhb3B0aW9uLmRpc2FibGVkIDogb3B0aW9uLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fCAhaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcclxuICAgICAgICAgICAgICAgICAgICBpZiAob25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9wdGlvblNldCwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBfLm1ha2VBcnJheSh2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gb3B0aW9ucy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh2YWx1ZXMsIHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBvcHRpb25TZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYnJvd3NlcnMgdG8gYmVoYXZlIGNvbnNpc3RlbnRseSB3aGVuIG5vbi1tYXRjaGluZyB2YWx1ZSBpcyBzZXRcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25TZXQpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIFJhZGlvIGFuZCBjaGVja2JveCBnZXR0ZXIgZm9yIFdlYmtpdFxyXG5pZiAoIVNVUFBPUlRTLmNoZWNrT24pIHtcclxuICAgIF8uZWFjaChbJ3JhZGlvJywgJ2NoZWNrYm94J10sIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICB2YWxIb29rc1t0eXBlXSA9IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0OiBXZWJraXQgLSAnJyBpcyByZXR1cm5lZCBpbnN0ZWFkIG9mICdvbicgaWYgYSB2YWx1ZSBpc24ndCBzcGVjaWZpZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKSA9PT0gbnVsbCA/ICdvbicgOiBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgZ2V0VmFsID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgaWYgKCFlbGVtIHx8IChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLmdldCkge1xyXG4gICAgICAgIHJldHVybiBob29rLmdldChlbGVtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc1N0cmluZyh2YWwpID8gbmV3bGluZXModmFsKSA6IHZhbDtcclxufTtcclxuXHJcbnZhciBzdHJpbmdpZnkgPSAodmFsdWUpID0+XHJcbiAgICAhZXhpc3RzKHZhbHVlKSA/ICcnIDogKHZhbHVlICsgJycpO1xyXG5cclxudmFyIHNldFZhbCA9IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gU3RyaW5naWZ5IHZhbHVlc1xyXG4gICAgdmFyIHZhbHVlID0gaXNBcnJheSh2YWwpID8gXy5tYXAodmFsLCBzdHJpbmdpZnkpIDogc3RyaW5naWZ5KHZhbCk7XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5zZXQpIHtcclxuICAgICAgICBob29rLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZm46IHtcclxuICAgICAgICBvdXRlckh0bWw6IG91dGVySHRtbCxcclxuICAgICAgICBvdXRlckhUTUw6IG91dGVySHRtbCxcclxuXHJcbiAgICAgICAgaHRtbDogZnVuY3Rpb24oaHRtbCkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoaHRtbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGVsZW0uaW5uZXJIVE1MID0gaHRtbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKGh0bWwpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBodG1sO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgcmV0dXJuICghZmlyc3QpID8gdW5kZWZpbmVkIDogZmlyc3QuaW5uZXJIVE1MO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gZ2V0dGVyXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFleGlzdHModmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgJycpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBnZXRWYWwoZWxlbSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXRWYWwoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNldHRlcnNcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0ZXh0OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHN0cikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHRleHRTZXQoZWxlbSwgc3RyKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHN0cikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHN0cjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB0ZXh0U2V0KGVsZW0sIGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCB0ZXh0R2V0KGVsZW0pKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLm1hcCh0aGlzLCAoZWxlbSkgPT4gdGV4dEdldChlbGVtKSkuam9pbignJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgRUxFTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtKSA9PlxyXG4gICAgICAgIGVsZW0gJiYgZWxlbS5ub2RlVHlwZSA9PT0gRUxFTUVOVDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZWxlbSwgbmFtZSkgPT5cclxuICAgIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpOyIsIi8vIGNhY2hlIGlzIGp1c3Qgbm90IHdvcnRoIGl0IGhlcmVcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSAoZWxlbSkgPT4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4iLCJ2YXIgaXNBdHRhY2hlZCAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIEVMRU1FTlQgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICAvLyBodHRwOi8vZWpvaG4ub3JnL2Jsb2cvY29tcGFyaW5nLWRvY3VtZW50LXBvc2l0aW9uL1xyXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgIENPTlRBSU5FRF9CWSA9IDE2LFxyXG4gICAgRk9MTE9XSU5HICAgID0gNCxcclxuICAgIERJU0NPTk5FQ1RFRCA9IDE7XHJcblxyXG52YXIgaXMgPSAocmVsLCBmbGFnKSA9PiAocmVsICYgZmxhZykgPT09IGZsYWc7XHJcblxyXG52YXIgaXNOb2RlID0gKGIsIGZsYWcsIGEpID0+IGlzKF9jb21wYXJlUG9zaXRpb24oYSwgYiksIGZsYWcpO1xyXG5cclxuLy8gQ29tcGFyZSBQb3NpdGlvbiAtIE1JVCBMaWNlbnNlZCwgSm9obiBSZXNpZ1xyXG52YXIgX2NvbXBhcmVQb3NpdGlvbiA9IChub2RlMSwgbm9kZTIpID0+XHJcbiAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/XHJcbiAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihub2RlMikgOlxyXG4gICAgMDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0cyBhbiBhcnJheSBvZiBEIGVsZW1lbnRzIGluLXBsYWNlIChpLmUuLCBtdXRhdGVzIHRoZSBvcmlnaW5hbCBhcnJheSlcclxuICAgICAqIGluIGRvY3VtZW50IG9yZGVyIGFuZCByZXR1cm5zIHdoZXRoZXIgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZC5cclxuICAgICAqIEBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50W119IGFycmF5ICAgICAgICAgIEFycmF5IG9mIEQgZWxlbWVudHMuXHJcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59ICBbcmV2ZXJzZT1mYWxzZV0gSWYgYSB0cnV0aHkgdmFsdWUgaXMgcGFzc2VkLCB0aGUgZ2l2ZW4gYXJyYXkgd2lsbCBiZSByZXZlcnNlZC5cclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqIEBzZWUgalF1ZXJ5IHNyYy9zZWxlY3Rvci1uYXRpdmUuanM6MzdcclxuICAgICAqL1xyXG4gICAgLy8gVE9ETzogQWRkcmVzcyBlbmNhcHN1bGF0aW9uXHJcbiAgICBzb3J0OiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIF9oYXNEdXBsaWNhdGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdmFyIF9zb3J0ID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XHJcbiAgICAgICAgICAgIC8vIEZsYWcgZm9yIGR1cGxpY2F0ZSByZW1vdmFsXHJcbiAgICAgICAgICAgIGlmIChub2RlMSA9PT0gbm9kZTIpIHtcclxuICAgICAgICAgICAgICAgIF9oYXNEdXBsaWNhdGUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNvcnQgb24gbWV0aG9kIGV4aXN0ZW5jZSBpZiBvbmx5IG9uZSBpbnB1dCBoYXMgY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgICAgICAgICAgdmFyIHJlbCA9ICFub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiAtICFub2RlMi5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbjtcclxuICAgICAgICAgICAgaWYgKHJlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm9kZXMgc2hhcmUgdGhlIHNhbWUgZG9jdW1lbnRcclxuICAgICAgICAgICAgaWYgKChub2RlMS5vd25lckRvY3VtZW50IHx8IG5vZGUxKSA9PT0gKG5vZGUyLm93bmVyRG9jdW1lbnQgfHwgbm9kZTIpKSB7XHJcbiAgICAgICAgICAgICAgICByZWwgPSBfY29tcGFyZVBvc2l0aW9uKG5vZGUxLCBub2RlMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHdlIGtub3cgdGhleSBhcmUgZGlzY29ubmVjdGVkXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVsID0gRElTQ09OTkVDVEVEO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBOb3QgZGlyZWN0bHkgY29tcGFyYWJsZVxyXG4gICAgICAgICAgICBpZiAoIXJlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERpc2Nvbm5lY3RlZCBub2Rlc1xyXG4gICAgICAgICAgICBpZiAoaXMocmVsLCBESVNDT05ORUNURUQpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNOb2RlMURpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUxKTtcclxuICAgICAgICAgICAgICAgIHZhciBpc05vZGUyRGlzY29ubmVjdGVkID0gIWlzQXR0YWNoZWQobm9kZTIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc05vZGUxRGlzY29ubmVjdGVkICYmIGlzTm9kZTJEaXNjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNOb2RlMkRpc2Nvbm5lY3RlZCA/IC0xIDogMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGlzKHJlbCwgRk9MTE9XSU5HKSA/IC0xIDogMTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJyYXksIHJldmVyc2UpIHtcclxuICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBhcnJheS5zb3J0KF9zb3J0KTtcclxuICAgICAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgICAgIGFycmF5LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2hhc0R1cGxpY2F0ZTtcclxuICAgICAgICB9O1xyXG4gICAgfSgpKSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVybWluZXMgd2hldGhlciBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYC5cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gYSBEIGVsZW1lbnQgbm9kZVxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBiIEQgZWxlbWVudCBub2RlXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYDsgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgIHZhciBiVXAgPSBpc0F0dGFjaGVkKGIpID8gYi5wYXJlbnROb2RlIDogbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGEgPT09IGJVcCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiVXAgJiYgYlVwLm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgIC8vIE1vZGVybiBicm93c2VycyAoSUU5KylcclxuICAgICAgICAgICAgaWYgKGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpc05vZGUoYlVwLCBDT05UQUlORURfQlksIGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBSRUdFWCA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBNQVhfU0lOR0xFX1RBR19MRU5HVEggPSAzMDtcclxuXHJcbnZhciBwYXJzZVN0cmluZyA9IGZ1bmN0aW9uKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpIHtcclxuICAgIHZhciBwYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHBhcmVudFRhZ05hbWUpO1xyXG4gICAgcGFyZW50LmlubmVySFRNTCA9IGh0bWxTdHI7XHJcbiAgICByZXR1cm4gcGFyZW50O1xyXG59O1xyXG5cclxudmFyIHBhcnNlU2luZ2xlVGFnID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgaWYgKGh0bWxTdHIubGVuZ3RoID4gTUFYX1NJTkdMRV9UQUdfTEVOR1RIKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIHNpbmdsZVRhZ01hdGNoID0gUkVHRVguc2luZ2xlVGFnTWF0Y2goaHRtbFN0cik7XHJcbiAgICBpZiAoIXNpbmdsZVRhZ01hdGNoKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHNpbmdsZVRhZ01hdGNoWzFdKTtcclxuXHJcbiAgICByZXR1cm4gWyBlbGVtIF07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIHZhciBzaW5nbGVUYWcgPSBwYXJzZVNpbmdsZVRhZyhodG1sU3RyKTtcclxuICAgIGlmIChzaW5nbGVUYWcpIHsgcmV0dXJuIHNpbmdsZVRhZzsgfVxyXG5cclxuICAgIHZhciBwYXJlbnRUYWdOYW1lID0gUkVHRVguZ2V0UGFyZW50VGFnTmFtZShodG1sU3RyKSxcclxuICAgICAgICBwYXJlbnQgICAgICAgID0gcGFyc2VTdHJpbmcocGFyZW50VGFnTmFtZSwgaHRtbFN0cik7XHJcblxyXG4gICAgdmFyIGNoaWxkLFxyXG4gICAgICAgIGlkeCA9IHBhcmVudC5jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgYXJyID0gbmV3IEFycmF5KGlkeCk7XHJcblxyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2hpbGRyZW5baWR4XTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIGFycltpZHhdID0gY2hpbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyZW50ID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnLi9EJyksXHJcbiAgICBwYXJzZXIgICAgID0gcmVxdWlyZSgncGFyc2VyJyksXHJcbiAgICBGaXp6bGUgICAgID0gcmVxdWlyZSgnRml6emxlJyksXHJcbiAgICBhcnJheSAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hcnJheScpLFxyXG4gICAgZGF0YSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpO1xyXG5cclxudmFyIHBhcnNlSHRtbCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgaWYgKCFzdHIpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIHZhciByZXN1bHQgPSBwYXJzZXIoc3RyKTtcclxuICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQubGVuZ3RoKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICByZXR1cm4gRChyZXN1bHQpO1xyXG59O1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIGRhdGEuRCxcclxue1xyXG4gICAgLy8gQmVjYXVzZSBubyBvbmUga25vdyB3aGF0IHRoZSBjYXNlIHNob3VsZCBiZVxyXG4gICAgcGFyc2VIdG1sOiBwYXJzZUh0bWwsXHJcbiAgICBwYXJzZUhUTUw6IHBhcnNlSHRtbCxcclxuXHJcbiAgICBGaXp6bGU6ICBGaXp6bGUsXHJcbiAgICBlYWNoOiAgICBhcnJheS5lYWNoLFxyXG4gICAgZm9yRWFjaDogYXJyYXkuZWFjaCxcclxuXHJcbiAgICBtYXA6ICAgICBfLm1hcCxcclxuICAgIGV4dGVuZDogIF8uZXh0ZW5kLFxyXG5cclxuICAgIG1vcmVDb25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmpRdWVyeSA9IHdpbmRvdy5aZXB0byA9IHdpbmRvdy4kID0gRDtcclxuICAgIH1cclxufSk7IiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHNwbGl0ICAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgYXJyYXkgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJ21vZHVsZXMvdHJhbnN2ZXJzYWwnKSxcclxuICAgIGRpbWVuc2lvbnMgID0gcmVxdWlyZSgnbW9kdWxlcy9kaW1lbnNpb25zJyksXHJcbiAgICBtYW5pcCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jc3MnKSxcclxuICAgIGF0dHIgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hdHRyJyksXHJcbiAgICBwcm9wICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3ZhbCcpLFxyXG4gICAgcG9zaXRpb24gICAgPSByZXF1aXJlKCdtb2R1bGVzL3Bvc2l0aW9uJyksXHJcbiAgICBjbGFzc2VzICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgc2Nyb2xsICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Njcm9sbCcpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKSxcclxuICAgIGV2ZW50cyAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9ldmVudHMnKTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyKSA9PiAhZXhpc3RzKHN0cikgfHwgc3RyID09PSAnJzsiLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBjYWNoZSAgID0gcmVxdWlyZSgnY2FjaGUnKSgyKSxcclxuICAgIGlzRW1wdHkgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpLFxyXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcblxyXG4gICAgUl9TUEFDRSA9IC9cXHMrL2csXHJcblxyXG4gICAgc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIHZhciBzcGxpdCAgID0gbmFtZS5zcGxpdChkZWxpbSksXHJcbiAgICAgICAgICAgIGxlbiAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIG5hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmFtZVNldCA9IHt9LFxyXG4gICAgICAgICAgICBjdXJOYW1lO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgY3VyTmFtZSA9IHNwbGl0W2xlbiAtIChpZHggKyAxKV07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdIHx8IC8vIHVuaXF1ZVxyXG4gICAgICAgICAgICAgICAgaXNFbXB0eShjdXJOYW1lKSAgICAvLyBub24tZW1wdHlcclxuICAgICAgICAgICAgKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKGN1ck5hbWUpO1xyXG4gICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltaXRlcikge1xyXG4gICAgaWYgKGlzRW1wdHkobmFtZSkpIHsgcmV0dXJuIFtdOyB9XHJcbiAgICBpZiAoaXNBcnJheShuYW1lKSkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAgIHZhciBkZWxpbSA9IGRlbGltaXRlciA9PT0gdW5kZWZpbmVkID8gUl9TUEFDRSA6IGRlbGltaXRlcjtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoZGVsaW0sIG5hbWUpID8gXHJcbiAgICAgICAgY2FjaGUuZ2V0KGRlbGltLCBuYW1lKSA6IFxyXG4gICAgICAgIGNhY2hlLnB1dChkZWxpbSwgbmFtZSwgKCkgPT4gc3BsaXQobmFtZSwgZGVsaW0pKTtcclxufTtcclxuIiwidmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnaXMvc3RyaW5nJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIC8vIEl0cyBhIG51bWJlciEgfHwgMCB0byBhdm9pZCBOYU4gKGFzIE5hTidzIGEgbnVtYmVyKVxyXG4gICAgK3ZhbHVlID09PSB2YWx1ZSA/ICh2YWx1ZSB8fCAwKSA6XHJcbiAgICAvLyBBdm9pZCBOYU4gYWdhaW5cclxuICAgIGlzU3RyaW5nKHZhbHVlKSA/ICgrdmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gRGVmYXVsdCB0byB6ZXJvXHJcbiAgICAwO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChudW0pID0+IHBhcnNlSW50KG51bSwgMTApO1xyXG4iLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgc3RhcnQsIGVuZCkge1xyXG4gICAgLy8gRXhpdCBlYXJseSBmb3IgZW1wdHkgYXJyYXlcclxuICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIC8vIEVuZCwgbmF0dXJhbGx5LCBoYXMgdG8gYmUgaGlnaGVyIHRoYW4gMCB0byBtYXR0ZXIsXHJcbiAgICAvLyBzbyBhIHNpbXBsZSBleGlzdGVuY2UgY2hlY2sgd2lsbCBkb1xyXG4gICAgaWYgKGVuZCkgeyByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0LCBlbmQpOyB9XHJcblxyXG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCB8fCAwKTtcclxufTsiLCIvLyBCcmVha3MgZXZlbiBvbiBhcnJheXMgd2l0aCAzIGl0ZW1zLiAzIG9yIG1vcmVcclxuLy8gaXRlbXMgc3RhcnRzIHNhdmluZyBzcGFjZVxyXG5tb2R1bGUuZXhwb3J0cyA9IChzdHIsIGRlbGltaXRlcikgPT4gc3RyLnNwbGl0KGRlbGltaXRlciB8fCAnfCcpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgKyAncHgnO1xyXG4iLCJ2YXIgaWQgPSAwO1xyXG52YXIgdW5pcXVlSWQgPSBtb2R1bGUuZXhwb3J0cyA9ICgpID0+IGlkKys7XHJcbnVuaXF1ZUlkLnNlZWQgPSBmdW5jdGlvbihzZWVkZWQsIHByZSkge1xyXG4gICAgdmFyIHByZWZpeCA9IHByZSB8fCAnJyxcclxuICAgICAgICBzZWVkID0gc2VlZGVkIHx8IDA7XHJcbiAgICByZXR1cm4gKCkgPT4gcHJlZml4ICsgc2VlZCsrO1xyXG59OyJdfQ==
