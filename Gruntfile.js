module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-rquirejs');

    grunt.initConfig({
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
                    globals: {},
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
        }
    });

    grunt.registerTask('build', ['rquire']);
    grunt.registerTask('default', ['build', 'watch']);
};
