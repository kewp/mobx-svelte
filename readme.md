# mobx-svelte

This should really be named something else
(`reactive-state-with-derived-values-and-pub-sub`?)
but the reason I wrote it is that
I have a huge Svelte project filled with global
stores (`$`) and I wanted to use MobX's derived
values to simplify the reactive logic.

## Architecture

This is not **MobX**. It's a from-scratch implementation.
(Why? Couldn't find one that worked with Svelte.
In fact it seems it will never happen https://github.com/sveltejs/svelte/issues/5172).

The person who wrote MobX gave a brilliant talk
walking through how to implement the code of MobX
from scratch https://www.youtube.com/watch?v=NBYbBbjZeX4.
This repo is basically using that.
I just needed to add a few things:

 - Derived values. That wasn't included in the talk
 - Subscriptions contract. This makes these work with Svelte

Also I should note that MobX has various styles of usage,
the most popular is using Javascript classes and then
calling `makeAutoObservable(this)` in the contructor:

```js
class Timer {
    data = null
    constructor() {
        makeAutoObservable(this, {
            data: observable,
            count: computed
        })
    }
    get count() { if (data) return "N/A"; else return data.length }
}
```

Not sure why this is popular - never liked classes.
Also it's far more verbose - seems you need to specify
which properties are observable / derived (note: I have
only just started learning about MobX).

The other approach (which is what Michel uses in the video)
just uses a plain object and wraps it in a function:

```js
const Timer = observable({
    data: null,
    get count() { if (data) return "N/A"; else return data.length }
})
```

## Example

`main.js` is the example code. To run from the command line
you should just use `deno` https://deno.land/

```
deno run main.js
```

since it uses ES6 modules (and those are a real pain with NodeJS).

You should get this:

```
C:\Users\karlp\mobx-svelte>deno run main.js
[subscribe] count =  N/A
[subscribe] count_plus_delta =  N/A1
[autorun] count =  N/A
[autorun] count_plus_delta =  N/A1
----- init over ----
[subscribe] count =  3
[subscribe] count_plus_delta =  4
[autorun] count =  3
[autorun] count_plus_delta =  4
----- setting data again ----
[subscribe] count =  4
[subscribe] count_plus_delta =  5
[autorun] count =  4
[autorun] count_plus_delta =  5
----- running in action ----
[subscribe] count =  5
[subscribe] count_plus_delta =  7
[autorun] count =  5
[autorun] count_plus_delta =  7
```

This is what main looks like:

```js

import { observable } from './observable.js';
import { autorun, runInAction } from './box.js';

const makeStore = () => observable({

    data: null,
    delta: 1,

    get count() {
        if (this.data) return this.data.length;
        else return "N/A"
    },

    get count_plus_delta() { return this.count + this.delta; }

});

const store = makeStore();

store.$mobx.count.subscribe( (val) => console.log("[subscribe] count = ",val));
store.$mobx.count_plus_delta.subscribe( (val) => console.log("[subscribe] count_plus_delta = ",val));

autorun( () => {
    console.log("[autorun] count = ",store.count);
});

autorun( () => {
    console.log("[autorun] count_plus_delta = ",store.count_plus_delta);
});

console.log("----- init over ----");

store.data = [1,2,3];

console.log("----- setting data again ----");

store.data = [1,2,3,4];

console.log("----- running in action ----");

runInAction( () => {

    // should get just one set of outputs (not one per assignment)
    store.data = [1,2,3,4,5];
    store.delta = 2;
});
```

So we create a store (just an object wrapped in `observable`),
subscribe to some of the values,
use autorun (which in Svelte is exactly the same as wrapping
statements using `$: {}` i.e. reactivity).

We have two derived values in the object: `count` and `count_plus_delta`.
When we modify `data` then `count` should change.
And then `count_plus_delta` should change too (since it depends on `count`).
This shows that nested affects propogate correctly.

## Svelte

Note that Svelte is not in this repo. This is just an example:
in Svelte code you would save out the values as a store as such:

```Svelte
let data = store.$mobx.data;
$: console.log("data = ",$data)
```

You really should watch the video to see how this works
(though I am still confused by Javacript `this` and clojures...)

## runInAction

The only issue left (for my purposes) is making sure you can
suspend the updates if needs be, e.g. say you wanted to
make several changes that all need to happen at once
before the reactions happen:

```js
store.data = [2,3,4];
store.finished = false;
```

In MobX you do this by wrapping code in `runInAction`

```js
runInAction( () => {

    // should get just one set of outputs (not one per assignment)
    store.data = [1,2,3,4,5];
    store.delta = 2;
});
```

This is now working - we only get one set of outputs.
Otherwise you would get effects for each assignment - 
this instead just let's you do what you need and
only the values are set - no effects are run.
During this all the observables are tracked
globally.
Then right at the end we run them all.