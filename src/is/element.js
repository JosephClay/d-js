var isWindow  = require('is/window'),
    isElement = require('nodeType').elem;

module.exports = (value) =>
    value && (value === document || isWindow(value) || isElement(value));
