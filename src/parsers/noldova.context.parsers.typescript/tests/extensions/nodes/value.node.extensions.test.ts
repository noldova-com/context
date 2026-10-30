/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import "@noldova/context.parsers.typescript/extensions/nodes/node.extensions.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { ForeignLiteralNode } from "../../fixtures/foreign-literal.node.js";

@TestClass
export class ValueNodeExtensionsTests {
  @TestData("")
  @TestData("name")
  @TestData("\\u0061")
  @TestMethod
  public preservesDiagnosticTextWithoutAnApplicableSpecialization(value: string): void {
    const node = new ForeignLiteralNode(value, new SourceSpan(0, value.length));
    Assert.areEqual(value, node.getTypeScriptDiagnosticText());
  }

  @TestData("", false)
  @TestData("plain text", false)
  @TestData("\\n", false)
  @TestData("\v\f\u0085", false)
  @TestData("\n", true)
  @TestData("\r", true)
  @TestData("\r\n", true)
  @TestData("before\u2028after", true)
  @TestData("before\u2029after", true)
  @TestMethod
  public recognizesOnlyTypeScriptLineTerminators(value: string, expected: boolean): void {
    const node = new ForeignLiteralNode(value, new SourceSpan(0, value.length));

    Assert.areEqual(expected, node.containsTypeScriptLineBreak());
  }
}
