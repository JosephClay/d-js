var _ = require('_'),
    parser = require('../D/parser'),
    utils = require('../utils');

/*
var _empty = function(elem) {
        var child;
        while ((child = elem.firstChild)) {
            elem.removeChild(child);
        }
    },

    _clone = function(elem) {
        return elem.cloneNode(true);
    };
*/

var _clone = function(elem) {
        return elem.cloneNode(true);
    },

    _stringToFrag = function(str) {
        var frag = document.createDocumentFragment();
        frag.textContent = str;
        return frag;
    },

    _appendFunc = function(d, fn) {
        var idx = 0, length = d.length,
            elem, result;
        for (; idx < length; idx++) {
            elem = d[idx];
            result = fn.call(elem, idx, elem.innerHTML);

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
        }

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

    _appendElemToArr = function(arr, elem) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _appendElem(arr[idx], elem);
        }
    },

    _appendArrToElem = function(elem, arr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _appendElem(elem, arr[idx]);
        }
    },

    _appendElem = function(base, elem) {
        if (!base || !elem || !_.isElement(elem)) { return; }
        base.appendChild(elem);
    };

module.exports = {
    fn: {
        empty: function() {
            var idx = 0, length = this.length;
            for (; idx < length; idx++) {
                _empty(this[idx]);
            }
            return this;
        },

        // TODO: should this follow jQuery API?
        // http://api.jquery.com/clone/
        // .clone( [withDataAndEvents ] [, deepWithDataAndEvents ] )
        clone: function() {
            return _.fastmap(this.slice(), function(elem) {
                return _clone(elem);
            });
        },

        append: Overload().args(String).use(function(value) {
                            if (utils.isHtml(value)) {
                                _appendMergeArr(this, parser.parseHtml(value));
                                return this;
                            }

                            _appendElemToArr(this, _stringToFrag(value));

                            return this;
                        })

                        .args(Number).use(function(value) {
                            value = '' + value; // change to a string
                            _appendString(this, value);
                            return this;
                        })

                        .args(Array).use(function(arr) {
                            // TODO: Array
                            return this;
                        })

                        .args(Function).use(function(fn) {
                            _appendFunc(this, fn);
                            return this;
                        })

                        .fallback(function(elementOrD) {
                            if (_.isElement(elementOrD)) {
                                var elem = elementOrD;
                                _appendElemToArr(this, elem);
                            }

                            if (_.isNodeList(elementOrD) || elementOrD instanceof D) {
                                var otherArr = elementOrD;
                                _appendMergeArr(this, otherArr);
                            }

                            return this;
                        })

                        .expose(),

        appendTo: function(thing) {
            thing = (thing instanceof D) ? thing : D(thing);
            thing.append(this);
            return this;
        },

        // TODO: prepend
        prepend: function() {

        },

        prependTo: function(thing) {
            thing = (thing instanceof D) ? thing : D(thing);
            thing.prepend(this);
            return this;
        },
    }
};
