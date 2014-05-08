var _ = require('_'),
    _stringProto = String.prototype,
    _rtrim = /^\s+|\s+$/g,
    _rspace = /\s+/g,
    _emptyArray = [];

var _string = {
    _splitArrayCache: {
        /*
         ' ': {
         'some string': [ 'some', 'string' ]
         }
         */
    },

    isEmpty: function(str) { return str === null || str === undefined || str === ''; },
    isNotEmpty: function(str) { return str !== null && str !== undefined && str !== ''; },

    _splitImpl: function(name, delim) {
        var split = name.split(delim),
            len = split.length,
            idx = split.length,
            names = [],
            nameSet = {},
            curName;

        while (idx--) {
            curName = split[len - (idx + 1)];
            if (nameSet[curName]) { continue; }  // unique
            if (this.isEmpty(curName)) { continue; } // non-empty
            names.push(curName);
            nameSet[curName] = true;
        }

        return names;
    },

    split: function(name, delim) {
        if (_string.isEmpty(name)) { return _emptyArray; }
        if (_.isArray(name)) { return name; }
        delim = delim === undefined ? _rspace : delim;
        var cache = _string._splitArrayCache[delim] || (_string._splitArrayCache[delim] = []);
        return cache[name] || (cache[name] = _string._splitImpl(name, delim));
    }
};

_.string = {
    isEmpty: _string.isEmpty,
    isNotEmpty: _string.isNotEmpty,

    split: _string.split,

    trim: _stringProto.trim ?
        function(str) { return _.string.isEmpty(str) ? str : (str + '').trim(); } :
        function(str) { return _.string.isEmpty(str) ? str : (str + '').replace(_rtrim, ''); }
};

module.exports = _.string;
