(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _ = require('./_'),
    parser = require('./D/parser'),
    utils = require('./utils'),
    array = require('./modules/array'),
    onready = require('./modules/onready'),
    selectors = require('./modules/selectors'),
    transversal = require('./modules/transversal'),
    dimensions = require('./modules/dimensions'),
    css = require('./modules/css'),
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

    // Array of Elements or NodeList
    if (_.isArray(arg) || _.isNodeList(arg)) {
        utils.merge(this, arg);
        return;
    }

    // Document a ready
    if (_.isFunction(arg)) {
        onready(arg);
    }
};

var _hasMoreConflict = false,
    _prevjQuery,
    _prev$;

_.extend(DOM, parser.fn, {
    each:    array.each,
    map:     _.map,
    extend:  _.extend,
    forEach: _.each,

    noConflict: function() {
        if (_hasMoreConflict) {
            window.jQuery = _prevjQuery;
            window.$ = _prev$;

            _hasMoreConflict = false;
        }

        window.D = _prevD;
        return DOM;
    },

    moreConflict: function() {
        _hasMoreConflict = true;
        _prevjQuery = window.jQuery;
        _prev$ = window.$;
        window.jQuery = window.$ = DOM;
    }
});

var arrayProto = (function() {

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
    array.fn,
    selectors.fn,
    transversal.fn,
    dimensions.fn,
    css.fn,
    classes.fn,
    { constructor: DOM }
);

// Expose the prototype so that
// it can be hooked into for plugins
DOM.fn = DOM.prototype;

module.exports = window.D = DOM;


if (typeof define === 'function' && define.amd) {
    define('D', [], function() {
        return DOM;
    });
}

/*
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


    Dom.prototype = {




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



        on: function(eventName, callback) {
            _bind(this.elem, eventName, callback);
            return this;
        },

        off: function(eventName, callback) {
            _unbind(this.elem, eventName, callback);
            return this;
        }
    };
*/
},{"./D/parser":2,"./_":3,"./modules/array":6,"./modules/classes":7,"./modules/css":8,"./modules/dimensions":12,"./modules/onready":13,"./modules/selectors":14,"./modules/transversal":15,"./utils":19}],2:[function(require,module,exports){
var _parse = function(htmlStr) {
    var tmp = document.implementation.createHTMLDocument();
        tmp.body.innerHTML = htmlStr;
    return tmp.body.children;
};

var _parseHtml = function(str) {
    var result = _parse(str);
    if (!result || !result.length) { return null; }
    return D(result);
};

module.exports = {
    parseHtml: _parse,

    fn: {
        parseHtml: _parseHtml,
        // Because no one know what the case should be
        parseHTML: _parseHtml
    }
};

},{}],3:[function(require,module,exports){
var _id = 0,
    _toString = Object.prototype.toString,
    _stringProto = String.prototype,
    _rtrim = /^\s+|\s+$/g;

var _ = {
    uniqueId: function() {
        return _id++;
    },

    exists: function(obj) {
        return obj !== null && obj !== undefined;
    },

    trim: _stringProto.trim ?
            function(str) { return (str + '').trim(); } :
                function(str) { return (str + '').replace(_rtrim, ''); },

    parseInt: function(num) {
        return parseInt(num, 10);
    },

    coerceToNum: function(val) {
        return _.isNumber(val) ? val : // Its a number!
                _.isString(val) ? (_.parseInt(val) || 0) : // Avoid NaN
                0; // Default to zero
    },

    toPx: function(num) {
        return num + 'px';
    },

    isElement: function(obj) {
        return !!(obj && obj.nodeType === 1);
    },

    isArray: Array.isArray || function(obj) {
        return _toString.call(obj) === '[object Array]';
    },

    // NodeList check. For our purposes, a node list
    // and an HTMLCollection are the same
    isNodeList: function(obj) {
        return obj instanceof NodeList || obj instanceof HTMLCollection;
    },

    // Window check
    isWindow: function(obj) {
        return obj && obj === obj.window;
    },

    // Flatten that also checks if value is a NodeList
    flatten: function(arr) {
        var result = [];

        var idx = 0, length = arr.length,
            value;
        for (; idx < length; idx++) {
            value = arr[idx];

            if (_.isArray(value) || _isNodeList(value)) {
                _flatten(value, shallow, result);
            } else {
                result.push(value);
            }
        }

        return result;
    },

    // Concat flat for a single array of arrays
    concatFlat: (function(concat) {

        return function(nestedArrays) {
            return concat.apply([], nestedArrays);
        };

    }([].concat)),

    // No-context every; strip each()
    every: function(arr, iterator) {
        if (!_.exists(arr)) { return true; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (!iterator(value, idx)) { return false; }
        }

        return true;
    },

    // Faster extend; strip each()
    extend: function() {
        var args = arguments,
            obj = args[0],
            idx = 1, length = args.length;

        if (!obj) { return obj; }

        for (; idx < length; idx++) {
            var source = args[idx];
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        }

        return obj;
    },

    // Standard map
    map: function(arr, iterator) {
        var results = [];
        if (!arr) { return results; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            results.push(iterator(arr[idx], idx));
        }

        return results;
    },

    // Array-perserving map
    // http://jsperf.com/push-map-vs-index-replacement-map
    fastmap: function(arr, iterator) {
        if (!arr) { return []; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            arr[idx] = iterator(arr[idx], idx);
        }

        return arr;
    },

    filter: function(arr, iterator) {
        var results = [];
        if (!arr) { return results; }

        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            if (iterator(arr[idx], idx)) {
                results.push(value);
            }
        }

        return results;
    }
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
var types = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'],
    idx = types.length,
    generateCheck = function(name) {
        return function(obj) {
            return _toString.call(obj) === '[object ' + name + ']';
        };
    },
    name;
while (idx--) {
    var name = types[idx];
    _['is' + name] = generateCheck(name);
}

// Optimize `isFunction` if appropriate.
if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
        return typeof obj === 'function';
    };
}

// Optimize `isString` if appropriate.
if (typeof ('') === 'string') {
    _.isString = function(obj) {
        return typeof obj === 'string';
    };
}

module.exports = _;
},{}],4:[function(require,module,exports){
var _ = require('./_');

var _cache = {};

var getterSetter = function(key) {

    var ref = (_cache[key] = {});

    return {
        get: function(key) {
            return ref[key];
        },
        set: function(key, value) {
            ref[key] = value;
            return value;
        },
        getOrSet: function(key, fn) {
            var cachedVal = ref[key];
            if (cachedVal !== undefined) { return cachedVal; }
            return (ref[key] = fn());
        }
    };
};

module.exports = (function() {

    var exp = getterSetter(''),
        caches = [
            'classArray',
            'classMap',
            'selector',
            'selectedTestId',
            'selectedTestTag',
            'selectedTestClass',
            'camelCase',
            'display'
        ],
        idx = caches.length;

    while (idx--) {
        exp[caches[idx]] = getterSetter(_.uniqueId());
    }

    return exp;

}());

},{"./_":3}],5:[function(require,module,exports){
var div = document.createElement('div');
div.cssText = 'opacity:.55';
module.exports = div;
},{}],6:[function(require,module,exports){
var _ = require('../_'),
    _utils = require('../utils');

var _slice = (function(_slice) {
    return function(arr, start, end) {
        // Exit early for empty array
        if (!arr || !arr.length) { return []; }

        // End, naturally, has to be higher than 0 to matter,
        // so a simple existance check will do
        if (end) { return _slice.call(arr, start, end); }

        return _slice.call(arr, start || 0);
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

var _unique = function(results) {
    var hasDuplicates = _elementSort(results);
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
};

var _map = function(arr, iterator) {
    var results = [];
    if (!arr.length || !iterator) { return results; }
    
    var idx = 0, length = arr.length,
        item;
    for (; idx < length; idx++) {
        item = arr[idx];
        results.push(iterator.call(item, item, idx));
    }

    return _.concatFlat(results);
};

var _each = function(arr, iterator) {
    if (!arr.length || !iterator) { return; }
    
    var idx = 0, length = arr.length,
        item;
    for (; idx < length; idx++) {
        item = arr[idx];
        if (iterator.call(item, item, idx) === false) { return; }
    }
};

module.exports = {
    slice: _slice,
    elementSort: _elementSort,
    unique: _unique,
    each: _each,

    fn: {
        at: function(index) {
            return this[+index];
        },

        get: function(index) {
            // No index, return all
            if (!_utils.exists(index)) { return this.toArray(); }

            index = +index;

            // Looking to get an index from the end of the set
            if (index < 0) { index = (this.length + index); }

            return this[index];
        },

        eq: function(index) {
            return D(this.get(index));
        },

        slice: function(start, end) {
            return D(_slice(this.toArray(), start, end));
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
        },

        map: function(iterator) {
            return D(_map(this, iterator));
        },
        
        each: function(iterator) {
            _each(this, iterator);
            return this;
        },

        forEach: function(iterator) {
            _each(this, iterator);
            return this;
        }
    }
};
},{"../_":3,"../utils":19}],7:[function(require,module,exports){
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
},{"../supports":18,"./array":6}],8:[function(require,module,exports){
var _supports = require('../supports');

var _swapSettings = {
    measureDisplay: {
        display: 'block',
        position: 'absolute',
        visibility: 'hidden'
    }
};

var _hide = function(elem) {
        elem.style.display = 'none';
    },
    _show = function(elem) {
        elem.style.display = '';
    },

    _cssSwap = function(elem, options, callback) {
        var old = {};

        // Remember the old values, and insert the new ones
        var name;
        for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
        }

        var ret = callback(elem);

        // Revert the old values
        for (name in options) {
            elem.style[name] = old[name];
        }

        return ret;
    };

var _computedStyle = (function() {
    return _supports.currentStyle ?
        function(elem) { return elem.currentStyle; } :
            // Avoids an "Illegal Invocation" error
            function(elem) { return window.getComputedStyle(elem); };
}());

var _hooks = {
    opacity: require('./cssHooks/opacity'),
    width: require('./cssHooks/width'),
    height: require('./cssHooks/height')
};

var _setStyle = function(elem, name, value) {
    if (_hooks[name]) {
        return _hooks[name].set(elem, value);
    }

};

module.exports = {
    swap: _cssSwap,
    swapSetting: _swapSettings,
    getComputedStyle: _computedStyle,

    fn: {
        // TODO: Css
        css: Overload().args(String, String)
                        .use(function(name, value) {
                            var idx = 0, length = this.length;
                            for (; idx < length; idx++) {
                                // this[idx]
                            }

                        })
                        .args(String, Number)
                        .use(function() {})
                        .args(Array)
                        .use(function() {})
                        .args(Object)
                        .use(function() {})
                        .expose(),

        hide: function() {
            var idx = 0, length = this.length;
            for (; idx < length; idx++) {
                _hide(this[idx]);
            }
            return this;
        },
        show: function() {
            var idx = 0, length = this.length;
            for (; idx < length; idx++) {
                _show(this[idx]);
            }
            return this;
        },

        // TODO: Toggle
        toggle: function() {

        }
    }
};

},{"../supports":18,"./cssHooks/height":9,"./cssHooks/opacity":10,"./cssHooks/width":11}],9:[function(require,module,exports){
module.exports = {
    get: function( elem, computed, extra ) {
        if ( computed ) {
            // certain elements can have dimension info if we invisibly show them
            // however, it must have a current display style that would benefit from this
            return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
                jQuery.swap( elem, cssShow, function() {
                    return getWidthOrHeight( elem, name, extra );
                }) :
                getWidthOrHeight( elem, name, extra );
        }
    },

    set: function( elem, value, extra ) {
        var styles = extra && getStyles( elem );
        return setPositiveNumber( elem, value, extra ?
            augmentWidthOrHeight(
                elem,
                name,
                extra,
                support.boxSizing() && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
                styles
            ) : 0
        );
    }
};
},{}],10:[function(require,module,exports){
var _regex = require('../../regex'),
    _supports = require('../../supports');

if (_supports.opacity) { return; }

module.exports = {
    get: function(elem) {
        // IE uses filters for opacity
        var style = _supports.currentStyle ? elem.currentStyle.filter : elem.style.filter;
        return _regex.opacity.test(style || '') ?
                    (0.01 * parseFloat(RegExp.$1)) + '' :
                        '1';
    },

    set: function(elem, value) {
        var style = elem.style,
            currentStyle = elem.currentStyle,
            filter = currentStyle && currentStyle.filter || style.filter || '';

        // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
        // if value === '', then remove inline opacity #12685
        if (value >= 1 || value === '' && _.trim(filter.replace(_regex.alpha, '')) === '') {

            // Setting style.filter to null, '' & ' ' still leave 'filter:' in the cssText
            // if 'filter:' is present at all, clearType is disabled, we want to avoid this
            // style.removeAttribute is IE Only, but so apparently is this code path...
            style.removeAttribute('filter');

            // if there is no filter style applied in a css rule or unset inline opacity, we are done
            if (value === '' || _supports.currentStyle && !currentStyle.filter) { return; }
        }

        // IE has trouble with opacity if it does not have layout
        // Force it by setting the zoom level.. but only if we're
        // applying a value (below)
        style.zoom = 1;

        // Only calculate the opacity if we're setting a value (below)
        var opacity = (_.isNumber(value) ? 'alpha(opacity=' + (value * 100) + ')' : '');

        style.filter = _regex.alpha.test(filter) ?
            // replace "alpha(opacity)" in the filter definition
            filter.replace(_regex.alpha, opacity) :
            // append "alpha(opacity)" to the current filter definition
            filter + ' ' + opacity;
    }
};

},{"../../regex":17,"../../supports":18}],11:[function(require,module,exports){
module.exports=require(9)
},{}],12:[function(require,module,exports){
var _ = require('../_'),
    _div = require('../div'),
    _regex = require('../regex'),
    _nodeType = require('../nodeType'),

    _css = require('./css');

var _getDocumentDimension = function(elem, name) {
        // Either scroll[Width/Height] or offset[Width/Height] or
        // client[Width/Height], whichever is greatest
        var doc = elem.documentElement;
        return Math.max(
            elem.body['scroll' + name],
            elem.body['offset' + name],

            doc['scroll' + name],
            doc['offset' + name],

            doc['client' + name]
        );
    },

    _getWidth = function(elem) {
        if (_.isWindow(elem)) {
            return elem.document.documentElement.clientWidth;
        }

        if (elem.nodeType === _nodeType.DOCUMENT) {
            return _getDocumentDimension(elem, 'Width');
        }

        var width = elem.offsetWidth;
        return (width === 0 &&
                _regex.display.isNoneOrTable(_css.getComputedStyle(elem).display)) ?
                    _css.swap(elem, _css.swapSetting.measureDisplay, function() { return elem.offsetWidth; }) :
                        width;
    },
    _setWidth = function(elem, val) {
        elem.style.width = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
    },

    _getHeight = function(elem) {
        if (_.isWindow(elem)) {
            return elem.document.documentElement.clientHeight;
        }

        if (elem.nodeType === _nodeType.DOCUMENT) {
            return _getDocumentDimension(elem, 'Height');
        }

        var height = elem.offsetHeight;
        return (height === 0 &&
                _regex.display.isNoneOrTable(_css.getComputedStyle(elem).display)) ?
                    _css.swap(elem, _css.swapSetting.measureDisplay, function() { return elem.offsetHeight; }) :
                        height;
    },
    _setHeight = function(elem, val) {
        elem.style.height = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
    },

    _getInnerWidth = function(elem) {
        var width = _getWidth(elem),
            style = _css.getComputedStyle(elem);

        return width + _.parseInt(style.paddingLeft) + _.parseInt(style.paddingRight);
    },
    _getInnerHeight = function(elem) {
        var height = _getHeight(elem),
            style = _css.getComputedStyle(elem);

        return height + _.parseInt(style.paddingTop) + _.parseInt(style.paddingBottom);
    },

    _getOuterWidth = function(elem, withMargin) {
        var width = _getInnerWidth(elem),
            style = _css.getComputedStyle(elem);

        if (withMargin) {
            width += _.parseInt(style.marginLeft) + _.parseInt(style.marginRight);
        }

        return width + _.parseInt(style.borderLeftWidth) + _.parseInt(style.borderRightWidth);
    },
    _getOuterHeight = function(elem, withMargin) {
        var height = _getInnerHeight(elem),
            style = _css.getComputedStyle(elem);

        if (withMargin) {
            height += _.parseInt(style.marginTop) + _.parseInt(style.marginBottom);
        }

        return height + _.parseInt(style.borderTopWidth) + _.parseInt(style.borderBottomWidth);
    };

// TODO: Overload
module.exports = {
    fn: {
        width: function(val) {
            var elem = this[0], // The first elem
                valExists = _.exists(val);
            if (!elem && !valExists) { return null; }
            if (!elem) { return this; }

            if (valExists) {
                _setWidth(elem, val);
                return this;
            }

            return _getWidth(elem);
        },

        height: function(val) {
            var elem = this[0], // The first elem
                valExists = _.exists(val);
            if (!elem && !valExists) { return null; }
            if (!elem) { return this; }

            if (valExists) {
                _setHeight(elem, val);
                return this;
            }

            return _getHeight(elem);
        },

        innerWidth: function() {
            var elem = this[0];
            if (!elem) { return this; }

            return _getInnerWidth(elem);
        },

        innerHeight: function() {
            var elem = this[0];
            if (!elem) { return this; }

            return _getInnerHeight(elem);
        },

        outerWidth: function(withMargin) {
            var elem = this[0];
            if (!elem) { return this; }

            return _getOuterWidth(elem, withMargin);
        },
        outerHeight: function(withMargin) {
            var elem = this[0];
            if (!elem) { return this; }

            return _getOuterHeight(elem, withMargin);
        }
    }
};

},{"../_":3,"../div":5,"../nodeType":16,"../regex":17,"./css":8}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
var _utils = require('../utils'),
    _cache = require('../cache'),
    _regex = require('../regex'),
    _array = require('./array'),
    _nodeType = require('../nodeType'),
    _supports = require('../supports'),

    _selectorBlackList = ['.', '#', '', ' '];

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

    var method = _determineMethod(selector);
    for (; idx < length; idx++) {
        var ret = _findQuery(selector, context[idx], method);
        if (ret) { result.push(ret); }
    }

    // TODO: I think this needs to be flattened, but not sure - double check
    return _array.unique(_.flatten(result));
};

var _determineMethod = function(selector) {
    var method = _cache.selector.get(selector);
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

    _cache.selector.set(selector, method);
    return method;
};

var _findQuery = function(selector, context, method) {
    context = context || document;

    var nodeType;
    // Early return if context is not an element or document
    if ((nodeType = context.nodeType) !== _nodeType.ELEMENT && nodeType !== _nodeType.DOCUMENT) { return; }

    var query = context[method](selector);
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
},{"../cache":4,"../nodeType":16,"../regex":17,"../supports":18,"../utils":19,"./array":6}],15:[function(require,module,exports){
var _array = require('./array'),
    _selectors = require('./selectors');

var _getSiblings = function(context) {
    var idx = 0,
        length = context.length,
        result = [];
    for (; idx < length; idx++) {
        var sibs = _getNodeSiblings(context[idx]);
        if (sibs.length) { result.push(sibs); }
    }
    return _.flatten(result);
};
var _getNodeSiblings = function(node) {
    var siblings = _array.slice(node.parentNode.children),
        idx = siblings.length;

    while (idx--) {
        if (siblings[idx] === node) {
            siblings.splice(i, 1);
        }
    }

    return siblings;
};

// Parents ------
var _getParents = function(context) {
    var idx = 0,
        length = context.length,
        result = [];
    for (; idx < length; idx++) {
        var parents = _crawlUpNode(context[idx]);
        result.push(parents);
    }
    return _.flatten(result);
};

var _crawlUpNode = function(node) {
    var result = [],
        parent = node;
    while ((parent = _getNodeParent(parent))) {
        result.push(parent);
    }

    return result;
};

// Parent ------
var _getParent = function(context) {
    var idx = 0,
        length = context.length,
        result = [];
    for (; idx < length; idx++) {
        var parent = _getNodeParent(context[idx]);
        if (parent) { result.push(parent); }
    }
    return result;
};

// Safely get parent node
var _getNodeParent = function(node) {
    return node && node.parentNode;
};

module.exports = {
    fn: {
        // TODO: Filter by selector
        closest: function(selector) {

        },

        siblings: function(selector) {
            return D(
                _selectors.filter(_getSiblings(this), selector)
            );
        },

        parents: function(selector) {
            return D(
                _selectors.filter(_getParents(this), selector)
            );
        },

        parent: function(selector) {
            return D(
                _selectors.filter(_getParent(this), selector)
            );
        },

        children: function(selector) {
            return D(
                _selectors.filter(_getChildren(this), selector)
            );
        }
    }
};

},{"./array":6,"./selectors":14}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
var _cache = require('./cache');

    // Matches "-ms-" so that it can be changed to "ms-"
var _TRUNCATE_MS_PREFIX = /^-ms-/,

    // Matches dashed string for camelizing
    _DASH_CATCH = /-([\da-z])/gi,

    // Matches "none" or a table type e.g. "table",
    // "table-cell" etc...
    _NONE_OR_TABLE = /^(none|table(?!-c[ea]).+)/,

    _SELECTOR_TEST = {
        id:    /^#([\w-]+)$/,
        tag:   /^[\w-]+$/,
        klass: /^\.([\w-]+)$/
    };

var _camelCase = function(match, letter) {
    return letter.toUpperCase();
};

module.exports = {
    alpha: /alpha\([^)]*\)/i,
    opacity: /opacity\s*=\s*([^)]*)/,

    camelCase: function(str) {
        return _cache.camelCase.getOrSet(str, function() {
            return string.replace(_TRUNCATE_MS_PREFIX, 'ms-').replace(_DASH_CATCH, _camelCase);
        });
    },

    display: {
        isNoneOrTable: function(str) {
            return _cache.display.getOrSet(str, function() {
                return !!_NONE_OR_TABLE.exec(str);
            });
        }
    },

    selector: {
        isStrictId: function(str) {
            return _cache.selectedTestId.getOrSet(str, function() {
                var result = _SELECTOR_TEST.id.exec(str);
                return result ? !result[1] : false;
            });
        },
        isTag: function(str) {
            return _cache.selectedTestTag.getOrSet(str, function() {
                var result = _SELECTOR_TEST.tag.exec(str);
                return result ? !result[1] : false;
            });
        },
        isClass: function(str) {
            return _cache.selectedTestClass.getOrSet(str, function() {
                var result = _SELECTOR_TEST.klass.exec(str);
                return result ? !result[1] : false;
            });
        }
    }
};
},{"./cache":4}],18:[function(require,module,exports){
var div = require('./div');

module.exports = {
    classList: !!div.classList,
    currentStyle: !!div.currentStyle,
    matchesSelector: div.matches ||
                        div.matchesSelector ||
                            div.msMatchesSelector ||
                                div.mozMatchesSelector ||
                                    div.webkitMatchesSelector ||
                                        div.oMatchesSelector,

    // Make sure that element opacity exists
    // (IE uses filter instead)
    // Use a regex to work around a WebKit issue. See #5145
    opacity: (/^0.55$/).test(div.style.opacity)
};
},{"./div":5}],19:[function(require,module,exports){
var _BEGINNING_NEW_LINES = /^[\n]*/;

module.exports = {
    exists: function(val) {
        return (val !== null && val !== undefined);
    },

    isHTML: function(text) {
        if (!_.isString(text)) { return false; }

        // TODO: Using es5 native method (trim)
        text = text.trim();
        text = text.replace(_BEGINNING_NEW_LINES, '');

        return (text.charAt(0) === '<' && text.charAt(text.length - 1) === '>' && text.length >= 3);
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

},{}]},{},[1])