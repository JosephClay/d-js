(function() {

    module('dimensions');

    var pass = function(val) {
        return val;
    };

    var fn = function(val) {
        return function() {
            return val;
        };
    };

    /*
        ======== local reference =======
        pass and fn can be used to test passing functions to setters
        See testWidth below for an example

        pass( value );
            This function returns whatever value is passed in

        fn( value );
            Returns a function that returns the value
    */

    var testWidth = function(val) {
        expect(9);

        var $div = D('#NotHiddenDiv');
        $div.width(val(30));
        equal($div.width(), 30, 'Test set to 30 correctly');
        $div.hide();
        $('#NotHiddenDiv').width();
        equal($div.width(), 30, 'Test hidden div');
        $div.show();
        $div.width(val(-1)); // handle negative numbers by setting to 0 #11604
        equal($div.width(), 0, 'Test negative width normalized to 0');
        $div.css('padding', '20px');
        equal($div.width(), 0, 'Test padding specified with pixels');
        $div.css('border', '2px solid #fff');
        equal($div.width(), 0, 'Test border specified with pixels');

        $div.css({ 'display': '', 'border': '', 'padding': '' });

        D('#NotHiddenDivChild').css({ 'width': 20, 'padding': '3px', 'border': '2px solid #fff' });
        equal(D('#NotHiddenDivChild').width(), 20, 'Test child width with border and padding');
        D('#NotHiddenDiv, #NotHiddenDivChild').css({ 'border': '', 'padding': '', 'width': '' });

        var blah = D('blah');
        equal(blah.width(val(10)), blah, 'Make sure that setting a width on an empty set returns the set.');
        equal(blah.width(), null, 'Make sure "null" is returned on an empty set');

        equal(D(window).width(), document.documentElement.clientWidth, 'Window width is equal to width reported by window/document.');
    };

    test('width()', function() {
        testWidth(pass);
    });

    var testHeight = function(val) {
        expect(9);

        var $div = D('#NotHiddenDiv');
        $div.height(val(30));
        equal($div.height(), 30, 'Test set to 30 correctly');
        $div.hide();
        equal($div.height(), 30, 'Test hidden div');
        $div.show();
        $div.height(val(-1)); // handle negative numbers by setting to 0 #11604
        equal($div.height(), 0, 'Test negative height normalized to 0');
        $div.css('padding', '20px');
        equal($div.height(), 0, 'Test padding specified with pixels');
        $div.css('border', '2px solid #fff');
        equal($div.height(), 0, 'Test border specified with pixels');

        $div.css({ 'display': '', 'border': '', 'padding': '', 'height': '1px' });

        D('#NotHiddenDivChild').css({ 'height': 20, 'padding': '3px', 'border': '2px solid #fff' });
        equal(D('#NotHiddenDivChild').height(), 20, 'Test child height with border and padding');
        D('#NotHiddenDiv, #NotHiddenDivChild').css({ 'border': '', 'padding': '', 'height': '' });

        var blah = D('blah');
        equal(blah.height(val(10)), blah, 'Make sure that setting a height on an empty set returns the set.');
        equal(blah.height(), null, 'Make sure "null" is returned on an empty set');

        equal(D(window).height(), document.documentElement.clientHeight, 'Window height is equal to height reported by window/document.');
    };

    test('height()', function() {
        testHeight(pass);
    });

    test('innerWidth()', function() {
        expect(6);

        var $div, div,
            winWidth = D(window).width(),
            docWidth = D(document).width();

        equal(D(window).innerWidth(), winWidth, 'Test on window');
        equal(D(document).innerWidth(), docWidth, 'Test on document');

        $div = D('#NotHiddenDiv');
        // set styles
        $div.css({
            'margin': 10,
            'border': '2px solid #fff',
            'width': 30
        });
        equal($div.innerWidth(), 30, 'Test with margin and border');
        $div.css('padding', '20px');
        equal($div.innerWidth(), 70, 'Test with margin, border and padding');
        $div.hide();
        debugger;
        $('#NotHiddenDiv').innerWidth();
        equal($div.innerWidth(), 70, 'Test hidden div');

        // reset styles
        $div.css({ 'display': '', 'border': '', 'padding': '', 'width': '', 'height': '' });

        div = D('<div>');

        // Temporarily require 0 for backwards compat - should be auto
        equal(div.innerWidth(), 0, 'Make sure that disconnected nodes are handled.');

        div.remove();
    });

    test('innerHeight()', function() {
        expect(6);

        var $div, div,
            winHeight = D( window ).height(),
            docHeight = D( document ).height();

        equal(D(window).innerHeight(), winHeight, 'Test on window');
        equal(D(document).innerHeight(), docHeight, 'Test on document');

        $div = D('#NotHiddenDiv');
        // set styles
        $div.css({
            'margin': 10,
            'border': '2px solid #fff',
            'height': 30
        });

        equal($div.innerHeight(), 30, 'Test with margin and border');
        $div.css('padding', '20px');
        equal($div.innerHeight(), 70, 'Test with margin, border and padding');
        $div.hide();
        equal($div.innerHeight(), 70, 'Test hidden div');

        // reset styles
        $div.css({ 'display': '', 'border': '', 'padding': '', 'width': '', 'height': '' });

        div = D('<div>');

        // Temporarily require 0 for backwards compat - should be auto
        equal(div.innerHeight(), 0, 'Make sure that disconnected nodes are handled.');

        div.remove();
    });

    test('outerWidth()', function() {
        expect(11);

        var winWidth = D(window).width();
        equal(D(window).outerWidth(), winWidth, 'Test on window without margin option');
        equal(D(window).outerWidth(true), winWidth, 'Test on window with margin option');

        var docWidth = D( document ).width();
        equal(D(document).outerWidth(), docWidth, 'Test on document without margin option');
        equal(D(document).outerWidth(true), docWidth, 'Test on document with margin option');

        var $div = D('#NotHiddenDiv');
        $div.css('width', 30);

        equal($div.outerWidth(), 30, 'Test with only width set');
        $div.css('padding', '20px');
        equal($div.outerWidth(), 70, 'Test with padding');
        $div.css('border', '2px solid #fff');
        equal($div.outerWidth(), 74, 'Test with padding and border');
        $div.css('margin', '10px');
        equal($div.outerWidth(), 74, 'Test with padding, border and margin without margin option');
        $div.css('position', 'absolute');
        equal($div.outerWidth(true), 94, 'Test with padding, border and margin with margin option');
        $div.hide();
        equal($div.outerWidth(true), 94, 'Test hidden div with padding, border and margin with margin option');

        // reset styles
        $div.css({ 'position': '', 'display': '', 'border': '', 'padding': '', 'width': '', 'height': '' });

        var div = D('<div>');

        // Temporarily require 0 for backwards compat - should be auto
        equal( div.outerWidth(), 0, 'Make sure that disconnected nodes are handled.');

        div.remove();
    });

    test('child of a hidden elem (or unconnected node) has accurate inner/outer/Width()/Height()  see #9441 #9300', function() {
        expect(16);

        // setup html
        var $divNormal = D('<div>').css({ 'width': '100px', 'height': '100px', 'border': '10px solid white', 'padding': '2px', 'margin': '3px' }),
            $divChild = $divNormal.clone(),
            $divUnconnected = $divNormal.clone(),
            $divHiddenParent = D('<div>').css( 'display', 'none' ).append( $divChild ).appendTo('body');

        $divNormal.appendTo('body');

        // tests that child div of a hidden div works the same as a normal div
        equal($divChild.width(), $divNormal.width(), 'child of a hidden element width() is wrong see #9441');
        equal($divChild.innerWidth(), $divNormal.innerWidth(), 'child of a hidden element innerWidth() is wrong see #9441');
        equal($divChild.outerWidth(), $divNormal.outerWidth(), 'child of a hidden element outerWidth() is wrong see #9441');
        equal($divChild.outerWidth(true), $divNormal.outerWidth( true ), 'child of a hidden element outerWidth( true ) is wrong see #9300');

        equal($divChild.height(), $divNormal.height(), 'child of a hidden element height() is wrong see #9441');
        equal($divChild.innerHeight(), $divNormal.innerHeight(), 'child of a hidden element innerHeight() is wrong see #9441');
        equal($divChild.outerHeight(), $divNormal.outerHeight(), 'child of a hidden element outerHeight() is wrong see #9441');
        equal($divChild.outerHeight(true), $divNormal.outerHeight( true ), 'child of a hidden element outerHeight( true ) is wrong see #9300');

        // tests that child div of an unconnected div works the same as a normal div
        equal($divUnconnected.width(), $divNormal.width(), 'unconnected element width() is wrong see #9441');
        equal($divUnconnected.innerWidth(), $divNormal.innerWidth(), 'unconnected element innerWidth() is wrong see #9441');
        equal($divUnconnected.outerWidth(), $divNormal.outerWidth(), 'unconnected element outerWidth() is wrong see #9441');
        equal($divUnconnected.outerWidth(true), $divNormal.outerWidth( true ), 'unconnected element outerWidth( true ) is wrong see #9300');

        equal($divUnconnected.height(), $divNormal.height(), 'unconnected element height() is wrong see #9441');
        equal($divUnconnected.innerHeight(), $divNormal.innerHeight(), 'unconnected element innerHeight() is wrong see #9441');
        equal($divUnconnected.outerHeight(), $divNormal.outerHeight(), 'unconnected element outerHeight() is wrong see #9441');
        equal($divUnconnected.outerHeight(true), $divNormal.outerHeight( true ), 'unconnected element outerHeight( true ) is wrong see #9300');

        // teardown html
        $divHiddenParent.remove();
        $divNormal.remove();
    });

    test('getting dimensions shouldnt modify runtimeStyle see #9233', function() {
        expect(1);

        var $div = D('<div>').appendTo( '#qunit-fixture'),
            div = $div.get(0),
            runtimeStyle = div.runtimeStyle;

        if (runtimeStyle) {
            div.runtimeStyle.marginLeft = '12em';
            div.runtimeStyle.left = '11em';
        }

        $div.outerWidth(true);

        if (runtimeStyle) {
            equal(div.runtimeStyle.left, '11em', 'getting dimensions modifies runtimeStyle, see #9233');
        } else {
            ok(true, 'this browser doesnt support runtimeStyle, see #9233');
        }

        $div.remove();
    });

    test('table dimensions', function() {
        expect(2);

        var table = D('<table><colgroup><col/><col/></colgroup><tbody><tr><td></td><td>a</td></tr><tr><td></td><td>a</td></tr></tbody></table>').appendTo('#qunit-fixture'),
            tdElem = table.find('td').first(),
            colElem = table.find('col').first().width(300);

        table.find('td').css({ 'margin': 0, 'padding': 0 });

        equal(tdElem.width(), tdElem.width(), 'width() doesnt alter dimension values of empty cells, see #11293');
        equal(colElem.width(), 300, 'col elements have width(), see #12243');
    });

    test('box-sizing:border-box child of a hidden elem (or unconnected node) has accurate inner/outer/Width()/Height()  see #10413', function() {
        expect(16);

        // setup html
        var $divNormal = D('<div>').css({ 'boxSizing': 'border-box', 'width': '100px', 'height': '100px', 'border': '10px solid white', 'padding': '2px', 'margin': '3px' }),
            $divChild = $divNormal.clone(),
            $divUnconnected = $divNormal.clone(),
            $divHiddenParent = D('<div>').css('display', 'none').append($divChild).appendTo('body');

        $divNormal.appendTo('body');

        // tests that child div of a hidden div works the same as a normal div
        equal($divChild.width(), $divNormal.width(), 'child of a hidden element width() is wrong see #10413');
        equal($divChild.innerWidth(), $divNormal.innerWidth(), 'child of a hidden element innerWidth() is wrong see #10413');
        equal($divChild.outerWidth(), $divNormal.outerWidth(), 'child of a hidden element outerWidth() is wrong see #10413');
        equal($divChild.outerWidth(true), $divNormal.outerWidth(true), 'child of a hidden element outerWidth(true) is wrong see #10413');

        equal($divChild.height(), $divNormal.height(), 'child of a hidden element height() is wrong see #10413');
        equal($divChild.innerHeight(), $divNormal.innerHeight(), 'child of a hidden element innerHeight() is wrong see #10413');
        equal($divChild.outerHeight(), $divNormal.outerHeight(), 'child of a hidden element outerHeight() is wrong see #10413');
        equal($divChild.outerHeight(true), $divNormal.outerHeight(true), 'child of a hidden element outerHeight(true) is wrong see #10413');

        // tests that child div of an unconnected div works the same as a normal div
        equal($divUnconnected.width(), $divNormal.width(), 'unconnected element width() is wrong see #10413');
        equal($divUnconnected.innerWidth(), $divNormal.innerWidth(), 'unconnected element innerWidth() is wrong see #10413');
        equal($divUnconnected.outerWidth(), $divNormal.outerWidth(), 'unconnected element outerWidth() is wrong see #10413');
        equal($divUnconnected.outerWidth(true), $divNormal.outerWidth(true), 'unconnected element outerWidth(true) is wrong see #10413');

        equal($divUnconnected.height(), $divNormal.height(), 'unconnected element height() is wrong see #10413');
        equal($divUnconnected.innerHeight(), $divNormal.innerHeight(), 'unconnected element innerHeight() is wrong see #10413');
        equal($divUnconnected.outerHeight(), $divNormal.outerHeight(), 'unconnected element outerHeight() is wrong see #10413');
        equal($divUnconnected.outerHeight(true), $divNormal.outerHeight(true), 'unconnected element outerHeight(true) is wrong see #10413');

        // teardown html
        $divHiddenParent.remove();
        $divNormal.remove();
    });

    test('outerHeight()', function() {
        expect(11);

        var winHeight = D(window).height();
        equal(D(window).outerHeight(), winHeight, 'Test on window without margin option');
        equal(D(window).outerHeight(true), winHeight, 'Test on window with margin option');

        var docHeight = D( document ).height();
        equal(D(document).outerHeight(), docHeight, 'Test on document without margin option');
        equal(D(document).outerHeight(true), docHeight, 'Test on document with margin option');

        var $div = D('#NotHiddenDiv');
        $div.css('height', 30);

        equal($div.outerHeight(), 30, 'Test with only width set');
        $div.css('padding', '20px');
        equal($div.outerHeight(), 70, 'Test with padding');
        $div.css('border', '2px solid #fff');
        equal($div.outerHeight(), 74, 'Test with padding and border');
        $div.css('margin', '10px');
        equal($div.outerHeight(), 74, 'Test with padding, border and margin without margin option');
        equal($div.outerHeight(true), 94, 'Test with padding, border and margin with margin option');
        $div.hide();
        equal($div.outerHeight(true), 94, 'Test hidden div with padding, border and margin with margin option');

        // reset styles
        $div.css({ 'display': '', 'border': '', 'padding': '', 'width': '', 'height': '' });

        var div = D('<div>');

        // Temporarily require 0 for backwards compat - should be auto
        equal(div.outerHeight(), 0, 'Make sure that disconnected nodes are handled.');

        div.remove();
    });

    test('passing undefined is a setter #5571', function() {
        expect(4);

        equal(D('#NotHiddenDiv').height(30).height(undefined).height(), 30, '.height(undefined) is chainable (#5571)');
        equal(D('#NotHiddenDiv').height(30).innerHeight(undefined).height(), 30, '.innerHeight(undefined) is chainable (#5571)');
        equal(D('#NotHiddenDiv').height(30).outerHeight(undefined).height(), 30, '.outerHeight(undefined) is chainable (#5571)');
        equal(D('#NotHiddenDiv').width(30).width(undefined).width(), 30, '.width(undefined) is chainable (#5571)');
    });

    test('getters on non elements should return null', function() {
        expect(8);

        var nonElem = D('notAnElement');

        strictEqual(nonElem.width(), null, '.width() is not null (#12283)');
        strictEqual(nonElem.innerWidth(), null, '.innerWidth() is not null (#12283)');
        strictEqual(nonElem.outerWidth(), null, '.outerWidth() is not null (#12283)');
        strictEqual(nonElem.outerWidth(true), null, '.outerWidth(true) is not null (#12283)');

        strictEqual(nonElem.height(), null, '.height() is not null (#12283)');
        strictEqual(nonElem.innerHeight(), null, '.innerHeight() is not null (#12283)');
        strictEqual(nonElem.outerHeight(), null, '.outerHeight() is not null (#12283)');
        strictEqual(nonElem.outerHeight(true), null, '.outerHeight(true) is not null (#12283)');
    });

    test('setters with and without box-sizing:border-box', function() {
        expect(20);

        var el_bb = D('<div style="width:114px;height:114px;margin:5px;padding:3px;border:4px solid white;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;"">test</div>').appendTo('#qunit-fixture'),
            el = D('<div style="width:100px;height:100px;margin:5px;padding:3px;border:4px solid white;">test</div>').appendTo('#qunit-fixture'),
            expected = 100;

        equal(el_bb.width(101).width(), expected + 1, 'test border-box width(int) by roundtripping');
        equal(el_bb.innerWidth(108).width(), expected + 2, 'test border-box innerWidth(int) by roundtripping');
        equal(el_bb.outerWidth(117).width(), expected + 3, 'test border-box outerWidth(int) by roundtripping');
        equal(el_bb.outerWidth(118, false).width(), expected + 4, 'test border-box outerWidth(int, false) by roundtripping');
        equal(el_bb.outerWidth(129, true).width(), expected + 5, 'test border-box innerWidth(int, true) by roundtripping');

        equal(el_bb.height(101).height(), expected + 1, 'test border-box height(int) by roundtripping');
        equal(el_bb.innerHeight(108).height(), expected + 2, 'test border-box innerHeight(int) by roundtripping');
        equal(el_bb.outerHeight(117).height(), expected + 3, 'test border-box outerHeight(int) by roundtripping');
        equal(el_bb.outerHeight(118, false).height(), expected + 4, 'test border-box outerHeight(int, false) by roundtripping');
        equal(el_bb.outerHeight(129, true).height(), expected + 5, 'test border-box innerHeight(int, true) by roundtripping');

        equal(el.width(101).width(), expected + 1, 'test border-box width(int) by roundtripping');
        equal(el.innerWidth(108).width(), expected + 2, 'test border-box innerWidth(int) by roundtripping');
        equal(el.outerWidth(117).width(), expected + 3, 'test border-box outerWidth(int) by roundtripping');
        equal(el.outerWidth(118, false).width(), expected + 4, 'test border-box outerWidth(int, false) by roundtripping');
        equal(el.outerWidth(129, true).width(), expected + 5, 'test border-box innerWidth(int, true) by roundtripping');

        equal(el.height(101).height(), expected + 1, 'test border-box height(int) by roundtripping');
        equal(el.innerHeight(108).height(), expected + 2, 'test border-box innerHeight(int) by roundtripping');
        equal(el.outerHeight(117).height(), expected + 3, 'test border-box outerHeight(int) by roundtripping');
        equal(el.outerHeight(118, false).height(), expected + 4, 'test border-box outerHeight(int, false) by roundtripping');
        equal(el.outerHeight(129, true).height(), expected + 5, 'test border-box innerHeight(int, true) by roundtripping');
    });

})();
