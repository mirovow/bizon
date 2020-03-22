interface Function {
  thread<A extends any[], R>(fn: (...args: A) => R, includeRequiredModules?: boolean): (...args: A) => Promise<R>;
}

function stringifyFunctionBody(fn) {
  const fnString = fn.toString();
  return fnString.substring(fnString.indexOf("{") + 1, fnString.lastIndexOf("}"));
}

function stringifyFunctionArguments(fn) {
  const fnString = fn.toString();
  return fnString.substring(fnString.indexOf("(") + 1, fnString.indexOf(")"));
}

function getPathToParentModule(level: number = 3) {
  const stack = new Error().stack.split('\n');
  let trace;
  if (stack.length >= 3) {
    trace = `${stack[level].replace('\t', '').trim()}`;
  } else {
    trace = `${stack[stack.length - 1].replace('\t', '').trim()}`;
  }
  const a = trace.split(':');
  a.splice(-2);
  const b = a.join(':');
  return b.substring(b.indexOf('/')) || ``;
}

async function getRequiredModulesString(modulePath: string, includeRequiredModules: boolean = true): Promise<string> {
  if (includeRequiredModules) {
    const fs = require('fs');
    const callerModuleText: string = await new Promise<string>((resolve, reject) => fs.readFile(modulePath, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString());
    }));
    
    const requireMatches = callerModuleText.match(/["'\s]*([\w*{}\n\r\t, ]+)(\s+|\s)=\s+require\(\s*["'\s].*([@\w_-]+)["'\s].*\).$/gm);
    if (requireMatches) {
      return requireMatches.join(';');
    }
  }
  return '';
}

function cleanContext(ctx) {
  const links = new Map();
  
  function recursive(element) {
    if (Array.isArray(element)) {
      return element.map((el) => recursive(el));
    } else if (typeof element === 'object' && element !== null) {
      const result = {};
      for (const key in element) {
        if (Array.isArray(element[key])) {
          result[key] = recursive(element[key]);
        } else if (typeof element[key] === 'object' && element[key] !== null) {
          if (!links.get(element[key])) {
            links.set(element[key], true);
            result[key] = recursive(element[key]);
          } else {
            result[key] = '[Circular]';
          }
        } else if (typeof element[key] !== 'function') {
          result[key] = element[key];
        }
      }
      return result;
    }
  }
  
  return recursive(ctx);
}

function workerCode() {
  const {workerData, parentPort} = require('worker_threads');
  
  // for typescript compilation
  const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  
  void async function () {
    process.on('uncaughtException', (err) => {
      console.error('Error in worker thread:', err);
      process.exit(1);
    });
    process.on('unhandledRejection', (err) => {
      console.error('Error in worker thread:', err);
      process.exit(1);
    });
    
    const fnInstance = new Function(...workerData.fnArgs.split(','), workerData.fnBody).bind(workerData.context);
    
    try {
      const convertedArgs = workerData.args.map((arg, i) => {
        if (workerData.functionArgsIndexes.includes(i)) {
          return new Function(
            ...arg.substring(arg.indexOf("(") + 1, arg.indexOf(")")).split(','),
            arg.substring(arg.indexOf("{") + 1, arg.lastIndexOf("}"))).bind(workerData.context);
        }
        return arg;
      });
      
      const result = await fnInstance(...convertedArgs);
      
      parentPort.postMessage({
        result: {
          isResolved: true,
          result,
          context: workerData.context,
        }
      });
    } catch (err) {
      parentPort.postMessage({
        result: {
          isResolved: false,
          result: err.message,
          context: workerData.context,
        }
      });
    }
  }();
}

void function () {
  Function.prototype.thread = (fn: (...args: any[]) => any, includeRequiredModules: boolean = true) => {
    if (typeof fn !== 'function') {
      throw new Error('The first argument must be a function!');
    }
    
    let requiredModulesString = '';
    let getRequiredModulesStringPromise;
    if (includeRequiredModules) {
      getRequiredModulesStringPromise = getRequiredModulesString(getPathToParentModule(), includeRequiredModules);
    }
    
    return async function (...funcArgs) {
      const {Worker} = require('worker_threads');
      if (includeRequiredModules) {
        requiredModulesString += await getRequiredModulesStringPromise;
      }
      
      const functionArgsIndexes = [];
      const convertedArgs = funcArgs.map((arg, i) => {
        if (typeof arg === 'function') {
          functionArgsIndexes.push(i);
          return arg.toString();
        }
        return arg;
      });
      
      const context = typeof this === 'object' && this !== null ? this : {};
      const worker = new Worker(requiredModulesString + ';' + stringifyFunctionBody(workerCode), {
        eval: true,
        workerData: {
          fnBody: stringifyFunctionBody(fn),
          fnArgs: stringifyFunctionArguments(fn),
          context: cleanContext(context),
          args: convertedArgs,
          functionArgsIndexes,
        },
      });
      
      return new Promise((resolve, reject) => {
        worker.on('message', (message) => {
          if (message.result) {
            Object.assign(context, message.result.context);
            if (message.result.isResolved) {
              resolve(message.result.result);
            } else {
              reject(new Error(message.result.result));
            }
          }
        });
        worker.on('error', (err) => reject(err));
        worker.on('exit', (code) => {
          if (code !== 0)
            reject(`Worker stopped with exit code ${code}`);
        });
      });
    }
  };
}();
