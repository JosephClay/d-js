var _DISPLAY_TEST = {
    noneOrTable: /^(none|table(?!-c[ea]).+)/
};

var _SELECTOR_TEST = {
    id:    /^#([\w-]+)$/,
    tag:   /^[\w-]+$/,
    klass: /^\.([\w-]+)$/
};

module.exports = {
    display: {
        isNoneOrTable: function(str) {
            return !!_DISPLAY_TEST.noneOrTable.exec(str);
        }
    },

    selector: {
        isStrictId: function(str) {
            var result = _SELECTOR_TEST.id.exec(str);
            return result ? !result[1] : false;
        },
        isTag: function(str) {
            var result = _SELECTOR_TEST.tag.exec(str);
            return result ? !result[1] : false;
        },
        isClass: function(str) {
            var result = _SELECTOR_TEST.klass.exec(str);
            return result ? !result[1] : false;
        }
    }
};