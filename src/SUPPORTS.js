var DIV    = require('DIV'),
    create = require('DIV/create'),
    a      = DIV.querySelector('a'),
    select = create('select'),
    option = select.appendChild(create('option')),

    test = (tagName, testFn) => testFn(create(tagName));

module.exports = {
    // Make sure that URLs aren't manipulated
    // (IE normalizes it by default)
    hrefNormalized: a.getAttribute('href') === '/a',

    // Check the default checkbox/radio value ('' in older WebKit; 'on' elsewhere)
    checkOn: test('input', function(input) {
        input.setAttribute('type', 'radio');
        return !!input.value;
    }),

    // Check if an input maintains its value after becoming a radio
    // Support: Modern browsers only (NOT IE <= 11)
    radioValue: test('input', function(input) {
        input.value = 't';
        input.setAttribute('type', 'radio');
        return input.value === 't';
    }),

    // Make sure that a selected-by-default option has a working selected property.
    // (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
    optSelected: option.selected,

    // Make sure that the options inside disabled selects aren't marked as disabled
    // (WebKit marks them as disabled)
    optDisabled: (function() {
        select.disabled = true;
        return !option.disabled;
    }()),
    
    textContent: DIV.textContent !== undefined,

    // Modern browsers normalize \r\n to \n in textarea values,
    // but IE <= 11 (and possibly newer) do not.
    valueNormalized: test('textarea', function(textarea) {
        textarea.value = '\r\n';
        return textarea.value === '\n';
    }),

    // Support: IE10+, modern browsers
    selectedSelector: test('select', function(select) {
        select.innerHTML = '<option value="1">1</option><option value="2" selected>2</option>';
        return !!select.querySelector('option[selected]');
    })
};
