var NODE_TYPE = require('node-type'),
    _SUPPORTS  = require('../supports'),

    _          = require('underscore'),
    overload   = require('overload-js'),
    o          = overload.o,

    string     = require('../string'),
    _split     = string.split,
    _isEmpty   = string.isEmpty;

var _impl = _SUPPORTS.classList ? require('./classes/classes-modern')
                                : require('./classes/classes-legacy');

var _doAnyElemsHaveClass = function(elems, name) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            if (_impl.hasClass(elems[elemIdx], name)) { return true; }
        }
        return false;
    },

    _addClasses = function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.addClasses(elems[elemIdx], names);
        }
    },

    _removeClasses = function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.removeClasses(elems[elemIdx], names);
        }
    },

    _removeAllClasses = function(elems) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            elems[elemIdx].className = '';
        }
    },

    _toggleClasses = function(elems, names) {
        // Support array-like objects
        if (!_.isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.toggleClasses(elems[elemIdx], names);
        }
    };

module.exports = {
    fn: {
        hasClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }
                return _doAnyElemsHaveClass(this, name);
            })
            .expose(),

        addClass: overload()
            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _addClasses(this, names);

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                _addClasses(this, names);

                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .expose(),

        removeClass: overload()
            .args()
            .use(function() {
                if (!this.length) { return this; }

                _removeAllClasses(this);

                return this;
            })

            .args(String)
            .use(function(name) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _removeClasses(this, names);

                return this;
            })

            .args(Array)
            .use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _removeClasses(this, names);

                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .expose(),

        toggleClass: overload()
            .args(o.any(String, Array))
            .use(function(names) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                names = _split(names);
                if (!names.length) { return this; }

                _toggleClasses(this, names);

                return this;
            })

            .args(o.any(String, Array), o.wild)
            .use(function(names, shouldAdd) {
                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                names = _split(names);
                if (!names.length) { return this; }

                if (shouldAdd) {
                    _addClasses(this, names);
                } else {
                    _removeClasses(this, names);
                }

                return this;
            })

            .args(o.any(null, undefined))
            .use(function() {
                return this;
            })

            .expose()
    }
};
