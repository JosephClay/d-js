var _        = require('_'),
    isNumber = require('is/number'),
    css      = require('./css');

var add = function(arr) {
        var idx = arr.length,
            total = 0;
        while (idx--) {
            total += (arr[idx] || 0);
        }
        return total;
    },
    
    getInnerWidth = function(elem) {
        return add([
            parseFloat(css.width.get(elem)),
            _.parseInt(css.curCss(elem, 'paddingLeft')),
            _.parseInt(css.curCss(elem, 'paddingRight'))
        ]);
    },
    getInnerHeight = function(elem) {
        return add([
            parseFloat(css.height.get(elem)),
            _.parseInt(css.curCss(elem, 'paddingTop')),
            _.parseInt(css.curCss(elem, 'paddingBottom'))
        ]);
    },

    getOuterWidth = function(elem, withMargin) {
        return add([
            getInnerWidth(elem),
            withMargin ? _.parseInt(css.curCss(elem, 'marginLeft')) : 0,
            withMargin ? _.parseInt(css.curCss(elem, 'marginRight')) : 0,
            _.parseInt(css.curCss(elem, 'borderLeftWidth')),
            _.parseInt(css.curCss(elem, 'borderRightWidth'))
        ]);
    },
    getOuterHeight = function(elem, withMargin) {
        return add([
            getInnerHeight(elem),
            withMargin ? _.parseInt(css.curCss(elem, 'marginTop')) : 0,
            withMargin ? _.parseInt(css.curCss(elem, 'marginBottom')) : 0,
            _.parseInt(css.curCss(elem, 'borderTopWidth')),
            _.parseInt(css.curCss(elem, 'borderBottomWidth'))
        ]);
    };

exports.fn = {
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
};
