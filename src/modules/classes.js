var _         = require('underscore'),
    ELEMENT   = require('NODE_TYPE/ELEMENT'),
    isArray   = require('is/array'),
    isString  = require('is/string'),
    split     = require('string').split,
    isEmpty   = require('string').isEmpty;

var hasClass = function(elem, name) {
        return !!elem.classList && elem.classList.contains(name);
    },

    addClasses = function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.add(names[idx]);
        }
    },

    removeClasses = function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.remove(names[idx]);
        }
    },

    toggleClasses = function(elem, names) {
        if (!elem.classList) { return; }

        var len = names.length,
            idx = 0;
        for (; idx < len; idx++) {
            elem.classList.toggle(names[idx]);
        }
    };

var _doAnyElemsHaveClass = function(elems, name) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== ELEMENT) { continue; }
            if (hasClass(elems[elemIdx], name)) { return true; }
        }
        return false;
    },

    _addClasses = function(elems, names) {
        // Support array-like objects
        if (!isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== ELEMENT) { continue; }
            addClasses(elems[elemIdx], names);
        }
    },

    _removeClasses = function(elems, names) {
        // Support array-like objects
        if (!isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== ELEMENT) { continue; }
            removeClasses(elems[elemIdx], names);
        }
    },

    _removeAllClasses = function(elems) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== ELEMENT) { continue; }
            elems[elemIdx].className = '';
        }
    },

    _toggleClasses = function(elems, names) {
        // Support array-like objects
        if (!isArray(names)) { names = _.toArray(names); }
        var elemIdx = elems.length;
        while (elemIdx--) {
            if (elems[elemIdx].nodeType !== ELEMENT) { continue; }
            toggleClasses(elems[elemIdx], names);
        }
    };

module.exports = {
    fn: {
        hasClass: function(name) {
            if (name === undefined || !this.length || isEmpty(name) || !name.length) { return this; }
            return _doAnyElemsHaveClass(this, name);
        },

        addClass: function(names) {
            if (isArray(names)) {
                if (!this.length || isEmpty(name) || !name.length) { return this; }

                _addClasses(this, names);

                return this;
            }

            if (isString(names)) {
                var name = names;
                if (!this.length || isEmpty(name) || !name.length) { return this; }

                var names = split(name);
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

                if (!this.length || isEmpty(names) || !names.length) { return this; }

                _removeClasses(this, names);

                return this;
            }

            if (isString(names)) {
                var name = names;
                if (!this.length || isEmpty(name) || !name.length) { return this; }

                var names = split(name);
                if (!names.length) { return this; }

                _removeClasses(this, names);

                return this;
            }
        
            // fallback
            return this;
        },

        toggleClass: function(names, shouldAdd) {
            if (!arguments.length) { return this; }

            if (!this.length || isEmpty(names) || !names.length) { return this; }

            names = split(names);
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
