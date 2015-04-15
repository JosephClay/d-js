var _           = require('_'),
    isArrayLike = require('is/arrayLike'),
    isHtml      = require('is/html'),
    isString    = require('is/string'),
    isFunction  = require('is/function'),
    isD         = require('is/D'),
    parser      = require('parser'),
    onready     = require('onready'),
    Fizzle      = require('Fizzle');

var Api = module.exports = function(selector, attrs) {
    return new D(selector, attrs);
};

isD.set(Api);

function D(selector, attrs) {
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
        return _.merge(this, Fizzle.query(selector).exec(this, true));
    }

    // document ready
    if (isFunction(selector)) {
        onready(selector);
        return this;
    }
    
    // Array of Elements, NodeList, or D object
    if (isArrayLike(selector)) {
        return _.merge(this, selector);
    }

    return this;
}
D.prototype = Api.prototype;