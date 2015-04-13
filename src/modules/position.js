var _          = require('_'),
    D          = require('D'),
    exists     = require('is/exists'),
    isAttached = require('is/attached'),
    isFunction = require('is/function'),
    isObject   = require('is/object'),
    isNodeName = require('node/isName'),
    DOC_ELEM   = document.documentElement;

var getPosition = function(elem) {
    return {
        top: elem.offsetTop || 0,
        left: elem.offsetLeft || 0
    };
};

var getOffset = function(elem) {
    var rect = isAttached(elem) ? elem.getBoundingClientRect() : {};

    return {
        top:  (rect.top  + document.body.scrollTop)  || 0,
        left: (rect.left + document.body.scrollLeft) || 0
    };
};

var setOffset = function(elem, idx, pos) {
    var position = elem.style.position || 'static',
        props    = {};

    // set position first, in-case top/left are set even on static elem
    if (position === 'static') { elem.style.position = 'relative'; }

    var curOffset         = getOffset(elem),
        curCSSTop         = elem.style.top,
        curCSSLeft        = elem.style.left,
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

    elem.style.top  = _.toPx(props.top);
    elem.style.left = _.toPx(props.left);
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

                while (offsetParent && (!isNodeName(offsetParent, 'html') && (offsetParent.style.position || 'static') === 'static')) {
                    offsetParent = offsetParent.offsetParent;
                }

                return offsetParent || DOC_ELEM;
            })
        );
    }
};
