var _ = require('_'),
    _cache = require('./cache'),
    _nodeNameCache = _cache();

module.exports = {
    isAttached: function(elem) {
        return !!(elem && elem !== document ? elem.parentNode : false);
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
    }
};
