var handlers = {};

var register = function(name, type, filter) {
    handlers[name] = {
        event: type,
        filter: filter,
        wrap: function(fn) {
            return wrapper(name, fn);
        }
    };
};

var wrapper = function(name, fn) {
    if (!fn) { return fn; }

    var key = '__dce_' + name;
    if (fn[key]) { return fn[key]; }

    return fn[key] = function(e) {
        var match = handlers[name].filter(e);
        if (match) {
            return fn.apply(this, arguments); 
        }
    };
};

register('left-click', 'click', (e) => e.which === 1 && !e.metaKey && !e.ctrlKey);
register('middle-click', 'click', (e) => e.which === 2 && !e.metaKey && !e.ctrlKey);
register('right-click', 'click', (e) => e.which === 3 && !e.metaKey && !e.ctrlKey);

module.exports = {
    register: register,
    handlers: handlers
};