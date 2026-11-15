/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The names of the two archives one npm pack call writes, in the order of the folders it was given.
export class PackedArchives {
  public readonly first: string;
  public readonly second: string;

  public constructor(first: string, second: string) {
    this.first = first;
    this.second = second;
  }
}
