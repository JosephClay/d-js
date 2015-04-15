var isElement       = require('nodeType').elem,
    DIV             = require('DIV'),
    // Support: IE9+, modern browsers
    matchesSelector = DIV.matches               ||
                      DIV.matchesSelector       ||
                      DIV.msMatchesSelector     ||
                      DIV.mozMatchesSelector    ||
                      DIV.webkitMatchesSelector ||
                      DIV.oMatchesSelector;

// only element types supported
module.exports = (elem, selector) =>
    isElement(elem) ? matchesSelector.call(elem, selector) : false;
