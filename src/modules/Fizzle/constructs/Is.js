var _ = require('underscore');

var Is = module.exports = function(selectors) {
    this._selectors = selectors;
};
Is.prototype = {
    match: function(context) {
        var selectors = this._selectors,
            idx = selectors.length;

        while (idx--) {
            if (selectors[idx].match(context)) { return true; }
        }

        return false;
    },

    any: function(arr) {
        return _.any(arr, (elem) =>
            this.match(elem) ? true : false
        );
    },

    not: function(arr) {
        return _.filter(arr, (elem) =>
            !this.match(elem) ? true : false
        );
    }
};

