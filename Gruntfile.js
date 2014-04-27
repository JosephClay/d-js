module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-requirejs');

	var _REGEX = {
		require: /^require\(\[[^\]]*\], function\([^\)]*\)/,
		define: /^define\((|'|\[)[^\]]*(|'|\])({|,[^f]*function\([^\)]*\))/,
		endingFunc: /\}\)\;$/,
		pathToName: /^.+\//
	};

	var _convert = function(name, path, contents) {
		if (name === 'D') {
			return contents.replace(_REGEX.require, 'function()')
							.replace(_REGEX.endingFunc, '};');
		}

		if (name.indexOf('globals/') > -1) {
			return '';
		}
		
		grunt.log.writeln(name);

		// libs
		if (name === 'underscore' || name === 'overload' || name === 'signal') {
			return '';
		}

		return contents.replace(_REGEX.define, 'var '+ name.replace(_REGEX.pathToName, '') +' = function()')
						.replace(_REGEX.endingFunc, '};');
	};

	grunt.initConfig({
		requirejs: {
			compile: {
				options: {
					// almond: true,
					// wrap: true,
					// modules: [{name: 'D'}],
					include: 'D',
					// name: '../build/almond',
					mainConfigFile: 'build/config.js',
					baseUrl: 'src/',
					// dir: 'out/',
					out: 'out/D-build.js',
					inlineText: true,
					preserveLicenseComments: true,
					onBuildWrite: _convert
				}
			}
		}
	});

	grunt.registerTask('default', 'requirejs');
};
