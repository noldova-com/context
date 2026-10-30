/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ExceptionOptions } from "@noldova/context.exceptions";

import { Resources } from "../resources.js";
import { ParserException } from "./parser.exception.js";

export class InvalidSpanException extends ParserException {
  public readonly length: number;
  public readonly sourceLength: number;
  public readonly startOffset: number;

  public constructor(startOffset: number, length: number, sourceLength: number, options?: ExceptionOptions) {
    super(Resources.invalidSpan(startOffset, length, sourceLength), options);

    this.startOffset = startOffset;
    this.length = length;
    this.sourceLength = sourceLength;
  }

  public static throwIfInvalid(startOffset: number, length: number, sourceLength: number): void {
    const endOffset = startOffset + length;
    if (!Number.isSafeInteger(startOffset)
      || !Number.isSafeInteger(length)
      || !Number.isSafeInteger(sourceLength)
      || !Number.isSafeInteger(endOffset)
      || startOffset < 0
      || length < 0
      || sourceLength < 0
      || endOffset > sourceLength)
      throw new InvalidSpanException(startOffset, length, sourceLength);
  }
}
