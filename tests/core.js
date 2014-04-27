module('core');

test('Basic requirements', function() {
	expect(8);
	ok(Array.prototype.push, 'Array.push()');
	ok(Function.prototype.apply, 'Function.apply()');
	ok(document.querySelectorAll, 'querySelectorAll');
	ok(document.getElementById, 'getElementById');
	ok(document.getElementsByTagName, 'getElementsByTagName');
	ok(RegExp, 'RegExp');
	ok(jQuery, 'jQuery');
	ok($, '$');
});

test('jQuery()', function() {

	var elem, i,
		obj = jQuery("div"),
		code = jQuery("<code/>"),
		img = jQuery("<img/>"),
		div = jQuery("<div/><hr/><code/><b/>"),
		exec = false,
		lng = "",
		attrObj = {
			"text": "test",
			"class": "test2",
			"id": "test3"
		};

	expect(22);

	// Basic constructor's behavior
	equal(D().length, 0, 'D() === D([])');
	equal(D(undefined).length, 0, 'D(undefined) === D([])');
	equal(D(null).length, 0, 'D(null) === D([])');
	equal(D('').length, 0, 'D("") === D([])');
	equal(D('#').length, 0, 'D("#") === D([])');

	equal(jQuery(obj).selector, "div", "jQuery(jQueryObj) == jQueryObj");

	// can actually yield more than one, when iframes are included, the window is an array as well
	equal(jQuery(window).length, 1, "Correct number of elements generated for jQuery(window)");

	equal(code.length, 1, "Correct number of elements generated for code");
	equal(code.parent().length, 0, "Make sure that the generated HTML has no parent.");

	equal(img.length, 1, "Correct number of elements generated for img");
	equal(img.parent().length, 0, "Make sure that the generated HTML has no parent.");

	equal(div.length, 4, "Correct number of elements generated for div hr code b");
	equal(div.parent().length, 0, "Make sure that the generated HTML has no parent.");

	equal(jQuery([1,2,3]).get(1), 2, "Test passing an array");

	equal(jQuery(document.body).get(0), jQuery("body").get(0), "Test passing an html node");

	elem = jQuery("  <em>hello</em>")[0];
	equal( elem.nodeName.toLowerCase(), "em", "leading space" );

	elem = jQuery("\n\n<em>world</em>")[0];
	equal( elem.nodeName.toLowerCase(), "em", "leading newlines" );

	elem = jQuery("<div/>", attrObj );

	if ( jQuery.fn.width ) {
		equal( elem[0].style.width, "10px", "jQuery() quick setter width");
	}

	if ( jQuery.fn.offset ) {
		equal( elem[0].style.top, "1px", "jQuery() quick setter offset");
	}

	if ( jQuery.fn.css ) {
		equal( elem[0].style.paddingLeft, "1px", "jQuery quick setter css");
		equal( elem[0].style.paddingRight, "1px", "jQuery quick setter css");
	}

	if ( jQuery.fn.attr ) {
		equal( elem[0].getAttribute("desired"), "very", "jQuery quick setter attr");
	}

	equal( elem[0].childNodes.length, 1, "jQuery quick setter text");
	equal( elem[0].firstChild.nodeValue, "test", "jQuery quick setter text");
	equal( elem[0].className, "test2", "jQuery() quick setter class");
	equal( elem[0].id, "test3", "jQuery() quick setter id");

	exec = true;
	elem.trigger("click");

	// manually clean up detached elements
	elem.remove();

	for ( i = 0; i < 3; ++i ) {
		elem = jQuery("<input type='text' value='TEST' />");
	}
	equal( elem[0].defaultValue, "TEST", "Ensure cached nodes are cloned properly (Bug #6655)" );

	// manually clean up detached elements
	elem.remove();

	for ( i = 0; i < 128; i++ ) {
		lng += "12345678";
	}
});

test("jQuery(selector, context)", function() {
	expect(3);
	deepEqual( jQuery("div p", "#qunit-fixture").get(), q("sndp", "en", "sap"), "Basic selector with string as context" );
	deepEqual( jQuery("div p", q("qunit-fixture")[0]).get(), q("sndp", "en", "sap"), "Basic selector with element as context" );
	deepEqual( jQuery("div p", jQuery("#qunit-fixture")).get(), q("sndp", "en", "sap"), "Basic selector with jQuery object as context" );
});

test( "selector state", function() {
	expect( 18 );

	var test;

	test = jQuery( undefined );
	equal( test.selector, "", "Empty jQuery Selector" );
	equal( test.context, undefined, "Empty jQuery Context" );

	test = jQuery( document );
	equal( test.selector, "", "Document Selector" );
	equal( test.context, document, "Document Context" );

	test = jQuery( document.body );
	equal( test.selector, "", "Body Selector" );
	equal( test.context, document.body, "Body Context" );

	test = jQuery("#qunit-fixture");
	equal( test.selector, "#qunit-fixture", "#qunit-fixture Selector" );
	equal( test.context, document, "#qunit-fixture Context" );

	test = jQuery("#notfoundnono");
	equal( test.selector, "#notfoundnono", "#notfoundnono Selector" );
	equal( test.context, document, "#notfoundnono Context" );

	test = jQuery( "#qunit-fixture", document );
	equal( test.selector, "#qunit-fixture", "#qunit-fixture Selector" );
	equal( test.context, document, "#qunit-fixture Context" );

	test = jQuery( "#qunit-fixture", document.body );
	equal( test.selector, "#qunit-fixture", "#qunit-fixture Selector" );
	equal( test.context, document.body, "#qunit-fixture Context" );

	// Test cloning
	test = jQuery( test );
	equal( test.selector, "#qunit-fixture", "#qunit-fixture Selector" );
	equal( test.context, document.body, "#qunit-fixture Context" );

	test = jQuery( document.body ).find("#qunit-fixture");
	equal( test.selector, "#qunit-fixture", "#qunit-fixture find Selector" );
	equal( test.context, document.body, "#qunit-fixture find Context" );
});

test("noConflict", function() {
	expect(7);

	var $$ = jQuery;

	strictEqual( jQuery, jQuery.noConflict(), "noConflict returned the jQuery object" );
	strictEqual( window["jQuery"], $$, "Make sure jQuery wasn't touched." );
	strictEqual( window["$"], original$, "Make sure $ was reverted." );

	jQuery = $ = $$;

	strictEqual( jQuery.noConflict(true), $$, "noConflict returned the jQuery object" );
	strictEqual( window["jQuery"], originaljQuery, "Make sure jQuery was reverted." );
	strictEqual( window["$"], original$, "Make sure $ was reverted." );
	ok( $$().pushStack([]), "Make sure that jQuery still works." );

	window["jQuery"] = jQuery = $$;
});

test("jQuery('html')", function() {
	expect( 18 );

	var s, div, j;

	jQuery["foo"] = false;
	s = jQuery("<script>jQuery.foo='test';</script>")[0];
	ok( s, "Creating a script" );
	ok( !jQuery["foo"], "Make sure the script wasn't executed prematurely" );
	jQuery("body").append("<script>jQuery.foo='test';</script>");
	ok( jQuery["foo"], "Executing a scripts contents in the right context" );

	// Test multi-line HTML
	div = jQuery("<div>\r\nsome text\n<p>some p</p>\nmore text\r\n</div>")[0];
	equal( div.nodeName.toUpperCase(), "DIV", "Make sure we're getting a div." );
	equal( div.firstChild.nodeType, 3, "Text node." );
	equal( div.lastChild.nodeType, 3, "Text node." );
	equal( div.childNodes[1].nodeType, 1, "Paragraph." );
	equal( div.childNodes[1].firstChild.nodeType, 3, "Paragraph text." );

	ok( jQuery("<link rel='stylesheet'/>")[0], "Creating a link" );

	ok( !jQuery("<script/>")[0].parentNode, "Create a script" );

	ok( jQuery("<input/>").attr("type", "hidden"), "Create an input and set the type." );

	j = jQuery("<span>hi</span> there <!-- mon ami -->");
	ok( j.length >= 2, "Check node,textnode,comment creation (some browsers delete comments)" );

	ok( !jQuery("<option>test</option>")[0].selected, "Make sure that options are auto-selected #2050" );

	ok( jQuery("<div></div>")[0], "Create a div with closing tag." );
	ok( jQuery("<table></table>")[0], "Create a table with closing tag." );

	equal( jQuery( "element[attribute='<div></div>']" ).length, 0,
		"When html is within brackets, do not recognize as html." );
	//equal( jQuery( "element[attribute=<div></div>]" ).length, 0,
	//	"When html is within brackets, do not recognize as html." );
	equal( jQuery( "element:not(<div></div>)" ).length, 0,
		"When html is within parens, do not recognize as html." );
	equal( jQuery( "\\<div\\>" ).length, 0, "Ignore escaped html characters" );
});

test("jQuery('massive html #7990')", function() {
	expect( 3 );

	var i,
		li = "<li>very very very very large html string</li>",
		html = ["<ul>"];

	for ( i = 0; i < 30000; i += 1 ) {
		html[html.length] = li;
	}
	html[html.length] = "</ul>";
	html = jQuery(html.join(""))[0];
	equal( html.nodeName.toLowerCase(), "ul");
	equal( html.firstChild.nodeName.toLowerCase(), "li");
	equal( html.childNodes.length, 30000 );
});

test("end()", function() {
	expect(3);
	equal( "Yahoo", jQuery("#yahoo").parent().end().text(), "check for end" );
	ok( jQuery("#yahoo").end(), "check for end with nothing to end" );

	var x = jQuery("#yahoo");
	x.parent();
	equal( "Yahoo", jQuery("#yahoo").text(), "check for non-destructive behaviour" );
});

test("length", function() {
	expect(1);
	equal( jQuery("#qunit-fixture p").length, 6, "Get Number of Elements Found" );
});

test("get()", function() {
	expect(1);
	deepEqual( jQuery("#qunit-fixture p").get(), q("firstp","ap","sndp","en","sap","first"), "Get All Elements" );
});

test("toArray()", function() {
	expect(1);
	deepEqual( jQuery("#qunit-fixture p").toArray(),
		q("firstp","ap","sndp","en","sap","first"),
		"Convert jQuery object to an Array" );
});

test("get(Number)", function() {
	expect(2);
	equal( jQuery("#qunit-fixture p").get(0), document.getElementById("firstp"), "Get A Single Element" );
	strictEqual( jQuery("#firstp").get(1), undefined, "Try get with index larger elements count" );
});

test("get(-Number)",function() {
	expect(2);
	equal( jQuery("p").get(-1), document.getElementById("first"), "Get a single element with negative index" );
	strictEqual( jQuery("#firstp").get(-2), undefined, "Try get with index negative index larger then elements count" );
});

test("each(Function)", function() {
	expect(1);
	var div, pass, i;

	div = jQuery("div");
	div.each(function(){this.foo = "zoo";});
	pass = true;
	for ( i = 0; i < div.length; i++ ) {
		if ( div.get(i).foo !== "zoo" ) {
			pass = false;
		}
	}
	ok( pass, "Execute a function, Relative" );
});

test("slice()", function() {
	expect(7);

	var $links = jQuery("#ap a");

	deepEqual( $links.slice(1,2).get(), q("groups"), "slice(1,2)" );
	deepEqual( $links.slice(1).get(), q("groups", "anchor1", "mark"), "slice(1)" );
	deepEqual( $links.slice(0,3).get(), q("google", "groups", "anchor1"), "slice(0,3)" );
	deepEqual( $links.slice(-1).get(), q("mark"), "slice(-1)" );

	deepEqual( $links.eq(1).get(), q("groups"), "eq(1)" );
	deepEqual( $links.eq("2").get(), q("anchor1"), "eq('2')" );
	deepEqual( $links.eq(-1).get(), q("mark"), "eq(-1)" );
});

test("first()/last()", function() {
	expect(4);

	var $links = jQuery("#ap a"), $none = jQuery("asdf");

	deepEqual( $links.first().get(), q("google"), "first()" );
	deepEqual( $links.last().get(), q("mark"), "last()" );

	deepEqual( $none.first().get(), [], "first() none" );
	deepEqual( $none.last().get(), [], "last() none" );
});

test("map()", function() {
	expect( 2 );

	deepEqual(
		jQuery("#ap").map(function() {
			return jQuery( this ).find("a").get();
		}).get(),
		q( "google", "groups", "anchor1", "mark" ),
		"Array Map"
	);

	deepEqual(
		jQuery("#ap > a").map(function() {
			return this.parentNode;
		}).get(),
		q( "ap","ap","ap" ),
		"Single Map"
	);
});

test("jQuery.extend(Object, Object)", function() {
	expect(28);

	var empty, optionsWithLength, optionsWithDate, myKlass,
		customObject, optionsWithCustomObject, MyNumber, ret,
		nullUndef, target, recursive, obj,
		defaults, defaultsCopy, options1, options1Copy, options2, options2Copy, merged2,
		settings = { "xnumber1": 5, "xnumber2": 7, "xstring1": "peter", "xstring2": "pan" },
		options = { "xnumber2": 1, "xstring2": "x", "xxx": "newstring" },
		optionsCopy = { "xnumber2": 1, "xstring2": "x", "xxx": "newstring" },
		merged = { "xnumber1": 5, "xnumber2": 1, "xstring1": "peter", "xstring2": "x", "xxx": "newstring" },
		deep1 = { "foo": { "bar": true } },
		deep2 = { "foo": { "baz": true }, "foo2": document },
		deep2copy = { "foo": { "baz": true }, "foo2": document },
		deepmerged = { "foo": { "bar": true, "baz": true }, "foo2": document },
		arr = [1, 2, 3],
		nestedarray = { "arr": arr };

	jQuery.extend(settings, options);
	deepEqual( settings, merged, "Check if extended: settings must be extended" );
	deepEqual( options, optionsCopy, "Check if not modified: options must not be modified" );

	jQuery.extend(settings, null, options);
	deepEqual( settings, merged, "Check if extended: settings must be extended" );
	deepEqual( options, optionsCopy, "Check if not modified: options must not be modified" );

	jQuery.extend(true, deep1, deep2);
	deepEqual( deep1["foo"], deepmerged["foo"], "Check if foo: settings must be extended" );
	deepEqual( deep2["foo"], deep2copy["foo"], "Check if not deep2: options must not be modified" );
	equal( deep1["foo2"], document, "Make sure that a deep clone was not attempted on the document" );

	ok( jQuery.extend(true, {}, nestedarray)["arr"] !== arr, "Deep extend of object must clone child array" );

	// #5991
	ok( jQuery.isArray( jQuery.extend(true, { "arr": {} }, nestedarray)["arr"] ), "Cloned array have to be an Array" );
	ok( jQuery.isPlainObject( jQuery.extend(true, { "arr": arr }, { "arr": {} })["arr"] ), "Cloned object have to be an plain object" );

	empty = {};
	optionsWithLength = { "foo": { "length": -1 } };
	jQuery.extend(true, empty, optionsWithLength);
	deepEqual( empty["foo"], optionsWithLength["foo"], "The length property must copy correctly" );

	empty = {};
	optionsWithDate = { "foo": { "date": new Date() } };
	jQuery.extend(true, empty, optionsWithDate);
	deepEqual( empty["foo"], optionsWithDate["foo"], "Dates copy correctly" );

	/** @constructor */
	myKlass = function() {};
	customObject = new myKlass();
	optionsWithCustomObject = { "foo": { "date": customObject } };
	empty = {};
	jQuery.extend(true, empty, optionsWithCustomObject);
	ok( empty["foo"] && empty["foo"]["date"] === customObject, "Custom objects copy correctly (no methods)" );

	// Makes the class a little more realistic
	myKlass.prototype = { "someMethod": function(){} };
	empty = {};
	jQuery.extend(true, empty, optionsWithCustomObject);
	ok( empty["foo"] && empty["foo"]["date"] === customObject, "Custom objects copy correctly" );

	MyNumber = Number;

	ret = jQuery.extend(true, { "foo": 4 }, { "foo": new MyNumber(5) } );
	ok( parseInt(ret.foo, 10) === 5, "Wrapped numbers copy correctly" );

	nullUndef;
	nullUndef = jQuery.extend({}, options, { "xnumber2": null });
	ok( nullUndef["xnumber2"] === null, "Check to make sure null values are copied");

	nullUndef = jQuery.extend({}, options, { "xnumber2": undefined });
	ok( nullUndef["xnumber2"] === options["xnumber2"], "Check to make sure undefined values are not copied");

	nullUndef = jQuery.extend({}, options, { "xnumber0": null });
	ok( nullUndef["xnumber0"] === null, "Check to make sure null values are inserted");

	target = {};
	recursive = { foo:target, bar:5 };
	jQuery.extend(true, target, recursive);
	deepEqual( target, { bar:5 }, "Check to make sure a recursive obj doesn't go never-ending loop by not copying it over" );

	ret = jQuery.extend(true, { foo: [] }, { foo: [0] } ); // 1907
	equal( ret.foo.length, 1, "Check to make sure a value with coercion 'false' copies over when necessary to fix #1907" );

	ret = jQuery.extend(true, { foo: "1,2,3" }, { foo: [1, 2, 3] } );
	ok( typeof ret.foo !== "string", "Check to make sure values equal with coercion (but not actually equal) overwrite correctly" );

	ret = jQuery.extend(true, { foo:"bar" }, { foo:null } );
	ok( typeof ret.foo !== "undefined", "Make sure a null value doesn't crash with deep extend, for #1908" );

	obj = { foo:null };
	jQuery.extend(true, obj, { foo:"notnull" } );
	equal( obj.foo, "notnull", "Make sure a null value can be overwritten" );

	function func() {}
	jQuery.extend(func, { key: "value" } );
	equal( func.key, "value", "Verify a function can be extended" );

	defaults = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" };
	defaultsCopy = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" };
	options1 = { xnumber2: 1, xstring2: "x" };
	options1Copy = { xnumber2: 1, xstring2: "x" };
	options2 = { xstring2: "xx", xxx: "newstringx" };
	options2Copy = { xstring2: "xx", xxx: "newstringx" };
	merged2 = { xnumber1: 5, xnumber2: 1, xstring1: "peter", xstring2: "xx", xxx: "newstringx" };

	settings = jQuery.extend({}, defaults, options1, options2);
	deepEqual( settings, merged2, "Check if extended: settings must be extended" );
	deepEqual( defaults, defaultsCopy, "Check if not modified: options1 must not be modified" );
	deepEqual( options1, options1Copy, "Check if not modified: options1 must not be modified" );
	deepEqual( options2, options2Copy, "Check if not modified: options2 must not be modified" );
});

test("jQuery.parseHTML", function() {
	expect( 18 );

	var html, nodes;

	equal( jQuery.parseHTML(), null, "Nothing in, null out." );
	equal( jQuery.parseHTML( null ), null, "Null in, null out." );
	equal( jQuery.parseHTML( "" ), null, "Empty string in, null out." );

	nodes = jQuery.parseHTML( jQuery("body")[0].innerHTML );
	ok( nodes.length > 4, "Parse a large html string" );
	equal( jQuery.type( nodes ), "array", "parseHTML returns an array rather than a nodelist" );

	html = "<script>undefined()</script>";
	equal( jQuery.parseHTML( html ).length, 0, "Ignore scripts by default" );
	equal( jQuery.parseHTML( html, true )[0].nodeName.toLowerCase(), "script", "Preserve scripts when requested" );

	html += "<div></div>";
	equal( jQuery.parseHTML( html )[0].nodeName.toLowerCase(), "div", "Preserve non-script nodes" );
	equal( jQuery.parseHTML( html, true )[0].nodeName.toLowerCase(), "script", "Preserve script position");

	equal( jQuery.parseHTML("text")[0].nodeType, 3, "Parsing text returns a text node" );
	equal( jQuery.parseHTML( "\t<div></div>" )[0].nodeValue, "\t", "Preserve leading whitespace" );

	equal( jQuery.parseHTML(" <div/> ")[0].nodeType, 3, "Leading spaces are treated as text nodes (#11290)" );

	html = jQuery.parseHTML( "<div>test div</div>" );

	equal( html[ 0 ].parentNode.nodeType, 11, "parentNode should be documentFragment" );
	equal( html[ 0 ].innerHTML, "test div", "Content should be preserved" );

	equal( jQuery.parseHTML("<span><span>").length, 1, "Incorrect html-strings should not break anything" );
	equal( jQuery.parseHTML("<td><td>")[ 1 ].parentNode.nodeType, 11,
		"parentNode should be documentFragment for wrapMap (variable in manipulation module) elements too" );
	ok( jQuery.parseHTML("<#if><tr><p>This is a test.</p></tr><#/if>") || true, "Garbage input should not cause error" );
});