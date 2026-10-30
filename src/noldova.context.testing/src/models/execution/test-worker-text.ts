/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class TestWorkerText {
  public readonly text: string;

  public constructor(text: string) {
    this.text = text;
  }

  public toString(): string {
    return this.text;
  }
}
