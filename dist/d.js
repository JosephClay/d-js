(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.D = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./D');
require('./props');
require('./proto');

},{"./D":3,"./props":67,"./proto":68}],2:[function(require,module,exports){
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

},{"Fizzle":9,"_":22,"is/D":24,"is/array":25,"is/function":33,"is/html":34,"is/nodeList":35,"is/string":39,"onready":64,"parser":66}],4:[function(require,module,exports){
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

},{"REGEX":20,"cache":23,"is/element":31,"is/exists":32,"is/nodeList":35,"matchesSelector":41,"util/uniqueId":74}],9:[function(require,module,exports){
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
    }
};

},{"is/array":25,"is/arrayLike":26,"is/exists":32,"is/nodeList":35,"util/slice":72}],23:[function(require,module,exports){
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

},{"./map":43,"D":3,"_":22,"is/exists":32,"util/slice":72}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{"order":65}],45:[function(require,module,exports){
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

},{"Fizzle":9,"SUPPORTS":21,"_":22,"cache":23,"is/exists":32,"is/function":33,"is/string":39,"node/isElement":61,"node/isName":62,"string/newlines":70}],46:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"is/array":25,"is/string":39,"string/isEmpty":69,"string/split":71}],47:[function(require,module,exports){
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

},{"NODE_TYPE/DOCUMENT":16,"REGEX":20,"_":22,"is/array":25,"is/attached":27,"is/boolean":28,"is/document":30,"is/element":31,"is/exists":32,"is/number":36,"is/object":37,"is/string":39,"is/window":40,"util/split":73}],48:[function(require,module,exports){
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

},{"cache":23,"is/array":25,"is/element":31,"is/string":39,"util/uniqueId":74}],49:[function(require,module,exports){
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

},{"./css":47,"_":22,"is/number":36}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{"crossvent":2,"is/exists":32,"matchesSelector":41}],52:[function(require,module,exports){
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

},{"./custom":50,"./delegate":51,"_":22,"is/function":33}],53:[function(require,module,exports){
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

},{"./array/unique":44,"./data":48,"./selectors/filter":57,"D":3,"_":22,"is/D":24,"is/collection":29,"is/document":30,"is/element":31,"is/exists":32,"is/function":33,"is/html":34,"is/nodeList":35,"is/number":36,"is/string":39,"is/window":40,"order":65,"parser":66}],54:[function(require,module,exports){
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

},{"D":3,"_":22,"is/attached":27,"is/exists":32,"is/function":33,"is/object":37,"node/isName":62}],55:[function(require,module,exports){
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

},{"NODE_TYPE/ATTRIBUTE":14,"NODE_TYPE/COMMENT":15,"NODE_TYPE/TEXT":19,"REGEX":20,"SUPPORTS":21,"_":22,"is/function":33,"is/string":39,"util/split":73}],56:[function(require,module,exports){
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

},{"is/exists":32,"is/string":39}],57:[function(require,module,exports){
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

},{"Fizzle":9,"_":22,"is/function":33,"is/string":39}],58:[function(require,module,exports){
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

},{"D":3,"Fizzle":9,"_":22,"is/D":24,"is/array":25,"is/collection":29,"is/element":31,"is/function":33,"is/nodeList":35,"is/selector":38,"is/string":39,"order":65}],59:[function(require,module,exports){
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

},{"./array/unique":44,"./selectors/filter":57,"D":3,"Fizzle":9,"NODE_TYPE/DOCUMENT":16,"NODE_TYPE/DOCUMENT_FRAGMENT":17,"NODE_TYPE/ELEMENT":18,"_":22,"is/D":24,"is/attached":27,"is/document":30,"is/element":31,"is/string":39,"is/window":40,"order":65}],60:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"SUPPORTS":21,"_":22,"is/array":25,"is/exists":32,"is/function":33,"is/number":36,"is/string":39,"node/isName":62,"node/normalizeName":63,"string/newlines":70}],61:[function(require,module,exports){
'use strict';

var ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = function (elem) {
        return elem && elem.nodeType === ELEMENT;
};

},{"NODE_TYPE/ELEMENT":18}],62:[function(require,module,exports){
"use strict";

module.exports = function (elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};

},{}],63:[function(require,module,exports){
// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
"use strict";

module.exports = function (elem) {
  return elem.nodeName.toLowerCase();
};

},{}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"is/attached":27}],66:[function(require,module,exports){
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

},{"REGEX":20}],67:[function(require,module,exports){
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
    each: _.jqEach,
    forEach: _.dEach,

    map: _.map,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

},{"./D":3,"Fizzle":9,"_":22,"modules/data":48,"parser":66}],68:[function(require,module,exports){
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

},{"./D":3,"_":22,"modules/array":42,"modules/attr":45,"modules/classes":46,"modules/css":47,"modules/data":48,"modules/dimensions":49,"modules/events":52,"modules/manip":53,"modules/position":54,"modules/prop":55,"modules/scroll":56,"modules/selectors":58,"modules/transversal":59,"modules/val":60,"util/split":73}],69:[function(require,module,exports){
'use strict';

var exists = require('is/exists');

module.exports = function (str) {
  return !exists(str) || str === '';
};

},{"is/exists":32}],70:[function(require,module,exports){
'use strict';

var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ? function (str) {
    return str;
} : function (str) {
    return str ? str.replace(/\r\n/g, '\n') : str;
};

},{"SUPPORTS":21}],71:[function(require,module,exports){
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

},{"cache":23,"is/array":25,"string/isEmpty":69}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
'use strict';

module.exports = function (str, delimiter) {
  return str.split(delimiter || '|');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvY2FwdHVyZS5qc29uIiwic3JjL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qc29uIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9BVFRSSUJVVEUuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9DT01NRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0VMRU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9URVhULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvbWFwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2FycmF5L3VuaXF1ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hdHRyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2NsYXNzZXMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvY3NzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RhdGEuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZGltZW5zaW9ucy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvY3VzdG9tLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2V2ZW50cy9kZWxlZ2F0ZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvbWFuaXAuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvcG9zaXRpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvcHJvcC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9zY3JvbGwuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2ZpbHRlci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9zZWxlY3RvcnMvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvdHJhbnN2ZXJzYWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvdmFsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL2lzRWxlbWVudC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc05hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvbm9ybWFsaXplTmFtZS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvb25yZWFkeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvb3JkZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3BhcnNlci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvcHJvcHMuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3RvLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvaXNFbXB0eS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL25ld2xpbmVzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9zdHJpbmcvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc2xpY2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvc3BsaXQuanMiLCJDOi9fRGV2L2QtanMvc3JjL3V0aWwvdW5pcXVlSWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7QUNGbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDckZBLElBQUksQ0FBQyxHQUFhLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDMUIsT0FBTyxHQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUM7SUFDakMsTUFBTSxHQUFRLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDaEMsUUFBUSxHQUFNLE9BQU8sQ0FBQyxXQUFXLENBQUM7SUFDbEMsVUFBVSxHQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDcEMsVUFBVSxHQUFJLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDcEMsR0FBRyxHQUFXLE9BQU8s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LGVBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQUU7O0FBRWhELFdBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQ3RDLENBQUM7Ozs7Ozs7QUNURixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQUMsR0FBRyxFQUFFLFNBQVM7U0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUM7Q0FBQSxDQUFDOzs7OztBQ0ZqRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDWCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHO1dBQU0sRUFBRSxFQUFFO0NBQUEsQ0FBQztBQUMzQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVMsTUFBTSxFQUFFLEdBQUcsRUFBRTtBQUNsQyxRQUFJLE1BQU0sR0FBRyxHQUFHLElBQUksRUFBRTtRQUNsQixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUN2QixXQUFPO2VBQU0sTUFBTSxHQUFHLElBQUksRUFBRTtLQUFBLENBQUM7Q0FDaEMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vRCcpO1xyXG5yZXF1aXJlKCcuL3Byb3BzJyk7XHJcbnJlcXVpcmUoJy4vcHJvdG8nKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCB1bndyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSkge1xuICB2YXIgZTtcbiAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ICA9IGUucHJldmVudERlZmF1bHQgIHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNBcnJheSAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNIdG1sICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNGdW5jdGlvbiAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCdvbnJlYWR5JyksXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIEQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBJbml0KHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEQpO1xyXG5cclxudmFyIEluaXQgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIC8vIG5vdGhpblxyXG4gICAgaWYgKCFzZWxlY3RvcikgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgIC8vIGVsZW1lbnQgb3Igd2luZG93IChkb2N1bWVudHMgaGF2ZSBhIG5vZGVUeXBlKVxyXG4gICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlIHx8IHNlbGVjdG9yID09PSB3aW5kb3cpIHtcclxuICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XHJcbiAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhUTUwgc3RyaW5nXHJcbiAgICBpZiAoaXNIdG1sKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgcGFyc2VyKHNlbGVjdG9yKSk7XHJcbiAgICAgICAgaWYgKGF0dHJzKSB7IHRoaXMuYXR0cihhdHRycyk7IH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3RyaW5nXHJcbiAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gU2VsZWN0b3I6IHBlcmZvcm0gYSBmaW5kIHdpdGhvdXQgY3JlYXRpbmcgYSBuZXcgRFxyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgRml6emxlLnF1ZXJ5KHNlbGVjdG9yKS5leGVjKHRoaXMsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBvZiBFbGVtZW50cywgTm9kZUxpc3QsIG9yIEQgb2JqZWN0XHJcbiAgICAvLyBUT0RPOiBDb3VsZCB0aGlzIGJlIGFycmF5TGlrZT9cclxuICAgIGlmIChpc0FycmF5KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG9jdW1lbnQgcmVhZHlcclxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG9ucmVhZHkoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbkluaXQucHJvdG90eXBlID0gRC5wcm90b3R5cGU7IiwibW9kdWxlLmV4cG9ydHMgPSAodGFnKSA9PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7IiwidmFyIGRpdiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUnKSgnZGl2Jyk7XHJcblxyXG5kaXYuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCIvYVwiPmE8L2E+JzsiLCJ2YXIgXyA9IHJlcXVpcmUoJ18nKTtcclxuXHJcbnZhciBJcyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcbklzLnByb3RvdHlwZSA9IHtcclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IHRoaXMuX3NlbGVjdG9ycyxcclxuICAgICAgICAgICAgaWR4ID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvcnNbaWR4XS5tYXRjaChjb250ZXh0KSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmFueShhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICB0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgIXRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwidmFyIGZpbmQgPSBmdW5jdGlvbihxdWVyeSwgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgIHNlbGVjdG9ycyA9IHF1ZXJ5Ll9zZWxlY3RvcnMsXHJcbiAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5cclxuUXVlcnkucHJvdG90eXBlID0ge1xyXG4gICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGZpbmQodGhpcywgYXJyW2lkeF0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnLFxyXG4gICAgXHJcbiAgICB1bmlxdWVJZCAgICAgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoMCwgJ0QtdW5pcXVlSWQtJyksXHJcbiAgICBzZWxlY3RvckNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgUkVHRVggICAgICAgICA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBtYXRjaGVzICAgICAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyk7XHJcblxyXG52YXIgZGV0ZXJtaW5lTWV0aG9kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gc2VsZWN0b3JDYWNoZS5nZXQoc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmIChtZXRob2QpIHsgcmV0dXJuIG1ldGhvZDsgfVxyXG5cclxuICAgICAgICBtZXRob2QgPSBSRUdFWC5pc1N0cmljdElkKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UX0JZX0lEIDpcclxuICAgICAgICAgICAgUkVHRVguaXNDbGFzcyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA6XHJcbiAgICAgICAgICAgIFJFR0VYLmlzVGFnKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9UQUdfTkFNRSA6ICAgICAgIFxyXG4gICAgICAgICAgICBRVUVSWV9TRUxFQ1RPUl9BTEw7XHJcblxyXG4gICAgICAgIHNlbGVjdG9yQ2FjaGUuc2V0KHNlbGVjdG9yLCBtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIG5lZWQgdG8gZm9yY2UgYW4gYXJyYXkgaGVyZVxyXG4gICAgZnJvbURvbUFycmF5VG9BcnJheSA9IGZ1bmN0aW9uKGFycmF5TGlrZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBhcnJheUxpa2UubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBhcnJheUxpa2VbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gZnVuY3Rpb24oc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgaWYgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkLCByZXR1cm4gaXQgYXMgYW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IGZyb21Eb21BcnJheVRvQXJyYXkoc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGFpbG9yQ2hpbGRTZWxlY3RvciA9IGZ1bmN0aW9uKGlkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiAnIycgKyBpZCArICcgJyArIHNlbGVjdG9yO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIC8vIENoaWxkIHNlbGVjdCAtIG5lZWRzIHNwZWNpYWwgaGVscCBzbyB0aGF0IFwiPiBkaXZcIiBkb2Vzbid0IGJyZWFrXHJcbiAgICAgICAgdmFyIG1ldGhvZCAgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgc2VsZWN0b3IgID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdG9yID0gdGFpbG9yQ2hpbGRTZWxlY3RvcihpZEFwcGxpZWQgPyBuZXdJZCA6IGlkLCBzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGlkQXBwbGllZCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsYXNzUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgLy8gQ2xhc3Mgc2VhcmNoLCBkb24ndCBzdGFydCB3aXRoICcuJ1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWZhdWx0UXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbc2VsZi5tZXRob2RdKHNlbGYuc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgICAgICAgaWYgKHNlbGYuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRPclNpYmxpbmdRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmlzQ2xhc3NTZWFyY2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNsYXNzUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0lkU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpZFF1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRRdWVyeTtcclxuICAgIH07XHJcblxyXG52YXIgU2VsZWN0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgdmFyIHNlbGVjdG9yICAgICAgICAgICAgICAgID0gc3RyLnRyaW0oKSxcclxuICAgICAgICBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ICA9IHNlbGVjdG9yWzBdID09PSAnPicgfHwgc2VsZWN0b3JbMF0gPT09ICcrJyxcclxuICAgICAgICBtZXRob2QgICAgICAgICAgICAgICAgICA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBRVUVSWV9TRUxFQ1RPUl9BTEwgOiBkZXRlcm1pbmVNZXRob2Qoc2VsZWN0b3IpO1xyXG5cclxuICAgIHRoaXMuc3RyICAgICAgICAgICAgICAgICAgICA9IHN0cjtcclxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgICAgICAgICA9IHNlbGVjdG9yO1xyXG4gICAgdGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdDtcclxuICAgIHRoaXMuaXNJZFNlYXJjaCAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRfQllfSUQ7XHJcbiAgICB0aGlzLmlzQ2xhc3NTZWFyY2ggICAgICAgICAgPSAhdGhpcy5pc0lkU2VhcmNoICYmIG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUU7XHJcbiAgICB0aGlzLm1ldGhvZCAgICAgICAgICAgICAgICAgPSBtZXRob2Q7XHJcbn07XHJcblxyXG5TZWxlY3Rvci5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIC8vIE5vIG5lZWVkIHRvIGNoZWNrLCBhIG1hdGNoIHdpbGwgZmFpbCBpZiBpdCdzXHJcbiAgICAgICAgLy8gY2hpbGQgb3Igc2libGluZ1xyXG4gICAgICAgIGlmICh0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRjaGVzKGNvbnRleHQsIHRoaXMuc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gZGV0ZXJtaW5lUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgIC8vIGlzRWxlbWVudChjb250ZXh0KSB8fCBpc05vZGVMaXN0KGNvbnRleHQpIHx8IGlzQ29sbGVjdGlvbihjb250ZXh0KVxyXG4gICAgICAgIC8vIGlmIG5vIGNvbnRleHQgaXMgZ2l2ZW4sIHVzZSBkb2N1bWVudFxyXG4gICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0IHx8IGRvY3VtZW50LCB0aGlzKTtcclxuICAgIH1cclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJy4uL18nKSxcclxuICAgIHF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBpc0NhY2hlICAgID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgU2VsZWN0b3IgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9TZWxlY3RvcicpLFxyXG4gICAgUXVlcnkgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9RdWVyeScpLFxyXG4gICAgSXMgICAgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9JcycpLFxyXG4gICAgcGFyc2UgICAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UnKSxcclxuICAgIG5vcm1hbGl6ZSAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZScpO1xyXG5cclxudmFyIHRvU2VsZWN0b3JzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAvLyBTZWxlY3RvcnMgd2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgcXVlcnkgd2FzIGludmFsaWQuXHJcbiAgICAvLyBOb3QgcmV0dXJuaW5nIGVhcmx5IG9yIGRvaW5nIGV4dHJhIGNoZWNrcyBhcyB0aGlzIHdpbGxcclxuICAgIC8vIG5vb3Agb24gdGhlIFF1ZXJ5IGFuZCBJcyBsZXZlbCBhbmQgaXMgdGhlIGV4Y2VwdGlvblxyXG4gICAgLy8gaW5zdGVhZCBvZiB0aGUgcnVsZVxyXG4gICAgdmFyIHNlbGVjdG9ycyA9IHBhcnNlLnN1YnF1ZXJpZXMoc3RyKSB8fCBbXTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZWFjaCBvZiB0aGUgc2VsZWN0b3JzLi4uXHJcbiAgICBzZWxlY3RvcnMgPSBfLm1hcChzZWxlY3RvcnMsIG5vcm1hbGl6ZSk7XHJcblxyXG4gICAgLy8gLi4uYW5kIG1hcCB0aGVtIHRvIFNlbGVjdG9yIG9iamVjdHNcclxuICAgIHJldHVybiBfLmZhc3RtYXAoc2VsZWN0b3JzLCAoc2VsZWN0b3IpID0+IG5ldyBTZWxlY3RvcihzZWxlY3RvcikpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZTogcGFyc2UsXHJcbiAgICBcclxuICAgIHF1ZXJ5OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZS5oYXMoc3RyKSA/IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLmdldChzdHIpIDogXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUucHV0KHN0ciwgKCkgPT4gbmV3IFF1ZXJ5KHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH0sXHJcbiAgICBpczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQ2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgaXNDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBpc0NhY2hlLnB1dChzdHIsICgpID0+IG5ldyBJcyh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCI6Y2hpbGQtYXRcIjogXCI6bnRoLWNoaWxkKHgpXCIsXHJcblx0XCI6Y2hpbGQtZ3RcIjogXCI6bnRoLWNoaWxkKG4reClcIixcclxuXHRcIjpjaGlsZC1sdFwiOiBcIjpudGgtY2hpbGQofm4reClcIlxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuICAgIFwiOmNoaWxkLWV2ZW5cIiA6IFwiOm50aC1jaGlsZChldmVuKVwiLFxyXG4gICAgXCI6Y2hpbGQtb2RkXCIgIDogXCI6bnRoLWNoaWxkKG9kZClcIixcclxuICAgIFwiOnRleHRcIiAgICAgICA6IFwiW3R5cGU9dGV4dF1cIixcclxuICAgIFwiOnBhc3N3b3JkXCIgICA6IFwiW3R5cGU9cGFzc3dvcmRdXCIsXHJcbiAgICBcIjpyYWRpb1wiICAgICAgOiBcIlt0eXBlPXJhZGlvXVwiLFxyXG4gICAgXCI6Y2hlY2tib3hcIiAgIDogXCJbdHlwZT1jaGVja2JveF1cIixcclxuICAgIFwiOnN1Ym1pdFwiICAgICA6IFwiW3R5cGU9c3VibWl0XVwiLFxyXG4gICAgXCI6cmVzZXRcIiAgICAgIDogXCJbdHlwZT1yZXNldF1cIixcclxuICAgIFwiOmJ1dHRvblwiICAgICA6IFwiW3R5cGU9YnV0dG9uXVwiLFxyXG4gICAgXCI6aW1hZ2VcIiAgICAgIDogXCJbdHlwZT1pbWFnZV1cIixcclxuICAgIFwiOmlucHV0XCIgICAgICA6IFwiW3R5cGU9aW5wdXRdXCIsXHJcbiAgICBcIjpmaWxlXCIgICAgICAgOiBcIlt0eXBlPWZpbGVdXCIsXHJcbiAgICBcIjpzZWxlY3RlZFwiICAgOiBcIltzZWxlY3RlZD1zZWxlY3RlZF1cIlxyXG59IiwidmFyIFNVUFBPUlRTICAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG5cclxuICAgIEFUVFJJQlVURV9TRUxFQ1RPUiA9IC9cXFtcXHMqW1xcdy1dK1xccypbISReKl0/KD86PVxccyooWydcIl0/KSguKj9bXlxcXFxdfFteXFxcXF0qKSk/XFwxXFxzKlxcXS9nLFxyXG4gICAgUFNFVURPX1NFTEVDVCAgICAgID0gLyg6W15cXHNcXChcXFspXSspL2csXHJcbiAgICBDQVBUVVJFX1NFTEVDVCAgICAgPSAvKDpbXlxcc14oXSspXFwoKFteXFwpXSspXFwpL2csXHJcbiAgICBwc2V1ZG9DYWNoZSAgICAgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBwcm94eVNlbGVjdG9ycyAgICAgPSByZXF1aXJlKCcuL3Byb3h5Lmpzb24nKSxcclxuICAgIGNhcHR1cmVTZWxlY3RvcnMgICA9IHJlcXVpcmUoJy4vY2FwdHVyZS5qc29uJyk7XHJcblxyXG52YXIgZ2V0QXR0cmlidXRlUG9zaXRpb25zID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgcGFpcnMgPSBbXTtcclxuICAgIC8vIE5vdCB1c2luZyByZXR1cm4gdmFsdWUuIFNpbXBseSB1c2luZyBpdCB0byBpdGVyYXRlXHJcbiAgICAvLyB0aHJvdWdoIGFsbCBvZiB0aGUgbWF0Y2hlcyB0byBwb3B1bGF0ZSBtYXRjaCBwb3NpdGlvbnNcclxuICAgIHN0ci5yZXBsYWNlKEFUVFJJQlVURV9TRUxFQ1RPUiwgZnVuY3Rpb24obWF0Y2gsIGNhcDEsIGNhcDIsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcGFpcnMucHVzaChbIHBvc2l0aW9uLCBwb3NpdGlvbiArIG1hdGNoLmxlbmd0aCBdKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHBhaXJzO1xyXG59O1xyXG5cclxudmFyIGlzT3V0c2lkZU9mQXR0cmlidXRlID0gZnVuY3Rpb24ocG9zaXRpb24sIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHBvc2l0aW9ucy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHZhciBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICBpZiAocG9zaXRpb24gPiBwb3NbMF0gJiYgcG9zaXRpb24gPCBwb3NbMV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxudmFyIHBzZXVkb1JlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKFBTRVVET19TRUxFQ1QsIGZ1bmN0aW9uKG1hdGNoLCBjYXAsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb3h5U2VsZWN0b3JzW21hdGNoXSA/IHByb3h5U2VsZWN0b3JzW21hdGNoXSA6IG1hdGNoO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgY2FwdHVyZVJlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGNhcHR1cmVTZWxlY3RvcjtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZShDQVBUVVJFX1NFTEVDVCwgZnVuY3Rpb24obWF0Y2gsIGNhcCwgdmFsdWUsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChjYXB0dXJlU2VsZWN0b3IgPSBjYXB0dXJlU2VsZWN0b3JzW2NhcF0pID8gY2FwdHVyZVNlbGVjdG9yLnJlcGxhY2UoJ3gnLCB2YWx1ZSkgOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIGJvb2xlYW5TZWxlY3RvclJlcGxhY2UgPSBTVVBQT1JUUy5zZWxlY3RlZFNlbGVjdG9yID9cclxuICAgIC8vIElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIGZ1bmN0aW9uKHN0cikgeyByZXR1cm4gc3RyOyB9IDpcclxuICAgIC8vIElFOC05XHJcbiAgICBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb25zID0gZ2V0QXR0cmlidXRlUG9zaXRpb25zKHN0ciksXHJcbiAgICAgICAgICAgIGlkeCA9IHBvc2l0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBvcyxcclxuICAgICAgICAgICAgc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzdHIuc3Vic3RyaW5nKHBvc1swXSwgcG9zWzFdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnW3NlbGVjdGVkXScpIHtcclxuICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgcG9zWzBdKSArICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXScgKyBzdHIuc3Vic3RyaW5nKHBvc1sxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBwc2V1ZG9DYWNoZS5oYXMoc3RyKSA/IHBzZXVkb0NhY2hlLmdldChzdHIpIDogcHNldWRvQ2FjaGUucHV0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGF0dHJQb3NpdGlvbnMgPSBnZXRBdHRyaWJ1dGVQb3NpdGlvbnMoc3RyKTtcclxuICAgICAgICBzdHIgPSBwc2V1ZG9SZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICAgICAgc3RyID0gYm9vbGVhblNlbGVjdG9yUmVwbGFjZShzdHIpO1xyXG4gICAgICAgIHJldHVybiBjYXB0dXJlUmVwbGFjZShzdHIsIGF0dHJQb3NpdGlvbnMpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qXHJcbiAqIEZpenpsZS5qc1xyXG4gKiBBZGFwdGVkIGZyb20gU2l6emxlLmpzXHJcbiAqL1xyXG52YXIgdG9rZW5DYWNoZSAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHN1YnF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcblxyXG4gICAgZXJyb3IgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciAoY2F1Z2h0KSBcIicrIHNlbGVjdG9yICsnXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zZWxlY3RvcnMvI3doaXRlc3BhY2VcclxuICAgIFdISVRFU1BBQ0UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgSURFTlRJRklFUiA9ICcoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXFxceDAwLVxcXFx4YTBdKSsnLFxyXG5cclxuICAgIC8vIE5PVEU6IExlYXZpbmcgZG91YmxlIHF1b3RlcyB0byByZWR1Y2UgZXNjYXBpbmdcclxuICAgIC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xyXG4gICAgQVRUUklCVVRFUyA9IFwiXFxcXFtcIiArIFdISVRFU1BBQ0UgKyBcIiooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBPcGVyYXRvciAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiKihbKl4kfCF+XT89KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIElERU5USUZJRVJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgSURFTlRJRklFUiArIFwiKSl8KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgXCIqXFxcXF1cIixcclxuXHJcbiAgICBQU0VVRE9TID0gXCI6KFwiICsgSURFTlRJRklFUiArIFwiKSg/OlxcXFwoKFwiICtcclxuICAgICAgICAvLyBUbyByZWR1Y2UgdGhlIG51bWJlciBvZiBzZWxlY3RvcnMgbmVlZGluZyB0b2tlbml6ZSBpbiB0aGUgcHJlRmlsdGVyLCBwcmVmZXIgYXJndW1lbnRzOlxyXG4gICAgICAgIC8vIDEuIHF1b3RlZCAoY2FwdHVyZSAzOyBjYXB0dXJlIDQgb3IgY2FwdHVyZSA1KVxyXG4gICAgICAgIFwiKCcoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcIil8XCIgK1xyXG4gICAgICAgIC8vIDIuIHNpbXBsZSAoY2FwdHVyZSA2KVxyXG4gICAgICAgIFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKClbXFxcXF1dfFwiICsgQVRUUklCVVRFUyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgUl9DT01NQSAgICAgICA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqLCcgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfQ09NQklOQVRPUlMgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKihbPit+XXwnICsgV0hJVEVTUEFDRSArICcpJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9QU0VVRE8gICAgICA9IG5ldyBSZWdFeHAoUFNFVURPUyksXHJcbiAgICBSX01BVENIX0VYUFIgPSB7XHJcbiAgICAgICAgSUQ6ICAgICBuZXcgUmVnRXhwKCdeIygnICAgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBDTEFTUzogIG5ldyBSZWdFeHAoJ15cXFxcLignICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBJREVOVElGSUVSICsgJ3xbKl0pJyksXHJcbiAgICAgICAgQVRUUjogICBuZXcgUmVnRXhwKCdeJyAgICAgKyBBVFRSSUJVVEVTKSxcclxuICAgICAgICBQU0VVRE86IG5ldyBSZWdFeHAoJ14nICAgICArIFBTRVVET1MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufCknICsgV0hJVEVTUEFDRSArICcqKD86KFsrLV18KScgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBXSElURVNQQUNFICsgJypcXFxcKXwpJywgJ2knKSxcclxuICAgICAgICBib29sOiAgIG5ldyBSZWdFeHAoXCJeKD86Y2hlY2tlZHxzZWxlY3RlZHxhc3luY3xhdXRvZm9jdXN8YXV0b3BsYXl8Y29udHJvbHN8ZGVmZXJ8ZGlzYWJsZWR8aGlkZGVufGlzbWFwfGxvb3B8bXVsdGlwbGV8b3BlbnxyZWFkb25seXxyZXF1aXJlZHxzY29wZWQpJFwiLCBcImlcIilcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ1NTIGVzY2FwZXMgaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xyXG4gICAgUl9VTkVTQ0FQRSA9IG5ldyBSZWdFeHAoJ1xcXFxcXFxcKFtcXFxcZGEtZl17MSw2fScgKyBXSElURVNQQUNFICsgJz98KCcgKyBXSElURVNQQUNFICsgJyl8LiknLCAnaWcnKSxcclxuICAgIGZ1bmVzY2FwZSA9IGZ1bmN0aW9uKF8sIGVzY2FwZWQsIGVzY2FwZWRXaGl0ZXNwYWNlKSB7XHJcbiAgICAgICAgdmFyIGhpZ2ggPSAnMHgnICsgKGVzY2FwZWQgLSAweDEwMDAwKTtcclxuICAgICAgICAvLyBOYU4gbWVhbnMgbm9uLWNvZGVwb2ludFxyXG4gICAgICAgIC8vIFN1cHBvcnQ6IEZpcmVmb3g8MjRcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGVycm9uZW91cyBudW1lcmljIGludGVycHJldGF0aW9uIG9mICsnMHgnXHJcbiAgICAgICAgcmV0dXJuIGhpZ2ggIT09IGhpZ2ggfHwgZXNjYXBlZFdoaXRlc3BhY2UgP1xyXG4gICAgICAgICAgICBlc2NhcGVkIDpcclxuICAgICAgICAgICAgaGlnaCA8IDAgP1xyXG4gICAgICAgICAgICAgICAgLy8gQk1QIGNvZGVwb2ludFxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKGhpZ2ggKyAweDEwMDAwKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwbGVtZW50YWwgUGxhbmUgY29kZXBvaW50IChzdXJyb2dhdGUgcGFpcilcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZSgoaGlnaCA+PiAxMCkgfCAweEQ4MDAsIChoaWdoICYgMHgzRkYpIHwgMHhEQzAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJlRmlsdGVyID0ge1xyXG4gICAgICAgIEFUVFI6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0ucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSB0aGUgZ2l2ZW4gdmFsdWUgdG8gbWF0Y2hbM10gd2hldGhlciBxdW90ZWQgb3IgdW5xdW90ZWRcclxuICAgICAgICAgICAgbWF0Y2hbM10gPSAoIG1hdGNoWzNdIHx8IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnICkucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdID09PSAnfj0nKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFszXSA9ICcgJyArIG1hdGNoWzNdICsgJyAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgNCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgQ0hJTEQ6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIC8qIG1hdGNoZXMgZnJvbSBSX01BVENIX0VYUFJbJ0NISUxEJ11cclxuICAgICAgICAgICAgICAgIDEgdHlwZSAob25seXxudGh8Li4uKVxyXG4gICAgICAgICAgICAgICAgMiB3aGF0IChjaGlsZHxvZi10eXBlKVxyXG4gICAgICAgICAgICAgICAgMyBhcmd1bWVudCAoZXZlbnxvZGR8XFxkKnxcXGQqbihbKy1dXFxkKyk/fC4uLilcclxuICAgICAgICAgICAgICAgIDQgeG4tY29tcG9uZW50IG9mIHhuK3kgYXJndW1lbnQgKFsrLV0/XFxkKm58KVxyXG4gICAgICAgICAgICAgICAgNSBzaWduIG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNiB4IG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNyBzaWduIG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA4IHkgb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXS5zbGljZSgwLCAzKSA9PT0gJ250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIG50aC0qIHJlcXVpcmVzIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgUFNFVURPOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICB2YXIgZXhjZXNzLFxyXG4gICAgICAgICAgICAgICAgdW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoUl9NQVRDSF9FWFBSLkNISUxELnRlc3QobWF0Y2hbMF0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWNjZXB0IHF1b3RlZCBhcmd1bWVudHMgYXMtaXNcclxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgLy8gU3RyaXAgZXhjZXNzIGNoYXJhY3RlcnMgZnJvbSB1bnF1b3RlZCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1bnF1b3RlZCAmJiBSX1BTRVVETy50ZXN0KHVucXVvdGVkKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB0b2tlbml6ZSh1bnF1b3RlZCwgdHJ1ZSkpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB1bnF1b3RlZC5pbmRleE9mKCcpJywgdW5xdW90ZWQubGVuZ3RoIC0gZXhjZXNzKSAtIHVucXVvdGVkLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleGNlc3MgaXMgYSBuZWdhdGl2ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSB1bnF1b3RlZC5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBbcGFyc2VPbmx5PWZhbHNlXVxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXXxOdW1iZXJ8bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgdG9rZW5pemUgPSBmdW5jdGlvbihzZWxlY3RvciwgcGFyc2VPbmx5KSB7XHJcbiAgICBpZiAodG9rZW5DYWNoZS5oYXMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlT25seSA/IDAgOiB0b2tlbkNhY2hlLmdldChzZWxlY3Rvcikuc2xpY2UoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHR5cGUsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7UmVnRXhwfSAqL1xyXG4gICAgICAgIHJlZ2V4LFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge0FycmF5fSAqL1xyXG4gICAgICAgIG1hdGNoLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBtYXRjaGVkLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ1tdfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJpZXMgPSBbXSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc3VicXVlcnkgPSAnJyxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc29GYXIgPSBzZWxlY3RvcjtcclxuXHJcbiAgICB3aGlsZSAoc29GYXIpIHtcclxuICAgICAgICAvLyBDb21tYSBhbmQgZmlyc3QgcnVuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkIHx8IChtYXRjaCA9IFJfQ09NTUEuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uc3VtZSB0cmFpbGluZyBjb21tYXMgYXMgdmFsaWRcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKSB8fCBzb0ZhcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG4gICAgICAgICAgICBzdWJxdWVyeSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF0Y2hlZCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIENvbWJpbmF0b3JzXHJcbiAgICAgICAgaWYgKChtYXRjaCA9IFJfQ09NQklOQVRPUlMuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpbHRlcnNcclxuICAgICAgICBmb3IgKHR5cGUgaW4gUl9NQVRDSF9FWFBSKSB7XHJcbiAgICAgICAgICAgIHJlZ2V4ID0gUl9NQVRDSF9FWFBSW3R5cGVdO1xyXG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc29GYXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmICghcHJlRmlsdGVyW3R5cGVdIHx8IChtYXRjaCA9IHByZUZpbHRlclt0eXBlXShtYXRjaCkpKSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbWF0Y2hlZCkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuXHJcbiAgICAvLyBSZXR1cm4gdGhlIGxlbmd0aCBvZiB0aGUgaW52YWxpZCBleGNlc3NcclxuICAgIC8vIGlmIHdlJ3JlIGp1c3QgcGFyc2luZy5cclxuICAgIGlmIChwYXJzZU9ubHkpIHsgcmV0dXJuIHNvRmFyLmxlbmd0aDsgfVxyXG5cclxuICAgIGlmIChzb0ZhcikgeyBlcnJvcihzZWxlY3Rvcik7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgcmV0dXJuIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCBzdWJxdWVyaWVzKS5zbGljZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmdbXXxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZyB0aGUgc2VsZWN0b3IuXHJcbiAgICAgKi9cclxuICAgIHN1YnF1ZXJpZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHN1YnF1ZXJ5Q2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgICAgICBzdWJxdWVyeUNhY2hlLmdldChzZWxlY3RvcikgOiBcclxuICAgICAgICAgICAgc3VicXVlcnlDYWNoZS5wdXQoc2VsZWN0b3IsICgpID0+IHRva2VuaXplKHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzQm9vbDogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiBSX01BVENIX0VYUFIuYm9vbC50ZXN0KG5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IDI7IiwibW9kdWxlLmV4cG9ydHMgPSA4OyIsIm1vZHVsZS5leHBvcnRzID0gOTsiLCJtb2R1bGUuZXhwb3J0cyA9IDExOyIsIm1vZHVsZS5leHBvcnRzID0gMTsiLCJtb2R1bGUuZXhwb3J0cyA9IDM7IiwiICAgIC8vIE1hdGNoZXMgXCItbXMtXCIgc28gdGhhdCBpdCBjYW4gYmUgY2hhbmdlZCB0byBcIm1zLVwiXHJcbnZhciBUUlVOQ0FURV9NU19QUkVGSVggID0gL14tbXMtLyxcclxuXHJcbiAgICAvLyBNYXRjaGVzIGRhc2hlZCBzdHJpbmcgZm9yIGNhbWVsaXppbmdcclxuICAgIERBU0hfQ0FUQ0ggICAgICAgICAgPSAvLShbXFxkYS16XSkvZ2ksXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIm5vbmVcIiBvciBhIHRhYmxlIHR5cGUgZS5nLiBcInRhYmxlXCIsXHJcbiAgICAvLyBcInRhYmxlLWNlbGxcIiBldGMuLi5cclxuICAgIE5PTkVfT1JfVEFCTEUgICAgICAgPSAvXihub25lfHRhYmxlKD8hLWNbZWFdKS4rKS8sXHJcbiAgICBcclxuICAgIFRZUEVfVEVTVF9GT0NVU0FCTEUgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxidXR0b258b2JqZWN0KSQvaSxcclxuICAgIFRZUEVfVEVTVF9DTElDS0FCTEUgPSAvXig/OmF8YXJlYSkkL2ksXHJcbiAgICBTRUxFQ1RPUl9JRCAgICAgICAgID0gL14jKFtcXHctXSspJC8sXHJcbiAgICBTRUxFQ1RPUl9UQUcgICAgICAgID0gL15bXFx3LV0rJC8sXHJcbiAgICBTRUxFQ1RPUl9DTEFTUyAgICAgID0gL15cXC4oW1xcdy1dKykkLyxcclxuICAgIFBPU0lUSU9OICAgICAgICAgICAgPSAvXih0b3B8cmlnaHR8Ym90dG9tfGxlZnQpJC8sXHJcbiAgICBOVU1fTk9OX1BYICAgICAgICAgID0gbmV3IFJlZ0V4cCgnXignICsgKC9bKy1dPyg/OlxcZCpcXC58KVxcZCsoPzpbZUVdWystXT9cXGQrfCkvKS5zb3VyY2UgKyAnKSg/IXB4KVthLXolXSskJywgJ2knKSxcclxuICAgIFNJTkdMRV9UQUcgICAgICAgICAgPSAvXjwoXFx3KylcXHMqXFwvPz4oPzo8XFwvXFwxPnwpJC8sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYXAgb2YgcGFyZW50IHRhZyBuYW1lcyB0byB0aGUgY2hpbGQgdGFncyB0aGF0IHJlcXVpcmUgdGhlbS5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIFBBUkVOVF9NQVAgPSB7XHJcbiAgICAgICAgdGFibGU6ICAgIC9ePCg/OnRib2R5fHRmb290fHRoZWFkfGNvbGdyb3VwfGNhcHRpb24pXFxiLyxcclxuICAgICAgICB0Ym9keTogICAgL148KD86dHIpXFxiLyxcclxuICAgICAgICB0cjogICAgICAgL148KD86dGR8dGgpXFxiLyxcclxuICAgICAgICBjb2xncm91cDogL148KD86Y29sKVxcYi8sXHJcbiAgICAgICAgc2VsZWN0OiAgIC9ePCg/Om9wdGlvbilcXGIvXHJcbiAgICB9O1xyXG5cclxuLy8gaGF2aW5nIGNhY2hlcyBpc24ndCBhY3R1YWxseSBmYXN0ZXJcclxuLy8gZm9yIGEgbWFqb3JpdHkgb2YgdXNlIGNhc2VzIGZvciBzdHJpbmdcclxuLy8gbWFuaXB1bGF0aW9uc1xyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9zaW1wbGUtY2FjaGUtZm9yLXN0cmluZy1tYW5pcFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG51bU5vdFB4OiAgICAgICAodmFsKSA9PiBOVU1fTk9OX1BYLnRlc3QodmFsKSxcclxuICAgIHBvc2l0aW9uOiAgICAgICAodmFsKSA9PiBQT1NJVElPTi50ZXN0KHZhbCksXHJcbiAgICBzaW5nbGVUYWdNYXRjaDogKHZhbCkgPT4gU0lOR0xFX1RBRy5leGVjKHZhbCksXHJcbiAgICBpc05vbmVPclRhYmxlOiAgKHN0cikgPT4gTk9ORV9PUl9UQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0ZvY3VzYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0ZPQ1VTQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0NsaWNrYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0NMSUNLQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc1N0cmljdElkOiAgICAgKHN0cikgPT4gU0VMRUNUT1JfSUQudGVzdChzdHIpLFxyXG4gICAgaXNUYWc6ICAgICAgICAgIChzdHIpID0+IFNFTEVDVE9SX1RBRy50ZXN0KHN0ciksXHJcbiAgICBpc0NsYXNzOiAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfQ0xBU1MudGVzdChzdHIpLFxyXG5cclxuICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKFRSVU5DQVRFX01TX1BSRUZJWCwgJ21zLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKERBU0hfQ0FUQ0gsIChtYXRjaCwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudFRhZ05hbWU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciB2YWwgPSBzdHIuc3Vic3RyKDAsIDMwKTtcclxuICAgICAgICBmb3IgKHZhciBwYXJlbnRUYWdOYW1lIGluIFBBUkVOVF9NQVApIHtcclxuICAgICAgICAgICAgaWYgKFBBUkVOVF9NQVBbcGFyZW50VGFnTmFtZV0udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50VGFnTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ2Rpdic7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBESVYgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKSxcclxuICAgIGEgICAgICA9IERJVi5xdWVyeVNlbGVjdG9yKCdhJyksXHJcbiAgICBzZWxlY3QgPSBjcmVhdGUoJ3NlbGVjdCcpLFxyXG4gICAgb3B0aW9uID0gc2VsZWN0LmFwcGVuZENoaWxkKGNyZWF0ZSgnb3B0aW9uJykpO1xyXG5cclxudmFyIHRlc3QgPSBmdW5jdGlvbih0YWdOYW1lLCB0ZXN0Rm4pIHtcclxuICAgIC8vIEF2b2lkIHZhcmlhYmxlIHJlZmVyZW5jZXMgdG8gZWxlbWVudHMgdG8gcHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUUuXHJcbiAgICByZXR1cm4gdGVzdEZuKGNyZWF0ZSh0YWdOYW1lKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IFVSTHMgYXJlbid0IG1hbmlwdWxhdGVkXHJcbiAgICAvLyAoSUUgbm9ybWFsaXplcyBpdCBieSBkZWZhdWx0KVxyXG4gICAgaHJlZk5vcm1hbGl6ZWQ6IGEuZ2V0QXR0cmlidXRlKCdocmVmJykgPT09ICcvYScsXHJcblxyXG4gICAgLy8gQ2hlY2sgdGhlIGRlZmF1bHQgY2hlY2tib3gvcmFkaW8gdmFsdWUgKCcnIGluIG9sZGVyIFdlYktpdDsgJ29uJyBlbHNld2hlcmUpXHJcbiAgICBjaGVja09uOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuICEhaW5wdXQudmFsdWU7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbiBpbnB1dCBtYWludGFpbnMgaXRzIHZhbHVlIGFmdGVyIGJlY29taW5nIGEgcmFkaW9cclxuICAgIC8vIFN1cHBvcnQ6IE1vZGVybiBicm93c2VycyBvbmx5IChOT1QgSUUgPD0gMTEpXHJcbiAgICByYWRpb1ZhbHVlOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQudmFsdWUgPSAndCc7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnZhbHVlID09PSAndCc7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBhIHNlbGVjdGVkLWJ5LWRlZmF1bHQgb3B0aW9uIGhhcyBhIHdvcmtpbmcgc2VsZWN0ZWQgcHJvcGVydHkuXHJcbiAgICAvLyAoV2ViS2l0IGRlZmF1bHRzIHRvIGZhbHNlIGluc3RlYWQgb2YgdHJ1ZSwgSUUgdG9vLCBpZiBpdCdzIGluIGFuIG9wdGdyb3VwKVxyXG4gICAgb3B0U2VsZWN0ZWQ6IG9wdGlvbi5zZWxlY3RlZCxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgb3B0aW9ucyBpbnNpZGUgZGlzYWJsZWQgc2VsZWN0cyBhcmVuJ3QgbWFya2VkIGFzIGRpc2FibGVkXHJcbiAgICAvLyAoV2ViS2l0IG1hcmtzIHRoZW0gYXMgZGlzYWJsZWQpXHJcbiAgICBvcHREaXNhYmxlZDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuICFvcHRpb24uZGlzYWJsZWQ7XHJcbiAgICB9KCkpLFxyXG4gICAgXHJcbiAgICB0ZXh0Q29udGVudDogRElWLnRleHRDb250ZW50ICE9PSB1bmRlZmluZWQsXHJcblxyXG4gICAgLy8gTW9kZXJuIGJyb3dzZXJzIG5vcm1hbGl6ZSBcXHJcXG4gdG8gXFxuIGluIHRleHRhcmVhIHZhbHVlcyxcclxuICAgIC8vIGJ1dCBJRSA8PSAxMSAoYW5kIHBvc3NpYmx5IG5ld2VyKSBkbyBub3QuXHJcbiAgICB2YWx1ZU5vcm1hbGl6ZWQ6IHRlc3QoJ3RleHRhcmVhJywgZnVuY3Rpb24odGV4dGFyZWEpIHtcclxuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9ICdcXHJcXG4nO1xyXG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS52YWx1ZSA9PT0gJ1xcbic7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBzZWxlY3RlZFNlbGVjdG9yOiB0ZXN0KCdzZWxlY3QnLCBmdW5jdGlvbihzZWxlY3QpIHtcclxuICAgICAgICBzZWxlY3QuaW5uZXJIVE1MID0gJzxvcHRpb24gdmFsdWU9XCIxXCI+MTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XCIyXCIgc2VsZWN0ZWQ+Mjwvb3B0aW9uPic7XHJcbiAgICAgICAgcmV0dXJuICEhc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJ29wdGlvbltzZWxlY3RlZF0nKTtcclxuICAgIH0pXHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRVxyXG5ESVYgPSBhID0gc2VsZWN0ID0gb3B0aW9uID0gbnVsbDtcclxuIiwidmFyIGV4aXN0cyAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgc2xpY2UgICAgICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyk7XHJcblxyXG52YXIgbG9vcCA9IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSkge1xyXG4gICAgICAgIGlmICghb2JqIHx8ICFpdGVyYXRlZSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7XHJcbiAgICAgICAgaWYgKGxlbmd0aCA9PT0gK2xlbmd0aCkge1xyXG4gICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGl0ZXJhdGVlLCBvYmpbaWR4XSwgaWR4LCBvYmopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xyXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpdGVyYXRvcihpdGVyYXRlZSwgb2JqW2tleXNbaWR4XV0sIGtleXNbaWR4XSwgb2JqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBfID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBGbGF0dGVuIHRoYXQgYWxzbyBjaGVja3MgaWYgdmFsdWUgaXMgYSBOb2RlTGlzdFxyXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpIHx8IGlzTm9kZUxpc3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KF8uZmxhdHRlbih2YWx1ZSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICB0b1B4OiAodmFsdWUpID0+IHZhbHVlICsgJ3B4JyxcclxuICAgIFxyXG4gICAgcGFyc2VJbnQ6IChudW0pID0+IHBhcnNlSW50KG51bSwgMTApLFxyXG5cclxuICAgIGV2ZXJ5OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdHMoYXJyKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAoIWl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4dGVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIG9iaiAgPSBhcmdzWzBdLFxyXG4gICAgICAgICAgICBsZW4gID0gYXJncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICghb2JqIHx8IGxlbiA8IDIpIHsgcmV0dXJuIG9iajsgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmdzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdGFuZGFyZCBtYXBcclxuICAgIG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBcnJheS1wcmVzZXJ2aW5nIG1hcFxyXG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vcHVzaC1tYXAtdnMtaW5kZXgtcmVwbGFjZW1lbnQtbWFwXHJcbiAgICBmYXN0bWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoYXJyICYmIGFyci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXJyW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKGFyciAmJiBhcnIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gcHVsbGVkIGZyb20gQU1EXHJcbiAgICB0eXBlY2FzdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFyIHI7XHJcbiAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09ICdudWxsJykge1xyXG4gICAgICAgICAgICByID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3RydWUnKSB7XHJcbiAgICAgICAgICAgIHIgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIHIgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJycgfHwgaXNOYU4odmFsKSkge1xyXG4gICAgICAgICAgICAvLyBpc05hTignJykgcmV0dXJucyBmYWxzZVxyXG4gICAgICAgICAgICByID0gdmFsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHBhcnNlRmxvYXQobnVsbCB8fCAnJykgcmV0dXJucyBOYU5cclxuICAgICAgICAgICAgciA9IHBhcnNlRmxvYXQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlKG9iaik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXJyLFxyXG4gICAgICAgICAgICBsZW4gPSArb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGFycltpZHhdID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgYXJyLnB1c2gob2JqW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQXJyYXk6IChhcmcpID0+XHJcbiAgICAgICAgIWV4aXN0cyhhcmcpID8gW10gOlxyXG4gICAgICAgIGlzQXJyYXlMaWtlKGFyZykgPyBzbGljZShhcmcpIDogWyBhcmcgXSxcclxuXHJcbiAgICBjb250YWluczogKGFyciwgaXRlbSkgPT4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xLFxyXG5cclxuICAgIGpxRWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4LCBjb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgZm4uY2FsbCh2YWx1ZSwga2V5SW5kZXgsIHZhbHVlLCBjb2xsZWN0aW9uKTtcclxuICAgIH0pLFxyXG5cclxuICAgIGRFYWNoOiBsb29wKGZ1bmN0aW9uKGZuLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pIHtcclxuICAgICAgICBmbi5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5SW5kZXgsIGNvbGxlY3Rpb24pO1xyXG4gICAgfSksXHJcblxyXG4gICAgZWFjaDogbG9vcChmdW5jdGlvbihmbiwgdmFsdWUsIGtleUluZGV4KSB7XHJcbiAgICAgICAgZm4odmFsdWUsIGtleUluZGV4KTtcclxuICAgIH0pLFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggZWFjaCBlbGVtZW50IGluIHRoZVxyXG4gICAgICAgIC8vIHNlY29uZCBhcnJheSBhbmQgYWRkIGl0IHRvIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtpZHhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgfVxyXG59OyIsInZhciBkZWxldGVyID0gKGRlbGV0YWJsZSkgPT5cclxuICAgIGRlbGV0YWJsZSA/IFxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgZGVsZXRlIHN0b3JlW2tleV07IH0gOlxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgc3RvcmVba2V5XSA9IHVuZGVmaW5lZDsgfTtcclxuXHJcbnZhciBnZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gc3RvcmUgJiYgc3RvcmVba2V5XSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleSwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIGRlbChzdG9yZSwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGJpTGV2ZWxHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgaGFzMSA9IGtleTEgaW4gc3RvcmUgJiYgc3RvcmVba2V5MV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKCFoYXMxIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoYXMxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ga2V5MiBpbiBzdG9yZVtrZXkxXSAmJiBzdG9yZVtrZXkxXVtrZXkyXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV07XHJcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gcmVmMSA6IChyZWYxICE9PSB1bmRlZmluZWQgPyByZWYxW2tleTJdIDogcmVmMSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICAvLyBFYXN5IHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWwoc3RvcmUsIGtleTEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEZWVwIHJlbW92YWxcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXSB8fCAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIGRlbChyZWYxLCBrZXkyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsdmwsIGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGx2bCA9PT0gMiA/IGJpTGV2ZWxHZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKSA6IGdldHRlclNldHRlcihkZWxldGFibGUpO1xyXG59OyIsInZhciBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzLnNldCA9IChEKSA9PiBjb25zdHJ1Y3RvciA9IEQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgK3ZhbHVlLmxlbmd0aCA9PT0gdmFsdWUubGVuZ3RoO1xyXG4iLCJ2YXIgRE9DVU1FTlRfRlJBR01FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlRfRlJBR01FTlQnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLm5vZGVUeXBlICE9PSBET0NVTUVOVF9GUkFHTUVOVCAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9EJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgRUxFTUVOVCAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCB2YWx1ZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgKCEhdmFsdWUgJiYgdHlwZSA9PT0gJ29iamVjdCcpO1xyXG59OyIsInZhciBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWwpID0+XHJcbiAgICB2YWwgJiYgKGlzU3RyaW5nKHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpIHx8IGlzRWxlbWVudCh2YWwpIHx8IGlzQ29sbGVjdGlvbih2YWwpKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJzsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IHZhbHVlLndpbmRvdztcclxuIiwidmFyIEVMRU1FTlQgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQgPyBtYXRjaGVzU2VsZWN0b3IuY2FsbChlbGVtLCBzZWxlY3RvcikgOiBmYWxzZTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IG51bGw7XHJcbiIsInZhciBfICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIHNsaWNlICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyksXHJcbiAgICBtYXAgICAgID0gcmVxdWlyZSgnLi9tYXAnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHNsaWNlKHRoaXMpOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAraW5kZXg7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbXHJcbiAgICAgICAgICAgIC8vIExvb2tpbmcgdG8gZ2V0IGFuIGluZGV4IGZyb20gdGhlIGVuZCBvZiB0aGUgc2V0XHJcbiAgICAgICAgICAgIC8vIGlmIG5lZ2F0aXZlLCBvciB0aGUgc3RhcnQgb2YgdGhlIHNldCBpZiBwb3NpdGl2ZVxyXG4gICAgICAgICAgICBpZHggPCAwID8gdGhpcy5sZW5ndGggKyBpZHggOiBpZHhcclxuICAgICAgICBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgIHJldHVybiBEKHNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbMF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzW3RoaXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICByZXR1cm4gRChtYXAodGhpcywgaXRlcmF0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBfLmRFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZm9yRWFjaDogZnVuY3Rpb24oaXRlcmF0b3IpIHtcclxuICAgICAgICBfLmRFYWNoKHRoaXMsIGl0ZXJhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgaWYgKCFhcnIubGVuZ3RoIHx8ICFpdGVyYXRvcikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgIGl0ZW07XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIGl0ZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb25jYXQgZmxhdCBmb3IgYSBzaW5nbGUgYXJyYXkgb2YgYXJyYXlzXHJcbiAgICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCByZXN1bHRzKTtcclxufTsiLCJ2YXIgb3JkZXIgPSByZXF1aXJlKCdvcmRlcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICB2YXIgaGFzRHVwbGljYXRlcyA9IG9yZGVyLnNvcnQocmVzdWx0cyk7XHJcbiAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgZWxlbSxcclxuICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgIC8vIHNvIHRoYXQgYSBuZXcgYXJyYXkgaXNuJ3RcclxuICAgICAgICAvLyBjcmVhdGVkL2Rlc3Ryb3llZCBldmVyeSB1bmlxdWUgY2FsbFxyXG4gICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAvLyBHbyB0aHJvdWdoIHRoZSBhcnJheSBhbmQgaWRlbnRpZnlcclxuICAgIC8vIHRoZSBkdXBsaWNhdGVzIHRvIGJlIHJlbW92ZWRcclxuICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgIGlmIChlbGVtID09PSByZXN1bHRzW2lkeF0pIHtcclxuICAgICAgICAgICAgZHVwbGljYXRlcy5wdXNoKGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgcmVzdWx0cy5zcGxpY2UoZHVwbGljYXRlc1tpZHhdLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgICAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc0VsZW1lbnQnKSxcclxuICAgIGlzTm9kZU5hbWUgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIG5ld2xpbmVzICAgICAgICAgICAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIEVMRU1FTlQgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBzcGxpdCAgICAgPSByZXF1aXJlKCdzdHJpbmcvc3BsaXQnKSxcclxuICAgIGlzRW1wdHkgICA9IHJlcXVpcmUoJ3N0cmluZy9pc0VtcHR5Jyk7XHJcblxyXG52YXIgYWRkQ2xhc3MgPSBmdW5jdGlvbihjbGFzc0xpc3QsIG5hbWUpIHtcclxuICAgICAgICBjbGFzc0xpc3QuYWRkKG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGNsYXNzTGlzdCwgbmFtZSkge1xyXG4gICAgICAgIGNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzID0gZnVuY3Rpb24oY2xhc3NMaXN0LCBuYW1lKSB7XHJcbiAgICAgICAgY2xhc3NMaXN0LnRvZ2dsZShuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgZG91YmxlQ2xhc3NMb29wID0gZnVuY3Rpb24oZWxlbXMsIG5hbWVzLCBtZXRob2QpIHtcclxuICAgICAgICB2YXIgaWR4ID0gZWxlbXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBlbGVtID0gZWxlbXNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICAgICAgY2xhc3NMaXN0ID0gZWxlbS5jbGFzc0xpc3Q7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZChjbGFzc0xpc3QsIG5hbWVzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZWxlbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvQW55RWxlbXNIYXZlQ2xhc3MgPSBmdW5jdGlvbihlbGVtcywgbmFtZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tpZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tpZHhdLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbENsYXNzZXMgPSBmdW5jdGlvbihlbGVtcykge1xyXG4gICAgICAgIHZhciBpZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tpZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGVsZW1zW2lkeF0uY2xhc3NOYW1lID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBlbGVtcztcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggJiYgIWlzRW1wdHkobmFtZSkgPyBkb0FueUVsZW1zSGF2ZUNsYXNzKHRoaXMsIG5hbWUpIDogZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkgeyBuYW1lcyA9IHNwbGl0KG5hbWVzKTsgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5hbWVzLmxlbmd0aCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lcywgYWRkQ2xhc3MpIDogdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbihuYW1lcykge1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUFsbENsYXNzZXModGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7IG5hbWVzID0gc3BsaXQobmFtZXMpOyB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG5hbWVzKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmFtZXMubGVuZ3RoID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVzLCByZW1vdmVDbGFzcykgOiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzOiBmdW5jdGlvbihuYW1lcywgc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgdmFyIG5hbWVMaXN0O1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCAhdGhpcy5sZW5ndGggfHwgIShuYW1lTGlzdCA9IHNwbGl0KG5hbWVzKSkubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaG91bGRBZGQgPT09IHVuZGVmaW5lZCA/IGRvdWJsZUNsYXNzTG9vcCh0aGlzLCBuYW1lTGlzdCwgdG9nZ2xlQ2xhc3MpIDpcclxuICAgICAgICAgICAgc2hvdWxkQWRkID8gZG91YmxlQ2xhc3NMb29wKHRoaXMsIG5hbWVMaXN0LCBhZGRDbGFzcykgOlxyXG4gICAgICAgICAgICBkb3VibGVDbGFzc0xvb3AodGhpcywgbmFtZUxpc3QsIHJlbW92ZUNsYXNzKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNEb2N1bWVudCA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Jvb2xlYW4gID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBET0NVTUVOVCAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncyA9IHtcclxuICAgIGRpc3BsYXk6ICAgICdibG9jaycsXHJcbiAgICBwb3NpdGlvbjogICAnYWJzb2x1dGUnLFxyXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcclxufTtcclxuXHJcbnZhciBnZXREb2N1bWVudERpbWVuc2lvbiA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIC8vIEVpdGhlciBzY3JvbGxbV2lkdGgvSGVpZ2h0XSBvciBvZmZzZXRbV2lkdGgvSGVpZ2h0XSBvclxyXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0sIHdoaWNoZXZlciBpcyBncmVhdGVzdFxyXG4gICAgdmFyIGRvYyA9IGVsZW0uZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KFxyXG4gICAgICAgIGVsZW0uYm9keVsnc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGVsZW0uYm9keVsnb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBkb2NbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydjbGllbnQnICsgbmFtZV1cclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgaGlkZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9LFxyXG4gICAgc2hvdyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgY3NzU3dhcCA9IGZ1bmN0aW9uKGVsZW0sIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG9sZCA9IHt9O1xyXG5cclxuICAgICAgICAvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvbGRbbmFtZV0gPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhlbGVtKTtcclxuXHJcbiAgICAgICAgLy8gUmV2ZXJ0IHRoZSBvbGQgdmFsdWVzXHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9sZFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEF2b2lkcyBhbiAnSWxsZWdhbCBJbnZvY2F0aW9uJyBlcnJvciAoQ2hyb21lKVxyXG4gICAgLy8gQXZvaWRzIGEgJ1R5cGVFcnJvcjogQXJndW1lbnQgMSBvZiBXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkb2VzIG5vdCBpbXBsZW1lbnQgaW50ZXJmYWNlIEVsZW1lbnQnIGVycm9yIChGaXJlZm94KVxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZSA9IChlbGVtKSA9PlxyXG4gICAgICAgIGlzRWxlbWVudChlbGVtKSAmJiAhaXNXaW5kb3coZWxlbSkgJiYgIWlzRG9jdW1lbnQoZWxlbSkgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSA6IG51bGwsXHJcblxyXG4gICAgX3dpZHRoID0ge1xyXG4gICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBET0NVTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdXaWR0aCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAod2lkdGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUud2lkdGggPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9oZWlnaHQgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IERPQ1VNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ0hlaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBnZXRXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG5cclxuICAgIC8vIFN0YXJ0IHdpdGggb2Zmc2V0IHByb3BlcnR5LCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIHRoZSBib3JkZXItYm94IHZhbHVlXHJcbiAgICB2YXIgdmFsdWVJc0JvcmRlckJveCA9IHRydWUsXHJcbiAgICAgICAgdmFsID0gKG5hbWUgPT09ICd3aWR0aCcpID8gZWxlbS5vZmZzZXRXaWR0aCA6IGVsZW0ub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICAgIHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgaXNCb3JkZXJCb3ggPSBzdHlsZXMuYm94U2l6aW5nID09PSAnYm9yZGVyLWJveCc7XHJcblxyXG4gICAgLy8gc29tZSBub24taHRtbCBlbGVtZW50cyByZXR1cm4gdW5kZWZpbmVkIGZvciBvZmZzZXRXaWR0aCwgc28gY2hlY2sgZm9yIG51bGwvdW5kZWZpbmVkXHJcbiAgICAvLyBzdmcgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02NDkyODVcclxuICAgIC8vIE1hdGhNTCAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTQ5MTY2OFxyXG4gICAgaWYgKHZhbCA8PSAwIHx8ICFleGlzdHModmFsKSkge1xyXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBjb21wdXRlZCB0aGVuIHVuY29tcHV0ZWQgY3NzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgIHZhbCA9IGN1ckNzcyhlbGVtLCBuYW1lLCBzdHlsZXMpO1xyXG4gICAgICAgIGlmICh2YWwgPCAwIHx8ICF2YWwpIHsgdmFsID0gZWxlbS5zdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlZCB1bml0IGlzIG5vdCBwaXhlbHMuIFN0b3AgaGVyZSBhbmQgcmV0dXJuLlxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeCh2YWwpKSB7IHJldHVybiB2YWw7IH1cclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0aGUgY2hlY2sgZm9yIHN0eWxlIGluIGNhc2UgYSBicm93c2VyIHdoaWNoIHJldHVybnMgdW5yZWxpYWJsZSB2YWx1ZXNcclxuICAgICAgICAvLyBmb3IgZ2V0Q29tcHV0ZWRTdHlsZSBzaWxlbnRseSBmYWxscyBiYWNrIHRvIHRoZSByZWxpYWJsZSBlbGVtLnN0eWxlXHJcbiAgICAgICAgdmFsdWVJc0JvcmRlckJveCA9IGlzQm9yZGVyQm94ICYmIHZhbCA9PT0gc3R5bGVzW25hbWVdO1xyXG5cclxuICAgICAgICAvLyBOb3JtYWxpemUgJycsIGF1dG8sIGFuZCBwcmVwYXJlIGZvciBleHRyYVxyXG4gICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVzZSB0aGUgYWN0aXZlIGJveC1zaXppbmcgbW9kZWwgdG8gYWRkL3N1YnRyYWN0IGlycmVsZXZhbnQgc3R5bGVzXHJcbiAgICByZXR1cm4gXy50b1B4KFxyXG4gICAgICAgIHZhbCArIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0KFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnLFxyXG4gICAgICAgICAgICB2YWx1ZUlzQm9yZGVyQm94LFxyXG4gICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICApXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIENTU19FWFBBTkQgPSBzcGxpdCgnVG9wfFJpZ2h0fEJvdHRvbXxMZWZ0Jyk7XHJcbnZhciBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGV4dHJhLCBpc0JvcmRlckJveCwgc3R5bGVzKSB7XHJcbiAgICB2YXIgdmFsID0gMCxcclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHJpZ2h0IG1lYXN1cmVtZW50LCBhdm9pZCBhdWdtZW50YXRpb25cclxuICAgICAgICBpZHggPSAoZXh0cmEgPT09IChpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnKSkgP1xyXG4gICAgICAgICAgICA0IDpcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGluaXRpYWxpemUgZm9yIGhvcml6b250YWwgb3IgdmVydGljYWwgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAobmFtZSA9PT0gJ3dpZHRoJykgP1xyXG4gICAgICAgICAgICAxIDpcclxuICAgICAgICAgICAgMCxcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIC8vIFB1bGxlZCBvdXQgb2YgdGhlIGxvb3AgdG8gcmVkdWNlIHN0cmluZyBjb21wYXJpc29uc1xyXG4gICAgICAgIGV4dHJhSXNNYXJnaW4gID0gKGV4dHJhID09PSAnbWFyZ2luJyksXHJcbiAgICAgICAgZXh0cmFJc0NvbnRlbnQgPSAoIWV4dHJhSXNNYXJnaW4gJiYgZXh0cmEgPT09ICdjb250ZW50JyksXHJcbiAgICAgICAgZXh0cmFJc1BhZGRpbmcgPSAoIWV4dHJhSXNNYXJnaW4gJiYgIWV4dHJhSXNDb250ZW50ICYmIGV4dHJhID09PSAncGFkZGluZycpO1xyXG5cclxuICAgIGZvciAoOyBpZHggPCA0OyBpZHggKz0gMikge1xyXG4gICAgICAgIHR5cGUgPSBDU1NfRVhQQU5EW2lkeF07XHJcblxyXG4gICAgICAgIC8vIGJvdGggYm94IG1vZGVscyBleGNsdWRlIG1hcmdpbiwgc28gYWRkIGl0IGlmIHdlIHdhbnQgaXRcclxuICAgICAgICBpZiAoZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbZXh0cmEgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0JvcmRlckJveCkge1xyXG5cclxuICAgICAgICAgICAgLy8gYm9yZGVyLWJveCBpbmNsdWRlcyBwYWRkaW5nLCBzbyByZW1vdmUgaXQgaWYgd2Ugd2FudCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IF8ucGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBib3JkZXIgbm9yIG1hcmdpbiwgc28gcmVtb3ZlIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoIWV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGUgKyAnV2lkdGgnXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCwgc28gYWRkIHBhZGRpbmdcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCBub3IgcGFkZGluZywgc28gYWRkIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc1BhZGRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWw7XHJcbn07XHJcblxyXG52YXIgY3VyQ3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgY29tcHV0ZWQpIHtcclxuICAgIHZhciBzdHlsZSA9IGVsZW0uc3R5bGUsXHJcbiAgICAgICAgc3R5bGVzID0gY29tcHV0ZWQgfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICByZXQgPSBzdHlsZXMgPyBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKSB8fCBzdHlsZXNbbmFtZV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQXZvaWQgc2V0dGluZyByZXQgdG8gZW1wdHkgc3RyaW5nIGhlcmVcclxuICAgIC8vIHNvIHdlIGRvbid0IGRlZmF1bHQgdG8gYXV0b1xyXG4gICAgaWYgKCFleGlzdHMocmV0KSAmJiBzdHlsZSAmJiBzdHlsZVtuYW1lXSkgeyByZXQgPSBzdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgIC8vIEZyb20gdGhlIGhhY2sgYnkgRGVhbiBFZHdhcmRzXHJcbiAgICAvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXHJcblxyXG4gICAgaWYgKHN0eWxlcykge1xyXG4gICAgICAgIGlmIChyZXQgPT09ICcnICYmICFpc0F0dGFjaGVkKGVsZW0pKSB7XHJcbiAgICAgICAgICAgIHJldCA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgcmVndWxhciBwaXhlbCBudW1iZXJcclxuICAgICAgICAvLyBidXQgYSBudW1iZXIgdGhhdCBoYXMgYSB3ZWlyZCBlbmRpbmcsIHdlIG5lZWQgdG8gY29udmVydCBpdCB0byBwaXhlbHNcclxuICAgICAgICAvLyBidXQgbm90IHBvc2l0aW9uIGNzcyBhdHRyaWJ1dGVzLCBhcyB0aG9zZSBhcmUgcHJvcG9ydGlvbmFsIHRvIHRoZSBwYXJlbnQgZWxlbWVudCBpbnN0ZWFkXHJcbiAgICAgICAgLy8gYW5kIHdlIGNhbid0IG1lYXN1cmUgdGhlIHBhcmVudCBpbnN0ZWFkIGJlY2F1c2UgaXQgbWlnaHQgdHJpZ2dlciBhICdzdGFja2luZyBkb2xscycgcHJvYmxlbVxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeChyZXQpICYmICFSRUdFWC5wb3NpdGlvbihuYW1lKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICBycyA9IGVsZW0ucnVudGltZVN0eWxlLFxyXG4gICAgICAgICAgICAgICAgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDsgfVxyXG5cclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IChuYW1lID09PSAnZm9udFNpemUnKSA/ICcxZW0nIDogcmV0O1xyXG4gICAgICAgICAgICByZXQgPSBfLnRvUHgoc3R5bGUucGl4ZWxMZWZ0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IHJzTGVmdDsgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0ID09PSB1bmRlZmluZWQgPyByZXQgOiByZXQgKyAnJyB8fCAnYXV0byc7XHJcbn07XHJcblxyXG52YXIgbm9ybWFsaXplQ3NzS2V5ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgcmV0dXJuIFJFR0VYLmNhbWVsQ2FzZShuYW1lKTtcclxufTtcclxuXHJcbnZhciBzZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgZWxlbS5zdHlsZVtuYW1lXSA9ICh2YWx1ZSA9PT0gK3ZhbHVlKSA/IF8udG9QeCh2YWx1ZSkgOiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVtuYW1lXTtcclxufTtcclxuXHJcbnZhciBpc0hpZGRlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQ6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC5vZmZzZXRQYXJlbnRcclxuICAgIHJldHVybiBlbGVtLm9mZnNldFBhcmVudCA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAvLyBTdXBwb3J0OiBPcGVyYSA8PSAxMi4xMlxyXG4gICAgICAgICAgICAvLyBPcGVyYSByZXBvcnRzIG9mZnNldFdpZHRocyBhbmQgb2Zmc2V0SGVpZ2h0cyBsZXNzIHRoYW4gemVybyBvbiBzb21lIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwIHx8XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICgoZWxlbS5zdHlsZSAmJiBlbGVtLnN0eWxlLmRpc3BsYXkpID8gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgOiBmYWxzZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGN1ckNzczogY3VyQ3NzLFxyXG4gICAgd2lkdGg6ICBfd2lkdGgsXHJcbiAgICBoZWlnaHQ6IF9oZWlnaHQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjc3M6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwgbmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIGtleSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghaWR4KSB7IHJldHVybiByZXQ7IH0gLy8gcmV0dXJuIGVhcmx5XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXRbdmFsdWVdID0gZ2V0U3R5bGUoZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGhpZGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgc2hvdyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNCb29sZWFuKHN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gaXNIaWRkZW4oZWxlbSkgPyBzaG93KGVsZW0pIDogaGlkZShlbGVtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgyLCB0cnVlKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIEFDQ0VTU09SICA9ICdfX0RfaWRfXyAnLFxyXG4gICAgdW5pcXVlSWQgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoRGF0ZS5ub3coKSksXHJcblxyXG4gICAgZ2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0gPyBlbGVtW0FDQ0VTU09SXSA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE9yU2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghZWxlbSB8fCAoaWQgPSBlbGVtW0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtBQ0NFU1NPUl0gPSAoaWQgPSB1bmlxdWVJZCgpKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc0RhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5oYXMoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IGdldE9yU2V0SWQoZWxlbSk7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZURhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVtb3ZlOiAoZWxlbSwgc3RyKSA9PlxyXG4gICAgICAgIHN0ciA9PT0gdW5kZWZpbmVkID8gcmVtb3ZlQWxsRGF0YShlbGVtKSA6IHJlbW92ZURhdGEoZWxlbSwgc3RyKSxcclxuXHJcbiAgICBEOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldERhdGEoZWxlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHBhc3NlZFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWxsRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzRGF0YTogKGVsZW0pID0+XHJcbiAgICAgICAgICAgIGlzRWxlbWVudChlbGVtKSA/IGhhc0RhdGEoZWxlbSkgOiB0aGlzLFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGtleTtcclxuICAgICAgICAgICAgICAgIHZhciBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVBbGxEYXRhKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQga2V5J3MgdmFsdWVcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbZWxlbUlkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJySWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcnJJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2FycklkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzTnVtYmVyID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBjc3MgICAgICA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG52YXIgZ2V0SW5uZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdMZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdSaWdodCcpKSB8fCAwKTtcclxuICAgIH0sXHJcbiAgICBnZXRJbm5lckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChlbGVtKSkgfHwgMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGhlaWdodCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0ZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBnZXRJbm5lcldpZHRoKGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICB3aWR0aCArPSAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblJpZ2h0JykpIHx8IDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyTGVmdFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclJpZ2h0V2lkdGgnKSkgfHwgMCk7XHJcbiAgICB9LFxyXG4gICAgZ2V0T3V0ZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IGdldElubmVySGVpZ2h0KGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICBoZWlnaHQgKz0gKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkJvdHRvbScpKSB8fCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJUb3BXaWR0aCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKSB8fCAwKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgd2lkdGg6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy53aWR0aC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhlaWdodDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLmhlaWdodC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lcldpZHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVyV2lkdGgoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lckhlaWdodDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lckhlaWdodChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVyV2lkdGg6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlcldpZHRoKGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlckhlaWdodDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVySGVpZ2h0KGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaGFuZGxlcnMgPSB7fTtcclxuXHJcbnZhciByZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUsIHR5cGUsIGZpbHRlcikge1xyXG4gICAgaGFuZGxlcnNbbmFtZV0gPSB7XHJcbiAgICAgICAgZXZlbnQ6IHR5cGUsXHJcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXHJcbiAgICAgICAgd3JhcDogZnVuY3Rpb24oZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIobmFtZSwgZm4pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgd3JhcHBlciA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcbiAgICBpZiAoIWZuKSB7IHJldHVybiBmbjsgfVxyXG5cclxuICAgIHZhciBrZXkgPSAnX19kY2VfJyArIG5hbWU7XHJcbiAgICBpZiAoZm5ba2V5XSkgeyByZXR1cm4gZm5ba2V5XTsgfVxyXG5cclxuICAgIHJldHVybiBmbltrZXldID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBtYXRjaCA9IGhhbmRsZXJzW25hbWVdLmZpbHRlcihlKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5yZWdpc3RlcignbGVmdC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAxICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdtaWRkbGUtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMiAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcigncmlnaHQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMyAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZWdpc3RlcjogcmVnaXN0ZXIsXHJcbiAgICBoYW5kbGVyczogaGFuZGxlcnNcclxufTsiLCJ2YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50JyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIG1hdGNoZXMgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgZGVsZWdhdGVzID0ge307XHJcblxyXG4vLyB0aGlzIG1ldGhvZCBjYWNoZXMgZGVsZWdhdGVzIHNvIHRoYXQgLm9mZigpIHdvcmtzIHNlYW1sZXNzbHlcclxudmFyIGRlbGVnYXRlID0gZnVuY3Rpb24ocm9vdCwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoZGVsZWdhdGVzW2ZuLl9kZF0pIHsgcmV0dXJuIGRlbGVnYXRlc1tmbi5fZGRdOyB9XHJcblxyXG4gICAgdmFyIGlkID0gZm4uX2RkID0gRGF0ZS5ub3coKTtcclxuICAgIHJldHVybiBkZWxlZ2F0ZXNbaWRdID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gcm9vdCkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGV2ZW50ZWQgPSBmdW5jdGlvbihtZXRob2QsIGVsLCB0eXBlLCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmICghZXhpc3RzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZm4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGRlbGVnYXRlKGVsLCBzZWxlY3RvciwgZm4pKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5hZGQpLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5yZW1vdmUpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5mYWJyaWNhdGUpXHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGRlbGVnYXRlICAgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyksXHJcbiAgICBjdXN0b20gICAgID0gcmVxdWlyZSgnLi9jdXN0b20nKTtcclxuXHJcbnZhciBldmVudGVyID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZXMsIGZpbHRlciwgZm4pIHtcclxuICAgICAgICB2YXIgdHlwZWxpc3QgPSB0eXBlcy5zcGxpdCgnICcpO1xyXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmbikpIHtcclxuICAgICAgICAgICAgZm4gPSBmaWx0ZXI7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0eXBlbGlzdCwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjdXN0b20uaGFuZGxlcnNbdHlwZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCBoYW5kbGVyLmV2ZW50LCBmaWx0ZXIsIGhhbmRsZXIud3JhcChmbikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgdHlwZSwgZmlsdGVyLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvbjogICAgICBldmVudGVyKGRlbGVnYXRlLm9uKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZXIoZGVsZWdhdGUub2ZmKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZXIoZGVsZWdhdGUudHJpZ2dlcilcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzRWxlbWVudCAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNIdG1sICAgICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzQ29sbGVjdGlvbiAgID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc1dpbmRvdyAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIG9yZGVyICAgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIGRhdGEgICAgICAgICAgID0gcmVxdWlyZSgnLi9kYXRhJyksXHJcbiAgICBwYXJzZXIgICAgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpO1xyXG5cclxudmFyIGVtcHR5ID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gYXJyW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBlbGVtLmNsb25lTm9kZSh0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZnJhZy50ZXh0Q29udGVudCA9IHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCBwYXJzZXIoZWxlbSksIHBlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHN0cmluZ1RvRnJhZyhyZXN1bHQpKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNFbGVtZW50KHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHJlc3VsdCwgcGVuZGVyKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSA9IGZ1bmN0aW9uKGFyck9uZSwgYXJyVHdvLCBwZW5kZXIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyT25lLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGxlbiA9IGFyclR3by5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihhcnJPbmVbaWR4XSwgYXJyVHdvW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVsZW0sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGFyckVsZW0sIGVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbSA9IGZ1bmN0aW9uKGVsZW0sIGFyciwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoZWxlbSwgYXJyRWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgfSxcclxuICAgIHByZXBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5pbnNlcnRCZWZvcmUoZWxlbSwgYmFzZS5maXJzdENoaWxkKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFwcGVuZCAgOiBhcHBlbmQsXHJcbiAgICBwcmVwZW5kIDogcHJlcGVuZCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmFzdG1hcCh0aGlzLnNsaWNlKCksIChlbGVtKSA9PiBjbG9uZShlbGVtKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIGFwcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluc2VydEJlZm9yZTogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gRCh0YXJnZXQpWzBdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodGFyZ2V0LCB0aGlzLm5leHRTaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZnRlcjogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0YXJnZXQucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGluc2VydEFmdGVyOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFwcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgICAgIGQuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHZhciBvYmogPSBkO1xyXG4gICAgICAgICAgICBEKG9iaikuYXBwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwcmVwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcodmFsdWUpLCBwcmVwZW5kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnKCcnICsgdmFsdWUpLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRnVuYyh0aGlzLCBmbiwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBlbGVtLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSh0aGlzLCBhcnIsIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmRUbzogZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBpZiAoaXNEKGQpKSB7XHJcbiAgICAgICAgICAgICAgICBkLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5wcmVwZW5kKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbXB0eTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGVtcHR5KHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhZGQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIC8vIFN0cmluZyBzZWxlY3RvclxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIEQoc2VsZWN0b3IpLmdldCgpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBfLnRvQXJyYXkoYXJyKSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU2luZ2xlIGVsZW1lbnRcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KHNlbGVjdG9yKSB8fCBpc0RvY3VtZW50KHNlbGVjdG9yKSB8fCBpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW1zID0gdW5pcXVlKFxyXG4gICAgICAgICAgICAgICAgICAgIFtdLmNvbmNhdCh0aGlzLmdldCgpLCBbIGVsZW0gXSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBvcmRlci5zb3J0KGVsZW1zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBEKGVsZW1zKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIEQodGhpcyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIHJlbW92ZShhcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJlbW92ZSh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZGV0YWNoOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yRmlsdGVyKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIGRldGFjaChhcnIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIGRldGFjaCh0aGlzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBET0NfRUxFTSAgID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cclxudmFyIGdldFBvc2l0aW9uID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IGVsZW0ub2Zmc2V0VG9wIHx8IDAsXHJcbiAgICAgICAgbGVmdDogZWxlbS5vZmZzZXRMZWZ0IHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgdmFyIHJlY3QgPSBpc0F0dGFjaGVkKGVsZW0pID8gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt9O1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiAgKHJlY3QudG9wICArIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wKSAgfHwgMCxcclxuICAgICAgICBsZWZ0OiAocmVjdC5sZWZ0ICsgZG9jdW1lbnQuYm9keS5zY3JvbGxMZWZ0KSB8fCAwXHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNldE9mZnNldCA9IGZ1bmN0aW9uKGVsZW0sIGlkeCwgcG9zKSB7XHJcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtLnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnLFxyXG4gICAgICAgIHByb3BzICAgID0ge307XHJcblxyXG4gICAgLy8gc2V0IHBvc2l0aW9uIGZpcnN0LCBpbi1jYXNlIHRvcC9sZWZ0IGFyZSBzZXQgZXZlbiBvbiBzdGF0aWMgZWxlbVxyXG4gICAgaWYgKHBvc2l0aW9uID09PSAnc3RhdGljJykgeyBlbGVtLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJzsgfVxyXG5cclxuICAgIHZhciBjdXJPZmZzZXQgICAgICAgICA9IGdldE9mZnNldChlbGVtKSxcclxuICAgICAgICBjdXJDU1NUb3AgICAgICAgICA9IGVsZW0uc3R5bGUudG9wLFxyXG4gICAgICAgIGN1ckNTU0xlZnQgICAgICAgID0gZWxlbS5zdHlsZS5sZWZ0LFxyXG4gICAgICAgIGNhbGN1bGF0ZVBvc2l0aW9uID0gKHBvc2l0aW9uID09PSAnYWJzb2x1dGUnIHx8IHBvc2l0aW9uID09PSAnZml4ZWQnKSAmJiAoY3VyQ1NTVG9wID09PSAnYXV0bycgfHwgY3VyQ1NTTGVmdCA9PT0gJ2F1dG8nKTtcclxuXHJcbiAgICBpZiAoaXNGdW5jdGlvbihwb3MpKSB7XHJcbiAgICAgICAgcG9zID0gcG9zLmNhbGwoZWxlbSwgaWR4LCBjdXJPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjdXJUb3AsIGN1ckxlZnQ7XHJcbiAgICAvLyBuZWVkIHRvIGJlIGFibGUgdG8gY2FsY3VsYXRlIHBvc2l0aW9uIGlmIGVpdGhlciB0b3Agb3IgbGVmdCBpcyBhdXRvIGFuZCBwb3NpdGlvbiBpcyBlaXRoZXIgYWJzb2x1dGUgb3IgZml4ZWRcclxuICAgIGlmIChjYWxjdWxhdGVQb3NpdGlvbikge1xyXG4gICAgICAgIHZhciBjdXJQb3NpdGlvbiA9IGdldFBvc2l0aW9uKGVsZW0pO1xyXG4gICAgICAgIGN1clRvcCAgPSBjdXJQb3NpdGlvbi50b3A7XHJcbiAgICAgICAgY3VyTGVmdCA9IGN1clBvc2l0aW9uLmxlZnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGN1clRvcCAgPSBwYXJzZUZsb2F0KGN1ckNTU1RvcCkgIHx8IDA7XHJcbiAgICAgICAgY3VyTGVmdCA9IHBhcnNlRmxvYXQoY3VyQ1NTTGVmdCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhpc3RzKHBvcy50b3ApKSAgeyBwcm9wcy50b3AgID0gKHBvcy50b3AgIC0gY3VyT2Zmc2V0LnRvcCkgICsgY3VyVG9wOyAgfVxyXG4gICAgaWYgKGV4aXN0cyhwb3MubGVmdCkpIHsgcHJvcHMubGVmdCA9IChwb3MubGVmdCAtIGN1ck9mZnNldC5sZWZ0KSArIGN1ckxlZnQ7IH1cclxuXHJcbiAgICBlbGVtLnN0eWxlLnRvcCAgPSBfLnRvUHgocHJvcHMudG9wKTtcclxuICAgIGVsZW0uc3R5bGUubGVmdCA9IF8udG9QeChwcm9wcy5sZWZ0KTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwb3NpdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0UG9zaXRpb24oZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXQ6IGZ1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHtcclxuICAgIFxyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0KGZpcnN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHBvc09ySXRlcmF0b3IpIHx8IGlzT2JqZWN0KHBvc09ySXRlcmF0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT4gc2V0T2Zmc2V0KGVsZW0sIGlkeCwgcG9zT3JJdGVyYXRvcikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgb2Zmc2V0UGFyZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5tYXAodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IERPQ19FTEVNO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgKCFpc05vZGVOYW1lKG9mZnNldFBhcmVudCwgJ2h0bWwnKSAmJiAob2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uIHx8ICdzdGF0aWMnKSA9PT0gJ3N0YXRpYycpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IERPQ19FTEVNO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBURVhUICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL1RFWFQnKSxcclxuICAgIENPTU1FTlQgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvQ09NTUVOVCcpLFxyXG4gICAgQVRUUklCVVRFICA9IHJlcXVpcmUoJ05PREVfVFlQRS9BVFRSSUJVVEUnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHByb3BGaXggPSBzcGxpdCgndGFiSW5kZXh8cmVhZE9ubHl8Y2xhc3NOYW1lfG1heExlbmd0aHxjZWxsU3BhY2luZ3xjZWxsUGFkZGluZ3xyb3dTcGFufGNvbFNwYW58dXNlTWFwfGZyYW1lQm9yZGVyfGNvbnRlbnRFZGl0YWJsZScpXHJcbiAgICAucmVkdWNlKGZ1bmN0aW9uKG9iaiwgc3RyKSB7XHJcbiAgICAgICAgb2JqW3N0ci50b0xvd2VyQ2FzZSgpXSA9IHN0cjtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSwge1xyXG4gICAgICAgICdmb3InOiAgICdodG1sRm9yJyxcclxuICAgICAgICAnY2xhc3MnOiAnY2xhc3NOYW1lJ1xyXG4gICAgfSk7XHJcblxyXG52YXIgcHJvcEhvb2tzID0ge1xyXG4gICAgc3JjOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NyYycsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaHJlZjogU1VQUE9SVFMuaHJlZk5vcm1hbGl6ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKCdocmVmJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBTYWZhcmksIElFOStcclxuICAgIC8vIG1pcy1yZXBvcnRzIHRoZSBkZWZhdWx0IHNlbGVjdGVkIHByb3BlcnR5IG9mIGFuIG9wdGlvblxyXG4gICAgLy8gQWNjZXNzaW5nIHRoZSBwYXJlbnQncyBzZWxlY3RlZEluZGV4IHByb3BlcnR5IGZpeGVzIGl0XHJcbiAgICBzZWxlY3RlZDogU1VQUE9SVFMub3B0U2VsZWN0ZWQgPyB7fSA6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSxcclxuICAgICAgICAgICAgICAgIGZpeDtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIGZpeCA9IHBhcmVudC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGl0IGFsc28gd29ya3Mgd2l0aCBvcHRncm91cHMsIHNlZSAjNTcwMVxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnBhcmVudE5vZGUuc2VsZWN0ZWRJbmRleDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRhYkluZGV4OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIC8vIGVsZW0udGFiSW5kZXggZG9lc24ndCBhbHdheXMgcmV0dXJuIHRoZSBjb3JyZWN0IHZhbHVlIHdoZW4gaXQgaGFzbid0IGJlZW4gZXhwbGljaXRseSBzZXRcclxuICAgICAgICAgICAgLy8gaHR0cDovL2ZsdWlkcHJvamVjdC5vcmcvYmxvZy8yMDA4LzAxLzA5L2dldHRpbmctc2V0dGluZy1hbmQtcmVtb3ZpbmctdGFiaW5kZXgtdmFsdWVzLXdpdGgtamF2YXNjcmlwdC9cclxuICAgICAgICAgICAgLy8gVXNlIHByb3BlciBhdHRyaWJ1dGUgcmV0cmlldmFsKCMxMjA3MilcclxuICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFiaW5kZXgpIHsgcmV0dXJuIF8ucGFyc2VJbnQodGFiaW5kZXgpOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZU5hbWUgPSBlbGVtLm5vZGVOYW1lO1xyXG4gICAgICAgICAgICByZXR1cm4gKFJFR0VYLmlzRm9jdXNhYmxlKG5vZGVOYW1lKSB8fCAoUkVHRVguaXNDbGlja2FibGUobm9kZU5hbWUpICYmIGVsZW0uaHJlZikpID8gMCA6IC0xO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbnZhciBnZXRPclNldFByb3AgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCB2YWx1ZSkge1xyXG4gICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcclxuXHJcbiAgICAvLyBkb24ndCBnZXQvc2V0IHByb3BlcnRpZXMgb24gdGV4dCwgY29tbWVudCBhbmQgYXR0cmlidXRlIG5vZGVzXHJcbiAgICBpZiAoIWVsZW0gfHwgbm9kZVR5cGUgPT09IFRFWFQgfHwgbm9kZVR5cGUgPT09IENPTU1FTlQgfHwgbm9kZVR5cGUgPT09IEFUVFJJQlVURSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXggbmFtZSBhbmQgYXR0YWNoIGhvb2tzXHJcbiAgICBuYW1lID0gcHJvcEZpeFtuYW1lXSB8fCBuYW1lO1xyXG4gICAgdmFyIGhvb2tzID0gcHJvcEhvb2tzW25hbWVdO1xyXG5cclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBob29rcyAmJiAoJ3NldCcgaW4gaG9va3MpICYmIChyZXN1bHQgPSBob29rcy5zZXQoZWxlbSwgdmFsdWUsIG5hbWUpKSAhPT0gdW5kZWZpbmVkID9cclxuICAgICAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICAgICAgKGVsZW1bbmFtZV0gPSB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGhvb2tzICYmICgnZ2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLmdldChlbGVtLCBuYW1lKSkgIT09IG51bGwgP1xyXG4gICAgICAgIHJlc3VsdCA6XHJcbiAgICAgICAgZWxlbVtuYW1lXTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBwcm9wOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0T3JTZXRQcm9wKGZpcnN0LCBwcm9wKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc1N0cmluZyhwcm9wKSkge1xyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGdldE9yU2V0UHJvcChlbGVtLCBwcm9wKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3AsIHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVQcm9wOiBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgaWYgKCFpc1N0cmluZyhwcm9wKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgbmFtZSA9IHByb3BGaXhbcHJvcF0gfHwgcHJvcDtcclxuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGVsZW1bbmFtZV07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgZXhpc3RzICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKTtcclxuXHJcbnZhciBjb2VyY2VOdW0gPSAodmFsdWUpID0+XHJcbiAgICAvLyBJdHMgYSBudW1iZXIhIHx8IDAgdG8gYXZvaWQgTmFOIChhcyBOYU4ncyBhIG51bWJlcilcclxuICAgICt2YWx1ZSA9PT0gdmFsdWUgPyAodmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gQXZvaWQgTmFOIGFnYWluXHJcbiAgICBpc1N0cmluZyh2YWx1ZSkgPyAoK3ZhbHVlIHx8IDApIDpcclxuICAgIC8vIERlZmF1bHQgdG8gemVyb1xyXG4gICAgMDtcclxuXHJcbnZhciBwcm90ZWN0ID0gZnVuY3Rpb24oY29udGV4dCwgdmFsLCBjYWxsYmFjaykge1xyXG4gICAgdmFyIGVsZW0gPSBjb250ZXh0WzBdO1xyXG4gICAgaWYgKCFlbGVtICYmICFleGlzdHModmFsKSkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgaWYgKCFlbGVtKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGNvbnRleHQsIGVsZW0sIHZhbCk7XHJcbn07XHJcblxyXG52YXIgaGFuZGxlciA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQsIGVsZW0sIHZhbCkge1xyXG4gICAgICAgIGlmIChleGlzdHModmFsKSkge1xyXG4gICAgICAgICAgICBlbGVtW2F0dHJpYnV0ZV0gPSBjb2VyY2VOdW0odmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbVthdHRyaWJ1dGVdO1xyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBzY3JvbGxUb3AgPSBoYW5kbGVyKCdzY3JvbGxUb3AnKTtcclxudmFyIHNjcm9sbExlZnQgPSBoYW5kbGVyKCdzY3JvbGxMZWZ0Jyk7XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgc2Nyb2xsTGVmdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIHByb3RlY3QodGhpcywgdmFsLCBzY3JvbGxMZWZ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2Nyb2xsVG9wOiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbFRvcCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBxdWFsaWZpZXIpIHtcclxuICAgIC8vIEVhcmx5IHJldHVybiwgbm8gcXVhbGlmaWVyLiBFdmVyeXRoaW5nIG1hdGNoZXNcclxuICAgIGlmICghcXVhbGlmaWVyKSB7IHJldHVybiBhcnI7IH1cclxuXHJcbiAgICAvLyBGdW5jdGlvblxyXG4gICAgaWYgKGlzRnVuY3Rpb24ocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRWxlbWVudFxyXG4gICAgaWYgKHF1YWxpZmllci5ub2RlVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBlbGVtID09PSBxdWFsaWZpZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlbGVjdG9yXHJcbiAgICBpZiAoaXNTdHJpbmcocXVhbGlmaWVyKSkge1xyXG4gICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhxdWFsaWZpZXIpO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBpcy5tYXRjaChlbGVtKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQXJyYXkgcXVhbGlmaWVyXHJcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT4gXy5jb250YWlucyhxdWFsaWZpZXIsIGVsZW0pKTtcclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGlzU2VsZWN0b3IgICA9IHJlcXVpcmUoJ2lzL3NlbGVjdG9yJyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNFbGVtZW50ICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNOb2RlTGlzdCAgID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzQXJyYXkgICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRCAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIG9yZGVyICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICBGaXp6bGUgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbnxFbGVtZW50fE5vZGVMaXN0fEFycmF5fER9IHNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7RH0gY29udGV4dFxyXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxudmFyIGZpbmRXaXRoaW4gPSBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgLy8gRmFpbCBmYXN0XHJcbiAgICBpZiAoIWNvbnRleHQubGVuZ3RoKSB7IHJldHVybiBbXTsgfVxyXG5cclxuICAgIHZhciBxdWVyeSwgZGVzY2VuZGFudHMsIHJlc3VsdHM7XHJcblxyXG4gICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNOb2RlTGlzdChzZWxlY3RvcikgfHwgaXNBcnJheShzZWxlY3RvcikgfHwgaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIC8vIENvbnZlcnQgc2VsZWN0b3IgdG8gYW4gYXJyYXkgb2YgZWxlbWVudHNcclxuICAgICAgICBzZWxlY3RvciA9IGlzRWxlbWVudChzZWxlY3RvcikgPyBbIHNlbGVjdG9yIF0gOiBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgZGVzY2VuZGFudHMgPSBfLmZsYXR0ZW4oXy5tYXAoY29udGV4dCwgKGVsZW0pID0+IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpKSk7XHJcbiAgICAgICAgcmVzdWx0cyA9IF8uZmlsdGVyKGRlc2NlbmRhbnRzLCAoZGVzY2VuZGFudCkgPT4gXy5jb250YWlucyhzZWxlY3RvciwgZGVzY2VuZGFudCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWVyeSA9IEZpenpsZS5xdWVyeShzZWxlY3Rvcik7XHJcbiAgICAgICAgcmVzdWx0cyA9IHF1ZXJ5LmV4ZWMoY29udGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdHM7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICBpZiAoIWlzU2VsZWN0b3IodGFyZ2V0KSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0cyA9IHRoaXMuZmluZCh0YXJnZXQpLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IHRhcmdldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyLmNvbnRhaW5zKGVsZW0sIHRhcmdldHNbaWR4XSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBGaXp6bGUuaXMoc2VsZWN0b3IpLmFueSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0sIGlkeCkgPT4gISFpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIGlzLm5vdCh0aGlzKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IF8udG9BcnJheShzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+ICFfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gIT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaW5kOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3RvcihzZWxlY3RvcikpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZpbmRXaXRoaW4oc2VsZWN0b3IsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5tZXJnZShEKCksIHJlc3VsdCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBEKCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBfLmNvbnRhaW5zKGFyciwgZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtKSA9PiBlbGVtID09PSBjb250ZXh0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY2hlY2tlciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgICAgIF8uZmlsdGVyKHRoaXMsIChlbGVtLCBpZHgpID0+IGNoZWNrZXIuY2FsbChlbGVtLCBlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gRCgpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIEVMRU1FTlQgICAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIERPQ1VNRU5UICAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBET0NVTUVOVF9GUkFHTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVCcpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzQXR0YWNoZWQgICAgICAgID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNXaW5kb3cgICAgICAgICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzRG9jdW1lbnQgICAgICAgID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzRCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgICAgICAgPSByZXF1aXJlKCdvcmRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgICAgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIEZpenpsZSAgICAgICAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgZ2V0U2libGluZ3MgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc2licyA9IF9nZXROb2RlU2libGluZ3MoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYnMubGVuZ3RoKSB7IHJlc3VsdC5wdXNoKHNpYnMpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2dldE5vZGVTaWJsaW5ncyA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2licyA9IF8udG9BcnJheShwYXJlbnQuY2hpbGRyZW4pLFxyXG4gICAgICAgICAgICBpZHggID0gc2licy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAvLyBFeGNsdWRlIHRoZSBub2RlIGl0c2VsZiBmcm9tIHRoZSBsaXN0IG9mIGl0cyBwYXJlbnQncyBjaGlsZHJlblxyXG4gICAgICAgICAgICBpZiAoc2lic1tpZHhdID09PSBub2RlKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2licztcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2hpbGRyZW4gLS0tLS0tXHJcbiAgICBnZXRDaGlsZHJlbiA9IChhcnIpID0+IF8uZmxhdHRlbihfLm1hcChhcnIsIF9jaGlsZHJlbikpLFxyXG4gICAgX2NoaWxkcmVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBraWRzID0gZWxlbS5jaGlsZHJlbixcclxuICAgICAgICAgICAgaWR4ICA9IDAsIGxlbiAgPSBraWRzLmxlbmd0aCxcclxuICAgICAgICAgICAgYXJyICA9IG5ldyBBcnJheShsZW4pO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0ga2lkc1tpZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnRzIC0tLS0tLVxyXG4gICAgZ2V0Q2xvc2VzdCA9IGZ1bmN0aW9uKGVsZW1zLCBzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBlbGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIGNsb3Nlc3QsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoZWxlbXNbaWR4XSwgY29udGV4dCk7XHJcbiAgICAgICAgICAgIHBhcmVudHMudW5zaGlmdChlbGVtc1tpZHhdKTtcclxuICAgICAgICAgICAgY2xvc2VzdCA9IHNlbGVjdG9yRmlsdGVyKHBhcmVudHMsIHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKGNsb3Nlc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjbG9zZXN0WzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHMgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGNvbnRleHRbaWR4XSk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudHNVbnRpbCA9IGZ1bmN0aW9uKGQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShkW2lkeF0sIG51bGwsIHN0b3BTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcmVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gXy5mbGF0dGVuKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jcmF3bFVwTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRleHQsIHN0b3BTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gbm9kZSxcclxuICAgICAgICAgICAgbm9kZVR5cGU7XHJcblxyXG4gICAgICAgIHdoaWxlICgocGFyZW50ICAgPSBnZXROb2RlUGFyZW50KHBhcmVudCkpICYmXHJcbiAgICAgICAgICAgICAgIChub2RlVHlwZSA9IHBhcmVudC5ub2RlVHlwZSkgIT09IERPQ1VNRU5UICYmXHJcbiAgICAgICAgICAgICAgICghY29udGV4dCAgICAgIHx8IHBhcmVudCAhPT0gY29udGV4dCkgJiZcclxuICAgICAgICAgICAgICAgKCFzdG9wU2VsZWN0b3IgfHwgIUZpenpsZS5pcyhzdG9wU2VsZWN0b3IpLm1hdGNoKHBhcmVudCkpKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gUGFyZW50IC0tLS0tLVxyXG4gICAgZ2V0UGFyZW50ID0gZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIHZhciBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBjb250ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGdldE5vZGVQYXJlbnQoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCkgeyByZXN1bHQucHVzaChwYXJlbnQpOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFNhZmVseSBnZXQgcGFyZW50IG5vZGVcclxuICAgIGdldE5vZGVQYXJlbnQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQcmV2ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwcmV2ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykgJiYgcHJldi5ub2RlVHlwZSAhPT0gRUxFTUVOVCkge31cclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TmV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgbmV4dCA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykgJiYgbmV4dC5ub2RlVHlwZSAhPT0gRUxFTUVOVCkge31cclxuICAgICAgICByZXR1cm4gbmV4dDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UHJldkFsbCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIHByZXYgICA9IG5vZGU7XHJcbiAgICAgICAgd2hpbGUgKChwcmV2ID0gcHJldi5wcmV2aW91c1NpYmxpbmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmV2Lm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwcmV2KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROZXh0QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgbmV4dCAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nKSkge1xyXG4gICAgICAgICAgICBpZiAobmV4dC5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbCA9IGZ1bmN0aW9uKGdldHRlciwgZCwgc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNpYmxpbmc7XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5nID0gZ2V0dGVyKGRbaWR4XSk7XHJcbiAgICAgICAgICAgIGlmIChzaWJsaW5nICYmICghc2VsZWN0b3IgfHwgRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsQWxsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGZpbHRlcjtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHsgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikubWF0Y2goc2libGluZyk7IH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBzaWJsaW5ncyA9IF8uZmlsdGVyKHNpYmxpbmdzLCBmaWx0ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgc2libGluZ3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9zaXRpb25hbFVudGlsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZ3MsXHJcbiAgICAgICAgICAgIGl0ZXJhdG9yO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaXRlcmF0b3IgPSBmdW5jdGlvbihzaWJsaW5nKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNNYXRjaCA9IGlzLm1hdGNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChzaWJsaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc01hdGNoO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmdzID0gZ2V0dGVyKGRbaWR4XSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChzaWJsaW5ncywgaXRlcmF0b3IpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHVuaXF1ZVNvcnQgPSBmdW5jdGlvbihlbGVtcywgcmV2ZXJzZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB1bmlxdWUoZWxlbXMpO1xyXG4gICAgICAgIG9yZGVyLnNvcnQocmVzdWx0KTtcclxuICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICByZXN1bHQucmV2ZXJzZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gRChyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXJBbmRTb3J0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCByZXZlcnNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoc2VsZWN0b3JGaWx0ZXIoZWxlbXMsIHNlbGVjdG9yKSwgcmV2ZXJzZSk7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGNvbnRlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRChcclxuICAgICAgICAgICAgXy5mbGF0dGVuKFxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogcGx1Y2tcclxuICAgICAgICAgICAgICAgIF8ubWFwKHRoaXMsIChlbGVtKSA9PiBlbGVtLmNoaWxkTm9kZXMpXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbmRleDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIHJldHVybiBEKHNlbGVjdG9yKS5pbmRleE9mKGZpcnN0KTsgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikgfHwgaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VsZWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3RvclswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ICA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgIHBhcmVudCA9IGZpcnN0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlzQXR0YWNoZWQgY2hlY2sgdG8gcGFzcyB0ZXN0IFwiTm9kZSB3aXRob3V0IHBhcmVudCByZXR1cm5zIC0xXCJcclxuICAgICAgICAvLyBub2RlVHlwZSBjaGVjayB0byBwYXNzIFwiSWYgRCNpbmRleCBjYWxsZWQgb24gZWxlbWVudCB3aG9zZSBwYXJlbnQgaXMgZnJhZ21lbnQsIGl0IHN0aWxsIHNob3VsZCB3b3JrIGNvcnJlY3RseVwiXHJcbiAgICAgICAgdmFyIGF0dGFjaGVkICAgICAgICAgPSBpc0F0dGFjaGVkKGZpcnN0KSxcclxuICAgICAgICAgICAgaXNQYXJlbnRGcmFnbWVudCA9IHBhcmVudC5ub2RlVHlwZSA9PT0gRE9DVU1FTlRfRlJBR01FTlQ7XHJcblxyXG4gICAgICAgIGlmICghYXR0YWNoZWQgJiYgIWlzUGFyZW50RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoaWxkRWxlbXMgPSBwYXJlbnQuY2hpbGRyZW4gfHwgXy5maWx0ZXIocGFyZW50LmNoaWxkTm9kZXMsIChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSBFTEVNRU5UKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtdLmluZGV4T2YuYXBwbHkoY2hpbGRFbGVtcywgWyBmaXJzdCBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvc2VzdDogZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRDbG9zZXN0KHRoaXMsIHNlbGVjdG9yLCBjb250ZXh0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnQodGhpcyksIHNlbGVjdG9yKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50czogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRQYXJlbnRzKHRoaXMpLCBzZWxlY3RvciwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcmVudHNVbnRpbDogZnVuY3Rpb24oc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UGFyZW50c1VudGlsKHRoaXMsIHN0b3BTZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaWJsaW5nczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRTaWJsaW5ncyh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQW5kU29ydChnZXRDaGlsZHJlbih0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0UHJldiwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmV4dDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsKGdldE5leHQsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXZBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0QWxsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxBbGwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldlVudGlsOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWxVbnRpbChnZXRQcmV2QWxsLCB0aGlzLCBzZWxlY3RvciksIHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldE5leHRBbGwsIHRoaXMsIHNlbGVjdG9yKSk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgbmV3bGluZXMgICA9IHJlcXVpcmUoJ3N0cmluZy9uZXdsaW5lcycpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNTdHJpbmcgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzTm9kZU5hbWUgPSByZXF1aXJlKCdub2RlL2lzTmFtZScpLFxyXG4gICAgbm9ybWFsTmFtZSA9IHJlcXVpcmUoJ25vZGUvbm9ybWFsaXplTmFtZScpLFxyXG4gICAgU1VQUE9SVFMgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBFTEVNRU5UICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKTtcclxuXHJcbnZhciBvdXRlckh0bWwgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPyB0aGlzWzBdLm91dGVySFRNTCA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHRHZXQgPSBTVVBQT1JUUy50ZXh0Q29udGVudCA/XHJcbiAgICAgICAgKGVsZW0pID0+IGVsZW0udGV4dENvbnRlbnQgOlxyXG4gICAgICAgICAgICAoZWxlbSkgPT4gZWxlbS5pbm5lclRleHQsXHJcblxyXG4gICAgdGV4dFNldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLnRleHRDb250ZW50ID0gc3RyIDpcclxuICAgICAgICAgICAgKGVsZW0sIHN0cikgPT4gZWxlbS5pbm5lclRleHQgPSBzdHI7XHJcblxyXG52YXIgdmFsSG9va3MgPSB7XHJcbiAgICBvcHRpb246IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgICByZXR1cm4gKGV4aXN0cyh2YWwpID8gdmFsIDogdGV4dEdldChlbGVtKSkudHJpbSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0OiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGluZGV4ICAgPSBlbGVtLnNlbGVjdGVkSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBvbmUgICAgID0gZWxlbS50eXBlID09PSAnc2VsZWN0LW9uZScgfHwgaW5kZXggPCAwLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzICA9IG9uZSA/IG51bGwgOiBbXSxcclxuICAgICAgICAgICAgICAgIG1heCAgICAgPSBvbmUgPyBpbmRleCArIDEgOiBvcHRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGlkeCAgICAgPSBpbmRleCA8IDAgPyBtYXggOiAob25lID8gaW5kZXggOiAwKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIHNlbGVjdGVkIG9wdGlvbnNcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IG1heDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvbGRJRSBkb2Vzbid0IHVwZGF0ZSBzZWxlY3RlZCBhZnRlciBmb3JtIHJlc2V0ICgjMjU1MSlcclxuICAgICAgICAgICAgICAgIGlmICgob3B0aW9uLnNlbGVjdGVkIHx8IGlkeCA9PT0gaW5kZXgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHJldHVybiBvcHRpb25zIHRoYXQgYXJlIGRpc2FibGVkIG9yIGluIGEgZGlzYWJsZWQgb3B0Z3JvdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKFNVUFBPUlRTLm9wdERpc2FibGVkID8gIW9wdGlvbi5kaXNhYmxlZCA6IG9wdGlvbi5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICghb3B0aW9uLnBhcmVudE5vZGUuZGlzYWJsZWQgfHwgIWlzTm9kZU5hbWUob3B0aW9uLnBhcmVudE5vZGUsICdvcHRncm91cCcpKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHNwZWNpZmljIHZhbHVlIGZvciB0aGUgb3B0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgYW4gYXJyYXkgZm9yIG9uZSBzZWxlY3RzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aS1TZWxlY3RzIHJldHVybiBhbiBhcnJheVxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvcHRpb25TZXQsIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBlbGVtLm9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gXy5tYWtlQXJyYXkodmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IG9wdGlvbnMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24gPSBvcHRpb25zW2lkeF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWVzLCB2YWxIb29rcy5vcHRpb24uZ2V0KG9wdGlvbikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gb3B0aW9uU2V0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEZvcmNlIGJyb3dzZXJzIHRvIGJlaGF2ZSBjb25zaXN0ZW50bHkgd2hlbiBub24tbWF0Y2hpbmcgdmFsdWUgaXMgc2V0XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uU2V0KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNlbGVjdGVkSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn07XHJcblxyXG4vLyBSYWRpbyBhbmQgY2hlY2tib3ggZ2V0dGVyIGZvciBXZWJraXRcclxuaWYgKCFTVVBQT1JUUy5jaGVja09uKSB7XHJcbiAgICBfLmVhY2goWydyYWRpbycsICdjaGVja2JveCddLCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgdmFsSG9va3NbdHlwZV0gPSB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydDogV2Via2l0IC0gJycgaXMgcmV0dXJuZWQgaW5zdGVhZCBvZiAnb24nIGlmIGEgdmFsdWUgaXNuJ3Qgc3BlY2lmaWVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJykgPT09IG51bGwgPyAnb24nIDogZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIGdldFZhbCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgIGlmICghZWxlbSB8fCAoZWxlbS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5nZXQpIHtcclxuICAgICAgICByZXR1cm4gaG9vay5nZXQoZWxlbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaXNTdHJpbmcodmFsKSA/IG5ld2xpbmVzKHZhbCkgOiB2YWw7XHJcbn07XHJcblxyXG52YXIgc3RyaW5naWZ5ID0gKHZhbHVlKSA9PlxyXG4gICAgIWV4aXN0cyh2YWx1ZSkgPyAnJyA6ICh2YWx1ZSArICcnKTtcclxuXHJcbnZhciBzZXRWYWwgPSBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgIGlmIChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIFN0cmluZ2lmeSB2YWx1ZXNcclxuICAgIHZhciB2YWx1ZSA9IGlzQXJyYXkodmFsKSA/IF8ubWFwKHZhbCwgc3RyaW5naWZ5KSA6IHN0cmluZ2lmeSh2YWwpO1xyXG5cclxuICAgIHZhciBob29rID0gdmFsSG9va3NbZWxlbS50eXBlXSB8fCB2YWxIb29rc1tub3JtYWxOYW1lKGVsZW0pXTtcclxuICAgIGlmIChob29rICYmIGhvb2suc2V0KSB7XHJcbiAgICAgICAgaG9vay5zZXQoZWxlbSwgdmFsdWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgb3V0ZXJIdG1sOiBvdXRlckh0bWwsXHJcbiAgICBvdXRlckhUTUw6IG91dGVySHRtbCxcclxuXHJcbiAgICBodG1sOiBmdW5jdGlvbihodG1sKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IGVsZW0uaW5uZXJIVE1MID0gaHRtbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihodG1sKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBodG1sO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtLCBpZHgpID0+XHJcbiAgICAgICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBlbGVtLmlubmVySFRNTClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgcmV0dXJuICghZmlyc3QpID8gdW5kZWZpbmVkIDogZmlyc3QuaW5uZXJIVE1MO1xyXG4gICAgfSxcclxuXHJcbiAgICB2YWw6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgLy8gZ2V0dGVyXHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRWYWwodGhpc1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWV4aXN0cyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sICcnKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgZ2V0VmFsKGVsZW0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZXRWYWwoZWxlbSwgdmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNldHRlcnNcclxuICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpIHx8IGlzTnVtYmVyKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgdmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc3RyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiB0ZXh0U2V0KGVsZW0sIHN0cikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc3RyKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzdHI7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIHRleHRTZXQoZWxlbSwgaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIHRleHRHZXQoZWxlbSkpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMsIChlbGVtKSA9PiB0ZXh0R2V0KGVsZW0pKS5qb2luKCcnKTtcclxuICAgIH1cclxufTsiLCJ2YXIgRUxFTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtKSA9PlxyXG4gICAgICAgIGVsZW0gJiYgZWxlbS5ub2RlVHlwZSA9PT0gRUxFTUVOVDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZWxlbSwgbmFtZSkgPT5cclxuICAgIGVsZW0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbmFtZS50b0xvd2VyQ2FzZSgpOyIsIi8vIGNhY2hlIGlzIGp1c3Qgbm90IHdvcnRoIGl0IGhlcmVcclxuLy8gaHR0cDovL2pzcGVyZi5jb20vc2ltcGxlLWNhY2hlLWZvci1zdHJpbmctbWFuaXBcclxubW9kdWxlLmV4cG9ydHMgPSAoZWxlbSkgPT4gZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4iLCJ2YXIgcmVhZHkgPSBmYWxzZSxcclxuICAgIHJlZ2lzdHJhdGlvbiA9IFtdO1xyXG5cclxudmFyIHdhaXQgPSBmdW5jdGlvbihmbikge1xyXG4gICAgLy8gQWxyZWFkeSBsb2FkZWRcclxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgcmV0dXJuIGZuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhbmRhcmRzLWJhc2VkIGJyb3dzZXJzIHN1cHBvcnQgRE9NQ29udGVudExvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBJRSBldmVudCBtb2RlbCBpcyB1c2VkXHJcblxyXG4gICAgLy8gRW5zdXJlIGZpcmluZyBiZWZvcmUgb25sb2FkLCBtYXliZSBsYXRlIGJ1dCBzYWZlIGFsc28gZm9yIGlmcmFtZXNcclxuICAgIGRvY3VtZW50LmF0dGFjaEV2ZW50KCdvbnJlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJykgeyBmbigpOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBBIGZhbGxiYWNrIHRvIHdpbmRvdy5vbmxvYWQsIHRoYXQgd2lsbCBhbHdheXMgd29ya1xyXG4gICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbmxvYWQnLCBmbik7XHJcbn07XHJcblxyXG53YWl0KGZ1bmN0aW9uKCkge1xyXG4gICAgcmVhZHkgPSB0cnVlO1xyXG5cclxuICAgIC8vIGNhbGwgcmVnaXN0ZXJlZCBtZXRob2RzICAgIFxyXG4gICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgbGVuZ3RoID0gcmVnaXN0cmF0aW9uLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVnaXN0cmF0aW9uW2lkeF0oKTtcclxuICAgIH1cclxuICAgIHJlZ2lzdHJhdGlvbi5sZW5ndGggPSAwO1xyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcclxuICAgIGlmIChyZWFkeSkge1xyXG4gICAgICAgIGNhbGxiYWNrKCk7IHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZWdpc3RyYXRpb24ucHVzaChjYWxsYmFjayk7XHJcbn07XHJcbiIsInZhciBpc0F0dGFjaGVkICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgRUxFTUVOVCAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIC8vIGh0dHA6Ly9lam9obi5vcmcvYmxvZy9jb21wYXJpbmctZG9jdW1lbnQtcG9zaXRpb24vXHJcbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvTm9kZS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgQ09OVEFJTkVEX0JZID0gMTYsXHJcbiAgICBGT0xMT1dJTkcgICAgPSA0LFxyXG4gICAgRElTQ09OTkVDVEVEID0gMTtcclxuXHJcbnZhciBpcyA9IChyZWwsIGZsYWcpID0+IChyZWwgJiBmbGFnKSA9PT0gZmxhZztcclxuXHJcbnZhciBpc05vZGUgPSAoYiwgZmxhZywgYSkgPT4gaXMoX2NvbXBhcmVQb3NpdGlvbihhLCBiKSwgZmxhZyk7XHJcblxyXG4vLyBDb21wYXJlIFBvc2l0aW9uIC0gTUlUIExpY2Vuc2VkLCBKb2huIFJlc2lnXHJcbnZhciBfY29tcGFyZVBvc2l0aW9uID0gKG5vZGUxLCBub2RlMikgPT5cclxuICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uID9cclxuICAgIG5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5vZGUyKSA6XHJcbiAgICAwO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNvcnRzIGFuIGFycmF5IG9mIEQgZWxlbWVudHMgaW4tcGxhY2UgKGkuZS4sIG11dGF0ZXMgdGhlIG9yaWdpbmFsIGFycmF5KVxyXG4gICAgICogaW4gZG9jdW1lbnQgb3JkZXIgYW5kIHJldHVybnMgd2hldGhlciBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLlxyXG4gICAgICogQGZ1bmN0aW9uXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnRbXX0gYXJyYXkgICAgICAgICAgQXJyYXkgb2YgRCBlbGVtZW50cy5cclxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gIFtyZXZlcnNlPWZhbHNlXSBJZiBhIHRydXRoeSB2YWx1ZSBpcyBwYXNzZWQsIHRoZSBnaXZlbiBhcnJheSB3aWxsIGJlIHJldmVyc2VkLlxyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgYW55IGR1cGxpY2F0ZXMgd2VyZSBmb3VuZCwgb3RoZXJ3aXNlIGZhbHNlLlxyXG4gICAgICogQHNlZSBqUXVlcnkgc3JjL3NlbGVjdG9yLW5hdGl2ZS5qczozN1xyXG4gICAgICovXHJcbiAgICAvLyBUT0RPOiBBZGRyZXNzIGVuY2Fwc3VsYXRpb25cclxuICAgIHNvcnQ6IChmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgX2hhc0R1cGxpY2F0ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgX3NvcnQgPSBmdW5jdGlvbihub2RlMSwgbm9kZTIpIHtcclxuICAgICAgICAgICAgLy8gRmxhZyBmb3IgZHVwbGljYXRlIHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKG5vZGUxID09PSBub2RlMikge1xyXG4gICAgICAgICAgICAgICAgX2hhc0R1cGxpY2F0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gU29ydCBvbiBtZXRob2QgZXhpc3RlbmNlIGlmIG9ubHkgb25lIGlucHV0IGhhcyBjb21wYXJlRG9jdW1lbnRQb3NpdGlvblxyXG4gICAgICAgICAgICB2YXIgcmVsID0gIW5vZGUxLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uIC0gIW5vZGUyLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uO1xyXG4gICAgICAgICAgICBpZiAocmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBOb2RlcyBzaGFyZSB0aGUgc2FtZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBpZiAoKG5vZGUxLm93bmVyRG9jdW1lbnQgfHwgbm9kZTEpID09PSAobm9kZTIub3duZXJEb2N1bWVudCB8fCBub2RlMikpIHtcclxuICAgICAgICAgICAgICAgIHJlbCA9IF9jb21wYXJlUG9zaXRpb24obm9kZTEsIG5vZGUyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2Ugd2Uga25vdyB0aGV5IGFyZSBkaXNjb25uZWN0ZWRcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWwgPSBESVNDT05ORUNURUQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vdCBkaXJlY3RseSBjb21wYXJhYmxlXHJcbiAgICAgICAgICAgIGlmICghcmVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRGlzY29ubmVjdGVkIG5vZGVzXHJcbiAgICAgICAgICAgIGlmIChpcyhyZWwsIERJU0NPTk5FQ1RFRCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc05vZGUxRGlzY29ubmVjdGVkID0gIWlzQXR0YWNoZWQobm9kZTEpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTm9kZTJEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzTm9kZTFEaXNjb25uZWN0ZWQgJiYgaXNOb2RlMkRpc2Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpc05vZGUyRGlzY29ubmVjdGVkID8gLTEgOiAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaXMocmVsLCBGT0xMT1dJTkcpID8gLTEgOiAxO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgcmV2ZXJzZSkge1xyXG4gICAgICAgICAgICBfaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGFycmF5LnNvcnQoX3NvcnQpO1xyXG4gICAgICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICAgICAgYXJyYXkucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfaGFzRHVwbGljYXRlO1xyXG4gICAgICAgIH07XHJcbiAgICB9KCkpLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgLlxyXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBhIEQgZWxlbWVudCBub2RlXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGIgRCBlbGVtZW50IG5vZGVcclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSB0cnVlIGlmIG5vZGUgYGFgIGNvbnRhaW5zIG5vZGUgYGJgOyBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgdmFyIGJVcCA9IGlzQXR0YWNoZWQoYikgPyBiLnBhcmVudE5vZGUgOiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoYSA9PT0gYlVwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGJVcCAmJiBiVXAubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzIChJRTkrKVxyXG4gICAgICAgICAgICBpZiAoYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTm9kZShiVXAsIENPTlRBSU5FRF9CWSwgYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIFJFR0VYID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIE1BWF9TSU5HTEVfVEFHX0xFTkdUSCA9IDMwO1xyXG5cclxudmFyIHBhcnNlU3RyaW5nID0gZnVuY3Rpb24ocGFyZW50VGFnTmFtZSwgaHRtbFN0cikge1xyXG4gICAgdmFyIHBhcmVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQocGFyZW50VGFnTmFtZSk7XHJcbiAgICBwYXJlbnQuaW5uZXJIVE1MID0gaHRtbFN0cjtcclxuICAgIHJldHVybiBwYXJlbnQ7XHJcbn07XHJcblxyXG52YXIgcGFyc2VTaW5nbGVUYWcgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICBpZiAoaHRtbFN0ci5sZW5ndGggPiBNQVhfU0lOR0xFX1RBR19MRU5HVEgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgc2luZ2xlVGFnTWF0Y2ggPSBSRUdFWC5zaW5nbGVUYWdNYXRjaChodG1sU3RyKTtcclxuICAgIGlmICghc2luZ2xlVGFnTWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoc2luZ2xlVGFnTWF0Y2hbMV0pO1xyXG5cclxuICAgIHJldHVybiBbIGVsZW0gXTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaHRtbFN0cikge1xyXG4gICAgdmFyIHNpbmdsZVRhZyA9IHBhcnNlU2luZ2xlVGFnKGh0bWxTdHIpO1xyXG4gICAgaWYgKHNpbmdsZVRhZykgeyByZXR1cm4gc2luZ2xlVGFnOyB9XHJcblxyXG4gICAgdmFyIHBhcmVudFRhZ05hbWUgPSBSRUdFWC5nZXRQYXJlbnRUYWdOYW1lKGh0bWxTdHIpLFxyXG4gICAgICAgIHBhcmVudCAgICAgICAgPSBwYXJzZVN0cmluZyhwYXJlbnRUYWdOYW1lLCBodG1sU3RyKTtcclxuXHJcbiAgICB2YXIgY2hpbGQsXHJcbiAgICAgICAgaWR4ID0gcGFyZW50LmNoaWxkcmVuLmxlbmd0aCxcclxuICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuXHJcbiAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICBjaGlsZCA9IHBhcmVudC5jaGlsZHJlbltpZHhdO1xyXG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgYXJyW2lkeF0gPSBjaGlsZDtcclxuICAgIH1cclxuXHJcbiAgICBwYXJlbnQgPSBudWxsO1xyXG5cclxuICAgIHJldHVybiBhcnIucmV2ZXJzZSgpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHBhcnNlciAgICAgPSByZXF1aXJlKCdwYXJzZXInKSxcclxuICAgIEZpenpsZSAgICAgPSByZXF1aXJlKCdGaXp6bGUnKSxcclxuICAgIGRhdGEgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKTtcclxuXHJcbnZhciBwYXJzZUh0bWwgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIGlmICghc3RyKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICB2YXIgcmVzdWx0ID0gcGFyc2VyKHN0cik7XHJcbiAgICBpZiAoIXJlc3VsdCB8fCAhcmVzdWx0Lmxlbmd0aCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgcmV0dXJuIEQocmVzdWx0KTtcclxufTtcclxuXHJcbl8uZXh0ZW5kKEQsXHJcbiAgICBkYXRhLkQsXHJcbntcclxuICAgIC8vIEJlY2F1c2Ugbm8gb25lIGtub3cgd2hhdCB0aGUgY2FzZSBzaG91bGQgYmVcclxuICAgIHBhcnNlSHRtbDogcGFyc2VIdG1sLFxyXG4gICAgcGFyc2VIVE1MOiBwYXJzZUh0bWwsXHJcblxyXG4gICAgRml6emxlOiAgRml6emxlLFxyXG4gICAgZWFjaDogICAgXy5qcUVhY2gsXHJcbiAgICBmb3JFYWNoOiBfLmRFYWNoLFxyXG5cclxuICAgIG1hcDogICAgIF8ubWFwLFxyXG4gICAgZXh0ZW5kOiAgXy5leHRlbmQsXHJcblxyXG4gICAgbW9yZUNvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aW5kb3cualF1ZXJ5ID0gd2luZG93LlplcHRvID0gd2luZG93LiQgPSBEO1xyXG4gICAgfVxyXG59KTtcclxuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHNwbGl0ICAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgYXJyYXkgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJ21vZHVsZXMvdHJhbnN2ZXJzYWwnKSxcclxuICAgIGRpbWVuc2lvbnMgID0gcmVxdWlyZSgnbW9kdWxlcy9kaW1lbnNpb25zJyksXHJcbiAgICBtYW5pcCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jc3MnKSxcclxuICAgIGF0dHIgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hdHRyJyksXHJcbiAgICBwcm9wICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3ZhbCcpLFxyXG4gICAgcG9zaXRpb24gICAgPSByZXF1aXJlKCdtb2R1bGVzL3Bvc2l0aW9uJyksXHJcbiAgICBjbGFzc2VzICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgc2Nyb2xsICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Njcm9sbCcpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKSxcclxuICAgIGV2ZW50cyAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9ldmVudHMnKTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyKSA9PiAhZXhpc3RzKHN0cikgfHwgc3RyID09PSAnJzsiLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBjYWNoZSAgID0gcmVxdWlyZSgnY2FjaGUnKSgyKSxcclxuICAgIGlzRW1wdHkgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpLFxyXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcblxyXG4gICAgUl9TUEFDRSA9IC9cXHMrL2csXHJcblxyXG4gICAgc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIHZhciBzcGxpdCAgID0gbmFtZS5zcGxpdChkZWxpbSksXHJcbiAgICAgICAgICAgIGxlbiAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIG5hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmFtZVNldCA9IHt9LFxyXG4gICAgICAgICAgICBjdXJOYW1lO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgY3VyTmFtZSA9IHNwbGl0W2xlbiAtIChpZHggKyAxKV07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdIHx8IC8vIHVuaXF1ZVxyXG4gICAgICAgICAgICAgICAgaXNFbXB0eShjdXJOYW1lKSAgICAvLyBub24tZW1wdHlcclxuICAgICAgICAgICAgKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKGN1ck5hbWUpO1xyXG4gICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltaXRlcikge1xyXG4gICAgaWYgKGlzRW1wdHkobmFtZSkpIHsgcmV0dXJuIFtdOyB9XHJcbiAgICBpZiAoaXNBcnJheShuYW1lKSkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAgIHZhciBkZWxpbSA9IGRlbGltaXRlciA9PT0gdW5kZWZpbmVkID8gUl9TUEFDRSA6IGRlbGltaXRlcjtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoZGVsaW0sIG5hbWUpID8gXHJcbiAgICAgICAgY2FjaGUuZ2V0KGRlbGltLCBuYW1lKSA6IFxyXG4gICAgICAgIGNhY2hlLnB1dChkZWxpbSwgbmFtZSwgKCkgPT4gc3BsaXQobmFtZSwgZGVsaW0pKTtcclxufTtcclxuIiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIC8vIEV4aXQgZWFybHkgZm9yIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAvLyBFbmQsIG5hdHVyYWxseSwgaGFzIHRvIGJlIGhpZ2hlciB0aGFuIDAgdG8gbWF0dGVyLFxyXG4gICAgLy8gc28gYSBzaW1wbGUgZXhpc3RlbmNlIGNoZWNrIHdpbGwgZG9cclxuICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgIHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQgfHwgMCk7XHJcbn07IiwiLy8gQnJlYWtzIGV2ZW4gb24gYXJyYXlzIHdpdGggMyBpdGVtcy4gMyBvciBtb3JlXHJcbi8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBkZWxpbWl0ZXIpID0+IHN0ci5zcGxpdChkZWxpbWl0ZXIgfHwgJ3wnKTtcclxuIiwidmFyIGlkID0gMDtcclxudmFyIHVuaXF1ZUlkID0gbW9kdWxlLmV4cG9ydHMgPSAoKSA9PiBpZCsrO1xyXG51bmlxdWVJZC5zZWVkID0gZnVuY3Rpb24oc2VlZGVkLCBwcmUpIHtcclxuICAgIHZhciBwcmVmaXggPSBwcmUgfHwgJycsXHJcbiAgICAgICAgc2VlZCA9IHNlZWRlZCB8fCAwO1xyXG4gICAgcmV0dXJuICgpID0+IHByZWZpeCArIHNlZWQrKztcclxufTsiXX0=
