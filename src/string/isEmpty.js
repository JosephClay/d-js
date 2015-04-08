var exists = require('is/exists');

module.exports = (str) => !exists(str) || str === '';