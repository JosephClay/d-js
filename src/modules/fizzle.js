// TODO: Move into "query" dir and rename "qeuery" to "fizzle". Make those scripts all one engine
/*!
 * Sizzle CSS Selector Engine v1.10.20-pre
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-04-21
 */

/**
 * Fizzle.js
 * Adapted from Sizzle.js
 */

var _throwError = function(selector) {
    throw new Error(selector);
};

var _CACHE_SIZE = 50;

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
var createCache = function() {
    var keys = [];

    function cache(key, value) {
        // Use (key + ' ') to avoid collision with native prototype properties (see Issue #157)
        if ( keys.push(key + ' ') > _CACHE_SIZE ) {
            // Only keep the most recent entries
            delete cache[keys.shift()];
        }
        return (cache[key + ' '] = value);
    }

    return {
        get: function(key) { return cache[key + ' ']; },
        set: function(key, value) { return cache(key, value); }
    };
};

var tokenCache = createCache();

var booleans = 'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped',

    // http://www.w3.org/TR/css3-selectors/#whitespace
    whitespace = "[\\x20\\t\\r\\n\\f]",

    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

    // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
    attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
        // Operator (capture 2)
        "*([*^$|!~]?=)" + whitespace +
        // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
        "*\\]",

    pseudos = ":(" + identifier + ")(?:\\((" +
        // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
        // 1. quoted (capture 3; capture 4 or capture 5)
        "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
        // 2. simple (capture 6)
        "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
        // 3. anything else (capture 2)
        ".*" +
        ")\\)|)",

    // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
    rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),

    rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
    rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),

    rpseudo = new RegExp(pseudos),

    matchExpr = {
        ID:     new RegExp("^#(" + identifier + ")"),
        CLASS:  new RegExp("^\\.(" + identifier + ")"),
        TAG:    new RegExp("^(" + identifier + "|[*])"),
        ATTR:   new RegExp("^" + attributes),
        PSEUDO: new RegExp("^" + pseudos),
        CHILD:  new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
            "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
            "*(\\d+)|))" + whitespace + "*\\)|)", "i"),

        bool:   new RegExp("^(?:" + booleans + ")$", "i"),

        // For use in libraries implementing .is()
        // We use this for POS matching in `select`
        needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
            whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
    },

    // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
    runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
    funescape = function(_, escaped, escapedWhitespace) {
        var high = '0x' + escaped - 0x10000;
        // NaN means non-codepoint
        // Support: Firefox<24
        // Workaround erroneous numeric interpretation of +'0x'
        return high !== high || escapedWhitespace ?
            escaped :
            high < 0 ?
                // BMP codepoint
                String.fromCharCode( high + 0x10000 ) :
                // Supplemental Plane codepoint (surrogate pair)
                String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
    };

var preFilter = {
    'ATTR': function(match) {
        match[1] = match[1].replace(runescape, funescape);

        // Move the given value to match[3] whether quoted or unquoted
        match[3] = ( match[3] || match[4] || match[5] || '' ).replace(runescape, funescape);

        if (match[2] === '~=') {
            match[3] = ' ' + match[3] + ' ';
        }

        return match.slice(0, 4);
    },

    'CHILD': function(match) {
        /* matches from matchExpr['CHILD']
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
            match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === 'even' || match[3] === 'odd' ) );
            match[5] = +( ( match[7] + match[8] ) || match[3] === 'odd' );

        // other types prohibit arguments
        } else if (match[3]) {
            throw new Error(match[0]);
        }

        return match;
    },

    'PSEUDO': function(match) {
        var excess,
            unquoted = !match[6] && match[2];

        if (matchExpr['CHILD'].test(match[0])) {
            return null;
        }

        // Accept quoted arguments as-is
        if (match[3]) {
            match[2] = match[4] || match[5] || '';

        // Strip excess characters from unquoted arguments
        } else if (unquoted && rpseudo.test(unquoted) &&
            // Get excess from tokenize (recursively)
            (excess = tokenize(unquoted, true)) &&
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
 * @param  {Boolean} [parseOnly]
 * @return {String[]|Number} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]').
 */
var tokenize = function(selector, parseOnly) {
    var cached = tokenCache.get(selector);

    if (cached) {
        return parseOnly ? 0 : cached.slice( 0 );
    }

    // TODO: Use utils
    // TODO: Use cache
    var soFar = selector.trim();

    var type,
        regex,
        match,
        matched,
        groups = [],
        tokens = [];

    while (soFar) {
        // Comma and first run
        if (!matched || (match = rcomma.exec(soFar))) {
            if (match) {
                // Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar;
            }
            groups.push((tokens = []));
        }

        matched = null;

        // Combinators
        if ((match = rcombinators.exec(soFar))) {
            matched = match.shift();
            tokens.push({
                value: matched,
                match: match,
                // Cast descendant combinators to space
                type: match[0].replace(rtrim, ' ')
            });
            soFar = soFar.slice(matched.length);
        }

        // Filters
        for (type in matchExpr) {
            regex = matchExpr[type];
            match = regex.exec(soFar);

            if (match && (!preFilter[type] || (match = preFilter[type](match)))) {
                matched = match.shift();
                tokens.push({
                    value: matched,
                    match: match,
                    type: type
                });
                soFar = soFar.slice(matched.length);

                break;
            }
        }

        if (!matched) {
            break;
        }
    }

    // Return the length of the invalid excess
    // if we're just parsing
    // Otherwise, throw an error or return tokens
    return parseOnly ?
        soFar.length :
        soFar ?
            _throwError( selector ) :
            // Cache the tokens
            tokenCache.set(selector, groups).slice();
};

module.exports = {
    subqueries: tokenize
};
