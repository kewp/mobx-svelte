module.exports = {
    obj: {
        data: null
    },
    fn: ($) => {
        $.data = [1,2,3];
    },
    _: {
        fn: [],
        deps: {},
        value: { data: [1,2,3] },
        fatal: {}
    }
}