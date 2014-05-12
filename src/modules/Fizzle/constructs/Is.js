var _ = require('_');

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

    exec: function(arr) {
        var self = this;
        return _.any(arr, function(elem) {
            if (self.match(elem)) { return true; }
        });
    }
};

