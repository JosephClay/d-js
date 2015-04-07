var parseNum = require('util/parseInt'),
    isNumber = require('is/number'),
    _css     = require('./css');

var _getInnerWidth = function(elem) {
        var width = parseFloat(_css.width.get(elem)) || 0;

        return width +
            (parseNum(_css.curCss(elem, 'paddingLeft')) || 0) +
                (parseNum(_css.curCss(elem, 'paddingRight')) || 0);
    },
    _getInnerHeight = function(elem) {
        var height = parseFloat(_css.height.get(elem)) || 0;

        return height +
            (parseNum(_css.curCss(elem, 'paddingTop')) || 0) +
                (parseNum(_css.curCss(elem, 'paddingBottom')) || 0);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem);

        if (withMargin) {
            width += (parseNum(_css.curCss(elem, 'marginLeft')) || 0) +
                (parseNum(_css.curCss(elem, 'marginRight')) || 0);
        }

        return width +
            (parseNum(_css.curCss(elem, 'borderLeftWidth')) || 0) +
                (parseNum(_css.curCss(elem, 'borderRightWidth')) || 0);
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem);

        if (withMargin) {
            height += (parseNum(_css.curCss(elem, 'marginTop')) || 0) +
                (parseNum(_css.curCss(elem, 'marginBottom')) || 0);
        }

        return height +
            (parseNum(_css.curCss(elem, 'borderTopWidth')) || 0) +
                (parseNum(_css.curCss(elem, 'borderBottomWidth')) || 0);
    };

module.exports = {
    fn: {
        width: function(val) {
            if (isNumber(val)) {
                var first = this[0];
                if (!first) { return this; }

                _css.width.set(first, val);
                return this;
            }

            if (arguments.length) { return this; }

            // fallback
            var first = this[0];
            if (!first) { return null; }

            return parseFloat(_css.width.get(first) || 0);
        },

        height: function(val) {
            if (isNumber(val)) {
                var first = this[0];
                if (!first) { return this; }

                _css.height.set(first, val);
                return this;
            }

            if (arguments.length) { return this; }
        
            // fallback
            var first = this[0];
            if (!first) { return null; }

            return parseFloat(_css.height.get(first) || 0);
        },

        innerWidth: function() {
            if (arguments.length) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return _getInnerWidth(first);
        },

        innerHeight: function() {
            if (arguments.length) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return _getInnerHeight(first);
        },

        outerWidth: function(withMargin) {
            if (arguments.length && withMargin === undefined) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return _getOuterWidth(first, !!withMargin);
        },

        outerHeight: function(withMargin) {
            if (arguments.length && withMargin === undefined) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return _getOuterHeight(first, !!withMargin);
        }
    }
};
