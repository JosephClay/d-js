var _ = require('_'),
    overload = require('overload');

// Configure overload to throw type errors
overload.prototype.err = function() {
    throw new TypeError();
};

var _isD = function(val) {
    return val instanceof D;
};

var _isCollection = function(val) {
    return _isD(val) || _.isArray(val) || _.isNodeList(val);
};

overload.defineTypes({
    'D': function(val) {
        return val && _isD(val);
    },
    'nodeList': function(val) {
        return val && _.isNodeList(val);
    },
    'window': function(val) {
        return val && val.window === window;
    },
    'document': function(val) {
        return val && val === document;
    },
    'selector': function(val) {
        return val && (_.isString(val) || _.isFunction(val) || _.isElement(val) || _isCollection(val));
    },
    'collection': function(val) {
        return val && _isCollection(val);
    }
});

module.exports = overload.O;
