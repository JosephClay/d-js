// http://ejohn.org/blog/comparing-document-position/
// https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition
module.exports = {
    IDENTICAL               :  0,
    DISCONNECTED            :  1,
    PRECEDING               :  2,
    FOLLOWING               :  4,
    CONTAINS                :  8,
    CONTAINED_BY            : 16,
    IMPLEMENTATION_SPECIFIC : 32
};
