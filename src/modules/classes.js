var _ = require('_'),

    overload = require('overload'),
    O = overload.O,

    _supports = require('../supports');

var _split   = _.string.split;
var _isEmpty = _.string.isEmpty;

var _impl = _supports.classList ? require('./classes/classes-modern') : require('./classes/classes-legacy');

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
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.addClasses(elems[elemIdx], names);
        }
    },

    removeClasses: function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
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
        if (!_.isArray(names)) { names = _.toArray(names); }
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
