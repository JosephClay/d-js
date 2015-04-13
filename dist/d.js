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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzdmVudC9zcmMvY3Jvc3N2ZW50LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvY3JlYXRlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ESVYvaW5kZXguanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9jb25zdHJ1Y3RzL0lzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvY29uc3RydWN0cy9RdWVyeS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvRml6emxlL2NvbnN0cnVjdHMvU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL0ZpenpsZS9pbmRleC5qcyIsInNyYy9GaXp6bGUvc2VsZWN0b3IvY2FwdHVyZS5qc29uIiwic3JjL0ZpenpsZS9zZWxlY3Rvci9wcm94eS5qc29uIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9GaXp6bGUvc2VsZWN0b3Ivc2VsZWN0b3ItcGFyc2UuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9BVFRSSUJVVEUuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9DT01NRU5ULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9OT0RFX1RZUEUvRE9DVU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvTk9ERV9UWVBFL0VMRU1FTlQuanMiLCJDOi9fRGV2L2QtanMvc3JjL05PREVfVFlQRS9URVhULmpzIiwiQzovX0Rldi9kLWpzL3NyYy9SRUdFWC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvU1VQUE9SVFMuanMiLCJDOi9fRGV2L2QtanMvc3JjL18uanMiLCJDOi9fRGV2L2QtanMvc3JjL2NhY2hlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9ELmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hcnJheS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYXJyYXlMaWtlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9hdHRhY2hlZC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvYm9vbGVhbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvY29sbGVjdGlvbi5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZG9jdW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2V4aXN0cy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvZnVuY3Rpb24uanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL2h0bWwuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL25vZGVMaXN0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9pcy9udW1iZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL29iamVjdC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvc2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL2lzL3N0cmluZy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvaXMvd2luZG93LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tYXRjaGVzU2VsZWN0b3IuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXJyYXkvZWFjaC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS9pbmRleC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9hcnJheS91bmlxdWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvYXR0ci5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9jbGFzc2VzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2Nzcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9kYXRhLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL2RpbWVuc2lvbnMuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2N1c3RvbS5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbW9kdWxlcy9ldmVudHMvZGVsZWdhdGUuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvZXZlbnRzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL21hbmlwLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Bvc2l0aW9uLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3Byb3AuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2Nyb2xsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3NlbGVjdG9ycy9maWx0ZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL21vZHVsZXMvc2VsZWN0b3JzL2luZGV4LmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3RyYW5zdmVyc2FsLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9tb2R1bGVzL3ZhbC5qcyIsIkM6L19EZXYvZC1qcy9zcmMvbm9kZS9pc0VsZW1lbnQuanMiLCJDOi9fRGV2L2QtanMvc3JjL25vZGUvaXNOYW1lLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9ub2RlL25vcm1hbGl6ZU5hbWUuanMiLCJDOi9fRGV2L2QtanMvc3JjL29ucmVhZHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL29yZGVyLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wYXJzZXIuanMiLCJDOi9fRGV2L2QtanMvc3JjL3Byb3BzLmpzIiwiQzovX0Rldi9kLWpzL3NyYy9wcm90by5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL2lzRW1wdHkuanMiLCJDOi9fRGV2L2QtanMvc3JjL3N0cmluZy9uZXdsaW5lcy5qcyIsIkM6L19EZXYvZC1qcy9zcmMvc3RyaW5nL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NsaWNlLmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3NwbGl0LmpzIiwiQzovX0Rldi9kLWpzL3NyYy91dGlsL3VuaXF1ZUlkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O0FDRm5CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3JGQSxJQUFJLENBQUMsR0FBYSxPQUFPLENBQUMsR0FBRyxDQUFDO0lBQzFCLE9BQU8sR0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDO0lBQ2pDLE1BQU0sR0FBUSxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ2hDLFFBQVEsR0FBTSxPQUFPLENBQUMsV0FBVyxDQUFDO0lBQ2xDLFVBQVUsR0FBSSxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3BDLFVBQVUsR0FBSSxPQUFPLENBQUMsYUFBYSxDQUFDO0lBQ3BDLEdBQUcsR0FBVyxPQUFP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QUM7Q0FDeEQsQ0FBQzs7Ozs7QUNyQ0YsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7O0FBRWxDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTs7QUFFdkMsUUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFBRSxlQUFPLEVBQUUsQ0FBQztLQUFFOzs7O0FBSXZDLFFBQUksR0FBRyxFQUFFO0FBQUUsZUFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FBRTs7QUFFaEQsV0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDdEMsQ0FBQzs7Ozs7OztBQ1RGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBQyxHQUFHLEVBQUUsU0FBUztTQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQztDQUFBLENBQUM7Ozs7O0FDRmpFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUc7V0FBTSxFQUFFLEVBQUU7Q0FBQSxDQUFDO0FBQzNDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBUyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ2xDLFFBQUksTUFBTSxHQUFHLEdBQUcsSUFBSSxFQUFFO1FBQ2xCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLFdBQU87ZUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFO0tBQUEsQ0FBQztDQUNoQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9EJyk7XHJcbnJlcXVpcmUoJy4vcHJvcHMnKTtcclxucmVxdWlyZSgnLi9wcm90bycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvYyA9IGRvY3VtZW50O1xudmFyIGFkZEV2ZW50ID0gYWRkRXZlbnRFYXN5O1xudmFyIHJlbW92ZUV2ZW50ID0gcmVtb3ZlRXZlbnRFYXN5O1xudmFyIGhhcmRDYWNoZSA9IFtdO1xuXG5pZiAoIWdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XG4gIGFkZEV2ZW50ID0gYWRkRXZlbnRIYXJkO1xuICByZW1vdmVFdmVudCA9IHJlbW92ZUV2ZW50SGFyZDtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRFYXN5IChlbCwgdHlwZSwgZm4sIGNhcHR1cmluZykge1xuICByZXR1cm4gZWwuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBmbiwgY2FwdHVyaW5nKTtcbn1cblxuZnVuY3Rpb24gYWRkRXZlbnRIYXJkIChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGVsLmF0dGFjaEV2ZW50KCdvbicgKyB0eXBlLCB3cmFwKGVsLCB0eXBlLCBmbikpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEVhc3kgKGVsLCB0eXBlLCBmbiwgY2FwdHVyaW5nKSB7XG4gIHJldHVybiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGZuLCBjYXB0dXJpbmcpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudEhhcmQgKGVsLCB0eXBlLCBmbikge1xuICByZXR1cm4gZWwuZGV0YWNoRXZlbnQoJ29uJyArIHR5cGUsIHVud3JhcChlbCwgdHlwZSwgZm4pKTtcbn1cblxuZnVuY3Rpb24gZmFicmljYXRlRXZlbnQgKGVsLCB0eXBlKSB7XG4gIHZhciBlO1xuICBpZiAoZG9jLmNyZWF0ZUV2ZW50KSB7XG4gICAgZSA9IGRvYy5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBlLmluaXRFdmVudCh0eXBlLCB0cnVlLCB0cnVlKTtcbiAgICBlbC5kaXNwYXRjaEV2ZW50KGUpO1xuICB9IGVsc2UgaWYgKGRvYy5jcmVhdGVFdmVudE9iamVjdCkge1xuICAgIGUgPSBkb2MuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICBlbC5maXJlRXZlbnQoJ29uJyArIHR5cGUsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBwZXJGYWN0b3J5IChlbCwgdHlwZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZXIgKG9yaWdpbmFsRXZlbnQpIHtcbiAgICB2YXIgZSA9IG9yaWdpbmFsRXZlbnQgfHwgZ2xvYmFsLmV2ZW50O1xuICAgIGUudGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuICAgIGUucHJldmVudERlZmF1bHQgID0gZS5wcmV2ZW50RGVmYXVsdCAgfHwgZnVuY3Rpb24gcHJldmVudERlZmF1bHQgKCkgeyBlLnJldHVyblZhbHVlID0gZmFsc2U7IH07XG4gICAgZS5zdG9wUHJvcGFnYXRpb24gPSBlLnN0b3BQcm9wYWdhdGlvbiB8fCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24gKCkgeyBlLmNhbmNlbEJ1YmJsZSA9IHRydWU7IH07XG4gICAgZm4uY2FsbChlbCwgZSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXAgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgd3JhcHBlciA9IHVud3JhcChlbCwgdHlwZSwgZm4pIHx8IHdyYXBwZXJGYWN0b3J5KGVsLCB0eXBlLCBmbik7XG4gIGhhcmRDYWNoZS5wdXNoKHtcbiAgICB3cmFwcGVyOiB3cmFwcGVyLFxuICAgIGVsZW1lbnQ6IGVsLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgZm46IGZuXG4gIH0pO1xuICByZXR1cm4gd3JhcHBlcjtcbn1cblxuZnVuY3Rpb24gdW53cmFwIChlbCwgdHlwZSwgZm4pIHtcbiAgdmFyIGkgPSBmaW5kKGVsLCB0eXBlLCBmbik7XG4gIGlmIChpKSB7XG4gICAgdmFyIHdyYXBwZXIgPSBoYXJkQ2FjaGVbaV0ud3JhcHBlcjtcbiAgICBoYXJkQ2FjaGUuc3BsaWNlKGksIDEpOyAvLyBmcmVlIHVwIGEgdGFkIG9mIG1lbW9yeVxuICAgIHJldHVybiB3cmFwcGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmQgKGVsLCB0eXBlLCBmbikge1xuICB2YXIgaSwgaXRlbTtcbiAgZm9yIChpID0gMDsgaSA8IGhhcmRDYWNoZS5sZW5ndGg7IGkrKykge1xuICAgIGl0ZW0gPSBoYXJkQ2FjaGVbaV07XG4gICAgaWYgKGl0ZW0uZWxlbWVudCA9PT0gZWwgJiYgaXRlbS50eXBlID09PSB0eXBlICYmIGl0ZW0uZm4gPT09IGZuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFkZDogYWRkRXZlbnQsXG4gIHJlbW92ZTogcmVtb3ZlRXZlbnQsXG4gIGZhYnJpY2F0ZTogZmFicmljYXRlRXZlbnRcbn07XG4iLCJ2YXIgXyAgICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc0FycmF5ICAgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc0h0bWwgICAgICA9IHJlcXVpcmUoJ2lzL2h0bWwnKSxcclxuICAgIGlzU3RyaW5nICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0Z1bmN0aW9uICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0QgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIHBhcnNlciAgICAgID0gcmVxdWlyZSgncGFyc2VyJyksXHJcbiAgICBvbnJlYWR5ICAgICA9IHJlcXVpcmUoJ29ucmVhZHknKSxcclxuICAgIEZpenpsZSAgICAgID0gcmVxdWlyZSgnRml6emxlJyk7XHJcblxyXG52YXIgRCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3IsIGF0dHJzKSB7XHJcbiAgICByZXR1cm4gbmV3IEluaXQoc2VsZWN0b3IsIGF0dHJzKTtcclxufTtcclxuXHJcbmlzRC5zZXQoRCk7XHJcblxyXG52YXIgSW5pdCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBhdHRycykge1xyXG4gICAgLy8gbm90aGluXHJcbiAgICBpZiAoIXNlbGVjdG9yKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgLy8gZWxlbWVudCBvciB3aW5kb3cgKGRvY3VtZW50cyBoYXZlIGEgbm9kZVR5cGUpXHJcbiAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUgfHwgc2VsZWN0b3IgPT09IHdpbmRvdykge1xyXG4gICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcclxuICAgICAgICB0aGlzLmxlbmd0aCA9IDE7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSFRNTCBzdHJpbmdcclxuICAgIGlmIChpc0h0bWwoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBwYXJzZXIoc2VsZWN0b3IpKTtcclxuICAgICAgICBpZiAoYXR0cnMpIHsgdGhpcy5hdHRyKGF0dHJzKTsgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBTdHJpbmdcclxuICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAvLyBTZWxlY3RvcjogcGVyZm9ybSBhIGZpbmQgd2l0aG91dCBjcmVhdGluZyBhIG5ldyBEXHJcbiAgICAgICAgXy5tZXJnZSh0aGlzLCBGaXp6bGUucXVlcnkoc2VsZWN0b3IpLmV4ZWModGhpcywgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEFycmF5IG9mIEVsZW1lbnRzLCBOb2RlTGlzdCwgb3IgRCBvYmplY3RcclxuICAgIC8vIFRPRE86IENvdWxkIHRoaXMgYmUgYXJyYXlMaWtlP1xyXG4gICAgaWYgKGlzQXJyYXkoc2VsZWN0b3IpIHx8IGlzTm9kZUxpc3Qoc2VsZWN0b3IpIHx8IGlzRChzZWxlY3RvcikpIHtcclxuICAgICAgICBfLm1lcmdlKHRoaXMsIHNlbGVjdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvLyBkb2N1bWVudCByZWFkeVxyXG4gICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgb25yZWFkeShzZWxlY3Rvcik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuSW5pdC5wcm90b3R5cGUgPSBELnByb3RvdHlwZTsiLCJtb2R1bGUuZXhwb3J0cyA9ICh0YWcpID0+IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTsiLCJ2YXIgZGl2ID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2NyZWF0ZScpKCdkaXYnKTtcclxuXHJcbmRpdi5pbm5lckhUTUwgPSAnPGEgaHJlZj1cIi9hXCI+YTwvYT4nOyIsInZhciBfID0gcmVxdWlyZSgnXycpO1xyXG5cclxudmFyIElzID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZWxlY3RvcnMpIHtcclxuICAgIHRoaXMuX3NlbGVjdG9ycyA9IHNlbGVjdG9ycztcclxufTtcclxuSXMucHJvdG90eXBlID0ge1xyXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gdGhpcy5fc2VsZWN0b3JzLFxyXG4gICAgICAgICAgICBpZHggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yc1tpZHhdLm1hdGNoKGNvbnRleHQpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGFueTogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uYW55KGFyciwgKGVsZW0pID0+XHJcbiAgICAgICAgICAgIHRoaXMubWF0Y2goZWxlbSkgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3Q6IGZ1bmN0aW9uKGFycikge1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PlxyXG4gICAgICAgICAgICAhdGhpcy5tYXRjaChlbGVtKSA/IHRydWUgOiBmYWxzZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4iLCJ2YXIgZmluZCA9IGZ1bmN0aW9uKHF1ZXJ5LCBjb250ZXh0KSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gW10sXHJcbiAgICAgICAgc2VsZWN0b3JzID0gcXVlcnkuX3NlbGVjdG9ycyxcclxuICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBzZWxlY3RvcnMubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNlbGVjdG9yc1tpZHhdLmV4ZWMoY29udGV4dCkpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbnZhciBRdWVyeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VsZWN0b3JzKSB7XHJcbiAgICB0aGlzLl9zZWxlY3RvcnMgPSBzZWxlY3RvcnM7XHJcbn07XHJcblxyXG5RdWVyeS5wcm90b3R5cGUgPSB7XHJcbiAgICBleGVjOiBmdW5jdGlvbihhcnIsIGlzTmV3KSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHggPSAwLCBsZW5ndGggPSBpc05ldyA/IDEgOiBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgZmluZCh0aGlzLCBhcnJbaWR4XSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgZXhpc3RzICAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgaXNOb2RlTGlzdCA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc0VsZW1lbnQgID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG5cclxuICAgIEdFVF9FTEVNRU5UX0JZX0lEICAgICAgICAgID0gJ2dldEVsZW1lbnRCeUlkJyxcclxuICAgIEdFVF9FTEVNRU5UU19CWV9UQUdfTkFNRSAgID0gJ2dldEVsZW1lbnRzQnlUYWdOYW1lJyxcclxuICAgIEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FID0gJ2dldEVsZW1lbnRzQnlDbGFzc05hbWUnLFxyXG4gICAgUVVFUllfU0VMRUNUT1JfQUxMICAgICAgICAgPSAncXVlcnlTZWxlY3RvckFsbCcsXHJcbiAgICBcclxuICAgIHVuaXF1ZUlkICAgICAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZCgwLCAnRC11bmlxdWVJZC0nKSxcclxuICAgIHNlbGVjdG9yQ2FjaGUgPSByZXF1aXJlKCdjYWNoZScpKCksXHJcbiAgICBSRUdFWCAgICAgICAgID0gcmVxdWlyZSgnUkVHRVgnKSxcclxuICAgIG1hdGNoZXMgICAgICAgPSByZXF1aXJlKCdtYXRjaGVzU2VsZWN0b3InKTtcclxuXHJcbnZhciBkZXRlcm1pbmVNZXRob2QgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtZXRob2QgPSBzZWxlY3RvckNhY2hlLmdldChzZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKG1ldGhvZCkgeyByZXR1cm4gbWV0aG9kOyB9XHJcblxyXG4gICAgICAgIG1ldGhvZCA9IFJFR0VYLmlzU3RyaWN0SWQoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRfQllfSUQgOlxyXG4gICAgICAgICAgICBSRUdFWC5pc0NsYXNzKHNlbGVjdG9yKSA/IEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FIDpcclxuICAgICAgICAgICAgUkVHRVguaXNUYWcoc2VsZWN0b3IpID8gR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FIDogICAgICAgXHJcbiAgICAgICAgICAgIFFVRVJZX1NFTEVDVE9SX0FMTDtcclxuXHJcbiAgICAgICAgc2VsZWN0b3JDYWNoZS5zZXQoc2VsZWN0b3IsIG1ldGhvZCk7XHJcbiAgICAgICAgcmV0dXJuIG1ldGhvZDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gbmVlZCB0byBmb3JjZSBhbiBhcnJheSBoZXJlXHJcbiAgICBmcm9tRG9tQXJyYXlUb0FycmF5ID0gZnVuY3Rpb24oYXJyYXlMaWtlKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IGFycmF5TGlrZS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGFyciA9IG5ldyBBcnJheShpZHgpO1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBhcnJbaWR4XSA9IGFycmF5TGlrZVtpZHhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcm9jZXNzUXVlcnlTZWxlY3Rpb24gPSBmdW5jdGlvbihzZWxlY3Rpb24pIHtcclxuICAgICAgICAvLyBObyBzZWxlY3Rpb25cclxuICAgICAgICBpZiAoIXNlbGVjdGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5vZGVsaXN0IHdpdGhvdXQgYSBsZW5ndGhcclxuICAgICAgICBpZiAoaXNOb2RlTGlzdChzZWxlY3Rpb24pICYmICFzZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGl0J3MgYW4gaWQsIHJldHVybiBpdCBhcyBhbiBhcnJheVxyXG4gICAgICAgIHJldHVybiBpc0VsZW1lbnQoc2VsZWN0aW9uKSB8fCAhc2VsZWN0aW9uLmxlbmd0aCA/IFtzZWxlY3Rpb25dIDogZnJvbURvbUFycmF5VG9BcnJheShzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0YWlsb3JDaGlsZFNlbGVjdG9yID0gZnVuY3Rpb24oaWQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuICcjJyArIGlkICsgJyAnICsgc2VsZWN0b3I7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoaWxkT3JTaWJsaW5nUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgLy8gQ2hpbGQgc2VsZWN0IC0gbmVlZHMgc3BlY2lhbCBoZWxwIHNvIHRoYXQgXCI+IGRpdlwiIGRvZXNuJ3QgYnJlYWtcclxuICAgICAgICB2YXIgbWV0aG9kICAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIGlkQXBwbGllZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICBzZWxlY3RvciAgPSBzZWxmLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICBuZXdJZCxcclxuICAgICAgICAgICAgaWQ7XHJcblxyXG4gICAgICAgIGlkID0gY29udGV4dC5pZDtcclxuICAgICAgICBpZiAoaWQgPT09ICcnIHx8ICFleGlzdHMoaWQpKSB7XHJcbiAgICAgICAgICAgIG5ld0lkID0gdW5pcXVlSWQoKTtcclxuICAgICAgICAgICAgY29udGV4dC5pZCA9IG5ld0lkO1xyXG4gICAgICAgICAgICBpZEFwcGxpZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZWN0b3IgPSB0YWlsb3JDaGlsZFNlbGVjdG9yKGlkQXBwbGllZCA/IG5ld0lkIDogaWQsIHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGRvY3VtZW50W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBpZiAoaWRBcHBsaWVkKSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaWQgPSBpZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzUXVlcnlTZWxlY3Rpb24oc2VsZWN0aW9uKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xhc3NRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGYpIHtcclxuICAgICAgICB2YXIgbWV0aG9kICAgPSBzZWxmLm1ldGhvZCxcclxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzZWxmLnNlbGVjdG9yLFxyXG4gICAgICAgICAgICAvLyBDbGFzcyBzZWFyY2gsIGRvbid0IHN0YXJ0IHdpdGggJy4nXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3Rvci5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSBjb250ZXh0W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGlkUXVlcnkgPSBmdW5jdGlvbihjb250ZXh0LCBzZWxmKSB7XHJcbiAgICAgICAgdmFyIG1ldGhvZCAgID0gc2VsZi5tZXRob2QsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yID0gc2VsZi5zZWxlY3Rvci5zdWJzdHIoMSksXHJcbiAgICAgICAgICAgIHNlbGVjdGlvbiA9IGRvY3VtZW50W21ldGhvZF0oc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICByZXR1cm4gcHJvY2Vzc1F1ZXJ5U2VsZWN0aW9uKHNlbGVjdGlvbik7XHJcbiAgICB9LFxyXG5cclxuICAgIGRlZmF1bHRRdWVyeSA9IGZ1bmN0aW9uKGNvbnRleHQsIHNlbGYpIHtcclxuICAgICAgICB2YXIgc2VsZWN0aW9uID0gY29udGV4dFtzZWxmLm1ldGhvZF0oc2VsZi5zZWxlY3Rvcik7XHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NRdWVyeVNlbGVjdGlvbihzZWxlY3Rpb24pO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZXRlcm1pbmVRdWVyeSA9IGZ1bmN0aW9uKHNlbGYpIHtcclxuICAgICAgICBpZiAoc2VsZi5pc0NoaWxkT3JTaWJsaW5nU2VsZWN0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGlsZE9yU2libGluZ1F1ZXJ5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNlbGYuaXNDbGFzc1NlYXJjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2xhc3NRdWVyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmlzSWRTZWFyY2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlkUXVlcnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZGVmYXVsdFF1ZXJ5O1xyXG4gICAgfTtcclxuXHJcbnZhciBTZWxlY3RvciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgICB2YXIgc2VsZWN0b3IgICAgICAgICAgICAgICAgPSBzdHIudHJpbSgpLFxyXG4gICAgICAgIGlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgID0gc2VsZWN0b3JbMF0gPT09ICc+JyB8fCBzZWxlY3RvclswXSA9PT0gJysnLFxyXG4gICAgICAgIG1ldGhvZCAgICAgICAgICAgICAgICAgID0gaXNDaGlsZE9yU2libGluZ1NlbGVjdCA/IFFVRVJZX1NFTEVDVE9SX0FMTCA6IGRldGVybWluZU1ldGhvZChzZWxlY3Rvcik7XHJcblxyXG4gICAgdGhpcy5zdHIgICAgICAgICAgICAgICAgICAgID0gc3RyO1xyXG4gICAgdGhpcy5zZWxlY3RvciAgICAgICAgICAgICAgID0gc2VsZWN0b3I7XHJcbiAgICB0aGlzLmlzQ2hpbGRPclNpYmxpbmdTZWxlY3QgPSBpc0NoaWxkT3JTaWJsaW5nU2VsZWN0O1xyXG4gICAgdGhpcy5pc0lkU2VhcmNoICAgICAgICAgICAgID0gbWV0aG9kID09PSBHRVRfRUxFTUVOVF9CWV9JRDtcclxuICAgIHRoaXMuaXNDbGFzc1NlYXJjaCAgICAgICAgICA9ICF0aGlzLmlzSWRTZWFyY2ggJiYgbWV0aG9kID09PSBHRVRfRUxFTUVOVFNfQllfQ0xBU1NfTkFNRTtcclxuICAgIHRoaXMubWV0aG9kICAgICAgICAgICAgICAgICA9IG1ldGhvZDtcclxufTtcclxuXHJcblNlbGVjdG9yLnByb3RvdHlwZSA9IHtcclxuICAgIG1hdGNoOiBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgLy8gTm8gbmVlZWQgdG8gY2hlY2ssIGEgbWF0Y2ggd2lsbCBmYWlsIGlmIGl0J3NcclxuICAgICAgICAvLyBjaGlsZCBvciBzaWJsaW5nXHJcbiAgICAgICAgaWYgKHRoaXMuaXNDaGlsZE9yU2libGluZ1NlbGVjdCkgeyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG1hdGNoZXMoY29udGV4dCwgdGhpcy5zZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIGV4ZWM6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgcXVlcnkgPSBkZXRlcm1pbmVRdWVyeSh0aGlzKTtcclxuXHJcbiAgICAgICAgLy8gdGhlc2UgYXJlIHRoZSB0eXBlcyB3ZSdyZSBleHBlY3RpbmcgdG8gZmFsbCB0aHJvdWdoXHJcbiAgICAgICAgLy8gaXNFbGVtZW50KGNvbnRleHQpIHx8IGlzTm9kZUxpc3QoY29udGV4dCkgfHwgaXNDb2xsZWN0aW9uKGNvbnRleHQpXHJcbiAgICAgICAgLy8gaWYgbm8gY29udGV4dCBpcyBnaXZlbiwgdXNlIGRvY3VtZW50XHJcbiAgICAgICAgcmV0dXJuIHF1ZXJ5KGNvbnRleHQgfHwgZG9jdW1lbnQsIHRoaXMpO1xyXG4gICAgfVxyXG59OyIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnLi4vXycpLFxyXG4gICAgcXVlcnlDYWNoZSA9IHJlcXVpcmUoJy4uL2NhY2hlJykoKSxcclxuICAgIGlzQ2FjaGUgICAgPSByZXF1aXJlKCcuLi9jYWNoZScpKCksXHJcbiAgICBTZWxlY3RvciAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL1NlbGVjdG9yJyksXHJcbiAgICBRdWVyeSAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL1F1ZXJ5JyksXHJcbiAgICBJcyAgICAgICAgID0gcmVxdWlyZSgnLi9jb25zdHJ1Y3RzL0lzJyksXHJcbiAgICBwYXJzZSAgICAgID0gcmVxdWlyZSgnLi9zZWxlY3Rvci9zZWxlY3Rvci1wYXJzZScpLFxyXG4gICAgbm9ybWFsaXplICA9IHJlcXVpcmUoJy4vc2VsZWN0b3Ivc2VsZWN0b3Itbm9ybWFsaXplJyk7XHJcblxyXG52YXIgdG9TZWxlY3RvcnMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIC8vIFNlbGVjdG9ycyB3aWxsIHJldHVybiBudWxsIGlmIHRoZSBxdWVyeSB3YXMgaW52YWxpZC5cclxuICAgIC8vIE5vdCByZXR1cm5pbmcgZWFybHkgb3IgZG9pbmcgZXh0cmEgY2hlY2tzIGFzIHRoaXMgd2lsbFxyXG4gICAgLy8gbm9vcCBvbiB0aGUgUXVlcnkgYW5kIElzIGxldmVsIGFuZCBpcyB0aGUgZXhjZXB0aW9uXHJcbiAgICAvLyBpbnN0ZWFkIG9mIHRoZSBydWxlXHJcbiAgICB2YXIgc2VsZWN0b3JzID0gcGFyc2Uuc3VicXVlcmllcyhzdHIpIHx8IFtdO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBlYWNoIG9mIHRoZSBzZWxlY3RvcnMuLi5cclxuICAgIHNlbGVjdG9ycyA9IF8ubWFwKHNlbGVjdG9ycywgbm9ybWFsaXplKTtcclxuXHJcbiAgICAvLyAuLi5hbmQgbWFwIHRoZW0gdG8gU2VsZWN0b3Igb2JqZWN0c1xyXG4gICAgcmV0dXJuIF8uZmFzdG1hcChzZWxlY3RvcnMsIChzZWxlY3RvcikgPT4gbmV3IFNlbGVjdG9yKHNlbGVjdG9yKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHBhcnNlOiBwYXJzZSxcclxuICAgIFxyXG4gICAgcXVlcnk6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHJldHVybiBxdWVyeUNhY2hlLmhhcyhzdHIpID8gXHJcbiAgICAgICAgICAgIHF1ZXJ5Q2FjaGUuZ2V0KHN0cikgOiBcclxuICAgICAgICAgICAgcXVlcnlDYWNoZS5wdXQoc3RyLCAoKSA9PiBuZXcgUXVlcnkodG9TZWxlY3RvcnMoc3RyKSkpO1xyXG4gICAgfSxcclxuICAgIGlzOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gaXNDYWNoZS5oYXMoc3RyKSA/IFxyXG4gICAgICAgICAgICBpc0NhY2hlLmdldChzdHIpIDogXHJcbiAgICAgICAgICAgIGlzQ2FjaGUucHV0KHN0ciwgKCkgPT4gbmV3IElzKHRvU2VsZWN0b3JzKHN0cikpKTtcclxuICAgIH1cclxufTtcclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuXHRcIjpjaGlsZC1hdFwiOiBcIjpudGgtY2hpbGQoeClcIixcclxuXHRcIjpjaGlsZC1ndFwiOiBcIjpudGgtY2hpbGQobit4KVwiLFxyXG5cdFwiOmNoaWxkLWx0XCI6IFwiOm50aC1jaGlsZCh+bit4KVwiXHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG4gICAgXCI6Y2hpbGQtZXZlblwiIDogXCI6bnRoLWNoaWxkKGV2ZW4pXCIsXHJcbiAgICBcIjpjaGlsZC1vZGRcIiAgOiBcIjpudGgtY2hpbGQob2RkKVwiLFxyXG4gICAgXCI6dGV4dFwiICAgICAgIDogXCJbdHlwZT10ZXh0XVwiLFxyXG4gICAgXCI6cGFzc3dvcmRcIiAgIDogXCJbdHlwZT1wYXNzd29yZF1cIixcclxuICAgIFwiOnJhZGlvXCIgICAgICA6IFwiW3R5cGU9cmFkaW9dXCIsXHJcbiAgICBcIjpjaGVja2JveFwiICAgOiBcIlt0eXBlPWNoZWNrYm94XVwiLFxyXG4gICAgXCI6c3VibWl0XCIgICAgIDogXCJbdHlwZT1zdWJtaXRdXCIsXHJcbiAgICBcIjpyZXNldFwiICAgICAgOiBcIlt0eXBlPXJlc2V0XVwiLFxyXG4gICAgXCI6YnV0dG9uXCIgICAgIDogXCJbdHlwZT1idXR0b25dXCIsXHJcbiAgICBcIjppbWFnZVwiICAgICAgOiBcIlt0eXBlPWltYWdlXVwiLFxyXG4gICAgXCI6aW5wdXRcIiAgICAgIDogXCJbdHlwZT1pbnB1dF1cIixcclxuICAgIFwiOmZpbGVcIiAgICAgICA6IFwiW3R5cGU9ZmlsZV1cIixcclxuICAgIFwiOnNlbGVjdGVkXCIgICA6IFwiW3NlbGVjdGVkPXNlbGVjdGVkXVwiXHJcbn0iLCJ2YXIgU1VQUE9SVFMgICAgICAgICAgICA9IHJlcXVpcmUoJ1NVUFBPUlRTJyksXHJcblxyXG4gICAgQVRUUklCVVRFX1NFTEVDVE9SID0gL1xcW1xccypbXFx3LV0rXFxzKlshJF4qXT8oPzo9XFxzKihbJ1wiXT8pKC4qP1teXFxcXF18W15cXFxcXSopKT9cXDFcXHMqXFxdL2csXHJcbiAgICBQU0VVRE9fU0VMRUNUICAgICAgPSAvKDpbXlxcc1xcKFxcWyldKykvZyxcclxuICAgIENBUFRVUkVfU0VMRUNUICAgICA9IC8oOlteXFxzXihdKylcXCgoW15cXCldKylcXCkvZyxcclxuICAgIHBzZXVkb0NhY2hlICAgICAgICA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuICAgIHByb3h5U2VsZWN0b3JzICAgICA9IHJlcXVpcmUoJy4vcHJveHkuanNvbicpLFxyXG4gICAgY2FwdHVyZVNlbGVjdG9ycyAgID0gcmVxdWlyZSgnLi9jYXB0dXJlLmpzb24nKTtcclxuXHJcbnZhciBnZXRBdHRyaWJ1dGVQb3NpdGlvbnMgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgIHZhciBwYWlycyA9IFtdO1xyXG4gICAgLy8gTm90IHVzaW5nIHJldHVybiB2YWx1ZS4gU2ltcGx5IHVzaW5nIGl0IHRvIGl0ZXJhdGVcclxuICAgIC8vIHRocm91Z2ggYWxsIG9mIHRoZSBtYXRjaGVzIHRvIHBvcHVsYXRlIG1hdGNoIHBvc2l0aW9uc1xyXG4gICAgc3RyLnJlcGxhY2UoQVRUUklCVVRFX1NFTEVDVE9SLCBmdW5jdGlvbihtYXRjaCwgY2FwMSwgY2FwMiwgcG9zaXRpb24pIHtcclxuICAgICAgICBwYWlycy5wdXNoKFsgcG9zaXRpb24sIHBvc2l0aW9uICsgbWF0Y2gubGVuZ3RoIF0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcGFpcnM7XHJcbn07XHJcblxyXG52YXIgaXNPdXRzaWRlT2ZBdHRyaWJ1dGUgPSBmdW5jdGlvbihwb3NpdGlvbiwgcG9zaXRpb25zKSB7XHJcbiAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gcG9zaXRpb25zLmxlbmd0aDtcclxuICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgdmFyIHBvcyA9IHBvc2l0aW9uc1tpZHhdO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbiA+IHBvc1swXSAmJiBwb3NpdGlvbiA8IHBvc1sxXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG52YXIgcHNldWRvUmVwbGFjZSA9IGZ1bmN0aW9uKHN0ciwgcG9zaXRpb25zKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoUFNFVURPX1NFTEVDVCwgZnVuY3Rpb24obWF0Y2gsIGNhcCwgcG9zaXRpb24pIHtcclxuICAgICAgICBpZiAoIWlzT3V0c2lkZU9mQXR0cmlidXRlKHBvc2l0aW9uLCBwb3NpdGlvbnMpKSB7IHJldHVybiBtYXRjaDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJveHlTZWxlY3RvcnNbbWF0Y2hdID8gcHJveHlTZWxlY3RvcnNbbWF0Y2hdIDogbWF0Y2g7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbnZhciBjYXB0dXJlUmVwbGFjZSA9IGZ1bmN0aW9uKHN0ciwgcG9zaXRpb25zKSB7XHJcbiAgICB2YXIgY2FwdHVyZVNlbGVjdG9yO1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKENBUFRVUkVfU0VMRUNULCBmdW5jdGlvbihtYXRjaCwgY2FwLCB2YWx1ZSwgcG9zaXRpb24pIHtcclxuICAgICAgICBpZiAoIWlzT3V0c2lkZU9mQXR0cmlidXRlKHBvc2l0aW9uLCBwb3NpdGlvbnMpKSB7IHJldHVybiBtYXRjaDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gKGNhcHR1cmVTZWxlY3RvciA9IGNhcHR1cmVTZWxlY3RvcnNbY2FwXSkgPyBjYXB0dXJlU2VsZWN0b3IucmVwbGFjZSgneCcsIHZhbHVlKSA6IG1hdGNoO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG52YXIgYm9vbGVhblNlbGVjdG9yUmVwbGFjZSA9IFNVUFBPUlRTLnNlbGVjdGVkU2VsZWN0b3IgP1xyXG4gICAgLy8gSUUxMCssIG1vZGVybiBicm93c2Vyc1xyXG4gICAgZnVuY3Rpb24oc3RyKSB7IHJldHVybiBzdHI7IH0gOlxyXG4gICAgLy8gSUU4LTlcclxuICAgIGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbnMgPSBnZXRBdHRyaWJ1dGVQb3NpdGlvbnMoc3RyKSxcclxuICAgICAgICAgICAgaWR4ID0gcG9zaXRpb25zLmxlbmd0aCxcclxuICAgICAgICAgICAgcG9zLFxyXG4gICAgICAgICAgICBzZWxlY3RvcjtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIHBvcyA9IHBvc2l0aW9uc1tpZHhdO1xyXG4gICAgICAgICAgICBzZWxlY3RvciA9IHN0ci5zdWJzdHJpbmcocG9zWzBdLCBwb3NbMV0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdbc2VsZWN0ZWRdJykge1xyXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBwb3NbMF0pICsgJ1tzZWxlY3RlZD1cInNlbGVjdGVkXCJdJyArIHN0ci5zdWJzdHJpbmcocG9zWzFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHN0cjtcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgcmV0dXJuIHBzZXVkb0NhY2hlLmhhcyhzdHIpID8gcHNldWRvQ2FjaGUuZ2V0KHN0cikgOiBwc2V1ZG9DYWNoZS5wdXQoc3RyLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXR0clBvc2l0aW9ucyA9IGdldEF0dHJpYnV0ZVBvc2l0aW9ucyhzdHIpO1xyXG4gICAgICAgIHN0ciA9IHBzZXVkb1JlcGxhY2Uoc3RyLCBhdHRyUG9zaXRpb25zKTtcclxuICAgICAgICBzdHIgPSBib29sZWFuU2VsZWN0b3JSZXBsYWNlKHN0cik7XHJcbiAgICAgICAgcmV0dXJuIGNhcHR1cmVSZXBsYWNlKHN0ciwgYXR0clBvc2l0aW9ucyk7XHJcbiAgICB9KTtcclxufTtcclxuIiwiLypcclxuICogRml6emxlLmpzXHJcbiAqIEFkYXB0ZWQgZnJvbSBTaXp6bGUuanNcclxuICovXHJcbnZhciB0b2tlbkNhY2hlICAgID0gcmVxdWlyZSgnY2FjaGUnKSgpLFxyXG4gICAgc3VicXVlcnlDYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJykoKSxcclxuXHJcbiAgICBlcnJvciA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdkLWpzOiBJbnZhbGlkIHF1ZXJ5IHNlbGVjdG9yIChjYXVnaHQpIFwiJysgc2VsZWN0b3IgKydcIicpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcclxuXHJcbiAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXNlbGVjdG9ycy8jd2hpdGVzcGFjZVxyXG4gICAgV0hJVEVTUEFDRSA9ICdbXFxcXHgyMFxcXFx0XFxcXHJcXFxcblxcXFxmXScsXHJcblxyXG4gICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI3ZhbHVlLWRlZi1pZGVudGlmaWVyXHJcbiAgICBJREVOVElGSUVSID0gJyg/OlxcXFxcXFxcLnxbXFxcXHctXXxbXlxcXFx4MDAtXFxcXHhhMF0pKycsXHJcblxyXG4gICAgLy8gTk9URTogTGVhdmluZyBkb3VibGUgcXVvdGVzIHRvIHJlZHVjZSBlc2NhcGluZ1xyXG4gICAgLy8gQXR0cmlidXRlIHNlbGVjdG9yczogaHR0cDovL3d3dy53My5vcmcvVFIvc2VsZWN0b3JzLyNhdHRyaWJ1dGUtc2VsZWN0b3JzXHJcbiAgICBBVFRSSUJVVEVTID0gXCJcXFxcW1wiICsgV0hJVEVTUEFDRSArIFwiKihcIiArIElERU5USUZJRVIgKyBcIikoPzpcIiArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgIC8vIE9wZXJhdG9yIChjYXB0dXJlIDIpXHJcbiAgICAgICAgXCIqKFsqXiR8IX5dPz0pXCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICAvLyBcIkF0dHJpYnV0ZSB2YWx1ZXMgbXVzdCBiZSBDU1MgSURFTlRJRklFUnMgW2NhcHR1cmUgNV0gb3Igc3RyaW5ncyBbY2FwdHVyZSAzIG9yIGNhcHR1cmUgNF1cIlxyXG4gICAgICAgIFwiKig/OicoKD86XFxcXFxcXFwufFteXFxcXFxcXFwnXSkqKSd8XFxcIigoPzpcXFxcXFxcXC58W15cXFxcXFxcXFxcXCJdKSopXFxcInwoXCIgKyBJREVOVElGSUVSICsgXCIpKXwpXCIgKyBXSElURVNQQUNFICtcclxuICAgICAgICBcIipcXFxcXVwiLFxyXG5cclxuICAgIFBTRVVET1MgPSBcIjooXCIgKyBJREVOVElGSUVSICsgXCIpKD86XFxcXCgoXCIgK1xyXG4gICAgICAgIC8vIFRvIHJlZHVjZSB0aGUgbnVtYmVyIG9mIHNlbGVjdG9ycyBuZWVkaW5nIHRva2VuaXplIGluIHRoZSBwcmVGaWx0ZXIsIHByZWZlciBhcmd1bWVudHM6XHJcbiAgICAgICAgLy8gMS4gcXVvdGVkIChjYXB0dXJlIDM7IGNhcHR1cmUgNCBvciBjYXB0dXJlIDUpXHJcbiAgICAgICAgXCIoJygoPzpcXFxcXFxcXC58W15cXFxcXFxcXCddKSopJ3xcXFwiKCg/OlxcXFxcXFxcLnxbXlxcXFxcXFxcXFxcIl0pKilcXFwiKXxcIiArXHJcbiAgICAgICAgLy8gMi4gc2ltcGxlIChjYXB0dXJlIDYpXHJcbiAgICAgICAgXCIoKD86XFxcXFxcXFwufFteXFxcXFxcXFwoKVtcXFxcXV18XCIgKyBBVFRSSUJVVEVTICsgXCIpKil8XCIgK1xyXG4gICAgICAgIC8vIDMuIGFueXRoaW5nIGVsc2UgKGNhcHR1cmUgMilcclxuICAgICAgICBcIi4qXCIgK1xyXG4gICAgICAgIFwiKVxcXFwpfClcIixcclxuXHJcbiAgICBSX0NPTU1BICAgICAgID0gbmV3IFJlZ0V4cCgnXicgKyBXSElURVNQQUNFICsgJyosJyArIFdISVRFU1BBQ0UgKyAnKicpLFxyXG4gICAgUl9DT01CSU5BVE9SUyA9IG5ldyBSZWdFeHAoJ14nICsgV0hJVEVTUEFDRSArICcqKFs+K35dfCcgKyBXSElURVNQQUNFICsgJyknICsgV0hJVEVTUEFDRSArICcqJyksXHJcbiAgICBSX1BTRVVETyAgICAgID0gbmV3IFJlZ0V4cChQU0VVRE9TKSxcclxuICAgIFJfTUFUQ0hfRVhQUiA9IHtcclxuICAgICAgICBJRDogICAgIG5ldyBSZWdFeHAoJ14jKCcgICArIElERU5USUZJRVIgKyAnKScpLFxyXG4gICAgICAgIENMQVNTOiAgbmV3IFJlZ0V4cCgnXlxcXFwuKCcgKyBJREVOVElGSUVSICsgJyknKSxcclxuICAgICAgICBUQUc6ICAgIG5ldyBSZWdFeHAoJ14oJyAgICArIElERU5USUZJRVIgKyAnfFsqXSknKSxcclxuICAgICAgICBBVFRSOiAgIG5ldyBSZWdFeHAoJ14nICAgICArIEFUVFJJQlVURVMpLFxyXG4gICAgICAgIFBTRVVETzogbmV3IFJlZ0V4cCgnXicgICAgICsgUFNFVURPUyksXHJcbiAgICAgICAgQ0hJTEQ6ICBuZXcgUmVnRXhwKCdeOihvbmx5fGZpcnN0fGxhc3R8bnRofG50aC1sYXN0KS0oY2hpbGR8b2YtdHlwZSkoPzpcXFxcKCcgKyBXSElURVNQQUNFICtcclxuICAgICAgICAgICAgJyooZXZlbnxvZGR8KChbKy1dfCkoXFxcXGQqKW58KScgKyBXSElURVNQQUNFICsgJyooPzooWystXXwpJyArIFdISVRFU1BBQ0UgK1xyXG4gICAgICAgICAgICAnKihcXFxcZCspfCkpJyArIFdISVRFU1BBQ0UgKyAnKlxcXFwpfCknLCAnaScpLFxyXG4gICAgICAgIGJvb2w6ICAgbmV3IFJlZ0V4cChcIl4oPzpjaGVja2VkfHNlbGVjdGVkfGFzeW5jfGF1dG9mb2N1c3xhdXRvcGxheXxjb250cm9sc3xkZWZlcnxkaXNhYmxlZHxoaWRkZW58aXNtYXB8bG9vcHxtdWx0aXBsZXxvcGVufHJlYWRvbmx5fHJlcXVpcmVkfHNjb3BlZCkkXCIsIFwiaVwiKVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDU1MgZXNjYXBlcyBodHRwOi8vd3d3LnczLm9yZy9UUi9DU1MyMS9zeW5kYXRhLmh0bWwjZXNjYXBlZC1jaGFyYWN0ZXJzXHJcbiAgICBSX1VORVNDQVBFID0gbmV3IFJlZ0V4cCgnXFxcXFxcXFwoW1xcXFxkYS1mXXsxLDZ9JyArIFdISVRFU1BBQ0UgKyAnP3woJyArIFdISVRFU1BBQ0UgKyAnKXwuKScsICdpZycpLFxyXG4gICAgZnVuZXNjYXBlID0gZnVuY3Rpb24oXywgZXNjYXBlZCwgZXNjYXBlZFdoaXRlc3BhY2UpIHtcclxuICAgICAgICB2YXIgaGlnaCA9ICcweCcgKyAoZXNjYXBlZCAtIDB4MTAwMDApO1xyXG4gICAgICAgIC8vIE5hTiBtZWFucyBub24tY29kZXBvaW50XHJcbiAgICAgICAgLy8gU3VwcG9ydDogRmlyZWZveDwyNFxyXG4gICAgICAgIC8vIFdvcmthcm91bmQgZXJyb25lb3VzIG51bWVyaWMgaW50ZXJwcmV0YXRpb24gb2YgKycweCdcclxuICAgICAgICByZXR1cm4gaGlnaCAhPT0gaGlnaCB8fCBlc2NhcGVkV2hpdGVzcGFjZSA/XHJcbiAgICAgICAgICAgIGVzY2FwZWQgOlxyXG4gICAgICAgICAgICBoaWdoIDwgMCA/XHJcbiAgICAgICAgICAgICAgICAvLyBCTVAgY29kZXBvaW50XHJcbiAgICAgICAgICAgICAgICBmcm9tQ2hhckNvZGUoaGlnaCArIDB4MTAwMDApIDpcclxuICAgICAgICAgICAgICAgIC8vIFN1cHBsZW1lbnRhbCBQbGFuZSBjb2RlcG9pbnQgKHN1cnJvZ2F0ZSBwYWlyKVxyXG4gICAgICAgICAgICAgICAgZnJvbUNoYXJDb2RlKChoaWdoID4+IDEwKSB8IDB4RDgwMCwgKGhpZ2ggJiAweDNGRikgfCAweERDMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVGaWx0ZXIgPSB7XHJcbiAgICAgICAgQVRUUjogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS5yZXBsYWNlKFJfVU5FU0NBUEUsIGZ1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBNb3ZlIHRoZSBnaXZlbiB2YWx1ZSB0byBtYXRjaFszXSB3aGV0aGVyIHF1b3RlZCBvciB1bnF1b3RlZFxyXG4gICAgICAgICAgICBtYXRjaFszXSA9ICggbWF0Y2hbM10gfHwgbWF0Y2hbNF0gfHwgbWF0Y2hbNV0gfHwgJycgKS5yZXBsYWNlKFJfVU5FU0NBUEUsIGZ1bmVzY2FwZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2hbMl0gPT09ICd+PScpIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzNdID0gJyAnICsgbWF0Y2hbM10gKyAnICc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgwLCA0KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBDSElMRDogZnVuY3Rpb24obWF0Y2gpIHtcclxuICAgICAgICAgICAgLyogbWF0Y2hlcyBmcm9tIFJfTUFUQ0hfRVhQUlsnQ0hJTEQnXVxyXG4gICAgICAgICAgICAgICAgMSB0eXBlIChvbmx5fG50aHwuLi4pXHJcbiAgICAgICAgICAgICAgICAyIHdoYXQgKGNoaWxkfG9mLXR5cGUpXHJcbiAgICAgICAgICAgICAgICAzIGFyZ3VtZW50IChldmVufG9kZHxcXGQqfFxcZCpuKFsrLV1cXGQrKT98Li4uKVxyXG4gICAgICAgICAgICAgICAgNCB4bi1jb21wb25lbnQgb2YgeG4reSBhcmd1bWVudCAoWystXT9cXGQqbnwpXHJcbiAgICAgICAgICAgICAgICA1IHNpZ24gb2YgeG4tY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA2IHggb2YgeG4tY29tcG9uZW50XHJcbiAgICAgICAgICAgICAgICA3IHNpZ24gb2YgeS1jb21wb25lbnRcclxuICAgICAgICAgICAgICAgIDggeSBvZiB5LWNvbXBvbmVudFxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgbWF0Y2hbMV0gPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdLnNsaWNlKDAsIDMpID09PSAnbnRoJykge1xyXG4gICAgICAgICAgICAgICAgLy8gbnRoLSogcmVxdWlyZXMgYXJndW1lbnRcclxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWF0Y2hbMF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG51bWVyaWMgeCBhbmQgeSBwYXJhbWV0ZXJzIGZvciBFeHByLmZpbHRlci5DSElMRFxyXG4gICAgICAgICAgICAgICAgLy8gcmVtZW1iZXIgdGhhdCBmYWxzZS90cnVlIGNhc3QgcmVzcGVjdGl2ZWx5IHRvIDAvMVxyXG4gICAgICAgICAgICAgICAgbWF0Y2hbNF0gPSArKG1hdGNoWzRdID8gbWF0Y2hbNV0gKyAobWF0Y2hbNl0gfHwgMSkgOiAyICogKG1hdGNoWzNdID09PSAnZXZlbicgfHwgbWF0Y2hbM10gPT09ICdvZGQnKSk7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFs1XSA9ICsoKCBtYXRjaFs3XSArIG1hdGNoWzhdKSB8fCBtYXRjaFszXSA9PT0gJ29kZCcpO1xyXG5cclxuICAgICAgICAgICAgLy8gb3RoZXIgdHlwZXMgcHJvaGliaXQgYXJndW1lbnRzXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtYXRjaFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtYXRjaDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBQU0VVRE86IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICAgICAgICAgIHZhciBleGNlc3MsXHJcbiAgICAgICAgICAgICAgICB1bnF1b3RlZCA9ICFtYXRjaFs2XSAmJiBtYXRjaFsyXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChSX01BVENIX0VYUFIuQ0hJTEQudGVzdChtYXRjaFswXSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBY2NlcHQgcXVvdGVkIGFyZ3VtZW50cyBhcy1pc1xyXG4gICAgICAgICAgICBpZiAobWF0Y2hbM10pIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoWzJdID0gbWF0Y2hbNF0gfHwgbWF0Y2hbNV0gfHwgJyc7XHJcblxyXG4gICAgICAgICAgICAvLyBTdHJpcCBleGNlc3MgY2hhcmFjdGVycyBmcm9tIHVucXVvdGVkIGFyZ3VtZW50c1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVucXVvdGVkICYmIFJfUFNFVURPLnRlc3QodW5xdW90ZWQpICYmXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgZXhjZXNzIGZyb20gdG9rZW5pemUgKHJlY3Vyc2l2ZWx5KVxyXG4gICAgICAgICAgICAgICAgKGV4Y2VzcyA9IHRva2VuaXplKHVucXVvdGVkLCB0cnVlKSkgJiZcclxuICAgICAgICAgICAgICAgIC8vIGFkdmFuY2UgdG8gdGhlIG5leHQgY2xvc2luZyBwYXJlbnRoZXNpc1xyXG4gICAgICAgICAgICAgICAgKGV4Y2VzcyA9IHVucXVvdGVkLmluZGV4T2YoJyknLCB1bnF1b3RlZC5sZW5ndGggLSBleGNlc3MpIC0gdW5xdW90ZWQubGVuZ3RoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGV4Y2VzcyBpcyBhIG5lZ2F0aXZlIGluZGV4XHJcbiAgICAgICAgICAgICAgICBtYXRjaFswXSA9IG1hdGNoWzBdLnNsaWNlKDAsIGV4Y2Vzcyk7XHJcbiAgICAgICAgICAgICAgICBtYXRjaFsyXSA9IHVucXVvdGVkLnNsaWNlKDAsIGV4Y2Vzcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiBvbmx5IGNhcHR1cmVzIG5lZWRlZCBieSB0aGUgcHNldWRvIGZpbHRlciBtZXRob2QgKHR5cGUgYW5kIGFyZ3VtZW50KVxyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2guc2xpY2UoMCwgMyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbi8qKlxyXG4gKiBTcGxpdHMgdGhlIGdpdmVuIGNvbW1hLXNlcGFyYXRlZCBDU1Mgc2VsZWN0b3IgaW50byBzZXBhcmF0ZSBzdWItcXVlcmllcy5cclxuICogQHBhcmFtICB7U3RyaW5nfSBzZWxlY3RvciBGdWxsIENTUyBzZWxlY3RvciAoZS5nLiwgJ2EsIGlucHV0OmZvY3VzLCBkaXZbYXR0cj1cInZhbHVlXCJdJykuXHJcbiAqIEBwYXJhbSAge0Jvb2xlYW59IFtwYXJzZU9ubHk9ZmFsc2VdXHJcbiAqIEByZXR1cm4ge1N0cmluZ1tdfE51bWJlcnxudWxsfSBBcnJheSBvZiBzdWItcXVlcmllcyAoZS5nLiwgWyAnYScsICdpbnB1dDpmb2N1cycsICdkaXZbYXR0cj1cIih2YWx1ZTEpLFt2YWx1ZTJdXCJdJykgb3IgbnVsbCBpZiB0aGVyZSB3YXMgYW4gZXJyb3IgcGFyc2luZy5cclxuICogQHByaXZhdGVcclxuICovXHJcbnZhciB0b2tlbml6ZSA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBwYXJzZU9ubHkpIHtcclxuICAgIGlmICh0b2tlbkNhY2hlLmhhcyhzZWxlY3RvcikpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VPbmx5ID8gMCA6IHRva2VuQ2FjaGUuZ2V0KHNlbGVjdG9yKS5zbGljZSgwKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgdHlwZSxcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtSZWdFeHB9ICovXHJcbiAgICAgICAgcmVnZXgsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7QXJyYXl9ICovXHJcbiAgICAgICAgbWF0Y2gsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIG1hdGNoZWQsXHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nW119ICovXHJcbiAgICAgICAgc3VicXVlcmllcyA9IFtdLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBzdWJxdWVyeSA9ICcnLFxyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICBzb0ZhciA9IHNlbGVjdG9yO1xyXG5cclxuICAgIHdoaWxlIChzb0Zhcikge1xyXG4gICAgICAgIC8vIENvbW1hIGFuZCBmaXJzdCBydW5cclxuICAgICAgICBpZiAoIW1hdGNoZWQgfHwgKG1hdGNoID0gUl9DT01NQS5leGVjKHNvRmFyKSkpIHtcclxuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBjb25zdW1lIHRyYWlsaW5nIGNvbW1hcyBhcyB2YWxpZFxyXG4gICAgICAgICAgICAgICAgc29GYXIgPSBzb0Zhci5zbGljZShtYXRjaFswXS5sZW5ndGgpIHx8IHNvRmFyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdWJxdWVyeSkgeyBzdWJxdWVyaWVzLnB1c2goc3VicXVlcnkpOyB9XHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5ID0gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXRjaGVkID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gQ29tYmluYXRvcnNcclxuICAgICAgICBpZiAoKG1hdGNoID0gUl9DT01CSU5BVE9SUy5leGVjKHNvRmFyKSkpIHtcclxuICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5ICs9IG1hdGNoZWQ7XHJcbiAgICAgICAgICAgIHNvRmFyID0gc29GYXIuc2xpY2UobWF0Y2hlZC5sZW5ndGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRmlsdGVyc1xyXG4gICAgICAgIGZvciAodHlwZSBpbiBSX01BVENIX0VYUFIpIHtcclxuICAgICAgICAgICAgcmVnZXggPSBSX01BVENIX0VYUFJbdHlwZV07XHJcbiAgICAgICAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhzb0Zhcik7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2ggJiYgKCFwcmVGaWx0ZXJbdHlwZV0gfHwgKG1hdGNoID0gcHJlRmlsdGVyW3R5cGVdKG1hdGNoKSkpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaGVkID0gbWF0Y2guc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgIHN1YnF1ZXJ5ICs9IG1hdGNoZWQ7XHJcbiAgICAgICAgICAgICAgICBzb0ZhciA9IHNvRmFyLnNsaWNlKG1hdGNoZWQubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFtYXRjaGVkKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3VicXVlcnkpIHsgc3VicXVlcmllcy5wdXNoKHN1YnF1ZXJ5KTsgfVxyXG5cclxuICAgIC8vIFJldHVybiB0aGUgbGVuZ3RoIG9mIHRoZSBpbnZhbGlkIGV4Y2Vzc1xyXG4gICAgLy8gaWYgd2UncmUganVzdCBwYXJzaW5nLlxyXG4gICAgaWYgKHBhcnNlT25seSkgeyByZXR1cm4gc29GYXIubGVuZ3RoOyB9XHJcblxyXG4gICAgaWYgKHNvRmFyKSB7IGVycm9yKHNlbGVjdG9yKTsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICByZXR1cm4gdG9rZW5DYWNoZS5zZXQoc2VsZWN0b3IsIHN1YnF1ZXJpZXMpLnNsaWNlKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogU3BsaXRzIHRoZSBnaXZlbiBjb21tYS1zZXBhcmF0ZWQgQ1NTIHNlbGVjdG9yIGludG8gc2VwYXJhdGUgc3ViLXF1ZXJpZXMuXHJcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIEZ1bGwgQ1NTIHNlbGVjdG9yIChlLmcuLCAnYSwgaW5wdXQ6Zm9jdXMsIGRpdlthdHRyPVwidmFsdWVcIl0nKS5cclxuICAgICAqIEByZXR1cm4ge1N0cmluZ1tdfG51bGx9IEFycmF5IG9mIHN1Yi1xdWVyaWVzIChlLmcuLCBbICdhJywgJ2lucHV0OmZvY3VzJywgJ2RpdlthdHRyPVwiKHZhbHVlMSksW3ZhbHVlMl1cIl0nKSBvciBudWxsIGlmIHRoZXJlIHdhcyBhbiBlcnJvciBwYXJzaW5nIHRoZSBzZWxlY3Rvci5cclxuICAgICAqL1xyXG4gICAgc3VicXVlcmllczogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gc3VicXVlcnlDYWNoZS5oYXMoc2VsZWN0b3IpID8gXHJcbiAgICAgICAgICAgIHN1YnF1ZXJ5Q2FjaGUuZ2V0KHNlbGVjdG9yKSA6IFxyXG4gICAgICAgICAgICBzdWJxdWVyeUNhY2hlLnB1dChzZWxlY3RvciwgKCkgPT4gdG9rZW5pemUoc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNCb29sOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIFJfTUFUQ0hfRVhQUi5ib29sLnRlc3QobmFtZSk7XHJcbiAgICB9XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gMjsiLCJtb2R1bGUuZXhwb3J0cyA9IDg7IiwibW9kdWxlLmV4cG9ydHMgPSA5OyIsIm1vZHVsZS5leHBvcnRzID0gMTE7IiwibW9kdWxlLmV4cG9ydHMgPSAxOyIsIm1vZHVsZS5leHBvcnRzID0gMzsiLCIgICAgLy8gTWF0Y2hlcyBcIi1tcy1cIiBzbyB0aGF0IGl0IGNhbiBiZSBjaGFuZ2VkIHRvIFwibXMtXCJcclxudmFyIFRSVU5DQVRFX01TX1BSRUZJWCAgPSAvXi1tcy0vLFxyXG5cclxuICAgIC8vIE1hdGNoZXMgZGFzaGVkIHN0cmluZyBmb3IgY2FtZWxpemluZ1xyXG4gICAgREFTSF9DQVRDSCAgICAgICAgICA9IC8tKFtcXGRhLXpdKS9naSxcclxuXHJcbiAgICAvLyBNYXRjaGVzIFwibm9uZVwiIG9yIGEgdGFibGUgdHlwZSBlLmcuIFwidGFibGVcIixcclxuICAgIC8vIFwidGFibGUtY2VsbFwiIGV0Yy4uLlxyXG4gICAgTk9ORV9PUl9UQUJMRSAgICAgICA9IC9eKG5vbmV8dGFibGUoPyEtY1tlYV0pLispLyxcclxuICAgIFxyXG4gICAgVFlQRV9URVNUX0ZPQ1VTQUJMRSA9IC9eKD86aW5wdXR8c2VsZWN0fHRleHRhcmVhfGJ1dHRvbnxvYmplY3QpJC9pLFxyXG4gICAgVFlQRV9URVNUX0NMSUNLQUJMRSA9IC9eKD86YXxhcmVhKSQvaSxcclxuICAgIFNFTEVDVE9SX0lEICAgICAgICAgPSAvXiMoW1xcdy1dKykkLyxcclxuICAgIFNFTEVDVE9SX1RBRyAgICAgICAgPSAvXltcXHctXSskLyxcclxuICAgIFNFTEVDVE9SX0NMQVNTICAgICAgPSAvXlxcLihbXFx3LV0rKSQvLFxyXG4gICAgUE9TSVRJT04gICAgICAgICAgICA9IC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkLyxcclxuICAgIE5VTV9OT05fUFggICAgICAgICAgPSBuZXcgUmVnRXhwKCdeKCcgKyAoL1srLV0/KD86XFxkKlxcLnwpXFxkKyg/OltlRV1bKy1dP1xcZCt8KS8pLnNvdXJjZSArICcpKD8hcHgpW2EteiVdKyQnLCAnaScpLFxyXG4gICAgU0lOR0xFX1RBRyAgICAgICAgICA9IC9ePChcXHcrKVxccypcXC8/Pig/OjxcXC9cXDE+fCkkLyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBvZiBwYXJlbnQgdGFnIG5hbWVzIHRvIHRoZSBjaGlsZCB0YWdzIHRoYXQgcmVxdWlyZSB0aGVtLlxyXG4gICAgICogQHR5cGUge09iamVjdH1cclxuICAgICAqL1xyXG4gICAgUEFSRU5UX01BUCA9IHtcclxuICAgICAgICB0YWJsZTogICAgL148KD86dGJvZHl8dGZvb3R8dGhlYWR8Y29sZ3JvdXB8Y2FwdGlvbilcXGIvLFxyXG4gICAgICAgIHRib2R5OiAgICAvXjwoPzp0cilcXGIvLFxyXG4gICAgICAgIHRyOiAgICAgICAvXjwoPzp0ZHx0aClcXGIvLFxyXG4gICAgICAgIGNvbGdyb3VwOiAvXjwoPzpjb2wpXFxiLyxcclxuICAgICAgICBzZWxlY3Q6ICAgL148KD86b3B0aW9uKVxcYi9cclxuICAgIH07XHJcblxyXG4vLyBoYXZpbmcgY2FjaGVzIGlzbid0IGFjdHVhbGx5IGZhc3RlclxyXG4vLyBmb3IgYSBtYWpvcml0eSBvZiB1c2UgY2FzZXMgZm9yIHN0cmluZ1xyXG4vLyBtYW5pcHVsYXRpb25zXHJcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3NpbXBsZS1jYWNoZS1mb3Itc3RyaW5nLW1hbmlwXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbnVtTm90UHg6ICAgICAgICh2YWwpID0+IE5VTV9OT05fUFgudGVzdCh2YWwpLFxyXG4gICAgcG9zaXRpb246ICAgICAgICh2YWwpID0+IFBPU0lUSU9OLnRlc3QodmFsKSxcclxuICAgIHNpbmdsZVRhZ01hdGNoOiAodmFsKSA9PiBTSU5HTEVfVEFHLmV4ZWModmFsKSxcclxuICAgIGlzTm9uZU9yVGFibGU6ICAoc3RyKSA9PiBOT05FX09SX1RBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzRm9jdXNhYmxlOiAgICAoc3RyKSA9PiBUWVBFX1RFU1RfRk9DVVNBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzQ2xpY2thYmxlOiAgICAoc3RyKSA9PiBUWVBFX1RFU1RfQ0xJQ0tBQkxFLnRlc3Qoc3RyKSxcclxuICAgIGlzU3RyaWN0SWQ6ICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9JRC50ZXN0KHN0ciksXHJcbiAgICBpc1RhZzogICAgICAgICAgKHN0cikgPT4gU0VMRUNUT1JfVEFHLnRlc3Qoc3RyKSxcclxuICAgIGlzQ2xhc3M6ICAgICAgICAoc3RyKSA9PiBTRUxFQ1RPUl9DTEFTUy50ZXN0KHN0ciksXHJcblxyXG4gICAgY2FtZWxDYXNlOiBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoVFJVTkNBVEVfTVNfUFJFRklYLCAnbXMtJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoREFTSF9DQVRDSCwgKG1hdGNoLCBsZXR0ZXIpID0+IGxldHRlci50b1VwcGVyQ2FzZSgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50VGFnTmFtZTogZnVuY3Rpb24oc3RyKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9IHN0ci5zdWJzdHIoMCwgMzApO1xyXG4gICAgICAgIGZvciAodmFyIHBhcmVudFRhZ05hbWUgaW4gUEFSRU5UX01BUCkge1xyXG4gICAgICAgICAgICBpZiAoUEFSRU5UX01BUFtwYXJlbnRUYWdOYW1lXS50ZXN0KHZhbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnRUYWdOYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAnZGl2JztcclxuICAgIH1cclxufTtcclxuIiwidmFyIERJViAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgY3JlYXRlID0gcmVxdWlyZSgnRElWL2NyZWF0ZScpLFxyXG4gICAgYSAgICAgID0gRElWLnF1ZXJ5U2VsZWN0b3IoJ2EnKSxcclxuICAgIHNlbGVjdCA9IGNyZWF0ZSgnc2VsZWN0JyksXHJcbiAgICBvcHRpb24gPSBzZWxlY3QuYXBwZW5kQ2hpbGQoY3JlYXRlKCdvcHRpb24nKSk7XHJcblxyXG52YXIgdGVzdCA9IGZ1bmN0aW9uKHRhZ05hbWUsIHRlc3RGbikge1xyXG4gICAgLy8gQXZvaWQgdmFyaWFibGUgcmVmZXJlbmNlcyB0byBlbGVtZW50cyB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcyBpbiBJRS5cclxuICAgIHJldHVybiB0ZXN0Rm4oY3JlYXRlKHRhZ05hbWUpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgVVJMcyBhcmVuJ3QgbWFuaXB1bGF0ZWRcclxuICAgIC8vIChJRSBub3JtYWxpemVzIGl0IGJ5IGRlZmF1bHQpXHJcbiAgICBocmVmTm9ybWFsaXplZDogYS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSA9PT0gJy9hJyxcclxuXHJcbiAgICAvLyBDaGVjayB0aGUgZGVmYXVsdCBjaGVja2JveC9yYWRpbyB2YWx1ZSAoJycgaW4gb2xkZXIgV2ViS2l0OyAnb24nIGVsc2V3aGVyZSlcclxuICAgIGNoZWNrT246IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gISFpbnB1dC52YWx1ZTtcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFuIGlucHV0IG1haW50YWlucyBpdHMgdmFsdWUgYWZ0ZXIgYmVjb21pbmcgYSByYWRpb1xyXG4gICAgLy8gU3VwcG9ydDogTW9kZXJuIGJyb3dzZXJzIG9ubHkgKE5PVCBJRSA8PSAxMSlcclxuICAgIHJhZGlvVmFsdWU6IHRlc3QoJ2lucHV0JywgZnVuY3Rpb24oaW5wdXQpIHtcclxuICAgICAgICBpbnB1dC52YWx1ZSA9ICd0JztcclxuICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcclxuICAgICAgICByZXR1cm4gaW5wdXQudmFsdWUgPT09ICd0JztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGEgc2VsZWN0ZWQtYnktZGVmYXVsdCBvcHRpb24gaGFzIGEgd29ya2luZyBzZWxlY3RlZCBwcm9wZXJ0eS5cclxuICAgIC8vIChXZWJLaXQgZGVmYXVsdHMgdG8gZmFsc2UgaW5zdGVhZCBvZiB0cnVlLCBJRSB0b28sIGlmIGl0J3MgaW4gYW4gb3B0Z3JvdXApXHJcbiAgICBvcHRTZWxlY3RlZDogb3B0aW9uLnNlbGVjdGVkLFxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBvcHRpb25zIGluc2lkZSBkaXNhYmxlZCBzZWxlY3RzIGFyZW4ndCBtYXJrZWQgYXMgZGlzYWJsZWRcclxuICAgIC8vIChXZWJLaXQgbWFya3MgdGhlbSBhcyBkaXNhYmxlZClcclxuICAgIG9wdERpc2FibGVkOiAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc2VsZWN0LmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gIW9wdGlvbi5kaXNhYmxlZDtcclxuICAgIH0oKSksXHJcbiAgICBcclxuICAgIHRleHRDb250ZW50OiBESVYudGV4dENvbnRlbnQgIT09IHVuZGVmaW5lZCxcclxuXHJcbiAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgbm9ybWFsaXplIFxcclxcbiB0byBcXG4gaW4gdGV4dGFyZWEgdmFsdWVzLFxyXG4gICAgLy8gYnV0IElFIDw9IDExIChhbmQgcG9zc2libHkgbmV3ZXIpIGRvIG5vdC5cclxuICAgIHZhbHVlTm9ybWFsaXplZDogdGVzdCgndGV4dGFyZWEnLCBmdW5jdGlvbih0ZXh0YXJlYSkge1xyXG4gICAgICAgIHRleHRhcmVhLnZhbHVlID0gJ1xcclxcbic7XHJcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnZhbHVlID09PSAnXFxuJztcclxuICAgIH0pLFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IElFMTArLCBtb2Rlcm4gYnJvd3NlcnNcclxuICAgIHNlbGVjdGVkU2VsZWN0b3I6IHRlc3QoJ3NlbGVjdCcsIGZ1bmN0aW9uKHNlbGVjdCkge1xyXG4gICAgICAgIHNlbGVjdC5pbm5lckhUTUwgPSAnPG9wdGlvbiB2YWx1ZT1cIjFcIj4xPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT1cIjJcIiBzZWxlY3RlZD4yPC9vcHRpb24+JztcclxuICAgICAgICByZXR1cm4gISFzZWxlY3QucXVlcnlTZWxlY3Rvcignb3B0aW9uW3NlbGVjdGVkXScpO1xyXG4gICAgfSlcclxufTtcclxuXHJcbi8vIFByZXZlbnQgbWVtb3J5IGxlYWtzIGluIElFXHJcbkRJViA9IGEgPSBzZWxlY3QgPSBvcHRpb24gPSBudWxsO1xyXG4iLCJ2YXIgZXhpc3RzICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXJyYXkgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnaXMvYXJyYXlMaWtlJyksXHJcbiAgICBpc05vZGVMaXN0ICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBzbGljZSAgICAgICA9IHJlcXVpcmUoJ3V0aWwvc2xpY2UnKTtcclxuXHJcbnZhciBfID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAvLyBGbGF0dGVuIHRoYXQgYWxzbyBjaGVja3MgaWYgdmFsdWUgaXMgYSBOb2RlTGlzdFxyXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oYXJyKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgdmFsdWU7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFsdWUgPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChfLmZsYXR0ZW4odmFsdWUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ29uY2F0IGZsYXQgZm9yIGEgc2luZ2xlIGFycmF5IG9mIGFycmF5c1xyXG4gICAgY29uY2F0RmxhdDogKGZ1bmN0aW9uKGNvbmNhdCkge1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obmVzdGVkQXJyYXlzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb25jYXQuYXBwbHkoW10sIG5lc3RlZEFycmF5cyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KFtdLmNvbmNhdCkpLFxyXG5cclxuICAgIHRvUHg6ICh2YWx1ZSkgPT4gdmFsdWUgKyAncHgnLFxyXG4gICAgXHJcbiAgICBwYXJzZUludDogKG51bSkgPT4gcGFyc2VJbnQobnVtLCAxMCksXHJcblxyXG4gICAgZXZlcnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWV4aXN0cyhhcnIpKSB7IHJldHVybiB0cnVlOyB9XHJcblxyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGlmICghaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICAgICAgb2JqICA9IGFyZ3NbMF0sXHJcbiAgICAgICAgICAgIGxlbiAgPSBhcmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCFvYmogfHwgbGVuIDwgMikgeyByZXR1cm4gb2JqOyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGlkeCA9IDE7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3NbaWR4XTtcclxuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN0YW5kYXJkIG1hcFxyXG4gICAgbWFwOiBmdW5jdGlvbihhcnIsIGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIEFycmF5LXByZXNlcnZpbmcgbWFwXHJcbiAgICAvLyBodHRwOi8vanNwZXJmLmNvbS9wdXNoLW1hcC12cy1pbmRleC1yZXBsYWNlbWVudC1tYXBcclxuICAgIGZhc3RtYXA6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIWFycikgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IGFyci5sZW5ndGg7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBpdGVyYXRvcihhcnJbaWR4XSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuICAgICAgICBpdGVyYXRvciA9IGl0ZXJhdG9yIHx8IChhcmcpID0+ICEhYXJnO1xyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IoYXJyW2lkeF0sIGlkeCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChhcnJbaWR4XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhbnk6IGZ1bmN0aW9uKGFyciwgaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIHJlc3VsdDsgfVxyXG5cclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0IHx8IChyZXN1bHQgPSBpdGVyYXRvcihhcnJbaWR4XSwgaWR4KSkpIHsgYnJlYWs7IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAhIXJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gcHVsbGVkIGZyb20gQU1EXHJcbiAgICB0eXBlY2FzdDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgdmFyIHI7XHJcbiAgICAgICAgaWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09ICdudWxsJykge1xyXG4gICAgICAgICAgICByID0gbnVsbDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJ3RydWUnKSB7XHJcbiAgICAgICAgICAgIHIgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodmFsID09PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIHIgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gdW5kZWZpbmVkIHx8IHZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9IGVsc2UgaWYgKHZhbCA9PT0gJycgfHwgaXNOYU4odmFsKSkge1xyXG4gICAgICAgICAgICAvLyBpc05hTignJykgcmV0dXJucyBmYWxzZVxyXG4gICAgICAgICAgICByID0gdmFsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHBhcnNlRmxvYXQobnVsbCB8fCAnJykgcmV0dXJucyBOYU5cclxuICAgICAgICAgICAgciA9IHBhcnNlRmxvYXQodmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHI7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0FycmF5KG9iaikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNsaWNlKG9iaik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYXJyLFxyXG4gICAgICAgICAgICBsZW4gPSArb2JqLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuXHJcbiAgICAgICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGFyciA9IG5ldyBBcnJheShvYmoubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGFycltpZHhdID0gb2JqW2lkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFyciA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgYXJyLnB1c2gob2JqW2tleV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQXJyYXk6IGZ1bmN0aW9uKGFyZykge1xyXG4gICAgICAgIGlmICghZXhpc3RzKGFyZykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYXJnLnNsaWNlID09PSBzbGljZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXJnLnNsaWNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChpc0FycmF5TGlrZShhcmcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzbGljZShhcmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gWyBhcmcgXTtcclxuICAgIH0sXHJcblxyXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGFyciwgaXRlbSkge1xyXG4gICAgICAgIHJldHVybiBhcnIuaW5kZXhPZihpdGVtKSAhPT0gLTE7XHJcbiAgICB9LFxyXG5cclxuICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IpIHtcclxuICAgICAgICBpZiAoIW9iaiB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIC8vIEFycmF5LWxpa2VcclxuICAgICAgICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKG9ialtpZHhdLCBpZHgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFBsYWluIG9iamVjdFxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZXJhdG9yKG9ialtwcm9wXSwgcHJvcCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc1NpemU6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgIHZhciBuYW1lO1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvYmopIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIG1lcmdlOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHNlY29uZC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEdvIHRocm91Z2ggZWFjaCBlbGVtZW50IGluIHRoZVxyXG4gICAgICAgIC8vIHNlY29uZCBhcnJheSBhbmQgYWRkIGl0IHRvIHRoZVxyXG4gICAgICAgIC8vIGZpcnN0XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtpZHhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpcnN0O1xyXG4gICAgfVxyXG59OyIsInZhciBkZWxldGVyID0gZnVuY3Rpb24oZGVsZXRhYmxlKSB7XHJcbiAgICByZXR1cm4gZGVsZXRhYmxlID8gXHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBkZWxldGUgc3RvcmVba2V5XTsgfSA6XHJcbiAgICAgICAgZnVuY3Rpb24oc3RvcmUsIGtleSkgeyBzdG9yZVtrZXldID0gdW5kZWZpbmVkOyB9O1xyXG59O1xyXG5cclxudmFyIGdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBzdG9yZSAmJiBzdG9yZVtrZXldICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5LCBmbiwgYXJnKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHN0b3JlW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICAgICAgZGVsKHN0b3JlLCBrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgYmlMZXZlbEdldHRlclNldHRlciA9IGZ1bmN0aW9uKGRlbGV0YWJsZSkge1xyXG4gICAgdmFyIHN0b3JlID0ge30sXHJcbiAgICAgICAgZGVsID0gZGVsZXRlcihkZWxldGFibGUpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaGFzOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIHZhciBoYXMxID0ga2V5MSBpbiBzdG9yZSAmJiBzdG9yZVtrZXkxXSAhPT0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBpZiAoIWhhczEgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGhhczE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBrZXkyIGluIHN0b3JlW2tleTFdICYmIHN0b3JlW2tleTFdW2tleTJdICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleTEsIGtleTIpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSBzdG9yZVtrZXkxXTtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgPyByZWYxIDogKHJlZjEgIT09IHVuZGVmaW5lZCA/IHJlZjFba2V5Ml0gOiByZWYxKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oa2V5MSwga2V5MiwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIHJlZjEgPSB0aGlzLmhhcyhrZXkxKSA/IHN0b3JlW2tleTFdIDogKHN0b3JlW2tleTFdID0ge30pO1xyXG4gICAgICAgICAgICByZWYxW2tleTJdID0gdmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1dDogZnVuY3Rpb24oa2V5MSwga2V5MiwgZm4sIGFyZykge1xyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHRoaXMuaGFzKGtleTEpID8gc3RvcmVba2V5MV0gOiAoc3RvcmVba2V5MV0gPSB7fSk7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGZuKGFyZyk7XHJcbiAgICAgICAgICAgIHJlZjFba2V5Ml0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbihrZXkxLCBrZXkyKSB7XHJcbiAgICAgICAgICAgIC8vIEVhc3kgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlbChzdG9yZSwga2V5MSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERlZXAgcmVtb3ZhbFxyXG4gICAgICAgICAgICB2YXIgcmVmMSA9IHN0b3JlW2tleTFdIHx8IChzdG9yZVtrZXkxXSA9IHt9KTtcclxuICAgICAgICAgICAgZGVsKHJlZjEsIGtleTIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGx2bCwgZGVsZXRhYmxlKSB7XHJcbiAgICByZXR1cm4gbHZsID09PSAyID8gYmlMZXZlbEdldHRlclNldHRlcihkZWxldGFibGUpIDogZ2V0dGVyU2V0dGVyKGRlbGV0YWJsZSk7XHJcbn07IiwidmFyIGNvbnN0cnVjdG9yO1xyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT4gdmFsdWUgJiYgdmFsdWUgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvcjtcclxubW9kdWxlLmV4cG9ydHMuc2V0ID0gKEQpID0+IGNvbnN0cnVjdG9yID0gRDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiArdmFsdWUubGVuZ3RoID09PSB2YWx1ZS5sZW5ndGg7XHJcbiIsInZhciBET0NVTUVOVF9GUkFHTUVOVCA9IHJlcXVpcmUoJ05PREVfVFlQRS9ET0NVTUVOVF9GUkFHTUVOVCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICByZXR1cm4gZWxlbSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLm93bmVyRG9jdW1lbnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJlxyXG4gICAgICAgIGVsZW0gIT09IGRvY3VtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmXHJcbiAgICAgICAgZWxlbS5wYXJlbnROb2RlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiZcclxuICAgICAgICBlbGVtLnBhcmVudE5vZGUubm9kZVR5cGUgIT09IERPQ1VNRU5UX0ZSQUdNRU5UICAmJlxyXG4gICAgICAgIGVsZW0ucGFyZW50Tm9kZS5pc1BhcnNlSHRtbEZyYWdtZW50ICE9PSB0cnVlO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gZmFsc2U7XHJcbiIsInZhciBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNEICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PlxyXG4gICAgaXNEKHZhbHVlKSB8fCBpc0FycmF5KHZhbHVlKSB8fCBpc05vZGVMaXN0KHZhbHVlKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICYmIHZhbHVlID09PSBkb2N1bWVudDtcclxuIiwidmFyIGlzV2luZG93ID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBFTEVNRU5UICA9IHJlcXVpcmUoJ05PREVfVFlQRS9FTEVNRU5UJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9ICh2YWx1ZSkgPT5cclxuICAgIHZhbHVlICYmICh2YWx1ZSA9PT0gZG9jdW1lbnQgfHwgaXNXaW5kb3codmFsdWUpIHx8IHZhbHVlLm5vZGVUeXBlID09PSBFTEVNRU5UKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGw7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XHJcbiIsInZhciBpc1N0cmluZyA9IHJlcXVpcmUoJ2lzL3N0cmluZycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgaWYgKCFpc1N0cmluZyh2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgdmFyIHRleHQgPSB2YWx1ZS50cmltKCk7XHJcbiAgICByZXR1cm4gKHRleHQuY2hhckF0KDApID09PSAnPCcgJiYgdGV4dC5jaGFyQXQodGV4dC5sZW5ndGggLSAxKSA9PT0gJz4nICYmIHRleHQubGVuZ3RoID49IDMpO1xyXG59OyIsIi8vIE5vZGVMaXN0IGNoZWNrLiBGb3Igb3VyIHB1cnBvc2VzLCBhIE5vZGVMaXN0IGFuZCBhbiBIVE1MQ29sbGVjdGlvbiBhcmUgdGhlIHNhbWUuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB2YWx1ZSAmJiAoXHJcbiAgICAgICAgdmFsdWUgaW5zdGFuY2VvZiBOb2RlTGlzdCB8fFxyXG4gICAgICAgIHZhbHVlIGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb25cclxuICAgICk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSAodmFsdWUpID0+IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XHJcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCAoISF2YWx1ZSAmJiB0eXBlID09PSAnb2JqZWN0Jyk7XHJcbn07IiwidmFyIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzRWxlbWVudCAgICA9IHJlcXVpcmUoJ2lzL2VsZW1lbnQnKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKHZhbCkgPT5cclxuICAgIHZhbCAmJiAoaXNTdHJpbmcodmFsKSB8fCBpc0Z1bmN0aW9uKHZhbCkgfHwgaXNFbGVtZW50KHZhbCkgfHwgaXNDb2xsZWN0aW9uKHZhbCkpOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnOyIsIm1vZHVsZS5leHBvcnRzID0gKHZhbHVlKSA9PiB2YWx1ZSAmJiB2YWx1ZSA9PT0gdmFsdWUud2luZG93O1xyXG4iLCJ2YXIgRUxFTUVOVCAgICAgICAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIERJViAgICAgICAgICAgICA9IHJlcXVpcmUoJ0RJVicpLFxyXG4gICAgLy8gU3VwcG9ydDogSUU5KywgbW9kZXJuIGJyb3dzZXJzXHJcbiAgICBtYXRjaGVzU2VsZWN0b3IgPSBESVYubWF0Y2hlcyAgICAgICAgICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubWF0Y2hlc1NlbGVjdG9yICAgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubXNNYXRjaGVzU2VsZWN0b3IgICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYubW96TWF0Y2hlc1NlbGVjdG9yICAgIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICBESVYub01hdGNoZXNTZWxlY3RvcjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0sIHNlbGVjdG9yKSA9PlxyXG4gICAgZWxlbS5ub2RlVHlwZSA9PT0gRUxFTUVOVCA/IG1hdGNoZXNTZWxlY3Rvci5jYWxsKGVsZW0sIHNlbGVjdG9yKSA6IGZhbHNlO1xyXG5cclxuLy8gUHJldmVudCBtZW1vcnkgbGVha3MgaW4gSUVcclxuRElWID0gbnVsbDtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yKSB7XHJcbiAgICBpZiAoIW9iaiB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gQXJyYXkgc3VwcG9ydFxyXG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGgsXHJcbiAgICAgICAgICAgIGl0ZW07XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgaXRlbSA9IG9ialtpZHhdO1xyXG4gICAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChpdGVtLCBpdGVtLCBpZHgpID09PSBmYWxzZSkgeyByZXR1cm47IH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPYmplY3Qgc3VwcG9ydFxyXG4gICAgdmFyIGtleSwgdmFsdWU7XHJcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICB2YWx1ZSA9IG9ialtrZXldO1xyXG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKHZhbHVlLCB2YWx1ZSwga2V5KSA9PT0gZmFsc2UpIHsgcmV0dXJuOyB9XHJcbiAgICB9XHJcbn07IiwidmFyIF8gICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICA9IHJlcXVpcmUoJ0QnKSxcclxuICAgIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgc2xpY2UgID0gcmVxdWlyZSgndXRpbC9zbGljZScpLFxyXG4gICAgZWFjaCAgID0gcmVxdWlyZSgnLi9lYWNoJyk7XHJcblxyXG52YXIgbWFwID0gZnVuY3Rpb24oYXJyLCBpdGVyYXRvcikge1xyXG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgIGlmICghYXJyLmxlbmd0aCB8fCAhaXRlcmF0b3IpIHsgcmV0dXJuIHJlc3VsdHM7IH1cclxuXHJcbiAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICBpdGVtO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICBpdGVtID0gYXJyW2lkeF07XHJcbiAgICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoaXRlbSwgaXRlbSwgaWR4KSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIF8uY29uY2F0RmxhdChyZXN1bHRzKTtcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gdGhpc1sraW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgLy8gTm8gaW5kZXgsIHJldHVybiBhbGxcclxuICAgICAgICBpZiAoIWV4aXN0cyhpbmRleCkpIHsgcmV0dXJuIHRoaXMudG9BcnJheSgpOyB9XHJcblxyXG4gICAgICAgIGluZGV4ID0gK2luZGV4O1xyXG5cclxuICAgICAgICAvLyBMb29raW5nIHRvIGdldCBhbiBpbmRleCBmcm9tIHRoZSBlbmQgb2YgdGhlIHNldFxyXG4gICAgICAgIGlmIChpbmRleCA8IDApIHsgaW5kZXggPSAodGhpcy5sZW5ndGggKyBpbmRleCk7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNbaW5kZXhdO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzLmdldChpbmRleCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzbGljZTogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xyXG4gICAgICAgIHJldHVybiBEKHNsaWNlKHRoaXMudG9BcnJheSgpLCBzdGFydCwgZW5kKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gRCh0aGlzWzBdKTtcclxuICAgIH0sXHJcblxyXG4gICAgbGFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIEQodGhpc1t0aGlzLmxlbmd0aCAtIDFdKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHNsaWNlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtYXA6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIEQobWFwKHRoaXMsIGl0ZXJhdG9yKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGVhY2g6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgZWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKGl0ZXJhdG9yKSB7XHJcbiAgICAgICAgZWFjaCh0aGlzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBvcmRlciA9IHJlcXVpcmUoJ29yZGVyJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlc3VsdHMpIHtcclxuICAgIHZhciBoYXNEdXBsaWNhdGVzID0gb3JkZXIuc29ydChyZXN1bHRzKTtcclxuICAgIGlmICghaGFzRHVwbGljYXRlcykgeyByZXR1cm4gcmVzdWx0czsgfVxyXG5cclxuICAgIHZhciBlbGVtLFxyXG4gICAgICAgIGlkeCA9IDAsXHJcbiAgICAgICAgLy8gY3JlYXRlIHRoZSBhcnJheSBoZXJlXHJcbiAgICAgICAgLy8gc28gdGhhdCBhIG5ldyBhcnJheSBpc24ndFxyXG4gICAgICAgIC8vIGNyZWF0ZWQvZGVzdHJveWVkIGV2ZXJ5IHVuaXF1ZSBjYWxsXHJcbiAgICAgICAgZHVwbGljYXRlcyA9IFtdO1xyXG5cclxuICAgIC8vIEdvIHRocm91Z2ggdGhlIGFycmF5IGFuZCBpZGVudGlmeVxyXG4gICAgLy8gdGhlIGR1cGxpY2F0ZXMgdG8gYmUgcmVtb3ZlZFxyXG4gICAgd2hpbGUgKChlbGVtID0gcmVzdWx0c1tpZHgrK10pKSB7XHJcbiAgICAgICAgaWYgKGVsZW0gPT09IHJlc3VsdHNbaWR4XSkge1xyXG4gICAgICAgICAgICBkdXBsaWNhdGVzLnB1c2goaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIHRoZSBkdXBsaWNhdGVzIGZyb20gdGhlIHJlc3VsdHNcclxuICAgIGlkeCA9IGR1cGxpY2F0ZXMubGVuZ3RoO1xyXG4gICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICByZXN1bHRzLnNwbGljZShkdXBsaWNhdGVzW2lkeF0sIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHRzO1xyXG59OyIsInZhciBfICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGV4aXN0cyAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0Z1bmN0aW9uICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgICAgPSByZXF1aXJlKCdub2RlL2lzRWxlbWVudCcpLFxyXG4gICAgbmV3bGluZXMgICAgICAgICAgICAgPSByZXF1aXJlKCdzdHJpbmcvbmV3bGluZXMnKSxcclxuICAgIFNVUFBPUlRTICAgICAgICAgICAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIGlzTm9kZU5hbWUgICAgICAgICAgID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIEZpenpsZSAgICAgICAgICAgICAgID0gcmVxdWlyZSgnRml6emxlJyksXHJcbiAgICBzYW5pdGl6ZURhdGFLZXlDYWNoZSA9IHJlcXVpcmUoJ2NhY2hlJykoKTtcclxuXHJcbnZhciBpc0RhdGFLZXkgPSAoa2V5KSA9PiAoa2V5IHx8ICcnKS5zdWJzdHIoMCwgNSkgPT09ICdkYXRhLScsXHJcblxyXG4gICAgdHJpbURhdGFLZXkgPSAoa2V5KSA9PiBrZXkuc3Vic3RyKDAsIDUpLFxyXG5cclxuICAgIHNhbml0aXplRGF0YUtleSA9IGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICAgIHJldHVybiBzYW5pdGl6ZURhdGFLZXlDYWNoZS5oYXMoa2V5KSA/XHJcbiAgICAgICAgICAgIHNhbml0aXplRGF0YUtleUNhY2hlLmdldChrZXkpIDpcclxuICAgICAgICAgICAgc2FuaXRpemVEYXRhS2V5Q2FjaGUucHV0KGtleSwgKCkgPT4gaXNEYXRhS2V5KGtleSkgPyBrZXkgOiAnZGF0YS0nICsga2V5LnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREYXRhQXR0cktleXMgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGF0dHJzID0gZWxlbS5hdHRyaWJ1dGVzLFxyXG4gICAgICAgICAgICBpZHggICA9IGF0dHJzLmxlbmd0aCxcclxuICAgICAgICAgICAga2V5cyAgPSBbXSxcclxuICAgICAgICAgICAga2V5O1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBrZXkgPSBhdHRyc1tpZHhdO1xyXG4gICAgICAgICAgICBpZiAoaXNEYXRhS2V5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ga2V5cztcclxuICAgIH07XHJcblxyXG52YXIgYm9vbEhvb2sgPSB7XHJcbiAgICBpczogKGF0dHJOYW1lKSA9PiBGaXp6bGUucGFyc2UuaXNCb29sKGF0dHJOYW1lKSxcclxuICAgIGdldDogKGVsZW0sIGF0dHJOYW1lKSA9PiBlbGVtLmhhc0F0dHJpYnV0ZShhdHRyTmFtZSkgPyBhdHRyTmFtZS50b0xvd2VyQ2FzZSgpIDogdW5kZWZpbmVkLFxyXG4gICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWx1ZSwgYXR0ck5hbWUpIHtcclxuICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBib29sZWFuIGF0dHJpYnV0ZXMgd2hlbiBzZXQgdG8gZmFsc2VcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyTmFtZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG52YXIgaG9va3MgPSB7XHJcbiAgICAgICAgdGFiaW5kZXg6IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHRhYmluZGV4KSB8fCB0YWJpbmRleCA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFiaW5kZXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0eXBlOiB7XHJcbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghU1VQUE9SVFMucmFkaW9WYWx1ZSAmJiB2YWx1ZSA9PT0gJ3JhZGlvJyAmJiBpc05vZGVOYW1lKGVsZW0sICdpbnB1dCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0dGluZyB0aGUgdHlwZSBvbiBhIHJhZGlvIGJ1dHRvbiBhZnRlciB0aGUgdmFsdWUgcmVzZXRzIHRoZSB2YWx1ZSBpbiBJRTYtOVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHZhbHVlIHRvIGRlZmF1bHQgaW4gY2FzZSB0eXBlIGlzIHNldCBhZnRlciB2YWx1ZSBkdXJpbmcgY3JlYXRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd0eXBlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0udmFsdWUgPSBvbGRWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd0eXBlJywgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWwgPSBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdsaW5lcyh2YWwpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKGVsZW0sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSB8fCAhZWxlbS5oYXNBdHRyaWJ1dGUoYXR0cikpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGlmIChib29sSG9vay5pcyhhdHRyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYm9vbEhvb2suZ2V0KGVsZW0sIGF0dHIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLmdldCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0uZ2V0KGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJldCA9IGVsZW0uZ2V0QXR0cmlidXRlKGF0dHIpO1xyXG4gICAgICAgIHJldHVybiBleGlzdHMocmV0KSA/IHJldCA6IHVuZGVmaW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0dGVycyA9IHtcclxuICAgICAgICBmb3JBdHRyOiBmdW5jdGlvbihhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoYm9vbEhvb2suaXMoYXR0cikgJiYgKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmJvb2w7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaG9va3NbYXR0cl0gJiYgaG9va3NbYXR0cl0uc2V0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0dGVycy5ob29rO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZXR0ZXJzLmVsZW07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBib29sOiBmdW5jdGlvbihlbGVtLCBhdHRyLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBib29sSG9vay5zZXQoZWxlbSwgdmFsdWUsIGF0dHIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaG9vazogZnVuY3Rpb24oZWxlbSwgYXR0ciwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaG9va3NbYXR0cl0uc2V0KGVsZW0sIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVsZW06IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGF0dHIsIHZhbHVlKTtcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZXMgPSBmdW5jdGlvbihhcnIsIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlzRm4gICA9IGlzRnVuY3Rpb24odmFsdWUpLFxyXG4gICAgICAgICAgICBpZHggICAgPSAwLFxyXG4gICAgICAgICAgICBsZW4gICAgPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICBlbGVtLFxyXG4gICAgICAgICAgICB2YWwsXHJcbiAgICAgICAgICAgIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcblxyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICB2YWwgPSBpc0ZuID8gdmFsdWUuY2FsbChlbGVtLCBpZHgsIGdldEF0dHJpYnV0ZShlbGVtLCBhdHRyKSkgOiB2YWx1ZTtcclxuICAgICAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdmFyIHNldHRlciA9IHNldHRlcnMuZm9yQXR0cihhdHRyLCB2YWx1ZSk7XHJcbiAgICAgICAgc2V0dGVyKGVsZW0sIGF0dHIsIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGFyciwgYXR0cikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnIubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHJlbW92ZUF0dHJpYnV0ZShhcnJbaWR4XSwgYXR0cik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKGVsZW0sIGF0dHIpIHtcclxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgaWYgKGhvb2tzW2F0dHJdICYmIGhvb2tzW2F0dHJdLnJlbW92ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gaG9va3NbYXR0cl0ucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoYXR0cik7XHJcbiAgICB9O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIGF0dHI6IGZ1bmN0aW9uKGF0dHIsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGF0dHIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0QXR0cmlidXRlKHRoaXNbMF0sIGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBhc3N1bWUgYW4gb2JqZWN0XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IGF0dHI7XHJcbiAgICAgICAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh0aGlzLCBhdHRyLCBhdHRyc1thdHRyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICAvLyByZW1vdmVcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVBdHRyaWJ1dGVzKHRoaXMsIGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGl0ZXJhdG9yXHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRBdHRyID0gZ2V0QXR0cmlidXRlKGVsZW0sIGF0dHIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgID0gZm4uY2FsbChlbGVtLCBpZHgsIG9sZEF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhpc3RzKHJlc3VsdCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlKGVsZW0sIGF0dHIsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gc2V0XHJcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXModGhpcywgYXR0ciwgdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUF0dHI6IGZ1bmN0aW9uKGF0dHIpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoYXR0cikpIHsgcmVtb3ZlQXR0cmlidXRlcyh0aGlzLCBhdHRyKTsgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhdHRyRGF0YTogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBtYXAgID0ge30sXHJcbiAgICAgICAgICAgICAgICBrZXlzID0gZ2V0RGF0YUF0dHJLZXlzKGZpcnN0KSxcclxuICAgICAgICAgICAgICAgIGlkeCAgPSBrZXlzLmxlbmd0aCwga2V5O1xyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIGtleSA9IGtleXNbaWR4XTtcclxuICAgICAgICAgICAgICAgIG1hcFt0cmltRGF0YUtleShrZXkpXSA9IF8udHlwZWNhc3QoZmlyc3QuZ2V0QXR0cmlidXRlKGtleSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbaWR4XS5zZXRBdHRyaWJ1dGUoc2FuaXRpemVEYXRhS2V5KGtleSksICcnICsgdmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2sgdG8gYW4gb2JqZWN0IGRlZmluaXRpb25cclxuICAgICAgICB2YXIgb2JqID0ga2V5LFxyXG4gICAgICAgICAgICBpZHggPSB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAga2V5O1xyXG4gICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICBmb3IgKGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbaWR4XS5zZXRBdHRyaWJ1dGUoc2FuaXRpemVEYXRhS2V5KGtleSksICcnICsgb2JqW2tleV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRUxFTUVOVCAgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKSxcclxuICAgIGlzQXJyYXkgICA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcbiAgICBpc1N0cmluZyAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIHNwbGl0ICAgICA9IHJlcXVpcmUoJ3N0cmluZy9zcGxpdCcpLFxyXG4gICAgaXNFbXB0eSAgID0gcmVxdWlyZSgnc3RyaW5nL2lzRW1wdHknKTtcclxuXHJcbnZhciBoYXNDbGFzcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gISFlbGVtLmNsYXNzTGlzdCAmJiBlbGVtLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW0sIG5hbWVzKSB7XHJcbiAgICAgICAgaWYgKCFlbGVtLmNsYXNzTGlzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIGxlbiA9IG5hbWVzLmxlbmd0aCxcclxuICAgICAgICAgICAgaWR4ID0gMDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBlbGVtLmNsYXNzTGlzdC5hZGQobmFtZXNbaWR4XSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVDbGFzc2VzID0gZnVuY3Rpb24oZWxlbSwgbmFtZXMpIHtcclxuICAgICAgICBpZiAoIWVsZW0uY2xhc3NMaXN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgbGVuID0gbmFtZXMubGVuZ3RoLFxyXG4gICAgICAgICAgICBpZHggPSAwO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZShuYW1lc1tpZHhdKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHRvZ2dsZUNsYXNzZXMgPSBmdW5jdGlvbihlbGVtLCBuYW1lcykge1xyXG4gICAgICAgIGlmICghZWxlbS5jbGFzc0xpc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHZhciBsZW4gPSBuYW1lcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCA9IDA7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QudG9nZ2xlKG5hbWVzW2lkeF0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG52YXIgX2RvQW55RWxlbXNIYXZlQ2xhc3MgPSBmdW5jdGlvbihlbGVtcywgbmFtZSkge1xyXG4gICAgICAgIHZhciBlbGVtSWR4ID0gZWxlbXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1zW2VsZW1JZHhdLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgIGlmIChoYXNDbGFzcyhlbGVtc1tlbGVtSWR4XSwgbmFtZSkpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBfYWRkQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KG5hbWVzKSkgeyBuYW1lcyA9IF8udG9BcnJheShuYW1lcyk7IH1cclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICBhZGRDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfcmVtb3ZlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KG5hbWVzKSkgeyBuYW1lcyA9IF8udG9BcnJheShuYW1lcyk7IH1cclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICByZW1vdmVDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfcmVtb3ZlQWxsQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zKSB7XHJcbiAgICAgICAgdmFyIGVsZW1JZHggPSBlbGVtcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGVsZW1JZHgtLSkge1xyXG4gICAgICAgICAgICBpZiAoZWxlbXNbZWxlbUlkeF0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgZWxlbXNbZWxlbUlkeF0uY2xhc3NOYW1lID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfdG9nZ2xlQ2xhc3NlcyA9IGZ1bmN0aW9uKGVsZW1zLCBuYW1lcykge1xyXG4gICAgICAgIC8vIFN1cHBvcnQgYXJyYXktbGlrZSBvYmplY3RzXHJcbiAgICAgICAgaWYgKCFpc0FycmF5KG5hbWVzKSkgeyBuYW1lcyA9IF8udG9BcnJheShuYW1lcyk7IH1cclxuICAgICAgICB2YXIgZWxlbUlkeCA9IGVsZW1zLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoZWxlbUlkeC0tKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtc1tlbGVtSWR4XS5ub2RlVHlwZSAhPT0gRUxFTUVOVCkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICB0b2dnbGVDbGFzc2VzKGVsZW1zW2VsZW1JZHhdLCBuYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBoYXNDbGFzczogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQgfHwgIXRoaXMubGVuZ3RoIHx8IGlzRW1wdHkobmFtZSkgfHwgIW5hbWUubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcbiAgICAgICAgcmV0dXJuIF9kb0FueUVsZW1zSGF2ZUNsYXNzKHRoaXMsIG5hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRDbGFzczogZnVuY3Rpb24obmFtZXMpIHtcclxuICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWUpIHx8ICFuYW1lLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgX2FkZENsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXM7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBuYW1lcyA9IHNwbGl0KG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgX2FkZENsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmVDbGFzczogZnVuY3Rpb24obmFtZXMpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBfcmVtb3ZlQWxsQ2xhc3Nlcyh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNBcnJheShuYW1lcykpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lcykgfHwgIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgX3JlbW92ZUNsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNTdHJpbmcobmFtZXMpKSB7XHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXM7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGggfHwgaXNFbXB0eShuYW1lKSB8fCAhbmFtZS5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBuYW1lcyA9IHNwbGl0KG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIW5hbWVzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgX3JlbW92ZUNsYXNzZXModGhpcywgbmFtZXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWVzLCBzaG91bGRBZGQpIHtcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCB8fCBpc0VtcHR5KG5hbWVzKSB8fCAhbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIG5hbWVzID0gc3BsaXQobmFtZXMpO1xyXG4gICAgICAgIGlmICghbmFtZXMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIGlmIChzaG91bGRBZGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBfdG9nZ2xlQ2xhc3Nlcyh0aGlzLCBuYW1lcyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChzaG91bGRBZGQpIHtcclxuICAgICAgICAgICAgX2FkZENsYXNzZXModGhpcywgbmFtZXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIF9yZW1vdmVDbGFzc2VzKHRoaXMsIG5hbWVzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc0F0dGFjaGVkID0gcmVxdWlyZSgnaXMvYXR0YWNoZWQnKSxcclxuICAgIGlzRWxlbWVudCAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0RvY3VtZW50ID0gcmVxdWlyZSgnaXMvZG9jdW1lbnQnKSxcclxuICAgIGlzV2luZG93ICAgPSByZXF1aXJlKCdpcy93aW5kb3cnKSxcclxuICAgIGlzU3RyaW5nICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIGlzTnVtYmVyICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzQm9vbGVhbiAgPSByZXF1aXJlKCdpcy9ib29sZWFuJyksXHJcbiAgICBpc09iamVjdCAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIERPQ1VNRU5UICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlQnKSxcclxuICAgIFJFR0VYICAgICAgPSByZXF1aXJlKCdSRUdFWCcpO1xyXG5cclxudmFyIHN3YXBNZWFzdXJlRGlzcGxheVNldHRpbmdzID0ge1xyXG4gICAgZGlzcGxheTogICAgJ2Jsb2NrJyxcclxuICAgIHBvc2l0aW9uOiAgICdhYnNvbHV0ZScsXHJcbiAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xyXG59O1xyXG5cclxudmFyIGdldERvY3VtZW50RGltZW5zaW9uID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgLy8gRWl0aGVyIHNjcm9sbFtXaWR0aC9IZWlnaHRdIG9yIG9mZnNldFtXaWR0aC9IZWlnaHRdIG9yXHJcbiAgICAvLyBjbGllbnRbV2lkdGgvSGVpZ2h0XSwgd2hpY2hldmVyIGlzIGdyZWF0ZXN0XHJcbiAgICB2YXIgZG9jID0gZWxlbS5kb2N1bWVudEVsZW1lbnQ7XHJcbiAgICByZXR1cm4gTWF0aC5tYXgoXHJcbiAgICAgICAgZWxlbS5ib2R5WydzY3JvbGwnICsgbmFtZV0sXHJcbiAgICAgICAgZWxlbS5ib2R5WydvZmZzZXQnICsgbmFtZV0sXHJcblxyXG4gICAgICAgIGRvY1snc2Nyb2xsJyArIG5hbWVdLFxyXG4gICAgICAgIGRvY1snb2Zmc2V0JyArIG5hbWVdLFxyXG5cclxuICAgICAgICBkb2NbJ2NsaWVudCcgKyBuYW1lXVxyXG4gICAgKTtcclxufTtcclxuXHJcbnZhciBoaWRlID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH0sXHJcbiAgICBzaG93ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIGVsZW0uc3R5bGUuZGlzcGxheSA9ICcnO1xyXG4gICAgfSxcclxuXHJcbiAgICBjc3NTd2FwID0gZnVuY3Rpb24oZWxlbSwgb3B0aW9ucywgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgb2xkID0ge307XHJcblxyXG4gICAgICAgIC8vIFJlbWVtYmVyIHRoZSBvbGQgdmFsdWVzLCBhbmQgaW5zZXJ0IHRoZSBuZXcgb25lc1xyXG4gICAgICAgIHZhciBuYW1lO1xyXG4gICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIG9sZFtuYW1lXSA9IGVsZW0uc3R5bGVbbmFtZV07XHJcbiAgICAgICAgICAgIGVsZW0uc3R5bGVbbmFtZV0gPSBvcHRpb25zW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJldCA9IGNhbGxiYWNrKGVsZW0pO1xyXG5cclxuICAgICAgICAvLyBSZXZlcnQgdGhlIG9sZCB2YWx1ZXNcclxuICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICBlbGVtLnN0eWxlW25hbWVdID0gb2xkW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQXZvaWRzIGFuICdJbGxlZ2FsIEludm9jYXRpb24nIGVycm9yIChDaHJvbWUpXHJcbiAgICAvLyBBdm9pZHMgYSAnVHlwZUVycm9yOiBBcmd1bWVudCAxIG9mIFdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIGRvZXMgbm90IGltcGxlbWVudCBpbnRlcmZhY2UgRWxlbWVudCcgZXJyb3IgKEZpcmVmb3gpXHJcbiAgICBnZXRDb21wdXRlZFN0eWxlID0gKGVsZW0pID0+XHJcbiAgICAgICAgaXNFbGVtZW50KGVsZW0pICYmICFpc1dpbmRvdyhlbGVtKSAmJiAhaXNEb2N1bWVudChlbGVtKSA/IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pIDogbnVsbCxcclxuXHJcbiAgICBfd2lkdGggPSB7XHJcbiAgICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGVsZW0ubm9kZVR5cGUgPT09IERPQ1VNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RG9jdW1lbnREaW1lbnNpb24oZWxlbSwgJ1dpZHRoJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGVsZW0ub2Zmc2V0V2lkdGg7XHJcbiAgICAgICAgICAgIGlmICh3aWR0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MsIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnd2lkdGgnKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRXaWR0aE9ySGVpZ2h0KGVsZW0sICd3aWR0aCcpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS53aWR0aCA9IGlzTnVtYmVyKHZhbCkgPyBfLnRvUHgodmFsIDwgMCA/IDAgOiB2YWwpIDogdmFsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX2hlaWdodCA9IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgaWYgKGlzV2luZG93KGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbS5ub2RlVHlwZSA9PT0gRE9DVU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXREb2N1bWVudERpbWVuc2lvbihlbGVtLCAnSGVpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBlbGVtLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgICAgaWYgKGhlaWdodCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoUkVHRVguaXNOb25lT3JUYWJsZShjb21wdXRlZFN0eWxlLmRpc3BsYXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNzc1N3YXAoZWxlbSwgc3dhcE1lYXN1cmVEaXNwbGF5U2V0dGluZ3MsIGZ1bmN0aW9uKCkgeyByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0V2lkdGhPckhlaWdodChlbGVtLCAnaGVpZ2h0Jyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihlbGVtLCB2YWwpIHtcclxuICAgICAgICAgICAgZWxlbS5zdHlsZS5oZWlnaHQgPSBpc051bWJlcih2YWwpID8gXy50b1B4KHZhbCA8IDAgPyAwIDogdmFsKSA6IHZhbDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxudmFyIGdldFdpZHRoT3JIZWlnaHQgPSBmdW5jdGlvbihlbGVtLCBuYW1lKSB7XHJcblxyXG4gICAgLy8gU3RhcnQgd2l0aCBvZmZzZXQgcHJvcGVydHksIHdoaWNoIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGJvcmRlci1ib3ggdmFsdWVcclxuICAgIHZhciB2YWx1ZUlzQm9yZGVyQm94ID0gdHJ1ZSxcclxuICAgICAgICB2YWwgPSAobmFtZSA9PT0gJ3dpZHRoJykgPyBlbGVtLm9mZnNldFdpZHRoIDogZWxlbS5vZmZzZXRIZWlnaHQsXHJcbiAgICAgICAgc3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKSxcclxuICAgICAgICBpc0JvcmRlckJveCA9IHN0eWxlcy5ib3hTaXppbmcgPT09ICdib3JkZXItYm94JztcclxuXHJcbiAgICAvLyBzb21lIG5vbi1odG1sIGVsZW1lbnRzIHJldHVybiB1bmRlZmluZWQgZm9yIG9mZnNldFdpZHRoLCBzbyBjaGVjayBmb3IgbnVsbC91bmRlZmluZWRcclxuICAgIC8vIHN2ZyAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY0OTI4NVxyXG4gICAgLy8gTWF0aE1MIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NDkxNjY4XHJcbiAgICBpZiAodmFsIDw9IDAgfHwgIWV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgLy8gRmFsbCBiYWNrIHRvIGNvbXB1dGVkIHRoZW4gdW5jb21wdXRlZCBjc3MgaWYgbmVjZXNzYXJ5XHJcbiAgICAgICAgdmFsID0gY3VyQ3NzKGVsZW0sIG5hbWUsIHN0eWxlcyk7XHJcbiAgICAgICAgaWYgKHZhbCA8IDAgfHwgIXZhbCkgeyB2YWwgPSBlbGVtLnN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgICAgIC8vIENvbXB1dGVkIHVuaXQgaXMgbm90IHBpeGVscy4gU3RvcCBoZXJlIGFuZCByZXR1cm4uXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHZhbCkpIHsgcmV0dXJuIHZhbDsgfVxyXG5cclxuICAgICAgICAvLyB3ZSBuZWVkIHRoZSBjaGVjayBmb3Igc3R5bGUgaW4gY2FzZSBhIGJyb3dzZXIgd2hpY2ggcmV0dXJucyB1bnJlbGlhYmxlIHZhbHVlc1xyXG4gICAgICAgIC8vIGZvciBnZXRDb21wdXRlZFN0eWxlIHNpbGVudGx5IGZhbGxzIGJhY2sgdG8gdGhlIHJlbGlhYmxlIGVsZW0uc3R5bGVcclxuICAgICAgICB2YWx1ZUlzQm9yZGVyQm94ID0gaXNCb3JkZXJCb3ggJiYgdmFsID09PSBzdHlsZXNbbmFtZV07XHJcblxyXG4gICAgICAgIC8vIE5vcm1hbGl6ZSAnJywgYXV0bywgYW5kIHByZXBhcmUgZm9yIGV4dHJhXHJcbiAgICAgICAgdmFsID0gcGFyc2VGbG9hdCh2YWwpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXNlIHRoZSBhY3RpdmUgYm94LXNpemluZyBtb2RlbCB0byBhZGQvc3VidHJhY3QgaXJyZWxldmFudCBzdHlsZXNcclxuICAgIHJldHVybiBfLnRvUHgoXHJcbiAgICAgICAgdmFsICsgYXVnbWVudEJvcmRlckJveFdpZHRoT3JIZWlnaHQoXHJcbiAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgIGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcsXHJcbiAgICAgICAgICAgIHZhbHVlSXNCb3JkZXJCb3gsXHJcbiAgICAgICAgICAgIHN0eWxlc1xyXG4gICAgICAgIClcclxuICAgICk7XHJcbn07XHJcblxyXG52YXIgQ1NTX0VYUEFORCA9IHNwbGl0KCdUb3B8UmlnaHR8Qm90dG9tfExlZnQnKTtcclxudmFyIGF1Z21lbnRCb3JkZXJCb3hXaWR0aE9ySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgZXh0cmEsIGlzQm9yZGVyQm94LCBzdHlsZXMpIHtcclxuICAgIHZhciB2YWwgPSAwLFxyXG4gICAgICAgIC8vIElmIHdlIGFscmVhZHkgaGF2ZSB0aGUgcmlnaHQgbWVhc3VyZW1lbnQsIGF2b2lkIGF1Z21lbnRhdGlvblxyXG4gICAgICAgIGlkeCA9IChleHRyYSA9PT0gKGlzQm9yZGVyQm94ID8gJ2JvcmRlcicgOiAnY29udGVudCcpKSA/XHJcbiAgICAgICAgICAgIDQgOlxyXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UgaW5pdGlhbGl6ZSBmb3IgaG9yaXpvbnRhbCBvciB2ZXJ0aWNhbCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIChuYW1lID09PSAnd2lkdGgnKSA/XHJcbiAgICAgICAgICAgIDEgOlxyXG4gICAgICAgICAgICAwLFxyXG4gICAgICAgIHR5cGUsXHJcbiAgICAgICAgLy8gUHVsbGVkIG91dCBvZiB0aGUgbG9vcCB0byByZWR1Y2Ugc3RyaW5nIGNvbXBhcmlzb25zXHJcbiAgICAgICAgZXh0cmFJc01hcmdpbiAgPSAoZXh0cmEgPT09ICdtYXJnaW4nKSxcclxuICAgICAgICBleHRyYUlzQ29udGVudCA9ICghZXh0cmFJc01hcmdpbiAmJiBleHRyYSA9PT0gJ2NvbnRlbnQnKSxcclxuICAgICAgICBleHRyYUlzUGFkZGluZyA9ICghZXh0cmFJc01hcmdpbiAmJiAhZXh0cmFJc0NvbnRlbnQgJiYgZXh0cmEgPT09ICdwYWRkaW5nJyk7XHJcblxyXG4gICAgZm9yICg7IGlkeCA8IDQ7IGlkeCArPSAyKSB7XHJcbiAgICAgICAgdHlwZSA9IENTU19FWFBBTkRbaWR4XTtcclxuXHJcbiAgICAgICAgLy8gYm90aCBib3ggbW9kZWxzIGV4Y2x1ZGUgbWFyZ2luLCBzbyBhZGQgaXQgaWYgd2Ugd2FudCBpdFxyXG4gICAgICAgIGlmIChleHRyYUlzTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIHZhbCArPSBfLnBhcnNlSW50KHN0eWxlc1tleHRyYSArIHR5cGVdKSB8fCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQm9yZGVyQm94KSB7XHJcblxyXG4gICAgICAgICAgICAvLyBib3JkZXItYm94IGluY2x1ZGVzIHBhZGRpbmcsIHNvIHJlbW92ZSBpdCBpZiB3ZSB3YW50IGNvbnRlbnRcclxuICAgICAgICAgICAgaWYgKGV4dHJhSXNDb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YWwgLT0gXy5wYXJzZUludChzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGF0IHRoaXMgcG9pbnQsIGV4dHJhIGlzbid0IGJvcmRlciBub3IgbWFyZ2luLCBzbyByZW1vdmUgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmICghZXh0cmFJc01hcmdpbikge1xyXG4gICAgICAgICAgICAgICAgdmFsIC09IF8ucGFyc2VJbnQoc3R5bGVzWydib3JkZXInICsgdHlwZSArICdXaWR0aCddKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBjb250ZW50LCBzbyBhZGQgcGFkZGluZ1xyXG4gICAgICAgICAgICB2YWwgKz0gXy5wYXJzZUludChzdHlsZXNbJ3BhZGRpbmcnICsgdHlwZV0pIHx8IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50LCBleHRyYSBpc24ndCBjb250ZW50IG5vciBwYWRkaW5nLCBzbyBhZGQgYm9yZGVyXHJcbiAgICAgICAgICAgIGlmIChleHRyYUlzUGFkZGluZykge1xyXG4gICAgICAgICAgICAgICAgdmFsICs9IF8ucGFyc2VJbnQoc3R5bGVzWydib3JkZXInICsgdHlwZV0pIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHZhbDtcclxufTtcclxuXHJcbnZhciBjdXJDc3MgPSBmdW5jdGlvbihlbGVtLCBuYW1lLCBjb21wdXRlZCkge1xyXG4gICAgdmFyIHN0eWxlID0gZWxlbS5zdHlsZSxcclxuICAgICAgICBzdHlsZXMgPSBjb21wdXRlZCB8fCBnZXRDb21wdXRlZFN0eWxlKGVsZW0pLFxyXG4gICAgICAgIHJldCA9IHN0eWxlcyA/IHN0eWxlcy5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpIHx8IHN0eWxlc1tuYW1lXSA6IHVuZGVmaW5lZDtcclxuXHJcbiAgICAvLyBBdm9pZCBzZXR0aW5nIHJldCB0byBlbXB0eSBzdHJpbmcgaGVyZVxyXG4gICAgLy8gc28gd2UgZG9uJ3QgZGVmYXVsdCB0byBhdXRvXHJcbiAgICBpZiAoIWV4aXN0cyhyZXQpICYmIHN0eWxlICYmIHN0eWxlW25hbWVdKSB7IHJldCA9IHN0eWxlW25hbWVdOyB9XHJcblxyXG4gICAgLy8gRnJvbSB0aGUgaGFjayBieSBEZWFuIEVkd2FyZHNcclxuICAgIC8vIGh0dHA6Ly9lcmlrLmVhZS5uZXQvYXJjaGl2ZXMvMjAwNy8wNy8yNy8xOC41NC4xNS8jY29tbWVudC0xMDIyOTFcclxuXHJcbiAgICBpZiAoc3R5bGVzKSB7XHJcbiAgICAgICAgaWYgKHJldCA9PT0gJycgJiYgIWlzQXR0YWNoZWQoZWxlbSkpIHtcclxuICAgICAgICAgICAgcmV0ID0gZWxlbS5zdHlsZVtuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHdlJ3JlIG5vdCBkZWFsaW5nIHdpdGggYSByZWd1bGFyIHBpeGVsIG51bWJlclxyXG4gICAgICAgIC8vIGJ1dCBhIG51bWJlciB0aGF0IGhhcyBhIHdlaXJkIGVuZGluZywgd2UgbmVlZCB0byBjb252ZXJ0IGl0IHRvIHBpeGVsc1xyXG4gICAgICAgIC8vIGJ1dCBub3QgcG9zaXRpb24gY3NzIGF0dHJpYnV0ZXMsIGFzIHRob3NlIGFyZSBwcm9wb3J0aW9uYWwgdG8gdGhlIHBhcmVudCBlbGVtZW50IGluc3RlYWRcclxuICAgICAgICAvLyBhbmQgd2UgY2FuJ3QgbWVhc3VyZSB0aGUgcGFyZW50IGluc3RlYWQgYmVjYXVzZSBpdCBtaWdodCB0cmlnZ2VyIGEgJ3N0YWNraW5nIGRvbGxzJyBwcm9ibGVtXHJcbiAgICAgICAgaWYgKFJFR0VYLm51bU5vdFB4KHJldCkgJiYgIVJFR0VYLnBvc2l0aW9uKG5hbWUpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1lbWJlciB0aGUgb3JpZ2luYWwgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gc3R5bGUubGVmdCxcclxuICAgICAgICAgICAgICAgIHJzID0gZWxlbS5ydW50aW1lU3R5bGUsXHJcbiAgICAgICAgICAgICAgICByc0xlZnQgPSBycyAmJiBycy5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgLy8gUHV0IGluIHRoZSBuZXcgdmFsdWVzIHRvIGdldCBhIGNvbXB1dGVkIHZhbHVlIG91dFxyXG4gICAgICAgICAgICBpZiAocnNMZWZ0KSB7IHJzLmxlZnQgPSBlbGVtLmN1cnJlbnRTdHlsZS5sZWZ0OyB9XHJcblxyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gKG5hbWUgPT09ICdmb250U2l6ZScpID8gJzFlbScgOiByZXQ7XHJcbiAgICAgICAgICAgIHJldCA9IF8udG9QeChzdHlsZS5waXhlbExlZnQpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmV2ZXJ0IHRoZSBjaGFuZ2VkIHZhbHVlc1xyXG4gICAgICAgICAgICBzdHlsZS5sZWZ0ID0gbGVmdDtcclxuICAgICAgICAgICAgaWYgKHJzTGVmdCkgeyBycy5sZWZ0ID0gcnNMZWZ0OyB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXQgPT09IHVuZGVmaW5lZCA/IHJldCA6IHJldCArICcnIHx8ICdhdXRvJztcclxufTtcclxuXHJcbnZhciBub3JtYWxpemVDc3NLZXkgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICByZXR1cm4gUkVHRVguY2FtZWxDYXNlKG5hbWUpO1xyXG59O1xyXG5cclxudmFyIHNldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSwgdmFsdWUpIHtcclxuICAgIG5hbWUgPSBub3JtYWxpemVDc3NLZXkobmFtZSk7XHJcbiAgICBlbGVtLnN0eWxlW25hbWVdID0gKHZhbHVlID09PSArdmFsdWUpID8gXy50b1B4KHZhbHVlKSA6IHZhbHVlO1xyXG59O1xyXG5cclxudmFyIGdldFN0eWxlID0gZnVuY3Rpb24oZWxlbSwgbmFtZSkge1xyXG4gICAgbmFtZSA9IG5vcm1hbGl6ZUNzc0tleShuYW1lKTtcclxuICAgIHJldHVybiBnZXRDb21wdXRlZFN0eWxlKGVsZW0pW25hbWVdO1xyXG59O1xyXG5cclxudmFyIGlzSGlkZGVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICAvLyBTdGFuZGFyZDpcclxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0hUTUxFbGVtZW50Lm9mZnNldFBhcmVudFxyXG4gICAgcmV0dXJuIGVsZW0ub2Zmc2V0UGFyZW50ID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgIC8vIFN1cHBvcnQ6IE9wZXJhIDw9IDEyLjEyXHJcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcG9ydHMgb2Zmc2V0V2lkdGhzIGFuZCBvZmZzZXRIZWlnaHRzIGxlc3MgdGhhbiB6ZXJvIG9uIHNvbWUgZWxlbWVudHNcclxuICAgICAgICAgICAgZWxlbS5vZmZzZXRXaWR0aCA8PSAwICYmIGVsZW0ub2Zmc2V0SGVpZ2h0IDw9IDAgfHxcclxuICAgICAgICAgICAgLy8gRmFsbGJhY2tcclxuICAgICAgICAgICAgKChlbGVtLnN0eWxlICYmIGVsZW0uc3R5bGUuZGlzcGxheSkgPyBlbGVtLnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyA6IGZhbHNlKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3VyQ3NzOiBjdXJDc3MsXHJcbiAgICB3aWR0aDogIF93aWR0aCxcclxuICAgIGhlaWdodDogX2hlaWdodCxcclxuXHJcbiAgICBmbjoge1xyXG4gICAgICAgIGNzczogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0U3R5bGUodGhpc1tpZHhdLCBuYW1lLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IDAsIGxlbmd0aCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFN0eWxlKHRoaXNbaWR4XSwga2V5LCBvYmpba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FycmF5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXQgPSB7fSxcclxuICAgICAgICAgICAgICAgICAgICBpZHggPSBhcnIubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpZHgpIHsgcmV0dXJuIHJldDsgfSAvLyByZXR1cm4gZWFybHlcclxuXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGFycltpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNTdHJpbmcodmFsdWUpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldFt2YWx1ZV0gPSBnZXRTdHlsZShmaXJzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgaGlkZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaG93OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBzaG93KTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKHN0YXRlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Jvb2xlYW4oc3RhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgPyB0aGlzLnNob3coKSA6IHRoaXMuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBpc0hpZGRlbihlbGVtKSA/IHNob3coZWxlbSkgOiBoaWRlKGVsZW0pKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBjYWNoZSAgICAgPSByZXF1aXJlKCdjYWNoZScpKDIsIHRydWUpLFxyXG4gICAgaXNTdHJpbmcgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgPSByZXF1aXJlKCdpcy9hcnJheScpLFxyXG4gICAgaXNFbGVtZW50ID0gcmVxdWlyZSgnaXMvZWxlbWVudCcpLFxyXG4gICAgQUNDRVNTT1IgID0gJ19fRF9pZF9fICcsXHJcbiAgICB1bmlxdWVJZCAgPSByZXF1aXJlKCd1dGlsL3VuaXF1ZUlkJykuc2VlZChEYXRlLm5vdygpKSxcclxuXHJcbiAgICBnZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICByZXR1cm4gZWxlbSA/IGVsZW1bQUNDRVNTT1JdIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3JTZXRJZCA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IChpZCA9IGVsZW1bQUNDRVNTT1JdKSkgeyByZXR1cm4gaWQ7IH1cclxuICAgICAgICBlbGVtW0FDQ0VTU09SXSA9IChpZCA9IHVuaXF1ZUlkKCkpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0QWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXkpIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaGFzRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmhhcyhpZCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldERhdGEgPSBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gZ2V0T3JTZXRJZChlbGVtKTtcclxuICAgICAgICByZXR1cm4gY2FjaGUuc2V0KGlkLCBrZXksIHZhbHVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsRGF0YSA9IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICB2YXIgaWQ7XHJcbiAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlRGF0YSA9IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgIHZhciBpZDtcclxuICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyByZXR1cm47IH1cclxuICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICB9O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICByZW1vdmU6IChlbGVtLCBzdHIpID0+XHJcbiAgICAgICAgc3RyID09PSB1bmRlZmluZWQgPyByZW1vdmVBbGxEYXRhKGVsZW0pIDogcmVtb3ZlRGF0YShlbGVtLCBzdHIpLFxyXG5cclxuICAgIEQ6IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihlbGVtLCBrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0RGF0YShlbGVtLCBrZXksIHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldERhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvYmplY3QgcGFzc2VkXHJcbiAgICAgICAgICAgICAgICB2YXIgbWFwID0ga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTtcclxuICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gbWFwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KGlkLCBrZXksIG1hcFtrZXldKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQoZWxlbSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRBbGxEYXRhKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBoYXNEYXRhOiAoZWxlbSkgPT5cclxuICAgICAgICAgICAgaXNFbGVtZW50KGVsZW0pID8gaGFzRGF0YShlbGVtKSA6IHRoaXMsXHJcblxyXG4gICAgICAgIHJlbW92ZURhdGE6IGZ1bmN0aW9uKGVsZW0sIGtleSkge1xyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHNpbmdsZSBrZXlcclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZURhdGEoZWxlbSwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbXVsdGlwbGUga2V5c1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0ga2V5O1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkLCBhcnJheVtpZHhdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlbW92ZUFsbERhdGEoZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZm46IHtcclxuICAgICAgICBkYXRhOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgZGF0YVxyXG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0IHx8ICEoaWQgPSBnZXRJZChmaXJzdCkpKSB7IHJldHVybjsgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQga2V5XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3QgfHwgIShpZCA9IGdldElkKGZpcnN0KSkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldChpZCwga2V5KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXQgdmFsdWVzIGZyb20gaGFzaCBtYXBcclxuICAgICAgICAgICAgICAgIHZhciBtYXAgPSBrZXksXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQoaWQsIGtleSwgbWFwW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBrZXkncyB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW07XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGVsZW0pKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlkID0gZ2V0T3JTZXRJZCh0aGlzW2lkeF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLnNldChpZCwga2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVtb3ZlRGF0YTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFsbCBkYXRhXHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tpZHhdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGlkID0gZ2V0SWQoZWxlbSkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUucmVtb3ZlKGlkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgc2luZ2xlIGtleVxyXG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gdmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoaWQgPSBnZXRJZChlbGVtKSkpIHsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmUoaWQsIGtleSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGtleXNcclxuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyYXkgPSB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtSWR4ID0gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbSxcclxuICAgICAgICAgICAgICAgICAgICBpZDtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChlbGVtSWR4LS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtID0gdGhpc1tlbGVtSWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShpZCA9IGdldElkKGVsZW0pKSkgeyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJJZHggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFycklkeC0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlLnJlbW92ZShpZCwgYXJyYXlbYXJySWR4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgaXNOdW1iZXIgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGNzcyAgICAgID0gcmVxdWlyZSgnLi9jc3MnKTtcclxuXHJcbnZhciBnZXRJbm5lcldpZHRoID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciB3aWR0aCA9IHBhcnNlRmxvYXQoY3NzLndpZHRoLmdldChlbGVtKSkgfHwgMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdpZHRoICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ0xlZnQnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1JpZ2h0JykpIHx8IDApO1xyXG4gICAgfSxcclxuICAgIGdldElubmVySGVpZ2h0ID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUZsb2F0KGNzcy5oZWlnaHQuZ2V0KGVsZW0pKSB8fCAwO1xyXG5cclxuICAgICAgICByZXR1cm4gaGVpZ2h0ICtcclxuICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAncGFkZGluZ1RvcCcpKSB8fCAwKSArXHJcbiAgICAgICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdwYWRkaW5nQm90dG9tJykpIHx8IDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRlcldpZHRoID0gZnVuY3Rpb24oZWxlbSwgd2l0aE1hcmdpbikge1xyXG4gICAgICAgIHZhciB3aWR0aCA9IGdldElubmVyV2lkdGgoZWxlbSk7XHJcblxyXG4gICAgICAgIGlmICh3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIHdpZHRoICs9IChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ21hcmdpbkxlZnQnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luUmlnaHQnKSkgfHwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gd2lkdGggK1xyXG4gICAgICAgICAgICAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdib3JkZXJMZWZ0V2lkdGgnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnYm9yZGVyUmlnaHRXaWR0aCcpKSB8fCAwKTtcclxuICAgIH0sXHJcbiAgICBnZXRPdXRlckhlaWdodCA9IGZ1bmN0aW9uKGVsZW0sIHdpdGhNYXJnaW4pIHtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gZ2V0SW5uZXJIZWlnaHQoZWxlbSk7XHJcblxyXG4gICAgICAgIGlmICh3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgICAgIGhlaWdodCArPSAoXy5wYXJzZUludChjc3MuY3VyQ3NzKGVsZW0sICdtYXJnaW5Ub3AnKSkgfHwgMCkgK1xyXG4gICAgICAgICAgICAgICAgKF8ucGFyc2VJbnQoY3NzLmN1ckNzcyhlbGVtLCAnbWFyZ2luQm90dG9tJykpIHx8IDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGhlaWdodCArXHJcbiAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlclRvcFdpZHRoJykpIHx8IDApICtcclxuICAgICAgICAgICAgICAgIChfLnBhcnNlSW50KGNzcy5jdXJDc3MoZWxlbSwgJ2JvcmRlckJvdHRvbVdpZHRoJykpIHx8IDApO1xyXG4gICAgfTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICB3aWR0aDogZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgICAgaWYgKGlzTnVtYmVyKHZhbCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgY3NzLndpZHRoLnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3Mud2lkdGguZ2V0KGZpcnN0KSB8fCAwKTtcclxuICAgIH0sXHJcblxyXG4gICAgaGVpZ2h0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICBpZiAoaXNOdW1iZXIodmFsKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICBjc3MuaGVpZ2h0LnNldChmaXJzdCwgdmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChjc3MuaGVpZ2h0LmdldChmaXJzdCkgfHwgMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVyV2lkdGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0SW5uZXJXaWR0aChmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlubmVySGVpZ2h0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldElubmVySGVpZ2h0KGZpcnN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgb3V0ZXJXaWR0aDogZnVuY3Rpb24od2l0aE1hcmdpbikge1xyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICYmIHdpdGhNYXJnaW4gPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldE91dGVyV2lkdGgoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICB9LFxyXG5cclxuICAgIG91dGVySGVpZ2h0OiBmdW5jdGlvbih3aXRoTWFyZ2luKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggJiYgd2l0aE1hcmdpbiA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0T3V0ZXJIZWlnaHQoZmlyc3QsICEhd2l0aE1hcmdpbik7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBoYW5kbGVycyA9IHt9O1xyXG5cclxudmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24obmFtZSwgdHlwZSwgZmlsdGVyKSB7XHJcbiAgICBoYW5kbGVyc1tuYW1lXSA9IHtcclxuICAgICAgICBldmVudDogdHlwZSxcclxuICAgICAgICBmaWx0ZXI6IGZpbHRlcixcclxuICAgICAgICB3cmFwOiBmdW5jdGlvbihmbikge1xyXG4gICAgICAgICAgICByZXR1cm4gd3JhcHBlcihuYW1lLCBmbik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciB3cmFwcGVyID0gZnVuY3Rpb24obmFtZSwgZm4pIHtcclxuICAgIGlmICghZm4pIHsgcmV0dXJuIGZuOyB9XHJcblxyXG4gICAgdmFyIGtleSA9ICdfX2RjZV8nICsgbmFtZTtcclxuICAgIGlmIChmbltrZXldKSB7IHJldHVybiBmbltrZXldOyB9XHJcblxyXG4gICAgcmV0dXJuIGZuW2tleV0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gaGFuZGxlcnNbbmFtZV0uZmlsdGVyKGUpO1xyXG4gICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTsgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcbnJlZ2lzdGVyKCdsZWZ0LWNsaWNrJywgJ2NsaWNrJywgKGUpID0+IGUud2hpY2ggPT09IDEgJiYgIWUubWV0YUtleSAmJiAhZS5jdHJsS2V5KTtcclxucmVnaXN0ZXIoJ21pZGRsZS1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAyICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcbnJlZ2lzdGVyKCdyaWdodC1jbGljaycsICdjbGljaycsIChlKSA9PiBlLndoaWNoID09PSAzICYmICFlLm1ldGFLZXkgJiYgIWUuY3RybEtleSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHJlZ2lzdGVyOiByZWdpc3RlcixcclxuICAgIGhhbmRsZXJzOiBoYW5kbGVyc1xyXG59OyIsInZhciBjcm9zc3ZlbnQgPSByZXF1aXJlKCdjcm9zc3ZlbnQnKSxcclxuICAgIGV4aXN0cyAgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpLFxyXG4gICAgbWF0Y2hlcyAgID0gcmVxdWlyZSgnbWF0Y2hlc1NlbGVjdG9yJyksXHJcbiAgICBkZWxlZ2F0ZXMgPSB7fTtcclxuXHJcbi8vIHRoaXMgbWV0aG9kIGNhY2hlcyBkZWxlZ2F0ZXMgc28gdGhhdCAub2ZmKCkgd29ya3Mgc2VhbWxlc3NseVxyXG52YXIgZGVsZWdhdGUgPSBmdW5jdGlvbihyb290LCBzZWxlY3RvciwgZm4pIHtcclxuICAgIGlmIChkZWxlZ2F0ZXNbZm4uX2RkXSkgeyByZXR1cm4gZGVsZWdhdGVzW2ZuLl9kZF07IH1cclxuXHJcbiAgICB2YXIgaWQgPSBmbi5fZGQgPSBEYXRlLm5vdygpO1xyXG4gICAgcmV0dXJuIGRlbGVnYXRlc1tpZF0gPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgd2hpbGUgKGVsICYmIGVsICE9PSByb290KSB7XHJcbiAgICAgICAgICAgIGlmIChtYXRjaGVzKGVsLCBzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgZXZlbnRlZCA9IGZ1bmN0aW9uKG1ldGhvZCwgZWwsIHR5cGUsIHNlbGVjdG9yLCBmbikge1xyXG4gICAgaWYgKCFleGlzdHMoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgbWV0aG9kKGVsLCB0eXBlLCBmbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1ldGhvZChlbCwgdHlwZSwgZGVsZWdhdGUoZWwsIHNlbGVjdG9yLCBmbikpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvbjogICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmFkZCksXHJcbiAgICBvZmY6ICAgICBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LnJlbW92ZSksXHJcbiAgICB0cmlnZ2VyOiBldmVudGVkLmJpbmQobnVsbCwgY3Jvc3N2ZW50LmZhYnJpY2F0ZSlcclxufTsiLCJ2YXIgXyAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgZGVsZWdhdGUgICA9IHJlcXVpcmUoJy4vZGVsZWdhdGUnKSxcclxuICAgIGN1c3RvbSAgICAgPSByZXF1aXJlKCcuL2N1c3RvbScpO1xyXG5cclxudmFyIGV2ZW50ZXIgPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbih0eXBlcywgZmlsdGVyLCBmbikge1xyXG4gICAgICAgIHZhciB0eXBlbGlzdCA9IHR5cGVzLnNwbGl0KCcgJyk7XHJcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xyXG4gICAgICAgICAgICBmbiA9IGZpbHRlcjtcclxuICAgICAgICAgICAgZmlsdGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgXy5lYWNoKHR5cGVsaXN0LCBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IGN1c3RvbS5oYW5kbGVyc1t0eXBlXTtcclxuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kKGVsZW0sIGhhbmRsZXIuZXZlbnQsIGZpbHRlciwgaGFuZGxlci53cmFwKGZuKSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZChlbGVtLCB0eXBlLCBmaWx0ZXIsIGZuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIG9uOiAgICAgIGV2ZW50ZXIoZGVsZWdhdGUub24pLFxyXG4gICAgb2ZmOiAgICAgZXZlbnRlcihkZWxlZ2F0ZS5vZmYpLFxyXG4gICAgdHJpZ2dlcjogZXZlbnRlcihkZWxlZ2F0ZS50cmlnZ2VyKVxyXG59OyIsInZhciBfICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vRCcpLFxyXG4gICAgZXhpc3RzICAgICAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzRCAgICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc0h0bWwgICAgICAgICA9IHJlcXVpcmUoJ2lzL2h0bWwnKSxcclxuICAgIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc05vZGVMaXN0ICAgICA9IHJlcXVpcmUoJ2lzL25vZGVMaXN0JyksXHJcbiAgICBpc051bWJlciAgICAgICA9IHJlcXVpcmUoJ2lzL251bWJlcicpLFxyXG4gICAgaXNGdW5jdGlvbiAgICAgPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNDb2xsZWN0aW9uICAgPSByZXF1aXJlKCdpcy9jb2xsZWN0aW9uJyksXHJcbiAgICBpc0QgICAgICAgICAgICA9IHJlcXVpcmUoJ2lzL0QnKSxcclxuICAgIGlzV2luZG93ICAgICAgID0gcmVxdWlyZSgnaXMvd2luZG93JyksXHJcbiAgICBpc0RvY3VtZW50ICAgICA9IHJlcXVpcmUoJ2lzL2RvY3VtZW50JyksXHJcbiAgICBzZWxlY3RvckZpbHRlciA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgdW5pcXVlICAgICAgICAgPSByZXF1aXJlKCcuL2FycmF5L3VuaXF1ZScpLFxyXG4gICAgb3JkZXIgICAgICAgICAgPSByZXF1aXJlKCcuLi9vcmRlcicpLFxyXG4gICAgZGF0YSAgICAgICAgICAgPSByZXF1aXJlKCcuL2RhdGEnKSxcclxuICAgIHBhcnNlciAgICAgICAgID0gcmVxdWlyZSgncGFyc2VyJyk7XHJcblxyXG52YXIgZW1wdHkgPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aDtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuZ3RoOyBpZHgrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGVsZW0gPSBhcnJbaWR4XSxcclxuICAgICAgICAgICAgICAgIGRlc2NlbmRhbnRzID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCcqJyksXHJcbiAgICAgICAgICAgICAgICBpID0gZGVzY2VuZGFudHMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgZGVzYztcclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgZGVzYyA9IGRlc2NlbmRhbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5yZW1vdmUoZGVzYyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmUgPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbSwgcGFyZW50O1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0gJiYgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIGRhdGEucmVtb3ZlKGVsZW0pO1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBkZXRhY2ggPSBmdW5jdGlvbihhcnIpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCwgbGVuZ3RoID0gYXJyLmxlbmd0aCxcclxuICAgICAgICAgICAgZWxlbSwgcGFyZW50O1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBhcnJbaWR4XTtcclxuICAgICAgICAgICAgaWYgKGVsZW0gJiYgKHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChlbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmUgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZW0uY2xvbmVOb2RlKHRydWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdHJpbmdUb0ZyYWcgPSBmdW5jdGlvbihzdHIpIHtcclxuICAgICAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBmcmFnLnRleHRDb250ZW50ID0gc3RyO1xyXG4gICAgICAgIHJldHVybiBmcmFnO1xyXG4gICAgfSxcclxuXHJcbiAgICBhcHBlbmRQcmVwZW5kRnVuYyA9IGZ1bmN0aW9uKGQsIGZuLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goZCwgZnVuY3Rpb24oZWxlbSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZWxlbS5pbm5lckhUTUwpO1xyXG5cclxuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cyhyZXN1bHQpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNIdG1sKGVsZW0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtKGVsZW0sIHBhcnNlcihlbGVtKSwgcGVuZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwZW5kZXIoZWxlbSwgc3RyaW5nVG9GcmFnKHJlc3VsdCkpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc0VsZW1lbnQocmVzdWx0KSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHBlbmRlcihlbGVtLCByZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc05vZGVMaXN0KHJlc3VsdCkgfHwgaXNEKHJlc3VsdCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kQXJyYXlUb0VsZW0oZWxlbSwgcmVzdWx0LCBwZW5kZXIpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5ID0gZnVuY3Rpb24oYXJyT25lLCBhcnJUd28sIHBlbmRlcikge1xyXG4gICAgICAgIHZhciBpZHggPSAwLCBsZW5ndGggPSBhcnJPbmUubGVuZ3RoO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW5ndGg7IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gMCwgbGVuID0gYXJyVHdvLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcGVuZGVyKGFyck9uZVtpZHhdLCBhcnJUd29baV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSA9IGZ1bmN0aW9uKGFyciwgZWxlbSwgcGVuZGVyKSB7XHJcbiAgICAgICAgXy5lYWNoKGFyciwgZnVuY3Rpb24oYXJyRWxlbSkge1xyXG4gICAgICAgICAgICBwZW5kZXIoYXJyRWxlbSwgZWxlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYXBwZW5kUHJlcGVuZEFycmF5VG9FbGVtID0gZnVuY3Rpb24oZWxlbSwgYXJyLCBwZW5kZXIpIHtcclxuICAgICAgICBfLmVhY2goYXJyLCBmdW5jdGlvbihhcnJFbGVtKSB7XHJcbiAgICAgICAgICAgIHBlbmRlcihlbGVtLCBhcnJFbGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgYXBwZW5kID0gZnVuY3Rpb24oYmFzZSwgZWxlbSkge1xyXG4gICAgICAgIGlmICghYmFzZSB8fCAhZWxlbSB8fCAhaXNFbGVtZW50KGVsZW0pKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGJhc2UuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICB9LFxyXG4gICAgcHJlcGVuZCA9IGZ1bmN0aW9uKGJhc2UsIGVsZW0pIHtcclxuICAgICAgICBpZiAoIWJhc2UgfHwgIWVsZW0gfHwgIWlzRWxlbWVudChlbGVtKSkgeyByZXR1cm47IH1cclxuICAgICAgICBiYXNlLmluc2VydEJlZm9yZShlbGVtLCBiYXNlLmZpcnN0Q2hpbGQpO1xyXG4gICAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYXBwZW5kICA6IGFwcGVuZCxcclxuICAgIHByZXBlbmQgOiBwcmVwZW5kLFxyXG5cclxuICAgIGZuOiB7XHJcbiAgICAgICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5mYXN0bWFwKHRoaXMuc2xpY2UoKSwgKGVsZW0pID0+IGNsb25lKGVsZW0pKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBhcHBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyKHZhbHVlKSwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgc3RyaW5nVG9GcmFnKHZhbHVlKSwgYXBwZW5kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZygnJyArIHZhbHVlKSwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEZ1bmModGhpcywgZm4sIGFwcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRQcmVwZW5kRWxlbVRvQXJyYXkodGhpcywgZWxlbSwgYXBwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgYXJyLCBhcHBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBiZWZvcmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gdGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgIGlmICghcGFyZW50KSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5zZXJ0QmVmb3JlOiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBEKHRhcmdldClbMF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh0YXJnZXQsIHRoaXMubmV4dFNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzWzBdO1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgICAgICAgICBpZiAoIXBhcmVudCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzRWxlbWVudChlbGVtZW50KSB8fCBpc1N0cmluZyhlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IEQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc0QoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldC5uZXh0U2libGluZyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaW5zZXJ0QWZ0ZXI6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgIHRhcmdldCA9IEQodGFyZ2V0KVswXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYXBwZW5kVG86IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgaWYgKGlzRChkKSkge1xyXG4gICAgICAgICAgICAgICAgZC5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgdmFyIG9iaiA9IGQ7XHJcbiAgICAgICAgICAgIEQob2JqKS5hcHBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHByZXBlbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpc0h0bWwodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZE1lcmdlQXJyYXkodGhpcywgcGFyc2VyKHZhbHVlKSwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIHN0cmluZ1RvRnJhZyh2YWx1ZSksIHByZXBlbmQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc051bWJlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRFbGVtVG9BcnJheSh0aGlzLCBzdHJpbmdUb0ZyYWcoJycgKyB2YWx1ZSksIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRGdW5jKHRoaXMsIGZuLCBwcmVwZW5kKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kUHJlcGVuZEVsZW1Ub0FycmF5KHRoaXMsIGVsZW0sIHByZXBlbmQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcnIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFByZXBlbmRNZXJnZUFycmF5KHRoaXMsIGFyciwgcHJlcGVuZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcHJlcGVuZFRvOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0QoZCkpIHtcclxuICAgICAgICAgICAgICAgIGQucHJlcGVuZCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gZDtcclxuICAgICAgICAgICAgRChvYmopLnByZXBlbmQodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgZW1wdHkodGhpcyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGFkZDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgLy8gU3RyaW5nIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtcyA9IHVuaXF1ZShcclxuICAgICAgICAgICAgICAgICAgICBbXS5jb25jYXQodGhpcy5nZXQoKSwgRChzZWxlY3RvcikuZ2V0KCkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgb3JkZXIuc29ydChlbGVtcyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gRChlbGVtcyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFycmF5IG9mIGVsZW1lbnRzXHJcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIF8udG9BcnJheShhcnIpKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTaW5nbGUgZWxlbWVudFxyXG4gICAgICAgICAgICBpZiAoaXNXaW5kb3coc2VsZWN0b3IpIHx8IGlzRG9jdW1lbnQoc2VsZWN0b3IpIHx8IGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbXMgPSB1bmlxdWUoXHJcbiAgICAgICAgICAgICAgICAgICAgW10uY29uY2F0KHRoaXMuZ2V0KCksIFsgZWxlbSBdKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIG9yZGVyLnNvcnQoZWxlbXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEQoZWxlbXMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgICAgICByZXR1cm4gRCh0aGlzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlKGFycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgcmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBkZXRhY2g6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3JGaWx0ZXIodGhpcywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgZGV0YWNoKGFycik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICAgICAgZGV0YWNoKHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICA9IHJlcXVpcmUoJy4uL0QnKSxcclxuICAgIGV4aXN0cyAgICAgPSByZXF1aXJlKCdpcy9leGlzdHMnKSxcclxuICAgIGlzQXR0YWNoZWQgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc09iamVjdCAgID0gcmVxdWlyZSgnaXMvb2JqZWN0JyksXHJcbiAgICBpc05vZGVOYW1lID0gcmVxdWlyZSgnbm9kZS9pc05hbWUnKSxcclxuICAgIERPQ19FTEVNICAgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG52YXIgZ2V0UG9zaXRpb24gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogZWxlbS5vZmZzZXRUb3AgfHwgMCxcclxuICAgICAgICBsZWZ0OiBlbGVtLm9mZnNldExlZnQgfHwgMFxyXG4gICAgfTtcclxufTtcclxuXHJcbnZhciBnZXRPZmZzZXQgPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICB2YXIgcmVjdCA9IGlzQXR0YWNoZWQoZWxlbSkgPyBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDoge307XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6ICAocmVjdC50b3AgICsgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3ApICB8fCAwLFxyXG4gICAgICAgIGxlZnQ6IChyZWN0LmxlZnQgKyBkb2N1bWVudC5ib2R5LnNjcm9sbExlZnQpIHx8IDBcclxuICAgIH07XHJcbn07XHJcblxyXG52YXIgc2V0T2Zmc2V0ID0gZnVuY3Rpb24oZWxlbSwgaWR4LCBwb3MpIHtcclxuICAgIHZhciBwb3NpdGlvbiA9IGVsZW0uc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycsXHJcbiAgICAgICAgcHJvcHMgICAgPSB7fTtcclxuXHJcbiAgICAvLyBzZXQgcG9zaXRpb24gZmlyc3QsIGluLWNhc2UgdG9wL2xlZnQgYXJlIHNldCBldmVuIG9uIHN0YXRpYyBlbGVtXHJcbiAgICBpZiAocG9zaXRpb24gPT09ICdzdGF0aWMnKSB7IGVsZW0uc3R5bGUucG9zaXRpb24gPSAncmVsYXRpdmUnOyB9XHJcblxyXG4gICAgdmFyIGN1ck9mZnNldCAgICAgICAgID0gZ2V0T2Zmc2V0KGVsZW0pLFxyXG4gICAgICAgIGN1ckNTU1RvcCAgICAgICAgID0gZWxlbS5zdHlsZS50b3AsXHJcbiAgICAgICAgY3VyQ1NTTGVmdCAgICAgICAgPSBlbGVtLnN0eWxlLmxlZnQsXHJcbiAgICAgICAgY2FsY3VsYXRlUG9zaXRpb24gPSAocG9zaXRpb24gPT09ICdhYnNvbHV0ZScgfHwgcG9zaXRpb24gPT09ICdmaXhlZCcpICYmIChjdXJDU1NUb3AgPT09ICdhdXRvJyB8fCBjdXJDU1NMZWZ0ID09PSAnYXV0bycpO1xyXG5cclxuICAgIGlmIChpc0Z1bmN0aW9uKHBvcykpIHtcclxuICAgICAgICBwb3MgPSBwb3MuY2FsbChlbGVtLCBpZHgsIGN1ck9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGN1clRvcCwgY3VyTGVmdDtcclxuICAgIC8vIG5lZWQgdG8gYmUgYWJsZSB0byBjYWxjdWxhdGUgcG9zaXRpb24gaWYgZWl0aGVyIHRvcCBvciBsZWZ0IGlzIGF1dG8gYW5kIHBvc2l0aW9uIGlzIGVpdGhlciBhYnNvbHV0ZSBvciBmaXhlZFxyXG4gICAgaWYgKGNhbGN1bGF0ZVBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIGN1clBvc2l0aW9uID0gZ2V0UG9zaXRpb24oZWxlbSk7XHJcbiAgICAgICAgY3VyVG9wICA9IGN1clBvc2l0aW9uLnRvcDtcclxuICAgICAgICBjdXJMZWZ0ID0gY3VyUG9zaXRpb24ubGVmdDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3VyVG9wICA9IHBhcnNlRmxvYXQoY3VyQ1NTVG9wKSAgfHwgMDtcclxuICAgICAgICBjdXJMZWZ0ID0gcGFyc2VGbG9hdChjdXJDU1NMZWZ0KSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChleGlzdHMocG9zLnRvcCkpICB7IHByb3BzLnRvcCAgPSAocG9zLnRvcCAgLSBjdXJPZmZzZXQudG9wKSAgKyBjdXJUb3A7ICB9XHJcbiAgICBpZiAoZXhpc3RzKHBvcy5sZWZ0KSkgeyBwcm9wcy5sZWZ0ID0gKHBvcy5sZWZ0IC0gY3VyT2Zmc2V0LmxlZnQpICsgY3VyTGVmdDsgfVxyXG5cclxuICAgIGVsZW0uc3R5bGUudG9wICA9IF8udG9QeChwcm9wcy50b3ApO1xyXG4gICAgZWxlbS5zdHlsZS5sZWZ0ID0gXy50b1B4KHByb3BzLmxlZnQpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZmlyc3QgPSB0aGlzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRQb3NpdGlvbihmaXJzdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9mZnNldDogZnVuY3Rpb24ocG9zT3JJdGVyYXRvcikge1xyXG4gICAgXHJcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmaXJzdCA9IHRoaXNbMF07XHJcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXQoZmlyc3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ocG9zT3JJdGVyYXRvcikgfHwgaXNPYmplY3QocG9zT3JJdGVyYXRvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PiBzZXRPZmZzZXQoZWxlbSwgaWR4LCBwb3NPckl0ZXJhdG9yKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBvZmZzZXRQYXJlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLm1hcCh0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgRE9DX0VMRU07XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiAoIWlzTm9kZU5hbWUob2Zmc2V0UGFyZW50LCAnaHRtbCcpICYmIChvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gfHwgJ3N0YXRpYycpID09PSAnc3RhdGljJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgRE9DX0VMRU07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnaXMvZnVuY3Rpb24nKSxcclxuICAgIHNwbGl0ICAgICAgPSByZXF1aXJlKCd1dGlsL3NwbGl0JyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIFRFWFQgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvVEVYVCcpLFxyXG4gICAgQ09NTUVOVCAgICA9IHJlcXVpcmUoJ05PREVfVFlQRS9DT01NRU5UJyksXHJcbiAgICBBVFRSSUJVVEUgID0gcmVxdWlyZSgnTk9ERV9UWVBFL0FUVFJJQlVURScpLFxyXG4gICAgUkVHRVggICAgICA9IHJlcXVpcmUoJ1JFR0VYJyk7XHJcblxyXG52YXIgcHJvcEZpeCA9IHNwbGl0KCd0YWJJbmRleHxyZWFkT25seXxjbGFzc05hbWV8bWF4TGVuZ3RofGNlbGxTcGFjaW5nfGNlbGxQYWRkaW5nfHJvd1NwYW58Y29sU3Bhbnx1c2VNYXB8ZnJhbWVCb3JkZXJ8Y29udGVudEVkaXRhYmxlJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBzdHIpIHtcclxuICAgICAgICBvYmpbc3RyLnRvTG93ZXJDYXNlKCldID0gc3RyO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7XHJcbiAgICAgICAgJ2Zvcic6ICAgJ2h0bWxGb3InLFxyXG4gICAgICAgICdjbGFzcyc6ICdjbGFzc05hbWUnXHJcbiAgICB9KTtcclxuXHJcbnZhciBwcm9wSG9va3MgPSB7XHJcbiAgICBzcmM6IFNVUFBPUlRTLmhyZWZOb3JtYWxpemVkID8ge30gOiB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgnc3JjJywgNCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBocmVmOiBTVVBQT1JUUy5ocmVmTm9ybWFsaXplZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoJ2hyZWYnLCA0KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFN1cHBvcnQ6IFNhZmFyaSwgSUU5K1xyXG4gICAgLy8gbWlzLXJlcG9ydHMgdGhlIGRlZmF1bHQgc2VsZWN0ZWQgcHJvcGVydHkgb2YgYW4gb3B0aW9uXHJcbiAgICAvLyBBY2Nlc3NpbmcgdGhlIHBhcmVudCdzIHNlbGVjdGVkSW5kZXggcHJvcGVydHkgZml4ZXMgaXRcclxuICAgIHNlbGVjdGVkOiBTVVBQT1JUUy5vcHRTZWxlY3RlZCA/IHt9IDoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlLFxyXG4gICAgICAgICAgICAgICAgZml4O1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgICAgICAgZml4ID0gcGFyZW50LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgaXQgYWxzbyB3b3JrcyB3aXRoIG9wdGdyb3Vwcywgc2VlICM1NzAxXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXggPSBwYXJlbnQucGFyZW50Tm9kZS5zZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgdGFiSW5kZXg6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgLy8gZWxlbS50YWJJbmRleCBkb2Vzbid0IGFsd2F5cyByZXR1cm4gdGhlIGNvcnJlY3QgdmFsdWUgd2hlbiBpdCBoYXNuJ3QgYmVlbiBleHBsaWNpdGx5IHNldFxyXG4gICAgICAgICAgICAvLyBodHRwOi8vZmx1aWRwcm9qZWN0Lm9yZy9ibG9nLzIwMDgvMDEvMDkvZ2V0dGluZy1zZXR0aW5nLWFuZC1yZW1vdmluZy10YWJpbmRleC12YWx1ZXMtd2l0aC1qYXZhc2NyaXB0L1xyXG4gICAgICAgICAgICAvLyBVc2UgcHJvcGVyIGF0dHJpYnV0ZSByZXRyaWV2YWwoIzEyMDcyKVxyXG4gICAgICAgICAgICB2YXIgdGFiaW5kZXggPSBlbGVtLmdldEF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YWJpbmRleCkgeyByZXR1cm4gXy5wYXJzZUludCh0YWJpbmRleCk7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBub2RlTmFtZSA9IGVsZW0ubm9kZU5hbWU7XHJcbiAgICAgICAgICAgIHJldHVybiAoUkVHRVguaXNGb2N1c2FibGUobm9kZU5hbWUpIHx8IChSRUdFWC5pc0NsaWNrYWJsZShub2RlTmFtZSkgJiYgZWxlbS5ocmVmKSkgPyAwIDogLTE7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxudmFyIGdldE9yU2V0UHJvcCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIHZhbHVlKSB7XHJcbiAgICB2YXIgbm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xyXG5cclxuICAgIC8vIGRvbid0IGdldC9zZXQgcHJvcGVydGllcyBvbiB0ZXh0LCBjb21tZW50IGFuZCBhdHRyaWJ1dGUgbm9kZXNcclxuICAgIGlmICghZWxlbSB8fCBub2RlVHlwZSA9PT0gVEVYVCB8fCBub2RlVHlwZSA9PT0gQ09NTUVOVCB8fCBub2RlVHlwZSA9PT0gQVRUUklCVVRFKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpeCBuYW1lIGFuZCBhdHRhY2ggaG9va3NcclxuICAgIG5hbWUgPSBwcm9wRml4W25hbWVdIHx8IG5hbWU7XHJcbiAgICB2YXIgaG9va3MgPSBwcm9wSG9va3NbbmFtZV07XHJcblxyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIGhvb2tzICYmICgnc2V0JyBpbiBob29rcykgJiYgKHJlc3VsdCA9IGhvb2tzLnNldChlbGVtLCB2YWx1ZSwgbmFtZSkpICE9PSB1bmRlZmluZWQgP1xyXG4gICAgICAgICAgICByZXN1bHQgOlxyXG4gICAgICAgICAgICAoZWxlbVtuYW1lXSA9IHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gaG9va3MgJiYgKCdnZXQnIGluIGhvb2tzKSAmJiAocmVzdWx0ID0gaG9va3MuZ2V0KGVsZW0sIG5hbWUpKSAhPT0gbnVsbCA/XHJcbiAgICAgICAgcmVzdWx0IDpcclxuICAgICAgICBlbGVtW25hbWVdO1xyXG59O1xyXG5cclxuZXhwb3J0cy5mbiA9IHtcclxuICAgIHByb3A6IGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgaXNTdHJpbmcocHJvcCkpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgaWYgKCFmaXJzdCkgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRPclNldFByb3AoZmlyc3QsIHByb3ApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHByb3ApKSB7XHJcbiAgICAgICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZuID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKGVsZW0sIGlkeCwgZ2V0T3JTZXRQcm9wKGVsZW0sIHByb3ApKTtcclxuICAgICAgICAgICAgICAgICAgICBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBnZXRPclNldFByb3AoZWxlbSwgcHJvcCwgdmFsdWUpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZVByb3A6IGZ1bmN0aW9uKHByb3ApIHtcclxuICAgICAgICBpZiAoIWlzU3RyaW5nKHByb3ApKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciBuYW1lID0gcHJvcEZpeFtwcm9wXSB8fCBwcm9wO1xyXG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcywgZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICBkZWxldGUgZWxlbVtuYW1lXTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIGlzU3RyaW5nID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBleGlzdHMgICA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxudmFyIGNvZXJjZU51bSA9ICh2YWx1ZSkgPT5cclxuICAgIC8vIEl0cyBhIG51bWJlciEgfHwgMCB0byBhdm9pZCBOYU4gKGFzIE5hTidzIGEgbnVtYmVyKVxyXG4gICAgK3ZhbHVlID09PSB2YWx1ZSA/ICh2YWx1ZSB8fCAwKSA6XHJcbiAgICAvLyBBdm9pZCBOYU4gYWdhaW5cclxuICAgIGlzU3RyaW5nKHZhbHVlKSA/ICgrdmFsdWUgfHwgMCkgOlxyXG4gICAgLy8gRGVmYXVsdCB0byB6ZXJvXHJcbiAgICAwO1xyXG5cclxudmFyIHByb3RlY3QgPSBmdW5jdGlvbihjb250ZXh0LCB2YWwsIGNhbGxiYWNrKSB7XHJcbiAgICB2YXIgZWxlbSA9IGNvbnRleHRbMF07XHJcbiAgICBpZiAoIWVsZW0gJiYgIWV4aXN0cyh2YWwpKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICBpZiAoIWVsZW0pIHsgcmV0dXJuIGNvbnRleHQ7IH1cclxuXHJcbiAgICByZXR1cm4gY2FsbGJhY2soY29udGV4dCwgZWxlbSwgdmFsKTtcclxufTtcclxuXHJcbnZhciBoYW5kbGVyID0gZnVuY3Rpb24oYXR0cmlidXRlKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oY29udGV4dCwgZWxlbSwgdmFsKSB7XHJcbiAgICAgICAgaWYgKGV4aXN0cyh2YWwpKSB7XHJcbiAgICAgICAgICAgIGVsZW1bYXR0cmlidXRlXSA9IGNvZXJjZU51bSh2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtW2F0dHJpYnV0ZV07XHJcbiAgICB9O1xyXG59O1xyXG5cclxudmFyIHNjcm9sbFRvcCA9IGhhbmRsZXIoJ3Njcm9sbFRvcCcpO1xyXG52YXIgc2Nyb2xsTGVmdCA9IGhhbmRsZXIoJ3Njcm9sbExlZnQnKTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBzY3JvbGxMZWZ0OiBmdW5jdGlvbih2YWwpIHtcclxuICAgICAgICByZXR1cm4gcHJvdGVjdCh0aGlzLCB2YWwsIHNjcm9sbExlZnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzY3JvbGxUb3A6IGZ1bmN0aW9uKHZhbCkge1xyXG4gICAgICAgIHJldHVybiBwcm90ZWN0KHRoaXMsIHZhbCwgc2Nyb2xsVG9wKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc1N0cmluZyAgICAgPSByZXF1aXJlKCdpcy9zdHJpbmcnKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHF1YWxpZmllcikge1xyXG4gICAgLy8gRWFybHkgcmV0dXJuLCBubyBxdWFsaWZpZXIuIEV2ZXJ5dGhpbmcgbWF0Y2hlc1xyXG4gICAgaWYgKCFxdWFsaWZpZXIpIHsgcmV0dXJuIGFycjsgfVxyXG5cclxuICAgIC8vIEZ1bmN0aW9uXHJcbiAgICBpZiAoaXNGdW5jdGlvbihxdWFsaWZpZXIpKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgcXVhbGlmaWVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBFbGVtZW50XHJcbiAgICBpZiAocXVhbGlmaWVyLm5vZGVUeXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IGVsZW0gPT09IHF1YWxpZmllcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2VsZWN0b3JcclxuICAgIGlmIChpc1N0cmluZyhxdWFsaWZpZXIpKSB7XHJcbiAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHF1YWxpZmllcik7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKGFyciwgKGVsZW0pID0+IGlzLm1hdGNoKGVsZW0pKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBcnJheSBxdWFsaWZpZXJcclxuICAgIHJldHVybiBfLmZpbHRlcihhcnIsIChlbGVtKSA9PiBfLmNvbnRhaW5zKHF1YWxpZmllciwgZWxlbSkpO1xyXG59O1xyXG4iLCJ2YXIgXyAgICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgaXNTZWxlY3RvciAgID0gcmVxdWlyZSgnaXMvc2VsZWN0b3InKSxcclxuICAgIGlzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJ2lzL2NvbGxlY3Rpb24nKSxcclxuICAgIGlzRnVuY3Rpb24gICA9IHJlcXVpcmUoJ2lzL2Z1bmN0aW9uJyksXHJcbiAgICBpc0VsZW1lbnQgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc05vZGVMaXN0ICAgPSByZXF1aXJlKCdpcy9ub2RlTGlzdCcpLFxyXG4gICAgaXNBcnJheSAgICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzU3RyaW5nICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNEICAgICAgICAgID0gcmVxdWlyZSgnaXMvRCcpLFxyXG4gICAgb3JkZXIgICAgICAgID0gcmVxdWlyZSgnb3JkZXInKSxcclxuICAgIEZpenpsZSAgICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpO1xyXG5cclxuLyoqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufEVsZW1lbnR8Tm9kZUxpc3R8QXJyYXl8RH0gc2VsZWN0b3JcclxuICogQHBhcmFtIHtEfSBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHtFbGVtZW50W119XHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG52YXIgZmluZFdpdGhpbiA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAvLyBGYWlsIGZhc3RcclxuICAgIGlmICghY29udGV4dC5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XHJcblxyXG4gICAgdmFyIHF1ZXJ5LCBkZXNjZW5kYW50cywgcmVzdWx0cztcclxuXHJcbiAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc05vZGVMaXN0KHNlbGVjdG9yKSB8fCBpc0FycmF5KHNlbGVjdG9yKSB8fCBpc0Qoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgLy8gQ29udmVydCBzZWxlY3RvciB0byBhbiBhcnJheSBvZiBlbGVtZW50c1xyXG4gICAgICAgIHNlbGVjdG9yID0gaXNFbGVtZW50KHNlbGVjdG9yKSA/IFsgc2VsZWN0b3IgXSA6IHNlbGVjdG9yO1xyXG5cclxuICAgICAgICBkZXNjZW5kYW50cyA9IF8uZmxhdHRlbihfLm1hcChjb250ZXh0LCAoZWxlbSkgPT4gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCcqJykpKTtcclxuICAgICAgICByZXN1bHRzID0gXy5maWx0ZXIoZGVzY2VuZGFudHMsIChkZXNjZW5kYW50KSA9PiBfLmNvbnRhaW5zKHNlbGVjdG9yLCBkZXNjZW5kYW50KSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXJ5ID0gRml6emxlLnF1ZXJ5KHNlbGVjdG9yKTtcclxuICAgICAgICByZXN1bHRzID0gcXVlcnkuZXhlYyhjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0cztcclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBoYXM6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICAgIGlmICghaXNTZWxlY3Rvcih0YXJnZXQpKSB7IHJldHVybiB0aGlzOyB9XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXRzID0gdGhpcy5maW5kKHRhcmdldCksXHJcbiAgICAgICAgICAgIGlkeCxcclxuICAgICAgICAgICAgbGVuID0gdGFyZ2V0cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLmZpbHRlcih0aGlzLCBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3JkZXIuY29udGFpbnMoZWxlbSwgdGFyZ2V0c1tpZHhdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXM6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKGlzU3RyaW5nKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIEZpenpsZS5pcyhzZWxlY3RvcikuYW55KHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzQ29sbGVjdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGFyciA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZXJhdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueSh0aGlzLCAoZWxlbSwgaWR4KSA9PiAhIWl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHNlbGVjdG9yO1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkodGhpcywgKGVsZW0pID0+IGVsZW0gPT09IGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmFsbGJhY2tcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vdDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIHRoaXM7IH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpcyA9IEZpenpsZS5pcyhzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgaXMubm90KHRoaXMpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gXy50b0FycmF5KHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gIV8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSwgaWR4KSA9PiAhaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgpKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRWxlbWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzZWxlY3RvcjtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gZWxlbSAhPT0gY29udGV4dClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbmQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgaWYgKCFpc1NlbGVjdG9yKHNlbGVjdG9yKSkgeyByZXR1cm4gdGhpczsgfVxyXG5cclxuICAgICAgICB2YXIgcmVzdWx0ID0gZmluZFdpdGhpbihzZWxlY3RvciwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBvcmRlci5zb3J0KHJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLm1lcmdlKEQoKSwgcmVzdWx0KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlcjogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHsgcmV0dXJuIEQoKTsgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGlzID0gRml6emxlLmlzKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoXHJcbiAgICAgICAgICAgICAgICBfLmZpbHRlcih0aGlzLCAoZWxlbSkgPT4gaXMubWF0Y2goZWxlbSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNDb2xsZWN0aW9uKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IF8uY29udGFpbnMoYXJyLCBlbGVtKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0VsZW1lbnQoc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0pID0+IGVsZW0gPT09IGNvbnRleHQpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oc2VsZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGVja2VyID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICAgICAgXy5maWx0ZXIodGhpcywgKGVsZW0sIGlkeCkgPT4gY2hlY2tlci5jYWxsKGVsZW0sIGVsZW0sIGlkeCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmYWxsYmFja1xyXG4gICAgICAgIHJldHVybiBEKCk7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJ18nKSxcclxuICAgIEQgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnRCcpLFxyXG4gICAgRUxFTUVOVCAgICAgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgRE9DVU1FTlQgICAgICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRE9DVU1FTlQnKSxcclxuICAgIERPQ1VNRU5UX0ZSQUdNRU5UID0gcmVxdWlyZSgnTk9ERV9UWVBFL0RPQ1VNRU5UX0ZSQUdNRU5UJyksXHJcbiAgICBpc1N0cmluZyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3N0cmluZycpLFxyXG4gICAgaXNBdHRhY2hlZCAgICAgICAgPSByZXF1aXJlKCdpcy9hdHRhY2hlZCcpLFxyXG4gICAgaXNFbGVtZW50ICAgICAgICAgPSByZXF1aXJlKCdpcy9lbGVtZW50JyksXHJcbiAgICBpc1dpbmRvdyAgICAgICAgICA9IHJlcXVpcmUoJ2lzL3dpbmRvdycpLFxyXG4gICAgaXNEb2N1bWVudCAgICAgICAgPSByZXF1aXJlKCdpcy9kb2N1bWVudCcpLFxyXG4gICAgaXNEICAgICAgICAgICAgICAgPSByZXF1aXJlKCdpcy9EJyksXHJcbiAgICBvcmRlciAgICAgICAgICAgICA9IHJlcXVpcmUoJ29yZGVyJyksXHJcbiAgICB1bmlxdWUgICAgICAgICAgICA9IHJlcXVpcmUoJy4vYXJyYXkvdW5pcXVlJyksXHJcbiAgICBzZWxlY3RvckZpbHRlciAgICA9IHJlcXVpcmUoJy4vc2VsZWN0b3JzL2ZpbHRlcicpLFxyXG4gICAgRml6emxlICAgICAgICAgICAgPSByZXF1aXJlKCdGaXp6bGUnKTtcclxuXHJcbnZhciBnZXRTaWJsaW5ncyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ICAgID0gMCxcclxuICAgICAgICAgICAgbGVuICAgID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzaWJzID0gX2dldE5vZGVTaWJsaW5ncyhjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2licy5sZW5ndGgpIHsgcmVzdWx0LnB1c2goc2licyk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihyZXN1bHQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfZ2V0Tm9kZVNpYmxpbmdzID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgIGlmICghcGFyZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzaWJzID0gXy50b0FycmF5KHBhcmVudC5jaGlsZHJlbiksXHJcbiAgICAgICAgICAgIGlkeCAgPSBzaWJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGlkeC0tKSB7XHJcbiAgICAgICAgICAgIC8vIEV4Y2x1ZGUgdGhlIG5vZGUgaXRzZWxmIGZyb20gdGhlIGxpc3Qgb2YgaXRzIHBhcmVudCdzIGNoaWxkcmVuXHJcbiAgICAgICAgICAgIGlmIChzaWJzW2lkeF0gPT09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHNpYnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaWJzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDaGlsZHJlbiAtLS0tLS1cclxuICAgIGdldENoaWxkcmVuID0gKGFycikgPT4gXy5mbGF0dGVuKF8ubWFwKGFyciwgX2NoaWxkcmVuKSksXHJcbiAgICBfY2hpbGRyZW4gPSBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgdmFyIGtpZHMgPSBlbGVtLmNoaWxkcmVuLFxyXG4gICAgICAgICAgICBpZHggID0gMCwgbGVuICA9IGtpZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICBhcnIgID0gbmV3IEFycmF5KGxlbik7XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgYXJyW2lkeF0gPSBraWRzW2lkeF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhcnI7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFBhcmVudHMgLS0tLS0tXHJcbiAgICBnZXRDbG9zZXN0ID0gZnVuY3Rpb24oZWxlbXMsIHNlbGVjdG9yLCBjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGVsZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgcGFyZW50cyxcclxuICAgICAgICAgICAgY2xvc2VzdCxcclxuICAgICAgICAgICAgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICg7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgcGFyZW50cyA9IF9jcmF3bFVwTm9kZShlbGVtc1tpZHhdLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgcGFyZW50cy51bnNoaWZ0KGVsZW1zW2lkeF0pO1xyXG4gICAgICAgICAgICBjbG9zZXN0ID0gc2VsZWN0b3JGaWx0ZXIocGFyZW50cywgc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2xvc2VzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNsb3Nlc3RbMF0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50cyA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICAgICAgbGVuID0gY29udGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIHBhcmVudHMsXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAoOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHBhcmVudHMgPSBfY3Jhd2xVcE5vZGUoY29udGV4dFtpZHhdKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UGFyZW50c1VudGlsID0gZnVuY3Rpb24oZCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IDAsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBwYXJlbnRzLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBwYXJlbnRzID0gX2NyYXdsVXBOb2RlKGRbaWR4XSwgbnVsbCwgc3RvcFNlbGVjdG9yKTtcclxuICAgICAgICAgICAgcmVzdWx0LnB1c2gocGFyZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4ocmVzdWx0KTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NyYXdsVXBOb2RlID0gZnVuY3Rpb24obm9kZSwgY29udGV4dCwgc3RvcFNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlLFxyXG4gICAgICAgICAgICBub2RlVHlwZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKChwYXJlbnQgICA9IGdldE5vZGVQYXJlbnQocGFyZW50KSkgJiZcclxuICAgICAgICAgICAgICAgKG5vZGVUeXBlID0gcGFyZW50Lm5vZGVUeXBlKSAhPT0gRE9DVU1FTlQgJiZcclxuICAgICAgICAgICAgICAgKCFjb250ZXh0ICAgICAgfHwgcGFyZW50ICE9PSBjb250ZXh0KSAmJlxyXG4gICAgICAgICAgICAgICAoIXN0b3BTZWxlY3RvciB8fCAhRml6emxlLmlzKHN0b3BTZWxlY3RvcikubWF0Y2gocGFyZW50KSkpIHtcclxuICAgICAgICAgICAgaWYgKG5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBQYXJlbnQgLS0tLS0tXHJcbiAgICBnZXRQYXJlbnQgPSBmdW5jdGlvbihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIGlkeCAgICA9IDAsXHJcbiAgICAgICAgICAgIGxlbiAgICA9IGNvbnRleHQubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gZ2V0Tm9kZVBhcmVudChjb250ZXh0W2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50KSB7IHJlc3VsdC5wdXNoKHBhcmVudCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gU2FmZWx5IGdldCBwYXJlbnQgbm9kZVxyXG4gICAgZ2V0Tm9kZVBhcmVudCA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICByZXR1cm4gbm9kZSAmJiBub2RlLnBhcmVudE5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFByZXYgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHByZXYgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSAmJiBwcmV2Lm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXROZXh0ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciBuZXh0ID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKG5leHQgPSBuZXh0Lm5leHRTaWJsaW5nKSAmJiBuZXh0Lm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7fVxyXG4gICAgICAgIHJldHVybiBuZXh0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQcmV2QWxsID0gZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgcHJldiAgID0gbm9kZTtcclxuICAgICAgICB3aGlsZSAoKHByZXYgPSBwcmV2LnByZXZpb3VzU2libGluZykpIHtcclxuICAgICAgICAgICAgaWYgKHByZXYubm9kZVR5cGUgPT09IEVMRU1FTlQpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHByZXYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5leHRBbGwgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBuZXh0ICAgPSBub2RlO1xyXG4gICAgICAgIHdoaWxlICgobmV4dCA9IG5leHQubmV4dFNpYmxpbmcpKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXh0Lm5vZGVUeXBlID09PSBFTEVNRU5UKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsID0gZnVuY3Rpb24oZ2V0dGVyLCBkLCBzZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgaWR4LFxyXG4gICAgICAgICAgICBsZW4gPSBkLmxlbmd0aCxcclxuICAgICAgICAgICAgc2libGluZztcclxuXHJcbiAgICAgICAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XHJcbiAgICAgICAgICAgIHNpYmxpbmcgPSBnZXR0ZXIoZFtpZHhdKTtcclxuICAgICAgICAgICAgaWYgKHNpYmxpbmcgJiYgKCFzZWxlY3RvciB8fCBGaXp6bGUuaXMoc2VsZWN0b3IpLm1hdGNoKHNpYmxpbmcpKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goc2libGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvc2l0aW9uYWxBbGwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgZmlsdGVyO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgZmlsdGVyID0gZnVuY3Rpb24oc2libGluZykgeyByZXR1cm4gRml6emxlLmlzKHNlbGVjdG9yKS5tYXRjaChzaWJsaW5nKTsgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgbGVuOyBpZHgrKykge1xyXG4gICAgICAgICAgICBzaWJsaW5ncyA9IGdldHRlcihkW2lkeF0pO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gXy5maWx0ZXIoc2libGluZ3MsIGZpbHRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBzaWJsaW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb3NpdGlvbmFsVW50aWwgPSBmdW5jdGlvbihnZXR0ZXIsIGQsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICBpZHgsXHJcbiAgICAgICAgICAgIGxlbiA9IGQubGVuZ3RoLFxyXG4gICAgICAgICAgICBzaWJsaW5ncyxcclxuICAgICAgICAgICAgaXRlcmF0b3I7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgaXMgPSBGaXp6bGUuaXMoc2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpdGVyYXRvciA9IGZ1bmN0aW9uKHNpYmxpbmcpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpc01hdGNoID0gaXMubWF0Y2goc2libGluZyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNpYmxpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2g7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGlkeCA9IDA7IGlkeCA8IGxlbjsgaWR4KyspIHtcclxuICAgICAgICAgICAgc2libGluZ3MgPSBnZXR0ZXIoZFtpZHhdKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpYmxpbmdzLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaC5hcHBseShyZXN1bHQsIHNpYmxpbmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgdW5pcXVlU29ydCA9IGZ1bmN0aW9uKGVsZW1zLCByZXZlcnNlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHVuaXF1ZShlbGVtcyk7XHJcbiAgICAgICAgb3JkZXIuc29ydChyZXN1bHQpO1xyXG4gICAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBEKHJlc3VsdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGZpbHRlckFuZFNvcnQgPSBmdW5jdGlvbihlbGVtcywgc2VsZWN0b3IsIHJldmVyc2UpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChzZWxlY3RvckZpbHRlcihlbGVtcywgc2VsZWN0b3IpLCByZXZlcnNlKTtcclxuICAgIH07XHJcblxyXG5leHBvcnRzLmZuID0ge1xyXG4gICAgY29udGVudHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBEKFxyXG4gICAgICAgICAgICBfLmZsYXR0ZW4oXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBwbHVja1xyXG4gICAgICAgICAgICAgICAgXy5tYXAodGhpcywgKGVsZW0pID0+IGVsZW0uY2hpbGROb2RlcylcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICAgICAgcmV0dXJuIEQoc2VsZWN0b3IpLmluZGV4T2YoZmlyc3QpOyAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbGVtZW50KHNlbGVjdG9yKSB8fCBpc1dpbmRvdyhzZWxlY3RvcikgfHwgaXNEb2N1bWVudChzZWxlY3RvcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXhPZihzZWxlY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNEKHNlbGVjdG9yKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbmRleE9mKHNlbGVjdG9yWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZhbGxiYWNrXHJcbiAgICAgICAgaWYgKCF0aGlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZmlyc3QgID0gdGhpc1swXSxcclxuICAgICAgICAgICAgcGFyZW50ID0gZmlyc3QucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaXNBdHRhY2hlZCBjaGVjayB0byBwYXNzIHRlc3QgXCJOb2RlIHdpdGhvdXQgcGFyZW50IHJldHVybnMgLTFcIlxyXG4gICAgICAgIC8vIG5vZGVUeXBlIGNoZWNrIHRvIHBhc3MgXCJJZiBEI2luZGV4IGNhbGxlZCBvbiBlbGVtZW50IHdob3NlIHBhcmVudCBpcyBmcmFnbWVudCwgaXQgc3RpbGwgc2hvdWxkIHdvcmsgY29ycmVjdGx5XCJcclxuICAgICAgICB2YXIgYXR0YWNoZWQgICAgICAgICA9IGlzQXR0YWNoZWQoZmlyc3QpLFxyXG4gICAgICAgICAgICBpc1BhcmVudEZyYWdtZW50ID0gcGFyZW50Lm5vZGVUeXBlID09PSBET0NVTUVOVF9GUkFHTUVOVDtcclxuXHJcbiAgICAgICAgaWYgKCFhdHRhY2hlZCAmJiAhaXNQYXJlbnRGcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2hpbGRFbGVtcyA9IHBhcmVudC5jaGlsZHJlbiB8fCBfLmZpbHRlcihwYXJlbnQuY2hpbGROb2RlcywgKG5vZGUpID0+IG5vZGUubm9kZVR5cGUgPT09IEVMRU1FTlQpO1xyXG5cclxuICAgICAgICByZXR1cm4gW10uaW5kZXhPZi5hcHBseShjaGlsZEVsZW1zLCBbIGZpcnN0IF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9zZXN0OiBmdW5jdGlvbihzZWxlY3RvciwgY29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldENsb3Nlc3QodGhpcywgc2VsZWN0b3IsIGNvbnRleHQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFBhcmVudCh0aGlzKSwgc2VsZWN0b3IpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJlbnRzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFBhcmVudHModGhpcyksIHNlbGVjdG9yLCB0cnVlKTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyZW50c1VudGlsOiBmdW5jdGlvbihzdG9wU2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQYXJlbnRzVW50aWwodGhpcywgc3RvcFNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNpYmxpbmdzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldFNpYmxpbmdzKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoaWxkcmVuOiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJBbmRTb3J0KGdldENoaWxkcmVuKHRoaXMpLCBzZWxlY3Rvcik7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXY6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbChnZXRQcmV2LCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZXh0OiBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVTb3J0KGdldFBvc2l0aW9uYWwoZ2V0TmV4dCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldkFsbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsQWxsKGdldFByZXZBbGwsIHRoaXMsIHNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHRBbGw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbEFsbChnZXROZXh0QWxsLCB0aGlzLCBzZWxlY3RvcikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmV2VW50aWw6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHVuaXF1ZVNvcnQoZ2V0UG9zaXRpb25hbFVudGlsKGdldFByZXZBbGwsIHRoaXMsIHNlbGVjdG9yKSwgdHJ1ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5leHRVbnRpbDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcclxuICAgICAgICByZXR1cm4gdW5pcXVlU29ydChnZXRQb3NpdGlvbmFsVW50aWwoZ2V0TmV4dEFsbCwgdGhpcywgc2VsZWN0b3IpKTtcclxuICAgIH1cclxufTtcclxuIiwidmFyIF8gICAgICAgICAgPSByZXF1aXJlKCdfJyksXHJcbiAgICBuZXdsaW5lcyAgID0gcmVxdWlyZSgnc3RyaW5nL25ld2xpbmVzJyksXHJcbiAgICBleGlzdHMgICAgID0gcmVxdWlyZSgnaXMvZXhpc3RzJyksXHJcbiAgICBpc1N0cmluZyAgID0gcmVxdWlyZSgnaXMvc3RyaW5nJyksXHJcbiAgICBpc0FycmF5ICAgID0gcmVxdWlyZSgnaXMvYXJyYXknKSxcclxuICAgIGlzTnVtYmVyICAgPSByZXF1aXJlKCdpcy9udW1iZXInKSxcclxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdpcy9mdW5jdGlvbicpLFxyXG4gICAgaXNOb2RlTmFtZSA9IHJlcXVpcmUoJ25vZGUvaXNOYW1lJyksXHJcbiAgICBub3JtYWxOYW1lID0gcmVxdWlyZSgnbm9kZS9ub3JtYWxpemVOYW1lJyksXHJcbiAgICBTVVBQT1JUUyAgID0gcmVxdWlyZSgnU1VQUE9SVFMnKSxcclxuICAgIEVMRU1FTlQgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpO1xyXG5cclxudmFyIG91dGVySHRtbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA/IHRoaXNbMF0ub3V0ZXJIVE1MIDogbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgdGV4dEdldCA9IFNVUFBPUlRTLnRleHRDb250ZW50ID9cclxuICAgICAgICAoZWxlbSkgPT4gZWxlbS50ZXh0Q29udGVudCA6XHJcbiAgICAgICAgICAgIChlbGVtKSA9PiBlbGVtLmlubmVyVGV4dCxcclxuXHJcbiAgICB0ZXh0U2V0ID0gU1VQUE9SVFMudGV4dENvbnRlbnQgP1xyXG4gICAgICAgIChlbGVtLCBzdHIpID0+IGVsZW0udGV4dENvbnRlbnQgPSBzdHIgOlxyXG4gICAgICAgICAgICAoZWxlbSwgc3RyKSA9PiBlbGVtLmlubmVyVGV4dCA9IHN0cjtcclxuXHJcbnZhciB2YWxIb29rcyA9IHtcclxuICAgIG9wdGlvbjoge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICAgICAgICB2YXIgdmFsID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XHJcbiAgICAgICAgICAgIHJldHVybiAoZXhpc3RzKHZhbCkgPyB2YWwgOiB0ZXh0R2V0KGVsZW0pKS50cmltKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzZWxlY3Q6IHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlLCBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gZWxlbS5vcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgaW5kZXggICA9IGVsZW0uc2VsZWN0ZWRJbmRleCxcclxuICAgICAgICAgICAgICAgIG9uZSAgICAgPSBlbGVtLnR5cGUgPT09ICdzZWxlY3Qtb25lJyB8fCBpbmRleCA8IDAsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMgID0gb25lID8gbnVsbCA6IFtdLFxyXG4gICAgICAgICAgICAgICAgbWF4ICAgICA9IG9uZSA/IGluZGV4ICsgMSA6IG9wdGlvbnMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgaWR4ICAgICA9IGluZGV4IDwgMCA/IG1heCA6IChvbmUgPyBpbmRleCA6IDApO1xyXG5cclxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgc2VsZWN0ZWQgb3B0aW9uc1xyXG4gICAgICAgICAgICBmb3IgKDsgaWR4IDwgbWF4OyBpZHgrKykge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gb3B0aW9uc1tpZHhdO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9sZElFIGRvZXNuJ3QgdXBkYXRlIHNlbGVjdGVkIGFmdGVyIGZvcm0gcmVzZXQgKCMyNTUxKVxyXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb24uc2VsZWN0ZWQgfHwgaWR4ID09PSBpbmRleCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgcmV0dXJuIG9wdGlvbnMgdGhhdCBhcmUgZGlzYWJsZWQgb3IgaW4gYSBkaXNhYmxlZCBvcHRncm91cFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoU1VQUE9SVFMub3B0RGlzYWJsZWQgPyAhb3B0aW9uLmRpc2FibGVkIDogb3B0aW9uLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCFvcHRpb24ucGFyZW50Tm9kZS5kaXNhYmxlZCB8fCAhaXNOb2RlTmFtZShvcHRpb24ucGFyZW50Tm9kZSwgJ29wdGdyb3VwJykpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgc3BlY2lmaWMgdmFsdWUgZm9yIHRoZSBvcHRpb25cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCBhbiBhcnJheSBmb3Igb25lIHNlbGVjdHNcclxuICAgICAgICAgICAgICAgICAgICBpZiAob25lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE11bHRpLVNlbGVjdHMgcmV0dXJuIGFuIGFycmF5XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZWxlbSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9wdGlvblNldCwgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IGVsZW0ub3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIHZhbHVlcyAgPSBfLm1ha2VBcnJheSh2YWx1ZSksXHJcbiAgICAgICAgICAgICAgICBpZHggICAgID0gb3B0aW9ucy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvbnNbaWR4XTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyh2YWx1ZXMsIHZhbEhvb2tzLm9wdGlvbi5nZXQob3B0aW9uKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBvcHRpb25TZXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRm9yY2UgYnJvd3NlcnMgdG8gYmVoYXZlIGNvbnNpc3RlbnRseSB3aGVuIG5vbi1tYXRjaGluZyB2YWx1ZSBpcyBzZXRcclxuICAgICAgICAgICAgaWYgKCFvcHRpb25TZXQpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0uc2VsZWN0ZWRJbmRleCA9IC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuXHJcbi8vIFJhZGlvIGFuZCBjaGVja2JveCBnZXR0ZXIgZm9yIFdlYmtpdFxyXG5pZiAoIVNVUFBPUlRTLmNoZWNrT24pIHtcclxuICAgIF8uZWFjaChbJ3JhZGlvJywgJ2NoZWNrYm94J10sIGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICB2YWxIb29rc1t0eXBlXSA9IHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0OiBXZWJraXQgLSAnJyBpcyByZXR1cm5lZCBpbnN0ZWFkIG9mICdvbicgaWYgYSB2YWx1ZSBpc24ndCBzcGVjaWZpZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLmdldEF0dHJpYnV0ZSgndmFsdWUnKSA9PT0gbnVsbCA/ICdvbicgOiBlbGVtLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgZ2V0VmFsID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgaWYgKCFlbGVtIHx8IChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSkgeyByZXR1cm47IH1cclxuXHJcbiAgICB2YXIgaG9vayA9IHZhbEhvb2tzW2VsZW0udHlwZV0gfHwgdmFsSG9va3Nbbm9ybWFsTmFtZShlbGVtKV07XHJcbiAgICBpZiAoaG9vayAmJiBob29rLmdldCkge1xyXG4gICAgICAgIHJldHVybiBob29rLmdldChlbGVtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdmFsID0gZWxlbS52YWx1ZTtcclxuICAgIGlmICh2YWwgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHZhbCA9IGVsZW0uZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpc1N0cmluZyh2YWwpID8gbmV3bGluZXModmFsKSA6IHZhbDtcclxufTtcclxuXHJcbnZhciBzdHJpbmdpZnkgPSAodmFsdWUpID0+XHJcbiAgICAhZXhpc3RzKHZhbHVlKSA/ICcnIDogKHZhbHVlICsgJycpO1xyXG5cclxudmFyIHNldFZhbCA9IGZ1bmN0aW9uKGVsZW0sIHZhbCkge1xyXG4gICAgaWYgKGVsZW0ubm9kZVR5cGUgIT09IEVMRU1FTlQpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgLy8gU3RyaW5naWZ5IHZhbHVlc1xyXG4gICAgdmFyIHZhbHVlID0gaXNBcnJheSh2YWwpID8gXy5tYXAodmFsLCBzdHJpbmdpZnkpIDogc3RyaW5naWZ5KHZhbCk7XHJcblxyXG4gICAgdmFyIGhvb2sgPSB2YWxIb29rc1tlbGVtLnR5cGVdIHx8IHZhbEhvb2tzW25vcm1hbE5hbWUoZWxlbSldO1xyXG4gICAgaWYgKGhvb2sgJiYgaG9vay5zZXQpIHtcclxuICAgICAgICBob29rLnNldChlbGVtLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCd2YWx1ZScsIHZhbHVlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydHMuZm4gPSB7XHJcbiAgICBvdXRlckh0bWw6IG91dGVySHRtbCxcclxuICAgIG91dGVySFRNTDogb3V0ZXJIdG1sLFxyXG5cclxuICAgIGh0bWw6IGZ1bmN0aW9uKGh0bWwpIHtcclxuICAgICAgICBpZiAoaXNTdHJpbmcoaHRtbCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gZWxlbS5pbm5lckhUTUwgPSBodG1sKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGh0bWwpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IGh0bWw7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0sIGlkeCkgPT5cclxuICAgICAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID0gaXRlcmF0b3IuY2FsbChlbGVtLCBpZHgsIGVsZW0uaW5uZXJIVE1MKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpcnN0ID0gdGhpc1swXTtcclxuICAgICAgICByZXR1cm4gKCFmaXJzdCkgPyB1bmRlZmluZWQgOiBmaXJzdC5pbm5lckhUTUw7XHJcbiAgICB9LFxyXG5cclxuICAgIHZhbDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAvLyBnZXR0ZXJcclxuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbCh0aGlzWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZXhpc3RzKHZhbHVlKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMsIChlbGVtKSA9PiBzZXRWYWwoZWxlbSwgJycpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCBmdW5jdGlvbihlbGVtLCBpZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGVtLm5vZGVUeXBlICE9PSBFTEVNRU5UKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoZWxlbSwgaWR4LCBnZXRWYWwoZWxlbSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFZhbChlbGVtLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0dGVyc1xyXG4gICAgICAgIGlmIChpc1N0cmluZyh2YWx1ZSkgfHwgaXNOdW1iZXIodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHNldFZhbChlbGVtLCB2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSkgPT4gc2V0VmFsKGVsZW0sIHZhbHVlKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgICAgIGlmIChpc1N0cmluZyhzdHIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmVhY2godGhpcywgKGVsZW0pID0+IHRleHRTZXQoZWxlbSwgc3RyKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNGdW5jdGlvbihzdHIpKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVyYXRvciA9IHN0cjtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLCAoZWxlbSwgaWR4KSA9PlxyXG4gICAgICAgICAgICAgICAgdGV4dFNldChlbGVtLCBpdGVyYXRvci5jYWxsKGVsZW0sIGlkeCwgdGV4dEdldChlbGVtKSkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAodGhpcywgKGVsZW0pID0+IHRleHRHZXQoZWxlbSkpLmpvaW4oJycpO1xyXG4gICAgfVxyXG59OyIsInZhciBFTEVNRU5UID0gcmVxdWlyZSgnTk9ERV9UWVBFL0VMRU1FTlQnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGVsZW0pID0+XHJcbiAgICAgICAgZWxlbSAmJiBlbGVtLm5vZGVUeXBlID09PSBFTEVNRU5UO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChlbGVtLCBuYW1lKSA9PlxyXG4gICAgZWxlbS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09PSBuYW1lLnRvTG93ZXJDYXNlKCk7IiwiLy8gY2FjaGUgaXMganVzdCBub3Qgd29ydGggaXQgaGVyZVxyXG4vLyBodHRwOi8vanNwZXJmLmNvbS9zaW1wbGUtY2FjaGUtZm9yLXN0cmluZy1tYW5pcFxyXG5tb2R1bGUuZXhwb3J0cyA9IChlbGVtKSA9PiBlbGVtLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiIsInZhciByZWFkeSA9IGZhbHNlLFxyXG4gICAgcmVnaXN0cmF0aW9uID0gW107XHJcblxyXG52YXIgd2FpdCA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgICAvLyBBbHJlYWR5IGxvYWRlZFxyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdGFuZGFyZHMtYmFzZWQgYnJvd3NlcnMgc3VwcG9ydCBET01Db250ZW50TG9hZGVkXHJcbiAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIElFIGV2ZW50IG1vZGVsIGlzIHVzZWRcclxuXHJcbiAgICAvLyBFbnN1cmUgZmlyaW5nIGJlZm9yZSBvbmxvYWQsIG1heWJlIGxhdGUgYnV0IHNhZmUgYWxzbyBmb3IgaWZyYW1lc1xyXG4gICAgZG9jdW1lbnQuYXR0YWNoRXZlbnQoJ29ucmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnaW50ZXJhY3RpdmUnKSB7IGZuKCk7IH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEEgZmFsbGJhY2sgdG8gd2luZG93Lm9ubG9hZCwgdGhhdCB3aWxsIGFsd2F5cyB3b3JrXHJcbiAgICB3aW5kb3cuYXR0YWNoRXZlbnQoJ29ubG9hZCcsIGZuKTtcclxufTtcclxuXHJcbndhaXQoZnVuY3Rpb24oKSB7XHJcbiAgICByZWFkeSA9IHRydWU7XHJcblxyXG4gICAgLy8gY2FsbCByZWdpc3RlcmVkIG1ldGhvZHMgICAgXHJcbiAgICB2YXIgaWR4ID0gMCxcclxuICAgICAgICBsZW5ndGggPSByZWdpc3RyYXRpb24ubGVuZ3RoO1xyXG4gICAgZm9yICg7IGlkeCA8IGxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICByZWdpc3RyYXRpb25baWR4XSgpO1xyXG4gICAgfVxyXG4gICAgcmVnaXN0cmF0aW9uLmxlbmd0aCA9IDA7XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgaWYgKHJlYWR5KSB7XHJcbiAgICAgICAgY2FsbGJhY2soKTsgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdHJhdGlvbi5wdXNoKGNhbGxiYWNrKTtcclxufTtcclxuIiwidmFyIGlzQXR0YWNoZWQgICA9IHJlcXVpcmUoJ2lzL2F0dGFjaGVkJyksXHJcbiAgICBFTEVNRU5UICAgICAgPSByZXF1aXJlKCdOT0RFX1RZUEUvRUxFTUVOVCcpLFxyXG4gICAgLy8gaHR0cDovL2Vqb2huLm9yZy9ibG9nL2NvbXBhcmluZy1kb2N1bWVudC1wb3NpdGlvbi9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9Ob2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICBDT05UQUlORURfQlkgPSAxNixcclxuICAgIEZPTExPV0lORyAgICA9IDQsXHJcbiAgICBESVNDT05ORUNURUQgPSAxO1xyXG5cclxudmFyIGlzID0gKHJlbCwgZmxhZykgPT4gKHJlbCAmIGZsYWcpID09PSBmbGFnO1xyXG5cclxudmFyIGlzTm9kZSA9IChiLCBmbGFnLCBhKSA9PiBpcyhfY29tcGFyZVBvc2l0aW9uKGEsIGIpLCBmbGFnKTtcclxuXHJcbi8vIENvbXBhcmUgUG9zaXRpb24gLSBNSVQgTGljZW5zZWQsIEpvaG4gUmVzaWdcclxudmFyIF9jb21wYXJlUG9zaXRpb24gPSAobm9kZTEsIG5vZGUyKSA9PlxyXG4gICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gP1xyXG4gICAgbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZTIpIDpcclxuICAgIDA7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogU29ydHMgYW4gYXJyYXkgb2YgRCBlbGVtZW50cyBpbi1wbGFjZSAoaS5lLiwgbXV0YXRlcyB0aGUgb3JpZ2luYWwgYXJyYXkpXHJcbiAgICAgKiBpbiBkb2N1bWVudCBvcmRlciBhbmQgcmV0dXJucyB3aGV0aGVyIGFueSBkdXBsaWNhdGVzIHdlcmUgZm91bmQuXHJcbiAgICAgKiBAZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSB7RWxlbWVudFtdfSBhcnJheSAgICAgICAgICBBcnJheSBvZiBEIGVsZW1lbnRzLlxyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSAgW3JldmVyc2U9ZmFsc2VdIElmIGEgdHJ1dGh5IHZhbHVlIGlzIHBhc3NlZCwgdGhlIGdpdmVuIGFycmF5IHdpbGwgYmUgcmV2ZXJzZWQuXHJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gdHJ1ZSBpZiBhbnkgZHVwbGljYXRlcyB3ZXJlIGZvdW5kLCBvdGhlcndpc2UgZmFsc2UuXHJcbiAgICAgKiBAc2VlIGpRdWVyeSBzcmMvc2VsZWN0b3ItbmF0aXZlLmpzOjM3XHJcbiAgICAgKi9cclxuICAgIC8vIFRPRE86IEFkZHJlc3MgZW5jYXBzdWxhdGlvblxyXG4gICAgc29ydDogKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBfaGFzRHVwbGljYXRlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBfc29ydCA9IGZ1bmN0aW9uKG5vZGUxLCBub2RlMikge1xyXG4gICAgICAgICAgICAvLyBGbGFnIGZvciBkdXBsaWNhdGUgcmVtb3ZhbFxyXG4gICAgICAgICAgICBpZiAobm9kZTEgPT09IG5vZGUyKSB7XHJcbiAgICAgICAgICAgICAgICBfaGFzRHVwbGljYXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTb3J0IG9uIG1ldGhvZCBleGlzdGVuY2UgaWYgb25seSBvbmUgaW5wdXQgaGFzIGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uXHJcbiAgICAgICAgICAgIHZhciByZWwgPSAhbm9kZTEuY29tcGFyZURvY3VtZW50UG9zaXRpb24gLSAhbm9kZTIuY29tcGFyZURvY3VtZW50UG9zaXRpb247XHJcbiAgICAgICAgICAgIGlmIChyZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE5vZGVzIHNoYXJlIHRoZSBzYW1lIGRvY3VtZW50XHJcbiAgICAgICAgICAgIGlmICgobm9kZTEub3duZXJEb2N1bWVudCB8fCBub2RlMSkgPT09IChub2RlMi5vd25lckRvY3VtZW50IHx8IG5vZGUyKSkge1xyXG4gICAgICAgICAgICAgICAgcmVsID0gX2NvbXBhcmVQb3NpdGlvbihub2RlMSwgbm9kZTIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSB3ZSBrbm93IHRoZXkgYXJlIGRpc2Nvbm5lY3RlZFxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlbCA9IERJU0NPTk5FQ1RFRDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTm90IGRpcmVjdGx5IGNvbXBhcmFibGVcclxuICAgICAgICAgICAgaWYgKCFyZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEaXNjb25uZWN0ZWQgbm9kZXNcclxuICAgICAgICAgICAgaWYgKGlzKHJlbCwgRElTQ09OTkVDVEVEKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzTm9kZTFEaXNjb25uZWN0ZWQgPSAhaXNBdHRhY2hlZChub2RlMSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNOb2RlMkRpc2Nvbm5lY3RlZCA9ICFpc0F0dGFjaGVkKG5vZGUyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNOb2RlMURpc2Nvbm5lY3RlZCAmJiBpc05vZGUyRGlzY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTm9kZTJEaXNjb25uZWN0ZWQgPyAtMSA6IDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpcyhyZWwsIEZPTExPV0lORykgPyAtMSA6IDE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFycmF5LCByZXZlcnNlKSB7XHJcbiAgICAgICAgICAgIF9oYXNEdXBsaWNhdGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgYXJyYXkuc29ydChfc29ydCk7XHJcbiAgICAgICAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJheS5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIF9oYXNEdXBsaWNhdGU7XHJcbiAgICAgICAgfTtcclxuICAgIH0oKSksXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmAuXHJcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGEgRCBlbGVtZW50IG5vZGVcclxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gYiBEIGVsZW1lbnQgbm9kZVxyXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHRydWUgaWYgbm9kZSBgYWAgY29udGFpbnMgbm9kZSBgYmA7IG90aGVyd2lzZSBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICB2YXIgYlVwID0gaXNBdHRhY2hlZChiKSA/IGIucGFyZW50Tm9kZSA6IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChhID09PSBiVXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYlVwICYmIGJVcC5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xyXG4gICAgICAgICAgICAvLyBNb2Rlcm4gYnJvd3NlcnMgKElFOSspXHJcbiAgICAgICAgICAgIGlmIChhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNOb2RlKGJVcCwgQ09OVEFJTkVEX0JZLCBhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59O1xyXG4iLCJ2YXIgUkVHRVggPSByZXF1aXJlKCdSRUdFWCcpLFxyXG4gICAgTUFYX1NJTkdMRV9UQUdfTEVOR1RIID0gMzA7XHJcblxyXG52YXIgcGFyc2VTdHJpbmcgPSBmdW5jdGlvbihwYXJlbnRUYWdOYW1lLCBodG1sU3RyKSB7XHJcbiAgICB2YXIgcGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChwYXJlbnRUYWdOYW1lKTtcclxuICAgIHBhcmVudC5pbm5lckhUTUwgPSBodG1sU3RyO1xyXG4gICAgcmV0dXJuIHBhcmVudDtcclxufTtcclxuXHJcbnZhciBwYXJzZVNpbmdsZVRhZyA9IGZ1bmN0aW9uKGh0bWxTdHIpIHtcclxuICAgIGlmIChodG1sU3RyLmxlbmd0aCA+IE1BWF9TSU5HTEVfVEFHX0xFTkdUSCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHZhciBzaW5nbGVUYWdNYXRjaCA9IFJFR0VYLnNpbmdsZVRhZ01hdGNoKGh0bWxTdHIpO1xyXG4gICAgaWYgKCFzaW5nbGVUYWdNYXRjaCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChzaW5nbGVUYWdNYXRjaFsxXSk7XHJcblxyXG4gICAgcmV0dXJuIFsgZWxlbSBdO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihodG1sU3RyKSB7XHJcbiAgICB2YXIgc2luZ2xlVGFnID0gcGFyc2VTaW5nbGVUYWcoaHRtbFN0cik7XHJcbiAgICBpZiAoc2luZ2xlVGFnKSB7IHJldHVybiBzaW5nbGVUYWc7IH1cclxuXHJcbiAgICB2YXIgcGFyZW50VGFnTmFtZSA9IFJFR0VYLmdldFBhcmVudFRhZ05hbWUoaHRtbFN0ciksXHJcbiAgICAgICAgcGFyZW50ICAgICAgICA9IHBhcnNlU3RyaW5nKHBhcmVudFRhZ05hbWUsIGh0bWxTdHIpO1xyXG5cclxuICAgIHZhciBjaGlsZCxcclxuICAgICAgICBpZHggPSBwYXJlbnQuY2hpbGRyZW4ubGVuZ3RoLFxyXG4gICAgICAgIGFyciA9IG5ldyBBcnJheShpZHgpO1xyXG5cclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgIGNoaWxkID0gcGFyZW50LmNoaWxkcmVuW2lkeF07XHJcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcclxuICAgICAgICBhcnJbaWR4XSA9IGNoaWxkO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcmVudCA9IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGFyci5yZXZlcnNlKCk7XHJcbn07XHJcbiIsInZhciBfICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICA9IHJlcXVpcmUoJy4vRCcpLFxyXG4gICAgcGFyc2VyICAgICA9IHJlcXVpcmUoJ3BhcnNlcicpLFxyXG4gICAgRml6emxlICAgICA9IHJlcXVpcmUoJ0ZpenpsZScpLFxyXG4gICAgZWFjaCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvYXJyYXkvZWFjaCcpLFxyXG4gICAgZGF0YSAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvZGF0YScpO1xyXG5cclxudmFyIHBhcnNlSHRtbCA9IGZ1bmN0aW9uKHN0cikge1xyXG4gICAgaWYgKCFzdHIpIHsgcmV0dXJuIG51bGw7IH1cclxuICAgIHZhciByZXN1bHQgPSBwYXJzZXIoc3RyKTtcclxuICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQubGVuZ3RoKSB7IHJldHVybiBudWxsOyB9XHJcbiAgICByZXR1cm4gRChyZXN1bHQpO1xyXG59O1xyXG5cclxuXy5leHRlbmQoRCxcclxuICAgIGRhdGEuRCxcclxue1xyXG4gICAgLy8gQmVjYXVzZSBubyBvbmUga25vdyB3aGF0IHRoZSBjYXNlIHNob3VsZCBiZVxyXG4gICAgcGFyc2VIdG1sOiBwYXJzZUh0bWwsXHJcbiAgICBwYXJzZUhUTUw6IHBhcnNlSHRtbCxcclxuXHJcbiAgICBGaXp6bGU6ICBGaXp6bGUsXHJcbiAgICBlYWNoOiAgICBlYWNoLFxyXG4gICAgZm9yRWFjaDogZWFjaCxcclxuXHJcbiAgICBtYXA6ICAgICBfLm1hcCxcclxuICAgIGV4dGVuZDogIF8uZXh0ZW5kLFxyXG5cclxuICAgIG1vcmVDb25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2luZG93LmpRdWVyeSA9IHdpbmRvdy5aZXB0byA9IHdpbmRvdy4kID0gRDtcclxuICAgIH1cclxufSk7IiwidmFyIF8gICAgICAgICAgID0gcmVxdWlyZSgnXycpLFxyXG4gICAgRCAgICAgICAgICAgPSByZXF1aXJlKCcuL0QnKSxcclxuICAgIHNwbGl0ICAgICAgID0gcmVxdWlyZSgndXRpbC9zcGxpdCcpLFxyXG4gICAgYXJyYXkgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2FycmF5JyksXHJcbiAgICBzZWxlY3RvcnMgICA9IHJlcXVpcmUoJ21vZHVsZXMvc2VsZWN0b3JzJyksXHJcbiAgICB0cmFuc3ZlcnNhbCA9IHJlcXVpcmUoJ21vZHVsZXMvdHJhbnN2ZXJzYWwnKSxcclxuICAgIGRpbWVuc2lvbnMgID0gcmVxdWlyZSgnbW9kdWxlcy9kaW1lbnNpb25zJyksXHJcbiAgICBtYW5pcCAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvbWFuaXAnKSxcclxuICAgIGNzcyAgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9jc3MnKSxcclxuICAgIGF0dHIgICAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9hdHRyJyksXHJcbiAgICBwcm9wICAgICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvcHJvcCcpLFxyXG4gICAgdmFsICAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3ZhbCcpLFxyXG4gICAgcG9zaXRpb24gICAgPSByZXF1aXJlKCdtb2R1bGVzL3Bvc2l0aW9uJyksXHJcbiAgICBjbGFzc2VzICAgICA9IHJlcXVpcmUoJ21vZHVsZXMvY2xhc3NlcycpLFxyXG4gICAgc2Nyb2xsICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL3Njcm9sbCcpLFxyXG4gICAgZGF0YSAgICAgICAgPSByZXF1aXJlKCdtb2R1bGVzL2RhdGEnKSxcclxuICAgIGV2ZW50cyAgICAgID0gcmVxdWlyZSgnbW9kdWxlcy9ldmVudHMnKTtcclxuXHJcbnZhciBhcnJheVByb3RvID0gc3BsaXQoJ2xlbmd0aHx0b1N0cmluZ3x0b0xvY2FsZVN0cmluZ3xqb2lufHBvcHxwdXNofGNvbmNhdHxyZXZlcnNlfHNoaWZ0fHVuc2hpZnR8c2xpY2V8c3BsaWNlfHNvcnR8c29tZXxldmVyeXxpbmRleE9mfGxhc3RJbmRleE9mfHJlZHVjZXxyZWR1Y2VSaWdodHxtYXB8ZmlsdGVyJylcclxuICAgIC5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgICBvYmpba2V5XSA9IEFycmF5LnByb3RvdHlwZVtrZXldO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LCB7fSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIHByb3RvdHlwZSBzbyB0aGF0XHJcbi8vIGl0IGNhbiBiZSBob29rZWQgaW50byBmb3IgcGx1Z2luc1xyXG5ELmZuID0gRC5wcm90b3R5cGU7XHJcblxyXG5fLmV4dGVuZChcclxuICAgIEQuZm4sXHJcbiAgICB7IGNvbnN0cnVjdG9yOiBELCB9LFxyXG4gICAgYXJyYXlQcm90byxcclxuICAgIGFycmF5LmZuLFxyXG4gICAgc2VsZWN0b3JzLmZuLFxyXG4gICAgdHJhbnN2ZXJzYWwuZm4sXHJcbiAgICBtYW5pcC5mbixcclxuICAgIGRpbWVuc2lvbnMuZm4sXHJcbiAgICBjc3MuZm4sXHJcbiAgICBhdHRyLmZuLFxyXG4gICAgcHJvcC5mbixcclxuICAgIHZhbC5mbixcclxuICAgIGNsYXNzZXMuZm4sXHJcbiAgICBwb3NpdGlvbi5mbixcclxuICAgIHNjcm9sbC5mbixcclxuICAgIGRhdGEuZm4sXHJcbiAgICBldmVudHMuZm5cclxuKTtcclxuIiwidmFyIGV4aXN0cyA9IHJlcXVpcmUoJ2lzL2V4aXN0cycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyKSA9PiAhZXhpc3RzKHN0cikgfHwgc3RyID09PSAnJzsiLCJ2YXIgU1VQUE9SVFMgPSByZXF1aXJlKCdTVVBQT1JUUycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTVVBQT1JUUy52YWx1ZU5vcm1hbGl6ZWQgP1xyXG4gICAgKHN0cikgPT4gc3RyIDpcclxuICAgIChzdHIpID0+IHN0ciA/IHN0ci5yZXBsYWNlKC9cXHJcXG4vZywgJ1xcbicpIDogc3RyOyIsInZhciBjYWNoZSAgID0gcmVxdWlyZSgnY2FjaGUnKSgyKSxcclxuICAgIGlzRW1wdHkgPSByZXF1aXJlKCdzdHJpbmcvaXNFbXB0eScpLFxyXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJ2lzL2FycmF5JyksXHJcblxyXG4gICAgUl9TUEFDRSA9IC9cXHMrL2csXHJcblxyXG4gICAgc3BsaXQgPSBmdW5jdGlvbihuYW1lLCBkZWxpbSkge1xyXG4gICAgICAgIHZhciBzcGxpdCAgID0gbmFtZS5zcGxpdChkZWxpbSksXHJcbiAgICAgICAgICAgIGxlbiAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGlkeCAgICAgPSBzcGxpdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIG5hbWVzICAgPSBbXSxcclxuICAgICAgICAgICAgbmFtZVNldCA9IHt9LFxyXG4gICAgICAgICAgICBjdXJOYW1lO1xyXG5cclxuICAgICAgICB3aGlsZSAoaWR4LS0pIHtcclxuICAgICAgICAgICAgY3VyTmFtZSA9IHNwbGl0W2xlbiAtIChpZHggKyAxKV07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdIHx8IC8vIHVuaXF1ZVxyXG4gICAgICAgICAgICAgICAgaXNFbXB0eShjdXJOYW1lKSAgICAvLyBub24tZW1wdHlcclxuICAgICAgICAgICAgKSB7IGNvbnRpbnVlOyB9XHJcblxyXG4gICAgICAgICAgICBuYW1lcy5wdXNoKGN1ck5hbWUpO1xyXG4gICAgICAgICAgICBuYW1lU2V0W2N1ck5hbWVdID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuYW1lcztcclxuICAgIH07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUsIGRlbGltaXRlcikge1xyXG4gICAgaWYgKGlzRW1wdHkobmFtZSkpIHsgcmV0dXJuIFtdOyB9XHJcbiAgICBpZiAoaXNBcnJheShuYW1lKSkgeyByZXR1cm4gbmFtZTsgfVxyXG5cclxuICAgIHZhciBkZWxpbSA9IGRlbGltaXRlciA9PT0gdW5kZWZpbmVkID8gUl9TUEFDRSA6IGRlbGltaXRlcjtcclxuICAgIHJldHVybiBjYWNoZS5oYXMoZGVsaW0sIG5hbWUpID8gXHJcbiAgICAgICAgY2FjaGUuZ2V0KGRlbGltLCBuYW1lKSA6IFxyXG4gICAgICAgIGNhY2hlLnB1dChkZWxpbSwgbmFtZSwgKCkgPT4gc3BsaXQobmFtZSwgZGVsaW0pKTtcclxufTtcclxuIiwidmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIHN0YXJ0LCBlbmQpIHtcclxuICAgIC8vIEV4aXQgZWFybHkgZm9yIGVtcHR5IGFycmF5XHJcbiAgICBpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gW107IH1cclxuXHJcbiAgICAvLyBFbmQsIG5hdHVyYWxseSwgaGFzIHRvIGJlIGhpZ2hlciB0aGFuIDAgdG8gbWF0dGVyLFxyXG4gICAgLy8gc28gYSBzaW1wbGUgZXhpc3RlbmNlIGNoZWNrIHdpbGwgZG9cclxuICAgIGlmIChlbmQpIHsgcmV0dXJuIHNsaWNlLmNhbGwoYXJyLCBzdGFydCwgZW5kKTsgfVxyXG5cclxuICAgIHJldHVybiBzbGljZS5jYWxsKGFyciwgc3RhcnQgfHwgMCk7XHJcbn07IiwiLy8gQnJlYWtzIGV2ZW4gb24gYXJyYXlzIHdpdGggMyBpdGVtcy4gMyBvciBtb3JlXHJcbi8vIGl0ZW1zIHN0YXJ0cyBzYXZpbmcgc3BhY2VcclxubW9kdWxlLmV4cG9ydHMgPSAoc3RyLCBkZWxpbWl0ZXIpID0+IHN0ci5zcGxpdChkZWxpbWl0ZXIgfHwgJ3wnKTtcclxuIiwidmFyIGlkID0gMDtcclxudmFyIHVuaXF1ZUlkID0gbW9kdWxlLmV4cG9ydHMgPSAoKSA9PiBpZCsrO1xyXG51bmlxdWVJZC5zZWVkID0gZnVuY3Rpb24oc2VlZGVkLCBwcmUpIHtcclxuICAgIHZhciBwcmVmaXggPSBwcmUgfHwgJycsXHJcbiAgICAgICAgc2VlZCA9IHNlZWRlZCB8fCAwO1xyXG4gICAgcmV0dXJuICgpID0+IHByZWZpeCArIHNlZWQrKztcclxufTsiXX0=
