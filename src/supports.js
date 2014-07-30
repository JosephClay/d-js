var _      = require('_'),
    div    = require('./div'),
    a      = div.getElementsByTagName('a')[0],
    button = div.getElementsByTagName('button')[0],
    select = document.createElement('select'),
    option = select.appendChild(document.createElement('option'));

var _test = function(tagName, testFn) {
    // Avoid variable references to elements to prevent memory leaks in IE.
    return testFn(document.createElement(tagName));
};

var support = {};

// Support: IE < 9 (lack submit/change bubble), Firefox 23+ (lack focusin event)
_.each([ 'submit', 'change', 'focusin' ], function(type) {
    var eventName   = 'on' + type,
        supportName = type + 'Bubbles';

    if (!(support[supportName] = eventName in window)) {
        // Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
        div.setAttribute(eventName, 't');

        // Checking '_' as it should be null or undefined if the
        // event is supported, false if it's not
        support[supportName] = div.attributes[eventName]._ === false;
    }
});

module.exports = _.extend(support, {
    classList:     !!div.classList,
    currentStyle:  !!div.currentStyle,
    matchesSelector: div.matches               ||
                     div.matchesSelector       ||
                     div.msMatchesSelector     ||
                     div.mozMatchesSelector    ||
                     div.webkitMatchesSelector ||
                     div.oMatchesSelector,

    // Make sure that element opacity exists
    // (IE uses filter instead)
    // Use a regex to work around a WebKit issue. See jQuery #5145
    opacity: (/^0.55$/).test(div.style.opacity),

    // Make sure that URLs aren't manipulated
    // (IE normalizes it by default)
    hrefNormalized: a.getAttribute('href') === '/a',

    // Check the default checkbox/radio value ('' in older WebKit; 'on' elsewhere)
    checkOn: _test('input', function(input) {
        input.setAttribute('type', 'radio');
        return !!input.value;
    }),

    // Check if an input maintains its value after becoming a radio
    // Support: Modern browsers only (NOT IE <= 11)
    radioValue: _test('input', function(input) {
        input.value = 't';
        input.setAttribute('type', 'radio');
        return input.value === 't';
    }),

    // Make sure that the options inside disabled selects aren't marked as disabled
    // (WebKit marks them as disabled)
    optDisabled: (function() {
        select.disabled = true;
        return !option.disabled;
    }()),

    // Modern browsers normalize \r\n to \n in textarea values,
    // but IE <= 11 (and possibly newer) do not.
    valueNormalized: _test('textarea', function(textarea) {
        textarea.value = '\r\n';
        return textarea.value === '\n';
    }),

    // Support: IE9+, modern browsers
    getPropertyValue:       !!a.style.getPropertyValue,

    // Support: IE8
    getAttribute:           !!a.style.getAttribute,

    // Support: IE9+, modern browsers
    getElementsByClassName: !!a.getElementsByClassName,

    // Support: IE9+, modern browsers
    getComputedStyle:       !!window.getComputedStyle,

    // Support: IE9+, modern browsers
    // innerHTML on tbody elements is readOnly in IE8
    // See: http://stackoverflow.com/a/4729743/467582
    writableTbody: _test('tbody', function(tbody) {
        tbody.innerHTML = '<tr><td></td></tr>';
        return !!tbody.innerHTML;
    }),

    // Support: IE9+, modern browsers
    // The only workaround seems to be use outerHTML and include your <select> in the string
    writableSelect: (function() {
        select.innerHTML = '<option></option>';
        return !!(select.children && select.children.length);
    }()),

    // Support: IE9+, modern browsers
    // Use defaultValue property instead of getAttribute("value")
    inputValueAttr: _test('input', function(input) {
        input.setAttribute('value', '');
        return input.getAttribute('value') === '';
    }),

    // Support: IE9+, modern browsers
    buttonValue: (function() {
        button.setAttribute('value', 'foobar');
        return button.value === 'foobar';
    }()),

    disabledSelector: _test('div', function(div) {
        div.innerHTML = '<input disabled />';
        try {
            return div.querySelectorAll('input:disabled').length > 0;
        } catch (e) {
            // IE8
        }
        return false;
    }),

    checkedSelector: _test('div', function(div) {
        div.innerHTML = '<input type="checkbox" checked />';
        try {
            return div.querySelectorAll('input:checked').length > 0;
        } catch (e) {
            // IE8
        }
        return false;
    })
});

// Prevent memory leaks in IE
div = a = button = select = option = null;
