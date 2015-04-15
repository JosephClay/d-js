var _ = require('underscore'),
    defaults = {
        title:      '',
        name:       '',
        tests:      _.noop,
        setup:      _.noop,
        teardown:   _.noop
    };

module.exports = function(title) {
    var config = _.extend({}, defaults, {
            title: title || ''
        }),
        tests = [];

    return {
        setup: function(fn) {
            if (fn === undefined) { return config.setup; }
            config.setup = fn;
            return this;
        },
        teardown: function(fn) {
            if (fn === undefined) { return config.teardown; }
            config.teardown = fn;
            return this;
        },
        test: function(name, fn, opts) {
            opts = opts || {};
            tests.push(
                _.extend({}, config, opts, {
                    name: name,
                    test: fn
                })
            );
            return this;
        },
        spec: function() {
            return {
                title: title,
                tests: _.map(tests, function(test) {
                    test.title = title;
                    return test;
                })
            };
        }
    };
};