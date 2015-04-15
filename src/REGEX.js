// having caches isn't actually faster
// for a majority of use cases for string
// manipulations
// http://jsperf.com/simple-cache-for-string-manip

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

var test = function(reg) {
    return (str) => reg.test(str);
};

module.exports = {
    singleTagMatch: (val) => SINGLE_TAG.exec(val),

    numNotPx:       test(NUM_NON_PX),
    position:       test(POSITION),
    isNoneOrTable:  test(NONE_OR_TABLE),
    isFocusable:    test(TYPE_TEST_FOCUSABLE),
    isClickable:    test(TYPE_TEST_CLICKABLE),
    isStrictId:     test(SELECTOR_ID),
    isTag:          test(SELECTOR_TAG),
    isClass:        test(SELECTOR_CLASS),
    isBoolAttr:     test(IS_BOOL_ATTR),

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
