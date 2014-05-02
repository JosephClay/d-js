var _ = require('../_');

var _hooks = {
        tabindex: {
            get: function(elem) {
                var tabindex = elem.getAttribute('tabindex');
                if (!_.exists(tabindex) || tabindex === '') { return; }
                return _.parseInt(elem.getAttribute(tabindex)) || 0;
            }
        }
    },

    _getAttribute = function(elem, attr) {
        if (!elem) { return; }

        if (_hooks[attr] && _hooks[attr].get) {
            return _hooks[attr].get(elem);
        }

        return elem.getAttribute(attr);
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
        attr: Overload().args(String).use(function(attr) {
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

                    .args(Object).use(function(attrs) {
                        var attr, value;
                        for (attr in attrs) {
                            _setAttributes(this, attr, attrs[attr]);
                        }

                        return this;
                    })

                    .args(String, Function)
                    .use(function(attr, fn) {
                        var idx = 0, length = this.length;
                        for (; idx < length; idx++) {
                            var elem = this[idx],
                                oldAttr = _getAttribute(this[0], attr),
                                result = fn.call(elem, idx, oldAttr);
                            if (!_.exists(result)) { continue; }
                            _setAttribute(elem, attr, result);
                        }

                        return this;
                    })

                    .expose(),

        removeAttr: Overload().args(String).use(function(attr) {
                        _removeAttributes(this, attr);
                        return this;
                    })

                    .expose()
    }
};
