var SUPPORTS        = require('SUPPORTS'),
    ELEMENT         = require('NODE_TYPE/ELEMENT'),
    matchesSelector = SUPPORTS.matchesSelector;

module.exports = (elem, selector) =>
    elem.nodeType !== ELEMENT ? 
    false :
    matchesSelector.call(elem, selector);
