var _isNodeList = function(item) {
    return item instanceof NodeList;
};

var _flatten = function(arr) {
    var result = [];

    var idx = 0, length = arr.length,
        value;
    for (; idx < length; idx++) {
        value = arr[idx];

        if (_.isArray(value) || _isNodeList(value)) {
            _flatten(value, shallow, result);
        } else {
            result.push(value);
        }
    }

    return result;
};
module.exports = {
    flatten: _flatten,
    isNodeList: _isNodeList
};