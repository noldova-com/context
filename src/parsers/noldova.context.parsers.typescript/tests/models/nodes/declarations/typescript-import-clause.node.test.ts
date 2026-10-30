/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptAsteriskNode,
  TypeScriptCommaNode,
  TypeScriptIdentifierNode,
  TypeScriptImportClauseNode,
  TypeScriptMissingIdentifierNode,
  TypeScriptNamespaceImportNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptImportClauseNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const node = new TypeScriptImportClauseNode(new SourceSpan(0, 0));

    Assert.isUndefined(node.defaultNameNode);
    Assert.isUndefined(node.commaNode);
    Assert.isUndefined(node.namedBindingsNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const defaultNameNode = new TypeScriptIdentifierNode("main", new SourceSpan(1, 4));
    const commaNode = new TypeScriptCommaNode(new SourceSpan(5, 1));
    const namedBindingsNode = new TypeScriptNamespaceImportNode(new TypeScriptAsteriskNode(new SourceSpan(7, 1)), new SourceSpan(7, 1),
      new TypeScriptMissingIdentifierNode(new SourceSpan(8, 0)));
    const span = new SourceSpan(1, 7);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptImportClauseNode(span, defaultNameNode, commaNode, namedBindingsNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(defaultNameNode, node.defaultNameNode);
    Assert.areEqual(commaNode, node.commaNode);
    Assert.areEqual(namedBindingsNode, node.namedBindingsNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
