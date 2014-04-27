var div = require('./div');

module.exports = {
    classList: !!div.classList,
    matchesSelector: div.matches || div.matchesSelector || div.msMatchesSelector || div.mozMatchesSelector || div.webkitMatchesSelector || div.oMatchesSelector
};