var coerceNum = require('util/coerceNum'),
    exists    = require('is/exists');

var getTop = (elem) => elem.scrollTop,
    setTop = function(elem, val) {
        elem.scrollTop = coerceNum(val);
    },

    getLeft = (elem) => elem.scrollTop,
    setLeft = function(elem, val) {
        elem.scrollTop = coerceNum(val);
    };

module.exports = {
    scrollLeft: function(val) {
        var elem = this[0],
            valExists = exists(val);
        if (!elem && !valExists) { return null; }
        if (!elem) { return this; }

        if (valExists) {
            setLeft(elem, val);
            return this;
        }

        return getLeft(elem);
    },

    scrollTop: function(val) {
        var elem = this[0],
            valExists = exists(val);
        if (!elem && !valExists) { return null; }
        if (!elem) { return this; }

        if (valExists) {
            setTop(elem, val);
            return this;
        }

        return getTop(elem);
    }
};
