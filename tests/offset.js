(function() {


    var supportsScroll, supportsFixedPosition,
        forceScroll = D('<div/>').css({ width: 2000, height: 2000 }),
        checkSupport = function() {
            // Only run once
            checkSupport = false;

            var checkFixed = D('<div/>').css({ position: 'fixed', top: '20px' }).appendTo('#qunit-fixture');

            // Must append to body because #qunit-fixture is hidden and elements inside it don't have a scrollTop
            forceScroll.appendTo('body');
            window.scrollTo(200, 200);
            supportsScroll = document.documentElement.scrollTop || document.body.scrollTop;
            forceScroll.detach();

            supportsFixedPosition = checkFixed[0].offsetTop === 20;
            checkFixed.remove();
        };

    module('offset', {
        setup: function() {
            if (typeof checkSupport === 'function') {
                checkSupport();
            }

            // Force a scroll value on the main window to ensure incorrect results
            // if offset is using the scroll offset of the parent window
            forceScroll.appendTo('body');
            window.scrollTo(1, 1);
            forceScroll.detach();
        }
    });

    /*
        Closure-compiler will roll static methods off of the D object and so they will
        not be passed with the D object across the windows. To differentiate this, the
        testIframe callbacks use the '$' symbol to refer to the D object passed from
        the iframe window and the 'D' symbol is used to access any static methods.
    */

    test('empty set', function() {
        expect(2);
        strictEqual(D().offset(), undefined, 'offset() returns undefined for empty set (#11962)');
        strictEqual(D().position(), undefined, 'position() returns undefined for empty set (#11962)');
    });

    test('object without getBoundingClientRect', function() {
        expect(2);

        // Simulates a browser without gBCR on elements, we just want to return 0,0
        var result = D({ ownerDocument: document }).offset();
        equal(result.top, 0, 'Check top');
        equal(result.left, 0, 'Check left');
    });

    test('disconnected node', function() {
        expect(2);

        var result = D(document.createElement('div')).offset();

        equal(result.top, 0, 'Check top');
        equal(result.left, 0, 'Check left');
    });

    test('chaining', function() {
        expect(3);
        var coords = { 'top':  1, 'left':  1 };
        equal(D('#absolute-1').offset(coords).selector, '#absolute-1', 'offset(coords) returns D object');
        equal(D('#non-existent').offset(coords).selector, '#non-existent', 'offset(coords) with empty D set returns D object');
        equal(D('#absolute-1').offset(undefined).selector, '#absolute-1', 'offset(undefined) returns D object (#5571)');
    });

    test('offsetParent', function() {
        expect(13);

        var body, header, div, area;

        body = D('body').offsetParent();
        equal(body.length, 1, 'Only one offsetParent found.');
        equal(body[0], document.documentElement, 'The html element is the offsetParent of the body.');

        header = D('#qunit').offsetParent();
        equal(header.length, 1, 'Only one offsetParent found.');
        equal(header[0], document.documentElement, 'The html element is the offsetParent of #qunit.');

        div = D('#nothiddendivchild').offsetParent();
        equal(div.length, 1, 'Only one offsetParent found.');
        equal(div[0], document.getElementById('qunit-fixture'), 'The #qunit-fixture is the offsetParent of #nothiddendivchild.');

        D('#nothiddendiv').css('position', 'relative');

        div = D('#nothiddendivchild').offsetParent();
        equal(div.length, 1, 'Only one offsetParent found.');
        equal(div[0], D('#nothiddendiv')[0], 'The div is the offsetParent.');

        div = D('body, #nothiddendivchild').offsetParent();
        equal(div.length, 2, 'Two offsetParent found.');
        equal(div[0], document.documentElement, 'The html element is the offsetParent of the body.');
        equal(div[1], D('#nothiddendiv')[0], 'The div is the offsetParent.');

        area = D('#imgmap area').offsetParent();
        equal(area[0], document.documentElement, 'The html element is the offsetParent of the body.');

        div = D('<div>').css({ 'position': 'absolute' }).appendTo('body');
        equal(div.offsetParent()[0], document.documentElement, 'Absolutely positioned div returns html as offset parent, see #12139');

        div.remove();
    });

    test('fractions (see #7730 and #7885)', function() {
        expect(2);

        D('body').append('<div id="fractions"/>');

        var result,
            expected = { 'top': 1000, 'left': 1000 },
            div = D('#fractions');

        div.css({
            'position': 'absolute',
            'left': '1000.7432222px',
            'top': '1000.532325px',
            'width': 100,
            'height': 100
        });

        div.offset(expected);

        result = div.offset();

        equal(result.top, expected.top, 'Check top');
        equal(result.left, expected.left, 'Check left');

        div.remove();
    });

}());
