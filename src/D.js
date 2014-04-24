require([
    'window',
    'document',

    'overload',

    'D/parser',
    'D/conflict',

    'modules/classes'

], function(
    window,
    document,

    Overload,

    parser,
    conflict,

    classes
) {

    var _prevD = window.D;

    var DOM = function(selector) {
        if (!(this instanceof DOM)) { return new DOM(elem); }

        if (_.isString(selector)) {

            // If it's HTML, parse it into this
            if (_utils.isHTML(selector)) {
                _utils.merge(this, parser.parseHTML(selector));
                return;
            }

            // Perform a find without creating a new DOM
            _utils.merge(this, selectors.find(selector, this));
            return;
        }

        if (_.isArray(selector)) {
            var elements = selector;
            _utils.merge(this, elements);
            return;
        }

    };

    Overload.prototype.err = function() {
        throw new TypeError();
    };

    _.extend(DOM, parser.fn, conflict.fn);

    _.extend(DOM.prototype, Array.prototype, classes.fn);

    return DOM;

});

/*

(function(root, _, document, undefined) {

    var DIV = document.createElement('div'),

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