var isFunction   = require('is/function'),
    isString     = require('is/string'),
    isElement    = require('is/element'),
    isCollection = require('is/collection');

module.exports = function(val) {
    return val && (isString(val) || isFunction(val) || isElement(val) || isCollection(val));
};