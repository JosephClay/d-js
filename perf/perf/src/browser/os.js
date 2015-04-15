var _ = require('underscore');

module.exports = function(appVersion) {
    return _.contains(appVersion, 'Win')   ? 'Windows' :
           _.contains(appVersion, 'Mac')   ? 'MacOS'   :
           _.contains(appVersion, 'X11')   ? 'UNIX'    :
           _.contains(appVersion, 'Linux') ? 'Linux'   : 'Unknown OS';
};
