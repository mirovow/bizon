interface Function {
  $(...args): Promise<any>;
}

void function() {
  function checkGlobalVar(varName: string) {
    return this.hasOwnProperty(varName);
  }

  function convertArgsToString(args) {
    return args.map(arg => {
      if (arg === undefined) {
        return 'undefined';
      }
      if (arg === null) {
        return 'null';
      }
      if (typeof arg === 'string') {
        return `"${ arg }"`
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, (key, value) => {
          if (value === undefined) {
            return 'undefined';
          }
          return typeof value === 'function'
            ? delete value.toString && value.toString()
            : value;
        }).replace(/"undefined"/g, 'undefined');
      } else {
        return delete arg.toString && arg.toString();
      }
    });
  }

  const getTypescriptCompilerHelpers = () => `
    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {return new (P || (P = Promise))(function (resolve, reject) {function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }step((generator = generator.apply(thisArg, _arguments || [])).next());});};
    var __generator = (this && this.__generator) || function (thisArg, body) {var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;function verb(n) { return function (v) { return step([n, v]); }; }function step(op) {if (f) throw new TypeError("Generator is already executing.");while (_) try {if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;if (y = 0, t) op = [op[0] & 2, t.value];switch (op[0]) {case 0: case 1: t = op; break;case 4: _.label++; return { value: op[1], done: false };case 5: _.label++; y = op[1]; op = [0]; continue;case 7: op = _.ops.pop(); _.trys.pop(); continue;default:if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }if (t[2]) _.ops.pop();_.trys.pop(); continue;}op = body.call(thisArg, _);} catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };}};
  `;

  let WorkerThread;
  let workerPromiseFunction;

  // if it's a browser
  if (checkGlobalVar('window')) {
    WorkerThread = Worker;
    workerPromiseFunction = function(functionName, functionDeclaration, args) {
      const argumentsString = convertArgsToString(args);
      const execString = `data:text/javascript;charset=US-ASCII,onmessage = function(event) {
            ${ getTypescriptCompilerHelpers() }
            ${ functionDeclaration }
            Promise.resolve()
                .then(() => ${ functionName }(${ argumentsString }))
                .then(result => postMessage({ resolve: true, reject: false, data: result }))
                .catch(err => postMessage({ resolve: false, reject: true, data: err.message }))
          }
      `;
      return new Promise((resolve, reject) => {
        const worker = new WorkerThread(execString);
        worker.postMessage(null);
        worker.onmessage = function(event) {
          if (event.data.resolve) {
            return resolve(event.data.data);
          }
          if (event.data.reject) {
            return reject(new Error(event.data.data));
          }
        };
        worker.onerror = function(event) {
          return reject(event.data);
        };
      });
    };
    // if it's a Node.js
  } else if (checkGlobalVar('process')) {
    const workerThread = require('worker_threads');
    WorkerThread = workerThread.Worker;
    workerPromiseFunction = function(functionName, functionDeclaration, args) {
      const argumentsString = convertArgsToString(args);
      const execString = `
        const { workerData, parentPort } = require('worker_threads');
        ${ getTypescriptCompilerHelpers() }
        ${ functionDeclaration }

        Promise.resolve()
          .then(() => ${ functionName }(${ argumentsString }))
          .then(result => parentPort.postMessage({ resolve: true, reject: false, data: result }))
          .catch(err => parentPort.postMessage({ resolve: false, reject: true, data: err.stack }))
      `;
      return new Promise((resolve, reject) => {
        let worker;
        try {
          worker = new WorkerThread(execString, { eval: true });
        } catch (err) {
          reject(err);
        }
        worker.on('message', (message) => {
          if (message.resolve) {
            return resolve(message.data);
          }
          if (message.reject) {
            return reject(new Error(message.data));
          }
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${ code }`));
        });
      });
    };
  }

  Function.prototype.$ = function(...args) {
    let functionString = delete this.toString && this.toString();
    let functionName = this.name || 'function_string_for_execution';
    let isAsync = this.constructor.name === 'AsyncFunction';

    // Normalize function string
    // if it is an arrow function
    if (functionString.search(/^(.+?|)\((.+?|)\)(\s+?|)=>/) >= 0) {
      functionString = functionString.replace(/^(|.+?)\(/, '(');
      // if it is a classic function
    } else if (functionString.search(/^(.+?|)\((.+?|)\)(\s+?|){/) >= 0) {
      functionString = functionString.replace(/^(|.+?)\(/, 'function(');
    }

    functionString = `const ${ functionName } = ${ isAsync ? 'async' : '' } ${ functionString };`;

    return workerPromiseFunction(functionName, functionString, args);
  };
}();
