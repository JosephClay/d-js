module.exports = {
    // TODO: Document differences between jQuery and D.js behavior for these selectors
	':child-at':  ':nth-child(x)',
	':child-gt':  ':nth-child(n+x)',
	':child-lt':  ':nth-child(~n+x)'
};
