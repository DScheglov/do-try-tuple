# do-try-tuple [![Coverage Status](https://coveralls.io/repos/github/DScheglov/do-try-tuple/badge.svg?branch=main)](https://coveralls.io/github/DScheglov/do-try-tuple?branch=main) [![npm version](https://img.shields.io/npm/v/do-try-tuple.svg?style=flat-square)](https://www.npmjs.com/package/do-try-tuple) [![npm downloads](https://img.shields.io/npm/dm/do-try-tuple.svg?style=flat-square)](https://www.npmjs.com/package/do-try-tuple) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DScheglov/do-try-tuple/blob/master/LICENSE)

Catches errors and rejected promises, returns tuple with error and value.

- [Installation](#installation)
- [Usage](#usage)
- [Async Usage](#async-usage)
- [API](#api)
  - [`doTry` function](#dotry-function)
  - [`safe` promise wrapper](#safe-promise-wrapper)
  - [`Failure` type](#failure-type)
  - [`Success` type](#success-type)
  - [`ErrValueTuple` type](#errvaluetuple-type)
  - [`failure` and `success` factory functions](#failure-and-success-factory-functions)
  - [`isFailure` and `isSuccess` type guards](#isfailure-and-issuccess-type-guards)
- [Using `doTry().then()`](#using-dotrythen)

## Installation

```bash
npm install do-try-tuple
```

## Usage

```typescript
import doTry from 'do-try-tuple';

function div(a: number, b: number): number {
  if (b !== 0) return a / b;
  if (a !== 0) throw new Error(`Division by Zero`);
  throw new Error('Indeterminate Form');
}

const [isDivOk, errX, x] = doTry(() => div(4, 2));

if (isDivOk) {
  const doubleX = x * 2;
  console.log('doubleX:', doubleX);
}
```

## Async Usage

```typescript
import doTry from 'do-try-tuple';

const [areUsersFetched, error, users] = await doTry(() => fetchUsers());

if (!areUsersFetched) {
  console.error('Failed to fetch users:', error);
} else {
  console.log('Users:', users);
}
```

or

```typescript
import { safe } from 'do-try-tuple';

const [areUsersFetched, error, users] = await safe(fetchUsers());

if (!areUsersFetched) {
  console.error('Failed to fetch users:', error);
} else {
  console.log('Users:', users);
}
```

## API

The library exports:

- `doTry` function (default export)
- `safe` promise wrapper to make it resolving to `ErrValueTuple`
- `Failure`, `Success` and `ErrValueTuple` types
- `failure` and `success` factory functions
- `isFailure` and `isSuccess` type guards

### `doTry` function

takes a function that may throw an error or return a promise that may be rejected.

```typescript
function (fn: () => never): readonly [false, unknown, never];
function (fn: () => Promise<never>): Promise<readonly [false, unknown, never]>;
function <T>(fn: () => Promise<T>): Promise<ErrValueTuple<T>>;
function <T>(fn: () => T): ErrValueTuple<T>;
```

### `safe` promise wrapper

is a function that wraps a promise and makes it resolving to `ErrValueTuple`:

```typescript
function safe<T>(promise: Promise<T>): Promise<ErrValueTuple<T>>;
```

It could be useful when you need to handle the promise rejection synchronously:

```typescript
import { safe } from 'do-try-tuple';

const [areUsersFatched, error, users] = await safe(fetchUsers());
```

### `Failure` type

is a tuple representing the error case:

```typescript
export type Failure<E = unknown> = readonly [ok: false, error: E, value: undefined];
```

The library respects the same motivation as caused introduction
[useUnknownInCatchVariables](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables)
compiler option in TypeScript:

### `Success` type

is a tuple representing the success case:

```typescript
export type Success<T> = readonly [ok: true, error: undefined, value: T];
```

### `ErrValueTuple` type

is a union of `Failure<E>` and `Success<T>`.

```typescript
export type ErrValueTuple<T, E = unknown> = Failure<E> | Success<T>;
```

### `failure` and `success` factory functions

These functions allow to create `ErrValueTuple` instances:

```typescript
export function failure<E>(error: E): Failure<E>;
export function success<T>(value: T): Success<T>;
```

It could be useful in tests:

```typescript
import { success, failure } from 'do-try-tuple';

test('div', () => {
  expect(doTry(() => div(4, 2))).toEqual(success(2));
  expect(doTry(() => div(4, 0))).toEqual(failure(new Error('Division by Zero')));
  expect(doTry(() => div(0, 0))).toEqual(failure(new Error('Indeterminate Form')));
});
```

### `isFailure` and `isSuccess` type guards

These functions allow to check if the value is `Failure` or `Success`:

```typescript
export function isFailure(value: ErrValueTuple<unknown>): value is Failure;
export function isSuccess(value: ErrValueTuple<unknown>): value is Success<unknown>;
```

It allows to check the result and narrow the type without destructuring:

```typescript

class DivError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DivError';
  }
}

function divWithTypeError(a: number, b: number): ErrValueTuple<number, DivError> {
  const result = doTry(() => div(a, b));

  if (isSuccess(result)) return result;
  return failure(new DivError('Failed to divide'));
}
```


## Using `doTry().then()`

You can map the result of `doTry` applied to function returning a promise using `then` method:

```typescript
import doTry from 'do-try-tuple';

const [error, users] = await doTry(() => fetchUsers()).then(
  ([err, users]) => [err && new SomeCustomError(err), users] as const,
);
```

However, consider that functions returning promises can throw error synchronously:

```typescript
const fetchUsers = (): Promise<string[]> => {
  if (Math.random() < 0.5) throw new Error('Failed to fetch users');
  return Promise.resolve(['Alice', 'Bob', 'Charlie']);
};
```

So, the `doTry` in this case returns an `ErrValueTuple` synchronously, and the
attempt to call `then` method on it will throw an error:
`TypeError: doTry(...).then is not a function`.

To handle this case, just add `async` keyword before `fn` argument:

```typescript
const [error, users] = await doTry(async () => fetchUsers()).then(
  ([err, users]) => [err && new SomeCustomError(err), users] as const,
);
```

So, use

```typescript
// CORRECT                       _____
const [err, value] = await doTry(async () => someFn(...))
  .then(([err, value]) => {
    // handle err and value
  });
```

instead of

```typescript
// WRONG                         ___________
const [err, value] = await doTry(/* async */() => someFn(...))
  .then(([err, value]) => {
    // handle err and value
  });
```

The same is relevant for any other method of `Promise` class, like `catch`, `finally`, etc.
