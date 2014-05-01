var _ = require('./_');

var _cache = {};

var getterSetter = function(key) {

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

module.exports = (function() {

    var exp = {},
        caches = [
            'classArray',
            'classMap',
            'selector',
            'selectedTestId',
            'selectedTestTag',
            'selectedTestClass',
            'camelCase',
            'display'
        ],
        idx = caches.length;

    while (idx--) {
        exp[caches[idx]] = getterSetter(_.uniqueId());
    }

    return exp;

}());
