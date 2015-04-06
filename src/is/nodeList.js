// NodeList check. For our purposes, a NodeList and an HTMLCollection are the same.
module.exports = function(obj) {
    return obj && (
        obj instanceof NodeList ||
        obj instanceof HTMLCollection
    );
};