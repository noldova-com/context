/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { ClientTimers } from "@noldova/context.data.sql.postgresql/models/client/client-timers.js";

export class FakeTimers extends ClientTimers {
  public readonly unreferenced: number[] = [];
  private readonly callbacks: Map<number, () => void> = new Map();
  private readonly dues: Map<number, number> = new Map();
  private readonly ticks: (() => void)[] = [];
  private clock: number = 0;
  private counter: number = 1;

  public get scheduled(): number {
    return this.callbacks.size;
  }

  public override setTimeout(callback: () => void, milliseconds: number): number {
    const id = this.counter;
    this.counter += 1;
    this.callbacks.set(id, callback);
    this.dues.set(id, this.clock + milliseconds);
    return id;
  }

  public override clearTimeout(id: number | null): void {
    if (Object.isNull(id))
      return;

    this.callbacks.delete(id);
    this.dues.delete(id);
  }

  public override unref(id: number): void {
    this.unreferenced.push(id);
  }

  public override readTime(): number {
    return this.clock;
  }

  public override nextTick(callback: () => void): void {
    this.ticks.push(callback);
  }

  public tick(): void {
    for (let next = this.ticks.shift(); !Object.isUndefined(next); next = this.ticks.shift())
      next();
  }

  public advance(milliseconds: number): void {
    this.clock += milliseconds;
    const due = [...this.dues].filter(([, at]) => at <= this.clock).sort(([, first], [, second]) => first - second);
    for (const [id] of due) {
      const callback = this.callbacks.get(id);
      this.clearTimeout(id);
      callback?.();
    }
    this.tick();
  }
}
