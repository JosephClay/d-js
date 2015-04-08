var ELEMENT = require('NODE_TYPE/ELEMENT');

module.exports = (elem) =>
        elem && elem.nodeType === ELEMENT;
