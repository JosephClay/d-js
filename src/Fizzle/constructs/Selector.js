var exists     = require('is/exists'),
    isNodeList = require('is/nodeList'),
    isElement  = require('is/element'),

    GET_ELEMENT_BY_ID          = 'getElementById',
    GET_ELEMENTS_BY_TAG_NAME   = 'getElementsByTagName',
    GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    QUERY_SELECTOR_ALL         = 'querySelectorAll',
    
    uniqueId      = require('util/uniqueId').seed(0, 'D-uniqueId-'),
    selectorCache = require('cache')(),
    REGEX         = require('REGEX'),
    matches       = require('matchesSelector');

var determineMethod = function(selector) {
        var method = selectorCache.get(selector);
        if (method) { return method; }

        method = REGEX.isStrictId(selector) ? GET_ELEMENT_BY_ID :
            REGEX.isClass(selector) ? GET_ELEMENTS_BY_CLASS_NAME :
            REGEX.isTag(selector) ? GET_ELEMENTS_BY_TAG_NAME :       
            QUERY_SELECTOR_ALL;

        selectorCache.set(selector, method);
        return method;
    },

    // need to force an array here
    fromDomArrayToArray = function(arrayLike) {
        var idx = arrayLike.length,
            arr = new Array(idx);
        while (idx--) {
            arr[idx] = arrayLike[idx];
        }
        return arr;
    },

    processQuerySelection = function(selection) {
        // No selection
        if (!selection) {
            return [];
        }
        // Nodelist without a length
        if (isNodeList(selection) && !selection.length) {
            return [];
        }

        // If it's an id, return it as an array
        return isElement(selection) || !selection.length ? [selection] : fromDomArrayToArray(selection);
    },

    tailorChildSelector = function(id, selector) {
        return '#' + id + ' ' + selector;
    },

    childOrSiblingQuery = function(context, self) {
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

        selector = tailorChildSelector(idApplied ? newId : id, selector);

        var selection = document[method](selector);

        if (idApplied) {
            context.id = id;
        }

        return processQuerySelection(selection);
    },

    classQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector,
            // Class search, don't start with '.'
            selector = self.selector.substr(1);

        var selection = context[method](selector);

        return processQuerySelection(selection);
    },

    idQuery = function(context, self) {
        var method   = self.method,
            selector = self.selector.substr(1),
            selection = document[method](selector);

        return processQuerySelection(selection);
    },

    defaultQuery = function(context, self) {
        var selection = context[self.method](self.selector);
        return processQuerySelection(selection);
    },

    determineQuery = function(self) {
        if (self.isChildOrSiblingSelect) {
            return childOrSiblingQuery;
        }

        if (self.isClassSearch) {
            return classQuery;
        }

        if (self.isIdSearch) {
            return idQuery;
        }

        return defaultQuery;
    };

var Selector = module.exports = function(str) {
    var selector                = str.trim(),
        isChildOrSiblingSelect  = selector[0] === '>' || selector[0] === '+',
        method                  = isChildOrSiblingSelect ? QUERY_SELECTOR_ALL : determineMethod(selector);

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
        var query = determineQuery(this);

        // these are the types we're expecting to fall through
        // isElement(context) || isNodeList(context) || isCollection(context)
        // if no context is given, use document
        return query(context || document, this);
    }
};