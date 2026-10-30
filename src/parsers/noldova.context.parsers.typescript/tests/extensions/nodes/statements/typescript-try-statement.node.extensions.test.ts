/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptTryStatementNodeExtensionsTests {
  @TestData("declare namespace N { try {} finally {} }", "TS1036@22:3")
  @TestData("declare namespace N { try {} catch {} }", "TS1036@22:3")
  @TestMethod
  public reportsAnAmbientStatementAtItsTryKeyword(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, result.diagnostics.map(t => `${t.code.displayText}@${t.location?.start}:${t.location?.length}`).join("|"));
  }

  @TestData("catch (e) {}")
  @TestData("finally {}")
  @TestData("catch {} finally {}")
  @TestMethod
  public spansTheWholeStatementWithoutATryKeyword(content: string): void {
    const span = TypeScriptParserFixture.create(content).parseStatement().getTypeScriptFirstTokenSpan();

    Assert.areEqual(content, content.slice(span.startOffset, span.endOffset));
  }
}
