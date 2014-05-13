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
        numNames = Object.getOwnPropertyNames(obj).length;
    D.hasData(obj);

    equal(Object.getOwnPropertyNames(obj).length, numNames,
        'No data expandos where added when calling D.hasData(o)'
    );
});

function dataTests(elem) {
    var dataObj, internalDataObj;

    equal(D.data(elem, 'foo'), undefined, 'No data exists initially');
    strictEqual(D.hasData(elem), false, 'D.hasData agrees no data exists initially');

    strictEqual(D.data(elem), undefined, 'Calling data with no args returns undefined when no data has been set');

    strictEqual(D.hasData(elem), false, 'D.hasData agrees no data exists even when an empty data obj exists');

    D.data(elem, 'bar', 'baz');
    dataObj = D.data(elem);
    deepEqual(dataObj, { bar: 'baz' }, 'TODO: Describe me');

    dataObj.foo = 'bar';
    equal(D.data(elem, 'foo'), 'bar', 'Data is readable by D.data when set directly on a returned data object');

    strictEqual(D.hasData(elem), true, 'D.hasData agrees data exists when data exists');

    D.data(elem, 'foo', 'baz');
    equal(D.data(elem, 'foo'), 'baz', 'Data can be changed by D.data');
    equal(dataObj.foo, 'baz', 'Changes made through D.data propagate to referenced data object');

    D.data(elem, 'foo', undefined);
    strictEqual(D.data(elem, 'foo'), undefined, 'Data is unset by passing undefined to D.data');

    D.data(elem, 'foo', null);
    strictEqual(D.data(elem, 'foo'), null, 'Setting null using D.data works OK');

    D.data(elem, 'foo', 'foo1');

    D.data(elem, { 'bar' : 'baz', 'boom' : 'bloz' });
    strictEqual(D.data(elem, 'foo'), 'foo1', 'Passing an object extends the data object instead of replacing it');
    equal(D.data(elem, 'boom'), 'bloz', 'Extending the data object works');

    // TODO: Test internal event data?
}

test('D.data(div)', function() {
    expect(13);

    var div = document.createElement('div');

    dataTests(div);

    // We stored one key in the private data
    // assert that nothing else was put in there, and that that
    // one stayed there.

    // Stupid jQuery test
//    QUnit.expectJqData(div, 'foo');
});

test('D.data({})', function() {
    expect(13);

    dataTests({});
});

test('D.data(window)', function() {
    expect(13);

    // remove bound handlers from window object to stop potential false positives caused by fix for #5280 in
    // transports/xhr.js
    D(window).off('unload');

    dataTests(window);
});

test('D.data(document)', function() {
    expect(13);

    dataTests(document);

    // Stupid jQuery test
//    QUnit.expectJqData(document, 'foo');
});

test('D.data(<embed>)', function() {
    expect(13);

    dataTests(document.createElement('embed'));
});

test('D.data(<applet>)', function() {
    expect(13);

    dataTests(document.createElement('applet'));
});

test('D.data(object/flash)', function() {
    expect(13);

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
    expect(4);

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
    strictEqual(div.data('test', undefined).data('test'), undefined, '.data(key, undefined) sets value and is is chainable');
    strictEqual(div.data('notexist'), undefined, 'No data exists for unset key');
    testDataTypes(div);

    parent.remove();
});

test('.data(object) does not retain references. #13815', function() {
    expect(2);

    var $divs = D('<div></div><div></div>').appendTo('#qunit-fixture');

    $divs.data({ 'type': 'foo' });
    $divs.eq(0).data('type', 'bar');

    equal($divs.eq(0).data('type'), 'bar', 'Correct updated value');
    equal($divs.eq(1).data('type'), 'foo', 'Original value retained');
});

test('.data(Object)', function() {
    expect(2);

    var div = D('<div/>');

    div.data({ 'test': 'in', 'test2': 'in2' });
    equal(div.data('test'), 'in', 'Verify setting an object in data');
    equal(div.data('test2'), 'in2', 'Verify setting an object in data');

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
    equal(D.data(obj, 'test'), 'testing', 'Verify data on plain object');
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
