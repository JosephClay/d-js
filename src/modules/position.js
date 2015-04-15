var _          = require('_'),
    D          = require('D'),
    exists     = require('is/exists'),
    isAttached = require('is/attached'),
    isFunction = require('is/function'),
    isObject   = require('is/object'),
    isNodeName = require('is/nodeName'),
    DOC_ELEM   = document.documentElement;

var getPosition = function(elem) {
    return {
        top: elem.offsetTop || 0,
        left: elem.offsetLeft || 0
    };
};

var getOffset = function(elem) {
    var rect = isAttached(elem) ? elem.getBoundingClientRect() : {},
        body = document.body;

    return {
        top:  (rect.top  + body.scrollTop)  || 0,
        left: (rect.left + body.scrollLeft) || 0
    };
};

var setOffset = function(elem, idx, pos) {
    var style    = elem.style,
        position = style.position || 'static',
        props    = {};

    // set position first, in-case top/left are set even on static elem
    if (position === 'static') { style.position = 'relative'; }

    var curOffset         = getOffset(elem),
        curCSSTop         = style.top,
        curCSSLeft        = style.left,
        calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop === 'auto' || curCSSLeft === 'auto');

    if (isFunction(pos)) {
        pos = pos.call(elem, idx, curOffset);
    }

    var curTop, curLeft;
    // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
    if (calculatePosition) {
        var curPosition = getPosition(elem);
        curTop  = curPosition.top;
        curLeft = curPosition.left;
    } else {
        curTop  = parseFloat(curCSSTop)  || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
    }

    if (exists(pos.top))  { props.top  = (pos.top  - curOffset.top)  + curTop;  }
    if (exists(pos.left)) { props.left = (pos.left - curOffset.left) + curLeft; }

    style.top  = _.toPx(props.top);
    style.left = _.toPx(props.left);
};

exports.fn = {
    position: function() {
        var first = this[0];
        if (!first) { return; }

        return getPosition(first);
    },

    offset: function(posOrIterator) {
        if (!arguments.length) {
            var first = this[0];
            if (!first) { return; }
            return getOffset(first);
        }

        if (isFunction(posOrIterator) || isObject(posOrIterator)) {
            return _.each(this, (elem, idx) => setOffset(elem, idx, posOrIterator));
        }

        // fallback
        return this;
    },

    offsetParent: function() {
        return D(
            _.map(this, function(elem) {
                var offsetParent = elem.offsetParent || DOC_ELEM;

                while (offsetParent && 
                    (!isNodeName(offsetParent, 'html') && (offsetParent.style.position || 'static') === 'static')) {
                    offsetParent = offsetParent.offsetParent;
                }

                return offsetParent || DOC_ELEM;
            })
        );
    }
};
