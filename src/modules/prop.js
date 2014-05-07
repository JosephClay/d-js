var _ = require('_'),
    _supports = require('../supports'),
    _nodeType = require('../nodeType');

var _propFix = {
    'for': 'htmlFor',
    'class': 'className'
};

var _propHooks = {
    src: (_supports.hrefNormalized) ? {} : {
        get: function(elem) {
            return elem.getAttribute('src', 4);
        }
    },

    href: (_supports.hrefNormalized) ? {} : {
        get: function(elem) {
            return elem.getAttribute('href', 4);
        }
    },

    // Support: Safari, IE9+
    // mis-reports the default selected property of an option
    // Accessing the parent's selectedIndex property fixes it
    selected: (_supports.optSelected) ? {} : {
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
    if (!elem || nodeType === _nodeType.TEXT || nodeType === _nodeType.COMMENT || nodeType === _nodeType.ATTRIBUTE) {
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
        prop: Overload().args(String).use(function(prop) {
                var first = this[0];
                if (!first) { return; }

                return _getOrSetProp(prop);
            })

            .args(String, O.any(String, Number, Boolean)).use(function(prop, value) {
                var idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    _getOrSetProp(this[idx], prop, value);
                }
                return this;
            })

            .args(String, Function).use(function(prop, fn) {
                var idx = 0, length = this.length,
                    elem, result;
                for (; idx < length; idx++) {
                    elem = this[idx];
                    result = fn.call(elem, idx, _getOrSetProp(elem, prop));
                    _getOrSetProp(elem, prop, result);
                }
                return this;
            })

            .expose(),

        removeProp: Overload().args(String).use(function(prop) {
                var name = _propFix[prop] || prop,
                    idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    delete this[idx][name];
                }
                return this;
            })
            .expose()
    }
};
