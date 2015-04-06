var id = 0;
var uniqueId = module.exports = function() {
    return id++;
};
uniqueId.seed = function(seeded, pre) {
    var prefix = pre || '',
        seed = seeded || 0;
    return function() {
        return prefix + seed++;
    };
};