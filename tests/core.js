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

test('length', function() {
	expect(1);

	equal(D('#TestDiv p').length, 3, 'Get Number of Elements Found');
});

test('toArray()', function() {
	expect(4);

	deepEqual(D('#').toArray(), [], 'Convert D object to an empty Array');
	ok(_.isArray(D('body').toArray()), 'Convert D object to an Array');
	equal(D('body').toArray().length, 1, 'Convert D object to an Array with the appropriate length');
	deepEqual(D('body').toArray(), [document.body], 'Convert D object to an Array of elements');
});

test('get()', function() {
	expect(1);
	equal(D('#TestDiv p').get().length, 3, 'Get All Elements');
});

test('get(Number)', function() {
	expect(2);

	equal(D('#TestDiv p').get(0), document.getElementById('firstp'), 'Get A Single Element');
	strictEqual(D('#firstp').get(1), undefined, 'Try get with index larger elements count');
});

test('get(-Number)',function() {
	expect(2);

	equal(D('#TestDiv p').get(-1), document.getElementById('lastp'), 'Get a single element with negative index');
	strictEqual(D('#firstp').get(-2), undefined, 'Try get with index negative index larger then elements count');
});

test('each(Function)', function() {
	expect(1);

	var div = D('div');
	div.each(function() { this.foo = 'zoo'; });

	var hasPassed = true,
		idx = 0, length = div.length;
	for (; idx < length; idx++) {
		if (div.get(idx).foo !== 'zoo') {
			hasPassed = false;
		}
	}

	ok(hasPassed, 'Execute a function, Relative');
});

test('slice()', function() {
	expect(4);

	var ps = D('#TestDiv p');

	deepEqual(ps.slice(1, 2).get(), [ ps.get(1) ], 'slice(1,2)' );
	deepEqual(ps.slice(1).get(), [ ps.get(1), ps.get(2) ], 'slice(1)');
	deepEqual(ps.slice(0, 3).get(), [ ps.get(0), ps.get(1), ps.get(2) ], 'slice(0,3)');
	deepEqual(ps.slice(-1).get(), [ ps.get(2) ], 'slice(-1)' );
});

test('eq()', function() {
	expect(3);

	var ps = D('#TestDiv p');

	deepEqual(ps.eq(1).get(), [ ps.get(1) ], 'eq(1)');
	deepEqual(ps.eq(2).get(), [ ps.get(2) ], 'eq(2)');
	deepEqual(ps.eq(-1).get(), [ ps.get(2) ], 'eq(-1)' );
});

test('first()/last()', function() {
	expect(4);

	var items = D('#TestDiv p'),
		none = D('asdf');

	deepEqual(items.first().get(), [ items.get(0) ], 'first()');
	deepEqual(items.last().get(), [ items.get(2) ], 'last()');

	deepEqual(none.first().get(), [], 'first() none');
	deepEqual(none.last().get(), [], 'last() none');
});

test('map()', function() {
	expect(1);

	var ps = D('#TestDiv p');

	deepEqual(
		ps.map(function() {
			return D(this).get();
		}).get(),
		[ ps.get(0), ps.get(1), ps.get(2) ],
		'Array Map'
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