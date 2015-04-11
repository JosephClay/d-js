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

},{}],43:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('D'),
    exists = require('is/exists'),
    slice = require('util/slice'),
    each = require('./each');

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
};

},{"./each":42,"D":3,"_":22,"is/exists":32,"util/slice":72}],44:[function(require,module,exports){
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

},{"Fizzle":9,"SUPPORTS":21,"_":22,"cache":23,"is/exists":32,"is/function":33,"is/string":39,"node/isElement":61,"node/isName":62,"string/newlines":70}],46:[function(require,module,exports){
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

},{"NODE_TYPE/ELEMENT":18,"_":22,"is/array":25,"is/string":39,"string/isEmpty":69,"string/split":71}],47:[function(require,module,exports){
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
    D = require('../D'),
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

},{"../D":3,"../order":65,"./array/unique":44,"./data":48,"./selectors/filter":57,"_":22,"is/D":24,"is/collection":29,"is/document":30,"is/element":31,"is/exists":32,"is/function":33,"is/html":34,"is/nodeList":35,"is/number":36,"is/string":39,"is/window":40,"parser":66}],54:[function(require,module,exports){
'use strict';

var _ = require('_'),
    D = require('../D'),
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

},{"../D":3,"_":22,"is/attached":27,"is/exists":32,"is/function":33,"is/object":37,"node/isName":62}],55:[function(require,module,exports){
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
    each = require('modules/array/each'),
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
    forEach: each,

    map: _.map,
    extend: _.extend,

    moreConflict: function moreConflict() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

},{"./D":3,"Fizzle":9,"_":22,"modules/array/each":42,"modules/data":48,"parser":66}],68:[function(require,module,exports){
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

},{"./D":3,"_":22,"modules/array":43,"modules/attr":45,"modules/classes":46,"modules/css":47,"modules/data":48,"modules/dimensions":49,"modules/events":52,"modules/manip":53,"modules/position":54,"modules/prop":55,"modules/scroll":56,"modules/selectors":58,"modules/transversal":59,"modules/val":60,"util/split":73}],69:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvY2FwdHVyZS5qc29uIiwic3JjL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qc29uIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9BVFRSSUJVVEUuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9DT01NRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0VMRU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9URVhULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvZWFjaC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS9pbmRleC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc0VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvaXNOYW1lLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL25vcm1hbGl6ZU5hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL2lzRW1wdHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL3N0cmluZy9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NsaWNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3VuaXF1ZUlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O0FDRm5CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3JGQSxJQUFJLENBQUMsR0FBYSxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQzFCLE9BQU8sR0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDO0lBQ2pDLE1BQU0sR0FBUSxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ2hDLFFBQVEsR0FBTSxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQ2xDLFVBQVUsR0FBSSxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3BDLFVBQVUsR0FBSSxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3BDLEdBQUcsR0FBVyxPQUFP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ZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vRCcpO1xyXG5yZXF1aXJlKCcuL3Byb3BzJyk7XHJcbnJlcXVpcmUoJy4vcHJvdG8nKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb2MgPSBkb2N1bWVudDtcbnZhciBhZGRFdmVudCA9IGFkZEV2ZW50RWFzeTtcbnZhciByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50RWFzeTtcbnZhciBoYXJkQ2FjaGUgPSBbXTtcblxuaWYgKCFnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcikge1xuICBhZGRFdmVudCA9IGFkZEV2ZW50SGFyZDtcbiAgcmVtb3ZlRXZlbnQgPSByZW1vdmVFdmVudEhhcmQ7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50RWFzeSAoZWwsIHR5cGUsIGZuLCBjYXB0dXJpbmcpIHtcbiAgcmV0dXJuIGVsLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGNhcHR1cmluZyk7XG59XG5cbmZ1bmN0aW9uIGFkZEV2ZW50SGFyZCAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBlbC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgd3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmRldGFjaEV2ZW50KCdvbicgKyB0eXBlLCB1bndyYXAoZWwsIHR5cGUsIGZuKSk7XG59XG5cbmZ1bmN0aW9uIGZhYnJpY2F0ZUV2ZW50IChlbCwgdHlwZSkge1xuICB2YXIgZTtcbiAgaWYgKGRvYy5jcmVhdGVFdmVudCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZS5pbml0RXZlbnQodHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZWwuZGlzcGF0Y2hFdmVudChlKTtcbiAgfSBlbHNlIGlmIChkb2MuY3JlYXRlRXZlbnRPYmplY3QpIHtcbiAgICBlID0gZG9jLmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZWwuZmlyZUV2ZW50KCdvbicgKyB0eXBlLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwcGVyRmFjdG9yeSAoZWwsIHR5cGUsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwcGVyIChvcmlnaW5hbEV2ZW50KSB7XG4gICAgdmFyIGUgPSBvcmlnaW5hbEV2ZW50IHx8IGdsb2JhbC5ldmVudDtcbiAgICBlLnRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICBlLnByZXZlbnREZWZhdWx0ICA9IGUucHJldmVudERlZmF1bHQgIHx8IGZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICgpIHsgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlOyB9O1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gZS5zdG9wUHJvcGFnYXRpb24gfHwgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uICgpIHsgZS5jYW5jZWxCdWJibGUgPSB0cnVlOyB9O1xuICAgIGZuLmNhbGwoZWwsIGUpO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIHdyYXBwZXIgPSB1bndyYXAoZWwsIHR5cGUsIGZuKSB8fCB3cmFwcGVyRmFjdG9yeShlbCwgdHlwZSwgZm4pO1xuICBoYXJkQ2FjaGUucHVzaCh7XG4gICAgd3JhcHBlcjogd3JhcHBlcixcbiAgICBlbGVtZW50OiBlbCxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGZuOiBmblxuICB9KTtcbiAgcmV0dXJuIHdyYXBwZXI7XG59XG5cbmZ1bmN0aW9uIHVud3JhcCAoZWwsIHR5cGUsIGZuKSB7XG4gIHZhciBpID0gZmluZChlbCwgdHlwZSwgZm4pO1xuICBpZiAoaSkge1xuICAgIHZhciB3cmFwcGVyID0gaGFyZENhY2hlW2ldLndyYXBwZXI7XG4gICAgaGFyZENhY2hlLnNwbGljZShpLCAxKTsgLy8gZnJlZSB1cCBhIHRhZCBvZiBtZW1vcnlcbiAgICByZXR1cm4gd3JhcHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGksIGl0ZW07XG4gIGZvciAoaSA9IDA7IGkgPCBoYXJkQ2FjaGUubGVuZ3RoOyBpKyspIHtcbiAgICBpdGVtID0gaGFyZENhY2hlW2ldO1xuICAgIGlmIChpdGVtLmVsZW1lbnQgPT09IGVsICYmIGl0ZW0udHlwZSA9PT0gdHlwZSAmJiBpdGVtLmZuID09PSBmbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGQ6IGFkZEV2ZW50LFxuICByZW1vdmU6IHJlbW92ZUV2ZW50LFxuICBmYWJyaWNhdGU6IGZhYnJpY2F0ZUV2ZW50XG59O1xuIiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNBcnJheSAgICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNIdG1sICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNGdW5jdGlvbiAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBwYXJzZXIgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgb25yZWFkeSAgICAgPSByZXF1aXJlKCdvbnJlYWR5JyksXHJcbiAgICBGaXp6bGUgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxudmFyIEQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgcmV0dXJuIG5ldyBJbml0KHNlbGVjdG9yLCBhdHRycyk7XHJcbn07XHJcblxyXG5pc0Quc2V0KEQpO1xyXG5cclxudmFyIEluaXQgPSBmdW5jdGlvbihzZWxlY3RvciwgYXR0cnMpIHtcclxuICAgIC8vIG5vdGhpblxyXG4gICAgaWYgKCFzZWxlY3RvcikgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgIC8vIGVsZW1lbnQgb3Igd2luZG93IChkb2N1bWVudHMgaGF2ZSBhIG5vZGVUeXBlKVxyXG4gICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlIHx8IHNlbGVjdG9yID09PSB3aW5kb3cpIHtcclxuICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XHJcbiAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhUTUwgc3RyaW5nXHJcbiAgICBpZiAoaXNIdG1sKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgcGFyc2VyKHNlbGVjdG9yKSk7XHJcbiAgICAgICAgaWYgKGF0dHJzKSB7IHRoaXMuYXR0cihhdHRycyk7IH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gU3RyaW5nXHJcbiAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gU2VsZWN0b3I6IHBlcmZvcm0gYSBmaW5kIHdpdGhvdXQgY3JlYXRpbmcgYSBuZXcgRFxyXG4gICAgICAgIF8ubWVyZ2UodGhpcywgRml6emxlLnF1ZXJ5KHNlbGVjdG9yKS5leGVjKHRoaXMsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBvZiBFbGVtZW50cywgTm9kZUxpc3QsIG9yIEQgb2JqZWN0XHJcbiAgICAvLyBUT0RPOiBDb3VsZCB0aGlzIGJlIGFycmF5TGlrZT9cclxuICAgIGlmIChpc0FycmF5KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBzZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZG9jdW1lbnQgcmVhZHlcclxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG9ucmVhZHkoc2VsZWN0b3IpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcbkluaXQucHJvdG90eXBlID0gRC5wcm90b3R5cGU7IiwibW9kdWxlLmV4cG9ydHMgPSAodGFnKSA9PiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7IiwidmFyIGRpdiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9jcmVhdGUnKSgnZGl2Jyk7XHJcblxyXG5kaXYuaW5uZXJIVE1MID0gJzxhIGhyZWY9XCIvYVwiPmE8L2E+JzsiLCJ2YXIgXyA9IHJlcXVpcmUoJ18nKTtcclxuXHJcbnZhciBJcyA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcbklzLnByb3RvdHlwZSA9IHtcclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IHRoaXMuX3NlbGVjdG9ycyxcclxuICAgICAgICAgICAgaWR4ID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvcnNbaWR4XS5tYXRjaChjb250ZXh0KSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmFueShhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICB0aGlzLm1hdGNoKGVsZW0pID8gdHJ1ZSA6IGZhbHNlXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbm90OiBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXJyLCAoZWxlbSkgPT5cclxuICAgICAgICAgICAgIXRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwidmFyIGZpbmQgPSBmdW5jdGlvbihxdWVyeSwgY29udGV4dCkge1xyXG4gICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgIHNlbGVjdG9ycyA9IHF1ZXJ5Ll9zZWxlY3RvcnMsXHJcbiAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gc2VsZWN0b3JzLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzZWxlY3RvcnNbaWR4XS5leGVjKGNvbnRleHQpKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgUXVlcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbGVjdG9ycykge1xyXG4gICAgdGhpcy5fc2VsZWN0b3JzID0gc2VsZWN0b3JzO1xyXG59O1xyXG5cclxuUXVlcnkucHJvdG90eXBlID0ge1xyXG4gICAgZXhlYzogZnVuY3Rpb24oYXJyLCBpc05ldykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4ID0gMCwgbGVuZ3RoID0gaXNOZXcgPyAxIDogYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIGZpbmQodGhpcywgYXJyW2lkeF0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNFbGVtZW50ICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuXHJcbiAgICBHRVRfRUxFTUVOVF9CWV9JRCAgICAgICAgICA9ICdnZXRFbGVtZW50QnlJZCcsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfVEFHX05BTUUgICA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScsXHJcbiAgICBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA9ICdnZXRFbGVtZW50c0J5Q2xhc3NOYW1lJyxcclxuICAgIFFVRVJZX1NFTEVDVE9SX0FMTCAgICAgICAgID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnLFxyXG4gICAgXHJcbiAgICB1bmlxdWVJZCAgICAgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoMCwgJ0QtdW5pcXVlSWQtJyksXHJcbiAgICBzZWxlY3RvckNhY2hlID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgUkVHRVggICAgICAgICA9IHJlcXVpcmUoJ1JFR0VYJyksXHJcbiAgICBtYXRjaGVzICAgICAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyk7XHJcblxyXG52YXIgZGV0ZXJtaW5lTWV0aG9kID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gc2VsZWN0b3JDYWNoZS5nZXQoc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmIChtZXRob2QpIHsgcmV0dXJuIG1ldGhvZDsgfVxyXG5cclxuICAgICAgICBtZXRob2QgPSBSRUdFWC5pc1N0cmljdElkKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UX0JZX0lEIDpcclxuICAgICAgICAgICAgUkVHRVguaXNDbGFzcyhzZWxlY3RvcikgPyBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRSA6XHJcbiAgICAgICAgICAgIFJFR0VYLmlzVGFnKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9UQUdfTkFNRSA6ICAgICAgIFxyXG4gICAgICAgICAgICBRVUVSWV9TRUxFQ1RPUl9BTEw7XHJcblxyXG4gICAgICAgIHNlbGVjdG9yQ2FjaGUuc2V0KHNlbGVjdG9yLCBtZXRob2QpO1xyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIG5lZWQgdG8gZm9yY2UgYW4gYXJyYXkgaGVyZVxyXG4gICAgZnJvbURvbUFycmF5VG9BcnJheSA9IGZ1bmN0aW9uKGFycmF5TGlrZSkge1xyXG4gICAgICAgIHZhciBpZHggPSBhcnJheUxpa2UubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkoaWR4KTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBhcnJheUxpa2VbaWR4XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uID0gZnVuY3Rpb24oc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgLy8gTm8gc2VsZWN0aW9uXHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOb2RlbGlzdCB3aXRob3V0IGEgbGVuZ3RoXHJcbiAgICAgICAgaWYgKGlzTm9kZUxpc3Qoc2VsZWN0aW9uKSAmJiAhc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBpdCdzIGFuIGlkLCByZXR1cm4gaXQgYXMgYW4gYXJyYXlcclxuICAgICAgICByZXR1cm4gaXNFbGVtZW50KHNlbGVjdGlvbikgfHwgIXNlbGVjdGlvbi5sZW5ndGggPyBbc2VsZWN0aW9uXSA6IGZyb21Eb21BcnJheVRvQXJyYXkoc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgdGFpbG9yQ2hpbGRTZWxlY3RvciA9IGZ1bmN0aW9uKGlkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiAnIycgKyBpZCArICcgJyArIHNlbGVjdG9yO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGlsZE9yU2libGluZ1F1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIC8vIENoaWxkIHNlbGVjdCAtIG5lZWRzIHNwZWNpYWwgaGVscCBzbyB0aGF0IFwiPiBkaXZcIiBkb2Vzbid0IGJyZWFrXHJcbiAgICAgICAgdmFyIG1ldGhvZCAgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgc2VsZWN0b3IgID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgbmV3SWQsXHJcbiAgICAgICAgICAgIGlkO1xyXG5cclxuICAgICAgICBpZCA9IGNvbnRleHQuaWQ7XHJcbiAgICAgICAgaWYgKGlkID09PSAnJyB8fCAhZXhpc3RzKGlkKSkge1xyXG4gICAgICAgICAgICBuZXdJZCA9IHVuaXF1ZUlkKCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBuZXdJZDtcclxuICAgICAgICAgICAgaWRBcHBsaWVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGVjdG9yID0gdGFpbG9yQ2hpbGRTZWxlY3RvcihpZEFwcGxpZWQgPyBuZXdJZCA6IGlkLCBzZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgaWYgKGlkQXBwbGllZCkge1xyXG4gICAgICAgICAgICBjb250ZXh0LmlkID0gaWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsYXNzUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3RvcixcclxuICAgICAgICAgICAgLy8gQ2xhc3Mgc2VhcmNoLCBkb24ndCBzdGFydCB3aXRoICcuJ1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBpZFF1ZXJ5ID0gZnVuY3Rpb24oY29udGV4dCwgc2VsZikge1xyXG4gICAgICAgIHZhciBtZXRob2QgICA9IHNlbGYubWV0aG9kLFxyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHNlbGYuc2VsZWN0b3Iuc3Vic3RyKDEpLFxyXG4gICAgICAgICAgICBzZWxlY3Rpb24gPSBkb2N1bWVudFttZXRob2RdKHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZWZhdWx0UXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGNvbnRleHRbc2VsZi5tZXRob2RdKHNlbGYuc2VsZWN0b3IpO1xyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGV0ZXJtaW5lUXVlcnkgPSBmdW5jdGlvbihzZWxmKSB7XHJcbiAgICAgICAgaWYgKHNlbGYuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hpbGRPclNpYmxpbmdRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmlzQ2xhc3NTZWFyY2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNsYXNzUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VsZi5pc0lkU2VhcmNoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpZFF1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRRdWVyeTtcclxuICAgIH07XHJcblxyXG52YXIgU2VsZWN0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgdmFyIHNlbGVjdG9yICAgICAgICAgICAgICAgID0gc3RyLnRyaW0oKSxcclxuICAgICAgICBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0ICA9IHNlbGVjdG9yWzBdID09PSAnPicgfHwgc2VsZWN0b3JbMF0gPT09ICcrJyxcclxuICAgICAgICBtZXRob2QgICAgICAgICAgICAgICAgICA9IGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPyBRVUVSWV9TRUxFQ1RPUl9BTEwgOiBkZXRlcm1pbmVNZXRob2Qoc2VsZWN0b3IpO1xyXG5cclxuICAgIHRoaXMuc3RyICAgICAgICAgICAgICAgICAgICA9IHN0cjtcclxuICAgIHRoaXMuc2VsZWN0b3IgICAgICAgICAgICAgICA9IHNlbGVjdG9yO1xyXG4gICAgdGhpcy5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0ID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdDtcclxuICAgIHRoaXMuaXNJZFNlYXJjaCAgICAgICAgICAgICA9IG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRfQllfSUQ7XHJcbiAgICB0aGlzLmlzQ2xhc3NTZWFyY2ggICAgICAgICAgPSAhdGhpcy5pc0lkU2VhcmNoICYmIG1ldGhvZCA9PT0gR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUU7XHJcbiAgICB0aGlzLm1ldGhvZCAgICAgICAgICAgICAgICAgPSBtZXRob2Q7XHJcbn07XHJcblxyXG5TZWxlY3Rvci5wcm90b3R5cGUgPSB7XHJcbiAgICBtYXRjaDogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgIC8vIE5vIG5lZWVkIHRvIGNoZWNrLCBhIG1hdGNoIHdpbGwgZmFpbCBpZiBpdCdzXHJcbiAgICAgICAgLy8gY2hpbGQgb3Igc2libGluZ1xyXG4gICAgICAgIGlmICh0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRjaGVzKGNvbnRleHQsIHRoaXMuc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBleGVjOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHF1ZXJ5ID0gZGV0ZXJtaW5lUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgIC8vIHRoZXNlIGFyZSB0aGUgdHlwZXMgd2UncmUgZXhwZWN0aW5nIHRvIGZhbGwgdGhyb3VnaFxyXG4gICAgICAgIC8vIGlzRWxlbWVudChjb250ZXh0KSB8fCBpc05vZGVMaXN0KGNvbnRleHQpIHx8IGlzQ29sbGVjdGlvbihjb250ZXh0KVxyXG4gICAgICAgIC8vIGlmIG5vIGNvbnRleHQgaXMgZ2l2ZW4sIHVzZSBkb2N1bWVudFxyXG4gICAgICAgIHJldHVybiBxdWVyeShjb250ZXh0IHx8IGRvY3VtZW50LCB0aGlzKTtcclxuICAgIH1cclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJy4uL18nKSxcclxuICAgIHF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBpc0NhY2hlICAgID0gcmVxdWlyZSgnLi4vY2FjaGUnKSgpLFxyXG4gICAgU2VsZWN0b3IgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9TZWxlY3RvcicpLFxyXG4gICAgUXVlcnkgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9RdWVyeScpLFxyXG4gICAgSXMgICAgICAgICA9IHJlcXVpcmUoJy4vY29uc3RydWN0cy9JcycpLFxyXG4gICAgcGFyc2UgICAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UnKSxcclxuICAgIG5vcm1hbGl6ZSAgPSByZXF1aXJlKCcuL3NlbGVjdG9yL3NlbGVjdG9yLW5vcm1hbGl6ZScpO1xyXG5cclxudmFyIHRvU2VsZWN0b3JzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAvLyBTZWxlY3RvcnMgd2lsbCByZXR1cm4gbnVsbCBpZiB0aGUgcXVlcnkgd2FzIGludmFsaWQuXHJcbiAgICAvLyBOb3QgcmV0dXJuaW5nIGVhcmx5IG9yIGRvaW5nIGV4dHJhIGNoZWNrcyBhcyB0aGlzIHdpbGxcclxuICAgIC8vIG5vb3Agb24gdGhlIFF1ZXJ5IGFuZCBJcyBsZXZlbCBhbmQgaXMgdGhlIGV4Y2VwdGlvblxyXG4gICAgLy8gaW5zdGVhZCBvZiB0aGUgcnVsZVxyXG4gICAgdmFyIHNlbGVjdG9ycyA9IHBhcnNlLnN1YnF1ZXJpZXMoc3RyKSB8fCBbXTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZWFjaCBvZiB0aGUgc2VsZWN0b3JzLi4uXHJcbiAgICBzZWxlY3RvcnMgPSBfLm1hcChzZWxlY3RvcnMsIG5vcm1hbGl6ZSk7XHJcblxyXG4gICAgLy8gLi4uYW5kIG1hcCB0aGVtIHRvIFNlbGVjdG9yIG9iamVjdHNcclxuICAgIHJldHVybiBfLmZhc3RtYXAoc2VsZWN0b3JzLCAoc2VsZWN0b3IpID0+IG5ldyBTZWxlY3RvcihzZWxlY3RvcikpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBwYXJzZTogcGFyc2UsXHJcbiAgICBcclxuICAgIHF1ZXJ5OiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gcXVlcnlDYWNoZS5oYXMoc3RyKSA/IFxyXG4gICAgICAgICAgICBxdWVyeUNhY2hlLmdldChzdHIpIDogXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUucHV0KHN0ciwgKCkgPT4gbmV3IFF1ZXJ5KHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH0sXHJcbiAgICBpczogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQ2FjaGUuaGFzKHN0cikgPyBcclxuICAgICAgICAgICAgaXNDYWNoZS5nZXQoc3RyKSA6IFxyXG4gICAgICAgICAgICBpc0NhY2hlLnB1dChzdHIsICgpID0+IG5ldyBJcyh0b1NlbGVjdG9ycyhzdHIpKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCI6Y2hpbGQtYXRcIjogXCI6bnRoLWNoaWxkKHgpXCIsXHJcblx0XCI6Y2hpbGQtZ3RcIjogXCI6bnRoLWNoaWxkKG4reClcIixcclxuXHRcIjpjaGlsZC1sdFwiOiBcIjpudGgtY2hpbGQofm4reClcIlxyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuICAgIFwiOmNoaWxkLWV2ZW5cIiA6IFwiOm50aC1jaGlsZChldmVuKVwiLFxyXG4gICAgXCI6Y2hpbGQtb2RkXCIgIDogXCI6bnRoLWNoaWxkKG9kZClcIixcclxuICAgIFwiOnRleHRcIiAgICAgICA6IFwiW3R5cGU9dGV4dF1cIixcclxuICAgIFwiOnBhc3N3b3JkXCIgICA6IFwiW3R5cGU9cGFzc3dvcmRdXCIsXHJcbiAgICBcIjpyYWRpb1wiICAgICAgOiBcIlt0eXBlPXJhZGlvXVwiLFxyXG4gICAgXCI6Y2hlY2tib3hcIiAgIDogXCJbdHlwZT1jaGVja2JveF1cIixcclxuICAgIFwiOnN1Ym1pdFwiICAgICA6IFwiW3R5cGU9c3VibWl0XVwiLFxyXG4gICAgXCI6cmVzZXRcIiAgICAgIDogXCJbdHlwZT1yZXNldF1cIixcclxuICAgIFwiOmJ1dHRvblwiICAgICA6IFwiW3R5cGU9YnV0dG9uXVwiLFxyXG4gICAgXCI6aW1hZ2VcIiAgICAgIDogXCJbdHlwZT1pbWFnZV1cIixcclxuICAgIFwiOmlucHV0XCIgICAgICA6IFwiW3R5cGU9aW5wdXRdXCIsXHJcbiAgICBcIjpmaWxlXCIgICAgICAgOiBcIlt0eXBlPWZpbGVdXCIsXHJcbiAgICBcIjpzZWxlY3RlZFwiICAgOiBcIltzZWxlY3RlZD1zZWxlY3RlZF1cIlxyXG59IiwidmFyIFNVUFBPUlRTICAgICAgICAgICAgPSByZXF1aXJlKCdTVVBQT1JUUycpLFxyXG5cclxuICAgIEFUVFJJQlVURV9TRUxFQ1RPUiA9IC9cXFtcXHMqW1xcdy1dK1xccypbISReKl0/KD86PVxccyooWydcIl0/KSguKj9bXlxcXFxdfFteXFxcXF0qKSk/XFwxXFxzKlxcXS9nLFxyXG4gICAgUFNFVURPX1NFTEVDVCAgICAgID0gLyg6W15cXHNcXChcXFspXSspL2csXHJcbiAgICBDQVBUVVJFX1NFTEVDVCAgICAgPSAvKDpbXlxcc14oXSspXFwoKFteXFwpXSspXFwpL2csXHJcbiAgICBwc2V1ZG9DYWNoZSAgICAgICAgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBwcm94eVNlbGVjdG9ycyAgICAgPSByZXF1aXJlKCcuL3Byb3h5Lmpzb24nKSxcclxuICAgIGNhcHR1cmVTZWxlY3RvcnMgICA9IHJlcXVpcmUoJy4vY2FwdHVyZS5qc29uJyk7XHJcblxyXG52YXIgZ2V0QXR0cmlidXRlUG9zaXRpb25zID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgcGFpcnMgPSBbXTtcclxuICAgIC8vIE5vdCB1c2luZyByZXR1cm4gdmFsdWUuIFNpbXBseSB1c2luZyBpdCB0byBpdGVyYXRlXHJcbiAgICAvLyB0aHJvdWdoIGFsbCBvZiB0aGUgbWF0Y2hlcyB0byBwb3B1bGF0ZSBtYXRjaCBwb3NpdGlvbnNcclxuICAgIHN0ci5yZXBsYWNlKEFUVFJJQlVURV9TRUxFQ1RPUiwgZnVuY3Rpb24obWF0Y2gsIGNhcDEsIGNhcDIsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgcGFpcnMucHVzaChbIHBvc2l0aW9uLCBwb3NpdGlvbiArIG1hdGNoLmxlbmd0aCBdKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHBhaXJzO1xyXG59O1xyXG5cclxudmFyIGlzT3V0c2lkZU9mQXR0cmlidXRlID0gZnVuY3Rpb24ocG9zaXRpb24sIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHBvc2l0aW9ucy5sZW5ndGg7XHJcbiAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgIHZhciBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICBpZiAocG9zaXRpb24gPiBwb3NbMF0gJiYgcG9zaXRpb24gPCBwb3NbMV0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxudmFyIHBzZXVkb1JlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKFBTRVVET19TRUxFQ1QsIGZ1bmN0aW9uKG1hdGNoLCBjYXAsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb3h5U2VsZWN0b3JzW21hdGNoXSA/IHByb3h5U2VsZWN0b3JzW21hdGNoXSA6IG1hdGNoO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgY2FwdHVyZVJlcGxhY2UgPSBmdW5jdGlvbihzdHIsIHBvc2l0aW9ucykge1xyXG4gICAgdmFyIGNhcHR1cmVTZWxlY3RvcjtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZShDQVBUVVJFX1NFTEVDVCwgZnVuY3Rpb24obWF0Y2gsIGNhcCwgdmFsdWUsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFpc091dHNpZGVPZkF0dHJpYnV0ZShwb3NpdGlvbiwgcG9zaXRpb25zKSkgeyByZXR1cm4gbWF0Y2g7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChjYXB0dXJlU2VsZWN0b3IgPSBjYXB0dXJlU2VsZWN0b3JzW2NhcF0pID8gY2FwdHVyZVNlbGVjdG9yLnJlcGxhY2UoJ3gnLCB2YWx1ZSkgOiBtYXRjaDtcclxuICAgIH0pO1xyXG59O1xyXG5cclxudmFyIGJvb2xlYW5TZWxlY3RvclJlcGxhY2UgPSBTVVBQT1JUUy5zZWxlY3RlZFNlbGVjdG9yID9cclxuICAgIC8vIElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIGZ1bmN0aW9uKHN0cikgeyByZXR1cm4gc3RyOyB9IDpcclxuICAgIC8vIElFOC05XHJcbiAgICBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb25zID0gZ2V0QXR0cmlidXRlUG9zaXRpb25zKHN0ciksXHJcbiAgICAgICAgICAgIGlkeCA9IHBvc2l0aW9ucy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBvcyxcclxuICAgICAgICAgICAgc2VsZWN0b3I7XHJcblxyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBwb3MgPSBwb3NpdGlvbnNbaWR4XTtcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzdHIuc3Vic3RyaW5nKHBvc1swXSwgcG9zWzFdKTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnW3NlbGVjdGVkXScpIHtcclxuICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgcG9zWzBdKSArICdbc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiXScgKyBzdHIuc3Vic3RyaW5nKHBvc1sxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHJldHVybiBwc2V1ZG9DYWNoZS5oYXMoc3RyKSA/IHBzZXVkb0NhY2hlLmdldChzdHIpIDogcHNldWRvQ2FjaGUucHV0KHN0ciwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGF0dHJQb3NpdGlvbnMgPSBnZXRBdHRyaWJ1dGVQb3NpdGlvbnMoc3RyKTtcclxuICAgICAgICBzdHIgPSBwc2V1ZG9SZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICAgICAgc3RyID0gYm9vbGVhblNlbGVjdG9yUmVwbGFjZShzdHIpO1xyXG4gICAgICAgIHJldHVybiBjYXB0dXJlUmVwbGFjZShzdHIsIGF0dHJQb3NpdGlvbnMpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qXHJcbiAqIEZpenpsZS5qc1xyXG4gKiBBZGFwdGVkIGZyb20gU2l6emxlLmpzXHJcbiAqL1xyXG52YXIgdG9rZW5DYWNoZSAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHN1YnF1ZXJ5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcblxyXG4gICAgZXJyb3IgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZC1qczogSW52YWxpZCBxdWVyeSBzZWxlY3RvciAoY2F1Z2h0KSBcIicrIHNlbGVjdG9yICsnXCInKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zZWxlY3RvcnMvI3doaXRlc3BhY2VcclxuICAgIFdISVRFU1BBQ0UgPSAnW1xcXFx4MjBcXFxcdFxcXFxyXFxcXG5cXFxcZl0nLFxyXG5cclxuICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIxL3N5bmRhdGEuaHRtbCN2YWx1ZS1kZWYtaWRlbnRpZmllclxyXG4gICAgSURFTlRJRklFUiA9ICcoPzpcXFxcXFxcXC58W1xcXFx3LV18W15cXFxceDAwLVxcXFx4YTBdKSsnLFxyXG5cclxuICAgIC8vIE5PVEU6IExlYXZpbmcgZG91YmxlIHF1b3RlcyB0byByZWR1Y2UgZXNjYXBpbmdcclxuICAgIC8vIEF0dHJpYnV0ZSBzZWxlY3RvcnM6IGh0dHA6Ly93d3cudzMub3JnL1RSL3NlbGVjdG9ycy8jYXR0cmlidXRlLXNlbGVjdG9yc1xyXG4gICAgQVRUUklCVVRFUyA9IFwiXFxcXFtcIiArIFdISVRFU1BBQ0UgKyBcIiooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBPcGVyYXRvciAoY2FwdHVyZSAyKVxyXG4gICAgICAgIFwiKihbKl4kfCF+XT89KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgLy8gXCJBdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgQ1NTIElERU5USUZJRVJzIFtjYXB0dXJlIDVdIG9yIHN0cmluZ3MgW2NhcHR1cmUgMyBvciBjYXB0dXJlIDRdXCJcclxuICAgICAgICBcIiooPzonKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcJ10pKiknfFxcXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFxcXFwiXSkqKVxcXCJ8KFwiICsgSURFTlRJRklFUiArIFwiKSl8KVwiICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgXCIqXFxcXF1cIixcclxuXHJcbiAgICBQU0VVRE9TID0gXCI6KFwiICsgSURFTlRJRklFUiArIFwiKSg/OlxcXFwoKFwiICtcclxuICAgICAgICAvLyBUbyByZWR1Y2UgdGhlIG51bWJlciBvZiBzZWxlY3RvcnMgbmVlZGluZyB0b2tlbml6ZSBpbiB0aGUgcHJlRmlsdGVyLCBwcmVmZXIgYXJndW1lbnRzOlxyXG4gICAgICAgIC8vIDEuIHF1b3RlZCAoY2FwdHVyZSAzOyBjYXB0dXJlIDQgb3IgY2FwdHVyZSA1KVxyXG4gICAgICAgIFwiKCcoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcIil8XCIgK1xyXG4gICAgICAgIC8vIDIuIHNpbXBsZSAoY2FwdHVyZSA2KVxyXG4gICAgICAgIFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcKClbXFxcXF1dfFwiICsgQVRUUklCVVRFUyArIFwiKSopfFwiICtcclxuICAgICAgICAvLyAzLiBhbnl0aGluZyBlbHNlIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIuKlwiICtcclxuICAgICAgICBcIilcXFxcKXwpXCIsXHJcblxyXG4gICAgUl9DT01NQSAgICAgICA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqLCcgKyBXSElURVNQQUNFICsgJyonKSxcclxuICAgIFJfQ09NQklOQVRPUlMgPSBuZXcgUmVnRXhwKCdeJyArIFdISVRFU1BBQ0UgKyAnKihbPit+XXwnICsgV0hJVEVTUEFDRSArICcpJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9QU0VVRE8gICAgICA9IG5ldyBSZWdFeHAoUFNFVURPUyksXHJcbiAgICBSX01BVENIX0VYUFIgPSB7XHJcbiAgICAgICAgSUQ6ICAgICBuZXcgUmVnRXhwKCdeIygnICAgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBDTEFTUzogIG5ldyBSZWdFeHAoJ15cXFxcLignICsgSURFTlRJRklFUiArICcpJyksXHJcbiAgICAgICAgVEFHOiAgICBuZXcgUmVnRXhwKCdeKCcgICAgKyBJREVOVElGSUVSICsgJ3xbKl0pJyksXHJcbiAgICAgICAgQVRUUjogICBuZXcgUmVnRXhwKCdeJyAgICAgKyBBVFRSSUJVVEVTKSxcclxuICAgICAgICBQU0VVRE86IG5ldyBSZWdFeHAoJ14nICAgICArIFBTRVVET1MpLFxyXG4gICAgICAgIENISUxEOiAgbmV3IFJlZ0V4cCgnXjoob25seXxmaXJzdHxsYXN0fG50aHxudGgtbGFzdCktKGNoaWxkfG9mLXR5cGUpKD86XFxcXCgnICsgV0hJVEVTUEFDRSArXHJcbiAgICAgICAgICAgICcqKGV2ZW58b2RkfCgoWystXXwpKFxcXFxkKilufCknICsgV0hJVEVTUEFDRSArICcqKD86KFsrLV18KScgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooXFxcXGQrKXwpKScgKyBXSElURVNQQUNFICsgJypcXFxcKXwpJywgJ2knKSxcclxuICAgICAgICBib29sOiAgIG5ldyBSZWdFeHAoXCJeKD86Y2hlY2tlZHxzZWxlY3RlZHxhc3luY3xhdXRvZm9jdXN8YXV0b3BsYXl8Y29udHJvbHN8ZGVmZXJ8ZGlzYWJsZWR8aGlkZGVufGlzbWFwfGxvb3B8bXVsdGlwbGV8b3BlbnxyZWFkb25seXxyZXF1aXJlZHxzY29wZWQpJFwiLCBcImlcIilcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ1NTIGVzY2FwZXMgaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI2VzY2FwZWQtY2hhcmFjdGVyc1xyXG4gICAgUl9VTkVTQ0FQRSA9IG5ldyBSZWdFeHAoJ1xcXFxcXFxcKFtcXFxcZGEtZl17MSw2fScgKyBXSElURVNQQUNFICsgJz98KCcgKyBXSElURVNQQUNFICsgJyl8LiknLCAnaWcnKSxcclxuICAgIGZ1bmVzY2FwZSA9IGZ1bmN0aW9uKF8sIGVzY2FwZWQsIGVzY2FwZWRXaGl0ZXNwYWNlKSB7XHJcbiAgICAgICAgdmFyIGhpZ2ggPSAnMHgnICsgKGVzY2FwZWQgLSAweDEwMDAwKTtcclxuICAgICAgICAvLyBOYU4gbWVhbnMgbm9uLWNvZGVwb2ludFxyXG4gICAgICAgIC8vIFN1cHBvcnQ6IEZpcmVmb3g8MjRcclxuICAgICAgICAvLyBXb3JrYXJvdW5kIGVycm9uZW91cyBudW1lcmljIGludGVycHJldGF0aW9uIG9mICsnMHgnXHJcbiAgICAgICAgcmV0dXJuIGhpZ2ggIT09IGhpZ2ggfHwgZXNjYXBlZFdoaXRlc3BhY2UgP1xyXG4gICAgICAgICAgICBlc2NhcGVkIDpcclxuICAgICAgICAgICAgaGlnaCA8IDAgP1xyXG4gICAgICAgICAgICAgICAgLy8gQk1QIGNvZGVwb2ludFxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKGhpZ2ggKyAweDEwMDAwKSA6XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwbGVtZW50YWwgUGxhbmUgY29kZXBvaW50IChzdXJyb2dhdGUgcGFpcilcclxuICAgICAgICAgICAgICAgIGZyb21DaGFyQ29kZSgoaGlnaCA+PiAxMCkgfCAweEQ4MDAsIChoaWdoICYgMHgzRkYpIHwgMHhEQzAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJlRmlsdGVyID0ge1xyXG4gICAgICAgIEFUVFI6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0ucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSB0aGUgZ2l2ZW4gdmFsdWUgdG8gbWF0Y2hbM10gd2hldGhlciBxdW90ZWQgb3IgdW5xdW90ZWRcclxuICAgICAgICAgICAgbWF0Y2hbM10gPSAoIG1hdGNoWzNdIHx8IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnICkucmVwbGFjZShSX1VORVNDQVBFLCBmdW5lc2NhcGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzJdID09PSAnfj0nKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFszXSA9ICcgJyArIG1hdGNoWzNdICsgJyAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgNCk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgQ0hJTEQ6IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIC8qIG1hdGNoZXMgZnJvbSBSX01BVENIX0VYUFJbJ0NISUxEJ11cclxuICAgICAgICAgICAgICAgIDEgdHlwZSAob25seXxudGh8Li4uKVxyXG4gICAgICAgICAgICAgICAgMiB3aGF0IChjaGlsZHxvZi10eXBlKVxyXG4gICAgICAgICAgICAgICAgMyBhcmd1bWVudCAoZXZlbnxvZGR8XFxkKnxcXGQqbihbKy1dXFxkKyk/fC4uLilcclxuICAgICAgICAgICAgICAgIDQgeG4tY29tcG9uZW50IG9mIHhuK3kgYXJndW1lbnQgKFsrLV0/XFxkKm58KVxyXG4gICAgICAgICAgICAgICAgNSBzaWduIG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNiB4IG9mIHhuLWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgICAgNyBzaWduIG9mIHktY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA4IHkgb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIG1hdGNoWzFdID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXS5zbGljZSgwLCAzKSA9PT0gJ250aCcpIHtcclxuICAgICAgICAgICAgICAgIC8vIG50aC0qIHJlcXVpcmVzIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1hdGNoWzBdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBudW1lcmljIHggYW5kIHkgcGFyYW1ldGVycyBmb3IgRXhwci5maWx0ZXIuQ0hJTERcclxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVyIHRoYXQgZmFsc2UvdHJ1ZSBjYXN0IHJlc3BlY3RpdmVseSB0byAwLzFcclxuICAgICAgICAgICAgICAgIG1hdGNoWzRdID0gKyhtYXRjaFs0XSA/IG1hdGNoWzVdICsgKG1hdGNoWzZdIHx8IDEpIDogMiAqIChtYXRjaFszXSA9PT0gJ2V2ZW4nIHx8IG1hdGNoWzNdID09PSAnb2RkJykpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNV0gPSArKCggbWF0Y2hbN10gKyBtYXRjaFs4XSkgfHwgbWF0Y2hbM10gPT09ICdvZGQnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIG90aGVyIHR5cGVzIHByb2hpYml0IGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgUFNFVURPOiBmdW5jdGlvbihtYXRjaCkge1xyXG4gICAgICAgICAgICB2YXIgZXhjZXNzLFxyXG4gICAgICAgICAgICAgICAgdW5xdW90ZWQgPSAhbWF0Y2hbNl0gJiYgbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICBpZiAoUl9NQVRDSF9FWFBSLkNISUxELnRlc3QobWF0Y2hbMF0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQWNjZXB0IHF1b3RlZCBhcmd1bWVudHMgYXMtaXNcclxuICAgICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgLy8gU3RyaXAgZXhjZXNzIGNoYXJhY3RlcnMgZnJvbSB1bnF1b3RlZCBhcmd1bWVudHNcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1bnF1b3RlZCAmJiBSX1BTRVVETy50ZXN0KHVucXVvdGVkKSAmJlxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGV4Y2VzcyBmcm9tIHRva2VuaXplIChyZWN1cnNpdmVseSlcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB0b2tlbml6ZSh1bnF1b3RlZCwgdHJ1ZSkpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNsb3NpbmcgcGFyZW50aGVzaXNcclxuICAgICAgICAgICAgICAgIChleGNlc3MgPSB1bnF1b3RlZC5pbmRleE9mKCcpJywgdW5xdW90ZWQubGVuZ3RoIC0gZXhjZXNzKSAtIHVucXVvdGVkLmxlbmd0aCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBleGNlc3MgaXMgYSBuZWdhdGl2ZSBpbmRleFxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMF0gPSBtYXRjaFswXS5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hbMl0gPSB1bnF1b3RlZC5zbGljZSgwLCBleGNlc3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gb25seSBjYXB0dXJlcyBuZWVkZWQgYnkgdGhlIHBzZXVkbyBmaWx0ZXIgbWV0aG9kICh0eXBlIGFuZCBhcmd1bWVudClcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnNsaWNlKDAsIDMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4vKipcclxuICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gc2VsZWN0b3IgRnVsbCBDU1Mgc2VsZWN0b3IgKGUuZy4sICdhLCBpbnB1dDpmb2N1cywgZGl2W2F0dHI9XCJ2YWx1ZVwiXScpLlxyXG4gKiBAcGFyYW0gIHtCb29sZWFufSBbcGFyc2VPbmx5PWZhbHNlXVxyXG4gKiBAcmV0dXJuIHtTdHJpbmdbXXxOdW1iZXJ8bnVsbH0gQXJyYXkgb2Ygc3ViLXF1ZXJpZXMgKGUuZy4sIFsgJ2EnLCAnaW5wdXQ6Zm9jdXMnLCAnZGl2W2F0dHI9XCIodmFsdWUxKSxbdmFsdWUyXVwiXScpIG9yIG51bGwgaWYgdGhlcmUgd2FzIGFuIGVycm9yIHBhcnNpbmcuXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgdG9rZW5pemUgPSBmdW5jdGlvbihzZWxlY3RvciwgcGFyc2VPbmx5KSB7XHJcbiAgICBpZiAodG9rZW5DYWNoZS5oYXMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlT25seSA/IDAgOiB0b2tlbkNhY2hlLmdldChzZWxlY3Rvcikuc2xpY2UoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHR5cGUsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7UmVnRXhwfSAqL1xyXG4gICAgICAgIHJlZ2V4LFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge0FycmF5fSAqL1xyXG4gICAgICAgIG1hdGNoLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBtYXRjaGVkLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ1tdfSAqL1xyXG4gICAgICAgIHN1YnF1ZXJpZXMgPSBbXSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc3VicXVlcnkgPSAnJyxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgc29GYXIgPSBzZWxlY3RvcjtcclxuXHJcbiAgICB3aGlsZSAoc29GYXIpIHtcclxuICAgICAgICAvLyBDb21tYSBhbmQgZmlyc3QgcnVuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkIHx8IChtYXRjaCA9IFJfQ09NTUEuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgY29uc3VtZSB0cmFpbGluZyBjb21tYXMgYXMgdmFsaWRcclxuICAgICAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKSB8fCBzb0ZhcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG4gICAgICAgICAgICBzdWJxdWVyeSA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF0Y2hlZCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIENvbWJpbmF0b3JzXHJcbiAgICAgICAgaWYgKChtYXRjaCA9IFJfQ09NQklOQVRPUlMuZXhlYyhzb0ZhcikpKSB7XHJcbiAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaC5zaGlmdCgpO1xyXG4gICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZpbHRlcnNcclxuICAgICAgICBmb3IgKHR5cGUgaW4gUl9NQVRDSF9FWFBSKSB7XHJcbiAgICAgICAgICAgIHJlZ2V4ID0gUl9NQVRDSF9FWFBSW3R5cGVdO1xyXG4gICAgICAgICAgICBtYXRjaCA9IHJlZ2V4LmV4ZWMoc29GYXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoICYmICghcHJlRmlsdGVyW3R5cGVdIHx8IChtYXRjaCA9IHByZUZpbHRlclt0eXBlXShtYXRjaCkpKSkge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJxdWVyeSArPSBtYXRjaGVkO1xyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaGVkLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbWF0Y2hlZCkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN1YnF1ZXJ5KSB7IHN1YnF1ZXJpZXMucHVzaChzdWJxdWVyeSk7IH1cclxuXHJcbiAgICAvLyBSZXR1cm4gdGhlIGxlbmd0aCBvZiB0aGUgaW52YWxpZCBleGNlc3NcclxuICAgIC8vIGlmIHdlJ3JlIGp1c3QgcGFyc2luZy5cclxuICAgIGlmIChwYXJzZU9ubHkpIHsgcmV0dXJuIHNvRmFyLmxlbmd0aDsgfVxyXG5cclxuICAgIGlmIChzb0ZhcikgeyBlcnJvcihzZWxlY3Rvcik7IHJldHVybiBudWxsOyB9XHJcblxyXG4gICAgcmV0dXJuIHRva2VuQ2FjaGUuc2V0KHNlbGVjdG9yLCBzdWJxdWVyaWVzKS5zbGljZSgpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNwbGl0cyB0aGUgZ2l2ZW4gY29tbWEtc2VwYXJhdGVkIENTUyBzZWxlY3RvciBpbnRvIHNlcGFyYXRlIHN1Yi1xdWVyaWVzLlxyXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmdbXXxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZyB0aGUgc2VsZWN0b3IuXHJcbiAgICAgKi9cclxuICAgIHN1YnF1ZXJpZXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHN1YnF1ZXJ5Q2FjaGUuaGFzKHNlbGVjdG9yKSA/IFxyXG4gICAgICAgICAgICBzdWJxdWVyeUNhY2hlLmdldChzZWxlY3RvcikgOiBcclxuICAgICAgICAgICAgc3VicXVlcnlDYWNoZS5wdXQoc2VsZWN0b3IsICgpID0+IHRva2VuaXplKHNlbGVjdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzQm9vbDogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIHJldHVybiBSX01BVENIX0VYUFIuYm9vbC50ZXN0KG5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IDI7IiwibW9kdWxlLmV4cG9ydHMgPSA4OyIsIm1vZHVsZS5leHBvcnRzID0gOTsiLCJtb2R1bGUuZXhwb3J0cyA9IDExOyIsIm1vZHVsZS5leHBvcnRzID0gMTsiLCJtb2R1bGUuZXhwb3J0cyA9IDM7IiwiICAgIC8vIE1hdGNoZXMgXCItbXMtXCIgc28gdGhhdCBpdCBjYW4gYmUgY2hhbmdlZCB0byBcIm1zLVwiXHJcbnZhciBUUlVOQ0FURV9NU19QUkVGSVggID0gL14tbXMtLyxcclxuXHJcbiAgICAvLyBNYXRjaGVzIGRhc2hlZCBzdHJpbmcgZm9yIGNhbWVsaXppbmdcclxuICAgIERBU0hfQ0FUQ0ggICAgICAgICAgPSAvLShbXFxkYS16XSkvZ2ksXHJcblxyXG4gICAgLy8gTWF0Y2hlcyBcIm5vbmVcIiBvciBhIHRhYmxlIHR5cGUgZS5nLiBcInRhYmxlXCIsXHJcbiAgICAvLyBcInRhYmxlLWNlbGxcIiBldGMuLi5cclxuICAgIE5PTkVfT1JfVEFCTEUgICAgICAgPSAvXihub25lfHRhYmxlKD8hLWNbZWFdKS4rKS8sXHJcbiAgICBcclxuICAgIFRZUEVfVEVTVF9GT0NVU0FCTEUgPSAvXig/OmlucHV0fHNlbGVjdHx0ZXh0YXJlYXxidXR0b258b2JqZWN0KSQvaSxcclxuICAgIFRZUEVfVEVTVF9DTElDS0FCTEUgPSAvXig/OmF8YXJlYSkkL2ksXHJcbiAgICBTRUxFQ1RPUl9JRCAgICAgICAgID0gL14jKFtcXHctXSspJC8sXHJcbiAgICBTRUxFQ1RPUl9UQUcgICAgICAgID0gL15bXFx3LV0rJC8sXHJcbiAgICBTRUxFQ1RPUl9DTEFTUyAgICAgID0gL15cXC4oW1xcdy1dKykkLyxcclxuICAgIFBPU0lUSU9OICAgICAgICAgICAgPSAvXih0b3B8cmlnaHR8Ym90dG9tfGxlZnQpJC8sXHJcbiAgICBOVU1fTk9OX1BYICAgICAgICAgID0gbmV3IFJlZ0V4cCgnXignICsgKC9bKy1dPyg/OlxcZCpcXC58KVxcZCsoPzpbZUVdWystXT9cXGQrfCkvKS5zb3VyY2UgKyAnKSg/IXB4KVthLXolXSskJywgJ2knKSxcclxuICAgIFNJTkdMRV9UQUcgICAgICAgICAgPSAvXjwoXFx3KylcXHMqXFwvPz4oPzo8XFwvXFwxPnwpJC8sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNYXAgb2YgcGFyZW50IHRhZyBuYW1lcyB0byB0aGUgY2hpbGQgdGFncyB0aGF0IHJlcXVpcmUgdGhlbS5cclxuICAgICAqIEB0eXBlIHtPYmplY3R9XHJcbiAgICAgKi9cclxuICAgIFBBUkVOVF9NQVAgPSB7XHJcbiAgICAgICAgdGFibGU6ICAgIC9ePCg/OnRib2R5fHRmb290fHRoZWFkfGNvbGdyb3VwfGNhcHRpb24pXFxiLyxcclxuICAgICAgICB0Ym9keTogICAgL148KD86dHIpXFxiLyxcclxuICAgICAgICB0cjogICAgICAgL148KD86dGR8dGgpXFxiLyxcclxuICAgICAgICBjb2xncm91cDogL148KD86Y29sKVxcYi8sXHJcbiAgICAgICAgc2VsZWN0OiAgIC9ePCg/Om9wdGlvbilcXGIvXHJcbiAgICB9O1xyXG5cclxuLy8gaGF2aW5nIGNhY2hlcyBpc24ndCBhY3R1YWxseSBmYXN0ZXJcclxuLy8gZm9yIGEgbWFqb3JpdHkgb2YgdXNlIGNhc2VzIGZvciBzdHJpbmdcclxuLy8gbWFuaXB1bGF0aW9uc1xyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9zaW1wbGUtY2FjaGUtZm9yLXN0cmluZy1tYW5pcFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG51bU5vdFB4OiAgICAgICAodmFsKSA9PiBOVU1fTk9OX1BYLnRlc3QodmFsKSxcclxuICAgIHBvc2l0aW9uOiAgICAgICAodmFsKSA9PiBQT1NJVElPTi50ZXN0KHZhbCksXHJcbiAgICBzaW5nbGVUYWdNYXRjaDogKHZhbCkgPT4gU0lOR0xFX1RBRy5leGVjKHZhbCksXHJcbiAgICBpc05vbmVPclRhYmxlOiAgKHN0cikgPT4gTk9ORV9PUl9UQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0ZvY3VzYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0ZPQ1VTQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc0NsaWNrYWJsZTogICAgKHN0cikgPT4gVFlQRV9URVNUX0NMSUNLQUJMRS50ZXN0KHN0ciksXHJcbiAgICBpc1N0cmljdElkOiAgICAgKHN0cikgPT4gU0VMRUNUT1JfSUQudGVzdChzdHIpLFxyXG4gICAgaXNUYWc6ICAgICAgICAgIChzdHIpID0+IFNFTEVDVE9SX1RBRy50ZXN0KHN0ciksXHJcbiAgICBpc0NsYXNzOiAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfQ0xBU1MudGVzdChzdHIpLFxyXG5cclxuICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKFRSVU5DQVRFX01TX1BSRUZJWCwgJ21zLScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKERBU0hfQ0FUQ0gsIChtYXRjaCwgbGV0dGVyKSA9PiBsZXR0ZXIudG9VcHBlckNhc2UoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBhcmVudFRhZ05hbWU6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciB2YWwgPSBzdHIuc3Vic3RyKDAsIDMwKTtcclxuICAgICAgICBmb3IgKHZhciBwYXJlbnRUYWdOYW1lIGluIFBBUkVOVF9NQVApIHtcclxuICAgICAgICAgICAgaWYgKFBBUkVOVF9NQVBbcGFyZW50VGFnTmFtZV0udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50VGFnTmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gJ2Rpdic7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBESVYgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIGNyZWF0ZSA9IHJlcXVpcmUoJ0RJVi9jcmVhdGUnKSxcclxuICAgIGEgICAgICA9IERJVi5xdWVyeVNlbGVjdG9yKCdhJyksXHJcbiAgICBzZWxlY3QgPSBjcmVhdGUoJ3NlbGVjdCcpLFxyXG4gICAgb3B0aW9uID0gc2VsZWN0LmFwcGVuZENoaWxkKGNyZWF0ZSgnb3B0aW9uJykpO1xyXG5cclxudmFyIHRlc3QgPSBmdW5jdGlvbih0YWdOYW1lLCB0ZXN0Rm4pIHtcclxuICAgIC8vIEF2b2lkIHZhcmlhYmxlIHJlZmVyZW5jZXMgdG8gZWxlbWVudHMgdG8gcHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUUuXHJcbiAgICByZXR1cm4gdGVzdEZuKGNyZWF0ZSh0YWdOYW1lKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IFVSTHMgYXJlbid0IG1hbmlwdWxhdGVkXHJcbiAgICAvLyAoSUUgbm9ybWFsaXplcyBpdCBieSBkZWZhdWx0KVxyXG4gICAgaHJlZk5vcm1hbGl6ZWQ6IGEuZ2V0QXR0cmlidXRlKCdocmVmJykgPT09ICcvYScsXHJcblxyXG4gICAgLy8gQ2hlY2sgdGhlIGRlZmF1bHQgY2hlY2tib3gvcmFkaW8gdmFsdWUgKCcnIGluIG9sZGVyIFdlYktpdDsgJ29uJyBlbHNld2hlcmUpXHJcbiAgICBjaGVja09uOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuICEhaW5wdXQudmFsdWU7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbiBpbnB1dCBtYWludGFpbnMgaXRzIHZhbHVlIGFmdGVyIGJlY29taW5nIGEgcmFkaW9cclxuICAgIC8vIFN1cHBvcnQ6IE1vZGVybiBicm93c2VycyBvbmx5IChOT1QgSUUgPD0gMTEpXHJcbiAgICByYWRpb1ZhbHVlOiB0ZXN0KCdpbnB1dCcsIGZ1bmN0aW9uKGlucHV0KSB7XHJcbiAgICAgICAgaW5wdXQudmFsdWUgPSAndCc7XHJcbiAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3JhZGlvJyk7XHJcbiAgICAgICAgcmV0dXJuIGlucHV0LnZhbHVlID09PSAndCc7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBhIHNlbGVjdGVkLWJ5LWRlZmF1bHQgb3B0aW9uIGhhcyBhIHdvcmtpbmcgc2VsZWN0ZWQgcHJvcGVydHkuXHJcbiAgICAvLyAoV2ViS2l0IGRlZmF1bHRzIHRvIGZhbHNlIGluc3RlYWQgb2YgdHJ1ZSwgSUUgdG9vLCBpZiBpdCdzIGluIGFuIG9wdGdyb3VwKVxyXG4gICAgb3B0U2VsZWN0ZWQ6IG9wdGlvbi5zZWxlY3RlZCxcclxuXHJcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgb3B0aW9ucyBpbnNpZGUgZGlzYWJsZWQgc2VsZWN0cyBhcmVuJ3QgbWFya2VkIGFzIGRpc2FibGVkXHJcbiAgICAvLyAoV2ViS2l0IG1hcmtzIHRoZW0gYXMgZGlzYWJsZWQpXHJcbiAgICBvcHREaXNhYmxlZDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHNlbGVjdC5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuICFvcHRpb24uZGlzYWJsZWQ7XHJcbiAgICB9KCkpLFxyXG4gICAgXHJcbiAgICB0ZXh0Q29udGVudDogRElWLnRleHRDb250ZW50ICE9PSB1bmRlZmluZWQsXHJcblxyXG4gICAgLy8gTW9kZXJuIGJyb3dzZXJzIG5vcm1hbGl6ZSBcXHJcXG4gdG8gXFxuIGluIHRleHRhcmVhIHZhbHVlcyxcclxuICAgIC8vIGJ1dCBJRSA8PSAxMSAoYW5kIHBvc3NpYmx5IG5ld2VyKSBkbyBub3QuXHJcbiAgICB2YWx1ZU5vcm1hbGl6ZWQ6IHRlc3QoJ3RleHRhcmVhJywgZnVuY3Rpb24odGV4dGFyZWEpIHtcclxuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9ICdcXHJcXG4nO1xyXG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS52YWx1ZSA9PT0gJ1xcbic7XHJcbiAgICB9KSxcclxuXHJcbiAgICAvLyBTdXBwb3J0OiBJRTEwKywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBzZWxlY3RlZFNlbGVjdG9yOiB0ZXN0KCdzZWxlY3QnLCBmdW5jdGlvbihzZWxlY3QpIHtcclxuICAgICAgICBzZWxlY3QuaW5uZXJIVE1MID0gJzxvcHRpb24gdmFsdWU9XCIxXCI+MTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9XCIyXCIgc2VsZWN0ZWQ+Mjwvb3B0aW9uPic7XHJcbiAgICAgICAgcmV0dXJuICEhc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJ29wdGlvbltzZWxlY3RlZF0nKTtcclxuICAgIH0pXHJcbn07XHJcblxyXG4vLyBQcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRVxyXG5ESVYgPSBhID0gc2VsZWN0ID0gb3B0aW9uID0gbnVsbDtcclxuIiwidmFyIGV4aXN0cyAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJ2lzL2FycmF5TGlrZScpLFxyXG4gICAgaXNOb2RlTGlzdCAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgc2xpY2UgICAgICAgPSByZXF1aXJlKCd1dGlsL3NsaWNlJyk7XHJcblxyXG52YXIgXyA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gRmxhdHRlbiB0aGF0IGFsc28gY2hlY2tzIGlmIHZhbHVlIGlzIGEgTm9kZUxpc3RcclxuICAgIGZsYXR0ZW46IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoXy5mbGF0dGVuKHZhbHVlKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIENvbmNhdCBmbGF0IGZvciBhIHNpbmdsZSBhcnJheSBvZiBhcnJheXNcclxuICAgIGNvbmNhdEZsYXQ6IChmdW5jdGlvbihjb25jYXQpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKG5lc3RlZEFycmF5cykge1xyXG4gICAgICAgICAgICByZXR1cm4gY29uY2F0LmFwcGx5KFtdLCBuZXN0ZWRBcnJheXMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfShbXS5jb25jYXQpKSxcclxuXHJcbiAgICB0b1B4OiAodmFsdWUpID0+IHZhbHVlICsgJ3B4JyxcclxuICAgIFxyXG4gICAgcGFyc2VJbnQ6IChudW0pID0+IHBhcnNlSW50KG51bSwgMTApLFxyXG5cclxuICAgIGV2ZXJ5OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFleGlzdHMoYXJyKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAoIWl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4dGVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXHJcbiAgICAgICAgICAgIG9iaiAgPSBhcmdzWzBdLFxyXG4gICAgICAgICAgICBsZW4gID0gYXJncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICghb2JqIHx8IGxlbiA8IDIpIHsgcmV0dXJuIG9iajsgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpZHggPSAxOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBhcmdzW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBTdGFuZGFyZCBtYXBcclxuICAgIG1hcDogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBBcnJheS1wcmVzZXJ2aW5nIG1hcFxyXG4gICAgLy8gaHR0cDovL2pzcGVyZi5jb20vcHVzaC1tYXAtdnMtaW5kZXgtcmVwbGFjZW1lbnQtbWFwXHJcbiAgICBmYXN0bWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFhcnIpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGFycltpZHhdID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaWx0ZXI6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHRzOyB9XHJcbiAgICAgICAgaXRlcmF0b3IgPSBpdGVyYXRvciB8fCAoYXJnKSA9PiAhIWFyZztcclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKGFycltpZHhdLCBpZHgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goYXJyW2lkeF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH0sXHJcblxyXG4gICAgYW55OiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiByZXN1bHQ7IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpKSB7IGJyZWFrOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gISFyZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIHB1bGxlZCBmcm9tIEFNRFxyXG4gICAgdHlwZWNhc3Q6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHZhciByO1xyXG4gICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSAnbnVsbCcpIHtcclxuICAgICAgICAgICAgciA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICByID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ2ZhbHNlJykge1xyXG4gICAgICAgICAgICByID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09IHVuZGVmaW5lZCB8fCB2YWwgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh2YWwgPT09ICcnIHx8IGlzTmFOKHZhbCkpIHtcclxuICAgICAgICAgICAgLy8gaXNOYU4oJycpIHJldHVybnMgZmFsc2VcclxuICAgICAgICAgICAgciA9IHZhbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBwYXJzZUZsb2F0KG51bGwgfHwgJycpIHJldHVybnMgTmFOXHJcbiAgICAgICAgICAgIHIgPSBwYXJzZUZsb2F0KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZShvYmopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFycixcclxuICAgICAgICAgICAgbGVuID0gK29iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkob2JqLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJbaWR4XSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcnIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKG9ialtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUFycmF5OiBmdW5jdGlvbihhcmcpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcmcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGFyZy5zbGljZSA9PT0gc2xpY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZy5zbGljZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaXNBcnJheUxpa2UoYXJnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2xpY2UoYXJnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFsgYXJnIF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihhcnIsIGl0ZW0pIHtcclxuICAgICAgICByZXR1cm4gYXJyLmluZGV4T2YoaXRlbSkgIT09IC0xO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgaWYgKCFvYmogfHwgIWl0ZXJhdG9yKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAvLyBBcnJheS1saWtlXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbaWR4XSwgaWR4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBQbGFpbiBvYmplY3RcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgIGlmIChpdGVyYXRvcihvYmpbcHJvcF0sIHByb3ApID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuXHJcbiAgICBoYXNTaXplOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBtZXJnZTogZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBzZWNvbmQubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgICAgICBpID0gZmlyc3QubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBHbyB0aHJvdWdoIGVhY2ggZWxlbWVudCBpbiB0aGVcclxuICAgICAgICAvLyBzZWNvbmQgYXJyYXkgYW5kIGFkZCBpdCB0byB0aGVcclxuICAgICAgICAvLyBmaXJzdFxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaWR4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcnN0Lmxlbmd0aCA9IGk7XHJcblxyXG4gICAgICAgIHJldHVybiBmaXJzdDtcclxuICAgIH1cclxufTsiLCJ2YXIgZGVsZXRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGRlbGV0YWJsZSA/IFxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgZGVsZXRlIHN0b3JlW2tleV07IH0gOlxyXG4gICAgICAgIGZ1bmN0aW9uKHN0b3JlLCBrZXkpIHsgc3RvcmVba2V5XSA9IHVuZGVmaW5lZDsgfTtcclxufTtcclxuXHJcbnZhciBnZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gc3RvcmUgJiYgc3RvcmVba2V5XSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgc3RvcmVba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleSwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5KSB7XHJcbiAgICAgICAgICAgIGRlbChzdG9yZSwga2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGJpTGV2ZWxHZXR0ZXJTZXR0ZXIgPSBmdW5jdGlvbihkZWxldGFibGUpIHtcclxuICAgIHZhciBzdG9yZSA9IHt9LFxyXG4gICAgICAgIGRlbCA9IGRlbGV0ZXIoZGVsZXRhYmxlKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGhhczogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICB2YXIgaGFzMSA9IGtleTEgaW4gc3RvcmUgJiYgc3RvcmVba2V5MV0gIT09IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgaWYgKCFoYXMxIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoYXMxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ga2V5MiBpbiBzdG9yZVtrZXkxXSAmJiBzdG9yZVtrZXkxXVtrZXkyXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gc3RvcmVba2V5MV07XHJcbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09PSAxID8gcmVmMSA6IChyZWYxICE9PSB1bmRlZmluZWQgPyByZWYxW2tleTJdIDogcmVmMSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciByZWYxID0gdGhpcy5oYXMoa2V5MSkgPyBzdG9yZVtrZXkxXSA6IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgcmVmMVtrZXkyXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIsIGZuLCBhcmcpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBmbihhcmcpO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oa2V5MSwga2V5Mikge1xyXG4gICAgICAgICAgICAvLyBFYXN5IHJlbW92YWxcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkZWwoc3RvcmUsIGtleTEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEZWVwIHJlbW92YWxcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXSB8fCAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIGRlbChyZWYxLCBrZXkyKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihsdmwsIGRlbGV0YWJsZSkge1xyXG4gICAgcmV0dXJuIGx2bCA9PT0gMiA/IGJpTGV2ZWxHZXR0ZXJTZXR0ZXIoZGVsZXRhYmxlKSA6IGdldHRlclNldHRlcihkZWxldGFibGUpO1xyXG59OyIsInZhciBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlIGluc3RhbmNlb2YgY29uc3RydWN0b3I7XHJcbm1vZHVsZS5leHBvcnRzLnNldCA9IChEKSA9PiBjb25zdHJ1Y3RvciA9IEQ7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgK3ZhbHVlLmxlbmd0aCA9PT0gdmFsdWUubGVuZ3RoO1xyXG4iLCJ2YXIgRE9DVU1FTlRfRlJBR01FTlQgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlRfRlJBR01FTlQnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIGVsZW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5vd25lckRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtICE9PSBkb2N1bWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlLm5vZGVUeXBlICE9PSBET0NVTUVOVF9GUkFHTUVOVCAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUuaXNQYXJzZUh0bWxGcmFnbWVudCAhPT0gdHJ1ZTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlO1xyXG4iLCJ2YXIgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc05vZGVMaXN0ID0gcmVxdWlyZSgnaXMvbm9kZUxpc3QnKSxcclxuICAgIGlzRCAgICAgICAgPSByZXF1aXJlKCdpcy9EJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIGlzRCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNOb2RlTGlzdCh2YWx1ZSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gZG9jdW1lbnQ7XHJcbiIsInZhciBpc1dpbmRvdyA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgRUxFTUVOVCAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+XHJcbiAgICB2YWx1ZSAmJiAodmFsdWUgPT09IGRvY3VtZW50IHx8IGlzV2luZG93KHZhbHVlKSB8fCB2YWx1ZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG4iLCJ2YXIgaXNTdHJpbmcgPSByZXF1aXJlKCdpcy9zdHJpbmcnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciB0ZXh0ID0gdmFsdWUudHJpbSgpO1xyXG4gICAgcmV0dXJuICh0ZXh0LmNoYXJBdCgwKSA9PT0gJzwnICYmIHRleHQuY2hhckF0KHRleHQubGVuZ3RoIC0gMSkgPT09ICc+JyAmJiB0ZXh0Lmxlbmd0aCA+PSAzKTtcclxufTsiLCIvLyBOb2RlTGlzdCBjaGVjay4gRm9yIG91ciBwdXJwb3NlcywgYSBOb2RlTGlzdCBhbmQgYW4gSFRNTENvbGxlY3Rpb24gYXJlIHRoZSBzYW1lLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdmFsdWUgJiYgKFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgTm9kZUxpc3QgfHxcclxuICAgICAgICB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uXHJcbiAgICApO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgKCEhdmFsdWUgJiYgdHlwZSA9PT0gJ29iamVjdCcpO1xyXG59OyIsInZhciBpc0Z1bmN0aW9uICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0NvbGxlY3Rpb24gPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWwpID0+XHJcbiAgICB2YWwgJiYgKGlzU3RyaW5nKHZhbCkgfHwgaXNGdW5jdGlvbih2YWwpIHx8IGlzRWxlbWVudCh2YWwpIHx8IGlzQ29sbGVjdGlvbih2YWwpKTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJzsiLCJtb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgPT09IHZhbHVlLndpbmRvdztcclxuIiwidmFyIEVMRU1FTlQgICAgICAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBESVYgICAgICAgICAgICAgPSByZXF1aXJlKCdESVYnKSxcclxuICAgIC8vIFN1cHBvcnQ6IElFOSssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgbWF0Y2hlc1NlbGVjdG9yID0gRElWLm1hdGNoZXMgICAgICAgICAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1hdGNoZXNTZWxlY3RvciAgICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1zTWF0Y2hlc1NlbGVjdG9yICAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm1vek1hdGNoZXNTZWxlY3RvciAgICB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgRElWLm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBzZWxlY3RvcikgPT5cclxuICAgIGVsZW0ubm9kZVR5cGUgPT09IEVMRU1FTlQgPyBtYXRjaGVzU2VsZWN0b3IuY2FsbChlbGVtLCBzZWxlY3RvcikgOiBmYWxzZTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IG51bGw7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvcikge1xyXG4gICAgaWYgKCFvYmogfHwgIWl0ZXJhdG9yKSB7IHJldHVybjsgfVxyXG5cclxuICAgIC8vIEFycmF5IHN1cHBvcnRcclxuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoLFxyXG4gICAgICAgICAgICBpdGVtO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGl0ZW0gPSBvYmpbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT2JqZWN0IHN1cHBvcnRcclxuICAgIHZhciBrZXksIHZhbHVlO1xyXG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgdmFsdWUgPSBvYmpba2V5XTtcclxuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbCh2YWx1ZSwgdmFsdWUsIGtleSkgPT09IGZhbHNlKSB7IHJldHVybjsgfVxyXG4gICAgfVxyXG59OyIsInZhciBfICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgPSByZXF1aXJlKCdEJyksXHJcbiAgICBleGlzdHMgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIHNsaWNlICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKSxcclxuICAgIGVhY2ggICA9IHJlcXVpcmUoJy4vZWFjaCcpO1xyXG5cclxudmFyIG1hcCA9IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICBpZiAoIWFyci5sZW5ndGggfHwgIWl0ZXJhdG9yKSB7IHJldHVybiByZXN1bHRzOyB9XHJcblxyXG4gICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgaXRlbTtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgaXRlbSA9IGFycltpZHhdO1xyXG4gICAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvci5jYWxsKGl0ZW0sIGl0ZW0sIGlkeCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBfLmNvbmNhdEZsYXQocmVzdWx0cyk7XHJcbn07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgYXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbK2luZGV4XTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgIC8vIE5vIGluZGV4LCByZXR1cm4gYWxsXHJcbiAgICAgICAgaWYgKCFleGlzdHMoaW5kZXgpKSB7IHJldHVybiB0aGlzLnRvQXJyYXkoKTsgfVxyXG5cclxuICAgICAgICBpbmRleCA9ICtpbmRleDtcclxuXHJcbiAgICAgICAgLy8gTG9va2luZyB0byBnZXQgYW4gaW5kZXggZnJvbSB0aGUgZW5kIG9mIHRoZSBzZXRcclxuICAgICAgICBpZiAoaW5kZXggPCAwKSB7IGluZGV4ID0gKHRoaXMubGVuZ3RoICsgaW5kZXgpOyB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzW2luZGV4XTtcclxuICAgIH0sXHJcblxyXG4gICAgZXE6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpcy5nZXQoaW5kZXgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2xpY2U6IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcclxuICAgICAgICByZXR1cm4gRChzbGljZSh0aGlzLnRvQXJyYXkoKSwgc3RhcnQsIGVuZCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBmaXJzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpc1swXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKHRoaXNbdGhpcy5sZW5ndGggLSAxXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBzbGljZSh0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgbWFwOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgIHJldHVybiBEKG1hcCh0aGlzLCBpdGVyYXRvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBlYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgIGVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmb3JFYWNoOiBmdW5jdGlvbihpdGVyYXRvcikge1xyXG4gICAgICAgIGVhY2godGhpcywgaXRlcmF0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgb3JkZXIgPSByZXF1aXJlKCdvcmRlcicpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihyZXN1bHRzKSB7XHJcbiAgICB2YXIgaGFzRHVwbGljYXRlcyA9IG9yZGVyLnNvcnQocmVzdWx0cyk7XHJcbiAgICBpZiAoIWhhc0R1cGxpY2F0ZXMpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgZWxlbSxcclxuICAgICAgICBpZHggPSAwLFxyXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgYXJyYXkgaGVyZVxyXG4gICAgICAgIC8vIHNvIHRoYXQgYSBuZXcgYXJyYXkgaXNuJ3RcclxuICAgICAgICAvLyBjcmVhdGVkL2Rlc3Ryb3llZCBldmVyeSB1bmlxdWUgY2FsbFxyXG4gICAgICAgIGR1cGxpY2F0ZXMgPSBbXTtcclxuXHJcbiAgICAvLyBHbyB0aHJvdWdoIHRoZSBhcnJheSBhbmQgaWRlbnRpZnlcclxuICAgIC8vIHRoZSBkdXBsaWNhdGVzIHRvIGJlIHJlbW92ZWRcclxuICAgIHdoaWxlICgoZWxlbSA9IHJlc3VsdHNbaWR4KytdKSkge1xyXG4gICAgICAgIGlmIChlbGVtID09PSByZXN1bHRzW2lkeF0pIHtcclxuICAgICAgICAgICAgZHVwbGljYXRlcy5wdXNoKGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlbW92ZSB0aGUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICBpZHggPSBkdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgcmVzdWx0cy5zcGxpY2UoZHVwbGljYXRlc1tpZHhdLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBleGlzdHMgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgICAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNTdHJpbmcgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc0VsZW1lbnQnKSxcclxuICAgIG5ld2xpbmVzICAgICAgICAgICAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBTVVBQT1JUUyAgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcbiAgICBpc05vZGVOYW1lICAgICAgICAgICA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBGaXp6bGUgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCk7XHJcblxyXG52YXIgaXNEYXRhS2V5ID0gKGtleSkgPT4gKGtleSB8fCAnJykuc3Vic3RyKDAsIDUpID09PSAnZGF0YS0nLFxyXG5cclxuICAgIHRyaW1EYXRhS2V5ID0gKGtleSkgPT4ga2V5LnN1YnN0cigwLCA1KSxcclxuXHJcbiAgICBzYW5pdGl6ZURhdGFLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gc2FuaXRpemVEYXRhS2V5Q2FjaGUuaGFzKGtleSkgP1xyXG4gICAgICAgICAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZS5nZXQoa2V5KSA6XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLnB1dChrZXksICgpID0+IGlzRGF0YUtleShrZXkpID8ga2V5IDogJ2RhdGEtJyArIGtleS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RGF0YUF0dHJLZXlzID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBhdHRycyA9IGVsZW0uYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgaWR4ICAgPSBhdHRycy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleXMgID0gW10sXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAga2V5ID0gYXR0cnNbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGlzRGF0YUtleShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9O1xyXG5cclxudmFyIGJvb2xIb29rID0ge1xyXG4gICAgaXM6IChhdHRyTmFtZSkgPT4gRml6emxlLnBhcnNlLmlzQm9vbChhdHRyTmFtZSksXHJcbiAgICBnZXQ6IChlbGVtLCBhdHRyTmFtZSkgPT4gZWxlbS5oYXNBdHRyaWJ1dGUoYXR0ck5hbWUpID8gYXR0ck5hbWUudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZCxcclxuICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUsIGF0dHJOYW1lKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgYm9vbGVhbiBhdHRyaWJ1dGVzIHdoZW4gc2V0IHRvIGZhbHNlXHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0ck5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGhvb2tzID0ge1xyXG4gICAgICAgIHRhYmluZGV4OiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhYmluZGV4ID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyh0YWJpbmRleCkgfHwgdGFiaW5kZXggPT09ICcnKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmluZGV4O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHlwZToge1xyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIVNVUFBPUlRTLnJhZGlvVmFsdWUgJiYgdmFsdWUgPT09ICdyYWRpbycgJiYgaXNOb2RlTmFtZShlbGVtLCAnaW5wdXQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldHRpbmcgdGhlIHR5cGUgb24gYSByYWRpbyBidXR0b24gYWZ0ZXIgdGhlIHZhbHVlIHJlc2V0cyB0aGUgdmFsdWUgaW4gSUU2LTlcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB2YWx1ZSB0byBkZWZhdWx0IGluIGNhc2UgdHlwZSBpcyBzZXQgYWZ0ZXIgdmFsdWUgZHVyaW5nIGNyZWF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnZhbHVlID0gb2xkVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndHlwZScsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IGVsZW0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3bGluZXModmFsKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkgfHwgIWVsZW0uaGFzQXR0cmlidXRlKGF0dHIpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJvb2xIb29rLmdldChlbGVtLCBhdHRyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5nZXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLmdldChlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShhdHRyKTtcclxuICAgICAgICByZXR1cm4gZXhpc3RzKHJldCkgPyByZXQgOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldHRlcnMgPSB7XHJcbiAgICAgICAgZm9yQXR0cjogZnVuY3Rpb24oYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGJvb2xIb29rLmlzKGF0dHIpICYmICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ib29sO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnNldCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldHRlcnMuaG9vaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0dGVycy5lbGVtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYm9vbDogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgYm9vbEhvb2suc2V0KGVsZW0sIHZhbHVlLCBhdHRyKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhvb2s6IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGhvb2tzW2F0dHJdLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbGVtOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBzZXRBdHRyaWJ1dGVzID0gZnVuY3Rpb24oYXJyLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpc0ZuICAgPSBpc0Z1bmN0aW9uKHZhbHVlKSxcclxuICAgICAgICAgICAgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgdmFsLFxyXG4gICAgICAgICAgICBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG5cclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgdmFsID0gaXNGbiA/IHZhbHVlLmNhbGwoZWxlbSwgaWR4LCBnZXRBdHRyaWJ1dGUoZWxlbSwgYXR0cikpIDogdmFsdWU7XHJcbiAgICAgICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHZhciBzZXR0ZXIgPSBzZXR0ZXJzLmZvckF0dHIoYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgIHNldHRlcihlbGVtLCBhdHRyLCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGUoYXJyW2lkeF0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICByZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihlbGVtLCBhdHRyKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChob29rc1thdHRyXSAmJiBob29rc1thdHRyXS5yZW1vdmUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGhvb2tzW2F0dHJdLnJlbW92ZShlbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHIpO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhhdHRyKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEF0dHJpYnV0ZSh0aGlzWzBdLCBhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gYXNzdW1lIGFuIG9iamVjdFxyXG4gICAgICAgICAgICB2YXIgYXR0cnMgPSBhdHRyO1xyXG4gICAgICAgICAgICBmb3IgKGF0dHIgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgYXR0cnNbYXR0cl0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgLy8gcmVtb3ZlXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpdGVyYXRvclxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkQXR0ciA9IGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICA9IGZuLmNhbGwoZWxlbSwgaWR4LCBvbGRBdHRyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cyhyZXN1bHQpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZShlbGVtLCBhdHRyLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNldFxyXG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHRoaXMsIGF0dHIsIHZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVBdHRyOiBmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7IHJlbW92ZUF0dHJpYnV0ZXModGhpcywgYXR0cik7IH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYXR0ckRhdGE6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbWFwICA9IHt9LFxyXG4gICAgICAgICAgICAgICAga2V5cyA9IGdldERhdGFBdHRyS2V5cyhmaXJzdCksXHJcbiAgICAgICAgICAgICAgICBpZHggID0ga2V5cy5sZW5ndGgsIGtleTtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBtYXBbdHJpbURhdGFLZXkoa2V5KV0gPSBfLnR5cGVjYXN0KGZpcnN0LmdldEF0dHJpYnV0ZShrZXkpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1hcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrIHRvIGFuIG9iamVjdCBkZWZpbml0aW9uXHJcbiAgICAgICAgdmFyIG9iaiA9IGtleSxcclxuICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW2lkeF0uc2V0QXR0cmlidXRlKHNhbml0aXplRGF0YUtleShrZXkpLCAnJyArIG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEVMRU1FTlQgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBzcGxpdCAgICAgPSByZXF1aXJlKCdzdHJpbmcvc3BsaXQnKSxcclxuICAgIGlzRW1wdHkgICA9IHJlcXVpcmUoJ3N0cmluZy9pc0VtcHR5Jyk7XHJcblxyXG52YXIgaGFzQ2xhc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuICEhZWxlbS5jbGFzc0xpc3QgJiYgZWxlbS5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZENsYXNzZXMgPSBmdW5jdGlvbihlbGVtLCBuYW1lcykge1xyXG4gICAgICAgIGlmICghZWxlbS5jbGFzc0xpc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QuYWRkKG5hbWVzW2lkeF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtLmNsYXNzTGlzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC5yZW1vdmUobmFtZXNbaWR4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbSwgbmFtZXMpIHtcclxuICAgICAgICBpZiAoIWVsZW0uY2xhc3NMaXN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LnRvZ2dsZShuYW1lc1tpZHhdKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIF9kb0FueUVsZW1zSGF2ZUNsYXNzID0gZnVuY3Rpb24oZWxlbXMsIG5hbWUpIHtcclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBpZiAoaGFzQ2xhc3MoZWxlbXNbZWxlbUlkeF0sIG5hbWUpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgX2FkZENsYXNzZXMgPSBmdW5jdGlvbihlbGVtcywgbmFtZXMpIHtcclxuICAgICAgICAvLyBTdXBwb3J0IGFycmF5LWxpa2Ugb2JqZWN0c1xyXG4gICAgICAgIGlmICghaXNBcnJheShuYW1lcykpIHsgbmFtZXMgPSBfLnRvQXJyYXkobmFtZXMpOyB9XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgYWRkQ2xhc3NlcyhlbGVtc1tlbGVtSWR4XSwgbmFtZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3JlbW92ZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtcywgbmFtZXMpIHtcclxuICAgICAgICAvLyBTdXBwb3J0IGFycmF5LWxpa2Ugb2JqZWN0c1xyXG4gICAgICAgIGlmICghaXNBcnJheShuYW1lcykpIHsgbmFtZXMgPSBfLnRvQXJyYXkobmFtZXMpOyB9XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NlcyhlbGVtc1tlbGVtSWR4XSwgbmFtZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3JlbW92ZUFsbENsYXNzZXMgPSBmdW5jdGlvbihlbGVtcykge1xyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGVsZW1zW2VsZW1JZHhdLmNsYXNzTmFtZSA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3RvZ2dsZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtcywgbmFtZXMpIHtcclxuICAgICAgICAvLyBTdXBwb3J0IGFycmF5LWxpa2Ugb2JqZWN0c1xyXG4gICAgICAgIGlmICghaXNBcnJheShuYW1lcykpIHsgbmFtZXMgPSBfLnRvQXJyYXkobmFtZXMpOyB9XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgdG9nZ2xlQ2xhc3NlcyhlbGVtc1tlbGVtSWR4XSwgbmFtZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgaGFzQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICBpZiAobmFtZSA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG4gICAgICAgIHJldHVybiBfZG9BbnlFbGVtc0hhdmVDbGFzcyh0aGlzLCBuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzO1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbmFtZXMgPSBzcGxpdChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgX3JlbW92ZUFsbENsYXNzZXModGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQXJyYXkobmFtZXMpKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZXMpIHx8ICFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIF9yZW1vdmVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKG5hbWVzKSkge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzO1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbmFtZXMgPSBzcGxpdChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFuYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIF9yZW1vdmVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzOiBmdW5jdGlvbihuYW1lcywgc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lcykgfHwgIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBuYW1lcyA9IHNwbGl0KG5hbWVzKTtcclxuICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICBpZiAoc2hvdWxkQWRkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgX3RvZ2dsZUNsYXNzZXModGhpcywgbmFtZXMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc2hvdWxkQWRkKSB7XHJcbiAgICAgICAgICAgIF9hZGRDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBfcmVtb3ZlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBzcGxpdCAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNBdHRhY2hlZCA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNEb2N1bWVudCA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc051bWJlciAgID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBpc0Jvb2xlYW4gID0gcmVxdWlyZSgnaXMvYm9vbGVhbicpLFxyXG4gICAgaXNPYmplY3QgICA9IHJlcXVpcmUoJ2lzL29iamVjdCcpLFxyXG4gICAgaXNBcnJheSAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBET0NVTUVOVCAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UJyksXHJcbiAgICBSRUdFWCAgICAgID0gcmVxdWlyZSgnUkVHRVgnKTtcclxuXHJcbnZhciBzd2FwTWVhc3VyZURpc3BsYXlTZXR0aW5ncyA9IHtcclxuICAgIGRpc3BsYXk6ICAgICdibG9jaycsXHJcbiAgICBwb3NpdGlvbjogICAnYWJzb2x1dGUnLFxyXG4gICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcclxufTtcclxuXHJcbnZhciBnZXREb2N1bWVudERpbWVuc2lvbiA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIC8vIEVpdGhlciBzY3JvbGxbV2lkdGgvSGVpZ2h0XSBvciBvZmZzZXRbV2lkdGgvSGVpZ2h0XSBvclxyXG4gICAgLy8gY2xpZW50W1dpZHRoL0hlaWdodF0sIHdoaWNoZXZlciBpcyBncmVhdGVzdFxyXG4gICAgdmFyIGRvYyA9IGVsZW0uZG9jdW1lbnRFbGVtZW50O1xyXG4gICAgcmV0dXJuIE1hdGgubWF4KFxyXG4gICAgICAgIGVsZW0uYm9keVsnc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGVsZW0uYm9keVsnb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ3Njcm9sbCcgKyBuYW1lXSxcclxuICAgICAgICBkb2NbJ29mZnNldCcgKyBuYW1lXSxcclxuXHJcbiAgICAgICAgZG9jWydjbGllbnQnICsgbmFtZV1cclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgaGlkZSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9LFxyXG4gICAgc2hvdyA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnJztcclxuICAgIH0sXHJcblxyXG4gICAgY3NzU3dhcCA9IGZ1bmN0aW9uKGVsZW0sIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG9sZCA9IHt9O1xyXG5cclxuICAgICAgICAvLyBSZW1lbWJlciB0aGUgb2xkIHZhbHVlcywgYW5kIGluc2VydCB0aGUgbmV3IG9uZXNcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBvbGRbbmFtZV0gPSBlbGVtLnN0eWxlW25hbWVdO1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhlbGVtKTtcclxuXHJcbiAgICAgICAgLy8gUmV2ZXJ0IHRoZSBvbGQgdmFsdWVzXHJcbiAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZVtuYW1lXSA9IG9sZFtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEF2b2lkcyBhbiAnSWxsZWdhbCBJbnZvY2F0aW9uJyBlcnJvciAoQ2hyb21lKVxyXG4gICAgLy8gQXZvaWRzIGEgJ1R5cGVFcnJvcjogQXJndW1lbnQgMSBvZiBXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSBkb2VzIG5vdCBpbXBsZW1lbnQgaW50ZXJmYWNlIEVsZW1lbnQnIGVycm9yIChGaXJlZm94KVxyXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZSA9IChlbGVtKSA9PlxyXG4gICAgICAgIGlzRWxlbWVudChlbGVtKSAmJiAhaXNXaW5kb3coZWxlbSkgJiYgIWlzRG9jdW1lbnQoZWxlbSkgPyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSA6IG51bGwsXHJcblxyXG4gICAgX3dpZHRoID0ge1xyXG4gICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlID09PSBET0NVTUVOVCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldERvY3VtZW50RGltZW5zaW9uKGVsZW0sICdXaWR0aCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBlbGVtLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgICBpZiAod2lkdGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ3dpZHRoJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUud2lkdGggPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9oZWlnaHQgPSB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1dpbmRvdyhlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IERPQ1VNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ0hlaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gZWxlbS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIGlmICghY29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKFJFR0VYLmlzTm9uZU9yVGFibGUoY29tcHV0ZWRTdHlsZS5kaXNwbGF5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjc3NTd2FwKGVsZW0sIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzLCBmdW5jdGlvbigpIHsgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpOyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFdpZHRoT3JIZWlnaHQoZWxlbSwgJ2hlaWdodCcpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGUuaGVpZ2h0ID0gaXNOdW1iZXIodmFsKSA/IF8udG9QeCh2YWwgPCAwID8gMCA6IHZhbCkgOiB2YWw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbnZhciBnZXRXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG5cclxuICAgIC8vIFN0YXJ0IHdpdGggb2Zmc2V0IHByb3BlcnR5LCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIHRoZSBib3JkZXItYm94IHZhbHVlXHJcbiAgICB2YXIgdmFsdWVJc0JvcmRlckJveCA9IHRydWUsXHJcbiAgICAgICAgdmFsID0gKG5hbWUgPT09ICd3aWR0aCcpID8gZWxlbS5vZmZzZXRXaWR0aCA6IGVsZW0ub2Zmc2V0SGVpZ2h0LFxyXG4gICAgICAgIHN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSksXHJcbiAgICAgICAgaXNCb3JkZXJCb3ggPSBzdHlsZXMuYm94U2l6aW5nID09PSAnYm9yZGVyLWJveCc7XHJcblxyXG4gICAgLy8gc29tZSBub24taHRtbCBlbGVtZW50cyByZXR1cm4gdW5kZWZpbmVkIGZvciBvZmZzZXRXaWR0aCwgc28gY2hlY2sgZm9yIG51bGwvdW5kZWZpbmVkXHJcbiAgICAvLyBzdmcgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02NDkyODVcclxuICAgIC8vIE1hdGhNTCAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTQ5MTY2OFxyXG4gICAgaWYgKHZhbCA8PSAwIHx8ICFleGlzdHModmFsKSkge1xyXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBjb21wdXRlZCB0aGVuIHVuY29tcHV0ZWQgY3NzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgIHZhbCA9IGN1ckNzcyhlbGVtLCBuYW1lLCBzdHlsZXMpO1xyXG4gICAgICAgIGlmICh2YWwgPCAwIHx8ICF2YWwpIHsgdmFsID0gZWxlbS5zdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgICAgICAvLyBDb21wdXRlZCB1bml0IGlzIG5vdCBwaXhlbHMuIFN0b3AgaGVyZSBhbmQgcmV0dXJuLlxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeCh2YWwpKSB7IHJldHVybiB2YWw7IH1cclxuXHJcbiAgICAgICAgLy8gd2UgbmVlZCB0aGUgY2hlY2sgZm9yIHN0eWxlIGluIGNhc2UgYSBicm93c2VyIHdoaWNoIHJldHVybnMgdW5yZWxpYWJsZSB2YWx1ZXNcclxuICAgICAgICAvLyBmb3IgZ2V0Q29tcHV0ZWRTdHlsZSBzaWxlbnRseSBmYWxscyBiYWNrIHRvIHRoZSByZWxpYWJsZSBlbGVtLnN0eWxlXHJcbiAgICAgICAgdmFsdWVJc0JvcmRlckJveCA9IGlzQm9yZGVyQm94ICYmIHZhbCA9PT0gc3R5bGVzW25hbWVdO1xyXG5cclxuICAgICAgICAvLyBOb3JtYWxpemUgJycsIGF1dG8sIGFuZCBwcmVwYXJlIGZvciBleHRyYVxyXG4gICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVzZSB0aGUgYWN0aXZlIGJveC1zaXppbmcgbW9kZWwgdG8gYWRkL3N1YnRyYWN0IGlycmVsZXZhbnQgc3R5bGVzXHJcbiAgICByZXR1cm4gXy50b1B4KFxyXG4gICAgICAgIHZhbCArIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0KFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICBpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnLFxyXG4gICAgICAgICAgICB2YWx1ZUlzQm9yZGVyQm94LFxyXG4gICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICApXHJcbiAgICApO1xyXG59O1xyXG5cclxudmFyIENTU19FWFBBTkQgPSBzcGxpdCgnVG9wfFJpZ2h0fEJvdHRvbXxMZWZ0Jyk7XHJcbnZhciBhdWdtZW50Qm9yZGVyQm94V2lkdGhPckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGV4dHJhLCBpc0JvcmRlckJveCwgc3R5bGVzKSB7XHJcbiAgICB2YXIgdmFsID0gMCxcclxuICAgICAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgdGhlIHJpZ2h0IG1lYXN1cmVtZW50LCBhdm9pZCBhdWdtZW50YXRpb25cclxuICAgICAgICBpZHggPSAoZXh0cmEgPT09IChpc0JvcmRlckJveCA/ICdib3JkZXInIDogJ2NvbnRlbnQnKSkgP1xyXG4gICAgICAgICAgICA0IDpcclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGluaXRpYWxpemUgZm9yIGhvcml6b250YWwgb3IgdmVydGljYWwgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAobmFtZSA9PT0gJ3dpZHRoJykgP1xyXG4gICAgICAgICAgICAxIDpcclxuICAgICAgICAgICAgMCxcclxuICAgICAgICB0eXBlLFxyXG4gICAgICAgIC8vIFB1bGxlZCBvdXQgb2YgdGhlIGxvb3AgdG8gcmVkdWNlIHN0cmluZyBjb21wYXJpc29uc1xyXG4gICAgICAgIGV4dHJhSXNNYXJnaW4gID0gKGV4dHJhID09PSAnbWFyZ2luJyksXHJcbiAgICAgICAgZXh0cmFJc0NvbnRlbnQgPSAoIWV4dHJhSXNNYXJnaW4gJiYgZXh0cmEgPT09ICdjb250ZW50JyksXHJcbiAgICAgICAgZXh0cmFJc1BhZGRpbmcgPSAoIWV4dHJhSXNNYXJnaW4gJiYgIWV4dHJhSXNDb250ZW50ICYmIGV4dHJhID09PSAncGFkZGluZycpO1xyXG5cclxuICAgIGZvciAoOyBpZHggPCA0OyBpZHggKz0gMikge1xyXG4gICAgICAgIHR5cGUgPSBDU1NfRVhQQU5EW2lkeF07XHJcblxyXG4gICAgICAgIC8vIGJvdGggYm94IG1vZGVscyBleGNsdWRlIG1hcmdpbiwgc28gYWRkIGl0IGlmIHdlIHdhbnQgaXRcclxuICAgICAgICBpZiAoZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbZXh0cmEgKyB0eXBlXSkgfHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0JvcmRlckJveCkge1xyXG5cclxuICAgICAgICAgICAgLy8gYm9yZGVyLWJveCBpbmNsdWRlcyBwYWRkaW5nLCBzbyByZW1vdmUgaXQgaWYgd2Ugd2FudCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IF8ucGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBib3JkZXIgbm9yIG1hcmdpbiwgc28gcmVtb3ZlIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoIWV4dHJhSXNNYXJnaW4pIHtcclxuICAgICAgICAgICAgICAgIHZhbCAtPSBfLnBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGUgKyAnV2lkdGgnXSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCwgc28gYWRkIHBhZGRpbmdcclxuICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzWydwYWRkaW5nJyArIHR5cGVdKSB8fCAwO1xyXG5cclxuICAgICAgICAgICAgLy8gYXQgdGhpcyBwb2ludCwgZXh0cmEgaXNuJ3QgY29udGVudCBub3IgcGFkZGluZywgc28gYWRkIGJvcmRlclxyXG4gICAgICAgICAgICBpZiAoZXh0cmFJc1BhZGRpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1snYm9yZGVyJyArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB2YWw7XHJcbn07XHJcblxyXG52YXIgY3VyQ3NzID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgY29tcHV0ZWQpIHtcclxuICAgIHZhciBzdHlsZSA9IGVsZW0uc3R5bGUsXHJcbiAgICAgICAgc3R5bGVzID0gY29tcHV0ZWQgfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICByZXQgPSBzdHlsZXMgPyBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKSB8fCBzdHlsZXNbbmFtZV0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgLy8gQXZvaWQgc2V0dGluZyByZXQgdG8gZW1wdHkgc3RyaW5nIGhlcmVcclxuICAgIC8vIHNvIHdlIGRvbid0IGRlZmF1bHQgdG8gYXV0b1xyXG4gICAgaWYgKCFleGlzdHMocmV0KSAmJiBzdHlsZSAmJiBzdHlsZVtuYW1lXSkgeyByZXQgPSBzdHlsZVtuYW1lXTsgfVxyXG5cclxuICAgIC8vIEZyb20gdGhlIGhhY2sgYnkgRGVhbiBFZHdhcmRzXHJcbiAgICAvLyBodHRwOi8vZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDcvMDcvMjcvMTguNTQuMTUvI2NvbW1lbnQtMTAyMjkxXHJcblxyXG4gICAgaWYgKHN0eWxlcykge1xyXG4gICAgICAgIGlmIChyZXQgPT09ICcnICYmICFpc0F0dGFjaGVkKGVsZW0pKSB7XHJcbiAgICAgICAgICAgIHJldCA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB3ZSdyZSBub3QgZGVhbGluZyB3aXRoIGEgcmVndWxhciBwaXhlbCBudW1iZXJcclxuICAgICAgICAvLyBidXQgYSBudW1iZXIgdGhhdCBoYXMgYSB3ZWlyZCBlbmRpbmcsIHdlIG5lZWQgdG8gY29udmVydCBpdCB0byBwaXhlbHNcclxuICAgICAgICAvLyBidXQgbm90IHBvc2l0aW9uIGNzcyBhdHRyaWJ1dGVzLCBhcyB0aG9zZSBhcmUgcHJvcG9ydGlvbmFsIHRvIHRoZSBwYXJlbnQgZWxlbWVudCBpbnN0ZWFkXHJcbiAgICAgICAgLy8gYW5kIHdlIGNhbid0IG1lYXN1cmUgdGhlIHBhcmVudCBpbnN0ZWFkIGJlY2F1c2UgaXQgbWlnaHQgdHJpZ2dlciBhICdzdGFja2luZyBkb2xscycgcHJvYmxlbVxyXG4gICAgICAgIGlmIChSRUdFWC5udW1Ob3RQeChyZXQpICYmICFSRUdFWC5wb3NpdGlvbihuYW1lKSkge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIG9yaWdpbmFsIHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgbGVmdCA9IHN0eWxlLmxlZnQsXHJcbiAgICAgICAgICAgICAgICBycyA9IGVsZW0ucnVudGltZVN0eWxlLFxyXG4gICAgICAgICAgICAgICAgcnNMZWZ0ID0gcnMgJiYgcnMubGVmdDtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1dCBpbiB0aGUgbmV3IHZhbHVlcyB0byBnZXQgYSBjb21wdXRlZCB2YWx1ZSBvdXRcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gZWxlbS5jdXJyZW50U3R5bGUubGVmdDsgfVxyXG5cclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IChuYW1lID09PSAnZm9udFNpemUnKSA/ICcxZW0nIDogcmV0O1xyXG4gICAgICAgICAgICByZXQgPSBfLnRvUHgoc3R5bGUucGl4ZWxMZWZ0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldmVydCB0aGUgY2hhbmdlZCB2YWx1ZXNcclxuICAgICAgICAgICAgc3R5bGUubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgICAgIGlmIChyc0xlZnQpIHsgcnMubGVmdCA9IHJzTGVmdDsgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmV0ID09PSB1bmRlZmluZWQgPyByZXQgOiByZXQgKyAnJyB8fCAnYXV0byc7XHJcbn07XHJcblxyXG52YXIgbm9ybWFsaXplQ3NzS2V5ID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgcmV0dXJuIFJFR0VYLmNhbWVsQ2FzZShuYW1lKTtcclxufTtcclxuXHJcbnZhciBzZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICBuYW1lID0gbm9ybWFsaXplQ3NzS2V5KG5hbWUpO1xyXG4gICAgZWxlbS5zdHlsZVtuYW1lXSA9ICh2YWx1ZSA9PT0gK3ZhbHVlKSA/IF8udG9QeCh2YWx1ZSkgOiB2YWx1ZTtcclxufTtcclxuXHJcbnZhciBnZXRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICByZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVtuYW1lXTtcclxufTtcclxuXHJcbnZhciBpc0hpZGRlbiA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gU3RhbmRhcmQ6XHJcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MRWxlbWVudC5vZmZzZXRQYXJlbnRcclxuICAgIHJldHVybiBlbGVtLm9mZnNldFBhcmVudCA9PT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAvLyBTdXBwb3J0OiBPcGVyYSA8PSAxMi4xMlxyXG4gICAgICAgICAgICAvLyBPcGVyYSByZXBvcnRzIG9mZnNldFdpZHRocyBhbmQgb2Zmc2V0SGVpZ2h0cyBsZXNzIHRoYW4gemVybyBvbiBzb21lIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGVsZW0ub2Zmc2V0V2lkdGggPD0gMCAmJiBlbGVtLm9mZnNldEhlaWdodCA8PSAwIHx8XHJcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICgoZWxlbS5zdHlsZSAmJiBlbGVtLnN0eWxlLmRpc3BsYXkpID8gZWxlbS5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgOiBmYWxzZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGN1ckNzczogY3VyQ3NzLFxyXG4gICAgd2lkdGg6ICBfd2lkdGgsXHJcbiAgICBoZWlnaHQ6IF9oZWlnaHQsXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBjc3M6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwgbmFtZSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRTdHlsZSh0aGlzW2lkeF0sIGtleSwgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBcnJheShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0ge30sXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghaWR4KSB7IHJldHVybiByZXQ7IH0gLy8gcmV0dXJuIGVhcmx5XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzU3RyaW5nKHZhbHVlKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgICAgICByZXRbdmFsdWVdID0gZ2V0U3R5bGUoZmlyc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGhpZGUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgc2hvdyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbihzdGF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNCb29sZWFuKHN0YXRlKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlID8gdGhpcy5zaG93KCkgOiB0aGlzLmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gaXNIaWRkZW4oZWxlbSkgPyBzaG93KGVsZW0pIDogaGlkZShlbGVtKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgY2FjaGUgICAgID0gcmVxdWlyZSgnY2FjaGUnKSgyLCB0cnVlKSxcclxuICAgIGlzU3RyaW5nICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBcnJheSAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzRWxlbWVudCA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIEFDQ0VTU09SICA9ICdfX0RfaWRfXyAnLFxyXG4gICAgdW5pcXVlSWQgID0gcmVxdWlyZSgndXRpbC91bmlxdWVJZCcpLnNlZWQoRGF0ZS5ub3coKSksXHJcblxyXG4gICAgZ2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0gPyBlbGVtW0FDQ0VTU09SXSA6IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE9yU2V0SWQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghZWxlbSB8fCAoaWQgPSBlbGVtW0FDQ0VTU09SXSkpIHsgcmV0dXJuIGlkOyB9XHJcbiAgICAgICAgZWxlbVtBQ0NFU1NPUl0gPSAoaWQgPSB1bmlxdWVJZCgpKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5KSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc0RhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBjYWNoZS5oYXMoaWQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXREYXRhID0gZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHZhciBpZCA9IGdldE9yU2V0SWQoZWxlbSk7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbERhdGEgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZURhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcmVtb3ZlOiAoZWxlbSwgc3RyKSA9PlxyXG4gICAgICAgIHN0ciA9PT0gdW5kZWZpbmVkID8gcmVtb3ZlQWxsRGF0YShlbGVtKSA6IHJlbW92ZURhdGEoZWxlbSwgc3RyKSxcclxuXHJcbiAgICBEOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oZWxlbSwga2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldERhdGEoZWxlbSwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXREYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0IHBhc3NlZFxyXG4gICAgICAgICAgICAgICAgdmFyIG1hcCA9IGtleSxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBrZXk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCBtYXBba2V5XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QWxsRGF0YShlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGFzRGF0YTogKGVsZW0pID0+XHJcbiAgICAgICAgICAgIGlzRWxlbWVudChlbGVtKSA/IGhhc0RhdGEoZWxlbSkgOiB0aGlzLFxyXG5cclxuICAgICAgICByZW1vdmVEYXRhOiBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBzaW5nbGUga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVEYXRhKGVsZW0sIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGtleTtcclxuICAgICAgICAgICAgICAgIHZhciBpZDtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbaWR4XSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZW1vdmVBbGxEYXRhKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIGRhdGFcclxuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaXJzdCB8fCAhKGlkID0gZ2V0SWQoZmlyc3QpKSkgeyByZXR1cm47IH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGtleVxyXG4gICAgICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2V0IHZhbHVlcyBmcm9tIGhhc2ggbWFwXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGtleSBpbiBtYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQga2V5J3MgdmFsdWVcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBpZCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyBjb250aW51ZTsgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZCA9IGdldE9yU2V0SWQodGhpc1tpZHhdKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IHZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBtdWx0aXBsZSBrZXlzXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbUlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IHRoaXNbZWxlbUlkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJySWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChhcnJJZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGFycmF5W2FycklkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzTnVtYmVyID0gcmVxdWlyZSgnaXMvbnVtYmVyJyksXHJcbiAgICBjc3MgICAgICA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcblxyXG52YXIgZ2V0SW5uZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUZsb2F0KGNzcy53aWR0aC5nZXQoZWxlbSkpIHx8IDA7XHJcblxyXG4gICAgICAgIHJldHVybiB3aWR0aCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdMZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdSaWdodCcpKSB8fCAwKTtcclxuICAgIH0sXHJcbiAgICBnZXRJbm5lckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChlbGVtKSkgfHwgMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGhlaWdodCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ3BhZGRpbmdUb3AnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0JvdHRvbScpKSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0ZXJXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICB2YXIgd2lkdGggPSBnZXRJbm5lcldpZHRoKGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICB3aWR0aCArPSAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5MZWZ0JykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpblJpZ2h0JykpIHx8IDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyTGVmdFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclJpZ2h0V2lkdGgnKSkgfHwgMCk7XHJcbiAgICB9LFxyXG4gICAgZ2V0T3V0ZXJIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCB3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IGdldElubmVySGVpZ2h0KGVsZW0pO1xyXG5cclxuICAgICAgICBpZiAod2l0aE1hcmdpbikge1xyXG4gICAgICAgICAgICBoZWlnaHQgKz0gKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luVG9wJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkJvdHRvbScpKSB8fCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQgK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJUb3BXaWR0aCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJCb3R0b21XaWR0aCcpKSB8fCAwKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgd2lkdGg6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIGlmIChpc051bWJlcih2YWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGNzcy53aWR0aC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhlaWdodDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLmhlaWdodC5zZXQoZmlyc3QsIHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoY3NzLmhlaWdodC5nZXQoZmlyc3QpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lcldpZHRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVyV2lkdGgoZmlyc3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbm5lckhlaWdodDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRJbm5lckhlaWdodChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVyV2lkdGg6IGZ1bmN0aW9uKHdpdGhNYXJnaW4pIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB3aXRoTWFyZ2luID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRPdXRlcldpZHRoKGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfSxcclxuXHJcbiAgICBvdXRlckhlaWdodDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVySGVpZ2h0KGZpcnN0LCAhIXdpdGhNYXJnaW4pO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgaGFuZGxlcnMgPSB7fTtcclxuXHJcbnZhciByZWdpc3RlciA9IGZ1bmN0aW9uKG5hbWUsIHR5cGUsIGZpbHRlcikge1xyXG4gICAgaGFuZGxlcnNbbmFtZV0gPSB7XHJcbiAgICAgICAgZXZlbnQ6IHR5cGUsXHJcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXHJcbiAgICAgICAgd3JhcDogZnVuY3Rpb24oZm4pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXIobmFtZSwgZm4pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgd3JhcHBlciA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcbiAgICBpZiAoIWZuKSB7IHJldHVybiBmbjsgfVxyXG5cclxuICAgIHZhciBrZXkgPSAnX19kY2VfJyArIG5hbWU7XHJcbiAgICBpZiAoZm5ba2V5XSkgeyByZXR1cm4gZm5ba2V5XTsgfVxyXG5cclxuICAgIHJldHVybiBmbltrZXldID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBtYXRjaCA9IGhhbmRsZXJzW25hbWVdLmZpbHRlcihlKTtcclxuICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5yZWdpc3RlcignbGVmdC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAxICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdtaWRkbGUtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMiAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5yZWdpc3RlcigncmlnaHQtY2xpY2snLCAnY2xpY2snLCAoZSkgPT4gZS53aGljaCA9PT0gMyAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZWdpc3RlcjogcmVnaXN0ZXIsXHJcbiAgICBoYW5kbGVyczogaGFuZGxlcnNcclxufTsiLCJ2YXIgY3Jvc3N2ZW50ID0gcmVxdWlyZSgnY3Jvc3N2ZW50JyksXHJcbiAgICBleGlzdHMgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIG1hdGNoZXMgICA9IHJlcXVpcmUoJ21hdGNoZXNTZWxlY3RvcicpLFxyXG4gICAgZGVsZWdhdGVzID0ge307XHJcblxyXG4vLyB0aGlzIG1ldGhvZCBjYWNoZXMgZGVsZWdhdGVzIHNvIHRoYXQgLm9mZigpIHdvcmtzIHNlYW1sZXNzbHlcclxudmFyIGRlbGVnYXRlID0gZnVuY3Rpb24ocm9vdCwgc2VsZWN0b3IsIGZuKSB7XHJcbiAgICBpZiAoZGVsZWdhdGVzW2ZuLl9kZF0pIHsgcmV0dXJuIGRlbGVnYXRlc1tmbi5fZGRdOyB9XHJcblxyXG4gICAgdmFyIGlkID0gZm4uX2RkID0gRGF0ZS5ub3coKTtcclxuICAgIHJldHVybiBkZWxlZ2F0ZXNbaWRdID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHdoaWxlIChlbCAmJiBlbCAhPT0gcm9vdCkge1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhlbCwgc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIGV2ZW50ZWQgPSBmdW5jdGlvbihtZXRob2QsIGVsLCB0eXBlLCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmICghZXhpc3RzKHNlbGVjdG9yKSkge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZm4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBtZXRob2QoZWwsIHR5cGUsIGRlbGVnYXRlKGVsLCBzZWxlY3RvciwgZm4pKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb246ICAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5hZGQpLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5yZW1vdmUpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlZC5iaW5kKG51bGwsIGNyb3NzdmVudC5mYWJyaWNhdGUpXHJcbn07IiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGRlbGVnYXRlICAgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyksXHJcbiAgICBjdXN0b20gICAgID0gcmVxdWlyZSgnLi9jdXN0b20nKTtcclxuXHJcbnZhciBldmVudGVyID0gZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZXMsIGZpbHRlciwgZm4pIHtcclxuICAgICAgICB2YXIgdHlwZWxpc3QgPSB0eXBlcy5zcGxpdCgnICcpO1xyXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmbikpIHtcclxuICAgICAgICAgICAgZm4gPSBmaWx0ZXI7XHJcbiAgICAgICAgICAgIGZpbHRlciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIF8uZWFjaCh0eXBlbGlzdCwgZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjdXN0b20uaGFuZGxlcnNbdHlwZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCBoYW5kbGVyLmV2ZW50LCBmaWx0ZXIsIGhhbmRsZXIud3JhcChmbikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2QoZWxlbSwgdHlwZSwgZmlsdGVyLCBmbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvbjogICAgICBldmVudGVyKGRlbGVnYXRlLm9uKSxcclxuICAgIG9mZjogICAgIGV2ZW50ZXIoZGVsZWdhdGUub2ZmKSxcclxuICAgIHRyaWdnZXI6IGV2ZW50ZXIoZGVsZWdhdGUudHJpZ2dlcilcclxufTsiLCJ2YXIgXyAgICAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBEICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL0QnKSxcclxuICAgIGV4aXN0cyAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzRWxlbWVudCAgICAgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgaXNIdG1sICAgICAgICAgPSByZXF1aXJlKCdpcy9odG1sJyksXHJcbiAgICBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNOb2RlTGlzdCAgICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNOdW1iZXIgICAgICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gICAgID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIGlzQ29sbGVjdGlvbiAgID0gcmVxdWlyZSgnaXMvY29sbGVjdGlvbicpLFxyXG4gICAgaXNEICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBpc1dpbmRvdyAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgc2VsZWN0b3JGaWx0ZXIgPSByZXF1aXJlKCcuL3NlbGVjdG9ycy9maWx0ZXInKSxcclxuICAgIHVuaXF1ZSAgICAgICAgID0gcmVxdWlyZSgnLi9hcnJheS91bmlxdWUnKSxcclxuICAgIG9yZGVyICAgICAgICAgID0gcmVxdWlyZSgnLi4vb3JkZXInKSxcclxuICAgIGRhdGEgICAgICAgICAgID0gcmVxdWlyZSgnLi9kYXRhJyksXHJcbiAgICBwYXJzZXIgICAgICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpO1xyXG5cclxudmFyIGVtcHR5ID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbGVtID0gYXJyW2lkeF0sXHJcbiAgICAgICAgICAgICAgICBkZXNjZW5kYW50cyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnKicpLFxyXG4gICAgICAgICAgICAgICAgaSA9IGRlc2NlbmRhbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGRlc2M7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRlc2MgPSBkZXNjZW5kYW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGRlc2MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnJlbW92ZShlbGVtKTtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVsZW0sIHBhcmVudDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgICAgIGlmIChlbGVtICYmIChwYXJlbnQgPSBlbGVtLnBhcmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHJldHVybiBlbGVtLmNsb25lTm9kZSh0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RyaW5nVG9GcmFnID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZnJhZy50ZXh0Q29udGVudCA9IHN0cjtcclxuICAgICAgICByZXR1cm4gZnJhZztcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kUHJlcGVuZEZ1bmMgPSBmdW5jdGlvbihkLCBmbiwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGQsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZm4uY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMocmVzdWx0KSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlzSHRtbChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbShlbGVtLCBwYXJzZXIoZWxlbSksIHBlbmRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGVsZW0sIHN0cmluZ1RvRnJhZyhyZXN1bHQpKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNFbGVtZW50KHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNOb2RlTGlzdChyZXN1bHQpIHx8IGlzRChyZXN1bHQpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHJlc3VsdCwgcGVuZGVyKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kTWVyZ2VBcnJheSA9IGZ1bmN0aW9uKGFyck9uZSwgYXJyVHdvLCBwZW5kZXIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyT25lLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IDAsIGxlbiA9IGFyclR3by5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHBlbmRlcihhcnJPbmVbaWR4XSwgYXJyVHdvW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkgPSBmdW5jdGlvbihhcnIsIGVsZW0sIHBlbmRlcikge1xyXG4gICAgICAgIF8uZWFjaChhcnIsIGZ1bmN0aW9uKGFyckVsZW0pIHtcclxuICAgICAgICAgICAgcGVuZGVyKGFyckVsZW0sIGVsZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRBcnJheVRvRWxlbSA9IGZ1bmN0aW9uKGVsZW0sIGFyciwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoZWxlbSwgYXJyRWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFwcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgfSxcclxuICAgIHByZXBlbmQgPSBmdW5jdGlvbihiYXNlLCBlbGVtKSB7XHJcbiAgICAgICAgaWYgKCFiYXNlIHx8ICFlbGVtIHx8ICFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgYmFzZS5pbnNlcnRCZWZvcmUoZWxlbSwgYmFzZS5maXJzdENoaWxkKTtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFwcGVuZCAgOiBhcHBlbmQsXHJcbiAgICBwcmVwZW5kIDogcHJlcGVuZCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZmFzdG1hcCh0aGlzLnNsaWNlKCksIChlbGVtKSA9PiBjbG9uZShlbGVtKSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIHBhcnNlcih2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIGFwcGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbWVudCkgfHwgaXNTdHJpbmcoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBEKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNEKGVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCB0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgaWYgKGlzRChkKSkge1xyXG4gICAgICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyKHZhbHVlKSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIHByZXBlbmQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJlcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgICAgIGQucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICAgICAgRChvYmopLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgZW1wdHkodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgLy8gU3RyaW5nIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtcyA9IHVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICBbXS5jb25jYXQodGhpcy5nZXQoKSwgRChzZWxlY3RvcikuZ2V0KCkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFycmF5IG9mIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIF8udG9BcnJheShhcnIpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTaW5nbGUgZWxlbWVudFxyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpIHx8IGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIFsgZWxlbSBdKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gRCh0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlKGFycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgZGV0YWNoKGFycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgZGV0YWNoKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICA9IHJlcXVpcmUoJy4uL0QnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXR0YWNoZWQgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc09iamVjdCAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIERPQ19FTEVNICAgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG52YXIgZ2V0UG9zaXRpb24gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogZWxlbS5vZmZzZXRUb3AgfHwgMCxcclxuICAgICAgICBsZWZ0OiBlbGVtLm9mZnNldExlZnQgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBnZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICB2YXIgcmVjdCA9IGlzQXR0YWNoZWQoZWxlbSkgPyBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDoge307XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6ICAocmVjdC50b3AgICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApICB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IChyZWN0LmxlZnQgKyBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQpIHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgc2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSwgaWR4LCBwb3MpIHtcclxuICAgIHZhciBwb3NpdGlvbiA9IGVsZW0uc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycsXHJcbiAgICAgICAgcHJvcHMgICAgPSB7fTtcclxuXHJcbiAgICAvLyBzZXQgcG9zaXRpb24gZmlyc3QsIGluLWNhc2UgdG9wL2xlZnQgYXJlIHNldCBldmVuIG9uIHN0YXRpYyBlbGVtXHJcbiAgICBpZiAocG9zaXRpb24gPT09ICdzdGF0aWMnKSB7IGVsZW0uc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnOyB9XHJcblxyXG4gICAgdmFyIGN1ck9mZnNldCAgICAgICAgID0gZ2V0T2Zmc2V0KGVsZW0pLFxyXG4gICAgICAgIGN1ckNTU1RvcCAgICAgICAgID0gZWxlbS5zdHlsZS50b3AsXHJcbiAgICAgICAgY3VyQ1NTTGVmdCAgICAgICAgPSBlbGVtLnN0eWxlLmxlZnQsXHJcbiAgICAgICAgY2FsY3VsYXRlUG9zaXRpb24gPSAocG9zaXRpb24gPT09ICdhYnNvbHV0ZScgfHwgcG9zaXRpb24gPT09ICdmaXhlZCcpICYmIChjdXJDU1NUb3AgPT09ICdhdXRvJyB8fCBjdXJDU1NMZWZ0ID09PSAnYXV0bycpO1xyXG5cclxuICAgIGlmIChpc0Z1bmN0aW9uKHBvcykpIHtcclxuICAgICAgICBwb3MgPSBwb3MuY2FsbChlbGVtLCBpZHgsIGN1ck9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGN1clRvcCwgY3VyTGVmdDtcclxuICAgIC8vIG5lZWQgdG8gYmUgYWJsZSB0byBjYWxjdWxhdGUgcG9zaXRpb24gaWYgZWl0aGVyIHRvcCBvciBsZWZ0IGlzIGF1dG8gYW5kIHBvc2l0aW9uIGlzIGVpdGhlciBhYnNvbHV0ZSBvciBmaXhlZFxyXG4gICAgaWYgKGNhbGN1bGF0ZVBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIGN1clBvc2l0aW9uID0gZ2V0UG9zaXRpb24oZWxlbSk7XHJcbiAgICAgICAgY3VyVG9wICA9IGN1clBvc2l0aW9uLnRvcDtcclxuICAgICAgICBjdXJMZWZ0ID0gY3VyUG9zaXRpb24ubGVmdDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3VyVG9wICA9IHBhcnNlRmxvYXQoY3VyQ1NTVG9wKSAgfHwgMDtcclxuICAgICAgICBjdXJMZWZ0ID0gcGFyc2VGbG9hdChjdXJDU1NMZWZ0KSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChleGlzdHMocG9zLnRvcCkpICB7IHByb3BzLnRvcCAgPSAocG9zLnRvcCAgLSBjdXJPZmZzZXQudG9wKSAgKyBjdXJUb3A7ICB9XHJcbiAgICBpZiAoZXhpc3RzKHBvcy5sZWZ0KSkgeyBwcm9wcy5sZWZ0ID0gKHBvcy5sZWZ0IC0gY3VyT2Zmc2V0LmxlZnQpICsgY3VyTGVmdDsgfVxyXG5cclxuICAgIGVsZW0uc3R5bGUudG9wICA9IF8udG9QeChwcm9wcy50b3ApO1xyXG4gICAgZWxlbS5zdHlsZS5sZWZ0ID0gXy50b1B4KHByb3BzLmxlZnQpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRQb3NpdGlvbihmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldDogZnVuY3Rpb24ocG9zT3JJdGVyYXRvcikge1xyXG4gICAgXHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXQoZmlyc3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ocG9zT3JJdGVyYXRvcikgfHwgaXNPYmplY3QocG9zT3JJdGVyYXRvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PiBzZXRPZmZzZXQoZWxlbSwgaWR4LCBwb3NPckl0ZXJhdG9yKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXRQYXJlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgRE9DX0VMRU07XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiAoIWlzTm9kZU5hbWUob2Zmc2V0UGFyZW50LCAnaHRtbCcpICYmIChvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycpID09PSAnc3RhdGljJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgRE9DX0VMRU07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFRFWFQgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvVEVYVCcpLFxyXG4gICAgQ09NTUVOVCAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9DT01NRU5UJyksXHJcbiAgICBBVFRSSUJVVEUgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0FUVFJJQlVURScpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgcHJvcEZpeCA9IHNwbGl0KCd0YWJJbmRleHxyZWFkT25seXxjbGFzc05hbWV8bWF4TGVuZ3RofGNlbGxTcGFjaW5nfGNlbGxQYWRkaW5nfHJvd1NwYW58Y29sU3Bhbnx1c2VNYXB8ZnJhbWVCb3JkZXJ8Y29udGVudEVkaXRhYmxlJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBzdHIpIHtcclxuICAgICAgICBvYmpbc3RyLnRvTG93ZXJDYXNlKCldID0gc3RyO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7XHJcbiAgICAgICAgJ2Zvcic6ICAgJ2h0bWxGb3InLFxyXG4gICAgICAgICdjbGFzcyc6ICdjbGFzc05hbWUnXHJcbiAgICB9KTtcclxuXHJcbnZhciBwcm9wSG9va3MgPSB7XHJcbiAgICBzcmM6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnc3JjJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBocmVmOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ2hyZWYnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IFNhZmFyaSwgSUU5K1xyXG4gICAgLy8gbWlzLXJlcG9ydHMgdGhlIGRlZmF1bHQgc2VsZWN0ZWQgcHJvcGVydHkgb2YgYW4gb3B0aW9uXHJcbiAgICAvLyBBY2Nlc3NpbmcgdGhlIHBhcmVudCdzIHNlbGVjdGVkSW5kZXggcHJvcGVydHkgZml4ZXMgaXRcclxuICAgIHNlbGVjdGVkOiBTVVBQT1JUUy5vcHRTZWxlY3RlZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlLFxyXG4gICAgICAgICAgICAgICAgZml4O1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgaXQgYWxzbyB3b3JrcyB3aXRoIG9wdGdyb3Vwcywgc2VlICM1NzAxXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQucGFyZW50Tm9kZS5zZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdGFiSW5kZXg6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gZWxlbS50YWJJbmRleCBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlIGNvcnJlY3QgdmFsdWUgd2hlbiBpdCBoYXNuJ3QgYmVlbiBleHBsaWNpdGx5IHNldFxyXG4gICAgICAgICAgICAvLyBodHRwOi8vZmx1aWRwcm9qZWN0Lm9yZy9ibG9nLzIwMDgvMDEvMDkvZ2V0dGluZy1zZXR0aW5nLWFuZC1yZW1vdmluZy10YWJpbmRleC12YWx1ZXMtd2l0aC1qYXZhc2NyaXB0L1xyXG4gICAgICAgICAgICAvLyBVc2UgcHJvcGVyIGF0dHJpYnV0ZSByZXRyaWV2YWwoIzEyMDcyKVxyXG4gICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YWJpbmRleCkgeyByZXR1cm4gXy5wYXJzZUludCh0YWJpbmRleCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBub2RlTmFtZSA9IGVsZW0ubm9kZU5hbWU7XHJcbiAgICAgICAgICAgIHJldHVybiAoUkVHRVguaXNGb2N1c2FibGUobm9kZU5hbWUpIHx8IChSRUdFWC5pc0NsaWNrYWJsZShub2RlTmFtZSkgJiYgZWxlbS5ocmVmKSkgPyAwIDogLTE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGdldE9yU2V0UHJvcCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICB2YXIgbm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xyXG5cclxuICAgIC8vIGRvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcclxuICAgIGlmICghZWxlbSB8fCBub2RlVHlwZSA9PT0gVEVYVCB8fCBub2RlVHlwZSA9PT0gQ09NTUVOVCB8fCBub2RlVHlwZSA9PT0gQVRUUklCVVRFKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpeCBuYW1lIGFuZCBhdHRhY2ggaG9va3NcclxuICAgIG5hbWUgPSBwcm9wRml4W25hbWVdIHx8IG5hbWU7XHJcbiAgICB2YXIgaG9va3MgPSBwcm9wSG9va3NbbmFtZV07XHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2tzICYmICgnc2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLnNldChlbGVtLCB2YWx1ZSwgbmFtZSkpICE9PSB1bmRlZmluZWQgP1xyXG4gICAgICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgICAgICAoZWxlbVtuYW1lXSA9IHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaG9va3MgJiYgKCdnZXQnIGluIGhvb2tzKSAmJiAocmVzdWx0ID0gaG9va3MuZ2V0KGVsZW0sIG5hbWUpKSAhPT0gbnVsbCA/XHJcbiAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICBlbGVtW25hbWVdO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHByb3A6IGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPclNldFByb3AoZmlyc3QsIHByb3ApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3ApKTtcclxuICAgICAgICAgICAgICAgICAgICBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgdmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZVByb3A6IGZ1bmN0aW9uKHByb3ApIHtcclxuICAgICAgICBpZiAoIWlzU3RyaW5nKHByb3ApKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBuYW1lID0gcHJvcEZpeFtwcm9wXSB8fCBwcm9wO1xyXG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZWxlbVtuYW1lXTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBleGlzdHMgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxudmFyIGNvZXJjZU51bSA9ICh2YWx1ZSkgPT5cclxuICAgIC8vIEl0cyBhIG51bWJlciEgfHwgMCB0byBhdm9pZCBOYU4gKGFzIE5hTidzIGEgbnVtYmVyKVxyXG4gICAgK3ZhbHVlID09PSB2YWx1ZSA/ICh2YWx1ZSB8fCAwKSA6XHJcbiAgICAvLyBBdm9pZCBOYU4gYWdhaW5cclxuICAgIGlzU3RyaW5nKHZhbHVlKSA/ICgrdmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gRGVmYXVsdCB0byB6ZXJvXHJcbiAgICAwO1xyXG5cclxudmFyIHByb3RlY3QgPSBmdW5jdGlvbihjb250ZXh0LCB2YWwsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgZWxlbSA9IGNvbnRleHRbMF07XHJcbiAgICBpZiAoIWVsZW0gJiYgIWV4aXN0cyh2YWwpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICBpZiAoIWVsZW0pIHsgcmV0dXJuIGNvbnRleHQ7IH1cclxuXHJcbiAgICByZXR1cm4gY2FsbGJhY2soY29udGV4dCwgZWxlbSwgdmFsKTtcclxufTtcclxuXHJcbnZhciBoYW5kbGVyID0gZnVuY3Rpb24oYXR0cmlidXRlKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY29udGV4dCwgZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgaWYgKGV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgICAgIGVsZW1bYXR0cmlidXRlXSA9IGNvZXJjZU51bSh2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtW2F0dHJpYnV0ZV07XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNjcm9sbFRvcCA9IGhhbmRsZXIoJ3Njcm9sbFRvcCcpO1xyXG52YXIgc2Nyb2xsTGVmdCA9IGhhbmRsZXIoJ3Njcm9sbExlZnQnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBzY3JvbGxMZWZ0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbExlZnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzY3JvbGxUb3A6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBwcm90ZWN0KHRoaXMsIHZhbCwgc2Nyb2xsVG9wKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHF1YWxpZmllcikge1xyXG4gICAgLy8gRWFybHkgcmV0dXJuLCBubyBxdWFsaWZpZXIuIEV2ZXJ5dGhpbmcgbWF0Y2hlc1xyXG4gICAgaWYgKCFxdWFsaWZpZXIpIHsgcmV0dXJuIGFycjsgfVxyXG5cclxuICAgIC8vIEZ1bmN0aW9uXHJcbiAgICBpZiAoaXNGdW5jdGlvbihxdWFsaWZpZXIpKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgcXVhbGlmaWVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBFbGVtZW50XHJcbiAgICBpZiAocXVhbGlmaWVyLm5vZGVUeXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IGVsZW0gPT09IHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2VsZWN0b3JcclxuICAgIGlmIChpc1N0cmluZyhxdWFsaWZpZXIpKSB7XHJcbiAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHF1YWxpZmllcik7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBxdWFsaWZpZXJcclxuICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBfLmNvbnRhaW5zKHF1YWxpZmllciwgZWxlbSkpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgaXNTZWxlY3RvciAgID0gcmVxdWlyZSgnaXMvc2VsZWN0b3InKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc05vZGVMaXN0ICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNBcnJheSAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNEICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufEVsZW1lbnR8Tm9kZUxpc3R8QXJyYXl8RH0gc2VsZWN0b3JcclxuICogQHBhcmFtIHtEfSBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHtFbGVtZW50W119XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgZmluZFdpdGhpbiA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAvLyBGYWlsIGZhc3RcclxuICAgIGlmICghY29udGV4dC5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgdmFyIHF1ZXJ5LCBkZXNjZW5kYW50cywgcmVzdWx0cztcclxuXHJcbiAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gQ29udmVydCBzZWxlY3RvciB0byBhbiBhcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgIHNlbGVjdG9yID0gaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IHNlbGVjdG9yO1xyXG5cclxuICAgICAgICBkZXNjZW5kYW50cyA9IF8uZmxhdHRlbihfLm1hcChjb250ZXh0LCAoZWxlbSkgPT4gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCcqJykpKTtcclxuICAgICAgICByZXN1bHRzID0gXy5maWx0ZXIoZGVzY2VuZGFudHMsIChkZXNjZW5kYW50KSA9PiBfLmNvbnRhaW5zKHNlbGVjdG9yLCBkZXNjZW5kYW50KSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXJ5ID0gRml6emxlLnF1ZXJ5KHNlbGVjdG9yKTtcclxuICAgICAgICByZXN1bHRzID0gcXVlcnkuZXhlYyhjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBoYXM6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3Rvcih0YXJnZXQpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXRzID0gdGhpcy5maW5kKHRhcmdldCksXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gdGFyZ2V0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3JkZXIuY29udGFpbnMoZWxlbSwgdGFyZ2V0c1tpZHhdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikuYW55KHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSwgaWR4KSA9PiAhIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IGVsZW0gPT09IGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vdDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgaXMubm90KHRoaXMpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gXy50b0FycmF5KHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gIV8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiAhaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSAhPT0gY29udGV4dClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbmQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHNlbGVjdG9yKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgcmVzdWx0ID0gZmluZFdpdGhpbihzZWxlY3RvciwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLm1lcmdlKEQoKSwgcmVzdWx0KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIEQoKTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gaXMubWF0Y2goZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gPT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGVja2VyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gY2hlY2tlci5jYWxsKGVsZW0sIGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiBEKCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgRUxFTUVOVCAgICAgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgRE9DVU1FTlQgICAgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlQnKSxcclxuICAgIERPQ1VNRU5UX0ZSQUdNRU5UID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UX0ZSQUdNRU5UJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNEICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBvcmRlciAgICAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBzZWxlY3RvckZpbHRlciAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgRml6emxlICAgICAgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBnZXRTaWJsaW5ncyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gX2dldE5vZGVTaWJsaW5ncyhjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2licy5sZW5ndGgpIHsgcmVzdWx0LnB1c2goc2licyk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Tm9kZVNpYmxpbmdzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaWJzID0gXy50b0FycmF5KHBhcmVudC5jaGlsZHJlbiksXHJcbiAgICAgICAgICAgIGlkeCAgPSBzaWJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGUgdGhlIG5vZGUgaXRzZWxmIGZyb20gdGhlIGxpc3Qgb2YgaXRzIHBhcmVudCdzIGNoaWxkcmVuXHJcbiAgICAgICAgICAgIGlmIChzaWJzW2lkeF0gPT09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHNpYnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaWJzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDaGlsZHJlbiAtLS0tLS1cclxuICAgIGdldENoaWxkcmVuID0gKGFycikgPT4gXy5mbGF0dGVuKF8ubWFwKGFyciwgX2NoaWxkcmVuKSksXHJcbiAgICBfY2hpbGRyZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGtpZHMgPSBlbGVtLmNoaWxkcmVuLFxyXG4gICAgICAgICAgICBpZHggID0gMCwgbGVuICA9IGtpZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgID0gbmV3IEFycmF5KGxlbik7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBraWRzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudHMgLS0tLS0tXHJcbiAgICBnZXRDbG9zZXN0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgY2xvc2VzdCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShlbGVtc1tpZHhdLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGVsZW1zW2lkeF0pO1xyXG4gICAgICAgICAgICBjbG9zZXN0ID0gc2VsZWN0b3JGaWx0ZXIocGFyZW50cywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2xvc2VzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNsb3Nlc3RbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50c1VudGlsID0gZnVuY3Rpb24oZCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGRbaWR4XSwgbnVsbCwgc3RvcFNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NyYXdsVXBOb2RlID0gZnVuY3Rpb24obm9kZSwgY29udGV4dCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlLFxyXG4gICAgICAgICAgICBub2RlVHlwZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKChwYXJlbnQgICA9IGdldE5vZGVQYXJlbnQocGFyZW50KSkgJiZcclxuICAgICAgICAgICAgICAgKG5vZGVUeXBlID0gcGFyZW50Lm5vZGVUeXBlKSAhPT0gRE9DVU1FTlQgJiZcclxuICAgICAgICAgICAgICAgKCFjb250ZXh0ICAgICAgfHwgcGFyZW50ICE9PSBjb250ZXh0KSAmJlxyXG4gICAgICAgICAgICAgICAoIXN0b3BTZWxlY3RvciB8fCAhRml6emxlLmlzKHN0b3BTZWxlY3RvcikubWF0Y2gocGFyZW50KSkpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnQgLS0tLS0tXHJcbiAgICBnZXRQYXJlbnQgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgZ2V0Tm9kZVBhcmVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICByZXR1cm4gbm9kZSAmJiBub2RlLnBhcmVudE5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFByZXYgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHByZXYgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSAmJiBwcmV2Lm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROZXh0ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBuZXh0ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nKSAmJiBuZXh0Lm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBuZXh0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQcmV2QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcHJldiAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKHByZXYubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHByZXYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5leHRBbGwgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBuZXh0ICAgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgobmV4dCA9IG5leHQubmV4dFNpYmxpbmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXh0Lm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZztcclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmcgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYmxpbmcgJiYgKCFzZWxlY3RvciB8fCBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxBbGwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgZmlsdGVyO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgZmlsdGVyID0gZnVuY3Rpb24oc2libGluZykgeyByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKTsgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gXy5maWx0ZXIoc2libGluZ3MsIGZpbHRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsVW50aWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgaXRlcmF0b3I7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpdGVyYXRvciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc01hdGNoID0gaXMubWF0Y2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpYmxpbmdzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgdW5pcXVlU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCByZXZlcnNlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHVuaXF1ZShlbGVtcyk7XHJcbiAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBEKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlckFuZFNvcnQgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIHJldmVyc2UpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChzZWxlY3RvckZpbHRlcihlbGVtcywgc2VsZWN0b3IpLCByZXZlcnNlKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgY29udGVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLmZsYXR0ZW4oXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBwbHVja1xyXG4gICAgICAgICAgICAgICAgXy5tYXAodGhpcywgKGVsZW0pID0+IGVsZW0uY2hpbGROb2RlcylcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoc2VsZWN0b3IpLmluZGV4T2YoZmlyc3QpOyAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgID0gdGhpc1swXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gZmlyc3QucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaXNBdHRhY2hlZCBjaGVjayB0byBwYXNzIHRlc3QgXCJOb2RlIHdpdGhvdXQgcGFyZW50IHJldHVybnMgLTFcIlxyXG4gICAgICAgIC8vIG5vZGVUeXBlIGNoZWNrIHRvIHBhc3MgXCJJZiBEI2luZGV4IGNhbGxlZCBvbiBlbGVtZW50IHdob3NlIHBhcmVudCBpcyBmcmFnbWVudCwgaXQgc3RpbGwgc2hvdWxkIHdvcmsgY29ycmVjdGx5XCJcclxuICAgICAgICB2YXIgYXR0YWNoZWQgICAgICAgICA9IGlzQXR0YWNoZWQoZmlyc3QpLFxyXG4gICAgICAgICAgICBpc1BhcmVudEZyYWdtZW50ID0gcGFyZW50Lm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVDtcclxuXHJcbiAgICAgICAgaWYgKCFhdHRhY2hlZCAmJiAhaXNQYXJlbnRGcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2hpbGRFbGVtcyA9IHBhcmVudC5jaGlsZHJlbiB8fCBfLmZpbHRlcihwYXJlbnQuY2hpbGROb2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IEVMRU1FTlQpO1xyXG5cclxuICAgICAgICByZXR1cm4gW10uaW5kZXhPZi5hcHBseShjaGlsZEVsZW1zLCBbIGZpcnN0IF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9zZXN0OiBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldENsb3Nlc3QodGhpcywgc2VsZWN0b3IsIGNvbnRleHQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFBhcmVudCh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnRzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFBhcmVudHModGhpcyksIHNlbGVjdG9yLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50c1VudGlsOiBmdW5jdGlvbihzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQYXJlbnRzVW50aWwodGhpcywgc3RvcFNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNpYmxpbmdzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFNpYmxpbmdzKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoaWxkcmVuOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldENoaWxkcmVuKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXY6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbChnZXRQcmV2LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0TmV4dCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldkFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsQWxsKGdldFByZXZBbGwsIHRoaXMsIHNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHRBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldFByZXZBbGwsIHRoaXMsIHNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHRVbnRpbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsVW50aWwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBuZXdsaW5lcyAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTnVtYmVyICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBub3JtYWxOYW1lID0gcmVxdWlyZSgnbm9kZS9ub3JtYWxpemVOYW1lJyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIEVMRU1FTlQgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxudmFyIG91dGVySHRtbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA/IHRoaXNbMF0ub3V0ZXJIVE1MIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgdGV4dEdldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSkgPT4gZWxlbS50ZXh0Q29udGVudCA6XHJcbiAgICAgICAgICAgIChlbGVtKSA9PiBlbGVtLmlubmVyVGV4dCxcclxuXHJcbiAgICB0ZXh0U2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0udGV4dENvbnRlbnQgPSBzdHIgOlxyXG4gICAgICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLmlubmVyVGV4dCA9IHN0cjtcclxuXHJcbnZhciB2YWxIb29rcyA9IHtcclxuICAgIG9wdGlvbjoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgIHJldHVybiAoZXhpc3RzKHZhbCkgPyB2YWwgOiB0ZXh0R2V0KGVsZW0pKS50cmltKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZWxlY3Q6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlLCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgaW5kZXggICA9IGVsZW0uc2VsZWN0ZWRJbmRleCxcclxuICAgICAgICAgICAgICAgIG9uZSAgICAgPSBlbGVtLnR5cGUgPT09ICdzZWxlY3Qtb25lJyB8fCBpbmRleCA8IDAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gb25lID8gbnVsbCA6IFtdLFxyXG4gICAgICAgICAgICAgICAgbWF4ICAgICA9IG9uZSA/IGluZGV4ICsgMSA6IG9wdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IGluZGV4IDwgMCA/IG1heCA6IChvbmUgPyBpbmRleCA6IDApO1xyXG5cclxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgc2VsZWN0ZWQgb3B0aW9uc1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbWF4OyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9sZElFIGRvZXNuJ3QgdXBkYXRlIHNlbGVjdGVkIGFmdGVyIGZvcm0gcmVzZXQgKCMyNTUxKVxyXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb24uc2VsZWN0ZWQgfHwgaWR4ID09PSBpbmRleCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgcmV0dXJuIG9wdGlvbnMgdGhhdCBhcmUgZGlzYWJsZWQgb3IgaW4gYSBkaXNhYmxlZCBvcHRncm91cFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoU1VQUE9SVFMub3B0RGlzYWJsZWQgPyAhb3B0aW9uLmRpc2FibGVkIDogb3B0aW9uLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fCAhaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcclxuICAgICAgICAgICAgICAgICAgICBpZiAob25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9wdGlvblNldCwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBfLm1ha2VBcnJheSh2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gb3B0aW9ucy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh2YWx1ZXMsIHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBvcHRpb25TZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYnJvd3NlcnMgdG8gYmVoYXZlIGNvbnNpc3RlbnRseSB3aGVuIG5vbi1tYXRjaGluZyB2YWx1ZSBpcyBzZXRcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25TZXQpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIFJhZGlvIGFuZCBjaGVja2JveCBnZXR0ZXIgZm9yIFdlYmtpdFxyXG5pZiAoIVNVUFBPUlRTLmNoZWNrT24pIHtcclxuICAgIF8uZWFjaChbJ3JhZGlvJywgJ2NoZWNrYm94J10sIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICB2YWxIb29rc1t0eXBlXSA9IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0OiBXZWJraXQgLSAnJyBpcyByZXR1cm5lZCBpbnN0ZWFkIG9mICdvbicgaWYgYSB2YWx1ZSBpc24ndCBzcGVjaWZpZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKSA9PT0gbnVsbCA/ICdvbicgOiBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgZ2V0VmFsID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgaWYgKCFlbGVtIHx8IChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLmdldCkge1xyXG4gICAgICAgIHJldHVybiBob29rLmdldChlbGVtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc1N0cmluZyh2YWwpID8gbmV3bGluZXModmFsKSA6IHZhbDtcclxufTtcclxuXHJcbnZhciBzdHJpbmdpZnkgPSAodmFsdWUpID0+XHJcbiAgICAhZXhpc3RzKHZhbHVlKSA/ICcnIDogKHZhbHVlICsgJycpO1xyXG5cclxudmFyIHNldFZhbCA9IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gU3RyaW5naWZ5IHZhbHVlc1xyXG4gICAgdmFyIHZhbHVlID0gaXNBcnJheSh2YWwpID8gXy5tYXAodmFsLCBzdHJpbmdpZnkpIDogc3RyaW5naWZ5KHZhbCk7XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5zZXQpIHtcclxuICAgICAgICBob29rLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvdXRlckh0bWw6IG91dGVySHRtbCxcclxuICAgIG91dGVySFRNTDogb3V0ZXJIdG1sLFxyXG5cclxuICAgIGh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoaHRtbCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZWxlbS5pbm5lckhUTUwgPSBodG1sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IGh0bWw7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICByZXR1cm4gKCFmaXJzdCkgPyB1bmRlZmluZWQgOiBmaXJzdC5pbm5lckhUTUw7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAvLyBnZXR0ZXJcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgJycpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBnZXRWYWwoZWxlbSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFZhbChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0dGVyc1xyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzdHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHRleHRTZXQoZWxlbSwgc3RyKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzdHIpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHN0cjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgdGV4dEdldChlbGVtKSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAodGhpcywgKGVsZW0pID0+IHRleHRHZXQoZWxlbSkpLmpvaW4oJycpO1xyXG4gICAgfVxyXG59OyIsInZhciBFTEVNRU5UID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0pID0+XHJcbiAgICAgICAgZWxlbSAmJiBlbGVtLm5vZGVUeXBlID09PSBFTEVNRU5UO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBuYW1lKSA9PlxyXG4gICAgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBuYW1lLnRvTG93ZXJDYXNlKCk7IiwiLy8gY2FjaGUgaXMganVzdCBub3Qgd29ydGggaXQgaGVyZVxyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9zaW1wbGUtY2FjaGUtZm9yLXN0cmluZy1tYW5pcFxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtKSA9PiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiIsInZhciByZWFkeSA9IGZhbHNlLFxyXG4gICAgcmVnaXN0cmF0aW9uID0gW107XHJcblxyXG52YXIgd2FpdCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbndhaXQoZnVuY3Rpb24oKSB7XHJcbiAgICByZWFkeSA9IHRydWU7XHJcblxyXG4gICAgLy8gY2FsbCByZWdpc3RlcmVkIG1ldGhvZHMgICAgXHJcbiAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICBsZW5ndGggPSByZWdpc3RyYXRpb24ubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZWdpc3RyYXRpb25baWR4XSgpO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0cmF0aW9uLmxlbmd0aCA9IDA7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgaWYgKHJlYWR5KSB7XHJcbiAgICAgICAgY2FsbGJhY2soKTsgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdHJhdGlvbi5wdXNoKGNhbGxiYWNrKTtcclxufTtcclxuIiwidmFyIGlzQXR0YWNoZWQgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBFTEVNRU5UICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2NvbXBhcmluZy1kb2N1bWVudC1wb3NpdGlvbi9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICBDT05UQUlORURfQlkgPSAxNixcclxuICAgIEZPTExPV0lORyAgICA9IDQsXHJcbiAgICBESVNDT05ORUNURUQgPSAxO1xyXG5cclxudmFyIGlzID0gKHJlbCwgZmxhZykgPT4gKHJlbCAmIGZsYWcpID09PSBmbGFnO1xyXG5cclxudmFyIGlzTm9kZSA9IChiLCBmbGFnLCBhKSA9PiBpcyhfY29tcGFyZVBvc2l0aW9uKGEsIGIpLCBmbGFnKTtcclxuXHJcbi8vIENvbXBhcmUgUG9zaXRpb24gLSBNSVQgTGljZW5zZWQsIEpvaG4gUmVzaWdcclxudmFyIF9jb21wYXJlUG9zaXRpb24gPSAobm9kZTEsIG5vZGUyKSA9PlxyXG4gICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gP1xyXG4gICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZTIpIDpcclxuICAgIDA7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogU29ydHMgYW4gYXJyYXkgb2YgRCBlbGVtZW50cyBpbi1wbGFjZSAoaS5lLiwgbXV0YXRlcyB0aGUgb3JpZ2luYWwgYXJyYXkpXHJcbiAgICAgKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAgICAgKiBAZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudFtdfSBhcnJheSAgICAgICAgICBBcnJheSBvZiBEIGVsZW1lbnRzLlxyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKiBAc2VlIGpRdWVyeSBzcmMvc2VsZWN0b3ItbmF0aXZlLmpzOjM3XHJcbiAgICAgKi9cclxuICAgIC8vIFRPRE86IEFkZHJlc3MgZW5jYXBzdWxhdGlvblxyXG4gICAgc29ydDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBfaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBfc29ydCA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xyXG4gICAgICAgICAgICAvLyBGbGFnIGZvciBkdXBsaWNhdGUgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAobm9kZTEgPT09IG5vZGUyKSB7XHJcbiAgICAgICAgICAgICAgICBfaGFzRHVwbGljYXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTb3J0IG9uIG1ldGhvZCBleGlzdGVuY2UgaWYgb25seSBvbmUgaW5wdXQgaGFzIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICAgICAgICAgIHZhciByZWwgPSAhbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gLSAhbm9kZTIuY29tcGFyZURvY3VtZW50UG9zaXRpb247XHJcbiAgICAgICAgICAgIGlmIChyZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vZGVzIHNoYXJlIHRoZSBzYW1lIGRvY3VtZW50XHJcbiAgICAgICAgICAgIGlmICgobm9kZTEub3duZXJEb2N1bWVudCB8fCBub2RlMSkgPT09IChub2RlMi5vd25lckRvY3VtZW50IHx8IG5vZGUyKSkge1xyXG4gICAgICAgICAgICAgICAgcmVsID0gX2NvbXBhcmVQb3NpdGlvbihub2RlMSwgbm9kZTIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSB3ZSBrbm93IHRoZXkgYXJlIGRpc2Nvbm5lY3RlZFxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlbCA9IERJU0NPTk5FQ1RFRDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm90IGRpcmVjdGx5IGNvbXBhcmFibGVcclxuICAgICAgICAgICAgaWYgKCFyZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEaXNjb25uZWN0ZWQgbm9kZXNcclxuICAgICAgICAgICAgaWYgKGlzKHJlbCwgRElTQ09OTkVDVEVEKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTm9kZTFEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNOb2RlMkRpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNOb2RlMURpc2Nvbm5lY3RlZCAmJiBpc05vZGUyRGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTm9kZTJEaXNjb25uZWN0ZWQgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpcyhyZWwsIEZPTExPV0lORykgPyAtMSA6IDE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFycmF5LCByZXZlcnNlKSB7XHJcbiAgICAgICAgICAgIF9oYXNEdXBsaWNhdGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgYXJyYXkuc29ydChfc29ydCk7XHJcbiAgICAgICAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJheS5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIF9oYXNEdXBsaWNhdGU7XHJcbiAgICAgICAgfTtcclxuICAgIH0oKSksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmAuXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGEgRCBlbGVtZW50IG5vZGVcclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gYiBEIGVsZW1lbnQgbm9kZVxyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmA7IG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICB2YXIgYlVwID0gaXNBdHRhY2hlZChiKSA/IGIucGFyZW50Tm9kZSA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChhID09PSBiVXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYlVwICYmIGJVcC5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgKElFOSspXHJcbiAgICAgICAgICAgIGlmIChhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNOb2RlKGJVcCwgQ09OVEFJTkVEX0JZLCBhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgUkVHRVggPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgTUFYX1NJTkdMRV9UQUdfTEVOR1RIID0gMzA7XHJcblxyXG52YXIgcGFyc2VTdHJpbmcgPSBmdW5jdGlvbihwYXJlbnRUYWdOYW1lLCBodG1sU3RyKSB7XHJcbiAgICB2YXIgcGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChwYXJlbnRUYWdOYW1lKTtcclxuICAgIHBhcmVudC5pbm5lckhUTUwgPSBodG1sU3RyO1xyXG4gICAgcmV0dXJuIHBhcmVudDtcclxufTtcclxuXHJcbnZhciBwYXJzZVNpbmdsZVRhZyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIGlmIChodG1sU3RyLmxlbmd0aCA+IE1BWF9TSU5HTEVfVEFHX0xFTkdUSCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHZhciBzaW5nbGVUYWdNYXRjaCA9IFJFR0VYLnNpbmdsZVRhZ01hdGNoKGh0bWxTdHIpO1xyXG4gICAgaWYgKCFzaW5nbGVUYWdNYXRjaCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChzaW5nbGVUYWdNYXRjaFsxXSk7XHJcblxyXG4gICAgcmV0dXJuIFsgZWxlbSBdO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICB2YXIgc2luZ2xlVGFnID0gcGFyc2VTaW5nbGVUYWcoaHRtbFN0cik7XHJcbiAgICBpZiAoc2luZ2xlVGFnKSB7IHJldHVybiBzaW5nbGVUYWc7IH1cclxuXHJcbiAgICB2YXIgcGFyZW50VGFnTmFtZSA9IFJFR0VYLmdldFBhcmVudFRhZ05hbWUoaHRtbFN0ciksXHJcbiAgICAgICAgcGFyZW50ICAgICAgICA9IHBhcnNlU3RyaW5nKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpO1xyXG5cclxuICAgIHZhciBjaGlsZCxcclxuICAgICAgICBpZHggPSBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgICAgIGFyciA9IG5ldyBBcnJheShpZHgpO1xyXG5cclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgIGNoaWxkID0gcGFyZW50LmNoaWxkcmVuW2lkeF07XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcclxuICAgICAgICBhcnJbaWR4XSA9IGNoaWxkO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcmVudCA9IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZXZlcnNlKCk7XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICA9IHJlcXVpcmUoJy4vRCcpLFxyXG4gICAgcGFyc2VyICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgRml6emxlICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgZWFjaCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXJyYXkvZWFjaCcpLFxyXG4gICAgZGF0YSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpO1xyXG5cclxudmFyIHBhcnNlSHRtbCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgaWYgKCFzdHIpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIHZhciByZXN1bHQgPSBwYXJzZXIoc3RyKTtcclxuICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQubGVuZ3RoKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICByZXR1cm4gRChyZXN1bHQpO1xyXG59O1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIGRhdGEuRCxcclxue1xyXG4gICAgLy8gQmVjYXVzZSBubyBvbmUga25vdyB3aGF0IHRoZSBjYXNlIHNob3VsZCBiZVxyXG4gICAgcGFyc2VIdG1sOiBwYXJzZUh0bWwsXHJcbiAgICBwYXJzZUhUTUw6IHBhcnNlSHRtbCxcclxuXHJcbiAgICBGaXp6bGU6ICBGaXp6bGUsXHJcbiAgICBlYWNoOiAgICBlYWNoLFxyXG4gICAgZm9yRWFjaDogZWFjaCxcclxuXHJcbiAgICBtYXA6ICAgICBfLm1hcCxcclxuICAgIGV4dGVuZDogIF8uZXh0ZW5kLFxyXG5cclxuICAgIG1vcmVDb25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmpRdWVyeSA9IHdpbmRvdy5aZXB0byA9IHdpbmRvdy4kID0gRDtcclxuICAgIH1cclxufSk7IiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHNwbGl0ICAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgYXJyYXkgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJ21vZHVsZXMvdHJhbnN2ZXJzYWwnKSxcclxuICAgIGRpbWVuc2lvbnMgID0gcmVxdWlyZSgnbW9kdWxlcy9kaW1lbnNpb25zJyksXHJcbiAgICBtYW5pcCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jc3MnKSxcclxuICAgIGF0dHIgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hdHRyJyksXHJcbiAgICBwcm9wICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3ZhbCcpLFxyXG4gICAgcG9zaXRpb24gICAgPSByZXF1aXJlKCdtb2R1bGVzL3Bvc2l0aW9uJyksXHJcbiAgICBjbGFzc2VzICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgc2Nyb2xsICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Njcm9sbCcpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKSxcclxuICAgIGV2ZW50cyAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9ldmVudHMnKTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyKSA9PiAhZXhpc3RzKHN0cikgfHwgc3RyID09PSAnJzsiLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBjYWNoZSAgID0gcmVxdWlyZSgnY2FjaGUnKSgyKSxcclxuICAgIGlzRW1wdHkgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpLFxyXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcblxyXG4gICAgUl9TUEFDRSA9IC9cXHMrL2csXHJcblxyXG4gICAgc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIHZhciBzcGxpdCAgID0gbmFtZS5zcGxpdChkZWxpbSksXHJcbiAgICAgICAgICAgIGxlbiAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIG5hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmFtZVNldCA9IHt9LFxyXG4gICAgICAgICAgICBjdXJOYW1lO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgY3VyTmFtZSA9IHNwbGl0W2xlbiAtIChpZHggKyAxKV07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdIHx8IC8vIHVuaXF1ZVxyXG4gICAgICAgICAgICAgICAgaXNFbXB0eShjdXJOYW1lKSAgICAvLyBub24tZW1wdHlcclxuICAgICAgICAgICAgKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKGN1ck5hbWUpO1xyXG4gICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltaXRlcikge1xyXG4gICAgaWYgKGlzRW1wdHkobmFtZSkpIHsgcmV0dXJuIFtdOyB9XHJcbiAgICBpZiAoaXNBcnJheShuYW1lKSkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAgIHZhciBkZWxpbSA9IGRlbGltaXRlciA9PT0gdW5kZWZpbmVkID8gUl9TUEFDRSA6IGRlbGltaXRlcjtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoZGVsaW0sIG5hbWUpID8gXHJcbiAgICAgICAgY2FjaGUuZ2V0KGRlbGltLCBuYW1lKSA6IFxyXG4gICAgICAgIGNhY2hlLnB1dChkZWxpbSwgbmFtZSwgKCkgPT4gc3BsaXQobmFtZSwgZGVsaW0pKTtcclxufTtcclxuIiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIC8vIEV4aXQgZWFybHkgZm9yIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAvLyBFbmQsIG5hdHVyYWxseSwgaGFzIHRvIGJlIGhpZ2hlciB0aGFuIDAgdG8gbWF0dGVyLFxyXG4gICAgLy8gc28gYSBzaW1wbGUgZXhpc3RlbmNlIGNoZWNrIHdpbGwgZG9cclxuICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgIHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQgfHwgMCk7XHJcbn07IiwiLy8gQnJlYWtzIGV2ZW4gb24gYXJyYXlzIHdpdGggMyBpdGVtcy4gMyBvciBtb3JlXHJcbi8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBkZWxpbWl0ZXIpID0+IHN0ci5zcGxpdChkZWxpbWl0ZXIgfHwgJ3wnKTtcclxuIiwidmFyIGlkID0gMDtcclxudmFyIHVuaXF1ZUlkID0gbW9kdWxlLmV4cG9ydHMgPSAoKSA9PiBpZCsrO1xyXG51bmlxdWVJZC5zZWVkID0gZnVuY3Rpb24oc2VlZGVkLCBwcmUpIHtcclxuICAgIHZhciBwcmVmaXggPSBwcmUgfHwgJycsXHJcbiAgICAgICAgc2VlZCA9IHNlZWRlZCB8fCAwO1xyXG4gICAgcmV0dXJuICgpID0+IHByZWZpeCArIHNlZWQrKztcclxufTsiXX0=
