var q = function() {
    var elems = [],
        idx,
        len = arguments.length,
        el;

    for (idx = 0; idx < len; idx++) {
        el = document.getElementById(arguments[idx]);
        if (el) { elems.push(el); }
    }

    return elems;
};

var t = function(message, selector, args) {
    var elems = D(selector).get();
    deepEqual(elems, q.apply(null, args), message + ' (' + selector + ')' );
};