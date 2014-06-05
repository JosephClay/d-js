var _          = require('_'),
    overload   = require('overload'),
    O          = overload.O,

    _cache     = require('../cache'),

    _dataCache = _cache.biLevel(),

    _ACCESSOR  = '__d_id__ ',

    _id = _.now(),
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

    _destroyData = function(elem) {
        var id = _getId(elem);
        if (!id) { return; }

        _dataCache.remove(id);
    },

    _ELEM_TYPE = O.any(Element, O.window, O.document, Object);

module.exports = {
    destroyData: _destroyData,

    D: {
        data: overload()
            // NOTE: NodeList || HtmlCollection support?
            .args(_ELEM_TYPE, String, O.wild)
            .use(function(elem, key, value) {
                var id = _getOrSetId(elem);
                return _dataCache.set(id, key, value);
            })

            .args(_ELEM_TYPE, String)
            .use(function(elem, key) {
                var id;
                if (!(id = _getId(elem))) { return; }
                return _dataCache.get(id, key);
            })

            .args(_ELEM_TYPE, Object)
            .use(function(elem, map) {
                var id;
                if (!(id = _getId(elem))) { return; }
                var key;
                for (key in map) {
                    _dataCache.set(id, key, map[key]);
                }
                return map;
            })

            .args(_ELEM_TYPE)
            .use(function(elem) {
                var id;
                if (!(id = _getId(elem))) { return; }
                return _dataCache.get(id);
            })

            .expose(),

        hasData: overload()
            .args(_ELEM_TYPE)
            .use(function(elem) {
                var id;
                if (!(id = _getId(elem))) { return false; }
                return _dataCache.has(id);
            })
            .expose(),

        removeData: overload()
            // NOTE: NodeList || HtmlCollection support?
            // Remove single key
            .args(_ELEM_TYPE, String)
            .use(function(elem, key) {
                var id;
                if (!(id = _getId(elem))) { return; }
                _dataCache.remove(id, key);
            })

            // Remove multiple keys
            .args(_ELEM_TYPE, Array)
            .use(function(elem, array) {
                var id;
                if (!(id = _getId(elem))) { return; }
                var idx = array.length;
                while (idx--) {
                    _dataCache.remove(id, array[idx]);
                }
            })

            // Remove all data
            .args(_ELEM_TYPE)
            .use(function(elem) {
                var id;
                if (!(id = _getId(elem))) { return; }
                _dataCache.remove(id);
            })

            .expose()
    },

    fn: {
        data: overload()
            // Set key's value
            .args(String, O.wild)
            .use(function(key, value) {
                var idx = this.length,
                    id,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!_.isElement(elem)) { continue; }

                    id = _getOrSetId(this[idx]);
                    _dataCache.set(id, key, value);
                }
                return this;
            })

            // Set values from hash map
            .args(Object)
            .use(function(map) {
                var idx = this.length,
                    id,
                    key,
                    elem;
                while (idx--) {
                    elem = this[idx];
                    if (!_.isElement(elem)) { continue; }

                    id = _getOrSetId(this[idx]);
                    for (key in map) {
                        _dataCache.set(id, key, map[key]);
                    }
                }
                return map;
            })

            // Get key
            .args(String)
            .use(function(key) {
                var first = this[0],
                    id;
                if (!first || !(id = _getId(first))) { return; }
                return _dataCache.get(id, key);
            })

            // Get all data
            .args()
            .use(function() {
                var first = this[0],
                    id;
                if (!first || !(id = _getId(first))) { return; }
                return _dataCache.get(id);
            })

            .expose(),

        removeData: overload()
            // NOTE: NodeList || HtmlCollection support?
            // Remove single key
            .args(String)
            .use(function(key) {
                var idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = _getId(elem))) { continue; }
                    _dataCache.remove(id, key);
                }
                return this;
            })

            // Remove multiple keys
            .args(Array)
            .use(function(array) {
                var elemIdx = this.length,
                    elem,
                    id;
                while (elemIdx--) {
                    elem = this[elemIdx];
                    if (!(id = _getId(elem))) { continue; }
                    var arrIdx = array.length;
                    while (arrIdx--) {
                        _dataCache.remove(id, array[arrIdx]);
                    }
                }
                return this;
            })

            // Remove all data
            .args()
            .use(function() {
                var idx = this.length,
                    elem,
                    id;
                while (idx--) {
                    elem = this[idx];
                    if (!(id = _getId(elem))) { continue; }
                    _dataCache.remove(id);
                }
                return this;
            })

            .expose()
    }
};
