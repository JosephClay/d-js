define([
    'utils',
    'nodeType',
    'modules/array'
],
function(
    _utils,
    _nodeType,
    _array
) {

    var _isMatch = (function(_matcher) {
        if (_matcher) {
            return function(elem, selector) {
                return _matcher.call(elem, selector);
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
    }(DIV.matches || DIV.matchesSelector || DIV.msMatchesSelector || DIV.mozMatchesSelector || DIV.webkitMatchesSelector || DIV.oMatchesSelector));

    var _find = function(selector, context) {
        context = context || document;

        var nodeType;
        // Early return if context is not an element or document
        if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

        var query = context.querySelectorAll(selector);
        if (!query.length) { return; }
        return _utils.slice(query);
    };

    return {
        fn: {
            has: function() {},

            is: Overload()
                    .args(String)
                    .use(function(selector) {
                        return DOM(
                            _.every(this, function(elem) {
                                return _isMatch(elem, selector);
                            })
                        );
                    })
                    .args(Function)
                    .use(function(iterator) {
                        return DOM(
                            _.every(this, iterator)
                        );
                    })
                    .expose(),

            not: function() {},

            find: Overload()
                    .args(String)
                    .use(function(selector) {
                        var idx = 0,
                            length = this.length,
                            result = [];

                        for (; idx < length; idx++) {
                            var ret = _find(selector, this[idx]);
                            if (ret) { result.push(ret); }
                        }

                        // TODO: I think this needs to be flattened, but not sure
                        return _utils.merge(DOM(), _.flatten(result));

                    }).expose()
        }
    };
});