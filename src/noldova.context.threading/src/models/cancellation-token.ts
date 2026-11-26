/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

import { OperationCanceledException } from "../exceptions/operation-canceled.exception.js";
import { Resources } from "../resources.js";
import { CancellationTokenRegistration } from "./cancellation-token-registration.js";
import type { CancellationTokenSource } from "./cancellation-token-source.js";

export class CancellationToken {
  public static readonly none: CancellationToken = new CancellationToken(null);
  private readonly source: CancellationTokenSource | null;

  public constructor(source: CancellationTokenSource | null) {
    this.source = source;
  }

  public get isCancellationRequested(): boolean {
    return !Object.isNull(this.source) && this.source.isCancellationRequested;
  }

  public get canBeCanceled(): boolean {
    return !Object.isNull(this.source);
  }

  public register(callback: () => void): CancellationTokenRegistration {
    return Object.isNull(this.source) ? new CancellationTokenRegistration(null) : this.source.register(callback);
  }

  public throwIfCancellationRequested(): void {
    if (this.isCancellationRequested)
      throw new OperationCanceledException(Resources.operationCanceled, this);
  }
}
