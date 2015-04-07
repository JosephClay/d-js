var _          = require('underscore'),

    exists     = require('is/exists'),
    isFunction = require('is/function'),
    isString   = require('is/string'),
    
    SUPPORTS = require('SUPPORTS'),
    ELEMENT  = require('NODE_TYPE/ELEMENT'),

    _utils     = require('../utils'),
    _selector  = require('./Fizzle/selector/selector-parse'),
    _sanitizeDataKeyCache = require('cache')();

var _isDataKey = (key) => (key || '').substr(0, 5) === 'data-',

    _trimDataKey = (key) => key.substr(0, 5),

    _sanitizeDataKey = function(key) {
        return _sanitizeDataKeyCache.has(key) ?
            _sanitizeDataKeyCache.get(key) :
            _sanitizeDataKeyCache.put(key, () => _isDataKey(key) ? key : 'data-' + key.toLowerCase());
    },


    _getDataAttrKeys = function(elem) {
        var attrs = elem.attributes,
            idx   = attrs.length,
            keys  = [],
            key;
        while (idx--) {
            key = attrs[idx];
            if (_isDataKey(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

// IE9+, modern browsers
var _hasAttr = (elem, attr) => elem.hasAttribute(attr);

var _boolHook = {
    is: (attrName) => _selector.isBooleanAttribute(attrName),
    get: (elem, attrName) => _hasAttr(elem, attrName) ? attrName.toLowerCase() : undefined,
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
                if (!exists(tabindex) || tabindex === '') { return; }
                return tabindex;
            }
        },

        type: {
            set: function(elem, value) {
                if (!SUPPORTS.radioValue && value === 'radio' && _utils.isNodeName(elem, 'input')) {
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
        return elem && elem.nodeType === ELEMENT;
    },

    _getAttribute = function(elem, attr) {
        if (!_isElementNode(elem) || !_hasAttr(elem, attr)) { return; }

        if (_boolHook.is(attr)) {
            return _boolHook.get(elem, attr);
        }

        if (_hooks[attr] && _hooks[attr].get) {
            return _hooks[attr].get(elem);
        }

        var ret = elem.getAttribute(attr);
        return exists(ret) ? ret : undefined;
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
        var isFn   = isFunction(value),
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
        attr: function(attr, value) {
            if (arguments.length === 1) {
                if (isString(attr)) {
                    return _getAttribute(this[0], attr);
                }

                // assume an object
                var attrs = attr;
                for (attr in attrs) {
                    _setAttributes(this, attr, attrs[attr]);
                }
            }

            if (arguments.length === 2) {
                if (value === undefined) { return this; }

                // remove
                if (value === null) {
                    _removeAttributes(this, attr);
                    return this;
                }

                // iterator
                if (isFunction(value)) {
                    var fn = value;
                    return _.each(this, function(elem, idx) {
                        var oldAttr = _getAttribute(elem, attr),
                            result  = fn.call(elem, idx, oldAttr);
                        if (!exists(result)) { return; }
                        _setAttribute(elem, attr, result);
                    });
                }

                // set
                _setAttributes(this, attr, value);
                return this;
            }

            // fallback
            return this;
        },

        removeAttr: function(attr) {
            if (isString(attr)) {
                _removeAttributes(this, attr);
            }
            return this;
        },

        attrData: function(key, value) {
            if (!arguments.length) {

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
            }

            if (arguments.length === 2) {
                var idx = this.length;
                while (idx--) {
                    this[idx].setAttribute(_sanitizeDataKey(key), '' + value);
                }
                return this;
            }

            // fallback to an object definition
            var obj = key,
                idx = this.length,
                key;
            while (idx--) {
                for (key in obj) {
                    this[idx].setAttribute(_sanitizeDataKey(key), '' + obj[key]);
                }
            }
            return this;
        }
    }
};
