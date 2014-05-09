var _ = require('_'),

    _regex = require('../../regex'),
    _cache = require('../../cache'),

    _isCache = _cache(),

    Selector = require('./Selector'),

    _normalizeSelector = require('./normalizeSelector');

var Is = function(str) {
    str = _normalizeSelector(str);

    this._selectors = _.map(_regex.selector.commandSplit(str), function(selector) {
        return new Selector(selector);
    });
};
Is.prototype = {
    match: function(context) {
        var selectors = this._selectors,
            idx = selectors.length;

        while (idx--) {
            if (selectors[idx].match(context)) { return true; }
        }

        return false;
    },

    exec: function(arr) {
        var self = this;
         return _.any(arr, function(elem) {
            if (self.match(elem)) { return true; }
        });
    }
};

module.exports = function(str) {
    return _isCache.getOrSet(str, function() {
        return new Is(str);
    });
};
