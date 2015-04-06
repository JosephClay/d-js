var _             = require('underscore'),
    isString      = require('is/string'),
    string        = require('./string'),
    SUPPORTS      = require('./supports'),
    NODE_TYPE     = require('NODE_TYPE'),
    cache         = require('cache')(),

    _flagParsedNode,
    _isParsedNode,

    _returnTrue    = function() { return true;  },
    _returnFalse   = function() { return false; },
    _returnThis    = function() { return this;  };

// IE9+, modern browsers
if (SUPPORTS.detachedCreateElement) {
    _flagParsedNode = _.noop;
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
        var nodeName = elem.nodeName;
        return cache.getOrSet(nodeName, function() {
            return nodeName.toLowerCase();
        });
    },

    isNodeName: function(elem, name) {
        var nodeName = cache.getOrSet(elem.nodeName, function() {
                return elem.nodeName.toLowerCase();
            }),
            compareName = cache.getOrSet(name, function() {
                return name.toLowerCase();
            });

        return nodeName === compareName;
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
