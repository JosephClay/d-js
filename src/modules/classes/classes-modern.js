var _ = require('_');

module.exports = {
    getClasses: function(elem) {
        return _.toArray(elem.classList);
    },

    hasClass: function(elem, name) {
        return elem.classList.contains(name);
    },

    addClasses: function(elem, names) {
        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.add.call(elem.classList, names[idx]);
        }
    },

    removeClasses: function(elem, names) {
        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.remove.call(elem.classList, names[idx]);
        }
    },

    toggleClasses: function(elem, names) {
        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.toggle.call(elem.classList, names[idx]);
        }
    }
};
