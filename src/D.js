// polyfills
require('./polyfills/indexOf');

// Configure _ with string methods
require('./_.string');
// Configure O with string custom types
require('./o.custom');

var _ = require('_'),

    parser      = require('./D/parser'),
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

    xaja        = require('./libs/xaja');

// Store previous reference
var _prevD = window.D;

var DOM = function(arg, attrs) {
    // Wasn't created with "new"
    if (!(this instanceof DOM)) { return new DOM(arg, attrs); }

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
        if (utils.isHtml(arg)) {
            utils.merge(this, parser.parseHtml(arg));
            if (attrs) { this.attr(attrs); }
            return;
        }

        // Selector: perform a find without creating a new DOM
        utils.merge(this, selectors.find(arg, true));
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

_.extend(DOM,
    parser.D,
    data.D,
    deferred.D,
    when.D,
{
    each:    array.each,
    forEach: array.each,

    map:     _.map,
    extend:  _.extend,

    // proxy ajax to xaja
    ajax: xaja.ajax,
    get: xaja.get,
    post: xaja.post,
    put: xaja.put,
    del: xaja.del,

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
        window.jQuery = window.Zepto = window.$ = DOM;
    }
});

var arrayProto = (function(proto, obj) {

    _.each([
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
    ], function(key) {
        obj[key] = proto[key];
    });

    return obj;

}(Array.prototype, {}));

_.extend(
    DOM.prototype,
    { constructor: DOM },
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
    events.fn,
    eventObj.fn
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
