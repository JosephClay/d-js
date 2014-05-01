var _div = require('../div');

var _swapSettings = {
    measureDisplay: {
        display: 'block',
        position: 'absolute',
        visibility: 'hidden'
    }
};

var _hide = function(elem) {
        elem.style.display = 'none';
    },
    _show = function(elem) {
        elem.style.display = '';
    },

    _cssSwap = function(elem, options, callback) {
        var old = {};

        // Remember the old values, and insert the new ones
        var name;
        for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
        }

        var ret = callback(elem);

        // Revert the old values
        for (name in options) {
            elem.style[name] = old[name];
        }

        return ret;
    };

var _computedStyle = (function() {
    return _div.currentStyle ?
        function(elem) { return elem.currentStyle; } :
            // Avoids an "Illegal Invocation" error
            function(elem) { return window.getComputedStyle(elem); };
}());

var _hooks = {
    opacity: require('./cssHooks/opacity'),
    width: require('./cssHooks/width'),
    height: require('./cssHooks/height')
};

module.exports = {
    swap: _cssSwap,
    swapSetting: _swapSettings,
    getComputedStyle: _computedStyle,

    fn: {
        // TODO: Css
        css: function() {},

        hide: function() {
            var idx = 0, length = this.length;
            for (; idx < length; idx++) {
                _hide(this[idx]);
            }
            return this;
        },
        show: function() {
            var idx = 0, length = this.length;
            for (; idx < length; idx++) {
                _show(this[idx]);
            }
            return this;
        },

        // TODO: Toggle
        toggle: function() {

        }
    }
};
