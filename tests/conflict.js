test('noConflict', function() {
    expect(3);

    var originalD = D,
        DD = D.noConflict();

    strictEqual(originalD, DD, 'noConflict returned the D object');
    equal(window.D, undefined, 'Make sure previous D was reverted.');
    ok(DD(), 'Make sure that D still works.');

    window.D = D = DD;
});

test('moreConflict', function() {
    // expect(2);

    // D.moreConflict();
    // strictEqual(window.D, window.jQuery, 'Overwrote jQuery with D.');
    // strictEqual(window.D, window.$, 'Overwrote $ with D.');
});