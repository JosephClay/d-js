var _            = require('_'),
    D            = require('../D'),
    exists       = require('is/exists'),
    isD          = require('is/D'),
    isElement    = require('is/element'),
    isHtml       = require('is/html'),
    isString     = require('is/string'),
    isNodeList   = require('is/nodeList'),
    isNumber     = require('is/number'),
    isFunction   = require('is/function'),
    isCollection = require('is/collection'),
    isD          = require('is/D'),
    isWindow     = require('is/window'),
    isDocument   = require('is/document'),
    selectors    = require('./selectors'),
    array        = require('./array'),
    order        = require('../order'),
    data         = require('./data'),
    parser       = require('parser');

var empty = function(arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {

            var elem = arr[idx],
                descendants = elem.querySelectorAll('*'),
                i = descendants.length,
                desc;
            while (i--) {
                desc = descendants[i];
                data.remove(desc);
            }

            elem.innerHTML = '';
        }
    },

    remove = function(arr) {
        var idx = 0, length = arr.length,
            elem, parent;
        for (; idx < length; idx++) {
            elem = arr[idx];
            if (elem && (parent = elem.parentNode)) {
                data.remove(elem);
                parent.removeChild(elem);
            }
        }
    },

    detach = function(arr) {
        var idx = 0, length = arr.length,
            elem, parent;
        for (; idx < length; idx++) {
            elem = arr[idx];
            if (elem && (parent = elem.parentNode)) {
                parent.removeChild(elem);
            }
        }
    },

    clone = function(elem) {
        return elem.cloneNode(true);
    },

    stringToFrag = function(str) {
        var frag = document.createDocumentFragment();
        frag.textContent = str;
        return frag;
    },

    appendPrependFunc = function(d, fn, pender) {
        _.each(d, function(elem, idx) {
            var result = fn.call(elem, idx, elem.innerHTML);

            // do nothing
            if (!exists(result)) { return; }

            if (isString(result)) {

                if (isHtml(elem)) {
                    appendPrependArrayToElem(elem, parser(elem), pender);
                    return this;
                }

                pender(elem, stringToFrag(result));

            } else if (isElement(result)) {

                pender(elem, result);

            } else if (isNodeList(result) || isD(result)) {

                appendPrependArrayToElem(elem, result, pender);

            }
            
            // do nothing
        });
    },
    appendPrependMergeArray = function(arrOne, arrTwo, pender) {
        var idx = 0, length = arrOne.length;
        for (; idx < length; idx++) {
            var i = 0, len = arrTwo.length;
            for (; i < len; i++) {
                pender(arrOne[idx], arrTwo[i]);
            }
        }
    },
    appendPrependElemToArray = function(arr, elem, pender) {
        _.each(arr, function(arrElem) {
            pender(arrElem, elem);
        });
    },
    appendPrependArrayToElem = function(elem, arr, pender) {
        _.each(arr, function(arrElem) {
            pender(elem, arrElem);
        });
    },

    append = function(base, elem) {
        if (!base || !elem || !isElement(elem)) { return; }
        base.appendChild(elem);
    },
    prepend = function(base, elem) {
        if (!base || !elem || !isElement(elem)) { return; }
        base.insertBefore(elem, base.firstChild);
    };

module.exports = {
    append  : append,
    prepend : prepend,

    fn: {
        clone: function() {
            return _.fastmap(this.slice(), (elem) => clone(elem));
        },

        append: function(value) {
            if (isString(value)) {
                if (isHtml(value)) {
                    appendPrependMergeArray(this, parser(value), append);
                    return this;
                }

                appendPrependElemToArray(this, stringToFrag(value), append);

                return this;
            }

            if (isNumber(value)) {
                appendPrependElemToArray(this, stringToFrag('' + value), append);
                return this;
            }

            if (isFunction(value)) {
                var fn = value;
                appendPrependFunc(this, fn, append);
                return this;
            }

            if (isElement(value)) {
                var elem = value;
                appendPrependElemToArray(this, elem, append);
                return this;
            }

            if (isCollection(value)) {
                var arr = value;
                appendPrependMergeArray(this, arr, append);
                return this;
            }
        },

        before: function(element) {
            var target = this[0];
            if (!target) { return this; }

            var parent = target.parentNode;
            if (!parent) { return this; }


            if (isElement(element) || isString(element)) {
                element = D(element);
            }

            if (isD(element)) {
                element.each(function() {
                    parent.insertBefore(this, target);
                });
            }

            // fallback
            return this;
        },

        after: function(element) {
            var target = this[0];
            if (!target) { return this; }

            var parent = target.parentNode;
            if (!parent) { return this; }

            if (isElement(element) || isString(element)) {
                element = D(element);
            }

            if (isD(element)) {
                element.each(function() {
                    parent.insertBefore(this, target.nextSibling);
                });
            }

            // fallback
            return this;
        },

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
                    appendPrependMergeArray(this, parser(value), prepend);
                    return this;
                }

                appendPrependElemToArray(this, stringToFrag(value), prepend);

                return this;
            }
        
            if (isNumber(value)) {
                appendPrependElemToArray(this, stringToFrag('' + value), prepend);
                return this;
            }
        
            if (isFunction(value)) {
                var fn = value;
                appendPrependFunc(this, fn, prepend);
                return this;
            }
        
            if (isElement(value)) {
                var elem = value;
                appendPrependElemToArray(this, elem, prepend);
                return this;
            }
        
            if (isCollection(value)) {
                var arr = value;
                appendPrependMergeArray(this, arr, prepend);
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
            empty(this);
            return this;
        },

        add: function(selector) {
            // String selector
            if (isString(selector)) {
                var elems = array.unique(
                    [].concat(this.get(), D(selector).get())
                );
                order.sort(elems);
                return D(elems);
            }

            // Array of elements
            if (isCollection(selector)) {
                var arr = selector;
                var elems = array.unique(
                    [].concat(this.get(), _.toArray(arr))
                );
                order.sort(elems);
                return D(elems);
            }

            // Single element
            if (isWindow(selector) || isDocument(selector) || isElement(selector)) {
                var elem = selector;
                var elems = array.unique(
                    [].concat(this.get(), [ elem ])
                );
                order.sort(elems);
                return D(elems);
            }

            // fallback
            return D(this);
        },

        remove: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return; }
                var arr = selectors.filter(this, selector);
                remove(arr);
                return this;
            }

            // fallback
            remove(this);
            return this;
        },

        detach: function(selector) {
            if (isString(selector)) {
                if (selector === '') { return; }
                var arr = selectors.filter(this, selector);
                detach(arr);
                return this;
            }

            // fallback
            detach(this);
            return this;
        }
    }
};
