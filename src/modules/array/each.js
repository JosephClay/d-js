// differs from forEach in that the idx (or key) is first, then the value
module.exports = function(obj, iterator) {
    if (!obj || !iterator) { return; }

    // Array support
    if (obj.length === +obj.length) {
        var idx = 0, length = obj.length,
            item;
        for (; idx < length; idx++) {
            item = obj[idx];
            if (iterator.call(item, idx, item) === false) { return; }
        }

        return;
    }

    // Object support
    var key, value;
    for (key in obj) {
        value = obj[key];
        if (iterator.call(value, key, value) === false) { return; }
    }
};