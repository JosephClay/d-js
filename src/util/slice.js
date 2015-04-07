var slice = [].slice;
module.exports = function(arr, start, end) {
    // Exit early for empty array
    if (!arr || !arr.length) { return []; }

    // End, naturally, has to be higher than 0 to matter,
    // so a simple existence check will do
    if (end) { return slice.call(arr, start, end); }

    return slice.call(arr, start || 0);
};