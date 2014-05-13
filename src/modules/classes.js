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

    addClasses: function(elem, names) {
        var elemClassNameArray = _split(elem.className),
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
        var elemClassNameArray = _split(elem.className),
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
        var elemClassNameArray = _split(elem.className),
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
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }
                return _classes.doAnyElemsHaveClass(this, name);
            })
            .expose(),

        addClass: overload()
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

        removeClass: overload()
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

        toggleClass: overload()
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
