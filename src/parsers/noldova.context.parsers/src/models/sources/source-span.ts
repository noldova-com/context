/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
export class SourceSpan {
  public readonly startOffset: number;
  public readonly length: number;
  public readonly endOffset: number;
  public readonly isEmpty: boolean;

  public constructor(startOffset: number, length: number) {
    this.startOffset = startOffset;
    this.length = length;
    this.endOffset = startOffset + length;
    this.isEmpty = length === 0;
  }
}
