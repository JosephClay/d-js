// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
module.exports = function(elem) {
    return elem.nodeName.toLowerCase();
};