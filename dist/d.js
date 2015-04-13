/**
 * d-js - jQuery at half the size
 * @version v1.1.2
 * @link https://github.com/JosephClay/d-js
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./D');
require('./props');
require('./proto');

},{"./D":3,"./props":68,"./proto":69}],2:[function(require,module,exports){
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

    // Array of Elements, NodeList, or D object
    // TODO: Could this be arrayLike?
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

},{"Fizzle":9,"_":22,"is/D":24,"is/array":25,"is/function":33,"is/html":34,"is/nodeList":35,"is/string":39,"onready":65,"parser":67}],4:[function(require,module,exports){
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
    uniqueId = require('util/uniqueId').seed(0, 'D-uniqueId-'),
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

},{"REGEX":20,"cache":23,"is/element":31,"is/exists":32,"is/nodeList":35,"matchesSelector":41,"util/uniqueId":75}],9:[function(require,module,exports){
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

},{"../_":22,"../cache":23,"./constructs/Is":6,"./constructs/Query":7,"./constructs/Selector":8,"./selector/selector-normalize":12,"./selector/selector-parse":13}],10:[function(require,module,exports){
module.exports={
	":child-at": ":nth-child(x)",
	":child-gt": ":nth-child(n+x)",
	":child-lt": ":nth-child(~n+x)"
}

},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS'),
    ATTRIBUTE_SELECTOR = /\[\s*[\w-]+\s*[!$^*]?(?:=\s*(['"]?)(.*?[^\\]|[^\\]*))?\1\s*\]/g,
    PSEUDO_SELECT = /(:[^\s\(\[)]+)/g,
    CAPTURE_SELECT = /(:[^\s^(]+)\(([^\)]+)\)/g,
    pseudoCache = require('cache')(),
    proxySelectors = require('./proxy.json'),
    captureSelectors = require('./capture.json');

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

},{"./capture.json":10,"./proxy.json":11,"SUPPORTS":21,"cache":23}],13:[function(require,module,exports){
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

},{"is/array":25,"is/arrayLike":26,"is/exists":32,"is/nodeList":35,"util/slice":73}],23:[function(require,module,exports){
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

var constructor;
module.exports = function (value) {
  return value && value instanceof constructor;
};
module.exports.set = function (D) {
  return constructor = D;
};

},{}],25:[function(require,module,exports){
"use strict";

module.exports = Array.isArray;

},{}],26:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value && +value.length === value.length;
};

},{}],27:[function(require,module,exports){
'use strict';

var DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT');

module.exports = function (elem) {
    return elem && elem.ownerDocument && elem !== document && elem.parentNode && elem.parentNode.nodeType !== DOCUMENT_FRAGMENT && elem.parentNode.isParseHtmlFragment !== true;
};

},{"NODE_TYPE/DOCUMENT_FRAGMENT":17}],28:[function(require,module,exports){
"use strict";

module.exports = function (value) {
  return value === true || value === false;
};

},{}],29:[function(require,module,exports){
'use strict';

var isArray = require('is/array'),
    isNodeList = require('is/nodeList'),
    isD = require('is/D');

module.exports = function (value) {
    return isD(value) || isArray(value) || isNodeList(value);
};

},{"is/D":24,"is/array":25,"is/nodeList":35}],30:[function(require,module,exports){
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

},{"is/collection":29,"is/element":31,"is/function":33,"is/string":39}],39:[function(require,module,exports){
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
// differs from forEach in that the idx (or key) is first, then the value
"use strict";

module.exports = function (obj, iterator) {
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
            if (iterator.call(item, idx, item) === false) {
                return;
            }
        }

        return;
    }

    // Object support
    var key, value;
    for (key in obj) {
        value = obj[key];
        if (iterator.call(value, key, value) === false) {
            return;
        }
    }
};

},{}],43:[function(require,module,exports){
"use strict";

module.exports = function (obj, iterator) {
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

},{}],44:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    exists = require('is/exists'),
    slice = require('util/slice'),
    forEach = require('./forEach');

var map = function map(arr, iterator) {
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
};

exports.fn = {
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

    each: function each(iterator) {
        forEach(this, iterator);
        return this;
    },

    forEach: (function (_forEach) {
        function forEach(_x4) {
            return _forEach.apply(this, arguments);
        }

        forEach.toString = function () {
            return _forEach.toString();
        };

        return forEach;
    })(function (iterator) {
        forEach(this, iterator);
        return this;
    })
};

},{"./forEach":43,"D":3,"_":22,"is/exists":32,"util/slice":73}],45:[function(require,module,exports){
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

},{"order":66}],46:[function(require,module,exports){
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

},{"Fizzle":9,"SUPPORTS":21,"_":22,"cache":23,"is/exists":32,"is/function":33,"is/string":39,"node/isElement":62,"node/isName":63,"string/newlines":71}],47:[function(require,module,exports){
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

exports.fn = {
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
};

},{"NODE_TYPE/ELEMENT":18,"_":22,"is/array":25,"is/string":39,"string/isEmpty":70,"string/split":72}],48:[function(require,module,exports){
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
    DOCUMENT = require('NODE_TYPE/DOCUMENT'),
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

},{"NODE_TYPE/DOCUMENT":16,"REGEX":20,"_":22,"is/array":25,"is/attached":27,"is/boolean":28,"is/document":30,"is/element":31,"is/exists":32,"is/number":36,"is/object":37,"is/string":39,"is/window":40,"util/split":74}],49:[function(require,module,exports){
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

},{"cache":23,"is/array":25,"is/element":31,"is/string":39,"util/uniqueId":75}],50:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isNumber = require('is/number'),
    css = require('./css');

var getInnerWidth = function getInnerWidth(elem) {
    var width = parseFloat(css.width.get(elem)) || 0;

    return width + (_.parseInt(css.curCss(elem, 'paddingLeft')) || 0) + (_.parseInt(css.curCss(elem, 'paddingRight')) || 0);
},
    getInnerHeight = function getInnerHeight(elem) {
    var height = parseFloat(css.height.get(elem)) || 0;

    return height + (_.parseInt(css.curCss(elem, 'paddingTop')) || 0) + (_.parseInt(css.curCss(elem, 'paddingBottom')) || 0);
},
    getOuterWidth = function getOuterWidth(elem, withMargin) {
    var width = getInnerWidth(elem);

    if (withMargin) {
        width += (_.parseInt(css.curCss(elem, 'marginLeft')) || 0) + (_.parseInt(css.curCss(elem, 'marginRight')) || 0);
    }

    return width + (_.parseInt(css.curCss(elem, 'borderLeftWidth')) || 0) + (_.parseInt(css.curCss(elem, 'borderRightWidth')) || 0);
},
    getOuterHeight = function getOuterHeight(elem, withMargin) {
    var height = getInnerHeight(elem);

    if (withMargin) {
        height += (_.parseInt(css.curCss(elem, 'marginTop')) || 0) + (_.parseInt(css.curCss(elem, 'marginBottom')) || 0);
    }

    return height + (_.parseInt(css.curCss(elem, 'borderTopWidth')) || 0) + (_.parseInt(css.curCss(elem, 'borderBottomWidth')) || 0);
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

},{"./css":48,"_":22,"is/number":36}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{"crossvent":2,"is/exists":32,"matchesSelector":41}],53:[function(require,module,exports){
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

},{"./custom":51,"./delegate":52,"_":22,"is/function":33}],54:[function(require,module,exports){
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

        insertBefore: function insertBefore(target) {
            if (!target) {
                return this;
            }

            if (isString(target)) {
                target = D(target)[0];
            }

            this.each(function () {
                var parent = this.parentNode;
                if (parent) {
                    parent.insertBefore(target, this.nextSibling);
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

            this.each(function () {
                var parent = this.parentNode;
                if (parent) {
                    parent.insertBefore(this, target);
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
                var elems = unique([].concat(this.get(), D(selector).get()));
                order.sort(elems);
                return D(elems);
            }

            // Array of elements
            if (isCollection(selector)) {
                var arr = selector;
                var elems = unique([].concat(this.get(), _.toArray(arr)));
                order.sort(elems);
                return D(elems);
            }

            // Single element
            if (isWindow(selector) || isDocument(selector) || isElement(selector)) {
                var elem = selector;
                var elems = unique([].concat(this.get(), [elem]));
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
                var arr = selectorFilter(this, selector);
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
                var arr = selectorFilter(this, selector);
                detach(arr);
                return this;
            }

            // fallback
            detach(this);
            return this;
        })
    }
};

},{"./array/unique":45,"./data":49,"./selectors/filter":58,"D":3,"_":22,"is/D":24,"is/collection":29,"is/document":30,"is/element":31,"is/exists":32,"is/function":33,"is/html":34,"is/nodeList":35,"is/number":36,"is/string":39,"is/window":40,"order":66,"parser":67}],55:[function(require,module,exports){
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

},{"D":3,"_":22,"is/attached":27,"is/exists":32,"is/function":33,"is/object":37,"node/isName":63}],56:[function(require,module,exports){
'use strict';

var _ = require('_'),
    isString = require('is/string'),
    isFunction = require('is/function'),
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
                return _.parseInt(tabindex);
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

},{"NODE_TYPE/ATTRIBUTE":14,"NODE_TYPE/COMMENT":15,"NODE_TYPE/TEXT":19,"REGEX":20,"SUPPORTS":21,"_":22,"is/function":33,"is/string":39,"util/split":74}],57:[function(require,module,exports){
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

},{"is/exists":32,"is/string":39}],58:[function(require,module,exports){
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

},{"Fizzle":9,"_":22,"is/function":33,"is/string":39}],59:[function(require,module,exports){
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

},{"D":3,"Fizzle":9,"_":22,"is/D":24,"is/array":25,"is/collection":29,"is/element":31,"is/function":33,"is/nodeList":35,"is/selector":38,"is/string":39,"order":66}],60:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),
    DOCUMENT = require('NODE_TYPE/DOCUMENT'),
    DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT'),
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
        return D(_.flatten(
        // TODO: pluck
        _.map(this, function (elem) {
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
};

},{"./array/unique":45,"./selectors/filter":58,"D":3,"Fizzle":9,"NODE_TYPE/DOCUMENT":16,"NODE_TYPE/DOCUMENT_FRAGMENT":17,"NODE_TYPE/ELEMENT":18,"_":22,"is/D":24,"is/attached":27,"is/document":30,"is/element":31,"is/string":39,"is/window":40,"order":66}],61:[function(require,module,exports){
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
    ELEMENT = require('NODE_TYPE/ELEMENT');

var outerHtml = function outerHtml() {
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
};

// Don't return options that are disabled or in a disabled optgroup

},{"NODE_TYPE/ELEMENT":18,"SUPPORTS":21,"_":22,"is/array":25,"is/exists":32,"is/function":33,"is/number":36,"is/string":39,"node/isName":63,"node/normalizeName":64,"string/newlines":71}],62:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (elem) {
        return elem && elem.nodeType === ELEMENT;
};

},{"NODE_TYPE/ELEMENT":18}],63:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};

},{}],64:[function(require,module,exports){
// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
"use strict";

module.exports = function (elem) {
  return elem.nodeName.toLowerCase();
};

},{}],65:[function(require,module,exports){
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
    var idx = 0,
        length = registration.length;
    for (; idx < length; idx++) {
        registration[idx]();
    }
    registration.length = 0;
});

module.exports = function (callback) {
    if (ready) {
        callback();return;
    }

    registration.push(callback);
};

},{}],66:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"is/attached":27}],67:[function(require,module,exports){
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

},{"REGEX":20}],68:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('./D'),
    parser = require('parser'),
    Fizzle = require('Fizzle'),
    each = require('modules/array/each'),
    forEach = require('modules/array/forEach'),
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
    each: each,
    forEach: forEach,

    map: _.map,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

},{"./D":3,"Fizzle":9,"_":22,"modules/array/each":42,"modules/array/forEach":43,"modules/data":49,"parser":67}],69:[function(require,module,exports){
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

},{"./D":3,"_":22,"modules/array":44,"modules/attr":46,"modules/classes":47,"modules/css":48,"modules/data":49,"modules/dimensions":50,"modules/events":53,"modules/manip":54,"modules/position":55,"modules/prop":56,"modules/scroll":57,"modules/selectors":59,"modules/transversal":60,"modules/val":61,"util/split":74}],70:[function(require,module,exports){
'use strict';

var exists = require('is/exists');

module.exports = function (str) {
  return !exists(str) || str === '';
};

},{"is/exists":32}],71:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ? function (str) {
    return str;
} : function (str) {
    return str ? str.replace(/\r\n/g, '\n') : str;
};

},{"SUPPORTS":21}],72:[function(require,module,exports){
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

},{"cache":23,"is/array":25,"string/isEmpty":70}],73:[function(require,module,exports){
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

},{}],74:[function(require,module,exports){
// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
'use strict';

module.exports = function (str, delimiter) {
  return str.split(delimiter || '|');
};

},{}],75:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvY2FwdHVyZS5qc29uIiwic3JjL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qc29uIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9BVFRSSUJVVEUuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9DT01NRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0VMRU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9URVhULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvZWFjaC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS9mb3JFYWNoLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L3VuaXF1ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hdHRyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2NsYXNzZXMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvY3NzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RhdGEuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZGltZW5zaW9ucy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvY3VzdG9tLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2V2ZW50cy9kZWxlZ2F0ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvbWFuaXAuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvcG9zaXRpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvcHJvcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9zY3JvbGwuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2ZpbHRlci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9zZWxlY3RvcnMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvdHJhbnN2ZXJzYWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvdmFsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL2lzRWxlbWVudC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc05hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvbm9ybWFsaXplTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvb25yZWFkeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvb3JkZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3BhcnNlci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvcHJvcHMuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3RvLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvaXNFbXB0eS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL25ld2xpbmVzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc2xpY2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvdW5pcXVlSWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7QUNGbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDckZBLElBQUksQ0FBQyxHQUFhLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDMUIsT0FBTyxHQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUM7SUFDakMsTUFBTSxHQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDaEMsUUFBUSxHQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUM7SUFDbEMsVUFBVSxHQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDcEMsVUFBVSxH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QUFHLENBQUMsTUFBTSxFQUFFO0FBQUUsZUFBTyxFQUFFLENBQUM7S0FBRTs7OztBQUl2QyxRQUFJLEdBQUcsRUFBRTtBQUFFLGVBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQUU7O0FBRWhELFdBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQ3RDLENBQUM7Ozs7Ozs7QUNURixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQUMsR0FBRyxFQUFFLFNBQVM7U0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUM7Q0FBQSxDQUFDOzs7OztBQ0ZqRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDWCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHO1dBQU0sRUFBRSxFQUFFO0NBQUEsQ0FBQztBQUMzQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVMsTUFBTSxFQUFFLEdBQUcsRUFBRTtBQUNsQyxRQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksRUFBRTtRQUNsQixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUN2QixXQUFPO2VBQU0sTUFBTSxHQUFHLElBQUksRUFBRTtLQUFBLENBQUM7Q0FDaEMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vRCcpO1xyXG5yZXF1aXJlKCcuL3Byb3BzJyk7XHJcbnJlcXVpcmUoJy4vcHJvdG8nKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCB1bndyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSkge1xuICB2YXIgZTtcbiAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ICA9IGUucHJldmVudERlZmF1bHQgIHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNBcnJheSAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNIdG1sICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNGdW5jdGlvbiAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCdvbnJlYWR5JyksXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIEQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBJbml0KHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEQpO1xyXG5cclxudmFyIEluaXQgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIC8vIG5vdGhpblxyXG4gICAgaWYgKCFzZWxlY3RvcikgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgIC8vIGVsZW1lbnQgb3Igd2luZG93IChkb2N1bWVudHMgaGF2ZSBhIG5vZGVUeXBlKVxyXG4gICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlIHx8IHNlbGVjdG9yID09PSB3aW5kb3cpIHtcclxuICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XHJcbiAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhUTUwgc3RyaW5nXHJcbiAgICBpZiAoaXNIdG1sKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgcGFyc2VyKHNlbGVjdG9yKSk7XHJcbiAgICAgICAgaWYgKGF0dHJzKSB7IHRoaXMuYXR0cihhdHRycyk7IH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3RyaW5nXHJcbiAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gU2VsZWN0b3I6IHBlcmZvcm0gYSBmaW5kIHdpdGhvdXQgY3JlYXRpbmcgYSBuZXcgRFxyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgRml6emxlLnF1ZXJ5KHNlbGVjdG9yKS5leGVjKHRoaXMsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBvZiBFbGVtZW50cywgTm9kZUxpc3QsIG9yIEQgb2JqZWN0XHJcbiAgICAvLyBUT0RPOiBDb3VsZCB0aGlzIGJlIGFycmF5TGlrZT9cclxuICAgIGlmIChpc0FycmF5KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG9jdW1lbnQgcmVhZHlcclxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG9ucmVhZHkoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbkluaXQucHJvdG90eXBlID0gRC5wcm90b3R5cGU7IiwibW9kdWxlLmV4cG9ydHMgPSAodGFnKSA9PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7IiwidmFyIGRpdiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUnKSgnZGl2Jyk7XHJcblxyXG5kaXYuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCIvYVwiPmE8L2E+JzsiLCJ2YXIgXyA9IHJlcXVpcmUoJ18nKTtcclxuXHJcbnZhciBJcyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcbklzLnByb3RvdHlwZSA9IHtcclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IHRoaXMuX3NlbGVjdG9ycyxcclxuICAgICAgICAgICAgaWR4ID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvcnNbaWR4XS5tYXRjaChjb250ZXh0KSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmFueShhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICB0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgIXRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwidmFyIGZpbmQgPSBmdW5jdGlvbihxdWVyeSwgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgIHNlbGVjdG9ycyA9IHF1ZXJ5Ll9zZWxlY3RvcnMsXHJcbiAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5cclxuUXVlcnkucHJvdG90eXBlID0ge1xyXG4gICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGZpbmQodGhpcywgYXJyW2lkeF0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnLFxyXG4gICAgXHJcbiAgICB1bmlxdWVJZCAgICAgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoMCwgJ0QtdW5pcXVlSWQtJyksXHJcbiAgICBzZWxlY3RvckNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgUkVHRVggICAgICAgICA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBtYXRjaGVzICAgICAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyk7XHJcblxyXG52YXIgZGV0ZXJtaW5lTWV0aG9kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gc2VsZWN0b3JDYWNoZS5nZXQoc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmIChtZXRob2QpIHsgcmV0dXJuIG1ldGhvZDsgfVxyXG5cclxuICAgICAgICBtZXRob2QgPSBSRUdFWC5pc1N0cmljdElkKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UX0JZX0lEIDpcclxuICAgICAgICAgICAgUkVHRVguaXNDbGFzcyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA6XHJcbiAgICAgICAgICAgIFJFR0VYLmlzVGFnKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9UQUdfTkFNRSA6ICAgICAgIFxyXG4gICAgICAgICAgICBRVUVSWV9TRUxFQ1RPUl9BTEw7XHJcblxyXG4gICAgICAgIHNlbGVjdG9yQ2FjaGUuc2V0KHNlbGVjdG9yLCBtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIG5lZWQgdG8gZm9yY2UgYW4gYXJyYXkgaGVyZVxyXG4gICAgZnJvbURvbUFycmF5VG9BcnJheSA9IGZ1bmN0aW9uKGFycmF5TGlrZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBhcnJheUxpa2UubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBhcnJheUxpa2VbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gZnVuY3Rpb24oc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgaWYgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkLCByZXR1cm4gaXQgYXMgYW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IGZyb21Eb21BcnJheVRvQXJyYXkoc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGFpbG9yQ2hpbGRTZWxlY3RvciA9IGZ1bmN0aW9uKGlkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiAnIycgKyBpZCArICcgJyArIHNlbGVjdG9yO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIC8vIENoaWxkIHNlbGVjdCAtIG5lZWRzIHNwZWNpYWwgaGVscCBzbyB0aGF0IFwiPiBkaXZcIiBkb2Vzbid0IGJyZWFrXHJcbiAgICAgICAgdmFyIG1ldGhvZCAgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgc2VsZWN0b3IgID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdG9yID0gdGFpbG9yQ2hpbGRTZWxlY3RvcihpZEFwcGxpZWQgPyBuZXdJZCA6IGlkLCBzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGlkQXBwbGllZCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsYXNzUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgLy8gQ2xhc3Mgc2VhcmNoLCBkb24ndCBzdGFydCB3aXRoICcuJ1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWZhdWx0UXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbc2VsZi5tZXRob2RdKHNlbGYuc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgICAgICAgaWYgKHNlbGYuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRPclNpYmxpbmdRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmlzQ2xhc3NTZWFyY2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNsYXNzUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0lkU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpZFF1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRRdWVyeTtcclxuICAgIH07XHJcblxyXG52YXIgU2VsZWN0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgdmFyIHNlbGVjdG9yICAgICAgICAgICAgICAgID0gc3RyLnRyaW0oKSxcclxuICAgICAgICBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ICA9IHNlbGVjdG9yWzBdID09PSAnPicgfHwgc2VsZWN0b3JbMF0gPT09ICcrJyxcclxuICAgICAgICBtZXRob2QgICAgICAgICAgICAgICAgICA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBRVUVSWV9TRUxFQ1RPUl9BTEwgOiBkZXRlcm1pbmVNZXRob2Qoc2VsZWN0b3IpO1xyXG5cclxuICAgIHRoaXMuc3RyICAgICAgICAgICAgICAgICAgICA9IHN0cjtcclxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgICAgICAgICA9IHNlbGVjdG9yO1xyXG4gICAgdGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdDtcclxuICAgIHRoaXMuaXNJZFNlYXJjaCAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRfQllfSUQ7XHJcbiAgICB0aGlzLmlzQ2xhc3NTZWFyY2ggICAgICAgICAgPSAhdGhpcy5pc0lkU2VhcmNoICYmIG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUU7XHJcbiAgICB0aGlzLm1ldGhvZCAgICAgICAgICAgICAgICAgPSBtZXRob2Q7XHJcbn07XHJcblxyXG5TZWxlY3Rvci5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIC8vIE5vIG5lZWVkIHRvIGNoZWNrLCBhIG1hdGNoIHdpbGwgZmFpbCBpZiBpdCdzXHJcbiAgICAgICAgLy8gY2hpbGQgb3Igc2libGluZ1xyXG4gICAgICAgIGlmICh0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRjaGVzKGNvbnRleHQsIHRoaXMuc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gZGV0ZXJtaW5lUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgIC8vIGlzRWxlbWVudChjb250ZXh0KSB8fCBpc05vZGVMaXN0KGNvbnRleHQpIHx8IGlzQ29sbGVjdGlvbihjb250ZXh0KVxyXG4gICAgICAgIC8vIGlmIG5vIGNvbnRleHQgaXMgZ2l2ZW4sIHVzZSBkb2N1bWVudFxyXG4gICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0IHx8IGRvY3VtZW50LCB0aGlzKTtcclxuICAgIH1cclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJy4uL18nKSxcclxuICAgIHF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBpc0NhY2hlICAgID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgU2VsZWN0b3IgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9TZWxlY3RvcicpLFxyXG4gICAgUXVlcnkgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9RdWVyeScpLFxyXG4gICAgSXMgICAgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9JcycpLFxyXG4gICAgcGFyc2UgICAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UnKSxcclxuICAgIG5vcm1hbGl6ZSAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZScpO1xyXG5cclxudmFyIHRvU2VsZWN0b3JzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAvLyBTZWxlY3RvcnMgd2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgcXVlcnkgd2FzIGludmFsaWQuXHJcbiAgICAvLyBOb3QgcmV0dXJuaW5nIGVhcmx5IG9yIGRvaW5nIGV4dHJhIGNoZWNrcyBhcyB0aGlzIHdpbGxcclxuICAgIC8vIG5vb3Agb24gdGhlIFF1ZXJ5IGFuZCBJcyBsZXZlbCBhbmQgaXMgdGhlIGV4Y2VwdGlvblxyXG4gICAgLy8gaW5zdGVhZCBvZiB0aGUgcnVsZVxyXG4gICAgdmFyIHNlbGVjdG9ycyA9IHBhcnNlLnN1YnF1ZXJpZXMoc3RyKSB8fCBbXTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZWFjaCBvZiB0aGUgc2VsZWN0b3JzLi4uXHJcbiAgICBzZWxlY3RvcnMgPSBfLm1hcChzZWxlY3RvcnMsIG5vcm1hbGl6ZSk7XHJcblxyXG4gICAgLy8gLi4uYW5kIG1hcCB0aGVtIHRvIFNlbGVjdG9yIG9iamVjdHNcclxuICAgIHJldHVybiBfLmZhc3RtYXAoc2VsZWN0b3JzLCAoc2VsZWN0b3IpID0+IG5ldyBTZWxlY3RvcihzZWxlY3RvcikpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZTogcGFyc2UsXHJcbiAgICBcclxuICAgIHF1ZXJ5OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZS5oYXMoc3RyKSA/IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLmdldChzdHIpIDogXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUucHV0KHN0ciwgKCkgPT4gbmV3IFF1ZXJ5KHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH0sXHJcbiAgICBpczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQ2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgaXNDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBpc0NhY2hlLnB1dChzdHIsICgpID0+IG5ldyBJcyh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCI6Y2hpbGQtYXRcIjogXCI6bnRoLWNoaWxkKHgpXCIsXHJcblx0XCI6Y2hpbGQtZ3RcIjogXCI6bnRoLWNoaWxkKG4reClcIixcclxuXHRcIjpjaGlsZC1sdFwiOiBcIjpudGgtY2hpbGQofm4reClcIlxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuICAgIFwiOmNoaWxkLWV2ZW5cIiA6IFwiOm50aC1jaGlsZChldmVuKVwiLFxyXG4gICAgXCI6Y2hpbGQtb2RkXCIgIDogXCI6bnRoLWNoaWxkKG9kZClcIixcclxuICAgIFwiOnRleHRcIiAgICAgICA6IFwiW3R5cGU9dGV4dF1cIixcclxuICAgIFwiOnBhc3N3b3JkXCIgICA6IFwiW3R5cGU9cGFzc3dvcmRdXCIsXHJcbiAgICBcIjpyYWRpb1wiICAgICAgOiBcIlt0eXBlPXJhZGlvXVwiLFxyXG4gICAgXCI6Y2hlY2tib3hcIiAgIDogXCJbdHlwZT1jaGVja2JveF1cIixcclxuICAgIFwiOnN1Ym1pdFwiICAgICA6IFwiW3R5cGU9c3VibWl0XVwiLFxyXG4gICAgXCI6cmVzZXRcIiAgICAgIDogXCJbdHlwZT1yZXNldF1cIixcclxuICAgIFwiOmJ1dHRvblwiICAgICA6IFwiW3R5cGU9YnV0dG9uXVwiLFxyXG4gICAgXCI6aW1hZ2VcIiAgICAgIDogXCJbdHlwZT1pbWFnZV1cIixcclxuICAgIFwiOmlucHV0XCIgICAgICA6IFwiW3R5cGU9aW5wdXRdXCIsXHJcbiAgICBcIjpmaWxlXCIgICAgICAgOiBcIlt0eXBlPWZpbGVdXCIsXHJcbiAgICBcIjpzZWxlY3RlZFwiICAgOiBcIltzZWxlY3RlZD1zZWxlY3RlZF1cIlxyXG59IiwidmFyIFNVUFBPUlRTICAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG5cclxuICAgIEFUVFJJQlVURV9TRUxFQ1RPUiA9IC9cXFtcXHMqW1xcdy1dK1xccypbISReKl0/KD86PVxccyooWydcIl0/KSguKj9bXlxcXFxdfFteXFxcXF0qKSk/XFwxXFxzKlxcXS9nLFxyXG4gICAgUFNFVURPX1NFTEVDVCAgICAgID0gLyg6W15cXHNcXChcXFspXSspL2csXHJcbiAgICBDQVBUVVJFX1NFTEVDVCAgICAgPSAvKDpbXlxcc14oXSspXFwoKFteXFwpXSspXFwpL2csXHJcbiAgICBwc2V1ZG9DYWNoZSAgICAgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBwcm94eVNlbGVjdG9ycyAgICAgPSByZXF1aXJlKCcuL3Byb3h5Lmpzb24nKSxcclxuICAgIGNhcHR1cmVTZWxlY3RvcnMgICA9IHJlcXVpcmUoJy4vY2FwdHVyZS5qc29uJyk7XHJcblxyXG52YXIgZ2V0QXR0cmlidXRlUG9zaXRpb25zID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgcGFpcnMgPSBbXTtcclxuICAgIC8vIE5vdCB1c2luZyByZXR1cm4gdmFsdWUuIFNpbXBseSB1c2luZyBpdCB0byBpdGVyYXRlXHJcbiAgICAvLyB0aHJvdWdoIGFsbCBvZiB0aGUgbWF0Y2hlcyB0byBwb3B1bGF0ZSBtYXRjaCBwb3NpdGlvbnNcclxuICAgIHN0ci5yZXBsYWNlKEFUVFJJQlVURV9TRUxFQ1RPUiwgZnVuY3Rpb24obWF0Y2gsIGNhcDEsIGNhcDIsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcGFpcnMucHVzaChbIHBvc2l0aW9uLCBwb3NpdGlvbiArIG1hdGNoLmxlbmd0aCBdKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHBhaXJzO1xyXG59O1xyXG5cclxudmFyIGlzT3V0c2lkZU9mQXR0cmlidXRlID0gZnVuY3Rpb24ocG9zaXRpb24sIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHBvc2l0aW9ucy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHZhciBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICBpZiAocG9zaXRpb24gPiBwb3NbMF0gJiYgcG9zaXRpb24gPCBwb3NbMV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxudmFyIHBzZXVkb1JlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKFBTRVVET19TRUxFQ1QsIGZ1bmN0aW9uKG1hdGNoLCBjYXAsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb3h5U2VsZWN0b3JzW21hdGNoXSA/IHByb3h5U2VsZWN0b3JzW21hdGNoXSA6IG1hdGNoO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgY2FwdHVyZVJlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGNhcHR1cmVTZWxlY3RvcjtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZShDQVBUVVJFX1NFTEVDVCwgZnVuY3Rpb24obWF0Y2gsIGNhcCwgdmFsdWUsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChjYXB0dXJlU2VsZWN0b3IgPSBjYXB0dXJlU2VsZWN0b3JzW2NhcF0pID8gY2FwdHVyZVNlbGVjdG9yLnJlcGxhY2UoJ3gnLCB2YWx1ZSkgOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIGJvb2xlYW5TZWxlY3RvclJlcGxhY2UgPSBTVVBQT1JUUy5zZWxlY3RlZFNlbGVjdG9yID9cclxuICAgIC8vIElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIGZ1bmN0aW9uKHN0cikgeyByZXR1cm4gc3RyOyB9IDpcclxuICAgIC8vIElFOC05XHJcbiAgICBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb25zID0gZ2V0QXR0cmlidXRlUG9zaXRpb25zKHN0ciksXHJcbiAgICAgICAgICAgIGlkeCA9IHBvc2l0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBvcyxcclxuICAgICAgICAgICAgc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzdHIuc3Vic3RyaW5nKHBvc1swXSwgcG9zWzFdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnW3NlbGVjdGVkXScpIHtcclxuICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgcG9zWzBdKSArICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXScgKyBzdHIuc3Vic3RyaW5nKHBvc1sxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBwc2V1ZG9DYWNoZS5oYXMoc3RyKSA/IHBzZXVkb0NhY2hlLmdldChzdHIpIDogcHNldWRvQ2FjaGUucHV0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGF0dHJQb3NpdGlvbnMgPSBnZXRBdHRyaWJ1dGVQb3NpdGlvbnMoc3RyKTtcclxuICAgICAgICBzdHIgPSBwc2V1ZG9SZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICAgICAgc3RyID0gYm9vbGVhblNlbGVjdG9yUmVwbGFjZShzdHIpO1xyXG4gICAgICAgIHJldHVybiBjYXB0dXJlUmVwbGFjZShzdHIsIGF0dHJQb3NpdGlvbnMpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qXHJcbiAqIEZpenpsZS5qc1xyXG4gKiBBZGFwdGVkIGZyb20gU2l6emxlLmpzXHJcbiAqL1xyXG52YXIgdG9rZW5DYWNoZSAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHN1YnF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcblxyXG4gICAgZXJyb3IgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciAoY2F1Z2h0KSBcIicrIHNlbGVjdG9yICsnXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zZWxlY3RvcnMvI3doaXRlc3BhY2VcclxuICAgIFdISVRFU1BBQ0UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgSURFTlRJRklFUiA9ICcoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXFxceDAwLVxcXFx4YTBdKSsnLFxyXG5cclxuICAgIC8vIE5PVEU6IExlYXZpbmcgZG91YmxlIHF1b3RlcyB0byByZWR1Y2UgZXNjYXBpbmdcclxuICAgIC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xyXG4gICAgQVRUUklCVVRFUyA9IFwiXFxcXFtcIiArIFdISVRFU1BBQ0UgKyBcIiooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBPcGVyYXRvciAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiKihbKl4kfCF+XT89KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIElERU5USUZJRVJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgSURFTlRJRklFUiArIFwiKSl8KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgXCIqXFxcXF1cIixcclxuXHJcbiAgICBQU0VVRE9TID0gXCI6KFwiICsgSURFTlRJRklFUiArIFwiKSg/OlxcXFwoKFwiICtcclxuICAgICAgICAvLyBUbyByZWR1Y2UgdGhlIG51bWJlciBvZiBzZWxlY3RvcnMgbmVlZGluZyB0b2tlbml6ZSBpbiB0aGUgcHJlRmlsdGVyLCBwcmVmZXIgYXJndW1lbnRzOlxyXG4gICAgICAgIC8vIDEuIHF1b3RlZCAoY2FwdHVyZSAzOyBjYXB0dXJlIDQgb3IgY2FwdHVyZSA1KVxyXG4gICAgICAgIFwiKCcoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcIil8XCIgK1xyXG4gICAgICAgIC8vIDIuIHNpbXBsZSAoY2FwdHVyZSA2KVxyXG4gICAgICAgIFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKClbXFxcXF1dfFwiICsgQVRUUklCVVRFUyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgUl9DT01NQSAgICAgICA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqLCcgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfQ09NQklOQVRPUlMgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKihbPit+XXwnICsgV0hJVEVTUEFDRSArICcpJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9QU0VVRE8gICAgICA9IG5ldyBSZWdFeHAoUFNFVURPUyksXHJcbiAgICBSX01BVENIX0VYUFIgPSB7XHJcbiAgICAgICAgSUQ6ICAgICBuZXcgUmVnRXhwKCdeIygnICAgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBDTEFTUzogIG5ldyBSZWdFeHAoJ15cXFxcLignICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBJREVOVElGSUVSICsgJ3xbKl0pJyksXHJcbiAgICAgICAgQVRUUjogICBuZXcgUmVnRXhwKCdeJyAgICAgKyBBVFRSSUJVVEVTKSxcclxuICAgICAgICBQU0VVRE86IG5ldyBSZWdFeHAoJ14nICAgICArIFBTRVVET1MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufCknICsgV0hJVEVTUEFDRSArICcqKD86KFsrLV18KScgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBXSElURVNQQUNFICsgJypcXFxcKXwpJywgJ2knKSxcclxuICAgICAgICBib29sOiAgIG5ldyBSZWdFeHAoXCJeKD86Y2hlY2tlZHxzZWxlY3RlZHxhc3luY3xhdXRvZm9jdXN8YXV0b3BsYXl8Y29udHJvbHN8ZGVmZXJ8ZGlzYWJsZWR8aGlkZGVufGlzbWFwfGxvb3B8bXVsdGlwbGV8b3BlbnxyZWFkb25seXxyZXF1aXJlZHxzY29wZWQpJFwiLCBcImlcIilcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ1NTIGVzY2FwZXMgaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xyXG4gICAgUl9VTkVTQ0FQRSA9IG5ldyBSZWdFeHAoJ1xcXFxcXFxcKFtcXFxcZGEtZl17MSw2fScgKyBXSElURVNQQUNFICsgJz98KCcgKyBXSElURVNQQUNFICsgJyl8LiknLCAnaWcnKSxcclxuICAgIGZ1bmVzY2FwZSA9IGZ1bmN0aW9uKF8sIGVzY2FwZWQsIGVzY2FwZWRXaGl0ZXNwYWNlKSB7XHJcbiAgICAgICAgdmFyIGhpZ2ggPSAnMHgnICsgKGVzY2FwZWQgLSAweDEwMDAwKTtcclxuICAgICAgICAvLyBOYU4gbWVhbnMgbm9uLWNvZGVwb2ludFxyXG4gICAgICAgIC8vIFN1cHBvcnQ6IEZpcmVmb3g8MjRcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGVycm9uZW91cyBudW1lcmljIGludGVycHJldGF0aW9uIG9mICsnMHgnXHJcbiAgICAgICAgcmV0dXJuIGhpZ2ggIT09IGhpZ2ggfHwgZXNjYXBlZFdoaXRlc3BhY2UgP1xyXG4gICAgICAgICAgICBlc2NhcGVkIDpcclxuICAgICAgICAgICAgaGlnaCA8IDAgP1xyXG4gICAgICAgICAgICAgICAgLy8gQk1QIGNvZGVwb2ludFxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKGhpZ2ggKyAweDEwMDAwKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwbGVtZW50YWwgUGxhbmUgY29kZXBvaW50IChzdXJyb2dhdGUgcGFpcilcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZSgoaGlnaCA+PiAxMCkgfCAweEQ4MDAsIChoaWdoICYgMHgzRkYpIHwgMHhEQzAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJlRmlsdGVyID0ge1xyXG4gICAgICAgIEFUVFI6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0ucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSB0aGUgZ2l2ZW4gdmFsdWUgdG8gbWF0Y2hbM10gd2hldGhlciBxdW90ZWQgb3IgdW5xdW90ZWRcclxuICAgICAgICAgICAgbWF0Y2hbM10gPSAoIG1hdGNoWzNdIHx8IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnICkucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdID09PSAnfj0nKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFszXSA9ICcgJyArIG1hdGNoWzNdICsgJyAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgNCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgQ0hJTEQ6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIC8qIG1hdGNoZXMgZnJvbSBSX01BVENIX0VYUFJbJ0NISUxEJ11cclxuICAgICAgICAgICAgICAgIDEgdHlwZSAob25seXxudGh8Li4uKVxyXG4gICAgICAgICAgICAgICAgMiB3aGF0IChjaGlsZHxvZi10eXBlKVxyXG4gICAgICAgICAgICAgICAgMyBhcmd1bWVudCAoZXZlbnxvZGR8XFxkKnxcXGQqbihbKy1dXFxkKyk/fC4uLilcclxuICAgICAgICAgICAgICAgIDQgeG4tY29tcG9uZW50IG9mIHhuK3kgYXJndW1lbnQgKFsrLV0/XFxkKm58KVxyXG4gICAgICAgICAgICAgICAgNSBzaWduIG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNiB4IG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNyBzaWduIG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA4IHkgb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXS5zbGljZSgwLCAzKSA9PT0gJ250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIG50aC0qIHJlcXVpcmVzIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgUFNFVURPOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICB2YXIgZXhjZXNzLFxyXG4gICAgICAgICAgICAgICAgdW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoUl9NQVRDSF9FWFBSLkNISUxELnRlc3QobWF0Y2hbMF0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWNjZXB0IHF1b3RlZCBhcmd1bWVudHMgYXMtaXNcclxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgLy8gU3RyaXAgZXhjZXNzIGNoYXJhY3RlcnMgZnJvbSB1bnF1b3RlZCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1bnF1b3RlZCAmJiBSX1BTRVVETy50ZXN0KHVucXVvdGVkKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB0b2tlbml6ZSh1bnF1b3RlZCwgdHJ1ZSkpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB1bnF1b3RlZC5pbmRleE9mKCcpJywgdW5xdW90ZWQubGVuZ3RoIC0gZXhjZXNzKSAtIHVucXVvdGVkLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleGNlc3MgaXMgYSBuZWdhdGl2ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSB1bnF1b3RlZC5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBbcGFyc2VPbmx5PWZhbHNlXVxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXXxOdW1iZXJ8bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgdG9rZW5pemUgPSBmdW5jdGlvbihzZWxlY3RvciwgcGFyc2VPbmx5KSB7XHJcbiAgICBpZiAodG9rZW5DYWNoZS5oYXMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlT25seSA/IDAgOiB0b2tlbkNhY2hlLmdldChzZWxlY3Rvcikuc2xpY2UoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHR5cGUsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7UmVnRXhwfSAqL1xyXG4gICAgICAgIHJlZ2V4LFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge0FycmF5fSAqL1xyXG4gICAgICAgIG1hdGNoLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBtYXRjaGVkLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ1tdfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJpZXMgPSBbXSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc3VicXVlcnkgPSAnJyxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc29GYXIgPSBzZWxlY3RvcjtcclxuXHJcbiAgICB3aGlsZSAoc29GYXIpIHtcclxuICAgICAgICAvLyBDb21tYSBhbmQgZmlyc3QgcnVuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkIHx8IChtYXRjaCA9IFJfQ09NTUEuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uc3VtZSB0cmFpbGluZyBjb21tYXMgYXMgdmFsaWRcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKSB8fCBzb0ZhcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG4gICAgICAgICAgICBzdWJxdWVyeSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF0Y2hlZCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIENvbWJpbmF0b3JzXHJcbiAgICAgICAgaWYgKChtYXRjaCA9IFJfQ09NQklOQVRPUlMuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpbHRlcnNcclxuICAgICAgICBmb3IgKHR5cGUgaW4gUl9NQVRDSF9FWFBSKSB7XHJcbiAgICAgICAgICAgIHJlZ2V4ID0gUl9NQVRDSF9FWFBSW3R5cGVdO1xyXG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc29GYXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmICghcHJlRmlsdGVyW3R5cGVdIHx8IChtYXRjaCA9IHByZUZpbHRlclt0eXBlXShtYXRjaCkpKSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbWF0Y2hlZCkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuXHJcbiAgICAvLyBSZXR1cm4gdGhlIGxlbmd0aCBvZiB0aGUgaW52YWxpZCBleGNlc3NcclxuICAgIC8vIGlmIHdlJ3JlIGp1c3QgcGFyc2luZy5cclxuICAgIGlmIChwYXJzZU9ubHkpIHsgcmV0dXJuIHNvRmFyLmxlbmd0aDsgfVxyXG5cclxuICAgIGlmIChzb0ZhcikgeyBlcnJvcihzZWxlY3Rvcik7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgcmV0dXJuIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCBzdWJxdWVyaWVzKS5zbGljZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmdbXXxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZyB0aGUgc2VsZWN0b3IuXHJcbiAgICAgKi9cclxuICAgIHN1YnF1ZXJpZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHN1YnF1ZXJ5Q2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgICAgICBzdWJxdWVyeUNhY2hlLmdldChzZWxlY3RvcikgOiBcclxuICAgICAgICAgICAgc3VicXVlcnlDYWNoZS5wdXQoc2VsZWN0b3IsICgpID0+IHRva2VuaXplKHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzQm9vbDogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiBSX01BVENIX0VYUFIuYm9vbC50ZXN0KG5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IDI7IiwibW9kdWxlLmV4cG9ydHMgPSA4OyIsIm1vZHVsZS5leHBvcnRzID0gOTsiLCJtb2R1bGUuZXhwb3J0cyA9IDExOyIsIm1vZHVsZS5leHBvcnRzID0gMTsiLCJtb2R1bGUuZXhwb3J0cyA9IDM7IiwiICAgIC8vIE1hdGNoZXMgXCItbXMtXCIgc28gdGhhdCBpdCBjYW4gYmUgY2hhbmdlZCB0byBcIm1zLVwiXHJcbnZhciBUUlVOQ0FURV9NU19QUkVGSVggID0gL14tbXMtLyxcclxuXHJcbiAgICAvLyBNYXRjaGVzIGRhc2hlZCBzdHJpbmcgZm9yIGNhbWVsaXppbmdcclxuICAgIERBU0hfQ0FUQ0ggICAgICAgICAgPSAvLShbXFxkYS16XSkvZ2ksXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIm5vbmVcIiBvciBhIHRhYmxlIHR5cGUgZS5nLiBcInRhYmxlXCIsXHJcbiAgICAvLyBcInRhYmxlLWNlbGxcIiBldGMuLi5cclxuICAgIE5PTkVfT1JfVEFCTEUgICAgICAgPSAvXihub25lfHRhYmxlKD8hLWNbZWFdKS4rKS8sXHJcbiAgICBcclxuICAgIFRZUEVfVEVTVF9GT0NVU0FCTEUgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxidXR0b258b2JqZWN0KSQvaSxcclxuICAgIFRZUEVfVEVTVF9DTElDS0FCTEUgPSAvXig/OmF8YXJlYSkkL2ksXHJcbiAgICBTRUxFQ1RPUl9JRCAgICAgICAgID0gL14jKFtcXHctXSspJC8sXHJcbiAgICBTRUxFQ1RPUl9UQUcgICAgICAgID0gL15bXFx3LV0rJC8sXHJcbiAgICBTRUxFQ1RPUl9DTEFTUyAgICAgID0gL15cXC4oW1xcdy1dKykkLyxcclxuICAgIFBPU0lUSU9OICAgICAgICAgICAgPSAvXih0b3B8cmlnaHR8Ym90dG9tfGxlZnQpJC8sXHJcbiAgICBOVU1fTk9OX1BYICAgICAgICAgID0gbmV3IFJlZ0V4cCgnXignICsgKC9bKy1dPyg/OlxcZCpcXC58KVxcZCsoPzpbZUVdWystXT9cXGQrfCkvKS5zb3VyY2UgKyAnKSg/IXB4KVthLXolXSskJywgJ2knKSxcclxuICAgIFNJTkdMRV9UQUcgICAgICAgICAgPSAvXjwoXFx3KylcXHMqXFwvPz4oPzo8XFwvXFwxPnwpJC8sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYXAgb2YgcGFyZW50IHRhZyBuYW1lcyB0byB0aGUgY2hpbGQgdGFncyB0aGF0IHJlcXVpcmUgdGhlbS5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIFBBUkVOVF9NQVAgPSB7XHJcbiAgICAgICAgdGFibGU6ICAgIC9ePCg/OnRib2R5fHRmb290fHRoZWFkfGNvbGdyb3VwfGNhcHRpb24pXFxiLyxcclxuICAgICAgICB0Ym9keTogICAgL148KD86dHIpXFxiLyxcclxuICAgICAgICB0cjogICAgICAgL148KD86dGR8dGgpXFxiLyxcclxuICAgICAgICBjb2xncm91cDogL148KD86Y29sKVxcYi8sXHJcbiAgICAgICAgc2VsZWN0OiAgIC9ePCg/Om9wdGlvbilcXGIvXHJcbiAgICB9O1xyXG5cclxuLy8gaGF2aW5nIGNhY2hlcyBpc24ndCBhY3R1YWxseSBmYXN0ZXJcclxuLy8gZm9yIGEgbWFqb3JpdHkgb2YgdXNlIGNhc2VzIGZvciBzdHJpbmdcclxuLy8gbWFuaXB1bGF0aW9uc1xyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9zaW1wbGUtY2FjaGUtZm9yLXN0cmluZy1tYW5pcFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG51bU5vdFB4OiAgICAgICAodmFsKSA9PiBOVU1fTk9OX1BYLnRlc3QodmFsKSxcclxuICAgIHBvc2l0aW9uOiAgICAgICAodmFsKSA9PiBQT1NJVElPTi50ZXN0KHZhbCksXHJcbiAgICBzaW5nbGVUYWdNYXRjaDogKHZhbCkgPT4gU0lOR0xFX1RBRy5leGVjKHZhbCksXHJcbiAgICBpc05vbmVPclRhYmxlOiAgKHN0cikgPT4gTk9ORV9PUl9UQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0ZvY3VzYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0ZPQ1VTQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0NsaWNrYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0NMSUNLQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc1N0cmljdElkOiAgICAgKHN0cikgPT4gU0VMRUNUT1JfSUQudGVzdChzdHIpLFxyXG4gICAgaXNUYWc6ICAgICAgICAgIChzdHIpID0+IFNFTEVDVE9SX1RBRy50ZXN0KHN0ciksXHJcbiAgICBpc0NsYXNzOiAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfQ0xBU1MudGVzdChzdHIpLFxyXG5cclxuICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKFRSVU5DQVRFX01TX1BSRUZJWCwgJ21zLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKERBU0hfQ0FUQ0gsIChtYXRjaCwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudFRhZ05hbWU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciB2YWwgPSBzdHIuc3Vic3RyKDAsIDMwKTtcclxuICAgICAgICBmb3IgKHZhciBwYXJlbnRUYWdOYW1lIGluIFBBUkVOVF9NQVApIHtcclxuICAgICAgICAgICAgaWYgKFBBUkVOVF9NQVBbcGFyZW50VGFnTmFtZV0udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50VGFnTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ2Rpdic7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBESVYgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKSxcclxuICAgIGEgICAgICA9IERJVi5xdWVyeVNlbGVjdG9yKCdhJyksXHJcbiAgICBzZWxlY3QgPSBjcmVhdGUoJ3NlbGVjdCcpLFxyXG4gICAgb3B0aW9uID0gc2VsZWN0LmFwcGVuZENoaWxkKGNyZWF0ZSgnb3B0aW9uJykpO1xyXG5cclxudmFyIHRlc3QgPSBmdW5jdGlvbih0YWdOYW1lLCB0ZXN0Rm4pIHtcclxuICAgIC8vIEF2b2lkIHZhcmlhYmxlIHJlZmVyZW5jZXMgdG8gZWxlbWVudHMgdG8gcHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUUuXHJcbiAgICByZXR1cm4gdGVzdEZuKGNyZWF0ZSh0YWdOYW1lKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IFVSTHMgYXJlbid0IG1hbmlwdWxhdGVkXHJcbiAgICAvLyAoSUUgbm9ybWFsaXplcyBpdCBieSBkZWZhdWx0KVxyXG4gICAgaHJlZk5vcm1hbGl6ZWQ6IGEuZ2V0QXR0cmlidXRlKCdocmVmJykgPT09ICcvYScsXHJcblxyXG4gICAgLy8gQ2hlY2sgdGhlIGRlZmF1bHQgY2hlY2tib3gvcmFkaW8gdmFsdWUgKCcnIGluIG9sZGVyIFdlYktpdDsgJ29uJyBlbHNld2hlcmUpXHJcbiAgICBjaGVja09uOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuICEhaW5wdXQudmFsdWU7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbiBpbnB1dCBtYWludGFpbnMgaXRzIHZhbHVlIGFmdGVyIGJlY29taW5nIGEgcmFkaW9cclxuICAgIC8vIFN1cHBvcnQ6IE1vZGVybiBicm93c2VycyBvbmx5IChOT1QgSUUgPD0gMTEpXHJcbiAgICByYWRpb1ZhbHVlOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQudmFsdWUgPSAndCc7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnZhbHVlID09PSAndCc7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBhIHNlbGVjdGVkLWJ5LWRlZmF1bHQgb3B0aW9uIGhhcyBhIHdvcmtpbmcgc2VsZWN0ZWQgcHJvcGVydHkuXHJcbiAgICAvLyAoV2ViS2l0IGRlZmF1bHRzIHRvIGZhbHNlIGluc3RlYWQgb2YgdHJ1ZSwgSUUgdG9vLCBpZiBpdCdzIGluIGFuIG9wdGdyb3VwKVxyXG4gICAgb3B0U2VsZWN0ZWQ6IG9wdGlvbi5zZWxlY3RlZCxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgb3B0aW9ucyBpbnNpZGUgZGlzYWJsZWQgc2VsZWN0cyBhcmVuJ3QgbWFya2VkIGFzIGRpc2FibGVkXHJcbiAgICAvLyAoV2ViS2l0IG1hcmtzIHRoZW0gYXMgZGlzYWJsZWQpXHJcbiAgICBvcHREaXNhYmxlZDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuICFvcHRpb24uZGlzYWJsZWQ7XHJcbiAgICB9KCkpLFxyXG4gICAgXHJcbiAgICB0ZXh0Q29udGVudDogRElWLnRleHRDb250ZW50ICE9PSB1bmRlZmluZWQsXHJcblxyXG4gICAgLy8gTW9kZXJuIGJyb3dzZXJzIG5vcm1hbGl6ZSBcXHJcXG4gdG8gXFxuIGluIHRleHRhcmVhIHZhbHVlcyxcclxuICAgIC8vIGJ1dCBJRSA8PSAxMSAoYW5kIHBvc3NpYmx5IG5ld2VyKSBkbyBub3QuXHJcbiAgICB2YWx1ZU5vcm1hbGl6ZWQ6IHRlc3QoJ3RleHRhcmVhJywgZnVuY3Rpb24odGV4dGFyZWEpIHtcclxuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9ICdcXHJcXG4nO1xyXG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS52YWx1ZSA9PT0gJ1xcbic7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBzZWxlY3RlZFNlbGVjdG9yOiB0ZXN0KCdzZWxlY3QnLCBmdW5jdGlvbihzZWxlY3QpIHtcclxuICAgICAgICBzZWxlY3QuaW5uZXJIVE1MID0gJzxvcHRpb24gdmFsdWU9XCIxXCI+MTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XCIyXCIgc2VsZWN0ZWQ+Mjwvb3B0aW9uPic7XHJcbiAgICAgICAgcmV0dXJuICEhc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJ29wdGlvbltzZWxlY3RlZF0nKTtcclxuICAgIH0pXHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRVxyXG5ESVYgPSBhID0gc2VsZWN0ID0gb3B0aW9uID0gbnVsbDtcclxuIiwidmFyIGV4aXN0cyAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgc2xpY2UgICAgICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyk7XHJcblxyXG52YXIgXyA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gRmxhdHRlbiB0aGF0IGFsc28gY2hlY2tzIGlmIHZhbHVlIGlzIGEgTm9kZUxpc3RcclxuICAgIGZsYXR0ZW46IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENvbmNhdCBmbGF0IGZvciBhIHNpbmdsZSBhcnJheSBvZiBhcnJheXNcclxuICAgIGNvbmNhdEZsYXQ6IChmdW5jdGlvbihjb25jYXQpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5lc3RlZEFycmF5cykge1xyXG4gICAgICAgICAgICByZXR1cm4gY29uY2F0LmFwcGx5KFtdLCBuZXN0ZWRBcnJheXMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfShbXS5jb25jYXQpKSxcclxuXHJcbiAgICB0b1B4OiAodmFsdWUpID0+IHZhbHVlICsgJ3B4JyxcclxuICAgIFxyXG4gICAgcGFyc2VJbnQ6IChudW0pID0+IHBhcnNlSW50KG51bSwgMTApLFxyXG5cclxuICAgIGV2ZXJ5OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdHMoYXJyKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAoIWl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4dGVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIG9iaiAgPSBhcmdzWzBdLFxyXG4gICAgICAgICAgICBsZW4gID0gYXJncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICghb2JqIHx8IGxlbiA8IDIpIHsgcmV0dXJuIG9iajsgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmdzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdGFuZGFyZCBtYXBcclxuICAgIG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBcnJheS1wcmVzZXJ2aW5nIG1hcFxyXG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vcHVzaC1tYXAtdnMtaW5kZXgtcmVwbGFjZW1lbnQtbWFwXHJcbiAgICBmYXN0bWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHRzOyB9XHJcbiAgICAgICAgaXRlcmF0b3IgPSBpdGVyYXRvciB8fCAoYXJnKSA9PiAhIWFyZztcclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXJyW2lkeF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHQ7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpKSB7IGJyZWFrOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gISFyZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHB1bGxlZCBmcm9tIEFNRFxyXG4gICAgdHlwZWNhc3Q6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSAnbnVsbCcpIHtcclxuICAgICAgICAgICAgciA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICByID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykge1xyXG4gICAgICAgICAgICByID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICcnIHx8IGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgLy8gaXNOYU4oJycpIHJldHVybnMgZmFsc2VcclxuICAgICAgICAgICAgciA9IHZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBwYXJzZUZsb2F0KG51bGwgfHwgJycpIHJldHVybnMgTmFOXHJcbiAgICAgICAgICAgIHIgPSBwYXJzZUZsb2F0KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZShvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycixcclxuICAgICAgICAgICAgbGVuID0gK29iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkob2JqLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJbaWR4XSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKG9ialtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUFycmF5OiBmdW5jdGlvbihhcmcpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcmcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGFyZy5zbGljZSA9PT0gc2xpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZy5zbGljZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaXNBcnJheUxpa2UoYXJnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2UoYXJnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFsgYXJnIF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihhcnIsIGl0ZW0pIHtcclxuICAgICAgICByZXR1cm4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdG9yKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAvLyBBcnJheS1saWtlXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbaWR4XSwgaWR4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQbGFpbiBvYmplY3RcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbcHJvcF0sIHByb3ApID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNTaXplOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBtZXJnZTogZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBzZWNvbmQubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgICAgICBpID0gZmlyc3QubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBHbyB0aHJvdWdoIGVhY2ggZWxlbWVudCBpbiB0aGVcclxuICAgICAgICAvLyBzZWNvbmQgYXJyYXkgYW5kIGFkZCBpdCB0byB0aGVcclxuICAgICAgICAvLyBmaXJzdFxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaWR4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcnN0Lmxlbmd0aCA9IGk7XHJcblxyXG4gICAgICAgIHJldHVybiBmaXJzdDtcclxuICAgIH1cclxufTsiLCJ2YXIgZGVsZXRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGRlbGV0YWJsZSA/IFxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgZGVsZXRlIHN0b3JlW2tleV07IH0gOlxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgc3RvcmVba2V5XSA9IHVuZGVmaW5lZDsgfTtcclxufTtcclxuXHJcbnZhciBnZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gc3RvcmUgJiYgc3RvcmVba2V5XSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleSwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIGRlbChzdG9yZSwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGJpTGV2ZWxHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgaGFzMSA9IGtleTEgaW4gc3RvcmUgJiYgc3RvcmVba2V5MV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKCFoYXMxIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoYXMxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ga2V5MiBpbiBzdG9yZVtrZXkxXSAmJiBzdG9yZVtrZXkxXVtrZXkyXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV07XHJcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gcmVmMSA6IChyZWYxICE9PSB1bmRlZmluZWQgPyByZWYxW2tleTJdIDogcmVmMSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICAvLyBFYXN5IHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWwoc3RvcmUsIGtleTEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEZWVwIHJlbW92YWxcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXSB8fCAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIGRlbChyZWYxLCBrZXkyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsdmwsIGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGx2bCA9PT0gMiA/IGJpTGV2ZWxHZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKSA6IGdldHRlclNldHRlcihkZWxldGFibGUpO1xyXG59OyIsInZhciBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzLnNldCA9IChEKSA9PiBjb25zdHJ1Y3RvciA9IEQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgK3ZhbHVlLmxlbmd0aCA9PT0gdmFsdWUubGVuZ3RoO1xyXG4iLCJ2YXIgRE9DVU1FTlRfRlJBR01FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlRfRlJBR01FTlQnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLm5vZGVUeXBlICE9PSBET0NVTUVOVF9GUkFHTUVOVCAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9EJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgRUxFTUVOVCAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCB2YWx1ZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgKCEhdmFsdWUgJiYgdHlwZSA9PT0gJ29iamVjdCcpO1xyXG59OyIsInZhciBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWwpID0+XHJcbiAgICB2YWwgJiYgKGlzU3RyaW5nKHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpIHx8IGlzRWxlbWVudCh2YWwpIHx8IGlzQ29sbGVjdGlvbih2YWwpKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJzsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IHZhbHVlLndpbmRvdztcclxuIiwidmFyIEVMRU1FTlQgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQgPyBtYXRjaGVzU2VsZWN0b3IuY2FsbChlbGVtLCBzZWxlY3RvcikgOiBmYWxzZTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IG51bGw7XHJcbiIsIi8vIGRpZmZlcnMgZnJvbSBmb3JFYWNoIGluIHRoYXQgdGhlIGlkeCAob3Iga2V5KSBpcyBmaXJzdCwgdGhlbiB0aGUgdmFsdWVcclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICBpZiAoIW9iaiB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gQXJyYXkgc3VwcG9ydFxyXG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGl0ZW07XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaXRlbSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChpdGVtLCBpZHgsIGl0ZW0pID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPYmplY3Qgc3VwcG9ydFxyXG4gICAgdmFyIGtleSwgdmFsdWU7XHJcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICB2YWx1ZSA9IG9ialtrZXldO1xyXG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKHZhbHVlLCBrZXksIHZhbHVlKSA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XHJcbiAgICB9XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICBpZiAoIW9iaiB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gQXJyYXkgc3VwcG9ydFxyXG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGl0ZW07XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaXRlbSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPYmplY3Qgc3VwcG9ydFxyXG4gICAgdmFyIGtleSwgdmFsdWU7XHJcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICB2YWx1ZSA9IG9ialtrZXldO1xyXG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5KSA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgc2xpY2UgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKSxcclxuICAgIGZvckVhY2ggPSByZXF1aXJlKCcuL2ZvckVhY2gnKTtcclxuXHJcbnZhciBtYXAgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgaWYgKCFhcnIubGVuZ3RoIHx8ICFpdGVyYXRvcikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgIGl0ZW07XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gXy5jb25jYXRGbGF0KHJlc3VsdHMpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzWytpbmRleF07XHJcbiAgICB9LFxyXG5cclxuICAgIGdldDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAvLyBObyBpbmRleCwgcmV0dXJuIGFsbFxyXG4gICAgICAgIGlmICghZXhpc3RzKGluZGV4KSkgeyByZXR1cm4gdGhpcy50b0FycmF5KCk7IH1cclxuXHJcbiAgICAgICAgaW5kZXggPSAraW5kZXg7XHJcblxyXG4gICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCkgeyBpbmRleCA9ICh0aGlzLmxlbmd0aCArIGluZGV4KTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc1tpbmRleF07XHJcbiAgICB9LFxyXG5cclxuICAgIGVxOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXMuZ2V0KGluZGV4KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNsaWNlOiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoc2xpY2UodGhpcy50b0FycmF5KCksIHN0YXJ0LCBlbmQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBmb3JFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBmb3JFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIG9yZGVyID0gcmVxdWlyZSgnb3JkZXInKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocmVzdWx0cykge1xyXG4gICAgdmFyIGhhc0R1cGxpY2F0ZXMgPSBvcmRlci5zb3J0KHJlc3VsdHMpO1xyXG4gICAgaWYgKCFoYXNEdXBsaWNhdGVzKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgdmFyIGVsZW0sXHJcbiAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAvLyBjcmVhdGUgdGhlIGFycmF5IGhlcmVcclxuICAgICAgICAvLyBzbyB0aGF0IGEgbmV3IGFycmF5IGlzbid0XHJcbiAgICAgICAgLy8gY3JlYXRlZC9kZXN0cm95ZWQgZXZlcnkgdW5pcXVlIGNhbGxcclxuICAgICAgICBkdXBsaWNhdGVzID0gW107XHJcblxyXG4gICAgLy8gR28gdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGlkZW50aWZ5XHJcbiAgICAvLyB0aGUgZHVwbGljYXRlcyB0byBiZSByZW1vdmVkXHJcbiAgICB3aGlsZSAoKGVsZW0gPSByZXN1bHRzW2lkeCsrXSkpIHtcclxuICAgICAgICBpZiAoZWxlbSA9PT0gcmVzdWx0c1tpZHhdKSB7XHJcbiAgICAgICAgICAgIGR1cGxpY2F0ZXMucHVzaChpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBSZW1vdmUgdGhlIGR1cGxpY2F0ZXMgZnJvbSB0aGUgcmVzdWx0c1xyXG4gICAgaWR4ID0gZHVwbGljYXRlcy5sZW5ndGg7XHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgIHJlc3VsdHMuc3BsaWNlKGR1cGxpY2F0ZXNbaWR4XSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07IiwidmFyIF8gICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgZXhpc3RzICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRnVuY3Rpb24gICAgICAgICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICAgICA9IHJlcXVpcmUoJ25vZGUvaXNFbGVtZW50JyksXHJcbiAgICBuZXdsaW5lcyAgICAgICAgICAgICA9IHJlcXVpcmUoJ3N0cmluZy9uZXdsaW5lcycpLFxyXG4gICAgU1VQUE9SVFMgICAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgaXNOb2RlTmFtZSAgICAgICAgICAgPSByZXF1aXJlKCdub2RlL2lzTmFtZScpLFxyXG4gICAgRml6emxlICAgICAgICAgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKSxcclxuICAgIHNhbml0aXplRGF0YUtleUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpO1xyXG5cclxudmFyIGlzRGF0YUtleSA9IChrZXkpID0+IChrZXkgfHwgJycpLnN1YnN0cigwLCA1KSA9PT0gJ2RhdGEtJyxcclxuXHJcbiAgICB0cmltRGF0YUtleSA9IChrZXkpID0+IGtleS5zdWJzdHIoMCwgNSksXHJcblxyXG4gICAgc2FuaXRpemVEYXRhS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHNhbml0aXplRGF0YUtleUNhY2hlLmhhcyhrZXkpID9cclxuICAgICAgICAgICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUuZ2V0KGtleSkgOlxyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5wdXQoa2V5LCAoKSA9PiBpc0RhdGFLZXkoa2V5KSA/IGtleSA6ICdkYXRhLScgKyBrZXkudG9Mb3dlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGFBdHRyS2V5cyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgYXR0cnMgPSBlbGVtLmF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIGlkeCAgID0gYXR0cnMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXlzICA9IFtdLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGF0dHJzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChpc0RhdGFLZXkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfTtcclxuXHJcbnZhciBib29sSG9vayA9IHtcclxuICAgIGlzOiAoYXR0ck5hbWUpID0+IEZpenpsZS5wYXJzZS5pc0Jvb2woYXR0ck5hbWUpLFxyXG4gICAgZ2V0OiAoZWxlbSwgYXR0ck5hbWUpID0+IGVsZW0uaGFzQXR0cmlidXRlKGF0dHJOYW1lKSA/IGF0dHJOYW1lLnRvTG93ZXJDYXNlKCkgOiB1bmRlZmluZWQsXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlLCBhdHRyTmFtZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGJvb2xlYW4gYXR0cmlidXRlcyB3aGVuIHNldCB0byBmYWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJOYW1lKTtcclxuICAgIH1cclxufTtcclxuXHJcbnZhciBob29rcyA9IHtcclxuICAgICAgICB0YWJpbmRleDoge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdHModGFiaW5kZXgpIHx8IHRhYmluZGV4ID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0YWJpbmRleDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHR5cGU6IHtcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFTVVBQT1JUUy5yYWRpb1ZhbHVlICYmIHZhbHVlID09PSAncmFkaW8nICYmIGlzTm9kZU5hbWUoZWxlbSwgJ2lucHV0JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTZXR0aW5nIHRoZSB0eXBlIG9uIGEgcmFkaW8gYnV0dG9uIGFmdGVyIHRoZSB2YWx1ZSByZXNldHMgdGhlIHZhbHVlIGluIElFNi05XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdmFsdWUgdG8gZGVmYXVsdCBpbiBjYXNlIHR5cGUgaXMgc2V0IGFmdGVyIHZhbHVlIGR1cmluZyBjcmVhdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS52YWx1ZSA9IG9sZFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld2xpbmVzKHZhbCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QXR0cmlidXRlID0gZnVuY3Rpb24oZWxlbSwgYXR0cikge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pIHx8ICFlbGVtLmhhc0F0dHJpYnV0ZShhdHRyKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBib29sSG9vay5nZXQoZWxlbSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0uZ2V0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBob29rc1thdHRyXS5nZXQoZWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gZWxlbS5nZXRBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICAgICAgcmV0dXJuIGV4aXN0cyhyZXQpID8gcmV0IDogdW5kZWZpbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXR0ZXJzID0ge1xyXG4gICAgICAgIGZvckF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChib29sSG9vay5pcyhhdHRyKSAmJiAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuYm9vbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmhvb2s7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuZWxlbTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJvb2w6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGJvb2xIb29rLnNldChlbGVtLCB2YWx1ZSwgYXR0cik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBob29rOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBob29rc1thdHRyXS5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZWxlbTogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgc2V0QXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgaXNGbiAgID0gaXNGdW5jdGlvbih2YWx1ZSksXHJcbiAgICAgICAgICAgIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIHZhbCxcclxuICAgICAgICAgICAgc2V0dGVyID0gc2V0dGVycy5mb3JBdHRyKGF0dHIsIHZhbHVlKTtcclxuXHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgIHZhbCA9IGlzRm4gPyB2YWx1ZS5jYWxsKGVsZW0sIGlkeCwgZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpKSA6IHZhbHVlO1xyXG4gICAgICAgICAgICBzZXR0ZXIoZWxlbSwgYXR0ciwgdmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgc2V0QXR0cmlidXRlID0gZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICB2YXIgc2V0dGVyID0gc2V0dGVycy5mb3JBdHRyKGF0dHIsIHZhbHVlKTtcclxuICAgICAgICBzZXR0ZXIoZWxlbSwgYXR0ciwgdmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXJyLCBhdHRyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlKGFycltpZHhdLCBhdHRyKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlQXR0cmlidXRlID0gZnVuY3Rpb24oZWxlbSwgYXR0cikge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0ucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBob29rc1thdHRyXS5yZW1vdmUoZWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgYXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRBdHRyaWJ1dGUodGhpc1swXSwgYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGFzc3VtZSBhbiBvYmplY3RcclxuICAgICAgICAgICAgdmFyIGF0dHJzID0gYXR0cjtcclxuICAgICAgICAgICAgZm9yIChhdHRyIGluIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIGF0dHJzW2F0dHJdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIC8vIHJlbW92ZVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZXModGhpcywgYXR0cik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaXRlcmF0b3JcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZEF0dHIgPSBnZXRBdHRyaWJ1dGUoZWxlbSwgYXR0ciksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCAgPSBmbi5jYWxsKGVsZW0sIGlkeCwgb2xkQXR0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICBzZXRBdHRyaWJ1dGUoZWxlbSwgYXR0ciwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBzZXRcclxuICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cjogZnVuY3Rpb24oYXR0cikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhhdHRyKSkgeyByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpOyB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGF0dHJEYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG1hcCAgPSB7fSxcclxuICAgICAgICAgICAgICAgIGtleXMgPSBnZXREYXRhQXR0cktleXMoZmlyc3QpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICA9IGtleXMubGVuZ3RoLCBrZXk7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAga2V5ID0ga2V5c1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgbWFwW3RyaW1EYXRhS2V5KGtleSldID0gXy50eXBlY2FzdChmaXJzdC5nZXRBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFjayB0byBhbiBvYmplY3QgZGVmaW5pdGlvblxyXG4gICAgICAgIHZhciBvYmogPSBrZXksXHJcbiAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tpZHhdLnNldEF0dHJpYnV0ZShzYW5pdGl6ZURhdGFLZXkoa2V5KSwgJycgKyBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBFTEVNRU5UICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgc3BsaXQgICAgID0gcmVxdWlyZSgnc3RyaW5nL3NwbGl0JyksXHJcbiAgICBpc0VtcHR5ICAgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpO1xyXG5cclxudmFyIGhhc0NsYXNzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgICAgIHJldHVybiAhIWVsZW0uY2xhc3NMaXN0ICYmIGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRDbGFzc2VzID0gZnVuY3Rpb24oZWxlbSwgbmFtZXMpIHtcclxuICAgICAgICBpZiAoIWVsZW0uY2xhc3NMaXN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LmFkZChuYW1lc1tpZHhdKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtLCBuYW1lcykge1xyXG4gICAgICAgIGlmICghZWxlbS5jbGFzc0xpc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QucmVtb3ZlKG5hbWVzW2lkeF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtLmNsYXNzTGlzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC50b2dnbGUobmFtZXNbaWR4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBfZG9BbnlFbGVtc0hhdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lKSB7XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgaWYgKGhhc0NsYXNzKGVsZW1zW2VsZW1JZHhdLCBuYW1lKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIF9hZGRDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIWlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGFkZENsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIWlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZW1vdmVBbGxDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMpIHtcclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBlbGVtc1tlbGVtSWR4XS5jbGFzc05hbWUgPSAnJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF90b2dnbGVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzKSB7XHJcbiAgICAgICAgLy8gU3VwcG9ydCBhcnJheS1saWtlIG9iamVjdHNcclxuICAgICAgICBpZiAoIWlzQXJyYXkobmFtZXMpKSB7IG5hbWVzID0gXy50b0FycmF5KG5hbWVzKTsgfVxyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIHRvZ2dsZUNsYXNzZXMoZWxlbXNbZWxlbUlkeF0sIG5hbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgaWYgKG5hbWUgPT09IHVuZGVmaW5lZCB8fCAhdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuICAgICAgICByZXR1cm4gX2RvQW55RWxlbXNIYXZlQ2xhc3ModGhpcywgbmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBfYWRkQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lcztcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5hbWVzID0gc3BsaXQobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBfYWRkQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIF9yZW1vdmVBbGxDbGFzc2VzKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWVzKSB8fCAhbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhuYW1lcykpIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lcztcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5hbWVzID0gc3BsaXQobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzczogZnVuY3Rpb24obmFtZXMsIHNob3VsZEFkZCkge1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZXMpIHx8ICFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgbmFtZXMgPSBzcGxpdChuYW1lcyk7XHJcbiAgICAgICAgaWYgKCFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKHNob3VsZEFkZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIF90b2dnbGVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNob3VsZEFkZCkge1xyXG4gICAgICAgICAgICBfYWRkQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgX3JlbW92ZUNsYXNzZXModGhpcywgbmFtZXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgc3BsaXQgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXR0YWNoZWQgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzRG9jdW1lbnQgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOdW1iZXIgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNCb29sZWFuICA9IHJlcXVpcmUoJ2lzL2Jvb2xlYW4nKSxcclxuICAgIGlzT2JqZWN0ICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgRE9DVU1FTlQgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVCcpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MgPSB7XHJcbiAgICBkaXNwbGF5OiAgICAnYmxvY2snLFxyXG4gICAgcG9zaXRpb246ICAgJ2Fic29sdXRlJyxcclxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXHJcbn07XHJcblxyXG52YXIgZ2V0RG9jdW1lbnREaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAvLyBFaXRoZXIgc2Nyb2xsW1dpZHRoL0hlaWdodF0gb3Igb2Zmc2V0W1dpZHRoL0hlaWdodF0gb3JcclxuICAgIC8vIGNsaWVudFtXaWR0aC9IZWlnaHRdLCB3aGljaGV2ZXIgaXMgZ3JlYXRlc3RcclxuICAgIHZhciBkb2MgPSBlbGVtLmRvY3VtZW50RWxlbWVudDtcclxuICAgIHJldHVybiBNYXRoLm1heChcclxuICAgICAgICBlbGVtLmJvZHlbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBlbGVtLmJvZHlbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZG9jWydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snY2xpZW50JyArIG5hbWVdXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIGhpZGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgfSxcclxuICAgIHNob3cgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGNzc1N3YXAgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBvbGQgPSB7fTtcclxuXHJcbiAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9sZCB2YWx1ZXMsIGFuZCBpbnNlcnQgdGhlIG5ldyBvbmVzXHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgb2xkW25hbWVdID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9wdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmV0ID0gY2FsbGJhY2soZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIFJldmVydCB0aGUgb2xkIHZhbHVlc1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvbGRbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBdm9pZHMgYW4gJ0lsbGVnYWwgSW52b2NhdGlvbicgZXJyb3IgKENocm9tZSlcclxuICAgIC8vIEF2b2lkcyBhICdUeXBlRXJyb3I6IEFyZ3VtZW50IDEgb2YgV2luZG93LmdldENvbXB1dGVkU3R5bGUgZG9lcyBub3QgaW1wbGVtZW50IGludGVyZmFjZSBFbGVtZW50JyBlcnJvciAoRmlyZWZveClcclxuICAgIGdldENvbXB1dGVkU3R5bGUgPSAoZWxlbSkgPT5cclxuICAgICAgICBpc0VsZW1lbnQoZWxlbSkgJiYgIWlzV2luZG93KGVsZW0pICYmICFpc0RvY3VtZW50KGVsZW0pID8gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSkgOiBudWxsLFxyXG5cclxuICAgIF93aWR0aCA9IHtcclxuICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gRE9DVU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnV2lkdGgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHdpZHRoID0gZWxlbS5vZmZzZXRXaWR0aDtcclxuICAgICAgICAgICAgaWYgKHdpZHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLndpZHRoID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfaGVpZ2h0ID0ge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBET0NVTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdIZWlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGVsZW0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoaGVpZ2h0ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChSRUdFWC5pc05vbmVPclRhYmxlKGNvbXB1dGVkU3R5bGUuZGlzcGxheSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3NzU3dhcChlbGVtLCBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncywgZnVuY3Rpb24oKSB7IHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICdoZWlnaHQnKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlLmhlaWdodCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgZ2V0V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuXHJcbiAgICAvLyBTdGFydCB3aXRoIG9mZnNldCBwcm9wZXJ0eSwgd2hpY2ggaXMgZXF1aXZhbGVudCB0byB0aGUgYm9yZGVyLWJveCB2YWx1ZVxyXG4gICAgdmFyIHZhbHVlSXNCb3JkZXJCb3ggPSB0cnVlLFxyXG4gICAgICAgIHZhbCA9IChuYW1lID09PSAnd2lkdGgnKSA/IGVsZW0ub2Zmc2V0V2lkdGggOiBlbGVtLm9mZnNldEhlaWdodCxcclxuICAgICAgICBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIGlzQm9yZGVyQm94ID0gc3R5bGVzLmJveFNpemluZyA9PT0gJ2JvcmRlci1ib3gnO1xyXG5cclxuICAgIC8vIHNvbWUgbm9uLWh0bWwgZWxlbWVudHMgcmV0dXJuIHVuZGVmaW5lZCBmb3Igb2Zmc2V0V2lkdGgsIHNvIGNoZWNrIGZvciBudWxsL3VuZGVmaW5lZFxyXG4gICAgLy8gc3ZnIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjQ5Mjg1XHJcbiAgICAvLyBNYXRoTUwgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD00OTE2NjhcclxuICAgIGlmICh2YWwgPD0gMCB8fCAhZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAvLyBGYWxsIGJhY2sgdG8gY29tcHV0ZWQgdGhlbiB1bmNvbXB1dGVkIGNzcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICB2YWwgPSBjdXJDc3MoZWxlbSwgbmFtZSwgc3R5bGVzKTtcclxuICAgICAgICBpZiAodmFsIDwgMCB8fCAhdmFsKSB7IHZhbCA9IGVsZW0uc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAgICAgLy8gQ29tcHV0ZWQgdW5pdCBpcyBub3QgcGl4ZWxzLiBTdG9wIGhlcmUgYW5kIHJldHVybi5cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgodmFsKSkgeyByZXR1cm4gdmFsOyB9XHJcblxyXG4gICAgICAgIC8vIHdlIG5lZWQgdGhlIGNoZWNrIGZvciBzdHlsZSBpbiBjYXNlIGEgYnJvd3NlciB3aGljaCByZXR1cm5zIHVucmVsaWFibGUgdmFsdWVzXHJcbiAgICAgICAgLy8gZm9yIGdldENvbXB1dGVkU3R5bGUgc2lsZW50bHkgZmFsbHMgYmFjayB0byB0aGUgcmVsaWFibGUgZWxlbS5zdHlsZVxyXG4gICAgICAgIHZhbHVlSXNCb3JkZXJCb3ggPSBpc0JvcmRlckJveCAmJiB2YWwgPT09IHN0eWxlc1tuYW1lXTtcclxuXHJcbiAgICAgICAgLy8gTm9ybWFsaXplICcnLCBhdXRvLCBhbmQgcHJlcGFyZSBmb3IgZXh0cmFcclxuICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHZhbCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICAvLyB1c2UgdGhlIGFjdGl2ZSBib3gtc2l6aW5nIG1vZGVsIHRvIGFkZC9zdWJ0cmFjdCBpcnJlbGV2YW50IHN0eWxlc1xyXG4gICAgcmV0dXJuIF8udG9QeChcclxuICAgICAgICB2YWwgKyBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodChcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JyxcclxuICAgICAgICAgICAgdmFsdWVJc0JvcmRlckJveCxcclxuICAgICAgICAgICAgc3R5bGVzXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBDU1NfRVhQQU5EID0gc3BsaXQoJ1RvcHxSaWdodHxCb3R0b218TGVmdCcpO1xyXG52YXIgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBleHRyYSwgaXNCb3JkZXJCb3gsIHN0eWxlcykge1xyXG4gICAgdmFyIHZhbCA9IDAsXHJcbiAgICAgICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIHRoZSByaWdodCBtZWFzdXJlbWVudCwgYXZvaWQgYXVnbWVudGF0aW9uXHJcbiAgICAgICAgaWR4ID0gKGV4dHJhID09PSAoaXNCb3JkZXJCb3ggPyAnYm9yZGVyJyA6ICdjb250ZW50JykpID9cclxuICAgICAgICAgICAgNCA6XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpbml0aWFsaXplIGZvciBob3Jpem9udGFsIG9yIHZlcnRpY2FsIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgKG5hbWUgPT09ICd3aWR0aCcpID9cclxuICAgICAgICAgICAgMSA6XHJcbiAgICAgICAgICAgIDAsXHJcbiAgICAgICAgdHlwZSxcclxuICAgICAgICAvLyBQdWxsZWQgb3V0IG9mIHRoZSBsb29wIHRvIHJlZHVjZSBzdHJpbmcgY29tcGFyaXNvbnNcclxuICAgICAgICBleHRyYUlzTWFyZ2luICA9IChleHRyYSA9PT0gJ21hcmdpbicpLFxyXG4gICAgICAgIGV4dHJhSXNDb250ZW50ID0gKCFleHRyYUlzTWFyZ2luICYmIGV4dHJhID09PSAnY29udGVudCcpLFxyXG4gICAgICAgIGV4dHJhSXNQYWRkaW5nID0gKCFleHRyYUlzTWFyZ2luICYmICFleHRyYUlzQ29udGVudCAmJiBleHRyYSA9PT0gJ3BhZGRpbmcnKTtcclxuXHJcbiAgICBmb3IgKDsgaWR4IDwgNDsgaWR4ICs9IDIpIHtcclxuICAgICAgICB0eXBlID0gQ1NTX0VYUEFORFtpZHhdO1xyXG5cclxuICAgICAgICAvLyBib3RoIGJveCBtb2RlbHMgZXhjbHVkZSBtYXJnaW4sIHNvIGFkZCBpdCBpZiB3ZSB3YW50IGl0XHJcbiAgICAgICAgaWYgKGV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzW2V4dHJhICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNCb3JkZXJCb3gpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGJvcmRlci1ib3ggaW5jbHVkZXMgcGFkZGluZywgc28gcmVtb3ZlIGl0IGlmIHdlIHdhbnQgY29udGVudFxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc0NvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgYm9yZGVyIG5vciBtYXJnaW4sIHNvIHJlbW92ZSBib3JkZXJcclxuICAgICAgICAgICAgaWYgKCFleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlICsgJ1dpZHRoJ10pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQsIHNvIGFkZCBwYWRkaW5nXHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1sncGFkZGluZycgKyB0eXBlXSkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGNvbnRlbnQgbm9yIHBhZGRpbmcsIHNvIGFkZCBib3JkZXJcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNQYWRkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ2JvcmRlcicgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdmFsO1xyXG59O1xyXG5cclxudmFyIGN1ckNzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGNvbXB1dGVkKSB7XHJcbiAgICB2YXIgc3R5bGUgPSBlbGVtLnN0eWxlLFxyXG4gICAgICAgIHN0eWxlcyA9IGNvbXB1dGVkIHx8IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgcmV0ID0gc3R5bGVzID8gc3R5bGVzLmdldFByb3BlcnR5VmFsdWUobmFtZSkgfHwgc3R5bGVzW25hbWVdIDogdW5kZWZpbmVkO1xyXG5cclxuICAgIC8vIEF2b2lkIHNldHRpbmcgcmV0IHRvIGVtcHR5IHN0cmluZyBoZXJlXHJcbiAgICAvLyBzbyB3ZSBkb24ndCBkZWZhdWx0IHRvIGF1dG9cclxuICAgIGlmICghZXhpc3RzKHJldCkgJiYgc3R5bGUgJiYgc3R5bGVbbmFtZV0pIHsgcmV0ID0gc3R5bGVbbmFtZV07IH1cclxuXHJcbiAgICAvLyBGcm9tIHRoZSBoYWNrIGJ5IERlYW4gRWR3YXJkc1xyXG4gICAgLy8gaHR0cDovL2VyaWsuZWFlLm5ldC9hcmNoaXZlcy8yMDA3LzA3LzI3LzE4LjU0LjE1LyNjb21tZW50LTEwMjI5MVxyXG5cclxuICAgIGlmIChzdHlsZXMpIHtcclxuICAgICAgICBpZiAocmV0ID09PSAnJyAmJiAhaXNBdHRhY2hlZChlbGVtKSkge1xyXG4gICAgICAgICAgICByZXQgPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgd2UncmUgbm90IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgcGl4ZWwgbnVtYmVyXHJcbiAgICAgICAgLy8gYnV0IGEgbnVtYmVyIHRoYXQgaGFzIGEgd2VpcmQgZW5kaW5nLCB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgdG8gcGl4ZWxzXHJcbiAgICAgICAgLy8gYnV0IG5vdCBwb3NpdGlvbiBjc3MgYXR0cmlidXRlcywgYXMgdGhvc2UgYXJlIHByb3BvcnRpb25hbCB0byB0aGUgcGFyZW50IGVsZW1lbnQgaW5zdGVhZFxyXG4gICAgICAgIC8vIGFuZCB3ZSBjYW4ndCBtZWFzdXJlIHRoZSBwYXJlbnQgaW5zdGVhZCBiZWNhdXNlIGl0IG1pZ2h0IHRyaWdnZXIgYSAnc3RhY2tpbmcgZG9sbHMnIHByb2JsZW1cclxuICAgICAgICBpZiAoUkVHRVgubnVtTm90UHgocmV0KSAmJiAhUkVHRVgucG9zaXRpb24obmFtZSkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvcmlnaW5hbCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyIGxlZnQgPSBzdHlsZS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgcnMgPSBlbGVtLnJ1bnRpbWVTdHlsZSxcclxuICAgICAgICAgICAgICAgIHJzTGVmdCA9IHJzICYmIHJzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXQgaW4gdGhlIG5ldyB2YWx1ZXMgdG8gZ2V0IGEgY29tcHV0ZWQgdmFsdWUgb3V0XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IGVsZW0uY3VycmVudFN0eWxlLmxlZnQ7IH1cclxuXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSAobmFtZSA9PT0gJ2ZvbnRTaXplJykgPyAnMWVtJyA6IHJldDtcclxuICAgICAgICAgICAgcmV0ID0gXy50b1B4KHN0eWxlLnBpeGVsTGVmdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXZlcnQgdGhlIGNoYW5nZWQgdmFsdWVzXHJcbiAgICAgICAgICAgIHN0eWxlLmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSByc0xlZnQ7IH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJldCA9PT0gdW5kZWZpbmVkID8gcmV0IDogcmV0ICsgJycgfHwgJ2F1dG8nO1xyXG59O1xyXG5cclxudmFyIG5vcm1hbGl6ZUNzc0tleSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHJldHVybiBSRUdFWC5jYW1lbENhc2UobmFtZSk7XHJcbn07XHJcblxyXG52YXIgc2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIGVsZW0uc3R5bGVbbmFtZV0gPSAodmFsdWUgPT09ICt2YWx1ZSkgPyBfLnRvUHgodmFsdWUpIDogdmFsdWU7XHJcbn07XHJcblxyXG52YXIgZ2V0U3R5bGUgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUoZWxlbSlbbmFtZV07XHJcbn07XHJcblxyXG52YXIgaXNIaWRkZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YW5kYXJkOlxyXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSFRNTEVsZW1lbnQub2Zmc2V0UGFyZW50XHJcbiAgICByZXR1cm4gZWxlbS5vZmZzZXRQYXJlbnQgPT09IG51bGwgfHxcclxuICAgICAgICAgICAgLy8gU3VwcG9ydDogT3BlcmEgPD0gMTIuMTJcclxuICAgICAgICAgICAgLy8gT3BlcmEgcmVwb3J0cyBvZmZzZXRXaWR0aHMgYW5kIG9mZnNldEhlaWdodHMgbGVzcyB0aGFuIHplcm8gb24gc29tZSBlbGVtZW50c1xyXG4gICAgICAgICAgICBlbGVtLm9mZnNldFdpZHRoIDw9IDAgJiYgZWxlbS5vZmZzZXRIZWlnaHQgPD0gMCB8fFxyXG4gICAgICAgICAgICAvLyBGYWxsYmFja1xyXG4gICAgICAgICAgICAoKGVsZW0uc3R5bGUgJiYgZWxlbS5zdHlsZS5kaXNwbGF5KSA/IGVsZW0uc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIDogZmFsc2UpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjdXJDc3M6IGN1ckNzcyxcclxuICAgIHdpZHRoOiAgX3dpZHRoLFxyXG4gICAgaGVpZ2h0OiBfaGVpZ2h0LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY3NzOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIG5hbWUsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc09iamVjdChuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5O1xyXG4gICAgICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBrZXksIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlkeCkgeyByZXR1cm4gcmV0OyB9IC8vIHJldHVybiBlYXJseVxyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0W3ZhbHVlXSA9IGdldFN0eWxlKGZpcnN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBoaWRlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIHNob3cpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKGlzQm9vbGVhbihzdGF0ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZSA/IHRoaXMuc2hvdygpIDogdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGlzSGlkZGVuKGVsZW0pID8gc2hvdyhlbGVtKSA6IGhpZGUoZWxlbSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIGNhY2hlICAgICA9IHJlcXVpcmUoJ2NhY2hlJykoMiwgdHJ1ZSksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0VsZW1lbnQgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBBQ0NFU1NPUiAgPSAnX19EX2lkX18gJyxcclxuICAgIHVuaXF1ZUlkICA9IHJlcXVpcmUoJ3V0aWwvdW5pcXVlSWQnKS5zZWVkKERhdGUubm93KCkpLFxyXG5cclxuICAgIGdldElkID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBlbGVtID8gZWxlbVtBQ0NFU1NPUl0gOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPclNldElkID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIWVsZW0gfHwgKGlkID0gZWxlbVtBQ0NFU1NPUl0pKSB7IHJldHVybiBpZDsgfVxyXG4gICAgICAgIGVsZW1bQUNDRVNTT1JdID0gKGlkID0gdW5pcXVlSWQoKSk7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBbGxEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkLCBrZXkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICByZXR1cm4gY2FjaGUuaGFzKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0RGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSwgdmFsdWUpIHtcclxuICAgICAgICB2YXIgaWQgPSBnZXRPclNldElkKGVsZW0pO1xyXG4gICAgICAgIHJldHVybiBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBbGxEYXRhID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVEYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCwga2V5KTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlbW92ZTogKGVsZW0sIHN0cikgPT5cclxuICAgICAgICBzdHIgPT09IHVuZGVmaW5lZCA/IHJlbW92ZUFsbERhdGEoZWxlbSkgOiByZW1vdmVEYXRhKGVsZW0sIHN0ciksXHJcblxyXG4gICAgRDoge1xyXG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXREYXRhKGVsZW0sIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RGF0YShlbGVtLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9iamVjdCBwYXNzZWRcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5O1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEFsbERhdGEoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhhc0RhdGE6IChlbGVtKSA9PlxyXG4gICAgICAgICAgICBpc0VsZW1lbnQoZWxlbSkgPyBoYXNEYXRhKGVsZW0pIDogdGhpcyxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlRGF0YShlbGVtLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSBrZXk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3ZlQWxsRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdldCBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNldCB2YWx1ZXMgZnJvbSBoYXNoIG1hcFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBnZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU2V0IGtleSdzIHZhbHVlXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbTtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBnZXRPclNldElkKHRoaXNbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBrZXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1JZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2VsZW1JZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFycklkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoYXJySWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVthcnJJZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc051bWJlciA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgY3NzICAgICAgPSByZXF1aXJlKCcuL2NzcycpO1xyXG5cclxudmFyIGdldElubmVyV2lkdGggPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VGbG9hdChjc3Mud2lkdGguZ2V0KGVsZW0pKSB8fCAwO1xyXG5cclxuICAgICAgICByZXR1cm4gd2lkdGggK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nTGVmdCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nUmlnaHQnKSkgfHwgMCk7XHJcbiAgICB9LFxyXG4gICAgZ2V0SW5uZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nVG9wJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdCb3R0b20nKSkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE91dGVyV2lkdGggPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gZ2V0SW5uZXJXaWR0aChlbGVtKTtcclxuXHJcbiAgICAgICAgaWYgKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgd2lkdGggKz0gKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luTGVmdCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5SaWdodCcpKSB8fCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckxlZnRXaWR0aCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJSaWdodFdpZHRoJykpIHx8IDApO1xyXG4gICAgfSxcclxuICAgIGdldE91dGVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBnZXRJbm5lckhlaWdodChlbGVtKTtcclxuXHJcbiAgICAgICAgaWYgKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICAgICAgaGVpZ2h0ICs9IChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblRvcCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Cb3R0b20nKSkgfHwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaGVpZ2h0ICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyVG9wV2lkdGgnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyQm90dG9tV2lkdGgnKSkgfHwgMCk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHdpZHRoOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3Mud2lkdGguc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBoZWlnaHQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy5oZWlnaHQuc2V0KGZpcnN0LCB2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJXaWR0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lcldpZHRoKGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5uZXJIZWlnaHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJIZWlnaHQoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlcldpZHRoOiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJXaWR0aChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJIZWlnaHQ6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlckhlaWdodChmaXJzdCwgISF3aXRoTWFyZ2luKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGhhbmRsZXJzID0ge307XHJcblxyXG52YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbihuYW1lLCB0eXBlLCBmaWx0ZXIpIHtcclxuICAgIGhhbmRsZXJzW25hbWVdID0ge1xyXG4gICAgICAgIGV2ZW50OiB0eXBlLFxyXG4gICAgICAgIGZpbHRlcjogZmlsdGVyLFxyXG4gICAgICAgIHdyYXA6IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB3cmFwcGVyKG5hbWUsIGZuKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHdyYXBwZXIgPSBmdW5jdGlvbihuYW1lLCBmbikge1xyXG4gICAgaWYgKCFmbikgeyByZXR1cm4gZm47IH1cclxuXHJcbiAgICB2YXIga2V5ID0gJ19fZGNlXycgKyBuYW1lO1xyXG4gICAgaWYgKGZuW2tleV0pIHsgcmV0dXJuIGZuW2tleV07IH1cclxuXHJcbiAgICByZXR1cm4gZm5ba2V5XSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBoYW5kbGVyc1tuYW1lXS5maWx0ZXIoZSk7XHJcbiAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxucmVnaXN0ZXIoJ2xlZnQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMSAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcignbWlkZGxlLWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDIgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ3JpZ2h0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDMgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVnaXN0ZXI6IHJlZ2lzdGVyLFxyXG4gICAgaGFuZGxlcnM6IGhhbmRsZXJzXHJcbn07IiwidmFyIGNyb3NzdmVudCA9IHJlcXVpcmUoJ2Nyb3NzdmVudCcpLFxyXG4gICAgZXhpc3RzICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBtYXRjaGVzICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKSxcclxuICAgIGRlbGVnYXRlcyA9IHt9O1xyXG5cclxuLy8gdGhpcyBtZXRob2QgY2FjaGVzIGRlbGVnYXRlcyBzbyB0aGF0IC5vZmYoKSB3b3JrcyBzZWFtbGVzc2x5XHJcbnZhciBkZWxlZ2F0ZSA9IGZ1bmN0aW9uKHJvb3QsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKGRlbGVnYXRlc1tmbi5fZGRdKSB7IHJldHVybiBkZWxlZ2F0ZXNbZm4uX2RkXTsgfVxyXG5cclxuICAgIHZhciBpZCA9IGZuLl9kZCA9IERhdGUubm93KCk7XHJcbiAgICByZXR1cm4gZGVsZWdhdGVzW2lkXSA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoZWwgJiYgZWwgIT09IHJvb3QpIHtcclxuICAgICAgICAgICAgaWYgKG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBldmVudGVkID0gZnVuY3Rpb24obWV0aG9kLCBlbCwgdHlwZSwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoIWV4aXN0cyhzZWxlY3RvcikpIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGZuKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBkZWxlZ2F0ZShlbCwgc2VsZWN0b3IsIGZuKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuYWRkKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQucmVtb3ZlKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZWQuYmluZChudWxsLCBjcm9zc3ZlbnQuZmFicmljYXRlKVxyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBkZWxlZ2F0ZSAgID0gcmVxdWlyZSgnLi9kZWxlZ2F0ZScpLFxyXG4gICAgY3VzdG9tICAgICA9IHJlcXVpcmUoJy4vY3VzdG9tJyk7XHJcblxyXG52YXIgZXZlbnRlciA9IGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGVzLCBmaWx0ZXIsIGZuKSB7XHJcbiAgICAgICAgdmFyIHR5cGVsaXN0ID0gdHlwZXMuc3BsaXQoJyAnKTtcclxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZm4pKSB7XHJcbiAgICAgICAgICAgIGZuID0gZmlsdGVyO1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBfLmVhY2godHlwZWxpc3QsIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gY3VzdG9tLmhhbmRsZXJzW3R5cGVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgaGFuZGxlci5ldmVudCwgZmlsdGVyLCBoYW5kbGVyLndyYXAoZm4pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIHR5cGUsIGZpbHRlciwgZm4pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vbiksXHJcbiAgICBvZmY6ICAgICBldmVudGVyKGRlbGVnYXRlLm9mZiksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVyKGRlbGVnYXRlLnRyaWdnZXIpXHJcbn07IiwidmFyIF8gICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzSHRtbCAgICAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTm9kZUxpc3QgICAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzTnVtYmVyICAgICAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBvcmRlciAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBkYXRhICAgICAgICAgICA9IHJlcXVpcmUoJy4vZGF0YScpLFxyXG4gICAgcGFyc2VyICAgICAgICAgPSByZXF1aXJlKCdwYXJzZXInKTtcclxuXHJcbnZhciBlbXB0eSA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZWxlbSA9IGFycltpZHhdLFxyXG4gICAgICAgICAgICAgICAgZGVzY2VuZGFudHMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSxcclxuICAgICAgICAgICAgICAgIGkgPSBkZXNjZW5kYW50cy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBkZXNjO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBkZXNjID0gZGVzY2VuZGFudHNbaV07XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShkZXNjKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZSA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLCBwYXJlbnQ7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICBpZiAoZWxlbSAmJiAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5yZW1vdmUoZWxlbSk7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGFjaCA9IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLCBwYXJlbnQ7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICBpZiAoZWxlbSAmJiAocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbS5jbG9uZU5vZGUodHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0cmluZ1RvRnJhZyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGZyYWcudGV4dENvbnRlbnQgPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIGZyYWc7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZFByZXBlbmRGdW5jID0gZnVuY3Rpb24oZCwgZm4sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChkLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTCk7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcocmVzdWx0KSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcGFyc2VyKGVsZW0pLCBwZW5kZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHBlbmRlcihlbGVtLCBzdHJpbmdUb0ZyYWcocmVzdWx0KSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzRWxlbWVudChyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzTm9kZUxpc3QocmVzdWx0KSB8fCBpc0QocmVzdWx0KSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCByZXN1bHQsIHBlbmRlcik7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkgPSBmdW5jdGlvbihhcnJPbmUsIGFyclR3bywgcGVuZGVyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyck9uZS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIGkgPSAwLCBsZW4gPSBhcnJUd28ubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoYXJyT25lW2lkeF0sIGFyclR3b1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5ID0gZnVuY3Rpb24oYXJyLCBlbGVtLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihhcnJFbGVtLCBlbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0gPSBmdW5jdGlvbihlbGVtLCBhcnIsIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGVsZW0sIGFyckVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgIH0sXHJcbiAgICBwcmVwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuaW5zZXJ0QmVmb3JlKGVsZW0sIGJhc2UuZmlyc3RDaGlsZCk7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhcHBlbmQgIDogYXBwZW5kLFxyXG4gICAgcHJlcGVuZCA6IHByZXBlbmQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmZhc3RtYXAodGhpcy5zbGljZSgpLCAoZWxlbSkgPT4gY2xvbmUoZWxlbSkpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFwcGVuZDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBwYXJzZXIodmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcodmFsdWUpLCBhcHBlbmQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnKCcnICsgdmFsdWUpLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGJlZm9yZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gRChlbGVtZW50KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgIHRhcmdldCA9IEQodGFyZ2V0KVswXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRhcmdldCwgdGhpcy5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWZ0ZXI6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gdGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpIHx8IGlzU3RyaW5nKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gRChlbGVtZW50KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRChlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0Lm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpbnNlcnRBZnRlcjogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcywgdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhcHBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBpZiAoaXNEKGQpKSB7XHJcbiAgICAgICAgICAgICAgICBkLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICAgICAgRChvYmopLmFwcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJlcGVuZDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBwYXJzZXIodmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnKHZhbHVlKSwgcHJlcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZygnJyArIHZhbHVlKSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgZWxlbSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgYXJyLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmVwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgaWYgKGlzRChkKSkge1xyXG4gICAgICAgICAgICAgICAgZC5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHZhciBvYmogPSBkO1xyXG4gICAgICAgICAgICBEKG9iaikucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZW1wdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBlbXB0eSh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAvLyBTdHJpbmcgc2VsZWN0b3JcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBEKHNlbGVjdG9yKS5nZXQoKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtcyA9IHVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICBbXS5jb25jYXQodGhpcy5nZXQoKSwgXy50b0FycmF5KGFycikpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNpbmdsZSBlbGVtZW50XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikgfHwgaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtcyA9IHVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICBbXS5jb25jYXQodGhpcy5nZXQoKSwgWyBlbGVtIF0pXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiBEKHRoaXMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvckZpbHRlcih0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICByZW1vdmUoYXJyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZW1vdmUodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRldGFjaDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvckZpbHRlcih0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICBkZXRhY2goYXJyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICBkZXRhY2godGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzT2JqZWN0ICAgPSByZXF1aXJlKCdpcy9vYmplY3QnKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdub2RlL2lzTmFtZScpLFxyXG4gICAgRE9DX0VMRU0gICA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuXHJcbnZhciBnZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiBlbGVtLm9mZnNldFRvcCB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IGVsZW0ub2Zmc2V0TGVmdCB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGdldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIHZhciByZWN0ID0gaXNBdHRhY2hlZChlbGVtKSA/IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7fTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogIChyZWN0LnRvcCAgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCkgIHx8IDAsXHJcbiAgICAgICAgbGVmdDogKHJlY3QubGVmdCArIGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdCkgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtLCBpZHgsIHBvcykge1xyXG4gICAgdmFyIHBvc2l0aW9uID0gZWxlbS5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJyxcclxuICAgICAgICBwcm9wcyAgICA9IHt9O1xyXG5cclxuICAgIC8vIHNldCBwb3NpdGlvbiBmaXJzdCwgaW4tY2FzZSB0b3AvbGVmdCBhcmUgc2V0IGV2ZW4gb24gc3RhdGljIGVsZW1cclxuICAgIGlmIChwb3NpdGlvbiA9PT0gJ3N0YXRpYycpIHsgZWxlbS5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7IH1cclxuXHJcbiAgICB2YXIgY3VyT2Zmc2V0ICAgICAgICAgPSBnZXRPZmZzZXQoZWxlbSksXHJcbiAgICAgICAgY3VyQ1NTVG9wICAgICAgICAgPSBlbGVtLnN0eWxlLnRvcCxcclxuICAgICAgICBjdXJDU1NMZWZ0ICAgICAgICA9IGVsZW0uc3R5bGUubGVmdCxcclxuICAgICAgICBjYWxjdWxhdGVQb3NpdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2Fic29sdXRlJyB8fCBwb3NpdGlvbiA9PT0gJ2ZpeGVkJykgJiYgKGN1ckNTU1RvcCA9PT0gJ2F1dG8nIHx8IGN1ckNTU0xlZnQgPT09ICdhdXRvJyk7XHJcblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocG9zKSkge1xyXG4gICAgICAgIHBvcyA9IHBvcy5jYWxsKGVsZW0sIGlkeCwgY3VyT2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY3VyVG9wLCBjdXJMZWZ0O1xyXG4gICAgLy8gbmVlZCB0byBiZSBhYmxlIHRvIGNhbGN1bGF0ZSBwb3NpdGlvbiBpZiBlaXRoZXIgdG9wIG9yIGxlZnQgaXMgYXV0byBhbmQgcG9zaXRpb24gaXMgZWl0aGVyIGFic29sdXRlIG9yIGZpeGVkXHJcbiAgICBpZiAoY2FsY3VsYXRlUG9zaXRpb24pIHtcclxuICAgICAgICB2YXIgY3VyUG9zaXRpb24gPSBnZXRQb3NpdGlvbihlbGVtKTtcclxuICAgICAgICBjdXJUb3AgID0gY3VyUG9zaXRpb24udG9wO1xyXG4gICAgICAgIGN1ckxlZnQgPSBjdXJQb3NpdGlvbi5sZWZ0O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjdXJUb3AgID0gcGFyc2VGbG9hdChjdXJDU1NUb3ApICB8fCAwO1xyXG4gICAgICAgIGN1ckxlZnQgPSBwYXJzZUZsb2F0KGN1ckNTU0xlZnQpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV4aXN0cyhwb3MudG9wKSkgIHsgcHJvcHMudG9wICA9IChwb3MudG9wICAtIGN1ck9mZnNldC50b3ApICArIGN1clRvcDsgIH1cclxuICAgIGlmIChleGlzdHMocG9zLmxlZnQpKSB7IHByb3BzLmxlZnQgPSAocG9zLmxlZnQgLSBjdXJPZmZzZXQubGVmdCkgKyBjdXJMZWZ0OyB9XHJcblxyXG4gICAgZWxlbS5zdHlsZS50b3AgID0gXy50b1B4KHByb3BzLnRvcCk7XHJcbiAgICBlbGVtLnN0eWxlLmxlZnQgPSBfLnRvUHgocHJvcHMubGVmdCk7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgcG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldFBvc2l0aW9uKGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgb2Zmc2V0OiBmdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB7XHJcbiAgICBcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldChmaXJzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihwb3NPckl0ZXJhdG9yKSB8fCBpc09iamVjdChwb3NPckl0ZXJhdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+IHNldE9mZnNldChlbGVtLCBpZHgsIHBvc09ySXRlcmF0b3IpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldFBhcmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8ubWFwKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBlbGVtLm9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghaXNOb2RlTmFtZShvZmZzZXRQYXJlbnQsICdodG1sJykgJiYgKG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiB8fCAnc3RhdGljJykgPT09ICdzdGF0aWMnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBET0NfRUxFTTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgc3BsaXQgICAgICA9IHJlcXVpcmUoJ3V0aWwvc3BsaXQnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgVEVYVCAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9URVhUJyksXHJcbiAgICBDT01NRU5UICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0NPTU1FTlQnKSxcclxuICAgIEFUVFJJQlVURSAgPSByZXF1aXJlKCdOT0RFX1RZUEUvQVRUUklCVVRFJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBwcm9wRml4ID0gc3BsaXQoJ3RhYkluZGV4fHJlYWRPbmx5fGNsYXNzTmFtZXxtYXhMZW5ndGh8Y2VsbFNwYWNpbmd8Y2VsbFBhZGRpbmd8cm93U3Bhbnxjb2xTcGFufHVzZU1hcHxmcmFtZUJvcmRlcnxjb250ZW50RWRpdGFibGUnKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIHN0cikge1xyXG4gICAgICAgIG9ialtzdHIudG9Mb3dlckNhc2UoKV0gPSBzdHI7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHtcclxuICAgICAgICAnZm9yJzogICAnaHRtbEZvcicsXHJcbiAgICAgICAgJ2NsYXNzJzogJ2NsYXNzTmFtZSdcclxuICAgIH0pO1xyXG5cclxudmFyIHByb3BIb29rcyA9IHtcclxuICAgIHNyYzogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhyZWY6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnaHJlZicsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gU3VwcG9ydDogU2FmYXJpLCBJRTkrXHJcbiAgICAvLyBtaXMtcmVwb3J0cyB0aGUgZGVmYXVsdCBzZWxlY3RlZCBwcm9wZXJ0eSBvZiBhbiBvcHRpb25cclxuICAgIC8vIEFjY2Vzc2luZyB0aGUgcGFyZW50J3Mgc2VsZWN0ZWRJbmRleCBwcm9wZXJ0eSBmaXhlcyBpdFxyXG4gICAgc2VsZWN0ZWQ6IFNVUFBPUlRTLm9wdFNlbGVjdGVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUsXHJcbiAgICAgICAgICAgICAgICBmaXg7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQuc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBhbHNvIHdvcmtzIHdpdGggb3B0Z3JvdXBzLCBzZWUgIzU3MDFcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5wYXJlbnROb2RlLnNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0YWJJbmRleDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBlbGVtLnRhYkluZGV4IGRvZXNuJ3QgYWx3YXlzIHJldHVybiB0aGUgY29ycmVjdCB2YWx1ZSB3aGVuIGl0IGhhc24ndCBiZWVuIGV4cGxpY2l0bHkgc2V0XHJcbiAgICAgICAgICAgIC8vIGh0dHA6Ly9mbHVpZHByb2plY3Qub3JnL2Jsb2cvMjAwOC8wMS8wOS9nZXR0aW5nLXNldHRpbmctYW5kLXJlbW92aW5nLXRhYmluZGV4LXZhbHVlcy13aXRoLWphdmFzY3JpcHQvXHJcbiAgICAgICAgICAgIC8vIFVzZSBwcm9wZXIgYXR0cmlidXRlIHJldHJpZXZhbCgjMTIwNzIpXHJcbiAgICAgICAgICAgIHZhciB0YWJpbmRleCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd0YWJpbmRleCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhYmluZGV4KSB7IHJldHVybiBfLnBhcnNlSW50KHRhYmluZGV4KTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGVOYW1lID0gZWxlbS5ub2RlTmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChSRUdFWC5pc0ZvY3VzYWJsZShub2RlTmFtZSkgfHwgKFJFR0VYLmlzQ2xpY2thYmxlKG5vZGVOYW1lKSAmJiBlbGVtLmhyZWYpKSA/IDAgOiAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgZ2V0T3JTZXRQcm9wID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIHZhciBub2RlVHlwZSA9IGVsZW0ubm9kZVR5cGU7XHJcblxyXG4gICAgLy8gZG9uJ3QgZ2V0L3NldCBwcm9wZXJ0aWVzIG9uIHRleHQsIGNvbW1lbnQgYW5kIGF0dHJpYnV0ZSBub2Rlc1xyXG4gICAgaWYgKCFlbGVtIHx8IG5vZGVUeXBlID09PSBURVhUIHx8IG5vZGVUeXBlID09PSBDT01NRU5UIHx8IG5vZGVUeXBlID09PSBBVFRSSUJVVEUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRml4IG5hbWUgYW5kIGF0dGFjaCBob29rc1xyXG4gICAgbmFtZSA9IHByb3BGaXhbbmFtZV0gfHwgbmFtZTtcclxuICAgIHZhciBob29rcyA9IHByb3BIb29rc1tuYW1lXTtcclxuXHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gaG9va3MgJiYgKCdzZXQnIGluIGhvb2tzKSAmJiAocmVzdWx0ID0gaG9va3Muc2V0KGVsZW0sIHZhbHVlLCBuYW1lKSkgIT09IHVuZGVmaW5lZCA/XHJcbiAgICAgICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgICAgIChlbGVtW25hbWVdID0gdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBob29rcyAmJiAoJ2dldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5nZXQoZWxlbSwgbmFtZSkpICE9PSBudWxsID9cclxuICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgIGVsZW1bbmFtZV07XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgcHJvcDogZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiBpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldE9yU2V0UHJvcChmaXJzdCwgcHJvcCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwoZWxlbSwgaWR4LCBnZXRPclNldFByb3AoZWxlbSwgcHJvcCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGdldE9yU2V0UHJvcChlbGVtLCBwcm9wLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlUHJvcDogZnVuY3Rpb24ocHJvcCkge1xyXG4gICAgICAgIGlmICghaXNTdHJpbmcocHJvcCkpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIG5hbWUgPSBwcm9wRml4W3Byb3BdIHx8IHByb3A7XHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBlbGVtW25hbWVdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGV4aXN0cyAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyk7XHJcblxyXG52YXIgY29lcmNlTnVtID0gKHZhbHVlKSA9PlxyXG4gICAgLy8gSXRzIGEgbnVtYmVyISB8fCAwIHRvIGF2b2lkIE5hTiAoYXMgTmFOJ3MgYSBudW1iZXIpXHJcbiAgICArdmFsdWUgPT09IHZhbHVlID8gKHZhbHVlIHx8IDApIDpcclxuICAgIC8vIEF2b2lkIE5hTiBhZ2FpblxyXG4gICAgaXNTdHJpbmcodmFsdWUpID8gKCt2YWx1ZSB8fCAwKSA6XHJcbiAgICAvLyBEZWZhdWx0IHRvIHplcm9cclxuICAgIDA7XHJcblxyXG52YXIgcHJvdGVjdCA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbCwgY2FsbGJhY2spIHtcclxuICAgIHZhciBlbGVtID0gY29udGV4dFswXTtcclxuICAgIGlmICghZWxlbSAmJiAhZXhpc3RzKHZhbCkpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIGlmICghZWxlbSkgeyByZXR1cm4gY29udGV4dDsgfVxyXG5cclxuICAgIHJldHVybiBjYWxsYmFjayhjb250ZXh0LCBlbGVtLCB2YWwpO1xyXG59O1xyXG5cclxudmFyIGhhbmRsZXIgPSBmdW5jdGlvbihhdHRyaWJ1dGUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCBlbGVtLCB2YWwpIHtcclxuICAgICAgICBpZiAoZXhpc3RzKHZhbCkpIHtcclxuICAgICAgICAgICAgZWxlbVthdHRyaWJ1dGVdID0gY29lcmNlTnVtKHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW1bYXR0cmlidXRlXTtcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgc2Nyb2xsVG9wID0gaGFuZGxlcignc2Nyb2xsVG9wJyk7XHJcbnZhciBzY3JvbGxMZWZ0ID0gaGFuZGxlcignc2Nyb2xsTGVmdCcpO1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHNjcm9sbExlZnQ6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBwcm90ZWN0KHRoaXMsIHZhbCwgc2Nyb2xsTGVmdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNjcm9sbFRvcDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxUb3ApO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgRml6emxlICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgcXVhbGlmaWVyKSB7XHJcbiAgICAvLyBFYXJseSByZXR1cm4sIG5vIHF1YWxpZmllci4gRXZlcnl0aGluZyBtYXRjaGVzXHJcbiAgICBpZiAoIXF1YWxpZmllcikgeyByZXR1cm4gYXJyOyB9XHJcblxyXG4gICAgLy8gRnVuY3Rpb25cclxuICAgIGlmIChpc0Z1bmN0aW9uKHF1YWxpZmllcikpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEVsZW1lbnRcclxuICAgIGlmIChxdWFsaWZpZXIubm9kZVR5cGUpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gZWxlbSA9PT0gcXVhbGlmaWVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTZWxlY3RvclxyXG4gICAgaWYgKGlzU3RyaW5nKHF1YWxpZmllcikpIHtcclxuICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMocXVhbGlmaWVyKTtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gaXMubWF0Y2goZWxlbSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IHF1YWxpZmllclxyXG4gICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IF8uY29udGFpbnMocXVhbGlmaWVyLCBlbGVtKSk7XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBpc1NlbGVjdG9yICAgPSByZXF1aXJlKCdpcy9zZWxlY3RvcicpLFxyXG4gICAgaXNDb2xsZWN0aW9uID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNGdW5jdGlvbiAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzTm9kZUxpc3QgICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0FycmF5ICAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0QgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBvcmRlciAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgRml6emxlICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG4vKipcclxuICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb258RWxlbWVudHxOb2RlTGlzdHxBcnJheXxEfSBzZWxlY3RvclxyXG4gKiBAcGFyYW0ge0R9IGNvbnRleHRcclxuICogQHJldHVybnMge0VsZW1lbnRbXX1cclxuICogQHByaXZhdGVcclxuICovXHJcbnZhciBmaW5kV2l0aGluID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgIC8vIEZhaWwgZmFzdFxyXG4gICAgaWYgKCFjb250ZXh0Lmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICB2YXIgcXVlcnksIGRlc2NlbmRhbnRzLCByZXN1bHRzO1xyXG5cclxuICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpIHx8IGlzTm9kZUxpc3Qoc2VsZWN0b3IpIHx8IGlzQXJyYXkoc2VsZWN0b3IpIHx8IGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBDb252ZXJ0IHNlbGVjdG9yIHRvIGFuIGFycmF5IG9mIGVsZW1lbnRzXHJcbiAgICAgICAgc2VsZWN0b3IgPSBpc0VsZW1lbnQoc2VsZWN0b3IpID8gWyBzZWxlY3RvciBdIDogc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIGRlc2NlbmRhbnRzID0gXy5mbGF0dGVuKF8ubWFwKGNvbnRleHQsIChlbGVtKSA9PiBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJyonKSkpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBfLmZpbHRlcihkZXNjZW5kYW50cywgKGRlc2NlbmRhbnQpID0+IF8uY29udGFpbnMoc2VsZWN0b3IsIGRlc2NlbmRhbnQpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVlcnkgPSBGaXp6bGUucXVlcnkoc2VsZWN0b3IpO1xyXG4gICAgICAgIHJlc3VsdHMgPSBxdWVyeS5leGVjKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGhhczogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHRhcmdldCkpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHRhcmdldHMgPSB0aGlzLmZpbmQodGFyZ2V0KSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSB0YXJnZXRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmRlci5jb250YWlucyhlbGVtLCB0YXJnZXRzW2lkeF0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5hbnkodGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtLCBpZHgpID0+ICEhaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBpcy5ub3QodGhpcylcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBfLnRvQXJyYXkoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiAhXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+ICFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtICE9PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZmluZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3Ioc2VsZWN0b3IpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciByZXN1bHQgPSBmaW5kV2l0aGluKHNlbGVjdG9yLCB0aGlzKTtcclxuICAgICAgICBpZiAodGhpcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIG9yZGVyLnNvcnQocmVzdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8ubWVyZ2UoRCgpLCByZXN1bHQpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gRCgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gXy5jb250YWlucyhhcnIsIGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSA9PT0gY29udGV4dClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNoZWNrZXIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiBjaGVja2VyLmNhbGwoZWxlbSwgZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIEQoKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBFTEVNRU5UICAgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBET0NVTUVOVCAgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVCcpLFxyXG4gICAgRE9DVU1FTlRfRlJBR01FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlRfRlJBR01FTlQnKSxcclxuICAgIGlzU3RyaW5nICAgICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0F0dGFjaGVkICAgICAgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgICAgICAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc0QgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIHNlbGVjdG9yRmlsdGVyICAgID0gcmVxdWlyZSgnLi9zZWxlY3RvcnMvZmlsdGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIGdldFNpYmxpbmdzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNpYnMgPSBfZ2V0Tm9kZVNpYmxpbmdzKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJzLmxlbmd0aCkgeyByZXN1bHQucHVzaChzaWJzKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9nZXROb2RlU2libGluZ3MgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNpYnMgPSBfLnRvQXJyYXkocGFyZW50LmNoaWxkcmVuKSxcclxuICAgICAgICAgICAgaWR4ICA9IHNpYnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgLy8gRXhjbHVkZSB0aGUgbm9kZSBpdHNlbGYgZnJvbSB0aGUgbGlzdCBvZiBpdHMgcGFyZW50J3MgY2hpbGRyZW5cclxuICAgICAgICAgICAgaWYgKHNpYnNbaWR4XSA9PT0gbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgc2licy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNpYnM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENoaWxkcmVuIC0tLS0tLVxyXG4gICAgZ2V0Q2hpbGRyZW4gPSAoYXJyKSA9PiBfLmZsYXR0ZW4oXy5tYXAoYXJyLCBfY2hpbGRyZW4pKSxcclxuICAgIF9jaGlsZHJlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIga2lkcyA9IGVsZW0uY2hpbGRyZW4sXHJcbiAgICAgICAgICAgIGlkeCAgPSAwLCBsZW4gID0ga2lkcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGFyciAgPSBuZXcgQXJyYXkobGVuKTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGtpZHNbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50cyAtLS0tLS1cclxuICAgIGdldENsb3Nlc3QgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICBjbG9zZXN0LFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGVsZW1zW2lkeF0sIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBwYXJlbnRzLnVuc2hpZnQoZWxlbXNbaWR4XSk7XHJcbiAgICAgICAgICAgIGNsb3Nlc3QgPSBzZWxlY3RvckZpbHRlcihwYXJlbnRzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChjbG9zZXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2xvc2VzdFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRzID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRzVW50aWwgPSBmdW5jdGlvbihkLCBzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZFtpZHhdLCBudWxsLCBzdG9wU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfY3Jhd2xVcE5vZGUgPSBmdW5jdGlvbihub2RlLCBjb250ZXh0LCBzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IG5vZGUsXHJcbiAgICAgICAgICAgIG5vZGVUeXBlO1xyXG5cclxuICAgICAgICB3aGlsZSAoKHBhcmVudCAgID0gZ2V0Tm9kZVBhcmVudChwYXJlbnQpKSAmJlxyXG4gICAgICAgICAgICAgICAobm9kZVR5cGUgPSBwYXJlbnQubm9kZVR5cGUpICE9PSBET0NVTUVOVCAmJlxyXG4gICAgICAgICAgICAgICAoIWNvbnRleHQgICAgICB8fCBwYXJlbnQgIT09IGNvbnRleHQpICYmXHJcbiAgICAgICAgICAgICAgICghc3RvcFNlbGVjdG9yIHx8ICFGaXp6bGUuaXMoc3RvcFNlbGVjdG9yKS5tYXRjaChwYXJlbnQpKSkge1xyXG4gICAgICAgICAgICBpZiAobm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudCAtLS0tLS1cclxuICAgIGdldFBhcmVudCA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSBnZXROb2RlUGFyZW50KGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHsgcmVzdWx0LnB1c2gocGFyZW50KTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTYWZlbHkgZ2V0IHBhcmVudCBub2RlXHJcbiAgICBnZXROb2RlUGFyZW50ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUucGFyZW50Tm9kZTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UHJldiA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcHJldiA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChwcmV2ID0gcHJldi5wcmV2aW91c1NpYmxpbmcpICYmIHByZXYubm9kZVR5cGUgIT09IEVMRU1FTlQpIHt9XHJcbiAgICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5leHQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIG5leHQgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgobmV4dCA9IG5leHQubmV4dFNpYmxpbmcpICYmIG5leHQubm9kZVR5cGUgIT09IEVMRU1FTlQpIHt9XHJcbiAgICAgICAgcmV0dXJuIG5leHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFByZXZBbGwgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwcmV2ICAgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSkge1xyXG4gICAgICAgICAgICBpZiAocHJldi5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocHJldik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TmV4dEFsbCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIG5leHQgICA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKG5leHQubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5leHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5nO1xyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2libGluZyAmJiAoIXNlbGVjdG9yIHx8IEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZykpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbEFsbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBmaWx0ZXI7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBmaWx0ZXIgPSBmdW5jdGlvbihzaWJsaW5nKSB7IHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpOyB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgc2libGluZ3MgPSBfLmZpbHRlcihzaWJsaW5ncywgZmlsdGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxVbnRpbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmdzLFxyXG4gICAgICAgICAgICBpdGVyYXRvcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gZnVuY3Rpb24oc2libGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTWF0Y2ggPSBpcy5tYXRjaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNNYXRjaDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBfLmVhY2goc2libGluZ3MsIGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHJldmVyc2UpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdW5pcXVlKGVsZW1zKTtcclxuICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJldmVyc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEQocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlsdGVyQW5kU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgcmV2ZXJzZSkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KHNlbGVjdG9yRmlsdGVyKGVsZW1zLCBzZWxlY3RvciksIHJldmVyc2UpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBjb250ZW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgIF8uZmxhdHRlbihcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IHBsdWNrXHJcbiAgICAgICAgICAgICAgICBfLm1hcCh0aGlzLCAoZWxlbSkgPT4gZWxlbS5jaGlsZE5vZGVzKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICByZXR1cm4gRChzZWxlY3RvcikuaW5kZXhPZihmaXJzdCk7ICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpIHx8IGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3JbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICBpZiAoIXRoaXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCAgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBmaXJzdC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpc0F0dGFjaGVkIGNoZWNrIHRvIHBhc3MgdGVzdCBcIk5vZGUgd2l0aG91dCBwYXJlbnQgcmV0dXJucyAtMVwiXHJcbiAgICAgICAgLy8gbm9kZVR5cGUgY2hlY2sgdG8gcGFzcyBcIklmIEQjaW5kZXggY2FsbGVkIG9uIGVsZW1lbnQgd2hvc2UgcGFyZW50IGlzIGZyYWdtZW50LCBpdCBzdGlsbCBzaG91bGQgd29yayBjb3JyZWN0bHlcIlxyXG4gICAgICAgIHZhciBhdHRhY2hlZCAgICAgICAgID0gaXNBdHRhY2hlZChmaXJzdCksXHJcbiAgICAgICAgICAgIGlzUGFyZW50RnJhZ21lbnQgPSBwYXJlbnQubm9kZVR5cGUgPT09IERPQ1VNRU5UX0ZSQUdNRU5UO1xyXG5cclxuICAgICAgICBpZiAoIWF0dGFjaGVkICYmICFpc1BhcmVudEZyYWdtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjaGlsZEVsZW1zID0gcGFyZW50LmNoaWxkcmVuIHx8IF8uZmlsdGVyKHBhcmVudC5jaGlsZE5vZGVzLCAobm9kZSkgPT4gbm9kZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCk7XHJcblxyXG4gICAgICAgIHJldHVybiBbXS5pbmRleE9mLmFwcGx5KGNoaWxkRWxlbXMsIFsgZmlyc3QgXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb3Nlc3Q6IGZ1bmN0aW9uKHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0Q2xvc2VzdCh0aGlzLCBzZWxlY3RvciwgY29udGV4dCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0UGFyZW50KHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0UGFyZW50cyh0aGlzKSwgc2VsZWN0b3IsIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnRzVW50aWw6IGZ1bmN0aW9uKHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBhcmVudHNVbnRpbCh0aGlzLCBzdG9wU2VsZWN0b3IpLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2libGluZ3M6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0U2libGluZ3ModGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hpbGRyZW46IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckFuZFNvcnQoZ2V0Q2hpbGRyZW4odGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldFByZXYsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbChnZXROZXh0LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dEFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsQWxsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZVbnRpbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsVW50aWwoZ2V0UHJldkFsbCwgdGhpcywgc2VsZWN0b3IpLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dFVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIG5ld2xpbmVzICAgPSByZXF1aXJlKCdzdHJpbmcvbmV3bGluZXMnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXJyYXkgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNOdW1iZXIgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIG5vcm1hbE5hbWUgPSByZXF1aXJlKCdub2RlL25vcm1hbGl6ZU5hbWUnKSxcclxuICAgIFNVUFBPUlRTICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG4gICAgRUxFTUVOVCAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyk7XHJcblxyXG52YXIgb3V0ZXJIdG1sID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID8gdGhpc1swXS5vdXRlckhUTUwgOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0R2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtKSA9PiBlbGVtLnRleHRDb250ZW50IDpcclxuICAgICAgICAgICAgKGVsZW0pID0+IGVsZW0uaW5uZXJUZXh0LFxyXG5cclxuICAgIHRleHRTZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS50ZXh0Q29udGVudCA9IHN0ciA6XHJcbiAgICAgICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0uaW5uZXJUZXh0ID0gc3RyO1xyXG5cclxudmFyIHZhbEhvb2tzID0ge1xyXG4gICAgb3B0aW9uOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgcmV0dXJuIChleGlzdHModmFsKSA/IHZhbCA6IHRleHRHZXQoZWxlbSkpLnRyaW0oKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNlbGVjdDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBpbmRleCAgID0gZWxlbS5zZWxlY3RlZEluZGV4LFxyXG4gICAgICAgICAgICAgICAgb25lICAgICA9IGVsZW0udHlwZSA9PT0gJ3NlbGVjdC1vbmUnIHx8IGluZGV4IDwgMCxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBvbmUgPyBudWxsIDogW10sXHJcbiAgICAgICAgICAgICAgICBtYXggICAgID0gb25lID8gaW5kZXggKyAxIDogb3B0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gaW5kZXggPCAwID8gbWF4IDogKG9uZSA/IGluZGV4IDogMCk7XHJcblxyXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHRoZSBzZWxlY3RlZCBvcHRpb25zXHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBtYXg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2xkSUUgZG9lc24ndCB1cGRhdGUgc2VsZWN0ZWQgYWZ0ZXIgZm9ybSByZXNldCAoIzI1NTEpXHJcbiAgICAgICAgICAgICAgICBpZiAoKG9wdGlvbi5zZWxlY3RlZCB8fCBpZHggPT09IGluZGV4KSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCByZXR1cm4gb3B0aW9ucyB0aGF0IGFyZSBkaXNhYmxlZCBvciBpbiBhIGRpc2FibGVkIG9wdGdyb3VwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChTVVBQT1JUUy5vcHREaXNhYmxlZCA/ICFvcHRpb24uZGlzYWJsZWQgOiBvcHRpb24uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpID09PSBudWxsKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoIW9wdGlvbi5wYXJlbnROb2RlLmRpc2FibGVkIHx8ICFpc05vZGVOYW1lKG9wdGlvbi5wYXJlbnROb2RlLCAnb3B0Z3JvdXAnKSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBzcGVjaWZpYyB2YWx1ZSBmb3IgdGhlIG9wdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsSG9va3Mub3B0aW9uLmdldChvcHRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCBuZWVkIGFuIGFycmF5IGZvciBvbmUgc2VsZWN0c1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTXVsdGktU2VsZWN0cyByZXR1cm4gYW4gYXJyYXlcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb3B0aW9uU2V0LCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IF8ubWFrZUFycmF5KHZhbHVlKSxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBvcHRpb25zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKHZhbHVlcywgdmFsSG9va3Mub3B0aW9uLmdldChvcHRpb24pKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IG9wdGlvblNldCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBGb3JjZSBicm93c2VycyB0byBiZWhhdmUgY29uc2lzdGVudGx5IHdoZW4gbm9uLW1hdGNoaW5nIHZhbHVlIGlzIHNldFxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvblNldCkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZWxlY3RlZEluZGV4ID0gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59O1xyXG5cclxuLy8gUmFkaW8gYW5kIGNoZWNrYm94IGdldHRlciBmb3IgV2Via2l0XHJcbmlmICghU1VQUE9SVFMuY2hlY2tPbikge1xyXG4gICAgXy5lYWNoKFsncmFkaW8nLCAnY2hlY2tib3gnXSwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIHZhbEhvb2tzW3R5cGVdID0ge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQ6IFdlYmtpdCAtICcnIGlzIHJldHVybmVkIGluc3RlYWQgb2YgJ29uJyBpZiBhIHZhbHVlIGlzbid0IHNwZWNpZmllZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpID09PSBudWxsID8gJ29uJyA6IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBnZXRWYWwgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICBpZiAoIWVsZW0gfHwgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpKSB7IHJldHVybjsgfVxyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suZ2V0KSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2suZ2V0KGVsZW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB2YWwgPSBlbGVtLnZhbHVlO1xyXG4gICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGlzU3RyaW5nKHZhbCkgPyBuZXdsaW5lcyh2YWwpIDogdmFsO1xyXG59O1xyXG5cclxudmFyIHN0cmluZ2lmeSA9ICh2YWx1ZSkgPT5cclxuICAgICFleGlzdHModmFsdWUpID8gJycgOiAodmFsdWUgKyAnJyk7XHJcblxyXG52YXIgc2V0VmFsID0gZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICBpZiAoZWxlbS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAvLyBTdHJpbmdpZnkgdmFsdWVzXHJcbiAgICB2YXIgdmFsdWUgPSBpc0FycmF5KHZhbCkgPyBfLm1hcCh2YWwsIHN0cmluZ2lmeSkgOiBzdHJpbmdpZnkodmFsKTtcclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLnNldCkge1xyXG4gICAgICAgIGhvb2suc2V0KGVsZW0sIHZhbHVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIG91dGVySHRtbDogb3V0ZXJIdG1sLFxyXG4gICAgb3V0ZXJIVE1MOiBvdXRlckh0bWwsXHJcblxyXG4gICAgaHRtbDogZnVuY3Rpb24oaHRtbCkge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhodG1sKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBlbGVtLmlubmVySFRNTCA9IGh0bWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oaHRtbCkpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gaHRtbDtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZWxlbS5pbm5lckhUTUwpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIHJldHVybiAoIWZpcnN0KSA/IHVuZGVmaW5lZCA6IGZpcnN0LmlubmVySFRNTDtcclxuICAgIH0sXHJcblxyXG4gICAgdmFsOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIC8vIGdldHRlclxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0VmFsKHRoaXNbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFleGlzdHModmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCAnJykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGdldFZhbChlbGVtKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2V0VmFsKGVsZW0sIHZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzZXR0ZXJzXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSB8fCBpc051bWJlcih2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGV4dDogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHN0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gdGV4dFNldChlbGVtLCBzdHIpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHN0cikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc3RyO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICB0ZXh0U2V0KGVsZW0sIGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCB0ZXh0R2V0KGVsZW0pKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLCAoZWxlbSkgPT4gdGV4dEdldChlbGVtKSkuam9pbignJyk7XHJcbiAgICB9XHJcbn07IiwidmFyIEVMRU1FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZWxlbSkgPT5cclxuICAgICAgICBlbGVtICYmIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIG5hbWUpID0+XHJcbiAgICBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKTsiLCIvLyBjYWNoZSBpcyBqdXN0IG5vdCB3b3J0aCBpdCBoZXJlXHJcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3NpbXBsZS1jYWNoZS1mb3Itc3RyaW5nLW1hbmlwXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0pID0+IGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcclxuIiwidmFyIHJlYWR5ID0gZmFsc2UsXHJcbiAgICByZWdpc3RyYXRpb24gPSBbXTtcclxuXHJcbnZhciB3YWl0ID0gZnVuY3Rpb24oZm4pIHtcclxuICAgIC8vIEFscmVhZHkgbG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xyXG4gICAgICAgIHJldHVybiBmbigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0YW5kYXJkcy1iYXNlZCBicm93c2VycyBzdXBwb3J0IERPTUNvbnRlbnRMb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgSUUgZXZlbnQgbW9kZWwgaXMgdXNlZFxyXG5cclxuICAgIC8vIEVuc3VyZSBmaXJpbmcgYmVmb3JlIG9ubG9hZCwgbWF5YmUgbGF0ZSBidXQgc2FmZSBhbHNvIGZvciBpZnJhbWVzXHJcbiAgICBkb2N1bWVudC5hdHRhY2hFdmVudCgnb25yZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdpbnRlcmFjdGl2ZScpIHsgZm4oKTsgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQSBmYWxsYmFjayB0byB3aW5kb3cub25sb2FkLCB0aGF0IHdpbGwgYWx3YXlzIHdvcmtcclxuICAgIHdpbmRvdy5hdHRhY2hFdmVudCgnb25sb2FkJywgZm4pO1xyXG59O1xyXG5cclxud2FpdChmdW5jdGlvbigpIHtcclxuICAgIHJlYWR5ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBjYWxsIHJlZ2lzdGVyZWQgbWV0aG9kcyAgICBcclxuICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgIGxlbmd0aCA9IHJlZ2lzdHJhdGlvbi5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHJlZ2lzdHJhdGlvbltpZHhdKCk7XHJcbiAgICB9XHJcbiAgICByZWdpc3RyYXRpb24ubGVuZ3RoID0gMDtcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICBpZiAocmVhZHkpIHtcclxuICAgICAgICBjYWxsYmFjaygpOyByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmVnaXN0cmF0aW9uLnB1c2goY2FsbGJhY2spO1xyXG59O1xyXG4iLCJ2YXIgaXNBdHRhY2hlZCAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIEVMRU1FTlQgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICAvLyBodHRwOi8vZWpvaG4ub3JnL2Jsb2cvY29tcGFyaW5nLWRvY3VtZW50LXBvc2l0aW9uL1xyXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL05vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgIENPTlRBSU5FRF9CWSA9IDE2LFxyXG4gICAgRk9MTE9XSU5HICAgID0gNCxcclxuICAgIERJU0NPTk5FQ1RFRCA9IDE7XHJcblxyXG52YXIgaXMgPSAocmVsLCBmbGFnKSA9PiAocmVsICYgZmxhZykgPT09IGZsYWc7XHJcblxyXG52YXIgaXNOb2RlID0gKGIsIGZsYWcsIGEpID0+IGlzKF9jb21wYXJlUG9zaXRpb24oYSwgYiksIGZsYWcpO1xyXG5cclxuLy8gQ29tcGFyZSBQb3NpdGlvbiAtIE1JVCBMaWNlbnNlZCwgSm9obiBSZXNpZ1xyXG52YXIgX2NvbXBhcmVQb3NpdGlvbiA9IChub2RlMSwgbm9kZTIpID0+XHJcbiAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/XHJcbiAgICBub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihub2RlMikgOlxyXG4gICAgMDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTb3J0cyBhbiBhcnJheSBvZiBEIGVsZW1lbnRzIGluLXBsYWNlIChpLmUuLCBtdXRhdGVzIHRoZSBvcmlnaW5hbCBhcnJheSlcclxuICAgICAqIGluIGRvY3VtZW50IG9yZGVyIGFuZCByZXR1cm5zIHdoZXRoZXIgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZC5cclxuICAgICAqIEBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50W119IGFycmF5ICAgICAgICAgIEFycmF5IG9mIEQgZWxlbWVudHMuXHJcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59ICBbcmV2ZXJzZT1mYWxzZV0gSWYgYSB0cnV0aHkgdmFsdWUgaXMgcGFzc2VkLCB0aGUgZ2l2ZW4gYXJyYXkgd2lsbCBiZSByZXZlcnNlZC5cclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQsIG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqIEBzZWUgalF1ZXJ5IHNyYy9zZWxlY3Rvci1uYXRpdmUuanM6MzdcclxuICAgICAqL1xyXG4gICAgLy8gVE9ETzogQWRkcmVzcyBlbmNhcHN1bGF0aW9uXHJcbiAgICBzb3J0OiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIF9oYXNEdXBsaWNhdGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdmFyIF9zb3J0ID0gZnVuY3Rpb24obm9kZTEsIG5vZGUyKSB7XHJcbiAgICAgICAgICAgIC8vIEZsYWcgZm9yIGR1cGxpY2F0ZSByZW1vdmFsXHJcbiAgICAgICAgICAgIGlmIChub2RlMSA9PT0gbm9kZTIpIHtcclxuICAgICAgICAgICAgICAgIF9oYXNEdXBsaWNhdGUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNvcnQgb24gbWV0aG9kIGV4aXN0ZW5jZSBpZiBvbmx5IG9uZSBpbnB1dCBoYXMgY29tcGFyZURvY3VtZW50UG9zaXRpb25cclxuICAgICAgICAgICAgdmFyIHJlbCA9ICFub2RlMS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiAtICFub2RlMi5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbjtcclxuICAgICAgICAgICAgaWYgKHJlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm9kZXMgc2hhcmUgdGhlIHNhbWUgZG9jdW1lbnRcclxuICAgICAgICAgICAgaWYgKChub2RlMS5vd25lckRvY3VtZW50IHx8IG5vZGUxKSA9PT0gKG5vZGUyLm93bmVyRG9jdW1lbnQgfHwgbm9kZTIpKSB7XHJcbiAgICAgICAgICAgICAgICByZWwgPSBfY29tcGFyZVBvc2l0aW9uKG5vZGUxLCBub2RlMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHdlIGtub3cgdGhleSBhcmUgZGlzY29ubmVjdGVkXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVsID0gRElTQ09OTkVDVEVEO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBOb3QgZGlyZWN0bHkgY29tcGFyYWJsZVxyXG4gICAgICAgICAgICBpZiAoIXJlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERpc2Nvbm5lY3RlZCBub2Rlc1xyXG4gICAgICAgICAgICBpZiAoaXMocmVsLCBESVNDT05ORUNURUQpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNOb2RlMURpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUxKTtcclxuICAgICAgICAgICAgICAgIHZhciBpc05vZGUyRGlzY29ubmVjdGVkID0gIWlzQXR0YWNoZWQobm9kZTIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc05vZGUxRGlzY29ubmVjdGVkICYmIGlzTm9kZTJEaXNjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNOb2RlMkRpc2Nvbm5lY3RlZCA/IC0xIDogMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGlzKHJlbCwgRk9MTE9XSU5HKSA/IC0xIDogMTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJyYXksIHJldmVyc2UpIHtcclxuICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBhcnJheS5zb3J0KF9zb3J0KTtcclxuICAgICAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgICAgIGFycmF5LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2hhc0R1cGxpY2F0ZTtcclxuICAgICAgICB9O1xyXG4gICAgfSgpKSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVybWluZXMgd2hldGhlciBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYC5cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gYSBEIGVsZW1lbnQgbm9kZVxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBiIEQgZWxlbWVudCBub2RlXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBub2RlIGBhYCBjb250YWlucyBub2RlIGBiYDsgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgIHZhciBiVXAgPSBpc0F0dGFjaGVkKGIpID8gYi5wYXJlbnROb2RlIDogbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGEgPT09IGJVcCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChiVXAgJiYgYlVwLm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgIC8vIE1vZGVybiBicm93c2VycyAoSUU5KylcclxuICAgICAgICAgICAgaWYgKGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpc05vZGUoYlVwLCBDT05UQUlORURfQlksIGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBSRUdFWCA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBNQVhfU0lOR0xFX1RBR19MRU5HVEggPSAzMDtcclxuXHJcbnZhciBwYXJzZVN0cmluZyA9IGZ1bmN0aW9uKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpIHtcclxuICAgIHZhciBwYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHBhcmVudFRhZ05hbWUpO1xyXG4gICAgcGFyZW50LmlubmVySFRNTCA9IGh0bWxTdHI7XHJcbiAgICByZXR1cm4gcGFyZW50O1xyXG59O1xyXG5cclxudmFyIHBhcnNlU2luZ2xlVGFnID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgaWYgKGh0bWxTdHIubGVuZ3RoID4gTUFYX1NJTkdMRV9UQUdfTEVOR1RIKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIHNpbmdsZVRhZ01hdGNoID0gUkVHRVguc2luZ2xlVGFnTWF0Y2goaHRtbFN0cik7XHJcbiAgICBpZiAoIXNpbmdsZVRhZ01hdGNoKSB7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHNpbmdsZVRhZ01hdGNoWzFdKTtcclxuXHJcbiAgICByZXR1cm4gWyBlbGVtIF07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIHZhciBzaW5nbGVUYWcgPSBwYXJzZVNpbmdsZVRhZyhodG1sU3RyKTtcclxuICAgIGlmIChzaW5nbGVUYWcpIHsgcmV0dXJuIHNpbmdsZVRhZzsgfVxyXG5cclxuICAgIHZhciBwYXJlbnRUYWdOYW1lID0gUkVHRVguZ2V0UGFyZW50VGFnTmFtZShodG1sU3RyKSxcclxuICAgICAgICBwYXJlbnQgICAgICAgID0gcGFyc2VTdHJpbmcocGFyZW50VGFnTmFtZSwgaHRtbFN0cik7XHJcblxyXG4gICAgdmFyIGNoaWxkLFxyXG4gICAgICAgIGlkeCA9IHBhcmVudC5jaGlsZHJlbi5sZW5ndGgsXHJcbiAgICAgICAgYXJyID0gbmV3IEFycmF5KGlkeCk7XHJcblxyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgY2hpbGQgPSBwYXJlbnQuY2hpbGRyZW5baWR4XTtcclxuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIGFycltpZHhdID0gY2hpbGQ7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyZW50ID0gbnVsbDtcclxuXHJcbiAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgID0gcmVxdWlyZSgnLi9EJyksXHJcbiAgICBwYXJzZXIgICAgID0gcmVxdWlyZSgncGFyc2VyJyksXHJcbiAgICBGaXp6bGUgICAgID0gcmVxdWlyZSgnRml6emxlJyksXHJcbiAgICBlYWNoICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hcnJheS9lYWNoJyksXHJcbiAgICBmb3JFYWNoICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hcnJheS9mb3JFYWNoJyksXHJcbiAgICBkYXRhICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9kYXRhJyk7XHJcblxyXG52YXIgcGFyc2VIdG1sID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICBpZiAoIXN0cikgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgdmFyIHJlc3VsdCA9IHBhcnNlcihzdHIpO1xyXG4gICAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC5sZW5ndGgpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIHJldHVybiBEKHJlc3VsdCk7XHJcbn07XHJcblxyXG5fLmV4dGVuZChELFxyXG4gICAgZGF0YS5ELFxyXG57XHJcbiAgICAvLyBCZWNhdXNlIG5vIG9uZSBrbm93IHdoYXQgdGhlIGNhc2Ugc2hvdWxkIGJlXHJcbiAgICBwYXJzZUh0bWw6IHBhcnNlSHRtbCxcclxuICAgIHBhcnNlSFRNTDogcGFyc2VIdG1sLFxyXG5cclxuICAgIEZpenpsZTogIEZpenpsZSxcclxuICAgIGVhY2g6ICAgIGVhY2gsXHJcbiAgICBmb3JFYWNoOiBmb3JFYWNoLFxyXG5cclxuICAgIG1hcDogICAgIF8ubWFwLFxyXG4gICAgZXh0ZW5kOiAgXy5leHRlbmQsXHJcblxyXG4gICAgbW9yZUNvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cualF1ZXJ5ID0gd2luZG93LlplcHRvID0gd2luZG93LiQgPSBEO1xyXG4gICAgfVxyXG59KTtcclxuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHNwbGl0ICAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgYXJyYXkgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJ21vZHVsZXMvdHJhbnN2ZXJzYWwnKSxcclxuICAgIGRpbWVuc2lvbnMgID0gcmVxdWlyZSgnbW9kdWxlcy9kaW1lbnNpb25zJyksXHJcbiAgICBtYW5pcCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jc3MnKSxcclxuICAgIGF0dHIgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hdHRyJyksXHJcbiAgICBwcm9wICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3ZhbCcpLFxyXG4gICAgcG9zaXRpb24gICAgPSByZXF1aXJlKCdtb2R1bGVzL3Bvc2l0aW9uJyksXHJcbiAgICBjbGFzc2VzICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgc2Nyb2xsICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Njcm9sbCcpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKSxcclxuICAgIGV2ZW50cyAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9ldmVudHMnKTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyKSA9PiAhZXhpc3RzKHN0cikgfHwgc3RyID09PSAnJzsiLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBjYWNoZSAgID0gcmVxdWlyZSgnY2FjaGUnKSgyKSxcclxuICAgIGlzRW1wdHkgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpLFxyXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcblxyXG4gICAgUl9TUEFDRSA9IC9cXHMrL2csXHJcblxyXG4gICAgc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIHZhciBzcGxpdCAgID0gbmFtZS5zcGxpdChkZWxpbSksXHJcbiAgICAgICAgICAgIGxlbiAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIG5hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmFtZVNldCA9IHt9LFxyXG4gICAgICAgICAgICBjdXJOYW1lO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgY3VyTmFtZSA9IHNwbGl0W2xlbiAtIChpZHggKyAxKV07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdIHx8IC8vIHVuaXF1ZVxyXG4gICAgICAgICAgICAgICAgaXNFbXB0eShjdXJOYW1lKSAgICAvLyBub24tZW1wdHlcclxuICAgICAgICAgICAgKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKGN1ck5hbWUpO1xyXG4gICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltaXRlcikge1xyXG4gICAgaWYgKGlzRW1wdHkobmFtZSkpIHsgcmV0dXJuIFtdOyB9XHJcbiAgICBpZiAoaXNBcnJheShuYW1lKSkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAgIHZhciBkZWxpbSA9IGRlbGltaXRlciA9PT0gdW5kZWZpbmVkID8gUl9TUEFDRSA6IGRlbGltaXRlcjtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoZGVsaW0sIG5hbWUpID8gXHJcbiAgICAgICAgY2FjaGUuZ2V0KGRlbGltLCBuYW1lKSA6IFxyXG4gICAgICAgIGNhY2hlLnB1dChkZWxpbSwgbmFtZSwgKCkgPT4gc3BsaXQobmFtZSwgZGVsaW0pKTtcclxufTtcclxuIiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIC8vIEV4aXQgZWFybHkgZm9yIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAvLyBFbmQsIG5hdHVyYWxseSwgaGFzIHRvIGJlIGhpZ2hlciB0aGFuIDAgdG8gbWF0dGVyLFxyXG4gICAgLy8gc28gYSBzaW1wbGUgZXhpc3RlbmNlIGNoZWNrIHdpbGwgZG9cclxuICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgIHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQgfHwgMCk7XHJcbn07IiwiLy8gQnJlYWtzIGV2ZW4gb24gYXJyYXlzIHdpdGggMyBpdGVtcy4gMyBvciBtb3JlXHJcbi8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBkZWxpbWl0ZXIpID0+IHN0ci5zcGxpdChkZWxpbWl0ZXIgfHwgJ3wnKTtcclxuIiwidmFyIGlkID0gMDtcclxudmFyIHVuaXF1ZUlkID0gbW9kdWxlLmV4cG9ydHMgPSAoKSA9PiBpZCsrO1xyXG51bmlxdWVJZC5zZWVkID0gZnVuY3Rpb24oc2VlZGVkLCBwcmUpIHtcclxuICAgIHZhciBwcmVmaXggPSBwcmUgfHwgJycsXHJcbiAgICAgICAgc2VlZCA9IHNlZWRlZCB8fCAwO1xyXG4gICAgcmV0dXJuICgpID0+IHByZWZpeCArIHNlZWQrKztcclxufTsiXX0=
