var _     = require('underscore'),
    REGEX = /[$\-/\?\{\}\~\!\^\[\]]/g;

var safe = function(str) {
    return (str || '').replace(REGEX, '-');
};

module.exports = {
    safe: safe,

    hash: function(data) {
        return safe(
            _.reduce(data, function(entries, value, key) {
                entries.push(key + ':' + value);
                return entries;
            }, []).join(',')
        );
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