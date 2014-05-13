module('data');

test('D.data & removeData, expected returns', function() {
    expect(4);
    var elem = document.body;

    equal(
        D.data(elem, 'hello', 'world'), 'world',
        'D.data(elem, key, value) returns value'
   );
    equal(
        D.data(elem, 'hello'), 'world',
        'D.data(elem, key) returns value'
   );
    deepEqual(
        D.data(elem, { goodnight: 'moon' }), { goodnight: 'moon' },
        'D.data(elem, obj) returns obj'
   );
    equal(
        D.removeData(elem, 'hello'), undefined,
        'D.removeData(elem, key, value) returns undefined'
   );

});

test('D.hasData no side effects', function() {
    expect(1);

    var obj = document.createElement('div'),
        numNames = Object.getOwnPropertyNames(obj);
    D.hasData(obj);

    equal(Object.getOwnPropertyNames(obj).length, numNames,
        'No data expandos where added when calling D.hasData(o)'
    );
});

function dataTests(elem) {
    var dataObj, internalDataObj;

    equal(D.data(elem, 'foo'), undefined, 'No data exists initially');
    strictEqual(D.hasData(elem), false, 'D.hasData agrees no data exists initially');

    dataObj = D.data(elem);
    equal(typeof dataObj, 'object', 'Calling data with no args gives us a data object reference');
    strictEqual(D.data(elem), dataObj, 'Calling D.data returns the same data object when called multiple times');

    strictEqual(D.hasData(elem), false, 'D.hasData agrees no data exists even when an empty data obj exists');

    dataObj.foo = 'bar';
    equal(D.data(elem, 'foo'), 'bar', 'Data is readable by D.data when set directly on a returned data object');

    strictEqual(D.hasData(elem), true, 'D.hasData agrees data exists when data exists');

    D.data(elem, 'foo', 'baz');
    equal(D.data(elem, 'foo'), 'baz', 'Data can be changed by D.data');
    equal(dataObj.foo, 'baz', 'Changes made through D.data propagate to referenced data object');

    D.data(elem, 'foo', undefined);
    equal(D.data(elem, 'foo'), 'baz', 'Data is not unset by passing undefined to D.data');

    D.data(elem, 'foo', null);
    strictEqual(D.data(elem, 'foo'), null, 'Setting null using D.data works OK');

    D.data(elem, 'foo', 'foo1');

    D.data(elem, { 'bar' : 'baz', 'boom' : 'bloz' });
    strictEqual(D.data(elem, 'foo'), 'foo1', 'Passing an object extends the data object instead of replacing it');
    equal(D.data(elem, 'boom'), 'bloz', 'Extending the data object works');

    // INTERNAL _data ---

    D.data(elem, 'foo', 'foo2', true);
    equal(D.data(elem, 'foo'), 'foo2', 'Setting internal data works');
    equal(D.data(elem, 'foo'), 'foo1', 'Setting internal data does not override user data');

    internalDataObj = D.data(elem);
    ok(internalDataObj, 'Internal data object exists');
    notStrictEqual(dataObj, internalDataObj, 'Internal data object is not the same as user data object');

    strictEqual(elem.boom, undefined, 'Data is never stored directly on the object');

    D.removeData(elem, 'foo');
    strictEqual(D.data(elem, 'foo'), undefined, 'D.removeData removes single properties');

    D.removeData(elem);
    strictEqual(D.data(elem), internalDataObj, 'D.removeData does not remove internal data if it exists');

    D.data(elem, 'foo', 'foo1');
    D.data(elem, 'foo', 'foo2');

    equal(D.data(elem, 'foo'), 'foo1', '(sanity check) Ensure data is set in user data object');
    equal(D.data(elem, 'foo'), 'foo2', '(sanity check) Ensure data is set in internal data object');

    strictEqual(D.data(elem, D.expando), undefined, 'Removing the last item in internal data destroys the internal data object');

    D.data(elem, 'foo', 'foo2');
    equal(D.data(elem, 'foo'), 'foo2', '(sanity check) Ensure data is set in internal data object');

    D.removeData(elem, 'foo');
    equal(D.data(elem, 'foo'), 'foo2', '(sanity check) D.removeData for user data does not remove internal data');
}

test('D.data(div)', 25, function() {
    var div = document.createElement('div');

    dataTests(div);

    // We stored one key in the private data
    // assert that nothing else was put in there, and that that
    // one stayed there.
    QUnit.expectJqData(div, 'foo');
});

test('D.data({})', 25, function() {
    dataTests({});
});

test('D.data(window)', 25, function() {
    // remove bound handlers from window object to stop potential false positives caused by fix for #5280 in
    // transports/xhr.js
    D(window ).off('unload');

    dataTests(window);
});

test('D.data(document)', 25, function() {
    dataTests(document);

    QUnit.expectJqData(document, 'foo');
});

test('D.data(<embed>)', 25, function() {
    dataTests(document.createElement('embed'));
});

test('D.data(<applet>)', 25, function() {
    dataTests(document.createElement('applet'));
});

test('D.data(object/flash)', 25, function() {
    var flash = document.createElement('object');
    flash.setAttribute('classid', 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000');

    dataTests(flash);
});

// attempting to access the data of an undefined D element should be undefined
test('D().data() === undefined (#14101)', 2, function() {
    strictEqual(D().data(), undefined);
    strictEqual(D().data('key'), undefined);
});

test('.data()', function() {
    expect(5);

    var div, dataObj, nodiv, obj;

    div = D('#foo');
    strictEqual(div.data('foo'), undefined, 'Make sure that missing result is undefined');
    div.data('test', 'success');

    dataObj = div.data();

    deepEqual(dataObj, {test: 'success'}, 'data() returns entire data object with expected properties');
    strictEqual(div.data('foo'), undefined, 'Make sure that missing result is still undefined');

    nodiv = D('#unfound');
    equal(nodiv.data(), null, 'data() on empty set returns null');

    obj = { foo: 'bar' };
    D(obj).data('foo', 'baz');

    dataObj = D.extend(true, {}, D(obj).data());

    deepEqual(dataObj, { 'foo': 'baz' }, 'Retrieve data object from a wrapped JS object (#7524)');
});

function testDataTypes($obj) {
    D.each({
        'null': null,
        'true': true,
        'false': false,
        'zero': 0,
        'one': 1,
        'empty string': '',
        'empty array': [],
        'array': [1],
        'empty object': {},
        'object': { foo: 'bar' },
        'date': new Date(),
        'regex': /test/,
        'function': function() {}
    }, function(type, value) {
        strictEqual($obj.data('test', value).data('test'), value, 'Data set to ' + type);
    });
}

test('D(Element).data(String, Object).data(String)', function() {
    expect(18);
    var parent = D('<div><div></div></div>'),
        div = parent.children();

    strictEqual(div.data('test'), undefined, 'No data exists initially');
    strictEqual(div.data('test', 'success').data('test'), 'success', 'Data added');
    strictEqual(div.data('test', 'overwritten').data('test'), 'overwritten', 'Data overwritten');
    strictEqual(div.data('test', undefined).data('test'), 'overwritten', '.data(key,undefined) does nothing but is chainable (#5571)');
    strictEqual(div.data('notexist'), undefined, 'No data exists for unset key');
    testDataTypes(div);

    parent.remove();
});

test('D(plain Object).data(String, Object).data(String)', function() {
    expect(16);

    // #3748
    var $obj = D({ exists: true });
    strictEqual($obj.data('nothing'), undefined, 'Non-existent data returns undefined');
    strictEqual($obj.data('exists'), undefined, 'Object properties are not returned as data');
    testDataTypes($obj);

    // Clean up
    $obj.removeData();
    deepEqual($obj[0], { exists: true }, 'removeData does not clear the object');
});

test('.data(object) does not retain references. #13815', function() {
    expect(2);

    var $divs = D('<div></div><div></div>').appendTo('#qunit-fixture');

    $divs.data({ 'type': 'foo' });
    $divs.eq(0).data('type', 'bar');

    equal($divs.eq(0).data('type'), 'bar', 'Correct updated value');
    equal($divs.eq(1).data('type'), 'foo', 'Original value retained');
});

test('data-* attributes', function() {
    expect(43);

    var prop, i, l, metadata, elem,
        obj, obj2, check, num, num2,
        parseJSON = D.parseJSON,
        div = D('<div>'),
        child = D('<div data-myobj="old data" data-ignored="DOM" data-other="test"></div>'),
        dummy = D('<div data-myobj="old data" data-ignored="DOM" data-other="test"></div>');

    equal(div.data('attr'), undefined, 'Check for non-existing data-attr attribute');

    div.attr('data-attr', 'exists');
    equal(div.data('attr'), 'exists', 'Check for existing data-attr attribute');

    div.attr('data-attr', 'exists2');
    equal(div.data('attr'), 'exists', 'Check that updates to data- dont update .data()');

    div.data('attr', 'internal').attr('data-attr', 'external');
    equal(div.data('attr'), 'internal', 'Check for .data("attr") precedence (internal > external data-* attribute)');

    div.remove();

    child.appendTo('#qunit-fixture');
    equal(child.data('myobj'), 'old data', 'Value accessed from data-* attribute');

    child.data('myobj', 'replaced');
    equal(child.data('myobj'), 'replaced', 'Original data overwritten');

    child.data('ignored', 'cache');
    equal(child.data('ignored'), 'cache', 'Cached data used before DOM data-* fallback');

    obj = child.data();
    obj2 = dummy.data();
    check = ['myobj', 'ignored', 'other'];
    num = 0;
    num2 = 0;

    dummy.remove();

    for (i = 0, l = check.length; i < l; i++) {
        ok(obj[check[i]], 'Make sure data- property exists when calling data-.');
        ok(obj2[check[i]], 'Make sure data- property exists when calling data-.');
    }

    for (prop in obj) {
        num++;
    }

    equal(num, check.length, 'Make sure that the right number of properties came through.');

    for (prop in obj2) {
        num2++;
    }

    equal(num2, check.length, 'Make sure that the right number of properties came through.');

    child.attr('data-other', 'newvalue');

    equal(child.data('other'), 'test', 'Make sure value was pulled in properly from a .data().');

    // attribute parsing
    i = 0;
    D.parseJSON = function() {
        i++;
        return parseJSON.apply(this, arguments);
    };

    child
        .attr('data-true', 'true')
        .attr('data-false', 'false')
        .attr('data-five', '5')
        .attr('data-point', '5.5')
        .attr('data-pointe', '5.5E3')
        .attr('data-grande', '5.574E9')
        .attr('data-hexadecimal', '0x42')
        .attr('data-pointbad', '5..5')
        .attr('data-pointbad2', '-.')
        .attr('data-bigassnum', '123456789123456789123456789')
        .attr('data-badjson', '{123}')
        .attr('data-badjson2', '[abc]')
        .attr('data-notjson', ' {}')
        .attr('data-notjson2', '[] ')
        .attr('data-empty', '')
        .attr('data-space', ' ')
        .attr('data-null', 'null')
        .attr('data-string', 'test');

    strictEqual(child.data('true'), true, 'Primitive true read from attribute');
    strictEqual(child.data('false'), false, 'Primitive false read from attribute');
    strictEqual(child.data('five'), 5, 'Integer read from attribute');
    strictEqual(child.data('point'), 5.5, 'Floating-point number read from attribute');
    strictEqual(child.data('pointe'), '5.5E3',
        'Exponential-notation number read from attribute as string');
    strictEqual(child.data('grande'), '5.574E9',
        'Big exponential-notation number read from attribute as string');
    strictEqual(child.data('hexadecimal'), '0x42',
        'Hexadecimal number read from attribute as string');
    strictEqual(child.data('pointbad'), '5..5',
        'Extra-point non-number read from attribute as string');
    strictEqual(child.data('pointbad2'), '-.',
        'No-digit non-number read from attribute as string');
    strictEqual(child.data('bigassnum'), '123456789123456789123456789',
        'Bad bigass number read from attribute as string');
    strictEqual(child.data('badjson'), '{123}', 'Bad JSON object read from attribute as string');
    strictEqual(child.data('badjson2'), '[abc]', 'Bad JSON array read from attribute as string');
    strictEqual(child.data('notjson'), ' {}',
        'JSON object with leading non-JSON read from attribute as string');
    strictEqual(child.data('notjson2'), '[] ',
        'JSON array with trailing non-JSON read from attribute as string');
    strictEqual(child.data('empty'), '', 'Empty string read from attribute');
    strictEqual(child.data('space'), ' ', 'Whitespace string read from attribute');
    strictEqual(child.data('null'), null, 'Primitive null read from attribute');
    strictEqual(child.data('string'), 'test', 'Typical string read from attribute');
    equal(i, 2, 'Correct number of JSON parse attempts when reading from attributes');

    D.parseJSON = parseJSON;
    child.remove();

    // tests from metadata plugin
    function testData(index, elem) {
        switch (index) {
        case 0:
            equal(D(elem).data('foo'), 'bar', 'Check foo property');
            equal(D(elem).data('bar'), 'baz', 'Check baz property');
            break;
        case 1:
            equal(D(elem).data('test'), 'bar', 'Check test property');
            equal(D(elem).data('bar'), 'baz', 'Check bar property');
            break;
        case 2:
            equal(D(elem).data('zoooo'), 'bar', 'Check zoooo property');
            deepEqual(D(elem).data('bar'), {'test':'baz'}, 'Check bar property');
            break;
        case 3:
            equal(D(elem).data('number'), true, 'Check number property');
            deepEqual(D(elem).data('stuff'), [2,8], 'Check stuff property');
            break;
        default:
            ok(false, ['Assertion failed on index ', index, ', with data'].join(''));
        }
    }

    metadata = '<ol><li class="test test2" data-foo="bar" data-bar="baz" data-arr="[1,2]">Some stuff</li><li class="test test2" data-test="bar" data-bar="baz">Some stuff</li><li class="test test2" data-zoooo="bar" data-bar="{\"test\":\"baz\"}">Some stuff</li><li class="test test2" data-number=true data-stuff="[2,8]">Some stuff</li></ol>';
    elem = D(metadata).appendTo('#qunit-fixture');

    elem.find('li').each(testData);
    elem.remove();
});

test('.data(Object)', function() {
    expect(4);

    var obj, jqobj,
        div = D('<div/>');

    div.data({ 'test': 'in', 'test2': 'in2' });
    equal(div.data('test'), 'in', 'Verify setting an object in data');
    equal(div.data('test2'), 'in2', 'Verify setting an object in data');

    obj = {test:'unset'};
    jqobj = D(obj);

    jqobj.data('test', 'unset');
    jqobj.data({ 'test': 'in', 'test2': 'in2' });
    equal(D.data(obj).test, 'in', 'Verify setting an object on an object extends the data object');
    equal(obj.test2, undefined, 'Verify setting an object on an object does not extend the object');

    // manually clean up detached elements
    div.remove();
});

test('D.removeData', function() {
    expect(10);

    var obj,
        div = D('#foo')[0];
    D.data(div, 'test', 'testing');
    D.removeData(div, 'test');
    equal(D.data(div, 'test'), undefined, 'Check removal of data');

    D.data(div, 'test2', 'testing');
    D.removeData(div);
    ok(!D.data(div, 'test2'), 'Make sure that the data property no longer exists.');
    ok(!div[D.expando], 'Make sure the expando no longer exists, as well.');

    D.data(div, {
        test3: 'testing',
        test4: 'testing'
    });
    D.removeData(div, 'test3 test4');
    ok(!D.data(div, 'test3') || D.data(div, 'test4'), 'Multiple delete with spaces.');

    D.data(div, {
        test3: 'testing',
        test4: 'testing'
    });
    D.removeData(div, ['test3', 'test4']);
    ok(!D.data(div, 'test3') || D.data(div, 'test4'), 'Multiple delete by array.');

    D.data(div, {
        'test3 test4': 'testing',
        'test3': 'testing'
    });
    D.removeData(div, 'test3 test4');
    ok(!D.data(div, 'test3 test4'), 'Multiple delete with spaces deleted key with exact name');
    ok(D.data(div, 'test3'), 'Left the partial matched key alone');

    obj = {};
    D.data(obj, 'test', 'testing');
    equal(D(obj).data('test'), 'testing', 'verify data on plain object');
    D.removeData(obj, 'test');
    equal(D.data(obj, 'test'), undefined, 'Check removal of data on plain object');

    D.data(window, 'BAD', true);
    D.removeData(window, 'BAD');
    ok(!D.data(window, 'BAD'), 'Make sure that the value was not still set.');
});

test('.removeData()', function() {
    expect(6);
    var div = D('#foo');
    div.data('test', 'testing');
    div.removeData('test');
    equal(div.data('test'), undefined, 'Check removal of data');

    div.data('test', 'testing');
    div.data('test.foo', 'testing2');
    div.removeData('test.bar');
    equal(div.data('test.foo'), 'testing2', 'Make sure data is intact');
    equal(div.data('test'), 'testing', 'Make sure data is intact');

    div.removeData('test');
    equal(div.data('test.foo'), 'testing2', 'Make sure data is intact');
    equal(div.data('test'), undefined, 'Make sure data is intact');

    div.removeData('test.foo');
    equal(div.data('test.foo'), undefined, 'Make sure data is intact');
});

test('JSON serialization (#8108)', function () {
    expect(1);

    var obj = { 'foo': 'bar' };
    D.data(obj, 'hidden', true);

    equal(JSON.stringify(obj), '{\'foo\':\'bar\'}', 'Expando is hidden from JSON.stringify');
});

test('.data should follow html5 specification regarding camel casing', function() {
    expect(12);

    var div = D('<div id="myObject" data-w-t-f="ftw" data-big-a-little-a="bouncing-b" data-foo="a" data-foo-bar="b" data-foo-bar-baz="c"></div>')
        .prependTo('body');

    equal(div.data().wTF, 'ftw', 'Verify single letter data-* key');
    equal(div.data().bigALittleA, 'bouncing-b', 'Verify single letter mixed data-* key');

    equal(div.data().foo, 'a', 'Verify single word data-* key');
    equal(div.data().fooBar, 'b', 'Verify multiple word data-* key');
    equal(div.data().fooBarBaz, 'c', 'Verify multiple word data-* key');

    equal(div.data('foo'), 'a', 'Verify single word data-* key');
    equal(div.data('fooBar'), 'b', 'Verify multiple word data-* key');
    equal(div.data('fooBarBaz'), 'c', 'Verify multiple word data-* key');

    div.data('foo-bar', 'd');

    equal(div.data('fooBar'), 'd', 'Verify updated data-* key');
    equal(div.data('foo-bar'), 'd', 'Verify updated data-* key');

    equal(div.data('fooBar'), 'd', 'Verify updated data-* key (fooBar)');
    equal(div.data('foo-bar'), 'd', 'Verify updated data-* key (foo-bar)');

    div.remove();
});

test('.data should not miss preset data-* w/ hyphenated property names', function() {

    expect(2);

    var div = D('<div/>', { id: 'hyphened' }).appendTo('#qunit-fixture'),
        test = {
            'camelBar': 'camelBar',
            'hyphen-foo': 'hyphen-foo'
        };

    div.data(test);

    D.each(test , function(i, k) {
        equal(div.data(k), k, 'data with property "'+k+'" was correctly found');
    });
});

test('D.data should not miss data-* w/ hyphenated property names #14047', function() {

    expect(1);

    var div = D('<div/>');

    div.data('foo-bar', 'baz');

    equal(D.data(div[0], 'foo-bar'), 'baz', 'data with property "foo-bar" was correctly found');
});

test('.data should not miss attr() set data-* with hyphenated property names', function() {
    expect(2);

    var a, b;

    a = D('<div/>').appendTo('#qunit-fixture');

    a.attr('data-long-param', 'test');
    a.data('long-param', { a: 2 });

    deepEqual(a.data('long-param'), { a: 2 }, 'data with property long-param was found, 1');

    b = D('<div/>').appendTo('#qunit-fixture');

    b.attr('data-long-param', 'test');
    b.data('long-param');
    b.data('long-param', { a: 2 });

    deepEqual(b.data('long-param'), { a: 2 }, 'data with property long-param was found, 2');
});

test('.data supports interoperable hyphenated/camelCase get/set of properties with arbitrary non-null|NaN|undefined values', function() {

    var div = D('<div/>', { id: 'hyphened' }).appendTo('#qunit-fixture'),
        datas = {
            'non-empty': 'a string',
            'empty-string': '',
            'one-value': 1,
            'zero-value': 0,
            'an-array': [],
            'an-object': {},
            'bool-true': true,
            'bool-false': false,
            // JSHint enforces double quotes,
            // but JSON strings need double quotes to parse
            // so we need escaped double quotes here
            'some-json': '{ \'foo\': \'bar\' }',
            'num-1-middle': true,
            'num-end-2': true,
            '2-num-start': true
        };

    expect(24);

    D.each(datas, function(key, val) {
        div.data(key, val);

        deepEqual(div.data(key), val, 'get: ' + key);
        deepEqual(div.data(D.camelCase(key)), val, 'get: ' + D.camelCase(key));
    });
});

test('.data supports interoperable removal of hyphenated/camelCase properties', function() {
    var div = D('<div/>', { id: 'hyphened' }).appendTo('#qunit-fixture'),
        datas = {
            'non-empty': 'a string',
            'empty-string': '',
            'one-value': 1,
            'zero-value': 0,
            'an-array': [],
            'an-object': {},
            'bool-true': true,
            'bool-false': false,
            // JSHint enforces double quotes,
            // but JSON strings need double quotes to parse
            // so we need escaped double quotes here
            'some-json': '{ \'foo\': \'bar\' }'
        };

    expect(27);

    D.each(datas, function(key, val) {
        div.data(key, val);

        deepEqual(div.data(key), val, 'get: ' + key);
        deepEqual(div.data(D.camelCase(key)), val, 'get: ' + D.camelCase(key));

        div.removeData(key);

        equal(div.data(key), undefined, 'get: ' + key);

    });
});

test('.data supports interoperable removal of properties SET TWICE #13850', function() {
    var div = D('<div>').appendTo('#qunit-fixture'),
        datas = {
            'non-empty': 'a string',
            'empty-string': '',
            'one-value': 1,
            'zero-value': 0,
            'an-array': [],
            'an-object': {},
            'bool-true': true,
            'bool-false': false,
            // JSHint enforces double quotes,
            // but JSON strings need double quotes to parse
            // so we need escaped double quotes here
            'some-json': '{ \'foo\': \'bar\' }'
        };

    expect(9);

    D.each(datas, function(key, val) {
        div.data(key, val);
        div.data(key, val);

        div.removeData(key);

        equal(div.data(key), undefined, 'removal: ' + key);
    });
});

test('.removeData supports removal of hyphenated properties via array (#12786)', function() {
    expect(4);

    var div, plain, compare;

    div = D('<div>').appendTo('#qunit-fixture');
    plain = D({});

    // When data is batch assigned (via plain object), the properties
    // are not camel cased as they are with (property, value) calls
    compare = {
        // From batch assignment .data({ 'a-a': 1 })
        'a-a': 1,
        // From property, value assignment .data('b-b', 1)
        'bB': 1
    };

    // Mixed assignment
    div.data({ 'a-a': 1 }).data('b-b', 1);
    plain.data({ 'a-a': 1 }).data('b-b', 1);

    deepEqual(div.data(), compare, 'Data appears as expected. (div)');
    deepEqual(plain.data(), compare, 'Data appears as expected. (plain)');

    div.removeData(['a-a', 'b-b']);
    plain.removeData(['a-a', 'b-b']);

    // NOTE: Timo's proposal for 'propEqual' (or similar) would be nice here
    deepEqual(div.data(), {}, 'Data is empty. (div)');
    deepEqual(plain.data(), {}, 'Data is empty. (plain)');
});

// Test originally by Moschel
test('.removeData should not throw exceptions. (#10080)', function() {
    expect(1);
    stop();
    var frame = D('#loadediframe');
    D(frame[0].contentWindow).on('unload', function() {
        ok(true, 'called unload');
        start();
    });
    // change the url to trigger unload
    frame.attr('src', 'data/iframe.html?param=true');
});

test('.data only checks element attributes once. #8909', function() {
    expect(2);
    var testing = {
            'test': 'testing',
            'test2': 'testing'
        },
        element = D('<div data-test="testing">'),
        node = element[0];

    // set an attribute using attr to ensure it
    node.setAttribute('data-test2', 'testing');
    deepEqual(element.data(), testing, 'Sanity Check');

    node.setAttribute('data-test3', 'testing');
    deepEqual(element.data(), testing, 'The data didnt change even though the data-* attrs did');

    // clean up data cache
    element.remove();
});

test('data-* with JSON value can have newlines', function() {
    expect(1);

    var x = D('<div data-some="{\n\"foo\":\n\t\"bar\"\n}"></div>');
    equal(x.data('some').foo, 'bar', 'got a JSON data- attribute with spaces');
    x.remove();
});

test('.data doesnt throw when calling selection is empty. #13551', function() {
    expect(1);

    try {
        D(null).data('prop');
        ok(true, 'D(null).data("prop") does not throw');
    } catch (e) {
        ok(false, e.message);
    }
});

test('Check proper data removal of non-element descendants nodes (#8335)', function() {
    expect(1);

    var div = D('<div>text</div>'),
        text = div.contents();

    text.data('test', 'test'); // This should be a noop.
    div.remove();

    ok(!text.data('test'), 'Be sure data is not stored in non-element');
});
