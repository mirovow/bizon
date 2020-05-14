interface Options {
  useParentModules?: boolean;
  parentModuleStackLevel?: number;
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

async function getRequiredModulesString(modulePath: string): Promise<string> {
  const fs = require('fs');
  const callerModuleText: string = await new Promise<string>(
    (resolve, reject) =>
      fs.readFile(modulePath, (err, result) => {
        if (err) reject(err);
        else resolve(result.toString());
      })
  );
  
  const requireMatches = callerModuleText.match(/["'\s]*([\w*{}\n\r\t\$, ]+)(\s+|\s)=\s+require\(\s*["'\s].*([@\w_-]+)["'\s].*\).$/gm);
  if (requireMatches) {
    return requireMatches.filter((moduleStr) => !/(bizon|function\$)/.test(moduleStr)).join(';');
  }
}

function cleanContext(ctx) {
  const links = new Map();
  
  function recursive(element) {
    if (Array.isArray(element)) {
      return element.map((el) => recursive(el));
    } else if (element instanceof Promise) {
      return void 0;
    } else if (typeof element === 'object' && element !== null) {
      links.set(element, true);
      const result = {};
      for (const key of Object.keys(element)) {
        if (links.has(element[key])) {
          result[key] = '[Circular]';
        } else {
          result[key] = recursive(element[key]);
        }
      }
      return result;
    } else if (
      typeof element === 'string'
      || typeof element === 'number'
      || typeof element === 'boolean'
      || element === null
      || element === void 0
    ) {
      return element;
    } else {
      return void 0;
    }
  }
  
  return recursive(ctx);
}

const workerCode = `
const {workerData, parentPort} = require('worker_threads');

void async function () {
  process.on('uncaughtException', (err) => {
    console.error('Error in worker thread:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    console.error('Error in worker thread:', err);
    process.exit(1);
  });
  
  const {{bizon_function_name}} = (function() { return {{bizon_function_body}} }).call(workerData.context);
  
  try {
    const convertedArgs = workerData.args.map((arg, i) => {
      if (workerData.functionArgsIndexes.includes(i)) {
        return eval('(' + arg + ')').bind(workerData.context);
      }
      return arg;
    });

    const result = await {{bizon_function_name}}.call(workerData.context, ...convertedArgs);

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
`

export function function$<A extends any[], R>(fn: (...args: A) => R): (...args: A) => Promise<R>;
export function function$<A extends any[], R>(options: Options, fn: (...args: A) => R): (...args: A) => Promise<R>;
export function function$(...args) {
  let fn = args[0];
  let options;
  if (args[1]) {
    fn = args[1];
    options = args[0];
  }
  
  if (typeof fn !== 'function') {
    throw new Error('The first argument must be a function!');
  }
  
  let requiredModulesString = '';
  let getRequiredModulesStringPromise = null;
  if (options?.useParentModules !== false) {
    getRequiredModulesStringPromise = getRequiredModulesString(getPathToParentModule(options?.parentModuleStackLevel || 3));
  }
  
  return async function (...funcArgs) {
    const {Worker} = require('worker_threads');
    if (getRequiredModulesStringPromise) {
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
    const worker = new Worker(
      requiredModulesString
      + ';' +
      workerCode
        .replace(/{{bizon_function_name}}/g, fn.name || '__default_bizon_fn_name')
        .replace('{{bizon_function_body}}', fn.toString()
        ), {
        eval: true,
        workerData: {
          context: cleanContext(context),
          args: cleanContext(convertedArgs),
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
}
