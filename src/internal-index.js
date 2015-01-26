var D = require('./index');

D.__INTERNAL = {
    fizzle: {
        selector: {
            parser: require('./modules/Fizzle/selector/selector-parse')
        }
    }
};

module.exports = D;