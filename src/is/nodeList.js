// NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
module.exports = function(value) {
    return value && (
        value instanceof NodeList ||
        value instanceof HTMLCollection
    );
};