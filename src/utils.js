var array = require('./modules/array');

var _BEGINNING_NEW_LINES = /^[\n]*/;

module.exports = {
    exists: function(val) {
        return (val !== null && val !== undefined);
    },

    isHTML: function(text) {
        if (!_.isString(text)) { return false; }

        // TODO: Using es5 native method (trim)
        text = text.trim();
        text = text.replace(_BEGINNING_NEW_LINES, '');

        return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
    },

    unique: function(results) {
        var hasDuplicates = array.elementSort(results);
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
    },

    merge: function(first, second) {
        var length = second.length,
            idx = 0,
            i = first.length;

        // Go through each element in the
        // second array and add it to the
        // first
        for (; idx < length; idx++) {
            first[i++] = second[idx];
        }

        first.length = i;

        return first;
    }
};
