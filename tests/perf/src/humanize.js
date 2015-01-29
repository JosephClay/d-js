var abbr = {
    trillion: 'T',
    billion: 'B',
    million: 'M',
    thousand: 'k'
};

var num = {
    trillion: 1000000000000,
    billion:  1000000000,
    million:  1000000,
    thousand: 1000
};

var shorten = function(num) {
    return (num === ~~num) ? num : num.toFixed(2);
};

module.exports = {
    number: function(n) {
        if (n === Infinity) {
            return 'Infinity';
        }

        if (n > num.trillion) {
            return shorten(n / num.trillion) + ' ' + abbr.trillion;
        }
        if (n > num.billion) {
            return shorten(n / num.billion) + ' ' + abbr.billion;
        }
        if (n > num.million) {
            return shorten(n / num.million) + ' ' + abbr.million;
        }
        if (n > num.thousand) {
            return shorten(n / num.thousand) + ' ' + abbr.thousand;
        }

        return shorten(n);
    },

    ms: function(ms) {
        return ms + ' ms';
    }
};