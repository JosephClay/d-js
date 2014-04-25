module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-requirejs');

	grunt.initConfig({
		requirejs: {
			options: {
				almond: true,
				// wrap: true,
				modules: [{name: 'D'}],
				mainConfigFile: 'build/config.js',
				baseUrl: 'src/',
				dir: 'build/',
				inlineText: true,
				preserveLicenseComments: true
			}
		}
	});

	grunt.registerTask('default', 'requirejs');
};
