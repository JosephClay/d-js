var _ = require('_'),
    _utils = require('../utils'),
    _regex = require('../regex'),
    _array = require('./array'),
    _nodeType = require('../nodeType'),
    _supports = require('../supports'),

    Query = require('./query/Query');

var _isMatch = (function(matchSelector) {
    if (matchSelector) {
        return function(elem, selector) {
            return matchSelector.call(elem, selector);
        };
    }

    return function(elem, selector) {
        var nodes = elem.parentNode.querySelectorAll(selector),
            idx = nodes.length;
        while (idx--) {
            if (nodes[idx] === elem) {
                return true;
            }
        }
        return false;
    };
}(_supports.matchesSelector));

var _find = function(selector, context) {
    var idx = 0,
        length = context.length || 1,
        query = Query(selector),
        result = [];

    // Early return if the selector is bad
    if (query.isBlackList) { return result; }

    for (; idx < length; idx++) {
        var ret = _findWithQuery(query, context[idx]);
        if (ret) { result.push(ret); }
    }

    return _array.unique(_.flatten(result));
};

var _findWithQuery = function(query, context) {
    context = context || document;

    var nodeType;
    // Early return if context is not an element or document
    if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

    // Child select - needs special help so that "> div" doesn't break
    var id,
        newId,
        idApplied = false;
        selector = query.selector;
    if (query.isChildOrSiblingSelect) {
        id = context.id;
        if (!_.exists(id)) {
            newId = query.uniqueId();
            context.id = newId;
            idApplied = true;
        }

        selector = query.tailorChildSelector(idApplied ? newId : id, selector);
        context = document;
    }

    var selection = context[query.method](selector);
    if (!selection.length) { return; }

    if (idApplied) { context.id = id; }

    return _array.slice(selection);
};

var _filter = function(arr, qualifier) {
    // Early return, no qualifier. Everything matches
    if (!qualifier) { return arr; }

    // Function
    if (_.isFunction(qualifier)) {
        return _.filter(arr, qualifier);
    }

    // Element
    if (qualifier.nodeType) {
        return _.filter(arr, function(elem) {
            return (elem === qualifier);
        });
    }

    // Selector
    if (_.isString(qualifier)) {
        return _.filter(arr, function(elem) {
            return elem.nodeType === 1 && _isMatch(elem, qualifier);
        });
    }

    // Array qualifier
    return _.filter(arr, function(elem) {
        return arr.indexOf(qualifier) > -1;
    });
};

module.exports = {
    find: _find,
    is: _isMatch,
    filter: _filter,

    fn: {
        has: function(target) {
            // TODO: Has
            /*var i,
                targets = jQuery( target, this ),
                len = targets.length;

            return this.filter(function() {
                for ( i = 0; i < len; i++ ) {
                    if ( jQuery.contains( this, targets[i] ) ) {
                        return true;
                    }
                }
            });*/
        },

        is: Overload()
                .args(O.any(null, undefined, Number, Object)).use(function() {
                    return false;
                })

                .args(String).use(function(selector) {
                    if (selector === '') { return false; }

                    return _.any(this, function(elem) {
                        return _isMatch(elem, selector);
                    });
                })

                .args(Function).use(function(iterator) {
                    // TODO: Internal "every"
                    return _.any(this, iterator);
                })
                .expose(),

        not: function() {},

        find: Overload()
                .args(String)
                .use(function(selector) {

                    return _utils.merge(D(), _find(selector, this));

                }).expose(),

        filter: Overload()
                    .args(String)
                    .use(function(selector) {
                        return this.is(selector);
                    })
                    .args(Function)
                    .use(function(checker) {
                        var result = [],
                            idx = this.length;

                        while (idx--) {
                            if (checker(this[idx])) { result.unshift(this[idx]); }
                        }

                        return D(result);
                    })
                    .expose()
    }
};
