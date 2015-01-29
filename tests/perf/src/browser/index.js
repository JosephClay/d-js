// http://stackoverflow.com/questions/11219582/how-to-detect-my-browser-version-and-operating-system-using-javascript
var navigator = window.navigator,

  ua         = navigator.userAgent,
  appVersion = navigator.appVersion;

var os             = require('./os')(appVersion),
    nameAndVersion = require('./name-and-version')(ua),
    name           = nameAndVersion.name,
    version        = nameAndVersion.version;

module.exports = {
    name:          name,
    version:       version,
    ua:            ua,
    os:            os
};