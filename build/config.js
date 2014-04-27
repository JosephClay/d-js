var require = {
    paths: {
        'overload': 'libs/Overload',
        'signal': 'libs/Signal',
        'underscore': 'libs/underscore'
    },
    shim: {
        'overload': {
            exports: 'Overload'
        },
        'signal': {
            exports: 'Signal'
        }
    },
    wrap: {
        startFile: 'intro.js',
        endFile: 'outro.js'
    },
    optimize: 'none',
    skipDirOptimize: true
};