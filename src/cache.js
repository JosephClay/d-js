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
    };

module.exports = function(name) {
    return _getterSetter(name || _.uniqueId());
};