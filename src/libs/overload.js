var root = window;

// Variablizing the strings for consistency
// and to avoid harmful dot-notation look-ups with
// javascript keywords
var sNull      = 'Null',
	sUndefined = 'Undefined',
	sInfinity  = 'Infinity',
	sDate      = 'Date',
	sNaN       = 'NaN',
	sNumber    = 'Number',
	sString    = 'String',
	sObject    = 'Object',
	sArray     = 'Array',
	sRegExp    = 'RegExp',
	sBoolean   = 'Boolean',
	sFunction  = 'Function',
	sElement   = 'Element';

// Utilizing the non-standard (but available in modern browsers) Global Object names
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name
// Provide a polyfill for items without names
(function() {
	var globalObjects = [
			sDate,
			sNumber,
			sString,
			sObject,
			sArray,
			sRegExp,
			sBoolean,
			sFunction,
			sElement
		],
		idx = globalObjects.length,
		globalObject;
	while (idx--) {
		globalObject = globalObjects[idx];
		if (!root[globalObject].name) {
			root[globalObject].name = globalObject;
		}
	}
}());

/**
 * Possible values
 * @type {Object}
 */
var _types = {};
_types[sNull]      = 0;
_types[sUndefined] = 1;
_types[sInfinity]  = 2;
_types[sDate]      = 3;
_types[sNaN]       = 4;
_types[sNumber]    = 5;
_types[sString]    = 6;
_types[sObject]    = 7;
_types[sArray]     = 8;
_types[sRegExp]    = 9;
_types[sBoolean]   = 10;
_types[sFunction]  = 11;
_types[sElement]   = 12;

/**
 * Cached reference to Object.prototype.toString
 * for type checking
 * @type {Function}
 */
var _toString = (function(toString) {
		return function(obj) {
			return toString.call(obj);
		};
	}(({}).toString)),

	/**
	 * Type checks
	 */
	_checkMap = (function(map) {

		var types = [
				// Only mapping items that need to be mapped.
				// Items not in this list are doing faster
				// (non-string) checks
				//
				// k = key, v = value
				{ k: sDate,     v: _types[sDate]     },
				{ k: sNumber,   v: _types[sNumber]   },
				{ k: sString,   v: _types[sString]   },
				{ k: sObject,   v: _types[sObject]   },
				{ k: sArray,    v: _types[sArray]    },
				{ k: sRegExp,   v: _types[sRegExp]   },
				{ k: sFunction, v: _types[sFunction] }
			],
			idx = types.length;
		while (idx--) {
			map['[object ' + types[idx].k + ']'] = types[idx].v;
		}

		return map;

	}({})),

	/**
	 * Changes arguments to an array
	 * @param  {Arguments} arraylike
	 * @return {Array}
	 */
	_slice = (function(slice) {
		return function(arraylike) {
			return slice.call(arraylike);
		};
	}([].slice));

// Reference: https://gist.github.com/dhm116/1790197
if (!('bind' in Function.prototype)) {
	Function.prototype.bind = function(owner) {
		var self = this;

		if (arguments.length <= 1) {
			return function() {
				return self.apply(owner, arguments);
			};
		}

		var args = _slice(arguments);
		return function() {
			return self.apply(owner, arguments.length === 0 ? args : args.concat(_slice(arguments)));
		};
	};
}

var _getConfigurationType = function(val) {
	if (val === null) { return _types[sNull]; }
	if (val === undefined) { return _types[sUndefined]; }

	// we have something, but don't know what
	if (val.name === undefined) {
		if (val !== +val) { return _types[sNaN]; } // NaN check
		return _types[sInfinity]; // Infinity check
	}

	return _types[val.name];
};

var _getParameterType = function(val) {
	if (val === null) { return _types[sNull]; }
	if (val === undefined) { return _types[sUndefined]; }
	if (val === true || val === false) { return _types[sBoolean]; }
	if (val && val.nodeType === 1) { return _types[sElement]; } // Element check from Underscore

	var typeString = _toString(val);
	if (_checkMap[typeString] === _types[sNumber]) {
		if (val !== +val) { return _types[sNaN]; } // NaN check
		if (!isFinite(val)) { return _types[sInfinity]; } // Finite check
		return _types[sNumber]; // definitely a number
	}

	return _checkMap[typeString];
};

var _convertConfigurationTypes = function(args) {
	var parameters = [],
		idx = 0, length = args.length,
		configItem;
	for (; idx < length; idx++) {
		configItem = args[idx];
		parameters.push(
			(configItem instanceof Custom) ? configItem : _getConfigurationType(configItem)
		);
	}
	return parameters;
};

var _convertParametersTypes = function(args) {
	var parameters = [],
		idx = 0, length = args.length;
	for (; idx < length; idx++) {
		parameters.push(_getParameterType(args[idx]));
	}
	return parameters;
};

var _doesMapMatchArgsTypes = function(map, argTypes, args) {
	var mapLength = map.length,
		argLength = argTypes.length;

	if (mapLength === 0 && argLength === 0) { return true; }
	if (mapLength !== argLength) { return false; }

	var idx = 0,
		mapItem;
	for (; idx < argLength; idx++) {
		mapItem = map[idx];

		if (mapItem instanceof Custom) {
			if (mapItem.check(args[idx])) {
				continue;
			} else {
				return false;
			}
		}

		if (argTypes[idx] !== mapItem) {
			return false;
		}
	}

	return true;
};

var _getArgumentMatch = function(mappings, args) {
	mappings = mappings || [];

	var argTypes = _convertParametersTypes(args),
		idx = 0, length = mappings.length;
	for (; idx < length; idx++) {
		if (_doesMapMatchArgsTypes(mappings[idx].params, argTypes, args)) {
			return mappings[idx];
		}
	}

	return null;
};

var _getLengthMatch = function(mappings, args) {
	mappings = mappings || [];

	var argLength = args.length,
		idx = 0, length = mappings.length;
	for (; idx < length; idx++) {
		if (mappings[idx].length === argLength) {
			return mappings[idx];
		}
	}

	return null;
};

var _matchAny = function(args, val) {
	var type = _getParameterType(val),
		idx = args.length,
		mapItem;

	while (idx--) {
		mapItem = args[idx];

		if (mapItem instanceof Custom) {
			if (mapItem.check(val)) {
				return true;
			} else {
				continue;
			}
		}

		if (args[idx] === type) {
			return true;
		}
	}

	return false;
};

/**
 * Custom type that validates a value
 * @constructor
 * @param {Function} check
 */
var Custom = function(check) {
	this.check = check;
};

var O = {
	wild: new Custom(function() {
		return true;
	}),
	truthy: new Custom(function(val) {
		return (!!val) === true;
	}),
	falsy: new Custom(function(val) {
		return (!!val) === false;
	}),
	any: function() {
		var args = _convertConfigurationTypes(arguments);
		return new Custom(function(val) {
			return _matchAny(args, val);
		});
	},
	except: function() {
		var args = _convertConfigurationTypes(arguments);
		return new Custom(function(val) {
			return !_matchAny(args, val);
		});
	}
};

/**
 * @constructor
 */
var Overload = function() {
	if (!(this instanceof Overload)) { return new Overload(); }

	/**
	 * Methods mapped to argument types
	 * Lazily instanciated
	 * @type {Array}
	 */
	// this._argMaps;

	/**
	 * Methods mapped to argument lengths
	 * Lazily instanciated
	 * @type {Array}
	 */
	// this._lenMaps;

	/**
	 * A fallback function if none
	 * of the criteria match on a call
	 * @type {Function}
	 */
	// this._f;
};

Overload.defineType = function(name, check) {
	var custom = new Custom(check);
	return (O[name] = custom);
};
Overload.defineTypes = function(obj) {
	var key;
	for (key in obj) {
		O[key] = new Custom(obj[key]);
	}
	return Overload;
};

Overload.prototype = {

	/** @constructor */
	constructor: Overload,

	args: function() {
		var self = this,
			args = arguments;

		return {
			use: function(method) {
				var argMappings = self._argMaps || (self._argMaps = []);
				argMappings.push({
					params: _convertConfigurationTypes(args),
					method: method
				});
				return self;
			}
		};
	},

	length: function(num) {
		var self = this;
		return {
			use: function(method) {
				var lengthMappings = self._lenMaps || (self._lenMaps = []);
				lengthMappings.push({
					length: (num === undefined) ? method.length : num,
					method: method
				});
				return self;
			}
		};
	},

	err: function() {
		throw 'Overload - exception: No methods matched';
	},

	fallback: function(method) {
		this._f = method;
		return this;
	},

	call: function() {
		var args = _slice(arguments);
		return this._call(args.shift(), args);
	},

	apply: function(context, args) {
		args = (args && args.callee) ? _slice(args) : args;
		return this._call(context, args);
	},

	bind: function(context) {
		var self = this;
		return function() {
			return self._call(context, arguments);
		}.bind(context);
	},

	expose: function() {
		var self = this;
		return function() {
			return self._call(this, arguments);
		};
	},

	_call: function(context, args) {
		args = args || [];

		// Any argument match, of course, already matches
		// the length match, so this should be done first
		var argMatch = _getArgumentMatch(this._argMaps, args);
		if (argMatch) {
			return argMatch.method.apply(context, args);
		}

		// Check for a length match
		var lengthMatch = _getLengthMatch(this._lenMaps, args);
		if (lengthMatch) {
			return lengthMatch.method.apply(context, args);
		}

		// Check for a fallback
		if (this._f) {
			return this._f.apply(context, args);
		}

		// Error
		return this.err(args);
	}
};

Overload.O = O;
module.exports = Overload;