var _ = require('_');

var _cache = {},

    _getterSetter = function(key) {
        var ref = (_cache[key] = {});

        return {
            get: function(key) {
                return ref[key];
            },
            set: function(key, value) {
                ref[key] = value;
                return value;
            },
            getOrSet: function(key, fn) {
                var cachedVal = ref[key];
                if (cachedVal !== undefined) { return cachedVal; }
                return (ref[key] = fn());
            }
        };
    },

    _biLevelGetterSetter = function(key) {
        var ref = (_cache[key] = {});

        return {
            get: function(key1, key2) {
                var ref1 = ref[key];
                return ref1 !== undefined ? ref1[key2] : ref1;
            },
            set: function(key1, key2, value) {
                var ref1 = ref[key1] || (ref[key1] = {});
                ref1[key2] = value;
                return value;
            },
            getOrSet: function(key1, key2, fn) {
                var ref1 = ref[key1],
                    cachedVal = ref1[key2];
                if (cachedVal !== undefined) { return cachedVal; }
                return (ref1[key2] = fn());
            }
        };
    };

var api = function(name) {
    return _getterSetter(name || _.uniqueId());
};
api.biLevel = function(name) {
    return _biLevelGetterSetter(name || _.uniqueId());
};
module.exports = api;
