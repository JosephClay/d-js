var _ = require('_'),
    _utils = require('/utils.js'),
    _fizzle = require('/modules/query/fizzle.js');

var _isArray = Array.isArray || function(obj) { return Object.prototype.toString.apply(arr) === '[object Array]'; }

var Q = function(str) {
    return '"' + str + '"';
};

var I = function(str, i) {
    var indent = new Array((i * 4) + 1).join(' ');
    return indent + str;
};

var QUERIES = {
    'Without spaces': {
        'Without tag names': {
            'Double quotes': [
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr=""]' ],
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr="a,b,c"]' ],
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr="a,b,c\\],d,e,f"]' ],
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr="a,b,c\\",d,e,f"]' ],
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr="a,b,c\\]\\",d,e,f"]' ],
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr="a,b,c\\]\\",d,e,f"]' ],
                [ 'a', '#id', '[some-attr]', '.class', '[some-attr="\\"]' ],
            ],

            'Single quotes': [
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='']" ],
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c']" ],
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\],d,e,f']" ],
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\',d,e,f']" ],
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\]\\',d,e,f']" ],
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\]\\',d,e,f']" ],
                [ "a", "#id", "[some-attr]", ".class", "[some-attr='\\']" ],
            ],
        },

        'With tag names': {
            'Double quotes': [
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr=""]' ],
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c"]' ],
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\],d,e,f"]' ],
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\",d,e,f"]' ],
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\]\\",d,e,f"]' ],
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\]\\",d,e,f"]' ],
                [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="\\"]' ],
            ],

            'Single quotes': [
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='']" ],
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c']" ],
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\],d,e,f']" ],
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\',d,e,f']" ],
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\]\\',d,e,f']" ],
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\]\\',d,e,f']" ],
                [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='\\']" ],
            ],
        },
    },

    'With spaces': {
        'Without tag names': {
            'Double quotes': [
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "" ]' ],
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "a,b,c" ]' ],
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "a,b,c\\],d,e,f" ]' ],
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "a,b,c\\",d,e,f" ]' ],
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "a,b,c\\]\\",d,e,f" ]' ],
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "a,b,c\\]\\",d,e,f" ]' ],
                [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "\\" ]' ],
            ],

            'Single quotes': [
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = '' ]" ],
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c' ]" ],
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\],d,e,f' ]" ],
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\',d,e,f' ]" ],
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = '\\' ]" ],
            ],
        },

        'With tag names': {
            'Double quotes': [
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "" ]' ],
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c" ]' ],
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\],d,e,f" ]' ],
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\",d,e,f" ]' ],
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\]\\",d,e,f" ]' ],
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\]\\",d,e,f" ]' ],
                [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "\\" ]' ],
            ],

            'Single quotes': [
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = '' ]" ],
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c' ]" ],
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\],d,e,f' ]" ],
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\',d,e,f' ]" ],
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = '\\' ]" ],
            ],
        },
    },

    'Other': [
        [ '#TestDiv p' ],
        [ "a", "#id", "[some-attr]", ".class", "[asdf\\]]" ],
        [ '#a > div', ':first', '#id:first', '.class:first', '[attr]', '#id[attr]', '.class[attr]', '.class[attr]:first', '[attr="value"]', ':not([attr="value"])' ],
    ],

    'Pseudo': [
        [ ":not([disabled])" ],
        [ "input:not([disabled])" ],
        [ "a :not([disabled])" ],
        [ "a input:not([disabled])" ],
        [ "a", "input:not([disabled])" ],
        [ ':not([disabled="\\]"])' ],
        [ 'input:not([disabled="\\]"])' ],
        [ 'a :not([disabled="\\]"])' ],
        [ 'a input:not([disabled="\\]"])' ],
        [ 'a', 'input:not([disabled="\\]"])' ],
        [ ':not([disabled="()"])' ],
        [ 'input:not([disabled="()"])' ],
        [ 'a :not([disabled="()"])' ],
        [ 'a input:not([disabled="()"])' ],
        [ 'a', 'input:not([disabled="()"])' ],
    ]
};

var testQuery = function(expected, level) {
    var query = expected.join(', '),
        actual;

    try {
        actual = _fizzle.subqueries(query);
    } catch (e) {
        return console.error(I('', level), e);
    }

    if (query !== actual.join(', ')) {
        console.error(I(query, level));
    } else {
        console.log(I('Pass!', level));
    }
};

var testQueries = function(queries, level) {
    var len = queries.length,
        idx = 0,
        subquery;
    for (; idx < len; idx++) {
        testQuery(queries[idx], level);
    }
};

var walk = function(node, key, level) {
    console.log(I(key + ':', level))

    if (_isArray(node)) {
        testQueries(node, level + 1)
    } else {
        for (var k in node) {
            walk(node[k], k, level + 1);
        }
    }
};

walk(QUERIES, 'root', 0);
