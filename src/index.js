// polyfills
require('./polyfills/indexOf');

// Configure O with string custom types
require('./o.custom');

var _ = require('underscore'),

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

var D = function(arg, attrs) {
    // Wasn't created with "new"
    if (!(this instanceof D)) { return new D(arg, attrs); }

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

        // Selector: perform a find without creating a new D
        utils.merge(this, selectors.find(arg, true));
        return;
    }

    // Array of Elements, NodeList, or D object
    if (_.isArray(arg) || _.isNodeList(arg) || arg instanceof D) {
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
        _.splt('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight'),
        function(key) {
            obj[key] = proto[key];
        }
    );

    return obj;

}(Array.prototype, {}));

_.extend(
    D.prototype,
    { constructor: D },
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

module.exports =  D;
