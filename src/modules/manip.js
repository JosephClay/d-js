var _prepend = function(elem) {
        this.elem.insertBefore(elem, this.parent.firstChild);
        return this;
    },

    _append = function(el) {
        this.elem.appendChild(el);
        return this;
    };

return {
    fn: {
        empty: function() {},
        clone: function() {},
        append: function() {

        },
        prepend: function() {

        }
    }
};
