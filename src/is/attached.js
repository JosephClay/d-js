var isDocumentFragment = require('nodeType').doc_frag;

module.exports = function(elem) {
    var parent;
    return elem                                &&
        elem.ownerDocument                     &&
        elem !== document                      &&
        (parent = elem.parentNode)             &&
        !isDocumentFragment(parent)            &&
        parent.isParseHtmlFragment !== true;
};