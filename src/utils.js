var SUPPORTS      = require('SUPPORTS'),

    _flagParsedNode,
    _isParsedNode,

    _returnTrue    = function() { return true;  },
    _returnFalse   = function() { return false; },
    _returnThis    = function() { return this;  };

// IE9+, modern browsers
if (SUPPORTS.detachedCreateElement) {
    _flagParsedNode = function() {};
    _isParsedNode   = _returnFalse;
}
// IE8
else {
    _flagParsedNode = function(elem) {
        if (!elem || !elem.parentNode) { return; }

        // IE8 creates a unique Document Fragment for every detached DOM node.
        // Mark it as bogus so we know to ignore it elsewhere when checking parentNode.
        elem.parentNode.isParsedNode = true;
    };
    _isParsedNode   = function(elem) {
        return !!(elem && elem.parentNode && elem.parentNode.isParsedNode);
    };
}

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

    normalizeNewlines: function(str) {
        return str && SUPPORTS.valueNormalized ? str.replace(/\r\n/g, '\n') : str;
    },

    returnTrue:  _returnTrue,
    returnFalse: _returnFalse,
    returnThis:  _returnThis,
    identity:    _returnThis,

    flagParsedNode: _flagParsedNode,
    isParsedNode:   _isParsedNode
};
