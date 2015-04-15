var _        = require('underscore'),
    backbone = require('backbone'),
    url      = require('../url'),
    View     = require('./view');

module.exports = backbone.Model.extend({
    initialize: function() {
        var self = this;

        this.get('suite').add(this.get('name'), {
            fn: this.get('test'),
            onStart: function() {
                self.trigger('start');
            },
            onComplete: function(e) {
                self.trigger('complete');
                self.set('hz', e.target.hz);
            }
        });

        this.view = new View({ model: this });
        this.view.render();
    }
});