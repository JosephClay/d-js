var _utils = require('../utils'),
    _array = require('./array'),
    _nodeType = require('../nodeType'),
    _supports = require('../supports');

var _selectorBlackList = ['.', '#', '', ' '];

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
        result = [];

    // Early return if the selector is bad
    if (_selectorBlackList.indexOf(selector) > -1) { return result; }

    for (; idx < length; idx++) {
        var ret = _findQuery(selector, context[idx]);
        if (ret) { result.push(ret); }
    }

    // TODO: I think this needs to be flattened, but not sure
    return _array.unique(_.flatten(result));
};

var _findQuery = function(selector, context) {
    context = context || document;


    var nodeType;
    // Early return if context is not an element or document
    if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

    var query = context.querySelectorAll(selector);
    if (!query.length) { return; }
    return _array.slice(query);
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
                .args(String)
                .use(function(selector) {
                    // TODO: Internal "every"
                    return DOM(
                        _.every(this, function(elem) {
                            return _isMatch(elem, selector);
                        })
                    );
                })
                .args(Function)
                .use(function(iterator) {
                    // TODO: Internal "every"
                    return DOM(
                        _.every(this, iterator)
                    );
                })
                .expose(),

        not: function() {},

        find: Overload()
                .args(String)
                .use(function(selector) {

                    return _utils.merge(DOM(), _find(selector, this));

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

                        return DOM(result);
                    })
                    .expose()
    }
};