module.exports = function(grunt) {

    /*
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-rename');

    var srcFiles = [
        'build/intro.js',

        'src/div.js',
        'src/nodeType.js',

        'src/utils.js',
        'src/cache.js',
        'src/supports.js',

        'src/D.js',

        'build/outro.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                stripBanners: true,
                separator: '\n\n//----\n\n',
            },
            dist: {
                files: {
                    'D.js': srcFiles
                },
                nonull: true
            }
        },
        rename: {
            basic: {
                files: [
                    {
                        src: 'D.js',
                        dest: 'out/D.js'
                    }
                ]
            }
        }
    });

    grunt.registerTask('default', [
        'concat',
        'rename:basic'
    ]);
    */

    grunt.loadNpmTasks('grunt-browserify');

    grunt.initConfig({
        browserify: {
            build: {
                src: ['src/D.js'],
                dest: 'out/D.js',
                // options: {
                //     alias: [
                //         'src/libs/Overload.js:overload',
                //         'src/libs/Signal.js:signal',
                //         'src/libs/underscore.js:underscore'
                //     ]
                // }
            }
        }
    });

    grunt.registerTask('default', ['browserify']);
};
