var ELEMENT         = require('NODE_TYPE/ELEMENT'),
    DIV             = require('DIV'),
    // Support: IE9+, modern browsers
    matchesSelector = DIV.matches               ||
                      DIV.matchesSelector       ||
                      DIV.msMatchesSelector     ||
                      DIV.mozMatchesSelector    ||
                      DIV.webkitMatchesSelector ||
                      DIV.oMatchesSelector;

module.exports = (elem, selector) =>
    elem.nodeType === ELEMENT ? matchesSelector.call(elem, selector) : false;

// Prevent memory leaks in IE
DIV = null;
