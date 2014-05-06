var supports = require('../supports'),
    array = require('./array'),
    _ = require('../_');

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

    addClass: function(elem, names) {
        elem.classList.add.apply(elem.classList, names);
    },

    removeClass: function(elem, names) {
        elem.classList.remove.apply(elem.classList, names);
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

    addClass: function(elem, names) {
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

    removeClass: function(elem, names) {
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

    hasClass: function(elems, names) {
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

                if (_impl.hasClass(elem, name)) { return true; }
            }
        }

        return false;
    },

    addClass: function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = array.slice(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.addClass(elems[elemIdx], names);
        }
    },

    removeClass: function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = array.slice(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.removeClass(elems[elemIdx], names);
        }
    },

    removeAllClasses: function(elems) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            elems[elemIdx].className = '';
        }
    },

    toggleClass: function() {}
};

module.exports = _.extend({}, _classes, {
    fn: {
        addClass: Overload()
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.addClass(this, names);

                return this;
            })
//            .args(Array).use(function(names) {
            .length(1).use(function(names) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                _classes.addClass(this, names);

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

                _classes.removeClass(this, names);

                return this;
            })
//            .args(Array).use(function(names) {
            .length(1).use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _classes.removeClass(this, names);

                return this;
            })
            .expose(),
        hasClass: Overload()
            .args(String).use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.removeClass(this, names);

                return this;
            })
//            .args(Array).use(function(names) {
            .length(1).use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _classes.removeClass(this, names);

                return this;
            })
            .expose()
    }
});
