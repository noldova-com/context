/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EcmaScriptLineTerminator, UnicodeCodePointService } from "@noldova/context.text";

import { Resources } from "../../resources.js";

export class TypeScriptCharacterClassifier {
  private static readonly LINE_TERMINATOR: EcmaScriptLineTerminator = new EcmaScriptLineTerminator();

  public static isLineTerminator(character: string): boolean {
    return TypeScriptCharacterClassifier.LINE_TERMINATOR.isLineTerminator(character);
  }

  public static isWhitespace(character: string): boolean {
    if (character.length !== 1)
      return false;

    return character === Resources.space
      || character === Resources.tab
      || character === Resources.verticalTab
      || character === Resources.formFeed
      || character === Resources.nonBreakingSpace
      || character === Resources.nextLine
      || character === Resources.oghamSpaceMark
      || character >= Resources.enQuad && character <= Resources.zeroWidthSpace
      || character === Resources.narrowNoBreakSpace
      || character === Resources.mathematicalSpace
      || character === Resources.ideographicSpace
      || character === Resources.byteOrderMark
      || TypeScriptCharacterClassifier.isLineTerminator(character);
  }

  public static isIdentifierStart(codePoint: number): boolean {
    return codePoint === Resources.dollarSignCodePoint
      || codePoint === Resources.underscoreCodePoint
      || UnicodeCodePointService.isIdentifierStart(codePoint);
  }

  public static isIdentifierPart(codePoint: number): boolean {
    return codePoint === Resources.dollarSignCodePoint
      || codePoint === Resources.underscoreCodePoint
      || UnicodeCodePointService.isIdentifierContinue(codePoint);
  }
}
