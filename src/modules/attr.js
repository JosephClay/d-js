var _                    = require('_'),
    exists               = require('is/exists'),
    isFunction           = require('is/function'),
    isString             = require('is/string'),
    isElement            = require('nodeType').elem,
    isNodeName           = require('is/nodeName'),
    newlines             = require('util/newlines'),
    SUPPORTS             = require('SUPPORTS'),
    REGEX                = require('REGEX'),
    sanitizeDataKeyCache = require('cache')();

var isDataKey = (key) => (key || '').substr(0, 5) === 'data-',

    trimDataKey = (key) => key.substr(0, 5),

    sanitizeDataKey = function(key) {
        return sanitizeDataKeyCache.has(key) ?
            sanitizeDataKeyCache.get(key) :
            sanitizeDataKeyCache.put(key, () => isDataKey(key) ? key : 'data-' + key.toLowerCase());
    },

    getDataAttrKeys = function(elem) {
        var attrs = elem.attributes,
            idx   = attrs.length,
            keys  = [],
            key;
        while (idx--) {
            key = attrs[idx];
            if (isDataKey(key)) {
                keys.push(key);
            }
        }

        return keys;
    };

var boolHook = {
    is: (attrName) => REGEX.isBoolAttr(attrName),
    get: (elem, attrName) => elem.hasAttribute(attrName) ? attrName.toLowerCase() : undefined,
    set: function(elem, value, attrName) {
        if (value === false) {
            // Remove boolean attributes when set to false
            return elem.removeAttribute(attrName);
        }

        elem.setAttribute(attrName, attrName);
    }
};

var hooks = {
        tabindex: {
            get: function(elem) {
                var tabindex = elem.getAttribute('tabindex');
                if (!exists(tabindex) || tabindex === '') { return; }
                return tabindex;
            }
        },

        type: {
            set: function(elem, value) {
                if (!SUPPORTS.radioValue && value === 'radio' && isNodeName(elem, 'input')) {
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
                return newlines(val);
            },
            set: function(elem, value) {
                elem.setAttribute('value', value);
            }
        }
    },

    getAttribute = function(elem, attr) {
        if (!isElement(elem) || !elem.hasAttribute(attr)) { return; }

        if (boolHook.is(attr)) {
            return boolHook.get(elem, attr);
        }

        if (hooks[attr] && hooks[attr].get) {
            return hooks[attr].get(elem);
        }

        var ret = elem.getAttribute(attr);
        return exists(ret) ? ret : undefined;
    },

    setters = {
        forAttr: function(attr, value) {
            if (boolHook.is(attr) && (value === true || value === false)) {
                return setters.bool;
            } else if (hooks[attr] && hooks[attr].set) {
                return setters.hook;
            }
            return setters.elem;
        },
        bool: function(elem, attr, value) {
            boolHook.set(elem, value, attr);
        },
        hook: function(elem, attr, value) {
            hooks[attr].set(elem, value);
        },
        elem: function(elem, attr, value) {
            elem.setAttribute(attr, value);
        }
    },
    setAttributes = function(arr, attr, value) {
        var isFn   = isFunction(value),
            idx    = 0,
            len    = arr.length,
            elem,
            val,
            setter = setters.forAttr(attr, value);

        for (; idx < len; idx++) {
            elem = arr[idx];

            if (!isElement(elem)) { continue; }

            val = isFn ? value.call(elem, idx, getAttribute(elem, attr)) : value;
            setter(elem, attr, val);
        }
    },
    setAttribute = function(elem, attr, value) {
        if (!isElement(elem)) { return; }
        var setter = setters.forAttr(attr, value);
        setter(elem, attr, value);
    },

    removeAttributes = function(arr, attr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            removeAttribute(arr[idx], attr);
        }
    },
    removeAttribute = function(elem, attr) {
        if (!isElement(elem)) { return; }

        if (hooks[attr] && hooks[attr].remove) {
            return hooks[attr].remove(elem);
        }

        elem.removeAttribute(attr);
    };

exports.fn = {
    attr: function(attr, value) {
        if (arguments.length === 1) {
            if (isString(attr)) {
                return getAttribute(this[0], attr);
            }

            // assume an object
            var attrs = attr;
            for (attr in attrs) {
                setAttributes(this, attr, attrs[attr]);
            }
        }

        if (arguments.length === 2) {
            if (value === undefined) { return this; }

            // remove
            if (value === null) {
                removeAttributes(this, attr);
                return this;
            }

            // iterator
            if (isFunction(value)) {
                var fn = value;
                return _.each(this, function(elem, idx) {
                    var oldAttr = getAttribute(elem, attr),
                        result  = fn.call(elem, idx, oldAttr);
                    if (!exists(result)) { return; }
                    setAttribute(elem, attr, result);
                });
            }

            // set
            setAttributes(this, attr, value);
            return this;
        }

        // fallback
        return this;
    },

    removeAttr: function(attr) {
        if (isString(attr)) { removeAttributes(this, attr); }

        return this;
    },

    attrData: function(key, value) {
        if (!arguments.length) {

            var first = this[0];
            if (!first) { return; }

            var map  = {},
                keys = getDataAttrKeys(first),
                idx  = keys.length, key;
            while (idx--) {
                key = keys[idx];
                map[trimDataKey(key)] = _.typecast(first.getAttribute(key));
            }

            return map;
        }

        if (arguments.length === 2) {
            var idx = this.length;
            while (idx--) {
                this[idx].setAttribute(sanitizeDataKey(key), '' + value);
            }
            return this;
        }

        // fallback to an object definition
        var obj = key,
            idx = this.length,
            key;
        while (idx--) {
            for (key in obj) {
                this[idx].setAttribute(sanitizeDataKey(key), '' + obj[key]);
            }
        }
        return this;
    }
};
