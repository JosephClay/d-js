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
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-rquirejs');

    grunt.initConfig({
        browserify: {
            build: {
                src: ['src/D.js'],
                dest: 'dist/D.browserify.js'
                // options: {
                //     alias: [
                //         'src/libs/Overload.js:overload',
                //         'src/libs/Signal.js:signal',
                //         'src/libs/underscore.js:underscore'
                //     ]
                // }
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['rquire'],
                options: {
                    spawn: false,
                }
            },
        },
        rquire: {
            build: {
                options: {
                    globals: {},
                    aliases: {
                        '_':        '/_.js',
                        'overload': '/libs/overload.js',
                        'signal':   '/libs/signal.js'
                    },
                    src_root: 'src/',
                    main: 'D.js',
                    dest: 'dist/D.js',
                    safe_undefined: true
                    // micro_paths: true
                }
            },
            buildInternal: {
                options: {
                    globals: {
                        'window': 'window',
                        'document': 'document'
                    },
                    aliases: {
                        '_':        '/_.js',
                        'overload': '/libs/overload.js',
                        'signal':   '/libs/signal.js'
                    },
                    src_root: 'src/',
                    main: 'D.internal.js',
                    dest: 'dist/D.internal.js',
                    safe_undefined: true,
                    micro_paths: false,
                }
            }
        },
        uglify: {
            release: {
                files: {
                    'dist/D.min.js': ['dist/D.js']
                }
            }
        }
    });

    grunt.registerTask('build', ['rquire', 'uglify']);
    grunt.registerTask('default', ['build', 'watch']);
};
