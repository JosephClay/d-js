var isElement = require('nodeType').elem,
    isArray   = require('is/array'),
    isString  = require('is/string'),
    exists    = require('is/exists'),

    split = function(str) {
        return str === '' ? [] : str.trim().split(/\s+/g);
    };

var addClass = function(classList, name) {
        classList.add(name);
    },

    removeClass = function(classList, name) {
        classList.remove(name);
    },

    toggleClass = function(classList, name) {
        classList.toggle(name);
    },

    doubleClassLoop = function(elems, names, method) {
        var idx = elems.length,
            elem;
        while (idx--) {
            elem = elems[idx];
            if (!isElement(elem)) { continue; }
            var len = names.length,
                i = 0,
                classList = elem.classList;
            for (; i < len; i++) {
                method(classList, names[i]);
            }
        }
        return elems;
    },

    doAnyElemsHaveClass = function(elems, name) {
        var idx = elems.length;
        while (idx--) {
            if (!isElement(elems[idx])) { continue; }
            if (elems[idx].classList.contains(name)) { return true; }
        }
        return false;
    },

    removeAllClasses = function(elems) {
        var idx = elems.length;
        while (idx--) {
            if (!isElement(elems[idx])) { continue; }
            elems[idx].className = '';
        }
        return elems;
    };

exports.fn = {
    hasClass: function(name) {
        return this.length && exists(name) && name !== '' ? doAnyElemsHaveClass(this, name) : false;
    },

    addClass: function(names) {
        if (!this.length) { return this; }

        if (isString(names)) { names = split(names); }

        if (isArray(names)) {
            return names.length ? doubleClassLoop(this, names, addClass) : this;
        }

        // fallback
        return this;
    },

    removeClass: function(names) {
        if (!this.length) { return this; }
        
        if (!arguments.length) {
            return removeAllClasses(this);
        }

        if (isString(names)) { names = split(names); }

        if (isArray(names)) {
            return names.length ? doubleClassLoop(this, names, removeClass) : this;
        }
    
        // fallback
        return this;
    },

    toggleClass: function(names, shouldAdd) {
        var nameList;
        if (!arguments.length || !this.length || !(nameList = split(names)).length) { return this; }

        return shouldAdd === undefined ? doubleClassLoop(this, nameList, toggleClass) :
            shouldAdd ? doubleClassLoop(this, nameList, addClass) :
            doubleClassLoop(this, nameList, removeClass);
    }
};
