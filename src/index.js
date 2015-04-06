var _ = require('underscore'),

    isArray    = require('is/array'),
    isHtml     = require('is/html'),
    isString   = require('is/string'),
    isNodeList = require('is/nodeList'),
    isFunction = require('is/function'),
    isD        = require('is/d'),

    parser      = require('./modules/parser/parser'),
    utils       = require('./utils'),
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
    events      = require('./modules/event/api'),
    eventObj    = require('./modules/event/event'),
    deferred    = require('./modules/Deferred/Deferred'),
    when        = require('./modules/Deferred/when'),

    xaja        = require('xaja-js');

// Store previous reference
var _prevD = window.D;

var D = function(selector, attrs) {
    return new D.fn.init(selector, attrs);
};

var init = D.prototype.init = function(selector, attrs) {
    // Nothin
    if (selector === null || selector === undefined) { return this; }

    // Element
    if (selector.nodeType || selector === window) {
        this.push(selector);
        return this;
    }

    // String
    if (isString(selector)) {

        // HTML string
        if (isHtml(selector)) {
            utils.merge(this, parser.parseHtml(selector));
            if (attrs) { this.attr(attrs); }
            return this;
        }

        // Selector: perform a find without creating a new D
        utils.merge(this, selectors.find(selector, true));
        return this;
    }

    // Array of Elements, NodeList, or D object
    if (isArray(selector) || isNodeList(selector) || isD(selector)) {
        utils.merge(this, selector);
        return this;
    }

    // Document a ready
    if (isFunction(selector)) {
        onready(selector);
    }
    return this;
};
init.prototype = D.prototype;

var _hasMoreConflict = false,
    _prevjQuery,
    _prev$;

_.extend(D,
    parser.D,
    data.D,
    deferred.D,
    when.D,
    eventObj.D,
    xaja, // proxy ajax to xaja
{
    each:    array.each,
    forEach: array.each,

    map:     _.map,
    extend:  _.extend,

    noConflict: function() {
        if (_hasMoreConflict) {
            window.jQuery = _prevjQuery;
            window.$ = _prev$;

            _hasMoreConflict = false;
        }

        window.D = _prevD;
        return D;
    },

    moreConflict: function() {
        _hasMoreConflict = true;
        _prevjQuery = window.jQuery;
        _prev$ = window.$;
        window.jQuery = window.Zepto = window.$ = D;
    }
});

var arrayProto = (function(proto, obj) {

    _.each(
        _.splt('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight|map|filter'),
        function(key) {
            obj[key] = proto[key];
        }
    );

    return obj;

}(Array.prototype, {}));

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

module.exports = D;
