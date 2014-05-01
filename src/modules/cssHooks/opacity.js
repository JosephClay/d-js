var _supports = require('../../supports');

if (_supports.opacity) { return; }

module.exports = {
    get: function( elem, computed ) {
        // IE uses filters for opacity
        return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
            ( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
            computed ? "1" : "";
    },

    set: function( elem, value ) {
        var style = elem.style,
            currentStyle = elem.currentStyle,
            opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
            filter = currentStyle && currentStyle.filter || style.filter || "";

        // IE has trouble with opacity if it does not have layout
        // Force it by setting the zoom level
        style.zoom = 1;

        // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
        // if value === "", then remove inline opacity #12685
        if ( ( value >= 1 || value === "" ) &&
                jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
                style.removeAttribute ) {

            // Setting style.filter to null, "" & " " still leave "filter:" in the cssText
            // if "filter:" is present at all, clearType is disabled, we want to avoid this
            // style.removeAttribute is IE Only, but so apparently is this code path...
            style.removeAttribute( "filter" );

            // if there is no filter style applied in a css rule or unset inline opacity, we are done
            if ( value === "" || currentStyle && !currentStyle.filter ) {
                return;
            }
        }

        // otherwise, set new filter values
        style.filter = ralpha.test( filter ) ?
            filter.replace( ralpha, opacity ) :
            filter + " " + opacity;
    }
};
