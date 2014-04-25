module('event');

(function() {
	var order = [];

	// Create an event handler.
	var _makeHandler = function(testId) {
		// When returned function is executed, push testId onto `order` array
		// to ensure execution order.
		return function(arg) {
			order.push(testId);
		};
	};

	D(_makeHandler('a'));
	D(_makeHandler('b'));

	noEarlyExecution = order.length === 0;

	// This assumes that QUnit tests are run on DOM ready!
	test('Ready', function() {
		expect(10);

		ok(noEarlyExecution, 'Handlers bound to DOM ready should not execute before DOM ready');

		// Ensure execution order.
		deepEqual(order, ['a', 'b'], 'Bound DOM ready handlers should execute in on-order');

		// Ensure handler argument is correct.
		equal(args.a, D, 'Argument passed to fn in D(fn) should be D');
		equal(args.b, D, 'Argument passed to fn in D(fn) should be D');

		order = [];

		// Now that the ready event has fired, again bind to the ready event.
		// These event handlers should execute immediately.
		D(_makeHandler('g'));
		equal(order.pop(), 'g', 'Event handler should execute immediately');
		equal(args.g, D, 'Argument passed to fn in D(fn) should be D');

	});

})();
