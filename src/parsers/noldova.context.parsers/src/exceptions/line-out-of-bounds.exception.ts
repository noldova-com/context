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

export class LineOutOfBoundsException extends ParserException {
  public readonly lineCount: number;
  public readonly lineIndex: number;

  public constructor(lineIndex: number, lineCount: number, options?: ExceptionOptions) {
    super(Resources.lineOutOfBounds(lineIndex, lineCount), options);

    this.lineIndex = lineIndex;
    this.lineCount = lineCount;
  }

  public static throwIfOutOfBounds(lineIndex: number, lineCount: number): void {
    if (!Number.isSafeInteger(lineIndex) || !Number.isSafeInteger(lineCount) || lineCount < 0 || lineIndex < 0 || lineIndex >= lineCount)
      throw new LineOutOfBoundsException(lineIndex, lineCount);
  }
}
