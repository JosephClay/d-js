var _          = require('underscore'),
    $          = require('jquery'),
    handlebars = require('handlebars'),
    backbone   = require('backbone'),
    humanize   = require('../humanize'),

    INFINITY_SYMBOL = '&infin;';

module.exports = backbone.View.extend({
    tagName:  'li',

    template: handlebars.compile($('#test-line').html()),

    initialize: function() {
        var self = this;
        this.model.on('change:hz', function(model, hz) {
                self._opts().text(humanize.number(hz));
            })
            .on('change:fastest', function(model, isFastest) {
                self.$el.removeClass('faster slower').addClass(isFastest ? 'faster' : 'slower');
            })
            .on('change:perc', function(model, perc) {
                self._bar().css({ width: (perc * 100) + '%' });
            })
            .on('start', function(model, rankAsPerc) {
                self.$el.addClass('pending');
            })
            .on('complete', function() {
                self.$el.removeClass('pending');
            });
    },

    _test: function() {
        return this.__test || (this.__test = this.$el.find('.test'));
    },
    _opts: function() {
        return this.__opts || (this.__opts = this.$el.find('.opts'));
    },
    _bar: function() {
        return this.__bar || (this.__bar = this.$el.find('.test-bar'));
    },

    render: function() {
        var html = this.template(this.model.toJSON());

        this.$el = $(html);
        
        return this;
    }
});