import { describe, expect, it } from '@jest/globals';
import { Expect, Equal } from '@type-challenges/utils';
import doTry, {
  Failure,
  failure,
  isFailure,
  isSuccess,
  safe,
  Success,
  success,
  type ErrValueTuple,
} from './index';

describe('doTry', () => {
  it('handles synchronous functions', () => {
    const fn = () => 42;
    const result: ErrValueTuple<number> = doTry(fn);
    expect(result).toEqual([true, undefined, 42]);
  });

  it('correctly types the result of synchronous functions', () => {
    const result = doTry(() => 42);
    const check: Expect<Equal<typeof result, ErrValueTuple<number>>> = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the result of synchronous functions that never returns', () => {
    const result = doTry(() => {
      throw new Error('Something went wrong');
    });
    const check: Expect<
      Equal<typeof result, Readonly<[false, unknown, never]>>
    > = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the [ok, error, value] of synchronous functions that never returns', () => {
    const [ok, error, value] = doTry(() => {
      throw new Error('Something went wrong');
    });
    const checkErr: Expect<Equal<typeof error, unknown>> = true;
    const checkValue: Expect<Equal<typeof value, never>> = true;

    expect(ok).toBeFalsy();
    expect(checkErr).toBeTruthy();
    expect(checkValue).toBeTruthy();
  });

  it('correctly types the result of asynchronous functions that never returns', () => {
    const result = doTry(async () => {
      throw new Error('Something went wrong');
    });
    const check: Expect<
      Equal<typeof result, Promise<Readonly<[false, unknown, never]>>>
    > = true;
    expect(check).toBeTruthy();
  });

  it('correctly types the [ok, error, value] of asynchronous functions that never returns', async () => {
    expect.assertions(3);

    const [ok, error, value] = await doTry(async () => {
      throw new Error('Something went wrong');
    });

    const checkErr: Expect<Equal<typeof error, unknown>> = true;
    const checkValue: Expect<Equal<typeof value, never>> = true;

    expect(ok).toBeFalsy();
    expect(checkErr).toBeTruthy();
    expect(checkValue).toBeTruthy();
  });

  it('correctly discriminates the result of synchronous functions (ok case)', () => {
    expect.assertions(2);
    const [ok, error, value] = doTry(() => 42);

    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof error, unknown>> = true;
    } else {
      const check: Expect<Equal<typeof value, number>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      const check: Expect<Equal<typeof value, number>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('correctly discriminates the result of synchronous functions (error case)', () => {
    expect.assertions(2);
    const [ok, error, value] = doTry((): number => {
      throw new Error('Something went wrong');
    });

    if (!ok) {
      const check: Expect<Equal<typeof error, unknown>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof value, number>> = true;
    } else {
      const check: Expect<Equal<typeof error, unknown>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('correctly discriminates the result when function intentionally returns undefined', () => {
    expect.assertions(2);
    const [ok, error, value] = doTry(() => undefined);

    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof error, unknown>> = true;
    } else {
      const check: Expect<Equal<typeof value, undefined>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      const check: Expect<Equal<typeof value, undefined>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('correctly discriminates the result when function intentionally returns T | undefined', () => {
    expect.assertions(2);
    const [ok, error, value] = doTry((): number | undefined => 42);

    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const check: Expect<Equal<typeof error, unknown>> = true;
    } else {
      const check: Expect<Equal<typeof value, number | undefined>> = true;
      expect(check).toBeTruthy();
    }

    if (ok) {
      const check: Expect<Equal<typeof value, number | undefined>> = true;
      expect(check).toBeTruthy();
    }
  });

  it('handles synchronous functions that throw an error', () => {
    const fn = (): number => {
      throw new Error('Something went wrong');
    };
    const result: ErrValueTuple<number> = doTry(fn);
    expect(result[0]).toBeFalsy();
    expect(result[1]).toBeInstanceOf(Error);
    expect(result[2]).toBeUndefined();
  });

  it('handles asynchronous functions', async () => {
    const fn = async () => {
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(42);
        }, 0);
      });
    };
    const result: Promise<ErrValueTuple<number>> = doTry(fn);
    await expect(result).resolves.toEqual([true, undefined, 42]);
  });

  it('handles asynchronous functions that reject', async () => {
    const fn = async () => {
      return new Promise<number>((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Something went wrong'));
        }, 0);
      });
    };
    const result: Promise<ErrValueTuple<number>> = doTry(fn);
    await expect(result).resolves.toEqual([
      false,
      new Error('Something went wrong'),
      undefined,
    ]);
  });

  it('returns an Error if not a function passed as argument', () => {
    const [ok, error]: ErrValueTuple<unknown> = doTry('not a function' as any);
    expect(ok).toBeFalsy();
    expect(error).toEqual(new Error('fn is not a function'));
  });

  it('works for example', () => {
    expect.assertions(1);

    function div(a: number, b: number): number {
      if (b !== 0) return a / b;
      if (a !== 0) throw new Error(`Division by Zero`);
      throw new Error('Indeterminate Form');
    }

    const [ok, , x] = doTry(() => div(4, 2));

    if (ok) {
      const doubleX = x * 2;
      expect(doubleX).toBe(4);
    }
  });

  it('does not require discriminating the error if function never returns', () => {
    const [ok, error, value] = doTry(() => {
      throw new Error('Something went wrong');
    });

    const checkOk: Expect<Equal<typeof ok, false>> = true;
    expect(checkOk).toBeTruthy();

    const checkErr: Expect<Equal<typeof error, unknown>> = true;
    expect(checkErr).toBeTruthy();

    const checkValue: Expect<Equal<typeof value, never>> = true;
    expect(checkValue).toBeTruthy();
  });

  it('fails to call then if function returning promise throws', () => {
    const fn = (): Promise<number> => {
      throw new Error('Something went wrong');
    };

    expect(() =>
      doTry(fn).then(([, error, value]) => [
        error && TypeError((error as any).message),
        value,
      ]),
    ).toThrowError();
  });

  it('is possible to call then if function returning promise throws using async', async () => {
    const fn = (): Promise<number> => {
      throw new Error('Something went wrong');
    };

    const [error] = await doTry(async () => fn()).then(
      ([, error, value]) =>
        [error && TypeError((error as any).message), value] as const,
    );

    expect(error).toEqual(new TypeError('Something went wrong'));
  });
});

describe('safe', () => {
  it('makes promise to resolve with ErrValueTuple when it resolves', async () => {
    expect.assertions(1);
    const result = await safe(Promise.resolve(42));

    expect(result).toEqual([true, undefined, 42]);
  });

  it('returns a correctly typed promise, when it resolves', async () => {
    expect.assertions(1);
    const promise = safe(Promise.resolve(42));

    const check: Expect<Equal<typeof promise, Promise<ErrValueTuple<number>>>> =
      true;
    expect(check).toBeTruthy();

    await promise;
  });

  it('makes promise to resolve with ErrValueTuple when it rejects', async () => {
    expect.assertions(1);
    const result = await safe(
      Promise.reject(new Error('Something went wrong')),
    );

    expect(result).toEqual([
      false,
      new Error('Something went wrong'),
      undefined,
    ]);
  });

  it('returns a correctly typed promise, when it only rejects', async () => {
    expect.assertions(1);
    const promise = safe(Promise.reject(new Error('Something went wrong')));

    const check: Expect<
      Equal<typeof promise, Promise<readonly [false, unknown, never]>>
    > = true;
    expect(check).toBeTruthy();

    await promise;
  });

  it('returns a correctly typed promise, when it only rejects', async () => {
    expect.assertions(1);
    const promise = safe(
      Promise.reject<number>(new Error('Something went wrong')),
    );

    const check: Expect<Equal<typeof promise, Promise<ErrValueTuple<number>>>> =
      true;
    expect(check).toBeTruthy();

    await promise;
  });

  it('example:div', () => {
    function div(a: number, b: number): number {
      if (b !== 0) return a / b;
      if (a !== 0) throw new Error(`Division by Zero`);
      throw new Error('Indeterminate Form');
    }

    expect(doTry(() => div(4, 2))).toEqual(success(2));

    expect(doTry(() => div(4, 0))).toEqual(
      failure(new Error('Division by Zero')),
    );

    expect(doTry(() => div(0, 0))).toEqual(
      failure(new Error('Indeterminate Form')),
    );
  });

  it('example:div typed ErrValueTuple', () => {
    function div(a: number, b: number): number {
      if (b !== 0) return a / b;
      if (a !== 0) throw new Error(`Division by Zero`);
      throw new Error('Indeterminate Form');
    }
    class DivError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'DivError';
      }
    }

    function divWithTypeError(
      a: number,
      b: number,
    ): ErrValueTuple<number, DivError> {
      const result = doTry(() => div(a, b));

      if (isSuccess(result)) return result;
      return failure(new DivError('Failed to divide'));
    }

    const result = divWithTypeError(4, 2);
    const check: Expect<Equal<typeof result, ErrValueTuple<number, DivError>>> =
      true;
    expect(check).toBeTruthy();
    expect(result).toEqual(success(2));
  });

  describe('isFailure', () => {
    it('returns true for a Failure tuple', () => {
      const result = isFailure([
        false,
        new Error('Something went wrong'),
        undefined,
      ] as ErrValueTuple<number>);
      expect(result).toBe(true);
    });

    it('narrows ErrValueTuple to Failure', () => {
      expect.assertions(1);
      const result: ErrValueTuple<number> = [
        false,
        new Error('Something went wrong'),
        undefined,
      ];

      if (isFailure(result)) {
        const checkResult: Expect<Equal<typeof result, Failure>> = true;
        expect(checkResult).toBeTruthy();
      }
    });

    it('returns false for a Success tuple', () => {
      const result = isFailure([true, undefined, 42] as ErrValueTuple<number>);
      expect(result).toBe(false);
    });
  });

  describe('isSuccess', () => {
    it('returns true for a Success tuple', () => {
      const result = isSuccess([true, undefined, 42] as ErrValueTuple<number>);
      expect(result).toBe(true);
    });

    it('narrows ErrValueTuple to Success', () => {
      expect.assertions(1);
      const result: ErrValueTuple<number> = [true, undefined, 42];

      if (isSuccess(result)) {
        const checkResult: Expect<Equal<typeof result, Success<number>>> = true;
        expect(checkResult).toBeTruthy();
      }
    });

    it('returns false for a Failure tuple', () => {
      const result = isSuccess([
        false,
        new Error('Something went wrong'),
        undefined,
      ] as ErrValueTuple<number>);
      expect(result).toBe(false);
    });
  });
});
