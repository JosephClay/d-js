var _          = require('underscore'),

    exists     = require('is/exists'),
    isString   = require('is/string'),
    isArray    = require('is/array'),
    isNumber   = require('is/number'),
    isFunction = require('is/function'),

    _SUPPORTS  = require('../supports'),
    ELEMENT = require('NODE_TYPE/ELEMENT'),

    _utils     = require('../utils'),
    _div       = require('../div');

var _outerHtml = function() {
    return this.length ? this[0].outerHTML : null;
};

var _text = {
    get: _div.textContent !== undefined ?
        function(elem) { return elem.textContent; } :
            function(elem) { return elem.innerText; } ,
    set: _div.textContent !== undefined ?
        function(elem, str) { elem.textContent = str; } :
            function(elem, str) { elem.innerText = str; }
};

var _valHooks = {
    option: {
        get: function(elem) {
            var val = elem.getAttribute('value');
            return (exists(val) ? val : _text.get(elem)).trim();
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
        };
    });
}

var _getVal = function(elem) {
    if (!elem || (elem.nodeType !== ELEMENT)) { return; }

    var hook = _valHooks[elem.type] || _valHooks[_utils.normalNodeName(elem)];
    if (hook && hook.get) {
        return hook.get(elem);
    }

    var val = elem.value;
    if (val === undefined) {
        val = elem.getAttribute('value');
    }

    return isString(val) ? _utils.normalizeNewlines(val) : val;
};

var _stringify = function(value) {
    if (!exists(value)) {
        return '';
    }
    return '' + value;
};

var _setVal = function(elem, value) {
    if (elem.nodeType !== ELEMENT) { return; }

    // Stringify values
    if (isArray(value)) {
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
        outerHtml: _outerHtml,
        outerHTML: _outerHtml,

        html: function(html) {
            if (isString(html)) {
                return _.each(this, function(elem) {
                    elem.innerHTML = html;
                });
            }

            if (isFunction(html)) {
                var iterator = html;
                return _.each(this, function(elem, idx) {
                    elem.innerHTML = iterator.call(elem, idx, elem.innerHTML);
                });
            }

            var first = this[0];
            return (!first) ? undefined : first.innerHTML;
        },

        // TODO: Add handling of (and unit tests for) \r\n in IE
        val: function(value) {
            // getter
            if (!arguments.length) {
                // TODO: Select first element node instead of index 0?
                return _getVal(this[0]);
            }

            if (!exists(value)) {
                return _.each(this, function(elem) {
                    _setVal(elem, '');
                });
            }

            if (isFunction(value)) {
                var iterator = value;
                return _.each(this, function(elem, idx) {
                    if (elem.nodeType !== ELEMENT) { return; }

                    var value = iterator.call(elem, idx, _getVal(elem));

                    _setVal(elem, value);
                });
            }

            // setters
            if (isString(value) || isNumber(value) || isArray(value)) {
                return _.each(this, function(elem) {
                    _setVal(elem, value);
                });
            }

            return _.each(this, function(elem) {
                _setVal(elem, value);
            });
        },

        text: function(str) {
            if (isString(str)) {
                return _.each(this, function(elem) {
                    _text.set(elem, str);
                });
            }

            if (isFunction(str)) {
                var iterator = str;
                return _.each(this, function(elem, idx) {
                    _text.set(elem, iterator.call(elem, idx, _text.get(elem)));
                });
            }

            str = '';
            _.each(this, function(elem) {
                str += _text.get(elem);
            });
            return str;
        }
    }
};
