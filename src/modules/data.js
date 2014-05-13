var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _cache = require('../cache'),

    _dataCache = _cache.biLevel(),

    _ACCESSOR = '__d_id__ ',

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
    };

module.exports = {
    destroyData: _destroyData,

    D: {
        data: overload()
            // NOTE: NodeList || HtmlCollection support?
            .args(O.any(Element, O.window, O.document, Object), String, O.wild)
            .use(function(elem, key, value) {
                var id = _getOrSetId(elem);
                return _dataCache.set(id, key, value);
            })

            .args(O.any(Element, O.window, O.document, Object), String)
            .use(function(elem, key) {
                var id;
                if (!(id = _getId(elem))) { return; }
                return _dataCache.get(id, key);
            })

            .args(O.any(Element, O.window, O.document, Object), Object)
            .use(function(elem, map) {
                var id;
                if (!(id = _getId(elem))) { return; }
                var key;
                for (key in map) {
                    _dataCache.set(id, key, map[key]);
                }
                return _dataCache.get(id);
            })

            .args(O.any(Element, O.window, O.document, Object))
            .use(function(elem) {
                var id;
                if (!(id = _getId(elem))) { return; }
                return _dataCache.get(id);
            })

            .expose(),

        hasData: overload
            .args(O.any(Element, O.window, O.document, Object))
            .use(function(elem) {
                var id;
                if ((id = _getId(elem))) { return false; }
                return _dataCache.has(id);
            })
            .expose(),

        removeData: overload()
            // NOTE: NodeList || HtmlCollection support?
            .args(O.any(Element, O.window, O.document, Object), String)
            .use(function(elem, key) {
                var id;
                if (!(id = _getId(elem))) { return DOM; }
                _dataCache.remove(id, key);
                return DOM;
            })

            .args(O.any(Element, O.window, O.document, Object))
            .use(function(elem) {
                var id;
                if (!(id = _getId(elem))) { return DOM; }
                _dataCache.remove(id);
                return DOM;
            })

            .expose()
    },

    fn: {
        data: overload
            // Set key's value
            .args(String, O.wild)
            .use(function(key, value) {
                var idx = this.length, id;
                while (idx--) {
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
                    key;
                while (idx--) {
                    id = _getOrSetId(this[idx]);
                    for (key in map) {
                        _dataCache.set(id, key, map[key]);
                    }
                }
                return this;
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

            .expose()
    }
};
