/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnicodeCodePointService } from "./unicode-code-point.service.js";

export class CodePointOrderService {
  private static readonly MINIMUM_LEADING_SURROGATE: number = 0xD800;
  private static readonly MINIMUM_SUPPLEMENTARY_CODE_POINT: number = 0x10000;
  private static readonly MINIMUM_TRAILING_SURROGATE: number = 0xDC00;
  private static readonly SURROGATE_RANGE_SIZE: number = 0x400;

  public static compare(left: string, right: string): number {
    const length = Math.min(left.length, right.length);
    let index = 0;
    while (index < length && left.charCodeAt(index) === right.charCodeAt(index))
      index += 1;

    if (index === length)
      return Math.sign(left.length - right.length);

    if (index > 0 && CodePointOrderService.splitsAPair(left, right, index))
      index -= 1;

    return Math.sign(CodePointOrderService.readCodePoint(left, index) - CodePointOrderService.readCodePoint(right, index));
  }

  private static splitsAPair(left: string, right: string, index: number): boolean {
    return UnicodeCodePointService.isLeadingSurrogate(left.charCodeAt(index - 1))
      && (UnicodeCodePointService.isTrailingSurrogate(left.charCodeAt(index)) || UnicodeCodePointService.isTrailingSurrogate(right.charCodeAt(index)));
  }

  private static readCodePoint(text: string, index: number): number {
    const unit = text.charCodeAt(index);
    const next = text.charCodeAt(index + 1);
    if (!UnicodeCodePointService.isLeadingSurrogate(unit) || !UnicodeCodePointService.isTrailingSurrogate(next))
      return unit;

    return CodePointOrderService.MINIMUM_SUPPLEMENTARY_CODE_POINT
      + (unit - CodePointOrderService.MINIMUM_LEADING_SURROGATE) * CodePointOrderService.SURROGATE_RANGE_SIZE
      + next - CodePointOrderService.MINIMUM_TRAILING_SURROGATE;
  }
}
