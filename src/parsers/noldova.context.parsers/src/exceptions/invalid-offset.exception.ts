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

export class InvalidOffsetException extends ParserException {
  public readonly maximumOffset: number;
  public readonly minimumOffset: number;
  public readonly offset: number;

  public constructor(offset: number, minimumOffset: number, maximumOffset: number, options?: ExceptionOptions) {
    super(Resources.invalidOffset(offset, minimumOffset, maximumOffset), options);

    this.offset = offset;
    this.minimumOffset = minimumOffset;
    this.maximumOffset = maximumOffset;
  }

  public static throwIfOutsideRange(offset: number, minimumOffset: number, maximumOffset: number): void {
    if (!Number.isSafeInteger(offset)
      || !Number.isSafeInteger(minimumOffset)
      || !Number.isSafeInteger(maximumOffset)
      || minimumOffset < 0
      || maximumOffset < minimumOffset
      || offset < minimumOffset
      || offset > maximumOffset)
      throw new InvalidOffsetException(offset, minimumOffset, maximumOffset);
  }
}
