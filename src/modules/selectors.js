var _        = require('underscore'),

    isSelector   = require('is/selector'),
    isCollection = require('is/collection'),
    isFunction   = require('is/function'),
    isElement    = require('is/element'),
    isNodeList   = require('is/nodeList'),
    isArray      = require('is/array'),
    isString     = require('is/string'),
    isD          = require('is/d'),

    _utils   = require('../utils'),
    _array   = require('./array'),
    _order   = require('../order'),

    Fizzle   = require('./Fizzle/Fizzle');

var _find = function(selector, isNew) {
    var query = Fizzle.query(selector);
    return query.exec(this, isNew);
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

    if (isElement(selector) || isNodeList(selector) || isArray(selector) || isD(selector)) {
        // Convert selector to an array of elements
        selector = isElement(selector) ? [ selector ] : selector;

        descendants = _.flatten(_.map(context, function(elem) { return elem.querySelectorAll('*'); }));
        results = _.filter(descendants, function(descendant) { return selector.indexOf(descendant) > -1; });
    } else {
        query = Fizzle.query(selector);
        results = query.exec(context);
    }

    return results;
};

var _filter = function(arr, qualifier) {
    // Early return, no qualifier. Everything matches
    if (!qualifier) { return arr; }

    // Function
    if (isFunction(qualifier)) {
        return _.filter(arr, qualifier);
    }

    // Element
    if (qualifier.nodeType) {
        return _.filter(arr, function(elem) {
            return (elem === qualifier);
        });
    }

    // Selector
    if (isString(qualifier)) {

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
        has: function(target) {
            if (!isSelector(target)) { return this; }

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
        },

        is: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return false; }

                var is = Fizzle.is(selector);
                return is.any(this);
            }

            if (isCollection(selector)) {
                var arr = selector;
                return _.any(this, function(elem) {
                    if (_.indexOf(arr, elem) !== -1) { return true; }
                });
            }

            if (isFunction(selector)) {
                var iterator = selector;
                return _.any(this, function(elem, idx) {
                    if (iterator.call(elem, idx)) {
                        return true;
                    }
                });
            }

            if (isElement(selector)) {
                var context = selector;
                return _.any(this, function(elem) {
                    return (elem === context);
                });
            }

            // fallback
            return false;
        },

        not: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return this; }

                var is = Fizzle.is(selector);
                return D(
                    is.not(this)
                );
            }

            if (isCollection(selector)) {
                var arr = _.toArray(selector);
                return D(
                    _.filter(this, function(elem) {
                        if (_.indexOf(arr, elem) === -1) { return true; }
                    })
                );
            }

            if (isFunction(selector)) {
                var iterator = selector;
                return D(
                    _.filter(this, function(elem, idx) {
                        return !iterator.call(elem, idx);
                    })
                );
            }

            if (isElement(selector)) {
                var context = selector;
                return D(
                    _.filter(this, function(elem) {
                        return (elem !== context);
                    })
                );
            }

            // fallback
            return this;
        },

        find: function(selector) {
            if (!isSelector(selector)) { return this; }

            var result = _findWithin(selector, this);
            if (this.length > 1) {
                _array.elementSort(result);
            }
            return _utils.merge(D(), result);

        },

        filter: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return D(); }

                var is = Fizzle.is(selector);
                return D(
                    _.filter(this, function(elem) {
                        return is.match(elem);
                    })
                );
            }

            if (isCollection(selector)) {
                var arr = selector;
                return D(
                    _.filter(this, function(elem) {
                        if (_.indexOf(arr, elem) !== -1) { return true; }
                    })
                );
            }

            if (isElement(selector)) {
                var context = selector;
                return D(
                    _.filter(this, function(elem) {
                        return (elem === context);
                    })
                );
            }
        
            // TODO: Filter with object? see _.find/_.findWhere
            if (isFunction(selector)) {
                var checker = selector;
                return D(
                    _.filter(this, function(elem, idx) {
                        return checker.call(elem, elem, idx);
                    })
                );
            }

            // fallback
            return D();
        }
    }
};
