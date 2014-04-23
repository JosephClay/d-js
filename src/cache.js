define(function(argument) {

    var _cache = {};

    var getterSetter = function(key) {

        var ref = (_cache[key] = {});

        return {
            get: function(key) {
                return ref[key];
            },
            set: function(key, value) {
                ref[key] = value;
            }
        };
    };

    return {
        classArray: getterSetter('CLASS_ARRAY'),
        classMap: getterSetter('CLASS_MAP')
    };
});