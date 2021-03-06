var tokenCache = require('cache')(),

    tokenize = function(str) {
        var arr = str.split(', '),
            idx = arr.length,
            selector;
        while (idx--) {
            selector = arr[idx] = arr[idx].trim();
            if (selector === ''  ||
                selector === '#' ||
                selector === '.') {
                return null;
            }
        }
        return arr;
    };

/**
 * Splits the given comma-separated CSS selector into separate sub-queries.
 * @param  {String} selector Full CSS selector (e.g., 'a, input:focus, div[attr="value"]').
 * @return {String[]} Array of sub-queries (e.g., [ 'a', 'input:focus', 'div[attr="(value1),[value2]"]').
 */
module.exports = function(selector) {
    var tokens = tokenCache.has(selector) ? 
        tokenCache.get(selector) : 
        tokenCache.set(selector, tokenize(selector));

    if (!tokens) {
        console.error(`d-js: Invalid query selector "${selector}"`);
        return [];
    }

    return tokens.slice();
};
