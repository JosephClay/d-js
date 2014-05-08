var _ = require('_'),
    _regex = require('../../regex'),
    _cache = require('../../cache'),

    _queryCache = _cache(),
    _querySelectorCache = _cache();

var _ID_PREFIX = 'D-uniqueId-',
    _selectorBlackList = ['.', '#', '', ' '],

    _determineMethod = function(selector) {
        var method = _querySelectorCache.get(selector);
        if (method) { return method; }

        if (_regex.selector.isStrictId(selector)) {
            method = 'getElementById';
        } else if (_regex.selector.isClass(selector)) {
            method = 'getElementsByClassName';
        } else if (_regex.selector.isTag(selector)) {
            method = 'getElementsByTagName';
        } else {
            method = 'querySelectorAll';
        }

        _querySelectorCache.set(selector, method);
        return method;
    };

var Query = function(str) {
    var selector = _.trim(str),
        isBlackList = (_selectorBlackList.indexOf(selector) > -1),
        isChildOrSiblingSelect = (selector[0] === '>' || selector[0] === '+'),
        method = (isBlackList || isChildOrSiblingSelect) ? 'querySelectorAll' : _determineMethod(selector);

    this.str = str;
    this.selector = selector;
    this.isBlackList = isBlackList;
    this.isChildOrSiblingSelect = isChildOrSiblingSelect;
    this.method = method;
};

Query.prototype = {
    uniqueId: function() {
        return _ID_PREFIX + _.uniqueId();
    },

    tailorChildSelector: function(id, selector) {
        return '#' + id + ' ' + selector;
    }
};

module.exports = function(str) {
    return _queryCache.getOrSet(str, function() {
        return new Query(str);
    });
};