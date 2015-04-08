var _ = require('_'),

    split      = require('util/split'),
    isArray    = require('is/array'),
    isHtml     = require('is/html'),
    isString   = require('is/string'),
    isNodeList = require('is/nodeList'),
    isFunction = require('is/function'),
    isD        = require('is/d'),

    parser      = require('./modules/parser/parser'),
    array       = require('./modules/array'),
    onready     = require('./modules/onready'),
    selectors   = require('./modules/selectors'),
    transversal = require('./modules/transversal'),
    dimensions  = require('./modules/dimensions'),
    manip       = require('./modules/manip'),
    css         = require('./modules/css'),
    attr        = require('./modules/attr'),
    prop        = require('./modules/prop'),
    val         = require('./modules/val'),
    position    = require('./modules/position'),
    classes     = require('./modules/classes'),
    data        = require('./modules/data'),
    events      = require('./modules/events'),
    Fizzle      = require('./modules/Fizzle');

var D = module.exports = function(selector, attrs) {
    return new Init(selector, attrs);
};

var Init = D.prototype.init = function(selector, attrs) {
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
        _.merge(this, parser.parseHtml(selector));
        if (attrs) { this.attr(attrs); }
        return this;
    }
    
    // String
    if (isString(selector)) {
        // Selector: perform a find without creating a new D
        _.merge(this, Fizzle.query(selector).exec(this, true));
        return this;
    }

    // Array of Elements, NodeList, or D object
    if (isArray(selector) || isNodeList(selector) || isD(selector)) {
        _.merge(this, selector);
        return this;
    }

    // document ready
    if (isFunction(selector)) {
        onready(selector);
    }
    return this;
};
Init.prototype = D.prototype;

_.extend(D,
    parser.D,
    data.D,
{
    Fizzle:  Fizzle,
    each:    array.each,
    forEach: array.each,

    map:     _.map,
    extend:  _.extend,

    moreConflict: function() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});

var arrayProto = split('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight|map|filter')
    .reduce(function(obj, key) {
        obj[key] = Array.prototype[key];
        return obj;
    }, {});

_.extend(
    D.prototype,
    { constructor: D, },
    arrayProto,
    array.fn,
    selectors.fn,
    transversal.fn,
    manip.fn,
    dimensions.fn,
    css.fn,
    attr.fn,
    prop.fn,
    val.fn,
    classes.fn,
    position.fn,
    data.fn,
    events.fn
);

// Expose the prototype so that
// it can be hooked into for plugins
D.fn = D.prototype;
