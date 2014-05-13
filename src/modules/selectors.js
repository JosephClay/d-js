var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _utils = require('../utils'),
    _regex = require('../regex'),
    _array = require('./array'),

    Fizzle = require('./Fizzle/Fizzle');

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
        return arr.indexOf(qualifier) > -1;
    });
};

module.exports = {
    find: _find,
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

            .args(O.any(Array, O.D))
            .use(function(arr) {

                return D(
                    _.filter(this, function(elem) {
                        if (arr.indexOf(elem) === -1) { return true; }
                    })
                );

            })

            .args(Function)
            .use(function(iterator) {

                return _.filter(this, function(elem, idx) {
                    return iterator.call(elem, idx);
                });

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
