var _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,
    string     = require('../string'),

    _SUPPORTS  = require('../supports'),
    NODE_TYPE = require('node-type'),

    _utils     = require('../utils'),
    _div       = require('../div');

var _outerHtml = function() {
    return this.length ? this[0].outerHTML : null;
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
            return string.trim(_.exists(val) ? val : _text.get(elem));
        }
    },

    select: {
        get: function(elem) {
            var value, option,
                options = elem.options,
                index   = elem.selectedIndex,
                one     = elem.type === 'select-one' || index < 0,
                values  = one ? null : [],
                max     = one ? index + 1 : options.length,
                idx     = index < 0 ? max : (one ? index : 0);

            // Loop through all the selected options
            for (; idx < max; idx++) {
                option = options[idx];

                // oldIE doesn't update selected after form reset (#2551)
                if ((option.selected || idx === index) &&
                        // Don't return options that are disabled or in a disabled optgroup
                        (_SUPPORTS.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) &&
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
                values  = _.makeArray(value),
                idx     = options.length;

            while (idx--) {
                option = options[idx];

                if (_.indexOf(values, _valHooks.option.get(option)) >= 0) {
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

// Radio and checkbox getter for Webkit
if (!_SUPPORTS.checkOn) {
    _.each(['radio', 'checkbox'], function(type) {
        _valHooks[type] = {
            get: function(elem) {
                // Support: Webkit - '' is returned instead of 'on' if a value isn't specified
                return elem.getAttribute('value') === null ? 'on' : elem.value;
            }
        }
    });
}

var _getVal = function(elem) {
    if (!elem || (elem.nodeType !== NODE_TYPE.ELEMENT)) { return; }

    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
    if (hook && hook.get) {
        return hook.get(elem);
    }

    var val = elem.value;
    if (val === undefined) {
        val = elem.getAttribute('value');
    }

    return _.isString(val) ? _utils.normalizeNewlines(val) : val;
};

var _stringify = function(value) {
    if (!_.exists(value)) {
        return '';
    }
    return '' + value;
};

var _setVal = function(elem, value) {
    if (elem.nodeType !== NODE_TYPE.ELEMENT) { return; }

    // Stringify values
    if (_.isArray(value)) {
        value = _.map(value, _stringify);
    } else {
        value = _stringify(value);
    }

    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
    if (hook && hook.set) {
        hook.set(elem, value);
    } else {
        elem.setAttribute('value', value);
    }
};

module.exports = {
    fn: {
        // TODO: Overload and determine api
        // TODO: unit tests
        outerHtml: _outerHtml,
        outerHTML: _outerHtml,

        html: overload()
            .args(String)
            .use(function(html) {
                return _.each(this, function(elem) {
                    elem.innerHTML = html;
                });
            })

            .args(Function)
            .use(function(iterator) {
                return _.each(this, function(elem, idx) {
                    elem.innerHTML = iterator.call(elem, idx, elem.innerHTML);
                });
            })

            .fallback(function() {
                var first = this[0];
                return (!first) ? undefined : first.innerHTML;
            })
            .expose(),

        // TODO: Add handling of (and unit tests for) \r\n in IE
        val: overload()
            // Getter
            .args()
            .use(function() {
                // TODO: Select first element node instead of index 0?
                return _getVal(this[0]);
            })

            // Setters
            .args(o.any(String, Number, Array))
            .use(function(value) {
                return _.each(this, function(elem) {
                    _setVal(elem, value);
                });
            })

            .args(o.any(null, undefined))
            .use(function() {
                return _.each(this, function(elem) {
                    _setVal(elem, '');
                });
            })

            .args(Function)
            .use(function(iterator) {
                return _.each(this, function(elem, idx) {
                    if (elem.nodeType !== NODE_TYPE.ELEMENT) { return; }

                    var value = iterator.call(elem, idx, _getVal(elem));

                    _setVal(elem, value);
                });
            })

            .fallback(function(value) {
                return _.each(this, function(elem) {
                    _setVal(elem, value);
                });
            })

            .expose(),

        text: overload()
            .args(String)
            .use(function(str) {
                return _.each(this, function(elem) {
                    _text.set(elem, str);
                });
            })

            .args(Function)
            .use(function(iterator) {
                return _.each(this, function(elem, idx) {
                    _text.set(elem, iterator.call(elem, idx, _text.get(elem)));
                });
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
