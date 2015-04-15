module('conflict');

test('moreConflict', function() {
    expect(2);

    D.moreConflict();
    strictEqual(window.D, window.jQuery, 'Overwrote jQuery with D.');
    strictEqual(window.D, window.$, 'Overwrote $ with D.');
});