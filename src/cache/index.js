// TODO: Deprecate getOrSet
var getterSetter = function(deletable) {
    var store = {};

    return {
        has: function(key) {
            return key in store;
        },
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
            if (deletable) {
                delete store[key];
            } else {
                store[key] = undefined;
            }
        }
    };
};

var biLevelGetterSetter = function(deletable) {
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
                if (deletable) {
                    delete store[key1];
                } else {
                    store[key1] = undefined;
                }
                return;
            }

            // Deep removal
            var ref1 = store[key1] || (store[key1] = {});
            if (deletable) {
                delete ref1[key2];
            } else {
                ref1[key2] = undefined;
            }
        }
    };
};

module.exports = function(lvl, deletable) {
    return lvl === 2 ? biLevelGetterSetter(deletable) : getterSetter(deletable);
};