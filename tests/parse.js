module('parse');

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
    //  "When html is within brackets, do not recognize as html." );
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