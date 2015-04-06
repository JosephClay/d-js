var _         = require('underscore'),
    
    exists       = require('is/exists'),
    isD          = require('is/d'),
    isElement    = require('is/element'),
    isHtml       = require('is/html'),
    isString     = require('is/string'),
    isNodeList   = require('is/nodeList'),
    isNumber     = require('is/number'),
    isFunction   = require('is/function'),
    isCollection = require('is/collection'),
    isD          = require('is/d'),
    isWindow     = require('is/window'),
    isDocument   = require('is/document'),

    _selector = require('./selectors'),
    _array    = require('./array'),
    _order    = require('../order'),

    _data     = require('./data'),

    parser    = require('./parser/parser'),
    utils     = require('../utils');

var _empty = function(arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {

            var elem = arr[idx],
                descendants = elem.querySelectorAll('*'),
                i = descendants.length,
                desc;
            while (i--) {
                desc = descendants[i];
                _data.remove(desc);
            }

            elem.innerHTML = '';
        }
    },

    _remove = function(arr) {
        var idx = 0, length = arr.length,
            elem, parent;
        for (; idx < length; idx++) {
            elem = arr[idx];
            if (elem && (parent = elem.parentNode)) {
                _data.remove(elem);
                parent.removeChild(elem);
            }
        }
    },

    _detach = function(arr) {
        var idx = 0, length = arr.length,
            elem, parent;
        for (; idx < length; idx++) {
            elem = arr[idx];
            if (elem && (parent = elem.parentNode)) {
                parent.removeChild(elem);
            }
        }
    },

    _clone = function(elem) {
        return elem.cloneNode(true);
    },

    _stringToFrag = function(str) {
        var frag = document.createDocumentFragment();
        frag.textContent = str;
        return frag;
    },

    _appendPrependFunc = function(d, fn, pender) {
        _.each(d, function(elem, idx) {
            var result = fn.call(elem, idx, elem.innerHTML);

            if (!exists(result)) {

                // do nothing

            } else if (isString(result)) {

                if (utils.isHTML(elem)) {
                    _appendPrependArrayToElem(elem, parser.parseHtml(elem), pender);
                    return this;
                }

                pender(elem, _stringToFrag(result));

            } else if (isElement(result)) {

                pender(elem, result);

            } else if (isNodeList(result) || isD(result)) {

                _appendPrependArrayToElem(elem, result, pender);

            } else {
                // do nothing
            }
        });
    },
    _appendPrependMergeArray = function(arrOne, arrTwo, pender) {
        var idx = 0, length = arrOne.length;
        for (; idx < length; idx++) {
            var i = 0, len = arrTwo.length;
            for (; i < len; i++) {
                pender(arrOne[idx], arrTwo[i]);
            }
        }
    },
    _appendPrependElemToArray = function(arr, elem, pender) {
        _.each(arr, function(arrElem) {
            pender(arrElem, elem);
        });
    },
    _appendPrependArrayToElem = function(elem, arr, pender) {
        _.each(arr, function(arrElem) {
            pender(elem, arrElem);
        });
    },

    _append = function(base, elem) {
        if (!base || !elem || !isElement(elem)) { return; }
        base.appendChild(elem);
    },
    _prepend = function(base, elem) {
        if (!base || !elem || !isElement(elem)) { return; }
        base.insertBefore(elem, base.firstChild);
    };

module.exports = {
    append  : _append,
    prepend : _prepend,

    fn: {
        clone: function() {
            return _.fastmap(this.slice(), function(elem) {
                return _clone(elem);
            });
        },

        append: function(value) {
            if (isString(value)) {
                if (isHtml(value)) {
                    _appendPrependMergeArray(this, parser.parseHtml(value), _append);
                    return this;
                }

                _appendPrependElemToArray(this, _stringToFrag(value), _append);

                return this;
            }

            if (isNumber(value)) {
                _appendPrependElemToArray(this, _stringToFrag('' + value), _append);
                return this;
            }

            if (isFunction(value)) {
                var fn = value;
                _appendPrependFunc(this, fn, _append);
                return this;
            }

            if (isElement(value)) {
                var elem = value;
                _appendPrependElemToArray(this, elem, _append);
                return this;
            }

            if (isCollection(value)) {
                var arr = value;
                _appendPrependMergeArray(this, arr, _append);
                return this;
            }
        },

        // TODO: These methods
        before: function() { return this; },
        after: function() { return this; },
        insertBefore: function() { return this; },
        insertAfter: function() { return this; },

        appendTo: function(d) {
            if (isD(d)) {
                d.append(this);
                return this;
            }

            // fallback
            var obj = d;
            D(obj).append(this);
            return this;
        },

        prepend: function(value) {
            if (isString(value)) {
                if (isHtml(value)) {
                    _appendPrependMergeArray(this, parser.parseHtml(value), _prepend);
                    return this;
                }

                _appendPrependElemToArray(this, _stringToFrag(value), _prepend);

                return this;
            }
        
            if (isNumber(value)) {
                _appendPrependElemToArray(this, _stringToFrag('' + value), _prepend);
                return this;
            }
        
            if (isFunction(value)) {
                var fn = value;
                _appendPrependFunc(this, fn, _prepend);
                return this;
            }
        
            if (isElement(value)) {
                var elem = value;
                _appendPrependElemToArray(this, elem, _prepend);
                return this;
            }
        
            if (isCollection(value)) {
                var arr = value;
                _appendPrependMergeArray(this, arr, _prepend);
                return this;
            }

            // fallback
            return this;
        },

        prependTo: function(d) {
            if (isD(d)) {
                d.prepend(this);
                return this;
            }

            // fallback
            var obj = d;
            D(obj).prepend(this);
            return this;
        },

        empty: function() {
            _empty(this);
            return this;
        },

        add: function(selector) {
            // String selector
            if (isString(selector)) {
                var elems = _array.unique(
                    [].concat(this.get(), D(selector).get())
                );
                _order.sort(elems);
                return D(elems);
            }

            // Array of elements
            if (isCollection(selector)) {
                var arr = selector;
                var elems = _array.unique(
                    [].concat(this.get(), _.toArray(arr))
                );
                _order.sort(elems);
                return D(elems);
            }

            // Single element
            if (isWindow(selector) || isDocument(selector) || isElement(selector)) {
                var elem = selector;
                var elems = _array.unique(
                    [].concat(this.get(), [ elem ])
                );
                _order.sort(elems);
                return D(elems);
            }

            // fallback
            return D(this);
        },

        remove: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return; }
                var arr = _selector.filter(this, selector);
                _remove(arr);
                return this;
            }

            // fallback
            _remove(this);
            return this;
        },

        detach: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return; }
                var arr = _selector.filter(this, selector);
                _detach(arr);
                return this;
            }

            // fallback
            _detach(this);
            return this;
        }
    }
};
