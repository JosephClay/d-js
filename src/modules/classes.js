var _         = require('underscore'),
    NODE_TYPE = require('NODE_TYPE'),
    _SUPPORTS  = require('../supports'),
    isArray = require('is/array'),
    isString = require('is/string'),

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
        if (!isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.addClasses(elems[elemIdx], names);
        }
    },

    _removeClasses = function(elems, names) {
        // Support array-like objects
        if (!isArray(names)) { names = _.toArray(names); }
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
        if (!isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== NODE_TYPE.ELEMENT) { continue; }
            _impl.toggleClasses(elems[elemIdx], names);
        }
    };

module.exports = {
    fn: {
        hasClass: function(name) {
            if (name === undefined || !this.length || _isEmpty(name) || !name.length) { return this; }
            return _doAnyElemsHaveClass(this, name);
        },

        addClass: function(names) {
            if (isArray(names)) {
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                _addClasses(this, names);

                return this;
            }

            if (isString(names)) {
                var name = names;
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _addClasses(this, names);

                return this;
            }

            // fallback
            return this;
        },

        removeClass: function(names) {
            if (!arguments.length) {
                if (this.length) {
                    _removeAllClasses(this);
                }

                return this;
            }

            if (isArray(names)) {

                if (!this.length || _isEmpty(names) || !names.length) { return this; }

                _removeClasses(this, names);

                return this;
            }

            if (isString(names)) {
                var name = names;
                if (!this.length || _isEmpty(name) || !name.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _removeClasses(this, names);

                return this;
            }
        
            // fallback
            return this;
        },

        toggleClass: function(names, shouldAdd) {
            if (!arguments.length) { return this; }

            if (!this.length || _isEmpty(names) || !names.length) { return this; }

            names = _split(names);
            if (!names.length) { return this; }

            if (shouldAdd === undefined) {
                _toggleClasses(this, names);
            } else if (shouldAdd) {
                _addClasses(this, names);
            } else {
                _removeClasses(this, names);
            }

            return this;
        }
    }
};
