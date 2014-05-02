var _ = require('../_');

var _hooks = {
    tabindex: {
        get: function(elem) {
            var tabindex = elem.getAttribute('tabindex');
            if (!_.exists(tabindex) || tabindex === '') { return; }
            return _.parseInt(elem.getAttribute(tabindex)) || 0;
        }
    }
};

var _getAttribute = function(elem, attr) {
    if (!elem) { return; }

    if (_hooks[attr] && _hooks[attr].get) {
        return _hooks[attr].get(elem);
    }

    elem.getAttribute(attr);
};

return {
    fn: {
        attr: Overload().args(String).use(function(attr) {
                        return _getAttribute(this[0], attr);
                    })

                    .args(String, O.any(String, Number))
                    .use(function(attr, value) {
                        var idx = 0, length = this.length;
                        for (; idx < length; idx++) {
                            this[idx].setAttribute(attr, value);
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
                            elem.setAttribute(attr, result);
                        }

                        return this;
                    })

                    .expose(),

        removeAttr: function() {

        }
    }
};
