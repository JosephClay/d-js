var _          = require('_'),
    exists     = require('is/exists'),
    isNodeList = require('is/nodeList'),
    isElement  = require('is/element'),
    REGEX      = require('REGEX'),
    matches    = require('matchesSelector'),
    uniqueId   = require('util/uniqueId').seed(0, '_D' + Date.now()),

    GET_ELEMENT_BY_ID          = 'getElementById',
    GET_ELEMENTS_BY_TAG_NAME   = 'getElementsByTagName',
    GET_ELEMENTS_BY_CLASS_NAME = 'getElementsByClassName',
    QUERY_SELECTOR_ALL         = 'querySelectorAll';

var determineMethod = (selector) =>
        REGEX.isStrictId(selector) ? GET_ELEMENT_BY_ID :
        REGEX.isClass(selector) ? GET_ELEMENTS_BY_CLASS_NAME :
        REGEX.isTag(selector) ? GET_ELEMENTS_BY_TAG_NAME :       
        QUERY_SELECTOR_ALL,

    processQuerySelection = (selection) =>
        // No selection or a Nodelist without a length
        // should result in nothing
        !selection || (isNodeList(selection) && !selection.length) ? [] :
        // If it's an id selection, return it as an array
        isElement(selection) || !selection.length ? [selection] : 
        // ensure it's an array and not an HTMLCollection
        _.toArray(selection),

    childOrSiblingQuery = function(context, _this) {
        // Child select - needs special help so that "> div" doesn't break
        var method    = _this.method,
            selector  = _this.selector,
            idApplied = false,
            newId,
            id;

        id = context.id;
        if (id === '' || !exists(id)) {
            newId = uniqueId();
            context.id = newId;
            idApplied = true;
        }

        var selection = document[method](
            // tailor the child selector
            `#${idApplied ? newId : id} ${selector}`
        );

        if (idApplied) {
            context.id = id;
        }

        return processQuerySelection(selection);
    },

    classQuery = function(context, _this) {
        var method   = _this.method,
            selector = _this.selector,
            // Class search, don't start with '.'
            selector = _this.selector.substr(1);

        var selection = context[method](selector);

        return processQuerySelection(selection);
    },

    idQuery = function(context, _this) {
        var method   = _this.method,
            selector = _this.selector.substr(1),
            selection = document[method](selector);

        return processQuerySelection(selection);
    },

    defaultQuery = function(context, _this) {
        var selection = context[_this.method](_this.selector);
        return processQuerySelection(selection);
    },

    determineQuery = (_this) =>
        _this.isChildOrSiblingSelect ? childOrSiblingQuery :
        _this.isClassSearch ? classQuery :
        _this.isIdSearch ? idQuery :
        defaultQuery;

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
        return !this.isChildOrSiblingSelect ? matches(context, this.selector) : false;
    },

    exec: function(context) {
        var query = determineQuery(this);

        // these are the types we're expecting to fall through
        // isElement(context) || isNodeList(context) || isCollection(context)
        // if no context is given, use document
        return query(context || document, this);
    }
};