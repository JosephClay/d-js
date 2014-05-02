var _getText = function(elem) {
    if (!elem) { return ''; }
    return elem.textContent || elem.innerText;
};

module.exports = {
    fn: {
        html: function() {},
        val: function() {},
        text: function() {
            var str = '',
                idx = 0, length = this.length;
            for (; idx < length; idx++) {
                str += _getText(this[idx]);
            }

            return str;
        }
    }
};
