var toString = Object.prototype.toString;

module.exports = (value) => toString.call(value) === '[object Arguments]';