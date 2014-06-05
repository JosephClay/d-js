var _        = require('_'),
    overload = require('overload'),
    O        = overload.O,

    _utils   = require('../utils'),
    _array   = require('./array'),
    _order   = require('../order'),

    Fizzle   = require('./Fizzle/Fizzle');

var _uniqueSort = function(elems, reverse) {
    var result = _array.unique(elems);
    _array.elementSort(result);
    if (reverse) {
        result.reverse();
    }
    return result;
};

var _find = function(selector, isNew) {
    var query = Fizzle.query(selector);
    return _uniqueSort(query.exec(this, isNew));
};

/**
 * @param {String|Function|Element|NodeList|Array|D} selector
 * @param {D} context
 * @returns {Element[]}
 * @private
 */
var _findWithin = function(selector, context) {
    // Fail fast
    if (!context.length) { return []; }

    var query, descendants, results;

    if (_.isElement(selector) || _.isNodeList(selector) || _.isArray(selector) || selector instanceof D) {
        // Convert selector to an array of elements
        selector = _.isElement(selector) ? [ selector ] : selector;

        descendants = context[0].querySelectorAll('*');
        results = _.filter(descendants, function(descendant) { return selector.indexOf(descendant) > -1; });
    } else {
        query = Fizzle.query(selector);
        results = query.exec(context);
    }

    return _uniqueSort(results);
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

        var is = Fizzle.is(qualifier);
        return _.filter(arr, function(elem) {
            return is.match(elem);
        });
    }

    // Array qualifier
    return _.filter(arr, function(elem) {
        return qualifier.indexOf(elem) > -1;
    });
};

module.exports = {
    find: _find,
    filter: _filter,

    fn: {
        // TODO: Optimize this method
        has: overload()
            .args(O.selector)
            .use(function(target) {
                var targets = this.find(target),
                    idx,
                    len = targets.length;

                return D(
                    _.filter(this, function(elem) {
                        for (idx = 0; idx < len; idx++) {
                            if (_order.contains(elem, targets[idx])) {
                                return true;
                            }
                        }
                        return false;
                    })
                );
            })

            .expose(),

        is: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return false; }

                var is = Fizzle.is(selector);
                return is.any(this);
            })

            .args(O.collection)
            .use(function(arr) {

                return _.any(this, function(elem) {
                    if (_.indexOf(arr, elem) !== -1) { return true; }
                });

            })

            .args(Function)
            .use(function(iterator) {

                return _.any(this, function(elem, idx) {
                    if (iterator.call(elem, idx)) {
                        return true;
                    }
                });

            })

            .args(Element)
            .use(function(context) {

                return _.any(this, function(elem) {
                    return (elem === context);
                });

            })

            .args(O.any(null, undefined, Number, Object))
            .use(function() {
                return false;
            })
            .expose(),

        not: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return this; }

                var is = Fizzle.is(selector);
                return D(
                    is.not(this)
                );
            })

            .args(O.collection)
            .use(function(arr) {
                arr = _.toArray(arr);

                return D(
                    _.filter(this, function(elem) {
                        if (_.indexOf(arr, elem) === -1) { return true; }
                    })
                );

            })

            .args(Function)
            .use(function(iterator) {

                return D(
                    _.filter(this, function(elem, idx) {
                        return !iterator.call(elem, idx);
                    })
                );

            })

            .args(Element)
            .use(function(context) {

                return D(
                    _.filter(this, function(elem) {
                        return (elem !== context);
                    })
                );

            })

            .args(O.any(null, undefined, Number, Object))
            .use(function() {
                return this;
            })
            .expose(),

        find: overload()
            .args(O.selector)
            .use(function(selector) {

                return _utils.merge(D(), _findWithin(selector, this));

            })
            .expose(),

        filter: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return D(); }

                var is = Fizzle.is(selector);
                return D(
                    _.filter(this, function(elem) {
                        return is.match(elem);
                    })
                );

            })

            .args(O.collection)
            .use(function(arr) {

                return D(
                    _.filter(this, function(elem) {
                        if (_.indexOf(arr, elem) !== -1) { return true; }
                    })
                );

            })

            .args(Element)
            .use(function(context) {

                return D(
                    _.filter(this, function(elem) {
                        return (elem === context);
                    })
                );

            })

            // TODO: Filter with object? see _.find/_.findWhere
            .args(Function)
            .use(function(checker) {

                return D(
                    _.filter(this, function(elem, idx) {
                        return checker.call(elem, elem, idx);
                    })
                );

            })

            .args(O.any(null, undefined, Number))
            .use(function() {
                return D();
            })
            .expose()
    }
};
