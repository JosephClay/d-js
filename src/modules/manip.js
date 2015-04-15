var _              = require('_'),
    D              = require('D'),
    exists         = require('is/exists'),
    isD            = require('is/D'),
    isElement      = require('is/element'),
    isHtml         = require('is/html'),
    isString       = require('is/string'),
    isNodeList     = require('is/nodeList'),
    isNumber       = require('is/number'),
    isFunction     = require('is/function'),
    isCollection   = require('is/collection'),
    isD            = require('is/D'),
    isWindow       = require('is/window'),
    isDocument     = require('is/document'),
    selectorFilter = require('./selectors/filter'),
    unique         = require('./array/unique'),
    order          = require('order'),
    data           = require('./data'),
    parser         = require('parser');

var parentLoop = function(iterator) {
    return function(elems) {
        return _.each(elems, function(elem) {
            var parent;
            if (elem && (parent = elem.parentNode)) {
                iterator(elem, parent);
            }
        });
    };
};

var remove = parentLoop(function(elem, parent) {
        data.remove(elem);
        parent.removeChild(elem);
    }),

    detach = parentLoop(function(elem, parent) {
        parent.removeChild(elem);
    }),

    stringToFragment = function(str) {
        var frag = document.createDocumentFragment();
        frag.textContent = '' + str;
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

                pender(elem, stringToFragment(result));
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

exports.fn = {
    clone: function() {
        return _.fastmap(this.slice(), (elem) => elem.cloneNode(true));
    },

    append: function(value) {
        if (isHtml(value)) {
            appendPrependMergeArray(this, parser(value), append);
            return this;
        }

        if (isString(value) || isNumber(value)) {
            appendPrependElemToArray(this, stringToFragment(value), append);
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
        var target = this[0],
            parent = target && target.parentNode;
        if (!target || !parent) { return this; }

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

    insertBefore: function(target) {
        if (!target) { return this; }

        if (isString(target)) {
            target = D(target)[0];
        }

        _.each(this, function(elem) {
            var parent = elem.parentNode;
            if (parent) {
                parent.insertBefore(target, elem.nextSibling);
            }
        });

        return this;
    },

    after: function(element) {
        var target = this[0],
            parent = target && target.parentNode;
        if (!target || !parent) { return this; }

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

    insertAfter: function(target) {
        if (!target) { return this; }

        if (isString(target)) {
            target = D(target)[0];
        }

        _.each(this, function(elem) {
            var parent = elem.parentNode;
            if (parent) {
                parent.insertBefore(elem, target);
            }
        });

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
        if (isHtml(value)) {
            appendPrependMergeArray(this, parser(value), prepend);
            return this;
        }
    
        if (isString(value) || isNumber(value)) {
            appendPrependElemToArray(this, stringToFragment(value), prepend);
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
        D(d).prepend(this);
        return this;
    },

    empty: function() {
        var elems = this,
            idx = 0, length = elems.length;
        for (; idx < length; idx++) {

            var elem = elems[idx],
                descendants = elem.querySelectorAll('*'),
                i = descendants.length,
                desc;
            while (i--) {
                desc = descendants[i];
                data.remove(desc);
            }

            elem.innerHTML = '';
        }
        return elems;
    },

    add: function(selector) {
        var elems = unique(
            this.get().concat(
                // string
                isString(selector) ? D(selector).get() :
                // collection
                isCollection(selector) ? _.toArray(selector) :
                // element
                isWindow(selector) || isDocument(selector) || isElement(selector) ? [ selector ] : []
            )
        );
        order.sort(elems);
        return D(elems);
    },

    remove: function(selector) {
        if (isString(selector)) {
            remove(selectorFilter(this, selector));
            return this;
        }

        // fallback
        return remove(this);
    },

    detach: function(selector) {
        if (isString(selector)) {
            detach(selectorFilter(this, selector));
            return this;
        }

        return detach(this);
    }
};
