var _          = require('../_'),
    queryCache = require('../cache')(),
    isCache    = require('../cache')(),
    Selector   = require('./constructs/Selector'),
    Query      = require('./constructs/Query'),
    Is         = require('./constructs/Is'),
    parse      = require('./selector/selector-parse'),
    normalize  = require('./selector/selector-normalize');

var toSelectors = function(str) {
    // Selectors will return null if the query was invalid.
    // Not returning early or doing extra checks as this will
    // noop on the Query and Is level and is the exception
    // instead of the rule
    var selectors = parse(str) || [];

    // Normalize each of the selectors...
    selectors = _.map(selectors, normalize);

    // ...and map them to Selector objects
    return _.fastmap(selectors, (selector) => new Selector(selector));
};

module.exports = {
    selector: toSelectors,
    parse: parse,
    
    query: function(str) {
        return queryCache.has(str) ? 
            queryCache.get(str) : 
            queryCache.put(str, () => new Query(toSelectors(str)));
    },
    is: function(str) {
        return isCache.has(str) ? 
            isCache.get(str) : 
            isCache.put(str, () => new Is(toSelectors(str)));
    }
};

