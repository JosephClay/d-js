var _          = require('_'),
    D          = require('./D'),
    parser     = require('parser'),
    Fizzle     = require('Fizzle'),
    array      = require('modules/array'),
    data       = require('modules/data');

var parseHtml = function(str) {
    if (!str) { return null; }
    var result = parser(str);
    if (!result || !result.length) { return null; }
    return D(result);
};

_.extend(D,
    data.D,
{
    // Because no one know what the case should be
    parseHtml: parseHtml,
    parseHTML: parseHtml,

    Fizzle:  Fizzle,
    each:    array.each,
    forEach: array.each,

    map:     _.map,
    extend:  _.extend,

    moreConflict: function() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});