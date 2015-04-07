var SUPPORTS = require('SUPPORTS');

module.exports = SUPPORTS.valueNormalized ?
    (str) => str :
    (str) => str ? str.replace(/\r\n/g, '\n') : str;