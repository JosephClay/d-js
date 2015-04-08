var isString = require('is/string');

module.exports = (value) =>
    // Its a number! || 0 to avoid NaN (as NaN's a number)
    +value === value ? (value || 0) :
    // Avoid NaN again
    isString(value) ? (+value || 0) :
    // Default to zero
    0;
