/*
 * Fizzle.js
 * Adapted from Sizzle.js
 */
var _ = require('_'),

    _cache         = require('../../../cache'),
    _tokenCache    = _cache(),
    _subqueryCache = _cache(),
    _boolAttrCache = _cache(),

    _error = (!console || !console.error) ? _.noop :
        function(selector) {
            console.error('Invalid query selector (caught): ' + selector);
        };

var _booleans = 'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped',

    _fromCharCode = String.fromCharCode,

    // http://www.w3.org/TR/css3-selectors/#whitespace
    _whitespace = '[\\x20\\t\\r\\n\\f]',

    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    _identifier = '(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+',

    // NOTE: Leaving double quotes to reduce escaping
    // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
    _attributes = "\\[" + _whitespace + "*(" + _identifier + ")(?:" + _whitespace +
        // Operator (capture 2)
        "*([*^$|!~]?=)" + _whitespace +
        // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + _identifier + "))|)" + _whitespace +
        "*\\]",

    _pseudos = ":(" + _identifier + ")(?:\\((" +
        // To reduce the number of selectors needing _tokenize in the preFilter, prefer arguments:
        // 1. quoted (capture 3; capture 4 or capture 5)
        "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
        // 2. simple (capture 6)
        "((?:\\\\.|[^\\\\()[\\]]|" + _attributes + ")*)|" +
        // 3. anything else (capture 2)
        ".*" +
        ")\\)|)",

    _rcomma = new RegExp('^' + _whitespace + '*,' + _whitespace + '*'),
    _rcombinators = new RegExp('^' + _whitespace + '*([>+~]|' + _whitespace + ')' + _whitespace + '*'),

    _rpseudo = new RegExp(_pseudos),

    _matchExpr = {
        ID:     new RegExp('^#('   + _identifier + ')'),
        CLASS:  new RegExp('^\\.(' + _identifier + ')'),
        TAG:    new RegExp('^('    + _identifier + '|[*])'),
        ATTR:   new RegExp('^'     + _attributes),
        PSEUDO: new RegExp('^'     + _pseudos),
        CHILD:  new RegExp('^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(' + _whitespace +
            '*(even|odd|(([+-]|)(\\d*)n|)' + _whitespace + '*(?:([+-]|)' + _whitespace +
            '*(\\d+)|))' + _whitespace + '*\\)|)', 'i'),

        bool:   new RegExp("^(?:" + _booleans + ")$", "i"),

        // For use in libraries implementing .is()
        // We use this for POS matching in `select`
        needsContext: new RegExp('^' + _whitespace + '*[>+~]|:(even|odd|nth|eq|gt|lt|first|last)(?:\\(' +
            _whitespace + '*((?:-\\d)?\\d*)' + _whitespace + '*\\)|)(?=[^-]|$)', 'i')
    },

    // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
    _runescape = new RegExp('\\\\([\\da-f]{1,6}' + _whitespace + '?|(' + _whitespace + ')|.)', 'ig'),
    _funescape = function(_, escaped, escapedWhitespace) {
        var high = '0x' + (escaped - 0x10000);
        // NaN means non-codepoint
        // Support: Firefox<24
        // Workaround erroneous numeric interpretation of +'0x'
        return high !== high || escapedWhitespace ?
            escaped :
            high < 0 ?
                // BMP codepoint
                _fromCharCode(high + 0x10000) :
                // Supplemental Plane codepoint (surrogate pair)
                _fromCharCode((high >> 10) | 0xD800, (high & 0x3FF) | 0xDC00);
    },

    _preFilter = {
        ATTR: function(match) {
            match[1] = match[1].replace(_runescape, _funescape);

            // Move the given value to match[3] whether quoted or unquoted
            match[3] = ( match[3] || match[4] || match[5] || '' ).replace(_runescape, _funescape);

            if (match[2] === '~=') {
                match[3] = ' ' + match[3] + ' ';
            }

            return match.slice(0, 4);
        },

        CHILD: function(match) {
            /* matches from _matchExpr['CHILD']
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
                match[5] = +(( match[7] + match[8]) || match[3] === 'odd');

            // other types prohibit arguments
            } else if (match[3]) {
                throw new Error(match[0]);
            }

            return match;
        },

        PSEUDO: function(match) {
            var excess,
                unquoted = !match[6] && match[2];

            if (_matchExpr.CHILD.test(match[0])) {
                return null;
            }

            // Accept quoted arguments as-is
            if (match[3]) {
                match[2] = match[4] || match[5] || '';

            // Strip excess characters from unquoted arguments
            } else if (unquoted && _rpseudo.test(unquoted) &&
                // Get excess from _tokenize (recursively)
                (excess = _tokenize(unquoted, true)) &&
                // advance to the next closing parenthesis
                (excess = unquoted.indexOf(')', unquoted.length - excess) - unquoted.length)) {

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
var _tokenize = function(selector, parseOnly) {
    var cached = _tokenCache.get(selector);

    if (cached) {
        return parseOnly ? 0 : cached.slice(0);
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
        if (!matched || (match = _rcomma.exec(soFar))) {
            if (match) {
                // Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar;
            }
            if (subquery) { subqueries.push(subquery); }
            subquery = '';
        }

        matched = null;

        // Combinators
        if ((match = _rcombinators.exec(soFar))) {
            matched = match.shift();
            subquery += matched;
            soFar = soFar.slice(matched.length);
        }

        // Filters
        for (type in _matchExpr) {
            regex = _matchExpr[type];
            match = regex.exec(soFar);

            if (match && (!_preFilter[type] || (match = _preFilter[type](match)))) {
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

    if (subquery) { subqueries.push(subquery); }

    // Return the length of the invalid excess
    // if we're just parsing.
    if (parseOnly) { return soFar.length; }

    if (soFar) { _error(selector); return null; }

    return _tokenCache.set(selector, subqueries).slice();
};

module.exports = {
    /**
     * Splits the given comma-separated CSS selector into separate sub-queries.
     * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
     * @return {String[]|null} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]') or null if there was an error parsing the selector.
     */
    subqueries: function(selector) {
        return _subqueryCache.getOrSet(selector, function() {
            return _tokenize(selector);
        });
    },

    isBooleanAttribute: function(name) {
        return _boolAttrCache.getOrSet(name, function() {
            return _matchExpr.bool.test(name);
        });
    }
};
