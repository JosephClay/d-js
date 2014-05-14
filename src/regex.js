var _ = require('_'),

    _cache = require('./cache'),

    _camelCache     = _cache(),
    _displayCache   = _cache(),
    _focusableCache = _cache(),
    _clickableCache = _cache(),
    _commandCache   = _cache(),
    _idCache        = _cache(),
    _tagCache       = _cache(),
    _classCache     = _cache();

    // Matches "-ms-" so that it can be changed to "ms-"
var _TRUNCATE_MS_PREFIX = /^-ms-/,

    // Matches dashed string for camelizing
    _DASH_CATCH = /-([\da-z])/gi,

    // Matches "none" or a table type e.g. "table",
    // "table-cell" etc...
    _NONE_OR_TABLE = /^(none|table(?!-c[ea]).+)/,

    _TYPE_TEST = {
        focusable: /^(?:input|select|textarea|button|object)$/i,
        clickable: /^(?:a|area)$/i
    },

    _SELECTOR = {
        id:    /^#([\w-]+)$/,
        tag:   /^[\w-]+$/,
        klass: /^\.([\w-]+)$/
    };

var _camelCase = function(match, letter) {
    return letter.toUpperCase();
};

module.exports = {
    alpha: /alpha\([^)]*\)/i,
    opacity: /opacity\s*=\s*([^)]*)/,

    camelCase: function(str) {
        return _camelCache.getOrSet(str, function() {
            return str.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, _camelCase);
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
                return _TYPE_TEST.focusable.test(str);
            });
        },
        isClickable: function(str) {
            return _clickableCache.getOrSet(str, function() {
                return _TYPE_TEST.clickable.test(str);
            });
        }
    },

    selector: {
        isStrictId: function(str) {
            return _idCache.getOrSet(str, function() {
                return _SELECTOR.id.test(str);
            });
        },
        isTag: function(str) {
            return _tagCache.getOrSet(str, function() {
                return _SELECTOR.tag.test(str);
            });
        },
        isClass: function(str) {
            return _classCache.getOrSet(str, function() {
                return _SELECTOR.klass.test(str);
            });
        }
    }
};
