var _ = require('_');

var match = function(context, selectors) {
    var idx = selectors.length;
    while (idx--) {
        if (selectors[idx].match(context)) { return true; }
    }

    return false;
};

module.exports = function Is(selectors) {
    return {
        match: function(context) {
            return match(context, selectors);
        },

        any: function(arr) {
            return _.any(arr, (elem) =>
                match(elem, selectors) ? true : false
            );
        },

        not: function(arr) {
            return _.filter(arr, (elem) =>
                !match(elem, selectors) ? true : false
            );
        }
    };
};