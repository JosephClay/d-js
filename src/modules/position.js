var _ = require('_'),
    overload = require('overload'),
    O = overload.O,

    _utils = require('../utils'),

    _docElem = document.documentElement;

var _getPosition = function(elem) {
    return {
        top: elem.offsetTop || 0,
        left: elem.offsetLeft || 0
    };
};

var _getOffset = function(elem) {
    var rect = _utils.isAttached(elem) ? elem.getBoundingClientRect() : {};

    return {
        top: (rect.top + document.body.scrollTop) || 0,
        left: (rect.left + document.body.scrollLeft) || 0
    };
};

var _setOffset = function(elem, idx, pos) {
    var position = elem.style.position || 'static',
        props = {};

    // set position first, in-case top/left are set even on static elem
    if (position === 'static') { elem.style.position = 'relative'; }

    var curOffset = _getOffset(elem),
        curCSSTop = elem.style.top,
        curCSSLeft = elem.style.left,
        calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop === 'auto' || curCSSLeft === 'auto');

    if (_.isFunction(pos)) {
        pos = pos.call(elem, idx, curOffset);
    }

    var curTop, curLeft;
    // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
    if (calculatePosition) {
        var curPosition = _getPosition(elem);
        curTop = curPosition.top;
        curLeft = curPosition.left;
    } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
    }

    if (_.exists(pos.top)) { props.top = (pos.top - curOffset.top) + curTop; }
    if (_.exists(pos.left)) { props.left = (pos.left - curOffset.left) + curLeft; }

    elem.style.top = _.toPx(props.top);
    elem.style.left = _.toPx(props.left);
};

module.exports = {
    fn: {
        position: function() {
            var first = this[0];
            if (!first) { return; }

            return _getPosition(first);
        },

        offset: overload()
            .args(O.any(Object, Function))
            .use(function(posOrIterator) {
                _.each(this, function(elem, idx) {
                    _setOffset(elem, idx, posOrIterator);
                });
                return this;
            })

            .args(O.any(null, undefined))
            .use(function() {
                return this;
            })

            .args()
            .use(function() {
                var first = this[0];
                if (!first) { return; }
                return _getOffset(first);
            })
            .expose(),

        offsetParent: function() {
            return D(
                _.map(this, function(elem) {
                    var offsetParent = elem.offsetParent || _docElem;

                    while (offsetParent && (!_utils.isNodeName(offsetParent, 'html') && (offsetParent.style.position || 'static') === 'static')) {
                        offsetParent = offsetParent.offsetParent;
                    }

                    return offsetParent || _docElem;
                })
            );
        }
    }
};
