/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptCloseBraceNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptImportSpecifierNode,
  TypeScriptNamedImportsNode,
  TypeScriptOpenBraceNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNamedImportsNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const node = new TypeScriptNamedImportsNode([], [], new SourceSpan(0, 0));

    Assert.isUndefined(node.openBraceNode);
    Assert.isUndefined(node.closeBraceNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const openBraceNode = new TypeScriptOpenBraceNode(new SourceSpan(1, 1));
    const memberNodes = [
      new TypeScriptImportSpecifierNode(new SourceSpan(3, 5), new TypeScriptIdentifierNode("first", new SourceSpan(3, 5))),
      new TypeScriptImportSpecifierNode(new SourceSpan(10, 6), new TypeScriptIdentifierNode("second", new SourceSpan(10, 6)))];
    const commaNodes = [new TypeScriptCommaNode(new SourceSpan(8, 1))];
    const closeBraceNode = new TypeScriptCloseBraceNode(new SourceSpan(17, 1));
    const span = new SourceSpan(1, 17);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNamedImportsNode(memberNodes, commaNodes, span, openBraceNode, closeBraceNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(memberNodes, node.children);
    Assert.areEqual(commaNodes, node.commaNodes);
    Assert.areEqual(openBraceNode, node.openBraceNode);
    Assert.areEqual(closeBraceNode, node.closeBraceNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
