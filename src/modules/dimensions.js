var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _css = require('./css');

var _getInnerWidth = function(elem) {
        var width = parseFloat(_css.width.get(elem)) || 0,
            style = _css.getComputedStyle(elem) || {};

        return width +
            _.parseInt(style.paddingLeft || 0) +
                _.parseInt(style.paddingRight || 0);
    },
    _getInnerHeight = function(elem) {
        var height = parseFloat(_css.height.get(elem)) || 0,
            style = _css.getComputedStyle(elem) || {};

        return height +
                _.parseInt(style.paddingTop || 0) +
                    _.parseInt(style.paddingBottom || 0);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem),
            style = _css.getComputedStyle(elem) || {};

        if (withMargin) {
            width += _.parseInt(style.marginLeft || 0) + _.parseInt(style.marginRight || 0);
        }

        return width +
                _.parseInt(style.borderLeftWidth || 0) +
                    _.parseInt(style.borderRightWidth || 0);
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem),
            style = _css.getComputedStyle(elem) || {};

        if (withMargin) {
            height += _.parseInt(style.marginTop || 0) + _.parseInt(style.marginBottom || 0);
        }

        return height +
                _.parseInt(style.borderTopWidth || 0) +
                    _.parseInt(style.borderBottomWidth || 0);
    };

module.exports = {
    fn: {
        width: overload()
            .args(Number)
            .use(function(val) {
                var first = this[0];
                if (!first) { return this; }

                _css.width.set(first, val);
                return this;
            })

            .fallback(function() {
                var first = this[0];
                if (!first) { return null; }

                return parseFloat(_css.width.get(first) || 0);
            })
            .expose(),

        height: overload()
            .args(Number)
            .use(function(val) {
                var first = this[0];
                if (!first) { return this; }

                _css.height.set(first, val);
                return this;
            })

            .fallback(function() {
                var first = this[0];
                if (!first) { return null; }

                return parseFloat(_css.height.get(first) || 0);
            })
            .expose(),

        innerWidth: function() {
            var first = this[0];
            if (!first) { return this; }

            return _getInnerWidth(first);
        },

        innerHeight: function() {
            var first = this[0];
            if (!first) { return this; }

            return _getInnerHeight(first);
        },

        outerWidth: function(withMargin) {
            var first = this[0];
            if (!first) { return this; }

            return _getOuterWidth(first, withMargin);
        },
        outerHeight: function(withMargin) {
            var first = this[0];
            if (!first) { return this; }

            return _getOuterHeight(first, withMargin);
        }
    }
};
