var overload = require('overload');

// Configure overload to throw type errors
overload.prototype.err = function() {
    throw new TypeError();
};
overload.defineTypes({
    'D': function(obj) {
        return obj && obj instanceof D;
    },
    'nodeList': function(obj) {
        return obj && (obj instanceof NodeList || obj instanceof HTMLCollection);
    },
    'window': function(val) {
        return val && val.window === window;
    },
    'document': function(val) {
        return val && val === document;
    }
});

module.exports = overload.O;
