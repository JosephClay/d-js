var _ = require('../_'),
    _regex = require('../regex'),
    _div = require('../div'),

    _css = require('./css');
/*
if (jQuery.isWindow(elem)) {
                        // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
                        // isn't a whole lot we can do. See pull request at this URL for discussion:
                        // https://github.com/jquery/jquery/pull/764
                        return elem.document.documentElement["client" + name];
                    }

                    // Get document width or height
                    if (elem.nodeType === 9) {
                        doc = elem.documentElement;

                        // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
                        // unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
                        return Math.max(
                        elem.body["scroll" + name], doc["scroll" + name],
                        elem.body["offset" + name], doc["offset" + name],
                        doc["client" + name]
                        );
                    }
                    */

var _MEASURE_DISPLAY = {
        display: 'block',
        position: 'absolute',
        visibility: 'hidden'
    },

    _getWidth = function(elem) {
        var width = elem.offsetWidth;
        return (width === 0 &&
                _regex.display.isNoneOrTable(_css.getComputedStyle(elem).display)) ?
                    _css.swap(elem, _MEASURE_DISPLAY, function() { return elem.offsetWidth; }) :
                        width;
    },
    _setWidth = function(elem, val) {
        elem.style.width = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
    },

    _getHeight = function(elem) {
        var height = elem.offsetHeight;
        return (height === 0 &&
                _regex.display.isNoneOrTable(_css.getComputedStyle(elem).display)) ?
                    _css.swap(elem, _MEASURE_DISPLAY, function() { return elem.offsetHeight; }) :
                        height;
    },
    _setHeight = function(elem, val) {
        elem.style.height = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
    },

    _getInnerWidth = function(elem) {
        var width = _getWidth(elem),
            style = _css.getComputedStyle(elem);

        return width + _.parseInt(style.paddingLeft) + _.parseInt(style.paddingRight);
    },
    _getInnerHeight = function(elem) {
        var height = _getHeight(elem),
            style = _css.getComputedStyle(elem);

        return height + _.parseInt(style.paddingTop) + _.parseInt(style.paddingBottom);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem),
            style = _css.getComputedStyle(elem);

        if (withMargin) {
            width += _.parseInt(style.marginLeft) + _.parseInt(style.marginRight);
        }

        return width + _.parseInt(style.borderLeftWidth) + _.parseInt(style.borderRightWidth);
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem),
            style = _css.getComputedStyle(elem);

        if (withMargin) {
            height += _.parseInt(style.marginTop) + _.parseInt(style.marginBottom);
        }

        return height + _.parseInt(style.borderTopWidth) + _.parseInt(style.borderBottomWidth);
    };

// TODO: Overload
module.exports = {
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
