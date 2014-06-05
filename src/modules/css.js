var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _utils = require('../utils'),
    _cache = require('../cache'),
    _regex = require('../regex'),
    _nodeType = require('../nodeType'),
    _supports = require('../supports'),

    _cssKeyCache = _cache();

var _swapSettings = {
    measureDisplay: {
        display: 'block',
        position: 'absolute',
        visibility: 'hidden'
    }
};

var _getDocumentDimension = function(elem, name) {
    // Either scroll[Width/Height] or offset[Width/Height] or
    // client[Width/Height], whichever is greatest
    var doc = elem.documentElement;
    return Math.max(
        elem.body['scroll' + name],
        elem.body['offset' + name],

        doc['scroll' + name],
        doc['offset' + name],

        doc['client' + name]
    );
};

var _hide = function(elem) {
        elem.style.display = 'none';
    },
    _show = function(elem) {
        elem.style.display = '';
    },

    _cssSwap = function(elem, options, callback) {
        var old = {};

        // Remember the old values, and insert the new ones
        var name;
        for (name in options) {
            old[name] = elem.style[name];
            elem.style[name] = options[name];
        }

        var ret = callback(elem);

        // Revert the old values
        for (name in options) {
            elem.style[name] = old[name];
        }

        return ret;
    },

    _getComputedStyle = (function() {
        return _supports.currentStyle ?
            function(elem) { return elem.currentStyle; } :
                // Avoids an 'Illegal Invocation' error
                function(elem) { return window.getComputedStyle(elem); };
    }()),

    _width = {
         get: function(elem) {
            if (_.isWindow(elem)) {
                return elem.document.documentElement.clientWidth;
            }

            if (elem.nodeType === _nodeType.DOCUMENT) {
                return _getDocumentDimension(elem, 'Width');
            }

            var width = elem.offsetWidth;
            return (width === 0 &&
                    _regex.display.isNoneOrTable(_getComputedStyle(elem).display)) ?
                        _cssSwap(elem, _swapSettings.measureDisplay, function() { return _getWidthOrHeight(elem, 'width'); }) :
                            _getWidthOrHeight(elem, 'width'); // TODO: Eeewwww
        },
        set: function(elem, val) {
            elem.style.width = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
        }
    },

    _height = {
        get: function(elem) {
            if (_.isWindow(elem)) {
                return elem.document.documentElement.clientHeight;
            }

            if (elem.nodeType === _nodeType.DOCUMENT) {
                return _getDocumentDimension(elem, 'Height');
            }

            var height = elem.offsetHeight;
            return (height === 0 &&
                    _regex.display.isNoneOrTable(_getComputedStyle(elem).display)) ?
                        _cssSwap(elem, _swapSettings.measureDisplay, function() { return _getWidthOrHeight(elem, 'height'); }) :
                            _getWidthOrHeight(elem, 'height');
        },

        set: function(elem, val) {
            elem.style.height = _.isNumber(val) ? _.toPx(val < 0 ? 0 : val) : val;
        }
    };

var _getWidthOrHeight = function(elem, name) {

    // Start with offset property, which is equivalent to the border-box value
    var valueIsBorderBox = true,
        val = (name === 'width') ? elem.offsetWidth : elem.offsetHeight,
        styles = _getComputedStyle(elem),
        isBorderBox = styles.boxSizing === 'border-box';

    // some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if (val <= 0 || !_.exists(val)) {
        // Fall back to computed then uncomputed css if necessary
        val = _curCss(elem, name, styles);
        if (val < 0 || !val) { val = elem.style[name]; }

        // Computed unit is not pixels. Stop here and return.
        if (_regex.numNotPx(val)) { return val; }

        // we need the check for style in case a browser which returns unreliable values
        // for getComputedStyle silently falls back to the reliable elem.style
        valueIsBorderBox = isBorderBox && val === styles[name];

        // Normalize '', auto, and prepare for extra
        val = parseFloat(val) || 0;
    }

    // use the active box-sizing model to add/subtract irrelevant styles
    return _.toPx(
        val + _augmentBorderBoxWidthOrHeight(
            elem,
            name,
            isBorderBox ? 'border' : 'content',
            valueIsBorderBox,
            styles
        )
    );
};

var _CSS_EXPAND = [
    'Top',
    'Right',
    'Bottom',
    'Left'
];
var _augmentBorderBoxWidthOrHeight = function(elem, name, extra, isBorderBox, styles) {
    var val = 0,
        // If we already have the right measurement, avoid augmentation
        idx = (extra === (isBorderBox ? 'border' : 'content')) ?
            4 :
            // Otherwise initialize for horizontal or vertical properties
            (name === 'width') ?
            1 :
            0,
        type,
        // Pulled out of the loop to reduce string comparisons
        extraIsMargin  = (extra === 'margin'),
        extraIsContent = (!extraIsMargin && extra === 'content'),
        extraIsPadding = (!extraIsMargin && !extraIsContent && extra === 'padding');

    for (; idx < 4; idx += 2) {
        type = _CSS_EXPAND[idx];

        // both box models exclude margin, so add it if we want it
        if (extraIsMargin) {
            val += _.parseInt(styles[extra + type]) || 0;
        }

        if (isBorderBox) {

            // border-box includes padding, so remove it if we want content
            if (extraIsContent) {
                val -= _.parseInt(styles['padding' + type]) || 0;
            }

            // at this point, extra isn't border nor margin, so remove border
            if (!extraIsMargin) {
                val -= _.parseInt(styles['border' + type + 'Width']) || 0;
            }

        } else {

            // at this point, extra isn't content, so add padding
            val += _.parseInt(styles['padding' + type]) || 0;

            // at this point, extra isn't content nor padding, so add border
            if (extraIsPadding) {
                val += _.parseInt(styles['border' + type]) || 0;
            }
        }
    }

    return val;
};

var _getPropertyValue = (function() {
    return _supports.getPropertyValue ? function(styles, name) { return styles.getPropertyValue(name); } :
           _supports.getAttribute     ? function(styles, name) { return styles.getAttribute(name); } :
                                        function(styles, name) { return styles[name]; };
}());

var _curCss = function(elem, name, computed) {
    var style = elem.style,
        styles = computed || _getComputedStyle(elem),
        ret = styles ? _getPropertyValue(styles, name) || styles[name] : undefined;

    // Avoid setting ret to empty string here
    // so we don't default to auto
    if (!_.exists(ret) && style && style[name]) { ret = style[name]; }

    // From the hack by Dean Edwards
    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    if (styles) {
        if (ret === '' && !_utils.isAttached(elem)) {
            ret = elem.style[name];
        }

        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        // but not position css attributes, as those are proportional to the parent element instead
        // and we can't measure the parent instead because it might trigger a 'stacking dolls' problem
        if (_regex.numNotPx(ret) && !_regex.position(name)) {

            // Remember the original values
            var left = style.left,
                rs = elem.runtimeStyle,
                rsLeft = rs && rs.left;

            // Put in the new values to get a computed value out
            if (rsLeft) { rs.left = elem.currentStyle.left; }

            style.left = (name === 'fontSize') ? '1em' : ret;
            ret = _.toPx(style.pixelLeft);

            // Revert the changed values
            style.left = left;
            if (rsLeft) { rs.left = rsLeft; }
        }
    }

    return ret === undefined ? ret : ret + '' || 'auto';
};

var _hooks = {
    opacity: _supports.opacity ? {} : {
        get: function(elem) {
            // IE uses filters for opacity
            var style = _supports.currentStyle ? elem.currentStyle.filter : elem.style.filter;
            return _regex.opacity.test(style || '') ?
                        (0.01 * parseFloat(RegExp.$1)) + '' :
                            '1';
        },

        set: function(elem, value) {
            var style = elem.style,
                currentStyle = elem.currentStyle,
                filter = currentStyle && currentStyle.filter || style.filter || '';

            // if setting opacity to 1, and no other filters exist - remove the filter attribute
            if (value >= 1 || value === '' && _.string.trim(filter.replace(_regex.alpha, '')) === '') {

                // Setting style.filter to null, '' & ' ' still leave 'filter:' in the cssText
                // if 'filter:' is present at all, clearType is disabled, we want to avoid this
                // style.removeAttribute is IE Only, but so apparently is this code path...
                style.removeAttribute('filter');

                // if there is no filter style applied in a css rule or unset inline opacity, we are done
                if (value === '' || _supports.currentStyle && !currentStyle.filter) { return; }
            }

            // IE has trouble with opacity if it does not have layout
            // Force it by setting the zoom level.. but only if we're
            // applying a value (below)
            style.zoom = 1;

            // Only calculate the opacity if we're setting a value (below)
            var opacity = (_.isNumber(value) ? 'alpha(opacity=' + (value * 100) + ')' : '');

            style.filter = _regex.alpha.test(filter) ?
                // replace 'alpha(opacity)' in the filter definition
                filter.replace(_regex.alpha, opacity) :
                // append 'alpha(opacity)' to the current filter definition
                filter + ' ' + opacity;
        }
    }
};

var _normalizeCssKey = function(name) {
    return _cssKeyCache.get(name) || _cssKeyCache.set(name, _regex.camelCase(name));
};

var _setStyle = function(elem, name, value) {
    name = _normalizeCssKey(name);

    if (_hooks[name] && _hooks[name].set) {
        return _hooks[name].set(elem, value);
    }

    elem.style[name] = (value === +value) ? _.toPx(value) : value;
};

var _getStyle = function(elem, name) {
    name = _normalizeCssKey(name);

    if (_hooks[name] && _hooks[name].get) {
        return _hooks[name].get(elem);
    }

    return _getComputedStyle(elem)[name];
};

var _isHidden = function(elem) {
            // Standard:
            // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.offsetParent
    return elem.offsetParent === null ||
            // Support: Opera <= 12.12
            // Opera reports offsetWidths and offsetHeights less than zero on some elements
            elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
            // Fallback
            ((elem.style && elem.style.display) ? elem.style.display === 'none' : false);
};

module.exports = {
    swap: _cssSwap,
    swapSetting: _swapSettings,
    getComputedStyle: _getComputedStyle,
    curCss: _curCss,

    width: _width,
    height: _height,

    fn: {
        css: overload()
            .args(String, O.any(String, Number))
            .use(function(name, value) {
                var idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    _setStyle(this[idx], name, value);
                }
                return this;
            })

            .args(Object)
            .use(function(obj) {
                var idx = 0, length = this.length,
                    key;
                for (; idx < length; idx++) {
                    for (key in obj) {
                        _setStyle(this[idx], key, obj[key]);
                    }
                }
                return this;
            })

            .args(Array)
            .use(function(arr) {
                var first = this[0];
                if (!first) { return; }

                var ret = {},
                    idx = arr.length,
                    value;
                if (!idx) { return ret; } // return early

                while (idx--) {
                    value = arr[idx];
                    if (!_.isString(value)) { return; }
                    ret[value] = _getStyle(first);
                }

                return ret;
            })
            .expose(),

        hide: function() {
            _.each(this, function(elem) {
                _hide(elem);
            });
            return this;
        },
        show: function() {
            _.each(this, function(elem) {
                _show(elem);
            });
            return this;
        },

        toggle: function(state) {
            if (_.isBoolean(state)) {
                return state ? this.show() : this.hide();
            }

            // TODO: Make internal _.each return the array passed
            _.each(this, function(elem) {
                if (_isHidden(this)) {
                    return _show(this);
                }

                _hide(this);
            });

            return this;
        }
    }
};
