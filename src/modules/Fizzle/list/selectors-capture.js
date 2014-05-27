module.exports = {
    // TODO: Document differences between jQuery and D.js behavior for these selectors
	':eq':  ':nth-child(x)',
	':gt':  ':nth-child(n+x)',
	':lt':  ':nth-child(~n+x)'
};
