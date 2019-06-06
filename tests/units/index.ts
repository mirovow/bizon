import '../../src';
import { describe, afterEach } from 'mocha';
import * as should from 'should';

describe('index', () => {
  describe('classic functions', () => {
    describe('sync functions', () => {
      it('should successfully run function name() {}', async () => {
        function someName() {
          return 1;
        }

        await should(someName.$()).be.resolvedWith(1);
      });
      it('should successfully run function name(...someArgs) {}', async () => {
        function someName(a, b) {
          return a + b;
        }

        await should(someName.$(3, 9)).be.resolvedWith(12);
      });
      it('should successfully run function() {}', async () => {
        await should(function() {
          return 1;
        }.$()).be.resolvedWith(1);
      });
      it('should successfully run function(...someArgs) {}', async () => {
        await should(function(a, b) {
          return a * b;
        }.$(3, 4)).be.resolvedWith(12);
      });
      it('should successfully run { ..., name() {},... }', async () => {
        const obj = {
          someName() {
            return 1;
          }
        };
        await should(obj.someName.$()).resolvedWith(1);
      });
      it('should successfully run { ..., name(...someArgs) {},... }', async () => {
        const obj = {
          someName(a, b) {
            return a / b;
          }
        };
        await should(obj.someName.$(12, 4)).resolvedWith(3);
      });
    });
    describe('async functions', () => {
      it('should successfully run async function name() {}', async () => {
        async function someName() {
          return 1;
        }

        await should(someName.$()).be.resolvedWith(1);
      });
      it('should successfully run async function name(...someArgs) {}', async () => {
        async function someName(a, b) {
          return a + b;
        }
        await should(someName.$(8, 4)).be.resolvedWith(12);
      });
      it('should successfully run async function() {}', async () => {
        await should(async function() {
          return 1;
        }.$()).be.resolvedWith(1);
      });
      it('should successfully run async function(...someArgs) {}', async () => {
        await should(async function(a, b) {
          return a / b;
        }.$(12, 4)).be.resolvedWith(3);
      });
      it('should successfully run { ..., async name() {},... }', async () => {
        const obj = {
          async someName() {
            return 1;
          }
        };
        await should(obj.someName.$()).resolvedWith(1);
      });
      it('should successfully run { ..., async name(...someArgs) {},... }', async () => {
        const obj = {
          async someName(a, b) {
            return a * b;
          }
        };
        await should(obj.someName.$(5, 4)).resolvedWith(20);
      });
    });
  });
  describe('arrow functions', () => {
    describe('sync functions', () => {
      it('should successfully run () => {}', async () => {
        const someName = () => {
          return 2;
        };

        await should(someName.$()).be.resolvedWith(2);
      });
      it('should successfully run (...someArgs) => {}', async () => {
        const someName = (a, b) => {
          return a - b;
        };

        await should(someName.$(12, 4)).be.resolvedWith(8);
      });
      it('should successfully run () =>', async () => {
        const someName = () => 2;
        await should(someName.$()).be.resolvedWith(2);
      });
      it('should successfully run (...someArgs) =>', async () => {
        const someName = (a, b) => a / b;
        await should(someName.$(12, 3)).be.resolvedWith(4);
      });
    });
    describe('async functions', () => {
      it('should successfully run async () => {}', async () => {
        const someName = async () => {
          return 2;
        };
        await should(someName.$()).be.resolvedWith(2);
      });
      it('should successfully run async (...someArgs) => {}', async () => {
        const someName = async (a, b) => {
          return a - b;
        };
        await should(someName.$(12, 4)).be.resolvedWith(8);
      });
      it('should successfully run async () =>', async () => {
        const someName = async () => 2;
        await should(someName.$()).be.resolvedWith(2);
      });
      it('should successfully run async (...someArgs) =>', async () => {
        const someName = async (a, b) => a / b;
        await should(someName.$(12, 3)).be.resolvedWith(4);
      });
    });
  });
});

