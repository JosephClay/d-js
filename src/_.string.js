var _ = require('_'),

    _cache = require('./cache'),
    _splitCache = _cache.biLevel(),

    _stringProto = String.prototype,
    _rtrim = /^\s+|\s+$/g,
    _rspace = /\s+/g,
    _emptyArray = [],

    _isEmpty = function(str) { return str === null || str === undefined || str === ''; },
    _isNotEmpty = function(str) { return str !== null && str !== undefined && str !== ''; },

    _splitImpl = function(name, delim) {
        var split = name.split(delim),
            len = split.length,
            idx = split.length,
            names = [],
            nameSet = {},
            curName;

        while (idx--) {
            curName = split[len - (idx + 1)];
            if (nameSet[curName]) { continue; }  // unique
            if (_isEmpty(curName)) { continue; } // non-empty
            names.push(curName);
            nameSet[curName] = true;
        }

        return names;
    },

    _split = function(name, delim) {
        if (_isEmpty(name)) { return _emptyArray; }
        if (_.isArray(name)) { return name; }
        delim = delim === undefined ? _rspace : delim;
        return _splitCache.getOrSet(delim, name, function() { return _splitImpl(name, delim); });
    };

_.string = {
    isEmpty: _isEmpty,
    isNotEmpty: _isNotEmpty,

    split: _split,

    trim: _stringProto.trim ?
        function(str) { return _.string.isEmpty(str) ? str : (str + '').trim(); } :
        function(str) { return _.string.isEmpty(str) ? str : (str + '').replace(_rtrim, ''); }
};

module.exports = _.string;
