// Breaks even on arrays with 3 items. 3 or more
// items starts saving space
module.exports = function(str, delimiter) {
    return str.split(delimiter || '|');
};