var _ = require('_');

/**
 * From Sizzle.js `createCache()`:
 * Use (key + ' ') to avoid collision with native prototype properties.
 * @param {String} key
 * @returns {String}
 * @private
 */
var _safe = function(key) { return key + ' '; };

var _getterSetter = function() {
        var ref = {};

        return {
            get: function(key) {
                key = _safe(key);
                return ref[key];
            },
            set: function(key, value) {
                key = _safe(key);
                ref[key] = value;
                return value;
            },
            getOrSet: function(key, fn) {
                key = _safe(key);
                var cachedVal = ref[key];
                if (cachedVal !== undefined) { return cachedVal; }
                return (ref[key] = fn());
            }
        };
    },

    _biLevelGetterSetter = function() {
        var ref = {};

        return {
            get: function(key1, key2) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1];
                return ref1 !== undefined ? ref1[key2] : ref1;
            },
            set: function(key1, key2, value) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1] || (ref[key1] = {});
                ref1[key2] = value;
                return value;
            },
            getOrSet: function(key1, key2, fn) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1] || (ref[key1] = {}),
                    cachedVal = ref1[key2];
                if (cachedVal !== undefined) { return cachedVal; }
                return (ref1[key2] = fn());
            }
        };
    };

var api = function() {
    return _getterSetter();
};
api.biLevel = function() {
    return _biLevelGetterSetter();
};
module.exports = api;
