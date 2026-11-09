/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { performance } from "node:perf_hooks";
import { nextTick } from "node:process";
import { clearTimeout, setTimeout } from "node:timers";

import "@noldova/context.core";

export class ClientTimers {
  private readonly handles: Map<number, ReturnType<typeof setTimeout>> = new Map();
  private next: number = 1;

  public setTimeout(callback: () => void, milliseconds: number): number {
    const id = this.next;
    this.next += 1;
    this.handles.set(id, setTimeout(() => {
      this.handles.delete(id);
      callback();
    }, milliseconds));
    return id;
  }

  public clearTimeout(id: number | null): void {
    if (Object.isNull(id))
      return;

    const handle = this.handles.get(id);
    if (Object.isUndefined(handle))
      return;

    clearTimeout(handle);
    this.handles.delete(id);
  }

  public unref(id: number): void {
    this.handles.get(id)?.unref();
  }

  public readTime(): number {
    return performance.now();
  }

  public nextTick(callback: () => void): void {
    nextTick(callback);
  }
}
