var _         = require('underscore'),
    overload  = require('overload-js'),
    o         = overload.o,

    _selector = require('./selectors'),
    _array    = require('./array'),
    _utils    = require('../utils'),
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

    // TODO: IE6-8 copies events bound via attachEvent when using cloneNode.
    //       See jquery.js:5401
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

            if (!_.exists(result)) {

                // do nothing

            } else if (_.isString(result)) {

                if (utils.isHTML(value)) {
                    _appendPrependArrayToElem(elem, parser.parseHtml(value), pender);
                    return this;
                }

                pender(elem, _stringToFrag(result));

            } else if (_.isElement(result)) {

                pender(elem, result);

            } else if (_.isNodeList(result) || result instanceof D) {

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
        if (!base || !elem || !_.isElement(elem)) { return; }
        base.appendChild(elem);
    },
    _prepend = function(base, elem) {
        if (!base || !elem || !_.isElement(elem)) { return; }
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

        append: overload()
            .args(String)
            .use(function(value) {
                if (utils.isHtml(value)) {
                    _appendPrependMergeArray(this, parser.parseHtml(value), _append);
                    return this;
                }

                _appendPrependElemToArray(this, _stringToFrag(value), _append);

                return this;
            })

            .args(Number)
            .use(function(value) {
                _appendPrependElemToArray(this, _stringToFrag('' + value), _append);
                return this;
            })

            .args(Function)
            .use(function(fn) {
                _appendPrependFunc(this, fn, _append);
                return this;
            })

            .args(Element)
            .use(function(elem) {
                _appendPrependElemToArray(this, elem, _append);
                return this;
            })

            .args(o.collection)
            .use(function(arr) {
                _appendPrependMergeArray(this, arr, _append);
                return this;
            })

            .expose(),

        // TODO: These methods
        before: function() { return this; },
        after: function() { return this; },
        insertBefore: function() { return this; },
        insertAfter: function() { return this; },

        appendTo: overload()
            .args(o.D)
            .use(function(d) {
                d.append(this);
                return this;
            })

            .fallback(function(obj) {
                D(obj).append(this);
                return this;
            })

            .expose(),

        prepend: overload()
            .args(String)
            .use(function(value) {
                if (utils.isHtml(value)) {
                    _appendPrependMergeArray(this, parser.parseHtml(value), _prepend);
                    return this;
                }

                _appendPrependElemToArray(this, _stringToFrag(value), _prepend);

                return this;
            })

            .args(Number)
            .use(function(value) {
                _appendPrependElemToArray(this, _stringToFrag('' + value), _prepend);
                return this;
            })

            .args(Function)
            .use(function(fn) {
                _appendPrependFunc(this, fn, _prepend);
                return this;
            })

            .args(Element)
            .use(function(elem) {
                _appendPrependElemToArray(this, elem, _prepend);
                return this;
            })

            .args(o.collection)
            .use(function(arr) {
                _appendPrependMergeArray(this, arr, _prepend);
                return this;
            })

            .expose(),

        prependTo: overload()
            .args(o.D)
            .use(function(d) {
                d.prepend(this);
                return this;
            })

            .fallback(function(obj) {
                D(obj).prepend(this);
                return this;
            })

            .expose(),

        empty: function() {
            _empty(this);
            return this;
        },

        add: overload()
            // String selector
            .args(String)
            .use(function(selector) {
                var elems = _array.unique(
                    [].concat(this.get(), D(selector).get())
                );
                _order.sort(elems);
                return D(elems);
            })

            // Array of elements
            .args(o.collection)
            .use(function(arr) {
                var elems = _array.unique(
                    [].concat(this.get(), _.toArray(arr))
                );
                _order.sort(elems);
                return D(elems);
            })

            // Single element
            .args(o.any(o.window, o.document, Element))
            .use(function(elem) {
                var elems = _array.unique(
                    [].concat(this.get(), [ elem ])
                );
                _order.sort(elems);
                return D(elems);
            })

            // Everything else
            .fallback(function() {
                return D(this);
            })

            .expose(),

        remove: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return; }
                var arr = _selector.filter(this, selector);
                _remove(arr);
                return this;
            })

            .fallback(function() {
                _remove(this);
                return this;
            })

            .expose(),

        detach: overload()
            .args(String)
            .use(function(selector) {
                if (selector === '') { return; }
                var arr = _selector.filter(this, selector);
                _detach(arr);
                return this;
            })

            .fallback(function() {
                _detach(this);
                return this;
            })

            .expose()
    }
};
