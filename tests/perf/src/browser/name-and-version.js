var parseVersion = function(fullVersion) {
    var idx;
    // trim the fullVersion string at semicolon/space if present
    if ((idx = fullVersion.indexOf(';')) !== -1) {
       return fullVersion.substr(0, idx);
    }
    if ((idx = fullVersion.indexOf(' ')) !== -1) {
       return fullVersion.substr(0, idx);
    }

    return fullVersion;
};

module.exports = function(ua) {
    var versionOffset;

    // In Opera, the true version is after 'Opera' or after 'Version'
    if ((versionOffset = ua.indexOf('Opera')) !== -1) {
        name = 'Opera';
        version = ua.substr(versionOffset + 6);
        if ((versionOffset = ua.indexOf('Version')) !== -1) {
            version = ua.substr(versionOffset + 8);
        }
        return {
            name: 'Opera',
            version: parseVersion(version)
        };
    }

    // In MSIE, the true version is after 'MSIE' in userAgent
    if ((versionOffset = ua.indexOf('MSIE')) !== -1) {
        return {
            name: 'Microsoft Internet Explorer',
            version: parseVersion(ua.substr(versionOffset + 5))
        };
    }

    // In Chrome, the true version is after 'Chrome' 
    if ((versionOffset = ua.indexOf('Chrome')) !== -1) {
        return {
            name: 'Chrome',
            version: parseVersion(ua.substr(versionOffset + 7))
        };
    }

    // In Safari, the true version is after 'Safari' or after 'Version' 
    if ((versionOffset = ua.indexOf('Safari')) !== -1) {
        version = ua.substr(versionOffset + 7);
        if ((versionOffset = ua.indexOf('Version')) !== -1)  {
            version = ua.substr(versionOffset + 8);
        }
        return {
            name: 'Safari',
            version: parseVersion(version)
        };
    }

    // In Firefox, the true version is after 'Firefox' 
    if ((versionOffset=ua.indexOf('Firefox'))!=-1) {
        return {
            name: 'Firefox',
            version: parseVersion(ua.substr(versionOffset + 8))
        };
    }

    var nameOffset;
    // In most other browsers, 'name/version' is at the end of userAgent 
    if ((nameOffset = ua.lastIndexOf(' ') + 1) < (versionOffset = ua.lastIndexOf('/'))) {
        name = ua.substr(nameOffset, versionOffset);
        version = ua.substr(versionOffset+1);
        if (name.toLowerCase() === name.toUpperCase()) {
            name = navigator.appName;
        }
        return {
            name: name,
            version: parseVersion(version)
        };
    }
};