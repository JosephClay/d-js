module.exports = {
    // TODO: Document differences between jQuery and D.js behavior for these selectors
    ':child-even' : ':nth-child(even)',
    ':child-odd'  : ':nth-child(odd)',

    ':text'    : '[type="text"]',
    ':password': '[type="password"]',
    ':radio'   : '[type="radio"]',
    ':checkbox': '[type="checkbox"]',
    ':submit'  : '[type="submit"]',
    ':reset'   : '[type="reset"]',
    ':button'  : '[type="button"]',
    ':image'   : '[type="image"]',
    ':input'   : '[type="input"]',
    ':file'    : '[type="file"]',
    ':enabled' : ':not([disabled])',
    ':disabled': '[disabled]',
    ':selected': '[selected]',
    ':checked' : '[checked="checked"]'
};
