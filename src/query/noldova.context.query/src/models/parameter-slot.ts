/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ParameterSlot {
  public readonly depth: number;
  public readonly index: number;

  public constructor(depth: number, index: number) {
    this.depth = depth;
    this.index = index;
  }
}
