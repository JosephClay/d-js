(function() {

    module('attributes');

    var DQ = function() {
        return D(q.apply(q, arguments));
    };

    var bareObj = function(value) {
        return value;
    };

    var functionReturningObj = function(value) {
        return function() {
            return value;
        };
    };

    /*
        ======== local reference =======
        bareObj and functionReturningObj can be used to test passing functions to setters
        See testVal below for an example

        bareObj(value);
            This function returns whatever value is passed in

        functionReturningObj(value);
            Returns a function that returns the value
    */

    test('propFix integrity test', function() {
        expect(44);

        var list = DQ('listWithTabIndex');
        strictEqual(list.attr('tabindex'), '5', 'attr("tabindex")');
        strictEqual(list.attr('tabIndex'), '5', 'attr("tabIndex")');
        strictEqual(list.prop('tabindex'),  5,  'prop("tabindex")');
        strictEqual(list.prop('tabIndex'),  5,  'prop("tabIndex")');

        var t2 = DQ('T2');
        strictEqual(t2.attr('readonly'), 'readonly', 'attr("readonly")');
        strictEqual(t2.attr('readOnly'), 'readonly', 'attr("readOnly")');
        strictEqual(t2.prop('readonly'),  true,      'prop("readonly")');
        strictEqual(t2.prop('readOnly'),  true,      'prop("readOnly")');

        var label = DQ('label-for');
        strictEqual(label.attr('for'),     'action',  'attr("for")');
        strictEqual(label.attr('htmlFor'), undefined, 'attr("htmlFor")');
        strictEqual(label.prop('for'),     'action',  'prop("for")');
        strictEqual(label.prop('htmlFor'), 'action',  'prop("htmlFor")');

        var groupsLink = DQ('groups');
        strictEqual(groupsLink.attr('class'),     'GROUPS',  'attr("class")');
        strictEqual(groupsLink.attr('className'), undefined, 'attr("className")');
        strictEqual(groupsLink.prop('class'),     'GROUPS',  'prop("class")');
        strictEqual(groupsLink.prop('className'), 'GROUPS',  'prop("className")');

        var text1 = DQ('text1');
        strictEqual(text1.attr('maxlength'), '30', 'attr("maxlength")');
        strictEqual(text1.attr('maxLength'), '30', 'attr("maxLength")');
        strictEqual(text1.prop('maxlength'),  30,  'prop("maxlength")');
        strictEqual(text1.prop('maxLength'),  30,  'prop("maxLength")');

        var table1 = DQ('table1');
        strictEqual(table1.attr('cellspacing'), '2', 'attr("cellspacing")');
        strictEqual(table1.attr('cellSpacing'), '2', 'attr("cellSpacing")');
        strictEqual(table1.prop('cellspacing'), '2', 'prop("cellspacing")');
        strictEqual(table1.prop('cellSpacing'), '2', 'prop("cellSpacing")');

        strictEqual(table1.attr('cellpadding'), '3', 'attr("cellpadding")');
        strictEqual(table1.attr('cellPadding'), '3', 'attr("cellPadding")');
        strictEqual(table1.prop('cellpadding'), '3', 'prop("cellpadding")');
        strictEqual(table1.prop('cellPadding'), '3', 'prop("cellPadding")');

        var th1 = DQ('th1');
        strictEqual(th1.attr('rowspan'), '2', 'attr("rowspan")');
        strictEqual(th1.attr('rowSpan'), '2', 'attr("rowSpan")');
        strictEqual(th1.prop('rowspan'),  2,  'prop("rowspan")');
        strictEqual(th1.prop('rowSpan'),  2,  'prop("rowSpan")');

        var th2 = DQ('th2');
        strictEqual(th2.attr('colspan'), '4', 'attr("colspan")');
        strictEqual(th2.attr('colSpan'), '4', 'attr("colSpan")');
        strictEqual(th2.prop('colspan'),  4,  'prop("colspan")');
        strictEqual(th2.prop('colSpan'),  4,  'prop("colSpan")');

        var img = DQ('img');
        strictEqual(img.attr('usemap'), '#bigthings', 'attr("usemap")');
        strictEqual(img.attr('useMap'), '#bigthings', 'attr("useMap")');
        strictEqual(img.prop('usemap'), '#bigthings', 'prop("usemap")');
        strictEqual(img.prop('useMap'), '#bigthings', 'prop("useMap")');

        var editable = DQ('contenteditable');
        strictEqual(editable.attr('contenteditable'), 'true', 'attr("contenteditable")');
        strictEqual(editable.attr('contentEditable'), 'true', 'attr("contentEditable")');
        strictEqual(editable.prop('contenteditable'), 'true', 'prop("contenteditable")');
        strictEqual(editable.prop('contentEditable'), 'true', 'prop("contentEditable")');
    });

    test('attr(String)', function() {
        expect(50);

        var extras, body, $body,
            select, optgroup, option, $img, styleElem,
            $button, $form, $a;

        equal(D('#text1').attr('type'), 'text', 'Check for type attribute');
        equal(D('#radio1').attr('type'), 'radio', 'Check for type attribute');
        equal(D('#check1').attr('type'), 'checkbox', 'Check for type attribute');
        equal(D('#simon1').attr('rel'), 'bookmark', 'Check for rel attribute');
        equal(D('#google').attr('title'), 'Google!', 'Check for title attribute');
        equal(D('#mark').attr('hreflang'), 'en', 'Check for hreflang attribute');
        equal(D('#en').attr('lang'), 'en', 'Check for lang attribute');
        equal(D('#simon').attr('class'), 'blog link', 'Check for class attribute');
        equal(D('#name').attr('name'), 'name', 'Check for name attribute');
        equal(D('#text1').attr('name'), 'action', 'Check for name attribute');
        ok(D('#form').attr('action').indexOf('formaction') >= 0, 'Check for action attribute');
        equal(D('#text1').attr('value', 't').attr('value'), 't', 'Check setting the value attribute');
        equal(D('#text1').attr('value', '').attr('value'), '', 'Check setting the value attribute to empty string');
        equal(D('<div value="t"></div>').attr('value'), 't', 'Check setting custom attr named "value" on a div');
        equal(D('#form').attr('blah', 'blah').attr('blah'), 'blah', 'Set non-existent attribute on a form');
        equal(D('#foo').attr('height'), undefined, 'Non existent height attribute should return undefined');

        // [7472] & [3113] (form contains an input with name='action' or name='id')
        extras = D('<input id="id" name="id" /><input id="name" name="name" /><input id="target" name="target" />').appendTo('#testForm');
        equal(D('#form').attr('action','newformaction').attr('action'), 'newformaction', 'Check that action attribute was changed');
        equal(D('#testForm').attr('target'), undefined, 'Retrieving target does not equal the input with name=target');
        equal(D('#testForm').attr('target', 'newTarget').attr('target'), 'newTarget', 'Set target successfully on a form');
        equal(D('#testForm').removeAttr('id').attr('id'), undefined, 'Retrieving id does not equal the input with name=id after id is removed [#7472]');
        // Bug #3685 (form contains input with name='name')
        equal(D('#testForm').attr('name'), undefined, 'Retrieving name does not retrieve input with name=name');
        extras.remove();

        equal(D('#text1').attr('maxlength'), '30', 'Check for maxlength attribute');
        equal(D('#text1').attr('maxLength'), '30', 'Check for maxLength attribute');
        equal(D('#area1').attr('maxLength'), '30', 'Check for maxLength attribute');

        // using innerHTML in IE causes href attribute to be serialized to the full path
        D('<a/>').attr({
            'id': 'tAnchor5',
            'href': '#5'
        }).appendTo('#qunit-fixture');
        equal(D('#tAnchor5').attr('href'), '#5', 'Check for non-absolute href (an anchor)');
        D('<a id="tAnchor6" href="#5" />').appendTo('#qunit-fixture');
        equal(D('#tAnchor5').prop('href'), D('#tAnchor6').prop('href'), 'Check for absolute href prop on an anchor');

        D('<script type="jquery/test" src="#5" id="scriptSrc"></script>').appendTo('#qunit-fixture');
        equal(D('#tAnchor5').prop('href'), D('#scriptSrc').prop('src'), 'Check for absolute src prop on a script');

        // list attribute is readonly by default in browsers that support it
        D('#list-test').attr('list', 'datalist');
        equal(D('#list-test').attr('list'), 'datalist', 'Check setting list attribute');

        // Related to [5574] and [5683]
        body = document.body;
        $body = D(body);

        strictEqual($body.attr('foo'), undefined, 'Make sure that a non existent attribute returns undefined');

        body.setAttribute('foo', 'baz');
        equal($body.attr('foo'), 'baz', 'Make sure the dom attribute is retrieved when no expando is found');

        $body.attr('foo','cool');
        equal($body.attr('foo'), 'cool', 'Make sure that setting works well when both expando and dom attribute are available');

        body.removeAttribute('foo'); // Cleanup

        select = document.createElement('select');
        optgroup = document.createElement('optgroup');
        option = document.createElement('option');

        optgroup.appendChild(option);
        select.appendChild(optgroup);

        equal(D(option).prop('selected'), true, 'Make sure that a single option is selected, even when in an optgroup.');

        $img = D('<img style="display:none" width="215" height="53" src="data/1x1.jpg"/>').appendTo('body');
        equal($img.attr('width'), '215', 'Retrieve width attribute an an element with display:none.');
        equal($img.attr('height'), '53', 'Retrieve height attribute an an element with display:none.');

        // Check for style support
        styleElem = D('<div/>').appendTo('#qunit-fixture').css({
            background: 'url(UPPERlower.gif)'
        });
        ok(!!~styleElem.attr('style').indexOf('UPPERlower.gif'), 'Check style attribute getter');
        ok(!!~styleElem.attr('style', 'position:absolute;').attr('style').indexOf('absolute'), 'Check style setter');

        // Check value on button element (#1954)
        $button = D('<button>text</button>').insertAfter('#button');
        strictEqual($button.attr('value'), undefined, 'Absence of value attribute on a button');
        equal($button.attr('value', 'foobar').attr('value'), 'foobar', 'Value attribute on a button does not return innerHTML');
        equal($button.attr('value', 'baz').html(), 'text', 'Setting the value attribute does not change innerHTML');

        // Attributes with a colon on a table element (#1591)
        equal(D('#table').attr('test:attrib'), undefined, 'Retrieving a non-existent attribute on a table with a colon does not throw an error.');
        equal(D('#table').attr('test:attrib', 'foobar').attr('test:attrib'), 'foobar', 'Setting an attribute on a table with a colon does not throw an error.');

        $form = D('<form class="something"></form>').appendTo('#qunit-fixture');
        equal($form.attr('class'), 'something', 'Retrieve the class attribute on a form.');

        $a = D('<a href="#" onclick="something()">Click</a>').appendTo('#qunit-fixture');
        equal($a.attr('onclick'), 'something()', 'Retrieve ^on attribute without anonymous function wrapper.');

        ok(D('<div/>').attr('doesntexist') === undefined, 'Make sure undefined is returned when no attribute is found.');
        ok(D('<div/>').attr('title') === undefined, 'Make sure undefined is returned when no attribute is found.');
        equal(D('<div/>').attr('title', 'something').attr('title'), 'something', 'Set the title attribute.');
        ok(D().attr('doesntexist') === undefined, 'Make sure undefined is returned when no element is there.');
        equal(D('<div/>').attr('value'), undefined, 'An unset value on a div returns undefined.');
        strictEqual(D('<select><option value="property"></option></select>').attr('value'), undefined, 'An unset value on a select returns undefined.');

        $form = D('#form').attr('enctype', 'multipart/form-data');
        equal($form.prop('enctype'), 'multipart/form-data', 'Set the enctype of a form (encoding in IE6/7 #6743)');
    });

    test('attr(String) on cloned elements, #9646', function() {
        expect(4);

        var div,
            input = D('<input name="tester" />');

        input.attr('name');

        strictEqual(input.clone(true).attr('name', 'test')[ 0 ].name, 'test', 'Name attribute should be changed on cloned element');

        div = D('<div id="tester" />');
        div.attr('id');

        strictEqual(div.clone(true).attr('id', 'test')[ 0 ].id, 'test', 'Id attribute should be changed on cloned element');

        input = D('<input value="tester" />');
        input.attr('value');

        strictEqual(input.clone(true).attr('value', 'test')[ 0 ].value, 'test', 'Value attribute should be changed on cloned element');

        strictEqual(input.clone(true).attr('value', 42)[ 0 ].value, '42', 'Value attribute should be changed on cloned element');
    });

    test('attr(String, Function)', function() {
        expect(2);

        equal(
            D('#text1').attr('value', function() {
                return this.id;
            }).attr('value'),
            'text1',
            'Set value from id'
        );

        equal(
            D('#text1').attr('title', function(i) {
                return i;
            }).attr('title'),
            '0',
            'Set value with an index'
        );
    });

    test('attr(Hash)', function() {
        expect(3);

        var pass = true;
        D('div').attr({
            foo: 'baz',
            zoo: 'ping'
        }).each(function() {
            if (this.getAttribute('foo') !== 'baz' && this.getAttribute('zoo') !== 'ping') {
                pass = false;
            }
        });

        ok(pass, 'Set Multiple Attributes');

        equal(
            D('#text1').attr({
                value: function() {
                    return this.id;
                }}).attr('value'),
            'text1',
            'Set attribute to computed value #1'
        );

        equal(
            D('#text1').attr({
                'title': function(i) {
                    return i;
                }
            }).attr('title'),
            '0',
            'Set attribute to computed value #2'
        );
    });

    test('attr(String, Object)', function() {
        expect(69);

        var $input, $text, $details,
            attributeNode, commentNode, textNode, obj,
            table, td, j, type,
            check, thrown, button, $radio, $radios, $svg,
            div = D('div').attr('foo', 'bar'),
            i = 0,
            fail = false;

        for (; i < div.length; i++) {
            if (div[i].getAttribute('foo') !== 'bar') {
                fail = i;
                break;
            }
        }

        equal(fail, false, 'Set Attribute, the #' + fail + ' element didnt get the attribute "foo"');

        ok(
            D('#foo').attr({
                'width': null
            }),
            'Try to set an attribute to nothing'
        );

        D('#name').attr('name', 'something');
        equal(D('#name').attr('name'), 'something', 'Set name attribute');
        D('#name').attr('name', null);
        equal(D('#name').attr('name'), undefined, 'Remove name attribute');

        // As of fixing #11115, we only guarantee boolean property update for checked and selected
        $input = D('<input type="checkbox"/>').attr('checked', true);
        equal($input.prop('checked'), true, 'Setting checked updates property (verified by .prop)');
        equal($input[0].checked, true, 'Setting checked updates property (verified by native property)');
        $input = D('<option/>').attr('selected', true);
        equal($input.prop('selected'), true, 'Setting selected updates property (verified by .prop)');
        equal($input[0].selected, true, 'Setting selected updates property (verified by native property)');

        $input = D('#check2');
        $input.prop('checked', true).prop('checked', false).attr('checked', true);
        equal($input.attr('checked'), 'checked', 'Set checked (verified by .attr)');
        $input.prop('checked', false).prop('checked', true).attr('checked', false);
        equal($input.attr('checked'), undefined, 'Remove checked (verified by .attr)');

        $input = D('#text1').prop('readOnly', true).prop('readOnly', false).attr('readonly', true);
        equal($input.attr('readonly'), 'readonly', 'Set readonly (verified by .attr)');
        $input.prop('readOnly', false).prop('readOnly', true).attr('readonly', false);
        equal($input.attr('readonly'), undefined, 'Remove readonly (verified by .attr)');

        $input = D('#check2').attr('checked', true).attr('checked', false).prop('checked', true);
        equal($input[0].checked, true, 'Set checked property (verified by native property)');
        equal($input.prop('checked'), true, 'Set checked property (verified by .prop)');
        equal($input.attr('checked'), undefined, 'Setting checked property doesnt affect checked attribute');
        $input.attr('checked', false).attr('checked', true).prop('checked', false);
        equal($input[0].checked, false, 'Clear checked property (verified by native property)');
        equal($input.prop('checked'), false, 'Clear checked property (verified by .prop)');
        equal($input.attr('checked'), 'checked', 'Clearing checked property doesnt affect checked attribute');

        $input = D('#check2').attr('checked', false).attr('checked', 'checked');
        equal($input.attr('checked'), 'checked', 'Set checked to "checked" (verified by .attr)');

        $radios = D('#checkedtest').find('input[type="radio"]');
        $radios.eq(1).trigger('click');
        equal($radios.eq(1).prop('checked'), true, 'Second radio was checked when clicked');
        equal($radios.eq(0).attr('checked'), 'checked', 'First radio is still [checked]');

        $input = D('#text1').attr('readonly', false).prop('readOnly', true);
        equal($input[0].readOnly, true, 'Set readonly property (verified by native property)');
        equal($input.prop('readOnly'), true, 'Set readonly property (verified by .prop)');
        $input.attr('readonly', true).prop('readOnly', false);
        equal($input[0].readOnly, false, 'Clear readonly property (verified by native property)');
        equal($input.prop('readOnly'), false, 'Clear readonly property (verified by .prop)');

        $input = D('#name').attr('maxlength', '5');
        equal($input[0].maxLength, 5, 'Set maxlength (verified by native property)');
        $input.attr('maxLength', '10');
        equal($input[0].maxLength, 10, 'Set maxlength (verified by native property)');

        // HTML5 boolean attributes
        $text = D('#text1').attr({
            'autofocus': true,
            'required': true
        });
        equal($text.attr('autofocus'), 'autofocus', 'Reading autofocus attribute yields "autofocus"');
        equal($text.attr('autofocus', false).attr('autofocus'), undefined, 'Setting autofocus to false removes it');
        equal($text.attr('required'), 'required', 'Reading required attribute yields "required"');
        equal($text.attr('required', false).attr('required'), undefined, 'Setting required attribute to false removes it');

        $details = D('<details open></details>').appendTo('#qunit-fixture');
        equal($details.attr('open'), 'open', 'open attribute presence indicates true');
        equal($details.attr('open', false).attr('open'), undefined, 'Setting open attribute to false removes it');

        $text.attr('data-something', true);
        equal($text.attr('data-something'), 'true', 'Set data attributes');
        equal($text.data('something'), true, 'Setting data attributes are not affected by boolean settings');
        $text.attr('data-another', false);
        equal($text.attr('data-another'), 'false', 'Set data attributes');
        equal($text.data('another'), false, 'Setting data attributes are not affected by boolean settings');
        equal($text.attr('aria-disabled', false).attr('aria-disabled'), 'false', 'Setting aria attributes are not affected by boolean settings');
        $text.removeData('something').removeData('another').removeAttr('aria-disabled');

        D('#foo').attr('contenteditable', true);
        equal(D('#foo').attr('contenteditable'), 'true', 'Enumerated attributes are set properly');

        attributeNode = document.createAttribute('irrelevant');
        commentNode = document.createComment('some comment');
        textNode = document.createTextNode('some text');
        obj = {};

        D.each([ commentNode, textNode, attributeNode ], function(elem, i) {
            var $elem = D(elem);
            $elem.attr('nonexisting', 'foo');
            strictEqual($elem.attr('nonexisting'), undefined, 'attr(name, value) works correctly on comment and text nodes (bug #7500).');
        });

        D.each([ window, document, obj, '#firstp' ], function(elem, i) {
            var oldVal = elem.nonexisting,
                $elem = D(elem);
            strictEqual($elem.attr('nonexisting'), undefined, 'attr works correctly for non existing attributes (bug #7500).');
            equal($elem.attr('nonexisting', 'foo').attr('nonexisting'), 'foo', 'attr falls back to prop on unsupported arguments');
            elem.nonexisting = oldVal;
        });

        // Register the property on the window for the previous assertion so it will be clean up
        Globals.register('nonexisting');

        table = D('#table').append('<tr><td>cell</td></tr><tr><td>cell</td><td>cell</td></tr><tr><td>cell</td><td>cell</td></tr>');
        td = table.find('td').eq(0);
        td.attr('rowspan', '2');
        equal(td[0].rowSpan, 2, 'Check rowspan is correctly set');
        td.attr('colspan', '2');
        equal(td[0].colSpan, 2, 'Check colspan is correctly set');
        table.attr('cellspacing', '2');
        equal(table[0].cellSpacing, '2', 'Check cellspacing is correctly set');

        equal(D('#area1').attr('value'), undefined, 'Value attribute is distinct from value property.');

        // for #1070
        D('#name').attr('someAttr', '0');
        equal(D('#name').attr('someAttr'), '0', 'Set attribute to a string of "0"');
        D('#name').attr('someAttr', 0);
        equal(D('#name').attr('someAttr'), '0', 'Set attribute to the number 0');
        D('#name').attr('someAttr', 1);
        equal(D('#name').attr('someAttr'), '1', 'Set attribute to the number 1');

        // using contents will get comments regular, text, and comment nodes
        j = D('#nonnodes').contents();

        j.attr('name', 'attrvalue');
        equal(j.attr('name'), 'attrvalue', 'Check node,textnode,comment for attr');
        j.removeAttr('name');

        // Type
        type = D('#check2').attr('type');
        try {
            D('#check2').attr('type', 'hidden');
            ok(true, 'No exception thrown on input type change');
        } catch(e) {
            ok(true, 'Exception thrown on input type change: ' + e);
        }

        check = document.createElement('input');
        thrown = true;
        try {
            D(check).attr('type', 'checkbox');
        } catch(e) {
            thrown = false;
        }
        ok(thrown, 'Exception thrown when trying to change type property');
        equal('checkbox', D(check).attr('type'), 'Verify that you can change the type of an input element that isnt in the DOM');

        check = D('<input />');
        thrown = true;
        try {
            check.attr('type', 'checkbox');
        } catch (e) {
            thrown = false;
        }
        ok(thrown, 'Exception thrown when trying to change type property');
        equal('checkbox', check.attr('type'), 'Verify that you can change the type of an input element that isnt in the DOM');

        button = D('#button');
        try {
            button.attr('type', 'submit');
            ok(true, 'No exception thrown on button type change');
        } catch (e) {
            ok(true, 'Exception thrown on button type change: ' + e);
        }

        $radio = D('<input>', {
            'value': 'sup',
            'type': 'radio'
        }).appendTo('#testForm');
        equal($radio.val(), 'sup', 'Value is not reset when type is set after value on a radio');

        // Setting attributes on svg elements (bug #3116)
        $svg = D(
                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" baseProfile="full" width="200" height="200">' +
                '<circle cx="200" cy="200" r="150" />' +
                '</svg>'
            ).appendTo('body');
        equal($svg.attr('cx', 100).attr('cx'), '100', 'Set attribute on svg element');
        $svg.remove();

        // undefined values are chainable
        D('#name').attr('maxlength', '5').removeAttr('nonexisting');
        equal(typeof D('#name').attr('maxlength', undefined), 'object', '.attr("attribute", undefined) is chainable (#5571)');
        equal(D('#name').attr('maxlength', undefined).attr('maxlength'), '5', '.attr("attribute", undefined) does not change value (#5571)');
        equal(D('#name').attr('nonexisting', undefined).attr('nonexisting'), undefined, '.attr("attribute", undefined) does not create attribute (#5571)');
    });

    test('attr("tabindex")', function() {
        expect(8);

        // elements not natively tabbable
        equal(D('#listWithTabIndex').attr('tabindex'), '5', 'not natively tabbable, with tabindex set to 0');
        equal(D('#divWithNoTabIndex').attr('tabindex'), undefined, 'not natively tabbable, no tabindex set');

        // anchor with href
        equal(D('#linkWithNoTabIndex').attr('tabindex'), undefined, 'anchor with href, no tabindex set');
        equal(D('#linkWithTabIndex').attr('tabindex'), '2', 'anchor with href, tabindex set to 2');
        equal(D('#linkWithNegativeTabIndex').attr('tabindex'), '-1', 'anchor with href, tabindex set to -1');

        // anchor without href
        equal(D('#linkWithNoHrefWithNoTabIndex').attr('tabindex'), undefined, 'anchor without href, no tabindex set');
        equal(D('#linkWithNoHrefWithTabIndex').attr('tabindex'), '1', 'anchor without href, tabindex set to 2');
        equal(D('#linkWithNoHrefWithNegativeTabIndex').attr('tabindex'), '-1', 'anchor without href, no tabindex set');
    });

    test('attr("tabindex", value)', function() {
        expect(9);

        var element = D('#divWithNoTabIndex');
        equal(element.attr('tabindex'), undefined, 'start with no tabindex');

        // set a positive string
        element.attr('tabindex', '1');
        equal(element.attr('tabindex'), '1', 'set tabindex to 1 (string)');

        // set a zero string
        element.attr('tabindex', '0');
        equal(element.attr('tabindex'), '0', 'set tabindex to 0 (string)');

        // set a negative string
        element.attr('tabindex', '-1');
        equal(element.attr('tabindex'), '-1', 'set tabindex to -1 (string)');

        // set a positive number
        element.attr('tabindex', 1);
        equal(element.attr('tabindex'), '1', 'set tabindex to 1 (number)');

        // set a zero number
        element.attr('tabindex', 0);
        equal(element.attr('tabindex'), '0', 'set tabindex to 0 (number)');

        // set a negative number
        element.attr('tabindex', -1);
        equal(element.attr('tabindex'), '-1', 'set tabindex to -1 (number)');

        element = D('#linkWithTabIndex');
        equal(element.attr('tabindex'), '2', 'start with tabindex 2');

        element.attr('tabindex', -1);
        equal(element.attr('tabindex'), '-1', 'set negative tabindex');
    });

    test('removeAttr(String)', function() {
        expect(16);

        var $first;

        equal(D('#mark').removeAttr('class').attr('class'), undefined, 'remove class');
        equal(D('#form').removeAttr('id').attr('id'), undefined, 'Remove id');
        equal(D('#foo').attr('style', 'position:absolute;').removeAttr('style').attr('style'), undefined, 'Check removing style attribute');
        equal(D('#form').attr('style', 'position:absolute;').removeAttr('style').attr('style'), undefined, 'Check removing style attribute on a form');
        equal(D('<div style="position: absolute"></div>').appendTo('#foo').removeAttr('style').prop('style').cssText, '', 'Check removing style attribute (#9699 Webkit)');
        equal(D('#fx-test-group').attr('height', '3px').removeAttr('height').get(0).style.height, '1px', 'Removing height attribute has no effect on height set with style attribute');

        D('#check1').removeAttr('checked').prop('checked', true).removeAttr('checked');
        equal(document.getElementById('check1').checked, false, 'removeAttr sets boolean properties to false');
        D('#text1').prop('readOnly', true).removeAttr('readonly');
        equal(document.getElementById('text1').readOnly, false, 'removeAttr sets boolean properties to false');

        D('#option2c').removeAttr('selected');
        equal(D('#option2d').attr('selected'), 'selected', 'Removing `selected` from an option that is not selected does not remove selected from the currently selected option (#10870)');

        try {
            $first = D('#first').attr('contenteditable', 'true').removeAttr('contenteditable');
            equal($first.attr('contenteditable'), undefined, 'Remove the contenteditable attribute');
        } catch (e) {
            ok(false, 'Removing contenteditable threw an error (#10429)');
        }

        $first = D('<div Case="mixed"></div>');
        equal($first.attr('Case'), 'mixed', 'case of attribute doesnt matter');
        $first.removeAttr('Case');
        equal($first.attr('Case'), undefined, 'mixed-case attribute was removed');

        var div = D('<div id="a" alt="b" title="c" rel="d"></div>'),
            tests = {
                id: 'a',
                alt: 'b',
                title: 'c',
                rel: 'd'
            };

        D.each(tests, function(val, key) {
            equal(div.attr(key), val, 'Attribute `' + key + '` exists, and has a value of `' + val + '`');
        });
    });

    test('prop(String, Object)', function() {
        expect(17);

        equal(D('#text1').prop('value'), 'Test', 'Check for value attribute');
        equal(D('#text1').prop('value', 'Test2').prop('defaultValue'), 'Test', 'Check for defaultValue attribute');
        equal(D('#select2').prop('selectedIndex'), 3, 'Check for selectedIndex attribute');
        equal(D('#foo').prop('nodeName').toUpperCase(), 'DIV', 'Check for nodeName attribute');
        equal(D('#foo').prop('tagName').toUpperCase(), 'DIV', 'Check for tagName attribute');
        equal(D('<option/>').prop('selected'), false, 'Check selected attribute on disconnected element.');

        equal(D('#listWithTabIndex').prop('tabindex'), 5, 'Check retrieving tabindex');
        D('#text1').prop('readonly', true);
        equal(document.getElementById('text1').readOnly, true, 'Check setting readOnly property with "readonly"');
        equal(D('#label-for').prop('for'), 'action', 'Check retrieving htmlFor');
        D('#text1').prop('class', 'test');
        equal(document.getElementById('text1').className, 'test', 'Check setting className with "class"');
        equal(D('#text1').prop('maxlength'), 30, 'Check retrieving maxLength');
        D('#table').prop('cellspacing', 1);
        equal(D('#table').prop('cellSpacing'), '1', 'Check setting and retrieving cellSpacing');
        D('#table').prop('cellpadding', 1);
        equal(D('#table').prop('cellPadding'), '1', 'Check setting and retrieving cellPadding');
        D('#table').prop('rowspan', 1);
        equal(D('#table').prop('rowSpan'), 1, 'Check setting and retrieving rowSpan');
        D('#table').prop('colspan', 1);
        equal(D('#table').prop('colSpan'), 1, 'Check setting and retrieving colSpan');
        D('#table').prop('usemap', 1);
        equal(D('#table').prop('useMap'), 1, 'Check setting and retrieving useMap');
        D('#table').prop('frameborder', 1);
        equal(D('#table').prop('frameBorder'), 1, 'Check setting and retrieving frameBorder');
    });

    test('prop(String, Object) on null/undefined', function() {
        expect(13);

        var select, optgroup, option, attributeNode, commentNode, textNode, obj, $form,
            body = document.body,
            $body = D(body);

        ok($body.prop('nextSibling') === null, 'Make sure a null expando returns null');
        body.foo = 'bar';
        equal($body.prop('foo'), 'bar', 'Make sure the expando is preferred over the dom attribute');
        body.foo = undefined;
        ok($body.prop('foo') === undefined, 'Make sure the expando is preferred over the dom attribute, even if undefined');

        select = document.createElement('select');
        optgroup = document.createElement('optgroup');
        option = document.createElement('option');

        optgroup.appendChild(option);
        select.appendChild(optgroup);

        equal(D(option).prop('selected'), true, 'Make sure that a single option is selected, even when in an optgroup.');
        equal(D(document).prop('nodeName'), '#document', 'prop works correctly on document nodes (bug #7451).');

        attributeNode = document.createAttribute('irrelevant');
        commentNode = document.createComment('some comment');
        textNode = document.createTextNode('some text');
        obj = {};
        D.each([ document, attributeNode, commentNode, textNode, obj, '#firstp' ], function(ele, i) {
            strictEqual(D(ele).prop('nonexisting'), undefined, 'prop works correctly for non existing attributes (bug #7500).');
        });

        obj = {};
        D.each([ document /*, obj*/ ], function(ele, i) {
            var $ele = D(ele);
            $ele.prop('nonexisting', 'foo');
            equal($ele.prop('nonexisting'), 'foo', 'prop(name, value) works correctly for non existing attributes (bug #7500).');
        });
        D(document).removeProp('nonexisting');

        $form = D('#form').prop('enctype', 'multipart/form-data');
        equal($form.prop('enctype'), 'multipart/form-data', 'Set the enctype of a form (encoding in IE6/7 #6743)');
    });

    test('prop("tabindex")', function() {
        expect(11);


        // inputs without tabIndex attribute
        equal(D('#inputWithoutTabIndex').prop('tabindex'), 0, 'input without tabindex');
        equal(D('#buttonWithoutTabIndex').prop('tabindex'), 0, 'button without tabindex');
        equal(D('#textareaWithoutTabIndex').prop('tabindex'), 0, 'textarea without tabindex');

        // elements not natively tabbable
        equal(D('#listWithTabIndex').prop('tabindex'), 5, 'not natively tabbable, with tabindex set to 0');
        equal(D('#divWithNoTabIndex').prop('tabindex'), -1, 'not natively tabbable, no tabindex set');

        // anchor with href
        equal(D('#linkWithNoTabIndex').prop('tabindex'), 0, 'anchor with href, no tabindex set');
        equal(D('#linkWithTabIndex').prop('tabindex'), 2, 'anchor with href, tabindex set to 2');
        equal(D('#linkWithNegativeTabIndex').prop('tabindex'), -1, 'anchor with href, tabindex set to -1');

        // anchor without href
        equal(D('#linkWithNoHrefWithNoTabIndex').prop('tabindex'), -1, 'anchor without href, no tabindex set');
        equal(D('#linkWithNoHrefWithTabIndex').prop('tabindex'), 1, 'anchor without href, tabindex set to 2');
        equal(D('#linkWithNoHrefWithNegativeTabIndex').prop('tabindex'), -1, 'anchor without href, no tabindex set');
    });

    test('prop("tabindex", value)', 10, function() {
        var clone,
            element = D('#divWithNoTabIndex');

        equal(element.prop('tabindex'), -1, 'start with no tabindex');

        // set a positive string
        element.prop('tabindex', '1');
        equal(element.prop('tabindex'), 1, 'set tabindex to 1 (string)');

        // set a zero string
        element.prop('tabindex', '0');
        equal(element.prop('tabindex'), 0, 'set tabindex to 0 (string)');

        // set a negative string
        element.prop('tabindex', '-1');
        equal(element.prop('tabindex'), -1, 'set tabindex to -1 (string)');

        // set a positive number
        element.prop('tabindex', 1);
        equal(element.prop('tabindex'), 1, 'set tabindex to 1 (number)');

        // set a zero number
        element.prop('tabindex', 0);
        equal(element.prop('tabindex'), 0, 'set tabindex to 0 (number)');

        // set a negative number
        element.prop('tabindex', -1);
        equal(element.prop('tabindex'), -1, 'set tabindex to -1 (number)');

        element = D('#linkWithTabIndex');
        equal(element.prop('tabindex'), 2, 'start with tabindex 2');

        element.prop('tabindex', -1);
        equal(element.prop('tabindex'), -1, 'set negative tabindex');

        clone = element.clone();
        clone.prop('tabindex', 1);
        equal(clone[ 0 ].getAttribute('tabindex'), '1', 'set tabindex on cloned element');
    });

    test('removeProp(String)', function() {
        expect(6);

        var attributeNode = document.createAttribute('irrelevant'),
            commentNode = document.createComment('some comment'),
            textNode = document.createTextNode('some text'),
            obj = {};

        strictEqual(
            D('#firstp').prop('nonexisting', 'foo').removeProp('nonexisting')[ 0 ].nonexisting,
            undefined,
            'removeprop works correctly on DOM element nodes'
        );

        D.each([ document, obj ], function(i, ele) {
            var $ele = D(ele);
            $ele.prop('nonexisting', 'foo').removeProp('nonexisting');
            strictEqual(ele.nonexisting, undefined, 'removeProp works correctly on non DOM element nodes (bug #7500).');
        });
        D.each([ commentNode, textNode, attributeNode ], function(i, ele) {
            var $ele = D(ele);
            $ele.prop('nonexisting', 'foo').removeProp('nonexisting');
            strictEqual(ele.nonexisting, undefined, 'removeProp works correctly on non DOM element nodes (bug #7500).');
        });
    });

    test('val() after modification', function() {
        expect(1);

        document.getElementById('text1').value = 'bla';
        equal(D('#text1').val(), 'bla', 'Check for modified value of input element');
    });


    test('val()', function() {
        expect(20);

        var checks, $button;
        equal(D('#text1').val(), 'Test', 'Check for value of input element');
        // ticket #1714 this caused a JS error in IE
        equal(D('#first').val(), undefined, 'Check a paragraph element to see if it has a value');
        ok(D([]).val() === undefined, 'Check an empty D object will return undefined from val');

        equal(D('#select2').val(), '3', 'Call val() on a single="single" select');

        deepEqual(D('#select3').val(), [ '1', '2' ], 'Call val() on a multiple="multiple" select');

        equal(D('#option3c').val(), '2', 'Call val() on a option element with value');

        equal(D('#option3a').val(), '', 'Call val() on a option element with empty value');

        equal(D('#option3e').val(), 'no value', 'Call val() on a option element with no value attribute');

        equal(D('#option3a').val(), '', 'Call val() on a option element with no value attribute');

        D('#select3').val('');
        deepEqual(D('#select3').val(), [''], 'Call val() on a multiple="multiple" select');

        deepEqual(D('#select4').val(), [], 'Call val() on multiple="multiple" select with all disabled options');

        D('#select4 optgroup').add('#select4 > [disabled]').attr('disabled', false);
        deepEqual(D('#select4').val(), [ '2', '3' ], 'Call val() on multiple="multiple" select with some disabled options');

        D('#select4').attr('disabled', true);
        deepEqual(D('#select4').val(), [ '2', '3' ], 'Call val() on disabled multiple="multiple" select');

        equal(D('#select5').val(), '3', 'Check value on ambiguous select.');

        D('#select5').val(1);
        equal(D('#select5').val(), '1', 'Check value on ambiguous select.');

        D('#select5').val(3);
        equal(D('#select5').val(), '3', 'Check value on ambiguous select.');

        strictEqual(
            D('<select name="select12584" id="select12584"><option value="1" disabled="disabled">1</option></select>').val(),
            null,
            'Select-one with only option disabled (#12584)'
        );

        $button = D('<button value="foobar">text</button>').insertAfter('#button');
        equal($button.val(), 'foobar', 'Value retrieval on a button does not return innerHTML');
        equal($button.val('baz').html(), 'text', 'Setting the value does not change innerHTML');

        equal(D('<option></option>').val('test').attr('value'), 'test', 'Setting value sets the value attribute');
    });

    test('val() with non-matching values on dropdown list', function() {
        expect(3);

        D('#select5').val('');
        equal(D('#select5').val(), null, 'Non-matching set on select-one');

        var select6 = D('<select multiple id=\'select6\'><option value=\'1\'>A</option><option value=\'2\'>B</option></select>').appendTo('#form');
        D(select6).val('nothing');
        equal(D(select6).val(), null, 'Non-matching set (single value) on select-multiple');

        D(select6).val(['nothing1', 'nothing2']);
        equal(D(select6).val(), null, 'Non-matching set (array of values) on select-multiple');

        select6.remove();
    });

    if ('value' in document.createElement('meter') && 'value' in document.createElement('progress')) {

        test('val() respects numbers without exception (Bug #9319)', function() {
            expect(4);

            var $meter = D('<meter min="0" max="10" value="5.6"></meter>'),
                $progress = D('<progress max="10" value="1.5"></progress>');

            try {
                equal(typeof $meter.val(), 'number', 'meter, returns a number and does not throw exception');
                equal($meter.val(), $meter[ 0 ].value, 'meter, api matches host and does not throw exception');

                equal(typeof $progress.val(), 'number', 'progress, returns a number and does not throw exception');
                equal($progress.val(), $progress[ 0 ].value, 'progress, api matches host and does not throw exception');

            } catch (e) {}

            $meter.remove();
            $progress.remove();
        });
    }

    var testVal = function(valueObj) {
        expect(9);

        D('#text1').val(valueObj('test'));
        equal(document.getElementById('text1').value, 'test', 'Check for modified (via val(String)) value of input element');

        D('#text1').val(valueObj(undefined));
        equal(document.getElementById('text1').value, '', 'Check for modified (via val(undefined)) value of input element');

        D('#text1').val(valueObj(67));
        equal(document.getElementById('text1').value, '67', 'Check for modified (via val(Number)) value of input element');

        D('#text1').val(valueObj(null));
        equal(document.getElementById('text1').value, '', 'Check for modified (via val(null)) value of input element');

        var j,
            $select = D('<select multiple><option value="1"></option><option value="2"></option></select>'),
            $select1 = D('#select1');

        $select1.val(valueObj('3'));
        equal($select1.val(), '3', 'Check for modified (via val(String)) value of select element');

        $select1.val(valueObj(2));
        equal($select1.val(), '2', 'Check for modified (via val(Number)) value of select element');

        $select1.append('<option value="4">four</option>');
        $select1.val(valueObj(4));
        equal($select1.val(), '4', 'Should be possible to set the val() to a newly created option');

        // using contents will get comments regular, text, and comment nodes
        j = D('#nonnodes').contents();
        j.val(valueObj('asdf'));
        equal(j.val(), 'asdf', 'Check node,textnode,comment with val()');
        j.removeAttr('value');

        $select.val(valueObj([ '1', '2' ]));
        deepEqual($select.val(), [ '1', '2' ], 'Should set array of values');
    };

    test('val(String/Number)', function() {
        testVal(bareObj);
    });

    test('val(Function)', function() {
        testVal(functionReturningObj);
    });

    test('val(Array of Numbers) (Bug #7123)', function() {
        expect(4);

        D('#form').append('<input type="checkbox" name="arrayTest" value="1" /><input type="checkbox" name="arrayTest" value="2" /><input type="checkbox" name="arrayTest" value="3" checked="checked" /><input type="checkbox" name="arrayTest" value="4" />');
        var elements = D('input[name=arrayTest]').val([ 1, 2 ]);
        ok(elements[ 0 ].checked, 'First element was checked');
        ok(elements[ 1 ].checked, 'Second element was checked');
        ok(!elements[ 2 ].checked, 'Third element was unchecked');
        ok(!elements[ 3 ].checked, 'Fourth element remained unchecked');

        elements.remove();
    });

    test('val(Function) with incoming value', function() {
        expect(10);

        var oldVal = D('#text1').val();

        D('#text1').val(function(i, val) {
            equal(val, oldVal, 'Make sure the incoming value is correct.');
            return 'test';
        });

        equal(document.getElementById('text1').value, 'test', 'Check for modified (via val(String)) value of input element');

        oldVal = D('#text1').val();

        D('#text1').val(function(i, val) {
            equal(val, oldVal, 'Make sure the incoming value is correct.');
            return 67;
        });

        equal(document.getElementById('text1').value, '67', 'Check for modified (via val(Number)) value of input element');

        oldVal = D('#select1').val();

        D('#select1').val(function(i, val) {
            equal(val, oldVal, 'Make sure the incoming value is correct.');
            return '3';
        });

        equal(D('#select1').val(), '3', 'Check for modified (via val(String)) value of select element');

        oldVal = D('#select1').val();

        D('#select1').val(function(i, val) {
            equal(val, oldVal, 'Make sure the incoming value is correct.');
            return 2;
        });

        equal(D('#select1').val(), '2', 'Check for modified (via val(Number)) value of select element');

        D('#select1').append('<option value="4">four</option>');

        oldVal = D('#select1').val();

        D('#select1').val(function(i, val) {
            equal(val, oldVal, 'Make sure the incoming value is correct.');
            return 4;
        });

        equal(D('#select1').val(), '4', 'Should be possible to set the val() to a newly created option');
    });

    // testing if a form.reset() breaks a subsequent call to a select element's .val() (in IE only)
    test('val(select) after form.reset() (Bug #2551)', function() {
        expect(3);

        D('<form id="kk" name="kk"><select id="kkk"><option value="cf">cf</option><option value="gf">gf</option></select></form>').appendTo('#qunit-fixture');

        D('#kkk').val('gf');

        document.kk.reset();

        equal(D('#kkk')[ 0 ].value, 'cf', 'Check value of select after form reset.');
        equal(D('#kkk').val(), 'cf', 'Check value of select after form reset.');

        // re-verify the multi-select is not broken (after form.reset) by our fix for single-select
        deepEqual(D('#select3').val(), ['1', '2'], 'Call val() on a multiple="multiple" select');

        D('#kk').remove();
    });

    test('should not throw at $(option).val() (#14686)', function() {
        expect(1);

        try {
            D('<option></option>').val();
            ok(true);
        } catch (e) {
            ok(false);
        }
    });

    test('Insignificant white space returned for $(option).val() (#14858)', function() {
        expect(3);

        var val = D('<option></option>').val();
        equal(val.length, 0, 'Empty option should have no value');

        val = D('<option>  </option>').val();
        equal(val.length, 0, 'insignificant white-space returned for value');

        val = D('<option>  test  </option>').val();
        equal(val.length, 4, 'insignificant white-space returned for value');
    });

}());
