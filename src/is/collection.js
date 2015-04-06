var isArray    = require('is/array'),
    isNodeList = require('is/nodeList'),
    isD        = require('is/d');

module.exports = function(val) {
    return isD(val) || isArray(val) || isNodeList(val);
};