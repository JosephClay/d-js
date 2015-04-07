var deleter = function(deletable) {
    return deletable ? 
        function(store, key) { delete store[key]; } :
        function(store, key) { store[key] = undefined; };
};

// TODO: Deprecate getOrSet
var getterSetter = function(deletable) {
    var store = {},
        del = deleter(deletable);

    return {
        has: function(key) {
            return key in store && store[key] !== undefined;
        },
        get: function(key) {
            return this.has(key) ? store[key] : undefined;
        },
        set: function(key, value) {
            store[key] = value;
            return value;
        },
        getOrSet: function(key, fn) {
            var value = this.get(key);
            if (value !== undefined) { return value; }
            return (store[key] = fn());
        },
        remove: function(key) {
            del(store, key);
        }
    };
};

var biLevelGetterSetter = function(deletable) {
    var store = {},
        del = deleter(deletable);

    return {
        has: function(key1) {
            return key1 in store && store[key1] !== undefined;
        },
        get: function(key1, key2) {
            var ref1 = this.has(key1) ? store[key1] : undefined;
            return arguments.length === 1 ? ref1 : (ref1 !== undefined ? ref1[key2] : ref1);
        },
        set: function(key1, key2, value) {
            var ref1 = this.has(key1) ? store[key1] : (store[key1] = {});
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
                return del(store, key1);
            }

            // Deep removal
            var ref1 = store[key1] || (store[key1] = {});
            del(ref1, key2);
        }
    };
};

module.exports = function(lvl, deletable) {
    return lvl === 2 ? biLevelGetterSetter(deletable) : getterSetter(deletable);
};