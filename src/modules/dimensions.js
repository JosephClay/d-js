var div = require('../div');

// TODO: This may be better suited in supports or css
var _getComputedStyle = (function() {
        return div.currentStyle ? function(elem) { return elem.currentStyle; } : window.getComputedStyle;
    }()),

    _getWidth = function(elem) {
        return elem.offsetWidth;
    },
    _setWidth = function(elem, val) {
        elem.style.width = _.isNumber(val) ? val + 'px' : val;
    },

    _getHeight = function(elem) {
        return elem.offsetHeight;
    },
    _setHeight = function(elem, val) {
        elem.style.height = _.isNumber(val) ? val + 'px' : val;
    },

    _getInnerWidth = function(elem) {
        var width = _getWidth(elem),
            style = _getComputedStyle(elem);

        return width + _.parseInt(style.paddingLeft) + _.parseInt(style.paddingRight);
    },
    _getInnerHeight = function(elem) {
        var height = _getHeight(elem),
            style = _getComputedStyle(elem);

        return height + _.parseInt(style.paddingTop) + _.parseInt(style.paddingBottom);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem),
            style = _getComputedStyle(elem);

        if (withMargin) {
            width += _.parseInt(style.marginLeft) + _.parseInt(style.marginRight);
        }

        return width + _.parseInt(style.borderLeftWidth) + _.parseInt(style.borderRightWidth);
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem),
            style = _getComputedStyle(elem);

        if (withMargin) {
            height += _.parseInt(style.marginTop) + _.parseInt(style.marginBottom);
        }

        return height + _.parseInt(style.borderTopWidth) + _.parseInt(style.borderBottomWidth);
    };

// TODO: Overload
return {
    fn: {
        width: function(val) {
            var elem = this[0], // The first elem
                valExists = _.exists(val);
            if (!elem && !valExists) { return null; }
            if (!elem) { return this; }

            if (valExists) {
                _setWidth(elem, val);
                return this;
            }

            return _getWidth(elem);
        },

        height: function(val) {
            var elem = this[0], // The first elem
                valExists = _.exists(val);
            if (!elem && !valExists) { return null; }
            if (!elem) { return this; }

            if (valExists) {
                _setHeight(elem, val);
                return this;
            }

            return _getHeight(elem);
        },

        innerWidth: function() {
            var elem = this[0];
            if (!elem) { return this; }

            return _getInnerWidth(elem);
        },

        innerHeight: function() {
            var elem = this[0];
            if (!elem) { return this; }

            return _getInnerHeight(elem);
        },

        outerWidth: function(withMargin) {
            var elem = this[0];
            if (!elem) { return this; }

            return _getOuterWidth(elem, withMargin);
        },
        outerHeight: function(withMargin) {
            var elem = this[0];
            if (!elem) { return this; }

            return _getOuterHeight(elem, withMargin);
        }
    }
};
