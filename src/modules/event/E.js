var _           = require('_'),

    _utils      = require('../../utils'),
    _eventUtils = require('./eventUtils');

var Event = module.exports = function(src, props) {
    if (!(this instanceof Event)) { return new Event(src, props); }

    // Event object
    if (src && src.type) {
        this.originalEvent = src;
        this.type = src.type;

        // Events bubbling up the document may have been marked as prevented
        // by a handler lower down the tree; reflect the correct value.
        this.isDefaultPrevented = src.defaultPrevented ||
            // Support: IE < 9
            (src.defaultPrevented === undefined && src.returnValue === false) ?
                _utils.returnTrue :
                    _utils.returnFalse;

    // Event type
    } else {
        this.type = src;
    }

    // Put explicitly provided properties onto the event object
    _.extend(this, props);

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = src && src.timeStamp || _.now();

    // Mark it as fixed
    this[_eventUtils.id] = true;
};

// Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
Event.prototype = {
    isDefaultPrevented:            _utils.returnFalse,
    isPropagationStopped:          _utils.returnFalse,
    isImmediatePropagationStopped: _utils.returnFalse,

    preventDefault: function() {
        var e = this.originalEvent;

        this.isDefaultPrevented = _utils.returnTrue;
        if (!e) { return; }

        // If preventDefault exists, run it on the original event
        if (e.preventDefault) {

            e.preventDefault();

        } else {
            // Support: IE
            // Otherwise set the returnValue property of the original event to false
            e.returnValue = false;
        }
    },
    stopPropagation: function() {
        var e = this.originalEvent;

        this.isPropagationStopped = _utils.returnTrue;
        if (!e) { return; }

        // If stopPropagation exists, run it on the original event
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Support: IE
        // Set the cancelBubble property of the original event to true
        e.cancelBubble = true;
    },
    stopImmediatePropagation: function() {
        this.isImmediatePropagationStopped = _utils.returnTrue;
        this.stopPropagation();
    }
};