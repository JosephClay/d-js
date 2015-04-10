var _           = require('_'),
    D           = require('./D'),
    split       = require('util/split'),
    array       = require('modules/array'),
    selectors   = require('modules/selectors'),
    transversal = require('modules/transversal'),
    dimensions  = require('modules/dimensions'),
    manip       = require('modules/manip'),
    css         = require('modules/css'),
    attr        = require('modules/attr'),
    prop        = require('modules/prop'),
    val         = require('modules/val'),
    position    = require('modules/position'),
    classes     = require('modules/classes'),
    scroll      = require('modules/scroll'),
    data        = require('modules/data'),
    events      = require('modules/events');

var arrayProto = split('length|toString|toLocaleString|join|pop|push|concat|reverse|shift|unshift|slice|splice|sort|some|every|indexOf|lastIndexOf|reduce|reduceRight|map|filter')
    .reduce(function(obj, key) {
        obj[key] = Array.prototype[key];
        return obj;
    }, {});

// Expose the prototype so that
// it can be hooked into for plugins
D.fn = D.prototype;

_.extend(
    D.fn,
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
    scroll.fn,
    data.fn,
    events.fn
);
