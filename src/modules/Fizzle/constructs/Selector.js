var exists     = require('is/exists'),
    isNodeList = require('is/nodeList'),
    isElement  = require('is/element'),

    GET_ELEMENT_BY_ID          = 'getElementById',
    GET_ELEMENTS_BY_TAG_NAME   = 'getElementsByTagName',
    GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    QUERY_SELECTOR_ALL         = 'querySelectorAll',

    SUPPORTS      = require('SUPPORTS'),
    _regex        = require('../../../regex'),
    selectorCache = require('cache')(),
    matches       = require('matchesSelector');

var _determineMethod = function(selector) {
        var method = selectorCache.get(selector);
        if (method) { return method; }

        if (_regex.selector.isStrictId(selector)) {
            method = GET_ELEMENT_BY_ID;
        } else if (_regex.selector.isClass(selector)) {
            method = GET_ELEMENTS_BY_CLASS_NAME;
        } else if (_regex.selector.isTag(selector)) {
            method = GET_ELEMENTS_BY_TAG_NAME;
        } else {
            method = QUERY_SELECTOR_ALL;
        }

        selectorCache.set(selector, method);
        return method;
    },

    uniqueId = require('util/uniqueId').seed(0, 'D-uniqueId-'),

    _fromDomArrayToArray = function(arrayLike) {
        var idx = arrayLike.length,
            arr = new Array(idx);
        while (idx--) {
            arr[idx] = arrayLike[idx];
        }
        return arr;
    },

    _processQuerySelection = function(selection) {
        // No selection
        if (!selection) {
            return [];
        }
        // Nodelist without a length
        if (isNodeList(selection) && !selection.length) {
            return [];
        }

        // If it's an id, return it as an array
        return isElement(selection) || !selection.length ? [selection] : _fromDomArrayToArray(selection);
    },

    _tailorChildSelector = function(id, selector) {
        return '#' + id + ' ' + selector;
    },

    _childOrSiblingQuery = function(context, self) {
        // Child select - needs special help so that "> div" doesn't break
        var method    = self.method,
            idApplied = false,
            selector  = self.selector,
            newId,
            id;

        id = context.id;
        if (id === '' || !exists(id)) {
            newId = uniqueId();
            context.id = newId;
            idApplied = true;
        }

        selector = _tailorChildSelector(idApplied ? newId : id, selector);

        var selection = document[method](selector);

        if (idApplied) {
            context.id = id;
        }

        return _processQuerySelection(selection);
    },

    _classQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector;

        if (SUPPORTS.getElementsByClassName) {
            // Class search, don't start with '.'
            selector = selector.substr(1);
        } else {
            method = QUERY_SELECTOR_ALL;
        }

        var selection = context[method](selector);

        return _processQuerySelection(selection);
    },

    _idQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector.substr(1),
            selection = document[method](selector);

        return _processQuerySelection(selection);
    },

    _defaultQuery = function(context, self) {
        var selection = context[self.method](self.selector);
        return _processQuerySelection(selection);
    },

    _determineQuery = function(self) {
        if (self.isChildOrSiblingSelect) {
            return _childOrSiblingQuery;
        }

        if (self.isClassSearch) {
            return _classQuery;
        }

        if (self.isIdSearch) {
            return _idQuery;
        }

        return _defaultQuery;
    };

var Selector = module.exports = function(str) {
    var selector                = str.trim(),
        isChildOrSiblingSelect  = selector[0] === '>' || selector[0] === '+',
        method                  = isChildOrSiblingSelect ? QUERY_SELECTOR_ALL : _determineMethod(selector);

    this.str                    = str;
    this.selector               = selector;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.isIdSearch             = method === GET_ELEMENT_BY_ID;
    this.isClassSearch          = !this.isIdSearch && method === GET_ELEMENTS_BY_CLASS_NAME;
    this.method                 = method;
};

Selector.prototype = {

    match: function(context) {
        // No neeed to check, a match will fail if it's
        // child or sibling
        if (this.isChildOrSiblingSelect) { return false; }

        return matches(context, this.selector);
    },

    exec: function(context) {
        var query = _determineQuery(this);

        // these are the types we're expecting to fall through
        // isElement(context) || isNodeList(context) || isCollection(context)
        // if no context is given, use document
        return query(context || document, this);
    }
};