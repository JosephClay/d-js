/**
 * From Sizzle.js `createCache()`:
 * Use (key + ' ') to avoid collision with native prototype properties.
 * NOTE: The space has been removed to allow .data() to return objects with "normal" keys.
 * @param {String} key
 * @returns {String}
 * @private
 */
// TODO: No longer need _safe
var _safe = function(key) { return key; };

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
            },
            remove: function(key) {
                delete ref[_safe(key)];
            }
        };
    },

    _biLevelGetterSetter = function() {
        var ref = {};

        return {
            has: function(key1) {
                return ref[_safe(key1)] !== undefined;
            },
            get: function(key1, key2) {
                key1 = _safe(key1);
                key2 = _safe(key2);
                var ref1 = ref[key1];
                return arguments.length === 1 ? ref1 : (ref1 !== undefined ? ref1[key2] : ref1);
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
            },
            remove: function(key1, key2) {
                key1 = _safe(key1);
                key2 = _safe(key2);

                // Easy removal
                if (arguments.length === 1) {
                    delete ref[key1];
                    return;
                }

                // Deep removal
                var ref1 = ref[key1] || (ref[key1] = {});
                delete ref1[key2];
            }
        };
    };

module.exports = function(lvl) {
    return lvl === 2 ? _biLevelGetterSetter() : _getterSetter();
};