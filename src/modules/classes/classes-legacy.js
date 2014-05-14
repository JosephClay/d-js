var _ = require('_'),
    _split = _.string.split;

module.exports = {
    getClasses: function(elem) {
        return _split(elem.className);
    },

    hasClass: function(elem, name) {
        var elemClassNames = _split(elem.className),
            idx = elemClassNames.length;
        while (idx--) {
            if (elemClassNames[idx] === name) { return true; }
        }
        return false;
    },

    _mutateClasses: function(elem, diffNames, callback) {
        var curNames    = _split(elem.className),
            resultNames = callback(curNames);

        // Add all the class names in a single step
        if (resultNames.length) {
            elem.className = resultNames.join(' ');
        } else {
            elem.removeAttribute('class');
        }
    },

    addClasses: function(elem, namesToAdd) {
        this._mutateClasses(elem, namesToAdd, function(curNames) {
            var newNames   = [],
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
        });
    },

    removeClasses: function(elem, namesToRemove) {
        this._mutateClasses(elem, namesToRemove, function(curNames) {
            var resultNames      = [],
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
        });
    },

    toggleClasses: function(elem, namesToToggle) {
        this._mutateClasses(elem, namesToToggle, function(curNames) {
            var newNames   = curNames.slice(),
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
        });
    }
};


