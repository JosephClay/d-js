var _          = require('_'),
    overload   = require('overload'),
    O          = overload.O,

    _SUPPORTS  = require('../supports'),
    _NODE_TYPE = require('../nodeType'),

    _utils     = require('../utils'),
    _cache     = require('../cache'),

    _selector  = require('./Fizzle/selector/selector-parse'),

    _isDataKeyCache       = _cache(),
    _sanitizeDataKeyCache = _cache(),
    _trimDataKeyCache     = _cache(),
    _attrNameLowerCache   = _cache();

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
        var attrs = elem.attributes,
            idx   = attr.length, keys = [];
        while (idx--) {
            key = attrs[idx];
            if (_isDataKey(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

var _boolHook = {
    is: function(attrName) {
        return _selector.isBooleanAttribute(attrName);
    },
    get: function(elem, attrName) {
        if (elem.hasAttribute(attrName)) {
            return _attrNameLowerCache.getOrSet(attrName, function() {
                return attrName.toLowerCase();
            });
        }
        return undefined;
    },
    set: function(elem, value, attrName) {
        if (value === false) {
            // Remove boolean attributes when set to false
            return elem.removeAttribute(attrName);
        }

        elem.setAttribute(attrName, attrName);
    }
};

var _hooks = {
        tabindex: {
            get: function(elem) {
                var tabindex = elem.getAttribute('tabindex');
                if (!_.exists(tabindex) || tabindex === '') { return; }
                return tabindex;
            }
        },

        type: {
            set: function(elem, value) {
                if (!_SUPPORTS.radioValue && value === 'radio' && _utils.isNodeName(elem, 'input')) {
                    // Setting the type on a radio button after the value resets the value in IE6-9
                    // Reset value to default in case type is set after value during creation
                    var oldValue = elem.value;
                    elem.setAttribute('type', value);
                    elem.value = oldValue;
                }
                else {
                    elem.setAttribute('type', value);
                }
            }
        },

        value: {
            get: function(elem) {
                var val = elem.value;
                if (val === null || val === undefined) {
                    val = elem.getAttribute('value');
                }
                return _utils.normalizeNewlines(val);
            },
            set: function(elem, value) {
                elem.setAttribute('value', value);
            }
        }
    },

    _isElementNode = function(elem) {
        return elem && elem.nodeType === _NODE_TYPE.ELEMENT;
    },

    _getAttribute = function(elem, attr) {
        if (!_isElementNode(elem) || !elem.hasAttribute(attr)) { return; }

        if (_boolHook.is(attr)) {
            return _boolHook.get(elem, attr);
        }

        if (_hooks[attr] && _hooks[attr].get) {
            return _hooks[attr].get(elem);
        }

        var ret = elem.getAttribute(attr);
        return _.exists(ret) ? ret : undefined;
    },

    _setter = {
        forAttr: function(attr, value) {
            if (_boolHook.is(attr) && (value === true || value === false)) {
                return _setter.bool;
            } else if (_hooks[attr] && _hooks[attr].set) {
                return _setter.hook;
            }
            return _setter.elem;
        },
        bool: function(elem, attr, value) {
            _boolHook.set(elem, value, attr);
        },
        hook: function(elem, attr, value) {
            _hooks[attr].set(elem, value);
        },
        elem: function(elem, attr, value) {
            elem.setAttribute(attr, value);
        },
    },
    _setAttributes = function(arr, attr, value) {
        var isFn   = _.isFunction(value),
            idx    = 0,
            len    = arr.length,
            elem,
            val,
            setter = _setter.forAttr(attr, value);

        for (; idx < len; idx++) {
            elem = arr[idx];

            if (!_isElementNode(elem)) { continue; }

            val = isFn ? value.call(elem, idx, _getAttribute(elem, attr)) : value;
            setter(elem, attr, val);
        }
    },
    _setAttribute = function(elem, attr, value) {
        if (!_isElementNode(elem)) { return; }
        var setter = _setter.forAttr(attr, value);
        setter(elem, attr, value);
    },

    _removeAttributes = function(arr, attr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _removeAttribute(arr[idx], attr);
        }
    },
    _removeAttribute = function(elem, attr) {
        if (!_isElementNode(elem)) { return; }

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

            .args(String, O.any(String, Number, Boolean))
            .use(function(attr, value) {
                _setAttributes(this, attr, value);
                return this;
            })

            .args(String, null)
            .use(function(attr) {
                _removeAttributes(this, attr);
                return this;
            })

            .args(Object)
            .use(function(attrs) {
                var attr;
                for (attr in attrs) {
                    _setAttributes(this, attr, attrs[attr]);
                }

                return this;
            })

            .args(String, Function)
            .use(function(attr, fn) {
                return this.each(function(elem, idx) {
                    var oldAttr = _getAttribute(elem, attr),
                        result  = fn.call(elem, idx, oldAttr);
                    if (!_.exists(result)) { return; }
                    _setAttribute(elem, attr, result);
                });
            })

            .fallback(_utils.returnThis)

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

                var map  = {},
                    keys = _getDataAttrKeys(first),
                    idx  = keys.length, key;
                while (idx--) {
                    key = keys[idx];
                    map[_trimDataKey(key)] = _.typecast(first.getAttribute(key));
                }

                return map;
            })

            .expose()
    }
};
