var _          = require('_'),
    toPx       = require('util/toPx'),
    split      = require('util/split'),
    exists     = require('is/exists'),
    isAttached = require('is/attached'),
    isElement  = require('is/element'),
    isDocument = require('is/document'),
    isWindow   = require('is/window'),
    isString   = require('is/string'),
    isNumber   = require('is/number'),
    isBoolean  = require('is/boolean'),
    isObject   = require('is/object'),
    isArray    = require('is/array'),
    parseNum   = require('util/parseInt'),
    DOCUMENT   = require('NODE_TYPE/DOCUMENT'),
    REGEX      = require('REGEX');

var swapMeasureDisplaySettings = {
    display:    'block',
    position:   'absolute',
    visibility: 'hidden'
};

var getDocumentDimension = function(elem, name) {
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

var hide = function(elem) {
        elem.style.display = 'none';
    },
    show = function(elem) {
        elem.style.display = '';
    },

    cssSwap = function(elem, options, callback) {
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

    // Avoids an 'Illegal Invocation' error (Chrome)
    // Avoids a 'TypeError: Argument 1 of Window.getComputedStyle does not implement interface Element' error (Firefox)
    getComputedStyle = (elem) =>
        isElement(elem) && !isWindow(elem) && !isDocument(elem) ? window.getComputedStyle(elem) : null,

    _width = {
         get: function(elem) {
            if (isWindow(elem)) {
                return elem.document.documentElement.clientWidth;
            }

            if (elem.nodeType === DOCUMENT) {
                return getDocumentDimension(elem, 'Width');
            }

            var width = elem.offsetWidth;
            if (width === 0) {
                var computedStyle = getComputedStyle(elem);
                if (!computedStyle) {
                    return 0;
                }
                if (REGEX.isNoneOrTable(computedStyle.display)) {
                    return cssSwap(elem, swapMeasureDisplaySettings, function() { return getWidthOrHeight(elem, 'width'); });
                }
            }

            return getWidthOrHeight(elem, 'width');
        },
        set: function(elem, val) {
            elem.style.width = isNumber(val) ? toPx(val < 0 ? 0 : val) : val;
        }
    },

    _height = {
        get: function(elem) {
            if (isWindow(elem)) {
                return elem.document.documentElement.clientHeight;
            }

            if (elem.nodeType === DOCUMENT) {
                return getDocumentDimension(elem, 'Height');
            }

            var height = elem.offsetHeight;
            if (height === 0) {
                var computedStyle = getComputedStyle(elem);
                if (!computedStyle) {
                    return 0;
                }
                if (REGEX.isNoneOrTable(computedStyle.display)) {
                    return cssSwap(elem, swapMeasureDisplaySettings, function() { return getWidthOrHeight(elem, 'height'); });
                }
            }

            return getWidthOrHeight(elem, 'height');
        },

        set: function(elem, val) {
            elem.style.height = isNumber(val) ? toPx(val < 0 ? 0 : val) : val;
        }
    };

var getWidthOrHeight = function(elem, name) {

    // Start with offset property, which is equivalent to the border-box value
    var valueIsBorderBox = true,
        val = (name === 'width') ? elem.offsetWidth : elem.offsetHeight,
        styles = getComputedStyle(elem),
        isBorderBox = styles.boxSizing === 'border-box';

    // some non-html elements return undefined for offsetWidth, so check for null/undefined
    // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
    // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
    if (val <= 0 || !exists(val)) {
        // Fall back to computed then uncomputed css if necessary
        val = curCss(elem, name, styles);
        if (val < 0 || !val) { val = elem.style[name]; }

        // Computed unit is not pixels. Stop here and return.
        if (REGEX.numNotPx(val)) { return val; }

        // we need the check for style in case a browser which returns unreliable values
        // for getComputedStyle silently falls back to the reliable elem.style
        valueIsBorderBox = isBorderBox && val === styles[name];

        // Normalize '', auto, and prepare for extra
        val = parseFloat(val) || 0;
    }

    // use the active box-sizing model to add/subtract irrelevant styles
    return toPx(
        val + augmentBorderBoxWidthOrHeight(
            elem,
            name,
            isBorderBox ? 'border' : 'content',
            valueIsBorderBox,
            styles
        )
    );
};

var CSS_EXPAND = split('Top|Right|Bottom|Left');
var augmentBorderBoxWidthOrHeight = function(elem, name, extra, isBorderBox, styles) {
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
        type = CSS_EXPAND[idx];

        // both box models exclude margin, so add it if we want it
        if (extraIsMargin) {
            val += parseNum(styles[extra + type]) || 0;
        }

        if (isBorderBox) {

            // border-box includes padding, so remove it if we want content
            if (extraIsContent) {
                val -= parseNum(styles['padding' + type]) || 0;
            }

            // at this point, extra isn't border nor margin, so remove border
            if (!extraIsMargin) {
                val -= parseNum(styles['border' + type + 'Width']) || 0;
            }

        } else {

            // at this point, extra isn't content, so add padding
            val += parseNum(styles['padding' + type]) || 0;

            // at this point, extra isn't content nor padding, so add border
            if (extraIsPadding) {
                val += parseNum(styles['border' + type]) || 0;
            }
        }
    }

    return val;
};

var curCss = function(elem, name, computed) {
    var style = elem.style,
        styles = computed || getComputedStyle(elem),
        ret = styles ? styles.getPropertyValue(name) || styles[name] : undefined;

    // Avoid setting ret to empty string here
    // so we don't default to auto
    if (!exists(ret) && style && style[name]) { ret = style[name]; }

    // From the hack by Dean Edwards
    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    if (styles) {
        if (ret === '' && !isAttached(elem)) {
            ret = elem.style[name];
        }

        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        // but not position css attributes, as those are proportional to the parent element instead
        // and we can't measure the parent instead because it might trigger a 'stacking dolls' problem
        if (REGEX.numNotPx(ret) && !REGEX.position(name)) {

            // Remember the original values
            var left = style.left,
                rs = elem.runtimeStyle,
                rsLeft = rs && rs.left;

            // Put in the new values to get a computed value out
            if (rsLeft) { rs.left = elem.currentStyle.left; }

            style.left = (name === 'fontSize') ? '1em' : ret;
            ret = toPx(style.pixelLeft);

            // Revert the changed values
            style.left = left;
            if (rsLeft) { rs.left = rsLeft; }
        }
    }

    return ret === undefined ? ret : ret + '' || 'auto';
};

var normalizeCssKey = function(name) {
    return REGEX.camelCase(name);
};

var setStyle = function(elem, name, value) {
    name = normalizeCssKey(name);
    elem.style[name] = (value === +value) ? toPx(value) : value;
};

var getStyle = function(elem, name) {
    name = normalizeCssKey(name);
    return getComputedStyle(elem)[name];
};

var isHidden = function(elem) {
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
    curCss: curCss,
    width:  _width,
    height: _height,

    fn: {
        css: function(name, value) {
            if (arguments.length === 2) {
                var idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    setStyle(this[idx], name, value);
                }
                return this;
            }
        
            if (isObject(name)) {
                var obj = name;
                var idx = 0, length = this.length,
                    key;
                for (; idx < length; idx++) {
                    for (key in obj) {
                        setStyle(this[idx], key, obj[key]);
                    }
                }
                return this;
            }

            if (isArray(name)) {
                var arr = name;
                var first = this[0];
                if (!first) { return; }

                var ret = {},
                    idx = arr.length,
                    value;
                if (!idx) { return ret; } // return early

                while (idx--) {
                    value = arr[idx];
                    if (!isString(value)) { return; }
                    ret[value] = getStyle(first);
                }

                return ret;
            }

            // fallback
            return this;
        },

        hide: function() {
            return _.each(this, hide);
        },
        show: function() {
            return _.each(this, show);
        },

        toggle: function(state) {
            if (isBoolean(state)) {
                return state ? this.show() : this.hide();
            }

            return _.each(this, (elem) => isHidden(elem) ? show(elem) : hide(elem));
        }
    }
};
