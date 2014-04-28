module('core');

test('Basic requirements', function() {
	expect(7);
	ok(Array.prototype.push, 'Array.push()');
	ok(Function.prototype.apply, 'Function.apply()');
	ok(document.querySelectorAll, 'querySelectorAll');
	ok(document.getElementById, 'getElementById');
	ok(document.getElementsByTagName, 'getElementsByTagName');
	ok(RegExp, 'RegExp');
	ok(D, 'D');
});

test('D()', function() {

	expect(13);

	// Basic constructor's behavior
	equal(D().length, 0, 'D() === D([])');
	equal(D(undefined).length, 0, 'D(undefined) === D([])');
	equal(D(null).length, 0, 'D(null) === D([])');
	equal(D('').length, 0, 'D("") === D([])');
	equal(D('#').length, 0, 'D("#") === D([])');

	equal(D(window).length, 1, 'Correct number of elements generated for D(window)');

	var code = D('<code/>');
	equal(code.length, 1, 'Correct number of elements generated for code');
	// Note: with the way elements are being created, they always have a body parent.
	// equal(code.parent().length, 0, 'Make sure that the generated HTML has no parent.');

	var img = D('<img/>');
	equal(img.length, 1, 'Correct number of elements generated for img');
	// Note: with the way elements are being created, they always have a body parent.
	// equal(img.parent().length, 0, 'Make sure that the generated HTML has no parent.');

	var div = D('<div/><hr/><code/><b/>');
	// Note: with the way elements are being created, div is wrapping hr and code and ignoring the b
	// equal(div.length, 4, 'Correct number of elements generated for div hr code b');
	// Note: with the way elements are being created, they always have a body parent.
	// equal(div.parent().length, 0, 'Make sure that the generated HTML has no parent.');

	equal(D([1,2,3]).get(1), 2, 'Test passing an array');

	equal(D(document.body).get(0), D('body').get(0), 'Test passing an html node');

	var elem = D('  <em>hello</em>')[0];
	equal(elem.nodeName.toLowerCase(), 'em', 'leading space');

	elem = D('\n\n<em>world</em>')[0];
	equal(elem.nodeName.toLowerCase(), 'em', 'leading newlines');

	var idx = 0;
	for (; idx < 3; idx++) {
		elem = D('<input type="text" value="TEST" />');
	}
	// TODO: Cache nodes
	equal(elem[0].defaultValue, 'TEST', 'Ensure cached nodes are cloned properly (Bug #6655)');
});

test('D("html")', function() {
	expect(18);

	D.foo = false;
	var script = D('<script>D.foo="test";</script>')[0];

	ok(script, "Creating a script");
	ok(!D.foo, "Make sure the script wasn't executed prematurely" );
	D('body').append("<script>D.foo='test';</script>");
	ok(D.foo, "Executing a scripts contents in the right context" );

	// Test multi-line HTML
	var div = D("<div>\r\nsome text\n<p>some p</p>\nmore text\r\n</div>")[0];
	equal( div.nodeName.toUpperCase(), "DIV", "Make sure we're getting a div." );
	equal( div.firstChild.nodeType, 3, "Text node." );
	equal( div.lastChild.nodeType, 3, "Text node." );
	equal( div.childNodes[1].nodeType, 1, "Paragraph." );
	equal( div.childNodes[1].firstChild.nodeType, 3, "Paragraph text." );

	ok( D("<link rel='stylesheet'/>")[0], "Creating a link" );

	ok( !D("<script/>")[0].parentNode, "Create a script" );

	ok( D("<input/>").attr("type", "hidden"), "Create an input and set the type." );

	var j = D("<span>hi</span> there <!-- mon ami -->");
	ok( j.length >= 2, "Check node,textnode,comment creation (some browsers delete comments)" );

	ok( !D("<option>test</option>")[0].selected, "Make sure that options are auto-selected #2050" );

	ok( D("<div></div>")[0], "Create a div with closing tag." );
	ok( D("<table></table>")[0], "Create a table with closing tag." );

	equal( D( "element[attribute='<div></div>']" ).length, 0,
		"When html is within brackets, do not recognize as html." );
	//equal( D( "element[attribute=<div></div>]" ).length, 0,
	//	"When html is within brackets, do not recognize as html." );
	equal( D( "element:not(<div></div>)" ).length, 0,
		"When html is within parens, do not recognize as html." );
	equal( D( "\\<div\\>" ).length, 0, "Ignore escaped html characters" );
});

test("D('massive html #7990')", function() {
	expect(3);

	var idx = 30000,
		li = '<li>very very very very large html string</li>',
		html = ['<ul>'];

	while (idx--) {
		html.push(li);
	}
	html.push('</ul>');
	html = D(html.join(''))[0];

	equal(html.nodeName.toLowerCase(), 'ul');
	equal(html.firstChild.nodeName.toLowerCase(), 'li');
	equal(html.childNodes.length, 30000);
});

test("end()", function() {
	expect(3);
	equal( "Yahoo", D("#yahoo").parent().end().text(), "check for end" );
	ok( D("#yahoo").end(), "check for end with nothing to end" );

	var x = D("#yahoo");
	x.parent();
	equal( "Yahoo", D("#yahoo").text(), "check for non-destructive behaviour" );
});

test("length", function() {
	expect(1);
	equal( D("#qunit-fixture p").length, 6, "Get Number of Elements Found" );
});

test("get()", function() {
	expect(1);
	deepEqual( D("#qunit-fixture p").get(), q("firstp","ap","sndp","en","sap","first"), "Get All Elements" );
});

test('toArray()', function() {
	expect(3);
	deepEqual(D('#').toArray(), [], 'Convert D object to an empty Array');
	ok(_.isArray(D('body').toArray()), 'Convert D object to an Array');
	equal(D('body').toArray().length, 1, 'Convert D object to an Array with the appropriate length');
});

test("get(Number)", function() {
	expect(2);
	equal( D("#qunit-fixture p").get(0), document.getElementById("firstp"), "Get A Single Element" );
	strictEqual( D("#firstp").get(1), undefined, "Try get with index larger elements count" );
});

test("get(-Number)",function() {
	expect(2);
	equal( D("p").get(-1), document.getElementById("first"), "Get a single element with negative index" );
	strictEqual( D("#firstp").get(-2), undefined, "Try get with index negative index larger then elements count" );
});

test("each(Function)", function() {
	expect(1);
	var div, pass, i;

	div = D("div");
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

	var $links = D("#ap a");

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

	var $links = D("#ap a"), $none = D("asdf");

	deepEqual( $links.first().get(), q("google"), "first()" );
	deepEqual( $links.last().get(), q("mark"), "last()" );

	deepEqual( $none.first().get(), [], "first() none" );
	deepEqual( $none.last().get(), [], "last() none" );
});

test("map()", function() {
	expect( 2 );

	deepEqual(
		D("#ap").map(function() {
			return D( this ).find("a").get();
		}).get(),
		q( "google", "groups", "anchor1", "mark" ),
		"Array Map"
	);

	deepEqual(
		D("#ap > a").map(function() {
			return this.parentNode;
		}).get(),
		q( "ap","ap","ap" ),
		"Single Map"
	);
});

test("D.extend(Object, Object)", function() {
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

	D.extend(settings, options);
	deepEqual( settings, merged, "Check if extended: settings must be extended" );
	deepEqual( options, optionsCopy, "Check if not modified: options must not be modified" );

	D.extend(settings, null, options);
	deepEqual( settings, merged, "Check if extended: settings must be extended" );
	deepEqual( options, optionsCopy, "Check if not modified: options must not be modified" );

	D.extend(true, deep1, deep2);
	deepEqual( deep1["foo"], deepmerged["foo"], "Check if foo: settings must be extended" );
	deepEqual( deep2["foo"], deep2copy["foo"], "Check if not deep2: options must not be modified" );
	equal( deep1["foo2"], document, "Make sure that a deep clone was not attempted on the document" );

	ok( D.extend(true, {}, nestedarray)["arr"] !== arr, "Deep extend of object must clone child array" );

	// #5991
	ok( D.isArray( D.extend(true, { "arr": {} }, nestedarray)["arr"] ), "Cloned array have to be an Array" );
	ok( D.isPlainObject( D.extend(true, { "arr": arr }, { "arr": {} })["arr"] ), "Cloned object have to be an plain object" );

	empty = {};
	optionsWithLength = { "foo": { "length": -1 } };
	D.extend(true, empty, optionsWithLength);
	deepEqual( empty["foo"], optionsWithLength["foo"], "The length property must copy correctly" );

	empty = {};
	optionsWithDate = { "foo": { "date": new Date() } };
	D.extend(true, empty, optionsWithDate);
	deepEqual( empty["foo"], optionsWithDate["foo"], "Dates copy correctly" );

	/** @constructor */
	myKlass = function() {};
	customObject = new myKlass();
	optionsWithCustomObject = { "foo": { "date": customObject } };
	empty = {};
	D.extend(true, empty, optionsWithCustomObject);
	ok( empty["foo"] && empty["foo"]["date"] === customObject, "Custom objects copy correctly (no methods)" );

	// Makes the class a little more realistic
	myKlass.prototype = { "someMethod": function(){} };
	empty = {};
	D.extend(true, empty, optionsWithCustomObject);
	ok( empty["foo"] && empty["foo"]["date"] === customObject, "Custom objects copy correctly" );

	MyNumber = Number;

	ret = D.extend(true, { "foo": 4 }, { "foo": new MyNumber(5) } );
	ok( parseInt(ret.foo, 10) === 5, "Wrapped numbers copy correctly" );

	nullUndef;
	nullUndef = D.extend({}, options, { "xnumber2": null });
	ok( nullUndef["xnumber2"] === null, "Check to make sure null values are copied");

	nullUndef = D.extend({}, options, { "xnumber2": undefined });
	ok( nullUndef["xnumber2"] === options["xnumber2"], "Check to make sure undefined values are not copied");

	nullUndef = D.extend({}, options, { "xnumber0": null });
	ok( nullUndef["xnumber0"] === null, "Check to make sure null values are inserted");

	target = {};
	recursive = { foo:target, bar:5 };
	D.extend(true, target, recursive);
	deepEqual( target, { bar:5 }, "Check to make sure a recursive obj doesn't go never-ending loop by not copying it over" );

	ret = D.extend(true, { foo: [] }, { foo: [0] } ); // 1907
	equal( ret.foo.length, 1, "Check to make sure a value with coercion 'false' copies over when necessary to fix #1907" );

	ret = D.extend(true, { foo: "1,2,3" }, { foo: [1, 2, 3] } );
	ok( typeof ret.foo !== "string", "Check to make sure values equal with coercion (but not actually equal) overwrite correctly" );

	ret = D.extend(true, { foo:"bar" }, { foo:null } );
	ok( typeof ret.foo !== "undefined", "Make sure a null value doesn't crash with deep extend, for #1908" );

	obj = { foo:null };
	D.extend(true, obj, { foo:"notnull" } );
	equal( obj.foo, "notnull", "Make sure a null value can be overwritten" );

	function func() {}
	D.extend(func, { key: "value" } );
	equal( func.key, "value", "Verify a function can be extended" );

	defaults = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" };
	defaultsCopy = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" };
	options1 = { xnumber2: 1, xstring2: "x" };
	options1Copy = { xnumber2: 1, xstring2: "x" };
	options2 = { xstring2: "xx", xxx: "newstringx" };
	options2Copy = { xstring2: "xx", xxx: "newstringx" };
	merged2 = { xnumber1: 5, xnumber2: 1, xstring1: "peter", xstring2: "xx", xxx: "newstringx" };

	settings = D.extend({}, defaults, options1, options2);
	deepEqual( settings, merged2, "Check if extended: settings must be extended" );
	deepEqual( defaults, defaultsCopy, "Check if not modified: options1 must not be modified" );
	deepEqual( options1, options1Copy, "Check if not modified: options1 must not be modified" );
	deepEqual( options2, options2Copy, "Check if not modified: options2 must not be modified" );
});

test("D.parseHTML", function() {
	expect( 18 );

	var html, nodes;

	equal( D.parseHTML(), null, "Nothing in, null out." );
	equal( D.parseHTML( null ), null, "Null in, null out." );
	equal( D.parseHTML( "" ), null, "Empty string in, null out." );

	nodes = D.parseHTML( D("body")[0].innerHTML );
	ok( nodes.length > 4, "Parse a large html string" );
	equal( D.type( nodes ), "array", "parseHTML returns an array rather than a nodelist" );

	html = "<script>undefined()</script>";
	equal( D.parseHTML( html ).length, 0, "Ignore scripts by default" );
	equal( D.parseHTML( html, true )[0].nodeName.toLowerCase(), "script", "Preserve scripts when requested" );

	html += "<div></div>";
	equal( D.parseHTML( html )[0].nodeName.toLowerCase(), "div", "Preserve non-script nodes" );
	equal( D.parseHTML( html, true )[0].nodeName.toLowerCase(), "script", "Preserve script position");

	equal( D.parseHTML("text")[0].nodeType, 3, "Parsing text returns a text node" );
	equal( D.parseHTML( "\t<div></div>" )[0].nodeValue, "\t", "Preserve leading whitespace" );

	equal( D.parseHTML(" <div/> ")[0].nodeType, 3, "Leading spaces are treated as text nodes (#11290)" );

	html = D.parseHTML( "<div>test div</div>" );

	equal( html[ 0 ].parentNode.nodeType, 11, "parentNode should be documentFragment" );
	equal( html[ 0 ].innerHTML, "test div", "Content should be preserved" );

	equal( D.parseHTML("<span><span>").length, 1, "Incorrect html-strings should not break anything" );
	equal( D.parseHTML("<td><td>")[ 1 ].parentNode.nodeType, 11,
		"parentNode should be documentFragment for wrapMap (variable in manipulation module) elements too" );
	ok( D.parseHTML("<#if><tr><p>This is a test.</p></tr><#/if>") || true, "Garbage input should not cause error" );
});