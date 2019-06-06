/*async function someHeavyBlockingFunction() {
  for (let i = 0; i < 1000000000; i++) {
    Math.random();
  }
}

someHeavyBlockingFunction().then(() => console.log('Done'));

setTimeout(() => {
  console.log("I'am blocked!");
});*/


require('./build');

async function someHeavyBlockingFunction() {
  for (let i = 0; i < 100000000; i++) {
    Math.random();
  }
}

// function will run in a worker thread
someHeavyBlockingFunction.$().then(() => console.log('Done'));

setTimeout(() => {
  console.log("Now I'am not blocked!");
}, 1);
