var _          = require('../_'),
    queryCache = require('../cache')(),
    isCache    = require('../cache')(),
    selector   = require('./constructs/selector'),
    query      = require('./constructs/query'),
    is         = require('./constructs/is'),
    parse      = require('./selector/selector-parse'),
    normalize  = require('./selector/selector-normalize');

var toSelectors = function(str) {
    return _.fastmap(
        _.fastmap(
            // Selectors will return [] if the query was invalid.
            // Not returning early or doing extra checks as this will
            // noop on the query and is level and is the exception
            // instead of the rule
            parse(str),
            // Normalize each of the selectors...
            normalize
        ),
        // ...and map them to selector objects
        selector
    );
};

module.exports = {
    selector: toSelectors,
    parse: parse,
    
    query: function(str) {
        return queryCache.has(str) ? 
            queryCache.get(str) : 
            queryCache.set(str, query(toSelectors(str)));
    },
    is: function(str) {
        return isCache.has(str) ? 
            isCache.get(str) : 
            isCache.set(str, is(toSelectors(str)));
    }
};

