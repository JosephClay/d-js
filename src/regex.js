var _cache = require('./cache'),

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
        // TODO: This regex fails on "a, #id, [some-attr], .class, [some-attr=a,b,c\],d,e,f]" (attribute value containing an escaped right square bracket
        commandSplit: /(?:\[.*?[^\\]\]|[^\[\],]+)(?=\s*(?:,|$))/g,

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
                return !!_NONE_OR_TABLE.exec(str);
            });
        }
    },

    type: {
        isFocusable: function(str) {
            return _focusableCache.getOrSet(str, function() {
                var result = _TYPE_TEST.focusable.exec(str);
                return !!result;
            });
        },
        isClickable: function(str) {
            return _clickableCache.getOrSet(str, function() {
                var result = _TYPE_TEST.clickable.exec(str);
                return !!result;
            });
        }
    },

    selector: {

        commandSplit: function(str) {
            return _commandCache.getOrSet(str, function() {
                return str.match(_SELECTOR.commandSplit);
            });
        },
        isStrictId: function(str) {
            return _idCache.getOrSet(str, function() {
                var result = _SELECTOR.id.exec(str);
                return result ? !result[1] : false;
            });
        },
        isTag: function(str) {
            return _tagCache.getOrSet(str, function() {
                var result = _SELECTOR.tag.exec(str);
                return result ? !result[1] : false;
            });
        },
        isClass: function(str) {
            return _classCache.getOrSet(str, function() {
                var result = _SELECTOR.klass.exec(str);
                return result ? !result[1] : false;
            });
        }
    }
};
