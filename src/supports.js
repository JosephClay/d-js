define([ 'div' ], function(_div) {

    return {
        classList: !!_div.classList,
        matchesSelector: _div.matches || _div.matchesSelector || _div.msMatchesSelector || _div.mozMatchesSelector || _div.webkitMatchesSelector || _div.oMatchesSelector
    };

});