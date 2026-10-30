/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";
import { EcmaScriptLineTerminator, LineTerminator } from "@noldova/context.text";

@TestClass
export class EcmaScriptLineTerminatorTests {
  private readonly lineTerminator: EcmaScriptLineTerminator = new EcmaScriptLineTerminator();

  @TestMethod
  public recognizesEveryLineTerminator(): void {
    Assert.areEqual(1, this.lineTerminator.getLength("\n", 0));
    Assert.areEqual(1, this.lineTerminator.getLength("\r", 0));
    Assert.areEqual(2, this.lineTerminator.getLength("\r\n", 0));
    Assert.areEqual(1, this.lineTerminator.getLength("\u2028", 0));
    Assert.areEqual(1, this.lineTerminator.getLength("\u2029", 0));
  }

  @TestMethod
  public returnsZeroForOrdinaryTextAndEndOfString(): void {
    Assert.areEqual(0, this.lineTerminator.getLength("text", 0));
    Assert.areEqual(0, this.lineTerminator.getLength("text", 4));
    Assert.areEqual(0, this.lineTerminator.getLength("\u0085", 0));
  }

  @TestMethod
  public rejectsAnInvalidIndex(): void {
    Assert.throws(() => this.lineTerminator.getLength("text", -1), ArgumentOutOfRangeException);
    Assert.throws(() => this.lineTerminator.getLength("text", 5), ArgumentOutOfRangeException);
    Assert.throws(() => this.lineTerminator.getLength("text", 0.5), ArgumentOutOfRangeException);
  }

  @TestMethod
  public classifiesSingleLineTerminatorCodeUnits(): void {
    Assert.isTrue(this.lineTerminator.isLineTerminator("\r"));
    Assert.isTrue(this.lineTerminator.isLineTerminator("\n"));
    Assert.isTrue(this.lineTerminator.isLineTerminator("\u2028"));
    Assert.isTrue(this.lineTerminator.isLineTerminator("\u2029"));
    Assert.isFalse(this.lineTerminator.isLineTerminator(String.empty));
    Assert.isFalse(this.lineTerminator.isLineTerminator("\r\n"));
    Assert.isFalse(this.lineTerminator.isLineTerminator("\u0085"));
    Assert.isFalse(this.lineTerminator.isLineTerminator("text"));
  }

  @TestMethod
  public isALineTerminator(): void {
    Assert.isInstanceOf(this.lineTerminator, LineTerminator);
  }

  @TestMethod
  @TestData("", 0, 0)
  @TestData("a\r\nb", 1, 2)
  @TestData("a\r\nb", 2, 1)
  @TestData("a\r", 1, 1)
  @TestData("a\r\r\n", 1, 1)
  @TestData("a\r\r\n", 2, 2)
  @TestData("a\n\r", 1, 1)
  @TestData("a\n\r", 2, 1)
  @TestData("a\u2028\u2029", 1, 1)
  @TestData("a\u2028\u2029", 2, 1)
  @TestData("😀\n", 2, 1)
  public recognizesBreaksAtTheRequestedUtf16Position(value: string, index: number, expectedLength: number): void {
    Assert.areEqual(expectedLength, this.lineTerminator.getLength(value, index));
  }

  @TestMethod
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  public rejectsNonFiniteIndexesWithTheirContext(index: number): void {
    const failure = Assert.throws(() => this.lineTerminator.getLength("text", index), ArgumentOutOfRangeException);

    Assert.areEqual("index", failure.parameterName);
    Assert.isTrue(Object.is(index, failure.actualValue));
  }
}
