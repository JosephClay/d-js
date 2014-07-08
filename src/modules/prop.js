var _          = require('_'),
    overload   = require('overload'),
    O          = overload.O,

    _SUPPORTS  = require('../supports'),
    _NODE_TYPE = require('../nodeType'),

    _regex     = require('../regex');

var _propFix = {
    'tabindex'        : 'tabIndex',
    'readonly'        : 'readOnly',
    'for'             : 'htmlFor',
    'class'           : 'className',
    'maxlength'       : 'maxLength',
    'cellspacing'     : 'cellSpacing',
    'cellpadding'     : 'cellPadding',
    'rowspan'         : 'rowSpan',
    'colspan'         : 'colSpan',
    'usemap'          : 'useMap',
    'frameborder'     : 'frameBorder',
    'contenteditable' : 'contentEditable'
};

var _propHooks = {
    src: (_SUPPORTS.hrefNormalized) ? {} : {
        get: function(elem) {
            return elem.getAttribute('src', 4);
        }
    },

    href: (_SUPPORTS.hrefNormalized) ? {} : {
        get: function(elem) {
            return elem.getAttribute('href', 4);
        }
    },

    // Support: Safari, IE9+
    // mis-reports the default selected property of an option
    // Accessing the parent's selectedIndex property fixes it
    selected: (_SUPPORTS.optSelected) ? {} : {
        get: function( elem ) {
            var parent = elem.parentNode,
                fix;

            if (parent) {
                fix = parent.selectedIndex;

                // Make sure that it also works with optgroups, see #5701
                if (parent.parentNode) {
                    fix = parent.parentNode.selectedIndex;
                }
            }
            return null;
        }
    },

    tabIndex: {
        get: function( elem ) {
            // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
            // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
            // Use proper attribute retrieval(#12072)
            var tabindex = elem.getAttribute('tabindex');

            if (tabindex) { return _.parseInt(tabindex); }

            var nodeName = elem.nodeName;
            return (_regex.type.isFocusable(nodeName) || (_regex.type.isClickable(nodeName) && elem.href)) ? 0 : -1;
        }
    }
};

var _getOrSetProp = function(elem, name, value) {
    var nodeType = elem.nodeType;

    // don't get/set properties on text, comment and attribute nodes
    if (!elem || nodeType === _NODE_TYPE.TEXT || nodeType === _NODE_TYPE.COMMENT || nodeType === _NODE_TYPE.ATTRIBUTE) {
        return;
    }

    // Fix name and attach hooks
    name = _propFix[name] || name;
    var hooks = _propHooks[name];

    var result;
    if (value !== undefined) {
        return hooks && ('set' in hooks) && (result = hooks.set(elem, value, name)) !== undefined ?
            result :
            (elem[name] = value);

    }

    return hooks && ('get' in hooks) && (result = hooks.get(elem, name)) !== null ?
        result :
        elem[name];
};

module.exports = {
    fn: {
        prop: overload()
            .args(String)
            .use(function(prop) {
                var first = this[0];
                if (!first) { return; }

                return _getOrSetProp(first, prop);
            })

            .args(String, O.any(String, Number, Boolean))
            .use(function(prop, value) {
                return this.each(function(elem) {
                    _getOrSetProp(elem, prop, value);
                });
            })

            .args(String, Function)
            .use(function(prop, fn) {
                return this.each(function(elem) {
                    var result = fn.call(elem, idx, _getOrSetProp(elem, prop));
                    _getOrSetProp(elem, prop, result);
                });
            })

            .expose(),

        removeProp: overload()
            .args(String)
            .use(function(prop) {
                var name = _propFix[prop] || prop;
                return this.each(function(elem) {
                    delete elem[name];
                });
            })
            .expose()
    }
};
