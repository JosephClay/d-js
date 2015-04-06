var exists      = require('is/exists'),
    isArray     = require('is/array'),
    isString    = require('is/string'),
    isNodeList  = require('is/nodeList'),
    isArguments = require('is/arguments'),
    isNumber    = require('is/number');

// TODO: Can this be simplified down to a straight +length === length?
module.exports = function(obj) {
    if (!exists(obj) || isString(obj)) {
        return false;
    }

    if (isArray(obj)) {
        return true;
    }
    if (isNodeList(obj)) {
        return true;
    }
    if (isArguments(obj)) {
        return true;
    }
    if (isNumber(obj.length) && ('0' in obj)) {
        return true;
    }
    return false;
};