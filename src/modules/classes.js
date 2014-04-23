define([ '_', 'overload', 'modules/array' ], function(_, overload, array) {

    var _rspace = /\s+/g;

    var _classArrayCache = {};
    var _classMapCache = {};

    var _isNotEmpty = function(str) { return str !== null && str !== undefined && str !== ''; };

    // TODO: Create an internal cache
    var _split = function(name) {
        if (_.isArray(name)) { return name; }
        return _classArrayCache[name] || (_classArrayCache[name] = _.chain(name.split(_rspace)).filter(_isNotEmpty).uniq().value());
    };

    var _modern = {
        hasClass: function(elem, name) {
            return elem.classList.contains(name);
        },

        addClass: function(elem, names) {
            elem.classList.add.apply(null, names);
        },

        removeClass: function(elem, names) {
            elem.classList.remove.apply(null, names);
        }
    };

    var _legacy = {
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

    // TODO: Make a global dummy div
    var _impl = document.createElement('div').classList ? _modern : _legacy;

    var _classes = {
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
            var elemIdx = elems.length;
            while (elemIdx--) {
                _impl.addClass(elems[elemIdx], names);
            }
        },

        removeClass: function(elems, names) {
            var elemIdx = elems.length;
            while (elemIdx--) {
                _impl.removeClass(elems[elemIdx], names);
            }
        },

        toggleClass: function() {}
    };

    return _.extend({}, _classes, {
        fn: {
            addClass: overload()
                .args(String).use(function(name) {
                    // TODO: Generalize this check?
                    if (!this.length) { return this; }

                    var names = _split(name);
                    if (!names.length) { return this; }

                    _classes.addClass(this._elems, names);

                    return this;
                })
                .args(Array).use(function(names) {
                    // TODO: Generalize this check?
                    if (!this.length) { return this; }
                    if (!names.length) { return this; }

                    _classes.addClass(this._elems, names);

                    return this;
                })
                .expose()
        }
    });
});
