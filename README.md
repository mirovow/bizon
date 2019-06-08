# Bizon
Bizon is a simple library that allows you to run functions in a worker thread of Node.JS or Web Workers of a browser.

## Installation
```
npm i --save bizon
```
## Basic usage
```js
require('bizon');

function fib(n) {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
}

// You need to call a function with .$ and it will be run in a worker thread of Node.JS or Web Worker in a browser
// .$ returns a Promise
fib.$(25).then(result => console.log('fib(25)', result));

// Also you can run a second function, and all of them will work in parallel
fib.$(28).then(result => console.log('fib(28, result));

setInterval(() => {
  console.log("I'm not blocked!");
}, 200);
```
