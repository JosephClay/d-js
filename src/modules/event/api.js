var _         = require('underscore'),

    isObject = require('is/object'),
    isString = require('is/string'),

    _utils    = require('../../utils'),
    _event    = require('./event');

module.exports = {
    fn: {

        on: function(types, selector, data, fn, /*INTERNAL*/ one) {
            // Types can be a map of types/handlers
            if (isObject(types)) {

                // ( types-Object, selector, data )
                if (!isString(selector)) {
                    // ( types-Object, data )
                    data = data || selector;
                    selector = undefined;
                }

                var type;
                for (type in types) {
                    this.on(type, selector, data, types[type], one);
                }

                return this;
            }

            if (!_.exists(data) && !_.exists(fn)) {

                // ( types, fn )
                fn = selector;
                data = selector = undefined;

            } else if (!_.exists(fn)) {

                if (isString(selector)) {

                    // ( types, selector, fn )
                    fn = data;
                    data = undefined;

                } else {

                    // ( types, data, fn )
                    fn = data;
                    data = selector;
                    selector = undefined;

                }
            }

            if (fn === false) {

                fn = _utils.returnFalse;

            } else if (!fn) {

                return this;

            }

            // TODO: Make this self removing by adding a unique namespace and then unbinding that namespace
            var origFn;
            if (one === 1) {
                origFn = fn;
                fn = function(event) {
                    // Can use an empty set, since event contains the info
                    // TODO: Address this
                    jQuery().off(event);
                    return origFn.apply( this, arguments );
                };
            }

            return _.each(this, function(elem) {
                _event.add(elem, types, fn, data, selector);
            });
        },


        once: function(evt, selector, fn) {
            // object
            if (arguments.length === 1) {
                var events = evt,
                    self = this;
                _.each(events, function(fn, evt) {
                    self.once(evt, fn);
                });
                return this;
            }

            if (arguments.length === 2) {
                // object string
                if (isString(selector)) {
                    var self = this;
                    _.each(events, function(fn, evt) {
                        self.once(evt, selector, fn);
                    });
                    return this;
                }
            
                // string function
                fn = selector;
                return this.on(types, selector, data, fn, 1);
            }

            // string string function
            if (arguments.length === 3) {
                return this.on(types, selector, data, fn, 1);
            }

            // fallback
            return this;
        },

        //  TODO: Don't use the stupid 1 on the end
        one: function(types, selector, data, fn) {
            return this.once.apply(this, arguments);
        },

        off: function() { return this; },
/*
        off: overload()

            // In leu of { string: function }, since we
            // dont allow functions in the off, allow an array
            // of strings instead...
            .args(Array)
            .use(function(arr) {
                return _.each(this, function(elem) {
                    _.each(arr, function(evt) {
                        _event.remove(elem, evt);
                    });
                });
            })

            // ...and, of course, allow a selector
            .args(Array, String)
            .use(function(arr, selector) {
                return _.each(this, function(elem) {
                    _.each(arr, function(evt) {
                        _event.remove(elem, evt, selector);
                    });
                });
            })

            .args(String)
            .use(function(evt) {
                return _.each(this, function(elem) {
                    _event.remove(elem, evt);
                });
            })

            .args(String, String)
            .use(function(evt, selector) {
                return _.each(this, function(elem) {
                    _event.remove(elem, evt, selector);
                });
            })

            .fallback(_utils.returnThis)

            .expose(),
*/
        trigger: function(type, data) {
            return _.each(this, function(elem) {
                _event.trigger(type, data, elem);
            });
        },

        triggerHandler: function(type, data) {
            var first = this[0];
            if (!first) { return; }

            return _event.trigger(type, data, first, true);
        }
    }
};
