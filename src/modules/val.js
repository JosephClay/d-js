var _div = require('../div');

var _text = {
    get: (_div.textContent !== undefined) ?
        function(elem) { return elem.textContent; } :
            function(elem) { return elem.innerText; } ,
    set: (_div.textContent !== undefined) ?
        function(elem, str) { elem.textContent = str; } :
            function(elem, str) { elem.innerText = str; }
};

module.exports = {
    fn: {
        // TODO: OuterHtml getter?
        
        html: Overload()
            .args(String).use(function(html) {
                var idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    this[idx].innerHTML = html;
                }

                return this;
            })
            .args(Function).use(function(iterator) {
                var idx = 0, length = this.length, elem;
                for (; idx < length; idx++) {
                    elem = this[idx];
                    elem.innerHTML = iterator.call(elem, idx, elem.innerHTML);
                }

                return this;
            })
            .fallback(function() {
                var first = this[0];
                if (!first) { return; }
                return first.innerHTML;
            })
            .expose(),

        val: function() {},

        text: Overload()
            .args(String).use(function(str) {
                var idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    _text.set(this[idx], str);
                }

                return this;
            })
            .args(Function).use(function(iterator) {
                var idx = 0, length = this.length, elem;
                for (; idx < length; idx++) {
                    elem = this[idx];
                    _text.set(elem, iterator.call(elem, idx, _text.get(elem)));
                }

                return this;
            })
            .fallback(function() {
                var str = '',
                    idx = 0, length = this.length;
                for (; idx < length; idx++) {
                    str += _text.get(this[idx]);
                }

                return str;
            })
            .expose()
    }
};
