var isWindow = require('is/window'),
    ELEMENT  = require('NODE_TYPE/ELEMENT');

module.exports = (value) =>
    value && (value === document || isWindow(value) || value.nodeType === ELEMENT);
