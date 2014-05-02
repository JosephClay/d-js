var _BEGINNING_NEW_LINES = /^[\n]*/;

module.exports = {
    exists: function(val) {
        return (val !== null && val !== undefined);
    },

    isHtml: function(text) {
        if (!_.isString(text)) { return false; }

        // TODO: Using es5 native method (trim)
        text = text.trim();
        text = text.replace(_BEGINNING_NEW_LINES, '');

        return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
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
