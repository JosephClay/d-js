var del = require('del');

module.exports = function(folders) {
    folders = Array.isArray(folders) ? folders : [folders];
    return function(callback) {
        return del(folders, callback);
    };
};