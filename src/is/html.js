var isString = require('is/string');
module.exports = function(val) {
    if (!isString(val)) { return false; }

    var text = val.trim();
    return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
};