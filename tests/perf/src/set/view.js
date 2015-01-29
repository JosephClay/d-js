var _          = require('underscore'),
    handlebars = require('handlebars'),
    $          = require('jquery'),
    backbone   = require('backbone');

module.exports = backbone.View.extend({

    template: handlebars.compile($('#test-set').html()),

    events: {},

    initialize: function() {},

    render: function() {
        var html = this.template(
            _.extend({}, this.model.toJSON(), {
                link: this.model.link()
            })
        );
        
        this.$el = $(html);

        return this;
    }

});
