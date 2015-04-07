module.exports = function(elem, name) {
    return elem.nodeName.toLowerCase() === name.toLowerCase();
};