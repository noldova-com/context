/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class DerElement {
  public readonly start: number;
  public readonly body: number;
  public readonly end: number;

  public constructor(start: number, body: number, end: number) {
    this.start = start;
    this.body = body;
    this.end = end;
  }
}
