let debug = false;
let spacer = '';
let trace =     !debug ? () => {} : (...args) => { if (args.length>0) console.log(spacer,args); }
let trace_in =  !debug ? () => {} : (...args) => { if (args.length>0) console.log(spacer,args); spacer += '-'; }
let trace_out = !debug ? () => {} : (...args) => { if (args.length>0) console.log(spacer,args); spacer = spacer.slice(0,-1); }
let auto = (obj) => {
    let deps = {};
    let fn = {};
    let value = {};
    let stack = [];
    let called = {};
    let fatal = {};
    let subs = {};
    let fail = (msg) => {
        let _stack = []; stack.forEach(s => _stack.push(s));
        fatal.msg = msg;
        fatal.stack = _stack;
        if (fn['#fatal']) fn['#fatal'](res);
    }
    let run_subs = (name) => {
        trace_in('run_subs('+name+') ['+subs[name]+']');
        if (subs[name])
            Object.keys(subs[name]).forEach( tag => {
                trace('running sub'+name+' '+tag+'with value'+value[name]);
                subs[name][tag](value[name])
            }
        )
        trace_out();
    }
    let update = (name) => {
        trace_in('update('+name+')');
        stack.push(name);
        if (called[name]) { fail('circular dependency'); return; }
        deps[name] = {};
        called[name] = true;
        value[name] = fn[name]();
        trace('return from function:',value[name]);
        Object.keys(deps).forEach( parent => {
            if (name in deps[parent]) update(parent);
        });
        run_subs(name);
        delete(called[name]);
        stack.pop();
        trace_out('result from update '+name+':',value[name]);
    }
    let getter = (name, parent) => {
        trace('GETTER '+name+' (parent '+parent+')');
        if (parent) deps[parent][name] = true;
        trace('got',value[name]);
        return value[name];
    }
    let setter = (name, val) => {
        value[name] = val;
        run_subs(name);
        Object.keys(deps).forEach( parent => {
            if (name in deps[parent]) update(parent);
        });
    }
    let get_subtag = (name) => {
        let val = 0;
        let tag = () => val.toString().padStart(3, "0");
        while( subs[name] && tag() in subs[name] ) val += 1;
        return tag();
    }
    let setup_sub = (hash, name) => {
        hash[name] = {}
        hash[name].get = () => getter(name);
        hash[name].set = (v) => setter(name, v);
        hash[name].subscribe = (f) => {
            f(value[name]);
            let subtag = get_subtag(name);
            if (!subs[name]) subs[name] = {};
            subs[name][subtag] = (v) => f(v);
            return () => { delete(subs[name][subtag]); }
        };
    }
    let setup_dynamic = (obj, name, res) => {
        let _ = {};
        Object.keys(obj).forEach(
            child => Object.defineProperty(_, child, {
                get() { return getter(child, name); },
                set(v) { fail('function '+name+' is trying to change value '+child);  }
            }));
        fn[name] = () => obj[name](_, (v) => setter(name, v) );
        Object.defineProperty(res, name, {
            get() { return getter(name) }
        } )
    }
    let setup_static = (name, res) => {
        value[name] = obj[name];
        Object.defineProperty(res, name, {
            get() { return getter(name) },
            set(v) { setter(name, v) }
        })
    }
    let default_fatal = (_) => {
        console.log('FATAL',_._.fatal.msg);
        console.log(' stack',_._.fatal.stack);
        console.log(' _',_);
        console.log(' (there might be an error below too if your function failed as well)');
    }
    let wrap = (res, hash, obj) => {
        if (!obj['#fatal']) obj['#fatal'] = default_fatal;
        Object.keys(obj).forEach(name => {
            if (typeof obj[name] == 'function') setup_dynamic (obj, name, res);
            else setup_static (name, res);
            setup_sub(hash, name);
        });
    }
    const res = {
        _: { subs, fn, deps, value, fatal },
        '#': {},
        v: '1.27.13'
    };
    wrap(res, res['#'], obj);
    Object.keys(fn).forEach(name => { if (name[0] != '#') update(name) });
    return res;
}

module.exports = auto;