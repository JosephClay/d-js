(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var parser = require('./D/parser'),
    utils = require('./utils'),
    array = require('./modules/array'),
    onready = require('./modules/onready'),
    selectors = require('./modules/selectors'),
    classes = require('./modules/classes');

// Store previous reference
var _prevD = window.D;

// Configure overload to throw type errors
Overload.prototype.err = function() {
    throw new TypeError();
};

var DOM = function(arg) {
    // Wasn't created with "new"
    if (!(this instanceof DOM)) { return new DOM(arg); }

    // Nothin
    if (!arg) { return; }

    // Element
    if (arg.nodeType || arg === window || arg === document) {
        this.push(arg);
        return;
    }

    // String
    if (_.isString(arg)) {

        // HTML string
        if (utils.isHTML(arg)) {
            utils.merge(this, parser.parseHtml(arg));
            return;
        }

        // Selector: perform a find without creating a new DOM
        utils.merge(this, selectors.find(arg, this));
        return;
    }

    // NodeList or Array of Elements
    // TODO: this is probably the wrong way to check if the item is a node list - fix
    if (_.isArray(arg)) {
        utils.merge(this, arg);
        return;
    }

    // Document a ready
    if (_.isFunction(arg)) {
        onready(arg);
    }
};

_.extend(DOM, parser.fn, {
    noConflict: function() {
        window.D = _prevD;
        return DOM;
    },

    moreConflict: function() {
        window.jQuery = window.$ = DOM;
    }
});

var arrayProto = (function() {
    // TODO: Implement forEach since forEach isn't in all browsers
    var keys = [
            'length',
            'toString',
            'toLocaleString',
            'join',
            'pop',
            'push',
            'concat',
            'reverse',
            'shift',
            'unshift',
            'slice',
            'splice',
            'sort',
            'some',
            'every',
            'indexOf',
            'lastIndexOf',
            'reduce',
            'reduceRight'
        ],
        idx = keys.length,
        obj = {};
    while (idx--) {
        obj[keys[idx]] = Array.prototype[keys[idx]];
    }

    return obj;

}());

_.extend(
    DOM.prototype,
    arrayProto,
    classes.fn,
    array.fn,
    { constructor: DOM }
);

module.exports = window.D = DOM;


/*if (typeof define === 'function' && define.amd) {
    define('D', [], function() {
        return DOM;
    });
}*/

/*

(function(root, _, document, undefined) {

        _getComputedStyle = root.getComputedStyle,

        _bind = function(elem, eventName, callback) {
            if (elem.addEventListener) {
                return elem.addEventListener(eventName, callback);
            }

            elem.attachEvent('on' + eventName, function() {
                callback.call(elem);
            });
        },

        _unbind = function(elem, eventName, callback) {
            if (elem.removeEventListener) {
                return elem.removeEventListener(eventName, callback);
            }

            elem.detachEvent('on' + eventName, callback);
        },

        _outerWidth = function(elem) {
            var width = elem.offsetWidth,
                style = elem.currentStyle || _getComputedStyle(elem);

            width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);

            return width;
        },

        _outerHeight = function(elem) {
            var height = elem.offsetHeight,
                style = elem.currentStyle || _getComputedStyle(elem);

            height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);

            return height;
        };

    var Dom = root.D = function(elem) {
        if (!(this instanceof Dom)) { return new Dom(elem); }

        this.elem = (elem instanceof D) ? elem.elem : _.isString(elem) ? document.querySelectorAll(elem) : elem;
    };

    _.extend(Dom, {
        toD: function(elements) {
            elements = (elements instanceof D) ? elements.elem : elements;
            if (!elements.length) { return []; }

            return _.map(elements, function(elem) {
                return new Dom(elem);
            });
        }
    });

    Dom.prototype = {

        hide: function() {
            this.elem.style.display = 'none';
            return this;
        },

        show: function() {
            this.elem.style.display = '';
            return this;
        },

        prepend: function(elem) {
            this.elem.insertBefore(elem, this.parent.firstChild);
            return this;
        },

        append: function(el) {
            this.elem.appendChild(el);
            return this;
        },

        clone: function() {
            return new Dom(this.elem.cloneNode(true));
        },

        empty: function() {
            while (this.elem.firstChild) {
                this.elem.removeChild(this.elem.firstChild);
            }
            return this;
        },

        remove: function() {
            this.elem.parentNode.removeChild(this.elem);
            return this;
        },

        text: function(str) {
            if (_.exists(str)) {
                this.elem.textContent = ('' + str);
                return this;
            }

            return this.elem.textContent;
        },

        parent: function() {
            return new Dom(this.elem.parentNode);
        },

        children: function() {
            return new Dom(this.elem.children);
        },

        attr: function(attr, value) {
            if (_exists(value)) {
                this.elem.setAttribute(attr, value);
                return this;
            }

            return this.elem.getAttribute(attr);
        },

        position: function() {
            return {
                left: this.elem.offsetLeft,
                top: this.elem.offsetTop
            };
        },

        html: function(str) {
            if (_exists(str)) {
                this.elem.innerHTML = ('' + str);
                return this;
            }

            return this.elem.innerHTML;
        },

        offset: function() {
            return this.elem.getBoundingClientRect();
        },

        width: function(val) {
            if (_exists(val)) {
                this.elem.style.width = _.isNumber(val) ? val + 'px' : val;
                return this;
            }

            return this.elem.offsetWidth;
        },

        height: function(val) {
            if (_exists(val)) {
                this.elem.style.height = _.isNumber(val) ? val + 'px' : val;
                return this;
            }

            return this.elem.offsetHeight;
        },

        outerWidth: function(withMargin) {
            return withMargin ? _outerWidth(this.elem) : this.elem.offsetWidth;
        },

        outerHeight: function(withMargin) {
            return withMargin ? _outerHeight(this.elem) : this.elem.offsetHeight;
        },

        on: function(eventName, callback) {
            _bind(this.elem, eventName, callback);
            return this;
        },

        off: function(eventName, callback) {
            _unbind(this.elem, eventName, callback);
            return this;
        }
    };

    return Dom;

}(this, _, document));
*/
},{"./D/parser":2,"./modules/array":4,"./modules/classes":5,"./modules/onready":6,"./modules/selectors":7,"./utils":10}],2:[function(require,module,exports){
var _parseHtml = function(htmlStr) {
    var tmp = document.implementation.createHTMLDocument();
        tmp.body.innerHTML = htmlStr;
    return tmp.body.children;
};

module.exports = {
    parseHtml: _parseHtml,

    fn: {
        parseHtml: function(str) {
            return DOM(_parseHtml(str));
        }
    }
};

},{}],3:[function(require,module,exports){
module.exports = document.createElement('div');
},{}],4:[function(require,module,exports){
var _slice = (function(_slice) {
    return function(arr, index) {
        // Exit early for empty array
        if (!arr || !arr.length) { return []; }

        // Make sure index is defined
        return _slice.call(arr, index || 0);
    };
}([].slice));

// See jQuery
// src\selector-native.js: 37
var _elementSort = (function() {

    var _hasDuplicate = false;
    var _sort = function(a, b) {
        // Flag for duplicate removal
        if (a === b) {
            _hasDuplicate = true;
            return 0;
        }

        var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition(b);

        // Not directly comparable, sort on existence of method
        if (!compare) { return a.compareDocumentPosition ? -1 : 1; }

        // Disconnected nodes
        if (compare & 1) {

            // Choose the first element that is related to our document
            if (a === document || b === document) { return 1; }

            // Maintain original order
            return 0;
        }

        return compare & 4 ? -1 : 1;
    };

    return function(array) {
        _hasDuplicate = false;
        array.sort(_sort);
        return _hasDuplicate;
    };

}());

module.exports = {
    slice: _slice,
    elementSort: _elementSort,

    fn: {
        at: function(index) {
            return this[+index];
        },
        get: function(index) {
            return this[+index];
        },
        eq: function(index) {
            return D(this[+index]);
        },
        slice: function(index) {
            return D(_slice(this, index));
        },
        next: function() {
            // TODO
        },
        prev: function() {
            // TODO
        },
        first: function() {
            return D(this[0]);
        },
        last: function() {
            return D(this[this.length - 1]);
        },
        toArray: function() {
            return _slice(this);
        }
    }
};

},{}],5:[function(require,module,exports){
var supports = require('../supports'),
    array = require('./array');


var _rspace = /\s+/g;

var _classArrayCache = {};
var _classMapCache = {};

var _isNotEmpty = function(str) { return str !== null && str !== undefined && str !== ''; };

// TODO: Implement internal cache
var _split = function(name) {
    if (_.isArray(name)) { return name; }
    return _classArrayCache[name] || (_classArrayCache[name] = _.chain(name.split(_rspace)).filter(_isNotEmpty).uniq().value());
};

var _modern = {
    hasClass: function(elem, name) {
        return elem.classList.contains(name);
    },

    addClass: function(elem, names) {
        elem.classList.add.apply(null, names);
    },

    removeClass: function(elem, names) {
        elem.classList.remove.apply(null, names);
    }
};

var _legacy = {
    hasClass: function(elem, name) {
        var elemClassNames = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            idx = elemClassNames.length;
        while (idx--) {
            if (elemClassNames[idx] === name) { return true; }
        }
        return false;
    },

    addClass: function(elem, names) {
        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
            nameIdx = elemClassNameArray.length,
            name,
            append = '';

        while (nameIdx--) {
            name = names[nameIdx];

            // Element already has this class name
            if (elemClassNameMap[name] !== undefined) { continue; }

            append += ' ' + name;
        }

        // Add all the class names in a single step
        elem.className += append;
    },

    removeClass: function(elem, names) {
        var elemClassNameArray = _classArrayCache[elem.className] || (_classArrayCache[elem.className] = _split(elem.className)),
            elemClassNameMap = _classMapCache[elem.className] || (_classMapCache[elem.className] = _.object(elemClassNameArray)),
            nameIdx = elemClassNameArray.length,
            name,
            newClasses = array.slice(elemClassNameArray);

        while (nameIdx--) {
            name = names[nameIdx];

            // Element has this class name
            if (elemClassNameMap[name] !== undefined) {
                newClasses.splice(nameIdx, 1);
                elem.className = newClasses.join(' ');
                return;
            }
        }
    }
};

var _impl = supports.classList ? _modern : _legacy;

var _classes = {
    hasClass: function(elems, names) {
        var numElems = elems.length,
            numNames = names.length,
            elemIdx = numElems,
            nameIdx,
            elem,
            name;

        while (elemIdx--) {
            elem = elems[elemIdx];

            nameIdx = numNames;
            while (nameIdx--) {
                name = names[nameIdx];

                if (_impl.hasClass(elem, name)) { return true; }
            }
        }

        return false;
    },

    addClass: function(elems, names) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.addClass(elems[elemIdx], names);
        }
    },

    removeClass: function(elems, names) {
        var elemIdx = elems.length;
        while (elemIdx--) {
            _impl.removeClass(elems[elemIdx], names);
        }
    },

    toggleClass: function() {}
};

module.exports = _.extend({}, _classes, {
    fn: {
        addClass: Overload()
            .args(String).use(function(name) {
                // TODO: Generalize this check?
                if (!this.length) { return this; }

                var names = _split(name);
                if (!names.length) { return this; }

                _classes.addClass(this._elems, names);

                return this;
            })
            .args(Array).use(function(names) {
                // TODO: Generalize this check?
                if (!this.length) { return this; }
                if (!names.length) { return this; }

                _classes.addClass(this._elems, names);

                return this;
            })
            .expose()
    }
});
},{"../supports":9,"./array":4}],6:[function(require,module,exports){
var _isReady = false,
    _registration = [];

var _bind = function(fn) {
    if (document.readyState === "complete") {
        return fn();
    }

    if (document.addEventListener) {
        return document.addEventListener('DOMContentLoaded', fn);
    }
    
    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'interactive') { fn(); }
    });
};

var _makeCalls = function() {
    var idx = 0,
        length = _registration.length;
    for (; idx < length; idx++) {
        _registration[idx]();
    }
    _registration.length = 0;
};

_bind(function() {
    if (_isReady) { return; }

    _isReady = true;
    _makeCalls();
});

module.exports = function(callback) {
    if (_isReady) {
        callback();
        return this;
    }

    _registration.push(callback);
    return this;
};

},{}],7:[function(require,module,exports){
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
    if (_selectorBlackList.indexOf(selector)) { return result; }

    for (; idx < length; idx++) {
        var ret = _findQuery(selector, context[idx]);
        if (ret) { result.push(ret); }
    }

    // TODO: I think this needs to be flattened, but not sure
    return _utils.unique(_.flatten(result));
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


module.exports = {
    find: _find,

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
},{"../nodeType":8,"../supports":9,"../utils":10,"./array":4}],8:[function(require,module,exports){
module.exports = {
    ELEMENT:                1,
    ATTRIBUTE:              2,
    TEXT:                   3,
    CDATA:                  4,
    ENTITY_REFERENCE:       5,
    ENTITY:                 6,
    PROCESSING_INSTRUCTION: 7,
    COMMENT:                8,
    DOCUMENT:               9,
    DOCUMENT_TYPE:          10,
    DOCUMENT_FRAGMENT:      11,
    NOTATION:               12
};
},{}],9:[function(require,module,exports){
var div = require('./div');

module.exports = {
    classList: !!div.classList,
    matchesSelector: div.matches || div.matchesSelector || div.msMatchesSelector || div.mozMatchesSelector || div.webkitMatchesSelector || div.oMatchesSelector
};
},{"./div":3}],10:[function(require,module,exports){
var array = require('./modules/array');

module.exports = {
    exists: function(val) {
        return (val !== null && val !== undefined);
    },

    isHTML: function(text) {
        return _.isString(text) && (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
    },

    unique: function(results) {
        var hasDuplicates = array.elementSort(results);
        if (!hasDuplicates) { return results; }

        var elem,
            idx = 0,
            // create the array here
            // so that a new array isn't
            // created/destroyed every unique call
            duplicates = [];

        // Go through the array and identify
        // the duplicates to be removed
        while ((elem = results[idx++])) {
            if (elem === results[idx]) {
                duplicates.push(idx);
            }
        }

        // Remove the duplicates from the results
        idx = duplicates.length;
        while (idx--) {
           results.splice(duplicates[idx], 1);
        }

        return results;
    },

    merge: function(first, second) {
        var length = second.length,
            idx = 0,
            i = first.length;

        // Go through each element in the
        // second array and add it to the
        // first
        for (; idx < length; idx++) {
            first[i++] = second[idx];
        }

        first.length = i;

        return first;
    }
};

},{"./modules/array":4}]},{},[1])