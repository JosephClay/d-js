var _              = require('_'),
    _supports      = require('../../supports'),
    _data          = require('../data'),
    _event         = require('./event');

// TODO: Remove.  This is needed to prevent IE8 from failing catastrophically.
return;

if (!_supports.submitBubbles) {
    // IE change delegation and checkbox/radio fix
    _event.special.change = {

        setup: function() {

            if (rformElems.test(this.nodeName)) {
                // IE doesn't fire change on a check/radio until blur; trigger it on click
                // after a propertychange. Eat the blur-change in special.change.handle.
                // This still fires onchange a second time for check/radio after blur.
                if (this.type === 'checkbox' || this.type === 'radio') {

                    _event.add(this, 'propertychange._change', function(event) {
                        if (event.originalEvent.propertyName === 'checked') {
                            this._just_changed = true;
                        }
                    });

                    _event.add(this, 'click._change', function(event) {
                        if (this._just_changed && !event.isTrigger) {
                            this._just_changed = false;
                        }

                        // Allow triggered, simulated change events (#11500)
                        _event.simulate('change', this, event, true);
                    });
                }

                return false;
            }

            // Delegated event; lazy-add a change handler on descendant inputs
            _event.add(this, 'beforeactivate._change', function(e) {
                var elem = e.target;

                if (rformElems.test(elem.nodeName) && !_data.get(elem, 'changeBubbles')) {
                    _event.add(elem, 'change._change', function(event) {
                        if (this.parentNode && !event.isSimulated && !event.isTrigger) {
                            _event.simulate('change', this.parentNode, event, true);
                        }
                    });
                    _data.set(elem, 'changeBubbles', true);
                }
            });
        },

        handle: function(event) {
            var elem = event.target;

            // Swallow native change events from checkbox/radio, we already triggered them above
            if (this !== elem || event.isSimulated || event.isTrigger || (elem.type !== 'radio' && elem.type !== 'checkbox')) {
                return event.handleObj.handler.apply( this, arguments );
            }
        },

        teardown: function() {
            _event.remove(this, '._change');

            return !rformElems.test(this.nodeName);
        }
    };
}

if (!_supports.changeBubbles) {
    // Create 'bubbling' focus and blur events
    _.each({
        focus: 'focusin',
        blur: 'focusout'
    }, function(fix, orig) {

        // Attach a single capturing handler on the document while someone wants focusin/focusout
        var handler = function(event) {
            _event.simulate(fix, event.target, _event.fix(event), true);
        };

        _event.special[fix] = {
            setup: function() {
                var doc = this.ownerDocument || this,
                    attaches = _data.get(doc, fix);

                if (!attaches) {
                    doc.addEventListener(orig, handler, true);
                }
                _data.set(doc, fix, (attaches || 0) + 1);
            },

            teardown: function() {
                var doc = this.ownerDocument || this,
                    attaches = _data.get(doc, fix) - 1;

                if (!attaches) {
                    doc.removeEventListener(orig, handler, true);
                    _data.remove(doc, fix);
                } else {
                    _data.set(doc, fix, attaches);
                }
            }
        };
    });
}

/*
    special: {
        load: {
            // Prevent triggered image.load events from bubbling to window.load
            noBubble: true
        },
        focus: {
            // Fire native event if possible so blur/focus sequence is correct
            trigger: function() {
                if ( this !== safeActiveElement() && this.focus ) {
                    this.focus();
                    return false;
                }
            },
            delegateType: "focusin"
        },
        blur: {
            trigger: function() {
                if ( this === safeActiveElement() && this.blur ) {
                    this.blur();
                    return false;
                }
            },
            delegateType: "focusout"
        },
        click: {
            // For checkbox, fire native event so checked state will be right
            trigger: function() {
                if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
                    this.click();
                    return false;
                }
            },

            // For cross-browser consistency, don't fire native .click() on links
            _default: function( event ) {
                return jQuery.nodeName( event.target, "a" );
            }
        },

        beforeunload: {
            postDispatch: function( event ) {

                // Support: Firefox 20+
                // Firefox doesn't alert if the returnValue field is not set.
                if ( event.result !== undefined && event.originalEvent ) {
                    event.originalEvent.returnValue = event.result;
                }
            }
        }
    },
 */
