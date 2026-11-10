/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ClientTimers } from "@noldova/context.data.sql.postgresql/models/client/client-timers.js";

export class LiveTimers extends ClientTimers {
  public readonly live: Map<number, number> = new Map();

  public override setTimeout(callback: () => void, milliseconds: number): number {
    const id = super.setTimeout(() => {
      this.live.delete(id);
      callback();
    }, milliseconds);
    this.live.set(id, milliseconds);
    return id;
  }

  public override clearTimeout(id: number | null): void {
    if (!Object.isNull(id))
      this.live.delete(id);
    super.clearTimeout(id);
  }

  public count(milliseconds: number): number {
    return [...this.live.values()].filter(t => t === milliseconds).length;
  }
}
