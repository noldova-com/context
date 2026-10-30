/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Diagnostic,
  DiagnosticAuthority,
  DiagnosticCategory,
  DiagnosticCode,
  DiagnosticLocation,
  DiagnosticMessage,
  DiagnosticTag
} from "@noldova/context.diagnostics";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ResourcesTests {
  @TestMethod
  public usesTheCanonicalCodeValueMessage(): void {
    const failure = Assert.throws(() => new DiagnosticCode(DiagnosticAuthority.typeScript, 0), ArgumentOutOfRangeException);

    Assert.areEqual("The code value must be a positive safe integer. (Parameter 'value')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalStartMessage(): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", -1, 0), ArgumentOutOfRangeException);

    Assert.areEqual("The start must be a non-negative safe integer. (Parameter 'start')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalLengthMessage(): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", 0, -1), ArgumentOutOfRangeException);

    Assert.areEqual("The length must be a non-negative safe integer. (Parameter 'length')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalSourceLengthMessage(): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", 0, 1, -1), ArgumentOutOfRangeException);

    Assert.areEqual("The source length must be a non-negative safe integer. (Parameter 'sourceLength')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalSpanBeyondSourceMessage(): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", 8, 5, 10), ArgumentOutOfRangeException);

    Assert.areEqual("The span ending at 13 exceeds the source length 10. (Parameter 'length')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalDuplicateTagMessage(): void {
    const code = new DiagnosticCode(DiagnosticAuthority.typeScript, 2304);
    const message = new DiagnosticMessage(code, DiagnosticCategory.Error, "A message.", []);
    const failure = Assert.throws(() => new Diagnostic(message, undefined, [], [DiagnosticTag.Deprecated, DiagnosticTag.Deprecated]), ArgumentException);

    Assert.areEqual("The tags must not contain a duplicate. (Parameter 'tags')", failure.message);
  }

  @TestMethod
  public usesTheCanonicalUnsafeSpanEndMessage(): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", Number.MAX_SAFE_INTEGER, 1), ArgumentOutOfRangeException);

    Assert.areEqual("The span end must be a non-negative safe integer. (Parameter 'length')", failure.message);
  }
}
