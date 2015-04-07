var deleter = function(deletable) {
    return deletable ? 
        function(store, key) { delete store[key]; } :
        function(store, key) { store[key] = undefined; };
};

var getterSetter = function(deletable) {
    var store = {},
        del = deleter(deletable);

    return {
        has: function(key) {
            return key in store && store[key] !== undefined;
        },
        get: function(key) {
            return store[key];
        },
        set: function(key, value) {
            store[key] = value;
            return value;
        },
        put: function(key, fn, arg) {
            var value = fn(arg);
            store[key] = value;
            return value;
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
        has: function(key1, key2) {
            var has1 = key1 in store && store[key1] !== undefined;
            if (!has1 || arguments.length === 1) {
                return has1;
            }

            return key2 in store[key1] && store[key1][key2] !== undefined;
        },
        get: function(key1, key2) {
            var ref1 = store[key1];
            return arguments.length === 1 ? ref1 : (ref1 !== undefined ? ref1[key2] : ref1);
        },
        set: function(key1, key2, value) {
            var ref1 = this.has(key1) ? store[key1] : (store[key1] = {});
            ref1[key2] = value;
            return value;
        },
        put: function(key1, key2, fn, arg) {
            var ref1 = this.has(key1) ? store[key1] : (store[key1] = {});
            var value = fn(arg);
            ref1[key2] = value;
            return value;
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