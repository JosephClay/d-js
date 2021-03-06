module.exports = function(arr, iterator) {
    var results = [];
    if (!arr.length || !iterator) { return results; }

    var idx = 0, length = arr.length,
        item;
    for (; idx < length; idx++) {
        item = arr[idx];
        results.push(iterator.call(item, item, idx));
    }

    // Concat flat for a single array of arrays
    return [].concat.apply([], results);
};