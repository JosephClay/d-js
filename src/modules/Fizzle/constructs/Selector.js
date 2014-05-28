var _ = require('_'),

    _nodeType = require('../../../nodeType'),
    _cache = require('../../../cache'),
    _regex = require('../../../regex'),
    _supports = require('../../../supports'),

    _ID_PREFIX = 'D-uniqueId-',
    _querySelectorCache = _cache(),

    _isMatch = require('../selector/selector-match'),

    _GET_ELEMENT_BY_ID          = 'getElementById',
    _GET_ELEMENTS_BY_TAG_NAME   = 'getElementsByTagName',
    _GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    _QUERY_SELECTOR_ALL         = 'querySelectorAll';

var _determineMethod = function(selector) {
        var method = _querySelectorCache.get(selector);
        if (method) { return method; }

        if (_regex.selector.isStrictId(selector)) {
            method = _GET_ELEMENT_BY_ID;
        } else if (_regex.selector.isClass(selector)) {
            method = _GET_ELEMENTS_BY_CLASS_NAME;
        } else if (_regex.selector.isTag(selector)) {
            method = _GET_ELEMENTS_BY_TAG_NAME;
        } else {
            method = _QUERY_SELECTOR_ALL;
        }

        _querySelectorCache.set(selector, method);
        return method;
    },
    _uniqueId = function() {
        return _ID_PREFIX + _.uniqueId();
    };

var Selector = function(str) {
    var selector = _.string.trim(str),
        isChildOrSiblingSelect = (selector[0] === '>' || selector[0] === '+'),
        method = isChildOrSiblingSelect ? _QUERY_SELECTOR_ALL : _determineMethod(selector);

    this.str = str;
    this.selector = selector;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.isIdSearch = method === _GET_ELEMENT_BY_ID;
    this.isClassSearch = !this.isIdSearch && method === _GET_ELEMENTS_BY_CLASS_NAME;
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

        var selection,
            method = this.method,
            nodeType;
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
        } else if (this.isClassSearch) {
            if (_supports.getElementsByClassName) {
                // Class search, don't start with '.'
                selector = selector.substr(1);
            } else {
                method = _QUERY_SELECTOR_ALL;
            }
        } else if (this.isIdSearch) {
            if (context === document) {
                // Id search, don't start with '#'
                selector = selector.substr(1);
            } else {
                // context is not the document,
                // change to querySelectorAll and
                // leave the '#'
                method = _QUERY_SELECTOR_ALL;
            }
        }

        selection = context[method](selector);

        if (idApplied) { context.id = id; }

        // No selection
        if (!selection) {
            return [];
        }
        // Nodelist without a length
        if (_.isNodeList(selection) && !selection.length) {
            return [];
        }
        // IE8 DispStaticNodeList
        if (selection.item && selection.length === 0) {
            return [];
        }

        // If it's an id, return it as an array, otherwise, toArray
        // to keep from returning out NodeLists and HTMLCollections
        return _.isElement(selection) || !selection.length ? [selection] : _.toArray(selection);
    }
};

module.exports = Selector;
