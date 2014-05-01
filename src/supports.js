var div = require('./div');

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
    opacity: (/^0.55$/).test(div.style.opacity)
};