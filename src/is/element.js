var isWindow = require('is/window'),
    ELEMENT  = require('NODE_TYPE/ELEMENT');

module.exports = function(val) {
    return val && (val === document || isWindow(val) || val.nodeType === ELEMENT);
};
