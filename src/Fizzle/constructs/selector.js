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

    childOrSiblingQuery = function(context, method, selector) {
        // Child select - needs special help so that "> div" doesn't break
        var idApplied = false,
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

    classQuery = function(context, method, selector) {
        // Class search, don't start with '.'
        var selector = selector.substr(1),
            selection = context[method](selector);

        return processQuerySelection(selection);
    },

    idQuery = function(context, method, selector) {
        var sel = selector.substr(1),
            selection = document[method](sel);

        return processQuerySelection(selection);
    },

    defaultQuery = function(context, method, selector) {
        var selection = context[method](selector);
        return processQuerySelection(selection);
    },

    determineQuery = (isChildOrSiblingSelect, isClassSearch, isIdSearch) =>
        isChildOrSiblingSelect ? childOrSiblingQuery :
        isClassSearch ? classQuery :
        isIdSearch ? idQuery :
        defaultQuery;

module.exports = function Selector(str) {
    var selector                = str.trim(),
        isChildOrSiblingSelect  = selector[0] === '>' || selector[0] === '+',
        method                  = isChildOrSiblingSelect ? QUERY_SELECTOR_ALL : determineMethod(selector),
        isIdSearch              = method === GET_ELEMENT_BY_ID,
        isClassSearch           = !isIdSearch && method === GET_ELEMENTS_BY_CLASS_NAME;

    var query = determineQuery(
        isChildOrSiblingSelect,
        isClassSearch,
        isIdSearch
    );

    return {
        str: str,

        match: function(context) {
            // No neeed to check, a match will fail if it's
            // child or sibling
            return !isChildOrSiblingSelect ? matches(context, selector) : false;
        },

        exec: function(context) {
            // these are the types we're expecting to fall through
            // isElement(context) || isNodeList(context) || isCollection(context)
            // if no context is given, use document
            return query(context || document, method, selector);
        }
    };
};