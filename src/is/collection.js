var isArray    = require('is/array'),
    isNodeList = require('is/nodeList'),
    isD        = require('is/D');

module.exports = (value) =>
    isD(value) || isArray(value) || isNodeList(value);
