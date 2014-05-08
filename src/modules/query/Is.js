var _ = require('_'),

    _regex = require('../../regex'),
    _cache = require('../../cache'),

    _isCache = _cache(),

    Selector = require('./Selector'),

    _isMatch = require('./match'),
    _normalizeSelector = require('./normalizeSelector');

var Is = function(str) {
    str = _normalizeSelector(str);

    this._selectors = _.map(_regex.selector.commandSplit(str), function(selector) {
        return new Selector(selector);
    });
};
Is.prototype = {
    exec: function(arr) {
         return _.any(arr, function(elem) {
            return _isMatch(elem, selector);
        });
    }
};

module.exports = function(str) {
    return _isCache.getOrSet(str, function() {
        return new Is(str);
    });
};
