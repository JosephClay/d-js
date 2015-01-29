module.exports = function(str) {
	if (str[0] === '#') {
		return document.getElementById(str.substr(1, str.length));
	}

	return document.getElementsByTagName(str);
};