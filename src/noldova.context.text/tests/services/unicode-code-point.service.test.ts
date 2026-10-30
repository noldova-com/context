/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { createHash } from "node:crypto";

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
import { UnicodeCodePointService } from "@noldova/context.text";

@TestClass
export class UnicodeCodePointServiceTests {
  @TestMethod
  public recognizesIdentifierStartCodePoints(): void {
    Assert.isTrue(UnicodeCodePointService.isIdentifierStart(0x41));
    Assert.isTrue(UnicodeCodePointService.isIdentifierStart(0x03C0));
    Assert.isTrue(UnicodeCodePointService.isIdentifierStart(0x20000));
    Assert.isTrue(UnicodeCodePointService.isIdentifierStart(0x2EBF0));
  }

  @TestMethod
  public rejectsNonStartCodePoints(): void {
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0x24));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0x30));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0x5F));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0x300));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0x200C));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0x1F600));
  }

  @TestMethod
  public honorsDiscontinuousUnicodeRanges(): void {
    Assert.isTrue(UnicodeCodePointService.isIdentifierStart(0xAA));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(0xAB));
    Assert.isTrue(UnicodeCodePointService.isIdentifierStart(0xB5));
  }

  @TestMethod
  public recognizesIdentifierContinueCodePoints(): void {
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x41));
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x30));
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x5F));
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x300));
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x200C));
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x200D));
    Assert.isTrue(UnicodeCodePointService.isIdentifierContinue(0x2EBF0));
  }

  @TestMethod
  public rejectsNonContinueCodePoints(): void {
    Assert.isFalse(UnicodeCodePointService.isIdentifierContinue(0x24));
    Assert.isFalse(UnicodeCodePointService.isIdentifierContinue(0x2D));
    Assert.isFalse(UnicodeCodePointService.isIdentifierContinue(0x1F600));
  }

  @TestMethod
  public rejectsInvalidNumericValues(): void {
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(Number.NaN));
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(-1));
    Assert.isFalse(UnicodeCodePointService.isIdentifierContinue(0x110000));
    Assert.isFalse(UnicodeCodePointService.isIdentifierContinue(0x41 + 0.5));
  }

  @TestMethod
  public recognizesLeadingSurrogateCodePoints(): void {
    Assert.isTrue(UnicodeCodePointService.isLeadingSurrogate(0xD800));
    Assert.isTrue(UnicodeCodePointService.isLeadingSurrogate(0xDBFF));
  }

  @TestMethod
  public rejectsNonLeadingSurrogateCodePoints(): void {
    Assert.isFalse(UnicodeCodePointService.isLeadingSurrogate(Number.NaN));
    Assert.isFalse(UnicodeCodePointService.isLeadingSurrogate(0xD7FF));
    Assert.isFalse(UnicodeCodePointService.isLeadingSurrogate(0xDC00));
    Assert.isFalse(UnicodeCodePointService.isLeadingSurrogate(0xD800 + 0.5));
  }

  @TestMethod
  public recognizesTrailingSurrogateCodePoints(): void {
    Assert.isTrue(UnicodeCodePointService.isTrailingSurrogate(0xDC00));
    Assert.isTrue(UnicodeCodePointService.isTrailingSurrogate(0xDFFF));
  }

  @TestMethod
  public rejectsNonTrailingSurrogateCodePoints(): void {
    Assert.isFalse(UnicodeCodePointService.isTrailingSurrogate(Number.NaN));
    Assert.isFalse(UnicodeCodePointService.isTrailingSurrogate(0xDBFF));
    Assert.isFalse(UnicodeCodePointService.isTrailingSurrogate(0xE000));
    Assert.isFalse(UnicodeCodePointService.isTrailingSurrogate(0xDC00 + 0.5));
  }

  @TestMethod
  @TestData(0x40, false, false)
  @TestData(0x41, true, true)
  @TestData(0x5A, true, true)
  @TestData(0x5B, false, false)
  @TestData(0xAA, true, true)
  @TestData(0xAB, false, false)
  @TestData(0xB5, true, true)
  @TestData(0x2EC, true, true)
  @TestData(0x2ED, false, false)
  @TestData(0x2EE, true, true)
  @TestData(0x1E4D0, true, true)
  @TestData(0x2EBEF, false, false)
  @TestData(0x2EBF0, true, true)
  @TestData(0x2EE5D, true, true)
  @TestData(0x2EE5E, false, false)
  @TestData(0x10D50, false, false)
  @TestData(0xE01EF, false, true)
  @TestData(0xE01F0, false, false)
  @TestData(0x10FFFF, false, false)
  public preservesRangeBoundariesStridesAndThePinnedProfile(value: number, isStart: boolean, isContinue: boolean): void {
    Assert.areEqual(isStart, UnicodeCodePointService.isIdentifierStart(value));
    Assert.areEqual(isContinue, UnicodeCodePointService.isIdentifierContinue(value));
  }

  @TestMethod
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  @TestData(-1)
  @TestData(0x110000)
  @TestData(0x41 + 0.5)
  public returnsFalseForInvalidNumericInputs(value: number): void {
    Assert.isFalse(UnicodeCodePointService.isIdentifierStart(value));
    Assert.isFalse(UnicodeCodePointService.isIdentifierContinue(value));
    Assert.isFalse(UnicodeCodePointService.isLeadingSurrogate(value));
    Assert.isFalse(UnicodeCodePointService.isTrailingSurrogate(value));
  }

  @TestMethod
  public matchesTheCompletePinnedIdentifierClassification(): void {
    const classifications = new Uint8Array(0x110000);
    for (let codePoint = 0; codePoint < classifications.length; codePoint++)
      classifications[codePoint] = (UnicodeCodePointService.isIdentifierStart(codePoint) ? 1 : 0) | (UnicodeCodePointService.isIdentifierContinue(codePoint) ? 2 : 0);

    const hash = createHash("sha256").update(classifications).digest("hex");
    Assert.areEqual("2e29e66da3c74de87b96dfcbd142146169a0dd3290a7c54ac94425fc3db2fa44", hash);
  }
}
