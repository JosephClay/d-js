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

	test('early execution', function() {
		expect(1);
		ok(order.length === 0, 'Handlers bound to DOM ready should not execute before DOM ready');
	});

	asyncTest('ready', function() {
		expect(5);
		
		// This assumes that QUnit tests are run on DOM ready!
		window.onload = function() {
			console.log('hi');

			// Ensure execution order.
			deepEqual(order, ['a', 'b'], 'Bound DOM ready handlers should execute in on-order');

			// Ensure handler argument is correct.
			equal(args.a, D, 'Argument passed to fn in D(fn) should be D');
			equal(args.b, D, 'Argument passed to fn in D(fn) should be D');

			order = [];

			// Now that the ready event has fired, again bind to the ready event.
			// These event handlers should execute immediately.
			D(_makeHandler('c'));
			equal(order.pop(), 'c', 'Event handler should execute immediately');
			equal(args.c, D, 'Argument passed to fn in D(fn) should be D');

		};
	});

})();
