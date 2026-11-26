/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";

export class CancellationTokenRegistration implements Disposable {
  private readonly registrations: Map<CancellationTokenRegistration, () => void> | null;

  public constructor(registrations: Map<CancellationTokenRegistration, () => void> | null) {
    this.registrations = registrations;
  }

  public unregister(): boolean {
    return !Object.isNull(this.registrations) && this.registrations.delete(this);
  }

  public [Symbol.dispose](): void {
    this.unregister();
  }
}
