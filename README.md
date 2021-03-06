d-js
====

A jQuery replacement with a footprint of 13.38kB minified and gzipped vs the 29.59kB in jQuery. 
Made to be a dropin that still works with common jQuery plugins...a nice middleground between 
[dominus](https://github.com/bevacqua/dominus) and [jQuery](http://jquery.com/).

`npm install d-js`

## Things of note

#### Promises
No `$.Deferred`s. Use [Promises](https://github.com/then/promise).

#### Ajax
Include your own ajax via [xaja-js](https://github.com/JosephClay/xaja-js) if needed.

#### Events
Events are handled by [crossvent](https://github.com/bevacqua/crossvent) by [bevacqua](https://github.com/bevacqua) and support the normal
`.on`, `.off` and `.trigger` methods.

No shorthand events
```
// don't use d().click(doSomething);
d().on('click', doSomething);
```

#### Data
Does not get data atttributes from the element

#### Animations
None, there are plenty of good non-jquery alternatives.

#### Each
D.each works as it does in jQuery e.g. `.each(function(index, value) {})`. D.forEach works as expected in ES5 e.g. `.forEach(function(value, index) {})` with `this` as the value;

#### Extend
Uses a [lodash](https://lodash.com) style extend.

#### Custom Selectors
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

#### More conflict
`.moreConflict()` to easily overwrite jQuery, $ and Zepto.

## Tests
Clone the repo, and run `npm test`.

## Perf
Clone the repo, and run `npm run perf`. Please note that most perfs are micro benchmarks...the DOM 
is going to be a bigger limiting factor than jQuery or d-js's performance.

## TODO
- more unit tests
- more perf tests
- smaller builds, same feature set
- identify any missing or non-working methods
- namespaces for events

#License

The MIT License (MIT)

Copyright (c) 2014 Joseph Clay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
