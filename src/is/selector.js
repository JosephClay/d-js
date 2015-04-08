var isFunction   = require('is/function'),
    isString     = require('is/string'),
    isElement    = require('is/element'),
    isCollection = require('is/collection');

module.exports = (val) =>
    val && (isString(val) || isFunction(val) || isElement(val) || isCollection(val));