/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InvalidOperationException } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";

export class ChangeCounter {
  private count: number = 0;

  public get value(): number {
    return this.count;
  }

  public increment(): void {
    this.count++;
  }

  public throwIfChangedSince(value: number): void {
    if (this.count !== value)
      throw new InvalidOperationException(Resources.collectionModified);
  }
}
