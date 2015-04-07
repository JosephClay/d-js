    // Matches "-ms-" so that it can be changed to "ms-"
var _TRUNCATE_MS_PREFIX  = /^-ms-/,

    _ALPHA               = /alpha\([^)]*\)/i,
    _OPACITY             = /opacity\s*=\s*([^)]*)/,

    // Matches dashed string for camelizing
    _DASH_CATCH          = /-([\da-z])/gi,

    // Matches "none" or a table type e.g. "table",
    // "table-cell" etc...
    _NONE_OR_TABLE       = /^(none|table(?!-c[ea]).+)/,

    _TYPE_TEST_FOCUSABLE = /^(?:input|select|textarea|button|object)$/i,
    _TYPE_TEST_CLICKABLE = /^(?:a|area)$/i,
    _TYPE_NAMESPACE      = /^([^.]*)(?:\.(.+)|)$/,

    _SELECTOR_ID         = /^#([\w-]+)$/,
    _SELECTOR_TAG        = /^[\w-]+$/,
    _SELECTOR_CLASS      = /^\.([\w-]+)$/,

    _POSITION            = /^(top|right|bottom|left)$/,

    _NUM_NON_PX          = new RegExp('^(' + (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source + ')(?!px)[a-z%]+$', 'i'),

    _WHITESPACE          = '[\\x20\\t\\r\\n\\f]',
    _NEEDS_CONTEXT       = new RegExp('^' + _WHITESPACE + '*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(' + _WHITESPACE + '*((?:-\\d)?\\d*)' + _WHITESPACE + '*\\)|)(?=[^-]|$)', 'i'),

    _FOCUS_MORPH         = /^(?:focusinfocus|focusoutblur)$/,
    _MOUSE_EVENT         = /^(?:mouse|contextmenu)|click/,
    _KEY_EVENT           = /^key/,

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
    },

    _NOT_WHITE = /\S+/g;

// having caches isn't actually faster
// for a majority of use cases for string
// manipulations
// http://jsperf.com/simple-cache-for-string-manip
module.exports = {
    alpha: _ALPHA,
    opacity: _OPACITY,

    camelCase: function(str) {
        return str.replace(_TRUNCATE_MS_PREFIX, 'ms-')
            .replace(_DASH_CATCH, (match, letter) => letter.toUpperCase());
    },

    numNotPx: (val) => _NUM_NON_PX.test(val),

    position: (val) => _POSITION.test(val),

    needsContext: (val) => _NEEDS_CONTEXT.test(val),

    focusMorph: (val) => _FOCUS_MORPH.test(val),

    mouseEvent: (val) => _MOUSE_EVENT.test(val),

    keyEvent: (val) => _KEY_EVENT.test(val),

    singleTagMatch: (val) => _SINGLE_TAG.exec(val),

    getParentTagName: function(str) {
        var val = str.substr(0, 30);
        for (var parentTagName in _PARENT_MAP) {
            if (_PARENT_MAP[parentTagName].test(val)) {
                return parentTagName;
            }
        }
        return 'div';
    },

    typeNamespace: (val) => _TYPE_NAMESPACE.exec(val),

    matchNotWhite: (val) => (val || '').match(_NOT_WHITE),

    display: {
        isNoneOrTable: (str) => _NONE_OR_TABLE.test(str)
    },

    type: {
        isFocusable: (str) => _TYPE_TEST_FOCUSABLE.test(str),
        isClickable: (str) => _TYPE_TEST_CLICKABLE.test(str)
    },

    selector: {
        isStrictId: (str) => _SELECTOR_ID.test(str),
        isTag: (str) => _SELECTOR_TAG.test(str),
        isClass: (str) => _SELECTOR_CLASS.test(str)
    }
};
