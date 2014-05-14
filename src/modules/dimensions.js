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
        var width = _.parseInt(_css.width.get(elem)) || 0,
            style = _css.getComputedStyle(elem) || {};

        return width +
            _.parseInt(style.paddingLeft || 0) -
                _.parseInt(style.paddingRight || 0) -
                    _.parseInt(style.borderLeftWidth || 0) -
                        _.parseInt(style.borderRightWidth || 0);
    },
    _getInnerHeight = function(elem) {
        var height = _.parseInt(_css.height.get(elem)) || 0,
            style = _css.getComputedStyle(elem) || {};

        return height +
                _.parseInt(style.paddingTop || 0) -
                    _.parseInt(style.paddingBottom || 0) -
                        _.parseInt(style.borderTopWidth || 0) -
                            _.parseInt(style.borderBottomWidth || 0);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem),
            style = _css.getComputedStyle(elem) || {};

        if (withMargin) {
            width += _.parseInt(style.marginLeft || 0) + _.parseInt(style.marginRight || 0);
        }

        return width;
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem),
            style = _css.getComputedStyle(elem) || {};

        if (withMargin) {
            height += _.parseInt(style.marginTop || 0) + _.parseInt(style.marginBottom || 0);
        }

        return height;
    };

module.exports = {
    fn: {
        width: overload()
            .args(Number)
            .use(function(val) {
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
            .args(Number)
            .use(function(val) {
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
