module('selector');

/**
 * This test page is for selector tests that require D in order to do the selection
 */

test('element - D only', function() {
    expect(4);

    deepEqual(D('#selector-tests').find('p').get(), q('selector-firstp','selector-secondp','selector-thirdp'), 'Finding elements with a context via .find().');

    ok(D('#selector-length').length, '<input name="length"> cannot be found under IE, see #945');
    ok(D('#selector-tests input').length, '<input name="length"> cannot be found under IE, see #945');

    // #7533
    equal(D('<div id=\'A\'B~C.D[E]\'><p>foo</p></div>').find('p').length, 1, 'Find where context root is a node and has an ID with CSS3 meta characters');
});

test('id', function() {
    expect(26);

    var a;
    t('ID Selector', '#body', ['body']);
    t('ID Selector w/ Element', 'body#body', ['body']);
    t('ID Selector w/ Element', 'ul#first', []);
    t('ID selector with existing ID descendant', '#firstp #simon1', ['simon1']);
    t('ID selector with non-existant descendant', '#firstp #foobar', []);
    t('ID selector using UTF8', '#台北Táiběi', ['台北Táiběi']);
    t('Multiple ID selectors using UTF8', '#台北Táiběi, #台北', ['台北Táiběi','台北']);
    t('Descendant ID selector using UTF8', 'div #台北', ['台北']);
    t('Child ID selector using UTF8', 'form > #台北', ['台北']);

    t('Escaped ID', '#foo\\:bar', ['foo:bar']);
    t('Escaped ID', '#test\\.foo\\[5\\]bar', ['test.foo[5]bar']);
    t('Descendant escaped ID', 'div #foo\\:bar', ['foo:bar']);
    t('Descendant escaped ID', 'div #test\\.foo\\[5\\]bar', ['test.foo[5]bar']);
    t('Child escaped ID', 'form > #foo\\:bar', ['foo:bar']);
    t('Child escaped ID', 'form > #test\\.foo\\[5\\]bar', ['test.foo[5]bar']);

    t('ID Selector, child ID present', '#form > #radio1', ['radio1']); // bug #267
    t('ID Selector, not an ancestor ID', '#form #first', []);
    t('ID Selector, not a child ID', '#form > #option1a', []);

    t('All Children of ID', '#foo > *', ['sndp', 'en', 'sap']);
    t('All Children of ID with no children', '#firstUL > *', []);

    a = D('<a id="backslash\\foo"></a>').appendTo('#qunit-fixture');
    t('ID Selector contains backslash', '#backslash\\\\foo', ['backslash\\foo']);

    t('ID Selector on Form with an input that has a name of "id"', '#lengthtest', ['lengthtest']);

    t('ID selector with non-existant ancestor', '#asdfasdf #foobar', []); // bug #986

    t('Underscore ID', '#types_all', ['types_all']);
    t('Dash ID', '#qunit-fixture', ['qunit-fixture']);

    t('ID with weird characters in it', '#name\\+value', ['name+value']);
});

test('class - D only', function() {
    expect(1);

    deepEqual(D('p').find('.blog').get(), q('mark', 'simon'), 'Finding elements with a context.');
});

test('name', function() {
    expect(4);

    t('Name selector', 'input[name=action]', ['text1']);
    t('Name selector with single quotes', 'input[name="action"]', ['text1']);
    t('Name selector with double quotes', 'input[name=\'action\']', ['text1']);

    t('Name selector for grouped input', 'input[name="types[]"]', ['types_all', 'types_anime', 'types_movie']);
});

test('selectors with comma', function() {
    expect(4);

    var fixture = D('<div><h2><span/></h2><div><p><span/></p><p/></div></div>');

    equal(fixture.find('h2, div p').filter('p').length, 2, 'has to find two <p>');
    equal(fixture.find('h2, div p').filter('h2').length, 1, 'has to find one <h2>');
    equal(fixture.find('h2 , div p').filter('p').length, 2, 'has to find two <p>');
    equal(fixture.find('h2 , div p').filter('h2').length, 1, 'has to find one <h2>');
});

test('child and adjacent', function() {
    expect(24);

    var nothiddendiv;

    t('Child', 'p > a', ['simon1','google','groups','mark','yahoo','simon']);
    t('Child', 'p> a', ['simon1','google','groups','mark','yahoo','simon']);
    t('Child', 'p >a', ['simon1','google','groups','mark','yahoo','simon']);
    t('Child', 'p>a', ['simon1','google','groups','mark','yahoo','simon']);
    t('Child w/ Class', 'p > a.blog', ['mark','simon']);
    t('All Children', 'code > *', ['anchor1','anchor2']);
    t('All Grandchildren', 'p > * > *', ['anchor1','anchor2']);
    t('Adjacent', '.selector-p + .selector-p', ['selector-secondp','selector-thirdp']);
    t('Adjacent', 'p#selector-firstp + p', ['selector-secondp']);
    t('Adjacent', 'p[lang=en] + p', ['sap']);
    t('Adjacent', 'a.GROUPS + code + a', ['mark']);
    t('Element Preceded By', '#groups ~ a', ['mark']);
    t('Element Preceded By', '#length ~ input', ['idTest']);
    t('Element Preceded By', '#siblingfirst ~ em', ['siblingnext', 'siblingthird']);
    t('Element Preceded By (multiple)', '#siblingTest em ~ em ~ em ~ span', ['siblingspan']);

    t('Multiple combinators selects all levels', '#siblingTest em *', ['siblingchild', 'siblinggrandchild', 'siblinggreatgrandchild']);
    t('Multiple combinators selects all levels', '#siblingTest > em *', ['siblingchild', 'siblinggrandchild', 'siblinggreatgrandchild']);
    t('Multiple sibling combinators doesnt miss general siblings', '#siblingTest > em:first-child + em ~ span', ['siblingspan']);

    equal(D('#listWithTabIndex').length, 1, 'Parent div for next test is found via ID (#8310)');
    equal(D('#__sizzle__').length, 0, 'Make sure the temporary id assigned by sizzle is cleared out (#8310)');
    equal(D('#listWithTabIndex').length, 1, 'Parent div for previous test is still found via ID (#8310)');

    t('Verify deep class selector', 'div.blah > p > a', []);

    t('No element deep selector', 'div.foo > span > a', []);

    nothiddendiv = document.getElementById('nothiddendiv');

    t('Non-existant ancestors', '.fototab > .thumbnails > a', []);
});

test('attributes', function() {
    expect(43);

    var attrbad, div, withScript;

    t('Find elements with a tabindex attribute', '[tabindex]', ['listWithTabIndex', 'foodWithNegativeTabIndex', 'linkWithTabIndex', 'linkWithNegativeTabIndex', 'linkWithNoHrefWithTabIndex', 'linkWithNoHrefWithNegativeTabIndex']);

    t('Attribute Exists', '#qunit-fixture a[title]', ['google']);
    t('Attribute Exists (case-insensitive)', '#qunit-fixture a[TITLE]', ['google']);
    t('Attribute Exists', '#qunit-fixture *[title]', ['google']);
    t('Attribute Exists', '#qunit-fixture [title]', ['google']);
    t('Attribute Exists', '#qunit-fixture a[ title ]', ['google']);

    t('Boolean attribute exists', '#select2 option[selected]', ['option2d']);
    t('Boolean attribute equals', '#select2 option[selected="selected"]', ['option2d']);

    ok(D('#selector-tests a[rel="bookmark"]').get(0), 'Attribute Equals');
    ok(D('#selector-tests a[href="http://www.google.com/"]').get(0), 'Attribute Equals');
    ok(D('#selector-tests a[ rel = "bookmark" ]').get(0), 'Attribute Equals');

    document.getElementById('anchor2').href = '#2';
    t('href Attribute', 'p a[href^="#"]', ['anchor2']);
    t('href Attribute', 'p a[href*="#"]', ['simon1', 'anchor2']);

    t('for Attribute', 'form label[for]', ['label-for']);
    t('for Attribute in form', '#form [for=action]', ['label-for']);

    t('Attribute containing []', 'input[name^="foo["]', ['hidden2']);
    t('Attribute containing []', 'input[name^="foo[bar]"]', ['hidden2']);
    t('Attribute containing []', 'input[name*="[bar]"]', ['hidden2']);
    t('Attribute containing []', 'input[name$="bar]"]', ['hidden2']);

    t('Multiple Attribute Equals', '#form input[type="radio"], #form input[type="hidden"]', ['radio1', 'radio2', 'hidden1']);
    t('Multiple Attribute Equals', '#form input[type="radio"], #form input[type=\'hidden\']', ['radio1', 'radio2', 'hidden1']);
    t('Multiple Attribute Equals', '#form input[type="radio"], #form input[type=hidden]', ['radio1', 'radio2', 'hidden1']);

    t('Attribute selector using UTF8', 'span[lang=中文]', ['台北']);

    t('Attribute Begins With', '#selector-tests a[href ^= "http://www"]', ['selector-anchor']);
    t('Attribute Ends With', 'a[href $= "org/"]', ['mark']);
    t('Attribute Contains', '#selector-tests a[href *= "google"]', ['selector-anchor']);

    t('Empty values', '#select1 option[value=""]', ['option1a']);

    t('Select options via :selected', '#select1 option:selected', ['option1a']);
    t('Select options via :selected', '#select2 option:selected', ['option2d']);
    t('Select options via :selected', '#select3 option:selected', ['option3b', 'option3c']);
    t('Select options via :selected', 'select[name="select2"] option:selected', ['option2d']);

    t('Grouped Form Elements', 'input[name="foo[bar]"]', ['hidden2']);

    attrbad = D(
        '<input type="hidden" id="attrbad_space" name="foo bar"/>' +
        '<input type="hidden" id="attrbad_dot" value="2" name="foo.baz"/>' +
        '<input type="hidden" id="attrbad_brackets" value="2" name="foo[baz]"/>' +
        '<input type="hidden" id="attrbad_injection" data-attr="foo_baz&#39;]"/>' +
        '<input type="hidden" id="attrbad_quote" data-attr="&#39;"/>' +
        '<input type="hidden" id="attrbad_backslash" data-attr="&#92;"/>' +
        '<input type="hidden" id="attrbad_backslash_quote" data-attr="&#92;&#39;"/>' +
        '<input type="hidden" id="attrbad_backslash_backslash" data-attr="&#92;&#92;"/>' +
        '<input type="hidden" id="attrbad_unicode" data-attr="&#x4e00;"/>'
   ).appendTo('#qunit-fixture').get();

    t('Underscores dont need escaping', 'input[id="types_all"]', ['types_all']);

    // Note: The following 2 tests will fail in IE 8-9 because those browsers
    // automatically change <input type="search|range|etc."> to <input type="text">.
    // There is no way (that I know of) to prevent or even detect this change.
    t('input[type=text]', '#form input[type=text]', ['text1', 'text2', 'hidden2', 'name']);
    t('input[type=search]', '#form input[type=search]', ['search']);

    withScript = D('<div><span><script src=""/></span></div>');
    ok(withScript.find('#moretests script[src]').has('script'), 'script[src] (D #13777)');

    div = document.getElementById('foo');
    t('Object.prototype property \'constructor\' (negative)', '[constructor]', []);
    t('Gecko Object.prototype property \'watch\' (negative)', '[watch]', []);
    div.setAttribute('constructor', 'foo');
    div.setAttribute('watch', 'bar');
    t('Object.prototype property \'constructor\'', '[constructor="foo"]', ['foo']);
    t('Gecko Object.prototype property \'watch\'', '[watch="bar"]', ['foo']);

    t('Value attribute is retrieved correctly', 'input[value=Test]', ['text1', 'text2']);

    // #12600
    /*ok(
        D('<select value="12600"><option value="option" selected="selected"></option><option value=""></option></select>')
        .prop('value', 'option')
        .is(':input[value="12600"]'),

        ':input[value=foo] selects select by attribute'
   );
    ok(D('<input type="text" value="12600"/>').prop('value', 'option').is(':input[value="12600"]'),
        ':input[value=foo] selects text input by attribute'
   );*/

    // #11115
    ok(D('<input type="checkbox" checked="checked"/>').prop('checked', false).is('[checked]'),
        '[checked] selects by attribute (positive)'
   );
    ok(!D('<input type="checkbox"/>').prop('checked', true).is('[checked]'),
        '[checked] selects by attribute (negative)'
   );
});

test('find elements', function() {
    expect(4);

    var $divs = D('<div><a>a</a></div><div><b>b</b></div><div><i>i</i></div>');
    var a = $divs[0].firstChild;
    var b = $divs[1].firstChild;
    var i = $divs[2].firstChild;

    equal($divs.find(a).length, 1, 'Find DOM element within first matched element');
    equal($divs.find(b).length, 1, 'Find DOM element within second matched element');
    equal($divs.find(i).length, 1, 'Find DOM element within third matched element');
    equal($divs.find($divs.find('a, b, i')).length, 3, 'Find DOM elements within all matched elements')
});

test('disconnected nodes', function() {
    expect(1);

    var $div = D('<div/>');
    equal($div.is('div'), true, 'Make sure .is("nodeName") works on disconnected nodes.');
});

test('disconnected nodes - D only', function() {
    expect(1);

    var $opt = D('<option>foo</option>').attr('value', 'whipit').appendTo('#qunit-fixture').detach();
    equal($opt.val(), 'whipit', 'option value');
    // is(:selected) does not work like this in D. option gets the prop but
    // does not get [selected="selected"] attribute
    // equal($opt.is(':selected'), false, 'unselected option');
    // $opt.prop('selected', true);
    // equal($opt.is(':selected'), true, 'selected option');
});
