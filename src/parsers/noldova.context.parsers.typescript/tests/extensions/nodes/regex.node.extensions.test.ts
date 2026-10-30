/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class RegexNodeExtensionsTests {
  @TestMethod
  public identifiesARegexLiteralWithoutChangingItsOwningPackage(): void {
    const parser = TypeScriptParserFixture.create("/pattern/g");
    const node = parser.parseExpression();
    Assert.isInstanceOf(node, RegexNode);
    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
