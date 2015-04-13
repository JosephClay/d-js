module.exports = function(obj, iterator) {
    if (!obj || !iterator) { return; }

    // Array support
    if (obj.length === +obj.length) {
        var idx = 0, length = obj.length,
            item;
        for (; idx < length; idx++) {
            item = obj[idx];
            if (iterator.call(item, item, idx) === false) { return; }
        }

        return;
    }

    // Object support
    var key, value;
    for (key in obj) {
        value = obj[key];
        if (iterator.call(value, value, key) === false) { return; }
    }
};