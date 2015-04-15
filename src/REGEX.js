    // Matches "-ms-" so that it can be changed to "ms-"
var TRUNCATE_MS_PREFIX  = /^-ms-/,

    // Matches dashed string for camelizing
    DASH_CATCH          = /-([\da-z])/gi,

    // Matches "none" or a table type e.g. "table",
    // "table-cell" etc...
    NONE_OR_TABLE       = /^(none|table(?!-c[ea]).+)/,
    
    TYPE_TEST_FOCUSABLE = /^(?:input|select|textarea|button|object)$/i,
    TYPE_TEST_CLICKABLE = /^(?:a|area)$/i,
    SELECTOR_ID         = /^#([\w-]+)$/,
    SELECTOR_TAG        = /^[\w-]+$/,
    SELECTOR_CLASS      = /^\.([\w-]+)$/,
    POSITION            = /^(top|right|bottom|left)$/,
    NUM_NON_PX          = new RegExp('^(' + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ')(?!px)[a-z%]+$', 'i'),
    SINGLE_TAG          = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    IS_BOOL_ATTR        = /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i,

    /**
     * Map of parent tag names to the child tags that require them.
     * @type {Object}
     */
    PARENT_MAP = {
        table:    /^<(?:tbody|tfoot|thead|colgroup|caption)\b/,
        tbody:    /^<(?:tr)\b/,
        tr:       /^<(?:td|th)\b/,
        colgroup: /^<(?:col)\b/,
        select:   /^<(?:option)\b/
    };

// having caches isn't actually faster
// for a majority of use cases for string
// manipulations
// http://jsperf.com/simple-cache-for-string-manip
module.exports = {
    // TODO:
    numNotPx:       (val) => NUM_NON_PX.test(val),
    position:       (val) => POSITION.test(val),
    singleTagMatch: (val) => SINGLE_TAG.exec(val),
    isNoneOrTable:  (str) => NONE_OR_TABLE.test(str),
    isFocusable:    (str) => TYPE_TEST_FOCUSABLE.test(str),
    isClickable:    (str) => TYPE_TEST_CLICKABLE.test(str),
    isStrictId:     (str) => SELECTOR_ID.test(str),
    isTag:          (str) => SELECTOR_TAG.test(str),
    isClass:        (str) => SELECTOR_CLASS.test(str),
    isBoolAttr:     (str) => IS_BOOL_ATTR.test(str),

    camelCase: function(str) {
        return str.replace(TRUNCATE_MS_PREFIX, 'ms-')
            .replace(DASH_CATCH, (match, letter) => letter.toUpperCase());
    },

    getParentTagName: function(str) {
        var val = str.substr(0, 30);
        for (var parentTagName in PARENT_MAP) {
            if (PARENT_MAP[parentTagName].test(val)) {
                return parentTagName;
            }
        }
        return 'div';
    }
};
