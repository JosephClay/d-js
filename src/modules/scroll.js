var _ = require('underscore'),
    exists = require('is/exists');

var getTop = (elem) => elem.scrollTop,
    setTop = function(elem, val) {
        elem.scrollTop = _.coerceToNum(val);
    },

    getLeft = (elem) => elem.scrollTop,
    setLeft = function(elem, val) {
        elem.scrollTop = _.coerceToNum(val);
    };

// TODO: Write unit tests for these
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
