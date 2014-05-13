(function() {

    module('fizzle');

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
                    [ 'a', '#id', '[some-attr]', '.class', '[some-attr="\\""]' ]
                ],

                'Single quotes': [
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='']" ],
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c']" ],
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\],d,e,f']" ],
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\',d,e,f']" ],
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\]\\',d,e,f']" ],
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='a,b,c\\]\\',d,e,f']" ],
                    [ "a", "#id", "[some-attr]", ".class", "[some-attr='\\'']" ]
                ]
            },

            'With tag names': {
                'Double quotes': [
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr=""]' ],
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c"]' ],
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\],d,e,f"]' ],
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\",d,e,f"]' ],
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\]\\",d,e,f"]' ],
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="a,b,c\\]\\",d,e,f"]' ],
                    [ 'a', '#id', 'input[some-attr]', '.class', 'input[some-attr="\\""]' ]
                ],

                'Single quotes': [
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='']" ],
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c']" ],
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\],d,e,f']" ],
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\',d,e,f']" ],
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\]\\',d,e,f']" ],
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='a,b,c\\]\\',d,e,f']" ],
                    [ "a", "#id", "input[some-attr]", ".class", "input[some-attr='\\'']" ]
                ]
            }
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
                    [ 'a', '#id', '[ some-attr ]', '.class', '[ some-attr = "\\"" ]' ]
                ],

                'Single quotes': [
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = '' ]" ],
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c' ]" ],
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\],d,e,f' ]" ],
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\',d,e,f' ]" ],
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                    [ "a", "#id", "[ some-attr ]", ".class", "[ some-attr = '\\'' ]" ]
                ]
            },

            'With tag names': {
                'Double quotes': [
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "" ]' ],
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c" ]' ],
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\],d,e,f" ]' ],
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\",d,e,f" ]' ],
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\]\\",d,e,f" ]' ],
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "a,b,c\\]\\",d,e,f" ]' ],
                    [ 'a', '#id', 'input[ some-attr ]', '.class', 'input[ some-attr = "\\"" ]' ]
                ],

                'Single quotes': [
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = '' ]" ],
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c' ]" ],
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\],d,e,f' ]" ],
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\',d,e,f' ]" ],
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = 'a,b,c\\]\\',d,e,f' ]" ],
                    [ "a", "#id", "input[ some-attr ]", ".class", "input[ some-attr = '\\'' ]" ]
                ]
            }
        },

        'Other': [
            [ '#TestDiv p' ],
            [ "a", "#id", "[some-attr]", ".class", "[asdf\\]]" ],
            [ '#a > div', ':first', '#id:first', '.class:first', '[attr]', '#id[attr]', '.class[attr]', '.class[attr]:first', '[attr="value"]', ':not([attr="value"])' ]
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
            [ 'a', 'input:not([disabled="()"])' ]
        ]
    };

    var parser = D.__INTERNAL.fizzle.selector.parser;

    var testQuery = function(expectedArray) {
        var expected = expectedArray.join(', '),
            actual   = parser.subqueries(expected).join(', ');

        strictEqual(expected, actual);
    };

    var testQueries = function(queries, name) {
        var len = queries.length,
            idx = 0;

        test(name, function() {
            expect(len);

            for (; idx < len; idx++) {
                testQuery(queries[idx]);
            }
        });
    };

    var walk = function(node, name) {
        if (_.isArray(node)) {
            testQueries(node, name);
        } else {
            for (var prop in node) {
                var newName = name ? (name + ': ' + prop) : prop;
                walk(node[prop], newName);
            }
        }
    };

    walk(QUERIES, 'Selector parser');

}());
