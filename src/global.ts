import * as DoTryNs from './index.js';
import type {
  Failure as _Failure,
  Success as _Success,
  ErrValueTuple as _ErrValueTuple,
} from './index.js';

declare global {
  type Failure = _Failure;
  type Success<T> = _Success<T>;
  type ErrValueTuple<T> = _ErrValueTuple<T>;
  const doTry: typeof DoTryNs.default;
  const sage: typeof DoTryNs.safe;
  const success: typeof DoTryNs.success;
  const failure: typeof DoTryNs.failure;
}

const theGlobal: any = typeof window !== 'undefined' ? window : global;

theGlobal.doTry = DoTryNs.default;
theGlobal.safe = DoTryNs.safe;
theGlobal.success = DoTryNs.success;
theGlobal.failure = DoTryNs.failure;
