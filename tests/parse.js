module('parse');

test('D.parseHTML', function() {
    expect(10);

    equal(D.parseHTML(), null, 'Nothing in, null out.');
    equal(D.parseHTML(null), null, 'Null in, null out.');
    equal(D.parseHTML(''), null, 'Empty string in, null out.');

    var bodyStr = D('body')[0].innerHTML;
    var nodes = D.parseHTML(bodyStr);
    ok(nodes.length > 4, 'Parse a large html string');

    var html = '<div></div>';
    equal(D.parseHTML(html)[0].nodeName.toLowerCase(), 'div', 'Preserve non-script nodes');

    equal(D.parseHTML('text'), null, 'Non-html string doesnt result in html');
    equal(D.parseHTML('\t<div></div>')[0].nodeValue, null, 'Discard leading whitespace');

    html = D.parseHTML('<div>test div</div>');

    // Note: parent node is an Element in our implementation
    // equal(html[0].parentNode.nodeType, 11, 'parentNode should be documentFragment');
    equal(html[0].innerHTML, 'test div', 'Content should be preserved');

    equal(D.parseHTML('<span><span>').length, 1, 'Incorrect html-strings should not break anything');
    ok(D.parseHTML('<#if><tr><p>This is a test.</p></tr><#/if>') || true, 'Garbage input should not cause error');
});

test('D("html")', function() {
    expect(17);

    D.foo = false;
    var script = D('<script>D.foo="test";</script>')[0];

    ok(script, 'Creating a script');
    ok(!D.foo, 'Make sure the script wasnt executed prematurely');
    D('body').append('<script>D.foo="test";</script>');
    ok(D.foo, 'Executing a scripts contents in the right context');

    // Test multi-line HTML
    var div = D('<div>\r\nsome text\n<p>some p</p>\nmore text\r\n</div>')[0];
    equal( div.nodeName.toUpperCase(), 'DIV', 'Make sure we are getting a div.');
    equal( div.firstChild.nodeType, 3, 'Text node.');
    equal( div.lastChild.nodeType, 3, 'Text node.');
    equal( div.childNodes[1].nodeType, 1, 'Paragraph.');
    equal( div.childNodes[1].firstChild.nodeType, 3, 'Paragraph text.');

    ok(D('<link rel="stylesheet"/>')[0], 'Creating a link');

    ok(!D('<script/>')[0].parentNode, 'Create a script');

    ok(D('<input/>').attr('type', 'hidden'), 'Create an input and set the type.');

    var j = D('<span>hi</span> there <!-- mon ami -->');
    equal(j.length, 1, 'Only return element nodes');

    // This test will fail in IE8-9
    ok(!D('<option>test</option>')[0].selected, 'Make sure that options are not auto-selected');

    ok(D('<div></div>')[0], 'Create a div with closing tag.');
    ok(D('<table></table>')[0], 'Create a table with closing tag.');

    equal(D('element[attribute="<div></div>"]').length, 0, 'When html is within brackets, do not recognize as html.');
    equal(D('\\<div\\>').length, 0, 'Ignore escaped html characters' );
});

test('D("massive html #7990")', function() {
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
