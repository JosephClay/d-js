var _ = require('./_'),
    parser = require('./D/parser'),
    utils = require('./utils'),
    array = require('./modules/array'),
    onready = require('./modules/onready'),
    selectors = require('./modules/selectors'),
    transversal = require('./modules/transversal'),
    dimensions = require('./modules/dimensions'),
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
    classes.fn,
    array.fn,
    selectors.fn,
    transversal.fn,
    dimensions.fn,
    { constructor: DOM }
);

// Expose the prototype so that
// it can be hooked into for plugins
DOM.fn = DOM.prototype;

module.exports = window.D = DOM;


/*if (typeof define === 'function' && define.amd) {
    define('D', [], function() {
        return DOM;
    });
}*/

/*

(function(root, _, document, undefined) {

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



    var Dom = root.D = function(elem) {
        if (!(this instanceof Dom)) { return new Dom(elem); }

        this.elem = (elem instanceof D) ? elem.elem : _.isString(elem) ? document.querySelectorAll(elem) : elem;
    };

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