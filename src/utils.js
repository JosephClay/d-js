define(function() {

    return {
        exists: function(val) {
            return (val !== null && val !== undefined);
        },

        merge: function(first, second) {
            var length = +second.length,
                idx = 0,
                i = first.length;

            for (; idx < length; idx++) {
                first[i++] = second[idx];
            }

            first.length = i;

            return first;
        }
    };
});
