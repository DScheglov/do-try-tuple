export const isPromise = (value: unknown): value is PromiseLike<unknown> =>
  value != null && typeof (value as any).then === 'function';
