var _ = require('_'),

    _cache = require('../../cache'),

    _queryCache = _cache(),
    _isCache    = _cache(),

    Selector = require('./constructs/Selector'),
    Query = require('./constructs/Query'),
    Is = require('./constructs/Is'),

    _parse = require('./selector/selector-parse'),
    _normalize = require('./selector/selector-normalize');

var _toSelectors = function(str) {
    // Selectors will return null if the query was invalid.
    // Not returning early or doing extra checks as this will
    // noop on the Query and Is level and is the exception
    // instead of the rule
    var selectors = _parse.subqueries(str) || [];
    
    // Normalize each of the selectors...
    selectors = _.map(selectors, _normalize);

    // ...and map them to Selector objects
    return _.fastmap(selectors, function(selector) {
        return new Selector(selector);
    });
};

module.exports = {
    query: function(str) {
        return _queryCache.getOrSet(str, function() {
            return new Query(_toSelectors(str));
        });
    },
    is: function(str) {
        return _isCache.getOrSet(str, function() {
            return new Is(_toSelectors(str));
        });
    }
};

