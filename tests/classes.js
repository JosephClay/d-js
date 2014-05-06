(function() {

    module('classes');

    var bareObj = function(value) {
        return value;
    };

    var functionReturningObj = function(value) {
        return function() {
            return value;
        };
    };

    /*
        ======== local reference =======
        bareObj and functionReturningObj can be used to test passing functions to setters
        See testVal below for an example

        bareObj(value);
            This function returns whatever value is passed in

        functionReturningObj(value);
            Returns a function that returns the value
    */

    /* TODO: Enable for testing props?
    test('D.propFix integrity test', function() {
        expect(1);

        //  This must be maintained and equal D.attrFix when appropriate
        //  Ensure that accidental or erroneous property
        //  overwrites don't occur
        //  This is simply for better code coverage and future proofing.
        var props = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        };

        deepEqual(props, D.propFix, 'D.propFix passes integrity check');
    });
    */

    var testAddClass = function(valueObj) {
        expect(9);

        var pass, j, i,
            div = D('#qunit-fixture div');
        div.addClass(valueObj('test'));
        pass = true;
        for (i = 0; i < div.length; i++) {
            if (!~div.get(i).className.indexOf('test')) {
                pass = false;
            }
        }
        ok(pass, 'Add Class');

        // using contents will get regular, text, and comment nodes
        j = D('#nonnodes').contents();
        j.addClass(valueObj('asdf'));
        ok(j.hasClass('asdf'), 'Check node,textnode,comment for addClass');

        div = D('<div/>');

        div.addClass(valueObj('test'));
        equal(div.attr('class'), 'test', 'Make sure theres no extra whitespace.');

        div.attr('class', ' foo');
        div.addClass(valueObj('test'));
        equal(div.attr('class'), 'foo test', 'Make sure theres no extra whitespace.');

        div.attr('class', 'foo');
        div.addClass(valueObj('bar baz'));
        equal(div.attr('class'), 'foo bar baz', 'Make sure there isnt too much trimming.');

        div.removeClass();
        div.addClass(valueObj('foo')).addClass(valueObj('foo'));
        equal(div.attr('class'), 'foo', 'Do not add the same class twice in separate calls.');

        div.addClass(valueObj('fo'));
        equal(div.attr('class'), 'foo fo', 'Adding a similar class does not get interrupted.');
        div.removeClass().addClass('wrap2');
        ok(div.addClass('wrap').hasClass('wrap'), 'Can add similarly named classes');

        div.removeClass();
        div.addClass(valueObj('bar bar'));
        equal(div.attr('class'), 'bar', 'Do not add the same class twice in the same call.');
    };

    test('addClass(String)', function() {
        testAddClass(bareObj);
    });

    test('addClass(Function)', function() {
        testAddClass(functionReturningObj);
    });

    test('addClass(Function) with incoming value', function() {
        expect(52);

        var pass, i,
            div = D('#qunit-fixture div'),
            old = div.map(function() {
                return D(this).attr('class') || '';
            });

        div.addClass(function(i, val) {
            if (this.id !== '_firebugConsole') {
                equal(val, old[ i ], 'Make sure the incoming value is correct.');
                return 'test';
            }
        });

        pass = true;
        for (i = 0; i < div.length; i++) {
            if (div.get(i).className.indexOf('test') === -1) {
                pass = false;
            }
        }
        ok(pass, 'Add Class');
    });

    var testRemoveClass = function(valueObj) {
        expect(8);

        var $set = D('#qunit-fixture div'),
            div = document.createElement('div');

        $set.addClass('test').removeClass(valueObj('test'));

        ok(!$set.is('.test'), 'Remove Class');

        $set.addClass('test').addClass('foo').addClass('bar');
        $set.removeClass(valueObj('test')).removeClass(valueObj('bar')).removeClass(valueObj('foo'));

        ok(!$set.is('.test,.bar,.foo'), 'Remove multiple classes');

        $set.eq(0).addClass('expected').removeClass(valueObj(null));
        ok($set.eq(0).is('.expected'), 'Null value passed to removeClass');

        $set.eq(0).addClass('expected').removeClass(valueObj(''));
        ok($set.eq(0).is('.expected'), 'Empty string passed to removeClass');


        // using contents will get regular, text, and comment nodes
        $set = D('#nonnodes').contents();
        $set.removeClass(valueObj('asdf'));
        ok(!$set.hasClass('asdf'), 'Check node,textnode,comment for removeClass');


        D(div).removeClass(valueObj('foo'));
        strictEqual(D(div).attr('class'), undefined, 'removeClass doesnt create a class attribute');

        div.className = ' test foo ';

        D(div).removeClass(valueObj('foo'));
        equal(div.className, 'test', 'Make sure remaining className is trimmed.');

        div.className = ' test ';

        D(div).removeClass(valueObj('test'));
        equal(div.className, '', 'Make sure there is nothing left after everything is removed.');
    };

    test('removeClass(String) - simple', function() {
        testRemoveClass(bareObj);
    });

    test('removeClass(Function) - simple', function() {
        testRemoveClass(functionReturningObj);
    });

    test('removeClass(Function) with incoming value', function() {
        expect(52);

        var $divs = D('#qunit-fixture div').addClass('test'), old = $divs.map(function() {
            return D(this).attr('class');
        });

        $divs.removeClass(function(i, val) {
            if (this.id !== '_firebugConsole') {
                equal(val, old[i], 'Make sure the incoming value is correct.');
                return 'test';
            }
        });

        ok(!$divs.is('.test'), 'Remove Class');
    });

    test('removeClass() removes duplicates', function() {
        expect(1);

        var $div = D(D.parseHTML('<div class="x x x"></div>'));

        $div.removeClass('x');

        ok(!$div.hasClass('x'), 'Element with multiple same classes does not escape the wrath of removeClass()');
    });

    test('removeClass(undefined) is a no-op', function() {
        expect(1);

        var $div = D('<div class="base second"></div>');
        $div.removeClass(undefined);

        ok($div.hasClass('base') && $div.hasClass('second'), 'Element still has classes after removeClass(undefined)');
    });

    var testToggleClass = function(valueObj) {
        expect(17);

        var e = D('#firstp');
        ok(!e.is('.test'), 'Assert class not present');
        e.toggleClass(valueObj('test'));
        ok(e.is('.test'), 'Assert class present');
        e.toggleClass(valueObj('test'));
        ok(!e.is('.test'), 'Assert class not present');

        // class name with a boolean
        e.toggleClass(valueObj('test'), false);
        ok(!e.is('.test'), 'Assert class not present');
        e.toggleClass(valueObj('test'), true);
        ok(e.is('.test'), 'Assert class present');
        e.toggleClass(valueObj('test'), false);
        ok(!e.is('.test'), 'Assert class not present');

        // multiple class names
        e.addClass('testA testB');
        ok(e.is('.testA.testB'), 'Assert 2 different classes present');
        e.toggleClass(valueObj('testB testC'));
        ok((e.is('.testA.testC') && !e.is('.testB')), 'Assert 1 class added, 1 class removed, and 1 class kept');
        e.toggleClass(valueObj('testA testC'));
        ok((!e.is('.testA') && !e.is('.testB') && !e.is('.testC')), 'Assert no class present');

        // toggleClass storage
        e.toggleClass(true);
        ok(e[ 0 ].className === '', 'Assert class is empty (data was empty)');
        e.addClass('testD testE');
        ok(e.is('.testD.testE'), 'Assert class present');
        e.toggleClass();
        ok(!e.is('.testD.testE'), 'Assert class not present');
        ok(D._data(e[ 0 ], '__className__') === 'testD testE', 'Assert data was stored');
        e.toggleClass();
        ok(e.is('.testD.testE'), 'Assert class present (restored from data)');
        e.toggleClass(false);
        ok(!e.is('.testD.testE'), 'Assert class not present');
        e.toggleClass(true);
        ok(e.is('.testD.testE'), 'Assert class present (restored from data)');
        e.toggleClass();
        e.toggleClass(false);
        e.toggleClass();
        ok(e.is('.testD.testE'), 'Assert class present (restored from data)');

        // Cleanup
        e.removeClass('testD');
    };

    test('toggleClass(String|boolean|undefined[, boolean])', function() {
        testToggleClass(bareObj);
    });

    test('toggleClass(Function[, boolean])', function() {
        testToggleClass(functionReturningObj);
    });

    test('toggleClass(Function[, boolean]) with incoming value', function() {
        expect(14);

        var e = D('#firstp'),
            old = e.attr('class') || '';

        ok(!e.is('.test'), 'Assert class not present');

        e.toggleClass(function(i, val) {
            equal(old, val, 'Make sure the incoming value is correct.');
            return 'test';
        });
        ok(e.is('.test'), 'Assert class present');

        old = e.attr('class');

        e.toggleClass(function(i, val) {
            equal(old, val, 'Make sure the incoming value is correct.');
            return 'test';
        });
        ok(!e.is('.test'), 'Assert class not present');

        old = e.attr('class') || '';

        // class name with a boolean
        e.toggleClass(function(i, val, state) {
            equal(old, val, 'Make sure the incoming value is correct.');
            equal(state, false, 'Make sure that the state is passed in.');
            return 'test';
        }, false);
        ok(!e.is('.test'), 'Assert class not present');

        old = e.attr('class') || '';

        e.toggleClass(function(i, val, state) {
            equal(old, val, 'Make sure the incoming value is correct.');
            equal(state, true, 'Make sure that the state is passed in.');
            return 'test';
        }, true);
        ok(e.is('.test'), 'Assert class present');

        old = e.attr('class');

        e.toggleClass(function(i, val, state) {
            equal(old, val, 'Make sure the incoming value is correct.');
            equal(state, false, 'Make sure that the state is passed in.');
            return 'test';
        }, false);
        ok(!e.is('.test'), 'Assert class not present');
    });

    test('addClass, removeClass, hasClass', function() {
        expect(17);

        var jq = D('<p>Hi</p>'), x = jq[ 0 ];

        jq.addClass('hi');
        equal(x.className, 'hi', 'Check single added class');

        jq.addClass('foo bar');
        equal(x.className, 'hi foo bar', 'Check more added classes');

        jq.removeClass();
        equal(x.className, '', 'Remove all classes');

        jq.addClass('hi foo bar');
        jq.removeClass('foo');
        equal(x.className, 'hi bar', 'Check removal of one class');

        ok(jq.hasClass('hi'), 'Check has1');
        ok(jq.hasClass('bar'), 'Check has2');

        jq = D('<p class="class1\nclass2\tcla.ss3\n\rclass4"></p>');

        ok(jq.hasClass('class1'), 'Check hasClass with line feed');
        ok(jq.is('.class1'), 'Check is with line feed');
        ok(jq.hasClass('class2'), 'Check hasClass with tab');
        ok(jq.is('.class2'), 'Check is with tab');
        ok(jq.hasClass('cla.ss3'), 'Check hasClass with dot');
        ok(jq.hasClass('class4'), 'Check hasClass with carriage return');
        ok(jq.is('.class4'), 'Check is with carriage return');

        jq.removeClass('class2');
        ok(jq.hasClass('class2') === false, 'Check the class has been properly removed');
        jq.removeClass('cla');
        ok(jq.hasClass('cla.ss3'), 'Check the dotted class has not been removed');
        jq.removeClass('cla.ss3');
        ok(jq.hasClass('cla.ss3') === false, 'Check the dotted class has been removed');
        jq.removeClass('class4');
        ok(jq.hasClass('class4') === false, 'Check the class has been properly removed');
    });

    test('addClass, removeClass, hasClass on many elements', function() {
        expect(19);

        var elem = D('<p>p0</p><p>p1</p><p>p2</p>');

        elem.addClass('hi');
        equal(elem[ 0 ].className, 'hi', 'Check single added class');
        equal(elem[ 1 ].className, 'hi', 'Check single added class');
        equal(elem[ 2 ].className, 'hi', 'Check single added class');

        elem.addClass('foo bar');
        equal(elem[ 0 ].className, 'hi foo bar', 'Check more added classes');
        equal(elem[ 1 ].className, 'hi foo bar', 'Check more added classes');
        equal(elem[ 2 ].className, 'hi foo bar', 'Check more added classes');

        elem.removeClass();
        equal(elem[ 0 ].className, '', 'Remove all classes');
        equal(elem[ 1 ].className, '', 'Remove all classes');
        equal(elem[ 2 ].className, '', 'Remove all classes');

        elem.addClass('hi foo bar');
        elem.removeClass('foo');
        equal(elem[ 0 ].className, 'hi bar', 'Check removal of one class');
        equal(elem[ 1 ].className, 'hi bar', 'Check removal of one class');
        equal(elem[ 2 ].className, 'hi bar', 'Check removal of one class');

        ok(elem.hasClass('hi'), 'Check has1');
        ok(elem.hasClass('bar'), 'Check has2');

        ok(D('<p class="hi">p0</p><p>p1</p><p>p2</p>').hasClass('hi'), 'Did find a class in the first element');
        ok(D('<p>p0</p><p class="hi">p1</p><p>p2</p>').hasClass('hi'), 'Did find a class in the second element');
        ok(D('<p>p0</p><p>p1</p><p class="hi">p2</p>').hasClass('hi'), 'Did find a class in the last element');

        ok(D('<p class="hi">p0</p><p class="hi">p1</p><p class="hi">p2</p>').hasClass('hi'), 'Did find a class when present in all elements');

        ok(!D('<p class="hi0">p0</p><p class="hi1">p1</p><p class="hi2">p2</p>').hasClass('hi'), 'Did not find a class when not present');
    });

    test('contents().hasClass() returns correct values', function() {
        expect(2);

        var $div = D('<div><span class="foo"></span><!-- comment -->text</div>'),
        $contents = $div.contents();

        ok($contents.hasClass('foo'), 'Found "foo" in $contents');
        ok(!$contents.hasClass('undefined'), 'Did not find "undefined" in $contents (correctly)');
    });

    test('hasClass correctly interprets non-space separators (#13835)', function() {
        expect(4);

        var map = {
                tab: '&#9;',
                'line-feed': '&#10;',
                'form-feed': '&#12;',
                'carriage-return': '&#13;'
            },
            classes = D.map(map, function(separator, label) {
                return ' ' + separator + label + separator + ' ';
            }),
            $div = D('<div class="' + classes + '"></div>');

        D.each(map, function(label) {
            ok($div.hasClass(label), label.replace('-', ' '));
        });
    });

}());
