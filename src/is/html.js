var isString = require('is/string');

module.exports = function(value) {
    if (!isString(value)) { return false; }

    var text = value.trim();
    return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
};