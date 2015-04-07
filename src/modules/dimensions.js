var parseNum = require('util/parseInt'),
    isNumber = require('is/number'),
    css     = require('./css');

var getInnerWidth = function(elem) {
        var width = parseFloat(css.width.get(elem)) || 0;

        return width +
            (parseNum(css.curCss(elem, 'paddingLeft')) || 0) +
                (parseNum(css.curCss(elem, 'paddingRight')) || 0);
    },
    getInnerHeight = function(elem) {
        var height = parseFloat(css.height.get(elem)) || 0;

        return height +
            (parseNum(css.curCss(elem, 'paddingTop')) || 0) +
                (parseNum(css.curCss(elem, 'paddingBottom')) || 0);
    },

    getOuterWidth = function(elem, withMargin) {
        var width = getInnerWidth(elem);

        if (withMargin) {
            width += (parseNum(css.curCss(elem, 'marginLeft')) || 0) +
                (parseNum(css.curCss(elem, 'marginRight')) || 0);
        }

        return width +
            (parseNum(css.curCss(elem, 'borderLeftWidth')) || 0) +
                (parseNum(css.curCss(elem, 'borderRightWidth')) || 0);
    },
    getOuterHeight = function(elem, withMargin) {
        var height = getInnerHeight(elem);

        if (withMargin) {
            height += (parseNum(css.curCss(elem, 'marginTop')) || 0) +
                (parseNum(css.curCss(elem, 'marginBottom')) || 0);
        }

        return height +
            (parseNum(css.curCss(elem, 'borderTopWidth')) || 0) +
                (parseNum(css.curCss(elem, 'borderBottomWidth')) || 0);
    };

module.exports = {
    fn: {
        width: function(val) {
            if (isNumber(val)) {
                var first = this[0];
                if (!first) { return this; }

                css.width.set(first, val);
                return this;
            }

            if (arguments.length) { return this; }

            // fallback
            var first = this[0];
            if (!first) { return null; }

            return parseFloat(css.width.get(first) || 0);
        },

        height: function(val) {
            if (isNumber(val)) {
                var first = this[0];
                if (!first) { return this; }

                css.height.set(first, val);
                return this;
            }

            if (arguments.length) { return this; }
        
            // fallback
            var first = this[0];
            if (!first) { return null; }

            return parseFloat(css.height.get(first) || 0);
        },

        innerWidth: function() {
            if (arguments.length) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return getInnerWidth(first);
        },

        innerHeight: function() {
            if (arguments.length) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return getInnerHeight(first);
        },

        outerWidth: function(withMargin) {
            if (arguments.length && withMargin === undefined) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return getOuterWidth(first, !!withMargin);
        },

        outerHeight: function(withMargin) {
            if (arguments.length && withMargin === undefined) { return this; }

            var first = this[0];
            if (!first) { return this; }

            return getOuterHeight(first, !!withMargin);
        }
    }
};
