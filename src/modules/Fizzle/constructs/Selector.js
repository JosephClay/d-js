var _ = require('underscore'),
    string = require('../../../string'),
    overload = require('overload-js'),
    o = overload.o,

    _ID_PREFIX = 'D-uniqueId-',

    _GET_ELEMENT_BY_ID          = 'getElementById',
    _GET_ELEMENTS_BY_TAG_NAME   = 'getElementsByTagName',
    _GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    _QUERY_SELECTOR_ALL         = 'querySelectorAll',

    _SUPPORTS  = require('../../../supports'),
    NODE_TYPE = require('node-type'),

    _cache = require('cache'),
    _regex = require('../../../regex'),

    _querySelectorCache = _cache(),

    _isMatch = require('../selector/selector-match');

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
    },

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
        if (_.isNodeList(selection) && !selection.length) {
            return [];
        }
        // IE8 DispStaticNodeList
        if (selection.item && selection.length === 0) {
            return [];
        }

        // If it's an id, return it as an array
        return _.isElement(selection) || !selection.length ? [selection] : _fromDomArrayToArray(selection);
    },

    _childOrSiblingQuery = function(context, self) {
        // Child select - needs special help so that "> div" doesn't break
        var method    = self.method,
            idApplied = false,
            selector  = self.selector,
            newId,
            id;

        id = context.id;
        if (id === '' || !_.exists(id)) {
            newId = _uniqueId();
            context.id = newId;
            idApplied = true;
        }

        selector = self._tailorChildSelector(idApplied ? newId : id, selector);

        var selection = document[method](selector);

        if (idApplied) {
            context.id = id;
        }

        return _processQuerySelection(selection);
    },

    _classQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector;

        if (_SUPPORTS.getElementsByClassName) {
            // Class search, don't start with '.'
            selector = selector.substr(1);
        } else {
            method = _QUERY_SELECTOR_ALL;
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

var Selector = function(str) {
    var selector                = string.trim(str),
        isChildOrSiblingSelect  = (selector[0] === '>' || selector[0] === '+'),
        method                  = isChildOrSiblingSelect ? _QUERY_SELECTOR_ALL : _determineMethod(selector);

    this.str                    = str;
    this.selector               = selector;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.isIdSearch             = method === _GET_ELEMENT_BY_ID;
    this.isClassSearch          = !this.isIdSearch && method === _GET_ELEMENTS_BY_CLASS_NAME;
    this.method                 = method;
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
        var query = _determineQuery(this);

        if (!context || context === document) {
            return query(document, this);
        }

        // these are the types we're expecting to fall through
        // _.isElement(context) || _.isNodeList(context) || _.isCollection(context)
        return query(context, this);
    }
};

module.exports = Selector;
