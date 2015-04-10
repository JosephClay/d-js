var _            = require('_'),
    isFunction   = require('is/function'),
    isString     = require('is/string'),
    Fizzle       = require('Fizzle');

module.exports = function(arr, qualifier) {
    // Early return, no qualifier. Everything matches
    if (!qualifier) { return arr; }

    // Function
    if (isFunction(qualifier)) {
        return _.filter(arr, qualifier);
    }

    // Element
    if (qualifier.nodeType) {
        return _.filter(arr, (elem) => elem === qualifier);
    }

    // Selector
    if (isString(qualifier)) {
        var is = Fizzle.is(qualifier);
        return _.filter(arr, (elem) => is.match(elem));
    }

    // Array qualifier
    return _.filter(arr, (elem) => _.contains(qualifier, elem));
};
