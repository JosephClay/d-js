var NODE_TYPE = require('NODE_TYPE');
module.exports = function(elem) {
    return !!(
        elem                                                      &&
        elem.ownerDocument                                        &&
        elem !== document                                         &&
        elem.parentNode                                           &&
        elem.parentNode.nodeType !== NODE_TYPE.DOCUMENT_FRAGMENT  &&
        elem.parentNode.isParseHtmlFragment !== true
    );
};