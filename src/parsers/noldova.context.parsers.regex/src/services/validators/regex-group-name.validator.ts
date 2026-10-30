/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { UnicodeCodePointService } from "@noldova/context.text";

import { Resources } from "../../resources.js";

export class RegexGroupNameValidator {
  public isValidCodePoint(codePoint: number, isFirst: boolean): boolean {
    return codePoint === Resources.dollarCodePoint
      || codePoint === Resources.underscoreCodePoint
      || (isFirst ? UnicodeCodePointService.isIdentifierStart(codePoint) : UnicodeCodePointService.isIdentifierContinue(codePoint));
  }
}
