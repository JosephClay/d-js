var _                 = require('underscore'),

    _cache            = require('cache'),

    _camelCache         = _cache(),
    _displayCache       = _cache(),
    _focusableCache     = _cache(),
    _clickableCache     = _cache(),
    _idCache            = _cache(),
    _tagCache           = _cache(),
    _numNotPxCache      = _cache(),
    _positionCache      = _cache(),
    _classCache         = _cache(),
    _needContextCache   = _cache(),
    _focusMorphCache    = _cache(),
    _mouseEventCache    = _cache(),
    _keyEventCache      = _cache(),
    _singleTagCache     = _cache(),
    _parentCache        = _cache(),
    _typeNamespaceCache = _cache(),
    _notWhiteCache      = _cache();

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
    _PARENT_MAP          = {
        'table':    /^<(?:tbody|tfoot|thead|colgroup|caption)\b/,
        'tbody':    /^<(?:tr)\b/,
        'tr':       /^<(?:td|th)\b/,
        'colgroup': /^<(?:col)\b/,
        'select':   /^<(?:option)\b/
    },

    _NOT_WHITE           = /\S+/g;

var _camelCase = function(match, letter) {
    return letter.toUpperCase();
};

module.exports = {
    alpha: _ALPHA,
    opacity: _OPACITY,

    camelCase: function(str) {
        return _camelCache.getOrSet(str, function() {
            return str.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, _camelCase);
        });
    },

    numNotPx: function(val) {
        return _numNotPxCache.getOrSet(val, function() {
            return _NUM_NON_PX.test(val);
        });
    },

    position: function(val) {
        return _positionCache.getOrSet(val, function() {
            return _POSITION.test(val);
        });
    },

    needsContext: function(val) {
        return _needContextCache.getOrSet(val, function() {
            return _NEEDS_CONTEXT.test(val);
        });
    },

    focusMorph: function(val) {
        return _focusMorphCache.getOrSet(val, function() {
            return _FOCUS_MORPH.test(val);
        });
    },

    mouseEvent: function(val) {
        return _mouseEventCache.getOrSet(val, function() {
            return _MOUSE_EVENT.test(val);
        });
    },

    keyEvent: function(val) {
        return _keyEventCache.getOrSet(val, function() {
            return _KEY_EVENT.test(val);
        });
    },

    singleTagMatch: function(val) {
        return _singleTagCache.getOrSet(val, function() {
            return _SINGLE_TAG.exec(val);
        });
    },

    getParentTagName: function(val) {
        val = val.substr(0, 30);
        return _parentCache.getOrSet(val, function() {
            var parentTagName;
            for (parentTagName in _PARENT_MAP) {
                if (_PARENT_MAP[parentTagName].test(val)) {
                    return parentTagName;
                }
            }
            return 'div';
        });
    },

    typeNamespace: function(val) {
        return _typeNamespaceCache.getOrSet(val, function() {
            return _TYPE_NAMESPACE.exec(val);
        });
    },

    matchNotWhite: function(val) {
        val = val || '';
        return _notWhiteCache.getOrSet(val, function() {
            return val.match(_NOT_WHITE);
        });
    },

    display: {
        isNoneOrTable: function(str) {
            return _displayCache.getOrSet(str, function() {
                return _NONE_OR_TABLE.test(str);
            });
        }
    },

    type: {
        isFocusable: function(str) {
            return _focusableCache.getOrSet(str, function() {
                return _TYPE_TEST_FOCUSABLE.test(str);
            });
        },
        isClickable: function(str) {
            return _clickableCache.getOrSet(str, function() {
                return _TYPE_TEST_CLICKABLE.test(str);
            });
        }
    },

    selector: {
        isStrictId: function(str) {
            return _idCache.getOrSet(str, function() {
                return _SELECTOR_ID.test(str);
            });
        },
        isTag: function(str) {
            return _tagCache.getOrSet(str, function() {
                return _SELECTOR_TAG.test(str);
            });
        },
        isClass: function(str) {
            return _classCache.getOrSet(str, function() {
                return _SELECTOR_CLASS.test(str);
            });
        }
    }
};
