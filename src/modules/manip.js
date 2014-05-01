var _empty = function(elem) {
        var child;
        while ((child = elem.firstChild)) {
            elem.removeChild(child);
        }
    },
    
    _clone = function(elem) {
        return elem.cloneNode(true);
    },
    
    _prepend = function(elem) {
        this.elem.insertBefore(elem, this.parent.firstChild);
        return this;
    },

    _append = function(el) {
        this.elem.appendChild(el);
        return this;
    };

return {
    fn: {
        empty: function() {
            var idx = 0, length = this.length;
            for (; idx < length; idx++) {
                _empty(this[idx]);
            }
            return this;
        },

        // TODO: should this follow jQuery API?
        // http://api.jquery.com/clone/
        // .clone( [withDataAndEvents ] [, deepWithDataAndEvents ] )
        clone: function() {
            return D(
                _.fastmap(this.slice(), function(elem) {
                    _clone(this[idx]);
                })
            );
        },

        // TODO: Append/Prepend

        append: function() {

        },
        appendTo: function() {

        },

        prepend: function() {

        },
        prependTo: function() {

        }
    }
};
