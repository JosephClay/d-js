var _          = require('_'),
    D          = require('./D'),
    parser     = require('parser'),
    Fizzle     = require('Fizzle'),
    data       = require('modules/data');

var parseHtml = function(str) {
    if (!str) { return null; }
    var result = parser(str);
    return result && result.length ? D(result) : null;
};

_.extend(D,
    data.D,
{
    // Because no one know what the case should be
    parseHtml: parseHtml,
    parseHTML: parseHtml,

    Fizzle:  Fizzle,
    each:    _.jqEach,
    forEach: _.dEach,

    map:     _.map,
    extend:  _.extend,

    moreConflict: function() {
        window.jQuery = window.Zepto = window.$ = D;
    }
});
