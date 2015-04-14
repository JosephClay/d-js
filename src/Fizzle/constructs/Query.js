var find = function(selectors, context) {
    var result = [],
        idx = 0, length = selectors.length;
    for (; idx < length; idx++) {
        result = result.concat(selectors[idx].exec(context));
    }
    return result;
};

var Query = module.exports = function(selectors) {
    this._selectors = selectors;
};

Query.prototype = {
    exec: function(arr, isNew) {
        var result = [],
            idx = 0, length = isNew ? 1 : arr.length;
        for (; idx < length; idx++) {
            result = result.concat(find(this._selectors, arr[idx]));
        }
        return result;
    }
};
