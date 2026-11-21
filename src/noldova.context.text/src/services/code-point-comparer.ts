/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnicodeCodePointService } from "./unicode-code-point.service.js";

export class CodePointComparer {
  public static compare(left: string, right: string): number {
    const length = Math.min(left.length, right.length);
    let index = 0;
    while (index < length && left.charCodeAt(index) === right.charCodeAt(index))
      index += 1;

    if (index === length)
      return Math.sign(left.length - right.length);

    if (index > 0 && CodePointComparer.splitsAPair(left, right, index))
      index -= 1;

    return Math.sign(CodePointComparer.readCodePoint(left, index) - CodePointComparer.readCodePoint(right, index));
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

    return UnicodeCodePointService.combineSurrogates(unit, next);
  }
}
