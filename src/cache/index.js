// TODO: Deprecate getOrSet
var getterSetter = function() {
    var store = {};

    return {
        get: function(key) {
            return store[key];
        },
        set: function(key, value) {
            store[key] = value;
            return value;
        },
        getOrSet: function(key, fn) {
            var cachedVal = store[key];
            if (cachedVal !== undefined) { return cachedVal; }
            return (store[key] = fn());
        },
        remove: function(key) {
            store[key] = undefined;
        }
    };
};

var biLevelGetterSetter = function() {
    var store = {};

    return {
        has: function(key1) {
            return store[key1] !== undefined;
        },
        get: function(key1, key2) {
            var ref1 = store[key1];
            return arguments.length === 1 ? ref1 : (ref1 !== undefined ? ref1[key2] : ref1);
        },
        set: function(key1, key2, value) {
            var ref1 = store[key1] || (store[key1] = {});
            ref1[key2] = value;
            return value;
        },
        getOrSet: function(key1, key2, fn) {
            var ref1 = store[key1] || (store[key1] = {}),
                cachedVal = ref1[key2];
            if (cachedVal !== undefined) { return cachedVal; }
            return (ref1[key2] = fn());
        },
        remove: function(key1, key2) {
            // Easy removal
            if (arguments.length === 1) {
                store[key1] = undefined;
                return;
            }

            // Deep removal
            var ref1 = store[key1] || (store[key1] = {});
            ref1[key2] = undefined;
        }
    };
};

module.exports = function(lvl) {
    return lvl === 2 ? biLevelGetterSetter() : getterSetter();
};