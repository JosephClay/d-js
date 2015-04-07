var DIV = require('DIV');

module.exports = {
    id: 'd' + Date.now(),

    activeElement: function() {
        try {
            return document.activeElement;
        } catch (err) {}
    },

    addEvent: DIV.addEventListener ?
        function(elem, type, callback) {
            elem.addEventListener(type, callback, false);
        } :
        DIV.attachEvent ?
        function(elem, type, callback) {
            elem.attachEvent('on' + type, callback);
        } :
        function() {},

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