define(function() {

	return {
		noConflict: function() {
			window.d = _prevD;
			return D;
		},

		moreConflict: function() {
			window.jQuery = window.$ = D;
		}
	};

}());