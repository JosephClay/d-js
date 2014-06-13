var _         = require('_'),
    overload  = require('overload'),
    O         = overload.O,

    _utils    = require('../../utils');
    _event    = require('./event');
    _specials = require('./eventSpecials');

module.exports = {
    fn: {

        on: function(types, selector, data, fn, /*INTERNAL*/ one) {
            // Types can be a map of types/handlers
            if (_.isObject(types)) {

                // ( types-Object, selector, data )
                if (!_.isString(selector)) {
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

                if (_.isString(selector)) {

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

            var origFn;
            if (one === 1) {
                origFn = fn;
                fn = function(event) {
                    // Can use an empty set, since event contains the info
                    // TODO: Address this
                    jQuery().off(event);
                    return origFn.apply( this, arguments );
                };

                // Use same guid so caller can remove using origFn
                fn.guid = origFn.guid || (origFn.guid = _.uniqueId());
            }

            return _.each(this, function(elem) {
                _event.add(elem, types, fn, data, selector);
            });
        },


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

                // this.on(types, selector, data, fn, 1);
                
            })

            .args(String, String, Function)
            .use(function(evt, selector, fn) {

                // this.on(types, selector, data, fn, 1);

            })

            .expose(),



        //  TODO: Don't use the stupid 1 on the end
        one: function(types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1);
        },

        off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) {
                // ( event )  dispatched Event
                handleObj = types.handleObj;
                // TODO:
                D(types.delegateTarget).off(
                    handleObj.namespace ? handleObj.origType + '.' + handleObj.namespace : handleObj.origType,
                    handleObj.selector,
                    handleObj.handler
                );
                return this;
            }

            if (_.isObject(types)) {
                // ( types-object [, selector] )
                for (type in types) {
                    this.off(type, selector, types[type] );
                }
                return this;
            }

            if (selector === false || _.isFunction(selector)) {
                // ( types [, fn] )
                fn = selector;
                selector = undefined;
            }

            if (fn === false) {
                fn = returnFalse;
            }

            return _.each(this, function(elem) {
                _event.remove(elem, types, fn, selector);
            });
        },

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