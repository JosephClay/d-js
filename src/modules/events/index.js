var _          = require('underscore'),
    isFunction = require('is/function'),
    delegate   = require('./delegate'),
    custom     = require('./custom');

var eventer = function(method) {
    return function(types, filter, fn) {
        var typelist = types.split(' ');
        if (!isFunction(fn)) {
            fn = filter;
            filter = null;
        }
        _.each(this, function(elem) {
            _.each(typelist, function(type) {
                var handler = custom.handlers[type];
                if (handler) {
                    method(elem, handler.event, filter, handler.wrap(fn));
                } else {
                    method(elem, type, filter, fn);
                }
            });
        });
        return this;
    };
};

module.exports = {
    fn: {
        on:      eventer(delegate.on),
        off:     eventer(delegate.off),
        trigger: eventer(delegate.trigger)
    }
};