var _         = require('_'),
    overload  = require('overload'),
    O         = overload.O,

    _utils    = require('../../utils'),
    _event    = require('./event'),
    _specials = require('./eventSpecials');

module.exports = {
    fn: {

        on: overload()

            .args(String, String, Function)
            .use(function(eventName, selector, fn) {
                _.each(this, function(elem) {
                    _event.add(elem, eventName, selector, fn);
                });
                return this;
            })

            .args(String, Function)
            .use(function(eventName, fn) {
                _.each(this, function(elem) {
                    _event.add(elem, eventName, '', fn);
                });
                return this;
            })

            .args(Object, String)
            .use(function(obj, selector) {
                _.each(this, function(elem) {
                    _.each(obj, function(fn, eventName) {
                        _event.add(elem, eventName, selector, fn);
                    });
                });
                return this;
            })

            .args(Object)
            .use(function(obj) {
                _.each(this, function(elem) {
                    _.each(obj, function(fn, eventName) {
                        _event.add(elem, eventName, '', fn);
                    });
                });
                return this;
            })

            .expose(),

        once: overload()
            .args(Object)
            .use(function(events) {
                var self = this;
                _.each(events, function(fn, evt) {
                    self.once(evt, fn);
                });
                return this;
            })

            .args(Object, String)
            .use(function(events, selector) {
                var self = this;
                _.each(events, function(fn, evt) {
                    self.once(evt, selector, fn);
                });
                return this;
            })

            .args(String, Function)
            .use(function(evt, fn) {

                return this.on(types, selector, data, fn, 1);

            })

            .args(String, String, Function)
            .use(function(evt, selector, fn) {

                return this.on(types, selector, data, fn, 1);

            })

            .expose(),

        one: function() {
            return this.once.apply(this, arguments);
        },

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
