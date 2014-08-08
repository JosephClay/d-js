var _           = require('_'),

    Event       = require('./E'),
    Fizzle      = require('../Fizzle/Fizzle'),
    _supports   = require('../../supports'),
    _nodeType   = require('../../nodeType'),
    _regex      = require('../../regex'),
    _utils      = require('../../utils'),
    _array      = require('../array'),
    _data       = require('../data'),
    _eventUtils = require('./eventUtils'),

    _global     = {},

    _EVENT_KEY  = '__D_events__ ',
    _NOOP_OBJ   = {},
    _CLICK = {
        none  : 0,
        left  : 1,
        middle: 2,
        right : 3
    },

    _addEventListener = _supports.w3Event ?
        function(elem, eventName, handler) {
            elem.addEventListener(eventName, handler);
        }
        // IE8
        : function(elem, eventName, handler) {
            elem.attachEvent('on' + eventName, function() {
                // TODO: Do we need to call?
                handler.call(elem);
            });
        },
    _removeEventListener = _supports.w3Event ?
        function(elem, eventName, handler) {
            elem.removeEventListener(eventName, handler);
        }
        // IE8
        : function(elem, eventName, handler) {
            eventName = 'on' + eventName;

            // #8545, #7054, preventing memory leaks for custom events in IE6-8
            // detachEvent needed property on element, by name of that event, to properly expose it to GC
            if (elem[eventName] === undefined) {
                elem[eventName] = null;
            }
            elem.detachEvent(eventName, handler);
        },

    _getOrSetEventData = function(elem) {
        var eventData = _data.get(elem, _EVENT_KEY);
        if (!eventData) {
            eventData = {};
            _data.set(elem, _EVENT_KEY, eventData);
        }

        return eventData;
    };

var _subscribe = function(eventData, eventStr, selector) {
    var tmp = _regex.typeNamespace(eventStr) || [],
        type = tmp[1],
        origType = type,
        namepace = tmp[2] || '';

    // There *must* be a type, no attaching namespace-only handlers
    if (!type) { return; }

    // handleObj is passed to all event handlers
    var handleObj = {
        type     : type,
        origType : origType,
        selector : selector,
        namespace: namespace
    };

    // Init the event handler queue if we're the first
    var handlers;
    if (!(handlers = eventData[type])) {
        handlers = eventData[type] = [];
        handlers.delegateCount = 0;

        handleObj.fn = function(e) {
            _dispatch(e, elem, arguments);
        };

        _addEventListener(elem, type, handleObj.fn);
    }

    // Add to the element's handler list, delegates in front
    if (selector) {
        handlers.splice(handlers.delegateCount++, 0, handleObj);
    } else {
        handlers.push(handleObj);
    }
};

var _dispatch = function(e, elem, args) {
    // TODO: This reference shouldn't work with noConflict, but is present in jQuery
    if (typeof D === 'undefined') { return; }

    var event = Event.create(e);

    args = _array.slice(args);

    var eventData = _getOrSetEventData(elem),
        handlers = eventData[event.type] || [];

    // replace the event in the arguments
    // with our Event object
    args[0] = event;

    event.delegateTarget = this;

        // get the queue
    var handlerQueue = _getHandlerQueue(elem, event, handlers),
        idx = 0,
        matched;

    while ((matched = handlerQueue[idx++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;

        var i = 0,
            handleObj;
        while ((handleObj = matched.handlers[i++]) && !event.isImmediatePropagationStopped()) {

            // TODO: Allow namespaces to be in any order
            if (event.namespace === handleObj.namespace) {

                var ret = handleObj.handler.apply(matched.elem, args);
                if (ret !== undefined) {
                    if ((event.result = ret) === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }

            }
        }
    }

    return event.result;
};

var _getHandlerQueue = function(elem, event, handlers) {
    var handlerQueue = [],
        delegateCount = handlers.delegateCount,
        cur = event.target;

    // Find delegate handlers
    // Black-hole SVG <use> instance trees (#13180)
    // Avoid non-left-click bubbling in Firefox (#3861)
    if (delegateCount && cur.nodeType && (!event.button || event.type !== 'click')) {

        for (; cur !== elem; cur = (cur.parentNode || elem)) {

            // Don't check non-elements (#13208)
            // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
            if (cur.nodeType === _nodeType.ELEMENT && (cur.disabled !== true || event.type !== 'click')) {

                var matches = [],
                    idx = 0;
                for (; idx < delegateCount; idx++) {
                    var handleObj = handlers[idx],
                        // Don't conflict with Object.prototype properties (#13203)
                        sel = handleObj.selector + ' ';

                    // avoiding object creation by
                    // attaching the results of the selector
                    // directly to the array
                    if (matches[sel] === undefined) {
                        var is = Fizzle.is(sel);
                        matches[sel] = is.match(elem);
                    }

                    if (matches[sel]) {
                        matches.push(handleObj);
                    }
                }

                if (matches.length) {
                    handlerQueue.push({
                        elem: cur,
                        handlers: matches
                    });
                }
            }
        }
    }

    // Add the remaining (directly-bound) handlers
    if (delegateCount < handlers.length) {
        handlerQueue.push({
            elem: elem,
            handlers: handlers.slice(delegateCount)
        });
    }

    return handlerQueue;
};

var _remove = function(elem, eventName, selector, mappedTypes) {
    // Get the elemData but only if it's been set.
    // No need to go further if it hasn't
    var elemData = _data.has(elem) && _data.get(elem),
        events;
    if (!elemData || !(events = elemData[_EVENT_KEY])) { return; }

    // Once for each type.namespace in eventName; type may be omitted
    var eventStrInstances = _regex.matchNotWhite(eventName) || [''],
        idx = eventStrInstances.length;
    while (idx--) {
        var eventNameSplit = _regex.typeNamespace(eventStrInstances[idx]) || [],
            type           = eventNameSplit[1],
            origType       = type,
            namespaces     = eventNameSplit[2];

        // Unbind all events (on this namespace, if provided) for the element
        if (!type) {
            for (type in events) {
                _remove(elem, type + eventStrInstances[idx], selector, true);
            }
            continue;
        }

        var handlers = events[type] || [],
            namespaceRegex = namespaces && new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)'),
            origCount, i, handleObj;

        origCount = i = handlers.length;

        // Remove matching events
        while (i--) {
            handleObj = handlers[i];

            if (
                (mappedTypes     || origType === handleObj.origType) &&
                (!namespaceRegex || namespaceRegex.test(handleObj.namespace))
            ) {
                handlers.splice(i, 1);

                if (handleObj.selector) {
                    handlers.delegateCount--;
                }
            }

            if (origCount && !handlers.length) {
                _removeEventListener(elem, type, elemData.fn);
            }
        }

        if (origCount && !handlers.length) {
            delete events[type];
        }
    }

    // Remove the events if it's no longer used
    if (!_.hasSize(events)) {
        // removeData also checks for emptiness and clears the events if empty
        // so use it instead of delete
        _data.remove(elem, _EVENT_KEY);
    }
};

module.exports = {
    add: function(elem, eventStr, selector, fn) {
        // Don't attach events to text/comment nodes
        var nodeType = elem.nodeType;
        if (nodeType === _nodeType.TEXT || nodeType === _nodeType.COMMENT) { return; }

        var eventData = _getOrSetEventData(elem);

        // Handle multiple eventStr separated by a space
        var eventStrInstances = _regex.matchNotWhite(eventStr),
            idx = eventStrInstances.length;
        while (idx--) {
            _subscribe(eventData, eventStrInstances[idx], selector);
        }

        elem = null;
    },

    remove: _remove
};