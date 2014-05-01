module.exports = {
    get: function( elem, computed, extra ) {
        if ( computed ) {
            // certain elements can have dimension info if we invisibly show them
            // however, it must have a current display style that would benefit from this
            return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
                jQuery.swap( elem, cssShow, function() {
                    return getWidthOrHeight( elem, name, extra );
                }) :
                getWidthOrHeight( elem, name, extra );
        }
    },

    set: function( elem, value, extra ) {
        var styles = extra && getStyles( elem );
        return setPositiveNumber( elem, value, extra ?
            augmentWidthOrHeight(
                elem,
                name,
                extra,
                support.boxSizing() && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
                styles
            ) : 0
        );
    }
};