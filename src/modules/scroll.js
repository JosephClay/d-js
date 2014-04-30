var _ = require('../_');

var _getTop = function(elem, val) {
        return elem.scrollTop;
    },
    _setTop = function(elem, val) {
        elem.scrollTop = _.coerceToNum(val);
    },

    _getLeft = function(elem, val) {
        return elem.scrollTop;
    },
    _setLeft = function(elem, val) {
        elem.scrollTop = _.coerceToNum(val);
    };

// TODO: Overload
// TODO: Write unit tests for these
module.exports = {
    scrollLeft: function() {
        var elem = this[0],
            valExists = _.exists(val);
        if (!elem && !valExists) { return null; }
        if (!elem) { return this; }

        if (valExists) {
            _setLeft(elem, val);
            return this;
        }

        return _getLeft(elem);
    },

    scrollTop: function(val) {
        var elem = this[0],
            valExists = _.exists(val);
        if (!elem && !valExists) { return null; }
        if (!elem) { return this; }

        if (valExists) {
            _setTop(elem, val);
            return this;
        }

        return _getTop(elem);
    }
};
