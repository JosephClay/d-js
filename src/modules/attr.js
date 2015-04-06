var _          = require('underscore'),

    exists     = require('is/exists'),
    isFunction = require('is/function'),
    isString   = require('is/string'),
    
    _SUPPORTS  = require('../supports'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),

    _utils     = require('../utils'),
    _cache     = require('cache'),

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

var _hasAttr = _SUPPORTS.inputValueAttr
    // IE9+, modern browsers
    ? function(elem, attr) { return elem.hasAttribute(attr); }
    // IE8
    : function(elem, attr) {
        var nodeName = _utils.normalNodeName(elem);
        // In IE8, input.hasAttribute('value') returns false
        // and input.getAttributeNode('value') returns null
        // if the value is empty ("").
        if (nodeName === 'input' && attr === 'value') {
            return true;
        }
        // In IE8, option.hasAttribute('selected') always returns false.
        // Seriously.
        if (nodeName === 'option' && attr === 'selected') {
            return elem.getAttributeNode(attr) !== null;
        }
        return elem.hasAttribute(attr);
    };

var _boolHook = {
    is: function(attrName) {
        return _selector.isBooleanAttribute(attrName);
    },
    get: function(elem, attrName) {
        if (_hasAttr(elem, attrName)) {
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
                if (!exists(tabindex) || tabindex === '') { return; }
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
                // IE8
                if (val === null || val === undefined) {
                    val = elem.defaultValue;
                }
                // IE8
                if (!_SUPPORTS.buttonValue && val === '' && _utils.isNodeName(elem, 'button')) {
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
