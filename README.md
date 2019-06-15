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
fib.$(28).then(result => console.log('fib(28)', result));

// You can pass a function to the arguments
function customMap(arr, handler) {
  return arr.map(handler);
}

customMap.$([43, 34, 23], (n) => {
  function fib(n) {
    return n <= 1 ? n : fib(n - 1) + fib(n - 2);
  }
  return fib(n);
}).then(result => console.log(result));

setInterval(() => {
  console.log("I'm not blocked!");
}, 200);
```
## Restrictions
You can not get access to variables defined outside the function
```js
const a = 10;

function func() {
  return a + 5;
}
func.$().then(result => console.log(result));

// Error: ReferenceError: a is not defined
```
You can not return objects and arrays with promises and functions
```js
function func() {
    return {
      foo: new Promise((resolve) => resolve('hello')),
      baz: function() {
        return 'hello'
      }
    };
}
func.$().then(result => console.log(result));

//  Error: DataCloneError: #<Promise> could not be cloned.
```
You can not return functions
```js
function func() {
    return function() {
      return 'hello';
    }
}
func.$().then(result => console.log(result));

// Error: DataCloneError: function () {
//   return 'hello';
// } could not be cloned.
```

