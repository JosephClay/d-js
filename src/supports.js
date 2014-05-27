var div       = require('./div'),
    a         = div.getElementsByTagName('a')[0],
    select    = document.createElement('select'),
    option    = select.appendChild(document.createElement('option')),
    input     = document.createElement('input'),
    textarea  = document.createElement('textarea');

module.exports = {
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
    // Use a regex to work around a WebKit issue. See #5145
    opacity: (/^0.55$/).test(div.style.opacity),

    // Make sure that URLs aren't manipulated
    // (IE normalizes it by default)
    hrefNormalized: a.getAttribute('href') === '/a',

    // Check the default checkbox/radio value ('' on WebKit; 'on' elsewhere)
    checkOn: !!input.value,

    // Check if an input maintains its value after becoming a radio
    // Support: IE9, IE10
    radioValue: input.value === 't',

    // Make sure that the options inside disabled selects aren't marked as disabled
    // (WebKit marks them as disabled)
    optDisabled: (function() {
        select.disabled = true;
        return !option.disabled;
    }()),

    // Modern browsers normalize \r\n to \n in textarea values,
    // but IE <= 11 (and possibly newer) do not.
    valueNormalized: (function() {
        textarea.value = '\r\n';
        return textarea.value === '\n';
    }()),

    // Support: IE9+, modern browsers
    getPropertyValue: !!a.style.getPropertyValue,

    // Support: IE8
    getAttribute: !!a.style.getAttribute,

    // Support: IE9+, modern browsers
    getElementsByClassName: !!a.getElementsByClassName
};
