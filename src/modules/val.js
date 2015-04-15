var _          = require('_'),
    newlines   = require('util/newlines'),
    exists     = require('is/exists'),
    isString   = require('is/string'),
    isArray    = require('is/array'),
    isNumber   = require('is/number'),
    isFunction = require('is/function'),
    isNodeName = require('is/nodeName'),
    SUPPORTS   = require('SUPPORTS'),
    isElement  = require('nodeType').elem;

var normalNodeName = (elem) => elem.nodeName.toLowerCase(),

    outerHtml = function() {
        return this.length ? this[0].outerHTML : null;
    },

    textGet = SUPPORTS.textContent ?
        (elem) => elem.textContent :
            (elem) => elem.innerText,

    textSet = SUPPORTS.textContent ?
        (elem, str) => elem.textContent = str :
            (elem, str) => elem.innerText = str;

var valHooks = {
    option: {
        get: function(elem) {
            var val = elem.getAttribute('value');
            return (exists(val) ? val : textGet(elem)).trim();
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
    if (!isElement(elem)) { return; }

    var hook = valHooks[elem.type] || valHooks[normalNodeName(elem)];
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
    if (!isElement(elem)) { return; }

    // Stringify values
    var value = isArray(val) ? _.map(val, stringify) : stringify(val);

    var hook = valHooks[elem.type] || valHooks[normalNodeName(elem)];
    if (hook && hook.set) {
        hook.set(elem, value);
    } else {
        elem.setAttribute('value', value);
    }
};

exports.fn = {
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
        return !first ? undefined : first.innerHTML;
    },

    val: function(value) {
        // getter
        if (!arguments.length) {
            return getVal(this[0]);
        }

        if (!exists(value)) {
            return _.each(this, (elem) => setVal(elem, ''));
        }

        if (isFunction(value)) {
            var iterator = value;
            return _.each(this, function(elem, idx) {
                if (!isElement(elem)) { return; }

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
            return _.each(this, (elem) => textSet(elem, str));
        }

        if (isFunction(str)) {
            var iterator = str;
            return _.each(this, (elem, idx) =>
                textSet(elem, iterator.call(elem, idx, textGet(elem)))
            );
        }

        return _.map(this, textGet).join('');
    }
};