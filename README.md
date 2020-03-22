# Bizon
Bizon is a simple library that allows you to run functions in a worker thread of Node.JS.

## Installation
```
npm i --save bizon
```
## Basic usage
```js
require('bizon');

const fibonacci = Function.thread((n) => {
  // You can not use recursive call fibonacci(), because the function body of the thread
  // function can not get outside context
  function fib(n) {
    return n <= 1 ? n : fib(n - 1) + fib(n - 2);
  }
 return fib(n);
});

// Then you can call the thread function which returns a Promise().
fibonacci(25).then(result => console.log('fibonacci(25)', result));

// Also you can run a second function, and all of them will work in parallel
fibonacci(35).then(result => consolwe.log('fibonacci(28)', result));
```
### Using imports
```js
require('bizon');
const fs = require('fs');

const readFile = Function.thread((pathToFile) => {
    // You can use modules which required in the parent thread
    return fs.readFileSync(pathToFile).toString();
});

void async function () {
    const fileData = await readFile('./README.md');
    console.log(fileData);
}();
```
### 'this' in a thread function
You can use 'this' context
```js
require('bizon');
void async function() {
    const person = {
      age: 34,
      changeAge: Function.thread((newAge) => {
        this.age = newAge;
      }),
    };
    
    console.log(person.age); // 34
    await person.changeAge(50);
    console.log(person.age); // 50
}();
```
### Arguments
You can pass numbers, strings, arrays, objects and functions to the arguments
```js
require('bizon');
const customMap = Function.thread((arr, handler) => {
  return arr.map(handler);
});

customMap([43, 34, 23], (n) => {
  return String(n);
}).then(result => console.log(result));

// The passed function have 'this' context of the parent function
void async function() {
    const obj = {
        someConst: 3.14,
        customMap: Function.thread((arr, callback) => {
            return arr.map(callback);
        }),
    };
    
    const result = await obj.customMap([1, 2, 3], (val) => {
        return this.someConst * val * val;
    });
    
    console.log(result); // [ 3.14, 12.56, 28.259999999999998 ]
}();
```
## Restrictions
You can not use recursive calls
```js
require('bizon');
const fib = Function.thread((n) => {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});

fib().then(result => console.log(result));

// UnhandledPromiseRejectionWarning: Error: fib is not defined
```
You can not get access to variables defined outside the function
```js
require('bizon');

const a = 10;

const func = Function.thread(() => {
  return a + 5;
});

func().then(result => console.log(result));

// Error: ReferenceError: a is not defined
```
You can not return objects and arrays with promises and functions
```js
require('bizon');

const func = Function.thread(() => {
    return {
      foo: new Promise((resolve) => resolve('hello')),
      baz: function() {
        return 'hello'
      }
    };
});

func().then(result => console.log(result));

//  Error: DataCloneError: #<Promise> could not be cloned.
```
You can not return functions
```js
require('bizon');

const func = Function.thread(() => {
    return function() {
      return 'hello';
    }
});
func().then(result => console.log(result));

// Error: DataCloneError: function () {
//   return 'hello';
// } could not be cloned.
```

