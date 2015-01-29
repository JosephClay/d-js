var backbone = require('backbone');

module.exports = backbone.Collection.extend({
    model: require('./test'),
    
    initialize: function() {
        var title = this.title;
        this.each(function(model) {
            model.title(title);
        });
    },
    
    container: function($el) {
        this.$container = $el;
        return this;
    },

    appendTests: function() {
        var container = this.$container;
        this.each(function(model) {
            model.view.$el.appendTo(container);
        });
        return this;
    }
});