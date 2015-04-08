var exists      = require('is/exists'),
    isArray     = require('is/array'),
    isString    = require('is/string'),
    isNodeList  = require('is/nodeList'),
    isArguments = require('is/arguments'),
    isNumber    = require('is/number');

// TODO: Can this be simplified down to a straight +length === length?
module.exports = function(value) {
    if (!exists(value) || isString(value)) {
        return false;
    }

    if (isArray(value)) {
        return true;
    }
    if (isNodeList(value)) {
        return true;
    }
    if (isArguments(value)) {
        return true;
    }
    if (isNumber(value.length) && ('0' in value)) {
        return true;
    }
    return false;
};