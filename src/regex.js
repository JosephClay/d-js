    // Matches "-ms-" so that it can be changed to "ms-"
var _TRUNCATE_MS_PREFIX  = /^-ms-/,

    // Matches dashed string for camelizing
    _DASH_CATCH          = /-([\da-z])/gi,

    // Matches "none" or a table type e.g. "table",
    // "table-cell" etc...
    _NONE_OR_TABLE       = /^(none|table(?!-c[ea]).+)/,
    
    _TYPE_TEST_FOCUSABLE = /^(?:input|select|textarea|button|object)$/i,
    _TYPE_TEST_CLICKABLE = /^(?:a|area)$/i,
    _SELECTOR_ID         = /^#([\w-]+)$/,
    _SELECTOR_TAG        = /^[\w-]+$/,
    _SELECTOR_CLASS      = /^\.([\w-]+)$/,
    _POSITION            = /^(top|right|bottom|left)$/,
    _NUM_NON_PX          = new RegExp('^(' + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ')(?!px)[a-z%]+$', 'i'),
    _SINGLE_TAG          = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

    /**
     * Map of parent tag names to the child tags that require them.
     * @type {Object}
     */
    _PARENT_MAP = {
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
    numNotPx: (val) => _NUM_NON_PX.test(val),
    position: (val) => _POSITION.test(val),
    singleTagMatch: (val) => _SINGLE_TAG.exec(val),
    isNoneOrTable: (str) => _NONE_OR_TABLE.test(str),
    isFocusable: (str) => _TYPE_TEST_FOCUSABLE.test(str),
    isClickable: (str) => _TYPE_TEST_CLICKABLE.test(str),
    isStrictId: (str) => _SELECTOR_ID.test(str),
    isTag: (str) => _SELECTOR_TAG.test(str),
    isClass: (str) => _SELECTOR_CLASS.test(str),

    camelCase: function(str) {
        return str.replace(_TRUNCATE_MS_PREFIX, 'ms-')
            .replace(_DASH_CATCH, (match, letter) => letter.toUpperCase());
    },

    getParentTagName: function(str) {
        var val = str.substr(0, 30);
        for (var parentTagName in _PARENT_MAP) {
            if (_PARENT_MAP[parentTagName].test(val)) {
                return parentTagName;
            }
        }
        return 'div';
    }
};
