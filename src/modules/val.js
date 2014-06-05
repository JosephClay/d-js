var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _manip = require('./manip'),

    _div = require('../div'),
    _nodeType = require('../nodeType'),
    _supports = require('../supports'),
    _utils    = require('../utils');

var _outerHtml = function(elem) {
    var div = document.createElement('div');

    // append elem to div
    _manip.append(div, elem.cloneNode(true));

    var html = div.innerHTML;

    div = null;

    return html;
};

var _text = {
    get: (_div.textContent !== undefined) ?
        function(elem) { return elem.textContent; } :
            function(elem) { return elem.innerText; } ,
    set: (_div.textContent !== undefined) ?
        function(elem, str) { elem.textContent = str; } :
            function(elem, str) { elem.innerText = str; }
};

var _valHooks = {
    option: {
        get: function(elem) {
            var val = elem.getAttribute('value');
            return _.exists(val) ? val : _text.get(elem);
        }
    },

    select: {
        get: function(elem) {
            var value, option,
                options = elem.options,
                index = elem.selectedIndex,
                one = elem.type === 'select-one' || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                idx = index < 0 ?
                    max :
                    one ? index : 0;

            // Loop through all the selected options
            for (; idx < max; idx++) {
                option = options[idx];

                // oldIE doesn't update selected after form reset (#2551)
                if ((option.selected || idx === index) &&
                        // Don't return options that are disabled or in a disabled optgroup
                        (_supports.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) &&
                        (!option.parentNode.disabled || !_utils.isNodeName(option.parentNode, 'optgroup'))) {

                    // Get the specific value for the option
                    value = _valHooks.option.get(option);

                    // We don't need an array for one selects
                    if (one) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push(value);
                }
            }

            return values;
        },

        set: function(elem, value) {
            var optionSet, option,
                options = elem.options,
                values = jQuery.makeArray(value),
                idx = options.length;

            while (idx--) {
                option = options[idx];

                if (jQuery.inArray(jQuery.valHooks.option.get(option), values) >= 0) {
                    option.selected = optionSet = true;
                } else {
                    option.selected = false;
                }
            }

            // Force browsers to behave consistently when non-matching value is set
            if (!optionSet) {
                elem.selectedIndex = -1;
            }
        }
    }

};

// Radios and checkboxes getter/setter
_.each(['radio', 'checkbox'], function(type) {
    _valHooks[type] = {
        set: function(elem, value) {
            if (_.isArray(value)) {
                return (elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0);
            }
        }
    };

    if (!_supports.checkOn) {
        _valHooks[type].get = function(elem) {
            // Support: Webkit - '' is returned instead of 'on' if a value isn't specified
            return elem.getAttribute('value') === null ? 'on' : elem.value;
        };
    }
});

var _getVal = function(elem) {
    if (!elem || (elem.nodeType !== _nodeType.ELEMENT)) { return; }

    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
    if (hook && hook.get) {
        return hook.get(elem);
    }

    return _utils.normalizeNewlines(elem.value);
};

module.exports = {
    fn: {
        // TODO: Overload and determine api
        // TODO: unit tests
        outerHtml: function() {
            var first = this[0];
            if (!first) { return null; }

            return _outerHtml(first);
        },

        html: overload()
            .args(String)
            .use(function(html) {
                _.each(this, function(elem) {
                    elem.innerHTML = html;
                });

                return this;
            })

            .args(Function)
            .use(function(iterator) {
                _.each(this, function(elem, idx) {
                    elem.innerHTML = iterator.call(elem, idx, elem.innerHTML);
                });

                return this;
            })

            .fallback(function() {
                var first = this[0];
                return (!first) ? undefined : first.innerHTML;
            })
            .expose(),

        // TODO: Add handling of (and unit tests for) \r\n in IE
        val: overload()
            .args(O.any(String, Number))
            .use(function(value) {
                value = '' + value;

                _.each(this, function(elem) {
                    if (elem.nodeType !== _nodeType.ELEMENT) { return; }

                    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
                    if (hook && hook.set) {
                        hook.set(elem, value);
                    } else {
                        elem.setAttribute('value', value);
                    }
                });

                return this;
            })

            .args(Function)
            .use(function(iterator) {
                _.each(this, function(elem, idx) {
                    if (elem.nodeType !== _nodeType.ELEMENT) { return; }

                    var value = iterator.call(elem, idx, _getVal(elem));
                    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];

                    if (hook && hook.set) {
                        hook.set(elem, value);
                    } else {
                        elem.setAttribute('value', value);
                    }
                });

                return this;
            })

            .fallback(function() {
                return _getVal(this[0]);
            })
            .expose(),

        text: overload()
            .args(String)
            .use(function(str) {
                _.each(this, function(elem) {
                    _text.set(elem, str);
                });

                return this;
            })

            .args(Function)
            .use(function(iterator) {
                _.each(this, function(elem, idx) {
                    _text.set(elem, iterator.call(elem, idx, _text.get(elem)));
                });

                return this;
            })

            .fallback(function() {
                var str = '';
                _.each(this, function(elem) {
                    str += _text.get(elem);
                });

                return str;
            })
            .expose()
    }
};
