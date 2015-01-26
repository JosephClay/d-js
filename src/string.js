var _     = require('underscore'),
    cache = require('cache').biLevel(),
    
    R_TRIM       = /^\s+|\s+$/g,
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
    },

    _split = function(name, delim) {
        if (isEmpty(name)) { return []; }
        if (_.isArray(name)) { return name; }
        delim = delim === undefined ? R_SPACE : delim;
        return cache.getOrSet(delim, name, function() { return _splitImpl(name, delim); });
    };

var string = module.exports = {
    isEmpty: isEmpty,

    split: _split,

    trim: String.prototype.trim ?
        function(str) { return string.isEmpty(str) ? str : (str + '').trim(); } :
        function(str) { return string.isEmpty(str) ? str : (str + '').replace(R_TRIM, ''); }
};