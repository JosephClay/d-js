var _ = require('_'),
    _array = require('../../array');

var Query = module.exports = function(selectors) {
    this._selectors = selectors;
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
