/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ClientTimers } from "@noldova/context.data.sql.postgresql/models/client/client-timers.js";

export class HoldingTimers extends ClientTimers {
  public readonly held: Map<number, () => void> = new Map();
  private readonly longest: number;
  private counter: number = 0;

  public constructor(longest: number) {
    super();
    this.longest = longest;
  }

  public override setTimeout(callback: () => void, milliseconds: number): number {
    if (milliseconds < this.longest)
      return super.setTimeout(callback, milliseconds);

    this.counter -= 1;
    this.held.set(this.counter, callback);
    return this.counter;
  }

  public override clearTimeout(id: number | null): void {
    if (Object.isNull(id) || !this.held.delete(id))
      super.clearTimeout(id);
  }

  public fire(): void {
    const callbacks = [...this.held.values()];
    this.held.clear();
    for (const callback of callbacks)
      callback();
  }
}
