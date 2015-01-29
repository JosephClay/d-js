var _         = require('underscore'),
    $         = require('jquery'),
    backbone  = require('backbone'),
    Benchmark = require('benchmark'),
    url       = require('../url'),
    View      = require('./view'),
    Tests     = require('../test/tests'),

    list      = $('#test-sets');


module.exports = backbone.Model.extend({
    initialize: function() {
        var self = this;
        var suite = this.suite = new Benchmark.Suite({
            'setup': this.get('setup') || _.noop,
            'teardown': this.get('teardown') || _.noop
        });
        var view = this.view = new View({ model: this, suite: suite });

        suite.on('complete', function() {
                console.log('complete');

                var fastestName = this.filter('fastest').pluck('name')[0];
                self.tests.each(function(test) {
                    var name = test.get('name');
                    test.set('fastest', name === fastestName ? true : false);
                });

                var totalHz =  self.tests.reduce(function(total, test) {
                    return total + test.get('hz');
                }, 0);
                self.tests.each(function(test) {
                    var perc = test.get('hz') / totalHz;
                    test.set('perc', perc);
                });

                self._complete();
            })
            .on('start', function() {
                console.log('start');
            })
            .on('error', function(e) {
                console.error('error', e);
                self._complete();
            })
            .on('abort', function(e) {
                console.error('abort', e);
                self._complete();
            })
            .on('reset', function(e) {
                console.error('reset', e);
                self._complete();
            });

        this.view.render();
        list.append(view.$el);

        var tests = this.tests = new Tests(
            _.map(this.get('tests'), function(test) {
                test.suite = suite;
                return test;
            })
        );

        tests.container(view.$el).appendTests();
    },

    title: function() {
        return this._title || (this._title = url.safe(this.get('title')));
    },

    run: function(callback) {
        this._callback = callback;
        this.suite.run({ 'async': true });
    },

    _complete: function() {
        if (this._callback) { this._callback(); }
        this._callback = null;
    },
    
    link: function() {
        return url.hash({
            title: this.title(),
        });
    }
});