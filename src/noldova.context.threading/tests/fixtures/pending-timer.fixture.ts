/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class PendingTimer {
  public readonly callback: () => void;
  public readonly due: number;

  public constructor(callback: () => void, due: number) {
    this.callback = callback;
    this.due = due;
  }
}
