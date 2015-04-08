var cache   = require('cache')(2),
    isEmpty = require('string/isEmpty'),
    isArray = require('is/array'),

    R_SPACE = /\s+/g,

    split = function(name, delim) {
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

module.exports = function(name, delimiter) {
    if (isEmpty(name)) { return []; }
    if (isArray(name)) { return name; }

    var delim = delimiter === undefined ? R_SPACE : delimiter;
    return cache.has(delim, name) ? 
        cache.get(delim, name) : 
        cache.put(delim, name, () => split(name, delim));
};
