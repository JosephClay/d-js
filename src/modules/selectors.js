var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _utils = require('../utils'),
    _array = require('./array'),

    Fizzle = require('./Fizzle/Fizzle'),

    // http://ejohn.org/blog/comparing-document-position/
    _DOC_POS = {
        NODES_ARE_IDENTICAL    :  0,
        DIFFERENT_DOCUMENTS    :  1,
        NODE_B_PRECEDES_NODE_A :  2,
        NODE_A_PRECEDES_NODE_B :  4,
        NODE_B_CONTAINS_NODE_A :  8,
        NODE_A_CONTAINS_NODE_B : 16
    };

var _doesContain = function(a, b) {
    var aDown = a.nodeType === 9 ? a.documentElement : a,
        bUp   = b && b.parentNode;
    if (a === bUp) {
        return true;
    }
    if (bUp && bUp.nodeType === 1) {
        if (aDown.contains) {
            return aDown.contains(bUp);
        }
        if (a.compareDocumentPosition) {
            return (a.compareDocumentPosition(bUp) & _DOC_POS.NODE_A_CONTAINS_NODE_B) !== 0;
        }
    }
    return false;
};

var _find = function(selector, isNew) {
    var query = Fizzle.query(selector);
    return _array.unique(query.exec(this, isNew));
};

var _findWithin = function(selector, context) {
    var query = Fizzle.query(selector);
    return _array.unique(query.exec(context));
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
        has: overload()
            .args(String)
            .use(function(target) {
                var targets = this.find(target),
                    idx = 0, length = targets.length;

                return D(
                    _.filter(function() {
                        for (; idx < length; idx++) {
                            if (_doesContain(this, targets[idx])) {
                                return true;
                            }
                        }
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

            .args(O.any(Array, O.D))
            .use(function(arr) {

                return _.any(this, function(elem) {
                    if (arr.indexOf(elem) !== -1) { return true; }
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

            .args(O.any(Array, O.D, O.nodeList))
            .use(function(arr) {
                arr = _.toArray(arr);

                return D(
                    _.filter(this, function(elem) {
                        if (arr.indexOf(elem) === -1) { return true; }
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
            .args(String)
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

            .args(O.any(Array, O.D))
            .use(function(arr) {

                return D(
                    _.filter(this, function(elem) {
                        if (arr.indexOf(elem) !== -1) { return true; }
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
                        // TODO: This is backwards from forEach and _.each, change?
                        return checker.call(elem, idx, elem);
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
