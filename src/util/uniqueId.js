var id = 0;
var uniqueId = module.exports = () => id++;
uniqueId.seed = function(seeded, pre) {
    var prefix = pre || '',
        seed = seeded || 0;
    return () => prefix + seed++;
};