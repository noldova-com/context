/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Exception, type ExceptionOptions } from "@noldova/context.exceptions";

/**
 * Raised for the package's failures: the base of its exceptions.
 */
export declare class ThreadingException extends Exception {
  /**
   * Initializes the exception.
   *
   * @param message What failed, normally a `Resources` message.
   * @param options Optional options carrying the cause.
   */
  public constructor(message: string, options?: ExceptionOptions);
}

/**
 * Raised when an operation stops because its cancellation was requested.
 *
 * @example
 * ```ts
 * import { CancellationTokenSource, OperationCanceledException } from "@noldova/context.threading";
 *
 * const source = new CancellationTokenSource();
 * source.cancel();
 * try {
 *   source.token.throwIfCancellationRequested();
 * }
 * catch (exception) {
 *   exception instanceof OperationCanceledException; // true
 * }
 * ```
 */
export declare class OperationCanceledException extends ThreadingException {
  /**
   * The token whose cancellation stopped the operation, or `CancellationToken.none`.
   */
  public readonly cancellationToken: CancellationToken;

  /**
   * Initializes the exception.
   *
   * @param message What stopped; by default, that the operation was canceled.
   * @param cancellationToken The token whose cancellation stopped it; `CancellationToken.none` by default.
   * @param options Optional options carrying the cause.
   */
  public constructor(message?: string, cancellationToken?: CancellationToken, options?: ExceptionOptions);
}

/**
 * Raised by `CancellationTokenSource.cancel` when a registered callback throws.
 *
 * @remarks
 * Every callback still runs, and every error they threw is kept, even when only one failed.
 */
export declare class CancellationCallbacksFailedException extends ThreadingException {
  /**
   * What each failing callback threw, in the order the callbacks ran.
   */
  public readonly errors: readonly unknown[];

  /**
   * Initializes the exception.
   *
   * @param errors What each failing callback threw.
   */
  public constructor(errors: readonly unknown[]);
}

/**
 * A callback registered on a `CancellationToken`, which can be taken back before it runs.
 *
 * @example
 * ```ts
 * import { CancellationTokenSource } from "@noldova/context.threading";
 *
 * const source = new CancellationTokenSource();
 * {
 *   using registration = source.token.register(() => console.log("canceled"));
 * }
 * source.cancel(); // logs nothing: the registration was disposed
 * ```
 */
export declare class CancellationTokenRegistration implements Disposable {
  private constructor();

  /**
   * Takes the callback back.
   *
   * @returns `true` when the callback was taken back before it ran; `false` when it already ran,
   * was already taken back, or was never registered, as on `CancellationToken.none`.
   */
  public unregister(): boolean;

  /**
   * Takes the callback back, as `unregister` does.
   */
  public [Symbol.dispose](): void;
}

/**
 * Tells an operation whether its cancellation was requested.
 *
 * @remarks
 * A token only watches; its `CancellationTokenSource` cancels. So an operation that takes a token
 * can stop when asked, but can't cancel others that share it.
 *
 * @example
 * ```ts
 * import type { CancellationToken } from "@noldova/context.threading";
 *
 * function sum(values: readonly number[], token: CancellationToken): number {
 *   let sum = 0;
 *   for (const value of values) {
 *     token.throwIfCancellationRequested();
 *     sum += value;
 *   }
 *
 *   return sum;
 * }
 * ```
 */
export declare class CancellationToken {
  /**
   * A token that is never canceled, for an operation called without cancellation.
   */
  public static readonly none: CancellationToken;

  private constructor();

  /**
   * Whether the token's cancellation was requested.
   */
  public get isCancellationRequested(): boolean;

  /**
   * Whether the token can be canceled at all: `false` only for `CancellationToken.none`.
   */
  public get canBeCanceled(): boolean;

  /**
   * Registers a callback that runs when the token is canceled.
   *
   * @remarks
   * Callbacks run during `cancel`, the last registered first. A callback registered after the
   * cancellation runs at once, before `register` returns, even once the source is disposed.
   *
   * @param callback Runs once, when the token is canceled.
   * @returns The registration, which takes the callback back.
   */
  public register(callback: () => void): CancellationTokenRegistration;

  /**
   * Throws when the token's cancellation was requested.
   *
   * @throws OperationCanceledException When the cancellation was requested.
   */
  public throwIfCancellationRequested(): void;
}

/**
 * Cancels the operations that take its token.
 *
 * @example
 * ```ts
 * import { CancellationTokenSource } from "@noldova/context.threading";
 *
 * using source = new CancellationTokenSource();
 * source.token.register(() => console.log("canceled"));
 * source.cancel(); // logs "canceled"
 * source.token.isCancellationRequested; // true
 * ```
 */
/**
 * The timer a `CancellationTokenSource` arms for `cancelAfter`. A source uses the host's timer
 * by default; a test may pass its own to move time without waiting.
 *
 * @example
 * ```ts
 * import { CancellationTokenSource, type ITimer } from "@noldova/context.threading";
 *
 * class ManualTimer implements ITimer {
 *   public callback: (() => void) | undefined = undefined;
 *
 *   public setTimeout(callback: () => void): number {
 *     this.callback = callback;
 *
 *     return 1;
 *   }
 *
 *   public clearTimeout(): void {
 *     this.callback = undefined;
 *   }
 * }
 *
 * const timer = new ManualTimer();
 * const source = new CancellationTokenSource(timer);
 * source.cancelAfter(1000);
 * timer.callback?.();
 * source.isCancellationRequested; // true
 * ```
 */
export declare interface ITimer {
  /**
   * Arms a timer that calls the callback once, after the delay.
   *
   * @param callback The function to call when the timer fires.
   * @param delayMilliseconds The delay in milliseconds before the callback runs.
   * @returns The timer's id, which `clearTimeout` takes.
   */
  setTimeout(callback: () => void, delayMilliseconds: number): number;

  /**
   * Disarms a timer so its callback never runs; an id that is `undefined`, already fired or
   * already cleared is ignored.
   *
   * @param timer The id `setTimeout` returned, or `undefined`.
   */
  clearTimeout(timer: number | undefined): void;
}

export declare class CancellationTokenSource implements Disposable {
  /**
   * The token the source cancels.
   */
  public readonly token: CancellationToken;

  /**
   * Initializes a source that is not canceled.
   *
   * @param timer The timer `cancelAfter` arms; the host's timer when omitted.
   */
  public constructor(timer?: ITimer);

  /**
   * Whether the source was canceled.
   */
  public get isCancellationRequested(): boolean;

  /**
   * Creates a source that is canceled when any of the tokens is.
   *
   * @remarks
   * It is canceled at once when one of them already is. Dispose it to stop watching the tokens.
   *
   * @param tokens The tokens it follows.
   * @returns The linked source.
   * @example
   * ```ts
   * import { CancellationToken, CancellationTokenSource } from "@noldova/context.threading";
   *
   * function save(token: CancellationToken, shutdown: CancellationToken): void {
   *   using linked = CancellationTokenSource.createLinkedTokenSource(token, shutdown);
   *   linked.token.throwIfCancellationRequested();
   * }
   * ```
   */
  public static createLinkedTokenSource(...tokens: CancellationToken[]): CancellationTokenSource;

  /**
   * Cancels the token and runs its callbacks, the last registered first; a second call does
   * nothing.
   *
   * @remarks
   * A callback taken back by one that ran before it doesn't run.
   *
   * @throws InvalidOperationException When the source was disposed.
   * @throws CancellationCallbacksFailedException When a callback throws, with every error; every
   * callback runs either way.
   */
  public cancel(): void;

  /**
   * Cancels the source once the delay passes. A later call replaces the pending delay, `cancel`
   * and disposing the source clear it, and a canceled source ignores the call.
   *
   * @remarks
   * The cancellation runs from the timer, so a callback that throws there reaches the host as
   * an uncaught `CancellationCallbacksFailedException`. A pending delay keeps the process
   * running until it fires or is cleared.
   *
   * @param milliseconds The delay, an integer from 0 to 2147483647.
   * @throws ArgumentOutOfRangeException When the delay is negative, not an integer or above
   * 2147483647.
   * @throws InvalidOperationException When the source was disposed.
   * @example
   * ```ts
   * import { CancellationTokenSource } from "@noldova/context.threading";
   *
   * using source = new CancellationTokenSource();
   * source.cancelAfter(5000);
   * await fetchReportAsync(source.token); // stops once five seconds pass
   * ```
   */
  public cancelAfter(milliseconds: number): void;

  /**
   * Disposes the source: a linked source stops watching its tokens, a pending `cancelAfter` delay
   * is cleared, registered callbacks are dropped without running, and `cancel` and `cancelAfter`
   * throw from then on. A canceled source stays canceled,
   * so a callback registered later still runs at once.
   */
  public [Symbol.dispose](): void;
}
