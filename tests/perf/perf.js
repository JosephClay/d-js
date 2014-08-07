(function($, D, Z) {

	// Object Creation ==========================
	var create = function(ctx, thing) {
			return function() {
				ctx(thing);
			};
		},
		createWithContext = function(ctx, thing, thing2) {
			return function() {
				ctx(thing, thing2);
			};
		};
/* Both run inconsequentially fast
	profiler.testSet({
		iterate: 1000,
		'jQuery: construct()': create($),
		'D: construct()': create(D)
	});
*/

	var element = document.body;
/* Both run inconsequentially fast
	profiler.testSet({
		iterate: 1000,
		'jQuery: construct(element)': create($, element),
		'D: construct(element)': create(D, element)
	});
*/
	var elements = [element, element, element];
	profiler.testSet({
		iterate: 1000,
		'jQuery: construct(elements)': create($, elements),
		'D: construct(elements)': create(D, elements),
		'Zepto: construct(elements)': create(Z, elements)
	});

	var query = '#foo ul.div > li.bar:not(:checked) input[type="file"]';
	profiler.testSet({
		iterate: 100000,
		'jQuery: construct(query)': create($, query),
		'D: construct(query)': create(D, query),
		'Zepto: construct(query)': create(Z, query)
	});

	var html = '<div></div>';
	profiler.testSet({
		iterate: 10000,
		'jQuery: construct(html)': create($, html),
		'D: construct(html)': create(D, html),
		'Zepto: construct(html)': create(Z, html)
	});

	var obj = { 'data-num': 0 };
/* Both run inconsequentially fast
	profiler.testSet({
		iterate: 1000,
		'jQuery: construct(element, obj)': createWithContext($, element, obj),
		'D: construct(element, obj)': createWithContext(D, element, obj)
	});
*/
	profiler.testSet({
		iterate: 1000,
		'jQuery: construct(html, obj)': createWithContext($, html, obj),
		'D: construct(html, obj)': createWithContext(D, html, obj),
		'Zepto: construct(html, obj)': createWithContext(Z, html, obj)
	});

	// HTML ==========================
	var htmlStr = '<div><ul><li></li><li></li><li></li></ul></div>';
	var parseHtml = function(ctx) {
		return function() {
			ctx.parseHTML(htmlStr);
		};
	};
	profiler.testSet({
		iterate: 1000,
		'jQuery: parseHtml (small)': parseHtml($),
		'D: parseHtml (small)': parseHtml(D)
	});

	htmlStr = document.getElementById('test-html').innerHTML;
	profiler.testSet({
		iterate: 1000,
		'jQuery: parseHtml (large)': parseHtml($),
		'D: parseHtml (large)': parseHtml(D)
	});

	// Find ==========================
	var $ctx = $('div'),
		Dctx = D('div');
		Zctx = Zepto('div');
		finder = function(ctx) {
			return function() {
				ctx.find('> .foo');
			};
		};
	profiler.testSet({
		iterate: 1000,
		'jQuery: find': finder($ctx),
		'D: find': finder(Dctx)
	});

/*
	// Text Tests ==========================
	var htmlStr = '<div><ul><li></li><li></li><li></li></ul></div>';
	var parseHtml = function(ctx) {
		return function() {
			ctx.parseHTML(htmlStr);
		};
	};
	profiler.testSet({
		iterate: 1000,
		'jQuery: parseHtml (small)': parseHtml($),
		'D: parseHtml (small)': parseHtml(D)
	});

	htmlStr = document.getElementById('test-html').innerHTML;
	profiler.testSet({
		iterate: 1000,
		'jQuery: parseHtml (large)': parseHtml($),
		'D: parseHtml (large)': parseHtml(D)
	});
*/

}(jQuery, D, Zepto));