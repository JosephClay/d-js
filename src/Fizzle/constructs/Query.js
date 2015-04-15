var find = function(selectors, context) {
    var result = [],
        idx = 0, length = selectors.length;
    for (; idx < length; idx++) {
        result = result.concat(selectors[idx].exec(context));
    }
    return result;
};

module.exports = function Query(selectors) {
    return {
        exec: function(arr, isNew) {
            var result = [],
                idx = 0, length = isNew ? 1 : arr.length;
            for (; idx < length; idx++) {
                result = result.concat(find(selectors, arr[idx]));
            }
            return result;
        }
    };
};

