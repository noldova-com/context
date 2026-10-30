/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticAuthority, DiagnosticCode } from "@noldova/context.diagnostics";
import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticCodeTests {
  @TestMethod
  public carriesTheAuthorityAndValue(): void {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);

    Assert.areEqual(DiagnosticAuthority.typeScript, code.authority);
    Assert.areEqual(2304, code.value);
  }

  @TestMethod
  public displaysATypeScriptCode(): void {
    Assert.areEqual("TS2304", new DiagnosticCode(DiagnosticAuthority.typeScript, 2304).displayText);
  }

  @TestMethod
  public displaysAContextCode(): void {
    Assert.areEqual("CTX1001", new DiagnosticCode(DiagnosticAuthority.context, 1001).displayText);
  }

  @TestMethod
  @TestData(1, "TS1")
  @TestData(Number.MAX_SAFE_INTEGER, "TS9007199254740991")
  public acceptsPositiveSafeIntegerBoundaries(value: number, expectedDisplayText: string): void {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, value);

    Assert.areEqual(value, code.value);
    Assert.areEqual(expectedDisplayText, code.displayText);
  }

  @TestMethod
  @TestData(0)
  @TestData(-1)
  @TestData(2304.5)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  public rejectsInvalidValues(value: number): void {
    const failure = Assert.throws(() => new DiagnosticCode(DiagnosticAuthority.typeScript, value), ArgumentOutOfRangeException);

    Assert.areEqual("value", failure.parameterName);
    Assert.areEqual<unknown>(value, failure.actualValue);
  }
}
