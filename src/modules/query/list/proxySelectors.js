module.exports = {
    ':first'   : ':first-child',
    ':last'    : ':last-child',
    ':even'    : ':nth-child(even)',
    ':odd'     : ':nth-child(odd)',
    ':text'    : '[type="text"]',
    ':password': '[type="password"]',
    ':radio'   : '[type="radio"]',
    ':checkbox': '[type="checkbox"]',
    ':submit'  : '[type="submit"]',
    ':reset'   : '[type="reset"]',
    ':button'  : '[type="button"]',
    ':image'   : '[type="image"]',
    ':file'    : '[type="file"]',
    ':enabled' : ':not([disabled])',
    ':disabled': '[disabled]',
    ':selected': '[selected]',
    ':checked' : '[checked="checked"]'
};