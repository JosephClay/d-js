var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    supports = require('../supports'),
    array = require('./array');

// TODO: Use cache module

var _classMapCache = {};

var _split   = _.string.split;
var _isEmpty = _.string.isEmpty;

var _modern = {
    getClasses: function(elem) {
        return array.slice(elem.classList);
    },

    hasClass: function(elem, name) {
        return elem.classList.contains(name);
    },

    addClasses: function(elem, names) {
        elem.classList.add.apply(elem.classList, names);
    },

    removeClasses: function(elem, names) {
        elem.classList.remove.apply(elem.classList, names);
    },

    toggleClasses: function(elem, names) {
        var idx = names.length;
        while (idx--) {
            elem.classList.toggle.call(elem.classList, names[idx]);
        }
    }
};

var _legacy = {
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
            curNameSet  = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(curNames)),
            resultNames = callback(curNames, curNameSet);

        // Add all the class names in a single step
        if (resultNames.length) {
            elem.className = resultNames.join(' ');
        } else {
            elem.removeAttribute('class');
        }
    },

    addClasses: function(elem, namesToAdd) {
        this._mutateClasses(elem, namesToAdd, function(curNames, curNameSet) {
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
        this._mutateClasses(elem, namesToToggle, function(curNames, curNameSet) {
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

var _impl = supports.classList ? _modern : _legacy;

var _classes = {
    getClasses: function(elems) {
        var names = [],
            nameSet = {},
            elemIdx = elems.length,
            curNames,
            curNameIdx,
            curName;
        while (elemIdx--) {
            curNames = _impl.getClasses(elems[elemIdx]);
            curNameIdx = curNames.length;
            while (curNameIdx--) {
                curName = curNames[curNameIdx];
                if (nameSet[curName]) { continue; }
                names.push(curName);
                nameSet[curName] = true;
            }
        }
    },

    doAnyElemsHaveClass: function(elems, name) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (_impl.hasClass(elems[elemIdx], name)) { return true; }
        }
        return false;
    },

    addClasses: function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = array.slice(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.addClasses(elems[elemIdx], names);
        }
    },

    removeClasses: function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = array.slice(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.removeClasses(elems[elemIdx], names);
        }
    },

    removeAllClasses: function(elems) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            elems[elemIdx].className = '';
        }
    },

    toggleClasses: function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = array.slice(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.toggleClasses(elems[elemIdx], names);
        }
    }
};

module.exports = _.extend({}, _classes, {
    fn: {
        hasClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }
                return _classes.doAnyElemsHaveClass(this, name);
            })
            .expose(),

        addClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.addClasses(this, names);

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                _classes.addClasses(this, names);

                return this;
            })

            .args(O.any(null, undefined))
            .use(function() {
                return this;
            })
            .expose(),

        removeClass: overload()
            .args()
            .use(function() {
                if (!this.length) { return this; }

                _classes.removeAllClasses(this);

                return this;
            })

            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.removeClasses(this, names);

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _classes.removeClasses(this, names);

                return this;
            })

            .args(O.any(null, undefined))
            .use(function() {
                return this;
            })
            .expose(),

        toggleClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.toggleClasses(this, names);

                return this;
            })

            .args(String, Boolean)
            .use(function(name, shouldAdd) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                if (shouldAdd) {
                    _classes.addClasses(this, names);
                } else {
                    _classes.removeClasses(this, names);
                }

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _classes.toggleClasses(this, names);

                return this;
            })

            .args(O.any(null, undefined))
            .use(function() {
                return this;
            })

            .length(2)
            .use(function(names, shouldAdd) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                if (shouldAdd) {
                    _classes.addClasses(this, names);
                } else {
                    _classes.removeClasses(this, names);
                }

                return this;
            })
            .expose()
    }
});
