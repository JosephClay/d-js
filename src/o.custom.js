var _ = require('_'),
    overload = require('overload');

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
    },
    'selector': function(val) {
        return val && (_.isString(val) || _.isFunction(val) || _.isElement(val) || _.isNodeList(val) || _.isArray(val) || val instanceof D);
    }
});

module.exports = overload.O;
