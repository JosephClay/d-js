var _ = require('_'),
    _utils = require('../utils'),
    _regex = require('../regex'),
    _array = require('./array'),

    Query = require('./query/Query'),
    Is = require('./query/Is');

var _find = function(selector, isNew) {
    var query = Query(selector);
    return _array.unique(query.exec(this, isNew));
};

var _findWithin = function(selector, context) {
    var query = Query(selector);
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
    is: function() {
        // TODO: Implement?
        debugger;
    },
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
            .args(String).use(function(selector) {
                if (selector === '') { return false; }

                var is = Is(selector);
                return is.exec(this);
            })
            .args(Function).use(function(iterator) {

                return _.any(this, function(elem, idx) {
                    if (iterator.call(elem, idx)) {
                        return true;
                    }
                });

            })
            .args(O.D).use(function(d) {

                return _.any(this, function(elem) {
                    if (d.indexOf(elem) !== -1) { return true; }
                });

            })
            .args(Element).use(function(context) {

                return _.any(this, function(elem) {
                    return (elem === context);
                });

            })
            .args(O.any(null, undefined, Number, Object)).use(function() {
                return false;
            })
            .expose(),

        not: function() {},

        find: Overload()
            .args(String).use(function(selector) {

                return _utils.merge(D(), _findWithin(selector, this));

            })
            .expose(),

        filter: Overload()
            .args(String).use(function(selector) {
                if (selector === '') { return D(); }

                var is = Is(selector);
                return D(
                    _.filter(this, function(elem) {
                        return is.match(elem);
                    })
                );

            })
            .args(Array).use(function(arr) {

                return D(
                    _.filter(this, function(elem) {
                        if (arr.indexOf(elem) !== -1) { return true; }
                    })
                );

            })
            .args(Element).use(function(context) {

                return D(
                    _.filter(this, function(elem) {
                        return (elem === context);
                    })
                );

            })
            .args(O.D).use(function(d) {

                return D(
                    _.filter(this, function(elem) {
                        return (d.indexOf(elem) !== -1);
                    })
                );

            })
            // TODO: Filter with object? see _.find/_.findWhere
            .args(Function).use(function(checker) {

                return D(
                    _.filter(this, function(elem, idx) {
                        // TODO: This is backwards from forEach and _.each, change?
                        return checker.call(elem, idx, elem);
                    })
                );

            })
            .args(O.any(null, undefined, Number)).use(function() {
                return D();
            })
            .expose()
    }
};
