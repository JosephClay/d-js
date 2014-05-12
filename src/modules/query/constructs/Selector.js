var _ = require('_'),

    _array = require('../array'),
    _nodeType = require('../../nodeType'),
    _cache = require('../../cache'),
    _regex = require('../../regex'),

    _ID_PREFIX = 'D-uniqueId-',
    _querySelectorCache = _cache(),
    _isMatch = require('./match'),
    _selectorBlackList = require('./list/selectorBlackList');

var _determineMethod = function(selector) {
        var method = _querySelectorCache.get(selector);
        if (method) { return method; }

        if (_regex.selector.isStrictId(selector)) {
            method = 'getElementById';
        } else if (_regex.selector.isClass(selector)) {
            method = 'getElementsByClassName';
        } else if (_regex.selector.isTag(selector)) {
            method = 'getElementsByTagName';
        } else {
            method = 'querySelectorAll';
        }

        _querySelectorCache.set(selector, method);
        return method;
    },
    _uniqueId = function() {
        return _ID_PREFIX + _.uniqueId();
    };

var Selector = function(str) {
    var selector = _.string.trim(str),
        isBlackList = (_selectorBlackList.indexOf(selector) > -1),
        isChildOrSiblingSelect = (selector[0] === '>' || selector[0] === '+'),
        method = (isBlackList || isChildOrSiblingSelect) ? 'querySelectorAll' : _determineMethod(selector);

    this.str = str;
    this.selector = selector;
    this.isBlackList = isBlackList;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.method = method;
};

Selector.prototype = {

    _tailorChildSelector: function(id, selector) {
        return '#' + id + ' ' + selector;
    },

    match: function(context) {
        // No neeed to check, a match will fail if it's
        // child or sibling
        if (this.isChildOrSiblingSelect) { return false; }

        return _isMatch(context, this.selector);
    },

    exec: function(context) {
        context = context || document;

        var selection = [];

        // Early return if the selector is bad
        if (this.isBlackList) { return selection; }

        var nodeType;
        // Early return if context is not an element or document
        if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

        // Child select - needs special help so that "> div" doesn't break
        var id,
            newId,
            idApplied = false,
            selector = this.selector;
        if (this.isChildOrSiblingSelect) {
            id = context.id;
            if (!_.exists(id)) {
                newId = _uniqueId();
                context.id = newId;
                idApplied = true;
            }

            selector = this._tailorChildSelector(idApplied ? newId : id, selector);
            context = document;
        }

        // TODO: Remove try-catch when this is working correctly
        try {
            selection = context[this.method](selector);
        } catch (e) {
            // Probably an invalid query
            console && console.error && console.error(e.message, selector);
        }
        if (!selection.length) { return selection; }

        if (idApplied) { context.id = id; }

        return _array.slice(selection);
    }
};

module.exports = Selector;
