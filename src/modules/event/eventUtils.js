var _    = require('underscore'),
    _div = require('../../div');

module.exports = {
    id: 'd' + (new Date().getTime()),

    activeElement: function() {
        try {
            return document.activeElement;
        } catch (err) {}
    },

    addEvent: _div.addEventListener ?
        function(elem, type, callback) {
            elem.addEventListener(type, callback, false);
        } :
        _div.attachEvent ?
        function(elem, type, callback) {
            elem.attachEvent('on' + type, callback);
        } :
        _.noop,

    removeEvent: document.removeEventListener ?
        function(elem, type, handle) {
            if (!elem.removeEventListener) { return; }
            elem.removeEventListener(type, handle, false);
        } :
        function(elem, type, handle) {
            var name = 'on' + type;

            if (!elem.detachEvent) { return; }

            // #8545, #7054, preventing memory leaks for custom events in IE6-8
            // detachEvent needed property on element, by name of that event, to properly expose it to GC
            if (elem[name] === undefined) {
                elem[name] = null;
            }

            elem.detachEvent(name, handle);
        }
};