var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _css = require('./css');

var _getDocumentDimension = function(elem, name) {
        // Either scroll[Width/Height] or offset[Width/Height] or
        // client[Width/Height], whichever is greatest
        var doc = elem.documentElement;
        return Math.max(
            elem.body['scroll' + name],
            elem.body['offset' + name],

            doc['scroll' + name],
            doc['offset' + name],

            doc['client' + name]
        );
    },

    _getInnerWidth = function(elem) {
        var width = _css.width.get(elem),
            style = _css.getComputedStyle(elem);

        return width + _.parseInt(style.paddingLeft) + _.parseInt(style.paddingRight);
    },
    _getInnerHeight = function(elem) {
        var height = _css.height.get(elem),
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

module.exports = {
    fn: {
        width: overload()
            .args(Number).use(function(val) {
                var elem = this[0]; // The first elem
                if (!elem) { return this; }

                _css.width.set(elem, val);
                return this;
            })
            .fallback(function() {
                var elem = this[0]; // The first elem
                if (!elem) { return null; }

                return _css.width.get(elem);
            })
            .expose(),

        height: overload()
            .args(Number).use(function(val) {
                var elem = this[0]; // The first elem
                if (!elem) { return this; }

                _css.height.set(elem, val);
                return this;
            })
            .fallback(function() {
                var elem = this[0]; // The first elem
                if (!elem) { return null; }

                return _css.height.get(elem);
            })
            .expose(),

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
