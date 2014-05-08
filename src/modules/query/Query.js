var _ = require('_'),

    _array = require('../array'),
    _regex = require('../../regex'),
    _cache = require('../../cache'),

    _queryCache = _cache(),

    Selector = require('./Selector');

var Query = function(str) {
    this._selectors = _.fastmap(_regex.selector.commandSplit(str), function(selector) {
        return new Selector(selector);
    });
};
Query.prototype = {
    exec: function(arr) {
        var result = [],
            idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            result.push(this._find(arr[idx]));
        }

        return _array.elementSort(_.flatten(result));
    },
    _find: function(context) {
        var result = [],
            selectors = this._selectors,
            idx = 0, length = selectors.length;
        for (; idx < length; idx++) {
            result.push(selectors[idx].exec(context));
        }

        return result;
    }
};

module.exports = function(str) {
    return _queryCache.getOrSet(str, function() {
        return new Query(str);
    });
};
