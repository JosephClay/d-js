module.exports = {
    id: 'd' + (new Date().getTime()),

    activeElement: function() {
        try {
            return document.activeElement;
        } catch (err) {}
    },

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