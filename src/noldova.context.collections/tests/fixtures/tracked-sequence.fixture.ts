/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class TrackedSequence implements Iterable<number> {
  private readonly values: readonly number[];
  private wasClosed: boolean = false;

  public constructor(values: readonly number[]) {
    this.values = values;
  }

  public get closed(): boolean {
    return this.wasClosed;
  }

  public *[Symbol.iterator](): Generator<number> {
    try {
      yield* this.values;
    }
    finally {
      this.wasClosed = true;
    }
  }
}
