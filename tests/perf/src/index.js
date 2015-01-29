var _        = require('underscore'),
	backbone = require('backbone');
require('./mixins');
backbone.$ = require('jquery');

var profile  = require('./profile'),
	app      = require('./app'),
	profiles = [];

var api = module.exports = _.extend(function(name) {

	var p = profile(name);
	profiles.push(p);
	return p;

}, {
	start: function() {
		app(
			_.map(profiles, function(profile) {
				return profile.spec();
			})
		);
		return api;
	}
});