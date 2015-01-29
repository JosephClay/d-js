var _ = require('underscore');

_.mixin({
    noop: function() {},

    contains: function(arr, thing) {
        return arr.indexOf(thing) !== -1;
    },

    attempt: function(fn) {
        try {
            fn();
        } catch(e) {
            return e;
        }

        return true;
    },

    now: window.performance && window.performance.now ?
        function() { return window.performance.now(); } :
        Date.now ?
        function() { return Date.now(); } :
        function() { return +(new Date()); }
});