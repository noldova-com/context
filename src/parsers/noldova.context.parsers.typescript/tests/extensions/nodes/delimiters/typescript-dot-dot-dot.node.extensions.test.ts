/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptCommaNode, TypeScriptDotDotDotNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptDotDotDotNodeExtensionsTests {
  @TestMethod
  public permitsWrittenModifiersBeforeARestParameter(): void {
    const node = new TypeScriptDotDotDotNode(new SourceSpan(0, 3));
    Assert.isTrue(node.canFollowTypeScriptModifier());
  }

  @TestMethod
  public spreadsTheAssignmentExpressionThatFollows(): void {
    const parser = TypeScriptParserFixture.create("...items, rest");
    const dotDotDotNode = parser.currentNode;
    Assert.isInstanceOf(dotDotDotNode, TypeScriptDotDotDotNode);

    const elementNode = dotDotDotNode.parseTypeScriptSpreadElement(parser);

    Assert.areEqual(dotDotDotNode, elementNode.dotDotDotNode);
    Assert.areEqual("items", parser.context.source.getText(elementNode.expressionNode.span));
    Assert.areEqual("...items", parser.context.source.getText(elementNode.span));
    Assert.isInstanceOf(parser.currentNode, TypeScriptCommaNode);
  }
}
