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
            [ '#a > div', ':first-child', '#id:first-child', '.class:first-child', '[attr]', '#id[attr]', '.class[attr]', '.class[attr]:first-child', '[attr="value"]', ':not([attr="value"])' ]
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

    var parser = D.Fizzle.parse,
        selector = D.Fizzle.selector;

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

    test('Selector proxies', function(test) {
        var access = function(queries) { return queries[0].str; };
        test.ok(access(selector(':child-even')) === ':nth-child(even)',    ':child-even');
        test.ok(access(selector(':child-odd'))  === ':nth-child(odd)',     ':child-odd');
        test.ok(access(selector(':text'))       === '[type=text]',         ':text');
        test.ok(access(selector(':password'))   === '[type=password]',     ':password');
        test.ok(access(selector(':radio'))      === '[type=radio]',        ':radio');
        test.ok(access(selector(':checkbox'))   === '[type=checkbox]',     ':checkbox');
        test.ok(access(selector(':submit'))     === '[type=submit]',       ':submit');
        test.ok(access(selector(':reset'))      === '[type=reset]',        ':reset');
        test.ok(access(selector(':button'))     === '[type=button]',       ':button');
        test.ok(access(selector(':image'))      === '[type=image]',        ':image');
        test.ok(access(selector(':input'))      === '[type=input]',        ':input');
        test.ok(access(selector(':file'))       === '[type=file]',         ':file');
        test.ok(access(selector(':selected'))   === '[selected=selected]', ':selected');
    });

}());
