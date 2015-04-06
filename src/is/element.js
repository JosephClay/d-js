var isWindow  = require('is/window'),
    NODE_TYPE = require('NODE_TYPE');

module.exports = function(val) {
    return val && (val === document || isWindow(val) || val.nodeType === NODE_TYPE.ELEMENT);
};
