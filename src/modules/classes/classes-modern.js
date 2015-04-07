module.exports = {
    hasClass: function(elem, name) {
        return !!elem.classList && elem.classList.contains(name);
    },

    addClasses: function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.add.call(elem.classList, names[idx]);
        }
    },

    removeClasses: function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.remove.call(elem.classList, names[idx]);
        }
    },

    toggleClasses: function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.toggle.call(elem.classList, names[idx]);
        }
    }
};
