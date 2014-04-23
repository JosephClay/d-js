defined([ 'overload' ], function(overload) {

    return {
        addClass: function(name) {
            if (this.elem.classList) {
                this.elem.classList.add(name);
                return this;
            }

            this.elem.className += ' ' + name;
            return this;
        },

        removeClass: function(name) {
            if (this.elem.classList) {
                this.elem.classList.remove(name);
                return this;
            }

            this.elem.className = this.elem.className.replace(new RegExp('(^|\\b)' + name.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            return this;
        },

        hasClass: function() {},

        toggleClass: function() {},

        fn: {
            addClass: overload().args(String).use(function(value) {
                        classes.addClass(this._elems, [value]);
                        return this;
                    })
                    .args(Array).use(function(values) {
                        classes.addClass(this._elems, values);
                        return this;
                    })
                    .expose()
        }
    };
});
