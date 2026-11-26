/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { InvalidOperationException } from "@noldova/context.exceptions";

import { CancellationCallbacksFailedException } from "../exceptions/cancellation-callbacks-failed.exception.js";
import { Resources } from "../resources.js";
import { CancellationToken } from "./cancellation-token.js";
import { CancellationTokenRegistration } from "./cancellation-token-registration.js";

export class CancellationTokenSource implements Disposable {
  public readonly token: CancellationToken;
  private readonly registrations: Map<CancellationTokenRegistration, () => void> = new Map<CancellationTokenRegistration, () => void>();
  private readonly links: CancellationTokenRegistration[] = [];
  private isCanceled: boolean = false;
  private isDisposed: boolean = false;

  public constructor() {
    this.token = new CancellationToken(this);
  }

  public get isCancellationRequested(): boolean {
    return this.isCanceled;
  }

  public static createLinkedTokenSource(...tokens: CancellationToken[]): CancellationTokenSource {
    const linked = new CancellationTokenSource();
    for (const token of tokens)
      linked.links.push(token.register(() => linked.cancel()));

    return linked;
  }

  public cancel(): void {
    if (this.isDisposed)
      throw new InvalidOperationException(Resources.sourceDisposed);
    if (this.isCanceled)
      return;

    this.isCanceled = true;
    const errors: unknown[] = [];
    for (const registration of [...this.registrations.keys()].reverse()) {
      const callback = this.registrations.get(registration);
      if (Object.isUndefined(callback))
        continue;

      this.registrations.delete(registration);
      try {
        callback();
      }
      catch (exception) {
        errors.push(exception);
      }
    }

    if (errors.length > 0)
      throw new CancellationCallbacksFailedException(errors);
  }

  public register(callback: () => void): CancellationTokenRegistration {
    if (this.isCanceled) {
      callback();
      return new CancellationTokenRegistration(null);
    }
    if (this.isDisposed)
      return new CancellationTokenRegistration(null);

    const registration = new CancellationTokenRegistration(this.registrations);
    this.registrations.set(registration, callback);

    return registration;
  }

  public [Symbol.dispose](): void {
    this.isDisposed = true;
    for (const link of this.links)
      link.unregister();
    this.registrations.clear();
  }
}
