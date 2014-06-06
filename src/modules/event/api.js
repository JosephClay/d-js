var _      = require('_'),

    _utils = require('../../utils');
    _event = require('./event');

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

            return this.each(function() {
                _event.add(this, types, fn, data, selector);
            });
        },

        one: function(types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1);
        },

        // Proxy to one
        once: function() { this.one.apply(this, arguments); },

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

            return this.each(function() {
                _event.remove(this, types, fn, selector);
            });
        },

        trigger: function(type, data) {
            return this.each(function() {
                _event.trigger(type, data, this);
            });
        },

        triggerHandler: function(type, data) {
            var first = this[0];
            if (!first) { return; }

            return _event.trigger(type, data, first, true);
        }
    }
};