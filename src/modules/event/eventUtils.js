module.exports = {
    activeElement: function() {
        try {
            return document.activeElement;
        } catch (err) {}
    }
};