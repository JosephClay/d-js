var _ = require('_'),

    _SUPPORTS      = require('./supports'),
    _NODE_TYPE     = require('./nodeType'),

    _cache         = require('./cache'),

    _nodeNameCache = _cache(),

    _returnThis    = function() { return this; };

module.exports = {
    isAttached: function(elem) {
        return !!(elem && elem.ownerDocument && elem !== document && elem.parentNode && elem.parentNode.nodeType !== _NODE_TYPE.DOCUMENT_FRAGMENT);
    },

    isHtml: function(text) {
        if (!_.isString(text)) { return false; }

        text = _.string.trim(text);

        return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
    },

    normalNodeName: function(elem) {
        var nodeName = elem.nodeName;
        return _nodeNameCache.getOrSet(nodeName, function() {
            return nodeName.toLowerCase();
        });
    },

    isNodeName: function(elem, name) {
        var nodeName = _nodeNameCache.getOrSet(elem.nodeName, function() {
                return elem.nodeName.toLowerCase();
            }),
            compareName = _nodeNameCache.getOrSet(name, function() {
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
        return str && _SUPPORTS.valueNormalized ? str.replace(/\r\n/g, '\n') : str;
    },

    returnTrue: function() {
        return true;
    },

    returnFalse: function() {
        return false;
    },

    returnThis: _returnThis,
    identity: _returnThis
};
