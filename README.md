d-js
====

A jQuery replacement with a footprint of 14.83kB minified and gzipped vs the 29.59kB in jQuery.

`npm install d-js`

### Things of note

ES5+

`.moreConflict()` to easily overwrite jQuery, $ and Zepto.

# Promises
No `$.Deferred`s. Use (Promises)[https://github.com/then/promise].

# Custom Selectors
Supported!
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

Not supported:
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

# Ajax
Include your own ajax via (xaja-js)[https://github.com/JosephClay/xaja-js] if needed.

# Events
Events are handled by (crossvent)[https://github.com/bevacqua/crossvent] by (bevacqua)[https://github.com/bevacqua] and support the normal
`.on`, `.off` and `.trigger` methods.

No shorthand events
```
// don't use d().click(doSomething);
// use:
d().on('click', doSomething);
```

# Animations
None, there are plenty of good non-jquery alternatives.