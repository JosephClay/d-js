var _ = require('_'),
    supports = require('../supports'),
    array = require('./array');

// TODO: Use cache module

var _rspace = /\s+/g;

var _classArrayCache = {};
var _classMapCache = {};

var _isEmpty = function(str) { return str === null || str === undefined || str === ''; };
var _isNotEmpty = function(str) { return str !== null && str !== undefined && str !== ''; };

var _splitImpl = function(name) {
    if (_isEmpty(name)) { return []; }
    var split = name.split(_rspace),
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
};

var _split = function(name) {
    if (_.isArray(name)) { return name; }
    return _classArrayCache[name] || (_classArrayCache[name] = _splitImpl(name));
};

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
        var elemClassNames = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            idx = elemClassNames.length;
        while (idx--) {
            if (elemClassNames[idx] === name) { return true; }
        }
        return false;
    },

    addClasses: function(elem, names) {
        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
            nameIdx = elemClassNameArray.length,
            name,
            append = '';

        while (nameIdx--) {
            name = names[nameIdx];

            // Element already has this class name
            if (elemClassNameMap[name] !== undefined) { continue; }

            append += ' ' + name;
        }

        // Add all the class names in a single step
        elem.className += append;
    },

    removeClasses: function(elem, names) {
        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
            nameIdx = elemClassNameArray.length,
            name,
            newClasses = array.slice(elemClassNameArray);

        while (nameIdx--) {
            name = names[nameIdx];

            // Element has this class name
            if (elemClassNameMap[name] !== undefined) {
                newClasses.splice(nameIdx, 1);
                elem.className = newClasses.join(' ');
                return;
            }
        }
    },

    toggleClasses: function(elem, names) {
        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
            nameIdx = elemClassNameArray.length,
            name,
            addClasses = [],
            addClassSet = {},
            removeClasses = [],
            removeClassSet = {};

        while (nameIdx--) {
            name = names[nameIdx];

            // Element has this class name
            if (elemClassNameMap[name] !== undefined) {
                // Already added to the list
                if (addClassSet[name]) { continue; }
                addClasses.push(name);
                addClassSet[name] = true;
            } else {
                // Already added to the list
                if (removeClassSet[name]) { continue; }
                removeClasses.push(name);
                removeClassSet[name] = true;
            }
        }

        if (addClasses.length) {
            this.addClasses(elem, addClasses);
        }
        if (removeClasses.length) {
            this.removeClasses(elem, removeClasses);
        }
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

    hasAllClasses: function(elems, names) {
        var numElems = elems.length,
            numNames = names.length,
            elemIdx = numElems,
            nameIdx,
            elem,
            name;

        while (elemIdx--) {
            elem = elems[elemIdx];

            nameIdx = numNames;
            while (nameIdx--) {
                name = names[nameIdx];

                if (!_impl.hasClass(elem, name)) { return false; }
            }
        }

        return true;
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
        hasClass: Overload()
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                return _classes.hasAllClasses(this, names);
            })
            .expose(),

        addClass: Overload()
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.addClasses(this, names);

                return this;
            })
            .args(Array).use(function(names) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                _classes.addClasses(this, names);

                return this;
            })
            .args(O.any(null, undefined)).use(function() {
                return this;
            })
            .expose(),

        removeClass: Overload()
            .args().use(function() {
                if (!this.length) { return this; }

                _classes.removeAllClasses(this);

                return this;
            })
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.removeClasses(this, names);

                return this;
            })
            .args(Array).use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _classes.removeClasses(this, names);

                return this;
            })
            .args(O.any(null, undefined)).use(function() {
                return this;
            })
            .expose(),

        toggleClass: Overload()
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.toggleClasses(this, names);

                return this;
            })
            .args(String, Boolean).use(function(name, shouldAdd) {
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
            .args(Array).use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _classes.toggleClasses(this, names);

                return this;
            })
            .args(O.any(null, undefined)).use(function() {
                return this;
            })
            .length(2).use(function(names, shouldAdd) {
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
