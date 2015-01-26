var _ = require('underscore'),
    overload = require('overload-js');

// Configure overload to throw type errors
overload.err = function() {
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
        return _.isNodeList(val);
    },
    'window': function(val) {
        return _.isWindow(val);
    },
    'document': function(val) {
        return val && val === document;
    },
    'selector': function(val) {
        return val && (_.isString(val) || _.isFunction(val) || _.isElement(val) || _isCollection(val));
    },
    'collection': function(val) {
        return val && _isCollection(val);
    },
    'element': function(val) {
        return val === document || _.isWindow(val) || _.isElement(val);
    }
});
