var _    = require('_'),
    _div = require('../../div');

module.exports = {
    id: '__D_event_id__ ' + (new Date().getTime()),

    activeElement: function() {
        try {
            return document.activeElement;
        } catch (err) {}
    }
};