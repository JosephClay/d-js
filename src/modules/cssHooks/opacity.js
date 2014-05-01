var _regex = require('../../regex'),
    _supports = require('../../supports');

if (_supports.opacity) { return; }

module.exports = {
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

        // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
        // if value === '', then remove inline opacity #12685
        if (value >= 1 || value === '' && _.trim(filter.replace(_regex.alpha, '')) === '') {

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
            // replace "alpha(opacity)" in the filter definition
            filter.replace(_regex.alpha, opacity) :
            // append "alpha(opacity)" to the current filter definition
            filter + ' ' + opacity;
    }
};
