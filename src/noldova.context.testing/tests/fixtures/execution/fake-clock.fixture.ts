/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import type { IClock } from "@noldova/context.testing";

// A clock whose time moves only when a test advances it or fires a timer. When it fires on the next turn, each timer also fires one loop turn
// after it is armed, unless it is cleared first: a test that settles at once clears its timeout in time, and one that never settles times out.
export class FakeClock implements IClock {
  private readonly dueTimes: Map<number, number>;
  private readonly callbacks: Map<number, () => void>;
  private readonly firesOnTheNextTurn: boolean;
  private time: number;
  private lastTimer: number;
  private timersToFire: ReadonlySet<number>;

  public constructor(firesOnTheNextTurn: boolean = false) {
    this.dueTimes = new Map();
    this.callbacks = new Map();
    this.firesOnTheNextTurn = firesOnTheNextTurn;
    this.time = 0;
    this.lastTimer = 0;
    this.timersToFire = new Set();
  }

  public get latestTimer(): number {
    return this.lastTimer;
  }

  public now(): number {
    return this.time;
  }

  public setTimeout(callback: () => void, delayMilliseconds: number): number {
    this.lastTimer++;
    const timer = this.lastTimer;
    this.dueTimes.set(timer, this.time + delayMilliseconds);
    this.callbacks.set(timer, callback);
    if (this.firesOnTheNextTurn || this.timersToFire.has(timer))
      setImmediate(() => this.fire(timer));

    return timer;
  }

  public clearTimeout(timer: number | undefined): void {
    if (Object.isUndefined(timer))
      return;

    this.dueTimes.delete(timer);
    this.callbacks.delete(timer);
  }

  public fireOnceArmed(...timers: readonly number[]): void {
    this.timersToFire = new Set(timers);
  }

  public advance(milliseconds: number): void {
    const end = this.time + milliseconds;
    for (let timer = this.findDue(end); !Object.isUndefined(timer); timer = this.findDue(end))
      this.fire(timer);

    this.time = end;
  }

  public fire(timer: number): void {
    const dueTime = this.dueTimes.get(timer);
    const callback = this.callbacks.get(timer);
    if (Object.isUndefined(dueTime) || Object.isUndefined(callback))
      return;

    this.clearTimeout(timer);
    this.time = Math.max(this.time, dueTime);
    callback();
  }

  private findDue(end: number): number | undefined {
    let due: number | undefined;
    let earliest = end;
    for (const [timer, dueTime] of this.dueTimes)
      if (dueTime <= earliest && (Object.isUndefined(due) || dueTime < earliest)) {
        due = timer;
        earliest = dueTime;
      }

    return due;
  }
}
