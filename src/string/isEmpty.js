var exists = require('is/exists');

module.exports = function(str) {
    return !exists(str) || str === '';
};