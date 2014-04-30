(function() {

	module("show/hide");

	test("sanity check", function() {
		expect(1);
		ok( jQuery("#dl:visible, #qunit-fixture:visible, #foo:visible").length === 3, "QUnit state is correct for testing effects" );
	});

	test("show() basic", 2, function() {
		var div,
			hiddendiv = jQuery("div.hidden");

		hiddendiv.hide().show();

		equal( hiddendiv.css("display"), "block", "Make sure a pre-hidden div is visible." );

		div = jQuery("<div>").hide().appendTo("#qunit-fixture").show();

		equal( div.css("display"), "block", "Make sure pre-hidden divs show" );

		// Clean up the detached node
		div.remove();

		QUnit.expectJqData(hiddendiv, "olddisplay");
	});

	// Supports #7397
	test("Persist correct display value", function() {
		expect(3);

		// #show-tests * is set display: none in CSS
		jQuery("#qunit-fixture").append("<div id='show-tests'><span style='position:absolute;'>foo</span></div>");

		var $span = jQuery("#show-tests span"),
			displayNone = $span.css("display"),
			display = "",
			clock = this.clock;

		$span.show();

		display = $span.css("display");

		$span.hide();

		$span.fadeIn(100, function() {
			equal($span.css("display"), display, "Expecting display: " + display);
			$span.fadeOut(100, function () {
				equal($span.css("display"), displayNone, "Expecting display: " + displayNone);
				$span.fadeIn(100, function() {
					equal($span.css("display"), display, "Expecting display: " + display);
				});
			});
		});

		clock.tick( 300 );

		QUnit.expectJqData($span, "olddisplay");
	});

	test("toggle()", function() {
		expect(6);
		var x = jQuery("#foo");
		ok( x.is(":visible"), "is visible" );
		x.toggle();
		ok( x.is(":hidden"), "is hidden" );
		x.toggle();
		ok( x.is(":visible"), "is visible again" );

		x.toggle(true);
		ok( x.is(":visible"), "is visible" );
		x.toggle(false);
		ok( x.is(":hidden"), "is hidden" );
		x.toggle(true);
		ok( x.is(":visible"), "is visible again" );
	});

})();
