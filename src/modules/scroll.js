var coerceNum = require('util/coerceNum'),
    exists    = require('is/exists');

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
