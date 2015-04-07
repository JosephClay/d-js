var crossvent = require('crossvent'),
    exists    = require('is/exists'),
    matches   = require('matchesSelector'),
    delegates = {};

// this method caches delegates so that .off() works seamlessly
var delegate = function(root, selector, fn) {
    if (delegates[fn._dd]) { return delegates[fn._dd]; }

    var id = fn._dd = Date.now();
    return delegates[id] = function(e) {
        var el = e.target;
        while (el && el !== root) {
            if (matches(el, selector)) {
                fn.apply(this, arguments);
                return;
            }
            el = el.parentElement;
        }
    };
};

var evented = function(method, el, type, selector, fn) {
    if (!exists(selector)) {
        method(el, type, fn);
    } else {
        method(el, type, delegate(el, selector, fn));
    }
};

module.exports = {
    on:      evented.bind(null, crossvent.add),
    off:     evented.bind(null, crossvent.remove),
    trigger: evented.bind(null, crossvent.fabricate)
};