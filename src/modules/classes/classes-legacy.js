var _      = require('underscore'),
    _cache = require('cache'),
    split = require('string').split,

    _hasCache    = _cache(2),
    _addCache    = _cache(2),
    _removeCache = _cache(2),
    _toggleCache = _cache(2);

var _hasClass = function(elem, name) {
        var elemClassNames = split(elem.className),
            idx = elemClassNames.length;
        while (idx--) {
            if (elemClassNames[idx] === name) { return true; }
        }
        return false;
    },

    _addClasses = function(elem, namesToAdd) {
        var curNames   = split(elem.className),
            newNames   = [],
            newNameSet = _.object(curNames),
            len = namesToAdd.length,
            idx = 0,
            newName,
            hasName;

        // Loop through the names being added and only add new ones.
        for (; idx < len; idx++) {
            newName = namesToAdd[idx];
            hasName = newNameSet[newName] !== undefined;

            // Element already has this class name
            if (hasName) { continue; }

            newNames.push(newName);
            newNameSet[newName] = newName;
        }

        return curNames.concat(newNames);
    },

    _removeClasses = function(elem, namesToRemove) {
        var curNames         = split(elem.className),
            resultNames      = [],
            resultNameSet    = {},
            namesToRemoveSet = _.object(namesToRemove),
            len = curNames.length,
            idx = 0,
            curName,
            hasName,
            shouldRemove;

        // Loop through the element's existing class names
        // and only keep ones that aren't being removed.
        for (; idx < len; idx++) {
            curName = curNames[idx];
            hasName = resultNameSet[curName] !== undefined;
            shouldRemove = namesToRemoveSet[curName] !== undefined;

            // Current class name is being removed
            if (shouldRemove) { continue; }

            // Element already has this class name
            if (hasName) { continue; }

            resultNames.push(curName);
            resultNameSet[curName] = curName;
        }

        return resultNames;
    },

    _toggleClasses = function(elem, namesToToggle) {
        var curNames   = split(elem.className),
            newNames   = curNames.slice(),
            newNameSet = _.object(curNames),
            len = namesToToggle.length,
            idx = 0,
            nameToToggle,
            hasName;

        // Loop through the element's existing class names
        // and only keep ones that aren't being removed.
        for (; idx < len; idx++) {
            nameToToggle = namesToToggle[idx];
            hasName = newNameSet[nameToToggle] !== undefined;

            // Element already has this class name - remove it
            if (hasName) {
                var newNameIdx = newNames.length;
                while (newNameIdx--) {
                    if (newNames[newNameIdx] === nameToToggle) {
                        newNames[newNameIdx] = null;
                    }
                }
                delete newNameSet[nameToToggle];
            }
            // Element does not have this class name - add it
            else {
                newNames.push(nameToToggle);
                newNameSet[nameToToggle] = nameToToggle;
            }
        }

        var newNamesClean = [];
        idx = newNames.length;
        while (idx--) {
            if (newNames[idx] !== null) {
                newNamesClean.push(newNames[idx]);
            }
        }

        return newNamesClean;
    };

var _setClassName = function(elem, names) {
    // Add all the class names in a single step
    if (names.length) {
        elem.className = names.join(' ');
    } else {
        elem.removeAttribute('class');
    }
};

module.exports = {
    hasClass: function(elem, name) {
        return _hasCache.has(elem.className, name) ? 
            _hasCache.get(elem.className, name) : 
            _hasCache.put(elem.className, name, () => _hasClass(elem, name));
    },

    addClasses: function(elem, names) {
        var nameKey = names.join(' ');
        _setClassName(elem, 
            _addCache.has(elem.className, nameKey) ?
            _addCache.get(elem.className, nameKey) :
            _addCache.put(elem.className, nameKey, () => _addClasses(elem, names))
        );
    },

    removeClasses: function(elem, names) {
        var nameKey = names.join(' ');
        _setClassName(elem, 
            _removeCache.has(elem.className, nameKey) ? 
            _removeCache.get(elem.className, nameKey) :
            _removeCache.put(elem.className, nameKey, () => _removeClasses(elem, names))
        );
    },

    toggleClasses: function(elem, names) {
        var nameKey = names.join(' ');
        _setClassName(elem, 
            _toggleCache.has(elem.className, nameKey) ?
            _toggleCache.get(elem.className, nameKey) :
            _toggleCache.put(elem.className, nameKey, () => _toggleClasses(elem, names))
        );
    }    
};
