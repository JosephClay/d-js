var overload = require('overload');

// Configure overload to throw type errors
overload.prototype.err = function() {
    throw new TypeError();
};
overload.defineType('D', function(obj) {
    return obj && obj instanceof D;
});
overload.defineType('nodeList', function(obj) {
    return obj && (obj instanceof NodeList || obj instanceof HTMLCollection);
});
overload.defineType('window', function(val) {
    return val && val.window === window;
});
overload.defineType('document', function(val) {
    return val && val === document;
});

module.exports = overload.O;