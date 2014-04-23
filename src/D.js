(function(root, _, document, undefined) {

	var DIV = document.createElement('div'),

		_getComputedStyle = root.getComputedStyle,

		_exists = function(val) {
			return (val !== null && val !== undefined);
		},

		_matches = (function(_matcher) {
			if (_matcher) {
				return function(elem, selector) {
					return _matcher.call(elem, selector);
				};
			}

			return function(elem, selector) {
				var nodes = elem.parentNode.querySelectorAll(selector),
					idx = nodes.length;
				while (idx--) {
					if (nodes[idx] === elem) {
						return true;
					}
				}
				return false;
			};
		}(DIV.matches || DIV.matchesSelector || DIV.msMatchesSelector || DIV.mozMatchesSelector || DIV.webkitMatchesSelector || DIV.oMatchesSelector)),

		_bind = function(elem, eventName, callback) {
			if (elem.addEventListener) {
				return elem.addEventListener(eventName, callback);
			}

			elem.attachEvent('on' + eventName, function() {
				callback.call(elem);
			});
		},

		_unbind = function(elem, eventName, callback) {
			if (elem.removeEventListener) {
				return elem.removeEventListener(eventName, callback);
			}

			elem.detachEvent('on' + eventName, callback);
		},

		_outerWidth = function(elem) {
			var width = elem.offsetWidth,
				style = elem.currentStyle || _getComputedStyle(elem);

			width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);

			return width;
		},

		_outerHeight = function(elem) {
			var height = elem.offsetHeight,
				style = elem.currentStyle || _getComputedStyle(elem);

			height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);

			return height;
		};

	var Dom = root.D = function(elem) {
		if (!(this instanceof Dom)) { return new Dom(elem); }

		this.elem = (elem instanceof D) ? elem.elem : _.isString(elem) ? document.querySelectorAll(elem) : elem;
	};

	_.extend(Dom, {
		parseHtml: function(str) {
			var tmp = document.implementation.createHTMLDocument();
			tmp.body.innerHTML = str;
			return tmp.body.children;
		},

		toD: function(elements) {
			elements = (elements instanceof D) ? elements.elem : elements;
			if (!elements.length) { return []; }

			return _.map(elements, function(elem) {
				return new Dom(elem);
			});
		}
	});

	Dom.prototype = {

		hide: function() {
			this.elem.style.display = 'none';
			return this;
		},

		show: function() {
			this.elem.style.display = '';
			return this;
		},

		prepend: function(elem) {
			this.elem.insertBefore(elem, this.parent.firstChild);
			return this;
		},

		append: function(el) {
			this.elem.appendChild(el);
			return this;
		},

		clone: function() {
			return new Dom(this.elem.cloneNode(true));
		},

		empty: function() {
			while (this.elem.firstChild) {
				this.elem.removeChild(this.elem.firstChild);
			}
			return this;
		},

		remove: function() {
			this.elem.parentNode.removeChild(this.elem);
			return this;
		},

		text: function(str) {
			if (_.exists(str)) {
				this.elem.textContent = ('' + str);
				return this;
			}

			return this.elem.textContent;
		},

		hasClass: function(name) {
			if (this.elem.classList) {
				return this.elem.classList.contains(name);
			}

			return new RegExp('(^| )' + name + '( |$)', 'gi').test(this.elem.className);
		},

		addClass: function(name) {
			if (this.elem.classList) {
				this.elem.classList.add(name);
				return this;
			}

			this.elem.className += ' ' + name;
			return this;
		},

		removeClass: function(name) {
			if (this.elem.classList) {
				this.elem.classList.remove(name);
				return this;
			}

			this.elem.className = this.elem.className.replace(new RegExp('(^|\\b)' + name.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			return this;
		},

		toggleClass: function(name) {
			if (this.hasClass(name)) {
				this.removeClass(name);
			} else {
				this.addClass(name);
			}

			return this;
		},

		find: function(selector) {
			return new Dom(this.elem.querySelectorAll(selector));
		},

		parent: function() {
			return new Dom(this.elem.parentNode);
		},

		children: function() {
			return new Dom(this.elem.children);
		},

		attr: function(attr, value) {
			if (_exists(value)) {
				this.elem.setAttribute(attr, value);
				return this;
			}

			return this.elem.getAttribute(attr);
		},

		is: function(selector) {
			if (_.isString(selector)) {
				return _matches(this.elem, selector);
			}

			return this.elem === ((selector instanceof Dom) ? selector.elem : selector);
		},

		position: function() {
			return {
				left: this.elem.offsetLeft,
				top: this.elem.offsetTop
			};
		},

		html: function(str) {
			if (_exists(str)) {
				this.elem.innerHTML = ('' + str);
				return this;
			}

			return this.elem.innerHTML;
		},

		offset: function() {
			return this.elem.getBoundingClientRect();
		},

		width: function(val) {
			if (_exists(val)) {
				this.elem.style.width = _.isNumber(val) ? val + 'px' : val;
				return this;
			}

			return this.elem.offsetWidth;
		},

		height: function(val) {
			if (_exists(val)) {
				this.elem.style.height = _.isNumber(val) ? val + 'px' : val;
				return this;
			}

			return this.elem.offsetHeight;
		},

		outerWidth: function(withMargin) {
			return withMargin ? _outerWidth(this.elem) : this.elem.offsetWidth;
		},

		outerHeight: function(withMargin) {
			return withMargin ? _outerHeight(this.elem) : this.elem.offsetHeight;
		},

		on: function(eventName, callback) {
			_bind(this.elem, eventName, callback);
			return this;
		},

		off: function(eventName, callback) {
			_unbind(this.elem, eventName, callback);
			return this;
		}
	};

	return Dom;

}(this, _, document));
