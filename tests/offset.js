(function() {

	if ( !jQuery.fn.offset ) {
		return;
	}

	var supportsScroll, supportsFixedPosition,
		forceScroll = jQuery("<div/>").css({ width: 2000, height: 2000 }),
		checkSupport = function() {
			// Only run once
			checkSupport = false;

			var checkFixed = jQuery("<div/>").css({ position: "fixed", top: "20px" }).appendTo("#qunit-fixture");

			// Must append to body because #qunit-fixture is hidden and elements inside it don't have a scrollTop
			forceScroll.appendTo("body");
			window.scrollTo( 200, 200 );
			supportsScroll = document.documentElement.scrollTop || document.body.scrollTop;
			forceScroll.detach();

			supportsFixedPosition = checkFixed[0].offsetTop === 20;
			checkFixed.remove();
		};

	module("offset", { setup: function(){
		if ( typeof checkSupport === "function" ) {
			checkSupport();
		}

		// Force a scroll value on the main window to ensure incorrect results
		// if offset is using the scroll offset of the parent window
		forceScroll.appendTo("body");
		window.scrollTo( 1, 1 );
		forceScroll.detach();
	}, teardown: moduleTeardown });

	/*
		Closure-compiler will roll static methods off of the jQuery object and so they will
		not be passed with the jQuery object across the windows. To differentiate this, the
		testIframe callbacks use the "$" symbol to refer to the jQuery object passed from
		the iframe window and the "jQuery" symbol is used to access any static methods.
	*/

	test("empty set", function() {
		expect(2);
		strictEqual( jQuery().offset(), undefined, "offset() returns undefined for empty set (#11962)" );
		strictEqual( jQuery().position(), undefined, "position() returns undefined for empty set (#11962)" );
	});

	test("object without getBoundingClientRect", function() {
		expect(2);

		// Simulates a browser without gBCR on elements, we just want to return 0,0
		var result = jQuery({ ownerDocument: document }).offset();
		equal( result.top, 0, "Check top" );
		equal( result.left, 0, "Check left" );
	});

	test("disconnected node", function() {
		expect(2);

		var result = jQuery( document.createElement("div") ).offset();

		equal( result.top, 0, "Check top" );
		equal( result.left, 0, "Check left" );
	});

	testIframe("offset/absolute", "absolute", function($, iframe) {
		expect(4);

		var doc = iframe.document,
				tests;

		// get offset
		tests = [
			{ "id": "#absolute-1", "top": 1, "left": 1 }
		];
		jQuery.each( tests, function() {
			equal( jQuery( this["id"], doc ).offset().top,  this["top"],  "jQuery('" + this["id"] + "').offset().top" );
			equal( jQuery( this["id"], doc ).offset().left, this["left"], "jQuery('" + this["id"] + "').offset().left" );
		});


		// get position
		tests = [
			{ "id": "#absolute-1", "top": 0, "left": 0 }
		];
		jQuery.each( tests, function() {
			equal( jQuery( this["id"], doc ).position().top,  this["top"],  "jQuery('" + this["id"] + "').position().top" );
			equal( jQuery( this["id"], doc ).position().left, this["left"], "jQuery('" + this["id"] + "').position().left" );
		});
	});

	testIframe("offset/absolute", "absolute", function( $ ) {
		expect(178);

		var tests, offset;

		// get offset tests
		tests = [
			{ "id": "#absolute-1",     "top":  1, "left":  1 },
			{ "id": "#absolute-1-1",   "top":  5, "left":  5 },
			{ "id": "#absolute-1-1-1", "top":  9, "left":  9 },
			{ "id": "#absolute-2",     "top": 20, "left": 20 }
		];
		jQuery.each( tests, function() {
			equal( $( this["id"] ).offset().top,  this["top"],  "jQuery('" + this["id"] + "').offset().top" );
			equal( $( this["id"] ).offset().left, this["left"], "jQuery('" + this["id"] + "').offset().left" );
		});


		// get position
		tests = [
			{ "id": "#absolute-1",     "top":  0, "left":  0 },
			{ "id": "#absolute-1-1",   "top":  1, "left":  1 },
			{ "id": "#absolute-1-1-1", "top":  1, "left":  1 },
			{ "id": "#absolute-2",     "top": 19, "left": 19 }
		];
		jQuery.each( tests, function() {
			equal( $( this["id"] ).position().top,  this["top"],  "jQuery('" + this["id"] + "').position().top" );
			equal( $( this["id"] ).position().left, this["left"], "jQuery('" + this["id"] + "').position().left" );
		});

		// test #5781
		offset = $( "#positionTest" ).offset({ "top": 10, "left": 10 }).offset();
		equal( offset.top,  10, "Setting offset on element with position absolute but 'auto' values." );
		equal( offset.left, 10, "Setting offset on element with position absolute but 'auto' values." );


		// set offset
		tests = [
			{ "id": "#absolute-2",     "top": 30, "left": 30 },
			{ "id": "#absolute-2",     "top": 10, "left": 10 },
			{ "id": "#absolute-2",     "top": -1, "left": -1 },
			{ "id": "#absolute-2",     "top": 19, "left": 19 },
			{ "id": "#absolute-1-1-1", "top": 15, "left": 15 },
			{ "id": "#absolute-1-1-1", "top":  5, "left":  5 },
			{ "id": "#absolute-1-1-1", "top": -1, "left": -1 },
			{ "id": "#absolute-1-1-1", "top":  9, "left":  9 },
			{ "id": "#absolute-1-1",   "top": 10, "left": 10 },
			{ "id": "#absolute-1-1",   "top":  0, "left":  0 },
			{ "id": "#absolute-1-1",   "top": -1, "left": -1 },
			{ "id": "#absolute-1-1",   "top":  5, "left":  5 },
			{ "id": "#absolute-1",     "top":  2, "left":  2 },
			{ "id": "#absolute-1",     "top":  0, "left":  0 },
			{ "id": "#absolute-1",     "top": -1, "left": -1 },
			{ "id": "#absolute-1",     "top":  1, "left":  1 }
		];
		jQuery.each( tests, function() {
			$( this["id"] ).offset({ "top": this["top"], "left": this["left"] });
			equal( $( this["id"] ).offset().top,  this["top"],  "jQuery('" + this["id"] + "').offset({ top: "  + this["top"]  + " })" );
			equal( $( this["id"] ).offset().left, this["left"], "jQuery('" + this["id"] + "').offset({ left: " + this["left"] + " })" );

			var top = this["top"], left = this["left"];

			$( this["id"] ).offset(function(i, val){
				equal( val.top, top, "Verify incoming top position." );
				equal( val.left, left, "Verify incoming top position." );
				return { "top": top + 1, "left": left + 1 };
			});
			equal( $( this["id"] ).offset().top,  this["top"]  + 1, "jQuery('" + this["id"] + "').offset({ top: "  + (this["top"]  + 1) + " })" );
			equal( $( this["id"] ).offset().left, this["left"] + 1, "jQuery('" + this["id"] + "').offset({ left: " + (this["left"] + 1) + " })" );

			$( this["id"] )
				.offset({ "left": this["left"] + 2 })
				.offset({ "top":  this["top"]  + 2 });
			equal( $( this["id"] ).offset().top,  this["top"]  + 2, "Setting one property at a time." );
			equal( $( this["id"] ).offset().left, this["left"] + 2, "Setting one property at a time." );

			$( this["id"] ).offset({ "top": this["top"], "left": this["left"], "using": function( props ) {
				$( this ).css({
					"top":  props.top  + 1,
					"left": props.left + 1
				});
			}});
			equal( $( this["id"] ).offset().top,  this["top"]  + 1, "jQuery('" + this["id"] + "').offset({ top: "  + (this["top"]  + 1) + ", using: fn })" );
			equal( $( this["id"] ).offset().left, this["left"] + 1, "jQuery('" + this["id"] + "').offset({ left: " + (this["left"] + 1) + ", using: fn })" );
		});
	});

	testIframe("offset/relative", "relative", function( $ ) {
		expect(60);

		// get offset
		var tests = [
			{ "id": "#relative-1",   "top":   7, "left":  7 },
			{ "id": "#relative-1-1", "top":  15, "left": 15 },
			{ "id": "#relative-2",   "top": 142, "left": 27 }
		];
		jQuery.each( tests, function() {
			equal( $( this["id"] ).offset().top,  this["top"],  "jQuery('" + this["id"] + "').offset().top" );
			equal( $( this["id"] ).offset().left, this["left"], "jQuery('" + this["id"] + "').offset().left" );
		});


		// get position
		tests = [
			{ "id": "#relative-1",   "top":   6, "left":  6 },
			{ "id": "#relative-1-1", "top":   5, "left":  5 },
			{ "id": "#relative-2",   "top": 141, "left": 26 }
		];
		jQuery.each( tests, function() {
			equal( $( this["id"] ).position().top,  this["top"],  "jQuery('" + this["id"] + "').position().top" );
			equal( $( this["id"] ).position().left, this["left"], "jQuery('" + this["id"] + "').position().left" );
		});


		// set offset
		tests = [
			{ "id": "#relative-2",   "top": 200, "left":  50 },
			{ "id": "#relative-2",   "top": 100, "left":  10 },
			{ "id": "#relative-2",   "top":  -5, "left":  -5 },
			{ "id": "#relative-2",   "top": 142, "left":  27 },
			{ "id": "#relative-1-1", "top": 100, "left": 100 },
			{ "id": "#relative-1-1", "top":   5, "left":   5 },
			{ "id": "#relative-1-1", "top":  -1, "left":  -1 },
			{ "id": "#relative-1-1", "top":  15, "left":  15 },
			{ "id": "#relative-1",   "top": 100, "left": 100 },
			{ "id": "#relative-1",   "top":   0, "left":   0 },
			{ "id": "#relative-1",   "top":  -1, "left":  -1 },
			{ "id": "#relative-1",   "top":   7, "left":   7 }
		];
		jQuery.each( tests, function() {
			$( this["id"] ).offset({ "top": this["top"], "left": this["left"] });
			equal( $( this["id"] ).offset().top,  this["top"],  "jQuery('" + this["id"] + "').offset({ top: "  + this["top"]  + " })" );
			equal( $( this["id"] ).offset().left, this["left"], "jQuery('" + this["id"] + "').offset({ left: " + this["left"] + " })" );

			$( this["id"] ).offset({ "top": this["top"], "left": this["left"], "using": function( props ) {
				$( this ).css({
					"top":  props.top  + 1,
					"left": props.left + 1
				});
			}});
			equal( $( this["id"] ).offset().top,  this["top"]  + 1, "jQuery('" + this["id"] + "').offset({ top: "  + (this["top"]  + 1) + ", using: fn })" );
			equal( $( this["id"] ).offset().left, this["left"] + 1, "jQuery('" + this["id"] + "').offset({ left: " + (this["left"] + 1) + ", using: fn })" );
		});
	});

	test("chaining", function() {
		expect(3);
		var coords = { "top":  1, "left":  1 };
		equal( jQuery("#absolute-1").offset(coords).selector, "#absolute-1", "offset(coords) returns jQuery object" );
		equal( jQuery("#non-existent").offset(coords).selector, "#non-existent", "offset(coords) with empty jQuery set returns jQuery object" );
		equal( jQuery("#absolute-1").offset(undefined).selector, "#absolute-1", "offset(undefined) returns jQuery object (#5571)" );
	});

	test("offsetParent", function(){
		expect(13);

		var body, header, div, area;

		body = jQuery("body").offsetParent();
		equal( body.length, 1, "Only one offsetParent found." );
		equal( body[0], document.documentElement, "The html element is the offsetParent of the body." );

		header = jQuery("#qunit").offsetParent();
		equal( header.length, 1, "Only one offsetParent found." );
		equal( header[0], document.documentElement, "The html element is the offsetParent of #qunit." );

		div = jQuery("#nothiddendivchild").offsetParent();
		equal( div.length, 1, "Only one offsetParent found." );
		equal( div[0], document.getElementById("qunit-fixture"), "The #qunit-fixture is the offsetParent of #nothiddendivchild." );

		jQuery("#nothiddendiv").css("position", "relative");

		div = jQuery("#nothiddendivchild").offsetParent();
		equal( div.length, 1, "Only one offsetParent found." );
		equal( div[0], jQuery("#nothiddendiv")[0], "The div is the offsetParent." );

		div = jQuery("body, #nothiddendivchild").offsetParent();
		equal( div.length, 2, "Two offsetParent found." );
		equal( div[0], document.documentElement, "The html element is the offsetParent of the body." );
		equal( div[1], jQuery("#nothiddendiv")[0], "The div is the offsetParent." );

		area = jQuery("#imgmap area").offsetParent();
		equal( area[0], document.documentElement, "The html element is the offsetParent of the body." );

		div = jQuery("<div>").css({ "position": "absolute" }).appendTo("body");
		equal( div.offsetParent()[0], document.documentElement, "Absolutely positioned div returns html as offset parent, see #12139" );

		div.remove();
	});

	test("fractions (see #7730 and #7885)", function() {
		expect(2);

		jQuery("body").append("<div id='fractions'/>");

		var result,
			expected = { "top": 1000, "left": 1000 },
			div = jQuery("#fractions");

		div.css({
			"position": "absolute",
			"left": "1000.7432222px",
			"top": "1000.532325px",
			"width": 100,
			"height": 100
		});

		div.offset(expected);

		result = div.offset();

		equal( result.top, expected.top, "Check top" );
		equal( result.left, expected.left, "Check left" );

		div.remove();
	});

})();
