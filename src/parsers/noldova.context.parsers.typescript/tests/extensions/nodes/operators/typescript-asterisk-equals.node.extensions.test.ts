/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptAsteriskEqualsNode, TypeScriptAsteriskNode, TypeScriptEqualsNode, TypeScriptTypeOperatorNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAsteriskEqualsNodeExtensionsTests {
  @TestMethod
  public isAnAssignmentOperator(): void {
    const node = new TypeScriptAsteriskEqualsNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptAssignmentOperator());
  }

  @TestMethod
  public readsTheWildcardTypeBeforeTheEqualsWhereATypeStarts(): void {
    const parser = TypeScriptParserFixture.create(" /*leading*/ *= 1");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeOperatorNode);
    Assert.isInstanceOf(node.operatorNode, TypeScriptAsteriskNode);
    Assert.isUndefined(node.typeNode);
    Assert.areEqual(13, node.span.startOffset);
    Assert.areEqual(1, node.span.length);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.isInstanceOf(parser.currentNode, TypeScriptEqualsNode);
    Assert.areEqual(14, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
