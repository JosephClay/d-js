var _                 = require('_'),
    D                 = require('D'),
    nodeType          = require('nodeType'),
    exists            = require('is/exists'),
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
            arr  = Array(len);
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

    // Safely get parent node
    _getNodeParent = (node) => node && node.parentNode,

    _crawlUpNode = function(node, context, stopSelector) {
        var result = [],
            parent = node;

        while ((parent = _getNodeParent(parent))     &&
               !nodeType.doc(parent)                 &&
               (!context      || parent !== context) &&
               (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
            if (nodeType.elem(parent)) {
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
            var parent = _getNodeParent(context[idx]);
            if (parent) { result.push(parent); }
        }
        return result;
    },

    _prevNextCrawl = function(method) {
        return function(node) {
            var current = node;
            while ((current = current[method]) && !nodeType.elem(current)) {}
            return current;    
        };
    },
    getPrev = _prevNextCrawl('previousSibling'),
    getNext = _prevNextCrawl('nextSibling'),

    _prevNextCrawlAll = function(method) {
        return function(node) {
            var result  = [],
                current = node;
            while ((current = current[method])) {
                if (nodeType.elem(current)) {
                    result.push(current);
                }
            }
            return result;
        };
    },
    getPrevAll = _prevNextCrawlAll('previousSibling'),
    getNextAll = _prevNextCrawlAll('nextSibling'),

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
            filter = selector ? function(sibling) { return Fizzle.is(selector).match(sibling); } : exists;

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
                _.pluck(this, 'childNodes')
            )
        );
    },

    index: function(selector) {
        var outOfBounds = -1;
        if (!this.length) { return outOfBounds; }

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
        var first  = this[0],
            parent = first.parentNode;

        if (!parent) { return outOfBounds; }

        // isAttached check to pass test "Node without parent returns -1"
        // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
        var attached         = isAttached(first),
            isParentFragment = nodeType.doc_frag(parent);

        if (!attached && !isParentFragment) { return outOfBounds; }

        var childElems = parent.children || _.filter(parent.childNodes, nodeType.elem);

        return [].indexOf.call(childElems, first);
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
