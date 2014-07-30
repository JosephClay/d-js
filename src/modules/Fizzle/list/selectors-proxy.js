var _SUPPORTS = require('../../../supports');

var proxy = {
    // DOC: Document these selectors
    ':child-even' : ':nth-child(even)',
    ':child-odd'  : ':nth-child(odd)',

    ':text'       : '[type="text"]',
    ':password'   : '[type="password"]',
    ':radio'      : '[type="radio"]',
    ':checkbox'   : '[type="checkbox"]',
    ':submit'     : '[type="submit"]',
    ':reset'      : '[type="reset"]',
    ':button'     : '[type="button"]',
    ':image'      : '[type="image"]',
    ':input'      : '[type="input"]',
    ':file'       : '[type="file"]',

    // See https://developer.mozilla.org/en-US/docs/Web/CSS/:checked
    ':selected'   : '[selected]'
};

// IE8
if (!_SUPPORTS.disabledSelector) {
    proxy[':disabled'] = '[disabled]';

    // DOC: No good way to polyfill this.
    // proxy[':enabled']  = ':not([disabled])';
}

// IE8
if (!_SUPPORTS.checkedSelector) {
    proxy[':checked']  = '[checked]';
}

module.exports = proxy;
