d-js
====

A jQuery replacement with a footprint of 17.4kB minified and gzipped vs the 29.59kB in jQuery.

### Things of note
# Promises
No `$.Deferred`s. Use (Promises)[https://github.com/then/promise].

# Custom Selectors
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

# Ajax
Uses (xaja-js)[https://github.com/JosephClay/xaja-js] for ajax.

# Events
Events are handled by (crossvent)[https://github.com/bevacqua/crossvent] by (bevacqua)[https://github.com/bevacqua] and support the normal
`.on`, `.off` and `.trigger` methods.

No shorthand events
```
// don't use d().click(doSomething);
// use:
d().on('click', doSomething);
```