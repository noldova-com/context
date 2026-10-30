/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptImplementsKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptImplementsKeywordNodeExtensionsTests {
  @TestMethod
  public isABindingIdentifier(): void {
    const node = new TypeScriptImplementsKeywordNode(new SourceSpan(0, 0));

    Assert.isTrue(node.isTypeScriptBindingIdentifier());
  }

  @TestData("implements,", true)
  @TestData("implements{}", false)
  @TestMethod
  public distinguishesAHeritageNameFromTheNextClause(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.canStartTypeScriptHeritageExpression(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
  }
}
