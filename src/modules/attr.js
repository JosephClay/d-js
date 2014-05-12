var _ = require('_');

var _hooks = {
        tabindex: {
            get: function(elem) {
                var tabindex = elem.getAttribute('tabindex');
                if (!_.exists(tabindex) || tabindex === '') { return; }
                return _.parseInt(tabindex) || 0;
            }
        },
        // Set contenteditable to false on removals(#10429)
        // Setting to empty string throws an error as an invalid value
        contenteditable: {
            set: function(elem, value, name) {
                elem.setAttribute('contenteditable', value === '' ? false : value);
            }
        },
        /* TODO: These hooks
        type: {
            set: function( elem, value ) {
                if ( !support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
                    // Setting the type on a radio button after the value resets the value in IE6-9
                    // Reset value to default in case type is set after value during creation
                    var val = elem.value;
                    elem.setAttribute( "type", value );
                    if ( val ) {
                        elem.value = val;
                    }
                    return value;
                }
            }
        },

            // Fixing value retrieval on a button requires this module
            jQuery.valHooks.button = {
                get: function( elem, name ) {
                    var ret = elem.getAttributeNode( name );
                    if ( ret && ret.specified ) {
                        return ret.value;
                    }
                },
                set: nodeHook.set
            };


            // Set width and height to auto instead of 0 on empty string( Bug #8150 )
            // This is for removals
            jQuery.each([ "width", "height" ], function( i, name ) {
                jQuery.attrHooks[ name ] = {
                    set: function( elem, value ) {
                        if ( value === "" ) {
                            elem.setAttribute( name, "auto" );
                            return value;
                        }
                    }
                };
            });
        }

        if ( !support.style ) {
            jQuery.attrHooks.style = {
                get: function( elem ) {
                    // Return undefined in the case of empty string
                    // Note: IE uppercases css property names, but if we were to .toLowerCase()
                    // .cssText, that would destroy case senstitivity in URL's, like in "background"
                    return elem.style.cssText || undefined;
                },
                set: function( elem, value ) {
                    return ( elem.style.cssText = value + "" );
                }
            };
        }*/
    },

    _getAttribute = function(elem, attr) {
        if (!elem) { return; }

        if (_hooks[attr] && _hooks[attr].get) {
            return _hooks[attr].get(elem);
        }

        return elem.getAttribute(attr);
    },

    _setAttributes = function(arr, attr, value) {
        var isFn = _.isFunction(value),
            idx = 0, length = arr.length,
            elem, val;
        for (; idx < length; idx++) {
            elem = arr[idx];
            val = isFn ? value.call(elem, idx, _getAttribute(elem, attr)) : value;
            _setAttribute(elem, attr, val);
        }
    },
    _setAttribute = function(elem, attr, value) {
        if (!elem) { return; }

        if (_hooks[attr] && _hooks[attr].set) {
            return _hooks[attr].set(elem, value);
        }

        elem.setAttribute(attr, value);
    },

    _removeAttributes = function(arr, attr) {
        var idx = 0, length = arr.length;
        for (; idx < length; idx++) {
            _removeAttribute(arr[idx], attr);
        }
    },
    _removeAttribute = function(elem, attr) {
        if (!elem) { return; }

        if (_hooks[attr] && _hooks[attr].remove) {
            return _hooks[attr].remove(elem);
        }

        elem.removeAttribute(attr);
    };

module.exports = {
    fn: {
        attr: Overload().args(String).use(function(attr) {
                        return _getAttribute(this[0], attr);
                    })

                    .args(String, O.any(String, Number))
                    .use(function(attr, value) {
                        _setAttributes(this, attr, value);
                        return this;
                    })

                    .args(String, null)
                    .use(function(attr) {
                        _removeAttributes(this, attr);
                        return this;
                    })

                    .args(String, Boolean)
                    .use(function(attr, bool) {
                        if (bool) {
                            _setAttributes(this, attr, bool);
                            return this;
                        }

                        _removeAttributes(this, attr);
                        return this;
                    })

                    .args(Object).use(function(attrs) {
                        var attr, value;
                        for (attr in attrs) {
                            _setAttributes(this, attr, attrs[attr]);
                        }

                        return this;
                    })

                    .args(String, Function)
                    .use(function(attr, fn) {
                        var idx = 0, length = this.length;
                        for (; idx < length; idx++) {
                            var elem = this[idx],
                                oldAttr = _getAttribute(this[0], attr),
                                result = fn.call(elem, idx, oldAttr);
                            if (!_.exists(result)) { continue; }
                            _setAttribute(elem, attr, result);
                        }

                        return this;
                    })

                    .expose(),

        removeAttr: Overload().args(String).use(function(attr) {
                        _removeAttributes(this, attr);
                        return this;
                    })

                    .expose()
    }
};