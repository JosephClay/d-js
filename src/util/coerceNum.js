var isString = require('is/string');

module.exports = function(val) {
            // Its a number! || 0 to avoid NaN (as NaN's a number)
    return +val === val ? (val || 0) :
           // Avoid NaN again
           isString(val) ? (+val || 0) :
           // Default to zero
           0;
};