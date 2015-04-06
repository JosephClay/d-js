var cache = require('cache')(2),
    isArray = require('is/array'),

    R_SPACE      = /\s+/g,

    isEmpty = function(str) {
        return str === null || str === undefined || str === '';
    },

    _splitImpl = function(name, delim) {
        var split   = name.split(delim),
            len     = split.length,
            idx     = split.length,
            names   = [],
            nameSet = {},
            curName;

        while (idx--) {
            curName = split[len - (idx + 1)];
            
            if (
                nameSet[curName] || // unique
                isEmpty(curName)    // non-empty
            ) { continue; }

            names.push(curName);
            nameSet[curName] = true;
        }

        return names;
    };

module.exports = {
    isEmpty: isEmpty,
    split: function(name, delim) {
        if (isEmpty(name)) { return []; }
        if (isArray(name)) { return name; }
        delim = delim === undefined ? R_SPACE : delim;
        return cache.getOrSet(delim, name, function() { return _splitImpl(name, delim); });
    }
};