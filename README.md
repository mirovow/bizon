# Bizon
Bizon is a simple Node.js library that allow you to run functions in a worker thread.

## Installation
```
npm i --save bizon
```
## Basic usage
```js
require('bizon');

async function someHeavyBlockingFunction() {
  for (let i = 0; i < 100000000; i++) {
    Math.random();
  }
}

// You need to call a function with .$ and it's will be run in a worker thread
someHeavyBlockingFunction.$().then(() => console.log('Done'));

setTimeout(() => {
  console.log("Now I'am not blocked!");
}, 1);

// Now I'am not blocked!
// Done
```
