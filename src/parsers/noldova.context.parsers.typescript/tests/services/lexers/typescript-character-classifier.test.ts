/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptCharacterClassifier } from "@noldova/context.parsers.typescript/services/lexers/typescript-character-classifier.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptCharacterClassifierTests {
  @TestData("\r", true)
  @TestData("\n", true)
  @TestData(" ", true)
  @TestData(" ", true)
  @TestData("", false)
  @TestData("\r\n", false)
  @TestData("\u0085", false)
  @TestData("text", false)
  @TestMethod
  public recognizesASingleLineTerminator(character: string, expected: boolean): void {
    Assert.areEqual(expected, TypeScriptCharacterClassifier.isLineTerminator(character));
  }

  @TestMethod
  public recognizesEveryWhitespaceCharacter(): void {
    const whitespace = "\t\n\v\f\r \u0085             ​    　﻿";

    for (const character of whitespace)
      Assert.isTrue(TypeScriptCharacterClassifier.isWhitespace(character));
  }

  @TestData("")
  @TestData("  ")
  @TestData("text")
  @TestData("‌")
  @TestMethod
  public rejectsWhatIsNotASingleWhitespaceCharacter(value: string): void {
    Assert.isFalse(TypeScriptCharacterClassifier.isWhitespace(value));
  }

  @TestData(0x24, true)
  @TestData(0x41, true)
  @TestData(0x5F, true)
  @TestData(0x03C0, true)
  @TestData(0x2EBF0, true)
  @TestData(0x30, false)
  @TestData(0x300, false)
  @TestData(0x200C, false)
  @TestData(0x1F600, false)
  @TestMethod
  public recognizesAnIdentifierStart(codePoint: number, expected: boolean): void {
    Assert.areEqual(expected, TypeScriptCharacterClassifier.isIdentifierStart(codePoint));
  }

  @TestData(0x24, true)
  @TestData(0x30, true)
  @TestData(0x41, true)
  @TestData(0x5F, true)
  @TestData(0x300, true)
  @TestData(0x200C, true)
  @TestData(0x200D, true)
  @TestData(0x2EBF0, true)
  @TestData(0x2D, false)
  @TestData(0x1F600, false)
  @TestData(Number.NaN, false)
  @TestMethod
  public recognizesAnIdentifierPart(codePoint: number, expected: boolean): void {
    Assert.areEqual(expected, TypeScriptCharacterClassifier.isIdentifierPart(codePoint));
  }
}
