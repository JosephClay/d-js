var _        = require('underscore'),
    backbone = require('backbone');

module.exports = backbone.Collection.extend({
    model: require('./set'),

    initialize: function() {},

    _findSetByTitle: function(title) {
        return this.find(function(model) {
            return model.title() === title;
        });
    },
    runAll: function() {
        var sets = this.models,
            idx = 0;

        var run = function() {
            if (!sets[idx]) { return; }

            sets[idx].run(function() {
                idx++;
                run();
            });
        };

        run();
    },
    runSet: function(title) {
        var set = this._findSetByTitle(title);
        if (!set) { return; }
        set.run();
    }
});