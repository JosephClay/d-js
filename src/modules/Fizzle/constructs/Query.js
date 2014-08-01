var _ = require('_');

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

        // if there's only one arr in result, we can
        // use that and skip flattening
        result = result.length === 1 ? result[0] : _.flatten(result);

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
