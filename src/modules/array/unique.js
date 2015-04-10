var order = require('order');

module.exports = function(results) {
    var hasDuplicates = order.sort(results);
    if (!hasDuplicates) { return results; }

    var elem,
        idx = 0,
        // create the array here
        // so that a new array isn't
        // created/destroyed every unique call
        duplicates = [];

    // Go through the array and identify
    // the duplicates to be removed
    while ((elem = results[idx++])) {
        if (elem === results[idx]) {
            duplicates.push(idx);
        }
    }

    // Remove the duplicates from the results
    idx = duplicates.length;
    while (idx--) {
       results.splice(duplicates[idx], 1);
    }

    return results;
};