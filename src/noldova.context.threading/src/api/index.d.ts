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
export declare class CancellationTokenSource implements Disposable {
  /**
   * The token the source cancels.
   */
  public readonly token: CancellationToken;

  /**
   * Initializes a source that is not canceled.
   */
  public constructor();

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
   * Disposes the source: a linked source stops watching its tokens, registered callbacks are
   * dropped without running, and `cancel` throws from then on. A canceled source stays canceled,
   * so a callback registered later still runs at once.
   */
  public [Symbol.dispose](): void;
}
