var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _selector = require('./selectors'),
    _array = require('./array'),
    _utils = require('../utils'),

    _data = require('./data'),

    parser = require('../D/parser'),
    utils = require('../utils');

var _empty = function(arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {

            var elem = arr[idx],
                descendants = elem.querySelectorAll('*'),
                i = descendants.length,
                desc;
            while (i--) {
                desc = descendants[i];
                _data.destroyData(desc);
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
                _data.destroyData(elem);
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

    _appendProcess = function(d, fn) {
        _.each(d, function(elem, idx) {
            var result = fn.call(elem, idx, elem.innerHTML);

            if (!_.exists(result)) {

                // do nothing

            } else if (_.isString(result)) {

                if (utils.isHTML(value)) {
                    _appendArrToElem(elem, parser.parseHtml(value));
                    return this;
                }

                _appendElem(elem, _stringToFrag(result));

            } else if (_.isElement(result)) {

                _appendElem(elem, result);

            } else if (_.isNodeList(result) || result instanceof D) {

                _appendArrToElem(elem, result);

            } else {
                // do nothing
            }
        });
    },

    _prependProcess = function(d, fn) {
        _.each(d, function(elem, idx) {
            var result = fn.call(elem, idx, elem.innerHTML);

            if (!_.exists(result)) {

                // do nothing

            } else if (_.isString(result)) {

                if (utils.isHTML(value)) {
                    _prependArrToElem(elem, parser.parseHtml(value));
                    return this;
                }

                _prependElem(elem, _stringToFrag(result));

            } else if (_.isElement(result)) {

                _prependElem(elem, result);

            } else if (_.isNodeList(result) || result instanceof D) {

                _prependArrToElem(elem, result);

            } else {
                // do nothing
            }
        });
    },

    _appendMergeArr = function(arrOne, arrTwo) {
        var idx = 0, length = arrOne.length;
        for (; idx < length; idx++) {
            var i = 0, len = arrTwo.length;
            for (; i < len; i++) {
                _appendElem(arrOne[idx], arrTwo[i]);
            }
        }
    },
    _prependMergeArr = function(arrOne, arrTwo) {
        var idx = 0, length = arrOne.length;
        for (; idx < length; idx++) {
            var i = 0, len = arrTwo.length;
            for (; i < len; i++) {
                _prependElem(arrOne[idx], arrTwo[i]);
            }
        }
    },

    _appendElemToArr = function(arr, elem) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _appendElem(arr[idx], elem);
        }
    },
    _prependElemToArr = function(arr, elem) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _prependElem(arr[idx], elem);
        }
    },

    _appendArrToElem = function(elem, arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _appendElem(elem, arr[idx]);
        }
    },
    _prependArrToElem = function(elem, arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _prependElem(elem, arr[idx]);
        }
    },

    _appendElem = function(base, elem) {
        if (!base || !elem || !_.isElement(elem)) { return; }
        base.appendChild(elem);
    },
    _prependElem = function(base, elem) {
        if (!base || !elem || !_.isElement(elem)) { return; }
        base.insertBefore(elem, base.firstChild);
    };

module.exports = {
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
                    _appendMergeArr(this, parser.parseHtml(value));
                    return this;
                }

                _appendElemToArr(this, _stringToFrag(value));

                return this;
            })

            .args(Number)
            .use(function(value) {
                value = '' + value; // change to a string
                _appendString(this, value);
                return this;
            })

            .args(Function)
            .use(function(fn) {
                _appendProcess(this, fn);
                return this;
            })

            .args(Element)
            .use(function(elem) {
                _appendElemToArr(this, elem);
                return this;
            })

            .args(O.any(Array, O.nodeList, O.D))
            .use(function(arr) {
                _appendMergeArr(this, arr);
                return this;
            })

            .expose(),

        // TODO: These methods
        before: function() {},
        after: function() {},
        insertBefore: function() {},
        insertAfter: function() {},

        appendTo: overload()
            .args(O.D)
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
                    _prependMergeArr(this, parser.parseHtml(value));
                    return this;
                }

                _prependElemToArr(this, _stringToFrag(value));

                return this;
            })

            .args(Number)
            .use(function(value) {
                value = '' + value; // change to a string
                _prependString(this, value);
                return this;
            })

            .args(Function)
            .use(function(fn) {
                _prependProcess(this, fn);
                return this;
            })

            .args(Element)
            .use(function(elem) {
                _prependElemToArr(this, elem);
                return this;
            })

            .args(O.any(Array, O.nodeList, O.D))
            .use(function(arr) {
                _prependMergeArr(this, arr);
                return this;
            })

            .expose(),

        prependTo: overload()
            .args(O.D)
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
            .args(String)
            .use(function(selector) {
                _array.unique(
                    _utils.merge(this, D(selector))
                );

                return this;
            })

            .args(O.any(Array, O.nodeList, O.D))
            .use(function(arr) {
                _array.unique(
                    _utils.merge(this, arr)
                );

                return this;
            })

            .args(O.any(window, Element, O.nodeList))
            .use(function(elem) {
                this.push(elem);
                _array.unique(this);

                return this;
            })
            .fallback(function() {
                return this;
            })
            .expose(),

        remove: overload()
            .args(String)
            .use(function() {
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
            .use(function() {
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
