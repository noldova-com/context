/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticLocation } from "@noldova/context.diagnostics";
import { ArgumentException, ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class DiagnosticLocationTests {
  @TestMethod
  public carriesTheSpan(): void {
    const location = new DiagnosticLocation("sample.ts", 12, 5);

    Assert.areEqual("sample.ts", location.sourceIdentity);
    Assert.areEqual(12, location.start);
    Assert.areEqual(5, location.length);
  }

  @TestMethod
  public acceptsAZeroLengthSpan(): void {
    const location = new DiagnosticLocation("sample.ts", 12, 0);

    Assert.areEqual(0, location.length);
  }

  @TestMethod
  public acceptsAnEndOfFileSpan(): void {
    const location = new DiagnosticLocation("sample.ts", 10, 0, 10);

    Assert.areEqual(10, location.start);
    Assert.areEqual(0, location.length);
  }

  @TestMethod
  public acceptsASpanEndingAtTheSourceLength(): void {
    const location = new DiagnosticLocation("sample.ts", 5, 5, 10);

    Assert.areEqual(5, location.start);
    Assert.areEqual(5, location.length);
  }

  @TestMethod
  public keepsTheSourceIdentityVerbatim(): void {
    const sourceIdentity = "noldova.context.sample/src/Sample.ts";

    Assert.areEqual(sourceIdentity, new DiagnosticLocation(sourceIdentity, 0, 1).sourceIdentity);
  }

  @TestMethod
  public acceptsAnAnonymousSource(): void {
    Assert.isUndefined(new DiagnosticLocation(undefined, 0, 1).sourceIdentity);
  }

  @TestMethod
  public acceptsAnEmptyAnonymousSource(): void {
    const location = new DiagnosticLocation(undefined, 0, 0, 0);

    Assert.isUndefined(location.sourceIdentity);
    Assert.areEqual(0, location.start);
    Assert.areEqual(0, location.length);
  }

  @TestMethod
  public acceptsSpansMeasuredInUtf16CodeUnits(): void {
    const text = "A\u{1F600}B";
    const location = new DiagnosticLocation(undefined, 1, 2, text.length);

    Assert.areEqual("\u{1F600}", text.slice(location.start, location.start + location.length));
  }

  @TestMethod
  @TestData(0, Number.MAX_SAFE_INTEGER)
  @TestData(Number.MAX_SAFE_INTEGER, 0)
  @TestData(Number.MAX_SAFE_INTEGER - 1, 1)
  public acceptsSpansEndingAtTheMaximumSourceLength(start: number, length: number): void {
    const location = new DiagnosticLocation(undefined, start, length, Number.MAX_SAFE_INTEGER);

    Assert.areEqual(start, location.start);
    Assert.areEqual(length, location.length);
  }

  @TestMethod
  @TestData("")
  @TestData(" ")
  @TestData("\t\r\n")
  public rejectsBlankSourceIdentities(sourceIdentity: string): void {
    const failure = Assert.throws(() => new DiagnosticLocation(sourceIdentity, 0, 1), ArgumentException);

    Assert.areEqual("sourceIdentity", failure.parameterName);
  }

  @TestMethod
  @TestData(-1)
  @TestData(1.5)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  public rejectsInvalidStarts(start: number): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", start, 0), ArgumentOutOfRangeException);

    Assert.areEqual("start", failure.parameterName);
    Assert.areEqual<unknown>(start, failure.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(1.5)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  public rejectsInvalidLengths(length: number): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", 0, length), ArgumentOutOfRangeException);

    Assert.areEqual("length", failure.parameterName);
    Assert.areEqual<unknown>(length, failure.actualValue);
  }

  @TestMethod
  @TestData(-1)
  @TestData(10.5)
  @TestData(Number.MAX_SAFE_INTEGER + 1)
  @TestData(Number.NaN)
  @TestData(Number.POSITIVE_INFINITY)
  @TestData(Number.NEGATIVE_INFINITY)
  public rejectsInvalidSourceLengths(sourceLength: number): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", 0, 0, sourceLength), ArgumentOutOfRangeException);

    Assert.areEqual("sourceLength", failure.parameterName);
    Assert.areEqual<unknown>(sourceLength, failure.actualValue);
  }

  @TestMethod
  public rejectsAnUnsafeSpanEnd(): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", Number.MAX_SAFE_INTEGER, 1), ArgumentOutOfRangeException);

    Assert.areEqual("length", failure.parameterName);
    Assert.areEqual<unknown>(1, failure.actualValue);
  }

  @TestMethod
  @TestData(8, 5, 10)
  @TestData(11, 0, 10)
  @TestData(0, 1, 0)
  public rejectsSpansBeyondTheSource(start: number, length: number, sourceLength: number): void {
    const failure = Assert.throws(() => new DiagnosticLocation("sample.ts", start, length, sourceLength), ArgumentOutOfRangeException);

    Assert.areEqual("length", failure.parameterName);
    Assert.areEqual<unknown>(length, failure.actualValue);
  }
}
