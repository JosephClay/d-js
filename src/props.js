var _          = require('_'),
    D          = require('./D'),
    parser     = require('parser'),
    Fizzle     = require('Fizzle'),
    each       = require('modules/array/each'),
    forEach    = require('modules/array/forEach'),
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
    each:    each,
    forEach: forEach,

    map:     _.map,
    extend:  _.extend,

    moreConflict: function() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});
