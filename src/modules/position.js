module.exports = {
    fn: {       
        position: function() {
            var first = this[0];
            
            if (!first) { return; }

            return {
                top: first.offsetTop,
                left: first.offsetLeft
            };
        },
        offset: function() {}
    }
};
