(function() {

    module('show/hide');

    test('sanity check', function() {
        expect(1);
        ok(D('#dl:visible, #qunit-fixture:visible, #foo:visible').length === 3, 'QUnit state is correct for testing effects');
    });

    test('show() basic', function() {
        expect(2);

        var div,
            hiddendiv = D('div.hidden');

        hiddendiv.hide().show();

        equal(hiddendiv.css('display'), 'block', 'Make sure a pre-hidden div is visible.');

        div = D('<div>').hide().appendTo('#qunit-fixture').show();

        equal(div.css('display'), 'block', 'Make sure pre-hidden divs show');

        // Clean up the detached node
        div.remove();
    });

    test('toggle()', function() {
        expect(6);

        var x = D('#foo');
        ok(x.is(':visible'), 'is visible');
        x.toggle();
        ok(x.is(':hidden'), 'is hidden');
        x.toggle();
        ok(x.is(':visible'), 'is visible again');

        x.toggle(true);
        ok(x.is(':visible'), 'is visible');
        x.toggle(false);
        ok(x.is(':hidden'), 'is hidden');
        x.toggle(true);
        ok(x.is(':visible'), 'is visible again');
    });

})();
