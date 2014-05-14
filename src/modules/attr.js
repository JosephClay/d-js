var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _cache = require('../cache'),
    _utils = require('../utils'),
    _supports = require('../supports'),

    _isDataKeyCache = _cache(),
    _sanitizeDataKeyCache = _cache(),
    _trimDataKeyCache = _cache();

var _isDataKey = function(key) {
        return _isDataKeyCache.getOrSet(key, function() {
            return (key || '').substr(0, 5) === 'data-';
        });
    },

    _sanitizeDataKey = function(key) {
        return _sanitizeDataKeyCache.getOrSet(key, function() {
            return _isDataKey(key) ? key : 'data-' + key.toLowerCase();
        });
    },

    _trimDataKey = function(key) {
        return _trimDataKeyCache.getOrSet(key, function() {
            return key.substr(0, 5);
        });
    },

    _getDataAttrKeys = function(elem) {
        var attrs = first.attributes,
            idx = attr.length, keys = [];
        while (idx--) {
            key = attrs[idx];
            if (_isDataKey(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

var _boolHook = {
    set: function(elem, value, name) {
        if (value === false) {
            // Remove boolean attributes when set to false
            return elem.removeAttribute(name);
        }

        elem.setAttribute(name, name);
    }
};

var _hooks = {
        tabindex: {
            get: function(elem) {
                var tabindex = elem.getAttribute('tabindex');
                if (!_.exists(tabindex) || tabindex === '') { return; }
                return _.parseInt(tabindex) || 0;
            }
        },

        type: {
            set: function(elem, value) {
                if (!_supports.radioValue && value === 'radio' && _utils.isNodeName(elem, 'input')) {
                    // Setting the type on a radio button after the value resets the value in IE6-9
                    // Reset value to default in case type is set after value during creation
                    var val = elem.value;
                    elem.setAttribute('type', value);
                    if (val) { elem.value = val; }
                    return value;
                }
            }
        }
    },

    _getAttribute = function(elem, attr) {
        if (!elem) { return; }

        if (_hooks[attr] && _hooks[attr].get) {
            return _hooks[attr].get(elem);
        }

        var ret = elem.getAttribute(attr);
        return _.exists(ret) ? ret : undefined;
    },

    _setAttributes = function(arr, attr, value) {
        var isFn = _.isFunction(value),
            idx = 0, length = arr.length,
            elem, val;
        for (; idx < length; idx++) {
            elem = arr[idx];
            val = isFn ? value.call(elem, idx, _getAttribute(elem, attr)) : value;
            _setAttribute(elem, attr, val);
        }
    },
    _setAttribute = function(elem, attr, value) {
        if (!elem) { return; }

        if (value === true || value === false) {
            return _boolHook.set(elem, value, attr);
        }

        if (_hooks[attr] && _hooks[attr].set) {
            return _hooks[attr].set(elem, value);
        }

        elem.setAttribute(attr, value);
    },

    _removeAttributes = function(arr, attr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _removeAttribute(arr[idx], attr);
        }
    },
    _removeAttribute = function(elem, attr) {
        if (!elem) { return; }

        if (_hooks[attr] && _hooks[attr].remove) {
            return _hooks[attr].remove(elem);
        }

        elem.removeAttribute(attr);
    };

module.exports = {
    fn: {
        attr: overload()
            .args(String)
            .use(function(attr) {
                return _getAttribute(this[0], attr);
            })

            .args(String, O.any(String, Number))
            .use(function(attr, value) {
                _setAttributes(this, attr, value);
                return this;
            })

            .args(String, null)
            .use(function(attr) {
                _removeAttributes(this, attr);
                return this;
            })

            .args(String, Boolean)
            .use(function(attr, bool) {
                if (bool) {
                    _setAttributes(this, attr, bool);
                    return this;
                }

                _removeAttributes(this, attr);
                return this;
            })

            .args(Object)
            .use(function(attrs) {
                var attr, value;
                for (attr in attrs) {
                    _setAttributes(this, attr, attrs[attr]);
                }

                return this;
            })

            .args(String, Function)
            .use(function(attr, fn) {
                _.each(this, function(elem) {
                    var oldAttr = _getAttribute(elem, attr),
                        result = fn.call(elem, idx, oldAttr);
                    if (!_.exists(result)) { return; }
                    _setAttribute(elem, attr, result);
                });

                return this;
            })

            .expose(),

        removeAttr: overload()
            .args(String)
            .use(function(attr) {
                _removeAttributes(this, attr);
                return this;
            })

            .expose(),

        attrData: overload()
            .args(Object)
            .use(function(obj) {
                var idx = this.length,
                    key;
                while (idx--) {
                    for (key in obj) {
                        this[idx].setAttribute(_sanitizeDataKey(key), '' + obj[key]);
                    }
                }
                return this;
            })

            .args(String, O.wild)
            .use(function(key, value) {
                var idx = this.length;
                while (idx--) {
                    this[idx].setAttribute(_sanitizeDataKey(key), '' + value);
                }
                return this;
            })

            .args()
            .use(function() {
                var first = this[0];
                if (!first) { return; }

                var map = {},
                    keys = _getDataAttrKeys(first),
                    idx = keys.length, key;
                while (idx--) {
                    key = keys[idx];
                    map[_trimDataKey(key)] = _.typecast(first.getAttribute(key));
                }

                return map;
            })

            .expose()
    }
};