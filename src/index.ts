import { isPromise } from './isPromise.js';

export type Failure<E = unknown> = readonly [ok: false, error: E, undefined];
export type Success<T> = readonly [ok: true, error: undefined, value: T];
export type ErrValueTuple<T, E = unknown> = Failure<E> | Success<T>;

/** @since 3.0.0 */
export const success = <T>(value: T): Success<T> =>
  [true, undefined, value] as const;

/** @since 3.0.0 */
export const failure = <E>(err: E): Failure<E> =>
  [false, err, undefined] as const;

export const safe: {
  (promise: Promise<never>): Promise<readonly [false, unknown, never]>;
  <T>(promise: Promise<T>): Promise<ErrValueTuple<T>>;
} = <T>(promise: Promise<T>): any => promise.then(success, failure);

export const doTry: {
  (fn: () => never): readonly [false, unknown, never];
  (fn: () => Promise<never>): Promise<readonly [false, unknown, never]>;
  <T>(fn: () => Promise<T>): Promise<ErrValueTuple<T>>;
  <T>(fn: () => T): ErrValueTuple<T>;
} = <T>(fn: () => T | Promise<T>): any => {
  try {
    const result = fn();
    return isPromise(result) ? safe(result) : success(result);
  } catch (error) {
    return failure(error);
  }
};

export const isFailure = (result: ErrValueTuple<unknown>): result is Failure =>
  !result[0];

export const isSuccess = (
  result: ErrValueTuple<unknown>,
): result is Success<unknown> => result[0];

export default doTry;
