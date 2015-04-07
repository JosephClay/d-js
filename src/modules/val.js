var _          = require('underscore'),
    newlines   = require('string/newlines'),
    exists     = require('is/exists'),
    isString   = require('is/string'),
    isArray    = require('is/array'),
    isNumber   = require('is/number'),
    isFunction = require('is/function'),
    isNodeName = require('node/isName'),
    normalName = require('node/normalizeName'),
    SUPPORTS   = require('SUPPORTS'),
    ELEMENT    = require('NODE_TYPE/ELEMENT'),
    DIV        = require('DIV');

var outerHtml = () => this.length ? this[0].outerHTML : null;

var text = {
    get: DIV.textContent !== undefined ?
        (elem) => elem.textContent :
            (elem) => elem.innerText,
    set: DIV.textContent !== undefined ?
        (elem, str) => elem.textContent = str :
            (elem, str) => elem.innerText = str
};

var valHooks = {
    option: {
        get: function(elem) {
            var val = elem.getAttribute('value');
            return (exists(val) ? val : text.get(elem)).trim();
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
                        (SUPPORTS.optDisabled ? !option.disabled : option.getAttribute('disabled') === null) &&
                        (!option.parentNode.disabled || !isNodeName(option.parentNode, 'optgroup'))) {

                    // Get the specific value for the option
                    value = valHooks.option.get(option);

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

                if (_.contains(values, valHooks.option.get(option))) {
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
if (!SUPPORTS.checkOn) {
    _.each(['radio', 'checkbox'], function(type) {
        valHooks[type] = {
            get: function(elem) {
                // Support: Webkit - '' is returned instead of 'on' if a value isn't specified
                return elem.getAttribute('value') === null ? 'on' : elem.value;
            }
        };
    });
}

var getVal = function(elem) {
    if (!elem || (elem.nodeType !== ELEMENT)) { return; }

    var hook = valHooks[elem.type] || valHooks[normalName(elem)];
    if (hook && hook.get) {
        return hook.get(elem);
    }

    var val = elem.value;
    if (val === undefined) {
        val = elem.getAttribute('value');
    }

    return isString(val) ? newlines(val) : val;
};

var stringify = (value) =>
    !exists(value) ? '' : (value + '');

var setVal = function(elem, val) {
    if (elem.nodeType !== ELEMENT) { return; }

    // Stringify values
    var value = isArray(val) ? _.map(val, stringify) : stringify(val);

    var hook = valHooks[elem.type] || valHooks[normalName(elem)];
    if (hook && hook.set) {
        hook.set(elem, value);
    } else {
        elem.setAttribute('value', value);
    }
};

module.exports = {
    fn: {
        outerHtml: outerHtml,
        outerHTML: outerHtml,

        html: function(html) {
            if (isString(html)) {
                return _.each(this, (elem) => elem.innerHTML = html);
            }

            if (isFunction(html)) {
                var iterator = html;
                return _.each(this, (elem, idx) =>
                    elem.innerHTML = iterator.call(elem, idx, elem.innerHTML)
                );
            }

            var first = this[0];
            return (!first) ? undefined : first.innerHTML;
        },

        // TODO: Add handling of (and unit tests for) \r\n in IE
        val: function(value) {
            // getter
            if (!arguments.length) {
                // TODO: Select first element node instead of index 0?
                return getVal(this[0]);
            }

            if (!exists(value)) {
                return _.each(this, (elem) => setVal(elem, ''));
            }

            if (isFunction(value)) {
                var iterator = value;
                return _.each(this, function(elem, idx) {
                    if (elem.nodeType !== ELEMENT) { return; }

                    var value = iterator.call(elem, idx, getVal(elem));

                    setVal(elem, value);
                });
            }

            // setters
            if (isString(value) || isNumber(value) || isArray(value)) {
                return _.each(this, (elem) => setVal(elem, value));
            }

            return _.each(this, (elem) => setVal(elem, value));
        },

        text: function(str) {
            if (isString(str)) {
                return _.each(this, (elem) => text.set(elem, str));
            }

            if (isFunction(str)) {
                var iterator = str;
                return _.each(this, (elem, idx) =>
                    text.set(elem, iterator.call(elem, idx, text.get(elem)))
                );
            }

            return _.map(this, (elem) => text.get(elem)).join('');
        }
    }
};
