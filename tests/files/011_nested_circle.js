module.exports = {
    obj: {
        a: null,
        b: ($) => $.a + $.c,
        c: ($) => $.a + $.b,
    },
    fn: ($) => {},
    _: {
        fn: ['b','c'],
        deps: { b: [], c: ['a', 'b'] },
        value: { a: null },
        fatal: {
            source: 'run',
            msg: 'circular dependency',
            stack: ['b', 'c', 'b']
        }
    }
}