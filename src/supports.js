var div = require('./div'),
    a = div.getElementsByTagName('a')[0];

module.exports = {
    classList: !!div.classList,
    currentStyle: !!div.currentStyle,
    matchesSelector: div.matches ||
                        div.matchesSelector ||
                            div.msMatchesSelector ||
                                div.mozMatchesSelector ||
                                    div.webkitMatchesSelector ||
                                        div.oMatchesSelector,

    // Make sure that element opacity exists
    // (IE uses filter instead)
    // Use a regex to work around a WebKit issue. See #5145
    opacity: (/^0.55$/).test(div.style.opacity),

    // Make sure that URLs aren't manipulated
    // (IE normalizes it by default)
    hrefNormalized: a.getAttribute('href') === '/a'
};