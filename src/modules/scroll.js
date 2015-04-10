var isString = require('is/string'),
    exists   = require('is/exists');

var coerceNum = (value) =>
    // Its a number! || 0 to avoid NaN (as NaN's a number)
    +value === value ? (value || 0) :
    // Avoid NaN again
    isString(value) ? (+value || 0) :
    // Default to zero
    0;

var protect = function(context, val, callback) {
    var elem = context[0];
    if (!elem && !exists(val)) { return null; }
    if (!elem) { return context; }

    return callback(context, elem, val);
};

var handler = function(attribute) {
    return function(context, elem, val) {
        if (exists(val)) {
            elem[attribute] = coerceNum(val);
            return context;
        }

        return elem[attribute];
    };
};

var scrollTop = handler('scrollTop');
var scrollLeft = handler('scrollLeft');

exports.fn = {
    scrollLeft: function(val) {
        return protect(this, val, scrollLeft);
    },

    scrollTop: function(val) {
        return protect(this, val, scrollTop);
    }
};
