var _           = require('_'),

    Event       = require('./EventConstructor'),
    _nodeType   = require('../../nodeType'),
    _regex      = require('../../regex'),
    _data       = require('../data'),
    _eventUtils = require('./eventUtils'),
    _global     = {};

var _add = function(elem, types, handler, data, selector) {
    var elemData = _data.get(elem);
    // Don't attach events to noData or text/comment nodes
    if (!elemData) { return; }

    // Caller can pass in an object of custom data in lieu of the handler
    var handleObjIn;
    if (handler.handler) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
    }

    // Make sure that the handler has a unique ID, used to find/remove it later
    if (!handler.guid) {
        handler.guid = _.uniqueId();
    }

    var events;
    // Init the element's event structure and main handler, if this is the first
    if (!(events = elemData.events)) {
        events = elemData.events = {};
    }

    var eventHandle;
    if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function(e) {
            // Discard the second event of a D.event.trigger() and
            // when an event is called after a page has unloaded
            return typeof D !== 'undefined' && (!e || D.event.triggered !== e.type) ?
                _dispatch.apply(eventHandle.elem, arguments) :
                undefined;
        };
        // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
        eventHandle.elem = elem;
    }

    // Handle multiple events separated by a space
    types = (types || '').match(rnotwhite) || [''];
    var idx = types.length,
        tmp, type, origType, namespaces, special, handleObj, handlers;
    while (idx--) {

        tmp = rtypenamespace.exec(types[idx]) || [];
        type = origType = tmp[1];
        // There *must* be a type, no attaching namespace-only handlers
        if (!type) { continue; }

        namespaces = (tmp[2] || '').split('.').sort();

        // If event changes its type, use the special event handlers for the changed type
        special = _special[type] || {}; // TODO: Noop object

        // If selector defined, determine special event api type, otherwise given type
        type = (selector ? special.delegateType : special.bindType) || type;

        // Update special based on newly reset type
        special = _special[type] || {}; // TODO: Noop object

        // handleObj is passed to all event handlers
        handleObj = _.extend({
            type        : type,
            origType    : origType,
            data        : data,
            handler     : handler,
            guid        : handler.guid,
            selector    : selector,
            // TODO: If the event system changes to not needing this, remember to remove it here and in _regex
            needsContext: selector && _regex.needsContext(selector),
            namespace   : namespaces.join('.')
        }, handleObjIn);

        // Init the event handler queue if we're the first
        if (!(handlers = events[type])) {
            handlers = events[type] = [];
            handlers.delegateCount = 0;

            // Only use addEventListener/attachEvent if the special events handler returns false
            if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
                // Bind the global event handler to the element
                if (elem.addEventListener) {

                    elem.addEventListener(type, eventHandle, false);

                } else if (elem.attachEvent) {

                    elem.attachEvent('on' + type, eventHandle);

                }
            }
        }

        if (special.add) {
            special.add.call(elem, handleObj);

            if (!handleObj.handler.guid) {
                handleObj.handler.guid = handler.guid;
            }
        }

        // Add to the element's handler list, delegates in front
        if (selector) {
            handlers.splice(handlers.delegateCount++, 0, handleObj);
        } else {
            handlers.push(handleObj);
        }

        // Keep track of which events have ever been used, for event optimization
        _global[type] = true;
    }

    // Nullify elem to prevent memory leaks in IE
    elem = null;
};

// Detach an event or set of events from an element
var _remove = function(elem, types, handler, selector, mappedTypes) {
    var elemData = _data.has(elem) && _data.get(elem),
        events;
    if (!elemData || !(events = elemData.events)) { return; }

    // Once for each type.namespace in types; type may be omitted
    types = (types || '').match(rnotwhite) || [''];
    var idx = types.length,
        tmp, type, origType, namespaces, special, handlers;
    while (idx--) {
        tmp = rtypenamespace.exec(types[idx]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || '').split('.').sort();

        // Unbind all events (on this namespace, if provided) for the element
        if (!type) {
            for (type in events) {
                _remove(elem, type + types[idx], handler, selector, true);
            }
            continue;
        }

        special = _special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        handlers = events[type] || [];
        tmp = tmp[2] && new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)');

        // Remove matching events
        var origCount, i, handleObj;
        origCount = i = handlers.length;
        while (i--) {
            handleObj = handlers[i];

            if (
                (mappedTypes || origType === handleObj.origType) &&
                (!handler    || handler.guid === handleObj.guid) &&
                (!tmp        || tmp.test( handleObj.namespace))  &&
                (!selector   || selector === handleObj.selector  || selector === '**' && handleObj.selector)
            ) {
                handlers.splice(i, 1);

                if (handleObj.selector) {
                    handlers.delegateCount--;
                }
                if (special.remove) {
                    special.remove.call(elem, handleObj);
                }
            }
        }

        // Remove generic event handler if we removed something and no more handlers exist
        // (avoids potential for endless recursion during removal of special event handlers)
        if (origCount && !handlers.length) {
            if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
                jQuery.removeEvent(elem, type, elemData.handle);
            }

            delete events[type];
        }
    }

    // Remove the events if it's no longer used
    if (!_.hasSize(events)) {
        delete elemData.handle;

        // removeData also checks for emptiness and clears the events if empty
        // so use it instead of delete
        _data.remove(elem, 'events');
    }
};

var _trigger = function(event, data, elem, onlyHandlers) {
    var handle, ontype, cur,
        bubbleType, special, tmp, i,
        eventPath = [elem || document],
        type = event.type || event,
        namespaces = event.namespace ? event.namespace.split('.') : [];

    cur = tmp = elem = elem || document;

    // Don't do events on text and comment nodes
    if (elem.nodeType === _nodeType.TEXT || elem.nodeType === _nodeType.COMMENT) {
        return;
    }

    // focus/blur morphs to focusin/out; ensure we're not firing them right now
    if (rfocusMorph.test(type + D.event.triggered)) {
        return;
    }

    if (type.indexOf('.') >= 0) {
        // Namespaced trigger; create a regexp to match event type in handle()
        namespaces = type.split('.');
        type = namespaces.shift();
        namespaces.sort();
    }
    ontype = type.indexOf(':') < 0 && 'on' + type;

    // Caller can pass in a Event object, Object, or just an event type string
    event = event[_eventUtils.id] ?
        event :
        new Event(type, event && _.isObject(event));

    // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
    event.isTrigger = onlyHandlers ? 2 : 3;
    event.namespace = namespaces.join('.');
    event.namespace_re = event.namespace ?
        new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)') :
        null;

    // Clean up the event in case it is being reused
    event.result = undefined;
    event.target = event.target || elem;

    // Clone any incoming data and prepend the event, creating the handler arg list
    data = !_.exists(data) ?
        [event] :
        // NOTE: use to be jQuery.makeArray - _.flatten should be equivalent
        _.flatten(data, [event]);

    // Allow special events to draw outside the lines
    special = _special[type] || {};
    if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
        return;
    }

    // Determine event propagation path in advance, per W3C events spec (#9951)
    // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
    if (!onlyHandlers && !special.noBubble && !_.isWindow(elem)) {

        bubbleType = special.delegateType || type;
        if (!rfocusMorph.test(bubbleType + type)) {
            cur = cur.parentNode;
        }
        for (; cur; cur = cur.parentNode) {
            eventPath.push(cur);
            tmp = cur;
        }

        // Only add window if we got to document (e.g., not plain obj or detached DOM)
        if (tmp === (elem.ownerDocument || document)) {
            eventPath.push(tmp.defaultView || tmp.parentWindow || window);
        }
    }

    // Fire handlers on the event path
    i = 0;
    while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {

        event.type = i > 1 ?
            bubbleType :
            special.bindType || type;

        // jQuery handler
        handle = (_data.get(cur, 'events') || {})[event.type] && _data.get(cur, 'handle');
        if (handle) {
            handle.apply( cur, data );
        }

        // Native handler
        handle = ontype && cur[ ontype ];
        // NOTE: Pulled out jQuery.acceptData(cur) as we don't allow non-element types
        if (handle && handle.apply) {
            event.result = handle.apply(cur, data);
            if (event.result === false) {
                event.preventDefault();
            }
        }
    }
    event.type = type;

    // If nobody prevented the default action, do it now
    if (!onlyHandlers && !event.isDefaultPrevented()) {

        // NOTE: Pulled out jQuery.acceptData(elem) as we don't allow non-element types
        if (!special._default || special._default.apply(eventPath.pop(), data) === false) {

            // Call a native DOM method on the target with the same name name as the event.
            // Can't use an .isFunction() check here because IE6/7 fails that test.
            // Don't do default actions on window, that's where global variables be (#6170)
            if (ontype && elem[type] && !_.isWindow(elem)) {

                // Don't re-trigger an onFOO event when we call its FOO() method
                tmp = elem[ontype];

                if (tmp) {
                    elem[ontype] = null;
                }

                // Prevent re-triggering of the same event, since we already bubbled it above
                D.event.triggered = type;

                try {
                    elem[type]();
                } catch (e) {
                    // IE < 9 dies on focus/blur to hidden element (#1486, #12518)
                    // only reproducible on winXP IE8 native, not IE9 in IE8 mode
                }

                D.event.triggered = undefined;

                if (tmp) {
                    elem[ontype] = tmp;
                }
            }
        }
    }

    return event.result;
};

var _dispatch = function(event) {

    // Make a writable Event from the native event object
    event = _fix(event);

    var i, ret, handleObj, matched, j,
        handlerQueue = [],
        args = _.slice(arguments),
        handlers = (_data.get(this, 'events') || {})[event.type] || [],
        special = _special[event.type] || {};

    // Use the fix-ed Event rather than the (read-only) native event
    args[0] = event;
    event.delegateTarget = this;

    // Call the preDispatch hook for the mapped type, and let it bail if desired
    if (special.preDispatch && special.preDispatch.call(this, event) === false) {
        return;
    }

    // Determine handlers
    handlerQueue = _handlers.call(this, event, handlers);

    // Run delegates first; they may want to stop propagation beneath us
    i = 0;
    while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;

        j = 0;
        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {

            // Triggered event must either 1) have no namespace, or
            // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
            if (!event.namespace_re || event.namespace_re.test(handleObj.namespace)) {

                event.handleObj = handleObj;
                event.data = handleObj.data;

                ret = ((_special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);

                if (ret !== undefined) {
                    if ((event.result = ret) === false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            }
        }
    }

    // Call the postDispatch hook for the mapped type
    if (special.postDispatch) {
        special.postDispatch.call(this, event);
    }

    return event.result;
};

var _handlers = function(event, handlers) {
    var sel, handleObj, matches,
        handlerQueue = [],
        delegateCount = handlers.delegateCount,
        cur = event.target;

    // Find delegate handlers
    // Black-hole SVG <use> instance trees (#13180)
    // Avoid non-left-click bubbling in Firefox (#3861)
    if (delegateCount && cur.nodeType && (!event.button || event.type !== 'click')) {

        // TODO: Better as a while loop?
        for (; cur != this; cur = cur.parentNode || this) {

            // Don't check non-elements (#13208)
            // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
            if (cur.nodeType === _nodeType.ELEMENT && (cur.disabled !== true || event.type !== 'click') ) {
                matches = [];

                var idx = 0;
                for (; idx < delegateCount; idx++) {
                    handleObj = handlers[idx];

                    // Don't conflict with Object.prototype properties (#13203)
                    sel = handleObj.selector + ' ';

                    if (matches[sel] === undefined) {
                        matches[sel] = handleObj.needsContext ?
                            this.find(sel).index(cur) >= 0 :
                            // TODO: What is happening here?
                            jQuery.find(sel, this, null, [cur]).length;
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
            elem: this,
            handlers: handlers.slice(delegateCount)
        });
    }

    return handlerQueue;
};

// TODO: Does this need to be public?
var _fix = function(event) {
    if (event[_eventUtils.id]) {
        return event;
    }

    // Create a writable copy of the event object and normalize some properties
    var type = event.type,
        originalEvent = event,
        fixHook = _fixHooks[type];

    if (!fixHook) {
        _fixHooks[type] = fixHook =
            rmouseEvent.test(type) ? _mouseHooks :
            rkeyEvent.test(type) ? _keyHooks :
            {};
    }

    var copy = fixHook.props ? _props.concat(fixHook.props) : _props;

    event = new Event(originalEvent);

    var idx = copy.length,
        prop;
    while (idx--) {
        prop = copy[idx];
        event[prop] = originalEvent[prop];
    }

    // Support: IE < 9
    // Fix target property (#1925)
    if (!event.target) {
        event.target = originalEvent.srcElement || document;
    }

    // Support: Chrome 23+, Safari?
    // Target should not be a text node (#504, #13143)
    if (event.target.nodeType === _nodeType.TEXT) {
        event.target = event.target.parentNode;
    }

    // Support: IE < 9
    // For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
    event.metaKey = !!event.metaKey;

    return fixHook.filter ? fixHook.filter(event, originalEvent) : event;
};

// Includes some event props shared by KeyEvent and MouseEvent
// TODO: Does this need to be public?
var _props = ['altKey', 'bubbles', 'cancelable', 'ctrlKey', 'currentTarget', 'eventPhase', 'metaKey', 'relatedTarget', 'shiftKey', 'target', 'timeStamp', 'view', 'which'];

// TODO: Does this need to be public?
var _fixHooks = {};

// TODO: Does this need to be public?
var _keyHooks = {
    props: ['char', 'charCode', 'key', 'keyCode'],
    filter: function(event, original) {

        // Add which for key events
        if (!_.exists(event.which)) {
            event.which = _.exists(original.charCode) ? original.charCode : original.keyCode;
        }

        return event;
    }
};

// TODO: Does this need to be public?
var _mouseHooks = {
    props: ['button', 'buttons', 'clientX', 'clientY', 'fromElement', 'offsetX', 'offsetY', 'pageX', 'pageY', 'screenX', 'screenY', 'toElement'],
    filter: function(event, original) {
        var body, eventDoc, doc,
            button = original.button,
            fromElement = original.fromElement;

        // Calculate pageX/Y if missing and clientX/Y available
        if (!_.exists(event.pageX) && !_.exists(original.clientX)) {
            eventDoc = event.target.ownerDocument || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = original.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - (doc && doc.clientTop  || body && body.clientTop  || 0);
        }

        // Add relatedTarget, if necessary
        if (!event.relatedTarget && fromElement) {
            event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
        }

        // TODO: Pull this into a constant
        // Add which for click: 1 === left; 2 === middle; 3 === right
        // Note: button is not normalized, so don't use it
        if (!event.which && button !== undefined) {
            event.which = (button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ));
        }

        return event;
    }
};

var _special = {
    load: {
        // Prevent triggered image.load events from bubbling to window.load
        noBubble: true
    },
    focus: {
        // Fire native event if possible so blur/focus sequence is correct
        trigger: function() {
            if (this !== _eventUtils.activeElement() && this.focus) {
                try {
                    this.focus();
                    return false;
                } catch (e) {
                    // Support: IE < 9
                    // If we error on focus to hidden element (#1486, #12518),
                    // let .trigger() run the handlers
                }
            }
        },
        delegateType: 'focusin'
    },
    blur: {
        trigger: function() {
            if (this === _eventUtils.activeElement() && this.blur) {
                this.blur();
                return false;
            }
        },
        delegateType: 'focusout'
    },
    click: {
        // For checkbox, fire native event so checked state will be right
        trigger: function() {
            if (_utils.isNodeName(this, 'input') && this.type === 'checkbox' && this.click) {
                this.click();
                return false;
            }
        },

        // For cross-browser consistency, don't fire native .click() on links
        _default: function(event) {
            return _utils.isNodeName(event.target, 'a');
        }
    },

    beforeunload: {
        postDispatch: function(event) {

            // Even when returnValue equals to undefined Firefox will still show alert
            if (event.result !== undefined) {
                event.originalEvent.returnValue = event.result;
            }
        }
    }
};

var _simulate = function(type, elem, event, bubble) {
    // Piggyback on a donor event to simulate a different one.
    // Fake originalEvent to avoid donor's stopPropagation, but if the
    // simulated event prevents default then we do the same on the donor.
    var e = _.extend(
        new Event(),
        event,
        {
            type: type,
            isSimulated: true,
            originalEvent: {}
        }
    );

    if (bubble) {
        _trigger(e, null, elem);
    } else {
        _dispatch.call(elem, e);
    }

    if (e.isDefaultPrevented()) {
        event.preventDefault();
    }
};


module.exports = {
    add       : _add,
    remove    : _remove,
    trigger   : _trigger,

    fn: {
        // triggered, a state holder for events
        global    : _global,
        add       : _add,
        remove    : _remove,
        trigger   : _trigger,
        dispatch  : _dispatch,
        handlers  : _handlers,
        fix       : _fix,
        props     : _props,
        fixHooks  : _fixHooks,
        keyHooks  : _keyHooks,
        mouseHooks: _mouseHooks,
        special   : _special,
        simulate  : _simulate
    }
};