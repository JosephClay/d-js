module('ready');

(function() {
    var order = [];

    // Create an event handler.
    var _makeHandler = function(testId) {
        // When returned function is executed, push testId onto `order` array
        // to ensure execution order.
        return function() {
            order.push(testId);
        };
    };

    D(_makeHandler('a'));
    D(_makeHandler('b'));

    test('ready', function() {
        expect(2);

        // Ensure execution order.
        deepEqual(order, ['a', 'b'], 'Bound DOM ready handlers should execute in on-order');

        order = [];

        // Now that the ready event has fired, again bind to the ready event.
        // These event handlers should execute immediately.
        D(_makeHandler('c'));
        equal(order.pop(), 'c', 'Event handler should execute immediately');
    });

})();
