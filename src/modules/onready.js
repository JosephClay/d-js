var isReady = false,
    registration = [];

var bind = function(fn) {
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

var makeCalls = function() {
    var idx = 0,
        length = registration.length;
    for (; idx < length; idx++) {
        registration[idx]();
    }
    registration.length = 0;
};

bind(function() {
    isReady = true;
    makeCalls();
});

module.exports = function(callback) {
    if (isReady) {
        callback();
     } else {
        registration.push(callback);
     }
    
    return this;
};
