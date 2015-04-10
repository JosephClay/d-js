var constructor;
module.exports = (value) => value && value instanceof constructor;
module.exports.set = (D) => constructor = D;
