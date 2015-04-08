var cache     = require('cache')(2, true),
    isString  = require('is/string'),
    isArray   = require('is/array'),
    isElement = require('is/element'),
    ACCESSOR  = '__D_id__ ',
    uniqueId  = require('util/uniqueId').seed(Date.now()),

    getId = function(elem) {
        return elem ? elem[ACCESSOR] : null;
    },

    getOrSetId = function(elem) {
        var id;
        if (!elem || (id = elem[ACCESSOR])) { return id; }
        elem[ACCESSOR] = (id = uniqueId());
        return id;
    },

    getAllData = function(elem) {
        var id;
        if (!(id = getId(elem))) { return; }
        return cache.get(id);
    },

    getData = function(elem, key) {
        var id;
        if (!(id = getId(elem))) { return; }
        return cache.get(id, key);
    },

    hasData = function(elem) {
        var id;
        if (!(id = getId(elem))) { return false; }
        return cache.has(id);
    },

    setData = function(elem, key, value) {
        var id = getOrSetId(elem);
        return cache.set(id, key, value);
    },

    removeAllData = function(elem) {
        var id;
        if (!(id = getId(elem))) { return; }
        cache.remove(id);
    },

    removeData = function(elem, key) {
        var id;
        if (!(id = getId(elem))) { return; }
        cache.remove(id, key);
    };

module.exports = {
    has: hasData,
    set: setData,
    get: function(elem, str) {
        if (str === undefined) {
            return getAllData(elem);
        }
        return getData(elem, str);
    },
    remove: function(elem, str) {
        if (str === undefined) {
            return removeAllData(elem);
        }
        return removeData(elem, str);
    },

    D: {
        // NOTE: NodeList || HtmlCollection support?
        data: function(elem, key, value) {
            if (arguments.length === 3) {
                return setData(elem, key, value);
            }

            if (arguments.length === 2) {
                if (isString(key)) {
                    return getData(elem, key);
                }

                // object passed
                var map = key;
                var id;
                if (!(id = getId(elem))) { return; }
                var key;
                for (key in map) {
                    cache.set(id, key, map[key]);
                }
                return map;
            }

            if (isElement(elem)) {
                return getAllData(elem);
            }

            // fallback
            return this;
        },

        hasData: function(elem) {
            if (isElement(elem)) {
                return hasData(elem);
            }
            return this;
        },

        removeData: function(elem, key) {
            if (arguments.length === 2) {
                // Remove single key
                if (isString(key)) {
                    return removeData(elem, key);
                }

                // Remove multiple keys
                var array = key;
                var id;
                if (!(id = getId(elem))) { return; }
                var idx = array.length;
                while (idx--) {
                    cache.remove(id, array[idx]);
                }
            }

            if (isElement(elem)) {
                return removeAllData(elem);
            }

            // fallback
            return this;
        }
    },

    fn: {
        data: function(key, value) {
            // Get all data
            if (!arguments.length) {
                var first = this[0],
                    id;
                if (!first || !(id = getId(first))) { return; }
                return cache.get(id);
            }

            if (arguments.length === 1) {
                // Get key
                if (isString(key)) {
                    var first = this[0],
                        id;
                    if (!first || !(id = getId(first))) { return; }
                    return cache.get(id, key);
                }

                // Set values from hash map
                var map = key,
                    idx = this.length,
                    id,
                    key,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!isElement(elem)) { continue; }

                    id = getOrSetId(this[idx]);
                    for (key in map) {
                        cache.set(id, key, map[key]);
                    }
                }
                return map;
            }

            // Set key's value
            if (arguments.length === 2) {
                var idx = this.length,
                    id,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!isElement(elem)) { continue; }

                    id = getOrSetId(this[idx]);
                    cache.set(id, key, value);
                }
                return this;
            }

            // fallback
            return this;
        },

        // NOTE: NodeList || HtmlCollection support?
        removeData: function(value) {
            // Remove all data
            if (!arguments.length) {
                var idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = getId(elem))) { continue; }
                    cache.remove(id);
                }
                return this;
            }

            // Remove single key
            if (isString(value)) {
                var key = value,
                    idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = getId(elem))) { continue; }
                    cache.remove(id, key);
                }
                return this;
            }

            // Remove multiple keys
            if (isArray(value)) {
                var array = value,
                    elemIdx = this.length,
                    elem,
                    id;
                while (elemIdx--) {
                    elem = this[elemIdx];
                    if (!(id = getId(elem))) { continue; }
                    var arrIdx = array.length;
                    while (arrIdx--) {
                        cache.remove(id, array[arrIdx]);
                    }
                }
                return this;
            }

            // fallback
            return this;
        }
    }
};
