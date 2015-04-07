var _returnTrue    = function() { return true;  },
    _returnFalse   = function() { return false; },
    _returnThis    = function() { return this;  };

module.exports = {

    normalNodeName: function(elem) {
        // cache is just not worth it here
        // http://jsperf.com/simple-cache-for-string-manip
        return elem.nodeName.toLowerCase();
    },

    isNodeName: function(elem, name) {
        return elem.nodeName.toLowerCase() === name.toLowerCase();
    },

    merge: function(first, second) {
        var length = second.length,
            idx = 0,
            i = first.length;

        // Go through each element in the
        // second array and add it to the
        // first
        for (; idx < length; idx++) {
            first[i++] = second[idx];
        }

        first.length = i;

        return first;
    },

    returnTrue:  _returnTrue,
    returnFalse: _returnFalse,
    returnThis:  _returnThis,
    identity:    _returnThis
};
