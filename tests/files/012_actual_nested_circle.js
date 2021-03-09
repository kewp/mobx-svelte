module.exports = {
    obj: {
        a: ($) => $.b,
        b: ($) => $.c,
        c: ($) => $.a,
    },
    fn: ($) => {},
    _: {
        fn: ['a','b','c'],
        subs: [],
        deps: { a: [], b: ['c'], c: ['a'] },
        value: {},
        fatal: {
            msg: 'circular dependency',
            stack: ['a','b','c','a']
        }
    }
}