var DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT');

module.exports = function(elem) {
    return elem                                         &&
        elem.ownerDocument                              &&
        elem !== document                               &&
        elem.parentNode                                 &&
        elem.parentNode.nodeType !== DOCUMENT_FRAGMENT  &&
        elem.parentNode.isParseHtmlFragment !== true;
};