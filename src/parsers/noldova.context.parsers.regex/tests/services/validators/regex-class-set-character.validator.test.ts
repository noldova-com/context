/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceSpan } from "@noldova/context.parsers";
import { RegexParser } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexClassSetCharacterValidatorTests {
  @TestMethod
  @TestData("[!!!]", 1)
  @TestData("[\\q{!!!}]", 4)
  public reportsOneDiagnosticForTheReservedPair(pattern: string, startOffset: number): void {
    const result = RegexParserFixture.parse(pattern, "v");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1029", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(startOffset, result.diagnostics[0]?.location?.start);
    Assert.areEqual(2, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("[!]", 0)
  @TestData("[!\\!]", 0)
  @TestData("[\\!!]", 0)
  @TestData("[\\q{!|!}]", 0)
  @TestData("[!!][!!]", 2)
  @TestData("[\\q{!!}][\\q{!!}]", 2)
  public respectsEscapeAndExpressionBoundaries(pattern: string, diagnosticCount: number): void {
    Assert.areEqual(diagnosticCount, RegexParserFixture.parse(pattern, "v").diagnostics.length);
  }

  @TestMethod
  @TestData("[!")
  @TestData("[\\q{!")
  public doesNotReadBeyondTheSuppliedPattern(pattern: string): void {
    const source = new Source(pattern + "!v");
    const result = new RegexParser(
      source,
      new SourceSpan(0, pattern.length),
      new SourceSpan(pattern.length + 1, 1),
      new SourceSpan(0, source.length)).parse();

    Assert.isTrue(result.diagnostics.length > 0);
    Assert.isFalse(result.diagnostics.some(t => t.code.displayText === "CTX1029"));
  }
}
