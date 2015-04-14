(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./D');
require('./props');
require('./proto');

},{"./D":3,"./props":69,"./proto":70}],2:[function(require,module,exports){
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

},{"Fizzle":9,"_":22,"is/D":24,"is/array":25,"is/function":33,"is/html":34,"is/nodeList":35,"is/string":39,"onready":66,"parser":68}],4:[function(require,module,exports){
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

},{"REGEX":20,"cache":23,"is/element":31,"is/exists":32,"is/nodeList":35,"matchesSelector":41,"util/uniqueId":76}],9:[function(require,module,exports){
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

    each: function each(obj, iterator) {
        if (!obj || !iterator) {
            return;
        }

        var idx = 0,
            length = obj.length;
        if (length === +length) {
            for (idx = 0; idx < length; idx++) {
                iterator(obj[idx], idx, obj);
            }
        } else {
            var keys = Object.keys(obj);
            for (length = keys.length; idx < length; idx++) {
                iterator(obj[keys[idx]], keys[idx], obj);
            }
        }
        return obj;
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

},{"is/array":25,"is/arrayLike":26,"is/exists":32,"is/nodeList":35,"util/slice":74}],23:[function(require,module,exports){
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

var D = require('D'),
    exists = require('is/exists'),
    slice = require('util/slice'),
    forEach = require('./forEach'),
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

},{"./forEach":43,"./map":45,"D":3,"is/exists":32,"util/slice":74}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{"order":67}],47:[function(require,module,exports){
'use strict';

var _ = require('_'),
    exists = require('is/exists'),
    isFunction = require('is/function'),
    isString = require('is/string'),
    isElement = require('node/isElement'),
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

},{"Fizzle":9,"SUPPORTS":21,"_":22,"cache":23,"is/exists":32,"is/function":33,"is/string":39,"node/isElement":63,"node/isName":64,"string/newlines":72}],48:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT'),
    isArray = require('is/array'),
    isString = require('is/string'),
    split = require('string/split'),
    isEmpty = require('string/isEmpty');

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
        if (elem.nodeType !== ELEMENT) {
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
        if (elems[idx].nodeType !== ELEMENT) {
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
        if (elems[idx].nodeType !== ELEMENT) {
            continue;
        }
        elems[idx].className = '';
    }
    return elems;
};

exports.fn = {
    hasClass: function hasClass(name) {
        return this.length && !isEmpty(name) ? doAnyElemsHaveClass(this, name) : false;
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

},{"NODE_TYPE/ELEMENT":18,"is/array":25,"is/string":39,"string/isEmpty":71,"string/split":73}],49:[function(require,module,exports){
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

},{"NODE_TYPE/DOCUMENT":16,"REGEX":20,"_":22,"is/array":25,"is/attached":27,"is/boolean":28,"is/document":30,"is/element":31,"is/exists":32,"is/number":36,"is/object":37,"is/string":39,"is/window":40,"util/split":75}],50:[function(require,module,exports){
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

},{"cache":23,"is/array":25,"is/element":31,"is/string":39,"util/uniqueId":76}],51:[function(require,module,exports){
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

},{"./css":49,"_":22,"is/number":36}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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

},{"crossvent":2,"is/exists":32,"matchesSelector":41}],54:[function(require,module,exports){
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

},{"./custom":52,"./delegate":53,"_":22,"is/function":33}],55:[function(require,module,exports){
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

},{"./array/unique":46,"./data":50,"./selectors/filter":59,"D":3,"_":22,"is/D":24,"is/collection":29,"is/document":30,"is/element":31,"is/exists":32,"is/function":33,"is/html":34,"is/nodeList":35,"is/number":36,"is/string":39,"is/window":40,"order":67,"parser":68}],56:[function(require,module,exports){
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

},{"D":3,"_":22,"is/attached":27,"is/exists":32,"is/function":33,"is/object":37,"node/isName":64}],57:[function(require,module,exports){
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

},{"NODE_TYPE/ATTRIBUTE":14,"NODE_TYPE/COMMENT":15,"NODE_TYPE/TEXT":19,"REGEX":20,"SUPPORTS":21,"_":22,"is/function":33,"is/string":39,"util/split":75}],58:[function(require,module,exports){
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

},{"is/exists":32,"is/string":39}],59:[function(require,module,exports){
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

},{"Fizzle":9,"_":22,"is/function":33,"is/string":39}],60:[function(require,module,exports){
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

},{"D":3,"Fizzle":9,"_":22,"is/D":24,"is/array":25,"is/collection":29,"is/element":31,"is/function":33,"is/nodeList":35,"is/selector":38,"is/string":39,"order":67}],61:[function(require,module,exports){
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

},{"./array/unique":46,"./selectors/filter":59,"D":3,"Fizzle":9,"NODE_TYPE/DOCUMENT":16,"NODE_TYPE/DOCUMENT_FRAGMENT":17,"NODE_TYPE/ELEMENT":18,"_":22,"is/D":24,"is/attached":27,"is/document":30,"is/element":31,"is/string":39,"is/window":40,"order":67}],62:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"SUPPORTS":21,"_":22,"is/array":25,"is/exists":32,"is/function":33,"is/number":36,"is/string":39,"node/isName":64,"node/normalizeName":65,"string/newlines":72}],63:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (elem) {
        return elem && elem.nodeType === ELEMENT;
};

},{"NODE_TYPE/ELEMENT":18}],64:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};

},{}],65:[function(require,module,exports){
// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
"use strict";

module.exports = function (elem) {
  return elem.nodeName.toLowerCase();
};

},{}],66:[function(require,module,exports){
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

},{}],67:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"is/attached":27}],68:[function(require,module,exports){
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

},{"REGEX":20}],69:[function(require,module,exports){
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

},{"./D":3,"Fizzle":9,"_":22,"modules/array/each":42,"modules/array/forEach":43,"modules/data":50,"parser":68}],70:[function(require,module,exports){
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

},{"./D":3,"_":22,"modules/array":44,"modules/attr":47,"modules/classes":48,"modules/css":49,"modules/data":50,"modules/dimensions":51,"modules/events":54,"modules/manip":55,"modules/position":56,"modules/prop":57,"modules/scroll":58,"modules/selectors":60,"modules/transversal":61,"modules/val":62,"util/split":75}],71:[function(require,module,exports){
'use strict';

var exists = require('is/exists');

module.exports = function (str) {
  return !exists(str) || str === '';
};

},{"is/exists":32}],72:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ? function (str) {
    return str;
} : function (str) {
    return str ? str.replace(/\r\n/g, '\n') : str;
};

},{"SUPPORTS":21}],73:[function(require,module,exports){
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

},{"cache":23,"is/array":25,"string/isEmpty":71}],74:[function(require,module,exports){
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

},{}],75:[function(require,module,exports){
// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
'use strict';

module.exports = function (str, delimiter) {
  return str.split(delimiter || '|');
};

},{}],76:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvY2FwdHVyZS5qc29uIiwic3JjL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qc29uIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9BVFRSSUJVVEUuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9DT01NRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0VMRU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9URVhULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvZWFjaC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS9mb3JFYWNoLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L21hcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc0VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvaXNOYW1lLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL25vcm1hbGl6ZU5hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL2lzRW1wdHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL3N0cmluZy9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NsaWNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3VuaXF1ZUlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O0FDRm5CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3JGQSxJQUFJLENBQUMsR0FBYSxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQzFCLE9BQU8sR0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDO0lBQ2pDLE1BQU0sR0FBUSxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ2hDLFFBQVEsR0FBTSxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQ2xDLFVB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RTtBQUFFLGVBQU8sRUFBRSxDQUFDO0tBQUU7Ozs7QUFJdkMsUUFBSSxHQUFHLEVBQUU7QUFBRSxlQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztLQUFFOztBQUVoRCxXQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztDQUN0QyxDQUFDOzs7Ozs7O0FDVEYsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFDLEdBQUcsRUFBRSxTQUFTO1NBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDO0NBQUEsQ0FBQzs7Ozs7QUNGakUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sR0FBRztXQUFNLEVBQUUsRUFBRTtDQUFBLENBQUM7QUFDM0MsUUFBUSxDQUFDLElBQUksR0FBRyxVQUFTLE1BQU0sRUFBRSxHQUFHLEVBQUU7QUFDbEMsUUFBSSxNQUFNLEdBQUcsR0FBRyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUM7QUFDdkIsV0FBTztlQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUU7S0FBQSxDQUFDO0NBQ2hDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL0QnKTtcclxucmVxdWlyZSgnLi9wcm9wcycpO1xyXG5yZXF1aXJlKCcuL3Byb3RvJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9jID0gZG9jdW1lbnQ7XG52YXIgYWRkRXZlbnQgPSBhZGRFdmVudEVhc3k7XG52YXIgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEVhc3k7XG52YXIgaGFyZENhY2hlID0gW107XG5cbmlmICghZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgYWRkRXZlbnQgPSBhZGRFdmVudEhhcmQ7XG4gIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRIYXJkO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiBhZGRFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuYXR0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHdyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5kZXRhY2hFdmVudCgnb24nICsgdHlwZSwgdW53cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiBmYWJyaWNhdGVFdmVudCAoZWwsIHR5cGUpIHtcbiAgdmFyIGU7XG4gIGlmIChkb2MuY3JlYXRlRXZlbnQpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGUuaW5pdEV2ZW50KHR5cGUsIHRydWUsIHRydWUpO1xuICAgIGVsLmRpc3BhdGNoRXZlbnQoZSk7XG4gIH0gZWxzZSBpZiAoZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgIGVsLmZpcmVFdmVudCgnb24nICsgdHlwZSwgZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcHBlckZhY3RvcnkgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlciAob3JpZ2luYWxFdmVudCkge1xuICAgIHZhciBlID0gb3JpZ2luYWxFdmVudCB8fCBnbG9iYWwuZXZlbnQ7XG4gICAgZS50YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCAgPSBlLnByZXZlbnREZWZhdWx0ICB8fCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdCAoKSB7IGUucmV0dXJuVmFsdWUgPSBmYWxzZTsgfTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbiA9IGUuc3RvcFByb3BhZ2F0aW9uIHx8IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbiAoKSB7IGUuY2FuY2VsQnViYmxlID0gdHJ1ZTsgfTtcbiAgICBmbi5jYWxsKGVsLCBlKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gd3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciB3cmFwcGVyID0gdW53cmFwKGVsLCB0eXBlLCBmbikgfHwgd3JhcHBlckZhY3RvcnkoZWwsIHR5cGUsIGZuKTtcbiAgaGFyZENhY2hlLnB1c2goe1xuICAgIHdyYXBwZXI6IHdyYXBwZXIsXG4gICAgZWxlbWVudDogZWwsXG4gICAgdHlwZTogdHlwZSxcbiAgICBmbjogZm5cbiAgfSk7XG4gIHJldHVybiB3cmFwcGVyO1xufVxuXG5mdW5jdGlvbiB1bndyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSA9IGZpbmQoZWwsIHR5cGUsIGZuKTtcbiAgaWYgKGkpIHtcbiAgICB2YXIgd3JhcHBlciA9IGhhcmRDYWNoZVtpXS53cmFwcGVyO1xuICAgIGhhcmRDYWNoZS5zcGxpY2UoaSwgMSk7IC8vIGZyZWUgdXAgYSB0YWQgb2YgbWVtb3J5XG4gICAgcmV0dXJuIHdyYXBwZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpLCBpdGVtO1xuICBmb3IgKGkgPSAwOyBpIDwgaGFyZENhY2hlLmxlbmd0aDsgaSsrKSB7XG4gICAgaXRlbSA9IGhhcmRDYWNoZVtpXTtcbiAgICBpZiAoaXRlbS5lbGVtZW50ID09PSBlbCAmJiBpdGVtLnR5cGUgPT09IHR5cGUgJiYgaXRlbS5mbiA9PT0gZm4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkOiBhZGRFdmVudCxcbiAgcmVtb3ZlOiByZW1vdmVFdmVudCxcbiAgZmFicmljYXRlOiBmYWJyaWNhdGVFdmVudFxufTtcbiIsInZhciBfICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzQXJyYXkgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzSHRtbCAgICAgID0gcmVxdWlyZSgnaXMvaHRtbCcpLFxyXG4gICAgaXNTdHJpbmcgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTm9kZUxpc3QgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRnVuY3Rpb24gID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzRCAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgcGFyc2VyICAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIG9ucmVhZHkgICAgID0gcmVxdWlyZSgnb25yZWFkeScpLFxyXG4gICAgRml6emxlICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBEID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIHJldHVybiBuZXcgSW5pdChzZWxlY3RvciwgYXR0cnMpO1xyXG59O1xyXG5cclxuaXNELnNldChEKTtcclxuXHJcbnZhciBJbml0ID0gZnVuY3Rpb24oc2VsZWN0b3IsIGF0dHJzKSB7XHJcbiAgICAvLyBub3RoaW5cclxuICAgIGlmICghc2VsZWN0b3IpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAvLyBlbGVtZW50IG9yIHdpbmRvdyAoZG9jdW1lbnRzIGhhdmUgYSBub2RlVHlwZSlcclxuICAgIGlmIChzZWxlY3Rvci5ub2RlVHlwZSB8fCBzZWxlY3RvciA9PT0gd2luZG93KSB7XHJcbiAgICAgICAgdGhpc1swXSA9IHNlbGVjdG9yO1xyXG4gICAgICAgIHRoaXMubGVuZ3RoID0gMTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBIVE1MIHN0cmluZ1xyXG4gICAgaWYgKGlzSHRtbChzZWxlY3RvcikpIHtcclxuICAgICAgICBfLm1lcmdlKHRoaXMsIHBhcnNlcihzZWxlY3RvcikpO1xyXG4gICAgICAgIGlmIChhdHRycykgeyB0aGlzLmF0dHIoYXR0cnMpOyB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFN0cmluZ1xyXG4gICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIFNlbGVjdG9yOiBwZXJmb3JtIGEgZmluZCB3aXRob3V0IGNyZWF0aW5nIGEgbmV3IERcclxuICAgICAgICBfLm1lcmdlKHRoaXMsIEZpenpsZS5xdWVyeShzZWxlY3RvcikuZXhlYyh0aGlzLCB0cnVlKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgb2YgRWxlbWVudHMsIE5vZGVMaXN0LCBvciBEIG9iamVjdFxyXG4gICAgLy8gVE9ETzogQ291bGQgdGhpcyBiZSBhcnJheUxpa2U/XHJcbiAgICBpZiAoaXNBcnJheShzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGRvY3VtZW50IHJlYWR5XHJcbiAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICBvbnJlYWR5KHNlbGVjdG9yKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5Jbml0LnByb3RvdHlwZSA9IEQucHJvdG90eXBlOyIsIm1vZHVsZS5leHBvcnRzID0gKHRhZykgPT4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpOyIsInZhciBkaXYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vY3JlYXRlJykoJ2RpdicpO1xyXG5cclxuZGl2LmlubmVySFRNTCA9ICc8YSBocmVmPVwiL2FcIj5hPC9hPic7IiwidmFyIF8gPSByZXF1aXJlKCdfJyk7XHJcblxyXG52YXIgSXMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5Jcy5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSB0aGlzLl9zZWxlY3RvcnMsXHJcbiAgICAgICAgICAgIGlkeCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3JzW2lkeF0ubWF0Y2goY29udGV4dCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5hbnkoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgdGhpcy5tYXRjaChlbGVtKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vdDogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgICF0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsInZhciBmaW5kID0gZnVuY3Rpb24ocXVlcnksIGNvbnRleHQpIHtcclxuICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICBzZWxlY3RvcnMgPSBxdWVyeS5fc2VsZWN0b3JzLFxyXG4gICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IHNlbGVjdG9ycy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2VsZWN0b3JzW2lkeF0uZXhlYyhjb250ZXh0KSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxudmFyIFF1ZXJ5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvcnMpIHtcclxuICAgIHRoaXMuX3NlbGVjdG9ycyA9IHNlbGVjdG9ycztcclxufTtcclxuXHJcblF1ZXJ5LnByb3RvdHlwZSA9IHtcclxuICAgIGV4ZWM6IGZ1bmN0aW9uKGFyciwgaXNOZXcpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCA9IDAsIGxlbmd0aCA9IGlzTmV3ID8gMSA6IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBmaW5kKHRoaXMsIGFycltpZHhdKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcblxyXG4gICAgR0VUX0VMRU1FTlRfQllfSUQgICAgICAgICAgPSAnZ2V0RWxlbWVudEJ5SWQnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FICAgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnLFxyXG4gICAgR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUUgPSAnZ2V0RWxlbWVudHNCeUNsYXNzTmFtZScsXHJcbiAgICBRVUVSWV9TRUxFQ1RPUl9BTEwgICAgICAgICA9ICdxdWVyeVNlbGVjdG9yQWxsJyxcclxuICAgIFxyXG4gICAgdW5pcXVlSWQgICAgICA9IHJlcXVpcmUoJ3V0aWwvdW5pcXVlSWQnKS5zZWVkKDAsICdELXVuaXF1ZUlkLScpLFxyXG4gICAgc2VsZWN0b3JDYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIFJFR0VYICAgICAgICAgPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgbWF0Y2hlcyAgICAgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpO1xyXG5cclxudmFyIGRldGVybWluZU1ldGhvZCA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9IHNlbGVjdG9yQ2FjaGUuZ2V0KHNlbGVjdG9yKTtcclxuICAgICAgICBpZiAobWV0aG9kKSB7IHJldHVybiBtZXRob2Q7IH1cclxuXHJcbiAgICAgICAgbWV0aG9kID0gUkVHRVguaXNTdHJpY3RJZChzZWxlY3RvcikgPyBHRVRfRUxFTUVOVF9CWV9JRCA6XHJcbiAgICAgICAgICAgIFJFR0VYLmlzQ2xhc3Moc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUUgOlxyXG4gICAgICAgICAgICBSRUdFWC5pc1RhZyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgOiAgICAgICBcclxuICAgICAgICAgICAgUVVFUllfU0VMRUNUT1JfQUxMO1xyXG5cclxuICAgICAgICBzZWxlY3RvckNhY2hlLnNldChzZWxlY3RvciwgbWV0aG9kKTtcclxuICAgICAgICByZXR1cm4gbWV0aG9kO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBuZWVkIHRvIGZvcmNlIGFuIGFycmF5IGhlcmVcclxuICAgIGZyb21Eb21BcnJheVRvQXJyYXkgPSBmdW5jdGlvbihhcnJheUxpa2UpIHtcclxuICAgICAgICB2YXIgaWR4ID0gYXJyYXlMaWtlLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyID0gbmV3IEFycmF5KGlkeCk7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gYXJyYXlMaWtlW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIHByb2Nlc3NRdWVyeVNlbGVjdGlvbiA9IGZ1bmN0aW9uKHNlbGVjdGlvbikge1xyXG4gICAgICAgIC8vIE5vIHNlbGVjdGlvblxyXG4gICAgICAgIGlmICghc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTm9kZWxpc3Qgd2l0aG91dCBhIGxlbmd0aFxyXG4gICAgICAgIGlmIChpc05vZGVMaXN0KHNlbGVjdGlvbikgJiYgIXNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgaXQncyBhbiBpZCwgcmV0dXJuIGl0IGFzIGFuIGFycmF5XHJcbiAgICAgICAgcmV0dXJuIGlzRWxlbWVudChzZWxlY3Rpb24pIHx8ICFzZWxlY3Rpb24ubGVuZ3RoID8gW3NlbGVjdGlvbl0gOiBmcm9tRG9tQXJyYXlUb0FycmF5KHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIHRhaWxvckNoaWxkU2VsZWN0b3IgPSBmdW5jdGlvbihpZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gJyMnICsgaWQgKyAnICcgKyBzZWxlY3RvcjtcclxuICAgIH0sXHJcblxyXG4gICAgY2hpbGRPclNpYmxpbmdRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGYpIHtcclxuICAgICAgICAvLyBDaGlsZCBzZWxlY3QgLSBuZWVkcyBzcGVjaWFsIGhlbHAgc28gdGhhdCBcIj4gZGl2XCIgZG9lc24ndCBicmVha1xyXG4gICAgICAgIHZhciBtZXRob2QgICAgPSBzZWxmLm1ldGhvZCxcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yICA9IHNlbGYuc2VsZWN0b3IsXHJcbiAgICAgICAgICAgIG5ld0lkLFxyXG4gICAgICAgICAgICBpZDtcclxuXHJcbiAgICAgICAgaWQgPSBjb250ZXh0LmlkO1xyXG4gICAgICAgIGlmIChpZCA9PT0gJycgfHwgIWV4aXN0cyhpZCkpIHtcclxuICAgICAgICAgICAgbmV3SWQgPSB1bmlxdWVJZCgpO1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gbmV3SWQ7XHJcbiAgICAgICAgICAgIGlkQXBwbGllZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxlY3RvciA9IHRhaWxvckNoaWxkU2VsZWN0b3IoaWRBcHBsaWVkID8gbmV3SWQgOiBpZCwgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIGlmIChpZEFwcGxpZWQpIHtcclxuICAgICAgICAgICAgY29udGV4dC5pZCA9IGlkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGFzc1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3IsXHJcbiAgICAgICAgICAgIC8vIENsYXNzIHNlYXJjaCwgZG9uJ3Qgc3RhcnQgd2l0aCAnLidcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxmLnNlbGVjdG9yLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgaWRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGYpIHtcclxuICAgICAgICB2YXIgbWV0aG9kICAgPSBzZWxmLm1ldGhvZCxcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxmLnNlbGVjdG9yLnN1YnN0cigxKSxcclxuICAgICAgICAgICAgc2VsZWN0aW9uID0gZG9jdW1lbnRbbWV0aG9kXShzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVmYXVsdFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W3NlbGYubWV0aG9kXShzZWxmLnNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGVybWluZVF1ZXJ5ID0gZnVuY3Rpb24oc2VsZikge1xyXG4gICAgICAgIGlmIChzZWxmLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoaWxkT3JTaWJsaW5nUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0NsYXNzU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGFzc1F1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNlbGYuaXNJZFNlYXJjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaWRRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkZWZhdWx0UXVlcnk7XHJcbiAgICB9O1xyXG5cclxudmFyIFNlbGVjdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHZhciBzZWxlY3RvciAgICAgICAgICAgICAgICA9IHN0ci50cmltKCksXHJcbiAgICAgICAgaXNDaGlsZE9yU2libGluZ1NlbGVjdCAgPSBzZWxlY3RvclswXSA9PT0gJz4nIHx8IHNlbGVjdG9yWzBdID09PSAnKycsXHJcbiAgICAgICAgbWV0aG9kICAgICAgICAgICAgICAgICAgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID8gUVVFUllfU0VMRUNUT1JfQUxMIDogZGV0ZXJtaW5lTWV0aG9kKHNlbGVjdG9yKTtcclxuXHJcbiAgICB0aGlzLnN0ciAgICAgICAgICAgICAgICAgICAgPSBzdHI7XHJcbiAgICB0aGlzLnNlbGVjdG9yICAgICAgICAgICAgICAgPSBzZWxlY3RvcjtcclxuICAgIHRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3Q7XHJcbiAgICB0aGlzLmlzSWRTZWFyY2ggICAgICAgICAgICAgPSBtZXRob2QgPT09IEdFVF9FTEVNRU5UX0JZX0lEO1xyXG4gICAgdGhpcy5pc0NsYXNzU2VhcmNoICAgICAgICAgID0gIXRoaXMuaXNJZFNlYXJjaCAmJiBtZXRob2QgPT09IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FO1xyXG4gICAgdGhpcy5tZXRob2QgICAgICAgICAgICAgICAgID0gbWV0aG9kO1xyXG59O1xyXG5cclxuU2VsZWN0b3IucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAvLyBObyBuZWVlZCB0byBjaGVjaywgYSBtYXRjaCB3aWxsIGZhaWwgaWYgaXQnc1xyXG4gICAgICAgIC8vIGNoaWxkIG9yIHNpYmxpbmdcclxuICAgICAgICBpZiAodGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0KSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWF0Y2hlcyhjb250ZXh0LCB0aGlzLnNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgZXhlYzogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBxdWVyeSA9IGRldGVybWluZVF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAvLyB0aGVzZSBhcmUgdGhlIHR5cGVzIHdlJ3JlIGV4cGVjdGluZyB0byBmYWxsIHRocm91Z2hcclxuICAgICAgICAvLyBpc0VsZW1lbnQoY29udGV4dCkgfHwgaXNOb2RlTGlzdChjb250ZXh0KSB8fCBpc0NvbGxlY3Rpb24oY29udGV4dClcclxuICAgICAgICAvLyBpZiBubyBjb250ZXh0IGlzIGdpdmVuLCB1c2UgZG9jdW1lbnRcclxuICAgICAgICByZXR1cm4gcXVlcnkoY29udGV4dCB8fCBkb2N1bWVudCwgdGhpcyk7XHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCcuLi9fJyksXHJcbiAgICBxdWVyeUNhY2hlID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgaXNDYWNoZSAgICA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIFNlbGVjdG9yICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvU2VsZWN0b3InKSxcclxuICAgIFF1ZXJ5ICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvUXVlcnknKSxcclxuICAgIElzICAgICAgICAgPSByZXF1aXJlKCcuL2NvbnN0cnVjdHMvSXMnKSxcclxuICAgIHBhcnNlICAgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLXBhcnNlJyksXHJcbiAgICBub3JtYWxpemUgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1ub3JtYWxpemUnKTtcclxuXHJcbnZhciB0b1NlbGVjdG9ycyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgLy8gU2VsZWN0b3JzIHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlIHF1ZXJ5IHdhcyBpbnZhbGlkLlxyXG4gICAgLy8gTm90IHJldHVybmluZyBlYXJseSBvciBkb2luZyBleHRyYSBjaGVja3MgYXMgdGhpcyB3aWxsXHJcbiAgICAvLyBub29wIG9uIHRoZSBRdWVyeSBhbmQgSXMgbGV2ZWwgYW5kIGlzIHRoZSBleGNlcHRpb25cclxuICAgIC8vIGluc3RlYWQgb2YgdGhlIHJ1bGVcclxuICAgIHZhciBzZWxlY3RvcnMgPSBwYXJzZS5zdWJxdWVyaWVzKHN0cikgfHwgW107XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIGVhY2ggb2YgdGhlIHNlbGVjdG9ycy4uLlxyXG4gICAgc2VsZWN0b3JzID0gXy5tYXAoc2VsZWN0b3JzLCBub3JtYWxpemUpO1xyXG5cclxuICAgIC8vIC4uLmFuZCBtYXAgdGhlbSB0byBTZWxlY3RvciBvYmplY3RzXHJcbiAgICByZXR1cm4gXy5mYXN0bWFwKHNlbGVjdG9ycywgKHNlbGVjdG9yKSA9PiBuZXcgU2VsZWN0b3Ioc2VsZWN0b3IpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcGFyc2U6IHBhcnNlLFxyXG4gICAgXHJcbiAgICBxdWVyeTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5Q2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLnB1dChzdHIsICgpID0+IG5ldyBRdWVyeSh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9LFxyXG4gICAgaXM6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBpc0NhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIGlzQ2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgaXNDYWNoZS5wdXQoc3RyLCAoKSA9PiBuZXcgSXModG9TZWxlY3RvcnMoc3RyKSkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG5cdFwiOmNoaWxkLWF0XCI6IFwiOm50aC1jaGlsZCh4KVwiLFxyXG5cdFwiOmNoaWxkLWd0XCI6IFwiOm50aC1jaGlsZChuK3gpXCIsXHJcblx0XCI6Y2hpbGQtbHRcIjogXCI6bnRoLWNoaWxkKH5uK3gpXCJcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcbiAgICBcIjpjaGlsZC1ldmVuXCIgOiBcIjpudGgtY2hpbGQoZXZlbilcIixcclxuICAgIFwiOmNoaWxkLW9kZFwiICA6IFwiOm50aC1jaGlsZChvZGQpXCIsXHJcbiAgICBcIjp0ZXh0XCIgICAgICAgOiBcIlt0eXBlPXRleHRdXCIsXHJcbiAgICBcIjpwYXNzd29yZFwiICAgOiBcIlt0eXBlPXBhc3N3b3JkXVwiLFxyXG4gICAgXCI6cmFkaW9cIiAgICAgIDogXCJbdHlwZT1yYWRpb11cIixcclxuICAgIFwiOmNoZWNrYm94XCIgICA6IFwiW3R5cGU9Y2hlY2tib3hdXCIsXHJcbiAgICBcIjpzdWJtaXRcIiAgICAgOiBcIlt0eXBlPXN1Ym1pdF1cIixcclxuICAgIFwiOnJlc2V0XCIgICAgICA6IFwiW3R5cGU9cmVzZXRdXCIsXHJcbiAgICBcIjpidXR0b25cIiAgICAgOiBcIlt0eXBlPWJ1dHRvbl1cIixcclxuICAgIFwiOmltYWdlXCIgICAgICA6IFwiW3R5cGU9aW1hZ2VdXCIsXHJcbiAgICBcIjppbnB1dFwiICAgICAgOiBcIlt0eXBlPWlucHV0XVwiLFxyXG4gICAgXCI6ZmlsZVwiICAgICAgIDogXCJbdHlwZT1maWxlXVwiLFxyXG4gICAgXCI6c2VsZWN0ZWRcIiAgIDogXCJbc2VsZWN0ZWQ9c2VsZWN0ZWRdXCJcclxufSIsInZhciBTVVBQT1JUUyAgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuXHJcbiAgICBBVFRSSUJVVEVfU0VMRUNUT1IgPSAvXFxbXFxzKltcXHctXStcXHMqWyEkXipdPyg/Oj1cXHMqKFsnXCJdPykoLio/W15cXFxcXXxbXlxcXFxdKikpP1xcMVxccypcXF0vZyxcclxuICAgIFBTRVVET19TRUxFQ1QgICAgICA9IC8oOlteXFxzXFwoXFxbKV0rKS9nLFxyXG4gICAgQ0FQVFVSRV9TRUxFQ1QgICAgID0gLyg6W15cXHNeKF0rKVxcKChbXlxcKV0rKVxcKS9nLFxyXG4gICAgcHNldWRvQ2FjaGUgICAgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgcHJveHlTZWxlY3RvcnMgICAgID0gcmVxdWlyZSgnLi9wcm94eS5qc29uJyksXHJcbiAgICBjYXB0dXJlU2VsZWN0b3JzICAgPSByZXF1aXJlKCcuL2NhcHR1cmUuanNvbicpO1xyXG5cclxudmFyIGdldEF0dHJpYnV0ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgdmFyIHBhaXJzID0gW107XHJcbiAgICAvLyBOb3QgdXNpbmcgcmV0dXJuIHZhbHVlLiBTaW1wbHkgdXNpbmcgaXQgdG8gaXRlcmF0ZVxyXG4gICAgLy8gdGhyb3VnaCBhbGwgb2YgdGhlIG1hdGNoZXMgdG8gcG9wdWxhdGUgbWF0Y2ggcG9zaXRpb25zXHJcbiAgICBzdHIucmVwbGFjZShBVFRSSUJVVEVfU0VMRUNUT1IsIGZ1bmN0aW9uKG1hdGNoLCBjYXAxLCBjYXAyLCBwb3NpdGlvbikge1xyXG4gICAgICAgIHBhaXJzLnB1c2goWyBwb3NpdGlvbiwgcG9zaXRpb24gKyBtYXRjaC5sZW5ndGggXSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwYWlycztcclxufTtcclxuXHJcbnZhciBpc091dHNpZGVPZkF0dHJpYnV0ZSA9IGZ1bmN0aW9uKHBvc2l0aW9uLCBwb3NpdGlvbnMpIHtcclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBwb3NpdGlvbnMubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICB2YXIgcG9zID0gcG9zaXRpb25zW2lkeF07XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uID4gcG9zWzBdICYmIHBvc2l0aW9uIDwgcG9zWzFdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufTtcclxuXHJcbnZhciBwc2V1ZG9SZXBsYWNlID0gZnVuY3Rpb24oc3RyLCBwb3NpdGlvbnMpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZShQU0VVRE9fU0VMRUNULCBmdW5jdGlvbihtYXRjaCwgY2FwLCBwb3NpdGlvbikge1xyXG4gICAgICAgIGlmICghaXNPdXRzaWRlT2ZBdHRyaWJ1dGUocG9zaXRpb24sIHBvc2l0aW9ucykpIHsgcmV0dXJuIG1hdGNoOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm94eVNlbGVjdG9yc1ttYXRjaF0gPyBwcm94eVNlbGVjdG9yc1ttYXRjaF0gOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIGNhcHR1cmVSZXBsYWNlID0gZnVuY3Rpb24oc3RyLCBwb3NpdGlvbnMpIHtcclxuICAgIHZhciBjYXB0dXJlU2VsZWN0b3I7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoQ0FQVFVSRV9TRUxFQ1QsIGZ1bmN0aW9uKG1hdGNoLCBjYXAsIHZhbHVlLCBwb3NpdGlvbikge1xyXG4gICAgICAgIGlmICghaXNPdXRzaWRlT2ZBdHRyaWJ1dGUocG9zaXRpb24sIHBvc2l0aW9ucykpIHsgcmV0dXJuIG1hdGNoOyB9XHJcblxyXG4gICAgICAgIHJldHVybiAoY2FwdHVyZVNlbGVjdG9yID0gY2FwdHVyZVNlbGVjdG9yc1tjYXBdKSA/IGNhcHR1cmVTZWxlY3Rvci5yZXBsYWNlKCd4JywgdmFsdWUpIDogbWF0Y2g7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbnZhciBib29sZWFuU2VsZWN0b3JSZXBsYWNlID0gU1VQUE9SVFMuc2VsZWN0ZWRTZWxlY3RvciA/XHJcbiAgICAvLyBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBmdW5jdGlvbihzdHIpIHsgcmV0dXJuIHN0cjsgfSA6XHJcbiAgICAvLyBJRTgtOVxyXG4gICAgZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9ucyA9IGdldEF0dHJpYnV0ZVBvc2l0aW9ucyhzdHIpLFxyXG4gICAgICAgICAgICBpZHggPSBwb3NpdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICBwb3MsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgcG9zID0gcG9zaXRpb25zW2lkeF07XHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc3RyLnN1YnN0cmluZyhwb3NbMF0sIHBvc1sxXSk7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ1tzZWxlY3RlZF0nKSB7XHJcbiAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIHBvc1swXSkgKyAnW3NlbGVjdGVkPVwic2VsZWN0ZWRcIl0nICsgc3RyLnN1YnN0cmluZyhwb3NbMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICByZXR1cm4gcHNldWRvQ2FjaGUuaGFzKHN0cikgPyBwc2V1ZG9DYWNoZS5nZXQoc3RyKSA6IHBzZXVkb0NhY2hlLnB1dChzdHIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBhdHRyUG9zaXRpb25zID0gZ2V0QXR0cmlidXRlUG9zaXRpb25zKHN0cik7XHJcbiAgICAgICAgc3RyID0gcHNldWRvUmVwbGFjZShzdHIsIGF0dHJQb3NpdGlvbnMpO1xyXG4gICAgICAgIHN0ciA9IGJvb2xlYW5TZWxlY3RvclJlcGxhY2Uoc3RyKTtcclxuICAgICAgICByZXR1cm4gY2FwdHVyZVJlcGxhY2Uoc3RyLCBhdHRyUG9zaXRpb25zKTtcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKlxyXG4gKiBGaXp6bGUuanNcclxuICogQWRhcHRlZCBmcm9tIFNpenpsZS5qc1xyXG4gKi9cclxudmFyIHRva2VuQ2FjaGUgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBzdWJxdWVyeUNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG5cclxuICAgIGVycm9yID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2QtanM6IEludmFsaWQgcXVlcnkgc2VsZWN0b3IgKGNhdWdodCkgXCInKyBzZWxlY3RvciArJ1wiJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtc2VsZWN0b3JzLyN3aGl0ZXNwYWNlXHJcbiAgICBXSElURVNQQUNFID0gJ1tcXFxceDIwXFxcXHRcXFxcclxcXFxuXFxcXGZdJyxcclxuXHJcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjdmFsdWUtZGVmLWlkZW50aWZpZXJcclxuICAgIElERU5USUZJRVIgPSAnKD86XFxcXFxcXFwufFtcXFxcdy1dfFteXFxcXHgwMC1cXFxceGEwXSkrJyxcclxuXHJcbiAgICAvLyBOT1RFOiBMZWF2aW5nIGRvdWJsZSBxdW90ZXMgdG8gcmVkdWNlIGVzY2FwaW5nXHJcbiAgICAvLyBBdHRyaWJ1dGUgc2VsZWN0b3JzOiBodHRwOi8vd3d3LnczLm9yZy9UUi9zZWxlY3RvcnMvI2F0dHJpYnV0ZS1zZWxlY3RvcnNcclxuICAgIEFUVFJJQlVURVMgPSBcIlxcXFxbXCIgKyBXSElURVNQQUNFICsgXCIqKFwiICsgSURFTlRJRklFUiArIFwiKSg/OlwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gT3BlcmF0b3IgKGNhcHR1cmUgMilcclxuICAgICAgICBcIiooWypeJHwhfl0/PSlcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIC8vIFwiQXR0cmlidXRlIHZhbHVlcyBtdXN0IGJlIENTUyBJREVOVElGSUVScyBbY2FwdHVyZSA1XSBvciBzdHJpbmdzIFtjYXB0dXJlIDMgb3IgY2FwdHVyZSA0XVwiXHJcbiAgICAgICAgXCIqKD86JygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwifChcIiArIElERU5USUZJRVIgKyBcIikpfClcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIFwiKlxcXFxdXCIsXHJcblxyXG4gICAgUFNFVURPUyA9IFwiOihcIiArIElERU5USUZJRVIgKyBcIikoPzpcXFxcKChcIiArXHJcbiAgICAgICAgLy8gVG8gcmVkdWNlIHRoZSBudW1iZXIgb2Ygc2VsZWN0b3JzIG5lZWRpbmcgdG9rZW5pemUgaW4gdGhlIHByZUZpbHRlciwgcHJlZmVyIGFyZ3VtZW50czpcclxuICAgICAgICAvLyAxLiBxdW90ZWQgKGNhcHR1cmUgMzsgY2FwdHVyZSA0IG9yIGNhcHR1cmUgNSlcclxuICAgICAgICBcIignKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCIpfFwiICtcclxuICAgICAgICAvLyAyLiBzaW1wbGUgKGNhcHR1cmUgNilcclxuICAgICAgICBcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXCgpW1xcXFxdXXxcIiArIEFUVFJJQlVURVMgKyBcIikqKXxcIiArXHJcbiAgICAgICAgLy8gMy4gYW55dGhpbmcgZWxzZSAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiLipcIiArXHJcbiAgICAgICAgXCIpXFxcXCl8KVwiLFxyXG5cclxuICAgIFJfQ09NTUEgICAgICAgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKiwnICsgV0hJVEVTUEFDRSArICcqJyksXHJcbiAgICBSX0NPTUJJTkFUT1JTID0gbmV3IFJlZ0V4cCgnXicgKyBXSElURVNQQUNFICsgJyooWz4rfl18JyArIFdISVRFU1BBQ0UgKyAnKScgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfUFNFVURPICAgICAgPSBuZXcgUmVnRXhwKFBTRVVET1MpLFxyXG4gICAgUl9NQVRDSF9FWFBSID0ge1xyXG4gICAgICAgIElEOiAgICAgbmV3IFJlZ0V4cCgnXiMoJyAgICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgQ0xBU1M6ICBuZXcgUmVnRXhwKCdeXFxcXC4oJyArIElERU5USUZJRVIgKyAnKScpLFxyXG4gICAgICAgIFRBRzogICAgbmV3IFJlZ0V4cCgnXignICAgICsgSURFTlRJRklFUiArICd8WypdKScpLFxyXG4gICAgICAgIEFUVFI6ICAgbmV3IFJlZ0V4cCgnXicgICAgICsgQVRUUklCVVRFUyksXHJcbiAgICAgICAgUFNFVURPOiBuZXcgUmVnRXhwKCdeJyAgICAgKyBQU0VVRE9TKSxcclxuICAgICAgICBDSElMRDogIG5ldyBSZWdFeHAoJ146KG9ubHl8Zmlyc3R8bGFzdHxudGh8bnRoLWxhc3QpLShjaGlsZHxvZi10eXBlKSg/OlxcXFwoJyArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgICAgICAnKihldmVufG9kZHwoKFsrLV18KShcXFxcZCopbnwpJyArIFdISVRFU1BBQ0UgKyAnKig/OihbKy1dfCknICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKFxcXFxkKyl8KSknICsgV0hJVEVTUEFDRSArICcqXFxcXCl8KScsICdpJyksXHJcbiAgICAgICAgYm9vbDogICBuZXcgUmVnRXhwKFwiXig/OmNoZWNrZWR8c2VsZWN0ZWR8YXN5bmN8YXV0b2ZvY3VzfGF1dG9wbGF5fGNvbnRyb2xzfGRlZmVyfGRpc2FibGVkfGhpZGRlbnxpc21hcHxsb29wfG11bHRpcGxlfG9wZW58cmVhZG9ubHl8cmVxdWlyZWR8c2NvcGVkKSRcIiwgXCJpXCIpXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENTUyBlc2NhcGVzIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCNlc2NhcGVkLWNoYXJhY3RlcnNcclxuICAgIFJfVU5FU0NBUEUgPSBuZXcgUmVnRXhwKCdcXFxcXFxcXChbXFxcXGRhLWZdezEsNn0nICsgV0hJVEVTUEFDRSArICc/fCgnICsgV0hJVEVTUEFDRSArICcpfC4pJywgJ2lnJyksXHJcbiAgICBmdW5lc2NhcGUgPSBmdW5jdGlvbihfLCBlc2NhcGVkLCBlc2NhcGVkV2hpdGVzcGFjZSkge1xyXG4gICAgICAgIHZhciBoaWdoID0gJzB4JyArIChlc2NhcGVkIC0gMHgxMDAwMCk7XHJcbiAgICAgICAgLy8gTmFOIG1lYW5zIG5vbi1jb2RlcG9pbnRcclxuICAgICAgICAvLyBTdXBwb3J0OiBGaXJlZm94PDI0XHJcbiAgICAgICAgLy8gV29ya2Fyb3VuZCBlcnJvbmVvdXMgbnVtZXJpYyBpbnRlcnByZXRhdGlvbiBvZiArJzB4J1xyXG4gICAgICAgIHJldHVybiBoaWdoICE9PSBoaWdoIHx8IGVzY2FwZWRXaGl0ZXNwYWNlID9cclxuICAgICAgICAgICAgZXNjYXBlZCA6XHJcbiAgICAgICAgICAgIGhpZ2ggPCAwID9cclxuICAgICAgICAgICAgICAgIC8vIEJNUCBjb2RlcG9pbnRcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZShoaWdoICsgMHgxMDAwMCkgOlxyXG4gICAgICAgICAgICAgICAgLy8gU3VwcGxlbWVudGFsIFBsYW5lIGNvZGVwb2ludCAoc3Vycm9nYXRlIHBhaXIpXHJcbiAgICAgICAgICAgICAgICBmcm9tQ2hhckNvZGUoKGhpZ2ggPj4gMTApIHwgMHhEODAwLCAoaGlnaCAmIDB4M0ZGKSB8IDB4REMwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZUZpbHRlciA9IHtcclxuICAgICAgICBBVFRSOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnJlcGxhY2UoUl9VTkVTQ0FQRSwgZnVuZXNjYXBlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1vdmUgdGhlIGdpdmVuIHZhbHVlIHRvIG1hdGNoWzNdIHdoZXRoZXIgcXVvdGVkIG9yIHVucXVvdGVkXHJcbiAgICAgICAgICAgIG1hdGNoWzNdID0gKCBtYXRjaFszXSB8fCBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJyApLnJlcGxhY2UoUl9VTkVTQ0FQRSwgZnVuZXNjYXBlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsyXSA9PT0gJ349Jykge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbM10gPSAnICcgKyBtYXRjaFszXSArICcgJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDQpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIENISUxEOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICAvKiBtYXRjaGVzIGZyb20gUl9NQVRDSF9FWFBSWydDSElMRCddXHJcbiAgICAgICAgICAgICAgICAxIHR5cGUgKG9ubHl8bnRofC4uLilcclxuICAgICAgICAgICAgICAgIDIgd2hhdCAoY2hpbGR8b2YtdHlwZSlcclxuICAgICAgICAgICAgICAgIDMgYXJndW1lbnQgKGV2ZW58b2RkfFxcZCp8XFxkKm4oWystXVxcZCspP3wuLi4pXHJcbiAgICAgICAgICAgICAgICA0IHhuLWNvbXBvbmVudCBvZiB4bit5IGFyZ3VtZW50IChbKy1dP1xcZCpufClcclxuICAgICAgICAgICAgICAgIDUgc2lnbiBvZiB4bi1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDYgeCBvZiB4bi1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDcgc2lnbiBvZiB5LWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgOCB5IG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBtYXRjaFsxXSA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMV0uc2xpY2UoMCwgMykgPT09ICdudGgnKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBudGgtKiByZXF1aXJlcyBhcmd1bWVudFxyXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtYXRjaFswXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbnVtZXJpYyB4IGFuZCB5IHBhcmFtZXRlcnMgZm9yIEV4cHIuZmlsdGVyLkNISUxEXHJcbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGF0IGZhbHNlL3RydWUgY2FzdCByZXNwZWN0aXZlbHkgdG8gMC8xXHJcbiAgICAgICAgICAgICAgICBtYXRjaFs0XSA9ICsobWF0Y2hbNF0gPyBtYXRjaFs1XSArIChtYXRjaFs2XSB8fCAxKSA6IDIgKiAobWF0Y2hbM10gPT09ICdldmVuJyB8fCBtYXRjaFszXSA9PT0gJ29kZCcpKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzVdID0gKygoIG1hdGNoWzddICsgbWF0Y2hbOF0pIHx8IG1hdGNoWzNdID09PSAnb2RkJyk7XHJcblxyXG4gICAgICAgICAgICAvLyBvdGhlciB0eXBlcyBwcm9oaWJpdCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIFBTRVVETzogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgdmFyIGV4Y2VzcyxcclxuICAgICAgICAgICAgICAgIHVucXVvdGVkID0gIW1hdGNoWzZdICYmIG1hdGNoWzJdO1xyXG5cclxuICAgICAgICAgICAgaWYgKFJfTUFUQ0hfRVhQUi5DSElMRC50ZXN0KG1hdGNoWzBdKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFjY2VwdCBxdW90ZWQgYXJndW1lbnRzIGFzLWlzXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFszXSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIC8vIFN0cmlwIGV4Y2VzcyBjaGFyYWN0ZXJzIGZyb20gdW5xdW90ZWQgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodW5xdW90ZWQgJiYgUl9QU0VVRE8udGVzdCh1bnF1b3RlZCkgJiZcclxuICAgICAgICAgICAgICAgIC8vIEdldCBleGNlc3MgZnJvbSB0b2tlbml6ZSAocmVjdXJzaXZlbHkpXHJcbiAgICAgICAgICAgICAgICAoZXhjZXNzID0gdG9rZW5pemUodW5xdW90ZWQsIHRydWUpKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gYWR2YW5jZSB0byB0aGUgbmV4dCBjbG9zaW5nIHBhcmVudGhlc2lzXHJcbiAgICAgICAgICAgICAgICAoZXhjZXNzID0gdW5xdW90ZWQuaW5kZXhPZignKScsIHVucXVvdGVkLmxlbmd0aCAtIGV4Y2VzcykgLSB1bnF1b3RlZC5sZW5ndGgpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gZXhjZXNzIGlzIGEgbmVnYXRpdmUgaW5kZXhcclxuICAgICAgICAgICAgICAgIG1hdGNoWzBdID0gbWF0Y2hbMF0uc2xpY2UoMCwgZXhjZXNzKTtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gdW5xdW90ZWQuc2xpY2UoMCwgZXhjZXNzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIG9ubHkgY2FwdHVyZXMgbmVlZGVkIGJ5IHRoZSBwc2V1ZG8gZmlsdGVyIG1ldGhvZCAodHlwZSBhbmQgYXJndW1lbnQpXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCAzKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuLyoqXHJcbiAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIEZ1bGwgQ1NTIHNlbGVjdG9yIChlLmcuLCAnYSwgaW5wdXQ6Zm9jdXMsIGRpdlthdHRyPVwidmFsdWVcIl0nKS5cclxuICogQHBhcmFtICB7Qm9vbGVhbn0gW3BhcnNlT25seT1mYWxzZV1cclxuICogQHJldHVybiB7U3RyaW5nW118TnVtYmVyfG51bGx9IEFycmF5IG9mIHN1Yi1xdWVyaWVzIChlLmcuLCBbICdhJywgJ2lucHV0OmZvY3VzJywgJ2RpdlthdHRyPVwiKHZhbHVlMSksW3ZhbHVlMl1cIl0nKSBvciBudWxsIGlmIHRoZXJlIHdhcyBhbiBlcnJvciBwYXJzaW5nLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIHRva2VuaXplID0gZnVuY3Rpb24oc2VsZWN0b3IsIHBhcnNlT25seSkge1xyXG4gICAgaWYgKHRva2VuQ2FjaGUuaGFzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIHJldHVybiBwYXJzZU9ubHkgPyAwIDogdG9rZW5DYWNoZS5nZXQoc2VsZWN0b3IpLnNsaWNlKDApO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0eXBlLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1JlZ0V4cH0gKi9cclxuICAgICAgICByZWdleCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheX0gKi9cclxuICAgICAgICBtYXRjaCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgbWF0Y2hlZCxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmdbXX0gKi9cclxuICAgICAgICBzdWJxdWVyaWVzID0gW10sXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJ5ID0gJycsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHNvRmFyID0gc2VsZWN0b3I7XHJcblxyXG4gICAgd2hpbGUgKHNvRmFyKSB7XHJcbiAgICAgICAgLy8gQ29tbWEgYW5kIGZpcnN0IHJ1blxyXG4gICAgICAgIGlmICghbWF0Y2hlZCB8fCAobWF0Y2ggPSBSX0NPTU1BLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIC8vIERvbid0IGNvbnN1bWUgdHJhaWxpbmcgY29tbWFzIGFzIHZhbGlkXHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoWzBdLmxlbmd0aCkgfHwgc29GYXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuICAgICAgICAgICAgc3VicXVlcnkgPSAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hdGNoZWQgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yc1xyXG4gICAgICAgIGlmICgobWF0Y2ggPSBSX0NPTUJJTkFUT1JTLmV4ZWMoc29GYXIpKSkge1xyXG4gICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGaWx0ZXJzXHJcbiAgICAgICAgZm9yICh0eXBlIGluIFJfTUFUQ0hfRVhQUikge1xyXG4gICAgICAgICAgICByZWdleCA9IFJfTUFUQ0hfRVhQUlt0eXBlXTtcclxuICAgICAgICAgICAgbWF0Y2ggPSByZWdleC5leGVjKHNvRmFyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaCAmJiAoIXByZUZpbHRlclt0eXBlXSB8fCAobWF0Y2ggPSBwcmVGaWx0ZXJbdHlwZV0obWF0Y2gpKSkpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgc3VicXVlcnkgKz0gbWF0Y2hlZDtcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hlZC5sZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW1hdGNoZWQpIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzdWJxdWVyeSkgeyBzdWJxdWVyaWVzLnB1c2goc3VicXVlcnkpOyB9XHJcblxyXG4gICAgLy8gUmV0dXJuIHRoZSBsZW5ndGggb2YgdGhlIGludmFsaWQgZXhjZXNzXHJcbiAgICAvLyBpZiB3ZSdyZSBqdXN0IHBhcnNpbmcuXHJcbiAgICBpZiAocGFyc2VPbmx5KSB7IHJldHVybiBzb0Zhci5sZW5ndGg7IH1cclxuXHJcbiAgICBpZiAoc29GYXIpIHsgZXJyb3Ioc2VsZWN0b3IpOyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHJldHVybiB0b2tlbkNhY2hlLnNldChzZWxlY3Rvciwgc3VicXVlcmllcykuc2xpY2UoKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gICAgICogQHJldHVybiB7U3RyaW5nW118bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcgdGhlIHNlbGVjdG9yLlxyXG4gICAgICovXHJcbiAgICBzdWJxdWVyaWVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBzdWJxdWVyeUNhY2hlLmhhcyhzZWxlY3RvcikgPyBcclxuICAgICAgICAgICAgc3VicXVlcnlDYWNoZS5nZXQoc2VsZWN0b3IpIDogXHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5Q2FjaGUucHV0KHNlbGVjdG9yLCAoKSA9PiB0b2tlbml6ZShzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc0Jvb2w6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gUl9NQVRDSF9FWFBSLmJvb2wudGVzdChuYW1lKTtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAyOyIsIm1vZHVsZS5leHBvcnRzID0gODsiLCJtb2R1bGUuZXhwb3J0cyA9IDk7IiwibW9kdWxlLmV4cG9ydHMgPSAxMTsiLCJtb2R1bGUuZXhwb3J0cyA9IDE7IiwibW9kdWxlLmV4cG9ydHMgPSAzOyIsIiAgICAvLyBNYXRjaGVzIFwiLW1zLVwiIHNvIHRoYXQgaXQgY2FuIGJlIGNoYW5nZWQgdG8gXCJtcy1cIlxyXG52YXIgVFJVTkNBVEVfTVNfUFJFRklYICA9IC9eLW1zLS8sXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBkYXNoZWQgc3RyaW5nIGZvciBjYW1lbGl6aW5nXHJcbiAgICBEQVNIX0NBVENIICAgICAgICAgID0gLy0oW1xcZGEtel0pL2dpLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgXCJub25lXCIgb3IgYSB0YWJsZSB0eXBlIGUuZy4gXCJ0YWJsZVwiLFxyXG4gICAgLy8gXCJ0YWJsZS1jZWxsXCIgZXRjLi4uXHJcbiAgICBOT05FX09SX1RBQkxFICAgICAgID0gL14obm9uZXx0YWJsZSg/IS1jW2VhXSkuKykvLFxyXG4gICAgXHJcbiAgICBUWVBFX1RFU1RfRk9DVVNBQkxFID0gL14oPzppbnB1dHxzZWxlY3R8dGV4dGFyZWF8YnV0dG9ufG9iamVjdCkkL2ksXHJcbiAgICBUWVBFX1RFU1RfQ0xJQ0tBQkxFID0gL14oPzphfGFyZWEpJC9pLFxyXG4gICAgU0VMRUNUT1JfSUQgICAgICAgICA9IC9eIyhbXFx3LV0rKSQvLFxyXG4gICAgU0VMRUNUT1JfVEFHICAgICAgICA9IC9eW1xcdy1dKyQvLFxyXG4gICAgU0VMRUNUT1JfQ0xBU1MgICAgICA9IC9eXFwuKFtcXHctXSspJC8sXHJcbiAgICBQT1NJVElPTiAgICAgICAgICAgID0gL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvLFxyXG4gICAgTlVNX05PTl9QWCAgICAgICAgICA9IG5ldyBSZWdFeHAoJ14oJyArICgvWystXT8oPzpcXGQqXFwufClcXGQrKD86W2VFXVsrLV0/XFxkK3wpLykuc291cmNlICsgJykoPyFweClbYS16JV0rJCcsICdpJyksXHJcbiAgICBTSU5HTEVfVEFHICAgICAgICAgID0gL148KFxcdyspXFxzKlxcLz8+KD86PFxcL1xcMT58KSQvLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFwIG9mIHBhcmVudCB0YWcgbmFtZXMgdG8gdGhlIGNoaWxkIHRhZ3MgdGhhdCByZXF1aXJlIHRoZW0uXHJcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBQQVJFTlRfTUFQID0ge1xyXG4gICAgICAgIHRhYmxlOiAgICAvXjwoPzp0Ym9keXx0Zm9vdHx0aGVhZHxjb2xncm91cHxjYXB0aW9uKVxcYi8sXHJcbiAgICAgICAgdGJvZHk6ICAgIC9ePCg/OnRyKVxcYi8sXHJcbiAgICAgICAgdHI6ICAgICAgIC9ePCg/OnRkfHRoKVxcYi8sXHJcbiAgICAgICAgY29sZ3JvdXA6IC9ePCg/OmNvbClcXGIvLFxyXG4gICAgICAgIHNlbGVjdDogICAvXjwoPzpvcHRpb24pXFxiL1xyXG4gICAgfTtcclxuXHJcbi8vIGhhdmluZyBjYWNoZXMgaXNuJ3QgYWN0dWFsbHkgZmFzdGVyXHJcbi8vIGZvciBhIG1ham9yaXR5IG9mIHVzZSBjYXNlcyBmb3Igc3RyaW5nXHJcbi8vIG1hbmlwdWxhdGlvbnNcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBudW1Ob3RQeDogICAgICAgKHZhbCkgPT4gTlVNX05PTl9QWC50ZXN0KHZhbCksXHJcbiAgICBwb3NpdGlvbjogICAgICAgKHZhbCkgPT4gUE9TSVRJT04udGVzdCh2YWwpLFxyXG4gICAgc2luZ2xlVGFnTWF0Y2g6ICh2YWwpID0+IFNJTkdMRV9UQUcuZXhlYyh2YWwpLFxyXG4gICAgaXNOb25lT3JUYWJsZTogIChzdHIpID0+IE5PTkVfT1JfVEFCTEUudGVzdChzdHIpLFxyXG4gICAgaXNGb2N1c2FibGU6ICAgIChzdHIpID0+IFRZUEVfVEVTVF9GT0NVU0FCTEUudGVzdChzdHIpLFxyXG4gICAgaXNDbGlja2FibGU6ICAgIChzdHIpID0+IFRZUEVfVEVTVF9DTElDS0FCTEUudGVzdChzdHIpLFxyXG4gICAgaXNTdHJpY3RJZDogICAgIChzdHIpID0+IFNFTEVDVE9SX0lELnRlc3Qoc3RyKSxcclxuICAgIGlzVGFnOiAgICAgICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9UQUcudGVzdChzdHIpLFxyXG4gICAgaXNDbGFzczogICAgICAgIChzdHIpID0+IFNFTEVDVE9SX0NMQVNTLnRlc3Qoc3RyKSxcclxuXHJcbiAgICBjYW1lbENhc2U6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZShUUlVOQ0FURV9NU19QUkVGSVgsICdtcy0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZShEQVNIX0NBVENILCAobWF0Y2gsIGxldHRlcikgPT4gbGV0dGVyLnRvVXBwZXJDYXNlKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQYXJlbnRUYWdOYW1lOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgdmFsID0gc3RyLnN1YnN0cigwLCAzMCk7XHJcbiAgICAgICAgZm9yICh2YXIgcGFyZW50VGFnTmFtZSBpbiBQQVJFTlRfTUFQKSB7XHJcbiAgICAgICAgICAgIGlmIChQQVJFTlRfTUFQW3BhcmVudFRhZ05hbWVdLnRlc3QodmFsKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudFRhZ05hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuICdkaXYnO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgRElWICAgID0gcmVxdWlyZSgnRElWJyksXHJcbiAgICBjcmVhdGUgPSByZXF1aXJlKCdESVYvY3JlYXRlJyksXHJcbiAgICBhICAgICAgPSBESVYucXVlcnlTZWxlY3RvcignYScpLFxyXG4gICAgc2VsZWN0ID0gY3JlYXRlKCdzZWxlY3QnKSxcclxuICAgIG9wdGlvbiA9IHNlbGVjdC5hcHBlbmRDaGlsZChjcmVhdGUoJ29wdGlvbicpKTtcclxuXHJcbnZhciB0ZXN0ID0gZnVuY3Rpb24odGFnTmFtZSwgdGVzdEZuKSB7XHJcbiAgICAvLyBBdm9pZCB2YXJpYWJsZSByZWZlcmVuY2VzIHRvIGVsZW1lbnRzIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFLlxyXG4gICAgcmV0dXJuIHRlc3RGbihjcmVhdGUodGFnTmFtZSkpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBVUkxzIGFyZW4ndCBtYW5pcHVsYXRlZFxyXG4gICAgLy8gKElFIG5vcm1hbGl6ZXMgaXQgYnkgZGVmYXVsdClcclxuICAgIGhyZWZOb3JtYWxpemVkOiBhLmdldEF0dHJpYnV0ZSgnaHJlZicpID09PSAnL2EnLFxyXG5cclxuICAgIC8vIENoZWNrIHRoZSBkZWZhdWx0IGNoZWNrYm94L3JhZGlvIHZhbHVlICgnJyBpbiBvbGRlciBXZWJLaXQ7ICdvbicgZWxzZXdoZXJlKVxyXG4gICAgY2hlY2tPbjogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiAhIWlucHV0LnZhbHVlO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgYW4gaW5wdXQgbWFpbnRhaW5zIGl0cyB2YWx1ZSBhZnRlciBiZWNvbWluZyBhIHJhZGlvXHJcbiAgICAvLyBTdXBwb3J0OiBNb2Rlcm4gYnJvd3NlcnMgb25seSAoTk9UIElFIDw9IDExKVxyXG4gICAgcmFkaW9WYWx1ZTogdGVzdCgnaW5wdXQnLCBmdW5jdGlvbihpbnB1dCkge1xyXG4gICAgICAgIGlucHV0LnZhbHVlID0gJ3QnO1xyXG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xyXG4gICAgICAgIHJldHVybiBpbnB1dC52YWx1ZSA9PT0gJ3QnO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgYSBzZWxlY3RlZC1ieS1kZWZhdWx0IG9wdGlvbiBoYXMgYSB3b3JraW5nIHNlbGVjdGVkIHByb3BlcnR5LlxyXG4gICAgLy8gKFdlYktpdCBkZWZhdWx0cyB0byBmYWxzZSBpbnN0ZWFkIG9mIHRydWUsIElFIHRvbywgaWYgaXQncyBpbiBhbiBvcHRncm91cClcclxuICAgIG9wdFNlbGVjdGVkOiBvcHRpb24uc2VsZWN0ZWQsXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG9wdGlvbnMgaW5zaWRlIGRpc2FibGVkIHNlbGVjdHMgYXJlbid0IG1hcmtlZCBhcyBkaXNhYmxlZFxyXG4gICAgLy8gKFdlYktpdCBtYXJrcyB0aGVtIGFzIGRpc2FibGVkKVxyXG4gICAgb3B0RGlzYWJsZWQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICBzZWxlY3QuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiAhb3B0aW9uLmRpc2FibGVkO1xyXG4gICAgfSgpKSxcclxuICAgIFxyXG4gICAgdGV4dENvbnRlbnQ6IERJVi50ZXh0Q29udGVudCAhPT0gdW5kZWZpbmVkLFxyXG5cclxuICAgIC8vIE1vZGVybiBicm93c2VycyBub3JtYWxpemUgXFxyXFxuIHRvIFxcbiBpbiB0ZXh0YXJlYSB2YWx1ZXMsXHJcbiAgICAvLyBidXQgSUUgPD0gMTEgKGFuZCBwb3NzaWJseSBuZXdlcikgZG8gbm90LlxyXG4gICAgdmFsdWVOb3JtYWxpemVkOiB0ZXN0KCd0ZXh0YXJlYScsIGZ1bmN0aW9uKHRleHRhcmVhKSB7XHJcbiAgICAgICAgdGV4dGFyZWEudmFsdWUgPSAnXFxyXFxuJztcclxuICAgICAgICByZXR1cm4gdGV4dGFyZWEudmFsdWUgPT09ICdcXG4nO1xyXG4gICAgfSksXHJcblxyXG4gICAgLy8gU3VwcG9ydDogSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgc2VsZWN0ZWRTZWxlY3RvcjogdGVzdCgnc2VsZWN0JywgZnVuY3Rpb24oc2VsZWN0KSB7XHJcbiAgICAgICAgc2VsZWN0LmlubmVySFRNTCA9ICc8b3B0aW9uIHZhbHVlPVwiMVwiPjE8L29wdGlvbj48b3B0aW9uIHZhbHVlPVwiMlwiIHNlbGVjdGVkPjI8L29wdGlvbj4nO1xyXG4gICAgICAgIHJldHVybiAhIXNlbGVjdC5xdWVyeVNlbGVjdG9yKCdvcHRpb25bc2VsZWN0ZWRdJyk7XHJcbiAgICB9KVxyXG59O1xyXG5cclxuLy8gUHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUVcclxuRElWID0gYSA9IHNlbGVjdCA9IG9wdGlvbiA9IG51bGw7XHJcbiIsInZhciBleGlzdHMgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBcnJheSAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCdpcy9hcnJheUxpa2UnKSxcclxuICAgIGlzTm9kZUxpc3QgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIHNsaWNlICAgICAgID0gcmVxdWlyZSgndXRpbC9zbGljZScpO1xyXG5cclxudmFyIF8gPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIEZsYXR0ZW4gdGhhdCBhbHNvIGNoZWNrcyBpZiB2YWx1ZSBpcyBhIE5vZGVMaXN0XHJcbiAgICBmbGF0dGVuOiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvUHg6ICh2YWx1ZSkgPT4gdmFsdWUgKyAncHgnLFxyXG4gICAgXHJcbiAgICBwYXJzZUludDogKG51bSkgPT4gcGFyc2VJbnQobnVtLCAxMCksXHJcblxyXG4gICAgZXZlcnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcnIpKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmICghaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICAgICAgb2JqICA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGxlbiAgPSBhcmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCFvYmogfHwgbGVuIDwgMikgeyByZXR1cm4gb2JqOyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3NbaWR4XTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN0YW5kYXJkIG1hcFxyXG4gICAgbWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEFycmF5LXByZXNlcnZpbmcgbWFwXHJcbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9wdXNoLW1hcC12cy1pbmRleC1yZXBsYWNlbWVudC1tYXBcclxuICAgIGZhc3RtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBpdGVyYXRvcihhcnJbaWR4XSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcblxyXG4gICAgICAgIGlmIChhcnIgJiYgYXJyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhcnJbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoYXJyICYmIGFyci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBwdWxsZWQgZnJvbSBBTURcclxuICAgIHR5cGVjYXN0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICB2YXIgcjtcclxuICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gJ251bGwnKSB7XHJcbiAgICAgICAgICAgIHIgPSBudWxsO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgciA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICdmYWxzZScpIHtcclxuICAgICAgICAgICAgciA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSB1bmRlZmluZWQgfHwgdmFsID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICByID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnJyB8fCBpc05hTih2YWwpKSB7XHJcbiAgICAgICAgICAgIC8vIGlzTmFOKCcnKSByZXR1cm5zIGZhbHNlXHJcbiAgICAgICAgICAgIHIgPSB2YWw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcGFyc2VGbG9hdChudWxsIHx8ICcnKSByZXR1cm5zIE5hTlxyXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdCh2YWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcjtcclxuICAgIH0sXHJcblxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgaWYgKCFvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2Uob2JqKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhcnIsXHJcbiAgICAgICAgICAgIGxlbiA9ICtvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG5cclxuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICAgICAgYXJyID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgYXJyW2lkeF0gPSBvYmpbaWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICBhcnIucHVzaChvYmpba2V5XSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VBcnJheTogKGFyZykgPT5cclxuICAgICAgICAhZXhpc3RzKGFyZykgPyBbXSA6XHJcbiAgICAgICAgaXNBcnJheUxpa2UoYXJnKSA/IHNsaWNlKGFyZykgOiBbIGFyZyBdLFxyXG5cclxuICAgIGNvbnRhaW5zOiAoYXJyLCBpdGVtKSA9PiBhcnIuaW5kZXhPZihpdGVtKSAhPT0gLTEsXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdGVyYXRvcikge1xyXG4gICAgICAgIGlmICghb2JqIHx8ICFpdGVyYXRvcikgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7XHJcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gK2xlbmd0aCkge1xyXG4gICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtpZHhdLCBpZHgsIG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XHJcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0ga2V5cy5sZW5ndGg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9ialtrZXlzW2lkeF1dLCBrZXlzW2lkeF0sIG9iaik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sXHJcblxyXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gc2Vjb25kLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMCxcclxuICAgICAgICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gR28gdGhyb3VnaCBlYWNoIGVsZW1lbnQgaW4gdGhlXHJcbiAgICAgICAgLy8gc2Vjb25kIGFycmF5IGFuZCBhZGQgaXQgdG8gdGhlXHJcbiAgICAgICAgLy8gZmlyc3RcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2lkeF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJzdC5sZW5ndGggPSBpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmlyc3Q7XHJcbiAgICB9XHJcbn07IiwidmFyIGRlbGV0ZXIgPSAoZGVsZXRhYmxlKSA9PlxyXG4gICAgZGVsZXRhYmxlID8gXHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBkZWxldGUgc3RvcmVba2V5XTsgfSA6XHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBzdG9yZVtrZXldID0gdW5kZWZpbmVkOyB9O1xyXG5cclxudmFyIGdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBzdG9yZSAmJiBzdG9yZVtrZXldICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5LCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgZGVsKHN0b3JlLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgYmlMZXZlbEdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciBoYXMxID0ga2V5MSBpbiBzdG9yZSAmJiBzdG9yZVtrZXkxXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBpZiAoIWhhczEgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhczE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBrZXkyIGluIHN0b3JlW2tleTFdICYmIHN0b3JlW2tleTFdW2tleTJdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyByZWYxIDogKHJlZjEgIT09IHVuZGVmaW5lZCA/IHJlZjFba2V5Ml0gOiByZWYxKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5MSwga2V5MiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5MSwga2V5MiwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIC8vIEVhc3kgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbChzdG9yZSwga2V5MSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERlZXAgcmVtb3ZhbFxyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdIHx8IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgZGVsKHJlZjEsIGtleTIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGx2bCwgZGVsZXRhYmxlKSB7XHJcbiAgICByZXR1cm4gbHZsID09PSAyID8gYmlMZXZlbEdldHRlclNldHRlcihkZWxldGFibGUpIDogZ2V0dGVyU2V0dGVyKGRlbGV0YWJsZSk7XHJcbn07IiwidmFyIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMuc2V0ID0gKEQpID0+IGNvbnN0cnVjdG9yID0gRDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiArdmFsdWUubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGg7XHJcbiIsInZhciBET0NVTUVOVF9GUkFHTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICByZXR1cm4gZWxlbSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLm93bmVyRG9jdW1lbnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0gIT09IGRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUubm9kZVR5cGUgIT09IERPQ1VNRU5UX0ZSQUdNRU5UICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5pc1BhcnNlSHRtbEZyYWdtZW50ICE9PSB0cnVlO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2U7XHJcbiIsInZhciBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNEICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgaXNEKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSBkb2N1bWVudDtcclxuIiwidmFyIGlzV2luZG93ID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBFTEVNRU5UICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIHZhbHVlICYmICh2YWx1ZSA9PT0gZG9jdW1lbnQgfHwgaXNXaW5kb3codmFsdWUpIHx8IHZhbHVlLm5vZGVUeXBlID09PSBFTEVNRU5UKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGw7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgdmFyIHRleHQgPSB2YWx1ZS50cmltKCk7XHJcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApID09PSAnPCcgJiYgdGV4dC5jaGFyQXQodGV4dC5sZW5ndGggLSAxKSA9PT0gJz4nICYmIHRleHQubGVuZ3RoID49IDMpO1xyXG59OyIsIi8vIE5vZGVMaXN0IGNoZWNrLiBGb3Igb3VyIHB1cnBvc2VzLCBhIE5vZGVMaXN0IGFuZCBhbiBIVE1MQ29sbGVjdGlvbiBhcmUgdGhlIHNhbWUuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSAmJiAoXHJcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBOb2RlTGlzdCB8fFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb25cclxuICAgICk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XHJcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAoISF2YWx1ZSAmJiB0eXBlID09PSAnb2JqZWN0Jyk7XHJcbn07IiwidmFyIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbCkgPT5cclxuICAgIHZhbCAmJiAoaXNTdHJpbmcodmFsKSB8fCBpc0Z1bmN0aW9uKHZhbCkgfHwgaXNFbGVtZW50KHZhbCkgfHwgaXNDb2xsZWN0aW9uKHZhbCkpOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gdmFsdWUud2luZG93O1xyXG4iLCJ2YXIgRUxFTUVOVCAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIERJViAgICAgICAgICAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgLy8gU3VwcG9ydDogSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBtYXRjaGVzU2VsZWN0b3IgPSBESVYubWF0Y2hlcyAgICAgICAgICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubWF0Y2hlc1NlbGVjdG9yICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubXNNYXRjaGVzU2VsZWN0b3IgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubW96TWF0Y2hlc1NlbGVjdG9yICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYub01hdGNoZXNTZWxlY3RvcjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIHNlbGVjdG9yKSA9PlxyXG4gICAgZWxlbS5ub2RlVHlwZSA9PT0gRUxFTUVOVCA/IG1hdGNoZXNTZWxlY3Rvci5jYWxsKGVsZW0sIHNlbGVjdG9yKSA6IGZhbHNlO1xyXG5cclxuLy8gUHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUVcclxuRElWID0gbnVsbDtcclxuIiwiLy8gZGlmZmVycyBmcm9tIGZvckVhY2ggaW4gdGhhdCB0aGUgaWR4IChvciBrZXkpIGlzIGZpcnN0LCB0aGVuIHRoZSB2YWx1ZVxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IpIHtcclxuICAgIGlmICghb2JqIHx8ICFpdGVyYXRvcikgeyByZXR1cm47IH1cclxuXHJcbiAgICAvLyBBcnJheSBzdXBwb3J0XHJcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaXRlbTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpdGVtID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGl0ZW0sIGlkeCwgaXRlbSkgPT09IGZhbHNlKSB7IHJldHVybjsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9iamVjdCBzdXBwb3J0XHJcbiAgICB2YXIga2V5LCB2YWx1ZTtcclxuICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgIHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwodmFsdWUsIGtleSwgdmFsdWUpID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgIH1cclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IpIHtcclxuICAgIGlmICghb2JqIHx8ICFpdGVyYXRvcikgeyByZXR1cm47IH1cclxuXHJcbiAgICAvLyBBcnJheSBzdXBwb3J0XHJcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaXRlbTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpdGVtID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGl0ZW0sIGl0ZW0sIGlkeCkgPT09IGZhbHNlKSB7IHJldHVybjsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9iamVjdCBzdXBwb3J0XHJcbiAgICB2YXIga2V5LCB2YWx1ZTtcclxuICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgIHZhbHVlID0gb2JqW2tleV07XHJcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwodmFsdWUsIHZhbHVlLCBrZXkpID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgIH1cclxufTsiLCJ2YXIgRCAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIHNsaWNlICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyksXHJcbiAgICBmb3JFYWNoID0gcmVxdWlyZSgnLi9mb3JFYWNoJyksXHJcbiAgICBtYXAgICAgID0gcmVxdWlyZSgnLi9tYXAnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHNsaWNlKHRoaXMpOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAraW5kZXg7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbXHJcbiAgICAgICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgICAgIC8vIGlmIG5lZ2F0aXZlLCBvciB0aGUgc3RhcnQgb2YgdGhlIHNldCBpZiBwb3NpdGl2ZVxyXG4gICAgICAgICAgICBpZHggPCAwID8gdGhpcy5sZW5ndGggKyBpZHggOiBpZHhcclxuICAgICAgICBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgIHJldHVybiBEKHNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBmb3JFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBmb3JFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgaWYgKCFhcnIubGVuZ3RoIHx8ICFpdGVyYXRvcikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgIGl0ZW07XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25jYXQgZmxhdCBmb3IgYSBzaW5nbGUgYXJyYXkgb2YgYXJyYXlzXHJcbiAgICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCByZXN1bHRzKTtcclxufTsiLCJ2YXIgb3JkZXIgPSByZXF1aXJlKCdvcmRlcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICB2YXIgaGFzRHVwbGljYXRlcyA9IG9yZGVyLnNvcnQocmVzdWx0cyk7XHJcbiAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgZWxlbSxcclxuICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgIC8vIHNvIHRoYXQgYSBuZXcgYXJyYXkgaXNuJ3RcclxuICAgICAgICAvLyBjcmVhdGVkL2Rlc3Ryb3llZCBldmVyeSB1bmlxdWUgY2FsbFxyXG4gICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAvLyBHbyB0aHJvdWdoIHRoZSBhcnJheSBhbmQgaWRlbnRpZnlcclxuICAgIC8vIHRoZSBkdXBsaWNhdGVzIHRvIGJlIHJlbW92ZWRcclxuICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgIGlmIChlbGVtID09PSByZXN1bHRzW2lkeF0pIHtcclxuICAgICAgICAgICAgZHVwbGljYXRlcy5wdXNoKGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgcmVzdWx0cy5zcGxpY2UoZHVwbGljYXRlc1tpZHhdLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgICAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc0VsZW1lbnQnKSxcclxuICAgIGlzTm9kZU5hbWUgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIG5ld2xpbmVzICAgICAgICAgICAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIEVMRU1FTlQgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBzcGxpdCAgICAgPSByZXF1aXJlKCdzdHJpbmcvc3BsaXQnKSxcclxuICAgIGlzRW1wdHkgICA9IHJlcXVpcmUoJ3N0cmluZy9pc0VtcHR5Jyk7XHJcblxyXG52YXIgYWRkQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QuYWRkKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LnRvZ2dsZShuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgZG91YmxlQ2xhc3NMb29wID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzLCBtZXRob2QpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBlbGVtID0gZWxlbXNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICAgICAgY2xhc3NMaXN0ID0gZWxlbS5jbGFzc0xpc3Q7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZChjbGFzc0xpc3QsIG5hbWVzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvQW55RWxlbXNIYXZlQ2xhc3MgPSBmdW5jdGlvbihlbGVtcywgbmFtZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tpZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tpZHhdLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbENsYXNzZXMgPSBmdW5jdGlvbihlbGVtcykge1xyXG4gICAgICAgIHZhciBpZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tpZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGVsZW1zW2lkeF0uY2xhc3NOYW1lID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtcztcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggJiYgIWlzRW1wdHkobmFtZSkgPyBkb0FueUVsZW1zSGF2ZUNsYXNzKHRoaXMsIG5hbWUpIDogZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkgeyBuYW1lcyA9IHNwbGl0KG5hbWVzKTsgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5hbWVzLmxlbmd0aCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lcywgYWRkQ2xhc3MpIDogdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUFsbENsYXNzZXModGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCByZW1vdmVDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzOiBmdW5jdGlvbihuYW1lcywgc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgdmFyIG5hbWVMaXN0O1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCAhdGhpcy5sZW5ndGggfHwgIShuYW1lTGlzdCA9IHNwbGl0KG5hbWVzKSkubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaG91bGRBZGQgPT09IHVuZGVmaW5lZCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgdG9nZ2xlQ2xhc3MpIDpcclxuICAgICAgICAgICAgc2hvdWxkQWRkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCBhZGRDbGFzcykgOlxyXG4gICAgICAgICAgICBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIHJlbW92ZUNsYXNzKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNEb2N1bWVudCA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Jvb2xlYW4gID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBET0NVTUVOVCAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncyA9IHtcclxuICAgIGRpc3BsYXk6ICAgICdibG9jaycsXHJcbiAgICBwb3NpdGlvbjogICAnYWJzb2x1dGUnLFxyXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcclxufTtcclxuXHJcbnZhciBnZXREb2N1bWVudERpbWVuc2lvbiA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIC8vIEVpdGhlciBzY3JvbGxbV2lkdGgvSGVpZ2h0XSBvciBvZmZzZXRbV2lkdGgvSGVpZ2h0XSBvclxyXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0sIHdoaWNoZXZlciBpcyBncmVhdGVzdFxyXG4gICAgdmFyIGRvYyA9IGVsZW0uZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KFxyXG4gICAgICAgIGVsZW0uYm9keVsnc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGVsZW0uYm9keVsnb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBkb2NbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydjbGllbnQnICsgbmFtZV1cclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgaGlkZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9LFxyXG4gICAgc2hvdyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgY3NzU3dhcCA9IGZ1bmN0aW9uKGVsZW0sIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG9sZCA9IHt9O1xyXG5cclxuICAgICAgICAvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvbGRbbmFtZV0gPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhlbGVtKTtcclxuXHJcbiAgICAgICAgLy8gUmV2ZXJ0IHRoZSBvbGQgdmFsdWVzXHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9sZFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEF2b2lkcyBhbiAnSWxsZWdhbCBJbnZvY2F0aW9uJyBlcnJvciAoQ2hyb21lKVxyXG4gICAgLy8gQXZvaWRzIGEgJ1R5cGVFcnJvcjogQXJndW1lbnQgMSBvZiBXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkb2VzIG5vdCBpbXBsZW1lbnQgaW50ZXJmYWNlIEVsZW1lbnQnIGVycm9yIChGaXJlZm94KVxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZSA9IChlbGVtKSA9PlxyXG4gICAgICAgIGlzRWxlbWVudChlbGVtKSAmJiAhaXNXaW5kb3coZWxlbSkgJiYgIWlzRG9jdW1lbnQoZWxlbSkgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSA6IG51bGwsXHJcblxyXG4gICAgX3dpZHRoID0ge1xyXG4gICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBET0NVTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdXaWR0aCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAod2lkdGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUud2lkdGggPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9oZWlnaHQgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IERPQ1VNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ0hlaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBnZXRXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG5cclxuICAgIC8vIFN0YXJ0IHdpdGggb2Zmc2V0IHByb3BlcnR5LCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIHRoZSBib3JkZXItYm94IHZhbHVlXHJcbiAgICB2YXIgdmFsdWVJc0JvcmRlckJveCA9IHRydWUsXHJcbiAgICAgICAgdmFsID0gKG5hbWUgPT09ICd3aWR0aCcpID8gZWxlbS5vZmZzZXRXaWR0aCA6IGVsZW0ub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICAgIHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgaXNCb3JkZXJCb3ggPSBzdHlsZXMuYm94U2l6aW5nID09PSAnYm9yZGVyLWJveCc7XHJcblxyXG4gICAgLy8gc29tZSBub24taHRtbCBlbGVtZW50cyByZXR1cm4gdW5kZWZpbmVkIGZvciBvZmZzZXRXaWR0aCwgc28gY2hlY2sgZm9yIG51bGwvdW5kZWZpbmVkXHJcbiAgICAvLyBzdmcgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02NDkyODVcclxuICAgIC8vIE1hdGhNTCAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTQ5MTY2OFxyXG4gICAgaWYgKHZhbCA8PSAwIHx8ICFleGlzdHModmFsKSkge1xyXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBjb21wdXRlZCB0aGVuIHVuY29tcHV0ZWQgY3NzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgIHZhbCA9IGN1ckNzcyhlbGVtLCBuYW1lLCBzdHlsZXMpO1xyXG4gICAgICAgIGlmICh2YWwgPCAwIHx8ICF2YWwpIHsgdmFsID0gZWxlbS5zdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlZCB1bml0IGlzIG5vdCBwaXhlbHMuIFN0b3AgaGVyZSBhbmQgcmV0dXJuLlxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeCh2YWwpKSB7IHJldHVybiB2YWw7IH1cclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0aGUgY2hlY2sgZm9yIHN0eWxlIGluIGNhc2UgYSBicm93c2VyIHdoaWNoIHJldHVybnMgdW5yZWxpYWJsZSB2YWx1ZXNcclxuICAgICAgICAvLyBmb3IgZ2V0Q29tcHV0ZWRTdHlsZSBzaWxlbnRseSBmYWxscyBiYWNrIHRvIHRoZSByZWxpYWJsZSBlbGVtLnN0eWxlXHJcbiAgICAgICAgdmFsdWVJc0JvcmRlckJveCA9IGlzQm9yZGVyQm94ICYmIHZhbCA9PT0gc3R5bGVzW25hbWVdO1xyXG5cclxuICAgICAgICAvLyBOb3JtYWxpemUgJycsIGF1dG8sIGFuZCBwcmVwYXJlIGZvciBleHRyYVxyXG4gICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVzZSB0aGUgYWN0aXZlIGJveC1zaXppbmcgbW9kZWwgdG8gYWRkL3N1YnRyYWN0IGlycmVsZXZhbnQgc3R5bGVzXHJcbiAgICByZXR1cm4gXy50b1B4KFxyXG4gICAgICAgIHZhbCArIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0KFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnLFxyXG4gICAgICAgICAgICB2YWx1ZUlzQm9yZGVyQm94LFxyXG4gICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICApXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIENTU19FWFBBTkQgPSBzcGxpdCgnVG9wfFJpZ2h0fEJvdHRvbXxMZWZ0Jyk7XHJcbnZhciBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGV4dHJhLCBpc0JvcmRlckJveCwgc3R5bGVzKSB7XHJcbiAgICB2YXIgdmFsID0gMCxcclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHJpZ2h0IG1lYXN1cmVtZW50LCBhdm9pZCBhdWdtZW50YXRpb25cclxuICAgICAgICBpZHggPSAoZXh0cmEgPT09IChpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnKSkgP1xyXG4gICAgICAgICAgICA0IDpcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGluaXRpYWxpemUgZm9yIGhvcml6b250YWwgb3IgdmVydGljYWwgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAobmFtZSA9PT0gJ3dpZHRoJykgP1xyXG4gICAgICAgICAgICAxIDpcclxuICAgICAgICAgICAgMCxcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIC8vIFB1bGxlZCBvdXQgb2YgdGhlIGxvb3AgdG8gcmVkdWNlIHN0cmluZyBjb21wYXJpc29uc1xyXG4gICAgICAgIGV4dHJhSXNNYXJnaW4gID0gKGV4dHJhID09PSAnbWFyZ2luJyksXHJcbiAgICAgICAgZXh0cmFJc0NvbnRlbnQgPSAoIWV4dHJhSXNNYXJnaW4gJiYgZXh0cmEgPT09ICdjb250ZW50JyksXHJcbiAgICAgICAgZXh0cmFJc1BhZGRpbmcgPSAoIWV4dHJhSXNNYXJnaW4gJiYgIWV4dHJhSXNDb250ZW50ICYmIGV4dHJhID09PSAncGFkZGluZycpO1xyXG5cclxuICAgIGZvciAoOyBpZHggPCA0OyBpZHggKz0gMikge1xyXG4gICAgICAgIHR5cGUgPSBDU1NfRVhQQU5EW2lkeF07XHJcblxyXG4gICAgICAgIC8vIGJvdGggYm94IG1vZGVscyBleGNsdWRlIG1hcmdpbiwgc28gYWRkIGl0IGlmIHdlIHdhbnQgaXRcclxuICAgICAgICBpZiAoZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbZXh0cmEgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0JvcmRlckJveCkge1xyXG5cclxuICAgICAgICAgICAgLy8gYm9yZGVyLWJveCBpbmNsdWRlcyBwYWRkaW5nLCBzbyByZW1vdmUgaXQgaWYgd2Ugd2FudCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IF8ucGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBib3JkZXIgbm9yIG1hcmdpbiwgc28gcmVtb3ZlIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoIWV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGUgKyAnV2lkdGgnXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCwgc28gYWRkIHBhZGRpbmdcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCBub3IgcGFkZGluZywgc28gYWRkIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc1BhZGRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWw7XHJcbn07XHJcblxyXG52YXIgY3VyQ3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgY29tcHV0ZWQpIHtcclxuICAgIHZhciBzdHlsZSA9IGVsZW0uc3R5bGUsXHJcbiAgICAgICAgc3R5bGVzID0gY29tcHV0ZWQgfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICByZXQgPSBzdHlsZXMgPyBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKSB8fCBzdHlsZXNbbmFtZV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQXZvaWQgc2V0dGluZyByZXQgdG8gZW1wdHkgc3RyaW5nIGhlcmVcclxuICAgIC8vIHNvIHdlIGRvbid0IGRlZmF1bHQgdG8gYXV0b1xyXG4gICAgaWYgKCFleGlzdHMocmV0KSAmJiBzdHlsZSAmJiBzdHlsZVtuYW1lXSkgeyByZXQgPSBzdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgIC8vIEZyb20gdGhlIGhhY2sgYnkgRGVhbiBFZHdhcmRzXHJcbiAgICAvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXHJcblxyXG4gICAgaWYgKHN0eWxlcykge1xyXG4gICAgICAgIGlmIChyZXQgPT09ICcnICYmICFpc0F0dGFjaGVkKGVsZW0pKSB7XHJcbiAgICAgICAgICAgIHJldCA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgcmVndWxhciBwaXhlbCBudW1iZXJcclxuICAgICAgICAvLyBidXQgYSBudW1iZXIgdGhhdCBoYXMgYSB3ZWlyZCBlbmRpbmcsIHdlIG5lZWQgdG8gY29udmVydCBpdCB0byBwaXhlbHNcclxuICAgICAgICAvLyBidXQgbm90IHBvc2l0aW9uIGNzcyBhdHRyaWJ1dGVzLCBhcyB0aG9zZSBhcmUgcHJvcG9ydGlvbmFsIHRvIHRoZSBwYXJlbnQgZWxlbWVudCBpbnN0ZWFkXHJcbiAgICAgICAgLy8gYW5kIHdlIGNhbid0IG1lYXN1cmUgdGhlIHBhcmVudCBpbnN0ZWFkIGJlY2F1c2UgaXQgbWlnaHQgdHJpZ2dlciBhICdzdGFja2luZyBkb2xscycgcHJvYmxlbVxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeChyZXQpICYmICFSRUdFWC5wb3NpdGlvbihuYW1lKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICBycyA9IGVsZW0ucnVudGltZVN0eWxlLFxyXG4gICAgICAgICAgICAgICAgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDsgfVxyXG5cclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IChuYW1lID09PSAnZm9udFNpemUnKSA/ICcxZW0nIDogcmV0O1xyXG4gICAgICAgICAgICByZXQgPSBfLnRvUHgoc3R5bGUucGl4ZWxMZWZ0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IHJzTGVmdDsgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0ID09PSB1bmRlZmluZWQgPyByZXQgOiByZXQgKyAnJyB8fCAnYXV0byc7XHJcbn07XHJcblxyXG52YXIgbm9ybWFsaXplQ3NzS2V5ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgcmV0dXJuIFJFR0VYLmNhbWVsQ2FzZShuYW1lKTtcclxufTtcclxuXHJcbnZhciBzZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgZWxlbS5zdHlsZVtuYW1lXSA9ICh2YWx1ZSA9PT0gK3ZhbHVlKSA/IF8udG9QeCh2YWx1ZSkgOiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVtuYW1lXTtcclxufTtcclxuXHJcbnZhciBpc0hpZGRlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQ6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC5vZmZzZXRQYXJlbnRcclxuICAgIHJldHVybiBlbGVtLm9mZnNldFBhcmVudCA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAvLyBTdXBwb3J0OiBPcGVyYSA8PSAxMi4xMlxyXG4gICAgICAgICAgICAvLyBPcGVyYSByZXBvcnRzIG9mZnNldFdpZHRocyBhbmQgb2Zmc2V0SGVpZ2h0cyBsZXNzIHRoYW4gemVybyBvbiBzb21lIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwIHx8XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICgoZWxlbS5zdHlsZSAmJiBlbGVtLnN0eWxlLmRpc3BsYXkpID8gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgOiBmYWxzZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGN1ckNzczogY3VyQ3NzLFxyXG4gICAgd2lkdGg6ICBfd2lkdGgsXHJcbiAgICBoZWlnaHQ6IF9oZWlnaHQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjc3M6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwgbmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIGtleSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghaWR4KSB7IHJldHVybiByZXQ7IH0gLy8gcmV0dXJuIGVhcmx5XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXRbdmFsdWVdID0gZ2V0U3R5bGUoZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGhpZGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgc2hvdyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNCb29sZWFuKHN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gaXNIaWRkZW4oZWxlbSkgPyBzaG93KGVsZW0pIDogaGlkZShlbGVtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgyLCB0cnVlKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIEFDQ0VTU09SICA9ICdfX0RfaWRfXyAnLFxyXG4gICAgdW5pcXVlSWQgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoRGF0ZS5ub3coKSksXHJcblxyXG4gICAgZ2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0gPyBlbGVtW0FDQ0VTU09SXSA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE9yU2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghZWxlbSB8fCAoaWQgPSBlbGVtW0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtBQ0NFU1NPUl0gPSAoaWQgPSB1bmlxdWVJZCgpKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc0RhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5oYXMoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IGdldE9yU2V0SWQoZWxlbSk7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZURhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVtb3ZlOiAoZWxlbSwgc3RyKSA9PlxyXG4gICAgICAgIHN0ciA9PT0gdW5kZWZpbmVkID8gcmVtb3ZlQWxsRGF0YShlbGVtKSA6IHJlbW92ZURhdGEoZWxlbSwgc3RyKSxcclxuXHJcbiAgICBEOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldERhdGEoZWxlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHBhc3NlZFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWxsRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzRGF0YTogKGVsZW0pID0+XHJcbiAgICAgICAgICAgIGlzRWxlbWVudChlbGVtKSA/IGhhc0RhdGEoZWxlbSkgOiB0aGlzLFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGtleTtcclxuICAgICAgICAgICAgICAgIHZhciBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVBbGxEYXRhKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQga2V5J3MgdmFsdWVcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbZWxlbUlkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJySWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcnJJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2FycklkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzTnVtYmVyID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBjc3MgICAgICA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG52YXIgZ2V0SW5uZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdMZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdSaWdodCcpKSB8fCAwKTtcclxuICAgIH0sXHJcbiAgICBnZXRJbm5lckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChlbGVtKSkgfHwgMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGhlaWdodCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0ZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBnZXRJbm5lcldpZHRoKGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICB3aWR0aCArPSAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblJpZ2h0JykpIHx8IDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyTGVmdFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclJpZ2h0V2lkdGgnKSkgfHwgMCk7XHJcbiAgICB9LFxyXG4gICAgZ2V0T3V0ZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IGdldElubmVySGVpZ2h0KGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICBoZWlnaHQgKz0gKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkJvdHRvbScpKSB8fCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJUb3BXaWR0aCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKSB8fCAwKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgd2lkdGg6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy53aWR0aC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhlaWdodDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLmhlaWdodC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lcldpZHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVyV2lkdGgoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lckhlaWdodDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lckhlaWdodChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVyV2lkdGg6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlcldpZHRoKGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlckhlaWdodDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVySGVpZ2h0KGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaGFuZGxlcnMgPSB7fTtcclxuXHJcbnZhciByZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUsIHR5cGUsIGZpbHRlcikge1xyXG4gICAgaGFuZGxlcnNbbmFtZV0gPSB7XHJcbiAgICAgICAgZXZlbnQ6IHR5cGUsXHJcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXHJcbiAgICAgICAgd3JhcDogZnVuY3Rpb24oZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIobmFtZSwgZm4pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgd3JhcHBlciA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcbiAgICBpZiAoIWZuKSB7IHJldHVybiBmbjsgfVxyXG5cclxuICAgIHZhciBrZXkgPSAnX19kY2VfJyArIG5hbWU7XHJcbiAgICBpZiAoZm5ba2V5XSkgeyByZXR1cm4gZm5ba2V5XTsgfVxyXG5cclxuICAgIHJldHVybiBmbltrZXldID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBtYXRjaCA9IGhhbmRsZXJzW25hbWVdLmZpbHRlcihlKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5yZWdpc3RlcignbGVmdC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAxICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdtaWRkbGUtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMiAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcigncmlnaHQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMyAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZWdpc3RlcjogcmVnaXN0ZXIsXHJcbiAgICBoYW5kbGVyczogaGFuZGxlcnNcclxufTsiLCJ2YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50JyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIG1hdGNoZXMgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgZGVsZWdhdGVzID0ge307XHJcblxyXG4vLyB0aGlzIG1ldGhvZCBjYWNoZXMgZGVsZWdhdGVzIHNvIHRoYXQgLm9mZigpIHdvcmtzIHNlYW1sZXNzbHlcclxudmFyIGRlbGVnYXRlID0gZnVuY3Rpb24ocm9vdCwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoZGVsZWdhdGVzW2ZuLl9kZF0pIHsgcmV0dXJuIGRlbGVnYXRlc1tmbi5fZGRdOyB9XHJcblxyXG4gICAgdmFyIGlkID0gZm4uX2RkID0gRGF0ZS5ub3coKTtcclxuICAgIHJldHVybiBkZWxlZ2F0ZXNbaWRdID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gcm9vdCkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGV2ZW50ZWQgPSBmdW5jdGlvbihtZXRob2QsIGVsLCB0eXBlLCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmICghZXhpc3RzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZm4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGRlbGVnYXRlKGVsLCBzZWxlY3RvciwgZm4pKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5hZGQpLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5yZW1vdmUpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5mYWJyaWNhdGUpXHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGRlbGVnYXRlICAgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyksXHJcbiAgICBjdXN0b20gICAgID0gcmVxdWlyZSgnLi9jdXN0b20nKTtcclxuXHJcbnZhciBldmVudGVyID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZXMsIGZpbHRlciwgZm4pIHtcclxuICAgICAgICB2YXIgdHlwZWxpc3QgPSB0eXBlcy5zcGxpdCgnICcpO1xyXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmbikpIHtcclxuICAgICAgICAgICAgZm4gPSBmaWx0ZXI7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0eXBlbGlzdCwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjdXN0b20uaGFuZGxlcnNbdHlwZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCBoYW5kbGVyLmV2ZW50LCBmaWx0ZXIsIGhhbmRsZXIud3JhcChmbikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgdHlwZSwgZmlsdGVyLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvbjogICAgICBldmVudGVyKGRlbGVnYXRlLm9uKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZXIoZGVsZWdhdGUub2ZmKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZXIoZGVsZWdhdGUudHJpZ2dlcilcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzRWxlbWVudCAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNIdG1sICAgICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzQ29sbGVjdGlvbiAgID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc1dpbmRvdyAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIG9yZGVyICAgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIGRhdGEgICAgICAgICAgID0gcmVxdWlyZSgnLi9kYXRhJyksXHJcbiAgICBwYXJzZXIgICAgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpO1xyXG5cclxudmFyIGVtcHR5ID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gYXJyW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBlbGVtLmNsb25lTm9kZSh0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZnJhZy50ZXh0Q29udGVudCA9IHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCBwYXJzZXIoZWxlbSksIHBlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHN0cmluZ1RvRnJhZyhyZXN1bHQpKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNFbGVtZW50KHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHJlc3VsdCwgcGVuZGVyKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSA9IGZ1bmN0aW9uKGFyck9uZSwgYXJyVHdvLCBwZW5kZXIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyT25lLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGxlbiA9IGFyclR3by5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihhcnJPbmVbaWR4XSwgYXJyVHdvW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVsZW0sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGFyckVsZW0sIGVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbSA9IGZ1bmN0aW9uKGVsZW0sIGFyciwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoZWxlbSwgYXJyRWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgfSxcclxuICAgIHByZXBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5pbnNlcnRCZWZvcmUoZWxlbSwgYmFzZS5maXJzdENoaWxkKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFwcGVuZCAgOiBhcHBlbmQsXHJcbiAgICBwcmVwZW5kIDogcHJlcGVuZCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmFzdG1hcCh0aGlzLnNsaWNlKCksIChlbGVtKSA9PiBjbG9uZShlbGVtKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIGFwcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluc2VydEJlZm9yZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGFyZ2V0LCB0aGlzLm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZnRlcjogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluc2VydEFmdGVyOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFwcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgICAgIGQuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHZhciBvYmogPSBkO1xyXG4gICAgICAgICAgICBEKG9iaikuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmVwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcodmFsdWUpLCBwcmVwZW5kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnKCcnICsgdmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBpZiAoaXNEKGQpKSB7XHJcbiAgICAgICAgICAgICAgICBkLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGVtcHR5KHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIC8vIFN0cmluZyBzZWxlY3RvclxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIEQoc2VsZWN0b3IpLmdldCgpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBfLnRvQXJyYXkoYXJyKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU2luZ2xlIGVsZW1lbnRcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSB8fCBpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBbIGVsZW0gXSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIEQodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIHJlbW92ZShhcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJlbW92ZSh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGV0YWNoOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIGRldGFjaChhcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIGRldGFjaCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBET0NfRUxFTSAgID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxudmFyIGdldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHJlY3QgPSBpc0F0dGFjaGVkKGVsZW0pID8gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiAgKHJlY3QudG9wICArIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSAgfHwgMCxcclxuICAgICAgICBsZWZ0OiAocmVjdC5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IGdldE9mZnNldChlbGVtKSxcclxuICAgICAgICBjdXJDU1NUb3AgICAgICAgICA9IGVsZW0uc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gZWxlbS5zdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBlbGVtLnN0eWxlLnRvcCAgPSBfLnRvUHgocHJvcHMudG9wKTtcclxuICAgIGVsZW0uc3R5bGUubGVmdCA9IF8udG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXQ6IGZ1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHtcclxuICAgIFxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0KGZpcnN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHx8IGlzT2JqZWN0KHBvc09ySXRlcmF0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT4gc2V0T2Zmc2V0KGVsZW0sIGlkeCwgcG9zT3JJdGVyYXRvcikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgb2Zmc2V0UGFyZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5tYXAodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IERPQ19FTEVNO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgKCFpc05vZGVOYW1lKG9mZnNldFBhcmVudCwgJ2h0bWwnKSAmJiAob2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnKSA9PT0gJ3N0YXRpYycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IERPQ19FTEVNO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBURVhUICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL1RFWFQnKSxcclxuICAgIENPTU1FTlQgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvQ09NTUVOVCcpLFxyXG4gICAgQVRUUklCVVRFICA9IHJlcXVpcmUoJ05PREVfVFlQRS9BVFRSSUJVVEUnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHByb3BGaXggPSBzcGxpdCgndGFiSW5kZXh8cmVhZE9ubHl8Y2xhc3NOYW1lfG1heExlbmd0aHxjZWxsU3BhY2luZ3xjZWxsUGFkZGluZ3xyb3dTcGFufGNvbFNwYW58dXNlTWFwfGZyYW1lQm9yZGVyfGNvbnRlbnRFZGl0YWJsZScpXHJcbiAgICAucmVkdWNlKGZ1bmN0aW9uKG9iaiwgc3RyKSB7XHJcbiAgICAgICAgb2JqW3N0ci50b0xvd2VyQ2FzZSgpXSA9IHN0cjtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSwge1xyXG4gICAgICAgICdmb3InOiAgICdodG1sRm9yJyxcclxuICAgICAgICAnY2xhc3MnOiAnY2xhc3NOYW1lJ1xyXG4gICAgfSk7XHJcblxyXG52YXIgcHJvcEhvb2tzID0ge1xyXG4gICAgc3JjOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NyYycsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaHJlZjogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdocmVmJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBTYWZhcmksIElFOStcclxuICAgIC8vIG1pcy1yZXBvcnRzIHRoZSBkZWZhdWx0IHNlbGVjdGVkIHByb3BlcnR5IG9mIGFuIG9wdGlvblxyXG4gICAgLy8gQWNjZXNzaW5nIHRoZSBwYXJlbnQncyBzZWxlY3RlZEluZGV4IHByb3BlcnR5IGZpeGVzIGl0XHJcbiAgICBzZWxlY3RlZDogU1VQUE9SVFMub3B0U2VsZWN0ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgIGZpeDtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGl0IGFsc28gd29ya3Mgd2l0aCBvcHRncm91cHMsIHNlZSAjNTcwMVxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRhYkluZGV4OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIGVsZW0udGFiSW5kZXggZG9lc24ndCBhbHdheXMgcmV0dXJuIHRoZSBjb3JyZWN0IHZhbHVlIHdoZW4gaXQgaGFzbid0IGJlZW4gZXhwbGljaXRseSBzZXRcclxuICAgICAgICAgICAgLy8gaHR0cDovL2ZsdWlkcHJvamVjdC5vcmcvYmxvZy8yMDA4LzAxLzA5L2dldHRpbmctc2V0dGluZy1hbmQtcmVtb3ZpbmctdGFiaW5kZXgtdmFsdWVzLXdpdGgtamF2YXNjcmlwdC9cclxuICAgICAgICAgICAgLy8gVXNlIHByb3BlciBhdHRyaWJ1dGUgcmV0cmlldmFsKCMxMjA3MilcclxuICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFiaW5kZXgpIHsgcmV0dXJuIF8ucGFyc2VJbnQodGFiaW5kZXgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZU5hbWUgPSBlbGVtLm5vZGVOYW1lO1xyXG4gICAgICAgICAgICByZXR1cm4gKFJFR0VYLmlzRm9jdXNhYmxlKG5vZGVOYW1lKSB8fCAoUkVHRVguaXNDbGlja2FibGUobm9kZU5hbWUpICYmIGVsZW0uaHJlZikpID8gMCA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRPclNldFByb3AgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcclxuXHJcbiAgICAvLyBkb24ndCBnZXQvc2V0IHByb3BlcnRpZXMgb24gdGV4dCwgY29tbWVudCBhbmQgYXR0cmlidXRlIG5vZGVzXHJcbiAgICBpZiAoIWVsZW0gfHwgbm9kZVR5cGUgPT09IFRFWFQgfHwgbm9kZVR5cGUgPT09IENPTU1FTlQgfHwgbm9kZVR5cGUgPT09IEFUVFJJQlVURSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3JTZXRQcm9wKGZpcnN0LCBwcm9wKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVQcm9wOiBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgZXhpc3RzICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBjb2VyY2VOdW0gPSAodmFsdWUpID0+XHJcbiAgICAvLyBJdHMgYSBudW1iZXIhIHx8IDAgdG8gYXZvaWQgTmFOIChhcyBOYU4ncyBhIG51bWJlcilcclxuICAgICt2YWx1ZSA9PT0gdmFsdWUgPyAodmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gQXZvaWQgTmFOIGFnYWluXHJcbiAgICBpc1N0cmluZyh2YWx1ZSkgPyAoK3ZhbHVlIHx8IDApIDpcclxuICAgIC8vIERlZmF1bHQgdG8gemVyb1xyXG4gICAgMDtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxMZWZ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbFRvcCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0cyA9IHRoaXMuZmluZCh0YXJnZXQpLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIGlzLm5vdCh0aGlzKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+ICFfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gIT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBEKCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY2hlY2tlciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+IGNoZWNrZXIuY2FsbChlbGVtLCBlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIEVMRU1FTlQgICAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIERPQ1VNRU5UICAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBET0NVTUVOVF9GUkFHTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXR0YWNoZWQgICAgICAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzRCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIEZpenpsZSAgICAgICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgZ2V0U2libGluZ3MgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc2licyA9IF9nZXROb2RlU2libGluZ3MoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYnMubGVuZ3RoKSB7IHJlc3VsdC5wdXNoKHNpYnMpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldE5vZGVTaWJsaW5ncyA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2licyA9IF8udG9BcnJheShwYXJlbnQuY2hpbGRyZW4pLFxyXG4gICAgICAgICAgICBpZHggID0gc2licy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAvLyBFeGNsdWRlIHRoZSBub2RlIGl0c2VsZiBmcm9tIHRoZSBsaXN0IG9mIGl0cyBwYXJlbnQncyBjaGlsZHJlblxyXG4gICAgICAgICAgICBpZiAoc2lic1tpZHhdID09PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2licztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2hpbGRyZW4gLS0tLS0tXHJcbiAgICBnZXRDaGlsZHJlbiA9IChhcnIpID0+IF8uZmxhdHRlbihfLm1hcChhcnIsIF9jaGlsZHJlbikpLFxyXG4gICAgX2NoaWxkcmVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBraWRzID0gZWxlbS5jaGlsZHJlbixcclxuICAgICAgICAgICAgaWR4ICA9IDAsIGxlbiAgPSBraWRzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyICA9IG5ldyBBcnJheShsZW4pO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0ga2lkc1tpZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnRzIC0tLS0tLVxyXG4gICAgZ2V0Q2xvc2VzdCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIGNsb3Nlc3QsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZWxlbXNbaWR4XSwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIHBhcmVudHMudW5zaGlmdChlbGVtc1tpZHhdKTtcclxuICAgICAgICAgICAgY2xvc2VzdCA9IHNlbGVjdG9yRmlsdGVyKHBhcmVudHMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKGNsb3Nlc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjbG9zZXN0WzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHMgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHNVbnRpbCA9IGZ1bmN0aW9uKGQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShkW2lkeF0sIG51bGwsIHN0b3BTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmF3bFVwTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gbm9kZSxcclxuICAgICAgICAgICAgbm9kZVR5cGU7XHJcblxyXG4gICAgICAgIHdoaWxlICgocGFyZW50ICAgPSBnZXROb2RlUGFyZW50KHBhcmVudCkpICYmXHJcbiAgICAgICAgICAgICAgIChub2RlVHlwZSA9IHBhcmVudC5ub2RlVHlwZSkgIT09IERPQ1VNRU5UICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50IC0tLS0tLVxyXG4gICAgZ2V0UGFyZW50ID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGdldE5vZGVQYXJlbnQoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkgeyByZXN1bHQucHVzaChwYXJlbnQpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFNhZmVseSBnZXQgcGFyZW50IG5vZGVcclxuICAgIGdldE5vZGVQYXJlbnQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQcmV2ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwcmV2ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykgJiYgcHJldi5ub2RlVHlwZSAhPT0gRUxFTUVOVCkge31cclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TmV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgbmV4dCA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykgJiYgbmV4dC5ub2RlVHlwZSAhPT0gRUxFTUVOVCkge31cclxuICAgICAgICByZXR1cm4gbmV4dDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UHJldkFsbCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHByZXYgICA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChwcmV2ID0gcHJldi5wcmV2aW91c1NpYmxpbmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmV2Lm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwcmV2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROZXh0QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgbmV4dCAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nKSkge1xyXG4gICAgICAgICAgICBpZiAobmV4dC5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsQWxsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGZpbHRlcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHsgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZyk7IH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJsaW5ncyA9IF8uZmlsdGVyKHNpYmxpbmdzLCBmaWx0ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbFVudGlsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGl0ZXJhdG9yO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaXRlcmF0b3IgPSBmdW5jdGlvbihzaWJsaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNNYXRjaCA9IGlzLm1hdGNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc01hdGNoO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChzaWJsaW5ncywgaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHVuaXF1ZVNvcnQgPSBmdW5jdGlvbihlbGVtcywgcmV2ZXJzZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB1bmlxdWUoZWxlbXMpO1xyXG4gICAgICAgIG9yZGVyLnNvcnQocmVzdWx0KTtcclxuICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRChyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXJBbmRTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCByZXZlcnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoc2VsZWN0b3JGaWx0ZXIoZWxlbXMsIHNlbGVjdG9yKSwgcmV2ZXJzZSk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNvbnRlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5mbGF0dGVuKFxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogcGx1Y2tcclxuICAgICAgICAgICAgICAgIF8ubWFwKHRoaXMsIChlbGVtKSA9PiBlbGVtLmNoaWxkTm9kZXMpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbmRleDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIHJldHVybiBEKHNlbGVjdG9yKS5pbmRleE9mKGZpcnN0KTsgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3RvclswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGZpcnN0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlzQXR0YWNoZWQgY2hlY2sgdG8gcGFzcyB0ZXN0IFwiTm9kZSB3aXRob3V0IHBhcmVudCByZXR1cm5zIC0xXCJcclxuICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IHBhcmVudC5ub2RlVHlwZSA9PT0gRE9DVU1FTlRfRlJBR01FTlQ7XHJcblxyXG4gICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSBFTEVNRU5UKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtdLmluZGV4T2YuYXBwbHkoY2hpbGRFbGVtcywgWyBmaXJzdCBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgbmV3bGluZXMgICA9IHJlcXVpcmUoJ3N0cmluZy9uZXdsaW5lcycpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdub2RlL2lzTmFtZScpLFxyXG4gICAgbm9ybWFsTmFtZSA9IHJlcXVpcmUoJ25vZGUvbm9ybWFsaXplTmFtZScpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBFTEVNRU5UICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKTtcclxuXHJcbnZhciBvdXRlckh0bWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPyB0aGlzWzBdLm91dGVySFRNTCA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHRHZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0pID0+IGVsZW0udGV4dENvbnRlbnQgOlxyXG4gICAgICAgICAgICAoZWxlbSkgPT4gZWxlbS5pbm5lclRleHQsXHJcblxyXG4gICAgdGV4dFNldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLnRleHRDb250ZW50ID0gc3RyIDpcclxuICAgICAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS5pbm5lclRleHQgPSBzdHI7XHJcblxyXG52YXIgdmFsSG9va3MgPSB7XHJcbiAgICBvcHRpb246IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gKGV4aXN0cyh2YWwpID8gdmFsIDogdGV4dEdldChlbGVtKSkudHJpbSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGluZGV4ICAgPSBlbGVtLnNlbGVjdGVkSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBvbmUgICAgID0gZWxlbS50eXBlID09PSAnc2VsZWN0LW9uZScgfHwgaW5kZXggPCAwLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IG9uZSA/IG51bGwgOiBbXSxcclxuICAgICAgICAgICAgICAgIG1heCAgICAgPSBvbmUgPyBpbmRleCArIDEgOiBvcHRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBpbmRleCA8IDAgPyBtYXggOiAob25lID8gaW5kZXggOiAwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIHNlbGVjdGVkIG9wdGlvbnNcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IG1heDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvbGRJRSBkb2Vzbid0IHVwZGF0ZSBzZWxlY3RlZCBhZnRlciBmb3JtIHJlc2V0ICgjMjU1MSlcclxuICAgICAgICAgICAgICAgIGlmICgob3B0aW9uLnNlbGVjdGVkIHx8IGlkeCA9PT0gaW5kZXgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHJldHVybiBvcHRpb25zIHRoYXQgYXJlIGRpc2FibGVkIG9yIGluIGEgZGlzYWJsZWQgb3B0Z3JvdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKFNVUFBPUlRTLm9wdERpc2FibGVkID8gIW9wdGlvbi5kaXNhYmxlZCA6IG9wdGlvbi5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICghb3B0aW9uLnBhcmVudE5vZGUuZGlzYWJsZWQgfHwgIWlzTm9kZU5hbWUob3B0aW9uLnBhcmVudE5vZGUsICdvcHRncm91cCcpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHNwZWNpZmljIHZhbHVlIGZvciB0aGUgb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgYW4gYXJyYXkgZm9yIG9uZSBzZWxlY3RzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aS1TZWxlY3RzIHJldHVybiBhbiBhcnJheVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25TZXQsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gXy5tYWtlQXJyYXkodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IG9wdGlvbnMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWVzLCB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gb3B0aW9uU2V0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZvcmNlIGJyb3dzZXJzIHRvIGJlaGF2ZSBjb25zaXN0ZW50bHkgd2hlbiBub24tbWF0Y2hpbmcgdmFsdWUgaXMgc2V0XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uU2V0KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNlbGVjdGVkSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn07XHJcblxyXG4vLyBSYWRpbyBhbmQgY2hlY2tib3ggZ2V0dGVyIGZvciBXZWJraXRcclxuaWYgKCFTVVBQT1JUUy5jaGVja09uKSB7XHJcbiAgICBfLmVhY2goWydyYWRpbycsICdjaGVja2JveCddLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgdmFsSG9va3NbdHlwZV0gPSB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydDogV2Via2l0IC0gJycgaXMgcmV0dXJuZWQgaW5zdGVhZCBvZiAnb24nIGlmIGEgdmFsdWUgaXNuJ3Qgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwgPyAnb24nIDogZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIGdldFZhbCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIGlmICghZWxlbSB8fCAoZWxlbS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5nZXQpIHtcclxuICAgICAgICByZXR1cm4gaG9vay5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXNTdHJpbmcodmFsKSA/IG5ld2xpbmVzKHZhbCkgOiB2YWw7XHJcbn07XHJcblxyXG52YXIgc3RyaW5naWZ5ID0gKHZhbHVlKSA9PlxyXG4gICAgIWV4aXN0cyh2YWx1ZSkgPyAnJyA6ICh2YWx1ZSArICcnKTtcclxuXHJcbnZhciBzZXRWYWwgPSBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgIGlmIChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIFN0cmluZ2lmeSB2YWx1ZXNcclxuICAgIHZhciB2YWx1ZSA9IGlzQXJyYXkodmFsKSA/IF8ubWFwKHZhbCwgc3RyaW5naWZ5KSA6IHN0cmluZ2lmeSh2YWwpO1xyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suc2V0KSB7XHJcbiAgICAgICAgaG9vay5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb3V0ZXJIdG1sOiBvdXRlckh0bWwsXHJcbiAgICBvdXRlckhUTUw6IG91dGVySHRtbCxcclxuXHJcbiAgICBodG1sOiBmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGVsZW0uaW5uZXJIVE1MID0gaHRtbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihodG1sKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBodG1sO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgcmV0dXJuICghZmlyc3QpID8gdW5kZWZpbmVkIDogZmlyc3QuaW5uZXJIVE1MO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWw6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgLy8gZ2V0dGVyXHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRWYWwodGhpc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWV4aXN0cyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sICcnKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZ2V0VmFsKGVsZW0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZXRWYWwoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNldHRlcnNcclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc3RyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiB0ZXh0U2V0KGVsZW0sIHN0cikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc3RyKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzdHI7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRTZXQoZWxlbSwgaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIHRleHRHZXQoZWxlbSkpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMsIChlbGVtKSA9PiB0ZXh0R2V0KGVsZW0pKS5qb2luKCcnKTtcclxuICAgIH1cclxufTsiLCJ2YXIgRUxFTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtKSA9PlxyXG4gICAgICAgIGVsZW0gJiYgZWxlbS5ub2RlVHlwZSA9PT0gRUxFTUVOVDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZWxlbSwgbmFtZSkgPT5cclxuICAgIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpOyIsIi8vIGNhY2hlIGlzIGp1c3Qgbm90IHdvcnRoIGl0IGhlcmVcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSAoZWxlbSkgPT4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4iLCJ2YXIgcmVhZHkgPSBmYWxzZSxcclxuICAgIHJlZ2lzdHJhdGlvbiA9IFtdO1xyXG5cclxudmFyIHdhaXQgPSBmdW5jdGlvbihmbikge1xyXG4gICAgLy8gQWxyZWFkeSBsb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgcmV0dXJuIGZuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhbmRhcmRzLWJhc2VkIGJyb3dzZXJzIHN1cHBvcnQgRE9NQ29udGVudExvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBJRSBldmVudCBtb2RlbCBpcyB1c2VkXHJcblxyXG4gICAgLy8gRW5zdXJlIGZpcmluZyBiZWZvcmUgb25sb2FkLCBtYXliZSBsYXRlIGJ1dCBzYWZlIGFsc28gZm9yIGlmcmFtZXNcclxuICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykgeyBmbigpOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBIGZhbGxiYWNrIHRvIHdpbmRvdy5vbmxvYWQsIHRoYXQgd2lsbCBhbHdheXMgd29ya1xyXG4gICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmbik7XHJcbn07XHJcblxyXG53YWl0KGZ1bmN0aW9uKCkge1xyXG4gICAgcmVhZHkgPSB0cnVlO1xyXG5cclxuICAgIC8vIGNhbGwgcmVnaXN0ZXJlZCBtZXRob2RzICAgIFxyXG4gICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgbGVuZ3RoID0gcmVnaXN0cmF0aW9uLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVnaXN0cmF0aW9uW2lkeF0oKTtcclxuICAgIH1cclxuICAgIHJlZ2lzdHJhdGlvbi5sZW5ndGggPSAwO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgIGlmIChyZWFkeSkge1xyXG4gICAgICAgIGNhbGxiYWNrKCk7IHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZWdpc3RyYXRpb24ucHVzaChjYWxsYmFjayk7XHJcbn07XHJcbiIsInZhciBpc0F0dGFjaGVkICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgRUxFTUVOVCAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIC8vIGh0dHA6Ly9lam9obi5vcmcvYmxvZy9jb21wYXJpbmctZG9jdW1lbnQtcG9zaXRpb24vXHJcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgQ09OVEFJTkVEX0JZID0gMTYsXHJcbiAgICBGT0xMT1dJTkcgICAgPSA0LFxyXG4gICAgRElTQ09OTkVDVEVEID0gMTtcclxuXHJcbnZhciBpcyA9IChyZWwsIGZsYWcpID0+IChyZWwgJiBmbGFnKSA9PT0gZmxhZztcclxuXHJcbnZhciBpc05vZGUgPSAoYiwgZmxhZywgYSkgPT4gaXMoX2NvbXBhcmVQb3NpdGlvbihhLCBiKSwgZmxhZyk7XHJcblxyXG4vLyBDb21wYXJlIFBvc2l0aW9uIC0gTUlUIExpY2Vuc2VkLCBKb2huIFJlc2lnXHJcbnZhciBfY29tcGFyZVBvc2l0aW9uID0gKG5vZGUxLCBub2RlMikgPT5cclxuICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cclxuICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5vZGUyKSA6XHJcbiAgICAwO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNvcnRzIGFuIGFycmF5IG9mIEQgZWxlbWVudHMgaW4tcGxhY2UgKGkuZS4sIG11dGF0ZXMgdGhlIG9yaWdpbmFsIGFycmF5KVxyXG4gICAgICogaW4gZG9jdW1lbnQgb3JkZXIgYW5kIHJldHVybnMgd2hldGhlciBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLlxyXG4gICAgICogQGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnRbXX0gYXJyYXkgICAgICAgICAgQXJyYXkgb2YgRCBlbGVtZW50cy5cclxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gIFtyZXZlcnNlPWZhbHNlXSBJZiBhIHRydXRoeSB2YWx1ZSBpcyBwYXNzZWQsIHRoZSBnaXZlbiBhcnJheSB3aWxsIGJlIHJldmVyc2VkLlxyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICogQHNlZSBqUXVlcnkgc3JjL3NlbGVjdG9yLW5hdGl2ZS5qczozN1xyXG4gICAgICovXHJcbiAgICAvLyBUT0RPOiBBZGRyZXNzIGVuY2Fwc3VsYXRpb25cclxuICAgIHNvcnQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgX3NvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgICAgICAgICAgLy8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKG5vZGUxID09PSBub2RlMikge1xyXG4gICAgICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU29ydCBvbiBtZXRob2QgZXhpc3RlbmNlIGlmIG9ubHkgb25lIGlucHV0IGhhcyBjb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgICAgICAgICB2YXIgcmVsID0gIW5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIC0gIW5vZGUyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xyXG4gICAgICAgICAgICBpZiAocmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBpZiAoKG5vZGUxLm93bmVyRG9jdW1lbnQgfHwgbm9kZTEpID09PSAobm9kZTIub3duZXJEb2N1bWVudCB8fCBub2RlMikpIHtcclxuICAgICAgICAgICAgICAgIHJlbCA9IF9jb21wYXJlUG9zaXRpb24obm9kZTEsIG5vZGUyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWwgPSBESVNDT05ORUNURUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vdCBkaXJlY3RseSBjb21wYXJhYmxlXHJcbiAgICAgICAgICAgIGlmICghcmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICAgICAgICAgIGlmIChpcyhyZWwsIERJU0NPTk5FQ1RFRCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc05vZGUxRGlzY29ubmVjdGVkID0gIWlzQXR0YWNoZWQobm9kZTEpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTm9kZTJEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZTFEaXNjb25uZWN0ZWQgJiYgaXNOb2RlMkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc05vZGUyRGlzY29ubmVjdGVkID8gLTEgOiAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaXMocmVsLCBGT0xMT1dJTkcpID8gLTEgOiAxO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgcmV2ZXJzZSkge1xyXG4gICAgICAgICAgICBfaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGFycmF5LnNvcnQoX3NvcnQpO1xyXG4gICAgICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICAgICAgYXJyYXkucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfaGFzRHVwbGljYXRlO1xyXG4gICAgICAgIH07XHJcbiAgICB9KCkpLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgLlxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBhIEQgZWxlbWVudCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGIgRCBlbGVtZW50IG5vZGVcclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgOyBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgdmFyIGJVcCA9IGlzQXR0YWNoZWQoYikgPyBiLnBhcmVudE5vZGUgOiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoYSA9PT0gYlVwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGJVcCAmJiBiVXAubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzIChJRTkrKVxyXG4gICAgICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTm9kZShiVXAsIENPTlRBSU5FRF9CWSwgYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIFJFR0VYID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIE1BWF9TSU5HTEVfVEFHX0xFTkdUSCA9IDMwO1xyXG5cclxudmFyIHBhcnNlU3RyaW5nID0gZnVuY3Rpb24ocGFyZW50VGFnTmFtZSwgaHRtbFN0cikge1xyXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQocGFyZW50VGFnTmFtZSk7XHJcbiAgICBwYXJlbnQuaW5uZXJIVE1MID0gaHRtbFN0cjtcclxuICAgIHJldHVybiBwYXJlbnQ7XHJcbn07XHJcblxyXG52YXIgcGFyc2VTaW5nbGVUYWcgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICBpZiAoaHRtbFN0ci5sZW5ndGggPiBNQVhfU0lOR0xFX1RBR19MRU5HVEgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgc2luZ2xlVGFnTWF0Y2ggPSBSRUdFWC5zaW5nbGVUYWdNYXRjaChodG1sU3RyKTtcclxuICAgIGlmICghc2luZ2xlVGFnTWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoc2luZ2xlVGFnTWF0Y2hbMV0pO1xyXG5cclxuICAgIHJldHVybiBbIGVsZW0gXTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgdmFyIHNpbmdsZVRhZyA9IHBhcnNlU2luZ2xlVGFnKGh0bWxTdHIpO1xyXG4gICAgaWYgKHNpbmdsZVRhZykgeyByZXR1cm4gc2luZ2xlVGFnOyB9XHJcblxyXG4gICAgdmFyIHBhcmVudFRhZ05hbWUgPSBSRUdFWC5nZXRQYXJlbnRUYWdOYW1lKGh0bWxTdHIpLFxyXG4gICAgICAgIHBhcmVudCAgICAgICAgPSBwYXJzZVN0cmluZyhwYXJlbnRUYWdOYW1lLCBodG1sU3RyKTtcclxuXHJcbiAgICB2YXIgY2hpbGQsXHJcbiAgICAgICAgaWR4ID0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCxcclxuICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuXHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jaGlsZHJlbltpZHhdO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgYXJyW2lkeF0gPSBjaGlsZDtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHBhcnNlciAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIEZpenpsZSAgICAgPSByZXF1aXJlKCdGaXp6bGUnKSxcclxuICAgIGVhY2ggICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5L2VhY2gnKSxcclxuICAgIGZvckVhY2ggICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5L2ZvckVhY2gnKSxcclxuICAgIGRhdGEgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKTtcclxuXHJcbnZhciBwYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gcGFyc2VyKHN0cik7XHJcbiAgICBpZiAoIXJlc3VsdCB8fCAhcmVzdWx0Lmxlbmd0aCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIEQocmVzdWx0KTtcclxufTtcclxuXHJcbl8uZXh0ZW5kKEQsXHJcbiAgICBkYXRhLkQsXHJcbntcclxuICAgIC8vIEJlY2F1c2Ugbm8gb25lIGtub3cgd2hhdCB0aGUgY2FzZSBzaG91bGQgYmVcclxuICAgIHBhcnNlSHRtbDogcGFyc2VIdG1sLFxyXG4gICAgcGFyc2VIVE1MOiBwYXJzZUh0bWwsXHJcblxyXG4gICAgRml6emxlOiAgRml6emxlLFxyXG4gICAgZWFjaDogICAgZWFjaCxcclxuICAgIGZvckVhY2g6IGZvckVhY2gsXHJcblxyXG4gICAgbWFwOiAgICAgXy5tYXAsXHJcbiAgICBleHRlbmQ6ICBfLmV4dGVuZCxcclxuXHJcbiAgICBtb3JlQ29uZmxpY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdpbmRvdy5qUXVlcnkgPSB3aW5kb3cuWmVwdG8gPSB3aW5kb3cuJCA9IEQ7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICA9IHJlcXVpcmUoJy4vRCcpLFxyXG4gICAgc3BsaXQgICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBhcnJheSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXJyYXknKSxcclxuICAgIHNlbGVjdG9ycyAgID0gcmVxdWlyZSgnbW9kdWxlcy9zZWxlY3RvcnMnKSxcclxuICAgIHRyYW5zdmVyc2FsID0gcmVxdWlyZSgnbW9kdWxlcy90cmFuc3ZlcnNhbCcpLFxyXG4gICAgZGltZW5zaW9ucyAgPSByZXF1aXJlKCdtb2R1bGVzL2RpbWVuc2lvbnMnKSxcclxuICAgIG1hbmlwICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9tYW5pcCcpLFxyXG4gICAgY3NzICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2NzcycpLFxyXG4gICAgYXR0ciAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2F0dHInKSxcclxuICAgIHByb3AgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9wcm9wJyksXHJcbiAgICB2YWwgICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvdmFsJyksXHJcbiAgICBwb3NpdGlvbiAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcG9zaXRpb24nKSxcclxuICAgIGNsYXNzZXMgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jbGFzc2VzJyksXHJcbiAgICBzY3JvbGwgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2Nyb2xsJyksXHJcbiAgICBkYXRhICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpLFxyXG4gICAgZXZlbnRzICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2V2ZW50cycpO1xyXG5cclxudmFyIGFycmF5UHJvdG8gPSBzcGxpdCgnbGVuZ3RofHRvU3RyaW5nfHRvTG9jYWxlU3RyaW5nfGpvaW58cG9wfHB1c2h8Y29uY2F0fHJldmVyc2V8c2hpZnR8dW5zaGlmdHxzbGljZXxzcGxpY2V8c29ydHxzb21lfGV2ZXJ5fGluZGV4T2Z8bGFzdEluZGV4T2Z8cmVkdWNlfHJlZHVjZVJpZ2h0fG1hcHxmaWx0ZXInKVxyXG4gICAgLnJlZHVjZShmdW5jdGlvbihvYmosIGtleSkge1xyXG4gICAgICAgIG9ialtrZXldID0gQXJyYXkucHJvdG90eXBlW2tleV07XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sIHt9KTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgcHJvdG90eXBlIHNvIHRoYXRcclxuLy8gaXQgY2FuIGJlIGhvb2tlZCBpbnRvIGZvciBwbHVnaW5zXHJcbkQuZm4gPSBELnByb3RvdHlwZTtcclxuXHJcbl8uZXh0ZW5kKFxyXG4gICAgRC5mbixcclxuICAgIHsgY29uc3RydWN0b3I6IEQsIH0sXHJcbiAgICBhcnJheVByb3RvLFxyXG4gICAgYXJyYXkuZm4sXHJcbiAgICBzZWxlY3RvcnMuZm4sXHJcbiAgICB0cmFuc3ZlcnNhbC5mbixcclxuICAgIG1hbmlwLmZuLFxyXG4gICAgZGltZW5zaW9ucy5mbixcclxuICAgIGNzcy5mbixcclxuICAgIGF0dHIuZm4sXHJcbiAgICBwcm9wLmZuLFxyXG4gICAgdmFsLmZuLFxyXG4gICAgY2xhc3Nlcy5mbixcclxuICAgIHBvc2l0aW9uLmZuLFxyXG4gICAgc2Nyb2xsLmZuLFxyXG4gICAgZGF0YS5mbixcclxuICAgIGV2ZW50cy5mblxyXG4pO1xyXG4iLCJ2YXIgZXhpc3RzID0gcmVxdWlyZSgnaXMvZXhpc3RzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChzdHIpID0+ICFleGlzdHMoc3RyKSB8fCBzdHIgPT09ICcnOyIsInZhciBTVVBQT1JUUyA9IHJlcXVpcmUoJ1NVUFBPUlRTJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNVUFBPUlRTLnZhbHVlTm9ybWFsaXplZCA/XHJcbiAgICAoc3RyKSA9PiBzdHIgOlxyXG4gICAgKHN0cikgPT4gc3RyID8gc3RyLnJlcGxhY2UoL1xcclxcbi9nLCAnXFxuJykgOiBzdHI7IiwidmFyIGNhY2hlICAgPSByZXF1aXJlKCdjYWNoZScpKDIpLFxyXG4gICAgaXNFbXB0eSA9IHJlcXVpcmUoJ3N0cmluZy9pc0VtcHR5JyksXHJcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuXHJcbiAgICBSX1NQQUNFID0gL1xccysvZyxcclxuXHJcbiAgICBzcGxpdCA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltKSB7XHJcbiAgICAgICAgdmFyIHNwbGl0ICAgPSBuYW1lLnNwbGl0KGRlbGltKSxcclxuICAgICAgICAgICAgbGVuICAgICA9IHNwbGl0Lmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ICAgICA9IHNwbGl0Lmxlbmd0aCxcclxuICAgICAgICAgICAgbmFtZXMgICA9IFtdLFxyXG4gICAgICAgICAgICBuYW1lU2V0ID0ge30sXHJcbiAgICAgICAgICAgIGN1ck5hbWU7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBjdXJOYW1lID0gc3BsaXRbbGVuIC0gKGlkeCArIDEpXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIG5hbWVTZXRbY3VyTmFtZV0gfHwgLy8gdW5pcXVlXHJcbiAgICAgICAgICAgICAgICBpc0VtcHR5KGN1ck5hbWUpICAgIC8vIG5vbi1lbXB0eVxyXG4gICAgICAgICAgICApIHsgY29udGludWU7IH1cclxuXHJcbiAgICAgICAgICAgIG5hbWVzLnB1c2goY3VyTmFtZSk7XHJcbiAgICAgICAgICAgIG5hbWVTZXRbY3VyTmFtZV0gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSwgZGVsaW1pdGVyKSB7XHJcbiAgICBpZiAoaXNFbXB0eShuYW1lKSkgeyByZXR1cm4gW107IH1cclxuICAgIGlmIChpc0FycmF5KG5hbWUpKSB7IHJldHVybiBuYW1lOyB9XHJcblxyXG4gICAgdmFyIGRlbGltID0gZGVsaW1pdGVyID09PSB1bmRlZmluZWQgPyBSX1NQQUNFIDogZGVsaW1pdGVyO1xyXG4gICAgcmV0dXJuIGNhY2hlLmhhcyhkZWxpbSwgbmFtZSkgPyBcclxuICAgICAgICBjYWNoZS5nZXQoZGVsaW0sIG5hbWUpIDogXHJcbiAgICAgICAgY2FjaGUucHV0KGRlbGltLCBuYW1lLCAoKSA9PiBzcGxpdChuYW1lLCBkZWxpbSkpO1xyXG59O1xyXG4iLCJ2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgc3RhcnQsIGVuZCkge1xyXG4gICAgLy8gRXhpdCBlYXJseSBmb3IgZW1wdHkgYXJyYXlcclxuICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIC8vIEVuZCwgbmF0dXJhbGx5LCBoYXMgdG8gYmUgaGlnaGVyIHRoYW4gMCB0byBtYXR0ZXIsXHJcbiAgICAvLyBzbyBhIHNpbXBsZSBleGlzdGVuY2UgY2hlY2sgd2lsbCBkb1xyXG4gICAgaWYgKGVuZCkgeyByZXR1cm4gc2xpY2UuY2FsbChhcnIsIHN0YXJ0LCBlbmQpOyB9XHJcblxyXG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCB8fCAwKTtcclxufTsiLCIvLyBCcmVha3MgZXZlbiBvbiBhcnJheXMgd2l0aCAzIGl0ZW1zLiAzIG9yIG1vcmVcclxuLy8gaXRlbXMgc3RhcnRzIHNhdmluZyBzcGFjZVxyXG5tb2R1bGUuZXhwb3J0cyA9IChzdHIsIGRlbGltaXRlcikgPT4gc3RyLnNwbGl0KGRlbGltaXRlciB8fCAnfCcpO1xyXG4iLCJ2YXIgaWQgPSAwO1xyXG52YXIgdW5pcXVlSWQgPSBtb2R1bGUuZXhwb3J0cyA9ICgpID0+IGlkKys7XHJcbnVuaXF1ZUlkLnNlZWQgPSBmdW5jdGlvbihzZWVkZWQsIHByZSkge1xyXG4gICAgdmFyIHByZWZpeCA9IHByZSB8fCAnJyxcclxuICAgICAgICBzZWVkID0gc2VlZGVkIHx8IDA7XHJcbiAgICByZXR1cm4gKCkgPT4gcHJlZml4ICsgc2VlZCsrO1xyXG59OyJdfQ==
