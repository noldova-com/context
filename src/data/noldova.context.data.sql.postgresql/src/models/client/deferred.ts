/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Deferred<T> {
  public readonly promise: Promise<T>;
  private readonly resolver: (value: T) => void;
  private readonly rejecter: (error: unknown) => void;

  public constructor() {
    const { promise, resolve, reject } = Promise.withResolvers<T>();
    this.promise = promise;
    this.resolver = resolve;
    this.rejecter = reject;
  }

  public resolve(value: T): void {
    this.resolver(value);
  }

  public reject(error: unknown): void {
    this.rejecter(error);
  }
}
