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

test('D.extend(Object, Object)', function() {
	expect(17);

	var defaults, defaultsCopy, options1, options1Copy, options2, options2Copy, merged2,
		settings = { 'xnumber1': 5, 'xnumber2': 7, 'xstring1': 'peter', 'xstring2': 'pan' },
		options = { 'xnumber2': 1, 'xstring2': 'x', 'xxx': 'newstring' },
		optionsCopy = { 'xnumber2': 1, 'xstring2': 'x', 'xxx': 'newstring' },
		merged = { 'xnumber1': 5, 'xnumber2': 1, 'xstring1': 'peter', 'xstring2': 'x', 'xxx': 'newstring' },
		deep1 = { 'foo': { 'bar': true } },
		deep2 = { 'foo': { 'baz': true }, 'foo2': document },
		deep2copy = { 'foo': { 'baz': true }, 'foo2': document },
		deepmerged = { 'foo': { 'bar': true, 'baz': true }, 'foo2': document },
		arr = [1, 2, 3],
		nestedarray = { 'arr': arr };

	D.extend(settings, options);
	deepEqual(settings, merged, 'Check if extended: settings must be extended' );
	deepEqual(options, optionsCopy, 'Check if not modified: options must not be modified' );

	D.extend(settings, null, options);
	deepEqual(settings, merged, 'Check if extended: settings must be extended');
	deepEqual(options, optionsCopy, 'Check if not modified: options must not be modified');

	/** @constructor */
	var myKlass = function() {};
	var customObject = new myKlass();
	var optionsWithCustomObject = { 'foo': { 'date': customObject } };
	var empty = {};
	D.extend( empty, optionsWithCustomObject);
	ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly (no methods)');

	// Makes the class a little more realistic
	myKlass.prototype = { 'someMethod': function() {} };
	empty = {};
	D.extend(empty, optionsWithCustomObject);
	ok(empty.foo && empty.foo.date === customObject, 'Custom objects copy correctly');

	var MyNumber = Number;
	var ret = D.extend({}, { 'foo': 4 }, { 'foo': new MyNumber(5) });
	ok(parseInt(ret.foo, 10) === 5, 'Wrapped numbers copy correctly');

	var nullUndef = D.extend({}, options, { 'xnumber2': null });
	ok(nullUndef.xnumber2 === null, 'Check to make sure null values are copied');

	nullUndef = D.extend({}, options, { 'xnumber0': null });
	ok(nullUndef.xnumber0 === null, 'Check to make sure null values are inserted');

	ret = D.extend({ foo: [] }, { foo: [0] }); // 1907
	equal(ret.foo.length, 1, 'Check to make sure a value copies over when necessary');

	ret = D.extend({ foo: '1,2,3' }, { foo: [1, 2, 3] });
	ok(typeof ret.foo !== 'string', 'Check to make sure values overwrite correctly');

	var obj = { foo: null };
	D.extend(obj, { foo: 'notnull' } );
	equal(obj.foo, 'notnull', 'Make sure a null value can be overwritten');

	function func() {}
	D.extend(func, { key: 'value' } );
	equal(func.key, 'value', 'Verify a function can be extended');

	defaults = { xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan' };
	defaultsCopy = { xnumber1: 5, xnumber2: 7, xstring1: 'peter', xstring2: 'pan' };
	options1 = { xnumber2: 1, xstring2: 'x' };
	options1Copy = { xnumber2: 1, xstring2: 'x' };
	options2 = { xstring2: 'xx', xxx: 'newstringx' };
	options2Copy = { xstring2: 'xx', xxx: 'newstringx' };
	merged2 = { xnumber1: 5, xnumber2: 1, xstring1: 'peter', xstring2: 'xx', xxx: 'newstringx' };

	settings = D.extend({}, defaults, options1, options2);
	deepEqual(settings, merged2, 'Check if extended: settings must be extended');
	deepEqual(defaults, defaultsCopy, 'Check if not modified: options1 must not be modified');
	deepEqual(options1, options1Copy, 'Check if not modified: options1 must not be modified');
	deepEqual(options2, options2Copy, 'Check if not modified: options2 must not be modified');
});