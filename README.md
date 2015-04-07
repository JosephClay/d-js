d-js
====

A jQuery replacement.

- Uses (xaja-js)[] for ajax
- `$.Deferred`s removed. Use (Promises)[]
- Uses the Fizzle selector engine


## Custom Selectors
Not supported
- `:eq(index)`
- `:gt(no)`
- `:lt(no)`
- `:contains(text)`
- `:parent`
- `:has(selector)`
- `:hidden`
- `:visible`
- `:header`
- `:input`

Supported
- `:not(selector)`
- `:empty`
- `:focus`
- `:root`
- `:text`
- `:password`
- `:radio`
- `:checkbox`
- `:submit`
- `:reset`
- `:button`
- `:image`
- `:file`
- `:enabled`
- `:disabled`
- `:selected`
- `:checked`

## Events
Events are handled by (crossvent)[] by (bevacqua)[] and support the normal
`.on`, `.off` and `.trigger` methods.

No shorthand events
```
// don't use d().click(doSomething);
// use:
d().on('click', doSomething);
```