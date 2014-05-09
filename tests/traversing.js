module('traversing');

test('find(String)', function() {
    expect(1);

    equal(D('#foo').find('.blogTest').text(), 'Yahoo', 'Basic selector');
});

test('find(String) under non-elements', function() {
    expect(1);

    var j = D('#nonnodes').children();
    equal(j.find('div').length, 0, 'Check node,textnode,comment to find zero divs');
});

test('find(leading combinator)', function() {
    expect(4);

    strictEqual(D('#qunit-fixture').find('> div').get().length, 6, 'find child elements');
    // TODO: Handle commas
    strictEqual(D('#qunit-fixture').find('> #foo, > #moretests').get().length, 2, 'find child elements');
    strictEqual(D('#qunit-fixture').find('> #foo > p').get().length, 3, 'find child elements');

    deepEqual(D('#siblingTest, #siblingfirst').find('+ *').get(0).id, 'siblingnext', 'ensure document order');
});

test('is(String|undefined)', function() {
    expect(23);

    ok(D('#form').is('form'), 'Check for element: A form must be a form');
    ok(!D('#form').is('div'), 'Check for element: A form is not a div');
    ok(D('#mark').is('.blog'), 'Check for class: Expected class "blog"');
    ok(!D('#mark').is('.link'), 'Check for class: Did not expect class "link"');
    ok(D('#simon').is('.blog.link'), 'Check for multiple classes: Expected classes "blog" and "link"');
    ok(!D('#simon').is('.blogTest'), 'Check for multiple classes: Expected classes "blog" and "link", but not "blogTest"');
    ok(D('#en').is('[lang="en"]'), 'Check for attribute: Expected attribute lang to be "en"');
    ok(!D('#en').is('[lang="de"]'), 'Check for attribute: Expected attribute lang to be "en", not "de"');
    ok(D('#text1').is('[type="text"]'), 'Check for attribute: Expected attribute type to be "text"');
    ok(!D('#text1').is('[type="radio"]'), 'Check for attribute: Expected attribute type to be "text", not "radio"');

    ok(D('#text2').is(':disabled'), 'Check for pseudoclass: Expected to be disabled');
    ok(!D('#text1').is(':disabled'), 'Check for pseudoclass: Expected not disabled');
    ok(D('#radio2').is(':checked'), 'Check for pseudoclass: Expected to be checked');
    ok(!D('#radio1').is(':checked'), 'Check for pseudoclass: Expected not checked');

    ok(!D('#foo').is(0), 'Expected false for an invalid expression - 0');
    ok(!D('#foo').is(null), 'Expected false for an invalid expression - null');
    ok(!D('#foo').is(''), 'Expected false for an invalid expression - \'\'');
    ok(!D('#foo').is(undefined), 'Expected false for an invalid expression - undefined');
    ok(!D('#foo').is({ plain: 'object' }), 'Check passing invalid object');

    // test is() with comma-separated expressions
    ok(D('#en').is('[lang="en"],[lang="de"]'), 'Comma-separated; Check for lang attribute: Expect en or de');
    ok(D('#en').is('[lang="de"],[lang="en"]'), 'Comma-separated; Check for lang attribute: Expect en or de');
    ok(D('#en').is('[lang="en"] , [lang="de"]'), 'Comma-separated; Check for lang attribute: Expect en or de');
    ok(D('#en').is('[lang="de"] , [lang="en"]'), 'Comma-separated; Check for lang attribute: Expect en or de');
});

test('is() against non-elements (#10178)', function() {
    expect(14);

    var label, i, test,
        collection = D(document),
        tests = [ 'a', '*' ],
        nonelements = {
            text: document.createTextNode(''),
            comment: document.createComment(''),
            document: document,
            window: window,
            array: [],
            'plain object': {},
            'function': function() {}
        };

    for (label in nonelements) {
        collection[0] = nonelements[label];
        for (i = 0; i < tests.length; i++) {
            test = tests[i];
            ok(!collection.is(test), label + ' does not match \'' + test + '\'');
        }
    }
});

test('is(D)', function() {
    expect(19);

    ok(D('#form').is(D('form')), 'Check for element: A form is a form');
    ok(!D('#form').is(D('div')), 'Check for element: A form is not a div');
    ok(D('#mark').is(D('.blog')), 'Check for class: Expected class "blog"');
    ok(!D('#mark').is(D('.link')), 'Check for class: Did not expect class "link"');
    ok(D('#simon').is(D('.blog.link')), 'Check for multiple classes: Expected classes "blog" and "link"');
    ok(!D('#simon').is(D('.blogTest')), 'Check for multiple classes: Expected classes "blog" and "link", but not "blogTest"');
    ok(D('#en').is(D('[lang="en"]')), 'Check for attribute: Expected attribute lang to be "en"');
    ok(!D('#en').is(D('[lang="de"]')), 'Check for attribute: Expected attribute lang to be "en", not "de"');
    ok(D('#text1').is(D('[type="text"]')), 'Check for attribute: Expected attribute type to be "text"');
    ok(!D('#text1').is(D('[type="radio"]')), 'Check for attribute: Expected attribute type to be "text", not "radio"');
    ok(!D('#text1').is(D('input:disabled')), 'Check for pseudoclass: Expected not disabled');
    ok(D('#radio2').is(D('input:checked')), 'Check for pseudoclass: Expected to be checked');
    ok(!D('#radio1').is(D('input:checked')), 'Check for pseudoclass: Expected not checked');

    // Some raw elements
    ok(D('#form').is(D('form')[0]), 'Check for element: A form is a form');
    ok(!D('#form').is(D('div')[0]), 'Check for element: A form is not a div');
    ok(D('#mark').is(D('.blog')[0]), 'Check for class: Expected class "blog"');
    ok(!D('#mark').is(D('.link')[0]), 'Check for class: Did not expect class "link"');
    ok(D('#simon').is(D('.blog.link')[0]), 'Check for multiple classes: Expected classes "blog" and "link"');
    ok(!D('#simon').is(D('.blogTest')[0]), 'Check for multiple classes: Expected classes "blog" and "link", but not "blogTest"');
});

test('index()', function() {
    expect(2);

    equal(D('#text2').index(), 2, 'Returns the index of a child amongst its siblings');

    equal(D('<div/>').index(), -1, 'Node without parent returns -1');
});

test('index(Object|String|undefined)', function() {
    expect(16);

    var elements = D([window, document]),
        inputElements = D('#radio1,#radio2,#check1,#check2');

    // Passing a node
    equal(elements.index(window), 0, 'Check for index of elements');
    equal(elements.index(document), 1, 'Check for index of elements');
    equal(inputElements.index(document.getElementById('radio1')), 0, 'Check for index of elements');
    equal(inputElements.index(document.getElementById('radio2')), 1, 'Check for index of elements');
    equal(inputElements.index(document.getElementById('check1')), 2, 'Check for index of elements');
    equal(inputElements.index(document.getElementById('check2')), 3, 'Check for index of elements');
    equal(inputElements.index(window), -1, 'Check for not found index');
    equal(inputElements.index(document), -1, 'Check for not found index');

    // Passing a D object
    // enabled since [5500]
    equal(elements.index(elements), 0, 'Pass in a D object');
    equal(elements.index(elements.eq(1)), 1, 'Pass in a D object');
    equal(D('#form input[type="radio"]').index(D('#radio2')), 1, 'Pass in a D object');

    // Passing a selector or nothing
    // enabled since [6330]
    equal(D('#text2').index(), 2, 'Check for index amongst siblings');
    equal(D('#form').children().eq(4).index(), 4, 'Check for index amongst siblings');
    equal(D('#radio2').index('#form input[type="radio"]') , 1, 'Check for index within a selector');
    equal(D('#form input[type="radio"]').index(D('#radio2')), 1, 'Check for index within a selector');
    equal(D('#radio2').index('#form input[type="text"]') , -1, 'Check for index not found within a selector');
});

test('filter(Selector|undefined)', function() {
    expect(7);

    deepEqual(D('#form input').filter(':checked').get(), q('radio2', 'check1'), 'filter(String)');
    deepEqual(D('p').filter('#ap, #sndp').get(), q('ap', 'sndp'), 'filter(String, String)');
    deepEqual(D('p').filter('#ap,#sndp').get(), q('ap', 'sndp'), 'filter(String, String)');

    deepEqual(D('p').filter(null).get(),      [], 'filter(null) should return an empty D object');
    deepEqual(D('p').filter(undefined).get(), [], 'filter(undefined) should return an empty D object');
    deepEqual(D('p').filter(0).get(),         [], 'filter(0) should return an empty D object');
    deepEqual(D('p').filter('').get(),        [], 'filter("") should return an empty D object');
});

test('filter(Function)', function() {
    expect(2);

    deepEqual(D('#qunit-fixture p').filter(function() {
        return !D('a', this).length;
    }).get(), q('sndp', 'first'), 'filter(Function)');

    deepEqual(D('#qunit-fixture p').filter(function(i, elem) { return !D('a', elem).length; }).get(), q('sndp', 'first'), 'filter(Function) using arg');
});

test('filter(Element)', function() {
    expect(1);

    var element = document.getElementById('text1');
    deepEqual(D('#form input').filter(element).get(), q('text1'), 'filter(Element)');
});

test('filter(Array)', function() {
    expect(1);

    var elements = [ document.getElementById('text1') ];
    deepEqual(D('#form input').filter(elements).get(), q('text1'), 'filter(Element)');
});

test('filter(D)', function() {
    expect(1);

    var elements = D('#text1');
    deepEqual(D('#form input').filter(elements).get(), q('text1'), 'filter(Element)');
});


test('closest()', function() {
    expect(13);

    var jq;

    deepEqual(D('body').closest('body').get(), q('body'), 'closest(body)');
    deepEqual(D('body').closest('html').get(), q('html'), 'closest(html)');
    deepEqual(D('body').closest('div').get(), [], 'closest(div)');
    deepEqual(D('#qunit-fixture').closest('span,#html').get(), q('html'), 'closest(span,#html)');

    // Test .closest() limited by the context
    jq = D('#nothiddendivchild');
    deepEqual(jq.closest('html', document.body).get(), [], 'Context limited.');
    deepEqual(jq.closest('body', document.body).get(), [], 'Context limited.');
    deepEqual(jq.closest('#nothiddendiv', document.body).get(), q('nothiddendiv'), 'Context not reached.');

    //Test that .closest() returns unique'd set
    equal(D('#qunit-fixture p').closest('#qunit-fixture').length, 1, 'Closest should return a unique set');

    // Test on disconnected node
    equal(D('<div><p></p></div>').find('p').closest('table').length, 0, 'Make sure disconnected closest work.');

    // Bug #7369
    equal(D('<div foo="bar"></div>').closest('[foo]').length, 1, 'Disconnected nodes with attribute selector');
    equal(D('<div>text</div>').closest('[lang]').length, 0, 'Disconnected nodes with text and non-existent attribute selector');

    ok(!D(document).closest('#foo').length, 'Calling closest on a document fails silently');

    jq = D('<div>text</div>');
    deepEqual(jq.contents().closest('*').get(), jq.get(), 'Text node input (#13332)');
});

test('closest() with positional selectors', function() {
    expect(2);

    deepEqual(D('#qunit-fixture').closest('div:first').get(), [], 'closest(div:first)');
    deepEqual(D('#qunit-fixture div').closest('body:first div:last').get(), q('fx-tests'), 'closest(body:first div:last)');
});

test('closest(D)', function() {
    expect(8);
    var $child = D('#nothiddendivchild'),
        $parent = D('#nothiddendiv'),
        $sibling = D('#foo'),
        $body = D('body');
    ok($child.closest($parent).is('#nothiddendiv'), 'closest(D("#nothiddendiv"))');
    ok($child.closest($parent[0]).is('#nothiddendiv'), 'closest(D("#nothiddendiv")) :: node');
    ok($child.closest($child).is('#nothiddendivchild'), 'child is included');
    ok($child.closest($child[0]).is('#nothiddendivchild'), 'child is included  :: node');
    equal($child.closest(document.createElement('div')).length, 0, 'created element is not related');
    equal($child.closest($sibling).length, 0, 'Sibling not a parent of child');
    equal($child.closest($sibling[0]).length, 0, 'Sibling not a parent of child :: node');
    ok($child.closest($body.add($parent)).is('#nothiddendiv'), 'Closest ancestor retrieved.');
});

test('not(Selector|undefined)', function() {
    expect(11);
    equal(D('#qunit-fixture > p#ap > a').not('#google').length, 2, 'not("selector")');
    deepEqual(D('p').not('.result').get(), q('firstp', 'ap', 'sndp', 'en', 'sap', 'first'), 'not(".class")');
    deepEqual(D('p').not('#ap, #sndp, .result').get(), q('firstp', 'en', 'sap', 'first'), 'not("selector, selector")');

    deepEqual(D('#ap *').not('code').get(), q('google', 'groups', 'anchor1', 'mark'), 'not("tag selector")');
    deepEqual(D('#ap *').not('code, #mark').get(), q('google', 'groups', 'anchor1'), 'not("tag, ID selector")');
    deepEqual(D('#ap *').not('#mark, code').get(), q('google', 'groups', 'anchor1'), 'not("ID, tag selector")');

    var all = D('p').get();
    deepEqual(D('p').not(null).get(),      all, 'not(null) should have no effect');
    deepEqual(D('p').not(undefined).get(), all, 'not(undefined) should have no effect');
    deepEqual(D('p').not(0).get(),         all, 'not(0) should have no effect');
    deepEqual(D('p').not('').get(),        all, 'not("") should have no effect');

    deepEqual(
        D('#form option').not('option.emptyopt:contains("Nothing"),optgroup *,[value="1"]').get(),
        q('option1c', 'option1d', 'option2c', 'option2d', 'option3c', 'option3d', 'option3e', 'option4d', 'option4e', 'option5a', 'option5b'),
        'not("complex selector")'
    );
});

test('not(Element)', function() {
    expect(1);

    var selects = D('#form select');
    deepEqual(selects.not(selects[1]).get(), q('select1', 'select3', 'select4', 'select5'), 'filter out DOM element');
});

test('not(Function)', function() {
    expect(1);

    deepEqual(D('#qunit-fixture p').not(function() { return D('a', this).length; }).get(), q('sndp', 'first'), 'not(Function)');
});

test('not(Array)', function() {
    expect(2);

    equal(D('#qunit-fixture > p#ap > a').not(document.getElementById('google')).length, 2, 'not(DOMElement)');
    equal(D('p').not(document.getElementsByTagName('p')).length, 0, 'not(Array-like DOM collection)');
});

test('not(D)', function() {
    expect(1);

    deepEqual(D('p').not(D('#ap, #sndp, .result')).get(), q('firstp', 'en', 'sap', 'first'), 'not(D)');
});

test('has(Element)', function() {
    expect(3);
    var obj, detached, multipleParent;

    obj = D('#qunit-fixture').has(D('#sndp')[0]);
    deepEqual(obj.get(), q('qunit-fixture'), 'Keeps elements that have the element as a descendant');

    detached = D('<a><b><i/></b></a>');
    deepEqual(detached.has(detached.find('i')[0]).get(), detached.get(), '...Even when detached');

    multipleParent = D('#qunit-fixture, #header').has(D('#sndp')[0]);
    deepEqual(multipleParent.get(), q('qunit-fixture'), 'Does not include elements that do not have the element as a descendant');
});

test('has(Selector)', function() {
    expect(5);

    var obj, detached, multipleParent, multipleHas;

    obj = D('#qunit-fixture').has('#sndp');
    deepEqual(obj.get(), q('qunit-fixture'), 'Keeps elements that have any element matching the selector as a descendant');

    detached = D('<a><b><i/></b></a>');
    deepEqual(detached.has('i').get(), detached.get(), '...Even when detached');

    multipleParent = D('#qunit-fixture, #header').has('#sndp');
    deepEqual(multipleParent.get(), q('qunit-fixture'), 'Does not include elements that do not have the element as a descendant');

    multipleParent = D('#select1, #select2, #select3').has('#option1a, #option3a');
    deepEqual(multipleParent.get(), q('select1', 'select3'), 'Multiple contexts are checks correctly');

    multipleHas = D('#qunit-fixture').has('#sndp, #first');
    deepEqual(multipleHas.get(), q('qunit-fixture'), 'Only adds elements once');
});

test('has(Arrayish)', function() {
    expect(4);

    var simple, detached, multipleParent, multipleHas;

    simple = D('#qunit-fixture').has(D('#sndp'));
    deepEqual(simple.get(), q('qunit-fixture'), 'Keeps elements that have any element in the D list as a descendant');

    detached = D('<a><b><i/></b></a>');
    deepEqual(detached.has(detached.find('i')).get(), detached.get(), '...Even when detached');

    multipleParent = D('#qunit-fixture, #header').has(D('#sndp'));
    deepEqual(multipleParent.get(), q('qunit-fixture'), 'Does not include elements that do not have an element in the D list as a descendant');

    multipleHas = D('#qunit-fixture').has(D('#sndp, #first'));
    deepEqual(multipleHas.get(), q('qunit-fixture'), 'Only adds elements once');
});


test('siblings([String])', function() {
    expect(6);
    deepEqual(D('#en').siblings().get(), q('sndp', 'sap'), 'Check for siblings');
    deepEqual(D('#nonnodes').contents().eq(1).siblings().get(), q('nonnodesElement'), 'Check for text node siblings');
    deepEqual(D('#foo').siblings('form, b').get(), q('form', 'floatTest', 'lengthtest', 'name-tests', 'testForm'), 'Check for multiple filters');

    var set = q('sndp', 'en', 'sap');
    deepEqual(D('#en, #sndp').siblings().get(), set, 'Check for unique results from siblings');
    deepEqual(D('#option5a').siblings('option[data-attr]').get(), q('option5c'), 'Has attribute selector in siblings (#9261)');
    equal(D('<a/>').siblings().length, 0, 'Detached elements have no siblings (#11370)');
});

test('siblings([String]) - D only', function() {
    expect(2);
    deepEqual(D('#sndp').siblings(':has(code)').get(), q('sap'), 'Check for filtered siblings (has code child element)');
    deepEqual(D('#sndp').siblings(':has(a)').get(), q('en', 'sap'), 'Check for filtered siblings (has anchor child element)');
});

test('children([String])', function() {
    expect(2);
    deepEqual(D('#foo').children().get(), q('sndp', 'en', 'sap'), 'Check for children');
    deepEqual(D('#foo').children('#en, #sap').get(), q('en', 'sap'), 'Check for multiple filters');
});

test('children([String]) - D only', function() {
    expect(1);
    deepEqual(D('#foo').children(':has(code)').get(), q('sndp', 'sap'), 'Check for filtered children');
});

test('parent([String])', function() {
    expect(6);

    var $el;

    equal(D('#groups').parent()[0].id, 'ap', 'Simple parent check');
    equal(D('#groups').parent('p')[0].id, 'ap', 'Filtered parent check');
    equal(D('#groups').parent('div').length, 0, 'Filtered parent check, no match');
    equal(D('#groups').parent('div, p')[0].id, 'ap', 'Check for multiple filters');
    deepEqual(D('#en, #sndp').parent().get(), q('foo'), 'Check for unique results from parent');

    $el = D('<div>text</div>');
    deepEqual($el.contents().parent().get(), $el.get(), 'Check for parent of text node (#13265)');
});

test('parents([String])', function() {
    expect(6);
    equal(D('#groups').parents()[0].id, 'ap', 'Simple parents check');
    deepEqual(D('#nonnodes').contents().eq(1).parents().eq(0).get(), q('nonnodes'), 'Text node parents check');
    equal(D('#groups').parents('p')[0].id, 'ap', 'Filtered parents check');
    equal(D('#groups').parents('div')[0].id, 'qunit-fixture', 'Filtered parents check2');
    deepEqual(D('#groups').parents('p, div').get(), q('ap', 'qunit-fixture'), 'Check for multiple filters');
    deepEqual(D('#en, #sndp').parents().get(), q('foo', 'qunit-fixture', 'dl', 'body', 'html'), 'Check for unique results from parents');
});

test('parentsUntil([String])', function() {
    expect(10);

    var parents = D('#groups').parents();

    deepEqual(D('#groups').parentsUntil().get(), parents.get(), 'parentsUntil with no selector (nextAll)');
    deepEqual(D('#groups').parentsUntil('.foo').get(), parents.get(), 'parentsUntil with invalid selector (nextAll)');
    deepEqual(D('#groups').parentsUntil('#html').get(), parents.slice(0, -1).get(), 'Simple parentsUntil check');
    equal(D('#groups').parentsUntil('#ap').length, 0, 'Simple parentsUntil check');
    deepEqual(D('#nonnodes').contents().eq(1).parentsUntil('#html').eq(0).get(), q('nonnodes'), 'Text node parentsUntil check');
    deepEqual(D('#groups').parentsUntil('#html, #body').get(), parents.slice(0, 3).get(), 'Less simple parentsUntil check');
    deepEqual(D('#groups').parentsUntil('#html', 'div').get(), D('#qunit-fixture').get(), 'Filtered parentsUntil check');
    deepEqual(D('#groups').parentsUntil('#html', 'p,div,dl').get(), parents.slice(0, 3).get(), 'Multiple-filtered parentsUntil check');
    equal(D('#groups').parentsUntil('#html', 'span').length, 0, 'Filtered parentsUntil check, no match');
    deepEqual(D('#groups, #ap').parentsUntil('#html', 'p,div,dl').get(), parents.slice(0, 3).get(), 'Multi-source, multiple-filtered parentsUntil check');
});

test('next([String])', function() {
    expect(6);
    equal(D('#ap').next()[0].id, 'foo', 'Simple next check');
    equal(D('<div>text<a id="element"></a></div>').contents().eq(0).next().attr('id'), 'element', 'Text node next check');
    equal(D('#ap').next('div')[0].id, 'foo', 'Filtered next check');
    equal(D('#ap').next('p').length, 0, 'Filtered next check, no match');
    equal(D('#ap').next('div, p')[0].id, 'foo', 'Multiple filters');
    equal(D('body').next().length, 0, 'Simple next check, no match');
});

test('prev([String])', function() {
    expect(5);
    equal(D('#foo').prev()[0].id, 'ap', 'Simple prev check');
    deepEqual(D('#nonnodes').contents().eq(1).prev().get(), q('nonnodesElement'), 'Text node prev check');
    equal(D('#foo').prev('p')[0].id, 'ap', 'Filtered prev check');
    equal(D('#foo').prev('div').length, 0, 'Filtered prev check, no match');
    equal(D('#foo').prev('p, div')[0].id, 'ap', 'Multiple filters');
});


test('contents()', function() {
    expect(12);
    var ibody, c;

    equal(D('#ap').contents().length, 9, 'Check element contents');
    ok(D('#iframe').contents()[0], 'Check existence of IFrame document');
    ibody = D('#loadediframe').contents()[0].body;
    ok(ibody, 'Check existence of IFrame body');

    equal(D('span', ibody).text(), 'span text', 'Find span in IFrame and check its text');

    D(ibody).append('<div>init text</div>');
    equal(D('div', ibody).length, 2, 'Check the original div and the new div are in IFrame');

    equal(D('div', ibody).last().text(), 'init text', 'Add text to div in IFrame');

    D('div', ibody).last().text('div text');
    equal(D('div', ibody).last().text(), 'div text', 'Add text to div in IFrame');

    D('div', ibody).last().remove();
    equal(D('div', ibody).length, 1, 'Delete the div and check only one div left in IFrame');

    equal(D('div', ibody).text(), 'span text', 'Make sure the correct div is still left after deletion in IFrame');

    D('<table/>', ibody).append('<tr><td>cell</td></tr>').appendTo(ibody);
    D('table', ibody).remove();
    equal(D('div', ibody).length, 1, 'Check for JS error on add and delete of a table in IFrame');

    // using contents will get comments regular, text, and comment nodes
    c = D('#nonnodes').contents().contents();
    equal(c.length, 1, 'Check node,textnode,comment contents is just one');
    equal(c[0].nodeValue, 'hi', 'Check node,textnode,comment contents is just the one from span');
});

test('sort direction', function() {
    expect(12);

    var elems = D('#ap, #select1 > *, #moretests > form'),
        methodDirections = {
            parent: false,
            parents: true,
            parentsUntil: true,
            next: false,
            prev: false,
            nextAll: false,
            prevAll: true,
            nextUntil: false,
            prevUntil: true,
            siblings: false,
            children: false,
            contents: false
        };

    D.each(methodDirections, function(method, reversed) {
        var actual = elems[ method ]().get(),
            forward = D.unique([].concat(actual));
        deepEqual(actual, reversed ? forward.reverse() : forward, 'Correct sort direction for ' + method);
    });
});

test('add(String selector)', function() {
    expect(2);

    var divs;

    deepEqual(
        D('#sndp').add('#en').add('#sap').toArray(),
        q('sndp', 'en', 'sap'),
        'Check elements from document'
    );

    divs = D('<div/>').add('#sndp');
    ok(divs[0].parentNode, 'Sort with the disconnected node last (started with disconnected first).');
});

test('add(String selector, String context)', function() {
    expect(1);

    deepEqual(
        D([]).add('div', '#nothiddendiv').toArray(),
        q('nothiddendivchild'),
        'Check elements from document'
    );
});

test('add(String html)', function() {
    expect(3);

    var x,
        divs = D('#sndp').add('<div/>');

    ok(!divs[1].parentNode, 'Sort with the disconnected node last.');


    x = D([]).add('<p id="x1">xxx</p>').add('<p id="x2">xxx</p>');
    equal(x[0].id, 'x1', 'Check detached element1');
    equal(x[1].id, 'x2', 'Check detached element2');
});

test('add(D)', function() {
    expect(4);

    var x,
        tmp = D('<div/>');

    x = D([])
    .add(
        D('<p id="x1">xxx</p>').appendTo(tmp)
    )
    .add(
        D('<p id="x2">xxx</p>').appendTo(tmp)
    );

    equal(x[0].id, 'x1', 'Check element1 in detached parent');
    equal(x[1].id, 'x2', 'Check element2 in detached parent');

    x = D([])
    .add(
        D('<p id="x1">xxx</p>')
    )
    .add(
        D('<p id="x2">xxx</p>')
    );

    equal(x[0].id, 'x1', 'Check detached element1');
    equal(x[1].id, 'x2', 'Check detached element2');
});

test('add(Element)', function() {
    expect(2);

    var x,
        tmp = D('<div/>');

    x = D([]).add(D('<p id="x1">xxx</p>').appendTo(tmp)[0]).add(D('<p id="x2">xxx</p>').appendTo(tmp)[0]);
    equal(x[0].id, 'x1', 'Check on-the-fly element1');
    equal(x[1].id, 'x2', 'Check on-the-fly element2');
});

test('add(Array elements)', function() {
    expect(1);

    deepEqual(
        D('#sndp').add(D('#en')[0]).add(D('#sap')).toArray(),
        q('sndp', 'en', 'sap'),
        'Check elements from document'
    );
});

test('add(Window)', function() {
    expect(1);

    var frame1 = document.createElement('iframe'),
        frame2 = document.createElement('iframe');

    // This increases window.length and sets window[i] available
    document.body.appendChild(frame1);
    document.body.appendChild(frame2);

    // Window is tricky because it is a lot like an array, even Array#slice will
    // turn it into a multi-item array.
    equal(D([]).add(window).length, 1, 'Add a window');

    document.body.removeChild(frame1);
    document.body.removeChild(frame2);
});

test('add(NodeList|undefined|HTMLFormElement|HTMLSelectElement)', function() {
    expect(4);

    var ps, notDefined;

    ps = document.getElementsByTagName('p');

    equal(D([]).add(ps).length, ps.length, 'Add a NodeList');

    equal(D([]).add(notDefined).length, 0, 'Adding undefined adds nothing');

    equal(D([]).add(document.getElementById('form')).length, 1, 'Add a form');
    equal(D([]).add(document.getElementById('select1')).length, 1, 'Add a select');

    // We no longer support .add(form.elements), unfortunately.
    // There is no way, in browsers, to reliably determine the difference
    // between form.elements and form - and doing .add(form) and having it
    // add the form elements is way to unexpected, so this gets the boot.
    //ok(D([]).add(D('#form')[0].elements).length >= 13, 'Check elements from array');

    // For the time being, we're discontinuing support for D(form.elements) since it's ambiguous in IE
    // use D([]).add(form.elements) instead.
    //equal(D([]).add(D('#form')[0].elements).length, D(D('#form')[0].elements).length, 'Array in constructor must equals array in add()');
});

test('add(String, Context)', function() {
    expect(6);

    deepEqual(D('#firstp').add('#ap').get(), q('firstp', 'ap'), 'Add selector to selector ');
    deepEqual(D(document.getElementById('firstp')).add('#ap').get(), q('firstp', 'ap'), 'Add gEBId to selector');
    deepEqual(D(document.getElementById('firstp')).add(document.getElementById('ap')).get(), q('firstp', 'ap'), 'Add gEBId to gEBId');

    var ctx = document.getElementById('firstp');
    deepEqual(D('#firstp').add('#ap', ctx).get(), q('firstp'), 'Add selector to selector ');
    deepEqual(D(document.getElementById('firstp')).add('#ap', ctx).get(), q('firstp'), 'Add gEBId to selector, not in context');
    deepEqual(D(document.getElementById('firstp')).add('#ap', document.getElementsByTagName('body')[0]).get(), q('firstp', 'ap'), 'Add gEBId to selector, in context');
});

test('eq("-1") #10616', function() {
    expect(3);
    var $divs = D('div');

    equal($divs.eq(-1).length, 1, 'The number -1 returns a selection that has length 1');
    equal($divs.eq('-1').length, 1, 'The string "-1" returns a selection that has length 1');
    deepEqual($divs.eq('-1'), $divs.eq(-1), 'String and number -1 match');
});

test('index(no arg) #10977', function() {
    expect(2);
    var $list, fragment, div;

    $list = D('<ul id="indextest"><li class="zero">THIS ONE</li><li class="one">a</li><li class="two">b</li><li class="three">c</li></ul>');
    D('#qunit-fixture').append($list);
    strictEqual (D('#indextest li.zero').first().index() , 0, 'No Argument Index Check');
    $list.remove();

    fragment = document.createDocumentFragment();
    div = fragment.appendChild(document.createElement('div'));

    equal(D(div).index(), 0, 'If D#index called on element whose parent is fragment, it still should work correctly');
});

test('traversing non-elements with attribute filters (#12523)', function() {
    expect(5);

    var nonnodes = D('#nonnodes').contents();

    equal(nonnodes.filter('[id]').length, 1, '.filter');
    equal(nonnodes.find('[id]').length, 0, '.find');
    strictEqual(nonnodes.is('[id]'), true, '.is');
    deepEqual(nonnodes.closest('[id="nonnodes"]').get(), q('nonnodes'), '.closest');
    deepEqual(nonnodes.parents('[id="nonnodes"]').get(), q('nonnodes'), '.parents');
});
