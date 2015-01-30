var _         = require('underscore'),
    R_SPECIAL = /[$\-/\?\{\}\~\!\^\[\]\:\,]/g,
    R_SPACE   = /[\s]/g;

var safe = function(str) {
    return (str || '').replace(R_SPECIAL, '_').replace(R_SPACE, '');
};

module.exports = {
    safe: safe,

    hash: function(data) {
        return _.reduce(data, function(entries, value, key) {
                entries.push(safe(key) + ':' + safe(value));
                return entries;
        }, []).join(',');
    },
    
    unhash: function() {
        var hash = window.location.hash;
        hash = hash.substr(1, hash.length);
        
        var pairs = hash.split(',');
        return _.reduce(pairs, function(data, pair) {
            pair = pair.split(':');
            data[pair[0]] = pair[1];
            return data;
        }, {});
    }
};