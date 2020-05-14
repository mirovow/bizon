import {function$} from '../../src/index';

const os = require('os');

describe("function$", () => {
  test('should execute simple thread function', async () => {
    const multiply$ = function$((a: number, b: number) => {
      return a + b;
    });
    const result = await multiply$(20, 4);
    expect(result).toBe(24);
  });
  
  test('should include parent thread modules', async () => {
    const getOSArch$ = function$(() => {
      return os.arch();
    });
    const result = await getOSArch$();
    expect(result).toBe(os.arch());
  });
  
  test('should not include parent thread modules', async () => {
    const getOSArch$ = function$({useParentModules: false}, () => {
      return os.arch();
    });
    await expect(getOSArch$()).rejects.toEqual(new Error('os is not defined'));
  });
  
  test('should change "this" context in object', async () => {
    const obj = {
      name: 'Bob',
      // Use function declaration to get 'this'
      changeName$: function$(function (newName: string) {
        this.name = newName;
      }),
    };
    expect(obj.name).toBe('Bob');
    const newName = 'Sarah';
    await obj.changeName$(newName);
    expect(obj.name).toBe(newName);
  });
  
  test('should change "this" context in class', async () => {
    class Person {
      name = 'Bob';
      // Use function declaration to get 'this'
      changeName$ = function$((newName: string) => {
        this.name = newName;
      });
    };
    
    const person = new Person();
    expect(person.name).toBe('Bob');
    const newName = 'Sarah';
    await person.changeName$(newName);
    expect(person.name).toBe(newName);
  });
  
  test('should clean a context', async () => {
    class Person {
      str = 'string val';
      number = 23;
      nullVal = null;
      undefVal = undefined;
      someFunc = () => {};
      somePromise = new Promise((resolve) => resolve());
      arr: any[] = ['string', 1, null, undefined, () => {}, new Promise((resolve) => resolve()), {x: 1}];
      obj = {
        str: 'string val',
        number: 23,
        nullVal: null,
        undefVal: undefined,
        someFunc: () => {},
        obj: {x: 10},
      };
      // Use function declaration to get 'this'
      getContext$ = function$(() => {
        return this;
      });
    };
    
    const person = new Person();

    person['circular'] = person.obj;
    
    const context = await person.getContext$();
    expect(context).toEqual({
      "arr": [
        "string",
        1,
        null,
        undefined,
        undefined,
        undefined,
        {
          "x": 1
        }
      ],
      "circular": "[Circular]",
      "getContext$": undefined,
      "nullVal": null,
      "number": 23,
      "obj": {
        "nullVal": null,
        "number": 23,
        "obj": {
          "x": 10
        },
        "someFunc": undefined,
        "str": "string val",
        "undefVal": undefined,
      },
      "someFunc": undefined,
      "somePromise": undefined,
      "str": "string val",
      "undefVal": undefined,
    });
  });
  
  test('should throw an exception', async () => {
    const multiply$ = function$((a: number, b: number) => {
      throw new Error('Some exception');
    });
    
    await expect(multiply$(20, 4)).rejects.toEqual(new Error('Some exception'));
  });
  
  test('should use recursive call', async () => {
    const fib$ = function$(function fib(n) {
      return n <= 1 ? n : fib(n - 1) + fib(n - 2);
    });
  
    const result = await fib$(10);
    expect(result).toEqual(55);
  });
});
