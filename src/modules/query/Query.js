var _ = require('_'),

    _array = require('../array'),
    _regex = require('../../regex'),
    _cache = require('../../cache'),

    _queryCache = _cache(),

    Selector = require('./Selector'),
    _normalizeSelector = require('./normalizeSelector');

var Query = function(str) {
    str = _normalizeSelector(str);

    var result = _regex.selector.commandSplit(str);
    this._selectors = _.map(result, function(selector) {
        console.log('result: ', result);
        console.log('str: ', str);
        return new Selector(selector);
    });
};
Query.prototype = {
    exec: function(arr, isNew) {
        var result = [],
            idx = 0, length = isNew ? 1 : arr.length;
        for (; idx < length; idx++) {
            result.push(this._find(arr[idx]));
        }

        result = _.flatten(result);
        _array.elementSort(result);
        return result;
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
