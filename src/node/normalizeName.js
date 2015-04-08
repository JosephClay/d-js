// cache is just not worth it here
// http://jsperf.com/simple-cache-for-string-manip
module.exports = (elem) => elem.nodeName.toLowerCase();
