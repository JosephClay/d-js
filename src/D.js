var _           = require('_'),
    isArrayLike = require('is/arrayLike'),
    isHtml      = require('is/html'),
    isString    = require('is/string'),
    isFunction  = require('is/function'),
    isD         = require('is/D'),
    parser      = require('parser'),
    onready     = require('onready'),
    Fizzle      = require('Fizzle');

var D = module.exports = function(selector, attrs) {
    return new Init(selector, attrs);
};

isD.set(D);

var Init = function(selector, attrs) {
    // nothin
    if (!selector) { return this; }

    // element or window (documents have a nodeType)
    if (selector.nodeType || selector === window) {
        this[0] = selector;
        this.length = 1;
        return this;
    }

    // HTML string
    if (isHtml(selector)) {
        _.merge(this, parser(selector));
        if (attrs) { this.attr(attrs); }
        return this;
    }
    
    // String
    if (isString(selector)) {
        // Selector: perform a find without creating a new D
        _.merge(this, Fizzle.query(selector).exec(this, true));
        return this;
    }

    // document ready
    if (isFunction(selector)) {
        onready(selector);
    }

    // Array of Elements, NodeList, or D object
    if (isArrayLike(selector)) {
        _.merge(this, selector);
        return this;
    }

    return this;
};
Init.prototype = D.prototype;