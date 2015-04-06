var cache      = require('cache')(2),

    isString  = require('is/string'),
    isArray   = require('is/array'),
    isElement = require('is/element'),

    _ACCESSOR  = '__D_id__ ',

    _id = Date.now(),
    _uniqueId = function() {
        return _id++;
    },

    _getId = function(elem) {
        return elem ? elem[_ACCESSOR] : null;
    },

    _getOrSetId = function(elem) {
        var id;
        if (!elem || (id = elem[_ACCESSOR])) { return id; }
        elem[_ACCESSOR] = (id = _uniqueId());
        return id;
    },

    _getAllData = function(elem) {
        var id;
        if (!(id = _getId(elem))) { return; }
        return cache.get(id);
    },

    _getData = function(elem, key) {
        var id;
        if (!(id = _getId(elem))) { return; }
        return cache.get(id, key);
    },

    _hasData = function(elem) {
        var id;
        if (!(id = _getId(elem))) { return false; }
        return cache.has(id);
    },

    _setData = function(elem, key, value) {
        var id = _getOrSetId(elem);
        return cache.set(id, key, value);
    },

    _removeAllData = function(elem) {
        var id;
        if (!(id = _getId(elem))) { return; }
        cache.remove(id);
    },

    _removeData = function(elem, key) {
        var id;
        if (!(id = _getId(elem))) { return; }
        cache.remove(id, key);
    };

module.exports = {
    has: _hasData,
    set: _setData,
    get: function(elem, str) {
        if (str === undefined) {
            return _getAllData(elem);
        }
        return _getData(elem, str);
    },
    remove: function(elem, str) {
        if (str === undefined) {
            return _removeAllData(elem);
        }
        return _removeData(elem, str);
    },

    D: {
        // NOTE: NodeList || HtmlCollection support?
        data: function(elem, key, value) {
            if (arguments.length === 3) {
                return _setData(elem, key, value);
            }
            
            if (arguments.length === 2) {
                if (isString(key)) {
                    return _getData(elem, key);
                }

                // object passed
                var map = key;
                var id;
                if (!(id = _getId(elem))) { return; }
                var key;
                for (key in map) {
                    cache.set(id, key, map[key]);
                }
                return map;
            }

            if (isElement(elem)) {
                return _getData(elem);
            }

            // fallback
            return this;
        },

        hasData: function(elem) {
            if (isElement(elem)) {
                return _hasData(elem);
            }
            return this;
        },

        // NOTE: NodeList || HtmlCollection support?
        removeData: function(elem, key) {
            if (arguments.length === 2) {
                // Remove single key
                if (isString(key)) {
                    return _removeData(elem, key);
                }

                // Remove multiple keys
                var array = key;
                var id;
                if (!(id = _getId(elem))) { return; }
                var idx = array.length;
                while (idx--) {
                    cache.remove(id, array[idx]);
                }
            }

            if (isElement(elem)) {
                return _removeAllData(elem);
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
                if (!first || !(id = _getId(first))) { return; }
                return cache.get(id);
            }

            if (arguments.length === 1) {
                // Get key
                if (isString(key)) {
                    var first = this[0],
                        id;
                    if (!first || !(id = _getId(first))) { return; }
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

                    id = _getOrSetId(this[idx]);
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

                    id = _getOrSetId(this[idx]);
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
                    if (!(id = _getId(elem))) { continue; }
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
                    if (!(id = _getId(elem))) { continue; }
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
                    if (!(id = _getId(elem))) { continue; }
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
