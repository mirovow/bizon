# Bizon
Bizon is a simple library that allows you to run functions in a worker thread of Node.JS.

## Installation
```
npm i --save bizon
```
## Basic usage
```js
const { function$ } = require('bizon');


void async function() {
  // Initialize your own thread function
  const multiply$ = function$((a, b) => {
    return a + b;
  });
  
  // Then call the function and get a result. Your thread function returns a promise
  const result = await multiply$(10, 20);
  console.log(result); // 30
}();

```
### Using imports
```js
const { function$ } = require('bizon');
const fs = require('fs');

void async function() {
  // You can use required modules of the parent thread
  const readFile$ = function$((pathToFile) => {
    return fs.readFileSync(pathToFile).toString();
  });
  
  // The function will be async, because it will be run in a thread
  const result = await readFile$('./index.js');
  console.log(result);
}();
```
### 'this' in a thread function
You can use 'this' context
```js
const { function$ } = require('bizon');

class Person {
  name = null;
  
  setName$ = function$((newName) => {
    // You can get access to 'this' context inside your thread function!
    // But remember! You can not use methods of 'this' inside a thread function
    this.name = newName;
  });
}

void async function() {
  const person = new Person();

  console.log(person.name); // null
  await person.setName$('Bob');
  console.log(person.name); // Bob
}();

```
### Arguments
You can pass numbers, strings, arrays, objects and functions to the arguments
```js
const { function$ } = require('bizon');

void async function() {
  // You can create the thread map!
  // You can pass a callbacks to arguments of a thread function
  Array.prototype.map$ = function$((cb) => {
    // 'this' will be specify to an array
    // Just call map in thread function and pass callback
    return this.map(cb);
  });
  
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Just call map$ like the sync map function of an array
  const result = await numbers.map$((val, i) => {
    return val ** i;
  });
  
  console.log(result);
}();
```
### Recursive calls
You can call your function recursively
```js
const { function$ } = require('bizon');

void async function () {
  // For recursively call you need to pass named function expression as callback
  const fib$ = function$(function fib(n) {
    return n <= 1 ? n : fib(n - 1) + fib(n - 2);
  });
  
  const result = await fib$(40);
  console.log(result) // 102334155
}();

```

## Restrictions
You can not get access to variables defined outside the function
```js
const { function$ } = require('bizon');

const a = 10;

const func$ = function$(() => {
  return a + 5;
});

func$().then(result => console.log(result));

// Error: ReferenceError: a is not defined
```
You can not return objects and arrays with promises and functions
```js
const { function$ } = require('bizon');

const func$ = function$(() => {
    return {
      foo: new Promise((resolve) => resolve('hello')),
    };
});

func$().then(result => console.log(result));

//  Error: DataCloneError: #<Promise> could not be cloned.
```
You can not return functions
```js
const { function$ } = require('bizon');

const func$ = function$(() => {
    return function() {
      return 'hello';
    }
});
func$().then(result => console.log(result));

// Error: DataCloneError: function () {
//   return 'hello';
// } could not be cloned.
```

