var _ = require('_'),

    _array = require('../array'),
    _nodeType = require('../../nodeType'),
    _cache = require('../../cache'),
    _regex = require('../../regex'),
    _querySelectorCache = _cache(),

    _ID_PREFIX = 'D-uniqueId-',
    _proxySelectors = require('./proxySelectors');
    _selectorBlackList = require('./selectorBlackList');

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

var _getDataAttrPositions = function(selector) {
    var positions = [];

};

var _formatSelectorString = function(selector) {
    _regex.
};

var Selector = function(str) {
    var selector = _.trim(str),
        isBlackList = (_selectorBlackList.indexOf(selector) > -1),
        isChildOrSiblingSelect = (selector[0] === '>' || selector[0] === '+'),
        method = (isBlackList || isChildOrSiblingSelect) ? 'querySelectorAll' : _determineMethod(selector);

    this.str = str;
    this.selector = _formatSelectorString(selector);
    this.isBlackList = isBlackList;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.method = method;
};

Selector.prototype = {

    tailorChildSelector: function(id, selector) {
        return '#' + id + ' ' + selector;
    },

    exec: function(context) {
        var ops = this._operations,
            idx = 0, length = ops.length;
        for (; idx < length; idx++) {
            ops(context);
        }
    },

    _find: function(context) {
        if (!context) { return []; }
        // Early return if the selector is bad
        if (this.isBlackList) { return []; }

        var nodeType;
        // Early return if context is not an element or document
        if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

        // Child select - needs special help so that "> div" doesn't break
        var id,
            newId,
            idApplied = false;
            selector = this.selector;
        if (this.isChildOrSiblingSelect) {
            id = context.id;
            if (!_.exists(id)) {
                newId = _uniqueId();
                context.id = newId;
                idApplied = true;
            }

            selector = this.tailorChildSelector(idApplied ? newId : id, selector);
            context = document;
        }

        var selection = context[this.method](selector);
        if (!selection.length) { return; }

        if (idApplied) { context.id = id; }

        return _array.slice(selection);
    }
};

module.exports = Selector;