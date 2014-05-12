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
    var selector = _normalize(str),
        selectors = _parse.subqueries(selector);
    return _.map(selectors, function(selector) {
        return new Selector(selector);
    });
};

module.exports = {
    query: function(str) {
        return _queryCache.getOrSet(str, function() {
            return new Query(_toSelectors(str));
        });
    },
    is: function() {
        return _isCache.getOrSet(str, function() {
            return new Is(_toSelectors(str));
        });
    }
};

