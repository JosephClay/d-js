var _cache = require('./cache');

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

    _SELECTOR_TEST = {
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
        return _cache.camelCase.getOrSet(str, function() {
            return str.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, _camelCase);
        });
    },

    display: {
        isNoneOrTable: function(str) {
            return _cache.display.getOrSet(str, function() {
                return !!_NONE_OR_TABLE.exec(str);
            });
        }
    },

    type: {
        isFocusable: function(str) {
            _cache.typeTestFocusable.getOrSet(str, function() {
                var result = _TYPE_TEST.focusable.exec(str);
                return !!result;
            });
        },
        isClickable: function(str) {
            _cache.typeTestClickable.getOrSet(str, function() {
                var result = _TYPE_TEST.clickable.exec(str);
                return !!result;
            });
        }
    },

    selector: {
        isStrictId: function(str) {
            return _cache.selectorTestId.getOrSet(str, function() {
                var result = _SELECTOR_TEST.id.exec(str);
                return result ? !result[1] : false;
            });
        },
        isTag: function(str) {
            return _cache.selectorTestTag.getOrSet(str, function() {
                var result = _SELECTOR_TEST.tag.exec(str);
                return result ? !result[1] : false;
            });
        },
        isClass: function(str) {
            return _cache.selectorTestClass.getOrSet(str, function() {
                var result = _SELECTOR_TEST.klass.exec(str);
                return result ? !result[1] : false;
            });
        }
    }
};