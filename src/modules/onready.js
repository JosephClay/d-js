var _isReady = false,
    _registration = [];

var _bind = function(fn) {
    if (document.readyState === 'complete') {
        return fn();
    }

    if (document.addEventListener) {
        return document.addEventListener('DOMContentLoaded', fn);
    }

    document.attachEvent('onreadystatechange', function() {
        if (document.readyState === 'interactive') { fn(); }
    });
    window.attachEvent('onload', fn);
};

var _makeCalls = function() {
    var idx = 0,
        length = _registration.length;
    for (; idx < length; idx++) {
        _registration[idx]();
    }
    _registration.length = 0;
};

_bind(function() {
    if (_isReady) { return; }

    _isReady = true;
    _makeCalls();
});

module.exports = function(callback) {
    if (_isReady) {
        callback();
        return this;
    }

    _registration.push(callback);
    return this;
};
