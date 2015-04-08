(function() {
    var repeat = function(times, thing) {
        var arr = new Array(times);
        if (typeof thing === 'function') {
            while(times--) { arr[times] = thing(); }
        } else if (thing) {
            while(times--) { arr[times] = thing; }
        } else {
            while(times--) { arr[times] = times; }
        }
        return arr;
    };

    var d        = window.D,
        elements = repeat(3, document.body);

    // Object Creation ==========================
    var create = function(ctx, thing) {
            return function() {
                ctx(thing);
            };
        },
        createWithContext = function(ctx, thing, thing2) {
            return function() {
                ctx(thing, thing2);
            };
        };

    // HTML ==========================
    var htmlStrSmall = '<div><ul><li></li><li></li><li></li></ul></div>',
        htmlStrLarge = '<!-- To use a background image, add background="imagename" to the    body tag. --><center>    <h1>This is the first displayed text in the document<br>(Header 1).</h1>    <h2>This is the second line displayed (Header 2).</h2></center><h3>This is the third header, uncentered.</h3><hr><p>This is a paragraph of text.  It    does    not matter how I type this in.  The text will wrap    automatically    in the browser window.  If I want to start a<br>    new line,<br> I have to use a &lt;br&gt; tag.</p><!-- The following is a right-aligned image.  Width and    height (in pixels) are optional, alt is strongly recommended, and    align="left","middle",or "right" is also optional.--><p>    <img align="right" height="175" width="256">    This is an unordered list:</p><ul>    <li>List item 1</li>    <li>List item 2</li>    <li>List item 3</li></ul>This is an ordered list:<ol>    <li>List item 1</li>    <li>List item 2</li>    <li>List item 3</li></ol><b>This sentence is in boldface.</b><br><i>This sentence is in italics.</i><br>This sentence contains a link to the<a href="http://www.phy.mtu.edu/">PhysicsHome</a> page.<p align="right">This sentence is right-aligned.</p><font size="+2">This sentence has an increased font size.</font><br><font size="-1">This sentence has a decreased font size.</font><br><font color="#9d0000">This sentence has the font colorspecified in hex.</font><br><font face="arial, helvetica, sans serif">This sentence is ina sans serif font.</font><br><big>This is a big sentence.</big><br><small>This is a small sentence.</small><br>This sentence has a "mailto" link in it:<a href="mailto:username@mtu.edu">username@mtu.edu</a><br><br>This link describes color tables and their hex format:<br><a href="http://bignosebird.com/docs/h12.shtml">Best Colors to Use and a Color Chart</a><hr align="left" width="150">Here is some text which starts before an image, and then<br><img alt="Telescope pointed at the dome    window" align="left" height="179" hspace="30" vspace="10" width="241">wraps around the right side of the picture.  The text willcontinue to wrap until . . .<br clear="all">. . . a &lt;br clear=left,right,or all&gt; tag appears.  The"hspace" and "vspace" attributes specify the amount of spacein pixels added to the sides and tops of the image.<p>Here is an example of a thumbnail image which is linked    to the larger image, along with some text:<br><br>    <a href="http://www.phy.mtu.edu/basiccomputing/observatory.jpg">    <img alt="Link to telescope        image" height="55" width="79">    This sentence and thumbnail image link to the bigger image.    </a>    <br><br></p><hr noshade="noshade"><center>    <strong>This is a table with 3 columns.</strong><br><br>    <!-- The table begins after this comment. -->    <table border="5" cellpadding="5" cellspacing="0">        <tbody>            <tr>                <td colspan="2" align="center"><strong>Heading 1</strong><br>spans 2                    columns                </td>                <td align="center"><strong>Heading 2</strong></td>            </tr>            <tr>                <td>element 1</td>                <td>element 2</td>                <td>element 3</td>            </tr>            <tr>                <td colspan="3"><a                    href="http://www.phy.mtu.edu/basiccomputing/observatory.jpg">This is a                    link                    to the observatory image</a>                </td>            </tr>            <tr>                <td bgcolor="#ffdae0">colored cell</td>                <td colspan="2" align="right">uncolored cell</td>            </tr>            <tr>                <td>&nbsp;</td>                <td><img alt="Small telescope                    image" height="55" width="79"></td>                <td>&nbsp;</td>            </tr>            <tr>                <td>row 6 col 1</td>                <td>row 6 col 2</td>                <td rowspan="3">this spans 3 rows</td>            </tr>            <tr>                <td>row 7 col 1</td>                <td>row 7 col 2</td>            </tr>            <tr>                <td>row 8 col 1</td>                <td>row 8 col 2</td>            </tr>        </tbody>    </table>    <!-- End of table. -->    <br>    Experiment with cellpadding, cellspacing, and border values    to see what effect they have on the table layout.<br><br>    <table border="8" cellpadding="0" cellspacing="0">        <tbody>            <tr>                <td><img alt="Small telescope                    image with frame" height="55" width="79"></td>            </tr>        </tbody>    </table></center><hr noshade="noshade" size="5"><h4><font color="green">Special Symbols:</font> Look at the source code    to see how    these were created.  Not all browsers display all special    symbols or fonts.</h4><i>y</i> = <i>x</i><sup>2</sup> <br><b>F</b> = <i>m</i> <b>a</b> <br><i>f<sub>ij</sub></i> = ü ± 132.0°<br>ñ = 2 Å ÷ 3 Å<br>Ê = 4.0 × 10<sup>-6</sup> <font face="symbol">p</font><br><font face="symbol">a</font> = cos <font face="symbol">b</font> *sin <font face="symbol">g</font><br><br>Here are links to more ISO Latin-1 Characters:<br><a    href="http://hotwired.lycos.com/webmonkey/reference/special_characters/">WebmonkeySpecial Characters</a><br><a href="http://www.ramsch.org/martin/uni/fmi-hp/iso8859-1.html">Martin Ramsch - iso8859-1 table</a><br><br><a href="http://www.phy.mtu.edu/links/htmlstuff.html"><font size="+2">HTML RESOURCES</font></a> - Links to HTML guides on the web<br><a href="http://www.phy.mtu.edu/basiccomputing/howto.html#createweb">How to Create a Web Page</a> - For accounts on phylabserver<br><a href="http://www.phy.mtu.edu/basiccomputing/howto.html#troublehtml">How to Troubleshoot HTML</a><br><br><hr size="10" width="60%"><!-- The following line calls a CGI script for logging visitors    to this page.  It is unrelated to the HTML tutorial. -->';
    var parseHtml = function(ctx, str) {
        return function() {
            ctx.parseHTML(str);
        };
    };

    // Find ==========================
    var dctx = d('div'),
        finder = function(ctx) {
            return function() {
                ctx.find('> .foo');
            };
        };

    var tasks = [
        create(d),
        create(d, document.body),
        create(d, elements),
        create(d, 'div > *'),
        create(d, '<div></div>'),
        createWithContext(d, document.body, { 'data-num': 0 }),
        createWithContext(d, '<div></div>', { 'data-num': 0 }),
        parseHtml(d, htmlStrSmall),
        parseHtml(d, htmlStrLarge),
        finder(dctx)
    ];

    var taskRunner = function() {
        console.log('starting');

        var idx = 0;

        var run = function() {
            var task = tasks[idx];
            if (!task) { return done(); }

            console.log('running', idx + 1, 'of', tasks.length);
            repeat(1000, task);

            idx++;
            setTimeout(function() {
                run();
            }, 100);
        };

        var done = function() {
            d('body').removeClass('running');
            console.log('done');
        };

        run();
    };

    setTimeout(taskRunner, 100);
}());