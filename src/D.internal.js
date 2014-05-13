var D = require('./D');

module.exports = D.__INTERNAL = {

    fizzle: {
        selector: {
            parser: require('./modules/Fizzle/selector/selector-parse')
        }
    }

};
