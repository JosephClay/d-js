var _           = require('underscore'),
    overload    = require('overload-js'),
    O           = overload.O,

    _NODE_TYPE  = require('node-type'),

    _utils      = require('../utils'),
    _array      = require('./array'),
    _selectors  = require('./selectors'),

    Fizzle      = require('./Fizzle/Fizzle');

var _getSiblings = function(context) {
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
            // Exclude the node itself from the list of its parent's children,
            // and exclude comment nodes for IE8
            if (sibs[idx] === node || sibs[idx].nodeType === _NODE_TYPE.COMMENT) {
                sibs.splice(idx, 1);
            }
        }

        return sibs;
    },

    // Children ------
    _getChildren = function(arr) {
        return _.flatten(_.map(arr, _chldrn));
    },
    _chldrn = function(elem) {
        var arr  = [],
            kids = elem.children,
            idx  = 0,
            len  = kids.length,
            child;
        for (; idx < len; idx++) {
            child = kids[idx];
            // Skip comment nodes on IE8
            if (child.nodeType !== _NODE_TYPE.COMMENT) {
                arr.push(child);
            }
        }
        return arr;
    },

    // Parents ------
    _getClosest = function(elems, selector, context) {
        var idx = 0,
            len = elems.length,
            parents,
            closest,
            result = [];
        for (; idx < len; idx++) {
            parents = _crawlUpNode(elems[idx], context);
            parents.unshift(elems[idx]);
            closest = _selectors.filter(parents, selector);
            if (closest.length) {
                result.push(closest[0]);
            }
        }
        return _.flatten(result);
    },

    _getParents = function(context) {
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

    _getParentsUntil = function(d, stopSelector) {
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

        while ((parent   = _getNodeParent(parent)) &&
               (nodeType = parent.nodeType) !== _NODE_TYPE.DOCUMENT &&
               (!context      || parent !== context) &&
               (!stopSelector || !Fizzle.is(stopSelector).match(parent))) {
            if (nodeType === _NODE_TYPE.ELEMENT) {
                result.push(parent);
            }
        }

        return result;
    },

    // Parent ------
    _getParent = function(context) {
        var idx    = 0,
            len    = context.length,
            result = [];
        for (; idx < len; idx++) {
            var parent = _getNodeParent(context[idx]);
            if (parent) { result.push(parent); }
        }
        return result;
    },

    // Safely get parent node
    _getNodeParent = function(node) {
        return node && node.parentNode;
    },

    _getPrev = function(node) {
        var prev = node;
        while ((prev = prev.previousSibling) && prev.nodeType !== _NODE_TYPE.ELEMENT) {}
        return prev;
    },

    _getNext = function(node) {
        var next = node;
        while ((next = next.nextSibling) && next.nodeType !== _NODE_TYPE.ELEMENT) {}
        return next;
    },

    _getPrevAll = function(node) {
        var result = [],
            prev   = node;
        while ((prev = prev.previousSibling)) {
            if (prev.nodeType === _NODE_TYPE.ELEMENT) {
                result.push(prev);
            }
        }
        return result;
    },

    _getNextAll = function(node) {
        var result = [],
            next   = node;
        while ((next = next.nextSibling)) {
            if (next.nodeType === _NODE_TYPE.ELEMENT) {
                result.push(next);
            }
        }
        return result;
    },

    _getPositional = function(getter, d, selector) {
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

    _getPositionalAll = function(getter, d, selector) {
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

    _getPositionalUntil = function(getter, d, selector) {
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

    _uniqueSort = function(elems, reverse) {
        var result = _array.unique(elems);
        _array.elementSort(result);
        if (reverse) {
            result.reverse();
        }
        return D(result);
    },

    _filterAndSort = function(elems, selector, reverse) {
        return _uniqueSort(_selectors.filter(elems, selector), reverse);
    };

module.exports = {
    fn: {
        contents: function() {
            return D(
                _.flatten(
                    _.map(this, function(elem) {
                        return elem.childNodes;
                    })
                )
            );
        },

        index: overload()

            .args(String)
            .use(function(selector) {
                var first = this[0];
                return D(selector).indexOf(first);
            })

            .args(O.any(Element, O.window, O.document))
            .use(function(elem) {
                return this.indexOf(elem);
            })

            .args(O.D)
            .use(function(d) {
                return this.indexOf(d[0]);
            })

            .fallback(function() {
                if (!this.length) {
                    return -1;
                }

                var first  = this[0],
                    parent = first.parentNode;

                if (!parent) {
                    return -1;
                }

                // _utils.isAttached check to pass test "Node without parent returns -1"
                // nodeType check to pass "If D#index called on element whose parent is fragment, it still should work correctly"
                var isAttached       = _utils.isAttached(first),
                    isParentFragment = parent.nodeType === _NODE_TYPE.DOCUMENT_FRAGMENT;

                if (!isAttached && (!isParentFragment || _utils.isParsedNode(first))) {
                    return -1;
                }

                var childElems = parent.children || _.filter(parent.childNodes, function(node) {
                    return node.nodeType === _NODE_TYPE.ELEMENT;
                });

                return [].indexOf.apply(childElems, [ first ]);
            })

            .expose(),

        closest: function(selector, context) {
            return _uniqueSort(_getClosest(this, selector, context));
        },

        parent: function(selector) {
            return _filterAndSort(_getParent(this), selector);
        },

        parents: function(selector) {
            return _filterAndSort(_getParents(this), selector, true);
        },

        parentsUntil: function(stopSelector) {
            return _uniqueSort(_getParentsUntil(this, stopSelector), true);
        },

        siblings: function(selector) {
            return _filterAndSort(_getSiblings(this), selector);
        },

        children: function(selector) {
            return _filterAndSort(_getChildren(this), selector);
        },

        prev: function(selector) {
            return _uniqueSort(_getPositional(_getPrev, this, selector));
        },

        next: function(selector) {
            return _uniqueSort(_getPositional(_getNext, this, selector));
        },

        prevAll: function(selector) {
            return _uniqueSort(_getPositionalAll(_getPrevAll, this, selector), true);
        },

        nextAll: function(selector) {
            return _uniqueSort(_getPositionalAll(_getNextAll, this, selector));
        },

        prevUntil: function(selector) {
            return _uniqueSort(_getPositionalUntil(_getPrevAll, this, selector), true);
        },

        nextUntil: function(selector) {
            return _uniqueSort(_getPositionalUntil(_getNextAll, this, selector));
        }
    }
};
