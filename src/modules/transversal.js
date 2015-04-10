var _                 = require('_'),
    D                 = require('D'),
    ELEMENT           = require('NODE_TYPE/ELEMENT'),
    DOCUMENT          = require('NODE_TYPE/DOCUMENT'),
    DOCUMENT_FRAGMENT = require('NODE_TYPE/DOCUMENT_FRAGMENT'),
    isString          = require('is/string'),
    isAttached        = require('is/attached'),
    isElement         = require('is/element'),
    isWindow          = require('is/window'),
    isDocument        = require('is/document'),
    isD               = require('is/D'),
    order             = require('order'),
    unique            = require('./array/unique'),
    selectorFilter    = require('./selectors/filter'),
    Fizzle            = require('Fizzle');

var getSiblings = function(context) {
        var idx    = 0,
            len    = context.length,
            result = [];
        for (; idx < len; idx++) {
            var sibs = _getNodeSiblings(context[idx]);
            if (sibs.length) { result.push(sibs); }
        }
        return _.flatten(result);
    },

    _getNodeSiblings = function(node) {
        var parent = node.parentNode;

        if (!parent) {
            return [];
        }

        var sibs = _.toArray(parent.children),
            idx  = sibs.length;

        while (idx--) {
            // Exclude the node itself from the list of its parent's children
            if (sibs[idx] === node) {
                sibs.splice(idx, 1);
            }
        }

        return sibs;
    },

    // Children ------
    getChildren = (arr) => _.flatten(_.map(arr, _children)),
    _children = function(elem) {
        var kids = elem.children,
            idx  = 0, len  = kids.length,
            arr  = new Array(len);
        for (; idx < len; idx++) {
            arr[idx] = kids[idx];
        }
        return arr;
    },

    // Parents ------
    getClosest = function(elems, selector, context) {
        var idx = 0,
            len = elems.length,
            parents,
            closest,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(elems[idx], context);
            parents.unshift(elems[idx]);
            closest = selectorFilter(parents, selector);
            if (closest.length) {
                result.push(closest[0]);
            }
        }
        return _.flatten(result);
    },

    getParents = function(context) {
        var idx = 0,
            len = context.length,
            parents,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(context[idx]);
            result.push(parents);
        }
        return _.flatten(result);
    },

    getParentsUntil = function(d, stopSelector) {
        var idx = 0,
            len = d.length,
            parents,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(d[idx], null, stopSelector);
            result.push(parents);
        }
        return _.flatten(result);
    },

    _crawlUpNode = function(node, context, stopSelector) {
        var result = [],
            parent = node,
            nodeType;

        while ((parent   = getNodeParent(parent)) &&
               (nodeType = parent.nodeType) !== DOCUMENT &&
               (!context      || parent !== context) &&
               (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
            if (nodeType === ELEMENT) {
                result.push(parent);
            }
        }

        return result;
    },

    // Parent ------
    getParent = function(context) {
        var idx    = 0,
            len    = context.length,
            result = [];
        for (; idx < len; idx++) {
            var parent = getNodeParent(context[idx]);
            if (parent) { result.push(parent); }
        }
        return result;
    },

    // Safely get parent node
    getNodeParent = function(node) {
        return node && node.parentNode;
    },

    getPrev = function(node) {
        var prev = node;
        while ((prev = prev.previousSibling) && prev.nodeType !== ELEMENT) {}
        return prev;
    },

    getNext = function(node) {
        var next = node;
        while ((next = next.nextSibling) && next.nodeType !== ELEMENT) {}
        return next;
    },

    getPrevAll = function(node) {
        var result = [],
            prev   = node;
        while ((prev = prev.previousSibling)) {
            if (prev.nodeType === ELEMENT) {
                result.push(prev);
            }
        }
        return result;
    },

    getNextAll = function(node) {
        var result = [],
            next   = node;
        while ((next = next.nextSibling)) {
            if (next.nodeType === ELEMENT) {
                result.push(next);
            }
        }
        return result;
    },

    getPositional = function(getter, d, selector) {
        var result = [],
            idx,
            len = d.length,
            sibling;

        for (idx = 0; idx < len; idx++) {
            sibling = getter(d[idx]);
            if (sibling && (!selector || Fizzle.is(selector).match(sibling))) {
                result.push(sibling);
            }
        }

        return result;
    },

    getPositionalAll = function(getter, d, selector) {
        var result = [],
            idx,
            len = d.length,
            siblings,
            filter;

        if (selector) {
            filter = function(sibling) { return Fizzle.is(selector).match(sibling); };
        }

        for (idx = 0; idx < len; idx++) {
            siblings = getter(d[idx]);
            if (selector) {
                siblings = _.filter(siblings, filter);
            }
            result.push.apply(result, siblings);
        }

        return result;
    },

    getPositionalUntil = function(getter, d, selector) {
        var result = [],
            idx,
            len = d.length,
            siblings,
            iterator;

        if (selector) {
            var is = Fizzle.is(selector);
            iterator = function(sibling) {
                var isMatch = is.match(sibling);
                if (isMatch) {
                    result.push(sibling);
                }
                return isMatch;
            };
        }

        for (idx = 0; idx < len; idx++) {
            siblings = getter(d[idx]);

            if (selector) {
                _.each(siblings, iterator);
            } else {
                result.push.apply(result, siblings);
            }
        }

        return result;
    },

    uniqueSort = function(elems, reverse) {
        var result = unique(elems);
        order.sort(result);
        if (reverse) {
            result.reverse();
        }
        return D(result);
    },

    filterAndSort = function(elems, selector, reverse) {
        return uniqueSort(selectorFilter(elems, selector), reverse);
    };

exports.fn = {
    contents: function() {
        return D(
            _.flatten(
                // TODO: pluck
                _.map(this, (elem) => elem.childNodes)
            )
        );
    },

    index: function(selector) {
        if (isString(selector)) {
            var first = this[0];
            return D(selector).indexOf(first);  
        }

        if (isElement(selector) || isWindow(selector) || isDocument(selector)) {
            return this.indexOf(selector);
        }

        if (isD(selector)) {
            return this.indexOf(selector[0]);
        }

        // fallback
        if (!this.length) {
            return -1;
        }

        var first  = this[0],
            parent = first.parentNode;

        if (!parent) {
            return -1;
        }

        // isAttached check to pass test "Node without parent returns -1"
        // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
        var attached         = isAttached(first),
            isParentFragment = parent.nodeType === DOCUMENT_FRAGMENT;

        if (!attached && !isParentFragment) {
            return -1;
        }

        var childElems = parent.children || _.filter(parent.childNodes, (node) => node.nodeType === ELEMENT);

        return [].indexOf.apply(childElems, [ first ]);
    },

    closest: function(selector, context) {
        return uniqueSort(getClosest(this, selector, context));
    },

    parent: function(selector) {
        return filterAndSort(getParent(this), selector);
    },

    parents: function(selector) {
        return filterAndSort(getParents(this), selector, true);
    },

    parentsUntil: function(stopSelector) {
        return uniqueSort(getParentsUntil(this, stopSelector), true);
    },

    siblings: function(selector) {
        return filterAndSort(getSiblings(this), selector);
    },

    children: function(selector) {
        return filterAndSort(getChildren(this), selector);
    },

    prev: function(selector) {
        return uniqueSort(getPositional(getPrev, this, selector));
    },

    next: function(selector) {
        return uniqueSort(getPositional(getNext, this, selector));
    },

    prevAll: function(selector) {
        return uniqueSort(getPositionalAll(getPrevAll, this, selector), true);
    },

    nextAll: function(selector) {
        return uniqueSort(getPositionalAll(getNextAll, this, selector));
    },

    prevUntil: function(selector) {
        return uniqueSort(getPositionalUntil(getPrevAll, this, selector), true);
    },

    nextUntil: function(selector) {
        return uniqueSort(getPositionalUntil(getNextAll, this, selector));
    }
};
