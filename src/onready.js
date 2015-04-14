var ready = false,
    registration = [];

var wait = function(fn) {
    // Already loaded
    if (document.readyState === 'complete') {
        return fn();
    }

    // Standards-based browsers support DOMContentLoaded
    if (document.addEventListener) {
        return document.addEventListener('DOMContentLoaded', fn);
    }

    // If IE event model is used

    // Ensure firing before onload, maybe late but safe also for iframes
    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'interactive') { fn(); }
    });

    // A fallback to window.onload, that will always work
    window.attachEvent('onload', fn);
};

wait(function() {
    ready = true;

    // call registered methods    
    while (registration.length) {
        registration.shift()();
    }
});

module.exports = (callback) =>
    ready ? callback() : registration.push(callback);
